// End-to-end through the emulators with the REAL function code (lib/index.js) and REAL source
// adapters: Auth sign-up → client write checked by firestore.rules → Firestore trigger → job → result,
// and account deletion → cleanupDeletedUser. With open internet (GitHub Actions) the real pet
// database is used; in a sandbox that blocks it the honest outcome is a specific retryable failure.
// Run: firebase emulators:exec --only auth,firestore,functions,storage --project demo-purrbi "npm run test:e2e"
import { writeFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { initializeApp, deleteApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, createUserWithEmailAndPassword, deleteUser, getAuth } from 'firebase/auth';
import { addDoc, collection, connectFirestoreEmulator, doc, getDoc, getFirestore, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { initializeApp as initAdmin, getApps as adminApps } from 'firebase-admin/app';
import { getFirestore as adminFirestore } from 'firebase-admin/firestore';

let app: FirebaseApp;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const TERMINAL = ['complete', 'needs_photos', 'failed', 'out_of_scope'];
const report: Record<string, unknown> = { ranAt: new Date().toISOString(), kind: 'emulator-e2e', network: process.env.GITHUB_ACTIONS ? 'github-actions (open internet)' : 'local' };

beforeAll(() => {
  app = initializeApp({ projectId: 'demo-purrbi', apiKey: 'demo-key', authDomain: 'demo-purrbi.firebaseapp.com' });
  connectAuthEmulator(getAuth(app), 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(getFirestore(app), '127.0.0.1', 8080);
  if (!adminApps().length) initAdmin({ projectId: 'demo-purrbi' });
});
afterAll(async () => {
  if (process.env.E2E_REPORT_PATH) writeFileSync(process.env.E2E_REPORT_PATH, JSON.stringify(report, null, 2));
  if (app) await deleteApp(app);
});

async function waitFor(path: string, done: (d: Record<string, unknown>) => boolean, timeoutMs = 120000) {
  const start = Date.now();
  let last: Record<string, unknown> | undefined;
  while (Date.now() - start < timeoutMs) {
    last = (await getDoc(doc(getFirestore(app), path))).data();
    if (last && done(last)) return last;
    await sleep(1000);
  }
  throw new Error(`timed out; last state: ${JSON.stringify(last)}`);
}

const pick = (s: Record<string, unknown>) => ({
  status: s.status, errorCode: s.errorCode, errorRetryable: s.errorRetryable, traceId: s.traceId, gtin: s.gtin, productFound: s.productFound,
  productName: s.productName, productCategory: s.productCategory, scoreAvailable: s.scoreAvailable, score: s.score, missingInfo: s.missingInfo,
  claimCount: s.claimCount, lastJob: s.lastJob, sourceChecks: s.sourceChecks, evidenceNotes: s.evidenceNotes,
});

describe('real triggers', () => {
  it('a signed-in owner’s scan request is processed by the deployed code path', async () => {
    const cred = await createUserWithEmailAndPassword(getAuth(app), `e2e-${Date.now()}@example.test`, 'test-password-123');
    const uid = cred.user.uid;
    const ref = await addDoc(collection(getFirestore(app), `users/${uid}/scans`), { barcode: '036000291452', source: 'manual', status: 'queued', createdAt: serverTimestamp() });
    const s = await waitFor(ref.path, (d) => TERMINAL.includes(String(d.status)) && d.explanationsStatus !== 'pending');
    report.scan = pick(s);
    console.log('E2E result:', JSON.stringify(report.scan));
    expect(s.traceId).toBeTruthy();
    expect(s.gtin).toBe('00036000291452');
    expect(s.claimCount).toBe(1);
    expect(Array.isArray(s.sourceChecks)).toBe(true);
    if (s.status === 'failed') {
      expect(s.errorCode).toBe('source_unavailable');
      expect(s.errorRetryable).toBe(true);
      // The owner can request a retry through the rules; the trigger picks it up again.
      await updateDoc(ref, { retryRequested: true });
      const again = await waitFor(ref.path, (d) => d.retryRequested === false && TERMINAL.includes(String(d.status)));
      report.retry = pick(again);
      expect(again.errorCode === 'source_unavailable' || again.status !== 'failed').toBe(true);
      expect(again.claimCount).toBe(2);
    }
  });

  it('deleting the account removes the owner’s data (cleanupDeletedUser)', async () => {
    const auth = getAuth(app);
    const cred = await createUserWithEmailAndPassword(auth, `e2e-del-${Date.now()}@example.test`, 'test-password-123');
    const uid = cred.user.uid;
    await setDoc(doc(getFirestore(app), `users/${uid}/pets/p1`), { name: 'Test Cat', species: 'cat', profileVersion: 1 });
    const scan = await addDoc(collection(getFirestore(app), `users/${uid}/scans`), { barcode: '036000291452', source: 'manual', status: 'queued', createdAt: serverTimestamp() });
    await waitFor(scan.path, (d) => TERMINAL.includes(String(d.status)));
    await deleteUser(cred.user);
    const admin = adminFirestore();
    let remaining = -1;
    for (let i = 0; i < 60; i++) {
      await sleep(1000);
      remaining = (await admin.collection(`users/${uid}/scans`).get()).size + (await admin.collection(`users/${uid}/pets`).get()).size;
      if (remaining === 0) break;
    }
    report.accountDeletion = { remainingDocs: remaining };
    expect(remaining).toBe(0);
  });
});
