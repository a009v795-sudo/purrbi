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
import { publish } from './report.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const UA = 'Purrbi/0.1 (live e2e; contact@valenciainnovations.com)';
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

// ---- product discovery (real products from the databases' own search) --------------------------
async function search(host, params) {
  const fieldsList = 'code,product_name,brands,categories_tags,ingredients_text,image_ingredients_url,image_nutrition_url,images,nutriments';
  const urls = [
    `https://${host}/api/v2/search?${params}&fields=${fieldsList}&page_size=40&sort_by=unique_scans_n`,
    `https://${host}/cgi/search.pl?action=process&${params.replace('categories_tags_en=', 'tagtype_0=categories&tag_contains_0=contains&tag_0=')}&json=1&page_size=40&fields=${fieldsList}`,
  ];
  for (const url of urls) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(25000) });
        if (res.status === 503 || res.status === 429) {
          await sleep(3000 * (attempt + 1));
          continue;
        }
        if (!res.ok) break;
        const products = ((await res.json()).products ?? []).filter((p) => /^\d{8,14}$/.test(p.code ?? ''));
        if (products.length) return products;
        break;
      } catch {
        await sleep(2000);
      }
    }
  }
  return [];
}

function rawImageUrls(p) {
  const c = p.code;
  const dir = c.length > 8 ? `${c.slice(0, 3)}/${c.slice(3, 6)}/${c.slice(6, 9)}/${c.slice(9)}` : c;
  return Object.keys(p.images ?? {}).filter((k) => /^\d+$/.test(k)).map((k) => `https://images.openpetfoodfacts.org/images/products/${dir}/${k}.jpg`);
}

async function discover() {
  const pickFood = (list) => list.find((p) => p.ingredients_text) ?? list[0];
  const catFoods = await search('world.openpetfoodfacts.org', 'categories_tags_en=cat-food');
  const dogFoods = await search('world.openpetfoodfacts.org', 'categories_tags_en=dog-food');
  const treats = [...(await search('world.openpetfoodfacts.org', 'categories_tags_en=dog-treats')), ...(await search('world.openpetfoodfacts.org', 'categories_tags_en=cat-treats'))];
  let supplements = [];
  for (const cat of ['dog-supplements', 'cat-supplements', 'pet-supplements', 'dietary-supplements-for-dogs', 'dietary-supplements-for-cats']) {
    supplements = await search('world.openpetfoodfacts.org', `categories_tags_en=${cat}`);
    if (supplements.length) break;
  }
  // A product whose database record lacks the label panels and has no selected panel images, but
  // does have contributor photos of the package: Purrbi must ask for photos, and those real
  // photos stand in for the owner's own.
  const photoCandidate = [...catFoods, ...dogFoods].find((p) => !p.ingredients_text && !p.image_ingredients_url && !p.image_nutrition_url && rawImageUrls(p).length >= 2);
  const usedCodes = new Set();
  const take = (p, label) => (p && !usedCodes.has(p.code) ? (usedCodes.add(p.code), { code: p.code, name: p.product_name ?? '', label }) : null);
  return {
    items: [
      take(pickFood(catFoods), 'cat food'),
      take(pickFood(dogFoods.filter((p) => !usedCodes.has(p.code))), 'dog food'),
      take(treats.find((p) => !usedCodes.has(p.code)), 'treat'),
      take(supplements.find((p) => !usedCodes.has(p.code)), 'supplement'),
    ].filter(Boolean),
    photoCandidate: photoCandidate ? { code: photoCandidate.code, name: photoCandidate.product_name ?? '', images: rawImageUrls(photoCandidate).slice(0, 3) } : null,
    counts: { catFoods: catFoods.length, dogFoods: dogFoods.length, treats: treats.length, supplements: supplements.length },
  };
}

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

  const found = await discover();
  report.discovery = found;

  const scans = {};
  for (const item of found.items) {
    const petId = item.label === 'cat food' ? 'catA' : item.label === 'dog food' ? 'dogA' : item.label === 'supplement' ? null : 'catB';
    scans[item.label] = await scan(a, item.code, petId, `${item.label}: ${item.name}`);
  }

  // Photo recovery: the backend asks for photos; real photos of the package are uploaded through the
  // owner's photo path (Storage upload + photo request), exactly as the app does.
  if (found.photoCandidate) {
    const s = await scan(a, found.photoCandidate.code, 'catB', `photo recovery: ${found.photoCandidate.name}`);
    const pr = { barcode: found.photoCandidate.code, before: s?.d ? { status: s.d.status, missingInfo: s.d.missingInfo } : null, uploads: [] };
    if (s?.d?.status === 'needs_photos') {
      for (const url of found.photoCandidate.images) {
        const img = await fetch(url, { headers: { 'User-Agent': UA } });
        if (!img.ok) {
          pr.uploads.push({ image: url, fetch: img.status });
          continue;
        }
        const bytes = Buffer.from(await img.arrayBuffer());
        const up = await uploadPhoto(a, s.id, bytes, 'image/jpeg');
        const photoId = newId();
        const doc = up.status === 200 ? await create(a, `${s.path}/photos/${photoId}`, { purpose: 'label', imageUrl: up.url, status: 'uploaded' }) : { status: up.status };
        const photo = doc.status === 200 ? await waitScan(a, `${s.path}/photos/${photoId}`, (d) => !['uploaded', 'processing'].includes(d.status), 120000) : null;
        pr.uploads.push({ image: url.replace(/^.*\/products\//, 'opff:'), storageUpload: up.status, photoRequest: doc.status, photoStatus: photo?.d?.status, fieldsFound: photo?.d?.fieldsFound });
        const now = await waitScan(a, s.path);
        if (now.d?.status === 'complete') break;
      }
      const after = await waitScan(a, s.path);
      pr.after = row(`photo recovery (after photos): ${found.photoCandidate.name}`, found.photoCandidate.code, s.id, after.d, after.seconds);
    }
    report.photoRecovery = pr;
  } else {
    report.notes.push('No product needing photo recovery with contributor photos was found in this run.');
  }

  // Unsupported product and unknown barcode.
  const human = (await search('world.openfoodfacts.org', 'categories_tags_en=breakfast-cereals'))[0];
  if (human) await scan(a, human.code, 'catA', `human food: ${human.product_name ?? ''}`);
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
    iso.photoPointingElsewhere = (await create(a, `${first.path}/photos/${newId()}`, { purpose: 'label', imageUrl: `https://firebasestorage.googleapis.com/v0/b/${cfg.bucket}/o/users%2F${b.uid}%2Fx.jpg`, status: 'uploaded' })).status;
    const allowed = new Set(['ownerRead', 'productRead', 'storageOwnFolder']);
    iso.verdict = Object.entries(iso).every(([k, v]) => (allowed.has(k) ? v === 200 : v === 403 || v === 401)) ? 'all expected' : 'UNEXPECTED — see values';
    report.checks.isolation = iso;
  }

  // Duplicate protection: every scan was claimed exactly once.
  report.checks.duplicates = report.scans.filter((s) => s.scanId).map((s) => ({ scan: s.label.slice(0, 40), claimCount: s.claimCount, duplicateDeliveries: s.duplicateDeliveries }));

  // Retry path: a failed, retryable scan in this run is retried through the rules.
  const failed = report.scans.find((s) => s.status === 'failed' && s.scanId);
  if (failed) {
    const path = `users/${a.uid}/scans/${failed.scanId}`;
    const r = await patch(a, path, { retryRequested: true });
    const { d } = await waitScan(a, path, (x) => x.retryRequested === false && TERMINAL.has(x.status));
    report.checks.retry = { request: r.status, after: d?.status, errorCode: d?.errorCode, claimCount: d?.claimCount };
  } else report.checks.retry = 'no failed scan occurred in this run (retry path verified on the emulator)';
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
