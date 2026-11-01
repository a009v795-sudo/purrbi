// Classification from the product's own evidence, never from the database a record is filed in.
// Regression for barcode 099482480882 (Whole Paws "Grain free chicken & Pea recipe"): Open Food Facts
// files it as product_type "food" with no categories (imported by a human-food app), and Purrbi
// rejected it as human food because it was not in Open Pet Food Facts. Inputs below are that record
// as Open Food Facts returned it on 2026-10-29 (GitHub run 40935497833), and other real records.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { normalizeBarcode } from '../../src/domain/barcode';
import { classifyScope, feedMarkers } from '../../src/domain/scope';
import { lookupOpenFacts, openFactsToFacts } from '../../src/sources/openFacts';
import { latinBrand } from '../../src/domain/script';
import { checkRecalls, searchableBrand } from '../../src/sources/openfda';
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
  // Test B, 2026-11-01: openFDA refused the search for an import listing's brand ("Search not supported", HTTP 400).
  it('searches recalls by the brand’s Latin-script words, and says so when it has none', async () => {
    const urls: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      urls.push(url);
      return new Response(JSON.stringify({ results: [] }), { status: 200 });
    }));
    const r = await checkRecalls({ brand: 'WELLNESS（ウェルネス）', productName: 'TEST FIXTURE', gtin14: '00076344886570' }, new Date('2026-11-01T00:00:00Z'));
    expect(r.status).toBe('none_found');
    expect(urls).toHaveLength(1);
    expect(decodeURIComponent(new URL(urls[0]).searchParams.get('search') ?? '')).toBe('(recalling_firm:"WELLNESS" product_description:"WELLNESS")');
    expect(searchableBrand("Hill's Science Diet® (US)")).toBe("Hill's Science Diet US");
    expect(searchableBrand('Café Nature')).toBe('Café Nature');
    const none = await checkRecalls({ brand: 'ウェルネス', productName: 'TEST FIXTURE', gtin14: '00076344886570' }, new Date('2026-11-01T00:00:00Z'));
    expect(none).toMatchObject({ status: 'not_checked', summary: 'The brand isn’t written in Latin script on its own, so FDA recall records (in English) could not be searched.' });
    expect(urls).toHaveLength(1);
  });
  // Review of research 2.9.4: a trademark sign must not become letters ("IAMSTM"), a typographic apostrophe not a space,
  // and stray Latin letters beside another script's name are not the brand.
  it('the recall search keeps the brand’s own words: trademark signs, apostrophes, full-width letters, stray letters', async () => {
    expect(searchableBrand('IAMS™')).toBe('IAMS');
    expect(searchableBrand('Blue Buffalo™')).toBe('Blue Buffalo');
    expect(searchableBrand('Whiskas℠')).toBe('Whiskas');
    expect(searchableBrand('PurinaⓇ ONE')).toBe('Purina ONE');
    expect(searchableBrand('Purina® Pro Plan™')).toBe('Purina Pro Plan');
    expect(searchableBrand('Hill’s Science Diet')).toBe("Hill's Science Diet");
    expect(searchableBrand('Stella & Chewy’s')).toBe("Stella & Chewy's");
    expect(searchableBrand('ＷＥＬＬＮＥＳＳ')).toBe('WELLNESS');
    expect(searchableBrand('Brand ٣')).toBe('Brand');
    expect(latinBrand('ピュリナ ONE')).toBe('');
    expect(latinBrand('ロイヤルカナン JP')).toBe('');
    expect(latinBrand('Fancy Feast（ファンシーフィースト）')).toBe('Fancy Feast');
    expect(latinBrand('Go!')).toBe('Go');
    // Re-review: a gloss's Latin letters are never added to the name, a long reading does not hide it, and a trademark
    // written in letters is no word of it.
    expect(latinBrand('K9 Natural（K9ナチュラル）')).toBe('K9 Natural');
    expect(latinBrand('K9ナチュラル（K9 Natural）')).toBe('K9 Natural');
    expect(latinBrand('Purina ONE（ピュリナONE）')).toBe('Purina ONE');
    expect(latinBrand('GO! SOLUTIONS（GO!ソリューションズ）')).toBe('GO SOLUTIONS');
    expect(latinBrand("Dr.ハーヴィーズ（Dr. Harvey's）")).toBe("Dr. Harvey's");
    expect(latinBrand('9Lives（9ライブス）')).toBe('9Lives');
    expect(latinBrand('K9 Natural（ケーナインナチュラル）')).toBe('K9 Natural');
    expect(latinBrand('1st Choice（ファーストチョイス）')).toBe('1st Choice');
    expect(latinBrand('Cesar (Цезарь)')).toBe('Cesar');
    expect(latinBrand("Hill’s（ヒルズ）Science Diet（サイエンス・ダイエット）")).toBe("Hill's Science Diet");
    expect(latinBrand('【公式】Wellness')).toBe('Wellness');
    expect(latinBrand('WELLNESS ウェルネス')).toBe('WELLNESS');
    expect(latinBrand('IAMS(TM)')).toBe('IAMS');
    expect(latinBrand('IAMSᵀᴹ')).toBe('IAMS');
    expect(latinBrand('365')).toBe('365');
    expect(latinBrand('ウェルネス')).toBe('');
    expect(latinBrand('K9ナチュラル Natural')).toBe('');
    const urls: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      urls.push(url);
      return new Response(JSON.stringify({ results: [] }), { status: 200 });
    }));
    const searched = async (brand: string) => {
      const r = await checkRecalls({ brand, productName: 'TEST FIXTURE', gtin14: '00076344886570' }, new Date('2026-11-01T00:00:00Z'));
      return { status: r.status, search: urls.length ? decodeURIComponent(new URL(urls.splice(0)[0]).searchParams.get('search') ?? '') : null };
    };
    expect(await searched('IAMS™')).toEqual({ status: 'none_found', search: '(recalling_firm:"IAMS" product_description:"IAMS")' });
    expect(await searched('Hill’s Science Diet')).toEqual({ status: 'none_found', search: `(recalling_firm:"Hill's Science Diet" product_description:"Hill's Science Diet")` });
    expect(await searched('ピュリナ ONE')).toEqual({ status: 'not_checked', search: null });
    expect(await searched('K9 Natural（K9ナチュラル）')).toEqual({ status: 'none_found', search: '(recalling_firm:"K9 Natural" product_description:"K9 Natural")' });
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
