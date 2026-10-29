// Live end-to-end check of the DEPLOYED development backend, done the way the phone app does it:
// test accounts sign up with email and password (Firebase Auth REST), and every read and write goes
// through the public Firestore and Storage REST APIs with that user's ID token, so the deployed
// security rules apply exactly as they do to the app. No service account or key is used.
//
// Real products are discovered from Open Pet Food Facts' own search (never invented). For each scan
// the report shows: identified → evidence (sources, HTTP outcomes, trace id) → assessment → saved →
// read back after a fresh sign-in (history). It also checks favorites, pet switching, cache reuse,
// duplicate protection, retry rules and account isolation, then deletes the test accounts.
//
//   FIREBASE_PROJECT=purrbi-49c21 node backend/tools/live-e2e.mjs
// The public web config (API key, bucket) is read from FIREBASE_WEB_API_KEY / FIREBASE_STORAGE_BUCKET
// or from the FlutterFlow export in app/ (it is the same public config the app ships with).
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { discover, search, UA } from './opff-discovery.mjs';
import { publish } from './report.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
// Where Open Pet Food Facts is unreachable, products and package photos come from the live-fixtures
// branch (collected on GitHub by the live-fixtures workflow): LIVE_FIXTURES_DIR=<checkout>.
const FIXTURES = process.env.LIVE_FIXTURES_DIR;
const TERMINAL = new Set(['complete', 'needs_photos', 'out_of_scope', 'failed']);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function clientConfig() {
  const cfg = { projectId: process.env.FIREBASE_PROJECT, apiKey: process.env.FIREBASE_WEB_API_KEY, bucket: process.env.FIREBASE_STORAGE_BUCKET };
  const dart = join(root, 'app/lib/backend/firebase/firebase_config.dart');
  if (existsSync(dart)) {
    const t = readFileSync(dart, 'utf8');
    cfg.apiKey ??= /apiKey:\s*"([^"]+)"/.exec(t)?.[1];
    cfg.projectId ??= /projectId:\s*"([^"]+)"/.exec(t)?.[1];
    cfg.bucket ??= /storageBucket:\s*"([^"]+)"/.exec(t)?.[1];
  }
  const gs = join(root, 'app/android/app/google-services.json');
  if (existsSync(gs)) {
    const j = JSON.parse(readFileSync(gs, 'utf8'));
    cfg.projectId ??= j.project_info?.project_id;
    cfg.bucket ??= j.project_info?.storage_bucket;
    cfg.apiKey ??= j.client?.[0]?.api_key?.[0]?.current_key;
  }
  if (!cfg.projectId || !cfg.apiKey || !cfg.bucket) throw new Error('Firebase web config not found (FIREBASE_PROJECT, FIREBASE_WEB_API_KEY, FIREBASE_STORAGE_BUCKET or the app/ export).');
  return cfg;
}

const cfg = clientConfig();
const FS = `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/(default)/documents`;
const docName = (path) => `projects/${cfg.projectId}/databases/(default)/documents/${path}`;
const report = { kind: 'live-e2e', projectId: cfg.projectId, startedAt: new Date().toISOString(), scans: [], checks: {}, notes: [] };

// ---- Firestore REST value encoding ------------------------------------------------------------
function toValue(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toValue) } };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'object') return { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, toValue(x)])) } };
  return { stringValue: String(v) };
}
function fromValue(v) {
  if (!v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values ?? []).map(fromValue);
  if ('mapValue' in v) return fromFields(v.mapValue.fields ?? {});
  return null;
}
const fromFields = (f) => Object.fromEntries(Object.entries(f ?? {}).map(([k, v]) => [k, fromValue(v)]));
const fields = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, toValue(v)]));
const newId = () => randomBytes(15).toString('base64url').replace(/[^A-Za-z0-9]/g, '').slice(0, 20);

// ---- HTTP helpers ----------------------------------------------------------------------------
async function call(method, url, { token, body, headers = {}, raw = false } = {}) {
  const res = await fetch(url, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body && !raw ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: body ? (raw ? body : JSON.stringify(body)) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, json };
}

const auth = (path, body) => call('POST', `https://identitytoolkit.googleapis.com/v1/accounts:${path}?key=${cfg.apiKey}`, { body });

async function signUp(label) {
  const email = `purrbi-e2e-${label}-${Date.now()}@example.com`;
  const password = `Pw-${randomBytes(12).toString('hex')}`;
  const r = await auth('signUp', { email, password, returnSecureToken: true });
  if (r.status !== 200) throw new Error(`sign-up failed: HTTP ${r.status} ${r.json?.error?.message ?? ''}`);
  return { label, email, password, uid: r.json.localId, token: r.json.idToken };
}
async function signIn(u) {
  const r = await auth('signInWithPassword', { email: u.email, password: u.password, returnSecureToken: true });
  if (r.status !== 200) throw new Error(`sign-in failed: HTTP ${r.status}`);
  u.token = r.json.idToken;
  return u;
}

const getDoc = (u, path) => call('GET', `${FS}/${path}`, { token: u?.token });
const commit = (u, writes) => call('POST', `${FS}:commit`, { token: u?.token, body: { writes } });
const patch = (u, path, data) => call('PATCH', `${FS}/${path}?${Object.keys(data).map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&')}&currentDocument.exists=true`, { token: u?.token, body: { fields: fields(data) } });
const create = (u, path, data, serverTimeFields = ['createdAt']) =>
  commit(u, [{ update: { name: docName(path), fields: fields(data) }, currentDocument: { exists: false }, updateTransforms: serverTimeFields.map((f) => ({ fieldPath: f, setToServerValue: 'REQUEST_TIME' })) }]);
const query = (u, parent, structuredQuery) => call('POST', `${FS}/${parent}:runQuery`, { token: u?.token, body: { structuredQuery } });

// ---- scans -------------------------------------------------------------------------------------
async function waitScan(u, path, until = (d) => TERMINAL.has(d.status) && d.explanationsStatus !== 'pending', timeoutMs = 240000) {
  const t0 = Date.now();
  let d = null;
  while (Date.now() - t0 < timeoutMs) {
    const r = await getDoc(u, path);
    if (r.status === 200) {
      d = fromFields(r.json.fields);
      if (until(d)) return { d, seconds: Math.round((Date.now() - t0) / 1000) };
    }
    await sleep(2000);
  }
  return { d, seconds: Math.round((Date.now() - t0) / 1000), timedOut: true };
}

function row(label, barcode, scanId, d, seconds) {
  return {
    label,
    barcode,
    scanId,
    seconds,
    status: d?.status,
    errorCode: d?.errorCode || undefined,
    errorRetryable: d?.errorRetryable || undefined,
    errorMessage: d?.errorMessage || undefined,
    traceId: d?.traceId,
    claimCount: d?.claimCount,
    duplicateDeliveries: d?.duplicateDeliveries ?? 0,
    identified: { productName: d?.productName, brand: d?.brand, species: d?.productSpecies, category: d?.productCategory, identitySource: d?.identitySource, productFound: d?.productFound },
    evidence: {
      sources: (d?.sources ?? []).map((s) => `${s.name} [${s.type}, ${s.match}]`),
      notes: d?.evidenceNotes ?? [],
      calls: (d?.sourceChecks ?? []).map((c) => `${c.source} ${c.host}${c.path} → ${c.httpStatus || c.outcome} (${c.ms} ms)`),
      job: d?.lastJob,
    },
    assessment: {
      resultState: d?.resultState,
      score: d?.scoreAvailable ? d.score : null,
      scoreLabel: d?.scoreLabel,
      provisional: d?.scoreProvisional,
      withheld: d?.scoreWithheldReason || undefined,
      summary: d?.summary,
      missingInfo: d?.missingInfo,
      recall: d?.recallStatus,
      ingredientExplanations: (d?.ingredientNotes ?? []).filter((n) => n.explanationKind !== 'none').length,
      nutritionLines: (d?.nutrition ?? []).length,
      supplement: d?.productCategory === 'supplement' ? { summary: d?.supplementSummary, purposes: (d?.supplementPurposes ?? []).map((p) => p.label), actives: (d?.supplementActives ?? []).map((a) => `${a.name} ${a.amountText} [${a.evidence}]`), limitations: (d?.supplementLimitations ?? []).length } : undefined,
      explanationsStatus: d?.explanationsStatus,
    },
    personal: { pet: d?.petName, state: d?.personalState, headline: d?.personalHeadline },
  };
}

async function scan(u, barcode, petId, label) {
  const id = newId();
  const path = `users/${u.uid}/scans/${id}`;
  const r = await create(u, path, { barcode, ...(petId ? { petId } : {}), source: 'manual', status: 'queued', clientVersion: 'live-e2e' });
  if (r.status !== 200) {
    report.scans.push({ label, barcode, createStatus: r.status, error: r.json?.error?.message });
    return null;
  }
  const { d, seconds, timedOut } = await waitScan(u, path);
  const out = row(label, barcode, id, d, seconds);
  if (timedOut) out.timedOut = true;
  report.scans.push(out);
  console.log(JSON.stringify({ label, status: out.status, traceId: out.traceId, product: out.identified.productName, score: out.assessment.score, seconds }));
  return { id, path, d };
}

async function uploadPhoto(u, scanId, bytes, contentType) {
  const name = `users/${u.uid}/scans/${scanId}/${newId()}.jpg`;
  const r = await call('POST', `https://firebasestorage.googleapis.com/v0/b/${cfg.bucket}/o?uploadType=media&name=${encodeURIComponent(name)}`, {
    raw: true,
    body: bytes,
    headers: { Authorization: `Firebase ${u.token}`, 'Content-Type': contentType },
  });
  if (r.status !== 200) return { status: r.status };
  const token = String(r.json?.downloadTokens ?? '').split(',')[0];
  return { status: 200, name, url: `https://firebasestorage.googleapis.com/v0/b/${cfg.bucket}/o/${encodeURIComponent(name)}?alt=media&token=${token}` };
}

async function photoBytes(photo) {
  if (typeof photo === 'string') {
    const img = await fetch(photo, { headers: { 'User-Agent': UA } }).catch(() => ({ ok: false, status: 'network' }));
    return img.ok ? { bytes: Buffer.from(await img.arrayBuffer()), source: photo } : { error: img.status, source: photo };
  }
  if (photo?.file && FIXTURES) return { bytes: readFileSync(join(FIXTURES, photo.file)), source: photo.source };
  return { error: photo?.fetch ?? 'missing', source: photo?.source };
}

// ---- run ---------------------------------------------------------------------------------------
const users = [];
try {
  const a = await signUp('a');
  const b = await signUp('b');
  users.push(a, b);
  report.checks.signUp = 'two test accounts created through Firebase Auth (email/password)';

  const pets = {
    catA: { name: 'Test Cat (chicken allergy)', species: 'cat', approxAgeMonths: 48, allergiesStatus: 'reported', allergies: ['chicken'], profileVersion: 1, onboardingComplete: true },
    catB: { name: 'Test Cat (no allergies)', species: 'cat', approxAgeMonths: 48, allergiesStatus: 'none_reported', profileVersion: 1, onboardingComplete: true },
    dogA: { name: 'Test Puppy', species: 'dog', approxAgeMonths: 5, expectedAdultSize: 'xlarge', allergiesStatus: 'none_reported', profileVersion: 1, onboardingComplete: true },
  };
  report.checks.petCreate = {};
  for (const [id, p] of Object.entries(pets)) report.checks.petCreate[id] = (await create(a, `users/${a.uid}/pets/${id}`, { ...p, ageCapturedAt: new Date() }, ['createdAt'])).status;

  const found = FIXTURES ? JSON.parse(readFileSync(join(FIXTURES, 'manifest.json'), 'utf8')) : await discover({ incompleteCount: 2 });
  report.discovery = {
    from: FIXTURES ? `live-fixtures branch (collected ${found.generatedAt})` : 'Open Pet Food Facts search (this run)',
    items: found.items,
    incomplete: (found.incomplete ?? []).map((p) => ({ code: p.code, name: p.name })),
    counts: found.counts,
  };

  const scans = {};
  for (const item of found.items) {
    const petId = item.label === 'cat food' ? 'catA' : item.label === 'dog food' ? 'dogA' : item.label === 'supplement' ? null : 'catB';
    scans[item.label] = await scan(a, item.code, petId, `${item.label}: ${item.name}`);
  }

  // Evidence fallbacks: products whose database record lacks the label. Purrbi first tries the
  // manufacturer's published information (research); if that is not enough it asks for photos, and
  // real photos of the package are uploaded through the owner's photo path, exactly as the app does.
  report.fallbacks = [];
  let photoDone = false;
  for (const p of (found.incomplete ?? []).slice(0, 2)) {
    const s = await scan(a, p.code, p.species === 'dog' ? 'dogA' : 'catB', `incomplete record: ${p.name}`);
    const fb = { barcode: p.code, name: p.name, firstResult: s?.d ? { status: s.d.status, missingInfo: s.d.missingInfo, sources: (s.d.sources ?? []).map((x) => `${x.name} [${x.type}]`) } : null, uploads: [] };
    if (s?.d?.status === 'needs_photos' && !photoDone) {
      photoDone = true;
      for (const photo of p.photos ?? p.images ?? []) {
        const got = await photoBytes(photo);
        if (!got.bytes) {
          fb.uploads.push({ image: got.source, fetch: got.error });
          continue;
        }
        const up = await uploadPhoto(a, s.id, got.bytes, 'image/jpeg');
        const photoDoc = `users/${a.uid}/photos/${newId()}`;
        const doc = up.status === 200 ? await create(a, photoDoc, { scanId: s.id, purpose: 'label', imageUrl: up.url, status: 'uploaded' }) : { status: up.status };
        const ph = doc.status === 200 ? await waitScan(a, photoDoc, (d) => !['uploaded', 'processing'].includes(d.status), 120000) : null;
        fb.uploads.push({ image: String(got.source).replace(/^.*\/products\//, 'opff:'), bytes: got.bytes.length, storageUpload: up.status, photoRequest: doc.status, photoStatus: ph?.d?.status, fieldsFound: ph?.d?.fieldsFound });
        const now = await waitScan(a, s.path);
        if (now.d?.status === 'complete') break;
      }
      const after = await waitScan(a, s.path);
      fb.afterPhotos = row(`after photos: ${p.name}`, p.code, s.id, after.d, after.seconds);
    }
    report.fallbacks.push(fb);
  }
  if (!report.fallbacks.length) report.notes.push('No product with an incomplete database record was available in this run.');

  // Retry path on the deployed backend: deploy-config.json's development switch RETRY_TEST_BARCODES
  // makes this barcode's first attempt fail like a source outage; the retry check below re-runs it.
  const retryCode = (JSON.parse(readFileSync(join(root, 'backend/deploy-config.json'), 'utf8')).functionParams?.RETRY_TEST_BARCODES ?? '').split(',')[0].trim();
  if (retryCode && !report.scans.some((x) => x.barcode === retryCode)) await scan(a, retryCode, 'dogA', 'retry test (first attempt fails on purpose)');

  // Unsupported product and unknown barcode.
  const human = found.humanFood ?? (FIXTURES ? null : (await search('world.openfoodfacts.org', 'categories_tags_en=breakfast-cereals')).map((x) => ({ code: x.code, name: x.product_name ?? '' }))[0]);
  if (human) await scan(a, human.code, 'catA', `human food: ${human.name}`);
  await scan(a, '2999999999991', 'catA', 'unknown barcode (GS1 restricted range)');

  const first = scans['cat food'];
  if (first?.d) {
    // Reuse: the same product again → no database or AI call when the saved assessment is current.
    const again = await scan(a, first.d.barcode, 'catA', 'rescan of the cat food');
    report.checks.reuse = { lastJob: again?.d?.lastJob, sameScore: again?.d?.score === first.d.score, calls: (again?.d?.sourceChecks ?? []).map((c) => `${c.host} ${c.httpStatus || c.outcome}`) };

    // Favorites (owner may change only this flag) and the favorites query used by the app.
    report.checks.favoriteSet = (await patch(a, first.path, { favorite: true })).status;
    const favs = await query(a, `users/${a.uid}`, { from: [{ collectionId: 'scans' }], where: { fieldFilter: { field: { fieldPath: 'favorite' }, op: 'EQUAL', value: { booleanValue: true } } }, orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }], limit: 20 });
    report.checks.favoritesQuery = { status: favs.status, found: (favs.json ?? []).some((x) => x.document?.name?.endsWith(first.id)) };

    // Pet switch: the personal verdict may change, the general assessment must not.
    if (['complete', 'needs_photos'].includes(first.d.status)) {
      const before = first.d;
      report.checks.petSwitchRequest = (await patch(a, first.path, { refreshPersonalRequested: true, petId: 'catB' })).status;
      const { d: after } = await waitScan(a, first.path, (d) => d.refreshPersonalRequested === false && d.petId === 'catB', 120000);
      report.checks.petSwitch = {
        before: { pet: before.petName, personal: before.personalState, score: before.score },
        after: { pet: after?.petName, personal: after?.personalState, score: after?.score },
        generalUnchanged: before.score === after?.score && JSON.stringify(before.scoreComponents) === JSON.stringify(after?.scoreComponents),
      };
    }

    // Restart: a fresh sign-in reads the saved result and the history list (what the app shows after a restart).
    await signIn(a);
    const reopened = await getDoc(a, first.path);
    const history = await query(a, `users/${a.uid}`, { from: [{ collectionId: 'scans' }], orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }], limit: 50 });
    report.checks.afterRestart = {
      reopenStatus: reopened.status,
      sameResult: reopened.status === 200 && fromFields(reopened.json.fields).score === first.d.score,
      historyStatus: history.status,
      historyCount: (history.json ?? []).filter((x) => x.document).length,
      allScansInHistory: report.scans.filter((s) => s.scanId).every((s) => (history.json ?? []).some((x) => x.document?.name?.endsWith(s.scanId))),
    };

    // Isolation and forgery through the deployed rules (expected: every one is refused).
    const gtin = first.d.gtin;
    const iso = {};
    iso.ownerRead = (await getDoc(a, first.path)).status;
    iso.otherUserRead = (await getDoc(b, first.path)).status;
    iso.otherUserList = (await query(b, `users/${a.uid}`, { from: [{ collectionId: 'scans' }], limit: 1 })).status;
    iso.otherUserFavorite = (await patch(b, first.path, { favorite: false })).status;
    iso.ownerForgeScore = (await patch(a, first.path, { score: 100 })).status;
    iso.ownerForgeStatus = (await patch(a, first.path, { status: 'complete' })).status;
    iso.ownerRequeue = (await patch(a, first.path, { status: 'queued' })).status;
    iso.ownerRetryCompleted = (await patch(a, first.path, { retryRequested: true })).status;
    iso.createWithResult = (await create(a, `users/${a.uid}/scans/${newId()}`, { barcode: first.d.barcode, status: 'complete', score: 100 })).status;
    iso.createForOtherUser = (await create(a, `users/${b.uid}/scans/${newId()}`, { barcode: first.d.barcode, status: 'queued' })).status;
    iso.productRead = (await getDoc(a, `products/${gtin}`)).status;
    iso.productWrite = (await patch(a, `products/${gtin}`, { productName: 'overwritten by client' })).status;
    iso.productReadSignedOut = (await getDoc(null, `products/${gtin}`)).status;
    iso.knowledgeRead = (await getDoc(a, 'knowledge/cat_ingredient_test')).status;
    iso.productMetaRead = (await getDoc(a, `productMeta/${gtin}`)).status;
    iso.usageRead = (await getDoc(a, `usage/${a.uid}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`)).status;
    const tiny = Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==', 'base64');
    iso.storageOwnFolder = (await uploadPhoto(a, 'isolation-check', tiny, 'image/jpeg')).status;
    iso.storageOtherFolder = (await call('POST', `https://firebasestorage.googleapis.com/v0/b/${cfg.bucket}/o?uploadType=media&name=${encodeURIComponent(`users/${b.uid}/x.jpg`)}`, { raw: true, body: tiny, headers: { Authorization: `Firebase ${a.token}`, 'Content-Type': 'image/jpeg' } })).status;
    iso.storageNotImage = (await call('POST', `https://firebasestorage.googleapis.com/v0/b/${cfg.bucket}/o?uploadType=media&name=${encodeURIComponent(`users/${a.uid}/x.txt`)}`, { raw: true, body: Buffer.from('not an image'), headers: { Authorization: `Firebase ${a.token}`, 'Content-Type': 'text/plain' } })).status;
    iso.photoPointingElsewhere = (await create(a, `users/${a.uid}/photos/${newId()}`, { scanId: first.id, purpose: 'label', imageUrl: `https://firebasestorage.googleapis.com/v0/b/${cfg.bucket}/o/users%2F${b.uid}%2Fx.jpg`, status: 'uploaded' })).status;
    iso.photoForOtherUsersScan = (await create(b, `users/${b.uid}/photos/${newId()}`, { scanId: first.id, purpose: 'label', imageUrl: `https://firebasestorage.googleapis.com/v0/b/${cfg.bucket}/o/users%2F${b.uid}%2Fx.jpg`, status: 'uploaded' })).status;
    const allowed = new Set(['ownerRead', 'productRead', 'storageOwnFolder']);
    iso.verdict = Object.entries(iso).every(([k, v]) => (allowed.has(k) ? v === 200 : v === 403 || v === 401)) ? 'all expected' : 'UNEXPECTED — see values';
    report.checks.isolation = iso;
  }

  // Duplicate protection: every scan was claimed exactly once.
  report.checks.duplicates = report.scans.filter((s) => s.scanId).map((s) => ({ scan: s.label.slice(0, 40), claimCount: s.claimCount, duplicateDeliveries: s.duplicateDeliveries }));

  // Retry path: every failed, retryable scan in this run is retried by its owner through the rules.
  const failed = report.scans.filter((s) => s.status === 'failed' && s.scanId && s.errorRetryable);
  report.checks.retry = failed.length ? [] : 'no failed scan occurred in this run (retry path verified on the emulator)';
  for (const f of failed.slice(0, 3)) {
    const path = `users/${a.uid}/scans/${f.scanId}`;
    const r = await patch(a, path, { retryRequested: true });
    const { d, seconds } = await waitScan(a, path, (x) => (x.claimCount ?? 0) > (f.claimCount ?? 1) && TERMINAL.has(x.status));
    report.checks.retry.push({ scan: f.label, firstAttempt: { errorCode: f.errorCode, message: f.errorMessage }, retryRequest: r.status, after: row(`after retry: ${f.label}`, f.barcode, f.scanId, d, seconds) });
  }
} catch (e) {
  report.error = String(e?.message ?? e);
  console.error(e);
} finally {
  for (const u of users) {
    const r = await auth('delete', { idToken: (await signIn(u).catch(() => u)).token });
    report.checks[`deleteAccount_${u.label}`] = r.status;
  }
  report.finishedAt = new Date().toISOString();
  writeFileSync(process.env.LIVE_REPORT_PATH ?? 'live-e2e-report.json', JSON.stringify(report, null, 2));
  publish('Live end-to-end report', report);
}
