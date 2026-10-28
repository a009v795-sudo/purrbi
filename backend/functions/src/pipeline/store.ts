// Firestore persistence. All writes here use the Admin SDK (server only); clients cannot write
// products, evidence, label facts, usage counters or assessment fields (see firestore.rules).
import { createHash } from 'node:crypto';
import { FieldValue, Timestamp, type Firestore } from 'firebase-admin/firestore';
import type { ValidatedLabel } from '../ai/labelExtract';
import type { PetProfile, ProductFacts, RecallCheck, ScopeResult, SourceRef } from '../domain/types';
import type { Limits } from './config';

export class QuotaError extends Error {
  constructor(readonly kind: 'scans' | 'photos' | 'research' | 'ai_budget') {
    super(`quota exceeded: ${kind}`);
    this.name = 'QuotaError';
  }
}

export const dayKey = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '');

export async function consumeQuota(db: Firestore, uid: string, kind: 'scans' | 'photos' | 'research', limits: Limits, now: Date): Promise<void> {
  const max = kind === 'scans' ? limits.scansPerUserPerDay : kind === 'photos' ? limits.photosPerUserPerDay : limits.researchPerUserPerDay;
  const ref = db.doc(`usage/${uid}_${dayKey(now)}`);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const used = (snap.get(kind) as number | undefined) ?? 0;
    if (used >= max) throw new QuotaError(kind);
    tx.set(ref, { uid, day: dayKey(now), [kind]: used + 1, updatedAt: Timestamp.fromDate(now) }, { merge: true });
  });
}

/** Global daily budget for paid AI calls, independent of the per-user limits. */
export async function consumeAiBudget(db: Firestore, limits: Limits, now: Date): Promise<void> {
  const ref = db.doc(`system/aiUsage_${dayKey(now)}`);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const used = (snap.get('calls') as number | undefined) ?? 0;
    if (used >= limits.aiCallsPerDayGlobal) throw new QuotaError('ai_budget');
    tx.set(ref, { calls: used + 1, updatedAt: Timestamp.fromDate(now) }, { merge: true });
  });
}

// ---- products ----------------------------------------------------------------

export interface StoredProduct {
  facts: ProductFacts;
  origin: string;
  factsVersion: number;
  factsHash: string;
  lastRetrievedAt: Date | null;
  recall: RecallCheck | null;
  recallCheckedAt: Date | null;
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
    factsVersion: (d.factsVersion as number) ?? 1,
    factsHash: (d.factsHash as string) ?? '',
    lastRetrievedAt: toDate(d.lastRetrievedAt),
    recall: (d.recall as RecallCheck) ?? null,
    recallCheckedAt: toDate(d.recallCheckedAt),
  };
}

/** Writes public-source facts only (database / verified web). Returns the facts version. */
export async function writeProduct(
  db: Firestore,
  args: { facts: ProductFacts; scope: ScopeResult; origin: string; previous: StoredProduct | null; now: Date; traceId: string },
): Promise<number> {
  const publicFacts: ProductFacts = stripPrivate(args.facts);
  const hash = factsHash(publicFacts);
  const version = !args.previous ? 1 : args.previous.factsHash === hash ? args.previous.factsVersion : args.previous.factsVersion + 1;
  const ref = db.doc(`products/${publicFacts.gtin}`);
  const batch = db.batch();
  batch.set(
    ref,
    {
      gtin: publicFacts.gtin,
      barcode: publicFacts.barcode,
      productName: publicFacts.productName?.value ?? '',
      brand: publicFacts.brand?.value ?? '',
      imageUrl: publicFacts.imageUrl?.value ?? '',
      species: args.scope.species,
      category: args.scope.category,
      scope: args.scope.status,
      scopeReason: args.scope.reason,
      origin: args.origin,
      verification: publicFacts.sources.some((s) => s.sourceType === 'manufacturer' || s.sourceType === 'retailer_or_web') ? 'database_and_verified_web' : 'database_record',
      facts: publicFacts,
      factsHash: hash,
      factsVersion: version,
      lastRetrievedAt: Timestamp.fromDate(args.now),
      updatedAt: Timestamp.fromDate(args.now),
    },
    { merge: true },
  );
  for (const s of publicFacts.sources) {
    batch.set(ref.collection('evidence').doc(s.sourceId.replace(/[^A-Za-z0-9_.-]/g, '_').slice(0, 200)), {
      ...s,
      fieldsSupported: supportedFields(publicFacts, s),
      traceId: args.traceId,
      retrievedAt: Timestamp.fromDate(new Date(s.retrievedAt)),
    });
  }
  await batch.commit();
  return version;
}

export async function writeRecall(db: Firestore, gtin: string, recall: RecallCheck, now: Date): Promise<void> {
  await db.doc(`products/${gtin}`).set({ recall, recallCheckedAt: Timestamp.fromDate(now) }, { merge: true });
}

function supportedFields(facts: ProductFacts, s: SourceRef): string[] {
  const keys: (keyof ProductFacts)[] = ['productName', 'brand', 'imageUrl', 'ingredientsText', 'guaranteedAnalysis', 'calories', 'adequacy', 'feedingDirections'];
  return keys.filter((k) => (facts[k] as { source?: SourceRef } | undefined)?.source?.sourceId === s.sourceId) as string[];
}

/** Removes facts that came from the owner's own label photos (they stay private to that owner). */
export function stripPrivate(facts: ProductFacts): ProductFacts {
  const out: ProductFacts = { ...facts, sources: facts.sources.filter((s) => s.sourceType !== 'user_label'), classificationSignals: facts.classificationSignals.filter((c) => !c.source.startsWith('label:')) };
  for (const k of ['productName', 'brand', 'imageUrl', 'ingredientsText', 'ingredients', 'guaranteedAnalysis', 'calories', 'adequacy', 'feedingDirections'] as const) {
    const f = out[k] as { source: SourceRef } | undefined;
    if (f?.source.sourceType === 'user_label') delete out[k];
  }
  return out;
}

// ---- private label evidence ---------------------------------------------------

export interface StoredLabelExtraction {
  photoId: string;
  scanId: string;
  purpose: string;
  processedAt: Date;
  label: ValidatedLabel;
}

export async function readLabelExtractions(db: Firestore, uid: string, gtin: string): Promise<StoredLabelExtraction[]> {
  const snap = await db.doc(`users/${uid}/labelFacts/${gtin}`).get();
  if (!snap.exists) return [];
  const items = (snap.get('extractions') as Record<string, { scanId: string; purpose: string; processedAt: Timestamp; label: ValidatedLabel }> | undefined) ?? {};
  return Object.entries(items)
    .map(([photoId, x]) => ({ photoId, scanId: x.scanId, purpose: x.purpose, processedAt: x.processedAt.toDate(), label: x.label }))
    .sort((a, b) => b.processedAt.getTime() - a.processedAt.getTime());
}

export async function saveLabelExtraction(db: Firestore, uid: string, gtin: string, e: StoredLabelExtraction): Promise<void> {
  await db.doc(`users/${uid}/labelFacts/${gtin}`).set(
    {
      gtin,
      updatedAt: Timestamp.fromDate(e.processedAt),
      extractions: { [e.photoId]: { scanId: e.scanId, purpose: e.purpose, processedAt: Timestamp.fromDate(e.processedAt), label: e.label } },
    },
    { merge: true },
  );
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
