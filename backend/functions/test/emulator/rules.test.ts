// Security-rules tests against the Firestore and Storage emulators (no production data).
// Run: firebase emulators:exec --only firestore,storage --project demo-purrbi "npm run test:emulator"
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

let env: RulesTestEnvironment;
const ts = () => firebase.firestore.FieldValue.serverTimestamp();
const ALICE_URL = 'https://firebasestorage.googleapis.com/v0/b/demo-purrbi.appspot.com/o/users%2Falice%2Fuploads%2F1.jpg?alt=media&token=x';
const BOB_URL = 'https://firebasestorage.googleapis.com/v0/b/demo-purrbi.appspot.com/o/users%2Fbob%2Fuploads%2F1.jpg?alt=media&token=x';

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-purrbi',
    firestore: { rules: readFileSync(resolve(__dirname, '../../../firestore.rules'), 'utf8') },
    storage: { rules: readFileSync(resolve(__dirname, '../../../storage.rules'), 'utf8') },
  });
});
afterAll(async () => env?.cleanup());
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await db.doc('users/alice/scans/done').set({ barcode: '036000291452', status: 'complete', score: 80 });
    await db.doc('users/alice/scans/waiting').set({ barcode: '036000291452', status: 'needs_photos' });
    await db.doc('users/alice/scans/broken').set({ barcode: '036000291452', status: 'failed', errorRetryable: true });
    await db.doc('users/alice/scans/stuck').set({ barcode: '036000291452', status: 'failed', errorRetryable: false });
    await db.doc('users/alice/labelFacts/00036000291452').set({ gtin: '00036000291452' });
    await db.doc('products/00036000291452').set({ productName: 'TEST FIXTURE' });
  });
});

const alice = () => env.authenticatedContext('alice').firestore();
const bob = () => env.authenticatedContext('bob').firestore();
const anon = () => env.unauthenticatedContext().firestore();

describe('scan requests', () => {
  it('owner can create a valid request', async () => {
    await assertSucceeds(alice().collection('users/alice/scans').add({ barcode: '036000291452', petId: 'p1', source: 'camera', status: 'queued', createdAt: ts() }));
  });
  it('rejects result fields, wrong status, bad barcodes and client clocks', async () => {
    const c = alice().collection('users/alice/scans');
    await assertFails(c.add({ barcode: '036000291452', status: 'queued', createdAt: ts(), score: 99 }));
    await assertFails(c.add({ barcode: '036000291452', status: 'complete', createdAt: ts() }));
    await assertFails(c.add({ barcode: '03600029145A', status: 'queued', createdAt: ts() }));
    await assertFails(c.add({ barcode: '036000291452', status: 'queued', createdAt: new Date('2020-01-01') }));
  });
  it('isolates accounts', async () => {
    await assertFails(bob().doc('users/alice/scans/done').get());
    await assertFails(bob().collection('users/alice/scans').add({ barcode: '036000291452', status: 'queued', createdAt: ts() }));
    await assertFails(anon().doc('users/alice/scans/done').get());
    await assertSucceeds(alice().doc('users/alice/scans/done').get());
  });
  it('owner can only change request flags, never results', async () => {
    await assertFails(alice().doc('users/alice/scans/done').update({ score: 100 }));
    await assertFails(alice().doc('users/alice/scans/done').update({ status: 'queued' }));
    await assertSucceeds(alice().doc('users/alice/scans/done').update({ favorite: true }));
    await assertFails(alice().doc('users/alice/scans/done').update({ skipPhotos: true }));
    await assertSucceeds(alice().doc('users/alice/scans/waiting').update({ skipPhotos: true }));
    await assertSucceeds(alice().doc('users/alice/scans/broken').update({ retryRequested: true }));
    await assertFails(alice().doc('users/alice/scans/stuck').update({ retryRequested: true }));
    await assertSucceeds(alice().doc('users/alice/scans/done').update({ refreshPersonalRequested: true, petId: 'p2' }));
    await assertFails(bob().doc('users/alice/scans/done').update({ favorite: true }));
  });
  it('owner can delete their own scan only', async () => {
    await assertFails(bob().doc('users/alice/scans/done').delete());
    await assertSucceeds(alice().doc('users/alice/scans/done').delete());
  });
});

describe('label photos', () => {
  it('accepts a photo from the owner’s own storage folder while photos are needed', async () => {
    await assertSucceeds(alice().collection('users/alice/scans/waiting/photos').add({ purpose: 'nutrition', imageUrl: ALICE_URL, status: 'uploaded', createdAt: ts() }));
  });
  it('rejects other folders, other owners, server fields and edits', async () => {
    await assertFails(alice().collection('users/alice/scans/waiting/photos').add({ purpose: 'nutrition', imageUrl: BOB_URL, status: 'uploaded', createdAt: ts() }));
    await assertFails(alice().collection('users/alice/scans/waiting/photos').add({ purpose: 'nutrition', imageUrl: 'https://evil.example/x.jpg', status: 'uploaded', createdAt: ts() }));
    await assertFails(alice().collection('users/alice/scans/waiting/photos').add({ purpose: 'nutrition', imageUrl: ALICE_URL, status: 'processed', createdAt: ts() }));
    await assertFails(bob().collection('users/alice/scans/waiting/photos').add({ purpose: 'nutrition', imageUrl: ALICE_URL, status: 'uploaded', createdAt: ts() }));
    const ref = await alice().collection('users/alice/scans/waiting/photos').add({ purpose: 'front', imageUrl: ALICE_URL, status: 'uploaded', createdAt: ts() });
    await assertFails(ref.update({ status: 'processed' }));
  });
});

describe('pets', () => {
  const valid = { name: 'Miso', species: 'cat', weightKg: 4.2, weightValue: 4.2, weightUnit: 'kg', allergiesStatus: 'reported', allergies: ['chicken'], profileVersion: 1 };
  it('accepts a valid profile and enforces ownership', async () => {
    await assertSucceeds(alice().doc('users/alice/pets/p1').set(valid));
    await assertFails(bob().doc('users/alice/pets/p1').get());
    await assertFails(bob().doc('users/alice/pets/p2').set(valid));
  });
  it('rejects unsupported species, implausible values and unknown fields', async () => {
    await assertFails(alice().doc('users/alice/pets/p1').set({ ...valid, species: 'rabbit' }));
    await assertFails(alice().doc('users/alice/pets/p1').set({ ...valid, weightKg: 500 }));
    await assertFails(alice().doc('users/alice/pets/p1').set({ ...valid, allergiesStatus: 'maybe' }));
    await assertFails(alice().doc('users/alice/pets/p1').set({ ...valid, diagnosis: 'x' }));
    await assertFails(alice().doc('users/alice/pets/p1').set({ ...valid, name: '' }));
  });
});

describe('server-only collections', () => {
  it('products and evidence are readable when signed in and never writable by clients', async () => {
    await assertSucceeds(alice().doc('products/00036000291452').get());
    await assertFails(anon().doc('products/00036000291452').get());
    await assertFails(alice().doc('products/00036000291452').set({ productName: 'overwritten' }));
    await assertFails(alice().doc('products/00036000291452/evidence/x').set({ a: 1 }));
  });
  it('label facts are private and read-only; usage and system are closed', async () => {
    await assertSucceeds(alice().doc('users/alice/labelFacts/00036000291452').get());
    await assertFails(alice().doc('users/alice/labelFacts/00036000291452').set({ gtin: 'x' }));
    await assertFails(bob().doc('users/alice/labelFacts/00036000291452').get());
    await assertFails(alice().doc('usage/alice_20261028').get());
    await assertFails(alice().doc('system/aiUsage_20261028').set({ calls: 0 }));
  });
});

describe('storage', () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
  it('owner can upload an image to their own folder only', async () => {
    const a = env.authenticatedContext('alice').storage();
    await assertSucceeds(a.ref('users/alice/uploads/1.jpg').put(jpeg, { contentType: 'image/jpeg' }).then((x) => x));
    await assertFails(a.ref('users/bob/uploads/1.jpg').put(jpeg, { contentType: 'image/jpeg' }).then((x) => x));
    await assertFails(a.ref('users/alice/uploads/1.txt').put(jpeg, { contentType: 'text/plain' }).then((x) => x));
    await assertFails(a.ref('public/1.jpg').put(jpeg, { contentType: 'image/jpeg' }).then((x) => x));
    await assertFails(env.authenticatedContext('bob').storage().ref('users/alice/uploads/1.jpg').getDownloadURL());
  });
});
