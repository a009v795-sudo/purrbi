// Scan-job lifecycle against the Firestore emulator with MOCKED sources (no network, no AI).
// Every mocked product is a labelled TEST FIXTURE; these tests check states, persistence, privacy
// and error handling — not real product data (see test/live for live contract tests).
import { initializeApp, getApps } from 'firebase-admin/app';
import { FieldValue, getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { LABEL_EXTRACTION_VERSION, type ValidatedLabel } from '../../src/ai/labelExtract';
import { gs1CheckDigit, type NormalizedBarcode } from '../../src/domain/barcode';
import type { ProductFacts, RecallCheck } from '../../src/domain/types';
import { EXPLAIN_VERSION, explanationKey } from '../../src/knowledge/explain';
import { ASSESSMENT_VERSION, DEFAULT_LIMITS, type RuntimeConfig } from '../../src/pipeline/config';
import { handleScanUpdate, processPhoto, processScan, type Deps, type Sources } from '../../src/pipeline/scanJob';
import { writeExplanations } from '../../src/pipeline/store';
import type { OpenFactsDb, OpenFactsLookup } from '../../src/sources/openFacts';
import { RESEARCH_VERSION, ResearchNotStarted } from '../../src/sources/research';
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
  ingrImage: withCheck('501234567899'), // no ingredient list or analysis; the database has an ingredients image only
  hyphenA: withCheck('501234567800'), // "Mannan-Oligosaccharides"
  hyphenB: withCheck('501234567801'), // the same term spelled "Mannan Oligosaccharides"
  longList: withCheck('501234567802'), // more explainable terms than one run explains
};

let db: Firestore;
let calls: Record<string, number>;
let opffDown = false;
let verdictMode: 'ok' | 'invalid' | 'fail' = 'ok';
let labelPatch: Partial<ValidatedLabel> | null = null; // changes the mocked reading of a label panel
let imagesDown = false; // the database's image host fails (technical failure)
let pagesDown = false; // research names pages that cannot be reached
let researchThrows = false; // the research model call fails (provider error)
let explainUnverified: string | null = null; // every explanation comes back unverified, with this reason
let hintDown = false; // the barcode database (search words for research) is rate-limiting
let hintResetAt: Date | undefined; // when the rate-limited barcode database says its daily allowance resets
let identityPage = false; // research finds a retailer page showing BC.unknown's barcode (name and brand only)
let partialPage = false; // research finds a page showing BC.unknown's barcode with its name and brand, not who it is for
let researchCut: 'none' | 'not_started' | 'cut' = 'none'; // the scan's time limit stops research before its first search, or cuts it short
let refusingPages = false; // the pages research names for BC.unknown turn automated readers away (and one is gone), with a long trace
let researchOpts: { knownName?: string; knownBrand?: string; model?: string }[] = [];
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
    if (dbName === 'opff' && (barcode.digits === BC.hyphenA || barcode.digits === BC.hyphenB)) {
      return { found: true, db: dbName, code: barcode.digits, source: src(dbName, barcode.digits), product: {
        product_name: `TEST FIXTURE Chicken Dry Dog Food ${barcode.digits === BC.hyphenA ? 'A' : 'B'}`, brands: 'TESTBRAND', categories_tags: ['en:dog-food', 'en:dry-dog-food'],
        ingredients_text: `Chicken, brown rice, chicken fat, ${barcode.digits === BC.hyphenA ? 'Mannan-Oligosaccharides' : 'Mannan Oligosaccharides'}, taurine`,
      } };
    }
    if (dbName === 'opff' && barcode.digits === BC.longList) {
      const extras = Array.from({ length: 30 }, (_, i) => `TEST FIXTURE Additive ${String.fromCharCode(65 + (i % 26))}${i >= 26 ? i : ''}`);
      return { found: true, db: dbName, code: barcode.digits, source: src(dbName, barcode.digits), product: {
        product_name: 'TEST FIXTURE Long List Dog Food', brands: 'TESTBRAND', categories_tags: ['en:dog-food', 'en:dry-dog-food'],
        ingredients_text: `Chicken, Vitamins [${extras.join(', ')}]`,
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
    if (dbName === 'opff' && barcode.digits === BC.ingrImage) {
      return { found: true, db: dbName, code: barcode.digits, source: src(dbName, barcode.digits), product: {
        product_name: 'TEST FIXTURE Duck Dry Dog Food', brands: 'TESTBRAND', categories_tags: ['en:dog-food', 'en:dry-dog-food'],
        image_ingredients_url: 'https://images.openpetfoodfacts.org/images/products/501/234/567/8999/ingredients_en.2.400.jpg',
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
  async barcodeHint() {
    calls.hint = (calls.hint ?? 0) + 1;
    if (hintDown) throw new SourceError('UPCitemdb', 'rate_limited', 'HTTP 429 (mocked)', 429, hintResetAt);
    return null;
  },
  async research(o) {
    calls.research = (calls.research ?? 0) + 1;
    researchOpts.push({ knownName: o.knownName, knownBrand: o.knownBrand, model: o.model });
    if (partialPage && o.barcode === BC.unknown) {
      const page = { sourceId: `web:shop.example.jp:${o.gtin14}`, sourceType: 'retailer_or_web' as const, sourceName: 'shop.example.jp', url: 'https://shop.example.jp/c0012.html', retrievedAt: NOW.toISOString(), matchConfidence: 'exact_barcode' as const, readerVersion: RESEARCH_VERSION };
      return { facts: { productName: { value: 'TEST FIXTURE ウェルネス グレービー 85g', source: page }, brand: { value: 'TESTBRAND', source: page }, classificationSignals: [] }, sources: [page], discarded: [], model: 'mock' };
    }
    if (identityPage && o.barcode === BC.unknown) {
      const page = { sourceId: `web:teststore.example:${o.gtin14}`, sourceType: 'retailer_or_web' as const, sourceName: 'teststore.example', url: 'https://teststore.example/dog-trt', retrievedAt: NOW.toISOString(), matchConfidence: 'exact_barcode' as const, readerVersion: RESEARCH_VERSION };
      return { facts: { productName: { value: 'TEST FIXTURE Dog Trt Frz Dr Wld Salmn', source: page }, brand: { value: 'TESTBRAND', source: page }, classificationSignals: [{ text: 'treat', source: page.sourceId, kind: 'research' as const }, { text: 'intended for cats', source: page.sourceId, kind: 'research' as const }] }, sources: [page], discarded: [], model: 'mock' };
    }
    if (researchThrows) throw new SourceError('OpenAI', 'timeout', 'no response within 60000 ms (mocked)');
    if (researchCut === 'not_started') throw new ResearchNotStarted();
    if (refusingPages && o.barcode === BC.unknown) {
      return {
        facts: null, sources: [], model: 'mock', calls: 2,
        discarded: [
          'barcode search: ebay.com refuses automated readers (HTTP 403), so https://www.ebay.com/itm/1 could not be checked',
          'barcode search: shop.example has no such page (HTTP 404), so https://shop.example/gone could not be checked',
          ...Array.from({ length: 23 }, (_, i) => `search by the answer’s name: step ${i + 1}`),
        ],
      };
    }
    if (researchCut === 'cut') return { facts: null, sources: [], discarded: ['barcode search: model reported no matching product (1 search, 0 citations)', 'barcode search: result pages not checked (the scan’s time limit): shop.example'], model: 'mock', calls: 1, timeLimited: true };
    if (pagesDown) return { facts: null, sources: [], discarded: ['barcode search: could not fetch https://testbrand.example/lamb to verify it (HTTP 429)'], model: 'mock', fetchFailed: true };
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
    if (imagesDown) return { read: [], skipped: [], failed: ['nutrition: TEST FIXTURE image host answered with an error (HTTP 503)'], facts: [] };
    if (o.needs.includes('front') && o.product.image_front_url) {
      // The front of the package, as both readings read it: "Dry Cat Food".
      const front = { sourceId: `off-image:${o.code}:front`, sourceType: 'database_image' as const, sourceName: 'Open Food Facts label image', url: o.product.image_front_url, retrievedAt: NOW.toISOString(), matchConfidence: 'exact_barcode' as const, readerVersion: LABEL_EXTRACTION_VERSION };
      return { read: ['front'], skipped: [], failed: [], facts: [{ sources: [front], classificationSignals: [{ text: 'Dry Cat Food', source: front.sourceId, kind: 'photo' as const }, { text: 'for cats', source: front.sourceId, kind: 'photo' as const }] }] };
    }
    // An ingredients image both readings find unreadable (as labelImages.ts reports it, by panel).
    if (o.product.image_ingredients_url && !o.product.image_nutrition_url) return { facts: [], read: [], skipped: o.needs.filter((n) => n === 'ingredients').map((n) => `${n}: unreadable (TEST FIXTURE)`), failed: [] };
    if (!o.product.image_nutrition_url) return { facts: [], read: [], skipped: ['no image'], failed: [] };
    await o.beforeAiCall();
    const source = { sourceId: `opff-image:${o.code}:nutrition`, sourceType: 'database_image' as const, sourceName: 'Open Pet Food Facts label image', url: o.product.image_nutrition_url, retrievedAt: NOW.toISOString(), matchConfidence: 'exact_barcode' as const, readerVersion: LABEL_EXTRACTION_VERSION };
    return { read: ['nutrition'], skipped: [], failed: [], facts: [{
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
    if (explainUnverified) {
      return o.terms.map((t) => ({
        key: explanationKey(o.species, t.kind, t.term), term: t.term, kind: t.kind, species: o.species, status: 'unverified' as const,
        summary: '', role: '', sourceTitle: '', sourceUrl: '', quote: '', reason: explainUnverified!, checkedAt: ((o as { now?: Date }).now ?? NOW).toISOString(), model: 'mock', version: EXPLAIN_VERSION, claims: [], rejected: [], judgeModel: 'mock',
      }));
    }
    // As explain.ts returns them: a verified explanation has at least one claim that passed every check
    // (an active ingredient's is about its effect; an ingredient's says what it is).
    return o.terms.map((t) => ({
      key: explanationKey(o.species, t.kind, t.term), term: t.term, kind: t.kind, species: o.species, status: 'verified' as const,
      summary: `TEST FIXTURE explanation of ${t.term}.`, role: 'test role', sourceTitle: 'TEST FIXTURE source', sourceUrl: 'https://www.fda.gov/test-fixture',
      quote: 'TEST FIXTURE quote copied from the cited page.', reason: '', checkedAt: NOW.toISOString(), model: 'mock', version: EXPLAIN_VERSION, rejected: [], judgeModel: 'mock',
      claims: [{
        claimType: t.kind === 'active' ? 'benefit' as const : 'identity' as const, claim: `TEST FIXTURE explanation of ${t.term}.`, ingredientForm: t.term,
        title: 'TEST FIXTURE source', url: 'https://www.fda.gov/test-fixture', passage: 'TEST FIXTURE quote copied from the cited page.',
        speciesScope: 'pets' as const, evidence: 'regulatory_assessment' as const, doseContext: '', retrievedAt: NOW.toISOString(), publishedAt: '', reviewStatus: 'automated_checks' as const,
      }],
    }));
  },
  async verdict(o) {
    calls.verdict = (calls.verdict ?? 0) + 1;
    verdictInputs.push(JSON.stringify(o.input));
    if (verdictMode === 'fail') throw new Error('mock verdict outage');
    if (verdictMode === 'invalid') return { text: 'TEST FIXTURE: the safest food.', model: 'mock' };
    const subject = o.input.pet ? o.input.pet.name : 'a cat or dog';
    const a = o.input.assessment;
    const score = a.score === null ? 'not available yet' : a.label === 'Partial assessment' ? `a partial assessment, between ${a.low} and ${a.high} once the label is complete` : `${a.score}/100`;
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
  imagesDown = false;
  pagesDown = false;
  researchThrows = false;
  explainUnverified = null;
  hintDown = false;
  hintResetAt = undefined;
  identityPage = false;
  partialPage = false;
  researchCut = 'none';
  refusingPages = false;
  researchOpts = [];
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
  it('a 2.1.0 photo disputed only by a row now set aside is compared again, used, and no longer says it conflicts', async () => {
    const ref = await newScan('u1', BC.imageOnly); // the record's analysis: protein 26, fat 15, fibre 4, moisture 10
    await processScan(deps(), 'u1', ref.id);
    labelPatch = { guaranteedAnalysis: [
      { nutrient: 'crude_protein', label: 'Crude Protein', qualifier: 'min', value: 26, unit: '%' },
      { nutrient: 'crude_fat', label: 'Crude Fat', qualifier: 'min', value: 15, unit: '%' },
      { nutrient: 'crude_fiber', label: 'Crude Fiber 4.0% Moisture', qualifier: 'max', value: 10, unit: '%' },
    ] };
    const photo = await db.collection('users/u1/photos').add({ scanId: ref.id, purpose: 'nutrition', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/x/o/users%2Fu1%2Fuploads%2F1.jpg', status: 'uploaded', createdAt: Timestamp.fromDate(NOW) });
    await processPhoto(deps(), 'u1', photo.id);
    expect((await photo.get()).data()!.stage).toBe('disputed'); // fibre 10 % vs 4 %
    const gtin = (await read(ref)).gtin;
    await db.doc(`users/u1/labelFacts/${gtin}`).update({ [`extractions.${photo.id}.label.version`]: 'label-extract-2.1.0' }); // as 2.1.0 saved it
    const again = await newScan('u1', BC.imageOnly);
    await processScan(deps(), 'u1', again.id);
    const s = await read(again);
    expect(s.evidenceNotes.join(' ')).not.toMatch(/A label photo was not used/);
    expect((await photo.get()).data()).toMatchObject({ stage: 'corroborated', statusMessage: 'Label read' });
    expect((await db.doc(`users/u1/labelFacts/${gtin}`).get()).data()!.extractions[photo.id].stage).toBe('corroborated');
  });
  it('uses a label photo read by label reader 2.1.0 without the analysis rows 2.1.0 may have misread', async () => {
    const a = await newScan('u1', BC.food);
    await processScan(deps(), 'u1', a.id);
    const photo = await db.collection('users/u1/photos').add({ scanId: a.id, purpose: 'nutrition', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/x/o/users%2Fu1%2Fuploads%2F1.jpg', status: 'uploaded', createdAt: Timestamp.fromDate(NOW) });
    await processPhoto(deps(), 'u1', photo.id);
    const gtin = (await read(a)).gtin;
    // As 2.1.0 could save "Crude Fiber 4.0% (max)\nMoisture (max) 10.0%": fibre with moisture's value, no moisture.
    const saved = (await db.doc(`users/u1/labelFacts/${gtin}`).get()).data()!.extractions[photo.id].label.guaranteedAnalysis as { nutrient: string; label: string; value: number }[];
    const misread = saved.map((e) => (e.nutrient === 'crude_fiber' ? { ...e, label: 'Crude Fiber 4.0% Moisture', value: 10 } : e)).filter((e) => e.nutrient !== 'moisture');
    await db.doc(`users/u1/labelFacts/${gtin}`).update({ [`extractions.${photo.id}.label.version`]: 'label-extract-2.1.0', [`extractions.${photo.id}.label.guaranteedAnalysis`]: misread });
    const b = await newScan('u1', BC.food);
    await processScan(deps(), 'u1', b.id);
    const s = await read(b);
    expect(s.diagnosticNotes).toContain('1 analysis row of your label photo that the earlier label reader may have misread was set aside.');
    expect(s.nutrition.map((n: { label: string }) => n.label)).toEqual(['Crude Protein', 'Crude Fat']);
    expect(s.missingInfo).toContain('nutrition'); // the fibre guarantee is asked for again, not taken from the misread row
  });
  it('still uses a label photo read by the previous label reader (2.1.0), which the current one only reads more of', async () => {
    const a = await newScan('u1', BC.food);
    await processScan(deps(), 'u1', a.id);
    const photo = await db.collection('users/u1/photos').add({ scanId: a.id, purpose: 'nutrition', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/x/o/users%2Fu1%2Fuploads%2F1.jpg', status: 'uploaded', createdAt: Timestamp.fromDate(NOW) });
    await processPhoto(deps(), 'u1', photo.id);
    const gtin = (await read(a)).gtin;
    await db.doc(`users/u1/labelFacts/${gtin}`).update({ [`extractions.${photo.id}.label.version`]: 'label-extract-2.1.0' });
    const b = await newScan('u1', BC.food);
    await processScan(deps(), 'u1', b.id);
    const s = await read(b);
    expect(s.status).toBe('complete');
    expect(s.labelEvidenceUsed).toBe(true);
    expect(s.diagnosticNotes.join(' ')).not.toMatch(/older label reader/);
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
    // The findings are kept and the photo stays available as optional (no loop back to "needs photos")…
    expect(s.photoRequests.map((r: { purpose: string }) => r.purpose)).toEqual(['nutrition']);
    expect(before.ingredientsText).toBe(s.ingredientsText);
    const again = await newScan('u1', BC.food);
    await processScan(deps(), 'u1', again.id);
    expect((await read(again)).status).toBe('needs_photos'); // a new scan asks again; the skipped one stays complete
    expect(s.missingForScore).toEqual(['nutritional adequacy ("complete and balanced") statement', 'guaranteed analysis (protein and fat)']); // …and what the score still needs is its own field
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
    expect(s.verdict).toMatch(/^Purrbi scores TEST FIXTURE Salmon Cat Treats \d+\/100 \(\w+\)\. Good to know: /);
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

describe('no permanent negative caching', () => {
  const at = (hours: number) => ({ ...deps({ researchEnabled: true }), now: () => new Date(NOW.getTime() + hours * 3600000) });
  it('a label image that failed for a technical reason is read again after 6 hours, not 30 days', async () => {
    imagesDown = true;
    const a = await newScan('u1', BC.imageOnly);
    await processScan(deps(), 'u1', a.id);
    expect((await read(a)).status).toBe('needs_photos');
    expect((await read(a)).diagnosticNotes.join(' ')).toMatch(/not read \(tried again later\)/);
    imagesDown = false;
    const b = await newScan('u1', BC.imageOnly);
    await processScan(at(2), 'u1', b.id);
    expect(calls.dbImages).toBe(1); // not hammered within the hour
    const c = await newScan('u1', BC.imageOnly);
    await processScan(at(7), 'u1', c.id);
    expect(calls.dbImages).toBe(2);
    expect((await read(c)).status).toBe('complete');
  });
  it('research whose pages could not be reached is tried again after 12 hours, and says so', async () => {
    pagesDown = true;
    const a = await newScan('u1', BC.webOnly);
    await processScan(deps({ researchEnabled: true }), 'u1', a.id);
    expect((await read(a)).evidenceNotes.join(' ')).toMatch(/couldn’t be reached to check them/);
    pagesDown = false;
    const b = await newScan('u1', BC.webOnly);
    await processScan(at(3), 'u1', b.id);
    expect(calls.research).toBe(1);
    const c = await newScan('u1', BC.webOnly);
    await processScan(at(13), 'u1', c.id);
    expect(calls.research).toBe(2);
    expect((await read(c)).status).toBe('complete');
  });
  it('an image the earlier label reader read, due again but failing for a technical reason, is retried after 6 hours', async () => {
    const ref = await newScan('u1', BC.imageOnly);
    await processScan(deps(), 'u1', ref.id);
    const gtin = (await read(ref)).gtin;
    // As 2.1.0 left it: an analysis with a misread row (fibre given moisture's value), and its bookkeeping.
    const v21 = <T extends Record<string, unknown>>(x: T) => ({ ...x, readerVersion: 'label-extract-2.1.0' });
    const facts = (await db.doc(`products/${gtin}`).get()).data()!.facts;
    facts.sources = facts.sources.map((x: Record<string, unknown>) => (x.sourceType === 'database_image' ? v21(x) : x));
    for (const k of ['guaranteedAnalysis', 'adequacy', 'calories']) facts[k].source = v21(facts[k].source);
    facts.guaranteedAnalysis.value = facts.guaranteedAnalysis.value
      .map((e: { nutrient: string }) => (e.nutrient === 'crude_fiber' ? { ...e, label: 'Crude Fiber 4.0% Moisture', value: 10 } : e))
      .filter((e: { nutrient: string }) => e.nutrient !== 'moisture');
    await db.doc(`products/${gtin}`).update({ facts });
    await db.doc(`productMeta/${gtin}`).update({ 'enrichment.databaseImages': { read: ['nutrition'], skipped: [], failed: [], version: 'label-extract-2.1.0' } });
    imagesDown = true;
    await processScan(at(0), 'u1', (await newScan('u1', BC.imageOnly)).id);
    expect(calls.dbImages).toBe(2); // due again (the analysis was set aside), but the image host fails
    imagesDown = false;
    const later = await newScan('u1', BC.imageOnly);
    await processScan(at(7), 'u1', later.id);
    expect(calls.dbImages).toBe(3); // tried again after 6 hours, not left for 30 days
    expect((await read(later)).status).toBe('complete');
    const product = (await db.doc(`products/${gtin}`).get()).data()!;
    expect(product.facts.guaranteedAnalysis.value.find((e: { nutrient: string }) => e.nutrient === 'crude_fiber').value).toBe(4);
  });
  it('a needed panel the database has no image of does not make the other images due again (no repeated paid reads)', async () => {
    for (let i = 0; i < 4; i++) {
      const s = await newScan('u1', BC.ingrImage);
      await processScan({ ...deps(), now: () => new Date(NOW.getTime() + i * 600000) }, 'u1', s.id); // every 10 minutes
    }
    expect(calls.dbImages).toBe(1); // the ingredients image is read once; there is no nutrition image to read
  });
  it('an explanation whose cited page is a PDF (which Purrbi cannot check) is asked for again after a day, then 7 and 30 days while it stays one', async () => {
    explainUnverified = 'cited page is a PDF document, which Purrbi cannot check yet (aafco.org)';
    const scanAt = async (hours: number) => {
      const s = await newScan('u1', BC.treat, 'cat2');
      await processScan(at(hours), 'u1', s.id);
      return s;
    };
    await scanAt(0);
    expect(calls.explain).toBe(1);
    await scanAt(12);
    expect(calls.explain).toBe(1); // not asked again within the day
    await scanAt(25);
    expect(calls.explain).toBe(2); // the model cites a PDF again: next time after 7 days
    await scanAt(25 + 24 * 6);
    expect(calls.explain).toBe(2);
    await scanAt(25 + 24 * 7 + 1);
    expect(calls.explain).toBe(3); // a third time: next time after 30 days
    explainUnverified = null;
    await scanAt(25 + 24 * 7 + 1 + 24 * 29);
    expect(calls.explain).toBe(3);
    const last = await scanAt(25 + 24 * 7 + 1 + 24 * 30 + 1);
    expect(calls.explain).toBe(4);
    expect((await read(last)).explanationsStatus).toBe('ready');
  });
  it('a product not yet confirmed as a cat or dog product is checked in the database again after a day', async () => {
    const a = await newScan('u1', BC.misfiled);
    await processScan(deps(), 'u1', a.id);
    expect((await read(a)).scope).toBe('unknown');
    const b = await newScan('u1', BC.misfiled);
    await processScan({ ...deps(), now: () => new Date(NOW.getTime() + 2 * 86400000) }, 'u1', b.id);
    expect(calls['lookup:opff']).toBe(2); // within the 30-day window, but rechecked
  });
  it('a photo of a product no database knows does not call the databases again', async () => {
    const ref = await newScan('u1', BC.unknown);
    await processScan(deps(), 'u1', ref.id);
    const lookups = calls['lookup:opff'];
    const photo = await db.collection('users/u1/photos').add({ scanId: ref.id, purpose: 'nutrition', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/x/o/users%2Fu1%2Fuploads%2F1.jpg', status: 'uploaded', createdAt: Timestamp.fromDate(NOW) });
    opffDown = true; // even with the database unreachable, the photo is assessed
    await processPhoto(deps(), 'u1', photo.id);
    expect(calls['lookup:opff']).toBe(lookups);
    expect((await read(ref)).status).not.toBe('failed');
  });
  it('a verified page’s species statement survives a later re-fetch of the database record', async () => {
    const a = await newScan('u1', BC.misfiled);
    await processScan(deps({ researchEnabled: true }), 'u1', a.id);
    expect((await read(a)).productSpecies).toBe('dog');
    const b = await newScan('u1', BC.misfiled);
    await processScan({ ...deps({ researchEnabled: false, productFreshDays: 0 }) }, 'u1', b.id);
    expect(calls['lookup:opff']).toBe(2); // the record was fetched again…
    expect(await read(b)).toMatchObject({ scope: 'supported', productSpecies: 'dog' }); // …and the page's statement kept
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
  it('reads a database image again when its 2.1.0 analysis has a row 2.1.0 may have misread, keeping its other facts', async () => {
    const ref = await newScan('u1', BC.imageOnly);
    await processScan(deps(), 'u1', ref.id);
    const gtin = (await read(ref)).gtin;
    const v21 = <T extends Record<string, unknown>>(x: T) => ({ ...x, readerVersion: 'label-extract-2.1.0' });
    const facts = (await db.doc(`products/${gtin}`).get()).data()!.facts;
    facts.sources = facts.sources.map((x: Record<string, unknown>) => (x.sourceType === 'database_image' ? v21(x) : x));
    for (const k of ['guaranteedAnalysis', 'adequacy', 'calories']) facts[k].source = v21(facts[k].source);
    facts.guaranteedAnalysis.value = facts.guaranteedAnalysis.value
      .map((e: { nutrient: string }) => (e.nutrient === 'crude_fiber' ? { ...e, label: 'Crude Fiber 4.0% Moisture', value: 10 } : e))
      .filter((e: { nutrient: string }) => e.nutrient !== 'moisture');
    await db.doc(`products/${gtin}`).update({ facts });
    await db.doc(`productMeta/${gtin}`).update({ 'enrichment.databaseImages.version': 'label-extract-2.1.0' });
    const again = await newScan('u1', BC.imageOnly);
    await processScan(deps(), 'u1', again.id);
    expect(calls.dbImages).toBe(2);
    const s = await read(again);
    expect(s.diagnosticNotes).toContain('1 analysis row from Open Pet Food Facts label image that the earlier label reader may have misread was set aside; the image is read again.');
    const product = (await db.doc(`products/${gtin}`).get()).data()!;
    expect(product.facts.guaranteedAnalysis.value.find((e: { nutrient: string }) => e.nutrient === 'crude_fiber').value).toBe(4);
    expect(product.facts.guaranteedAnalysis.source.readerVersion).toBe(LABEL_EXTRACTION_VERSION);
    expect(product.facts.adequacy.source.readerVersion).toBe('label-extract-2.1.0'); // its other facts are kept
  });
  it('keeps what the previous label reader (2.1.0) read from a database image, and reads again only a panel it could not read', async () => {
    const ref = await newScan('u1', BC.imageOnly);
    await processScan(deps(), 'u1', ref.id);
    expect(calls.dbImages).toBe(1);
    const gtin = (await read(ref)).gtin;
    // As 2.1.0 saved it.
    const v21 = <T extends Record<string, unknown>>(x: T) => ({ ...x, readerVersion: 'label-extract-2.1.0' });
    const facts = (await db.doc(`products/${gtin}`).get()).data()!.facts;
    facts.sources = facts.sources.map((x: Record<string, unknown>) => (x.sourceType === 'database_image' ? v21(x) : x));
    for (const k of ['guaranteedAnalysis', 'adequacy', 'calories']) facts[k].source = v21(facts[k].source);
    await db.doc(`products/${gtin}`).update({ facts });
    await db.doc(`productMeta/${gtin}`).update({ 'enrichment.databaseImages.version': 'label-extract-2.1.0' });
    const again = await newScan('u1', BC.imageOnly);
    await processScan(deps(), 'u1', again.id);
    expect(calls.dbImages).toBe(1); // nothing is missing, so nothing is read again
    const s = await read(again);
    expect(s.status).toBe('complete');
    expect(s.diagnosticNotes.join(' ')).not.toMatch(/Dropped/);
    // The analysis panel, as if 2.1.0 had found it unreadable: the current reader reads it again.
    const { guaranteedAnalysis: _read21, ...withoutAnalysis } = facts;
    await db.doc(`products/${gtin}`).update({ facts: withoutAnalysis });
    await db.doc(`productMeta/${gtin}`).update({ 'enrichment.databaseImages': { read: [], skipped: ['nutrition: unreadable (TEST FIXTURE)'], failed: [], version: 'label-extract-2.1.0' } });
    const third = await newScan('u1', BC.imageOnly);
    await processScan(deps(), 'u1', third.id);
    expect(calls.dbImages).toBe(2);
    expect((await read(third)).status).toBe('complete');
    const product = (await db.doc(`products/${gtin}`).get()).data()!;
    expect(product.facts.guaranteedAnalysis.source.readerVersion).toBe(LABEL_EXTRACTION_VERSION);
    expect(product.facts.adequacy.source.readerVersion).toBe('label-extract-2.1.0'); // what 2.1.0 read is kept
  });
  it('results of an earlier research method are read again (they could take who a product is for from a retailer’s title); a current one is not', async () => {
    const ref = await newScan('u1', BC.webOnly);
    await processScan(deps({ researchEnabled: true }), 'u1', ref.id);
    expect(calls.research).toBe(1);
    const gtin = (await read(ref)).gtin;
    const v17 = <T extends Record<string, unknown>>(x: T) => ({ ...x, readerVersion: 'research-1.7.0' });
    const facts = (await db.doc(`products/${gtin}`).get()).data()!.facts;
    facts.sources = facts.sources.map((x: Record<string, unknown>) => (x.sourceType === 'manufacturer' ? v17(x) : x));
    for (const k of ['ingredientsText', 'ingredients', 'guaranteedAnalysis', 'adequacy']) facts[k].source = v17(facts[k].source);
    await db.doc(`products/${gtin}`).update({ facts });
    await db.doc(`productMeta/${gtin}`).update({ 'enrichment.research.version': 'research-1.7.0' });
    const again = await newScan('u1', BC.webOnly);
    await processScan(deps({ researchEnabled: true }), 'u1', again.id);
    expect(calls.research).toBe(2);
    expect((await read(again)).diagnosticNotes.join(' ')).toMatch(/Dropped .* under older rules/);
    const product = (await db.doc(`products/${gtin}`).get()).data()!;
    expect(product.facts.guaranteedAnalysis.source.readerVersion).toBe(RESEARCH_VERSION);
    expect(product.facts.adequacy.source.readerVersion).toBe(RESEARCH_VERSION);
    const after = await newScan('u1', BC.webOnly);
    await processScan(deps({ researchEnabled: true }), 'u1', after.id);
    expect(calls.research).toBe(2); // nothing missing and the method is current
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
  it('a barcode database that does not answer is an outage: nothing found then is tried again after 12 hours, and said as such', async () => {
    hintDown = true;
    const ref = await newScan('u1', BC.unknown);
    await processScan(deps({ researchEnabled: true }), 'u1', ref.id);
    const s = await read(ref);
    expect(calls.hint).toBe(1);
    expect(s.fieldStatus.map((x: { status: string }) => x.status)).toEqual(s.photoRequests.map(() => 'source_unavailable'));
    expect(s.photoRequests[0].reason).toMatch(/^The barcode database wasn’t available, so the search had only the barcode to go on, and none of the pages it could check shows this barcode; Purrbi tries again later\. /);
    // Said once: the other cards say only what their photo adds (test A, 2026-10-30: the sentence was repeated on each card).
    expect(s.photoRequests.length).toBeGreaterThan(1);
    expect(s.photoRequests.slice(1).every((p: { reason: string }) => !p.reason.includes('barcode database'))).toBe(true);
    expect(s.evidenceNotes.join(' ')).toMatch(/barcode database wasn’t available/);
    const again = await newScan('u1', BC.unknown);
    await processScan(deps({ researchEnabled: true }), 'u1', again.id);
    expect(calls.research).toBe(1); // not repeated at once
    hintDown = false;
    const later = await newScan('u1', BC.unknown);
    await processScan({ ...deps({ researchEnabled: true }), now: () => new Date(NOW.getTime() + 13 * 3600 * 1000) }, 'u1', later.id);
    expect(calls.research).toBe(2); // tried again after 12 hours
    expect((await read(later)).fieldStatus.every((x: { status: string }) => x.status === 'not_found')).toBe(true);
  });
  it('a page found while the barcode database was paused, without who the product is for, is searched again once the database answers (trace cdee0a88-3ff)', async () => {
    hintDown = true;
    hintResetAt = new Date(NOW.getTime() + 20 * 3600 * 1000);
    partialPage = true;
    const first = await newScan('u1', BC.unknown);
    await processScan(deps({ researchEnabled: true }), 'u1', first.id);
    const gtin = (await read(first)).gtin;
    expect(calls.research).toBe(1);
    expect((await read(first)).productName).toBe('TEST FIXTURE ウェルネス グレービー 85g');
    expect((await db.doc(`productMeta/${gtin}`).get()).data()!.enrichment.research.outcome).toBe('hint_failed');
    // Said as it is: a page was found, it doesn't say who the product is for.
    expect((await read(first)).fieldStatus[0].detail).toBe('A page showing this barcode was found (shop.example.jp), but not this; the barcode database wasn’t available for more search words, so Purrbi searches again once it is.');
    // 13 hours later the database is still paused: the same search without its words is not repeated.
    const later = await newScan('u1', BC.unknown);
    await processScan({ ...deps({ researchEnabled: true }), now: () => new Date(NOW.getTime() + 13 * 3600 * 1000) }, 'u1', later.id);
    expect(calls.research).toBe(1);
    expect(calls.hint).toBe(1);
    // Once it answers again, the database is asked (the name came only from a web page) and research runs.
    hintDown = false;
    const after = await newScan('u1', BC.unknown);
    await processScan({ ...deps({ researchEnabled: true }), now: () => new Date(NOW.getTime() + 21 * 3600 * 1000) }, 'u1', after.id);
    expect(calls.research).toBe(2);
    expect(calls.hint).toBe(2);
    // A page tied to the barcode that adds nothing the record lacks is said as such (trace 99877a3e-234).
    expect((await read(after)).evidenceNotes).toContain('shop.example.jp matches this product (checked on the page) but shows nothing its record lacks, so nothing was added.');
    // Its answer (no record) is kept: a later run reuses it instead of asking again.
    expect((await db.doc(`productMeta/${gtin}`).get()).data()!.enrichment.hintAt).toBeTruthy();
    await db.doc(`productMeta/${gtin}`).update({ 'enrichment.research.version': 'research-2.6.0' });
    const again = await newScan('u1', BC.unknown);
    await processScan({ ...deps({ researchEnabled: true }), now: () => new Date(NOW.getTime() + 22 * 3600 * 1000) }, 'u1', again.id);
    expect(calls.research).toBe(3);
    expect(calls.hint).toBe(2);
    // A product a database record names is not looked up in the barcode database.
    calls = {};
    const named = await newScan('u1', BC.webOnly);
    await processScan(deps({ researchEnabled: true }), 'u1', named.id);
    expect(calls.research).toBe(1);
    expect(calls.hint ?? 0).toBe(0);
  });
  it('the barcode database is not asked while today’s AI budget is used up (review of research 2.7.0)', async () => {
    await db.doc(`system/aiUsage_${NOW.toISOString().slice(0, 10).replace(/-/g, '')}`).set({ calls: 100000 });
    const ref = await newScan('u1', BC.unknown);
    await processScan(deps({ researchEnabled: true }), 'u1', ref.id);
    expect(calls.hint ?? 0).toBe(0); // (the mocked research itself does not check the budget)
  });
  it('pages that could not be reached are searched again after 12 hours, 2 days and 7 days, then no more (review of research 2.7.0)', async () => {
    pagesDown = true;
    const at = (h: number) => ({ ...deps({ researchEnabled: true }), now: () => new Date(NOW.getTime() + h * 3600 * 1000) });
    for (const [h, expected] of [[0, 1], [6, 1], [13, 2], [40, 2], [62, 3], [200, 3], [231, 4], [400, 4], [600, 4]] as const) {
      const ref = await newScan('u1', BC.unknown);
      await processScan(at(h), 'u1', ref.id);
      expect(calls.research, `after ${h} h`).toBe(expected);
    }
  });
  it('another research model is a new method: a product still missing information is searched again with it, a complete one is not (2026-10-31: gpt-5-mini)', async () => {
    const scan = async (d: Deps, bc: string) => processScan(d, 'u1', (await newScan('u1', bc)).id);
    const first = deps({ researchEnabled: true });
    const unknown = await newScan('u1', BC.unknown);
    await processScan(first, 'u1', unknown.id);
    await scan(first, BC.webOnly);
    expect(calls.research).toBe(2);
    const meta = async () => (await db.doc(`productMeta/${(await read(unknown)).gtin}`).get()).data()!.enrichment.research;
    expect(await meta()).toMatchObject({ model: 'mock', outcome: 'done', version: RESEARCH_VERSION });
    // The same model: nothing is searched again.
    await scan(first, BC.unknown);
    await scan(first, BC.webOnly);
    expect(calls.research).toBe(2);
    // Another model: the product still missing information only, then not again with that model.
    const other = deps({ researchEnabled: true, researchModel: 'mock-2' });
    await scan(other, BC.unknown);
    await scan(other, BC.webOnly);
    expect(calls.research).toBe(3);
    expect(researchOpts.at(-1)?.model).toBe('mock-2');
    expect(await meta()).toMatchObject({ model: 'mock-2', outcome: 'done' });
    await scan(other, BC.unknown);
    expect(calls.research).toBe(3);
    // A run saved before runs recorded their model counts as another model's.
    await db.doc(`productMeta/${(await read(unknown)).gtin}`).update({ 'enrichment.research.model': FieldValue.delete() });
    await scan(other, BC.unknown);
    expect(calls.research).toBe(4);
  });
  it('research the time limit stopped before its first search is not saved as searched, says so, and runs on the next scan (review of research 2.8.0)', async () => {
    researchCut = 'not_started';
    const first = await newScan('u1', BC.unknown);
    await processScan(deps({ researchEnabled: true }), 'u1', first.id);
    const s = await read(first);
    expect(calls.research).toBe(1);
    expect((await db.doc(`productMeta/${s.gtin}`).get()).data()?.enrichment?.research ?? null).toBeNull();
    expect(s.fieldStatus.every((x: { status: string }) => x.status === 'not_searched')).toBe(true);
    expect(s.photoRequests[0].reason).toMatch(/^The manufacturer’s page hasn’t been searched yet: this scan ran out of time before the search, and the next scan searches for it\. /);
    expect(s.evidenceNotes.join(' ')).not.toMatch(/Searched the manufacturer’s and retailers’ pages/);
    researchCut = 'none';
    await processScan(deps({ researchEnabled: true }), 'u1', (await newScan('u1', BC.unknown)).id);
    expect(calls.research).toBe(2);
  });
  it('with too little of the scan’s time left for a search, research is not started: no allowance or barcode-database request is spent (review of research 2.8.0)', async () => {
    const short = deps({ researchEnabled: true, researchTimeLimitMs: 30000 });
    const first = await newScan('u1', BC.unknown);
    await processScan(short, 'u1', first.id);
    const s = await read(first);
    expect(calls.research ?? 0).toBe(0);
    expect(calls.hint ?? 0).toBe(0);
    expect((await db.doc(`usage/u1_${NOW.toISOString().slice(0, 10).replace(/-/g, '')}`).get()).data()?.research ?? 0).toBe(0);
    expect(s.diagnosticNotes.join(' ')).toMatch(/Research not run: too little of the scan’s time was left for a search/);
    expect(s.fieldStatus.every((x: { status: string }) => x.status === 'not_searched')).toBe(true);
    await processScan(deps({ researchEnabled: true }), 'u1', (await newScan('u1', BC.unknown)).id);
    expect(calls.research).toBe(1);
    expect(calls.hint).toBe(1);
  });
  it('a search the time limit cut short that found nothing did not finish: it is said so and tried again after 12 hours, not saved as not found (review of research 2.8.0)', async () => {
    researchCut = 'cut';
    const at = (h: number) => ({ ...deps({ researchEnabled: true }), now: () => new Date(NOW.getTime() + h * 3600 * 1000) });
    const first = await newScan('u1', BC.unknown);
    await processScan(at(0), 'u1', first.id);
    const s = await read(first);
    expect((await db.doc(`productMeta/${s.gtin}`).get()).data()!.enrichment.research).toMatchObject({ outcome: 'time_limited', attempts: 1 });
    expect(s.fieldStatus.every((x: { status: string }) => x.status === 'source_unavailable')).toBe(true);
    expect(s.photoRequests[0].reason).toMatch(/^The search ran out of the scan’s time before it was done, and no page it checked so far shows this barcode; Purrbi searches again later\. /);
    expect(s.evidenceNotes.join(' ')).toMatch(/ran out of the scan’s time/);
    await processScan(at(6), 'u1', (await newScan('u1', BC.unknown)).id);
    expect(calls.research).toBe(1);
    researchCut = 'none';
    const later = await newScan('u1', BC.unknown);
    await processScan(at(13), 'u1', later.id);
    expect(calls.research).toBe(2);
    expect((await read(later)).fieldStatus.every((x: { status: string }) => x.status === 'not_found')).toBe(true);
  });
  it('pages the search named that turn automated readers away are said as such, not as “found nothing”; a page that is gone is not one of them; the trace keeps twenty research notes (test A on gpt-5-mini, 2026-10-31)', async () => {
    hintDown = true;
    refusingPages = true;
    const ref = await newScan('u1', BC.unknown);
    await processScan(deps({ researchEnabled: true }), 'u1', ref.id);
    const s = await read(ref);
    const said = 'The pages found for this barcode (ebay.com) turn automated readers away, and the barcode database wasn’t available for more search words; Purrbi searches again once it is.';
    expect(s.fieldStatus[0]).toMatchObject({ status: 'source_unavailable', detail: said });
    expect(s.evidenceNotes).toContain(said);
    expect(s.diagnosticNotes.filter((n: string) => n.startsWith('Research (mock): '))).toHaveLength(20);
    hintDown = false;
    const done = await newScan('u1', BC.unknown);
    await processScan({ ...deps({ researchEnabled: true }), now: () => new Date(NOW.getTime() + 13 * 3600 * 1000) }, 'u1', done.id);
    const d = await read(done);
    expect(d.fieldStatus[0].detail).toBe('The pages found for this barcode (ebay.com) turn automated readers away, so it couldn’t be checked there.');
    expect(d.evidenceNotes).toContain('The pages found for this barcode (ebay.com) turn automated readers away, so nothing could be checked there or added.');
  });
  it('after a research model switch, a search under the new model that fails says so, not the old model’s “not found” (review of research 2.8.0)', async () => {
    await processScan(deps({ researchEnabled: true }), 'u1', (await newScan('u1', BC.unknown)).id);
    researchThrows = true;
    const failed = await newScan('u1', BC.unknown);
    await processScan(deps({ researchEnabled: true, researchModel: 'mock-2' }), 'u1', failed.id);
    const f = await read(failed);
    expect(calls.research).toBe(2);
    expect(f.fieldStatus.every((x: { status: string }) => x.status === 'source_unavailable')).toBe(true);
    expect(f.photoRequests[0].reason).toMatch(/^Purrbi’s search for the manufacturer’s page didn’t work just now; it tries again later\. /);
  });
  it('a used-up daily allowance of the barcode database is not asked again before it resets (2026-10-30: HTTP 429 on every scan)', async () => {
    hintDown = true;
    hintResetAt = new Date(NOW.getTime() + 2 * 3600 * 1000);
    const first = await newScan('u1', BC.unknown);
    await processScan(deps({ researchEnabled: true }), 'u1', first.id);
    expect(calls.hint).toBe(1);
    expect((await read(first)).diagnosticNotes).toContain('Barcode database not checked: it is limiting requests until 2026-10-28 14:00 UTC');
    // Another product without a name an hour later: the barcode database is not asked, and research still runs.
    const other = await newScan('u1', withCheck('761234567891'));
    await processScan({ ...deps({ researchEnabled: true }), now: () => new Date(NOW.getTime() + 3600 * 1000) }, 'u1', other.id);
    expect(calls.hint).toBe(1);
    expect(calls.research).toBe(2);
    const o = await read(other);
    expect(o.diagnosticNotes).toContain('Barcode database not checked: its daily allowance is used up until 2026-10-28 14:00 UTC, so it isn’t asked before then');
    expect(o.fieldStatus.every((x: { status: string }) => x.status === 'source_unavailable')).toBe(true);
    // After the reset it is asked again.
    hintDown = false;
    const third = await newScan('u1', withCheck('761234567892'));
    await processScan({ ...deps({ researchEnabled: true }), now: () => new Date(NOW.getTime() + 3 * 3600 * 1000) }, 'u1', third.id);
    expect(calls.hint).toBe(2);
  });
  it('the name and brand an earlier method took from a page showing the barcode guide research and stay when it finds nothing', async () => {
    identityPage = true;
    const first = await newScan('u1', BC.unknown);
    await processScan(deps({ researchEnabled: true }), 'u1', first.id);
    const gtin = (await read(first)).gtin;
    expect((await read(first)).productName).toBe('TEST FIXTURE Dog Trt Frz Dr Wld Salmn');
    // As research 1.7.0 saved it.
    const facts = (await db.doc(`products/${gtin}`).get()).data()!.facts;
    facts.sources = facts.sources.map((x: Record<string, unknown>) => ({ ...x, readerVersion: 'research-1.7.0' }));
    for (const k of ['productName', 'brand']) facts[k].source = { ...facts[k].source, readerVersion: 'research-1.7.0' };
    await db.doc(`products/${gtin}`).update({ facts });
    await db.doc(`productMeta/${gtin}`).update({ 'enrichment.research.version': 'research-1.7.0' });
    identityPage = false; // this time the search finds nothing
    researchOpts = [];
    calls = {};
    const second = await newScan('u1', BC.unknown);
    await processScan(deps({ researchEnabled: true }), 'u1', second.id);
    const s = await read(second);
    expect(researchOpts[0]).toMatchObject({ knownName: 'TEST FIXTURE Dog Trt Frz Dr Wld Salmn', knownBrand: 'TESTBRAND' }); // searched by name
    // A name in Latin script is known (from a page showing the barcode): the barcode database is not asked; it is
    // asked only when no name, or only a name in another script, is known (research 2.7.0, trace cdee0a88-3ff).
    expect(calls.hint ?? 0).toBe(0);
    expect(s.productName).toBe('TEST FIXTURE Dog Trt Frz Dr Wld Salmn');
    expect(s.brand).toBe('TESTBRAND');
    expect(s.productFound).toBe(true);
    expect(s.diagnosticNotes.join(' ')).toMatch(/Kept the product’s product name and brand from teststore\.example, which shows this barcode/);
    expect(s.productCategory).toBe('treat'); // what that page's own words said it is
    // Who it is for is read again: the retailer's title says dogs (unconfirmed); the earlier method's "intended for cats" is not taken.
    expect(s.productSpeciesSet).toEqual(['dog']);
    expect(s.speciesConfirmed).toBe(false);
    expect((await db.doc(`products/${gtin}`).get()).data()!.facts.productName.value).toBe('TEST FIXTURE Dog Trt Frz Dr Wld Salmn'); // the shared record keeps it
  });
  it('each photo request says why its information is missing: a provider error, a search not made, nothing on the sources', async () => {
    researchThrows = true;
    const failed = await newScan('u1', BC.unknown);
    await processScan(deps({ researchEnabled: true }), 'u1', failed.id);
    const f = await read(failed);
    researchThrows = false;
    expect(f.status).toBe('needs_photos');
    expect(f.errorCode).toBe('');
    expect(f.fieldStatus.map((x: { status: string }) => x.status)).toEqual(f.photoRequests.map(() => 'source_unavailable'));
    expect(f.photoRequests[0].reason).toMatch(/^Purrbi’s search for the manufacturer’s page didn’t work just now; it tries again later\. /);
    expect(JSON.stringify(f.photoRequests)).not.toMatch(/unknown/i);
    // Research switched off: not searched, said as such.
    const off = await newScan('u2', BC.unknown);
    await processScan(deps({ researchEnabled: false }), 'u2', off.id);
    expect((await read(off)).fieldStatus.every((x: { status: string }) => x.status === 'not_searched')).toBe(true);
    // Research ran and found no page for the barcode: not found, with the date it was checked.
    const none = await newScan('u1', BC.unknown);
    await processScan(deps({ researchEnabled: true }), 'u1', none.id);
    const n = await read(none);
    expect(n.fieldStatus.every((x: { status: string }) => x.status === 'not_found')).toBe(true);
    expect(n.photoRequests[0].reason).toMatch(/^No manufacturer or retailer page could be matched to this barcode \(checked \d{4}-\d{2}-\d{2}\)\. /);
  });
});

describe('saved results under older rules', () => {
  // A product identified only by an earlier research method (research-1.7.0), as many were before this release.
  async function researchedUnder17() {
    const ref = await newScan('u1', BC.webOnly);
    await processScan(deps({ researchEnabled: true }), 'u1', ref.id);
    const gtin = (await read(ref)).gtin;
    const v17 = <T extends Record<string, unknown>>(x: T) => ({ ...x, readerVersion: 'research-1.7.0' });
    const facts = (await db.doc(`products/${gtin}`).get()).data()!.facts;
    facts.sources = facts.sources.map((x: Record<string, unknown>) => (x.sourceType === 'manufacturer' ? v17(x) : x));
    for (const k of ['ingredientsText', 'ingredients', 'guaranteedAnalysis', 'adequacy']) facts[k].source = v17(facts[k].source);
    await db.doc(`products/${gtin}`).update({ facts });
    await db.doc(`productMeta/${gtin}`).update({ 'enrichment.research.version': 'research-1.7.0' });
    await ref.update({ assessmentVersion: 'assessment-2.4.0' });
    return { ref, gtin };
  }
  const refresh = async (ref: FirebaseFirestore.DocumentReference, d = deps({ researchEnabled: true }), petId = 'cat2') => {
    const before = await read(ref);
    await ref.update({ refreshPersonalRequested: true, petId });
    await handleScanUpdate(d, 'u1', ref.id, before, await read(ref));
    return read(ref);
  };
  it('a provider error during the re-check keeps what earlier research verified, and the result is checked again later', async () => {
    const { ref, gtin } = await researchedUnder17();
    const known = await read(ref);
    researchThrows = true;
    const s = await refresh(ref);
    expect(calls.research).toBe(2);
    expect(s.productFound).toBe(true);
    expect(s.productName).toBe(known.productName);
    expect(s.scoreText).toBe(known.scoreText);
    expect(s.assessmentVersion).toBe('assessment-2.4.0'); // not marked current: asked for again
    expect(s.diagnosticNotes.join(' ')).toMatch(/Kept what earlier research verified/);
    expect((await db.doc(`products/${gtin}`).get()).data()!.facts.guaranteedAnalysis.source.readerVersion).toBe('research-1.7.0'); // the shared record isn't stripped
    // Research works again: the next opening re-checks it under the current method.
    researchThrows = false;
    const t = await refresh(ref);
    expect(calls.research).toBe(3);
    expect(t.assessmentVersion).toBe(ASSESSMENT_VERSION);
    expect((await db.doc(`products/${gtin}`).get()).data()!.facts.guaranteedAnalysis.source.readerVersion).toBe(RESEARCH_VERSION);
  });
  it('a pet change cannot read sources again: it keeps the earlier research in the shared record and leaves the result to be re-checked', async () => {
    const { ref, gtin } = await researchedUnder17();
    await ref.update({ assessmentVersion: ASSESSMENT_VERSION }); // a current result whose product record still holds 1.7.0 facts
    const s = await refresh(ref, deps({ researchEnabled: true }), 'cat1');
    expect(calls.research).toBe(1); // no re-read in a pet change
    expect(s.petName).toBe('Miso');
    expect(s.productFound).toBe(true);
    expect(s.assessmentVersion).toBe(''); // asked for again with the sources
    expect((await db.doc(`products/${gtin}`).get()).data()!.facts.adequacy.source.readerVersion).toBe('research-1.7.0');
  });
  it('re-checks have their own daily quota: past it, the saved evidence is used and the version kept', async () => {
    const { ref } = await researchedUnder17();
    await db.doc(`usage/u1_${NOW.toISOString().slice(0, 10).replace(/-/g, '')}`).set({ refreshes: DEFAULT_LIMITS.refreshesPerUserPerDay }, { merge: true });
    const s = await refresh(ref);
    expect(calls.research).toBe(1);
    expect(s.assessmentVersion).toBe('assessment-2.4.0');
    expect(s.diagnosticNotes.join(' ')).toMatch(/re-checks are used up/);
  });
  it('a result made by newer rules is left as it is', async () => {
    const ref = await newScan('u1', BC.treat, 'cat2');
    await processScan(deps(), 'u1', ref.id);
    await ref.update({ assessmentVersion: 'assessment-9.0.0', personalState: 'from-a-newer-release' });
    const s = await refresh(ref);
    expect(s.personalState).toBe('from-a-newer-release');
    expect(s.assessmentVersion).toBe('assessment-9.0.0');
    expect(s.refreshPersonalRequested).toBe(false);
  });
  it('an out-of-scope result saved under older rules is checked again', async () => {
    const ref = await newScan('u1', BC.misfiled);
    await processScan(deps({ researchEnabled: true }), 'u1', ref.id);
    const fresh = await read(ref);
    expect(fresh.scope).toBe('supported');
    // As an earlier release left it: "food for people".
    await ref.update({ status: 'out_of_scope', scope: 'out_of_scope', assessmentVersion: 'assessment-2.4.0' });
    const s = await refresh(ref);
    expect(s.scope).toBe('supported');
    expect(s.status).not.toBe('out_of_scope');
    expect(s.assessmentVersion).toBe(ASSESSMENT_VERSION);
  });
  it('a full re-check asks for the photos the current rules need, unless the owner chose to continue without them', async () => {
    const ref = await newScan('u1', BC.ingrImage, 'cat2');
    await processScan(deps(), 'u1', ref.id);
    const fresh = await read(ref);
    expect(fresh.status).toBe('needs_photos');
    await ref.update({ status: 'complete', photoRequests: [], assessmentVersion: 'assessment-2.4.0' });
    const s = await refresh(ref, deps());
    expect(s.status).toBe('needs_photos');
    expect(s.photoRequests.length).toBeGreaterThan(0);
    await ref.update({ status: 'complete', skipPhotos: true, assessmentVersion: 'assessment-2.4.0' });
    const skipped = await refresh(ref, deps());
    expect(skipped.status).toBe('complete');
  });
  it('a refresh that stopped with its job no longer blocks the next one', async () => {
    const ref = await newScan('u1', BC.treat, 'cat2');
    await ref.update({ status: 'researching', refreshPersonalRequested: true, retryRequested: true, updatedAt: Timestamp.fromDate(new Date(NOW.getTime() - 10 * 60000)) });
    await processScan(deps(), 'u1', ref.id, 'retry');
    const s = await read(ref);
    expect(s.status).toBe('complete');
    expect(s.refreshPersonalRequested).toBe(false);
  });
});

describe('explanations reach every row that asks for them', () => {
  it('a spelling variant of a cached term gets the same checked claims', async () => {
    const a = await newScan('u1', BC.hyphenA);
    await processScan(deps(), 'u1', a.id);
    const rowA = (await read(a)).ingredientRows.find((r: { name: string }) => r.name === 'Mannan-Oligosaccharides');
    expect(rowA.sources.length).toBeGreaterThan(0);
    const explained = calls.explainTerms;
    const b = await newScan('u1', BC.hyphenB);
    await processScan(deps(), 'u1', b.id);
    const rowB = (await read(b)).ingredientRows.find((r: { name: string }) => r.name === 'Mannan Oligosaccharides');
    expect(calls.explainTerms).toBe(explained); // reused, not paid for again
    expect(rowB.sources.length).toBe(rowA.sources.length);
    expect(rowB.statusRole).toBe(rowA.statusRole);
  });
  it('the per-run cap applies to the terms still missing, so the next scan explains the next ones', async () => {
    const first = await newScan('u1', BC.longList);
    await processScan(deps(), 'u1', first.id);
    const one = calls.explainTerms;
    expect(one).toBe(24);
    expect((await read(first)).explanationsStatus).toBe('partial');
    const second = await newScan('u1', BC.longList);
    await processScan(deps(), 'u1', second.id);
    expect(calls.explainTerms - one).toBeGreaterThan(0);
    expect((await read(second)).explanationsStatus).toBe('ready');
  });
  it('a supplement’s rows are its actives and its inactive ingredients, and amounts never reach explanation terms', async () => {
    const ref = await newScan('u1', BC.supplement);
    await processScan(deps(), 'u1', ref.id);
    const s = await read(ref);
    expect(s.ingredientRows.map((r: { name: string }) => r.name)).toEqual(['Glucosamine HCl', 'MSM', 'Chondroitin Sulfate', 'Brewers Dried Yeast', 'Chicken Liver Flavor', 'Glycerin']);
    const keys = (await db.collection('knowledge').get()).docs.map((d) => d.id);
    expect(keys.some((k) => /\d+-mg|active-ingredients|inactive/.test(k))).toBe(false);
  });
  it('explanations handed to a run of their own are added from the saved evidence', async () => {
    const ref = await newScan('u1', BC.hyphenA);
    await processScan(deps({ explanationsEnabled: false }), 'u1', ref.id);
    const before = await read(ref);
    expect(before.ingredientRows.find((r: { name: string }) => r.name === 'Mannan-Oligosaccharides').sources).toEqual([]);
    await ref.update({ explanationsQueued: true }); // as a job that reached its explanations late leaves it
    await handleScanUpdate(deps(), 'u1', ref.id, before, await read(ref));
    const s = await read(ref);
    expect(s.explanationsQueued).toBe(false);
    expect(s.ingredientRows.find((r: { name: string }) => r.name === 'Mannan-Oligosaccharides').sources.length).toBeGreaterThan(0);
    expect(calls.research ?? 0).toBe(0); // no source read again
  });
  it('explanations queued on a result made by newer rules leave that result as it is', async () => {
    const ref = await newScan('u1', BC.hyphenA);
    await processScan(deps({ explanationsEnabled: false }), 'u1', ref.id);
    await ref.update({ assessmentVersion: 'assessment-9.0.0', personalState: 'from-a-newer-release' });
    const before = await read(ref);
    await ref.update({ explanationsQueued: true });
    await handleScanUpdate(deps(), 'u1', ref.id, before, await read(ref));
    const s = await read(ref);
    expect(s.explanationsQueued).toBe(false);
    expect(s.personalState).toBe('from-a-newer-release');
    expect(s.assessmentVersion).toBe('assessment-9.0.0');
  });
});

describe('explanations shown under earlier rules all get an audit record', () => {
  const legacy = (term: string, status: string) => ({ key: '', term, kind: 'ingredient', species: 'cat', status, summary: status === 'verified' ? 'TEST FIXTURE summary shown under the earlier rules.' : '', role: '', sourceTitle: 'TEST FIXTURE page', sourceUrl: 'https://vcahospitals.com/test-fixture', quote: 'TEST FIXTURE quote.', reason: '', checkedAt: NOW.toISOString(), model: 'mock', version: 'explain-1.2.0' });
  it('a term no scan asks for any more (tuna broth is now in the role table) is withdrawn by the sweep; one never shown is removed', async () => {
    await db.doc('knowledge/cat_ingredient_tuna-broth').set({ ...legacy('Tuna Broth', 'verified'), key: 'cat_ingredient_tuna-broth' });
    await db.doc('knowledge/cat_ingredient_mystery').set({ ...legacy('Mystery', 'unverified'), key: 'cat_ingredient_mystery' });
    const ref = await newScan('u1', BC.food, 'cat2');
    await processScan(deps(), 'u1', ref.id);
    const audit = await db.doc('knowledgeAudit/cat_ingredient_tuna-broth__explain-1.2.0').get();
    expect(audit.exists).toBe(true);
    expect(audit.get('oldSummary')).toBe('TEST FIXTURE summary shown under the earlier rules.');
    expect((await db.doc('knowledge/cat_ingredient_tuna-broth').get()).get('version')).toBe('withdrawn explain-1.2.0');
    expect((await db.doc('knowledge/cat_ingredient_mystery').get()).exists).toBe(false);
  });
  it('an earlier explanation overwritten without having been withdrawn gets its audit record in the same write', async () => {
    await db.doc('knowledge/cat_ingredient_taurine').set({ ...legacy('Taurine', 'verified'), key: 'cat_ingredient_taurine', claims: [{ claimType: 'identity', claim: 'TEST FIXTURE claim.' }] });
    await writeExplanations(db, [{ key: 'cat_ingredient_taurine', term: 'Taurine', kind: 'ingredient', species: 'cat', status: 'verified', claims: [], rejected: [], summary: 'TEST FIXTURE new.', role: '', sourceTitle: '', sourceUrl: '', quote: '', reason: '', checkedAt: NOW.toISOString(), model: 'mock', judgeModel: 'mock', version: EXPLAIN_VERSION }], NOW);
    const audit = await db.doc('knowledgeAudit/cat_ingredient_taurine__explain-1.2.0').get();
    expect(audit.exists).toBe(true);
    expect(audit.get('oldClaims')).toHaveLength(1);
    expect((await db.doc('knowledge/cat_ingredient_taurine').get()).get('version')).toBe(EXPLAIN_VERSION);
  });
});
