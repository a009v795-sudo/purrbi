// Firestore persistence. All writes here use the Admin SDK (server only); clients cannot write
// products, evidence, label facts, usage counters or assessment fields (see firestore.rules).
import { createHash } from 'node:crypto';
import { FieldValue, Timestamp, type DocumentSnapshot, type Firestore, type WriteBatch } from 'firebase-admin/firestore';
import type { ValidatedLabel } from '../ai/labelExtract';
import { auditLegacyExplanation } from '../knowledge/claims';
import { EXPLAIN_VERSION, type CitedExplanation } from '../knowledge/explain';
import type { PetProfile, ProductFacts, RecallCheck, ScopeResult, SourceRef } from '../domain/types';
import type { Limits } from './config';
import { SCOPE_VERSION } from '../domain/scope';

export class QuotaError extends Error {
  constructor(readonly kind: 'scans' | 'photos' | 'research' | 'refreshes' | 'ai_budget') {
    super(`quota exceeded: ${kind}`);
    this.name = 'QuotaError';
  }
}

export const dayKey = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '');

export async function consumeQuota(db: Firestore, uid: string, kind: 'scans' | 'photos' | 'research' | 'refreshes', limits: Limits, now: Date): Promise<void> {
  const max = { scans: limits.scansPerUserPerDay, photos: limits.photosPerUserPerDay, research: limits.researchPerUserPerDay, refreshes: limits.refreshesPerUserPerDay ?? limits.scansPerUserPerDay }[kind];
  const ref = db.doc(`usage/${uid}_${dayKey(now)}`);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const used = (snap.get(kind) as number | undefined) ?? 0;
    if (used >= max) throw new QuotaError(kind);
    tx.set(ref, { uid, day: dayKey(now), [kind]: used + 1, updatedAt: Timestamp.fromDate(now) }, { merge: true });
  });
}

/** Global daily budget for paid AI calls, independent of the per-user limits. */
/** Whether today's global AI budget has a call left (read only, nothing used). */
export async function aiBudgetLeft(db: Firestore, limits: Limits, now: Date): Promise<boolean> {
  const used = ((await db.doc(`system/aiUsage_${dayKey(now)}`).get()).get('calls') as number | undefined) ?? 0;
  return used < limits.aiCallsPerDayGlobal;
}

export async function consumeAiBudget(db: Firestore, limits: Limits, now: Date): Promise<void> {
  const ref = db.doc(`system/aiUsage_${dayKey(now)}`);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const used = (snap.get('calls') as number | undefined) ?? 0;
    if (used >= limits.aiCallsPerDayGlobal) throw new QuotaError('ai_budget');
    tx.set(ref, { calls: used + 1, updatedAt: Timestamp.fromDate(now) }, { merge: true });
  });
}

/** Until when a provider's used-up daily allowance is not asked again (shared by all instances), or null. */
export async function providerPausedUntil(db: Firestore, provider: string, now: Date): Promise<Date | null> {
  const until = toDate((await db.doc(`system/pause_${provider}`).get()).get('until'));
  return until && until > now ? until : null;
}

export async function pauseProvider(db: Firestore, provider: string, until: Date, now: Date): Promise<void> {
  await db.doc(`system/pause_${provider}`).set({ until: Timestamp.fromDate(until), setAt: Timestamp.fromDate(now) });
}

// ---- products ----------------------------------------------------------------

/** When optional AI enrichment was last attempted for a product, and what it found (public facts only). */
export interface Enrichment {
  databaseImagesAt?: Date | null;
  /** The barcode database's answer for this barcode (its title and brand, or none), reused for 30 days instead of asking again. */
  hint?: { title: string; brand: string; category: string; source: string } | null;
  hintAt?: Date | null;
  databaseImages?: { read: string[]; skipped: string[]; failed?: string[]; version?: string };
  researchAt?: Date | null;
  /** outcome "fetch_failed": no candidate page could be reached for a reason that may pass (timeout, rate limit, server error); "hint_failed": nothing, or nothing saying who the product is for, found while the barcode database (the search words) was unavailable; "time_limited": the same, when the scan's time limit cut the search short. All three are retried a bounded number of times, never a 30-day negative */
  research?: {
    filled: string[];
    discarded: string[];
    source: string;
    version?: string;
    /** The research model the run used (OPENAI_RESEARCH_MODEL): another model is a new method. */
    model?: string;
    outcome?: 'done' | 'fetch_failed' | 'hint_failed' | 'time_limited';
    species?: string;
    /** Consecutive unfinished runs (fetch_failed, hint_failed, time_limited): retried after 12 h, 2 days, 7 days, then not until a new method or 30 days. */
    attempts?: number;
  };
}

export interface StoredProduct {
  facts: ProductFacts;
  origin: string;
  scope: string; // the saved classification (supported, out_of_scope, unknown)
  species: string;
  category: string;
  scopeReason: string;
  scopeVersion: string | null; // the classification rules that produced it
  factsVersion: number;
  factsHash: string;
  lastRetrievedAt: Date | null;
  recall: RecallCheck | null;
  recallCheckedAt: Date | null;
  /** When the record was last written: a rewrite is made only if nobody else has written it since. */
  updateTime?: Timestamp;
}

/** Server-only bookkeeping per barcode (never readable by clients): label image links and enrichment attempts. */
export interface ProductMeta {
  labelImageUrls: { front?: string; ingredients?: string; nutrition?: string };
  enrichment: Enrichment;
}

/** Hash of the facts' content, ignoring retrieval times, to detect real changes. */
export function factsHash(facts: ProductFacts): string {
  const strip = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(strip);
    if (v && typeof v === 'object') {
      return Object.fromEntries(
        Object.entries(v as Record<string, unknown>)
          .filter(([k]) => k !== 'retrievedAt')
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, x]) => [k, strip(x)]),
      );
    }
    return v;
  };
  return createHash('sha256').update(JSON.stringify(strip(facts))).digest('hex').slice(0, 32);
}

const toDate = (v: unknown): Date | null => (v instanceof Timestamp ? v.toDate() : null);

export async function readProduct(db: Firestore, gtin: string): Promise<StoredProduct | null> {
  const snap = await db.doc(`products/${gtin}`).get();
  if (!snap.exists) return null;
  const d = snap.data()!;
  if (!d.facts) return null;
  return {
    facts: d.facts as ProductFacts,
    origin: (d.origin as string) ?? 'unknown',
    scope: (d.scope as string) ?? '',
    species: (d.species as string) ?? '',
    category: (d.category as string) ?? '',
    scopeReason: (d.scopeReason as string) ?? '',
    scopeVersion: (d.scopeVersion as string) ?? null,
    factsVersion: (d.factsVersion as number) ?? 1,
    factsHash: (d.factsHash as string) ?? '',
    lastRetrievedAt: toDate(d.lastRetrievedAt),
    recall: (d.recall as RecallCheck) ?? null,
    recallCheckedAt: toDate(d.recallCheckedAt),
    ...(snap.updateTime ? { updateTime: snap.updateTime } : {}),
  };
}

export async function readProductMeta(db: Firestore, gtin: string): Promise<ProductMeta> {
  const snap = await db.doc(`productMeta/${gtin}`).get();
  const d = snap.data() ?? {};
  return {
    labelImageUrls: (d.labelImageUrls as ProductMeta['labelImageUrls']) ?? {},
    enrichment: {
      databaseImagesAt: toDate(d.enrichment?.databaseImagesAt),
      databaseImages: d.enrichment?.databaseImages ?? undefined,
      researchAt: toDate(d.enrichment?.researchAt),
      research: d.enrichment?.research ?? undefined,
      ...(d.enrichment?.hintAt ? { hint: d.enrichment?.hint ?? null, hintAt: toDate(d.enrichment.hintAt) } : {}),
    },
  };
}

export async function writeProductMeta(db: Firestore, gtin: string, meta: ProductMeta, now: Date): Promise<void> {
  // Merged, so two jobs on the same product (two owners, or a scan and a photo) keep each other's fields.
  await db.doc(`productMeta/${gtin}`).set({ gtin, labelImageUrls: meta.labelImageUrls, enrichment: enrichmentDoc(meta.enrichment), updatedAt: Timestamp.fromDate(now) }, { merge: true });
}

/**
 * Writes public-source facts only (database / verified web). Returns the facts version, or null when the
 * record was written by another job since it was read (that newer record is kept; this run's facts are not
 * written over it).
 */
export async function writeProduct(
  db: Firestore,
  args: {
    facts: ProductFacts;
    scope: ScopeResult;
    origin: string;
    previous: StoredProduct | null;
    now: Date;
    traceId: string;
    retrievedAt?: Date; // when the database record was last fetched (unchanged when nothing was fetched)
  },
): Promise<number | null> {
  const publicFacts: ProductFacts = stripPrivate(args.facts);
  const hash = factsHash(publicFacts);
  const version = !args.previous ? 1 : args.previous.factsHash === hash ? args.previous.factsVersion : args.previous.factsVersion + 1;
  const ref = db.doc(`products/${publicFacts.gtin}`);
  const batch = db.batch();
  const record = {
    gtin: publicFacts.gtin,
    barcode: publicFacts.barcode,
    productName: publicFacts.productName?.value ?? '',
    brand: publicFacts.brand?.value ?? '',
    imageUrl: publicFacts.imageUrl?.value ?? '',
    species: args.scope.species,
    category: args.scope.category,
    scope: args.scope.status,
    scopeReason: args.scope.reason,
    scopeSignals: args.scope.signals.slice(0, 20),
    scopeVersion: SCOPE_VERSION,
    origin: args.origin,
    verification: publicFacts.sources.some((s) => s.sourceType === 'manufacturer' || s.sourceType === 'retailer_or_web')
      ? 'database_and_verified_web'
      : publicFacts.sources.some((s) => s.sourceType === 'database_image')
        ? 'database_and_label_image'
        : 'database_record',
    facts: publicFacts,
    factsHash: hash,
    factsVersion: version,
    lastRetrievedAt: Timestamp.fromDate(args.retrievedAt ?? args.now),
    updatedAt: Timestamp.fromDate(args.now),
  };
  // Each listed field is replaced whole (a plain merge would keep facts that were dropped, e.g. an
  // implausible analysis); fields written elsewhere (recall) are kept. Only over the record this run read.
  if (args.previous?.updateTime) batch.update(ref, record, { lastUpdateTime: args.previous.updateTime });
  else batch.set(ref, record, { mergeFields: Object.keys(record) });
  // When the classification changes (new evidence or new rules), the earlier one is kept: an audit
  // trail in a server-only subcollection, never a silent rewrite.
  const prev = args.previous;
  if (prev && (prev.scope !== args.scope.status || prev.species !== args.scope.species || prev.category !== args.scope.category)) {
    batch.set(ref.collection('classifications').doc(), {
      at: Timestamp.fromDate(args.now),
      traceId: args.traceId,
      from: { scope: prev.scope, species: prev.species, category: prev.category, reason: prev.scopeReason, version: prev.scopeVersion ?? 'scope-1' },
      to: { scope: args.scope.status, species: args.scope.species, category: args.scope.category, reason: args.scope.reason, version: SCOPE_VERSION },
      signals: args.scope.signals.slice(0, 20),
    });
  }
  for (const s of publicFacts.sources) {
    batch.set(ref.collection('evidence').doc(s.sourceId.replace(/[^A-Za-z0-9_.-]/g, '_').slice(0, 200)), {
      ...s,
      fieldsSupported: supportedFields(publicFacts, s),
      traceId: args.traceId,
      retrievedAt: Timestamp.fromDate(new Date(s.retrievedAt)),
    });
  }
  try {
    await batch.commit();
  } catch (err) {
    // FAILED_PRECONDITION (9) or ALREADY_EXISTS (6): another job wrote the record meanwhile.
    const code = (err as { code?: number | string }).code;
    if (code === 9 || code === 6 || code === 'failed-precondition' || code === 'already-exists') return null;
    throw err;
  }
  return version;
}

function enrichmentDoc(e: Enrichment): Record<string, unknown> {
  const ts = (d: Date | null | undefined) => (d ? Timestamp.fromDate(d) : null);
  return { databaseImagesAt: ts(e.databaseImagesAt), databaseImages: e.databaseImages ?? null, researchAt: ts(e.researchAt), research: e.research ?? null, ...(e.hintAt ? { hint: e.hint ?? null, hintAt: ts(e.hintAt) } : {}) };
}

export async function writeRecall(db: Firestore, gtin: string, recall: RecallCheck, now: Date): Promise<void> {
  await db.doc(`products/${gtin}`).set({ recall, recallCheckedAt: Timestamp.fromDate(now) }, { merge: true });
}

function supportedFields(facts: ProductFacts, s: SourceRef): string[] {
  const keys: (keyof ProductFacts)[] = ['productName', 'brand', 'imageUrl', 'ingredientsText', 'guaranteedAnalysis', 'calories', 'adequacy', 'feedingDirections', 'activeIngredients'];
  return keys.filter((k) => (facts[k] as { source?: SourceRef } | undefined)?.source?.sourceId === s.sourceId) as string[];
}

/** Removes facts that came from the owner's own label photos (they stay private to that owner). */
export function stripPrivate(facts: ProductFacts): ProductFacts {
  const out: ProductFacts = { ...facts, sources: facts.sources.filter((s) => s.sourceType !== 'user_label'), classificationSignals: facts.classificationSignals.filter((c) => !c.source.startsWith('label:')) };
  for (const k of ['productName', 'brand', 'imageUrl', 'ingredientsText', 'ingredients', 'guaranteedAnalysis', 'calories', 'adequacy', 'feedingDirections', 'activeIngredients'] as const) {
    const f = out[k] as { source: SourceRef } | undefined;
    if (f?.source.sourceType === 'user_label') delete out[k];
  }
  return out;
}

// ---- cited explanations (shared, server-only) -------------------------------------

const VERIFIED_DAYS = 180;
const UNVERIFIED_DAYS = 30;
const TRANSIENT_DAYS = 0.25; // a cited page that could not be fetched (timeout, 429, 5xx) is tried again after 6 hours
const NOT_RETURNED_DAYS = 1; // a term the model left out is asked for again the next day
// A cited file Purrbi cannot check (a PDF) is asked for again after 1 day, when a web page may be cited; if the
// model keeps citing a file, after 7 and then 30 days.
const FILE_REASON = /^cited page is a .*, which Purrbi cannot check/;
const fileDays = (attempts: number) => (attempts >= 3 ? 30 : attempts === 2 ? 7 : 1);

/**
 * Cached explanations that are still current; expired ones are treated as missing. One made under earlier
 * rules is treated as missing too, so it is made again claim by claim; if it was shown, it is withdrawn
 * first, with an audit record of what was shown and why it would not pass now.
 */
export async function readExplanations(db: Firestore, keys: string[], now: Date): Promise<Map<string, CitedExplanation>> {
  const out = new Map<string, CitedExplanation>();
  const unique = [...new Set(keys)].slice(0, 100);
  if (!unique.length) return out;
  const snaps = await db.getAll(...unique.map((k) => db.doc(`knowledge/${k}`)));
  const withdrawn: DocumentSnapshot[] = [];
  for (const snap of snaps) {
    if (!snap.exists) continue;
    const e = snap.data() as CitedExplanation;
    if (e.version !== EXPLAIN_VERSION) {
      if (e.status === 'verified' && !snap.get('withdrawnAt')) withdrawn.push(snap);
      continue;
    }
    const age = (now.getTime() - new Date(e.checkedAt).getTime()) / 86400000;
    const reason = e.reason ?? '';
    const lifetime =
      e.status === 'verified' ? VERIFIED_DAYS
      : /^cited page could not be fetched|^support check unavailable/.test(reason) ? TRANSIENT_DAYS
      : FILE_REASON.test(reason) ? fileDays(e.attempts ?? 1)
      : e.status === 'not_found' ? NOT_RETURNED_DAYS
      : UNVERIFIED_DAYS;
    if (age <= lifetime) out.set(snap.id, e);
  }
  if (withdrawn.length) await withdrawExplanations(db, withdrawn, now).catch(() => undefined); // best-effort: never fails the scan
  return out;
}

/**
 * Audit records (knowledgeAudit/{key}__{oldVersion}, server-only) for shown explanations withdrawn under
 * new rules: what was shown, its source and quote, and why it would not pass now. Each is created once,
 * and the old cache entry is marked withdrawn only while it is still the one read (a newer explanation
 * written meanwhile is left alone). One batch; when a record already exists (another scan withdrew it at
 * the same moment), each is tried again on its own.
 */
/** The audit record of an explanation that was shown, as it was shown (claims included when it had them). */
function auditRecord(db: Firestore, snap: DocumentSnapshot, at: Timestamp) {
  const e = snap.data() as CitedExplanation;
  const oldVersion = String(e.version ?? 'unversioned');
  const record = {
      key: snap.id,
      term: e.term ?? '',
      kind: e.kind ?? '',
      species: e.species ?? '',
      oldVersion,
      oldStatus: e.status ?? '',
      oldSummary: e.summary ?? '',
      oldSourceTitle: e.sourceTitle ?? '',
      oldSourceUrl: e.sourceUrl ?? '',
      oldQuote: e.quote ?? '',
      oldModel: e.model ?? '',
      oldCheckedAt: e.checkedAt ?? '',
      ...(Array.isArray(e.claims) && e.claims.length ? { oldClaims: e.claims } : {}),
      ...(Array.isArray(e.rejected) && e.rejected.length ? { oldRejected: e.rejected } : {}),
      withdrawnAt: at,
      supersededBy: EXPLAIN_VERSION,
      reasons: auditLegacyExplanation(e),
    };
  return { record, oldVersion, ref: db.doc(`knowledgeAudit/${`${snap.id}__${oldVersion}`.replace(/[^A-Za-z0-9_.-]/g, '_').slice(0, 700)}`) };
}

async function withdrawExplanations(db: Firestore, snaps: DocumentSnapshot[], now: Date): Promise<void> {
  const at = Timestamp.fromDate(now);
  const writes = snaps.map((snap) => ({ snap, ...auditRecord(db, snap, at) }));
  // The withdrawn entry's version is set aside too ("withdrawn explain-1.2.0"), so the sweep below moves on past it.
  const add = (batch: WriteBatch, w: (typeof writes)[number]) =>
    batch.create(w.ref, w.record).update(w.snap.ref, { withdrawnAt: at, supersededBy: EXPLAIN_VERSION, version: `withdrawn ${w.oldVersion}` }, { lastUpdateTime: w.snap.updateTime! });
  try {
    const batch = db.batch();
    for (const w of writes) add(batch, w);
    await batch.commit();
  } catch {
    // One at a time, each tried twice (a record that already exists was written by another scan at the same moment).
    await Promise.all(writes.map(async (w) => { for (let i = 0; i < 2; i++) { try { await add(db.batch(), w).commit(); return; } catch { /* next try */ } } }));
  }
}

/**
 * Explanations made under earlier rules that no scan asks for any more (a term now explained by Purrbi's own
 * role table, a term past a scan's limit) are found by a small sweep: each that was shown is withdrawn with
 * its audit record; one that was never shown is removed. Best-effort, a few entries per call.
 */
export async function sweepLegacyExplanations(db: Firestore, now: Date, limit = 10): Promise<number> {
  const snaps = (await db.collection('knowledge').where('version', '<', EXPLAIN_VERSION).orderBy('version').limit(limit).get()).docs.filter((d) => !String(d.get('version') ?? '').startsWith('withdrawn '));
  const shown = snaps.filter((d) => d.get('status') === 'verified' && !d.get('withdrawnAt'));
  if (shown.length) await withdrawExplanations(db, shown, now);
  const never = snaps.filter((d) => !shown.includes(d));
  if (never.length) {
    const batch = db.batch();
    for (const d of never) batch.delete(d.ref, { lastUpdateTime: d.updateTime });
    await batch.commit().catch(() => undefined);
  }
  return snaps.length;
}

export async function writeExplanations(db: Firestore, items: CitedExplanation[], now = new Date()): Promise<void> {
  if (!items.length) return;
  const before = await db.getAll(...items.map((e) => db.doc(`knowledge/${e.key}`)));
  // Counted under the current rules only: a new method starts the file backoff again.
  const attempts = new Map(before.filter((d) => d.exists && d.get('version') === EXPLAIN_VERSION && FILE_REASON.test(String(d.get('reason') ?? ''))).map((d) => [d.id, Number(d.get('attempts') ?? 1)]));
  // An explanation shown under earlier rules that is overwritten now gets its audit record in the same write.
  const at = Timestamp.fromDate(now);
  const legacy = before.filter((d) => d.exists && d.get('version') !== EXPLAIN_VERSION && d.get('status') === 'verified' && !d.get('withdrawnAt')).map((d) => auditRecord(db, d, at));
  const existing = legacy.length ? new Set((await db.getAll(...legacy.map((l) => l.ref))).filter((d) => d.exists).map((d) => d.id)) : new Set<string>();
  const write = async (audit: boolean) => {
    const batch = db.batch();
    if (audit) for (const l of legacy) if (!existing.has(l.ref.id)) batch.create(l.ref, l.record);
    for (const e of items) batch.set(db.doc(`knowledge/${e.key}`), FILE_REASON.test(e.reason ?? '') ? { ...e, attempts: (attempts.get(e.key) ?? 0) + 1 } : e);
    await batch.commit();
  };
  try {
    await write(true);
  } catch (err) {
    // ALREADY_EXISTS: another scan wrote the audit record meanwhile.
    const code = (err as { code?: number | string }).code;
    if (code === 6 || code === 'already-exists') await write(false);
    else throw err;
  }
}

// ---- verdicts (per owner, cached by their input) ---------------------------------

/** A verdict already written for exactly this input (same product facts, assessment, pet and rules). */
export async function readVerdict(db: Firestore, uid: string, key: string): Promise<{ text: string; model: string; source: string; createdAt: Date | null } | null> {
  const snap = await db.doc(`users/${uid}/verdicts/${key}`).get();
  return snap.exists ? { text: String(snap.get('text') ?? ''), model: String(snap.get('model') ?? ''), source: String(snap.get('source') ?? 'ai'), createdAt: (snap.get('createdAt') as Timestamp | undefined)?.toDate() ?? null } : null;
}

export async function saveVerdict(db: Firestore, uid: string, key: string, v: { text: string; model: string; source: string }, now: Date): Promise<void> {
  await db.doc(`users/${uid}/verdicts/${key}`).set({ ...v, createdAt: Timestamp.fromDate(now) });
}

// ---- private label evidence ---------------------------------------------------

export interface StoredLabelExtraction {
  photoId: string;
  scanId: string;
  purpose: string;
  processedAt: Date;
  label: ValidatedLabel;
  /** submitted → extracted → corroborated → verified, or disputed (pipeline/corroborate.ts); older readings have none. */
  stage?: string;
  agreements?: string[];
  conflicts?: string[];
}

export async function readLabelExtractions(db: Firestore, uid: string, gtin: string): Promise<StoredLabelExtraction[]> {
  const snap = await db.doc(`users/${uid}/labelFacts/${gtin}`).get();
  if (!snap.exists) return [];
  const items = (snap.get('extractions') as Record<string, { scanId: string; purpose: string; processedAt: Timestamp; label: ValidatedLabel; stage?: string; agreements?: string[]; conflicts?: string[] }> | undefined) ?? {};
  return Object.entries(items)
    .map(([photoId, x]) => ({ photoId, scanId: x.scanId, purpose: x.purpose, processedAt: x.processedAt.toDate(), label: x.label, stage: x.stage ?? 'extracted', agreements: x.agreements ?? [], conflicts: x.conflicts ?? [] }))
    .sort((a, b) => b.processedAt.getTime() - a.processedAt.getTime());
}

export async function saveLabelExtraction(db: Firestore, uid: string, gtin: string, e: StoredLabelExtraction): Promise<void> {
  await db.doc(`users/${uid}/labelFacts/${gtin}`).set(
    {
      gtin,
      updatedAt: Timestamp.fromDate(e.processedAt),
      extractions: { [e.photoId]: { scanId: e.scanId, purpose: e.purpose, processedAt: Timestamp.fromDate(e.processedAt), label: e.label, stage: e.stage ?? 'extracted', agreements: e.agreements ?? [], conflicts: e.conflicts ?? [] } },
    },
    { merge: true },
  );
}

/** A saved reading staged again (its rows changed under the current rules): the reading and the photo say so. */
export async function restageLabelPhoto(db: Firestore, uid: string, gtin: string, photoId: string, c: { stage: string; agreements: string[]; conflicts: string[]; note: string }): Promise<void> {
  const batch = db.batch();
  batch.set(db.doc(`users/${uid}/labelFacts/${gtin}`), { extractions: { [photoId]: { stage: c.stage, agreements: c.agreements, conflicts: c.conflicts } } }, { merge: true });
  batch.set(db.doc(`users/${uid}/photos/${photoId}`), { stage: c.stage, stageNote: c.note, statusMessage: c.stage === 'disputed' ? 'Label read, but it doesn’t match this barcode’s record' : 'Label read' }, { merge: true });
  await batch.commit();
}

/** Audit entry for label facts an owner's verified photo added to the shared record (no account id: a one-way hash). */
export async function recordContribution(db: Firestore, gtin: string, c: { photoKey: string; contributor: string; fields: string[]; agreements: string[]; traceId: string; now: Date }): Promise<void> {
  await db.doc(`products/${gtin}/contributions/${c.photoKey}`).set({ contributor: c.contributor, fields: c.fields, agreements: c.agreements, traceId: c.traceId, at: Timestamp.fromDate(c.now) });
}

// ---- pets -------------------------------------------------------------------------

const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
const strList = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && !!x.trim()).map((x) => x.trim().toLowerCase()) : []);
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const iso = (v: unknown) => (v instanceof Timestamp ? v.toDate().toISOString() : typeof v === 'string' ? v : null);

export function petFromDoc(petId: string, d: Record<string, unknown>): PetProfile | null {
  const species = d.species === 'cat' || d.species === 'dog' ? d.species : null;
  if (!species) return null;
  return {
    petId,
    name: str(d.name) ?? 'your pet',
    species,
    breed: str(d.breed),
    breedType: (str(d.breedType) as PetProfile['breedType']) ?? null,
    birthDate: iso(d.birthDate),
    approxAgeMonths: num(d.approxAgeMonths),
    ageCapturedAt: iso(d.ageCapturedAt),
    weightKg: num(d.weightKg),
    sex: (str(d.sex) as PetProfile['sex']) ?? null,
    neutered: (str(d.neutered) as PetProfile['neutered']) ?? null,
    reproductiveStatus: (str(d.reproductiveStatus) as PetProfile['reproductiveStatus']) ?? null,
    expectedAdultSize: (str(d.expectedAdultSize) as PetProfile['expectedAdultSize']) ?? null,
    allergiesStatus: (str(d.allergiesStatus) as PetProfile['allergiesStatus']) ?? 'not_provided',
    allergies: strList(d.allergies),
    sensitivitiesStatus: (str(d.sensitivitiesStatus) as PetProfile['sensitivitiesStatus']) ?? 'not_provided',
    sensitivities: strList(d.sensitivities),
    vetDietStatus: (str(d.vetDietStatus) as PetProfile['vetDietStatus']) ?? 'not_provided',
    vetDietNotes: str(d.vetDietNotes),
    conditionsStatus: (str(d.conditionsStatus) as PetProfile['conditionsStatus']) ?? 'not_provided',
    conditions: strList(d.conditions),
    medicationsStatus: (str(d.medicationsStatus) as PetProfile['medicationsStatus']) ?? 'not_provided',
    avoidIngredients: strList(d.avoidIngredients),
    goals: strList(d.goals),
    profileVersion: num(d.profileVersion) ?? 1,
  };
}

export async function readPet(db: Firestore, uid: string, petId: string | null | undefined): Promise<PetProfile | null> {
  if (!petId || typeof petId !== 'string' || petId.includes('/')) return null;
  const snap = await db.doc(`users/${uid}/pets/${petId}`).get();
  if (!snap.exists) return null;
  return petFromDoc(petId, snap.data() ?? {});
}

export { FieldValue, Timestamp };
