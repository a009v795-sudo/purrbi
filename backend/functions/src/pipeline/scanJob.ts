// The scan job. The app creates users/{uid}/scans/{scanId} with {barcode, petId?, status: "queued"};
// this module claims it, gathers evidence, assesses, and writes everything back to the same document.
// Each failure keeps its own error code: a timeout, a quota stop or a failed save is never reported
// as "product not found", and partial findings are kept.
import { randomUUID } from 'node:crypto';
import type { Firestore } from 'firebase-admin/firestore';
import { extractLabel as extractLabelImpl, type ValidatedLabel } from '../ai/labelExtract';
import { normalizeBarcode, type NormalizedBarcode } from '../domain/barcode';
import { personalize } from '../domain/personalize';
import { classifyScope, type DatabaseOrigin } from '../domain/scope';
import { assessGeneral } from '../domain/score';
import { buildSummary, overallState } from '../domain/summary';
import type { PetProfile, ProductFacts, RecallCheck, ScopeResult, SourceRef } from '../domain/types';
import { checkRecalls as checkRecallsImpl } from '../sources/openfda';
import { lookupOpenFacts as lookupOpenFactsImpl, openFactsToFacts, type OpenFactsDb, type OpenFactsLookup } from '../sources/openFacts';
import { researchProduct as researchImpl, type ResearchOutcome } from '../sources/research';
import { SourceError } from '../util/http';
import { SCAN_STATUS, type ErrorCode, type RuntimeConfig } from './config';
import { fillMissing, labelToFacts, missingInfo, type PhotoRequest } from './facts';
import { resultFields } from './serialize';
import {
  consumeAiBudget,
  consumeQuota,
  QuotaError,
  readLabelExtractions,
  readPet,
  readProduct,
  saveLabelExtraction,
  stripPrivate,
  Timestamp,
  writeProduct,
  writeRecall,
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
}

export const realSources: Sources = {
  lookupOpenFacts: lookupOpenFactsImpl,
  checkRecalls: checkRecallsImpl,
  research: researchImpl,
  extractLabel: extractLabelImpl,
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

/** Entry point for a newly created (or retried) scan request. */
export async function processScan(deps: Deps, uid: string, scanId: string): Promise<void> {
  const ref = deps.db.doc(scanPath(uid, scanId));
  const traceId = randomUUID().slice(0, 12);
  const claimed = await deps.db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return null;
    const d = snap.data()!;
    const retry = d.status === SCAN_STATUS.failed && d.retryRequested === true && d.errorRetryable === true;
    if (d.status !== SCAN_STATUS.queued && !retry) return null;
    tx.update(ref, {
      status: SCAN_STATUS.identifying,
      statusMessage: 'Looking up the barcode',
      progress: 10,
      traceId,
      startedAt: Timestamp.fromDate(deps.now()),
      updatedAt: Timestamp.fromDate(deps.now()),
      retryRequested: false,
      errorCode: '',
      errorMessage: '',
      errorRetryable: false,
    });
    return { data: d as Record<string, unknown>, isRetry: retry };
  });
  if (!claimed) return;
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
    await runAssessment(deps, { uid, scanId, traceId, barcode, petId: (claimed.data.petId as string) ?? null, allowFetch: true, skipPhotos: claimed.data.skipPhotos === true });
  } catch (err) {
    await failScan(deps, uid, scanId, traceId, err);
  }
}

async function failScan(deps: Deps, uid: string, scanId: string, traceId: string, err: unknown) {
  const job = err instanceof JobError ? err : err instanceof SourceError ? new JobError('source_unavailable', errorMessage('source_unavailable'), true) : new JobError('analysis_failed', errorMessage('analysis_failed'), true);
  deps.log.error('scan failed', { traceId, uid, scanId, code: job.code, error: (err as Error)?.message });
  try {
    await deps.db.doc(scanPath(uid, scanId)).update({
      status: SCAN_STATUS.failed,
      statusMessage: job.message,
      errorCode: job.code,
      errorMessage: job.message,
      errorRetryable: job.retryable,
      progress: 100,
      updatedAt: Timestamp.fromDate(deps.now()),
    });
  } catch (writeErr) {
    deps.log.error('could not record scan failure', { traceId, uid, scanId, error: (writeErr as Error).message });
  }
}

interface AssessOptions {
  uid: string;
  scanId: string;
  traceId: string;
  barcode: NormalizedBarcode;
  petId: string | null;
  allowFetch: boolean; // false for personal refreshes: reuse stored evidence
  skipPhotos: boolean;
}

/** Gathers evidence (cache → databases → research → owner's label photos), assesses and saves. */
export async function runAssessment(deps: Deps, o: AssessOptions): Promise<void> {
  const now = deps.now();
  const { db, config } = deps;
  const log = (msg: string, data: Record<string, unknown> = {}) => deps.log.info(msg, { traceId: o.traceId, uid: o.uid, scanId: o.scanId, ...data });
  const gtin = o.barcode.gtin14;

  // 1. Public product facts: fresh cache, else the pet database (+ sister databases for scope).
  const stored = await readProduct(db, gtin);
  const fresh = stored?.lastRetrievedAt && now.getTime() - stored.lastRetrievedAt.getTime() < config.productFreshDays * 86400000;
  let facts: ProductFacts;
  let origin: DatabaseOrigin;
  let fetchedPublic = false;
  const notes: string[] = [];

  if (stored && (fresh || !o.allowFetch)) {
    facts = stored.facts;
    origin = (stored.origin as DatabaseOrigin) ?? 'opff';
    log('product from cache', { factsVersion: stored.factsVersion });
  } else {
    try {
      const pet = await deps.sources.lookupOpenFacts('opff', o.barcode, config.userAgent, now);
      if (pet.found) {
        facts = openFactsToFacts(pet, gtin, o.barcode.digits);
        origin = 'opff';
      } else {
        // Not in the pet database: check whether the barcode is a human food, cosmetic or other product.
        const sister = await firstFound(deps, o.barcode, now);
        facts = sister ? openFactsToFacts(sister, gtin, o.barcode.digits) : { gtin, barcode: o.barcode.digits, classificationSignals: [], sources: [] };
        origin = sister ? (sister.db as DatabaseOrigin) : 'label';
      }
      fetchedPublic = true;
      log('database lookup', { origin, found: facts.sources.length > 0 });
    } catch (err) {
      if (stored) {
        facts = stored.facts;
        origin = (stored.origin as DatabaseOrigin) ?? 'opff';
        notes.push('The product database was unreachable, so saved product information was used.');
        log('database unavailable, using stale cache', { error: (err as Error).message });
      } else throw err;
    }
  }

  // 2. Bounded research for missing public facts (pet products only, once per product per freshness window).
  let scope = classifyScope({ origin, categoriesTags: facts.classificationSignals.map((s) => s.text), texts: [facts.productName?.value ?? ''], adequacy: facts.adequacy?.value });
  const needsResearch = o.allowFetch && config.researchEnabled && config.aiEnabled && scope.status !== 'out_of_scope' && origin !== 'off' && origin !== 'obf' && origin !== 'opf' &&
    missingInfo(facts, scope, scope.category).some((r) => r.purpose !== 'front' || !facts.productName) && !facts.sources.some((s) => s.sourceType === 'manufacturer' || s.sourceType === 'retailer_or_web');
  if (needsResearch) {
    await setStatus(deps, o.uid, o.scanId, SCAN_STATUS.researching, 'Looking for the manufacturer’s label information', 35);
    try {
      await consumeQuota(db, o.uid, 'research', config.limits, now);
      await consumeAiBudget(db, config.limits, now);
      const r = await deps.sources.research({ apiKey: config.openaiApiKey(), model: config.researchModel, gtin14: gtin, barcode: o.barcode.digits, knownName: facts.productName?.value, knownBrand: facts.brand?.value, userAgent: config.userAgent, now });
      if (r.facts) {
        const merged = fillMissing(facts, { ...r.facts, sources: r.sources });
        facts = merged.facts;
        fetchedPublic = fetchedPublic || merged.filled.length > 0;
        if (origin === 'label' && merged.filled.length) origin = 'web';
      }
      log('research', { filled: r.facts ? Object.keys(r.facts) : [], discarded: r.discarded });
    } catch (err) {
      // Research is optional: keep going with what we have.
      log('research skipped', { reason: err instanceof QuotaError ? err.kind : (err as Error).message });
    }
  }

  // 3. Save public facts (never the owner's private label data).
  let factsVersion = stored?.factsVersion ?? 0;
  if (fetchedPublic || !stored) {
    scope = classifyScope({ origin, categoriesTags: facts.classificationSignals.map((s) => s.text), texts: [facts.productName?.value ?? ''], adequacy: facts.adequacy?.value });
    if (facts.sources.length) factsVersion = await writeProduct(db, { facts, scope, origin, previous: stored, now, traceId: o.traceId });
  }

  // 4. The owner's own label photos fill remaining gaps (private, unreviewed).
  const extractions = await readLabelExtractions(db, o.uid, gtin);
  let labelUsed = false;
  for (const e of extractions) {
    if (e.label.status !== 'processed') continue;
    const src: SourceRef = { sourceId: `label:${e.photoId}`, sourceType: 'user_label', sourceName: 'Your label photo', retrievedAt: e.processedAt.toISOString(), matchConfidence: 'exact_barcode' };
    const merged = fillMissing(facts, labelToFacts(e.label, src));
    if (merged.filled.length) labelUsed = true;
    facts = merged.facts;
  }
  scope = classifyScope({ origin, categoriesTags: facts.classificationSignals.map((s) => s.text), texts: [facts.productName?.value ?? ''], adequacy: facts.adequacy?.value });

  // 5. Recall check (FDA), cached for a few hours; skipped for out-of-scope products.
  let recall: RecallCheck | null = null;
  if (scope.status !== 'out_of_scope') {
    const cachedRecall = stored?.recall && stored.recallCheckedAt && now.getTime() - stored.recallCheckedAt.getTime() < config.recallFreshHours * 3600000 ? stored.recall : null;
    if (cachedRecall) recall = cachedRecall;
    else {
      await setStatus(deps, o.uid, o.scanId, SCAN_STATUS.checkingAlerts, 'Checking FDA recall records', 60);
      recall = await deps.sources.checkRecalls({ brand: facts.brand?.value, productName: facts.productName?.value, gtin14: gtin }, now);
      if (recall.status !== 'unavailable' && facts.sources.length) await writeRecall(db, gtin, recall, now);
    }
  }

  // 6. Assess. General score is pet-independent; personal fit uses the selected pet only.
  await setStatus(deps, o.uid, o.scanId, SCAN_STATUS.assessing, 'Preparing the assessment', 85);
  const pet: PetProfile | null = await readPet(db, o.uid, o.petId);
  const general = assessGeneral(facts, scope);
  for (const n of notes) general.findings.push({ kind: 'info', text: n, evidence: 'Purrbi', rule: 'G-NOTE' });
  if (labelUsed) general.findings.push({ kind: 'info', text: 'Some details come from your own label photo, read by AI and not reviewed by Purrbi. Check them against the package.', evidence: 'Your label photo', rule: 'G-LABEL' });
  const personal = personalize(pet, facts, scope, general, recall, now);
  const summary = buildSummary(facts, scope, general, personal, recall);
  const state = overallState(general, recall, scope);
  const requests: PhotoRequest[] = o.skipPhotos ? [] : missingInfo(facts, scope, general.category);

  const status = scope.status === 'out_of_scope' ? SCAN_STATUS.outOfScope : requests.length ? SCAN_STATUS.needsPhotos : SCAN_STATUS.complete;
  const statusMessage =
    status === SCAN_STATUS.outOfScope ? 'Outside Purrbi’s scope' : status === SCAN_STATUS.needsPhotos ? `Add ${requests.length === 1 ? 'a photo' : 'photos'} to finish the assessment` : 'Assessment ready';

  // 7. Save. A failed save is reported as such (never as "unknown product").
  try {
    await db.doc(scanPath(o.uid, o.scanId)).update({
      ...resultFields({ facts, scope, general, personal, recall, summary, state, photoRequests: requests, factsVersion, labelEvidenceUsed: labelUsed }),
      status,
      statusMessage,
      progress: 100,
      identitySource: origin,
      productFound: facts.sources.some((s) => s.sourceType === 'database' || s.sourceType === 'manufacturer' || s.sourceType === 'retailer_or_web'),
      errorCode: '',
      errorMessage: '',
      errorRetryable: false,
      assessedAt: Timestamp.fromDate(now),
      completedAt: status === SCAN_STATUS.needsPhotos ? null : Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    });
  } catch (err) {
    deps.log.error('save failed', { traceId: o.traceId, error: (err as Error).message });
    throw new JobError('save_failed', errorMessage('save_failed'), true);
  }
  log('scan assessed', { status, state, score: general.score, personal: personal.state, labelUsed, factsVersion });
}

async function firstFound(deps: Deps, barcode: NormalizedBarcode, now: Date): Promise<Extract<OpenFactsLookup, { found: true }> | null> {
  const dbs: OpenFactsDb[] = ['off', 'obf', 'opf'];
  const results = await Promise.allSettled(dbs.map((db) => deps.sources.lookupOpenFacts(db, barcode, deps.config.userAgent, now)));
  for (const r of results) if (r.status === 'fulfilled' && r.value.found) return r.value;
  return null;
}

// ---------------------------------------------------------------------------------------------

/** A label photo was added under users/{uid}/scans/{scanId}/photos/{photoId}. */
export async function processPhoto(deps: Deps, uid: string, scanId: string, photoId: string): Promise<void> {
  const { db, config } = deps;
  const scanRef = db.doc(scanPath(uid, scanId));
  const photoRef = scanRef.collection('photos').doc(photoId);
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
  const gtin = (claimed.scan.gtin as string) ?? normalizeBarcode(claimed.scan.barcode).gtin14;
  const purpose = String(claimed.photo.purpose ?? 'label');
  const photoFail = async (status: 'unreadable' | 'failed' | 'different_product' | 'rejected', message: string) => {
    await photoRef.update({ status, statusMessage: message, processedAt: Timestamp.fromDate(deps.now()), updatedAt: Timestamp.fromDate(deps.now()) });
  };

  try {
    if (!config.aiEnabled) {
      await photoFail('failed', 'Label reading is not switched on yet.');
    } else {
      const count = (await scanRef.collection('photos').count().get()).data().count;
      if (count > config.limits.maxPhotosPerScan) { // count includes this photo
        await photoFail('rejected', `A scan can have up to ${config.limits.maxPhotosPerScan} photos.`);
      } else {
        await consumeQuota(db, uid, 'photos', config.limits, now);
        await consumeAiBudget(db, config.limits, now);
        if (!deps.readImage) throw new Error('image reader not configured');
        const image = await deps.readImage(String(claimed.photo.imageUrl ?? ''), uid);
        const label = await deps.sources.extractLabel({ apiKey: config.openaiApiKey(), model: config.visionModel, imageBase64: image.base64, mimeType: image.mimeType, purpose: purposeText(purpose), scanGtin14: gtin });
        deps.log.info('label extracted', { traceId, uid, scanId, photoId, status: label.status, panels: label.panels, rejected: label.rejected });
        if (label.status === 'processed') {
          await saveLabelExtraction(db, uid, gtin, { photoId, scanId, purpose, processedAt: deps.now(), label });
          await photoRef.update({
            status: 'processed',
            statusMessage: 'Label read',
            panels: label.panels,
            fieldsFound: [label.ingredients.length ? 'ingredients' : '', label.guaranteedAnalysis.length ? 'guaranteed analysis' : '', label.adequacy ? 'adequacy statement' : '', label.calories.length ? 'calories' : '', label.productName ? 'product name' : ''].filter(Boolean),
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
    await runAssessment(deps, { uid, scanId, traceId, barcode: normalizeBarcode(claimed.scan.barcode), petId: (claimed.scan.petId as string) ?? null, allowFetch: false, skipPhotos: claimed.scan.skipPhotos === true });
  } catch (err) {
    await failScan(deps, uid, scanId, traceId, err);
  }
}

function purposeText(purpose: string): string {
  return { front: 'the front of the package (name, brand, species, product type)', ingredients: 'the ingredient list', nutrition: 'the guaranteed analysis, calorie content and nutritional adequacy statement' }[purpose] ?? 'the product label';
}

/** Client-requested actions on an existing scan: retry, skip photos, refresh personal fit for a pet. */
export async function handleScanUpdate(deps: Deps, uid: string, scanId: string, before: Record<string, unknown>, after: Record<string, unknown>): Promise<void> {
  const ref = deps.db.doc(scanPath(uid, scanId));
  const rising = (k: string) => before[k] !== true && after[k] === true;
  if (rising('retryRequested') && after.status === SCAN_STATUS.failed) {
    await processScan(deps, uid, scanId);
    return;
  }
  const traceId = (after.traceId as string) || randomUUID().slice(0, 12);
  const barcode = normalizeBarcode(after.barcode);
  if (!barcode.ok) return;
  if (rising('skipPhotos') && after.status === SCAN_STATUS.needsPhotos) {
    await ref.update({ status: SCAN_STATUS.complete, statusMessage: 'Assessment ready (some information is missing)', photoRequests: [], completedAt: Timestamp.fromDate(deps.now()), updatedAt: Timestamp.fromDate(deps.now()) });
    return;
  }
  if (rising('refreshPersonalRequested') && [SCAN_STATUS.complete, SCAN_STATUS.needsPhotos].includes(after.status as never)) {
    try {
      await runAssessment(deps, { uid, scanId, traceId, barcode, petId: (after.petId as string) ?? null, allowFetch: false, skipPhotos: after.skipPhotos === true || after.status === SCAN_STATUS.complete });
    } finally {
      await ref.update({ refreshPersonalRequested: false });
    }
  }
}

export { stripPrivate };
export type { StoredProduct, ScopeResult };
