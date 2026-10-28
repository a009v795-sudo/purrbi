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
