// End-to-end through the emulators with the REAL function code (lib/index.js) and REAL source
// adapters: Auth sign-up → client write checked by firestore.rules → Firestore trigger → job → result.
// Run: firebase emulators:exec --only auth,firestore,functions,storage --project demo-purrbi "npm run test:e2e"
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { initializeApp, deleteApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { addDoc, collection, connectFirestoreEmulator, doc, getDoc, getFirestore, serverTimestamp, updateDoc } from 'firebase/firestore';

let app: FirebaseApp;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

beforeAll(() => {
  app = initializeApp({ projectId: 'demo-purrbi', apiKey: 'demo-key', authDomain: 'demo-purrbi.firebaseapp.com' });
  connectAuthEmulator(getAuth(app), 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(getFirestore(app), '127.0.0.1', 8080);
});
afterAll(async () => app && deleteApp(app));

async function waitFor(path: string, done: (d: Record<string, unknown>) => boolean, timeoutMs = 90000) {
  const start = Date.now();
  let last: Record<string, unknown> | undefined;
  while (Date.now() - start < timeoutMs) {
    last = (await getDoc(doc(getFirestore(app), path))).data();
    if (last && done(last)) return last;
    await sleep(1000);
  }
  throw new Error(`timed out; last state: ${JSON.stringify(last)}`);
}

describe('real triggers', () => {
  it('a signed-in owner’s scan request is processed by the deployed code path', async () => {
    const cred = await createUserWithEmailAndPassword(getAuth(app), `e2e-${Date.now()}@example.test`, 'test-password-123');
    const uid = cred.user.uid;
    const ref = await addDoc(collection(getFirestore(app), `users/${uid}/scans`), { barcode: '036000291452', source: 'manual', status: 'queued', createdAt: serverTimestamp() });
    const s = await waitFor(ref.path, (d) => ['complete', 'needs_photos', 'failed', 'out_of_scope'].includes(String(d.status)));
    console.log('E2E result:', JSON.stringify({ status: s.status, errorCode: s.errorCode, errorRetryable: s.errorRetryable, traceId: s.traceId, gtin: s.gtin, message: s.statusMessage }));
    expect(s.traceId).toBeTruthy();
    expect(s.gtin).toBe('00036000291452');
    // In this sandbox the pet database host is blocked, so the honest outcome is a specific, retryable failure.
    if (s.status === 'failed') {
      expect(s.errorCode).toBe('source_unavailable');
      expect(s.errorRetryable).toBe(true);
      // The owner can request a retry through the rules; the trigger picks it up again.
      await updateDoc(ref, { retryRequested: true });
      const again = await waitFor(ref.path, (d) => d.retryRequested === false && ['complete', 'needs_photos', 'failed', 'out_of_scope'].includes(String(d.status)));
      expect(again.errorCode === 'source_unavailable' || again.status !== 'failed').toBe(true);
    }
  });
});
