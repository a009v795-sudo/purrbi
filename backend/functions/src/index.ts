// Purrbi Cloud Functions (2nd gen, Node 22). No HTTP endpoints: the app talks to the backend only
// through Firestore documents, which Firestore security rules restrict to their owner.
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { logger } from 'firebase-functions';
import { defineBoolean, defineSecret, defineString } from 'firebase-functions/params';
import { setGlobalOptions } from 'firebase-functions/v2';
import { onDocumentCreated, onDocumentDeleted, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as functionsV1 from 'firebase-functions/v1';
import { DEFAULT_LIMITS, type RuntimeConfig } from './pipeline/config';
import { handleScanUpdate, processPhoto, processScan, realSources, type Deps } from './pipeline/scanJob';

initializeApp();
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

const REGION = 'us-central1';
// Every function runs as this dedicated identity (Firestore, the Storage bucket, Eventarc delivery and
// the OpenAI secret only); see backend/tools/gcp/setup-dev-access.sh. The full address comes from
// deploy-config.json runtimeServiceAccount (the deploy workflow writes it to .env.<projectId>): the
// Firebase CLI's secret-access check does not expand the "name@" short form.
const RUNTIME_SERVICE_ACCOUNT = defineString('RUNTIME_SERVICE_ACCOUNT', { default: 'purrbi-functions@' });
setGlobalOptions({ region: REGION, serviceAccount: RUNTIME_SERVICE_ACCOUNT });

const OPENAI_API_KEY = defineSecret('OPENAI_API_KEY');
const AI_ENABLED = defineBoolean('AI_ENABLED', { default: true });
const RESEARCH_ENABLED = defineBoolean('RESEARCH_ENABLED', { default: true });
const DATABASE_IMAGES_ENABLED = defineBoolean('DATABASE_IMAGES_ENABLED', { default: true });
const EXPLANATIONS_ENABLED = defineBoolean('EXPLANATIONS_ENABLED', { default: true });
const VISION_MODEL = defineString('OPENAI_VISION_MODEL', { default: 'gpt-4o-mini' });
const RESEARCH_MODEL = defineString('OPENAI_RESEARCH_MODEL', { default: 'gpt-4.1-mini' });
const EXPLAIN_MODEL = defineString('OPENAI_EXPLAIN_MODEL', { default: 'gpt-4.1-mini' });
const VERDICT_MODEL = defineString('OPENAI_VERDICT_MODEL', { default: 'gpt-4.1-mini' });
const VERDICTS_ENABLED = defineBoolean('VERDICTS_ENABLED', { default: true });
const USER_AGENT = defineString('SOURCE_USER_AGENT', { default: 'Purrbi/0.1 (development build; contact@valenciainnovations.com)' });
// The project's Storage bucket (deploy-config.json storageBucket, written to .env.<projectId> by the deploy
// workflow). Empty means the default bucket, which is what the emulators use.
const STORAGE_BUCKET = defineString('STORAGE_BUCKET', { default: '' });
// Development only: comma-separated barcodes whose first attempt fails like a source outage (retry test).
const RETRY_TEST_BARCODES = defineString('RETRY_TEST_BARCODES', { default: '' });
const storageBucket = () => getStorage().bucket(STORAGE_BUCKET.value() || undefined);

function config(): RuntimeConfig {
  return {
    userAgent: USER_AGENT.value(),
    openaiApiKey: () => OPENAI_API_KEY.value() || undefined,
    visionModel: VISION_MODEL.value(),
    researchModel: RESEARCH_MODEL.value(),
    explainModel: EXPLAIN_MODEL.value(),
    verdictModel: VERDICT_MODEL.value(),
    aiEnabled: AI_ENABLED.value(),
    researchEnabled: RESEARCH_ENABLED.value(),
    databaseImagesEnabled: DATABASE_IMAGES_ENABLED.value(),
    explanationsEnabled: EXPLANATIONS_ENABLED.value(),
    verdictsEnabled: VERDICTS_ENABLED.value(),
    productFreshDays: 30,
    recallFreshHours: 24, // openFDA enforcement data is updated weekly
    limits: DEFAULT_LIMITS,
    retryTestBarcodes: RETRY_TEST_BARCODES.value().split(',').map((s) => s.trim()).filter(Boolean),
  };
}

const STORAGE_URL = /^(?:https:\/\/firebasestorage\.googleapis\.com|http:\/\/(?:127\.0\.0\.1|localhost):\d+)\/v0\/b\/([^/]+)\/o\/([^?#]+)/;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

/** Reads an owner's uploaded label photo. Refuses URLs outside this project's bucket or the owner's folder. */
async function readImage(url: string, uid: string) {
  const m = STORAGE_URL.exec(url);
  if (!m) throw new Error('unsupported image URL');
  if (m[0].startsWith('http://') && process.env.FUNCTIONS_EMULATOR !== 'true') throw new Error('insecure image URL');
  const bucket = storageBucket();
  if (decodeURIComponent(m[1]) !== bucket.name) throw new Error('image is not in this project’s bucket');
  const path = decodeURIComponent(m[2]);
  if (!path.startsWith(`users/${uid}/`) || path.includes('..')) throw new Error('image is not in the owner’s folder');
  const file = bucket.file(path);
  const [meta] = await file.getMetadata();
  const bytes = Number(meta.size ?? 0);
  const mimeType = String(meta.contentType ?? '');
  if (!ALLOWED_TYPES.has(mimeType)) throw new Error(`unsupported image type ${mimeType}`);
  if (bytes > DEFAULT_LIMITS.maxPhotoBytes) throw new Error('image too large');
  const [buf] = await file.download();
  return { base64: buf.toString('base64'), mimeType, bytes };
}

function deps(): Deps {
  return { db, config: config(), sources: realSources, now: () => new Date(), log: logger, readImage };
}

const jobOptions = { region: REGION, memory: '512MiB' as const, timeoutSeconds: 300, maxInstances: 10, retry: false, secrets: [OPENAI_API_KEY] };

export const processScanJob = onDocumentCreated({ document: 'users/{uid}/scans/{scanId}', ...jobOptions }, async (event) => {
  await processScan(deps(), event.params.uid, event.params.scanId);
});

export const processScanPhoto = onDocumentCreated({ document: 'users/{uid}/photos/{photoId}', ...jobOptions }, async (event) => {
  await processPhoto(deps(), event.params.uid, event.params.photoId);
});

export const onScanRequestUpdated = onDocumentUpdated({ document: 'users/{uid}/scans/{scanId}', ...jobOptions }, async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after) return;
  await handleScanUpdate(deps(), event.params.uid, event.params.scanId, before, after);
});

/** Deleting a scan removes its photos, their files and the label text read from them. */
export const onScanDeleted = onDocumentDeleted({ document: 'users/{uid}/scans/{scanId}', region: REGION }, async (event) => {
  const { uid, scanId } = event.params;
  const photos = await db.collection(`users/${uid}/photos`).where('scanId', '==', scanId).get();
  const bucket = storageBucket();
  for (const p of photos.docs) {
    const m = STORAGE_URL.exec(String(p.get('imageUrl') ?? ''));
    const path = m ? decodeURIComponent(m[2]) : '';
    if (path.startsWith(`users/${uid}/`)) await bucket.file(path).delete({ ignoreNotFound: true });
    await p.ref.delete();
  }
  const gtin = event.data?.get('gtin');
  if (typeof gtin === 'string' && photos.size) {
    const update: Record<string, unknown> = {};
    for (const p of photos.docs) update[`extractions.${p.id}`] = FieldValue.delete();
    await db.doc(`users/${uid}/labelFacts/${gtin}`).update(update).catch(() => undefined);
  }
  logger.info('scan deleted', { uid, scanId, photos: photos.size });
});

/** Account deletion removes the owner's documents, photos and usage counters. */
export const cleanupDeletedUser = functionsV1.runWith({ serviceAccount: RUNTIME_SERVICE_ACCOUNT }).region(REGION).auth.user().onDelete(async (user) => {
  await db.recursiveDelete(db.doc(`users/${user.uid}`));
  await storageBucket().deleteFiles({ prefix: `users/${user.uid}/` });
  const usage = await db.collection('usage').where('uid', '==', user.uid).get();
  await Promise.all(usage.docs.map((d) => d.ref.delete()));
  logger.info('user data deleted', { uid: user.uid, usageDocs: usage.size });
});
