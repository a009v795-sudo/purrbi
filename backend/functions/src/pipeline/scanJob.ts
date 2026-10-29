// The scan job. The app creates users/{uid}/scans/{scanId} with {barcode, petId?, status: "queued"};
// this module claims it, gathers evidence, assesses, and writes everything back to the same document.
// Evidence order: saved product facts → pet database → the database's own label images (read by AI)
// → manufacturer/web research → the owner's label photos. Each later step runs only when the earlier
// ones left something important missing, and paid enrichment is attempted at most once per product
// per freshness window. Each failure keeps its own error code: a timeout, a quota stop or a failed
// save is never reported as "product not found", and partial findings are kept. Every outbound call
// is recorded (sanitized) under the job's trace id.
import { randomUUID } from 'node:crypto';
import type { Firestore } from 'firebase-admin/firestore';
import { extractLabel as extractLabelImpl, LABEL_EXTRACTION_VERSION, type ValidatedLabel } from '../ai/labelExtract';
import { parseAdequacyStatement } from '../domain/adequacy';
import { normalizeBarcode, type NormalizedBarcode } from '../domain/barcode';
import { personalize } from '../domain/personalize';
import { classifyScope, type DatabaseOrigin } from '../domain/scope';
import { assessGeneral } from '../domain/score';
import { buildSummary, overallState } from '../domain/summary';
import type { GeneralAssessment, PetProfile, ProductFacts, RecallCheck, ScopeResult, SourceRef } from '../domain/types';
import { explainTerms as explainImpl, explanationKey, needsExplanation, type CitedExplanation, type ExplainRequest } from '../knowledge/explain';
import { readDatabaseLabelImages as databaseImagesImpl } from '../sources/labelImages';
import { checkRecalls as checkRecallsImpl } from '../sources/openfda';
import { lookupOpenFacts as lookupOpenFactsImpl, openFactsToFacts, type OpenFactsDb, type OpenFactsLookup } from '../sources/openFacts';
import { RESEARCH_VERSION, researchProduct as researchImpl, type ResearchOutcome } from '../sources/research';
import { currentCalls, errorDetail, runWithCallLog } from '../util/diagnostics';
import { SourceError } from '../util/http';
import { rematchAnalysis } from '../domain/nutrition';
import { SCAN_STATUS, type ErrorCode, type RuntimeConfig } from './config';
import { dropStaleImageReads, enrichmentFacts, fillMissing, labelToFacts, missingInfo, type PhotoRequest } from './facts';
import { explanationFields, jobFields, resultFields, type JobInfo } from './serialize';
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
  saveLabelExtraction,
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
}

export const realSources: Sources = {
  lookupOpenFacts: lookupOpenFactsImpl,
  checkRecalls: checkRecallsImpl,
  research: researchImpl,
  extractLabel: extractLabelImpl,
  databaseImages: databaseImagesImpl,
  explain: explainImpl,
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

function newJob(kind: JobInfo['kind'], traceId: string, now: Date): JobInfo {
  return { kind, traceId, startedAt: now, productCache: 'none', recallCache: 'skipped', explanationsCached: 0, explanationsNew: 0, evidenceNotes: [], diagnosticNotes: [] };
}

async function setStatus(deps: Deps, uid: string, scanId: string, status: string, message: string, progress: number) {
  await deps.db.doc(scanPath(uid, scanId)).update({ status, statusMessage: message, progress, updatedAt: Timestamp.fromDate(deps.now()) });
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
    const retry = d.status === SCAN_STATUS.failed && d.retryRequested === true && d.errorRetryable === true;
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
  const e = err instanceof JobError ? err : err instanceof SourceError ? new JobError('source_unavailable', errorMessage('source_unavailable'), true) : new JobError('analysis_failed', errorMessage('analysis_failed'), true);
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
  if (stored && (fresh || !o.allowFetch)) {
    job.productCache = 'hit';
    job.evidenceNotes.push(`Product details reused from Purrbi’s saved record (retrieved ${stored.lastRetrievedAt?.toISOString().slice(0, 10) ?? 'earlier'}); no database call was needed.`);
    return { facts: stored.facts, origin: (stored.origin as DatabaseOrigin) ?? 'opff', fetchedPublic: false, notes: [], openFacts: null };
  }
  job.productCache = 'miss';
  try {
    const pet = await deps.sources.lookupOpenFacts('opff', o.barcode, config.userAgent, now);
    if (pet.found) {
      job.evidenceNotes.push('Found in Open Pet Food Facts.');
      // Keep earlier verified enrichment for fields the database record still lacks.
      const facts = fillMissing(openFactsToFacts(pet, gtin, o.barcode.digits), enrichmentFacts(stored?.facts)).facts;
      return { facts, origin: 'opff', fetchedPublic: true, notes: [], openFacts: pet };
    }
    // Not in the pet database: check whether the barcode is a human food, cosmetic or other product.
    const sister = await firstFound(deps, o.barcode, now);
    job.evidenceNotes.push(sister ? `Not in Open Pet Food Facts; listed in ${sister.source.sourceName}.` : 'Not found in Open Pet Food Facts or its sister databases.');
    return {
      facts: sister ? openFactsToFacts(sister, gtin, o.barcode.digits) : { gtin, barcode: o.barcode.digits, classificationSignals: [], sources: [] },
      origin: sister ? (sister.db as DatabaseOrigin) : 'label',
      fetchedPublic: true,
      notes: [],
      openFacts: null,
    };
  } catch (err) {
    if (!stored) throw err;
    job.productCache = 'stale_used';
    job.evidenceNotes.push('The product database was unreachable, so Purrbi’s saved record was used.');
    deps.log.info('database unavailable, using stale cache', { traceId: job.traceId, error: (err as Error).message });
    return { facts: stored.facts, origin: (stored.origin as DatabaseOrigin) ?? 'opff', fetchedPublic: false, notes: ['The product database was unreachable, so saved product information was used.'], openFacts: null };
  }
}

const scopeOf = (facts: ProductFacts, origin: DatabaseOrigin): ScopeResult =>
  classifyScope({ origin, categoriesTags: facts.classificationSignals.map((s) => s.text), texts: [facts.productName?.value ?? ''], adequacy: facts.adequacy?.value });

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
  const stale = dropStaleImageReads(facts, LABEL_EXTRACTION_VERSION);
  facts = stale.facts;
  const rewriteProduct = stale.dropped.length > 0;
  if (rewriteProduct) job.diagnosticNotes.push(`Dropped ${stale.dropped.join(', ')} read from database label images by an older label reader.`);
  let scope = scopeOf(facts, origin);

  // 2. Optional enrichment for missing public facts (pet products only; at most once per freshness window).
  const meta: ProductMeta = await readProductMeta(db, gtin);
  let metaChanged = false;
  if (evidence.openFacts) {
    const p = evidence.openFacts.product;
    const urls = { ...(p.image_ingredients_url ? { ingredients: p.image_ingredients_url } : {}), ...(p.image_nutrition_url ? { nutrition: p.image_nutrition_url } : {}) };
    if (JSON.stringify(urls) !== JSON.stringify(meta.labelImageUrls)) {
      meta.labelImageUrls = urls;
      metaChanged = true;
    }
  }
  const aiOk = o.allowFetch && config.aiEnabled && scope.status !== 'out_of_scope' && origin !== 'off' && origin !== 'obf' && origin !== 'opf';
  const panelNeeds = () => missingInfo(facts, scope, scope.category).map((r) => r.purpose).filter((p) => p === 'ingredients' || p === 'nutrition');

  // 2a. Label images already published in the pet database, read by AI.
  const imagesDue = ageDays(meta.enrichment.databaseImagesAt, now) > config.productFreshDays || meta.enrichment.databaseImages?.version !== LABEL_EXTRACTION_VERSION;
  if (aiOk && config.databaseImagesEnabled && panelNeeds().length && Object.keys(meta.labelImageUrls).length && imagesDue) {
    await setStatus(deps, o.uid, o.scanId, SCAN_STATUS.researching, 'Reading the label images in the product database', 30);
    const code = facts.sources.find((s) => s.sourceType === 'database')?.sourceId.split(':')[1] ?? o.barcode.digits;
    const product = { image_ingredients_url: meta.labelImageUrls.ingredients, image_nutrition_url: meta.labelImageUrls.nutrition };
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
    meta.enrichment.databaseImages = { read: r.read, skipped: r.skipped, version: LABEL_EXTRACTION_VERSION };
    job.diagnosticNotes.push(...r.skipped.slice(0, 4).map((x) => `Database label image ${x}`));
    metaChanged = true;
    if (r.read.length) job.evidenceNotes.push(`Read the ${r.read.map((x) => (x === 'nutrition' ? 'nutrition panel' : 'ingredient list')).join(' and ')} from a label image in Open Pet Food Facts (AI, not reviewed).`);
    log('database label images', { read: r.read, skipped: r.skipped });
    scope = scopeOf(facts, origin);
  }

  // 2b. Bounded manufacturer/web research.
  const stillMissing = missingInfo(facts, scope, scope.category).some((r) => r.purpose !== 'front' || !facts.productName);
  const hasWeb = facts.sources.some((s) => s.sourceType === 'manufacturer' || s.sourceType === 'retailer_or_web');
  const researchDue = ageDays(meta.enrichment.researchAt, now) > config.productFreshDays || meta.enrichment.research?.version !== RESEARCH_VERSION;
  if (aiOk && config.researchEnabled && stillMissing && !hasWeb && researchDue) {
    await setStatus(deps, o.uid, o.scanId, SCAN_STATUS.researching, 'Looking for the manufacturer’s label information', 40);
    try {
      await consumeQuota(db, o.uid, 'research', config.limits, now);
      await consumeAiBudget(db, config.limits, now);
      const r = await deps.sources.research({ apiKey: config.openaiApiKey(), model: config.researchModel, gtin14: gtin, barcode: o.barcode.digits, knownName: facts.productName?.value, knownBrand: facts.brand?.value, userAgent: config.userAgent, now });
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
      meta.enrichment.research = { filled, discarded: r.discarded, source: src ? `${src.sourceName} (${src.sourceType})` : '', version: RESEARCH_VERSION };
      metaChanged = true;
      job.evidenceNotes.push(
        filled.length && src
          ? `Filled ${filled.filter((k) => k !== 'ingredients').map(fieldLabel).join(', ')} from ${src.sourceName} (${src.sourceType === 'manufacturer' ? 'manufacturer page' : 'web page'}), each checked against the page.`
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
  if ((fetchedPublic || rewriteProduct || !stored) && facts.sources.length) factsVersion = await writeProduct(db, { facts, scope, origin, previous: stored, now, traceId: job.traceId });
  if (metaChanged) await writeProductMeta(db, gtin, meta, now);

  // 4. The owner's own label photos fill remaining gaps (private, unreviewed).
  const extractions = await readLabelExtractions(db, o.uid, gtin);
  let labelUsed = false;
  const olderReads = extractions.filter((e) => e.label.status === 'processed' && e.label.version !== LABEL_EXTRACTION_VERSION).length;
  if (olderReads) job.diagnosticNotes.push(`${olderReads} label photo reading${olderReads === 1 ? ' was' : 's were'} made by an older label reader and not used; the photo is asked for again if still needed.`);
  for (const e of extractions) {
    if (e.label.status !== 'processed' || e.label.version !== LABEL_EXTRACTION_VERSION) continue;
    const src: SourceRef = { sourceId: `label:${e.photoId}`, sourceType: 'user_label', sourceName: 'Your label photo', retrievedAt: e.processedAt.toISOString(), matchConfidence: 'exact_barcode' };
    const merged = fillMissing(facts, labelToFacts(e.label, src));
    if (merged.filled.length) labelUsed = true;
    facts = merged.facts;
  }
  if (labelUsed) job.evidenceNotes.push('Used details read from your label photo (AI, not reviewed).');
  facts = rederive(facts);
  scope = scopeOf(facts, origin);

  // 5. Recall check (FDA), cached; skipped for out-of-scope products.
  let recall: RecallCheck | null = null;
  if (scope.status !== 'out_of_scope') {
    const cachedRecall = stored?.recall && stored.recallCheckedAt && now.getTime() - stored.recallCheckedAt.getTime() < config.recallFreshHours * 3600000 ? stored.recall : null;
    if (cachedRecall || !o.allowFetch) {
      recall = cachedRecall ?? stored?.recall ?? null;
      job.recallCache = recall ? 'hit' : 'skipped';
      if (recall && stored?.recallCheckedAt) job.evidenceNotes.push(`FDA recall check reused from ${Math.max(1, Math.round((now.getTime() - stored.recallCheckedAt.getTime()) / 3600000))} h ago.`);
    } else {
      job.recallCache = 'miss';
      await setStatus(deps, o.uid, o.scanId, SCAN_STATUS.checkingAlerts, 'Checking FDA recall records', 60);
      recall = await deps.sources.checkRecalls({ brand: facts.brand?.value, productName: facts.productName?.value, gtin14: gtin }, now);
      if (recall.status !== 'unavailable' && facts.sources.length) await writeRecall(db, gtin, recall, now);
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

  // Explanations already in the cache are attached now; new ones follow in step 8.
  const explain = await cachedExplanations(deps, general, scope, now);
  job.explanationsCached = explain.cachedCount;
  const pending = o.allowExplain && config.aiEnabled && config.explanationsEnabled && explain.missing.length > 0;

  const status = scope.status === 'out_of_scope' ? SCAN_STATUS.outOfScope : requests.length ? SCAN_STATUS.needsPhotos : SCAN_STATUS.complete;
  const statusMessage =
    status === SCAN_STATUS.outOfScope ? 'Outside Purrbi’s scope' : status === SCAN_STATUS.needsPhotos ? `Add ${requests.length === 1 ? 'a photo' : 'photos'} to finish the assessment` : 'Assessment ready';

  // 7. Save. A failed save is reported as such (never as "unknown product").
  const ref = db.doc(scanPath(o.uid, o.scanId));
  try {
    await ref.update({
      ...resultFields({ facts, scope, general, personal, recall, summary, state, photoRequests: requests, factsVersion, labelEvidenceUsed: labelUsed }),
      ...explanationFields(general, pending ? 'pending' : explain.status),
      ...jobFields(job, currentCalls(), deps.now()),
      status,
      statusMessage,
      progress: 100,
      identitySource: origin,
      productFound: facts.sources.some((s) => ['database', 'database_image', 'manufacturer', 'retailer_or_web'].includes(s.sourceType)),
      errorCode: '',
      errorMessage: '',
      errorRetryable: false,
      assessedAt: Timestamp.fromDate(now),
      completedAt: status === SCAN_STATUS.needsPhotos ? null : Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    });
  } catch (err) {
    deps.log.error('save failed', { traceId: job.traceId, error: (err as Error).message });
    throw new JobError('save_failed', errorMessage('save_failed'), true);
  }
  log('scan assessed', { status, state, score: general.score, personal: personal.state, labelUsed, factsVersion, productCache: job.productCache, recallCache: job.recallCache, calls: currentCalls().length });

  // 8. New cited explanations, then the second update. All of the product's new terms are explained
  // now (parallel calls of explanationsPerCall terms), so a later rescan needs no AI call. Failure here
  // never fails the scan; a failed call is tried again on the next scan.
  if (pending) {
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
    await ref.update({ ...explanationFields(general, finalStatus), ...jobFields(job, currentCalls(), deps.now()), updatedAt: Timestamp.fromDate(deps.now()) }).catch((err) => {
      deps.log.error('explanation save failed', { traceId: job.traceId, error: (err as Error).message });
    });
  }
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

async function firstFound(deps: Deps, barcode: NormalizedBarcode, now: Date): Promise<Extract<OpenFactsLookup, { found: true }> | null> {
  const dbs: OpenFactsDb[] = ['off', 'obf', 'opf'];
  const results = await Promise.allSettled(dbs.map((db) => deps.sources.lookupOpenFacts(db, barcode, deps.config.userAgent, now)));
  for (const r of results) if (r.status === 'fulfilled' && r.value.found) return r.value;
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
          await saveLabelExtraction(db, uid, gtin, { photoId, scanId, purpose, processedAt: deps.now(), label });
          await photoRef.update({
            status: 'processed',
            statusMessage: 'Label read',
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
  if (rising('retryRequested') && after.status === SCAN_STATUS.failed) {
    await processScan(deps, uid, scanId, 'retry');
    return;
  }
  const barcode = normalizeBarcode(after.barcode);
  if (!barcode.ok) return;
  if (rising('skipPhotos') && after.status === SCAN_STATUS.needsPhotos) {
    await ref.update({ status: SCAN_STATUS.complete, statusMessage: 'Assessment ready (some information is missing)', photoRequests: [], completedAt: Timestamp.fromDate(deps.now()), updatedAt: Timestamp.fromDate(deps.now()) });
    return;
  }
  if (rising('refreshPersonalRequested') && [SCAN_STATUS.complete, SCAN_STATUS.needsPhotos].includes(after.status as never)) {
    const job = newJob('refresh', (after.traceId as string) || randomUUID().slice(0, 12), deps.now());
    await runWithCallLog(async () => {
      try {
        await runAssessment(deps, job, { uid, scanId, barcode, petId: (after.petId as string) ?? null, allowFetch: false, allowExplain: false, skipPhotos: after.skipPhotos === true || after.status === SCAN_STATUS.complete });
      } finally {
        await ref.update({ refreshPersonalRequested: false });
      }
    });
  }
}

export { stripPrivate };
export type { StoredProduct, ScopeResult };
