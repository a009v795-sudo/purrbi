// Live end-to-end check of the DEPLOYED Purrbi backend (run from backend/functions; see live-e2e.yml).
// Creates temporary test accounts, scans real products discovered from Open Pet Food Facts search,
// records what the backend produced, checks cache reuse, pet switching and account isolation, then
// deletes the test accounts (which also exercises cleanupDeletedUser).
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(join(process.cwd(), 'package.json'));
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const projectId = process.env.FIREBASE_PROJECT;
if (!projectId) throw new Error('FIREBASE_PROJECT is required');
initializeApp({ projectId });
const db = getFirestore();
const auth = getAuth();
const UA = 'Purrbi/0.1 (live e2e)';
const report = { projectId, startedAt: new Date().toISOString(), scans: [], checks: {} };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TERMINAL = new Set(['complete', 'needs_photos', 'out_of_scope', 'failed']);

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.json();
}

async function discover(host, category, n = 3) {
  const fields = 'code,product_name,brands,categories_tags,ingredients_text';
  try {
    const j = await getJson(`https://${host}/api/v2/search?categories_tags_en=${category}&fields=${fields}&page_size=20&sort_by=unique_scans_n`);
    return (j.products ?? []).filter((p) => /^\d{8,14}$/.test(p.code ?? '') && p.ingredients_text).slice(0, n);
  } catch (e) {
    report.checks[`discover_${category}`] = String(e);
    return [];
  }
}

async function scan(uid, barcode, petId, label) {
  const t0 = Date.now();
  const ref = await db.collection(`users/${uid}/scans`).add({ barcode, ...(petId ? { petId } : {}), source: 'manual', status: 'queued', createdAt: FieldValue.serverTimestamp() });
  let d;
  for (let i = 0; i < 120; i++) {
    await sleep(1000);
    d = (await ref.get()).data();
    if (d && TERMINAL.has(d.status)) break;
  }
  const row = {
    label, barcode, scanId: ref.id, seconds: Math.round((Date.now() - t0) / 1000),
    status: d?.status, errorCode: d?.errorCode, traceId: d?.traceId, productFound: d?.productFound, identitySource: d?.identitySource,
    productName: d?.productName, brand: d?.brand, species: d?.productSpecies, category: d?.productCategory, scope: d?.scope, outOfScopeKind: d?.outOfScopeKind,
    resultState: d?.resultState, score: d?.scoreAvailable ? d.score : null, scoreProvisional: d?.scoreProvisional, scoreWithheldReason: d?.scoreWithheldReason,
    missingInfo: d?.missingInfo, recallStatus: d?.recallStatus, recallSummary: d?.recallSummary,
    personalState: d?.personalState, personalHeadline: d?.personalHeadline, ingredients: (d?.ingredientNotes ?? []).length, nutritionRows: (d?.nutrition ?? []).length,
    sources: (d?.sources ?? []).map((s) => `${s.name} (${s.match})`),
  };
  report.scans.push(row);
  console.log(JSON.stringify(row));
  return { ref, data: d };
}

async function restIdToken(email, password) {
  const key = process.env.FIREBASE_WEB_API_KEY;
  if (!key) return null;
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${key}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  if (!res.ok) throw new Error(`sign-in failed: HTTP ${res.status}`);
  return (await res.json()).idToken;
}

const stamp = Date.now();
const pw = `Pw-${stamp}-${Math.random().toString(36).slice(2)}`;
const users = [];
try {
  const a = await auth.createUser({ email: `purrbi-e2e-a-${stamp}@example.com`, password: pw });
  const b = await auth.createUser({ email: `purrbi-e2e-b-${stamp}@example.com`, password: pw });
  users.push(a, b);
  await db.doc(`users/${a.uid}/pets/catA`).set({ name: 'Test Cat (chicken allergy)', species: 'cat', approxAgeMonths: 48, ageCapturedAt: new Date(), allergiesStatus: 'reported', allergies: ['chicken'], profileVersion: 1 });
  await db.doc(`users/${a.uid}/pets/catB`).set({ name: 'Test Cat (no allergies)', species: 'cat', approxAgeMonths: 48, ageCapturedAt: new Date(), allergiesStatus: 'none_reported', profileVersion: 1 });
  await db.doc(`users/${a.uid}/pets/dogA`).set({ name: 'Test Puppy', species: 'dog', approxAgeMonths: 5, ageCapturedAt: new Date(), expectedAdultSize: 'xlarge', allergiesStatus: 'none_reported', profileVersion: 1 });

  const catFoods = await discover('world.openpetfoodfacts.org', 'cat-food');
  const dogFoods = await discover('world.openpetfoodfacts.org', 'dog-food');
  const treats = [...(await discover('world.openpetfoodfacts.org', 'dog-treats', 1)), ...(await discover('world.openpetfoodfacts.org', 'cat-treats', 1))];
  const supplements = [...(await discover('world.openpetfoodfacts.org', 'dog-supplements', 1)), ...(await discover('world.openpetfoodfacts.org', 'cat-supplements', 1))];
  const human = await discover('world.openfoodfacts.org', 'breakfast-cereals', 1);
  report.checks.discovered = { catFoods: catFoods.map((p) => p.code), dogFoods: dogFoods.map((p) => p.code), treats: treats.map((p) => p.code), supplements: supplements.map((p) => p.code), human: human.map((p) => p.code) };

  let firstFood;
  for (const p of catFoods) {
    const r = await scan(a.uid, p.code, 'catA', `cat food: ${p.product_name ?? ''}`);
    firstFood ??= r;
  }
  for (const p of dogFoods) await scan(a.uid, p.code, 'dogA', `dog food: ${p.product_name ?? ''}`);
  for (const p of treats) await scan(a.uid, p.code, null, `treat: ${p.product_name ?? ''}`);
  for (const p of supplements) await scan(a.uid, p.code, 'catB', `supplement: ${p.product_name ?? ''}`);
  for (const p of human) await scan(a.uid, p.code, 'catA', `human food: ${p.product_name ?? ''}`);
  await scan(a.uid, '2999999999991', 'catA', 'unknown barcode (GS1 restricted range)');

  if (firstFood?.data) {
    // Rescan: product facts should come from the cache (same evidence revision).
    const again = await scan(a.uid, firstFood.data.barcode, 'catA', 'rescan of first cat food');
    report.checks.rescanSameEvidence = again.data?.evidenceRevision === firstFood.data.evidenceRevision;
    // Switch pets: personal fit may change, the general assessment must not.
    if (['complete', 'needs_photos'].includes(firstFood.data.status)) {
      const before = (await firstFood.ref.get()).data();
      await firstFood.ref.update({ refreshPersonalRequested: true, petId: 'catB' });
      let after;
      for (let i = 0; i < 60; i++) {
        await sleep(1000);
        after = (await firstFood.ref.get()).data();
        if (after.refreshPersonalRequested === false && after.petId === 'catB') break;
      }
      report.checks.petSwitch = {
        before: { pet: before.petName, personal: before.personalState, score: before.score, scoreAvailable: before.scoreAvailable },
        after: { pet: after.petName, personal: after.personalState, score: after.score, scoreAvailable: after.scoreAvailable },
        generalUnchanged: before.score === after.score && JSON.stringify(before.scoreComponents) === JSON.stringify(after.scoreComponents),
      };
    }
  }

  // Account isolation through the real security rules (needs the public web API key).
  const tokenA = await restIdToken(a.email, pw);
  const tokenB = await restIdToken(b.email, pw);
  if (tokenA && tokenB && firstFood) {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${a.uid}/scans/${firstFood.ref.id}`;
    const own = await fetch(url, { headers: { Authorization: `Bearer ${tokenA}` } });
    const other = await fetch(url, { headers: { Authorization: `Bearer ${tokenB}` } });
    const write = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/products/${firstFood.data.gtin}?updateMask.fieldPaths=productName`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${tokenA}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: { productName: { stringValue: 'overwritten by client' } } }),
    });
    report.checks.isolation = { ownerRead: own.status, otherUserRead: other.status, clientProductWrite: write.status };
  } else {
    report.checks.isolation = 'skipped: FIREBASE_WEB_API_KEY not provided';
  }
} finally {
  for (const u of users) await auth.deleteUser(u.uid).catch((e) => console.error('cleanup failed', u.uid, e.message));
  if (users[0]) {
    await sleep(15000);
    report.checks.cleanupDeletedUser = (await db.collection(`users/${users[0].uid}/scans`).limit(1).get()).empty ? 'user data removed' : 'user data still present after 15 s';
  }
  report.finishedAt = new Date().toISOString();
  writeFileSync(process.env.LIVE_REPORT_PATH ?? 'live-e2e-report.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.checks, null, 2));
}
