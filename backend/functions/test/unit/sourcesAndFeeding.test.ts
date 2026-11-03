// Test C's score against the documented method (independent score check, 2026-11-02): "vegetable glycerine", a
// humectant, was counted as a source ingredient that does not name its plant (32/40), and the treat's "Feed as a treat,
// snack or reward. Not intended as a meal replacement." was read as no feeding statement. Under METHODOLOGY section 3,
// technological additives are not source ingredients, and the sentence says the treat is not a complete diet.
import { describe, expect, it } from 'vitest';
import { parseReading, type RawLabelExtraction, type RawPanel } from '../../src/ai/labelExtract';
import { parseAdequacyStatement } from '../../src/domain/adequacy';
import { parseIngredientList } from '../../src/domain/ingredients';
import { classifyScope } from '../../src/domain/scope';
import { assessGeneral, mainSources } from '../../src/domain/score';
import type { GuaranteedAnalysisEntry } from '../../src/domain/types';
import { facts, SRC } from '../helpers/fixtures';

const C_LIST = 'SALMON, VEGETABLE GLYCERINE, PEA FLOUR, AVOCADO, PEA PROTEIN, ROSEMARY EXTRACT';
const C_FEEDING = 'Feed as a treat, snack or reward. Not intended as a meal replacement.';
const main = (list: string) => mainSources(parseIngredientList(list)).map((i) => i.name);

describe('source ingredients leave out technological additives', () => {
  it('leaves out humectants, preservatives, emulsifiers, processing aids, thickeners and colours', () => {
    expect(main(C_LIST)).toEqual(['SALMON', 'PEA FLOUR', 'AVOCADO', 'PEA PROTEIN']);
    expect(main('Chicken, Glycerin, Wheat Flour, Propylene Glycol, Sorbitol, Rice, Potassium Sorbate')).toEqual(['Chicken', 'Wheat Flour', 'Rice']);
    expect(main('Beef, Soy Lecithin, BHA, BHT, Ethoxyquin, Magnesium Stearate, Silicon Dioxide, Pectin, Red 40, Oats')).toEqual(['Beef', 'Oats']);
  });
  it('keeps what is a source: a protein, a carbohydrate, a fat, a vegetable, and a generic name still counts as one', () => {
    expect(main('Chicken, Chicken Meal, Brown Rice, Chicken Fat, Carrots, Natural Flavor')).toEqual(['Chicken', 'Chicken Meal', 'Brown Rice', 'Chicken Fat', 'Carrots']);
    expect(main('Meat By-Products, Glycerin, Poultry Fat, Sugar')).toEqual(['Meat By-Products', 'Poultry Fat', 'Sugar']);
  });
  // Review of 3.0.1: what an ingredient is preserved with is not what it is, bracketed or not.
  it('tests only the name’s head: a fat or meal "preserved with BHA" is still a (generic) source', () => {
    expect(main('Chicken, Wheat Flour, Animal Fat preserved with BHA, Rice Flour, Oat Fiber, Salt')).toEqual(['Chicken', 'Wheat Flour', 'Animal Fat preserved with BHA', 'Rice Flour', 'Oat Fiber']);
    expect(main('Fish Meal preserved with Ethoxyquin, Poultry Fat stabilized with BHT, Chicken Fat preserved with mixed tocopherols, Corn')).toEqual(['Fish Meal preserved with Ethoxyquin', 'Poultry Fat stabilized with BHT', 'Chicken Fat preserved with mixed tocopherols', 'Corn']);
    const treat = facts({ classificationSignals: [{ text: 'en:dog-treats', source: 'test' }], ingredientsText: 'Chicken, Wheat Flour, Animal Fat preserved with BHA, Rice Flour, Oat Fiber, Salt', adequacyText: 'This product is intended for intermittent or supplemental feeding only.' });
    const a = assessGeneral(treat, classifyScope({ origin: 'opff', categoriesTags: ['en:dog-treats'], texts: [treat.productName!.value], adequacy: treat.adequacy?.value }));
    expect(a.components.find((x) => x.key === 'named_sources')).toMatchObject({ points: 32 }); // 4 of 5: animal fat is generic
  });
  it('leaves out the printed forms of colours, processing aids and emulsifiers too', () => {
    expect(main('Salmon, Titanium Dioxide, Calcium Stearates, Mono- and Diglycerides, Lécithine de soja, Peas')).toEqual(['Salmon', 'Peas']);
  });
});

describe('a treat’s own wording that it is not a complete diet is its feeding statement', () => {
  it('reads "not intended as a meal replacement" and its kin as intermittent, and nothing else changes', () => {
    for (const t of [
      C_FEEDING,
      'Not intended as a sole diet.',
      'Not intended to replace meals.',
      'This treat is not meant to replace meals.',
      'Not a meal replacement.',
      'Not intended as a complete diet.',
      'Treats are not meant to replace a complete and balanced diet for dogs.',
      'Not intended as a complete and balanced diet for cats.',
      'Not intended to replace your pet’s regular meals.',
    ])
      expect(parseAdequacyStatement(t), t).toMatchObject({ type: 'intermittent' });
    expect(parseAdequacyStatement('Complete and balanced meal replacement for adult cats')).toMatchObject({ type: 'complete' });
    expect(parseAdequacyStatement('Intended as a meal topper')).toMatchObject({ type: 'unclear' });
    expect(parseAdequacyStatement('Not intended as a meal topper.')).toMatchObject({ type: 'unclear' });
  });
  it('never outranks a substantiated claim: a complete food’s caveat stays a complete food’s statement (review of 3.0.1)', () => {
    const aafco = 'TEST FIXTURE is formulated to meet the nutritional levels established by the AAFCO Cat Food Nutrient Profiles for adult maintenance.';
    expect(parseAdequacyStatement(`${aafco} Not intended as the sole diet for kittens.`)).toMatchObject({ type: 'complete', method: 'formulation' });
    expect(parseAdequacyStatement('Animal feeding tests using AAFCO procedures substantiate that TEST FIXTURE provides complete and balanced nutrition for adult maintenance. Not intended to be fed as the sole diet to puppies.')).toMatchObject({ type: 'complete', method: 'feeding_trial' });
  });
  it('a footnote that wraps, is plural, or stands beside a statement is never the statement (third review of 3.0.1)', () => {
    expect(parseAdequacyStatement('*Not recognized as an essential nutrient by the')).toMatchObject({ type: 'unclear' });
    expect(parseAdequacyStatement('AAFCO Cat Food Nutrient Profiles.')).toMatchObject({ type: 'unclear' });
    expect(parseAdequacyStatement('*Not recognized as essential nutrients by the AAFCO Cat Food Nutrient Profiles.')).toBeNull();
    expect(parseAdequacyStatement('*Not recognized as an essential nutrient by the AAFCO Cat Food Nutrient Profiles. This product is intended for intermittent or supplemental feeding only.')).toMatchObject({ type: 'intermittent' });
    expect(parseAdequacyStatement('Complete and balanced nutrition for adult cats. *Not recognized as an essential nutrient by the AAFCO Cat Food Nutrient Profiles.')).toMatchObject({ type: 'complete', species: 'cat', lifeStages: ['adult_maintenance'] });
    // A claim about the profiles is still a statement.
    expect(parseAdequacyStatement('Meets AAFCO Cat Food Nutrient Profiles for adult maintenance.')).toMatchObject({ type: 'complete', lifeStages: ['adult_maintenance'] });
    // Test C with its footnote wrapped: the feeding line is the statement, so it is a treat.
    const panels: RawPanel[] = [
      { kind: 'guaranteed_analysis', legibility: 'clear', heading: 'GUARANTEED ANALYSIS', text: 'GUARANTEED ANALYSIS\nCrude Protein (min) 42%\nCrude Fat (min) 12%\nCrude Fiber (max) 3%\nMoisture (max) 26%\nOmega-3 Fatty Acids* (min) 0.5%\n*Not recognized as an essential nutrient by the\nAAFCO Cat Food Nutrient Profiles.' },
      { kind: 'feeding_directions', legibility: 'clear', heading: 'FEEDING GUIDELINES', text: `FEEDING GUIDELINES:\n${C_FEEDING}` },
    ];
    const raw = { legible: true, barcode_digits: null, product_name: null, brand: null, species_claim: 'cat', product_type_claim: 'treat', panels } as RawLabelExtraction;
    expect(parseReading(raw, 'model-a').adequacy).toMatchObject({ text: C_FEEDING, type: 'intermittent' });
  });
  it('a footnote ends at its own words, and a panel holding only a footnote is no statement (review of efb5e21)', () => {
    const aafco = 'TEST FIXTURE is formulated to meet the nutritional levels established by the AAFCO Cat Food Nutrient Profiles for adult maintenance.';
    for (const between of ['\n', '; ', ' '])
      expect(parseAdequacyStatement(`*Not recognized as an essential nutrient by the AAFCO Cat Food Nutrient Profiles${between}${aafco}`), JSON.stringify(between)).toMatchObject({ type: 'complete', species: 'cat', lifeStages: ['adult_maintenance'], method: 'formulation' });
    expect(parseAdequacyStatement('*Not recognized as an essential nutrient by the AAFCO Dog Food Nutrient Profiles\nAnimal feeding tests using AAFCO procedures substantiate that TEST FIXTURE provides complete and balanced nutrition for adult maintenance.')).toMatchObject({ type: 'complete', method: 'feeding_trial' });
    const panels: RawPanel[] = [
      { kind: 'guaranteed_analysis', legibility: 'clear', heading: null, text: 'Crude Protein (min) 30%\nCrude Fat (min) 12%\nCrude Fiber (max) 3%\nMoisture (max) 10%\nOmega-3 Fatty Acids* (min) 0.5%' },
      { kind: 'adequacy_statement', legibility: 'clear', heading: null, text: '*Not recognized as an essential nutrient by the AAFCO Cat Food Nutrient Profiles.' },
      { kind: 'adequacy_statement', legibility: 'clear', heading: null, text: aafco },
    ];
    const raw = { legible: true, barcode_digits: null, product_name: null, brand: null, species_claim: 'cat', product_type_claim: null, panels } as RawLabelExtraction;
    expect(parseReading(raw, 'model-a').adequacy).toMatchObject({ text: aafco, type: 'complete' });
  });
  it('an analysis footnote that names the AAFCO profiles is not a statement (review of 3.0.1)', () => {
    expect(parseAdequacyStatement('*Not recognized as an essential nutrient by the AAFCO Cat Food Nutrient Profiles.')).toBeNull(); // nothing but a footnote
    const panels: RawPanel[] = [
      { kind: 'guaranteed_analysis', legibility: 'clear', heading: 'GUARANTEED ANALYSIS', text: 'Crude Protein (min) 42%\nOmega-3 Fatty Acids* (min) 0.5%\n*Not recognized as an essential nutrient by the AAFCO Cat Food Nutrient Profiles.' },
      { kind: 'feeding_directions', legibility: 'clear', heading: 'FEEDING GUIDELINES', text: C_FEEDING },
    ];
    const raw = { legible: true, barcode_digits: null, product_name: null, brand: null, species_claim: 'cat', product_type_claim: 'treat', panels } as RawLabelExtraction;
    expect(parseReading(raw, 'model-a').adequacy).toMatchObject({ text: C_FEEDING, type: 'intermittent' });
  });
  it('is kept from the feeding guidelines of a label photo', () => {
    const panel: RawPanel = { kind: 'feeding_directions', legibility: 'clear', heading: 'FEEDING GUIDELINES', text: `FEEDING GUIDELINES:\n${C_FEEDING}\nAlways provide fresh, clean water.` };
    const raw = { legible: true, barcode_digits: null, product_name: null, brand: null, species_claim: 'cat', product_type_claim: 'treat', panels: [panel] } as RawLabelExtraction;
    expect(parseReading(raw, 'model-a').adequacy).toMatchObject({ text: C_FEEDING, type: 'intermittent' });
  });
});

describe('test C, as read from the owner’s photo', () => {
  const ga = (rows: [GuaranteedAnalysisEntry['nutrient'], number, 'min' | 'max'][]): GuaranteedAnalysisEntry[] => rows.map(([nutrient, value, qualifier]) => ({ nutrient, label: nutrient, qualifier, value, unit: '%' }));
  const c = (adequacyText: string) =>
    facts({
      classificationSignals: [{ text: 'en:cat-treats', source: 'test' }],
      ingredientsText: C_LIST,
      adequacyText,
      guaranteedAnalysis: { value: ga([['crude_protein', 42, 'min'], ['crude_fat', 12, 'min'], ['crude_fiber', 3, 'max'], ['moisture', 26, 'max']]), source: SRC },
      calories: { value: [{ kcal: 3300, per: 'kg' }], source: SRC },
    });
  const assess = (adequacyText: string) => {
    const f = c(adequacyText);
    return assessGeneral(f, classifyScope({ origin: 'opff', categoriesTags: ['en:cat-treats'], texts: [f.productName!.value], adequacy: f.adequacy?.value }));
  };
  it('names all four of its source ingredients, and scores 100 with or without its feeding statement', () => {
    const without = assess('');
    expect(without.components.find((x) => x.key === 'named_sources')).toMatchObject({ points: 40, status: 'met' });
    expect(without.score).toBe(100);
    expect(without.scoreCoverage).toBe(85);
    const withIt = assess(C_FEEDING);
    expect(withIt.components.find((x) => x.key === 'feeding_statement')).toMatchObject({ points: 15, status: 'met' });
    expect(withIt.score).toBe(100);
    expect(withIt.scoreCoverage).toBe(100);
  });
});
