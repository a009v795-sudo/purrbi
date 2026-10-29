// Classification from the product's own evidence, never from the database a record is filed in.
// Regression for barcode 099482480882 (Whole Paws "Grain free chicken & Pea recipe"): Open Food Facts
// files it as product_type "food" with no categories (imported by a human-food app), and Purrbi
// rejected it as human food because it was not in Open Pet Food Facts. Inputs below are that record
// as Open Food Facts returned it on 2026-10-29 (GitHub run 40935497833), and other real records.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { normalizeBarcode } from '../../src/domain/barcode';
import { classifyScope, feedMarkers } from '../../src/domain/scope';
import { lookupOpenFacts, openFactsToFacts } from '../../src/sources/openFacts';
import { checkRecalls } from '../../src/sources/openfda';
import { compareRecipes } from '../../src/sources/research';

afterEach(() => vi.unstubAllGlobals());

const WHOLE_PAWS_INGREDIENTS =
  'Chicken, Chicken Meal, Peas, Garbanzo Beans, Turkey Meal, Chicken Fat (preserved with mixed tocopherols), Flaxseed, Dried Plain Beet Pulp, Natural Flavor, Salmon Oil (preserved with mixed tocopherols), Salt, Choline Chloride, Dried Cranberries, Fructooligosaccharides, Pumpkin, Apples, Dried Carrots, Taurine';
const wholePaws = { origin: 'off' as const, recordType: 'food', categoriesTags: [] as string[], texts: ['Grain free chicken & Pea recipe'], ingredientsText: WHOLE_PAWS_INGREDIENTS };

describe('classification by evidence, not by database', () => {
  it('does not call a pet food "human food" because Open Food Facts files it (099482480882)', () => {
    const r = classifyScope(wholePaws);
    expect(r.status).toBe('unknown'); // unresolved: research and, if needed, a label photo decide
    expect(r.outOfScopeKind).toBeUndefined();
    expect(r.reason).toMatch(/looks like an animal food/);
    expect(r.signals).toEqual(expect.arrayContaining(['record-type:food', 'unresolved']));
    expect(r.signals.find((s) => s.startsWith('feed-ingredients:'))).toBeDefined();
    expect(feedMarkers(WHOLE_PAWS_INGREDIENTS)).toEqual(expect.arrayContaining(['meat meal', 'beet pulp', 'preserved with mixed tocopherols', 'choline chloride']));
  });
  it('accepts it once a verified page says who it is for', () => {
    const r = classifyScope({ ...wholePaws, texts: [...wholePaws.texts, 'intended for dogs'] });
    expect(r).toMatchObject({ status: 'supported', species: 'dog', category: 'complete_food' });
  });
  it('keeps a product unresolved when nothing says what it is, wherever it is filed', () => {
    expect(classifyScope({ origin: 'off', recordType: 'food', categoriesTags: [], texts: ['Original'] }).status).toBe('unknown');
    expect(classifyScope({ origin: 'opff', recordType: 'petfood', categoriesTags: [], texts: ['Festival'] }).status).toBe('unknown');
  });
  it('calls a product out of scope only on affirmative evidence, and says which', () => {
    // Real record: 3168930010265, Open Food Facts categories as returned on 2026-10-29.
    const cereal = classifyScope({ origin: 'off', recordType: 'food', categoriesTags: ['en:plant-based-foods-and-beverages', 'en:breakfasts', 'en:cereals-and-their-products', 'en:breakfast-cereals'], texts: ['cruesly mélange de noix'] });
    expect(cereal).toMatchObject({ status: 'out_of_scope', outOfScopeKind: 'human_food' });
    expect(cereal.reason).toMatch(/its record lists it under .*breakfast cereals.*nothing on it says it is made for cats or dogs/);
    expect(classifyScope({ origin: 'off', recordType: 'food', categoriesTags: [], texts: ['Cola', 'intended for people'] }).outOfScopeKind).toBe('human_food');
    expect(classifyScope({ origin: 'obf', recordType: 'beauty', categoriesTags: ['en:shampoos'], texts: ['Gentle shampoo'] }).status).toBe('out_of_scope');
  });
  it('trusts the product over the database in both directions', () => {
    // A cat food misfiled in Open Food Facts but categorised as cat food.
    expect(classifyScope({ origin: 'off', recordType: 'food', categoriesTags: ['en:cat-food'], texts: ['Chicken pate'] })).toMatchObject({ status: 'supported', species: 'cat' });
    // Human categories but feed ingredients: conflicting, so unresolved, not rejected.
    expect(classifyScope({ ...wholePaws, categoriesTags: ['en:meals'] }).status).toBe('unknown');
    // "Hot dogs" are food for people, not a dog product.
    expect(classifyScope({ origin: 'off', recordType: 'food', categoriesTags: ['en:sausages', 'en:hot-dogs'], texts: ['Beef hot dogs'] })).toMatchObject({ status: 'out_of_scope', outOfScopeKind: 'human_food' });
  });
});

describe('Open*Facts lookups: a miss says where the record is filed', () => {
  const barcode = normalizeBarcode('099482480882');
  it('stops at "found with a different product type" and reports the type (one call, not every variant)', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ status: 0, status_verbose: 'product found with a different product type: food' }), { status: 404 }));
    vi.stubGlobal('fetch', fetchMock);
    const r = await lookupOpenFacts('opff', barcode, 'test', new Date('2026-10-29T00:00:00Z'));
    expect(r).toMatchObject({ found: false, otherType: 'food' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('reports that no database has it when every variant is "product not found"', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ status: 0, status_verbose: 'product not found' }), { status: 404 })));
    expect(await lookupOpenFacts('opff', barcode, 'test', new Date('2026-10-29T00:00:00Z'))).toMatchObject({ found: false, otherType: null });
  });
  it('an empty or unknown answer is a failure the owner can retry, never "not found"', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 200 })));
    await expect(lookupOpenFacts('opff', barcode, 'test', new Date('2026-10-29T00:00:00Z'))).rejects.toMatchObject({ kind: 'parse' });
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ hello: 'world' }), { status: 200 })));
    await expect(lookupOpenFacts('opff', barcode, 'test', new Date('2026-10-29T00:00:00Z'))).rejects.toMatchObject({ kind: 'parse' });
  });
  it('a recall check that got an empty answer failed; it is not "none found"', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 200 })));
    const r = await checkRecalls({ brand: 'TESTBRAND', productName: 'TEST FIXTURE', gtin14: '00099482480882' }, new Date('2026-10-29T00:00:00Z'));
    expect(r.status).toBe('unavailable');
  });
  it('keeps the record type and what each classification input is', () => {
    const facts = openFactsToFacts({ found: true, db: 'off', code: '0099482480882', source: { sourceId: 'off:0099482480882', sourceType: 'database', sourceName: 'Open Food Facts', retrievedAt: '2026-10-29T00:00:00Z', matchConfidence: 'exact_barcode' }, product: { product_type: 'food', product_name: 'Grain free chicken & Pea recipe', brands: 'Whole Foods Market', categories_tags: [], labels_tags: ['en:no-gluten'], ingredients_text: WHOLE_PAWS_INGREDIENTS } }, '00099482480882', '099482480882');
    expect(facts.recordType).toBe('food');
    expect(facts.classificationSignals).toEqual([
      { text: 'en:no-gluten', source: 'off:0099482480882', kind: 'label' },
      { text: 'Grain free chicken & Pea recipe', source: 'off:0099482480882', kind: 'name' },
    ]);
    expect(facts.ingredients?.value.slice(0, 3)).toEqual(['Chicken', 'Chicken Meal', 'Peas']);
  });
});

describe('same recipe or another one', () => {
  const record = WHOLE_PAWS_INGREDIENTS.split(', ');
  it('recognises the same recipe written slightly differently or with one ingredient moved', () => {
    const page = ['Chicken', 'Chicken Meal', 'Peas', 'Turkey Meal', 'Garbanzo Beans', 'Chicken Fat (Preserved with Mixed Tocopherols)', 'Flaxseed', 'Dried Beet Pulp', 'Natural Flavors', 'Salmon Oil'];
    expect(compareRecipes(record, page)).toMatchObject({ compared: 10, same: 9 });
  });
  it('tells another recipe of the same brand apart', () => {
    const salmon = ['Salmon', 'Salmon Meal', 'Sweet Potatoes', 'Peas', 'Pea Protein', 'Canola Oil', 'Tapioca', 'Natural Flavor', 'Potassium Chloride', 'Salt'];
    const r = compareRecipes(record, salmon);
    expect(r.same).toBeLessThan(6);
    expect(r.unmatched).toContain('Salmon');
  });
});
