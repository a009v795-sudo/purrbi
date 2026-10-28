// Scan-job lifecycle against the Firestore emulator with MOCKED sources (no network, no AI).
// Every mocked product is a labelled TEST FIXTURE; these tests check states, persistence, privacy
// and error handling — not real product data (see test/live for live contract tests).
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { ValidatedLabel } from '../../src/ai/labelExtract';
import { gs1CheckDigit, type NormalizedBarcode } from '../../src/domain/barcode';
import type { RecallCheck } from '../../src/domain/types';
import { DEFAULT_LIMITS, type RuntimeConfig } from '../../src/pipeline/config';
import { handleScanUpdate, processPhoto, processScan, type Deps, type Sources } from '../../src/pipeline/scanJob';
import type { OpenFactsDb, OpenFactsLookup } from '../../src/sources/openFacts';
import { SourceError } from '../../src/util/http';

const withCheck = (body: string) => body + gs1CheckDigit(body);
const BC = {
  treat: withCheck('50123456789'), // 12-digit UPC-A
  food: withCheck('501234567891'), // EAN-13
  human: withCheck('400638133393'),
  down: withCheck('9638507'),
  unknown: withCheck('761234567890'),
};

let db: Firestore;
let calls: Record<string, number>;
let opffDown = false;

const NOW = new Date('2026-10-28T12:00:00Z');
const src = (db: OpenFactsDb, code: string) => ({ sourceId: `${db}:${code}`, sourceType: 'database' as const, sourceName: 'TEST FIXTURE database', retrievedAt: NOW.toISOString(), matchConfidence: 'exact_barcode' as const });

const sources: Sources = {
  async lookupOpenFacts(dbName: OpenFactsDb, barcode: NormalizedBarcode): Promise<OpenFactsLookup> {
    calls[`lookup:${dbName}`] = (calls[`lookup:${dbName}`] ?? 0) + 1;
    if (dbName === 'opff' && opffDown && barcode.digits === BC.down) throw new SourceError('Open Pet Food Facts', 'timeout', 'no response');
    if (dbName === 'opff' && barcode.digits === BC.treat) {
      return { found: true, db: dbName, code: barcode.digits, source: src(dbName, barcode.digits), product: {
        product_name: 'TEST FIXTURE Salmon Cat Treats', brands: 'TESTBRAND', categories_tags: ['en:cat-food', 'en:cat-treats'],
        ingredients_text: 'Salmon, rice flour, sunflower oil, mixed tocopherols',
        nutriments: { proteins_100g: 30, proteins_unit: 'g', fat_100g: 12, fat_unit: 'g', fiber_100g: 3, fiber_unit: 'g', 'energy-kcal_100g': 350 },
      } };
    }
    if (dbName === 'opff' && (barcode.digits === BC.food || barcode.digits === BC.down)) {
      return { found: true, db: dbName, code: barcode.digits, source: src(dbName, barcode.digits), product: {
        product_name: 'TEST FIXTURE Chicken Dry Cat Food', brands: 'TESTBRAND', categories_tags: ['en:cat-food', 'en:dry-cat-food'],
        ingredients_text: 'Chicken, chicken meal, brown rice, chicken fat, taurine',
      } };
    }
    if (dbName === 'off' && barcode.digits === BC.human) {
      return { found: true, db: dbName, code: barcode.digits, source: src(dbName, barcode.digits), product: { product_name: 'TEST FIXTURE Hazelnut Spread', brands: 'TESTFOODS', categories_tags: ['en:spreads', 'en:sweet-spreads'] } };
    }
    return { found: false, db: dbName, tried: [barcode.digits] };
  },
  async checkRecalls(): Promise<RecallCheck> {
    calls.recall = (calls.recall ?? 0) + 1;
    return { status: 'none_found', summary: 'No FDA enforcement record found (mocked).', checkedAt: NOW.toISOString(), source: null, records: [] };
  },
  async research() {
    calls.research = (calls.research ?? 0) + 1;
    return { facts: null, sources: [], discarded: [], model: 'mock' };
  },
  async extractLabel(o): Promise<ValidatedLabel> {
    calls.extract = (calls.extract ?? 0) + 1;
    if (o.purpose.includes('front')) {
      return { status: 'different_product', reason: 'barcode mismatch (mocked)', panels: ['front', 'barcode'], productName: null, brand: null, species: 'unknown', productTypeClaim: null, ingredientsText: null, ingredients: [], guaranteedAnalysis: [], calories: [], adequacy: null, feedingDirections: null, uncertainFields: [], rejected: [], model: 'mock' };
    }
    return {
      status: 'processed', reason: '', panels: ['guaranteed_analysis', 'adequacy_statement', 'calorie_statement'], productName: null, brand: null, species: 'cat', productTypeClaim: null,
      ingredientsText: null, ingredients: [],
      guaranteedAnalysis: [
        { nutrient: 'crude_protein', label: 'Crude Protein', qualifier: 'min', value: 32, unit: '%' },
        { nutrient: 'crude_fat', label: 'Crude Fat', qualifier: 'min', value: 15, unit: '%' },
        { nutrient: 'crude_fiber', label: 'Crude Fiber', qualifier: 'max', value: 4, unit: '%' },
        { nutrient: 'moisture', label: 'Moisture', qualifier: 'max', value: 10, unit: '%' },
      ],
      calories: [{ kcal: 3900, per: 'kg' }],
      adequacy: { text: 'TEST FIXTURE is formulated to meet the nutritional levels established by the AAFCO Cat Food Nutrient Profiles for adult maintenance.', type: 'complete', species: 'cat', lifeStages: ['adult_maintenance'], method: 'formulation', largeSizeGrowth: null, style: 'aafco' },
      feedingDirections: null, uncertainFields: [], rejected: [], model: 'mock',
    };
  },
};

function deps(over: Partial<RuntimeConfig> = {}): Deps {
  const config: RuntimeConfig = { userAgent: 'test', openaiApiKey: () => 'test-key', visionModel: 'mock', researchModel: 'mock', aiEnabled: true, researchEnabled: false, productFreshDays: 30, recallFreshHours: 12, limits: DEFAULT_LIMITS, ...over };
  const silent = { info: () => undefined, warn: () => undefined, error: () => undefined };
  return { db, config, sources, now: () => NOW, log: silent, readImage: async () => ({ base64: 'AAAA', mimeType: 'image/jpeg', bytes: 3 }) };
}

async function newScan(uid: string, barcode: string, petId?: string) {
  const ref = await db.collection(`users/${uid}/scans`).add({ barcode, ...(petId ? { petId } : {}), status: 'queued', createdAt: Timestamp.fromDate(NOW) });
  return ref;
}
const read = async (ref: FirebaseFirestore.DocumentReference) => (await ref.get()).data()!;

beforeAll(() => {
  if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Run with the Firestore emulator (firebase emulators:exec).');
  if (!getApps().length) initializeApp({ projectId: 'demo-purrbi' });
  db = getFirestore();
  db.settings({ ignoreUndefinedProperties: true });
});

beforeEach(async () => {
  calls = {};
  opffDown = false;
  await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/demo-purrbi/databases/(default)/documents`, { method: 'DELETE' });
  await db.doc('users/u1/pets/cat1').set({ name: 'Miso', species: 'cat', birthDate: Timestamp.fromDate(new Date('2022-01-01')), allergiesStatus: 'reported', allergies: ['chicken'], profileVersion: 2 });
  await db.doc('users/u1/pets/cat2').set({ name: 'Pip', species: 'cat', birthDate: Timestamp.fromDate(new Date('2021-03-01')), allergiesStatus: 'none_reported', profileVersion: 1 });
});

describe('path A: enough information', () => {
  it('barcode → database → assessment → saved result', async () => {
    const ref = await newScan('u1', BC.treat, 'cat2');
    await processScan(deps(), 'u1', ref.id);
    const s = await read(ref);
    expect(s.status).toBe('complete');
    expect(s.productName).toBe('TEST FIXTURE Salmon Cat Treats');
    expect(s.productCategory).toBe('treat');
    expect(s.scoreAvailable).toBe(true);
    expect(s.photoRequests).toEqual([]);
    expect(s.traceId).toMatch(/^[0-9a-f-]{12}$/);
    expect(s.personalState).toBe('fits');
    expect(s.gtin).toBe(BC.treat.padStart(14, '0'));
    expect(s.barcode).toBe(BC.treat); // leading zeros preserved as scanned
    const product = (await db.doc(`products/${s.gtin}`).get()).data()!;
    expect(product.factsVersion).toBe(1);
    expect((await db.collection(`products/${s.gtin}/evidence`).get()).size).toBeGreaterThan(0);
  });
  it('reuses cached product data on a rescan', async () => {
    const a = await newScan('u1', BC.treat);
    await processScan(deps(), 'u1', a.id);
    const b = await newScan('u1', BC.treat);
    await processScan(deps(), 'u1', b.id);
    expect(calls['lookup:opff']).toBe(1);
    expect(calls.recall).toBe(1);
    expect((await read(b)).status).toBe('complete');
  });
});

describe('path B: missing label information', () => {
  it('asks only for what is missing, keeps partial findings, then completes from the photo', async () => {
    const ref = await newScan('u1', BC.food, 'cat1');
    await processScan(deps(), 'u1', ref.id);
    let s = await read(ref);
    expect(s.status).toBe('needs_photos');
    expect(s.missingInfo).toEqual(['nutrition']); // ingredients and identity already known
    expect(s.scoreAvailable).toBe(false);
    expect(s.personalFindings.some((f: { rule: string }) => f.rule === 'P-ALLERGEN')).toBe(true); // partial personal findings kept

    const photo = await ref.collection('photos').add({ purpose: 'nutrition', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/x/o/users%2Fu1%2Fuploads%2F1.jpg', status: 'uploaded', createdAt: Timestamp.fromDate(NOW) });
    await processPhoto(deps(), 'u1', ref.id, photo.id);
    s = await read(ref);
    const p = await read(photo);
    expect(p.status).toBe('processed');
    expect(p.fieldsFound).toEqual(expect.arrayContaining(['guaranteed analysis', 'adequacy statement', 'calories']));
    expect(s.status).toBe('complete');
    expect(s.labelEvidenceUsed).toBe(true);
    expect(s.scoreAvailable).toBe(true);
    expect(s.adequacySource).toMatch(/label photo/);
    expect(s.personalState).toBe('mismatch'); // chicken allergy vs chicken ingredients

    // The owner's label text stays private: it is not written into the shared product record.
    const product = (await db.doc(`products/${s.gtin}`).get()).data()!;
    expect(product.facts.adequacy).toBeUndefined();
    expect(product.facts.guaranteedAnalysis).toBeUndefined();
  });
  it('does not ask again for photos already processed (reuse on rescan)', async () => {
    const a = await newScan('u1', BC.food);
    await processScan(deps(), 'u1', a.id);
    const photo = await a.collection('photos').add({ purpose: 'nutrition', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/x/o/users%2Fu1%2Fuploads%2F1.jpg', status: 'uploaded', createdAt: Timestamp.fromDate(NOW) });
    await processPhoto(deps(), 'u1', a.id, photo.id);
    const b = await newScan('u1', BC.food);
    await processScan(deps(), 'u1', b.id);
    const s = await read(b);
    expect(s.status).toBe('complete');
    expect(s.photoRequests).toEqual([]);
    expect(calls.extract).toBe(1);
  });
  it('rejects a photo of a different product and keeps waiting', async () => {
    const ref = await newScan('u1', BC.food);
    await processScan(deps(), 'u1', ref.id);
    const photo = await ref.collection('photos').add({ purpose: 'front', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/x/o/users%2Fu1%2Fuploads%2F2.jpg', status: 'uploaded', createdAt: Timestamp.fromDate(NOW) });
    await processPhoto(deps(), 'u1', ref.id, photo.id);
    expect((await read(photo)).status).toBe('different_product');
    expect((await read(ref)).status).toBe('needs_photos');
  });
  it('lets the owner continue without photos', async () => {
    const ref = await newScan('u1', BC.food);
    await processScan(deps(), 'u1', ref.id);
    const before = await read(ref);
    await ref.update({ skipPhotos: true });
    await handleScanUpdate(deps(), 'u1', ref.id, before, await read(ref));
    const s = await read(ref);
    expect(s.status).toBe('complete');
    expect(s.missingInfo).toEqual(['nutrition']);
    expect(s.scoreAvailable).toBe(false);
  });
  it('treats an unknown barcode as "not found, add photos" — not as a failure', async () => {
    const ref = await newScan('u1', BC.unknown);
    await processScan(deps(), 'u1', ref.id);
    const s = await read(ref);
    expect(s.status).toBe('needs_photos');
    expect(s.productFound).toBe(false);
    expect(s.missingInfo).toEqual(expect.arrayContaining(['front', 'ingredients']));
    expect(s.errorCode).toBe('');
  });
});

describe('scope', () => {
  it('classifies a human food as out of scope with no pet recommendation', async () => {
    const ref = await newScan('u1', BC.human, 'cat1');
    await processScan(deps(), 'u1', ref.id);
    const s = await read(ref);
    expect(s.status).toBe('out_of_scope');
    expect(s.outOfScopeKind).toBe('human_food');
    expect(s.personalState).toBe('not_applicable');
    expect(s.scoreAvailable).toBe(false);
  });
});

describe('failures stay specific', () => {
  it('a source outage is a retryable failure, never "product unknown"', async () => {
    opffDown = true;
    const ref = await newScan('u1', BC.down);
    await processScan(deps(), 'u1', ref.id);
    let s = await read(ref);
    expect(s.status).toBe('failed');
    expect(s.errorCode).toBe('source_unavailable');
    expect(s.errorRetryable).toBe(true);
    opffDown = false;
    const before = s;
    await ref.update({ retryRequested: true });
    await handleScanUpdate(deps(), 'u1', ref.id, before, await read(ref));
    s = await read(ref);
    expect(s.status).toBe('needs_photos');
    expect(s.productName).toBe('TEST FIXTURE Chicken Dry Cat Food');
  });
  it('an invalid barcode fails without retry', async () => {
    const ref = await newScan('u1', '036000291453');
    await processScan(deps(), 'u1', ref.id);
    expect(await read(ref)).toMatchObject({ status: 'failed', errorCode: 'invalid_barcode', errorRetryable: false });
  });
  it('the daily quota stops new scans with its own code', async () => {
    const day = NOW.toISOString().slice(0, 10).replace(/-/g, '');
    await db.doc(`usage/u1_${day}`).set({ uid: 'u1', scans: DEFAULT_LIMITS.scansPerUserPerDay });
    const ref = await newScan('u1', BC.treat);
    await processScan(deps(), 'u1', ref.id);
    expect(await read(ref)).toMatchObject({ status: 'failed', errorCode: 'quota_exceeded' });
    expect(calls['lookup:opff']).toBeUndefined();
  });
  it('a duplicate trigger does not process the same scan twice', async () => {
    const ref = await newScan('u1', BC.treat);
    await Promise.all([processScan(deps(), 'u1', ref.id), processScan(deps(), 'u1', ref.id)]);
    expect(calls['lookup:opff']).toBe(1);
  });
});

describe('personal refresh', () => {
  it('switching pets changes the personal fit but not the general assessment', async () => {
    const ref = await newScan('u1', BC.food, 'cat2');
    await processScan(deps(), 'u1', ref.id);
    const photo = await ref.collection('photos').add({ purpose: 'nutrition', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/x/o/users%2Fu1%2Fuploads%2F1.jpg', status: 'uploaded', createdAt: Timestamp.fromDate(NOW) });
    await processPhoto(deps(), 'u1', ref.id, photo.id);
    const first = await read(ref);
    expect(first.personalState).toBe('fits');
    await ref.update({ refreshPersonalRequested: true, petId: 'cat1' });
    await handleScanUpdate(deps(), 'u1', ref.id, first, await read(ref));
    const second = await read(ref);
    expect(second.petName).toBe('Miso');
    expect(second.personalState).toBe('mismatch');
    expect(second.score).toBe(first.score);
    expect(second.scoreComponents).toEqual(first.scoreComponents);
    expect(second.evidenceRevision).toBe(first.evidenceRevision);
    expect(second.refreshPersonalRequested).toBe(false);
  });
});
