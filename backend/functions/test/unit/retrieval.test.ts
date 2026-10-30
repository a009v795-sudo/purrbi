// Identification and retrieval repairs, on the real cases they come from (scans of 2026-10-30):
// 076344060048 Wellness CORE Signature Selects can, 076344886570 Wellness Healthy Indulgence Gravies pouch,
// 850063633017 A Better Treat salmon treat. Page HTML here is synthetic test markup built around the text the
// real pages print (read from GitHub's network on 2026-10-30 with the live-probe workflow); no page is fetched.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseAdequacyStatement } from '../../src/domain/adequacy';
import { caloriesForPackage, describeCalories, parseCalorieText, parsePackageSize } from '../../src/domain/nutrition';
import { classifyScope, speciesEvidence } from '../../src/domain/scope';
import { altTextIngredientLists, documentFacts, markupGtins, nameOnPage, nameTokens, nutritionDocLinks, pageText, parseShopifyProduct, shopifyProductUrl } from '../../src/sources/pageEvidence';
import { researchProduct } from '../../src/sources/research';

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

afterEach(() => vi.unstubAllGlobals());

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
