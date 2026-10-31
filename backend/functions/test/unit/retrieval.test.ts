// Identification and retrieval repairs, on the real cases they come from (scans of 2026-10-30):
// 076344060048 Wellness CORE Signature Selects can, 076344886570 Wellness Healthy Indulgence Gravies pouch,
// 850063633017 A Better Treat salmon treat. Page HTML here is synthetic test markup built around the text the
// real pages print (read from GitHub's network on 2026-10-30 with the live-probe workflow); no page is fetched.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseAdequacyStatement } from '../../src/domain/adequacy';
import { caloriesForPackage, describeCalories, parseCalorieText, parsePackageSize } from '../../src/domain/nutrition';
import { classifyScope, speciesEvidence } from '../../src/domain/scope';
import { altTextIngredientLists, documentFacts, markupGtins, nameOnPage, nameTokens, nutritionDocLinks, pageText, parseShopifyProduct, shopifyProductUrl } from '../../src/sources/pageEvidence';
import { ResearchNotStarted, researchProduct } from '../../src/sources/research';

const WELLNESS_INGREDIENTS =
  'Tuna, Tuna Broth, Water Sufficient for Processing, Mackerel, Salmon, Tapioca Starch, Sunflower Oil, Natural Flavor, Guar Gum, Tricalcium Phosphate, Taurine, Magnesium Sulfate, Vitamins [Vitamin E Supplement, Thiamine Hydrochloride, Niacin, Vitamin A Supplement, Pyridoxine Hydrochloride, d-Calcium Pantothenate, Riboflavin Supplement, Folic Acid, Vitamin D3 Supplement, Biotin, Vitamin B12 Supplement, Potassium Chloride, Choline Chloride, Minerals [Zinc Amino Acid Chelate, Iron Amino Acid Chelate, Manganese Amino Acid Chelate, Copper Amino Acid Chelate, Potassium Iodide, Sodium Selenite], Menadione Sodium Bisulfite Complex (Vitamin K).';
// The manufacturer's page: analysis in its text, the barcode only in a shop widget's attribute, the ingredient
// list only as an image's alt text, and the AAFCO claim in a linked "Nutrient Profiles" PDF.
const MANUFACTURER_PAGE = `<html><head><title>Signature Selects Flaked Skipjack Tuna &amp; Wild Salmon in Broth</title></head><body>
  <h1>Wellness CORE Signature Selects Flaked Skipjack Tuna &amp; Wild Salmon Entrée in Broth</h1>
  <div class="modal-body"><img src="https://images.example/label.jpg" width="500px" alt="${WELLNESS_INGREDIENTS}"></div>
  <p>Guaranteed Analysis</p><p>Crude Protein (min.) 10.0% Crude Fat (min.) 3.5% Crude Fiber (max.) 1.0% Moisture (max.) 85.0% Ash (max.) 2.0% Magnesium (max.) 0.025% Taurine (min.) 0.05%</p>
  <p>Feeding Guidelines</p><div class="nutrient-profiles"><a href='https://docs.example/nutrient-profile.pdf' target='_blank'>Nutrient Profiles</a></div>
  <div class="ps-widget" ps-sku=" 076344060048 "></div><p>Available Sizes: 2.8 Ounce, 5.3 Ounce Can</p></body></html>`;
// The retailer's page found by the barcode: the barcode and size in its title, ingredients and calories.
const RETAILER_PAGE = `<html><head><title>Wellness Signature  Skipjack - Tuna &amp; Wild Salmon 2.8oz - 076344060048</title></head><body>
  <h1>Wellness Signature Skipjack - Tuna &amp; Wild Salmon 2.8oz</h1><p>Make every meal count with Wellness CORE Signature Selects Flaked Skipjack Tuna &amp; Wild Salmon Entree in Broth Grain-Free Canned Cat Food.</p>
  <p>Complete and balanced nutrition comes in convenient serving sizes for everyday feeding.</p>
  <p>Ingredients ${WELLNESS_INGREDIENTS.replace('Choline Chloride, Minerals [', 'Choline Chloride], Minerals [')}</p><p>Caloric Content 70 kcal/2.8 oz can, 133 kcal/5.3 oz can</p></body></html>`;

/** A one-page PDF with one line of text per entry (hand-written, synthetic). */
function pdfWith(lines: string[]): Buffer {
  const body = lines.map((l, i) => `BT /F1 10 Tf 20 ${760 - i * 14} Td (${l.replace(/[()\\]/g, '\\$&')}) Tj ET`).join('\n');
  return Buffer.from(
    `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n4 0 obj<</Length ${body.length}>>stream\n${body}\nendstream endobj\n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF`,
    'latin1',
  );
}
// The text the backend's PDF reader got from Wellness's real document (first lines; numbers as printed).
const NUTRIENT_PROFILE_LINES = ['FELINE MAINTENANCE AAFCO NUTRIENT PROFILE CLAIM SUBSTANTIATION', 'Per 2.8 oz can Per 5.3 oz can', 'Nutrients 79g 150g', 'M.E. kcal/kg 70.00 133.00', 'PROXIMATES:', 'PROTEIN 10.37 19.03', 'PRODUCT', 'WCC CORE Signature Selects', 'Flaked Skipjack Tuna with Wild Salmon', '© 2022 Wellness Pet Company, Inc. All Rights Reserved. MAR 2022'];
const CAN = { gtin14: '00076344060048', name: 'Wellness CORE Signature Selects Flaked Skipjack Tuna & Wild Salmon Entrée in Broth' };
const CAN_NAME = '\nPRODUCT\nWCC CORE Signature Selects\nFlaked Skipjack Tuna with Wild Salmon';

const modelAnswer = (over: Record<string, unknown>) => ({
  found: true, product_name: null, brand: null, intended_for: 'not_stated', product_type: null, package_size_verbatim: null, ingredients_verbatim: null, active_ingredients_verbatim: null,
  adequacy_statement_verbatim: null, guaranteed_analysis: [], calorie_statement_verbatim: null, source_urls: [], barcode_seen_on_source: false, ...over,
});
const openAi = (json: unknown) => new Response(JSON.stringify({ output: [{ type: 'web_search_call' }, { type: 'message', content: [{ type: 'output_text', text: JSON.stringify(json), annotations: [] }] }] }), { status: 200 });

afterEach(async () => {
  vi.unstubAllGlobals();
  (await import('../../src/ai/openai')).resetResearchClientState();
});

describe('package sizes and calories', () => {
  it('keeps each calorie value with its package: 70 and 133 kcal are two can sizes, not two servings', () => {
    const cals = parseCalorieText('Caloric Content 70 kcal/2.8 oz can, 133 kcal/5.3 oz can');
    expect(cals.map(describeCalories)).toEqual(['70 kcal per 2.8-oz can', '133 kcal per 5.3-oz can']);
    // The scanned can is the 2.8 oz one (the retailer's page for this barcode says so): only its value is shown.
    expect(caloriesForPackage(cals, parsePackageSize('Wellness Signature Skipjack - Tuna & Wild Salmon 2.8oz')).map(describeCalories)).toEqual(['70 kcal per 2.8-oz can']);
    // Size unknown: both are kept, each with its size.
    expect(caloriesForPackage(cals, null)).toHaveLength(2);
    expect(parseCalorieText('3,640 kcal ME/kg; 57 kcal per 3 oz pouch; 6 kcal per treat').map(describeCalories)).toEqual(['3,640 kcal per kg', '57 kcal per 3-oz pouch', '6 kcal per treat']);
  });
  it('reads a package size from a title or size field, and refuses a page listing several sizes', () => {
    expect(parsePackageSize('6 x 1.5 oz')).toMatchObject({ amount: 1.5, unit: 'oz', grams: 42.5 });
    expect(parsePackageSize('3 Ounce Retort Pouch')).toMatchObject({ amount: 3, unit: 'oz' });
    expect(parsePackageSize('Available Sizes: 2.8 Ounce, 5.3 Ounce Can')).toBeNull();
  });
});

describe('feeding statements', () => {
  it('a nutrient-profile substantiation heading is an AAFCO claim; marketing copy is not an adequacy statement', () => {
    expect(parseAdequacyStatement('FELINE MAINTENANCE AAFCO NUTRIENT PROFILE CLAIM SUBSTANTIATION')).toMatchObject({ type: 'complete', species: 'cat', lifeStages: ['adult_maintenance'], method: 'formulation' });
    expect(parseAdequacyStatement('Complete and balanced nutrition comes in convenient serving sizes for everyday feeding.')?.type).toBe('unclear');
    expect(parseAdequacyStatement('These are for supplemental or intermittent feeding as a healthy treat or a training reward.')?.type).toBe('intermittent');
  });
});

describe('product type and species', () => {
  const scope = (texts: string[], adequacyText?: string, claims?: { text: string; basis: Parameters<typeof speciesEvidence>[0][number]['basis'] }[]) =>
    classifyScope({ origin: 'web', categoriesTags: [], texts, adequacy: adequacyText ? parseAdequacyStatement(adequacyText) : null, speciesClaims: claims ?? texts.map((t) => ({ text: t, basis: 'retailer_listing' as const })) });
  it('never infers a topper from broth, gravy, flaked or entrée', () => {
    const can = scope(['Wellness CORE Signature Selects Flaked Skipjack Tuna & Wild Salmon Entrée in Broth', 'wet cat food', 'intended for cats']);
    expect(can.category).toBe('complete_food');
    expect(can.categoryBasis).toBe('product_type_words'); // unconfirmed until the feeding statement is found
    expect(scope(['Bone Broth for Dogs']).category).toBe('unknown');
    expect(scope(['Healthy Indulgence Gravies Chicken & Turkey for cats'], 'FELINE MAINTENANCE AAFCO NUTRIENT PROFILE CLAIM SUBSTANTIATION')).toMatchObject({ category: 'complete_food', categoryBasis: 'adequacy_statement' });
    expect(scope(['Chicken Broth Topper for Dogs']).category).toBe('complementary');
  });
  it('a retailer’s abbreviated title does not confirm a dog-only product; the manufacturer’s dog-and-cat statement gives both', () => {
    const retailerOnly = speciesEvidence([{ text: 'Dog Trt Frz Dr Wld Salmn', basis: 'retailer_listing' }, { text: 'intended for dogs', basis: 'retailer_listing' }]);
    expect(retailerOnly).toMatchObject({ set: ['dog'], confirmed: false, basis: 'retailer_listing' });
    const both = speciesEvidence([{ text: 'Dog Trt Frz Dr Wld Salmn', basis: 'retailer_listing' }, { text: 'intended for cats and dogs', basis: 'manufacturer_page' }]);
    expect(both).toMatchObject({ set: ['cat', 'dog'], confirmed: true, basis: 'manufacturer_page', disputed: false });
    // Two equally strong sources naming different species are unresolved, never merged.
    const disputed = speciesEvidence([{ text: 'for cats', basis: 'label' }, { text: 'for dogs', basis: 'label' }]);
    expect(disputed).toMatchObject({ set: [], disputed: true });
    expect(classifyScope({ origin: 'label', categoriesTags: [], texts: ['for cats', 'for dogs'], speciesClaims: [{ text: 'for cats', basis: 'label' }, { text: 'for dogs', basis: 'label' }] }).status).toBe('unknown');
    // The pet database's generic parent category says nothing about the species.
    expect(speciesEvidence([{ text: 'en:dog-and-cat-food', basis: 'database_category' }, { text: 'en:cat-food', basis: 'database_category' }]).set).toEqual(['cat']);
  });
});

describe('what a product page holds beyond its text', () => {
  it('reads image alt text, markup barcodes, nutrition document links and Shopify product records', () => {
    expect(pageText(MANUFACTURER_PAGE)).toContain('Tuna, Tuna Broth, Water Sufficient for Processing');
    expect(altTextIngredientLists(MANUFACTURER_PAGE)).toEqual([WELLNESS_INGREDIENTS]);
    expect(markupGtins(MANUFACTURER_PAGE)).toEqual(['00076344060048']);
    // A listing page naming many products names none of them.
    expect(markupGtins(['076344060048', '076344886570', '850063633017', '860004608905'].map((g) => `<div data-upc="${g}"></div>`).join(''))).toEqual([]);
    expect(nutritionDocLinks(MANUFACTURER_PAGE, 'https://www.wellnesspetfood.com/product-catalog/x/')).toEqual(['https://docs.example/nutrient-profile.pdf']);
    expect(shopifyProductUrl('https://www.abettertreat.com/products/a-better-treat-freeze-dried-salmon')).toBe('https://www.abettertreat.com/products/a-better-treat-freeze-dried-salmon.js');
    expect(shopifyProductUrl('https://www.wellnesspetfood.com/product-catalog/x/')).toBeNull();
    const shop = parseShopifyProduct({ title: 'Freeze Dried Raw Wild Caught Salmon Dog and Cat Treats', type: 'Dog Treats', tags: ['3 oz'], variants: [{ title: 'Standard 1 Pack', barcode: '860004608905' }, { title: 'Half Size 1 Pack', barcode: null }], description: '<p>DOGS AND CATS LOVE OUR ALL NATURAL TREATS</p>' });
    expect(shop).toMatchObject({ barcodes: ['00860004608905'], variantTitles: ['Standard 1 Pack', 'Half Size 1 Pack'] });
  });
  it('reads the AAFCO claim and the calories per package from a nutrient-profile document, in either text order', () => {
    const unpdf = documentFacts(NUTRIENT_PROFILE_LINES.join('\n'), CAN);
    expect(unpdf.namesProduct).toBe(true);
    expect(unpdf.adequacyText).toBe('FELINE MAINTENANCE AAFCO NUTRIENT PROFILE CLAIM SUBSTANTIATION');
    expect(unpdf.calories.map(describeCalories)).toEqual(['70 kcal per 2.8-oz can', '133 kcal per 5.3-oz can']);
    // pdftotext's layout order: the product's kcal/kg and the AAFCO columns come first on the same row.
    const layout = documentFacts(`FELINE MAINTENANCE AAFCO NUTRIENT PROFILE CLAIM SUBSTANTIATION\nUnit BASIS DM Dry Matter g/Per 1,000 As fed Basis, Dry Matter g/Per 1,000 Per 2.8 oz can Per 5.3 oz can\nM.E. kcal/kg kcal/kg 4,000.00 - 884.00 4,055.05 - 70.00 133.00${CAN_NAME}`, CAN);
    expect(layout.calories.map((c) => c.kcal)).toEqual([70, 133]);
    // A row that doesn't line up with the sizes (implausible energy density) is left out, not guessed.
    expect(documentFacts(`Per 2.8 oz can Per 5.3 oz can\nM.E. kcal/kg 4,000.00 884.00${CAN_NAME}`, CAN).calories).toEqual([]);
    expect(documentFacts('Per 3 oz pouch\nNutrients 85 g\nM.E. kcal/kg 57.00\nHealthy Indulgence Gravies\nChicken & Turkey', { gtin14: '00076344886570', name: 'Wellness Healthy Indulgence Gravies with Chicken & Turkey in Gravy' }).calories.map(describeCalories)).toEqual(['57 kcal per 3-oz pouch']);
  });
  it('matches a catalogue title by its written-out words, never by brand alone', () => {
    expect(nameTokens('Dog Trt Frz Dr Wld Salmn')).toEqual(['freeze', 'dried', 'wild', 'salmon']);
    const page = ' a better treat freeze dried raw wild caught salmon dog and cat treats ';
    expect(nameOnPage('Dog Trt Frz Dr Wld Salmn', page)).toBe(true);
    expect(nameOnPage('Dog Trt Frz Dr Bf Lvr', page)).toBe(false); // beef liver is another product
  });
});

describe('research 2.0', () => {
  it('Wellness can: the retailer page found by barcode, then the manufacturer’s page for the analysis and its PDF for the AAFCO claim', async () => {
    const answers = [
      modelAnswer({ product_name: 'Wellness CORE Signature Selects Flaked Skipjack Tuna & Wild Salmon Entree in Broth', brand: 'Wellness', intended_for: 'cats', product_type: 'wet cat food', ingredients_verbatim: WELLNESS_INGREDIENTS.replace('Choline Chloride, Minerals [', 'Choline Chloride], Minerals ['), calorie_statement_verbatim: '70 kcal/2.8 oz can, 133 kcal/5.3 oz can', source_urls: ['https://www.companionpetfoodsupply.com/shop/wellness-tuna-salmon-28oz.htm'] }),
      modelAnswer({ product_name: 'Wellness CORE Signature Selects Flaked Skipjack Tuna & Wild Salmon Entrée in Broth', brand: 'Wellness', intended_for: 'cats', guaranteed_analysis: [{ label: 'Crude Protein', qualifier: 'min', value: 10, unit: '%' }], source_urls: ['https://www.wellnesspetfood.com/product-catalog/wellness-core-signature-selects-flaked-skipjack-tuna-wild-salmon-in-broth/'] }),
    ];
    let call = 0;
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.startsWith('https://api.openai.com/')) return openAi(answers[call++]);
      if (url.includes('companionpetfoodsupply')) return new Response(RETAILER_PAGE, { status: 200 });
      if (url.includes('nutrient-profile.pdf')) return new Response(pdfWith(NUTRIENT_PROFILE_LINES), { status: 200, headers: { 'content-type': 'application/pdf' } });
      return new Response(MANUFACTURER_PAGE, { status: 200 });
    }));
    const budget = vi.fn(async () => undefined);
    const r = await researchProduct({ apiKey: 'k', model: 'm', gtin14: '00076344060048', barcode: '076344060048', knownSpecies: 'unknown', userAgent: 'test', now: new Date('2026-10-30T00:00:00Z'), beforeAiCall: budget });
    expect(budget).toHaveBeenCalledTimes(2);
    expect(r.sources.map((s) => `${s.sourceName} ${s.sourceType}`)).toEqual(['companionpetfoodsupply.com retailer_or_web', 'wellnesspetfood.com manufacturer', 'wellnesspetfood.com nutrition document (PDF) manufacturer']);
    expect(r.facts?.ingredients?.value).toHaveLength(15);
    expect(r.facts?.guaranteedAnalysis?.value.map((g) => `${g.nutrient}:${g.value}`).slice(0, 4)).toEqual(['crude_protein:10', 'crude_fat:3.5', 'crude_fiber:1', 'moisture:85']);
    expect(r.facts?.guaranteedAnalysis?.source.sourceName).toBe('wellnesspetfood.com');
    expect(r.facts?.adequacy?.value).toMatchObject({ type: 'complete', species: 'cat', lifeStages: ['adult_maintenance'] });
    expect(r.facts?.adequacy?.source.sourceName).toBe('wellnesspetfood.com nutrition document (PDF)');
    expect(r.facts?.packageSize?.value).toMatchObject({ amount: 2.8, unit: 'oz' });
    expect(caloriesForPackage(r.facts?.calories?.value, r.facts?.packageSize?.value).map(describeCalories)).toEqual(['70 kcal per 2.8-oz can']);
    expect(r.verified).toEqual([
      'companionpetfoodsupply.com shows this product’s barcode.',
      'wellnesspetfood.com shows this product’s barcode in its page data.',
      'Same recipe on wellnesspetfood.com: 10 of the first 10 ingredients match the list on companionpetfoodsupply.com in order (Tuna, Tuna Broth, Water Sufficient for Processing, Mackerel …).',
    ]);
  });
  it('Wellness can, as the live research answered it (2026-10-30, trace a5113208-1f0): names not printed on the pages, and marketing copy offered as the feeding statement', async () => {
    const answers = [
      // The answer's name is not on the retailer's page, and its "adequacy statement" is the page's marketing sentence.
      modelAnswer({ product_name: 'Wellness Signature Selects Tuna and Salmon Canned Cat Food', brand: 'Wellness', intended_for: 'cats', ingredients_verbatim: WELLNESS_INGREDIENTS.replace('Choline Chloride, Minerals [', 'Choline Chloride], Minerals ['), calorie_statement_verbatim: '70 kcal/2.8 oz can, 133 kcal/5.3 oz can', adequacy_statement_verbatim: 'Complete and balanced nutrition comes in convenient serving sizes for everyday feeding.', source_urls: ['https://www.companionpetfoodsupply.com/shop/wellness-tuna-salmon-28oz.htm'] }),
      modelAnswer({ product_name: 'Wellness CORE Signature Selects Skipjack Tuna Wet Cat Food', brand: 'Wellness', intended_for: 'cats', source_urls: ['https://www.wellnesspetfood.com/product-catalog/wellness-core-signature-selects-flaked-skipjack-tuna-wild-salmon-in-broth/'] }),
    ];
    let call = 0;
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.startsWith('https://api.openai.com/')) return openAi(answers[call++]);
      if (url.includes('companionpetfoodsupply')) return new Response(RETAILER_PAGE, { status: 200 });
      if (url.includes('nutrient-profile.pdf')) return new Response(pdfWith(NUTRIENT_PROFILE_LINES), { status: 200, headers: { 'content-type': 'application/pdf' } });
      return new Response(MANUFACTURER_PAGE, { status: 200 });
    }));
    const r = await researchProduct({ apiKey: 'k', model: 'm', gtin14: '00076344060048', barcode: '076344060048', knownSpecies: 'unknown', userAgent: 'test', now: new Date('2026-10-30T00:00:00Z') });
    // The name as the manufacturer's own heading prints it (it replaces the retailer's heading).
    expect(r.facts?.productName).toMatchObject({ value: 'Wellness CORE Signature Selects Flaked Skipjack Tuna & Wild Salmon Entrée in Broth', source: { sourceName: 'wellnesspetfood.com' } });
    // The marketing sentence is not the feeding statement; the manufacturer's nutrition document gives it.
    expect(r.discarded).toContain('barcode search: adequacy statement: the page’s sentence names no species, life stage or standard, so it is not taken as the feeding statement');
    expect(r.facts?.adequacy?.value).toMatchObject({ type: 'complete', species: 'cat', lifeStages: ['adult_maintenance'] });
    expect(r.facts?.adequacy?.source.sourceName).toBe('wellnesspetfood.com nutrition document (PDF)');
  });
  it('a page tied to the product names it by its heading only when the heading names the brand', async () => {
    const page = (h1: string) => `<html><head><title>x</title></head><body><h1>${h1}</h1><p>UPC 076344060048</p><p>Ingredients Tuna, Tuna Broth, Water, Mackerel, Salmon</p></body></html>`;
    for (const [h1, expected] of [['Product details', undefined], ['Wellness Signature Skipjack - Tuna &amp; Wild Salmon 2.8oz', 'Wellness Signature Skipjack - Tuna & Wild Salmon 2.8oz']] as const) {
      vi.stubGlobal('fetch', vi.fn(async (url: string) => {
        if (url.startsWith('https://api.openai.com/')) return openAi(modelAnswer({ product_name: 'Something Else Entirely', brand: 'Wellness', intended_for: 'cats', ingredients_verbatim: 'Tuna, Tuna Broth, Water, Mackerel, Salmon', source_urls: ['https://shop.example/p'] }));
        return new Response(page(h1), { status: 200 });
      }));
      const r = await researchProduct({ apiKey: 'k', model: 'm', gtin14: '00076344060048', barcode: '076344060048', knownSpecies: 'cat', knownBrand: 'Wellness', userAgent: 'test', now: new Date('2026-10-30T00:00:00Z') });
      expect(r.facts?.productName?.value).toBe(expected);
    }
  });
  it('salmon treat: a retailer’s "Dog Trt" listing, then the manufacturer’s dog-and-cat page matched by its written-out name', async () => {
    const retailer = '<html><head><title>A Better Treat Dog Trt Frz Dr Wld Salmn – Blossom Goods</title></head><body><h1>A Better Treat Dog Trt Frz Dr Wld Salmn</h1><p>6 x 1.5 oz</p><p>A Better Treat presents Dog Trt Frz Dr Wld Salmn UPC: 850063633017</p></body></html>';
    const maker = '<html><head><title>A Better Treat - Freeze Dried Wild Caught Salmon Dog Treats</title></head><body><p>SHOP ALL DOG AND CAT TREATS</p><h1>Freeze Dried Raw Wild Caught Salmon Dog and Cat Treats</h1><p>FEEDING INSTRUCTIONS These are for supplemental or intermittent feeding as a healthy treat or a training reward.</p><p>INGREDIENTS Wild Caught Salmon</p></body></html>';
    const shop = { title: 'Freeze Dried Raw Wild Caught Salmon Dog and Cat Treats', type: 'Dog Treats', tags: [], variants: [{ title: 'Standard 1 Pack', barcode: '860004608905' }, { title: 'Half Size 1 Pack', barcode: null }], description: 'DOGS AND CATS LOVE OUR ALL NATURAL TREATS' };
    const answers = [
      modelAnswer({ product_name: 'Dog Trt Frz Dr Wld Salmn', brand: 'A Better Treat', intended_for: 'dogs', product_type: 'treat', package_size_verbatim: '6 x 1.5 oz', source_urls: ['https://blossom-goods.com/products/a-better-treat-dog-trt-frz-dr-wld-salmn'] }),
      modelAnswer({ product_name: 'Freeze Dried Raw Wild Caught Salmon Dog and Cat Treats', brand: 'A Better Treat', intended_for: 'cats_and_dogs', product_type: 'treat', ingredients_verbatim: 'Wild Caught Salmon', adequacy_statement_verbatim: 'These are for supplemental or intermittent feeding as a healthy treat or a training reward.', guaranteed_analysis: [{ label: 'Crude Protein', qualifier: 'min', value: 63, unit: '%' }], source_urls: ['https://www.abettertreat.com/products/freeze-dried-salmon-dog-treats'] }),
    ];
    let call = 0;
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.startsWith('https://api.openai.com/')) return openAi(answers[call++]);
      if (url.endsWith('.js')) return url.includes('abettertreat') ? new Response(JSON.stringify(shop), { status: 200 }) : new Response('{}', { status: 404 });
      return new Response(url.includes('blossom') ? retailer : maker, { status: 200 });
    }));
    const r = await researchProduct({ apiKey: 'k', model: 'm', gtin14: '00850063633017', barcode: '850063633017', knownSpecies: 'unknown', userAgent: 'test', now: new Date('2026-10-30T00:00:00Z') });
    const signals = (r.facts?.classificationSignals ?? []).map((c) => `${c.text} @ ${c.source}`);
    expect(signals).toContain('intended for dogs @ web:blossom-goods.com:00850063633017');
    expect(signals).toContain('intended for cats and dogs @ web:abettertreat.com:00850063633017');
    expect(r.sources.map((s) => s.sourceType)).toEqual(['retailer_or_web', 'manufacturer']);
    expect(r.facts?.ingredients?.value).toEqual(['Wild Caught Salmon']); // a single ingredient named in the product's name
    expect(r.facts?.productName?.value).toBe('Freeze Dried Raw Wild Caught Salmon Dog and Cat Treats'); // not the catalogue abbreviation
    expect(r.facts?.adequacy?.value.type).toBe('intermittent');
    expect(r.facts?.guaranteedAnalysis).toBeUndefined(); // not taken from a page matched by name only
    expect(r.facts?.packageSize?.value).toMatchObject({ amount: 1.5, unit: 'oz' }); // from the barcode's own page
    expect(r.verified?.join(' ')).toMatch(/abettertreat.com matches this product by brand and name \(the manufacturer’s page; the barcode isn’t shown on it\)/);
    // And the classification: both species, confirmed by the manufacturer; a treat by its feeding statement.
    const species = speciesEvidence([
      { text: 'Dog Trt Frz Dr Wld Salmn', basis: 'retailer_listing' },
      ...(r.facts?.classificationSignals ?? []).map((c) => ({ text: c.text, basis: (c.source.includes('abettertreat') ? 'manufacturer_page' : 'retailer_listing') as 'manufacturer_page' | 'retailer_listing' })),
    ]);
    expect(species).toMatchObject({ set: ['cat', 'dog'], confirmed: true });
  });
  it('Gravies pouch: no database record, so a barcode database’s title tells research what to search for; facts come only from the page proven by its barcode', async () => {
    const gravies = `<html><head><title>Complete Health Healthy Indulgence Gravies Chicken &amp; Turkey</title></head><body><h1>Wellness Complete Health Healthy Indulgence Gravies Chicken &amp; Turkey</h1>
      <img alt="Chicken Broth, Water Sufficient For Processing, Chicken, Potato Starch, Turkey, Eggs, Chicken Liver, Carrots, Natural Flavor, Salt, Guar Gum, Tricalcium Phosphate, Potassium Chloride, Taurine">
      <p>Guaranteed Analysis</p><p>Crude Protein (min.) 4% Crude Fat (min.) 2% Crude Fiber (max.) 1% Moisture (max.) 85% Ash (max.) 2.5%</p><div class="ps-widget" ps-sku=" 076344886570 "></div><p>Available Sizes: 3 Ounce Retort Pouch</p></body></html>`;
    const morsels = gravies.replace(/Gravies/g, 'Morsels').replace('076344886570', '076344886587').replace('Crude Protein (min.) 4%', 'Crude Protein (min.) 7%');
    const seen: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: { body?: string }) => {
      if (url.startsWith('https://api.openai.com/')) {
        seen.push(String(init?.body ?? ''));
        return openAi(modelAnswer({ product_name: 'Complete Health Healthy Indulgence Gravies Chicken & Turkey', brand: 'Wellness', intended_for: 'cats', source_urls: ['https://www.wellnesspetfood.com/product-catalog/healthy-indulgence-morsels-chicken-turkey/', 'https://www.wellnesspetfood.com/product-catalog/healthy-indulgence-gravies-chicken-turkey/'] }));
      }
      return new Response(url.includes('morsels') ? morsels : gravies, { status: 200 });
    }));
    const r = await researchProduct({ apiKey: 'k', model: 'm', gtin14: '00076344886570', barcode: '076344886570', knownSpecies: 'unknown', hint: { title: 'Wellness Healthy Indulgence Gravies with Chicken & Turkey in Gravy', brand: 'Wellness Natural Pet Food', category: '', source: 'UPCitemdb (barcode database)' }, userAgent: 'test', now: new Date('2026-10-30T00:00:00Z') });
    expect(seen[0]).toContain('A barcode database lists this barcode as \\"Wellness Healthy Indulgence Gravies with Chicken & Turkey in Gravy\\"');
    // The Morsels page was cited first, but only the Gravies page carries this barcode: its values are used.
    expect(r.sources[0]).toMatchObject({ url: 'https://www.wellnesspetfood.com/product-catalog/healthy-indulgence-gravies-chicken-turkey', matchConfidence: 'exact_barcode' });
    expect(r.facts?.guaranteedAnalysis?.value.find((g) => g.nutrient === 'crude_protein')?.value).toBe(4);
    expect(r.facts?.ingredients?.value.slice(0, 3)).toEqual(['Chicken Broth', 'Water Sufficient For Processing', 'Chicken']);
  });
});

describe('why a requested panel is still missing (never "product unknown")', () => {
  // Statuses are derived from what the job recorded: research outcome and its discarded notes, and database label images.
  it('tells apart a search not made, a source unreachable, information not on the source, an unreadable image and a rejected value', async () => {
    const { retrievalStatus } = await import('../../src/pipeline/facts');
    const at = new Date('2026-10-30T05:00:00Z');
    expect(retrievalStatus('nutrition', { researchNotRun: 'quota' })).toMatchObject({ status: 'not_searched', detail: expect.stringMatching(/searches for this account are used up/) });
    expect(retrievalStatus('nutrition', { researchNotRun: 'ai_budget' })).toMatchObject({ status: 'not_searched', detail: expect.stringMatching(/AI checks are used up/) });
    expect(retrievalStatus('nutrition', { researchNotRun: 'switched_off' }).status).toBe('not_searched');
    expect(retrievalStatus('ingredients', { researchNotRun: 'error' })).toMatchObject({ status: 'source_unavailable', detail: expect.not.stringMatching(/unknown/i) });
    expect(retrievalStatus('ingredients', { research: { outcome: 'fetch_failed', discarded: [], source: '' } }).status).toBe('source_unavailable');
    expect(retrievalStatus('nutrition', { research: { outcome: 'done', discarded: [], source: 'companionpetfoodsupply.com (retailer_or_web)', at } })).toEqual({
      purpose: 'nutrition',
      status: 'not_found',
      detail: 'Not printed on the page matched to this barcode (companionpetfoodsupply.com, checked 2026-10-30).',
    });
    expect(retrievalStatus('ingredients', { research: { outcome: 'done', discarded: [], source: '', at } }).detail).toBe('No manufacturer or retailer page could be matched to this barcode (checked 2026-10-30).');
    expect(retrievalStatus('nutrition', { images: { skipped: ['nutrition: unreadable'], failed: [] } }).status).toBe('not_read');
    expect(retrievalStatus('nutrition', { images: { skipped: [], failed: ['nutrition: HTTP 503'] }, research: { outcome: 'done', discarded: [], source: 'x' } })).toMatchObject({ status: 'not_read', detail: expect.stringMatching(/tries again later/) });
    // A value found but rejected by a check, and a page matched by name only.
    const rejected = retrievalStatus('nutrition', { research: { outcome: 'done', discarded: ['barcode search: guaranteed analysis: kept 2 of 3 values; not on the page: Cendres brutes 7'], source: 'x' } });
    expect(rejected).toMatchObject({ status: 'rejected', detail: expect.stringMatching(/didn’t match what the page prints, so the nutrition details weren’t used/) });
    const weak = retrievalStatus('ingredients', { research: { outcome: 'done', discarded: ['manufacturer page: ingredients: not used from a page matched only by brand and name'], source: 'x' } });
    expect(weak).toMatchObject({ status: 'rejected', detail: expect.stringMatching(/doesn’t show this barcode or the same recipe, so its ingredient list wasn’t used/) });
    // A note about another panel does not decide this one.
    expect(retrievalStatus('ingredients', { research: { outcome: 'done', discarded: ['guaranteed analysis: not on the page'], source: 'x (manufacturer)' } }).status).toBe('not_found');
    expect(retrievalStatus('front', { research: { outcome: 'done', discarded: ['example.com is for cats, but this product is for dogs: another variant, so nothing from it was used'], source: '' } })).toMatchObject({ status: 'rejected', detail: expect.stringMatching(/another variant/) });
  });
});

describe('a page that could not be read is told apart from pages read and found not to be this product (trace 2ae090c1-eda)', () => {
  it('says which happened', async () => {
    const { retrievalStatus } = await import('../../src/pipeline/facts');
    const blockedOnly = retrievalStatus('ingredients', { research: { outcome: 'fetch_failed', discarded: ['barcode search: could not fetch https://shop.example/p to verify it (HTTP 403)'], source: '' } });
    expect(blockedOnly).toMatchObject({ status: 'source_unavailable', detail: 'The manufacturer’s and retailers’ pages couldn’t be reached; Purrbi tries again later.' });
    const blockedAndWeak = retrievalStatus('ingredients', { research: { outcome: 'fetch_failed', discarded: ['barcode search: could not fetch https://www.mercadomagico.com/x to verify it (HTTP 403)', 'name search: onlynaturalpet.com matches only by brand and name (no ingredient list to compare), and it is not yet known whether this product is for cats or dogs, so nothing from it was used'], source: '' } });
    expect(blockedAndWeak).toMatchObject({ status: 'source_unavailable', detail: 'A page the search found couldn’t be read, and the others it could read didn’t show this product; Purrbi tries again later.' });
  });
});

// Tests A/B/C of 2026-10-30 (099482481087, 076344886570, 099482517243), first barcode-only lookups through the app:
// the barcode database answered HTTP 429 (its daily allowance, shared by Cloud Functions' addresses) and the one
// barcode search found nothing (A, C) or only a distributor's price list that was rejected (B, traces a0d081e1-d1b
// and f9274421-5dd). The price list itself could not be read from the test sandbox (its network policy blocks the
// host), so the row below is synthetic, laid out as such lists print a UPC between other numbers.
describe('barcode-only research (tests A/B/C, 2026-10-30)', () => {
  const GRAVIES = '00076344886570';
  it('finds a barcode printed between other numbers, never inside a longer number', async () => {
    const { textContainsGtin } = await import('../../src/domain/barcode');
    expect(textContainsGtin('Item UPC Description Pack Price 89133 076344886570 WEL HI GRVY CHKN TRKY 24 3OZ 1.79', GRAVIES)).toBe(true);
    expect(textContainsGtin('UPC: 076344886570 24 x 3 oz', GRAVIES)).toBe(true);
    expect(textContainsGtin('UPC 0 76344 88657 0', GRAVIES)).toBe(true);
    expect(textContainsGtin('EAN 0076344886570', GRAVIES)).toBe(true);
    expect(textContainsGtin('UPC 076344886571 24', GRAVIES)).toBe(false); // the next product's barcode
    expect(textContainsGtin('Order 1076344886570 24', GRAVIES)).toBe(false); // part of a longer number
    expect(textContainsGtin('76344 88657', GRAVIES)).toBe(false); // without its check digit
  });
  it('searches the barcode in the forms pages print it', async () => {
    const { printedForms } = await import('../../src/domain/barcode');
    expect(printedForms(GRAVIES)).toEqual(['076344886570', '0076344886570', '0 76344 88657 0']);
    expect(printedForms('04006381333931')).toEqual(['4006381333931']);
    const bodies: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: { body?: string }) => {
      bodies.push(String(init?.body ?? ''));
      return openAi({ ...modelAnswer({}), found: false });
    }));
    const r = await researchProduct({ apiKey: 'k', model: 'm', gtin14: '00099482481087', barcode: '099482481087', knownSpecies: 'unknown', userAgent: 'test', now: new Date('2026-10-30T00:00:00Z') });
    expect(r.facts).toBeNull();
    // Nothing named: no search by name; the 13-digit form is searched on its own (since research 2.7.0).
    expect(bodies).toHaveLength(2);
    expect(bodies[1]).toContain('Search for \\"0099482481087\\" alone');
    expect(bodies[0]).toContain('Pages print it as \\"099482481087\\", \\"0099482481087\\", \\"0 99482 48108 7\\"');
    // The digits alone first (trace 11f7cc1e-842: "Wellness product 076344886570" found wellness clinics).
    expect(bodies[0]).toContain('Search the barcode\'s digits alone first, in quotes (\\"099482481087\\"), with no other word');
    expect(bodies[0]).toContain('A catalogue, price list or search-results page is not the product’s page');
  });
  it('B: a price list showing the barcode ends no search; the name its answer gave is searched for, and only a page showing the barcode is used', async () => {
    const priceList = '<html><head><title>2024 North Complete Price List</title></head><body><p>Item UPC Description Pack Size Price</p><p>89133 076344886570 WEL HI GRVY CHKN TRKY 24 3OZ 1.79</p><p>89140 WEL CORE SIG SEL 24 2.8OZ 2.19</p></body></html>';
    const maker = `<html><head><title>Complete Health Healthy Indulgence Gravies Chicken &amp; Turkey</title></head><body><h1>Wellness Complete Health Healthy Indulgence Gravies Chicken &amp; Turkey</h1>
      <img alt="Chicken Broth, Water Sufficient For Processing, Chicken, Potato Starch, Turkey, Eggs, Chicken Liver, Carrots, Natural Flavor, Salt, Guar Gum, Tricalcium Phosphate, Potassium Chloride, Taurine">
      <p>Guaranteed Analysis</p><p>Crude Protein (min.) 4% Crude Fat (min.) 2% Crude Fiber (max.) 1% Moisture (max.) 85% Ash (max.) 2.5%</p><div class="ps-widget" ps-sku=" 076344886570 "></div><p>Available Sizes: 3 Ounce Retort Pouch</p></body></html>`;
    const answers = [
      modelAnswer({ product_name: 'Wellness Healthy Indulgence Gravies Chicken & Turkey', brand: 'Wellness', intended_for: 'cats', source_urls: ['https://www.admc.us/wp-content/uploads/2022/02/price-list.htm'] }),
      { ...modelAnswer({}), found: false }, // the 13-digit form (research 2.7.0)
      modelAnswer({ product_name: 'Complete Health Healthy Indulgence Gravies Chicken & Turkey', brand: 'Wellness', intended_for: 'cats', source_urls: ['https://www.wellnesspetfood.com/product-catalog/healthy-indulgence-gravies-chicken-turkey/'] }),
    ];
    const bodies: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: { body?: string }) => {
      if (url.startsWith('https://api.openai.com/')) {
        bodies.push(String(init?.body ?? ''));
        return openAi(answers[bodies.length - 1]);
      }
      return new Response(url.includes('admc') ? priceList : maker, { status: 200 });
    }));
    const r = await researchProduct({ apiKey: 'k', model: 'm', gtin14: GRAVIES, barcode: '076344886570', knownSpecies: 'unknown', userAgent: 'test', now: new Date('2026-10-30T00:00:00Z') });
    expect(r.calls).toBe(3);
    expect(r.discarded).toContain('barcode search: admc.us shows this barcode but nothing else about the product (no name, ingredients, analysis or feeding statement), so the search went on');
    expect(bodies[2]).toContain('Search by product identity: brand \\"Wellness\\", product \\"Wellness Healthy Indulgence Gravies Chicken & Turkey\\" (as an earlier search answer named it; unverified).');
    expect(bodies[2]).toContain('use only a page that shows this barcode');
    expect(r.sources[0]).toMatchObject({ sourceName: 'wellnesspetfood.com', sourceType: 'manufacturer', matchConfidence: 'exact_barcode' });
    expect(r.facts?.ingredients?.value.slice(0, 3)).toEqual(['Chicken Broth', 'Water Sufficient For Processing', 'Chicken']);
    expect(r.facts?.guaranteedAnalysis?.value.find((g) => g.nutrient === 'crude_protein')?.value).toBe(4);
    expect(r.facts?.productName?.value).toBe('Complete Health Healthy Indulgence Gravies Chicken & Turkey');
    // The page's heading doesn't say who it is for, so the answer's "cats" is not taken from it.
    expect((r.facts?.classificationSignals ?? []).map((c) => c.text)).not.toContain('intended for cats');
  });
  it('a page found by the answer’s name that does not show the barcode is not used (the name is not trusted)', async () => {
    const lookalike = '<html><head><title>Wellness Healthy Indulgence Gravies Chicken &amp; Turkey</title></head><body><h1>Wellness Healthy Indulgence Gravies Chicken &amp; Turkey</h1><p>Ingredients Chicken Broth, Chicken, Turkey</p></body></html>';
    let n = 0;
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.startsWith('https://api.openai.com/')) {
        n++;
        return openAi(modelAnswer({ product_name: 'Wellness Healthy Indulgence Gravies Chicken & Turkey', brand: 'Wellness', intended_for: 'cats', ingredients_verbatim: 'Chicken Broth, Chicken, Turkey', source_urls: ['https://shop.example/gravies'] }));
      }
      return new Response(lookalike, { status: 200 });
    }));
    const r = await researchProduct({ apiKey: 'k', model: 'm', gtin14: GRAVIES, barcode: '076344886570', knownSpecies: 'unknown', userAgent: 'test', now: new Date('2026-10-30T00:00:00Z') });
    expect(n).toBe(3); // the barcode search, its 13-digit form, then one search by the answer's name; no more
    expect(r.facts).toBeNull();
    expect(r.discarded.filter((d) => d.includes('does not show this product’s barcode'))).toHaveLength(3);
  });
});

describe('barcode database allowance (2026-10-30: HTTP 429 on every scan, X-RateLimit-Limit 100 a day)', () => {
  it('says when the used-up allowance resets', async () => {
    const { allowanceResetAt, lookupBarcodeHint } = await import('../../src/sources/barcodeLookup');
    const now = new Date('2026-10-30T15:00:00Z');
    expect(allowanceResetAt(new Headers({ 'x-ratelimit-reset': String(Date.parse('2026-10-31T00:28:00Z') / 1000) }), now).toISOString()).toBe('2026-10-31T00:28:00.000Z');
    expect(allowanceResetAt(new Headers({ 'x-ratelimit-reset': 'soon' }), now).toISOString()).toBe('2026-10-30T16:00:00.000Z'); // unreadable: an hour
    expect(allowanceResetAt(new Headers({ 'x-ratelimit-reset': String(Date.parse('2026-11-05T00:00:00Z') / 1000) }), now).toISOString()).toBe('2026-10-30T16:00:00.000Z'); // over a day ahead: an hour
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"code":"TOO_FAST","message":"Rate limit exceeded"}', { status: 429, headers: { 'x-ratelimit-limit': '100', 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': String(Date.parse('2026-10-31T00:28:00Z') / 1000) } })));
    const err = await lookupBarcodeHint('00099482481087', 'test', now).catch((e) => e);
    expect(err).toMatchObject({ kind: 'rate_limited', status: 429 });
    expect(err.retryAt.toISOString()).toBe('2026-10-31T00:28:00.000Z');
  });
});

// Rerun of test B after research 2.2.0 (2026-10-30 16:16Z, trace cdd31e2d-f90, backend 1e955ef): the model ran one
// search and answered "no matching product", while shops list the barcode. The search's own result pages are now
// recorded in the trace and checked by Purrbi itself; the first that shows the barcode is read from Purrbi's copy.
describe('the search’s result pages, checked by Purrbi (test B rerun, trace cdd31e2d-f90)', () => {
  const GRAVIES = '00076344886570';
  const searchOutput = (urls: string[], answer: unknown) =>
    new Response(JSON.stringify({ output: [{ type: 'web_search_call', action: { type: 'search', query: '076344886570', sources: urls.map((url) => ({ type: 'url', url })) } }, { type: 'message', content: [{ type: 'output_text', text: JSON.stringify(answer), annotations: [] }] }] }), { status: 200 });
  const chat = (answer: unknown) => new Response(JSON.stringify({ model: 'gpt-4.1-mini', choices: [{ message: { content: JSON.stringify(answer) }, finish_reason: 'stop' }] }), { status: 200 });
  const shop = `<html><head><title>Wellness Healthy Indulgence Gravies Chicken &amp; Turkey Cat Food Pouch 3 oz</title></head><body><h1>Wellness Healthy Indulgence Gravies Chicken &amp; Turkey in Gravy Cat Food Pouch</h1>
    <p>Ingredients: Chicken Broth, Water Sufficient For Processing, Chicken, Potato Starch, Turkey, Eggs, Chicken Liver, Carrots, Natural Flavor, Salt</p>
    <p>Guaranteed Analysis Crude Protein (min.) 4% Crude Fat (min.) 2% Crude Fiber (max.) 1% Moisture (max.) 85%</p><table><tr><td>UPC</td><td>076344886570</td></tr><tr><td>Size</td><td>3 oz</td></tr></table></body></html>`;
  const other = '<html><head><title>Wellness cat food</title></head><body><h1>Wellness Cat Food</h1><p>Shop all Wellness pouches</p></body></html>';
  it('records each search and its result pages, reads the first result page that shows the barcode, and verifies it there', async () => {
    const bodies: { url: string; body: string }[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: { body?: string }) => {
      if (url.startsWith('https://api.openai.com/')) bodies.push({ url, body: String(init?.body ?? '') });
      if (url === 'https://api.openai.com/v1/responses') return searchOutput(['https://www.chewy.com/wellness-pouches', 'https://www.petsupermarket.com/wellness-gravies-chicken-turkey.html', 'https://www.admc.us/price-list.pdf'], { ...modelAnswer({}), found: false });
      if (url === 'https://api.openai.com/v1/chat/completions') {
        return chat(modelAnswer({ product_name: 'Wellness Healthy Indulgence Gravies Chicken & Turkey in Gravy Cat Food Pouch', brand: 'Wellness', intended_for: 'cats', ingredients_verbatim: 'Chicken Broth, Water Sufficient For Processing, Chicken, Potato Starch, Turkey, Eggs, Chicken Liver, Carrots, Natural Flavor, Salt', guaranteed_analysis: [{ label: 'Crude Protein', qualifier: 'min', value: 4, unit: '%' }, { label: 'Crude Fat', qualifier: 'min', value: 2, unit: '%' }], package_size_verbatim: '3 oz' }));
      }
      return new Response(url.includes('petsupermarket') ? shop : other, { status: 200 });
    }));
    const r = await researchProduct({ apiKey: 'k', model: 'm', gtin14: GRAVIES, barcode: '076344886570', knownSpecies: 'unknown', userAgent: 'test', now: new Date('2026-10-30T00:00:00Z') });
    expect(JSON.parse(bodies[0].body).include).toEqual(['web_search_call.action.sources']);
    expect(r.discarded.slice(0, 4)).toEqual([
      'barcode search: searched “076344886570” (3 results: chewy.com, petsupermarket.com, admc.us)',
      'barcode search: model reported no matching product (1 search, 0 citations)',
      'barcode search: result pages without this barcode: chewy.com',
      'barcode search: petsupermarket.com (a search result) shows this barcode, so Purrbi read it',
    ]);
    // The page was read from Purrbi's copy with one model call (no web search), and every value checked on it.
    // Then, as after any shop's page, the manufacturer's own page is sought for what is missing.
    expect(bodies.map((b) => b.url.replace('https://api.openai.com/v1/', ''))).toEqual(['responses', 'chat/completions', 'responses']);
    expect(JSON.parse(bodies[2].body).input[1].content).toContain('Find the manufacturer’s own product page for this exact product: brand "Wellness"');
    expect(r.calls).toBe(3);
    expect(JSON.parse(bodies[1].body).messages[1].content[0].text).toContain('UPC 076344886570');
    expect(r.sources[0]).toMatchObject({ sourceName: 'petsupermarket.com', sourceType: 'retailer_or_web', matchConfidence: 'exact_barcode' });
    expect(r.facts?.productName?.value).toBe('Wellness Healthy Indulgence Gravies Chicken & Turkey in Gravy Cat Food Pouch');
    expect(r.facts?.ingredients?.value.slice(0, 3)).toEqual(['Chicken Broth', 'Water Sufficient For Processing', 'Chicken']);
    expect(r.facts?.guaranteedAnalysis?.value.map((g) => `${g.nutrient}:${g.value}`)).toEqual(['crude_protein:4', 'crude_fat:2', 'crude_fiber:1', 'moisture:85']);
    expect((r.facts?.classificationSignals ?? []).map((c) => c.text)).toContain('intended for cats');
    expect(r.facts?.packageSize?.value).toMatchObject({ amount: 3, unit: 'oz' });
  });
  it('reads no page when no result page shows the barcode, and says which were checked', async () => {
    let chats = 0;
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url === 'https://api.openai.com/v1/responses') return searchOutput(['https://www.chewy.com/wellness-pouches', 'https://shop.example/gone'], { ...modelAnswer({}), found: false });
      if (url.includes('chat/completions')) {
        chats++;
        return chat(modelAnswer({}));
      }
      if (url.includes('gone')) return new Response('gone', { status: 404 });
      return new Response(other, { status: 200 });
    }));
    const r = await researchProduct({ apiKey: 'k', model: 'm', gtin14: GRAVIES, barcode: '076344886570', knownSpecies: 'unknown', userAgent: 'test', now: new Date('2026-10-30T00:00:00Z') });
    expect(chats).toBe(0);
    expect(r.facts).toBeNull();
    expect(r.discarded).toContain('barcode search: result pages without this barcode: chewy.com');
    expect(r.discarded).toContain('barcode search: result pages that could not be read: shop.example (HTTP 404)');
  });
  it('asks again without the result pages when the API refuses that option', async () => {
    const sent: Record<string, unknown>[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: { body?: string }) => {
      if (url === 'https://api.openai.com/v1/responses') {
        const body = JSON.parse(String(init?.body ?? '{}'));
        sent.push(body);
        if (body.include) return new Response(JSON.stringify({ error: { message: "Unsupported parameter: 'include'" } }), { status: 400 });
        return openAi({ ...modelAnswer({}), found: false });
      }
      return new Response('', { status: 404 });
    }));
    const r = await researchProduct({ apiKey: 'k', model: 'm', gtin14: GRAVIES, barcode: '076344886570', knownSpecies: 'unknown', userAgent: 'test', now: new Date('2026-10-30T00:00:00Z') });
    // Refused once, not asked for again in later searches (here the 13-digit form's).
    expect(sent.map((b) => 'include' in b)).toEqual([true, false, false]);
    expect(r.discarded).toContain('barcode search: model reported no matching product (1 search, 0 citations)');
  });
});

// Rerun of test B on research 2.3.0 (2026-10-30 16:34Z, trace 864a81dd-46a, backend a8b9838): a Japanese shop's page
// that shows the barcode gave protein 9 % and fat 3 %, while the manufacturer and US shops print 4 % and 2 % for
// these Gravies (9 % and 3 % fit the sibling Morsels recipe). The page could not be read from the test sandbox
// (its network policy blocks the host), so the pages below are synthetic, laid out as such pages print it.
describe('another variant’s analysis is not taken from a page that shows the barcode (test B, trace 864a81dd-46a)', () => {
  const GRAVIES = '00076344886570';
  const run = async (html: string, analysis: { label: string; value: number }[]) => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.startsWith('https://api.openai.com/')) return openAi(modelAnswer({ product_name: 'ウェルネス ヘルシーインダルジェンス グレービー チキン＆ターキー', brand: 'Wellness', intended_for: 'cats', guaranteed_analysis: analysis.map((g) => ({ ...g, qualifier: 'min', unit: '%' })), source_urls: ['https://store.example.jp/56nyan/c0012.html'] }));
      return new Response(html, { status: 200 });
    }));
    return researchProduct({ apiKey: 'k', model: 'm', gtin14: GRAVIES, barcode: '076344886570', knownSpecies: 'unknown', userAgent: 'test', now: new Date('2026-10-30T00:00:00Z') });
  };
  it('a page printing other barcodes besides this one is a listing, so nothing from it is used', async () => {
    const { textGtins } = await import('../../src/sources/pageEvidence');
    const listing = '<html><head><title>ウェルネス パウチ</title></head><body><h1>Wellness ヘルシーインダルジェンス</h1><p>グレービー チキン＆ターキー 85g JAN 076344886570 粗タンパク質 4.0%以上 粗脂肪 2.0%以上</p><p>モーセル チキン＆ターキー 85g JAN 076344886587 粗タンパク質 9.0%以上 粗脂肪 3.0%以上</p></body></html>';
    expect(textGtins('JAN 076344886570 / JAN 076344886587 / 0 76344 88657 0 / 1.79 / 89133')).toEqual(['00076344886570', '00076344886587']);
    const r = await run(listing, [{ label: 'Crude Protein', value: 9 }, { label: 'Crude Fat', value: 3 }]);
    expect(r.facts).toBeNull();
    expect(r.discarded).toContain('barcode search: store.example.jp matches only as one of several sizes or variants (no ingredient list to compare), and it is not yet known whether this product is for cats or dogs, so nothing from it was used');
  });
  it('on the product’s own page, a value counts only where it is printed after its nutrient’s name', async () => {
    const own = '<html><head><title>ウェルネス グレービー チキン＆ターキー 85g</title></head><body><h1>Wellness ヘルシーインダルジェンス グレービー チキン＆ターキー</h1><p>JAN 076344886570</p><p>保証成分 粗タンパク質 4.0%以上 粗脂肪 2.0%以上 粗繊維 1.0%以下 水分 85.0%以下</p><p>まとめ買い 9個 3袋セット</p></body></html>';
    const wrong = await run(own, [{ label: 'Crude Protein', value: 9 }, { label: 'Crude Fat', value: 3 }]);
    expect(wrong.facts?.guaranteedAnalysis).toBeUndefined();
    expect(wrong.discarded).toContain('barcode search: guaranteed analysis: values not found on the cited page');
    const right = await run(own, [{ label: 'Crude Protein', value: 4 }, { label: 'Crude Fat', value: 2 }]);
    expect(right.facts?.guaranteedAnalysis?.value.map((g) => `${g.nutrient}:${g.value}`)).toEqual(['crude_protein:4', 'crude_fat:2']);
  });
});

// Rerun of test B on research 2.4.0 (2026-10-30 16:51Z, trace 56bd298f-a6a, backend b9fbec4): the search returned
// 12 pages; Purrbi's four checks went to the manufacturer's pages for other products, and the shops further down
// were never opened. Then a search by the brand alone ("Wellness 076344886570") found other businesses.
describe('result pages checked site by site; no search by a brand alone (test B, trace 56bd298f-a6a)', () => {
  const GRAVIES = '00076344886570';
  const results = [
    'https://www.wellnesspetfood.com/product-catalog/wellness-complete-health-grained-beef-barley/',
    'https://www.wellnesspetfood.com/product-catalog/wellness-complete-health-plus-whitefish-sweet-potato/',
    'https://www.wellnesspetfood.com/product-catalog/wellness-complete-health-grain-sensitive-skin-stomach-salmon-rice/',
    'https://www.wellnesspetfood.com/product-catalog/wellness-core-digestive-health-large-breed-chicken-brown-rice/',
    'https://www.petsupermarket.com/brands/w/wellness/wellness-healthly-indulgence-gravy-adult-wet-cat-food-chicken-turkey-recipe-natural-protein-rich-grain-free-3-ounce-pouch/7634488657.html',
  ];
  const shop = '<html><head><title>Wellness Healthy Indulgence Gravy Adult Wet Cat Food Chicken &amp; Turkey 3 oz</title></head><body><h1>Wellness Healthy Indulgence Gravy Adult Wet Cat Food, Chicken &amp; Turkey Recipe, 3-oz pouch</h1><p>Ingredients: Chicken Broth, Water Sufficient For Processing, Chicken, Potato Starch, Turkey</p><p>Guaranteed Analysis: Crude Protein (min) 4.00%, Crude Fat (min) 2.00%, Crude Fiber (max) 1.00%, Moisture (max) 85.00%</p><p>UPC: 076344886570</p></body></html>';
  const other = '<html><head><title>Wellness dog food</title></head><body><h1>Wellness Complete Health Dog Food</h1><p>UPC: 076344000000</p></body></html>';
  it('checks each site’s first result before a second page of the same site', async () => {
    const opened: string[] = [];
    const bodies: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: { body?: string }) => {
      if (url === 'https://api.openai.com/v1/responses') {
        bodies.push(String(init?.body ?? ''));
        return new Response(JSON.stringify({ output: [{ type: 'web_search_call', action: { type: 'search', query: 'Wellness pet product 076344886570', sources: results.map((u) => ({ type: 'url', url: u })) } }, { type: 'message', content: [{ type: 'output_text', text: JSON.stringify({ ...modelAnswer({}), found: false }), annotations: [] }] }] }), { status: 200 });
      }
      if (url.includes('chat/completions')) return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(modelAnswer({ product_name: 'Wellness Healthy Indulgence Gravy Adult Wet Cat Food, Chicken & Turkey Recipe, 3-oz pouch', brand: 'Wellness', intended_for: 'cats', guaranteed_analysis: [{ label: 'Crude Protein', qualifier: 'min', value: 4, unit: '%' }] })) }, finish_reason: 'stop' }] }), { status: 200 });
      opened.push(url);
      return new Response(url.includes('petsupermarket') ? shop : other, { status: 200 });
    }));
    // Brand known (kept from a page that showed the barcode), no name: no search by the brand alone.
    const r = await researchProduct({ apiKey: 'k', model: 'm', gtin14: GRAVIES, barcode: '076344886570', knownBrand: 'Wellness', knownSpecies: 'unknown', userAgent: 'test', now: new Date('2026-10-30T00:00:00Z') });
    expect(opened.slice(0, 2).map((u) => new URL(u).hostname)).toEqual(['www.wellnesspetfood.com', 'www.petsupermarket.com']);
    expect(r.discarded).toContain('barcode search: petsupermarket.com (a search result) shows this barcode, so Purrbi read it');
    expect(r.sources[0]).toMatchObject({ sourceName: 'petsupermarket.com', matchConfidence: 'exact_barcode' });
    expect(r.facts?.guaranteedAnalysis?.value.map((g) => `${g.nutrient}:${g.value}`)).toEqual(['crude_protein:4', 'crude_fat:2', 'crude_fiber:1', 'moisture:85']);
    expect(bodies.some((b) => b.includes('Search by product identity rather than barcode: brand \\"Wellness\\", product \\"\\"'))).toBe(false);
  });
});

// Cycle 5 (backend 1021e47): A "099482481087" gave 2 results (eBay, Ubuy; both refuse automated readers) and C
// "099482517243" none, one search per call, in the 12-digit form only; independent searches find A on Spoonful and C
// on Amazon under the 13-digit form. B's manufacturer search used a Japanese listing's heading and reached Wellness
// Japan (trace cdee0a88-3ff). The pages below are synthetic.
describe('the barcode’s 13-digit form and Latin-script search words (cycle 5, traces 6402eaaf-3d7, 1ba6a7a3-4ca, cdee0a88-3ff)', () => {
  it('searches the 13-digit form on its own when the 12 digits find nothing, and uses a page it finds that shows the barcode', async () => {
    const spoonful = '<html><head><title>Whole Paws, Cat Food Can Salmon, 5.5 Ounce Ingredients</title></head><body><h1>Whole Paws, Cat Food Can Salmon, 5.5 Ounce</h1><p>Barcode 0099482481087</p><p>Ingredients: Salmon, Chicken, Chicken Liver, Salmon Broth, Carrots, Peas, Natural Flavor, Salt, Sunflower Oil</p></body></html>';
    const answers = [
      { ...modelAnswer({}), found: false },
      modelAnswer({ product_name: 'Whole Paws, Cat Food Can Salmon, 5.5 Ounce', brand: 'Whole Paws', intended_for: 'cats', ingredients_verbatim: 'Salmon, Chicken, Chicken Liver, Salmon Broth, Carrots, Peas, Natural Flavor, Salt, Sunflower Oil', source_urls: ['https://spoonfulapp.com/products/whole-paws-cat-food-can-salmon-55-ounce/MDA5OTQ4MjQ4MTA4Nw=='] }),
      { ...modelAnswer({}), found: false },
    ];
    const bodies: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: { body?: string }) => {
      if (url.startsWith('https://api.openai.com/')) {
        bodies.push(String(init?.body ?? ''));
        return openAi(answers[Math.min(bodies.length - 1, answers.length - 1)]);
      }
      return new Response(url.includes('spoonfulapp') ? spoonful : '<html><body>none</body></html>', { status: 200 });
    }));
    const r = await researchProduct({ apiKey: 'k', model: 'm', gtin14: '00099482481087', barcode: '099482481087', knownSpecies: 'unknown', userAgent: 'test', now: new Date('2026-10-31T00:00:00Z') });
    expect(bodies[1]).toContain('Barcode (EAN-13): 0099482481087, the same product\\u0027s 13-digit form'.replace('\\u0027', "'"));
    expect(bodies[1]).toContain('Search for \\"0099482481087\\" alone, in quotes, with no other word.');
    expect(r.discarded[0]).toBe('barcode search: model reported no matching product (1 search, 0 citations)');
    expect(r.sources[0]).toMatchObject({ sourceName: 'spoonfulapp.com', matchConfidence: 'exact_barcode' });
    expect(r.facts?.ingredients?.value.slice(0, 3)).toEqual(['Salmon', 'Chicken', 'Chicken Liver']);
    expect((r.facts?.classificationSignals ?? []).map((c) => c.text)).toContain('intended for cats');
  });
  it('searches with a Latin-script name, not a Japanese listing’s heading, and still checks pages against the barcode', async () => {
    const { otherScript } = await import('../../src/sources/research');
    expect(otherScript('WELLNESS（ウェルネス） ヘルシーインダルジェンス 柔らか味わいグレービー仕立て チキン＆ターキー 85gパウチ')).toBe(true);
    expect(otherScript('WELLNESS（ウェルネス）')).toBe(false);
    expect(otherScript('Wellness Healthy Indulgence Gravies with Chicken & Turkey in Gravy')).toBe(false);
    expect(otherScript('Go!')).toBe(false); // short names keep their place
    expect(otherScript('K9')).toBe(false);
    const bodies: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: { body?: string }) => {
      if (url.startsWith('https://api.openai.com/')) bodies.push(String(init?.body ?? ''));
      return openAi({ ...modelAnswer({}), found: false });
    }));
    await researchProduct({
      apiKey: 'k', model: 'm', gtin14: '00076344886570', barcode: '076344886570', knownSpecies: 'unknown', userAgent: 'test', now: new Date('2026-10-31T00:00:00Z'),
      knownName: 'WELLNESS（ウェルネス） ヘルシーインダルジェンス 柔らか味わいグレービー仕立て チキン＆ターキー 85gパウチ (86570)', knownBrand: 'WELLNESS（ウェルネス）',
      hint: { title: 'Wellness Healthy Indulgence Gravies with Chicken & Turkey in Gravy', brand: 'Wellness Natural Pet Food', category: '', source: 'UPCitemdb (barcode database)' },
    });
    const users = bodies.map((b) => JSON.parse(b).input[1].content as string);
    const nameSearch = users.find((u) => u.startsWith('Search by product identity rather than barcode'));
    expect(nameSearch).toContain('product "Wellness Healthy Indulgence Gravies with Chicken & Turkey in Gravy"');
    expect(nameSearch).not.toContain('ヘルシーインダルジェンス');
    expect(users.map((u) => u.slice(0, 26))).toEqual(['Barcode (GTIN/UPC/EAN): 07', 'Barcode (EAN-13): 00763448', 'Search by product identity']);
  });
});

// Adversarial review of research 2.7.0 (workflow wf_a90dae4d-2e0): search words other than the trusted name must not let
// a page in by name; refusals are final; EAN-8 has no 13-digit form; the lead is the answer that names the product; an
// API's refusal of the result-page option belongs to that model.
describe('research 2.7.0 review fixes', () => {
  const B = '00076344886570';
  const JAPANESE = 'WELLNESS（ウェルネス） ヘルシーインダルジェンス 柔らか味わいグレービー仕立て チキン＆ターキー 85gパウチ (86570)';
  it('a search on the database’s English title, with a Japanese trusted name, does not take another flavour’s page by name', async () => {
    const otherFlavour = '<html><head><title>Wellness Healthy Indulgence Gravies Tuna &amp; Salmon</title></head><body><h1>Wellness Healthy Indulgence Gravies Tuna &amp; Salmon</h1><p>Feeding: complete and balanced for adult cats.</p><p>Ingredients: Tuna Broth, Tuna, Salmon</p></body></html>';
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.startsWith('https://api.openai.com/')) return openAi(modelAnswer({ product_name: 'Wellness Healthy Indulgence Gravies Tuna & Salmon', brand: 'Wellness', intended_for: 'cats', ingredients_verbatim: 'Tuna Broth, Tuna, Salmon', source_urls: ['https://www.wellnesspetfood.com/product-catalog/healthy-indulgence-gravies-tuna-salmon/'] }));
      return new Response(otherFlavour, { status: 200 });
    }));
    const r = await researchProduct({ apiKey: 'k', model: 'm', gtin14: B, barcode: '076344886570', knownSpecies: 'cat', userAgent: 'test', now: new Date('2026-10-31T00:00:00Z'), knownName: JAPANESE, knownBrand: 'WELLNESS（ウェルネス）', hint: { title: 'Wellness Healthy Indulgence Gravies with Chicken & Turkey in Gravy', brand: 'Wellness Natural Pet Food', category: '', source: 'UPCitemdb (barcode database)' } });
    expect(r.facts).toBeNull();
    expect(r.discarded.some((d) => d.startsWith('name search: the cited page does not show this product’s barcode or its brand and name'))).toBe(true);
  });
  it('pages that turn automated readers away are not a failure to retry, and the status says so', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.startsWith('https://api.openai.com/')) return openAi(modelAnswer({ product_name: 'Whole Paws Grain-Free Salmon Pate 5.5 oz', brand: 'Whole Paws', source_urls: ['https://www.ebay.com/itm/147318116815', 'https://www.ubuy.com.lb/en/product/243GOJJA-whole-paws'] }));
      return new Response('Access denied', { status: 403 });
    }));
    const r = await researchProduct({ apiKey: 'k', model: 'm', gtin14: '00099482481087', barcode: '099482481087', knownSpecies: 'unknown', userAgent: 'test', now: new Date('2026-10-31T00:00:00Z') });
    expect(r.facts).toBeNull();
    expect(r.fetchFailed).toBe(false);
    expect(r.discarded).toContain('barcode search: ebay.com refuses automated readers or has no such page (HTTP 403), so https://www.ebay.com/itm/147318116815 could not be checked');
    const { retrievalStatus } = await import('../../src/pipeline/facts');
    expect(retrievalStatus('front', { research: { outcome: 'done', discarded: r.discarded, source: '', at: new Date('2026-10-31T00:00:00Z') } })).toEqual({
      purpose: 'front', status: 'source_unavailable', detail: 'The pages that show this barcode (ebay.com, ubuy.com.lb) turn automated readers away, so it couldn’t be checked there.',
    });
  });
  it('an EAN-8 has no 13-digit search', async () => {
    const bodies: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: { body?: string }) => {
      if (url.startsWith('https://api.openai.com/')) bodies.push(String(init?.body ?? ''));
      return openAi({ ...modelAnswer({}), found: false });
    }));
    await researchProduct({ apiKey: 'k', model: 'm', gtin14: '00000096385074', barcode: '96385074', knownSpecies: 'unknown', userAgent: 'test', now: new Date('2026-10-31T00:00:00Z') });
    expect(bodies).toHaveLength(1);
  });
  it('the search by name uses the barcode search that names the product, after the last barcode search', async () => {
    const answers = [
      modelAnswer({ brand: 'Wellness', product_name: null, source_urls: ['https://shop.example/gone'] }),
      modelAnswer({ brand: 'Wellness', product_name: 'Wellness Healthy Indulgence Gravies Chicken & Turkey', source_urls: ['https://shop.example/gone2'] }),
      { ...modelAnswer({}), found: false },
    ];
    const bodies: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: { body?: string }) => {
      if (url.startsWith('https://api.openai.com/')) {
        bodies.push(String(init?.body ?? ''));
        return openAi(answers[Math.min(bodies.length - 1, 2)]);
      }
      return new Response('gone', { status: 404 });
    }));
    await researchProduct({ apiKey: 'k', model: 'm', gtin14: B, barcode: '076344886570', knownSpecies: 'unknown', userAgent: 'test', now: new Date('2026-10-31T00:00:00Z') });
    expect(bodies).toHaveLength(3);
    expect(JSON.parse(bodies[2]).input[1].content).toContain('product "Wellness Healthy Indulgence Gravies Chicken & Turkey"');
  });
  it('a model that refuses the result-page option does not switch it off for another model', async () => {
    const sent: { model: string; include: boolean }[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: { body?: string }) => {
      if (url === 'https://api.openai.com/v1/responses') {
        const body = JSON.parse(String(init?.body ?? '{}'));
        sent.push({ model: body.model, include: 'include' in body });
        if (body.include && body.model === 'm-refuses') return new Response(JSON.stringify({ error: { message: "Unsupported parameter: 'include'" } }), { status: 400 });
        return openAi({ ...modelAnswer({}), found: false });
      }
      return new Response('', { status: 404 });
    }));
    const base = { apiKey: 'k', gtin14: '00000096385074', barcode: '96385074', knownSpecies: 'unknown', userAgent: 'test', now: new Date('2026-10-31T00:00:00Z') };
    await researchProduct({ ...base, model: 'm-refuses' });
    await researchProduct({ ...base, model: 'm' });
    expect(sent).toEqual([{ model: 'm-refuses', include: true }, { model: 'm-refuses', include: false }, { model: 'm', include: true }]);
  });
});

describe('research 2.7.0 cost fixes (review)', () => {
  it('does not repeat the 13-digit search when the first call already searched that form', async () => {
    const bodies: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: { body?: string }) => {
      if (url.startsWith('https://api.openai.com/')) {
        bodies.push(String(init?.body ?? ''));
        return new Response(JSON.stringify({ output: [{ type: 'web_search_call', action: { type: 'search', query: '"099482517243"', sources: [] } }, { type: 'web_search_call', action: { type: 'search', query: '"0099482517243"', sources: [] } }, { type: 'message', content: [{ type: 'output_text', text: JSON.stringify({ ...modelAnswer({}), found: false }), annotations: [] }] }] }), { status: 200 });
      }
      return new Response('', { status: 404 });
    }));
    await researchProduct({ apiKey: 'k', model: 'm', gtin14: '00099482517243', barcode: '099482517243', knownSpecies: 'unknown', userAgent: 'test', now: new Date('2026-10-31T00:00:00Z') });
    expect(bodies).toHaveLength(1);
  });
  it('fetches a page once per run: a page refused for one search is not fetched again for the next', async () => {
    const pages: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.startsWith('https://api.openai.com/')) return openAi(modelAnswer({ product_name: 'Whole Paws Salmon Pate', brand: 'Whole Paws', source_urls: ['https://www.ebay.com/itm/147318116815'] }));
      pages.push(url);
      return new Response('Access denied', { status: 403 });
    }));
    const r = await researchProduct({ apiKey: 'k', model: 'm', gtin14: '00099482481087', barcode: '099482481087', knownSpecies: 'unknown', userAgent: 'test', now: new Date('2026-10-31T00:00:00Z') });
    expect(pages.filter((u) => u.includes('ebay.com'))).toHaveLength(1);
    expect(r.fetchFailed).toBe(false);
  });
});

describe('a reasoning research model (gpt-5-mini, 2026-10-31)', () => {
  const GRAVIES = '00076344886570';
  const shop = `<html><head><title>Wellness Healthy Indulgence Gravies Chicken &amp; Turkey Cat Food Pouch 3 oz</title></head><body><h1>Wellness Healthy Indulgence Gravies Chicken &amp; Turkey in Gravy Cat Food Pouch</h1>
    <p>Ingredients: Chicken Broth, Water Sufficient For Processing, Chicken, Potato Starch, Turkey, Eggs, Chicken Liver, Carrots, Natural Flavor, Salt</p>
    <p>Guaranteed Analysis Crude Protein (min.) 4% Crude Fat (min.) 2% Crude Fiber (max.) 1% Moisture (max.) 85%</p><table><tr><td>UPC</td><td>076344886570</td></tr></table></body></html>`;
  it('records the pages it opened or searched in, and checks them for the barcode like its search results', async () => {
    const bodies: { url: string; body: string }[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: { body?: string }) => {
      if (url.startsWith('https://api.openai.com/')) bodies.push({ url, body: String(init?.body ?? '') });
      if (url === 'https://api.openai.com/v1/responses') {
        return new Response(JSON.stringify({ output: [
          { type: 'reasoning', summary: [] },
          { type: 'web_search_call', action: { type: 'search', queries: ['"076344886570"', '"0076344886570"'], sources: [{ type: 'url', url: 'https://www.chewy.com/wellness-pouches' }] } },
          { type: 'web_search_call', action: { type: 'open_page', url: 'https://www.petsupermarket.com/wellness-gravies-chicken-turkey.html' } },
          { type: 'web_search_call', action: { type: 'find', url: 'https://www.petsupermarket.com/wellness-gravies-chicken-turkey.html', pattern: '076344886570' } },
          { type: 'web_search_call', action: { type: 'open_page', url: 'chrome://settings' } },
          { type: 'message', content: [{ type: 'output_text', text: JSON.stringify({ ...modelAnswer({}), found: false }), annotations: [] }] },
        ] }), { status: 200 });
      }
      if (url === 'https://api.openai.com/v1/chat/completions') {
        return new Response(JSON.stringify({ model: 'gpt-5-mini', choices: [{ message: { content: JSON.stringify(modelAnswer({ product_name: 'Wellness Healthy Indulgence Gravies Chicken & Turkey in Gravy Cat Food Pouch', brand: 'Wellness', intended_for: 'cats', ingredients_verbatim: 'Chicken Broth, Water Sufficient For Processing, Chicken, Potato Starch, Turkey, Eggs, Chicken Liver, Carrots, Natural Flavor, Salt' })) }, finish_reason: 'stop' }] }), { status: 200 });
      }
      return new Response(url.includes('petsupermarket') ? shop : '<html><head><title>Wellness</title></head><body><h1>Wellness pouches</h1></body></html>', { status: 200 });
    }));
    const r = await researchProduct({ apiKey: 'k', model: 'gpt-5-mini', gtin14: GRAVIES, barcode: '076344886570', knownSpecies: 'unknown', userAgent: 'test', now: new Date('2026-10-31T00:00:00Z') });
    const first = JSON.parse(bodies[0].body);
    expect(first.reasoning).toEqual({ effort: 'low' });
    expect(first.temperature).toBeUndefined();
    expect(r.discarded.slice(0, 4)).toEqual([
      'barcode search: searched “"076344886570" | "0076344886570"” (1 result: chewy.com)',
      'barcode search: opened petsupermarket.com',
      'barcode search: model reported no matching product (1 search, 0 citations)',
      'barcode search: result pages without this barcode: chewy.com',
    ]);
    expect(r.discarded).toContain('barcode search: petsupermarket.com (a page the model opened) shows this barcode, so Purrbi read it');
    // Both forms were searched in the first call, so the 13-digit form is not searched again.
    expect(r.discarded.some((d) => d.startsWith('barcode search (13-digit form)'))).toBe(false);
    expect(r.sources[0]).toMatchObject({ sourceName: 'petsupermarket.com', matchConfidence: 'exact_barcode' });
    expect(r.facts?.ingredients?.value.slice(0, 2)).toEqual(['Chicken Broth', 'Water Sufficient For Processing']);
  });
  it('starts a search only with 90 s and a margin left, where another model needs 60 s; with less it makes none and says research did not start', async () => {
    const calls: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: { body?: string }) => {
      if (url === 'https://api.openai.com/v1/responses') {
        calls.push(JSON.parse(String(init?.body ?? '{}')).model);
        return openAi({ ...modelAnswer({}), found: false });
      }
      return new Response('', { status: 404 });
    }));
    const base = { apiKey: 'k', gtin14: GRAVIES, barcode: '076344886570', knownSpecies: 'unknown' as const, userAgent: 'test', now: new Date('2026-10-31T00:00:00Z') };
    await expect(researchProduct({ ...base, model: 'gpt-5-mini', deadline: Date.now() + 100000 })).rejects.toBeInstanceOf(ResearchNotStarted);
    expect(calls).toEqual([]);
    await researchProduct({ ...base, model: 'gpt-4.1-mini', deadline: Date.now() + 100000 });
    expect(calls[0]).toBe('gpt-4.1-mini');
  });
});

describe('research 2.8.0 review fixes', () => {
  const GRAVIES = '00076344886570';
  const base = { apiKey: 'k', gtin14: GRAVIES, barcode: '076344886570', knownSpecies: 'unknown' as const, userAgent: 'test', now: new Date('2026-10-31T00:00:00Z') };
  const respond = (actions: unknown[], answer: unknown = { ...modelAnswer({}), found: false }) =>
    new Response(JSON.stringify({ output: [...actions.map((action) => ({ type: 'web_search_call', ...(action ? { action } : {}) })), { type: 'message', content: [{ type: 'output_text', text: JSON.stringify(answer), annotations: [] }] }] }), { status: 200 });
  afterEach(() => vi.useRealTimers());
  it('reads a search’s queries with the older single query beside them: both forms searched, so no second barcode search', async () => {
    const bodies: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: { body?: string }) => {
      if (url === 'https://api.openai.com/v1/responses') {
        bodies.push(String(init?.body ?? ''));
        return respond([{ type: 'search', query: '"076344886570"', queries: ['"076344886570"', '"0076344886570"'], sources: [] }]);
      }
      return new Response('', { status: 404 });
    }));
    const r = await researchProduct({ ...base, model: 'gpt-5-mini' });
    expect(bodies).toHaveLength(1);
    expect(r.discarded[0]).toBe('barcode search: searched “"076344886570" | "0076344886570"” (0 results)');
  });
  it('reads the queries when the single query is empty, and records find_in_page pages; a page action without an address is left out', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url === 'https://api.openai.com/v1/responses') {
        return respond([
          { type: 'search', query: '', queries: ['"076344886570"'], sources: [] },
          { type: 'find_in_page', url: 'https://shop.example/p/gravies', pattern: '076344886570' },
          { type: 'open_page', url: null },
          null,
        ]);
      }
      return new Response('<html><head><title>Gravies</title></head><body><h1>Wellness Gravies</h1></body></html>', { status: 200 });
    }));
    const r = await researchProduct({ ...base, model: 'gpt-5-mini' });
    expect(r.discarded.slice(0, 3)).toEqual([
      'barcode search: searched “"076344886570"” (0 results)',
      'barcode search: opened shop.example',
      // The search action and the action-less call are searches; the page actions are not.
      'barcode search: model reported no matching product (2 searches, 0 citations)',
    ]);
    expect(r.discarded).toContain('barcode search: result pages without this barcode: shop.example');
  });
  it('a site’s search page that repeats the barcode from its address is not taken as showing it (and is not read)', async () => {
    let chats = 0;
    const searchPage = `<html><head><title>Search results for "076344886570"</title></head><body><h1>Search results for “076344886570”</h1>
      <div class="product"><a href="/p/turkey-pate">Wellness CORE Turkey Pate Cat Food 5.5 oz</a></div></body></html>`;
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url === 'https://api.openai.com/v1/responses') return respond([{ type: 'search', queries: ['"076344886570"'], sources: [] }, { type: 'open_page', url: 'https://shop.example/search?q=076344886570' }]);
      if (url.includes('chat/completions')) {
        chats++;
        return new Response(JSON.stringify({ model: 'gpt-5-mini', choices: [{ message: { content: JSON.stringify(modelAnswer({ product_name: 'Wellness CORE Turkey Pate Cat Food 5.5 oz', brand: 'Wellness' })) }, finish_reason: 'stop' }] }), { status: 200 });
      }
      return new Response(url.includes('search?q=') ? searchPage : '', { status: url.includes('search?q=') ? 200 : 404 });
    }));
    const r = await researchProduct({ ...base, model: 'gpt-5-mini' });
    expect(chats).toBe(0);
    expect(r.facts).toBeNull();
    expect(r.discarded).toContain('barcode search: result pages without this barcode: shop.example (a search page: it repeats the barcode from its address)');
  });
  it('result pages left unchecked for the time limit are said so, and the run is marked as cut short', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-31T00:00:00Z'));
    const deadline = Date.now() + 190000;
    const fetched: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url === 'https://api.openai.com/v1/responses') {
        // The search takes 86 s: 104 s are left, less than a check and a read need.
        vi.setSystemTime(Date.now() + 86000);
        return respond([{ type: 'search', queries: ['"076344886570"', '"0076344886570"'], sources: [{ type: 'url', url: 'https://www.chewy.com/wellness-pouches' }] }, { type: 'open_page', url: 'https://www.petsupermarket.com/wellness-gravies' }]);
      }
      fetched.push(url);
      return new Response('', { status: 404 });
    }));
    const r = await researchProduct({ ...base, model: 'gpt-5-mini', deadline });
    expect(fetched).toEqual([]);
    expect(r.facts).toBeNull();
    expect(r.timeLimited).toBe(true);
    expect(r.discarded).toContain('barcode search: result pages not checked (the scan’s time limit): chewy.com, petsupermarket.com');
  });
  it('checks the result pages before another paid search when only one of them fits (review: the name search ran, the free checks did not)', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-31T00:00:00Z'));
    const deadline = Date.now() + 200000;
    const order: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url === 'https://api.openai.com/v1/responses') {
        order.push('search');
        vi.setSystemTime(Date.now() + 86000);
        return respond([{ type: 'search', queries: ['"076344886570"', '"0076344886570"'], sources: [{ type: 'url', url: 'https://www.chewy.com/wellness-pouches' }] }]);
      }
      order.push(`check ${new URL(url).hostname}`);
      // A slow page: 10 s.
      vi.setSystemTime(Date.now() + 10000);
      return new Response('<html><head><title>Wellness</title></head><body><h1>Wellness pouches</h1></body></html>', { status: 200 });
    }));
    const r = await researchProduct({ ...base, model: 'gpt-5-mini', knownName: 'Healthy Indulgence Gravies Chicken & Turkey', knownBrand: 'Wellness', deadline });
    // 114 s left after the first search: the free check first (before, the gate for checks was higher than for a
    // search, so the paid name search ran and the page was never checked); then the name search no longer fits.
    expect(order).toEqual(['search', 'check www.chewy.com']);
    expect(r.timeLimited).toBe(true);
    expect(r.discarded).toContain('name search: not run (the scan’s time limit)');
  });
});
