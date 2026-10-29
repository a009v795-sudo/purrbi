// Scan-job lifecycle against the Firestore emulator with MOCKED sources (no network, no AI).
// Every mocked product is a labelled TEST FIXTURE; these tests check states, persistence, privacy
// and error handling — not real product data (see test/live for live contract tests).
import { initializeApp, getApps } from 'firebase-admin/app';
import { FieldValue, getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { LABEL_EXTRACTION_VERSION, type ValidatedLabel } from '../../src/ai/labelExtract';
import { gs1CheckDigit, type NormalizedBarcode } from '../../src/domain/barcode';
import type { ProductFacts, RecallCheck } from '../../src/domain/types';
import { explanationKey } from '../../src/knowledge/explain';
import { DEFAULT_LIMITS, type RuntimeConfig } from '../../src/pipeline/config';
import { handleScanUpdate, processPhoto, processScan, type Deps, type Sources } from '../../src/pipeline/scanJob';
import type { OpenFactsDb, OpenFactsLookup } from '../../src/sources/openFacts';
import { RESEARCH_VERSION } from '../../src/sources/research';
import { SCOPE_VERSION } from '../../src/domain/scope';
import { SourceError } from '../../src/util/http';

const withCheck = (body: string) => body + gs1CheckDigit(body);
const BC = {
  treat: withCheck('50123456789'), // 12-digit UPC-A
  food: withCheck('501234567891'), // EAN-13
  human: withCheck('400638133393'),
  down: withCheck('9638507'),
  unknown: withCheck('761234567890'),
  supplement: withCheck('501234567892'),
  imageOnly: withCheck('501234567893'),
  webOnly: withCheck('501234567894'),
  misfiled: withCheck('501234567896'), // a pet food filed in the human-food database, as 099482480882 is
  offDown: withCheck('501234567897'),
  misfiledFront: withCheck('501234567898'), // misfiled too, with a front image in the database
};

let db: Firestore;
let calls: Record<string, number>;
let opffDown = false;
let verdictMode: 'ok' | 'invalid' | 'fail' = 'ok';
let labelPatch: Partial<ValidatedLabel> | null = null; // changes the mocked reading of a label panel
let verdictInputs: string[] = [];

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
    if (dbName === 'opff' && barcode.digits === BC.supplement) {
      return { found: true, db: dbName, code: barcode.digits, source: src(dbName, barcode.digits), product: {
        product_name: 'TEST FIXTURE Hip & Joint Chews for Dogs', brands: 'TESTBRAND', categories_tags: ['en:dog-supplements'],
        ingredients_text: 'Active Ingredients per Chew: Glucosamine HCl 500 mg, MSM 250 mg, Chondroitin Sulfate 100 mg. Inactive Ingredients: Brewers Dried Yeast, Chicken Liver Flavor, Glycerin',
      } };
    }
    if (dbName === 'opff' && barcode.digits === BC.imageOnly) {
      return { found: true, db: dbName, code: barcode.digits, source: src(dbName, barcode.digits), product: {
        product_name: 'TEST FIXTURE Turkey Dry Dog Food', brands: 'TESTBRAND', categories_tags: ['en:dog-food', 'en:dry-dog-food'],
        ingredients_text: 'Turkey, oatmeal, barley, turkey fat',
        image_nutrition_url: 'https://images.openpetfoodfacts.org/images/products/501/234/567/8935/nutrition_en.3.400.jpg',
      } };
    }
    if (dbName === 'opff' && barcode.digits === BC.webOnly) {
      return { found: true, db: dbName, code: barcode.digits, source: src(dbName, barcode.digits), product: {
        product_name: 'TEST FIXTURE Lamb Dry Dog Food', brands: 'TESTBRAND', categories_tags: ['en:dog-food'],
      } };
    }
    // The shared backend's answer: not in the pet database, filed as human food elsewhere.
    if (dbName === 'opff' && (barcode.digits === BC.misfiled || barcode.digits === BC.offDown || barcode.digits === BC.misfiledFront)) return { found: false, db: dbName, tried: [barcode.digits], otherType: 'food' };
    if (dbName === 'off' && barcode.digits === BC.misfiledFront) {
      return { found: true, db: dbName, code: barcode.digits, source: src(dbName, barcode.digits), product: {
        product_type: 'food', product_name: 'TEST FIXTURE Grain free turkey recipe', brands: 'TESTSTORE', categories_tags: [],
        ingredients_text: 'Turkey, Turkey Meal, Peas, Chicken Fat (preserved with mixed tocopherols), Dried Plain Beet Pulp, Choline Chloride',
        image_front_url: 'https://images.openfoodfacts.org/images/products/501/234/567/8988/front_en.3.400.jpg',
      } };
    }
    if (dbName === 'off' && barcode.digits === BC.misfiled) {
      return { found: true, db: dbName, code: barcode.digits, source: src(dbName, barcode.digits), product: {
        product_type: 'food', product_name: 'TEST FIXTURE Grain free chicken & Pea recipe', brands: 'TESTSTORE', categories_tags: [],
        ingredients_text: 'Chicken, Chicken Meal, Peas, Turkey Meal, Chicken Fat (preserved with mixed tocopherols), Dried Plain Beet Pulp, Choline Chloride',
      } };
    }
    if (dbName === 'off' && barcode.digits === BC.offDown) throw new SourceError('Open Food Facts', 'rate_limited', 'rate limited', 429);
    if (dbName === 'off' && barcode.digits === BC.human) {
      return { found: true, db: dbName, code: barcode.digits, source: src(dbName, barcode.digits), product: { product_name: 'TEST FIXTURE Hazelnut Spread', brands: 'TESTFOODS', categories_tags: ['en:spreads', 'en:sweet-spreads'] } };
    }
    return { found: false, db: dbName, tried: [barcode.digits] };
  },
  async checkRecalls(): Promise<RecallCheck> {
    calls.recall = (calls.recall ?? 0) + 1;
    return { status: 'none_found', summary: 'No FDA enforcement record found (mocked).', checkedAt: NOW.toISOString(), source: null, records: [] };
  },
  async research(o) {
    calls.research = (calls.research ?? 0) + 1;
    if (o.barcode === BC.misfiled) {
      const page = { sourceId: `web:teststore.example:${o.gtin14}`, sourceType: 'retailer_or_web' as const, sourceName: 'teststore.example', url: 'https://teststore.example/grain-free-chicken-pea-dog-food', retrievedAt: NOW.toISOString(), matchConfidence: 'brand_and_product' as const, readerVersion: RESEARCH_VERSION };
      return { facts: { classificationSignals: [{ text: 'intended for dogs', source: page.sourceId, kind: 'research' as const }] }, sources: [page], discarded: [], model: 'mock' };
    }
    if (o.barcode !== BC.webOnly) return { facts: null, sources: [], discarded: ['model reported no matching product'], model: 'mock' };
    const source = { sourceId: `web:testbrand.example:${o.gtin14}`, sourceType: 'manufacturer' as const, sourceName: 'testbrand.example', url: 'https://testbrand.example/lamb', retrievedAt: NOW.toISOString(), matchConfidence: 'brand_and_product' as const, readerVersion: RESEARCH_VERSION };
    const facts: Partial<ProductFacts> = {
      ingredientsText: { value: 'Lamb, brown rice, lamb meal, chicken fat', source },
      ingredients: { value: ['Lamb', 'brown rice', 'lamb meal', 'chicken fat'], source },
      guaranteedAnalysis: { value: [
        { nutrient: 'crude_protein', label: 'Crude Protein', qualifier: 'min', value: 24, unit: '%' },
        { nutrient: 'crude_fat', label: 'Crude Fat', qualifier: 'min', value: 14, unit: '%' },
        { nutrient: 'crude_fiber', label: 'Crude Fiber', qualifier: 'max', value: 4, unit: '%' },
        { nutrient: 'moisture', label: 'Moisture', qualifier: 'max', value: 10, unit: '%' },
      ], source },
      adequacy: { value: { text: 'TEST FIXTURE is formulated to meet the nutritional levels established by the AAFCO Dog Food Nutrient Profiles for adult maintenance.', type: 'complete', species: 'dog', lifeStages: ['adult_maintenance'], method: 'formulation', largeSizeGrowth: null, style: 'aafco' }, source },
      classificationSignals: [],
    };
    return { facts, sources: [source], discarded: [], model: 'mock' };
  },
  async databaseImages(o) {
    calls.dbImages = (calls.dbImages ?? 0) + 1;
    if (o.needs.includes('front') && o.product.image_front_url) {
      // The front of the package, as both readings read it: "Dry Cat Food".
      const front = { sourceId: `off-image:${o.code}:front`, sourceType: 'database_image' as const, sourceName: 'Open Food Facts label image', url: o.product.image_front_url, retrievedAt: NOW.toISOString(), matchConfidence: 'exact_barcode' as const, readerVersion: LABEL_EXTRACTION_VERSION };
      return { read: ['front'], skipped: [], facts: [{ sources: [front], classificationSignals: [{ text: 'Dry Cat Food', source: front.sourceId, kind: 'photo' as const }, { text: 'for cats', source: front.sourceId, kind: 'photo' as const }] }] };
    }
    if (!o.product.image_nutrition_url) return { facts: [], read: [], skipped: ['no image'] };
    await o.beforeAiCall();
    const source = { sourceId: `opff-image:${o.code}:nutrition`, sourceType: 'database_image' as const, sourceName: 'Open Pet Food Facts label image', url: o.product.image_nutrition_url, retrievedAt: NOW.toISOString(), matchConfidence: 'exact_barcode' as const, readerVersion: LABEL_EXTRACTION_VERSION };
    return { read: ['nutrition'], skipped: [], facts: [{
      sources: [source], classificationSignals: [],
      guaranteedAnalysis: { value: [
        { nutrient: 'crude_protein', label: 'Crude Protein', qualifier: 'min', value: 26, unit: '%' },
        { nutrient: 'crude_fat', label: 'Crude Fat', qualifier: 'min', value: 15, unit: '%' },
        { nutrient: 'crude_fiber', label: 'Crude Fiber', qualifier: 'max', value: 4, unit: '%' },
        { nutrient: 'moisture', label: 'Moisture', qualifier: 'max', value: 10, unit: '%' },
      ], source },
      adequacy: { value: { text: 'TEST FIXTURE is formulated to meet the nutritional levels established by the AAFCO Dog Food Nutrient Profiles for all life stages.', type: 'complete', species: 'dog', lifeStages: ['all_life_stages'], method: 'formulation', largeSizeGrowth: null, style: 'aafco' }, source },
      calories: { value: [{ kcal: 3700, per: 'kg' }], source },
    }] };
  },
  async explain(o) {
    calls.explain = (calls.explain ?? 0) + 1;
    calls.explainTerms = (calls.explainTerms ?? 0) + o.terms.length;
    return o.terms.map((t) => ({
      key: explanationKey(o.species, t.kind, t.term), term: t.term, kind: t.kind, species: o.species, status: 'verified' as const,
      summary: `TEST FIXTURE explanation of ${t.term}.`, role: 'test role', sourceTitle: 'TEST FIXTURE source', sourceUrl: 'https://www.fda.gov/test-fixture',
      quote: 'TEST FIXTURE quote copied from the cited page.', reason: '', checkedAt: NOW.toISOString(), model: 'mock', version: 'test',
    }));
  },
  async verdict(o) {
    calls.verdict = (calls.verdict ?? 0) + 1;
    verdictInputs.push(JSON.stringify(o.input));
    if (verdictMode === 'fail') throw new Error('mock verdict outage');
    if (verdictMode === 'invalid') return { text: 'TEST FIXTURE: the safest food.', model: 'mock' };
    const subject = o.input.pet ? o.input.pet.name : 'a cat or dog';
    const score = o.input.assessment.score === null ? 'not available yet' : `${o.input.assessment.score}/100${o.input.assessment.label === 'Partial assessment' ? ', a partial assessment' : ''}`;
    const first = o.input.cautions[0]?.value ? ` (first: ${o.input.cautions[0].value})` : '';
    return { text: `TEST FIXTURE verdict: Purrbi’s label score for this product is ${score}; for ${subject}, check the cautions listed below${first} against what you already know before choosing it.`, model: 'mock' };
  },
  async extractLabel(o): Promise<ValidatedLabel> {
    calls.extract = (calls.extract ?? 0) + 1;
    if (o.purpose.includes('front')) {
      return { status: 'different_product', reason: 'barcode mismatch (mocked)', panels: ['front', 'barcode'], productName: null, brand: null, species: 'unknown', productTypeClaim: null, ingredientsText: null, ingredients: [], guaranteedAnalysis: [], calories: [], adequacy: null, feedingDirections: null, activeIngredients: [], uncertainFields: [], rejected: [], model: 'mock', version: LABEL_EXTRACTION_VERSION };
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
      feedingDirections: null, activeIngredients: [], uncertainFields: [], rejected: [], model: 'mock', version: LABEL_EXTRACTION_VERSION,
      ...labelPatch,
    };
  },
};

function deps(over: Partial<RuntimeConfig> = {}): Deps {
  const config: RuntimeConfig = {
    userAgent: 'test', openaiApiKey: () => 'test-key', visionModel: 'mock', researchModel: 'mock', explainModel: 'mock', verdictModel: 'mock',
    aiEnabled: true, researchEnabled: false, databaseImagesEnabled: true, explanationsEnabled: true, verdictsEnabled: true,
    productFreshDays: 30, recallFreshHours: 12, limits: DEFAULT_LIMITS, ...over,
  };
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
  verdictMode = 'ok';
  verdictInputs = [];
  labelPatch = null;
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
  it('re-reads a saved label statement with the current rules when the record is reused', async () => {
    const a = await newScan('u1', BC.treat);
    await processScan(deps(), 'u1', a.id);
    const gtin = (await read(a)).gtin;
    // A record saved before EU statements were understood keeps its old reading next to the label text.
    const old = { text: 'Aliment complet pour chats adultes', type: 'unclear', species: 'cat', lifeStages: [], method: 'unknown', largeSizeGrowth: null, style: 'other' };
    await db.doc(`products/${gtin}`).update({ 'facts.adequacy': { value: old, source: src('opff', BC.treat) } });
    const b = await newScan('u1', BC.treat);
    await processScan(deps(), 'u1', b.id);
    expect(calls['lookup:opff']).toBe(1); // reused, not fetched again
    expect((await read(b)).adequacySummary).toBe('Complete and balanced for adult maintenance');
  });
  it('drops a saved database analysis that cannot be per 100 g, and asks for the nutrition panel', async () => {
    const a = await newScan('u1', BC.treat);
    await processScan(deps(), 'u1', a.id);
    const gtin = (await read(a)).gtin;
    const per100g = (nutrient: string, label: string, value: number) => ({ nutrient, label, qualifier: 'not_stated', value, unit: '%' });
    await db.doc(`products/${gtin}`).update({ 'facts.guaranteedAnalysis': { value: [per100g('crude_protein', 'Crude protein', 1), per100g('crude_fat', 'Crude fat', 0.8)], source: src('opff', BC.treat) } });
    const b = await newScan('u1', BC.treat);
    await processScan(deps(), 'u1', b.id);
    const s = await read(b);
    expect(s.status).toBe('needs_photos');
    expect(s.missingInfo).toEqual(['nutrition']);
    expect(s.evidenceNotes.join(' ')).toMatch(/1% protein and 0.8% fat, which cannot be per 100 g/);
    expect((await db.doc(`products/${gtin}`).get()).data()!.facts.guaranteedAnalysis).toBeUndefined();
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

    const photo = await db.collection('users/u1/photos').add({ scanId: ref.id, purpose: 'nutrition', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/x/o/users%2Fu1%2Fuploads%2F1.jpg', status: 'uploaded', createdAt: Timestamp.fromDate(NOW) });
    await processPhoto(deps(), 'u1', photo.id);
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
  it('does not use a label photo read by an older label reader, and asks for it again', async () => {
    const a = await newScan('u1', BC.food);
    await processScan(deps(), 'u1', a.id);
    const photo = await db.collection('users/u1/photos').add({ scanId: a.id, purpose: 'nutrition', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/x/o/users%2Fu1%2Fuploads%2F1.jpg', status: 'uploaded', createdAt: Timestamp.fromDate(NOW) });
    await processPhoto(deps(), 'u1', photo.id);
    const gtin = (await read(a)).gtin;
    await db.doc(`users/u1/labelFacts/${gtin}`).update({ [`extractions.${photo.id}.label.version`]: FieldValue.delete() });
    const b = await newScan('u1', BC.food);
    await processScan(deps(), 'u1', b.id);
    const s = await read(b);
    expect(s.status).toBe('needs_photos');
    expect(s.missingInfo).toEqual(['nutrition']);
    expect(s.diagnosticNotes).toContain('1 label photo reading was made by an older label reader and not used; the photo is asked for again if still needed.');
  });
  it('does not ask again for photos already processed (reuse on rescan)', async () => {
    const a = await newScan('u1', BC.food);
    await processScan(deps(), 'u1', a.id);
    const photo = await db.collection('users/u1/photos').add({ scanId: a.id, purpose: 'nutrition', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/x/o/users%2Fu1%2Fuploads%2F1.jpg', status: 'uploaded', createdAt: Timestamp.fromDate(NOW) });
    await processPhoto(deps(), 'u1', photo.id);
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
    const photo = await db.collection('users/u1/photos').add({ scanId: ref.id, purpose: 'front', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/x/o/users%2Fu1%2Fuploads%2F2.jpg', status: 'uploaded', createdAt: Timestamp.fromDate(NOW) });
    await processPhoto(deps(), 'u1', photo.id);
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

describe('classification by evidence, not by database (regression: 099482480882)', () => {
  it('reads the record where the shared backend says it is filed, keeps its facts, and researches instead of rejecting', async () => {
    const ref = await newScan('u1', BC.misfiled);
    await processScan(deps({ researchEnabled: true }), 'u1', ref.id);
    const s = await read(ref);
    expect(calls['lookup:off']).toBe(1);
    expect(calls['lookup:obf']).toBeUndefined(); // only the database that files it is asked
    expect(calls.research).toBe(1);
    expect(s.scope).toBe('supported');
    expect(s).toMatchObject({ productSpecies: 'dog', productCategory: 'complete_food', productName: 'TEST FIXTURE Grain free chicken & Pea recipe' });
    expect(s.evidenceNotes.join(' ')).toMatch(/filed there as “food”\)\. Where a record is filed doesn’t decide what the product is/);
    expect(s.evidenceNotes).toContain('teststore.example (web page) says it is intended for dogs; checked on the page.');
    expect(s.ingredientNotes.length).toBeGreaterThan(3); // the database's ingredients are kept
  });
  it('stays unresolved and asks to confirm the product when research cannot tell — never "human food"', async () => {
    const ref = await newScan('u1', BC.misfiled);
    await processScan(deps(), 'u1', ref.id); // research switched off
    const s = await read(ref);
    expect(s.status).toBe('needs_photos');
    expect(s.scope).toBe('unknown');
    expect(s.outOfScopeKind).toBe('');
    expect(s.missingInfo).toContain('front');
    expect(s.productName).toBe('TEST FIXTURE Grain free chicken & Pea recipe');
  });
  it('reads the front image the database publishes when it is unresolved who the product is for', async () => {
    const ref = await newScan('u1', BC.misfiledFront, 'cat1');
    await processScan(deps(), 'u1', ref.id); // research switched off: the database's own front image decides
    const s = await read(ref);
    expect(calls.dbImages).toBe(1);
    expect(s).toMatchObject({ scope: 'supported', productSpecies: 'cat', productCategory: 'complete_food' });
    expect(s.evidenceNotes.join(' ')).toMatch(/Read the front of the package from a label image in Open Food Facts/);
    expect(s.missingInfo).not.toContain('front'); // no photo of the front is asked for
  });
  it('a rate-limited database is a specific, retryable failure, never "not found" or "unknown"', async () => {
    const ref = await newScan('u1', BC.offDown);
    await processScan(deps(), 'u1', ref.id);
    const s = await read(ref);
    expect(s).toMatchObject({ status: 'failed', errorCode: 'source_unavailable', errorRetryable: true });
    expect(s.errorMessage).toMatch(/^Open Food Facts is limiting requests right now/);
  });
  it('replaces a saved false "not a pet product" classification on rescan and keeps an audit trail', async () => {
    const gtin = BC.misfiled.padStart(14, '0');
    const offSrc = src('off', BC.misfiled);
    // As the earlier rules saved it: out of scope, no rule version, signals without kinds.
    await db.doc(`products/${gtin}`).set({
      gtin, barcode: BC.misfiled, scope: 'out_of_scope', species: 'unknown', category: 'unknown', origin: 'off',
      scopeReason: 'This barcode is listed as a human food product. Purrbi only assesses products made for cats and dogs.',
      facts: { gtin, barcode: BC.misfiled, productName: { value: 'TEST FIXTURE Grain free chicken & Pea recipe', source: offSrc }, classificationSignals: [{ text: 'TEST FIXTURE Grain free chicken & Pea recipe', source: offSrc.sourceId }], sources: [offSrc] },
      factsHash: 'old', factsVersion: 1, lastRetrievedAt: Timestamp.fromDate(NOW),
    });
    const ref = await newScan('u1', BC.misfiled);
    await processScan(deps({ researchEnabled: true }), 'u1', ref.id);
    expect(calls['lookup:opff']).toBe(1); // read again once under the new rules
    expect((await read(ref)).scope).toBe('supported');
    const product = (await db.doc(`products/${gtin}`).get()).data()!;
    expect(product).toMatchObject({ scope: 'supported', species: 'dog', scopeVersion: SCOPE_VERSION });
    const audit = (await db.collection(`products/${gtin}/classifications`).get()).docs.map((d) => d.data());
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({ from: { scope: 'out_of_scope', version: 'scope-1' }, to: { scope: 'supported', species: 'dog', version: SCOPE_VERSION } });
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
  it('a barcode on the development retry-test list fails its first attempt only, then completes on retry', async () => {
    const d = deps({ retryTestBarcodes: [BC.treat] });
    const ref = await newScan('u1', BC.treat);
    await processScan(d, 'u1', ref.id);
    let s = await read(ref);
    expect(s).toMatchObject({ status: 'failed', errorCode: 'source_unavailable', errorRetryable: true });
    expect(s.errorMessage).toContain('Simulated');
    expect(calls['lookup:opff']).toBeUndefined();
    const before = s;
    await ref.update({ retryRequested: true });
    await handleScanUpdate(d, 'u1', ref.id, before, await read(ref));
    s = await read(ref);
    expect(s.status).toBe('complete');
    expect(s.claimCount).toBe(2);
    expect(calls['lookup:opff']).toBe(1);
  });
  it('a scan whose job stopped without a result can be retried by the owner, and completes', async () => {
    const ref = await newScan('u1', BC.treat, 'cat2');
    // As a job leaves it when it times out: still "assessing", last updated 10 minutes ago, quota already used.
    await ref.update({ status: 'assessing', claimCount: 1, updatedAt: Timestamp.fromDate(new Date(NOW.getTime() - 10 * 60000)) });
    const before = await read(ref);
    await ref.update({ retryRequested: true });
    await handleScanUpdate(deps(), 'u1', ref.id, before, await read(ref));
    const s = await read(ref);
    expect(s).toMatchObject({ status: 'complete', claimCount: 2, retryRequested: false });
    expect(s.lastJob.kind).toBe('retry');
  });
  it('a working scan is not retried', async () => {
    const ref = await newScan('u1', BC.treat, 'cat2');
    await ref.update({ status: 'researching', claimCount: 1, updatedAt: Timestamp.fromDate(new Date(NOW.getTime() - 60000)) });
    const before = await read(ref);
    await ref.update({ retryRequested: true });
    await handleScanUpdate(deps(), 'u1', ref.id, before, await read(ref));
    expect((await read(ref)).status).toBe('researching');
    expect(calls['lookup:opff']).toBeUndefined();
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
    expect(calls.explain).toBe(1);
    const s = await read(ref);
    expect(s.claimCount).toBe(1);
    expect(s.duplicateDeliveries).toBe(1);
  });
});

describe('personal refresh', () => {
  it('switching pets changes the personal fit but not the general assessment', async () => {
    const ref = await newScan('u1', BC.food, 'cat2');
    await processScan(deps(), 'u1', ref.id);
    const photo = await db.collection('users/u1/photos').add({ scanId: ref.id, purpose: 'nutrition', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/x/o/users%2Fu1%2Fuploads%2F1.jpg', status: 'uploaded', createdAt: Timestamp.fromDate(NOW) });
    await processPhoto(deps(), 'u1', photo.id);
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

describe('evidence-backed explanations and reuse', () => {
  it('explains unfamiliar ingredients once with cited sources, then reuses them without any AI call', async () => {
    const a = await newScan('u1', BC.treat, 'cat2');
    await processScan(deps(), 'u1', a.id);
    const first = await read(a);
    expect(first.explanationsStatus).toBe('ready');
    const rice = first.ingredientNotes.find((n: { name: string }) => n.name === 'rice flour');
    expect(rice).toMatchObject({ explanationKind: 'cited_ai', explanationSourceUrl: 'https://www.fda.gov/test-fixture' });
    expect(rice.status).toBe('unknown'); // explanations never change the curated status or the score
    expect(first.ingredientNotes.find((n: { name: string }) => n.name === 'mixed tocopherols').explanationKind).toBe('curated');
    expect(first.lastJob).toMatchObject({ kind: 'scan', productCache: 'miss', recallCache: 'miss', explanationsNew: 2 });
    expect(calls.explain).toBe(1);

    const b = await newScan('u1', BC.treat, 'cat2');
    await processScan(deps(), 'u1', b.id);
    const second = await read(b);
    expect(calls.explain).toBe(1); // no new AI call
    expect(calls['lookup:opff']).toBe(1); // no new database call
    expect(second.lastJob).toMatchObject({ productCache: 'hit', recallCache: 'hit', explanationsCached: 2, explanationsNew: 0, aiCalls: 0 });
    expect(second.explanationsStatus).toBe('ready');
    expect(second.score).toBe(first.score);
    expect(second.evidenceNotes.join(' ')).toMatch(/reused/);
  });
  it('explains all new terms in the first scan, even beyond one call, so a rescan makes no AI call', async () => {
    const small = { limits: { ...DEFAULT_LIMITS, explanationsPerCall: 1 } };
    const a = await newScan('u1', BC.treat, 'cat2');
    await processScan(deps(small), 'u1', a.id);
    expect(calls.explain).toBe(2); // two calls of one term each, in the same scan
    expect((await read(a)).explanationsStatus).toBe('ready');
    const b = await newScan('u1', BC.treat, 'cat2');
    await processScan(deps(small), 'u1', b.id);
    expect(calls.explain).toBe(2);
    expect((await read(b)).lastJob).toMatchObject({ aiCalls: 0, explanationsNew: 0, explanationsCached: 2 });
  });
});

describe('concise result: highlights and verdict', () => {
  it('shows at most two positives and two cautions, and a checked verdict that names the pet only in the app', async () => {
    const ref = await newScan('u1', BC.food, 'cat1'); // Miso is allergic to chicken
    await processScan(deps(), 'u1', ref.id);
    const s = await read(ref);
    expect(s.positives.length).toBeLessThanOrEqual(2);
    expect(s.cautions.length).toBeGreaterThan(0);
    expect(s.cautions.length).toBeLessThanOrEqual(2);
    expect(s.cautions[0]).toMatchObject({ severity: 'alert', title: 'In the allergy profile', value: 'chicken' });
    expect(s).toMatchObject({ verdictSource: 'ai', verdictStatus: 'ready' });
    expect(s.verdict).toMatch(/for Miso, check the cautions listed below \(first: chicken\)/);
    expect(calls.verdict).toBe(1);
    expect(verdictInputs[0]).not.toContain('Miso'); // the pet's name never reaches the model
    expect(verdictInputs[0]).toContain('your cat');
    expect(s.scoreText).toMatch(/^\d+$|^Unscored$|^Not scored$/);
  });
  it('does not use a verdict that leaves out the most serious caution', async () => {
    const ref = await newScan('u1', BC.food, 'cat1');
    const silent = { ...sources, verdict: async () => ({ text: 'TEST FIXTURE verdict: Purrbi’s label score for this product is not available yet; check the label details listed below against what you already know before choosing it.', model: 'mock' }) };
    await processScan({ ...deps(), sources: silent }, 'u1', ref.id);
    const s = await read(ref);
    expect(s.verdictSource).toBe('rules');
    expect(s.verdict).toMatch(/chicken/i);
    expect(s.diagnosticNotes.join(' ')).toMatch(/does not name the most serious caution/);
  });
  it('reuses the cached verdict on a rescan with the same evidence and pet (no new AI call)', async () => {
    const a = await newScan('u1', BC.treat, 'cat2');
    await processScan(deps(), 'u1', a.id);
    const b = await newScan('u1', BC.treat, 'cat2');
    await processScan(deps(), 'u1', b.id);
    expect(calls.verdict).toBe(1);
    expect((await read(b)).verdict).toBe((await read(a)).verdict);
  });
  it('replaces a verdict that fails the check with one built from the same findings', async () => {
    verdictMode = 'invalid';
    const ref = await newScan('u1', BC.treat, 'cat2');
    await processScan(deps(), 'u1', ref.id);
    const s = await read(ref);
    expect(s).toMatchObject({ verdictSource: 'rules', verdictStatus: 'ready' });
    expect(s.verdict).not.toMatch(/safest/);
    expect(s.verdict).toMatch(/Purrbi’s label score for TEST FIXTURE Salmon Cat Treats is \d+\/100/);
    expect(s.diagnosticNotes.join(' ')).toMatch(/Verdict \(mock\) not used: (length|claim Purrbi does not make)/);
  });
  it('keeps the rule-based verdict when the model is unavailable, and tries again next time', async () => {
    verdictMode = 'fail';
    const a = await newScan('u1', BC.treat, 'cat2');
    await processScan(deps(), 'u1', a.id);
    expect(await read(a)).toMatchObject({ verdictSource: 'rules', verdictStatus: 'ready' });
    verdictMode = 'ok';
    const b = await newScan('u1', BC.treat, 'cat2');
    await processScan(deps(), 'u1', b.id);
    expect(calls.verdict).toBe(2); // the failure was not cached
    expect((await read(b)).verdictSource).toBe('ai');
  });
  it('an unresolved product gets a fixed verdict and no positives (no AI verdict call)', async () => {
    const ref = await newScan('u1', BC.misfiled, 'cat1');
    await processScan(deps(), 'u1', ref.id);
    const s = await read(ref);
    expect(s.scope).toBe('unknown');
    expect(s.verdict).toMatch(/couldn’t confirm yet whether this is made for cats or dogs/);
    expect(s.positives).toEqual([]);
    expect(s.scoreText).not.toBe('0');
    expect(calls.verdict).toBeUndefined();
  });
});

describe('label photo stages: submitted → extracted → corroborated → verified, or disputed', () => {
  const photoFor = (uid: string, scanId: string) =>
    db.collection(`users/${uid}/photos`).add({ scanId, purpose: 'nutrition', imageUrl: `https://firebasestorage.googleapis.com/v0/b/x/o/users%2F${uid}%2Fuploads%2F1.jpg`, status: 'uploaded', createdAt: Timestamp.fromDate(NOW) });
  it('a photo not tied to this barcode stays private, and the result says it is label-based', async () => {
    const ref = await newScan('u1', BC.food, 'cat1');
    await processScan(deps(), 'u1', ref.id);
    const photo = await photoFor('u1', ref.id);
    await processPhoto(deps(), 'u1', photo.id);
    expect(await read(photo)).toMatchObject({ status: 'processed', stage: 'extracted' });
    const s = await read(ref);
    expect(s.status).toBe('complete');
    expect(s.verificationStatus).toMatch(/^Label-based assessment with product identity not yet independently verified\./);
    expect((await db.doc(`products/${s.gtin}`).get()).data()!.facts.guaranteedAnalysis).toBeUndefined();
  });
  it('a photo showing the scanned barcode is verified and fills the shared record without any account id', async () => {
    labelPatch = { barcodeMatch: true };
    const ref = await newScan('u1', BC.food, 'cat1');
    await processScan(deps(), 'u1', ref.id);
    const photo = await photoFor('u1', ref.id);
    await processPhoto(deps(), 'u1', photo.id);
    const p = await read(photo);
    expect(p).toMatchObject({ status: 'processed', stage: 'verified' });
    expect(p.stageNote).toMatch(/barcode on the photo is the scanned one/);
    const s = await read(ref);
    expect(s.status).toBe('complete');
    expect(s.verificationStatus).not.toMatch(/not yet independently verified/);
    const product = (await db.doc(`products/${s.gtin}`).get()).data()!;
    expect(product.facts.guaranteedAnalysis.source).toMatchObject({ sourceType: 'verified_label', sourceName: 'A label photo matched to this barcode' });
    expect(JSON.stringify(product)).not.toMatch(/u1|firebasestorage/); // no account id, no private image
    const contributions = (await db.collection(`products/${s.gtin}/contributions`).get()).docs.map((d) => d.data());
    expect(contributions).toHaveLength(1);
    expect(contributions[0].fields).toEqual(expect.arrayContaining(['guaranteedAnalysis']));
    expect(JSON.stringify(contributions)).not.toMatch(/u1/);
    // Another owner now gets the analysis from the shared record, with no photo.
    const other = await newScan('u2', BC.food);
    await processScan(deps(), 'u2', other.id);
    const o = await read(other);
    expect(o.status).toBe('complete');
    expect(o.nutritionSource).toBe('A label photo matched to this barcode (read by AI, not reviewed)');
    expect(o.labelEvidenceUsed).toBe(false);
  });
  it('a photo whose ingredient list differs from this barcode’s record is disputed and not used', async () => {
    labelPatch = { ingredientsText: 'Salmon, potatoes, peas, canola oil, tapioca, salt', ingredients: ['Salmon', 'potatoes', 'peas', 'canola oil', 'tapioca', 'salt'] };
    const ref = await newScan('u1', BC.food, 'cat1');
    await processScan(deps(), 'u1', ref.id);
    const photo = await photoFor('u1', ref.id);
    await processPhoto(deps(), 'u1', photo.id);
    const p = await read(photo);
    expect(p).toMatchObject({ status: 'processed', stage: 'disputed' });
    expect(p.stageNote).toMatch(/^Not used: its ingredient list differs from this barcode’s record/);
    const s = await read(ref);
    expect(s.status).toBe('needs_photos');
    expect(s.labelEvidenceUsed).toBe(false);
    expect(s.evidenceNotes.join(' ')).toMatch(/A label photo was not used/);
  });
  it('lets the owner show the package when a product was judged not a cat or dog product', async () => {
    labelPatch = { species: 'dog', productTypeClaim: 'Dry dog food', adequacy: null };
    const ref = await newScan('u1', BC.human, 'cat1');
    await processScan(deps(), 'u1', ref.id);
    expect((await read(ref)).status).toBe('out_of_scope');
    const photo = await db.collection('users/u1/photos').add({ scanId: ref.id, purpose: 'label', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/x/o/users%2Fu1%2Fuploads%2F2.jpg', status: 'uploaded', createdAt: Timestamp.fromDate(NOW) });
    await processPhoto(deps(), 'u1', photo.id);
    const s = await read(ref);
    expect(s).toMatchObject({ scope: 'supported', productSpecies: 'dog', labelEvidenceUsed: true }); // the owner's package decides their own result
    expect(s.verificationStatus).toMatch(/^Label-based assessment with product identity not yet independently verified/);
    expect((await db.doc(`products/${s.gtin}`).get()).data()!.scope).toBe('out_of_scope'); // the shared record is unchanged by a private photo
  });
});

describe('no stale overwrite', () => {
  it('a run whose inputs are older than the saved result does not overwrite it', async () => {
    const ref = await newScan('u1', BC.treat, 'cat2');
    await processScan(deps(), 'u1', ref.id);
    // A newer result (inputs read an hour later) is already saved.
    await ref.update({ assessmentInputsAt: Timestamp.fromDate(new Date(NOW.getTime() + 3600000)), personalState: 'newer-result' });
    const before = await read(ref);
    await ref.update({ refreshPersonalRequested: true, petId: 'cat1' });
    await handleScanUpdate(deps(), 'u1', ref.id, before, await read(ref));
    const s = await read(ref);
    expect(s.personalState).toBe('newer-result');
    expect(s.refreshPersonalRequested).toBe(false);
  });
});

describe('supplements', () => {
  it('get an evidence-backed informational assessment, never an empty screen or a number', async () => {
    const ref = await newScan('u1', BC.supplement);
    await processScan(deps(), 'u1', ref.id);
    const s = await read(ref);
    expect(s.status).toBe('complete');
    expect(s.productCategory).toBe('supplement');
    expect(s.scoreAvailable).toBe(false);
    expect(s.supplementPurposes.map((p: { key: string }) => p.key)).toContain('joint');
    expect(s.supplementActives.map((a: { name: string; amountText: string }) => `${a.name}: ${a.amountText}`)).toEqual([
      'Glucosamine HCl: 500 mg per chew', 'MSM: 250 mg per chew', 'Chondroitin Sulfate: 100 mg per chew',
    ]);
    expect(s.supplementActives.every((a: { evidence: string; sourceUrl: string }) => a.evidence === 'cited' && a.sourceUrl)).toBe(true);
    expect(s.supplementLimitations.length).toBeGreaterThan(0);
    expect(s.supplementSummary).toMatch(/joint/);
  });
});

describe('fallbacks before asking the owner for photos', () => {
  it('reads a label image published in the database to fill a missing nutrition panel', async () => {
    const ref = await newScan('u1', BC.imageOnly);
    await processScan(deps(), 'u1', ref.id);
    const s = await read(ref);
    expect(calls.dbImages).toBe(1);
    expect(s.status).toBe('complete');
    expect(s.missingInfo).toEqual([]);
    expect(s.scoreAvailable).toBe(true);
    expect(s.nutritionSource).toMatch(/label image/);
    expect(s.generalFindings.some((f: { rule: string }) => f.rule === 'G-DBIMAGE')).toBe(true);
    expect(s.nutrition.find((n: { label: string }) => n.label === 'Crude Protein').context).toMatch(/AAFCO/);
    const product = (await db.doc(`products/${s.gtin}`).get()).data()!;
    expect(product.verification).toBe('database_and_label_image');
    const meta = (await db.doc(`productMeta/${s.gtin}`).get()).data()!;
    expect(meta.enrichment.databaseImages.read).toEqual(['nutrition']);
    // A later re-fetch of the database record keeps what the image supplied; the image is not read again.
    const again = await newScan('u1', BC.imageOnly);
    await processScan(deps({ productFreshDays: 0 }), 'u1', again.id);
    expect(calls['lookup:opff']).toBe(2);
    expect(calls.dbImages).toBe(1);
    expect((await read(again)).status).toBe('complete');
  });
  it('reads a database label image again when an older label reader read it', async () => {
    const ref = await newScan('u1', BC.imageOnly);
    await processScan(deps(), 'u1', ref.id);
    const gtin = (await read(ref)).gtin;
    // As the previous reader saved it: no reader version on the image source or in the bookkeeping.
    const facts = (await db.doc(`products/${gtin}`).get()).data()!.facts;
    const old = (x: Record<string, unknown>) => Object.fromEntries(Object.entries(x).filter(([k]) => k !== 'readerVersion'));
    facts.sources = facts.sources.map(old);
    for (const k of ['guaranteedAnalysis', 'adequacy', 'calories']) facts[k].source = old(facts[k].source);
    await db.doc(`products/${gtin}`).update({ facts });
    await db.doc(`productMeta/${gtin}`).update({ 'enrichment.databaseImages.version': FieldValue.delete() });
    const again = await newScan('u1', BC.imageOnly);
    await processScan(deps(), 'u1', again.id);
    expect(calls.dbImages).toBe(2);
    const s = await read(again);
    expect(s.status).toBe('complete');
    expect(s.diagnosticNotes[0]).toBe('Dropped guaranteedAnalysis, calories, adequacy taken from database label images or web pages under older rules; they are read again.');
    const product = (await db.doc(`products/${gtin}`).get()).data()!;
    expect(product.facts.guaranteedAnalysis.source.readerVersion).toBe(LABEL_EXTRACTION_VERSION);
  });
  it('fills missing label facts from the manufacturer page (research), once per freshness window', async () => {
    const ref = await newScan('u1', BC.webOnly);
    await processScan(deps({ researchEnabled: true }), 'u1', ref.id);
    const s = await read(ref);
    expect(calls.research).toBe(1);
    expect(s.status).toBe('complete');
    expect(s.scoreAvailable).toBe(true);
    expect(s.sources.some((x: { type: string }) => x.type === 'manufacturer')).toBe(true);
    expect(s.evidenceNotes.join(' ')).toMatch(/manufacturer page/);
    const nothing = await newScan('u1', BC.unknown);
    await processScan(deps({ researchEnabled: true }), 'u1', nothing.id);
    const again = await newScan('u1', BC.unknown);
    await processScan(deps({ researchEnabled: true }), 'u1', again.id);
    expect(calls.research).toBe(2); // webOnly once, unknown once: the failed search is not repeated
    expect((await read(again)).status).toBe('needs_photos');
  });
});
