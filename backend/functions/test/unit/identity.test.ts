// Regression tests for the review of the identification and retrieval repairs (2026-10-30): each case is a
// failure a reviewer reproduced. Page HTML here is synthetic test markup; no page is fetched.
import { deflateSync } from 'node:zlib';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseAdequacyStatement } from '../../src/domain/adequacy';
import { personalize } from '../../src/domain/personalize';
import { assessGeneral } from '../../src/domain/score';
import { classifyScope, speciesEvidence, type SpeciesClaim } from '../../src/domain/scope';
import type { RecallCheck } from '../../src/domain/types';
import { documentFacts, pdfSafety } from '../../src/sources/pageEvidence';
import { brandOwnsHost, researchProduct } from '../../src/sources/research';
import { QuotaError } from '../../src/pipeline/store';
import { httpBytes, httpRequest } from '../../src/util/http';
import { facts, NOW, pet, SRC } from '../helpers/fixtures';

afterEach(() => vi.unstubAllGlobals());

const modelAnswer = (over: Record<string, unknown>) => ({
  found: true, product_name: null, brand: null, intended_for: 'not_stated', product_type: null, package_size_verbatim: null, ingredients_verbatim: null, active_ingredients_verbatim: null,
  adequacy_statement_verbatim: null, guaranteed_analysis: [], calorie_statement_verbatim: null, source_urls: [], barcode_seen_on_source: false, ...over,
});
const openAi = (json: unknown) => new Response(JSON.stringify({ output: [{ type: 'web_search_call' }, { type: 'message', content: [{ type: 'output_text', text: JSON.stringify(json), annotations: [] }] }] }), { status: 200 });
/** Model answers in order; pages by a part of their address. */
function stubWeb(answers: unknown[], pages: Record<string, string | (() => Response)>) {
  let call = 0;
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url.startsWith('https://api.openai.com/')) return openAi(answers[Math.min(call++, answers.length - 1)]);
    const key = Object.keys(pages).find((k) => url.includes(k));
    if (!key) return new Response('not found', { status: 404 });
    const page = pages[key];
    return typeof page === 'function' ? page() : new Response(page, { status: 200 });
  }));
}
const research = (over: Record<string, unknown> = {}) =>
  researchProduct({ apiKey: 'k', model: 'm', gtin14: '00076344060048', barcode: '076344060048', knownSpecies: 'unknown', userAgent: 'test', now: new Date('2026-10-30T00:00:00Z'), ...over });
const texts = (r: Awaited<ReturnType<typeof researchProduct>>) => (r.facts?.classificationSignals ?? []).map((c) => c.text);

describe('who it is for comes from the product’s own heading, not the site', () => {
  it('a dog food page proven by its barcode stays a dog food when the site menu says "Dog | Cat"', async () => {
    const page = `<html><head><title>Wellness CORE Original Deboned Turkey Dry Dog Food</title></head><body><nav>Shop: Dog | Cat | Deals</nav>
      <h1>Wellness CORE Original Deboned Turkey Dry Dog Food</h1><p>UPC 076344060048</p><footer>Cat food and dog food since 1926</footer></body></html>`;
    stubWeb([modelAnswer({ product_name: 'Wellness CORE Original Deboned Turkey Dry Dog Food', brand: 'Wellness', intended_for: 'cats_and_dogs', source_urls: ['https://www.wellnesspetfood.com/core-original-turkey'] })], { wellnesspetfood: page });
    const r = await research();
    expect(texts(r)).toContain('intended for dogs');
    expect(texts(r)).not.toContain('intended for cats and dogs');
    expect(r.discarded.join(' ')).toMatch(/intended for cats and dogs: the product’s heading says dogs, which was used/);
  });
  it('a page that names the species only in its menus says nothing about who the product is for', async () => {
    const page = `<html><head><title>Signature Selects Tuna &amp; Salmon</title></head><body><nav>Dog | Cat</nav><h1>Signature Selects Tuna &amp; Salmon</h1><p>UPC 076344060048</p></body></html>`;
    stubWeb([modelAnswer({ product_name: 'Signature Selects Tuna & Salmon', brand: 'Wellness', intended_for: 'cats_and_dogs', source_urls: ['https://shop.example/selects'] })], { 'shop.example': page });
    const r = await research();
    expect(texts(r).filter((t) => t.startsWith('intended for'))).toEqual([]);
  });
  it('a manufacturer page found by name never passes the retailer’s abbreviated title off as its own', async () => {
    const retailer = '<html><head><title>A Better Treat Dog Trt Frz Dr Wld Salmn</title></head><body><h1>A Better Treat Dog Trt Frz Dr Wld Salmn</h1><p>UPC: 850063633017</p></body></html>';
    const maker = '<html><head><title>A Better Treat</title></head><body><h1>Freeze Dried Raw Wild Caught Salmon Dog and Cat Treats</h1><p>A Better Treat</p></body></html>';
    stubWeb([
      modelAnswer({ product_name: 'Dog Trt Frz Dr Wld Salmn', brand: 'A Better Treat', intended_for: 'dogs', source_urls: ['https://blossom.example/salmn'] }),
      // The manufacturer answer leaves the name out and says "dogs".
      modelAnswer({ product_name: null, brand: 'A Better Treat', intended_for: 'dogs', product_type: 'freeze-dried dog treat', source_urls: ['https://www.abettertreat.com/salmon'] }),
    ], { blossom: retailer, abettertreat: maker });
    const r = await research({ gtin14: '00850063633017', barcode: '850063633017' });
    const maker_ = (r.facts?.classificationSignals ?? []).filter((c) => c.source.includes('abettertreat')).map((c) => c.text);
    expect(maker_).not.toContain('Dog Trt Frz Dr Wld Salmn');
    expect(maker_).not.toContain('freeze-dried dog treat'); // the answer's product type is not on the page
    expect(maker_).toEqual(['intended for cats and dogs']); // what the page's own heading says
  });
});

describe('every kept fact is on the page it is taken from', () => {
  const gravies = `<html><head><title>Healthy Indulgence Gravies Chicken &amp; Turkey</title></head><body><h1>Healthy Indulgence Gravies Chicken &amp; Turkey</h1>
    <img alt="Chicken Broth, Water Sufficient For Processing, Chicken, Potato Starch, Turkey, Eggs, Chicken Liver, Carrots, Natural Flavor, Salt">
    <p>Calorie Content: 57 kcal per 3 oz pouch</p><div ps-sku="076344886570"></div></body></html>`;
  const morsels = `<html><head><title>Healthy Indulgence Morsels Chicken &amp; Turkey</title></head><body><h1>Healthy Indulgence Morsels Chicken &amp; Turkey</h1>
    <p>Ingredients: Chicken, Turkey, Chicken Broth, Chicken Liver, Pea Protein, Potato Starch, Natural Flavor</p><p>Calorie Content: 72 kcal per 3 oz pouch</p><div ps-sku="076344886587"></div></body></html>`;
  it('a list and calories copied from another fetched page (Morsels) are not saved for the page with the barcode (Gravies)', async () => {
    stubWeb([modelAnswer({ product_name: 'Healthy Indulgence Gravies Chicken & Turkey', brand: 'Wellness', ingredients_verbatim: 'Chicken, Turkey, Chicken Broth, Chicken Liver, Pea Protein, Potato Starch, Natural Flavor', calorie_statement_verbatim: '72 kcal per 3 oz pouch', source_urls: ['https://w.example/morsels', 'https://w.example/gravies'] })], { morsels, gravies });
    const r = await research({ gtin14: '00076344886570', barcode: '076344886570' });
    expect(r.sources[0].url).toBe('https://w.example/gravies');
    expect(r.facts?.ingredients?.value.slice(0, 2)).toEqual(['Chicken Broth', 'Water Sufficient For Processing']); // the Gravies page's own list
    expect(r.facts?.calories).toBeUndefined();
    expect(r.discarded.join(' ')).toMatch(/calories: 1 of the answer’s values are not printed as a calorie statement on the cited page/);
  });
  it('a copy whose tail is not on the page is not the page’s list', async () => {
    const page = '<html><head><title>Chicken Pate</title></head><body><h1>Chicken Pate</h1><p>UPC 076344060048</p><p>Ingredients: Chicken, Chicken Broth, Chicken Liver, Pork Plasma, Guar Gum, Taurine</p></body></html>';
    stubWeb([modelAnswer({ product_name: 'Chicken Pate', brand: 'Testco', ingredients_verbatim: 'Chicken, Chicken Broth, Chicken Liver, Onion Powder, Garlic, Xylitol', source_urls: ['https://t.example/pate'] })], { 't.example': page });
    const r = await research({ knownBrand: 'Testco' });
    expect(r.facts?.ingredients).toBeUndefined();
    expect(r.discarded.join(' ')).toMatch(/ingredients: the answer’s list is not on the cited page in full and in order/);
  });
  it('keeps a one-item list printed under "Ingredients" on the barcode’s page, never a word found elsewhere', async () => {
    const page = '<html><head><title>Freeze Dried Salmon</title></head><body><h1>Freeze Dried Salmon</h1><p>UPC 076344060048</p><p>Ingredients: Wild Caught Salmon</p></body></html>';
    stubWeb([modelAnswer({ product_name: 'Freeze Dried Salmon', brand: 'Testco', ingredients_verbatim: 'Wild Caught Salmon', source_urls: ['https://t.example/salmon'] })], { 't.example': page });
    expect((await research({ knownBrand: 'Testco' })).facts?.ingredients?.value).toEqual(['Wild Caught Salmon']);
    stubWeb([modelAnswer({ product_name: 'Freeze Dried Salmon', brand: 'Testco', ingredients_verbatim: 'Salmon', source_urls: ['https://t.example/salmon'] })], { 't.example': page.replace('Ingredients: Wild Caught Salmon', 'Made in the USA') });
    expect((await research({ knownBrand: 'Testco' })).facts?.ingredients).toBeUndefined();
  });
  it('a calorie value counts only where the page prints it as a calorie statement', async () => {
    const page = '<html><head><title>Chicken Pate</title></head><body><h1>Chicken Pate</h1><p>UPC 076344060048</p><p>Pack of 85 cans</p></body></html>';
    stubWeb([modelAnswer({ product_name: 'Chicken Pate', calorie_statement_verbatim: '85 kcal per can', source_urls: ['https://t.example/pate'] })], { 't.example': page });
    expect((await research()).facts?.calories).toBeUndefined();
  });
});

describe('a page without the barcode must match what Purrbi already knows', () => {
  it('the manufacturer follow-up does not adopt another product the answer names (beef liver vs salmon)', async () => {
    const retailer = '<html><head><title>A Better Treat Dog Trt Frz Dr Bf Lvr</title></head><body><h1>A Better Treat Dog Trt Frz Dr Bf Lvr</h1><p>UPC: 850063633017</p></body></html>';
    const salmon = '<html><head><title>Freeze Dried Raw Wild Caught Salmon Dog and Cat Treats</title></head><body><h1>Freeze Dried Raw Wild Caught Salmon Dog and Cat Treats</h1><p>A Better Treat</p><p>Ingredients: Wild Caught Salmon</p><p>These are for supplemental or intermittent feeding.</p></body></html>';
    stubWeb([
      modelAnswer({ product_name: 'Dog Trt Frz Dr Bf Lvr', brand: 'A Better Treat', intended_for: 'dogs', source_urls: ['https://blossom.example/bf-lvr'] }),
      modelAnswer({ product_name: 'Freeze Dried Raw Wild Caught Salmon Dog and Cat Treats', brand: 'A Better Treat', intended_for: 'cats_and_dogs', ingredients_verbatim: 'Wild Caught Salmon', adequacy_statement_verbatim: 'These are for supplemental or intermittent feeding.', source_urls: ['https://www.abettertreat.com/salmon'] }),
    ], { blossom: retailer, abettertreat: salmon });
    const r = await research({ gtin14: '00850063633017', barcode: '850063633017' });
    expect(r.facts?.productName?.value).toBe('Dog Trt Frz Dr Bf Lvr');
    expect(r.facts?.ingredients).toBeUndefined();
    expect(texts(r)).not.toContain('intended for cats and dogs');
    expect(r.sources.map((s) => s.sourceName)).toEqual(['blossom.example']);
    expect(r.discarded.join(' ')).toMatch(/manufacturer page: the cited page does not show this product’s barcode or its brand and name \(brand "A Better Treat" found, name "Dog Trt Frz Dr Bf Lvr" not in the product’s heading\)/);
  });
  it('a dog product’s name does not match the same brand’s cat variant', async () => {
    const cat = '<html><head><title>Freeze Dried Wild Salmon Cat Treats</title></head><body><h1>Freeze Dried Wild Salmon Cat Treats</h1><p>A Better Treat</p></body></html>';
    stubWeb([modelAnswer({ product_name: 'Freeze Dried Wild Salmon Cat Treats', brand: 'A Better Treat', intended_for: 'cats', source_urls: ['https://www.abettertreat.com/cat-salmon'] })], { abettertreat: cat });
    const r = await research({ knownName: 'Dog Trt Frz Dr Wld Salmn', knownBrand: 'A Better Treat', knownSpecies: 'dog' });
    expect(r.facts).toBeNull();
  });
});

describe('one barcode among several sizes or flavours is not the shown product', () => {
  const shopPage = '<html><head><title>Grain Free Pate</title></head><body><h1>Grain Free Pate for Cats</h1><p>Testco</p><p>Ingredients: Chicken, Chicken Broth, Chicken Liver, Guar Gum, Taurine</p><p>Calories: 85 kcal per 3 oz can</p></body></html>';
  const record = { title: 'Grain Free Pate for Cats', type: 'Cat Food', tags: [], description: '', variants: [
    { id: 1, title: 'Chicken / 3 oz', barcode: '812345000016' }, { id: 2, title: 'Chicken / 12.5 oz', barcode: '812345000023' }, { id: 3, title: 'Salmon / 12.5 oz', barcode: '812345000030' },
  ] };
  const answer = modelAnswer({ product_name: 'Grain Free Pate for Cats', brand: 'Testco', intended_for: 'cats', ingredients_verbatim: 'Chicken, Chicken Broth, Chicken Liver, Guar Gum, Taurine', package_size_verbatim: '3 oz', calorie_statement_verbatim: '85 kcal per 3 oz can', source_urls: ['https://testco.example/products/grain-free-pate'] });
  const salmonCan = { gtin14: '00812345000030', barcode: '812345000030', knownBrand: 'Testco' };
  it('a Shopify record listing the scanned barcode among three variants is a family match, not this can', async () => {
    stubWeb([answer], { '.js': () => new Response(JSON.stringify(record), { status: 200 }), 'grain-free-pate': shopPage });
    const r = await research(salmonCan);
    expect(r.facts).toBeNull(); // nothing is known yet about who the salmon can is for, so a family match gives nothing
    expect(r.discarded.join(' ')).toMatch(/matches only as one of several sizes or variants/);
  });
  it('with the variant named in the address, the page is this barcode’s, and its size is the variant’s', async () => {
    const tied = { ...answer, source_urls: ['https://testco.example/products/grain-free-pate?variant=3'] };
    stubWeb([tied], { '.js': () => new Response(JSON.stringify(record), { status: 200 }), 'grain-free-pate': shopPage });
    const r = await research(salmonCan);
    expect(r.sources[0].matchConfidence).toBe('exact_barcode');
    expect(r.facts?.packageSize?.value).toMatchObject({ amount: 12.5, unit: 'oz' });
  });
  it('a page whose markup names two barcodes is not proof of either', async () => {
    const page = '<html><head><title>Pate</title></head><body><h1>Chicken Pate for Cats</h1><p>Testco</p><div ps-sku="076344060048"></div><div ps-sku="076344060055"></div></body></html>';
    stubWeb([modelAnswer({ product_name: 'Chicken Pate for Cats', brand: 'Testco', source_urls: ['https://t.example/pate'] })], { 't.example': page });
    const r = await research({ knownBrand: 'Testco' });
    expect(r.facts).toBeNull();
    expect(r.discarded.join(' ')).toMatch(/one of several sizes or variants/);
  });
});

describe('the manufacturer’s site', () => {
  it('is recognised for multi-word and parent-company brands, and not for a retailer', () => {
    const cases: [string, string, boolean][] = [
      ['Taste of the Wild', 'www.tasteofthewildpetfood.com', true], ['Purina Pro Plan', 'www.purina.com', true], ['Hill’s Science Diet', 'www.hillspet.com', true],
      ['Stella & Chewy’s', 'www.stellaandchewys.com', true], ['Ziwi Peak', 'www.ziwipets.com', true], ['Tiki Cat', 'tikipets.com', true], ['Diamond Naturals', 'www.diamondpet.com', true],
      ['A Better Treat', 'www.abettertreat.com', true], ['Wellness', 'www.wellnesspetfood.com', true], ['Whole Paws', 'www.wholefoodsmarket.com', false],
      ['Wellness', 'www.chewy.com', false], ['Purina Pro Plan', 'www.petco.com', false],
    ];
    for (const [brand, host, own] of cases) expect([brand, host, brandOwnsHost(brand, host)]).toEqual([brand, host, own]);
  });
});

describe('nutrition documents', () => {
  const can = { gtin14: '00076344060048', name: 'Wellness CORE Signature Selects Flaked Skipjack Tuna & Wild Salmon' };
  const named = '\nWCC CORE Signature Selects\nFlaked Skipjack Tuna with Wild Salmon';
  it('a profile named as a comparison column is not the product’s claim', () => {
    expect(documentFacts(`Nutrient Jerky Bites AAFCO Dog Food Nutrient Profiles for Growth and Reproduction Minimum${named}`, can).adequacyText).toBeNull();
  });
  it('an intermittent-feeding statement is the document’s word; both kinds together are left unresolved', () => {
    expect(documentFacts(`Comparison with AAFCO Dog Food Nutrient Profiles for Growth\nThis product is intended for intermittent or supplemental feeding only.${named}`, can).adequacyText).toMatch(/intermittent or supplemental feeding only/);
    const both = documentFacts(`FELINE MAINTENANCE AAFCO NUTRIENT PROFILE CLAIM SUBSTANTIATION\nFor intermittent or supplemental feeding only.${named}`, can);
    expect(both.adequacyText).toBeNull();
  });
  it('a document that names another product, or a product line’s several claims, gives nothing', () => {
    const other = documentFacts('FELINE MAINTENANCE AAFCO NUTRIENT PROFILE CLAIM SUBSTANTIATION\nHealthy Indulgence Morsels Chicken & Turkey', can);
    expect(other).toMatchObject({ namesProduct: false, adequacyText: null, calories: [] });
    const line = documentFacts(`FELINE MAINTENANCE AAFCO NUTRIENT PROFILE CLAIM SUBSTANTIATION\nFELINE GROWTH AAFCO NUTRIENT PROFILE CLAIM SUBSTANTIATION${named}`, can);
    expect(line.adequacyText).toBeNull();
  });
});

describe('downloads are bounded', () => {
  it('refuses a PDF whose compressed parts unpack to more than the limit, or that uses another encoding', () => {
    const bomb = deflateSync(Buffer.alloc(30 * 1024 * 1024));
    const pdf = Buffer.concat([Buffer.from(`%PDF-1.4\n4 0 obj<</Length ${bomb.length}/Filter/FlateDecode>>stream\n`, 'latin1'), bomb, Buffer.from('\nendstream endobj\n%%EOF', 'latin1')]);
    expect(pdf.length).toBeLessThan(100 * 1024);
    expect(pdfSafety(pdf, 24 * 1024 * 1024)).toMatchObject({ ok: false });
    const lzw = Buffer.from('%PDF-1.4\n4 0 obj<</Length 3/Filter/LZWDecode>>stream\nabc\nendstream endobj', 'latin1');
    expect(pdfSafety(lzw, 24 * 1024 * 1024)).toEqual({ ok: false, reason: 'it uses an encoding Purrbi does not read' });
    const fine = Buffer.concat([Buffer.from('%PDF-1.4\n4 0 obj<</Filter/FlateDecode>>stream\n', 'latin1'), deflateSync(Buffer.from('BT (hello) Tj ET')), Buffer.from('\nendstream endobj', 'latin1')]);
    expect(pdfSafety(fine, 24 * 1024 * 1024)).toEqual({ ok: true, unpacked: 16 });
  });
  it('stops reading a body past its limit, with or without a declared length', async () => {
    const big = () => new Response(new ReadableStream({ start(c) { for (let i = 0; i < 50; i++) c.enqueue(new Uint8Array(100000).fill(65)); c.close(); } }), { status: 200 });
    vi.stubGlobal('fetch', vi.fn(async () => big()));
    expect((await httpRequest('https://x.example/page', { source: 'web page', retries: 0, maxBytes: 250000 })).text).toHaveLength(250000);
    await expect(httpBytes('https://x.example/file.pdf', { source: 'nutrition document', maxBytes: 1000000 })).rejects.toThrow('file too large');
  });
});

describe('the manufacturer’s page and the first page together', () => {
  const retailer = '<html><head><title>Testco Chicken Pate 3 oz</title></head><body><h1>Testco Chicken Pate 3 oz</h1><p>UPC 076344060048</p><p>Guaranteed Analysis Crude Protein (min) 10% Crude Fat (min) 5%</p></body></html>';
  const maker = '<html><head><title>Chicken Pate | Testco</title></head><body><h1>Testco Chicken Pate</h1><div ps-sku="076344060048"></div><p>Guaranteed Analysis Crude Protein (min) 10% Crude Fat (min) 5% Crude Fiber (max) 1% Moisture (max) 82%</p></body></html>';
  const answers = [
    modelAnswer({ product_name: 'Testco Chicken Pate 3 oz', brand: 'Testco', source_urls: ['https://shop.example/pate'] }),
    modelAnswer({ product_name: 'Testco Chicken Pate', brand: 'Testco', source_urls: ['https://www.testco.com/pate'] }),
  ];
  it('a fuller analysis on the manufacturer’s page replaces a partial one from a retailer', async () => {
    stubWeb(answers, { 'shop.example': retailer, 'testco.com': maker });
    const r = await research({ knownBrand: 'Testco' });
    expect(r.facts?.guaranteedAnalysis?.value.map((g) => g.nutrient)).toEqual(['crude_protein', 'crude_fat', 'crude_fiber', 'moisture']);
    expect(r.facts?.guaranteedAnalysis?.source.sourceName).toBe('testco.com');
  });
  it('when the AI budget runs out before the follow-up, what the first page verified is kept', async () => {
    stubWeb(answers, { 'shop.example': retailer, 'testco.com': maker });
    let n = 0;
    const r = await research({ knownBrand: 'Testco', beforeAiCall: async () => { if (n++ === 1) throw new QuotaError('ai_budget'); } });
    expect(r.facts?.guaranteedAnalysis?.value).toHaveLength(2);
    expect(r.discarded).toContain('manufacturer page: not searched (the AI budget is used up for today)');
  });
});

const noRecall: RecallCheck = { status: 'none_found', summary: 'none (test)', checkedAt: NOW.toISOString(), source: null, records: [] };
const claim = (text: string, basis: SpeciesClaim['basis'], source: string): SpeciesClaim => ({ text, basis, source });

describe('species evidence', () => {
  it('one record tagged for cats and for dogs is for both, not a dispute', () => {
    const ev = speciesEvidence([claim('en:dog-and-cat-food', 'database_category', 'opff'), claim('en:cat-supplements', 'database_category', 'opff'), claim('en:dog-supplements', 'database_category', 'opff')]);
    expect(ev).toMatchObject({ set: ['cat', 'dog'], disputed: false, confirmed: true });
    const scope = classifyScope({ origin: 'opff', categoriesTags: ['en:cat-food', 'en:dog-food'], texts: ['TEST Salmon Oil'], speciesClaims: [claim('en:cat-food', 'database_category', 'opff'), claim('en:dog-food', 'database_category', 'opff')] });
    expect(scope).toMatchObject({ status: 'supported', species: 'cat_and_dog' });
    // Two different sources at the same strength still dispute it.
    expect(speciesEvidence([claim('Cat food', 'label', 'photo1'), claim('Dog food', 'label', 'photo2')]).disputed).toBe(true);
  });
  it('a confirming source naming the pet’s species too keeps a stronger source’s narrower set from being told as a mismatch', () => {
    const ev = speciesEvidence([claim('Salmon Oil Dog Supplement', 'manufacturer_page', 'web:maker'), claim('Salmon Oil for Dogs & Cats', 'database_name', 'opff')]);
    expect(ev).toMatchObject({ set: ['dog'], alsoNamed: ['cat'], confirmed: true });
    const f = facts({ productName: { value: 'Salmon Oil for Dogs & Cats', source: SRC }, adequacyText: '' });
    const scope = { status: 'supported' as const, species: 'dog' as const, category: 'supplement' as const, reason: '', signals: [], speciesEvidence: ev, categoryBasis: 'feeding_purpose_name' as const };
    const p = personalize(pet({ species: 'cat', name: 'Miso' }), f, scope, assessGeneral(f, scope), noRecall, NOW);
    expect(p.state).toBe('review');
    expect(p.findings.find((x) => x.rule === 'P-SPECIES')?.text).toMatch(/another source also lists it for cats/);
  });
  it('database categories are credited to the pet database, not to the product label', () => {
    const ev = speciesEvidence([claim('en:dog-food', 'database_category', 'opff')]);
    const f = facts({ adequacyText: '' });
    const scope = { status: 'supported' as const, species: 'dog' as const, category: 'complete_food' as const, reason: '', signals: [], speciesEvidence: ev, categoryBasis: 'product_type_words' as const };
    const finding = personalize(pet({ species: 'cat' }), f, scope, assessGeneral(f, scope), noRecall, NOW).findings.find((x) => x.rule === 'P-SPECIES');
    expect(finding).toMatchObject({ kind: 'alert', evidence: 'Pet database record' });
    expect(finding?.text).toMatch(/the pet database’s record/);
  });
  it('when only a retailer says it is a dog treat, a cat still gets the cat hazards', () => {
    const ev = speciesEvidence([claim('Dog Trt Chkn Jrky', 'retailer_listing', 'web:shop')]);
    const f = facts({ productName: { value: 'Dog Trt Chkn Jrky', source: SRC }, ingredientsText: 'Chicken, Glycerin, Propylene Glycol, Salt, Natural Smoke Flavor', adequacyText: '' });
    const scope = { status: 'supported' as const, species: 'dog' as const, category: 'treat' as const, reason: '', signals: [], speciesEvidence: ev, categoryBasis: 'feeding_purpose_name' as const };
    const p = personalize(pet({ species: 'cat' }), f, scope, assessGeneral(f, scope), noRecall, NOW);
    expect(p.findings.some((x) => x.rule === 'P-HAZARD' && x.kind === 'alert' && /propylene glycol/i.test(x.text))).toBe(true);
    expect(p.state).toBe('mismatch');
  });
});

describe('allergens in a list Purrbi cannot read', () => {
  it('a French ingredient list is not checked, never "not on the list"', () => {
    const f = { ...facts({ ingredientsText: 'Viandes et sous-produits animaux (dont poulet 14 %), poissons et sous-produits de poissons, sucres, minéraux' }), ingredientsLanguage: 'fr' };
    const scope = classifyScope({ origin: 'opff', categoriesTags: ['en:cat-food'], texts: [''], adequacy: f.adequacy?.value });
    const p = personalize(pet({ allergiesStatus: 'reported', allergies: ['chicken', 'fish'] }), f, scope, assessGeneral(f, scope), noRecall, NOW);
    expect(p.findings.some((x) => /aren’t on the ingredient list|isn’t on the ingredient list/.test(x.text))).toBe(false);
    expect(p.unresolved.join(' ')).toMatch(/The ingredient list is in French, so Purrbi couldn’t check it for chicken/);
    expect(p.state).toBe('incomplete');
  });
});

describe('product type', () => {
  const complete = parseAdequacyStatement('Formulated to meet the nutritional levels established by the AAFCO Dog Food Nutrient Profiles for maintenance of adult dogs.');
  it('a food "with probiotics" (or fish oil, or glucosamine) is a food, not a supplement', () => {
    expect(classifyScope({ origin: 'opff', categoriesTags: ['en:dog-food'], texts: ['Pro Plan Adult Shredded Blend Chicken & Rice Formula With Probiotics Dry Dog Food'], adequacy: complete }).category).toBe('complete_food');
    expect(classifyScope({ origin: 'opff', categoriesTags: ['en:dog-food'], texts: ['Chicken Recipe with Fish Oil Dry Dog Food'] }).category).toBe('complete_food');
    expect(classifyScope({ origin: 'opff', categoriesTags: ['en:dog-food'], texts: ['Hip & Joint Supplement with Glucosamine for Dogs'] }).category).toBe('supplement');
    expect(classifyScope({ origin: 'opff', categoriesTags: ['en:dog-supplements'], texts: ['Daily Multivitamin Chews'], adequacy: complete }).category).toBe('supplement');
  });
  it('reads EU complete-feed declarations and negated claims', () => {
    expect(parseAdequacyStatement('Alimento completo para cães.')).toMatchObject({ type: 'complete', species: 'dog' });
    expect(parseAdequacyStatement('Volledig diervoeder voor de kat.')).toMatchObject({ type: 'complete', species: 'cat' });
    expect(parseAdequacyStatement('Alimento completo per cane adulto.')).toMatchObject({ type: 'complete', species: 'dog' });
    expect(parseAdequacyStatement('Complete feed for felines.')).toMatchObject({ type: 'complete', species: 'cat' });
    expect(parseAdequacyStatement('Not formulated to meet the AAFCO Dog Food Nutrient Profile.')?.type).toBe('intermittent');
    // "Cane sugar" is not a dog.
    expect(parseAdequacyStatement('Organic cane sugar syrup, complete and balanced flavour.')?.species).toBe('unknown');
  });
  it('human foods named with species idioms stay foods for people', () => {
    const langues = classifyScope({ origin: 'off', categoriesTags: ['en:snacks', 'en:biscuits'], texts: ['Langues de chat'], speciesClaims: [claim('Langues de chat', 'database_name', 'off')] });
    expect(langues.status).toBe('out_of_scope');
    const hush = classifyScope({ origin: 'off', categoriesTags: ['en:mixes'], texts: ['Hush Puppy Mix'], speciesClaims: [claim('Hush Puppy Mix', 'database_name', 'off')] });
    expect(hush.status).not.toBe('supported');
    // A pet food misfiled under foods for people still counts when its name says it is for a pet.
    const misfiled = classifyScope({ origin: 'off', categoriesTags: ['en:meals'], texts: ['Adult Cat Food with Chicken'], speciesClaims: [claim('Adult Cat Food with Chicken', 'database_name', 'off')] });
    expect(misfiled).toMatchObject({ status: 'supported', species: 'cat' });
  });
});
