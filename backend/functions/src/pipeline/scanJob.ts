// The scan job. The app creates users/{uid}/scans/{scanId} with {barcode, petId?, status: "queued"};
// this module claims it, gathers evidence, assesses, and writes everything back to the same document.
// Evidence order: saved product facts → pet database → the database's own label images (read by AI)
// → manufacturer/web research → the owner's label photos. Each later step runs only when the earlier
// ones left something important missing, and paid enrichment is attempted at most once per product
// per freshness window. Each failure keeps its own error code: a timeout, a quota stop or a failed
// save is never reported as "product not found", and partial findings are kept. Every outbound call
// is recorded (sanitized) under the job's trace id.
import { createHash, randomUUID } from 'node:crypto';
import type { Firestore } from 'firebase-admin/firestore';
import { extractLabel as extractLabelImpl, LABEL_EXTRACTION_VERSION, type ValidatedLabel } from '../ai/labelExtract';
import { checkVerdict, ruleVerdict, verdictInput, verdictKey, withPetName, writeVerdict as verdictImpl } from '../ai/verdict';
import { parseAdequacyStatement } from '../domain/adequacy';
import { normalizeBarcode, type NormalizedBarcode } from '../domain/barcode';
import { buildHighlights } from '../domain/highlights';
import { personalize } from '../domain/personalize';
import { classifyScope, SCOPE_VERSION, type DatabaseOrigin } from '../domain/scope';
import { assessGeneral } from '../domain/score';
import { buildSummary, overallState } from '../domain/summary';
import type { GeneralAssessment, PetProfile, ProductFacts, RecallCheck, ScopeResult, SourceRef } from '../domain/types';
import { explainTerms as explainImpl, explanationKey, needsExplanation, type CitedExplanation, type ExplainRequest } from '../knowledge/explain';
import { readDatabaseLabelImages as databaseImagesImpl } from '../sources/labelImages';
import { checkRecalls as checkRecallsImpl } from '../sources/openfda';
import { databaseGuarantees, DB_FOR_TYPE, implausibleAnalysis, lookupOpenFacts as lookupOpenFactsImpl, openFactsToFacts, type OpenFactsDb, type OpenFactsLookup } from '../sources/openFacts';
import { RESEARCH_VERSION, researchProduct as researchImpl, type ResearchOutcome } from '../sources/research';
import { currentCalls, errorDetail, runWithCallLog } from '../util/diagnostics';
import { SourceError } from '../util/http';
import { rematchAnalysis } from '../domain/nutrition';
import { SCAN_STATUS, STUCK_AFTER_MS, WORKING_STATUSES, type ErrorCode, type RuntimeConfig } from './config';
import { corroborateLabel } from './corroborate';
import { dropStaleImageReads, enrichmentFacts, fillMissing, labelToFacts, missingInfo, type PhotoRequest } from './facts';
import { explanationFields, highlightFields, jobFields, resultFields, type JobInfo } from './serialize';
import {
  consumeAiBudget,
  consumeQuota,
  FieldValue,
  QuotaError,
  readExplanations,
  readLabelExtractions,
  readPet,
  readProduct,
  readProductMeta,
  readVerdict,
  recordContribution,
  saveLabelExtraction,
  saveVerdict,
  stripPrivate,
  Timestamp,
  writeExplanations,
  writeProduct,
  writeProductMeta,
  writeRecall,
  type ProductMeta,
  type StoredProduct,
} from './store';

export interface Logger {
  info(msg: string, data?: Record<string, unknown>): void;
  warn(msg: string, data?: Record<string, unknown>): void;
  error(msg: string, data?: Record<string, unknown>): void;
}

export interface Sources {
  lookupOpenFacts: (db: OpenFactsDb, barcode: NormalizedBarcode, userAgent: string, now: Date) => Promise<OpenFactsLookup>;
  checkRecalls: typeof checkRecallsImpl;
  research: (o: Parameters<typeof researchImpl>[0]) => Promise<ResearchOutcome>;
  extractLabel: (o: Parameters<typeof extractLabelImpl>[0]) => Promise<ValidatedLabel>;
  databaseImages: (o: Parameters<typeof databaseImagesImpl>[0]) => ReturnType<typeof databaseImagesImpl>;
  explain: (o: Parameters<typeof explainImpl>[0]) => Promise<CitedExplanation[]>;
  verdict: (o: Parameters<typeof verdictImpl>[0]) => Promise<{ text: string; model: string }>;
}

export const realSources: Sources = {
  lookupOpenFacts: lookupOpenFactsImpl,
  checkRecalls: checkRecallsImpl,
  research: researchImpl,
  extractLabel: extractLabelImpl,
  databaseImages: databaseImagesImpl,
  explain: explainImpl,
  verdict: verdictImpl,
};

export interface Deps {
  db: Firestore;
  config: RuntimeConfig;
  sources: Sources;
  now: () => Date;
  log: Logger;
  readImage?: (url: string, uid: string) => Promise<{ base64: string; mimeType: string; bytes: number }>;
}

class JobError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly retryable: boolean,
  ) {
    super(message);
  }
}

const scanPath = (uid: string, scanId: string) => `users/${uid}/scans/${scanId}`;
const ageDays = (d: Date | null | undefined, now: Date) => (d ? (now.getTime() - d.getTime()) / 86400000 : Infinity);

/** A scan still marked as working that has not been updated for STUCK_AFTER_MS: its job stopped without a result. */
function isStuck(d: Record<string, unknown>, now: Date): boolean {
  const at = (d.updatedAt ?? d.createdAt) as Timestamp | undefined;
  return WORKING_STATUSES.includes(String(d.status)) && !!at && typeof at.toMillis === 'function' && now.getTime() - at.toMillis() > STUCK_AFTER_MS;
}

function newJob(kind: JobInfo['kind'], traceId: string, now: Date): JobInfo {
  return { kind, traceId, runId: randomUUID().slice(0, 12), startedAt: now, productCache: 'none', recallCache: 'skipped', explanationsCached: 0, explanationsNew: 0, evidenceNotes: [], diagnosticNotes: [] };
}

async function setStatus(deps: Deps, uid: string, scanId: string, status: string, message: string, progress: number) {
  await deps.db.doc(scanPath(uid, scanId)).update({ status, statusMessage: message, progress, updatedAt: Timestamp.fromDate(deps.now()) });
}

/** Which source failed and how, so a provider outage is never mistaken for "not found" or "unknown". */
function sourceFailureMessage(err: SourceError): string {
  const how = err.kind === 'rate_limited' ? 'is limiting requests right now' : err.kind === 'timeout' ? 'didn’t answer in time' : err.kind === 'parse' ? 'sent a response Purrbi couldn’t read' : err.status ? `answered with an error (HTTP ${err.status})` : 'couldn’t be reached';
  return `${err.source} ${how}, so the lookup didn’t finish. Your scan is saved; try again in a moment.`;
}

function errorMessage(code: ErrorCode, detail?: string): string {
  switch (code) {
    case 'invalid_barcode':
      return detail ?? 'That doesn’t look like a valid product barcode.';
    case 'quota_exceeded':
      return 'You’ve reached today’s scan limit. It resets at midnight UTC.';
    case 'source_unavailable':
      return 'The product database couldn’t be reached, so the lookup didn’t finish. Your scan is saved; try again in a moment.';
    case 'analysis_failed':
      return 'The assessment couldn’t be completed. Try again; if it keeps happening, share the reference code with support.';
    case 'save_failed':
      return 'The result couldn’t be saved. Try again.';
    case 'photo_failed':
      return 'The photo couldn’t be processed. Try again or retake it.';
    default:
      return 'Something went wrong. Try again.';
  }
}

// ---------------------------------------------------------------------------------------------

/** Entry point for a newly created (kind "scan") or owner-retried (kind "retry") scan request. */
export function processScan(deps: Deps, uid: string, scanId: string, kind: 'scan' | 'retry' = 'scan'): Promise<void> {
  return runWithCallLog(() => claimAndRun(deps, uid, scanId, kind));
}

async function claimAndRun(deps: Deps, uid: string, scanId: string, kind: 'scan' | 'retry'): Promise<void> {
  const ref = deps.db.doc(scanPath(uid, scanId));
  const traceId = randomUUID().slice(0, 12);
  const claimed = await deps.db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return null;
    const d = snap.data()!;
    // An owner retry of a failed scan, or of one whose job stopped without a result (a queued scan
    // that was never claimed is simply claimed now).
    const retry = d.retryRequested === true && ((d.status === SCAN_STATUS.failed && d.errorRetryable === true) || (d.status !== SCAN_STATUS.queued && isStuck(d, deps.now())));
    if (d.status !== SCAN_STATUS.queued && !retry) return { duplicate: true as const };
    tx.update(ref, {
      status: SCAN_STATUS.identifying,
      statusMessage: 'Looking up the barcode',
      progress: 10,
      traceId,
      claimCount: FieldValue.increment(1),
      startedAt: Timestamp.fromDate(deps.now()),
      updatedAt: Timestamp.fromDate(deps.now()),
      retryRequested: false,
      errorCode: '',
      errorMessage: '',
      errorRetryable: false,
    });
    return { duplicate: false as const, data: d as Record<string, unknown>, isRetry: retry };
  });
  if (!claimed) return;
  if (claimed.duplicate) {
    // A second delivery of the same event: nothing is processed or charged twice.
    if (kind === 'scan') await ref.update({ duplicateDeliveries: FieldValue.increment(1) }).catch(() => undefined);
    deps.log.info('duplicate delivery ignored', { uid, scanId, kind });
    return;
  }
  const job = newJob(claimed.isRetry ? 'retry' : 'scan', traceId, deps.now());
  const log = (msg: string, data: Record<string, unknown> = {}) => deps.log.info(msg, { traceId, uid, scanId, ...data });

  try {
    const barcode = normalizeBarcode(claimed.data.barcode);
    if (!barcode.ok) {
      const detail = barcode.reason === 'check_digit' ? 'The barcode’s check digit doesn’t match. Check the number and try again.' : 'That doesn’t look like a product barcode (8, 12, 13 or 14 digits).';
      throw new JobError('invalid_barcode', detail, false);
    }
    if (!claimed.isRetry) {
      try {
        await consumeQuota(deps.db, uid, 'scans', deps.config.limits, deps.now());
      } catch (e) {
        if (e instanceof QuotaError) throw new JobError('quota_exceeded', errorMessage('quota_exceeded'), false);
        throw e;
      }
    }
    await ref.update({ gtin: barcode.gtin14, barcodeKind: barcode.kind });
    log('scan claimed', { gtin: barcode.gtin14, retry: claimed.isRetry });
    if (!claimed.isRetry && isRetryTestBarcode(deps.config, barcode.gtin14)) {
      throw new JobError('source_unavailable', 'Simulated source outage for the retry test (development switch RETRY_TEST_BARCODES). Tap Try again.', true);
    }
    await runAssessment(deps, job, { uid, scanId, barcode, petId: (claimed.data.petId as string) ?? null, allowFetch: true, allowExplain: true, skipPhotos: claimed.data.skipPhotos === true });
  } catch (err) {
    await failScan(deps, uid, scanId, job, err);
  }
}

function isRetryTestBarcode(config: RuntimeConfig, gtin14: string): boolean {
  return (config.retryTestBarcodes ?? []).some((code) => {
    const b = normalizeBarcode(code);
    return b.ok && b.gtin14 === gtin14;
  });
}

async function failScan(deps: Deps, uid: string, scanId: string, job: JobInfo, err: unknown) {
  const e = err instanceof JobError ? err : err instanceof SourceError ? new JobError('source_unavailable', sourceFailureMessage(err), true) : new JobError('analysis_failed', errorMessage('analysis_failed'), true);
  const calls = currentCalls();
  deps.log.error('scan failed', { traceId: job.traceId, uid, scanId, code: e.code, error: (err as Error)?.message, calls });
  try {
    await deps.db.doc(scanPath(uid, scanId)).update({
      status: SCAN_STATUS.failed,
      statusMessage: e.message,
      errorCode: e.code,
      errorMessage: e.message,
      errorRetryable: e.retryable,
      progress: 100,
      updatedAt: Timestamp.fromDate(deps.now()),
      ...jobFields(job, calls, deps.now()),
    });
  } catch (writeErr) {
    deps.log.error('could not record scan failure', { traceId: job.traceId, uid, scanId, error: (writeErr as Error).message });
  }
}

interface AssessOptions {
  uid: string;
  scanId: string;
  barcode: NormalizedBarcode;
  petId: string | null;
  allowFetch: boolean; // false for personal refreshes and photo re-assessments: reuse stored public evidence
  allowExplain: boolean; // false for personal refreshes: explanations come from the cache only
  skipPhotos: boolean;
}

interface PublicEvidence {
  facts: ProductFacts;
  origin: DatabaseOrigin;
  fetchedPublic: boolean;
  notes: string[];
  openFacts: Extract<OpenFactsLookup, { found: true }> | null;
}

/** Saved facts when fresh (or when fetching is not allowed), else the pet database (+ sister databases for scope). */
async function publicEvidence(deps: Deps, job: JobInfo, o: AssessOptions, stored: StoredProduct | null, now: Date): Promise<PublicEvidence> {
  const { config } = deps;
  const gtin = o.barcode.gtin14;
  const fresh = stored?.lastRetrievedAt && now.getTime() - stored.lastRetrievedAt.getTime() < config.productFreshDays * 86400000;
  // A record classified by older rules is read again once (its product type and tag kinds were not saved).
  const current = stored?.scopeVersion === SCOPE_VERSION;
  // A record not yet confirmed as a cat or dog product is checked again after a day: the databases are edited.
  const recheck = !!stored && stored.scope !== 'supported' && ageDays(stored.lastRetrievedAt, now) > 1;
  if (stored && ((fresh && current && !recheck) || !o.allowFetch)) {
    job.productCache = 'hit';
    job.evidenceNotes.push(`Product details reused from Purrbi’s saved record (retrieved ${stored.lastRetrievedAt?.toISOString().slice(0, 10) ?? 'earlier'}); no database call was needed.`);
    return { facts: stored.facts, origin: (stored.origin as DatabaseOrigin) ?? 'opff', fetchedPublic: false, notes: [], openFacts: null };
  }
  if (!o.allowFetch) {
    // A photo or a pet change never calls the databases: with no saved record it starts from the label alone.
    job.productCache = 'none';
    return { facts: { gtin, barcode: o.barcode.digits, classificationSignals: [], sources: [] }, origin: 'label', fetchedPublic: false, notes: [], openFacts: null };
  }
  job.productCache = 'miss';
  try {
    const pet = await deps.sources.lookupOpenFacts('opff', o.barcode, config.userAgent, now);
    if (pet.found) {
      job.evidenceNotes.push('Found in Open Pet Food Facts.');
      const unusable = implausibleAnalysis(databaseGuarantees(pet.product.nutriments));
      if (unusable) job.evidenceNotes.push(unusable);
      // Keep earlier verified enrichment for fields the database record still lacks.
      const facts = fillMissing(openFactsToFacts(pet, gtin, o.barcode.digits), enrichmentFacts(stored?.facts)).facts;
      return { facts, origin: 'opff', fetchedPublic: true, notes: [], openFacts: pet };
    }
    // Not in the pet database. The databases share one backend, so its answer says whether another one
    // files the barcode (as human food, a cosmetic or another product). That record is read for its
    // facts; where it is filed is provenance only, never proof of what the product is.
    const sister = pet.otherType === null ? null : await sisterRecord(deps, o.barcode, now, typeof pet.otherType === 'string' ? DB_FOR_TYPE[pet.otherType] : undefined);
    job.evidenceNotes.push(
      sister
        ? `Not in Open Pet Food Facts; its record is in ${sister.source.sourceName}${sister.product.product_type ? ` (filed there as “${sister.product.product_type}”)` : ''}. Where a record is filed doesn’t decide what the product is.`
        : 'Not found in Open Pet Food Facts or its sister databases.',
    );
    if (!sister && stored?.facts.sources.length) {
      // The record is gone from the databases: the saved facts stay (never downgraded because a record is absent).
      job.evidenceNotes.push('Its database record is no longer published; Purrbi’s saved record is used.');
      return { facts: stored.facts, origin: (stored.origin as DatabaseOrigin) ?? 'label', fetchedPublic: false, notes: [], openFacts: null };
    }
    // Earlier verified enrichment (label images, matched web pages and label photos) is kept in every branch.
    const base: ProductFacts = sister ? openFactsToFacts(sister, gtin, o.barcode.digits) : { gtin, barcode: o.barcode.digits, classificationSignals: [], sources: [] };
    return {
      facts: fillMissing(base, enrichmentFacts(stored?.facts)).facts,
      origin: sister ? (sister.db as DatabaseOrigin) : 'label',
      fetchedPublic: true,
      notes: [],
      openFacts: sister,
    };
  } catch (err) {
    if (!stored) throw err;
    job.productCache = 'stale_used';
    job.evidenceNotes.push('The product database was unreachable, so Purrbi’s saved record was used.');
    deps.log.info('database unavailable, using stale cache', { traceId: job.traceId, error: (err as Error).message });
    return { facts: stored.facts, origin: (stored.origin as DatabaseOrigin) ?? 'opff', fetchedPublic: false, notes: ['The product database was unreachable, so saved product information was used.'], openFacts: null };
  }
}

const isCategorySignal = (s: ProductFacts['classificationSignals'][number]) => s.kind === 'category' || (!s.kind && /^[a-z]{2}:[a-z0-9-]+$/.test(s.text));

/** Classifies from the product's own evidence: category tags apart, every other statement as text. */
const scopeOf = (facts: ProductFacts, origin: DatabaseOrigin): ScopeResult =>
  classifyScope({
    origin,
    recordType: facts.recordType,
    categoriesTags: facts.classificationSignals.filter(isCategorySignal).map((s) => s.text),
    texts: [facts.productName?.value ?? '', ...facts.classificationSignals.filter((s) => !isCategorySignal(s)).map((s) => s.text)],
    adequacy: facts.adequacy?.value,
    ingredientsText: facts.ingredientsText?.value,
  });

/** Gathers evidence, assesses and saves. Explanations not yet cached are added in a second, separate update. */
export async function runAssessment(deps: Deps, job: JobInfo, o: AssessOptions): Promise<void> {
  const now = deps.now();
  const { db, config } = deps;
  const log = (msg: string, data: Record<string, unknown> = {}) => deps.log.info(msg, { traceId: job.traceId, uid: o.uid, scanId: o.scanId, ...data });
  const gtin = o.barcode.gtin14;

  // 1. Public product facts.
  const stored = await readProduct(db, gtin);
  const evidence = await publicEvidence(deps, job, o, stored, now);
  let { facts, origin, fetchedPublic } = evidence;
  const notes = evidence.notes;
  // Label images read by an older label reader are dropped (and read again below when allowed).
  const before = facts.sources.length + facts.classificationSignals.length;
  const stale = dropStaleImageReads(facts, LABEL_EXTRACTION_VERSION, RESEARCH_VERSION);
  facts = stale.facts;
  let rewriteProduct = stale.dropped.length > 0 || facts.sources.length + facts.classificationSignals.length < before;
  if (rewriteProduct) job.diagnosticNotes.push(`Dropped ${stale.dropped.join(', ') || 'statements'} taken from database label images or web pages under older rules; they are read again.`);
  // A saved database analysis that cannot be per 100 g (saved before this check existed) is dropped too.
  const unusable = facts.guaranteedAnalysis?.source.sourceType === 'database' ? implausibleAnalysis(facts.guaranteedAnalysis.value) : null;
  if (unusable) {
    const { guaranteedAnalysis: _implausible, ...rest } = facts;
    facts = rest;
    rewriteProduct = true;
    job.evidenceNotes.push(unusable);
  }
  // Owners' label photos. When this run read its private inputs (photos, then the pet): a result from
  // inputs read later is never overwritten by it.
  const inputsAt = deps.now();
  const extractions = (await readLabelExtractions(db, o.uid, gtin)).filter((e) => e.label.status === 'processed');
  const current = extractions.filter((e) => e.label.version === LABEL_EXTRACTION_VERSION);
  // A reading verified against this barcode fills gaps in the shared record (backend only, no account id).
  const promoted: { photoKey: string; fields: string[]; agreements: string[] }[] = [];
  if (config.promoteLabelPhotos !== false) {
    for (const e of current.filter((x) => x.stage === 'verified')) {
      const photoKey = createHash('sha256').update(`${o.uid}/${e.photoId}`).digest('hex').slice(0, 16);
      const src: SourceRef = { sourceId: `photo:${photoKey}`, sourceType: 'verified_label', sourceName: 'A label photo matched to this barcode', retrievedAt: e.processedAt.toISOString(), matchConfidence: e.label.barcodeMatch ? 'exact_barcode' : 'brand_and_product', readerVersion: e.label.version };
      const merged = fillMissing(facts, labelToFacts(e.label, src));
      facts = merged.facts;
      if (merged.filled.length) {
        fetchedPublic = true;
        promoted.push({ photoKey, fields: merged.filled, agreements: e.agreements ?? [] });
      }
    }
  }
  if (promoted.length) job.evidenceNotes.push(`Added ${[...new Set(promoted.flatMap((p) => p.fields))].map(fieldLabel).join(', ')} to Purrbi’s shared record for this barcode from a label photo matched to it (${promoted[0].agreements[0] ?? 'barcode on the photo'}).`);
  let scope = scopeOf(facts, origin);

  // 2. Optional enrichment for missing public facts (pet products only; at most once per freshness window).
  const meta: ProductMeta = await readProductMeta(db, gtin);
  let metaChanged = false;
  if (evidence.openFacts) {
    const p = evidence.openFacts.product;
    const urls = { ...(p.image_front_url ? { front: p.image_front_url } : {}), ...(p.image_ingredients_url ? { ingredients: p.image_ingredients_url } : {}), ...(p.image_nutrition_url ? { nutrition: p.image_nutrition_url } : {}) };
    if (JSON.stringify(urls) !== JSON.stringify(meta.labelImageUrls)) {
      meta.labelImageUrls = urls;
      metaChanged = true;
    }
  }
  // Enrichment runs for every product not affirmatively out of scope, wherever its record is filed.
  const aiOk = o.allowFetch && config.aiEnabled && scope.status !== 'out_of_scope';
  // Label images in the database answer missing panels and, while it is unresolved what the product is, the front.
  const panelNeeds = () => missingInfo(facts, scope, scope.category).map((r) => r.purpose).filter((p) => p === 'ingredients' || p === 'nutrition' || (p === 'front' && scope.status === 'unknown'));

  // 2a. Label images already published in the pet database, read by AI.
  // Due per panel: a panel never tried (e.g. the front, once it is unresolved what the product is) is read
  // even when other panels were read recently.
  // A technical failure (download error, AI error or budget) is tried again after 6 hours, not left for 30 days.
  const panelOf = (x: string) => x.split(/[,:]/)[0].trim();
  const lastImages = meta.enrichment.databaseImages?.version === LABEL_EXTRACTION_VERSION ? meta.enrichment.databaseImages : undefined;
  const tried = new Set([...(lastImages?.read ?? []), ...(lastImages?.skipped ?? []).map(panelOf)]);
  const failedRecently = new Set(ageDays(meta.enrichment.databaseImagesAt, now) * 24 < 6 ? (lastImages?.failed ?? []).map(panelOf) : []);
  const imagesDue = ageDays(meta.enrichment.databaseImagesAt, now) > config.productFreshDays || !lastImages || panelNeeds().some((p) => !tried.has(p) && !failedRecently.has(p));
  if (aiOk && config.databaseImagesEnabled && panelNeeds().length && Object.keys(meta.labelImageUrls).length && imagesDue) {
    await setStatus(deps, o.uid, o.scanId, SCAN_STATUS.researching, 'Reading the label images in the product database', 30);
    const code = facts.sources.find((s) => s.sourceType === 'database')?.sourceId.split(':')[1] ?? o.barcode.digits;
    const product = { image_front_url: meta.labelImageUrls.front, image_ingredients_url: meta.labelImageUrls.ingredients, image_nutrition_url: meta.labelImageUrls.nutrition };
    const r = await deps.sources.databaseImages({
      product,
      code,
      needs: panelNeeds(),
      gtin14: gtin,
      userAgent: config.userAgent,
      now,
      extract: (x) => deps.sources.extractLabel({ apiKey: config.openaiApiKey(), model: config.visionModel, ...x }),
      beforeAiCall: () => consumeAiBudget(db, config.limits, now),
    });
    for (const f of r.facts) {
      const merged = fillMissing(facts, f);
      facts = merged.facts;
      fetchedPublic = fetchedPublic || merged.filled.length > 0;
    }
    meta.enrichment.databaseImagesAt = now;
    // Definitive outcomes of earlier attempts are kept, so a panel already found unreadable is not read again.
    const keep = (prev: string[] | undefined, next: string[]) => [...new Set([...(prev ?? []).filter((x) => !next.some((y) => panelOf(y) === panelOf(x))), ...next])];
    meta.enrichment.databaseImages = { read: keep(lastImages?.read, r.read), skipped: keep(lastImages?.skipped, r.skipped), failed: r.failed ?? [], version: LABEL_EXTRACTION_VERSION };
    job.diagnosticNotes.push(...r.skipped.slice(0, 4).map((x) => `Database label image ${x}`), ...(r.failed ?? []).slice(0, 2).map((x) => `Database label image not read (tried again later): ${x}`));
    metaChanged = true;
    if (r.read.length) job.evidenceNotes.push(`Read the ${r.read.map((x) => (x === 'nutrition' ? 'nutrition panel' : x === 'front' ? 'front of the package' : 'ingredient list')).join(' and ')} from a label image in ${origin === 'off' ? 'Open Food Facts' : 'Open Pet Food Facts'} (AI, two readings agreed; not reviewed).`);
    log('database label images', { read: r.read, skipped: r.skipped, failed: r.failed ?? [] });
    scope = scopeOf(facts, origin);
  }

  // 2b. Bounded manufacturer/web research.
  // Research also runs when it is unresolved whether the product is for cats or dogs.
  const stillMissing = scope.status === 'unknown' || missingInfo(facts, scope, scope.category).some((r) => r.purpose !== 'front' || !facts.productName);
  const hasWeb = facts.sources.some((s) => s.sourceType === 'manufacturer' || s.sourceType === 'retailer_or_web');
  const researchDue =
    ageDays(meta.enrichment.researchAt, now) > config.productFreshDays ||
    meta.enrichment.research?.version !== RESEARCH_VERSION ||
    (meta.enrichment.research?.outcome === 'fetch_failed' && ageDays(meta.enrichment.researchAt, now) * 24 >= 12);
  if (aiOk && config.researchEnabled && stillMissing && !hasWeb && researchDue) {
    await setStatus(deps, o.uid, o.scanId, SCAN_STATUS.researching, 'Looking for the manufacturer’s label information', 40);
    try {
      await consumeQuota(db, o.uid, 'research', config.limits, now);
      await consumeAiBudget(db, config.limits, now);
      const r = await deps.sources.research({ apiKey: config.openaiApiKey(), model: config.researchModel, gtin14: gtin, barcode: o.barcode.expanded ?? o.barcode.digits, knownName: facts.productName?.value, knownBrand: facts.brand?.value, knownIngredients: facts.ingredients?.value, knownSpecies: scope.species, userAgent: config.userAgent, now });
      let filled: string[] = [];
      if (r.facts) {
        // "Active ingredients" are a supplement's; a food page's additive list is not used as such.
        const found = scope.category === 'supplement' ? r.facts : { ...r.facts, activeIngredients: undefined };
        const merged = fillMissing(facts, { ...found, sources: r.sources });
        facts = merged.facts;
        filled = merged.filled;
        fetchedPublic = fetchedPublic || filled.length > 0;
        if (origin === 'label' && filled.length) origin = 'web';
      }
      const src = r.sources[0];
      meta.enrichment.researchAt = now;
      const unreachable = !r.facts && r.fetchFailed === true;
      meta.enrichment.research = { filled, discarded: r.discarded, source: src ? `${src.sourceName} (${src.sourceType})` : '', version: RESEARCH_VERSION, outcome: unreachable ? 'fetch_failed' : 'done' };
      metaChanged = true;
      const pageKind = src?.sourceType === 'manufacturer' ? 'manufacturer page' : 'web page';
      if (r.facts && r.verified?.length) job.evidenceNotes.push(...r.verified);
      const confirmed = r.facts?.classificationSignals?.find((c) => c.kind === 'research' && /^intended for /.test(c.text))?.text;
      if (confirmed && src) job.evidenceNotes.push(`${src.sourceName} (${pageKind}) says it is ${confirmed}; checked on the page.`);
      job.evidenceNotes.push(
        filled.length && src
          ? `Filled ${filled.filter((k) => k !== 'ingredients').map(fieldLabel).join(', ')} from ${src.sourceName} (${pageKind}), each checked against the page.`
          : confirmed
            ? 'No further label details could be verified on that page.'
            : unreachable
              ? 'The manufacturer’s or retailers’ pages couldn’t be reached to check them, so nothing was added; Purrbi tries again later.'
              : 'Searched the manufacturer’s and retailers’ pages; nothing could be verified against a page, so nothing was added.',
      );
      job.diagnosticNotes.push(...r.discarded.slice(0, 4).map((d) => `Research (${r.model}): ${d}`));
      log('research', { filled, discarded: r.discarded });
    } catch (err) {
      // Research is optional: keep going with what we have.
      const reason = err instanceof QuotaError ? err.kind : errorDetail((err as Error).message);
      job.diagnosticNotes.push(`Research not run: ${reason}`);
      log('research skipped', { reason });
    }
    scope = scopeOf(facts, origin);
  }

  // 3. Save public facts (never the owner's private label data) and the enrichment bookkeeping.
  let factsVersion = stored?.factsVersion ?? 0;
  // A saved classification that no longer holds (new evidence or rules) is updated, with its audit entry.
  const reclassified = !!stored && (stored.scope !== scope.status || stored.species !== scope.species || stored.category !== scope.category || stored.scopeVersion !== SCOPE_VERSION);
  if (reclassified && stored?.scope === 'out_of_scope' && scope.status !== 'out_of_scope') job.evidenceNotes.push('An earlier classification of this product as “not a cat or dog product” was reviewed against the product’s own evidence and replaced; the earlier one is kept in its history.');
  if ((fetchedPublic || rewriteProduct || reclassified || !stored) && facts.sources.length) factsVersion = await writeProduct(db, { facts, scope, origin, previous: stored, now, traceId: job.traceId, retrievedAt: job.productCache === 'miss' ? now : (stored?.lastRetrievedAt ?? now) });
  if (metaChanged) await writeProductMeta(db, gtin, meta, now);
  const contributor = createHash('sha256').update(o.uid).digest('hex').slice(0, 16);
  for (const p of promoted) await recordContribution(db, gtin, { ...p, contributor, traceId: job.traceId, now });

  // 4. The owner's other label photos fill remaining gaps (private, unreviewed). A disputed reading
  // (another recipe or analysis than this barcode's record) is not used.
  let labelUsed = false;
  let labelTied = true; // every private reading used is tied to this barcode
  const olderReads = extractions.length - current.length;
  if (olderReads) job.diagnosticNotes.push(`${olderReads} label photo reading${olderReads === 1 ? ' was' : 's were'} made by an older label reader and not used; the photo is asked for again if still needed.`);
  for (const e of current) {
    if (e.stage === 'disputed') {
      job.evidenceNotes.push(`A label photo was not used: ${e.conflicts?.[0] ?? 'it conflicts with this barcode’s record'}. Check that it shows this package.`);
      continue;
    }
    if (e.stage === 'verified' && config.promoteLabelPhotos !== false) continue; // already in the shared facts above
    const src: SourceRef = { sourceId: `label:${e.photoId}`, sourceType: 'user_label', sourceName: 'Your label photo', retrievedAt: e.processedAt.toISOString(), matchConfidence: e.stage === 'verified' ? 'exact_barcode' : 'none' };
    const merged = fillMissing(facts, labelToFacts(e.label, src));
    if (merged.filled.length) {
      labelUsed = true;
      if (e.stage !== 'verified') labelTied = false;
    }
    facts = merged.facts;
  }
  if (labelUsed) job.evidenceNotes.push(labelTied ? 'Used details read from your label photo, matched to this barcode (AI, not reviewed).' : 'Used details read from your label photo (AI, not reviewed). The photo is not yet tied to this barcode, so this is a label-based assessment.');
  facts = rederive(facts);
  scope = scopeOf(facts, origin);

  // 5. Recall check (FDA), cached; skipped for out-of-scope products.
  let recall: RecallCheck | null = null;
  if (scope.status !== 'out_of_scope') {
    const cachedRecall = stored?.recall && stored.recall.status !== 'not_checked' && stored.recall.status !== 'unavailable' && stored.recallCheckedAt && now.getTime() - stored.recallCheckedAt.getTime() < config.recallFreshHours * 3600000 ? stored.recall : null;
    if (cachedRecall || !o.allowFetch) {
      recall = cachedRecall ?? stored?.recall ?? null;
      job.recallCache = recall ? 'hit' : 'skipped';
      if (recall && stored?.recallCheckedAt) job.evidenceNotes.push(`FDA recall check reused from ${Math.max(1, Math.round((now.getTime() - stored.recallCheckedAt.getTime()) / 3600000))} h ago.`);
    } else {
      job.recallCache = 'miss';
      await setStatus(deps, o.uid, o.scanId, SCAN_STATUS.checkingAlerts, 'Checking FDA recall records', 60);
      recall = await deps.sources.checkRecalls({ brand: facts.brand?.value, productName: facts.productName?.value, gtin14: gtin }, now);
      if (recall.status !== 'unavailable' && recall.status !== 'not_checked' && facts.sources.length) await writeRecall(db, gtin, recall, now);
    }
  }

  // 6. Assess. The general assessment is pet-independent; personal fit uses the selected pet only.
  await setStatus(deps, o.uid, o.scanId, SCAN_STATUS.assessing, 'Preparing the assessment', 85);
  const pet: PetProfile | null = await readPet(db, o.uid, o.petId);
  const general = assessGeneral(facts, scope);
  for (const n of notes) general.findings.push({ kind: 'info', text: n, evidence: 'Purrbi', rule: 'G-NOTE' });
  if (labelUsed) general.findings.push({ kind: 'info', text: 'Some details come from your own label photo, read by AI and not reviewed by Purrbi. Check them against the package.', evidence: 'Your label photo', rule: 'G-LABEL' });
  const personal = personalize(pet, facts, scope, general, recall, now);
  const summary = buildSummary(facts, scope, general, personal, recall);
  const state = overallState(general, recall, scope);
  const requests: PhotoRequest[] = o.skipPhotos ? [] : missingInfo(facts, scope, general.category);

  // The concise result: up to two positives and two cautions, and the verdict for the selected pet.
  // Supported products get a model-written verdict, checked against this assessment and cached; until it
  // arrives (or if it fails the check) the app shows one built from the same findings.
  const highlights = buildHighlights({ facts, scope, general, personal, recall });
  const vInput = verdictInput({
    productName: facts.productName?.value ?? '',
    brand: facts.brand?.value ?? '',
    species: scope.species,
    category: general.category,
    score: general.score,
    provisional: general.scoreProvisional,
    scoreLabel: general.scoreLabel,
    scoreBasis: general.scoreBasis,
    withheldReason: general.scoreWithheldReason ?? '',
    pet: pet ? { name: pet.name, species: pet.species, fit: personal.state, headline: personal.headline } : null,
    positives: highlights.positives,
    cautions: highlights.cautions,
    unresolved: personal.unresolved,
  });
  const named = (text: string) => (pet ? withPetName(text, pet.species, pet.name) : text);
  const fixed = fixedVerdict(scope, requests);
  const wantVerdict = !fixed && config.aiEnabled && config.verdictsEnabled;
  const vKey = verdictKey(vInput, config.verdictModel);
  const cachedVerdict = wantVerdict ? await readVerdict(db, o.uid, vKey).catch(() => null) : null;
  // A rule-based fallback is reused for a while only, so a model sentence is tried again later.
  const verdictHit = cachedVerdict && (cachedVerdict.source === 'ai' || ageDays(cachedVerdict.createdAt, now) <= config.productFreshDays) ? cachedVerdict : null;
  const verdictPending = wantVerdict && !verdictHit;
  let verdict = fixed
    ? { text: fixed, source: 'rules', status: 'ready' }
    : verdictHit
      ? { text: named(verdictHit.text), source: verdictHit.source, status: 'ready' }
      : { text: named(ruleVerdict(vInput)), source: 'rules', status: verdictPending ? 'pending' : 'ready' };

  // Explanations already in the cache are attached now; new ones follow in step 8.
  const explain = await cachedExplanations(deps, general, scope, now);
  job.explanationsCached = explain.cachedCount;
  const pending = o.allowExplain && config.aiEnabled && config.explanationsEnabled && explain.missing.length > 0;

  const status = scope.status === 'out_of_scope' ? SCAN_STATUS.outOfScope : requests.length ? SCAN_STATUS.needsPhotos : SCAN_STATUS.complete;
  const statusMessage =
    status === SCAN_STATUS.outOfScope ? 'Outside Purrbi’s scope' : status === SCAN_STATUS.needsPhotos ? `Add ${requests.length === 1 ? 'a photo' : 'photos'} to finish the assessment` : 'Assessment ready';

  // 7. Save. A failed save is reported as such (never as "unknown product"). A run whose inputs are older
  // than those of a result already saved (e.g. a photo and a pet change processed at the same time) does
  // not overwrite it.
  const ref = db.doc(scanPath(o.uid, o.scanId));
  let superseded = false;
  try {
    const fields = {
      ...resultFields({ facts, scope, general, personal, recall, summary, state, photoRequests: requests, factsVersion, labelEvidenceUsed: labelUsed, labelIdentityVerified: !labelUsed || labelTied }),
      ...explanationFields(general, pending ? 'pending' : explain.status),
      ...highlightFields(highlights, verdict),
      ...jobFields(job, currentCalls(), deps.now()),
      assessmentRunId: job.runId,
      assessmentInputsAt: Timestamp.fromDate(inputsAt),
      status,
      statusMessage,
      progress: 100,
      identitySource: origin,
      productFound: facts.sources.some((s) => ['database', 'database_image', 'manufacturer', 'retailer_or_web', 'verified_label'].includes(s.sourceType)),
      errorCode: '',
      errorMessage: '',
      errorRetryable: false,
      assessedAt: Timestamp.fromDate(now),
      completedAt: status === SCAN_STATUS.needsPhotos ? null : Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    };
    superseded = await db.runTransaction(async (tx) => {
      const newer = ((await tx.get(ref)).get('assessmentInputsAt') as Timestamp | undefined)?.toMillis() ?? 0;
      if (newer > inputsAt.getTime()) return true;
      tx.update(ref, fields);
      return false;
    });
  } catch (err) {
    deps.log.error('save failed', { traceId: job.traceId, error: (err as Error).message });
    throw new JobError('save_failed', errorMessage('save_failed'), true);
  }
  if (superseded) {
    log('result superseded', { runId: job.runId, kind: job.kind });
    return;
  }
  log('scan assessed', { status, state, score: general.score, personal: personal.state, labelUsed, factsVersion, productCache: job.productCache, recallCache: job.recallCache, calls: currentCalls().length, verdict: verdictPending ? 'pending' : verdict.source });

  // 8. New cited explanations and the written verdict (in parallel), then the second update. All of the
  // product's new terms are explained now (parallel calls of explanationsPerCall terms), so a later rescan
  // needs no AI call. Failure here never fails the scan; a failed call is tried again on the next scan.
  if (!pending && !verdictPending) return;
  const explainStep = async () => {
    let finalStatus = explain.status;
    try {
      const species = scope.species === 'unknown' ? 'cat_and_dog' : scope.species;
      const size = Math.max(1, config.limits.explanationsPerCall);
      const batches: ExplainRequest[][] = [];
      for (let i = 0; i < explain.missing.length; i += size) batches.push(explain.missing.slice(i, i + size));
      for (let i = 0; i < batches.length; i++) await consumeAiBudget(db, config.limits, deps.now());
      const settled = await Promise.allSettled(batches.map((terms) => deps.sources.explain({ apiKey: config.openaiApiKey(), model: config.explainModel, species, terms, userAgent: config.userAgent, now: deps.now() })));
      const failed = settled.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
      if (failed.length === settled.length) throw failed[0].reason;
      for (const f of failed) job.diagnosticNotes.push(`Explanations not run for one batch: ${errorDetail((f.reason as Error).message)}`);
      const fresh = settled.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
      await writeExplanations(db, fresh);
      applyExplanations(general, new Map(fresh.map((e) => [e.key, e])), species);
      job.explanationsNew = fresh.filter((e) => e.status === 'verified').length;
      finalStatus = explanationStatus(general);
      const misses = fresh.filter((e) => e.status !== 'verified').map((e) => `${e.term.slice(0, 40)}: ${e.reason}`);
      job.diagnosticNotes.push(`Explanations (${fresh[0]?.model ?? config.explainModel}): ${job.explanationsNew} of ${fresh.length} verified against their cited page.`, ...misses.slice(0, 10));
      log('explanations', { requested: explain.missing.length, verified: job.explanationsNew, unverified: misses });
    } catch (err) {
      finalStatus = explanationStatus(general) === 'not_needed' ? 'unavailable' : explanationStatus(general);
      const reason = err instanceof QuotaError ? err.kind : errorDetail((err as Error).message);
      job.diagnosticNotes.push(`Explanations not run: ${reason}`);
      log('explanations skipped', { reason });
    }
    if (job.explanationsCached || job.explanationsNew) job.evidenceNotes.push(`${job.explanationsCached} ingredient explanation${job.explanationsCached === 1 ? '' : 's'} reused; ${job.explanationsNew} new, each checked against its cited page.`);
    return finalStatus;
  };
  const verdictStep = async () => {
    const fallback = ruleVerdict(vInput);
    try {
      await consumeAiBudget(db, config.limits, deps.now());
      const w = await deps.sources.verdict({ apiKey: config.openaiApiKey(), model: config.verdictModel, input: vInput });
      const problem = checkVerdict(w.text, vInput);
      const chosen = problem ? { text: fallback, model: w.model, source: 'rules' } : { text: w.text, model: w.model, source: 'ai' };
      if (problem) job.diagnosticNotes.push(`Verdict (${w.model}) not used: ${problem}; the rule-based verdict is shown.`);
      await saveVerdict(db, o.uid, vKey, chosen, deps.now());
      log('verdict', { model: w.model, used: !problem, problem });
      return { text: named(chosen.text), source: chosen.source, status: 'ready' };
    } catch (err) {
      // Not cached: the next assessment tries again.
      const reason = err instanceof QuotaError ? err.kind : errorDetail((err as Error).message);
      job.diagnosticNotes.push(`Verdict not written: ${reason}; the rule-based verdict is shown.`);
      log('verdict skipped', { reason });
      return { text: named(fallback), source: 'rules', status: 'ready' };
    }
  };
  const [finalStatus, written] = await Promise.all([pending ? explainStep() : Promise.resolve(explain.status), verdictPending ? verdictStep() : Promise.resolve(verdict)]);
  verdict = written;
  // Written only while this run's result is still the one saved.
  await db
    .runTransaction(async (tx) => {
      if ((await tx.get(ref)).get('assessmentRunId') !== job.runId) return;
      tx.update(ref, { ...explanationFields(general, finalStatus), ...highlightFields(highlights, verdict), ...jobFields(job, currentCalls(), deps.now()), updatedAt: Timestamp.fromDate(deps.now()) });
    })
    .catch((err) => {
      deps.log.error('explanation save failed', { traceId: job.traceId, error: (err as Error).message });
    });
}

/** Products that are out of scope, or not yet known to be for cats or dogs, have nothing to assess for a pet yet. */
function fixedVerdict(scope: ScopeResult, requests: PhotoRequest[]): string | null {
  if (scope.status === 'out_of_scope') return scope.reason;
  if (scope.status === 'unknown')
    return requests.some((r) => r.purpose === 'front')
      ? 'We couldn’t confirm yet whether this is made for cats or dogs, so Purrbi hasn’t assessed it. A photo of the front of the package, where it says who it is for, will settle it.'
      : 'We couldn’t confirm yet whether this is made for cats or dogs, so Purrbi hasn’t assessed it.';
  return null;
}

/** Saved records keep the label text; what Purrbi reads from it is re-derived with the current rules. */
function rederive(facts: ProductFacts): ProductFacts {
  let out = facts;
  if (out.guaranteedAnalysis) out = { ...out, guaranteedAnalysis: { ...out.guaranteedAnalysis, value: rematchAnalysis(out.guaranteedAnalysis.value) } };
  const adequacy = out.adequacy ? parseAdequacyStatement(out.adequacy.value.text) : null;
  if (out.adequacy && adequacy) out = { ...out, adequacy: { ...out.adequacy, value: adequacy } };
  return out;
}

function fieldLabel(k: string): string {
  return ({ productName: 'product name', brand: 'brand', ingredientsText: 'ingredients', guaranteedAnalysis: 'guaranteed analysis', calories: 'calorie content', adequacy: 'adequacy statement', activeIngredients: 'active ingredients', feedingDirections: 'feeding directions', imageUrl: 'image' } as Record<string, string>)[k] ?? k;
}

/**
 * The record in the database the shared backend named (one call), or, when its answer did not say,
 * in any sister database. A database that fails stops the lookup with that failure: a provider outage
 * must never read as "not found".
 */
async function sisterRecord(deps: Deps, barcode: NormalizedBarcode, now: Date, db: OpenFactsDb | undefined): Promise<Extract<OpenFactsLookup, { found: true }> | null> {
  if (db && db !== 'opff') {
    const r = await deps.sources.lookupOpenFacts(db, barcode, deps.config.userAgent, now);
    return r.found ? r : null;
  }
  const dbs: OpenFactsDb[] = ['off', 'obf', 'opf'];
  const results = await Promise.allSettled(dbs.map((d) => deps.sources.lookupOpenFacts(d, barcode, deps.config.userAgent, now)));
  for (const r of results) if (r.status === 'fulfilled' && r.value.found) return r.value;
  const failed = results.find((r): r is PromiseRejectedResult => r.status === 'rejected');
  if (failed) throw failed.reason;
  return null;
}

// ---- explanations ------------------------------------------------------------------------------

function explainRequests(general: GeneralAssessment): ExplainRequest[] {
  const out: ExplainRequest[] = [];
  for (const a of general.supplement?.actives ?? []) if (needsExplanation(a.name, 'active')) out.push({ term: a.name, kind: 'active' });
  const actives = new Set(out.map((x) => x.term.toLowerCase()));
  for (const n of general.ingredientNotes.slice(0, 15)) {
    if (n.explanationKind === 'none' && needsExplanation(n.name, 'ingredient') && !actives.has(n.name.toLowerCase())) out.push({ term: n.name, kind: 'ingredient' });
  }
  return out.slice(0, 20);
}

function applyExplanations(general: GeneralAssessment, byKey: Map<string, CitedExplanation>, species: string): number {
  let applied = 0;
  for (const n of general.ingredientNotes) {
    const e = byKey.get(explanationKey(species, 'ingredient', n.name));
    if (e?.status === 'verified' && n.explanationKind === 'none') {
      Object.assign(n, { explanation: e.summary, explanationKind: 'cited_ai', explanationSourceTitle: e.sourceTitle, explanationSourceUrl: e.sourceUrl, explanationQuote: e.quote });
      // The role from the verified page fills in only where Purrbi's own role table has none.
      if (!n.role && e.role) Object.assign(n, { role: e.role.slice(0, 60), roleSource: 'cited_ai' });
      applied++;
    }
  }
  for (const a of general.supplement?.actives ?? []) {
    const e = byKey.get(explanationKey(species, 'active', a.name));
    if (e?.status === 'verified' && a.evidence !== 'cited') {
      Object.assign(a, { evidence: 'cited', note: e.summary, sourceTitle: e.sourceTitle, sourceUrl: e.sourceUrl, quote: e.quote });
      applied++;
    }
  }
  return applied;
}

type ExplanationStatus = 'ready' | 'partial' | 'unavailable' | 'not_needed' | 'pending';

function explanationStatus(general: GeneralAssessment): ExplanationStatus {
  const wanted = explainRequests(general).length + general.ingredientNotes.filter((n) => n.explanationKind === 'cited_ai').length + (general.supplement?.actives.filter((a) => a.evidence === 'cited').length ?? 0);
  if (!wanted) return 'not_needed';
  const remaining = explainRequests(general).length;
  if (!remaining) return 'ready';
  return remaining < wanted ? 'partial' : 'unavailable';
}

async function cachedExplanations(deps: Deps, general: GeneralAssessment, scope: ScopeResult, now: Date): Promise<{ missing: ExplainRequest[]; cachedCount: number; status: ExplanationStatus }> {
  const species = scope.species === 'unknown' ? 'cat_and_dog' : scope.species;
  const requests = scope.status === 'out_of_scope' ? [] : explainRequests(general);
  if (!requests.length) return { missing: [], cachedCount: 0, status: explanationStatus(general) };
  const cache = await readExplanations(deps.db, requests.map((r) => explanationKey(species, r.kind, r.term)), now);
  const cachedCount = applyExplanations(general, cache, species);
  // Terms already looked up (even without a verifiable source) are not paid for again until they expire.
  const missing = requests.filter((r) => !cache.has(explanationKey(species, r.kind, r.term)));
  return { missing, cachedCount, status: explanationStatus(general) };
}

// ---------------------------------------------------------------------------------------------

export const photoPath = (uid: string, photoId: string) => `users/${uid}/photos/${photoId}`;

/** A label photo request was added at users/{uid}/photos/{photoId} with the scan it belongs to (`scanId`). */
export function processPhoto(deps: Deps, uid: string, photoId: string): Promise<void> {
  return runWithCallLog(() => photoJob(deps, uid, photoId));
}

async function photoJob(deps: Deps, uid: string, photoId: string): Promise<void> {
  const { db, config } = deps;
  const photoRef = db.doc(photoPath(uid, photoId));
  const first = await photoRef.get();
  const scanId = first.get('scanId');
  if (typeof scanId !== 'string' || !scanId || scanId.includes('/')) return;
  const scanRef = db.doc(scanPath(uid, scanId));
  const now = deps.now();
  const claimed = await db.runTransaction(async (tx) => {
    const [scan, photo] = await Promise.all([tx.get(scanRef), tx.get(photoRef)]);
    if (!scan.exists || !photo.exists || photo.get('status') !== 'uploaded') return null;
    tx.update(photoRef, { status: 'processing', statusMessage: 'Reading the label', updatedAt: Timestamp.fromDate(now) });
    tx.update(scanRef, { status: SCAN_STATUS.processingPhoto, statusMessage: 'Reading your label photo', progress: 70, updatedAt: Timestamp.fromDate(now) });
    return { scan: scan.data()!, photo: photo.data()! };
  });
  if (!claimed) return;
  const traceId = (claimed.scan.traceId as string) || randomUUID().slice(0, 12);
  const job = newJob('photo', traceId, now);
  const gtin = (claimed.scan.gtin as string) ?? normalizeBarcode(claimed.scan.barcode).gtin14;
  const purpose = String(claimed.photo.purpose ?? 'label');
  const photoFail = async (status: 'unreadable' | 'failed' | 'different_product' | 'rejected', message: string) => {
    await photoRef.update({ status, statusMessage: message, processedAt: Timestamp.fromDate(deps.now()), updatedAt: Timestamp.fromDate(deps.now()) });
  };

  try {
    if (!config.aiEnabled) {
      await photoFail('failed', 'Label reading is not switched on yet.');
    } else {
      const count = (await db.collection(`users/${uid}/photos`).where('scanId', '==', scanId).count().get()).data().count;
      if (count > config.limits.maxPhotosPerScan) {
        // count includes this photo
        await photoFail('rejected', `A scan can have up to ${config.limits.maxPhotosPerScan} photos.`);
      } else {
        await consumeQuota(db, uid, 'photos', config.limits, now);
        await consumeAiBudget(db, config.limits, now);
        if (!deps.readImage) throw new Error('image reader not configured');
        const image = await deps.readImage(String(claimed.photo.imageUrl ?? ''), uid);
        const label = await deps.sources.extractLabel({ apiKey: config.openaiApiKey(), model: config.visionModel, imageBase64: image.base64, mimeType: image.mimeType, purpose: purposeText(purpose), scanGtin14: gtin });
        deps.log.info('label extracted', { traceId, uid, scanId, photoId, status: label.status, panels: label.panels, rejected: label.rejected });
        job.diagnosticNotes.push(`Label photo (${label.model}): ${label.status}${label.rejected.length ? `; not kept: ${label.rejected.slice(0, 4).join('; ')}` : ''}`);
        if (label.status === 'processed') {
          // How far the reading can be trusted beyond this owner: compared with this barcode's public record.
          const c = corroborateLabel(label, (await readProduct(db, gtin))?.facts);
          job.diagnosticNotes.push(`Label photo stage: ${c.stage}${c.agreements.length ? `; agrees: ${c.agreements.join('; ')}` : ''}${c.conflicts.length ? `; conflicts: ${c.conflicts.join('; ')}` : ''}`);
          await saveLabelExtraction(db, uid, gtin, { photoId, scanId, purpose, processedAt: deps.now(), label, stage: c.stage, agreements: c.agreements, conflicts: c.conflicts });
          await photoRef.update({
            status: 'processed',
            statusMessage: c.stage === 'disputed' ? 'Label read, but it doesn’t match this barcode’s record' : 'Label read',
            stage: c.stage,
            stageNote: c.note,
            panels: label.panels,
            fieldsFound: [
              label.ingredients.length ? 'ingredients' : '',
              label.activeIngredients.length ? 'active ingredients' : '',
              label.guaranteedAnalysis.length ? 'guaranteed analysis' : '',
              label.adequacy ? 'adequacy statement' : '',
              label.calories.length ? 'calories' : '',
              label.productName ? 'product name' : '',
            ].filter(Boolean),
            uncertainFields: label.uncertainFields,
            processedAt: Timestamp.fromDate(deps.now()),
            updatedAt: Timestamp.fromDate(deps.now()),
          });
        } else {
          await photoFail(label.status, label.reason);
        }
      }
    }
  } catch (err) {
    const message = err instanceof QuotaError ? 'Today’s photo limit has been reached.' : 'The photo couldn’t be processed. Try again or retake it.';
    deps.log.error('photo failed', { traceId, uid, scanId, photoId, error: (err as Error).message });
    await photoFail('failed', message);
  }

  // Re-assess with whatever evidence now exists (the scan never gets stuck in "processing").
  try {
    await runAssessment(deps, job, { uid, scanId, barcode: normalizeBarcode(claimed.scan.barcode), petId: (claimed.scan.petId as string) ?? null, allowFetch: false, allowExplain: true, skipPhotos: claimed.scan.skipPhotos === true });
  } catch (err) {
    await failScan(deps, uid, scanId, job, err);
  }
}

function purposeText(purpose: string): string {
  return (
    {
      front: 'the front of the package (name, brand, species, product type)',
      ingredients: 'the ingredient list (and, for a supplement, its active ingredients with amounts)',
      nutrition: 'the guaranteed analysis, calorie content and nutritional adequacy statement',
    }[purpose] ?? 'the product label'
  );
}

/** Client-requested actions on an existing scan: retry, skip photos, refresh personal fit for a pet. */
export async function handleScanUpdate(deps: Deps, uid: string, scanId: string, before: Record<string, unknown>, after: Record<string, unknown>): Promise<void> {
  const ref = deps.db.doc(scanPath(uid, scanId));
  const rising = (k: string) => before[k] !== true && after[k] === true;
  if (rising('retryRequested') && (after.status === SCAN_STATUS.failed || isStuck(after, deps.now()))) {
    await processScan(deps, uid, scanId, after.status === SCAN_STATUS.queued ? 'scan' : 'retry');
    return;
  }
  const barcode = normalizeBarcode(after.barcode);
  if (!barcode.ok) return;
  if (rising('skipPhotos') && after.status === SCAN_STATUS.needsPhotos) {
    await ref.update({ status: SCAN_STATUS.complete, statusMessage: 'Assessment ready (some information is missing)', photoRequests: [], missingInfo: [], completedAt: Timestamp.fromDate(deps.now()), updatedAt: Timestamp.fromDate(deps.now()) });
    return;
  }
  if (rising('refreshPersonalRequested') && [SCAN_STATUS.complete, SCAN_STATUS.needsPhotos].includes(after.status as never)) {
    const job = newJob('refresh', (after.traceId as string) || randomUUID().slice(0, 12), deps.now());
    await runWithCallLog(async () => {
      try {
        await runAssessment(deps, job, { uid, scanId, barcode, petId: (after.petId as string) ?? null, allowFetch: false, allowExplain: false, skipPhotos: after.skipPhotos === true || after.status === SCAN_STATUS.complete });
        await ref.update({ refreshPersonalRequested: false });
      } catch (err) {
        // The earlier result stays: the scan is never left "assessing".
        deps.log.error('personal refresh failed', { traceId: job.traceId, uid, scanId, error: (err as Error).message });
        await ref.update({ refreshPersonalRequested: false, status: after.status, statusMessage: 'Couldn’t check it for this pet just now; the earlier result is shown. Try again.', progress: 100, updatedAt: Timestamp.fromDate(deps.now()) });
      }
    });
  }
}

export { stripPrivate };
export type { StoredProduct, ScopeResult };
