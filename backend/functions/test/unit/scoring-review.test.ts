// Regression tests for the review of the score and verdict repairs (2026-10-30): each case is a failure a
// reviewer reproduced. Products are synthetic TEST FIXTURE records.
import { describe, expect, it } from 'vitest';
import { checkVerdict, ruleVerdict, verdictInput } from '../../src/ai/verdict';
import { buildHighlights } from '../../src/domain/highlights';
import { caloriesForPackage, describeCalories, parseCalorieText, parsePackageSize } from '../../src/domain/nutrition';
import { nutritionNotes } from '../../src/domain/nutritionContext';
import { personalize } from '../../src/domain/personalize';
import { classifyScope, speciesEvidence } from '../../src/domain/scope';
import { assessGeneral, namedSource } from '../../src/domain/score';
import type { PetProfile, ProductFacts, RecallCheck, ScopeResult } from '../../src/domain/types';
import { facts, NOW, pet, SRC } from '../helpers/fixtures';

const noRecall: RecallCheck = { status: 'none_found', summary: 'none (test)', checkedAt: NOW.toISOString(), source: null, records: [] };
const scopeOf = (f: ProductFacts) => classifyScope({ origin: 'opff', categoriesTags: f.classificationSignals.map((s) => s.text), texts: [f.productName?.value ?? ''], adequacy: f.adequacy?.value });

function verdictFor(f: ProductFacts, p: PetProfile, scope: ScopeResult = scopeOf(f), productName = 'TEST FIXTURE Chicken Recipe') {
  const general = assessGeneral(f, scope);
  const personal = personalize(p, f, scope, general, noRecall, NOW);
  const h = buildHighlights({ facts: f, scope, general, personal, recall: noRecall });
  const v = verdictInput({
    productName, brand: 'TESTBRAND', species: scope.species, category: general.category, score: general.score, provisional: general.scoreProvisional, scoreLabel: general.scoreLabel,
    scoreBasis: general.scoreBasis, withheldReason: general.scoreWithheldReason ?? '', missing: general.missingForScore, coverage: general.scoreCoverage, concerns: general.criticalConcerns.map((c) => c.split(':')[0]),
    pet: { name: p.name, species: p.species, fit: personal.state, headline: personal.headline }, positives: h.positives, cautions: h.cautions, unresolved: personal.unresolved,
  });
  return { general, personal, h, v };
}

describe('weak species evidence is never less careful than none', () => {
  it('a retailer-only "dog treat" with propylene glycol is capped as a serious concern, with the cat concern on record', () => {
    const f = facts({ productName: { value: 'TEST FIXTURE Dog Trt Chkn', source: SRC }, ingredientsText: 'Chicken, glycerin, propylene glycol, salt', adequacyText: 'Intended for intermittent or supplemental feeding only.', calories: { value: [{ kcal: 5, per: 'treat' }], source: SRC } });
    const ev = speciesEvidence([{ text: 'Dog Trt Chkn', basis: 'retailer_listing', source: 'web:shop' }]);
    const scope: ScopeResult = { status: 'supported', species: 'dog', category: 'treat', reason: '', signals: [], speciesEvidence: ev, categoryBasis: 'adequacy_statement' };
    const g = assessGeneral(f, scope);
    expect(g.score).toBeLessThanOrEqual(20);
    expect(g.scoreLabel).toBe('Serious concern');
    expect(g.criticalConcerns.join(' ')).toMatch(/propylene glycol/i);
  });
});

describe('the verdict check names the most serious caution by what it is', () => {
  const p = pet();
  it('a documented ingredient concern must be named', () => {
    const { v } = verdictFor(facts({ ingredientsText: 'Chicken, glycerin, propylene glycol, salt' }), p);
    expect(v.cautions[0]).toMatchObject({ severity: 'alert', rule: 'P-HAZARD' });
    const omits = 'Its Purrbi score is 20/100 (serious concern). It is complete and balanced for adult maintenance and its protein and fat are above the AAFCO minimums for your cat; the sources are listed below.';
    expect(checkVerdict(omits, v)).toBe('does not name the most serious caution');
    expect(checkVerdict(omits.replace('Its Purrbi score', 'It contains propylene glycol, a documented concern for cats. Its Purrbi score'), v)).not.toBe('does not name the most serious caution');
  });
  it('a product for another species must be said to be for that species: "your cat" does not count', () => {
    const dog = facts({ classificationSignals: [{ text: 'en:dog-food', source: 'opff' }], adequacyText: 'TEST FIXTURE is formulated to meet the nutritional levels established by the AAFCO Dog Food Nutrient Profiles for adult maintenance.' });
    const { v } = verdictFor(dog, p);
    expect(v.cautions[0]).toMatchObject({ rule: 'P-SPECIES', severity: 'alert' });
    const text = `Purrbi score ${v.assessment.score}/100 (${v.assessment.label.toLowerCase()}). For your cat, its protein and fat are above the AAFCO minimums and the main ingredients are named by source; the details and their sources are listed below.`;
    expect(checkVerdict(text, v)).toBe('does not name the most serious caution');
    expect(checkVerdict(text.replace('For your cat,', 'This is a dog food, not made for your cat;'), v)).not.toBe('does not name the most serious caution');
  });
});

describe('the pet’s name never reaches the model, not even in part', () => {
  it('long findings are cut after the name is replaced', () => {
    const p = pet({ name: 'Princess Buttercup', allergiesStatus: 'reported', allergies: ['chicken'] });
    const f = facts({ ingredientsText: 'Chicken, chicken meal, chicken fat (preserved with mixed tocopherols), chicken liver, dried chicken, brown rice, taurine' });
    const { v } = verdictFor(f, p);
    const sent = JSON.stringify(v);
    expect(sent).not.toMatch(/Princess|Buttercup|Butterc|Prin/);
    for (const h of [...v.positives, ...v.cautions]) expect(h.detail.length).toBeLessThanOrEqual(160);
  });
});

describe('product names are not claims', () => {
  it('a verdict naming "Perfect Portions" or "Healthy Kitten" is not rejected for it, and the rule verdict passes its own check', () => {
    const { v } = verdictFor(facts(), pet(), undefined, 'Sheba Perfect Portions Chicken Entree');
    const text = `Purrbi score ${v.assessment.score}/100 (${v.assessment.label.toLowerCase()}) for Sheba Perfect Portions Chicken Entree: it is complete and balanced for adult maintenance, and its protein and fat are above the AAFCO minimums for your cat.`;
    expect(checkVerdict(text, v)).toBeNull();
    expect(checkVerdict(ruleVerdict(v), v)).toBeNull();
    expect(checkVerdict(text.replace('it is complete', 'it is a perfect, complete'), v)).toMatch(/claim Purrbi does not make/);
  });
});

describe('protein and fat against AAFCO’s energy-corrected minimums, everywhere', () => {
  const ga = (protein: number, fat: number) => [
    { nutrient: 'crude_protein' as const, label: 'Crude protein', qualifier: 'min' as const, value: protein, unit: '%' as const },
    { nutrient: 'crude_fat' as const, label: 'Crude fat', qualifier: 'min' as const, value: fat, unit: '%' as const },
    { nutrient: 'crude_fiber' as const, label: 'Crude fiber', qualifier: 'max' as const, value: 3, unit: '%' as const },
    { nutrient: 'moisture' as const, label: 'Moisture', qualifier: 'max' as const, value: 10, unit: '%' as const },
  ];
  it('a dense food below the corrected minimum is not "above the AAFCO minimums", and the row agrees', () => {
    const f = facts({ guaranteedAnalysis: { value: ga(28, 22), source: SRC }, calories: { value: [{ kcal: 4600, per: 'kg' }], source: SRC } });
    const g = assessGeneral(f, scopeOf(f));
    expect(g.components.find((c) => c.key === 'protein_fat')?.status).not.toBe('met');
    const row = nutritionNotes(f.guaranteedAnalysis!.value, { species: 'cat', category: 'complete_food', adequacy: f.adequacy?.value, calories: f.calories?.value }).find((n) => n.nutrient === 'crude_protein');
    expect(row?.context).toMatch(/below it/);
  });
  it('a food below 4,000 kcal per kg of dry matter is held to the plain minimum (no correction downwards)', () => {
    const f = facts({ guaranteedAnalysis: { value: ga(22, 9), source: SRC }, calories: { value: [{ kcal: 2700, per: 'kg' }], source: SRC } });
    const g = assessGeneral(f, scopeOf(f));
    expect(g.components.find((c) => c.key === 'protein_fat')?.status).toBe('partly_met'); // 24.4% < 26%
    const row = nutritionNotes(f.guaranteedAnalysis!.value, { species: 'cat', category: 'complete_food', adequacy: f.adequacy?.value, calories: f.calories?.value }).find((n) => n.nutrient === 'crude_protein');
    expect(row?.context).toMatch(/below it/);
    expect(row?.context).not.toMatch(/at this food's energy density/);
  });
});

describe('generic ingredient names in every label language', () => {
  it('EU category names are generic in French, German and English alike', () => {
    for (const n of ['Viandes et sous-produits animaux (dont poulet 4%)', 'Fleisch und tierische Nebenerzeugnisse', 'Poissons et sous-produits de poissons', 'céréales', 'huiles et graisses', 'Meat and animal derivatives (4% chicken)', 'cereals', 'oils and fats', 'Getreide', 'Öle und Fette'])
      expect([n, namedSource(n)]).toEqual([n, false]);
    for (const n of ['ocean fish', 'liver', 'natural and artificial flavors', 'artificial flavors']) expect([n, namedSource(n)]).toEqual([n, false]);
    for (const n of ['chicken', 'chicken liver', 'salmon meal', 'Poulet', 'chicken by-product meal']) expect([n, namedSource(n)]).toEqual([n, true]);
  });
});

describe('package sizes and calorie measures', () => {
  it('a net weight in two units is one size', () => {
    expect(parsePackageSize('Net Wt. 3 oz (85g)')).toMatchObject({ amount: 3, unit: 'oz' });
    expect(parsePackageSize('5.5 oz (156 g) can')).toMatchObject({ amount: 5.5, unit: 'oz' });
    expect(parsePackageSize('3.5 lb (1.59 kg)')).toMatchObject({ amount: 3.5, unit: 'lb' });
    expect(parsePackageSize('2.8 Ounce, 5.3 Ounce Can')).toBeNull(); // two sizes
  });
  it('a measuring cup and 100 g are measures, not packages; per-ounce values say so', () => {
    const cals = parseCalorieText('3,580 kcal per kg, 358 kcal per 8 oz cup');
    expect(cals.map(describeCalories)).toEqual(['3,580 kcal per kg', '358 kcal per cup']);
    expect(caloriesForPackage(cals, parsePackageSize('15 lb bag')).map(describeCalories)).toEqual(['3,580 kcal per kg', '358 kcal per cup']);
    expect(parseCalorieText('350 kcal per 100 grams of food').map(describeCalories)).toEqual(['350 kcal per 100 g']);
    expect(parseCalorieText('122 kcal/oz').map(describeCalories)).toEqual(['122 kcal per oz']);
    expect(parseCalorieText('1,456 kcal/lb').map(describeCalories)).toEqual(['1,456 kcal per lb']);
  });
});

describe('the rule verdict and the score explain themselves', () => {
  it('a capped score names its cause when the pet has no alert of its own', () => {
    const f = facts({ classificationSignals: [{ text: 'en:dog-and-cat-food', source: 't' }, { text: 'en:cat-treats', source: 't' }, { text: 'en:dog-treats', source: 't' }], ingredientsText: 'Chicken, glycerin, propylene glycol, salt', adequacyText: 'Intended for intermittent or supplemental feeding only.', calories: { value: [{ kcal: 5, per: 'treat' }], source: SRC } });
    const dog = pet({ species: 'dog', name: 'Rex' });
    const { v } = verdictFor(f, dog);
    expect(v.assessment.label).toBe('Serious concern');
    const text = ruleVerdict(v);
    expect(text).toMatch(/because it contains propylene glycol/i);
    expect(text).not.toMatch(/for that reason/);
    expect(checkVerdict(text, v)).toBeNull();
  });
  it('a treat with its feeding statement is asked only for what would complete its rating', () => {
    const f = facts({ productName: { value: 'TEST FIXTURE Salmon Treats', source: SRC }, classificationSignals: [{ text: 'en:cat-treats', source: 't' }], adequacyText: 'Intended for intermittent or supplemental feeding only.', calories: undefined, guaranteedAnalysis: undefined, ingredientsText: 'Salmon' });
    const g = assessGeneral(f, scopeOf(f));
    expect(g.missingForScore).toEqual(['calorie content statement, or the guaranteed analysis']);
  });
});
