import { describe, expect, it } from 'vitest';
import { gs1CheckDigit, lookupVariants, normalizeBarcode, sameGtin, textContainsGtin } from '../../src/domain/barcode';
import { parseIngredientList } from '../../src/domain/ingredients';
import { parseAdequacyStatement } from '../../src/domain/adequacy';
import { parseCalorieText, validateGuaranteedAnalysis, dryMatterPercent } from '../../src/domain/nutrition';
import { classifyScope } from '../../src/domain/scope';
import { matchAllergen } from '../../src/domain/allergens';
import { petLifeStage } from '../../src/domain/lifeStage';
import { NOW, pet } from '../helpers/fixtures';

describe('barcode', () => {
  it('validates GS1 check digits (EAN-13, UPC-A, EAN-8)', () => {
    expect(gs1CheckDigit('400638133393')).toBe(1);
    expect(normalizeBarcode('4006381333931').ok).toBe(true);
    expect(normalizeBarcode('036000291452').ok).toBe(true);
    expect(normalizeBarcode('96385074').ok).toBe(true);
    expect(normalizeBarcode('036000291453')).toMatchObject({ ok: false, reason: 'check_digit' });
  });
  it('keeps leading zeros and pads to GTIN-14', () => {
    const b = normalizeBarcode(' 036000291452 ');
    expect(b.digits).toBe('036000291452');
    expect(b.gtin14).toBe('00036000291452');
    expect(lookupVariants(b)).toEqual(['036000291452', '0036000291452']);
  });
  it('rejects non-numeric and wrong-length codes', () => {
    expect(normalizeBarcode('https://example.com').reason).toBe('non_digit');
    expect(normalizeBarcode('12345').reason).toBe('length');
    expect(normalizeBarcode('').reason).toBe('empty');
  });
  it('matches the same GTIN across UPC/EAN forms and inside spaced text', () => {
    expect(sameGtin('036000291452', '0036000291452')).toBe(true);
    expect(sameGtin('036000291452', '036000291453')).toBe(false);
    expect(textContainsGtin('UPC 0 36000 29145 2, lot 123', '00036000291452')).toBe(true);
    expect(textContainsGtin('UPC 0 36000 29145 9', '00036000291452')).toBe(false);
  });
});

describe('ingredients', () => {
  it('keeps label order and nested sub-ingredients', () => {
    const list = parseIngredientList('Ingredients: Chicken, Chicken Fat (preserved with Mixed Tocopherols), Vitamins (Vitamin E Supplement, Niacin), Taurine.');
    expect(list.map((i) => i.name)).toEqual(['Chicken', 'Chicken Fat (preserved with Mixed Tocopherols)', 'Vitamins (Vitamin E Supplement, Niacin)', 'Taurine']);
    expect(list[1].subIngredients).toEqual(['preserved with mixed tocopherols']);
    expect(list[2].subIngredients).toEqual(['vitamin e supplement', 'niacin']);
    expect(list.map((i) => i.position)).toEqual([1, 2, 3, 4]);
  });
  it('strips percentages only from the normalised form', () => {
    const [first] = parseIngredientList('Composition: chicken (26%), rice');
    expect(first.name).toBe('chicken (26%)');
    expect(first.normalized).toBe('chicken');
  });
});

describe('adequacy statements', () => {
  it('parses an AAFCO formulation statement', () => {
    const a = parseAdequacyStatement('X is formulated to meet the nutritional levels established by the AAFCO Dog Food Nutrient Profiles for adult maintenance.')!;
    expect(a).toMatchObject({ type: 'complete', method: 'formulation', species: 'dog', lifeStages: ['adult_maintenance'], style: 'aafco' });
  });
  it('parses feeding-trial and all-life-stages with large-size wording', () => {
    const a = parseAdequacyStatement('Animal feeding tests using AAFCO procedures substantiate that X provides complete and balanced nutrition for all life stages, including growth of large size dogs (70 lb. or more as an adult).')!;
    expect(a).toMatchObject({ type: 'complete', method: 'feeding_trial', lifeStages: ['all_life_stages'], largeSizeGrowth: true });
    const b = parseAdequacyStatement('X is formulated to meet the nutritional levels established by the AAFCO Dog Food Nutrient Profiles for all life stages except for growth of large size dogs (70 lb. or more as an adult).')!;
    expect(b.largeSizeGrowth).toBe(false);
  });
  it('recognises intermittent and EU complementary statements', () => {
    expect(parseAdequacyStatement('This product is intended for intermittent or supplemental feeding only.')!.type).toBe('intermittent');
    expect(parseAdequacyStatement('Complementary pet food for adult cats.')!).toMatchObject({ type: 'intermittent', style: 'eu', species: 'cat' });
    expect(parseAdequacyStatement('Complete pet food for kittens.')!).toMatchObject({ type: 'complete', lifeStages: ['growth'], species: 'cat' });
  });
  it('returns unclear for unrelated text and null for empty', () => {
    expect(parseAdequacyStatement('Made with love in small batches')!.type).toBe('unclear');
    expect(parseAdequacyStatement('  ')).toBeNull();
  });
});

describe('nutrition', () => {
  it('parses calorie statements with units and rejects implausible values', () => {
    expect(parseCalorieText('Calorie content (calculated): 3,640 kcal ME/kg; 364 kcal ME/cup')).toEqual([
      { kcal: 3640, per: 'kg', text: '3,640 kcal ME/kg' },
      { kcal: 364, per: 'cup', text: '364 kcal ME/cup' },
    ]);
    expect(parseCalorieText('6 kcal per treat')[0]).toMatchObject({ kcal: 6, per: 'treat' });
    expect(parseCalorieText('99999 kcal/cup')).toEqual([]);
  });
  it('drops impossible guarantees and computes dry matter', () => {
    const { valid, rejected } = validateGuaranteedAnalysis([
      { nutrient: 'crude_protein', label: 'Crude protein', qualifier: 'min', value: 260, unit: '%' },
      { nutrient: 'crude_fat', label: 'Crude fat', qualifier: 'min', value: 15, unit: '%' },
    ]);
    expect(valid).toHaveLength(1);
    expect(rejected[0]).toMatch(/Crude protein/);
    expect(dryMatterPercent(10, 78)).toBe(45.5);
    expect(dryMatterPercent(10, undefined)).toBeNull();
  });
});

describe('scope', () => {
  const base = { origin: 'opff' as const, categoriesTags: [] as string[], texts: [] as string[] };
  it('classifies complete foods, treats and supplements', () => {
    expect(classifyScope({ ...base, categoriesTags: ['en:dog-food', 'en:dry-dog-food'], texts: ['Adult chicken recipe'] })).toMatchObject({ status: 'supported', species: 'dog', category: 'complete_food' });
    expect(classifyScope({ ...base, categoriesTags: ['en:cat-food', 'en:cat-treats'], texts: ['Crunchy salmon treats'] })).toMatchObject({ species: 'cat', category: 'treat' });
    expect(classifyScope({ ...base, categoriesTags: ['en:dog-food'], texts: ['Hip & joint soft chews supplement'] })).toMatchObject({ category: 'supplement' });
  });
  it('uses the adequacy statement for category and species', () => {
    const adequacy = parseAdequacyStatement('Complementary pet food for adult cats.');
    expect(classifyScope({ ...base, texts: ['Tuna in jelly'], adequacy })).toMatchObject({ species: 'cat', category: 'complementary' });
  });
  it('rejects medicines, grooming, other animals and human food', () => {
    expect(classifyScope({ ...base, texts: ['Flea and tick chewable for dogs'] })).toMatchObject({ status: 'out_of_scope', outOfScopeKind: 'veterinary_medicine' });
    expect(classifyScope({ ...base, texts: ['Oatmeal dog shampoo'] })).toMatchObject({ status: 'out_of_scope', outOfScopeKind: 'grooming_or_cosmetic' });
    expect(classifyScope({ ...base, categoriesTags: ['en:bird-food'], texts: ['Parrot seed mix'] })).toMatchObject({ status: 'out_of_scope', outOfScopeKind: 'other_animal' });
    expect(classifyScope({ origin: 'off', categoriesTags: ['en:spreads'], texts: ['Hazelnut spread'] })).toMatchObject({ status: 'out_of_scope', outOfScopeKind: 'human_food' });
    expect(classifyScope({ origin: 'off', categoriesTags: ['en:dietary-supplements'], texts: ['Vitamin D3 tablets'] })).toMatchObject({ outOfScopeKind: 'human_supplement' });
  });
  it('does not treat a pet food listed in the human database as human food', () => {
    expect(classifyScope({ origin: 'off', categoriesTags: ['en:cat-food'], texts: ['Chicken pate for cats'] })).toMatchObject({ status: 'supported', species: 'cat' });
  });
  it('reports unknown species instead of guessing', () => {
    expect(classifyScope({ ...base, texts: ['Chicken recipe'] })).toMatchObject({ status: 'unknown', species: 'unknown' });
  });
});

describe('allergen matching', () => {
  const list = parseIngredientList('Salmon, poultry fat, brewers rice, corn gluten meal, milk thistle, natural flavor');
  it('separates contains / possible / not listed', () => {
    expect(matchAllergen('fish', list)).toMatchObject({ status: 'contains', matches: ['Salmon'] });
    expect(matchAllergen('chicken', list)).toMatchObject({ status: 'possible', matches: ['poultry fat', 'natural flavor'] });
    expect(matchAllergen('soy', list).status).toBe('not_listed');
  });
  it('avoids look-alike false positives', () => {
    expect(matchAllergen('dairy', list).status).toBe('not_listed'); // milk thistle is a plant
    expect(matchAllergen('wheat', list).status).toBe('not_listed'); // corn gluten is not wheat
    expect(matchAllergen('corn', list).status).toBe('contains');
  });
  it('returns unknown without an ingredient list', () => {
    expect(matchAllergen('chicken', []).status).toBe('unknown');
  });
});

describe('life stage', () => {
  it('uses ~12 months for cats', () => {
    expect(petLifeStage(pet({ birthDate: '2026-05-01' }), NOW).stage).toBe('growth');
    expect(petLifeStage(pet({ birthDate: '2023-05-01' }), NOW).stage).toBe('adult');
  });
  it('uses expected adult size for dogs and flags large-size growth', () => {
    const giantPuppy = petLifeStage(pet({ species: 'dog', birthDate: '2025-08-28', expectedAdultSize: 'xlarge' }), NOW);
    expect(giantPuppy.stage).toBe('growth');
    expect(giantPuppy.needsLargeSizeGrowthClaim).toBe(true);
    expect(petLifeStage(pet({ species: 'dog', birthDate: '2025-08-28', expectedAdultSize: 'small' }), NOW).stage).toBe('adult');
    expect(petLifeStage(pet({ species: 'dog', birthDate: '2025-08-28', expectedAdultSize: 'unknown' }), NOW)).toMatchObject({ stage: 'transition', needsLargeSizeGrowthClaim: 'unknown' });
  });
  it('advances an approximate age from the date it was entered', () => {
    const r = petLifeStage(pet({ birthDate: null, approxAgeMonths: 10, ageCapturedAt: '2026-08-28T00:00:00Z' }), NOW);
    expect(Math.floor(r.ageMonths!)).toBe(12);
    expect(r.stage).toBe('adult');
  });
  it('treats pregnancy/lactation as reproduction and missing age as unknown', () => {
    expect(petLifeStage(pet({ reproductiveStatus: 'lactating' }), NOW).stage).toBe('reproduction');
    expect(petLifeStage(pet({ birthDate: null, approxAgeMonths: null }), NOW).stage).toBe('unknown');
  });
});

describe('EU labels (found by the live scan of a French label)', () => {
  it('recognises the analytical constituents in French, German, Spanish/Portuguese, Italian and Dutch', async () => {
    const { nutrientKeyFromLabel } = await import('../../src/domain/nutrition');
    const cases: [string, string][] = [
      ['Crude Protein', 'crude_protein'], ['Protéine', 'crude_protein'], ['Protéines brutes', 'crude_protein'], ['Rohprotein', 'crude_protein'],
      ['Proteína bruta', 'crude_protein'], ['Proteine grezze', 'crude_protein'], ['Ruw eiwit', 'crude_protein'],
      ['Crude Fat', 'crude_fat'], ['Teneur en matières grasses', 'crude_fat'], ['Matières grasses brutes', 'crude_fat'], ['Rohfett', 'crude_fat'],
      ['Grasa bruta', 'crude_fat'], ['Grassi grezzi', 'crude_fat'], ['Ruw vet', 'crude_fat'], ['Gordura bruta', 'crude_fat'],
      ['Crude Fiber', 'crude_fiber'], ['Fibre', 'crude_fiber'], ['Cellulose brute', 'crude_fiber'], ['Rohfaser', 'crude_fiber'],
      ['Fibra bruta', 'crude_fiber'], ['Fibra grezza', 'crude_fiber'], ['Ruwe celstof', 'crude_fiber'],
      ['Moisture', 'moisture'], ['Humidité', 'moisture'], ['Feuchtigkeit', 'moisture'], ['Humedad', 'moisture'], ['Umidità', 'moisture'], ['Vocht', 'moisture'],
      ['Crude Ash', 'ash'], ['Cendres brutes', 'ash'], ['Matières minérales', 'ash'], ['Rohasche', 'ash'], ['Ceniza bruta', 'ash'], ['Ceneri grezze', 'ash'], ['Ruwe as', 'ash'],
      ['Phosphore', 'phosphorus'], ['Natrium', 'sodium'], ['Acides gras Oméga 3', 'omega_3'], ['Acides gras Omega 6', 'omega_6'],
      ['Iodate de calcium anhydre', 'other'], ['Sulfate de zinc', 'other'], ['Vitamine A', 'other'],
    ];
    for (const [label, key] of cases) expect([label, nutrientKeyFromLabel(label)]).toEqual([label, key]);
  });
  it('re-matches a stored French analysis so the product can be scored, and drops min/max the label never printed', async () => {
    const { rematchAnalysis, hasCoreGuaranteedAnalysis } = await import('../../src/domain/nutrition');
    // As stored by the live scan of 7613032759155 (read from its French label image).
    const stored = [
      { nutrient: 'other', label: 'Protéine', qualifier: 'min', value: 35, unit: '%' },
      { nutrient: 'other', label: 'Teneur en matières grasses', qualifier: 'max', value: 13, unit: '%' },
      { nutrient: 'crude_fiber', label: 'Fibre', qualifier: 'max', value: 2, unit: '%' },
      { nutrient: 'other', label: 'Humidité', qualifier: 'max', value: 10, unit: '%' },
      { nutrient: 'calcium', label: 'Iodate de calcium anhydre', qualifier: 'max', value: 0.2, unit: '%' },
    ] as const;
    expect(hasCoreGuaranteedAnalysis(stored as never)).toBe(false);
    const fixed = rematchAnalysis(stored as never);
    expect(hasCoreGuaranteedAnalysis(fixed)).toBe(true);
    expect(fixed.map((e) => [e.nutrient, e.qualifier])).toEqual([
      ['crude_protein', 'not_stated'], ['crude_fat', 'not_stated'], ['crude_fiber', 'not_stated'], ['moisture', 'not_stated'], ['other', 'not_stated'],
    ]);
  });
  it('leaves an English (US or Canadian) guaranteed analysis and its printed min/max unchanged', async () => {
    const { rematchAnalysis } = await import('../../src/domain/nutrition');
    const us = [
      { nutrient: 'crude_protein', label: 'Crude Protein', qualifier: 'min', value: 30, unit: '%' },
      { nutrient: 'crude_fiber', label: 'Crude Fibre', qualifier: 'max', value: 4, unit: '%' },
    ] as const;
    expect(rematchAnalysis(us as never)).toEqual(us);
  });
  it('does not take "minérales" for a printed "min"', async () => {
    const { rematchAnalysis } = await import('../../src/domain/nutrition');
    const fr = rematchAnalysis([{ nutrient: 'ash', label: 'Matières minérales', qualifier: 'min', value: 8, unit: '%' }]);
    expect(fr[0]).toMatchObject({ nutrient: 'ash', qualifier: 'not_stated' });
  });
});

describe('database analysis plausibility (found by a live scan of a French dog biscuit)', () => {
  it('does not use protein and fat that cannot be per 100 g, and says why', async () => {
    const { nutrimentsToGuarantees, implausibleAnalysis, databaseGuarantees } = await import('../../src/sources/openFacts');
    // As listed in Open Pet Food Facts for U "Biscuits fourrés" (3256228550729); the pack prints protein 10 %, fat 8 %.
    const listed = { proteins_100g: 1, proteins_unit: 'g', fat_100g: 0.8, fat_unit: 'g', fiber_100g: 0.6, fiber_unit: 'g', carbohydrates_100g: 1.2, carbohydrates_unit: 'g' };
    expect(nutrimentsToGuarantees(listed)).toEqual([]);
    expect(implausibleAnalysis(databaseGuarantees(listed))).toMatch(/1% protein and 0.8% fat, which cannot be per 100 g/);
    // A wet food lists its moisture, and a dry food has far more protein and fat: both are kept.
    expect(nutrimentsToGuarantees({ proteins_100g: 2, fat_100g: 0.5, moisture_100g: 92 }).length).toBe(3);
    expect(nutrimentsToGuarantees({ 'crude-protein_100g': 30, 'crude-fat_100g': 15 }).length).toBe(2);
  });
});

describe('calorie statements', () => {
  it('does not take an upper bound ("<2 kcal", "menos de 2 kcal") for the calorie content', async () => {
    const { parseCalorieText } = await import('../../src/domain/nutrition');
    expect(parseCalorieText('<2 kcal/unidad')).toEqual([]);
    expect(parseCalorieText('menos de 2 kcal/unidade')).toEqual([]);
    expect(parseCalorieText('Less than 3 kcal per treat')).toEqual([]);
    expect(parseCalorieText('Calorie content (calculated): 3,640 kcal ME/kg; 364 kcal ME/cup').map((c) => `${c.kcal}/${c.per}`)).toEqual(['3640/kg', '364/cup']);
  });
});

describe('treat statements (found by the live photo of a UK treat pack)', () => {
  it('reads "not a substitute for complete pet food" as intermittent feeding, and a statement naming treats as a treat', async () => {
    const { parseAdequacyStatement } = await import('../../src/domain/adequacy');
    const { classifyScope } = await import('../../src/domain/scope');
    const a = parseAdequacyStatement('This product is not a substitute for complete pet food. As with all treats, give as part of a balanced diet.');
    expect(a).toMatchObject({ type: 'intermittent' });
    expect(classifyScope({ origin: 'opff', categoriesTags: ['en:cat-food'], texts: ['Cat nibbles'], adequacy: a }).category).toBe('treat');
    expect(classifyScope({ origin: 'opff', categoriesTags: ['en:cat-food'], texts: ['Salmon mixer'], adequacy: parseAdequacyStatement('Complementary pet food for adult cats.') }).category).toBe('complementary');
  });
});

describe('EU adequacy statements (found by the live scan of a French label)', () => {
  it('reads complete and complementary feeds, species and life stages in the label languages', async () => {
    const { parseAdequacyStatement } = await import('../../src/domain/adequacy');
    const cases: [string, Record<string, unknown>][] = [
      ['ALIMENT COMPLET POUR CATS ADULTES', { type: 'complete', species: 'cat', lifeStages: ['adult_maintenance'], style: 'eu' }],
      ['Aliment complet pour chat adulte', { type: 'complete', species: 'cat', lifeStages: ['adult_maintenance'], style: 'eu' }],
      ['Aliment complet pour chatons', { type: 'complete', species: 'cat', lifeStages: ['growth'] }],
      ['Aliment complémentaire pour chats', { type: 'intermittent', species: 'cat', style: 'eu' }],
      ['Alleinfuttermittel für ausgewachsene Katzen', { type: 'complete', species: 'cat', lifeStages: ['adult_maintenance'] }],
      ['Ergänzungsfuttermittel für Hunde', { type: 'intermittent', species: 'dog' }],
      ['Alimento completo para perros adultos', { type: 'complete', species: 'dog', lifeStages: ['adult_maintenance'] }],
      ['Alimento completo para gatos en todas las etapas de la vida', { type: 'complete', species: 'cat', lifeStages: ['all_life_stages'] }],
      ['Alimento completo per gatti adulti', { type: 'complete', species: 'cat', lifeStages: ['adult_maintenance'] }],
      ['Mangime complementare per cani', { type: 'intermittent', species: 'dog' }],
      ['Volledig diervoeder voor volwassen katten', { type: 'complete', species: 'cat', lifeStages: ['adult_maintenance'] }],
      ['Aanvullend diervoeder voor honden', { type: 'intermittent', species: 'dog' }],
    ];
    for (const [text, want] of cases) expect([text, parseAdequacyStatement(text)]).toEqual([text, expect.objectContaining(want)]);
  });
});
