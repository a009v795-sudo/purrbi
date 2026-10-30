import { describe, expect, it } from 'vitest';
import { assessGeneral, METHODOLOGY_VERSION } from '../../src/domain/score';
import { personalize } from '../../src/domain/personalize';
import { buildSummary, overallState } from '../../src/domain/summary';
import { classifyScope } from '../../src/domain/scope';
import type { ProductFacts, RecallCheck } from '../../src/domain/types';
import { resultFields } from '../../src/pipeline/serialize';
import { facts, NOW, pet, SRC } from '../helpers/fixtures';

const scopeOf = (f: ProductFacts) =>
  classifyScope({ origin: 'opff', categoriesTags: f.classificationSignals.map((s) => s.text), texts: [f.productName?.value ?? ''], adequacy: f.adequacy?.value });

const noRecall: RecallCheck = { status: 'none_found', summary: 'No FDA enforcement record found (test).', checkedAt: NOW.toISOString(), source: null, records: [] };

describe('general score', () => {
  it('is deterministic and versioned', () => {
    const f = facts();
    const a = assessGeneral(f, scopeOf(f));
    const b = assessGeneral(JSON.parse(JSON.stringify(f)), scopeOf(f));
    expect(a).toEqual(b);
    expect(a.methodologyVersion).toBe(METHODOLOGY_VERSION);
    expect(a.components.reduce((s, c) => s + c.maxPoints, 0)).toBe(100);
  });
  it('scores a complete food with full evidence and explains every component', () => {
    const f = facts();
    const a = assessGeneral(f, scopeOf(f));
    expect(a.category).toBe('complete_food');
    expect(a.score).toBe(43 + 25 + 15 + 5 + 5); // adequacy by formulation, guarantees, calories, moisture, further guarantees
    expect(a).toMatchObject({ scoreProvisional: false, scoreCoverage: 100, scoreLabel: 'Strong label information' });
    expect(a.components.every((c) => c.explanation.length > 0)).toBe(true);
  });
  it('withholds the score when an essential input is missing (never estimates)', () => {
    const f = facts({ guaranteedAnalysis: undefined });
    const a = assessGeneral(f, scopeOf(f));
    expect(a.score).toBeNull();
    expect(a.missingForScore).toEqual(['guaranteed analysis (protein, fat, fiber)']);
    expect(a.scoreWithheldReason).toMatch(/needs the guaranteed analysis/);
    expect(a.scoreCoverage).toBeNull();
  });
  it('keeps coverage apart from quality: a missing adequacy statement lowers coverage, caps the score, and never counts as poor quality', () => {
    const f = facts({ adequacyText: '' });
    const a = assessGeneral(f, scopeOf(f));
    // Everything that could be assessed is fully met (50 of 50), so quality is 100, capped at 74 until the statement is known.
    expect(a).toMatchObject({ score: 74, scoreProvisional: true, scoreLabel: 'Partial assessment', scoreBand: null, scoreCoverage: 50, scoreMinPossible: 50, scoreMaxPossible: 100 });
    expect(a.scoreBasis).toBe('Based on 50 of 100 points’ worth of label information (nutritional adequacy statement not available yet); the complete label could put it between 50 and 100. Score capped at 74 until the adequacy statement is known.');
    expect(a.findings.find((x) => x.rule === 'G-ADEQUACY')!.kind).toBe('missing'); // shown as missing evidence, not as a fault
    expect(overallState(a, noRecall, scopeOf(f))).toBe('partial'); // never "Information incomplete"
    const shown = resultFields({ facts: f, scope: scopeOf(f), general: a, personal: personalize(null, f, scopeOf(f), a, noRecall, NOW), recall: noRecall, summary: [], state: 'partial', photoRequests: [], factsVersion: 1, labelEvidenceUsed: false });
    expect(shown.scoreText).toBe('50–100'); // the range, never a bare number that reads as final
  });
  it('the same product scores the same quality whether or not the optional calorie statement is known', () => {
    const full = assessGeneral(facts(), scopeOf(facts()));
    const f = facts({ calories: undefined });
    const a = assessGeneral(f, scopeOf(f));
    expect(a.score).toBe(Math.round((100 * (full.score! - 15)) / 85)); // 78 of the 85 assessable points
    expect(Math.abs(a.score! - full.score!)).toBeLessThanOrEqual(2); // missing data barely moves it: it is not a quality signal
    expect(a).toMatchObject({ scoreProvisional: true, scoreCoverage: 85, scoreMinPossible: 78, scoreMaxPossible: 93, scoreLabel: 'Strong label information' });
    const cal = a.components.find((c) => c.key === 'calories')!;
    expect(cal.status).toBe('unverified');
    expect(a.findings.find((x) => x.rule === 'G-CALORIES')!.kind).toBe('missing');
  });
  it('a documented concern for the species caps the score and leads, however complete the label (propylene glycol in a cat food)', () => {
    const f = facts({ ingredientsText: 'Chicken, glycerin, propylene glycol, salt' });
    const a = assessGeneral(f, scopeOf(f));
    expect(a.ingredientNotes.find((n) => n.name === 'propylene glycol')).toMatchObject({ status: 'concern', kbId: 'propylene_glycol', concernFor: ['cat'] });
    expect(a).toMatchObject({ score: 20, scoreLabel: 'Documented ingredient concern', scoreBand: 'low' });
    expect(a.scoreBasis).toMatch(/Score capped at 20: propylene glycol is a documented concern for cats\./);
    const dog = facts({ ingredientsText: 'Chicken, glycerin, propylene glycol, salt', classificationSignals: [{ text: 'en:dog-food', source: 't' }], adequacyText: 'X is formulated to meet the nutritional levels established by the AAFCO Dog Food Nutrient Profiles for adult maintenance.' });
    const d = assessGeneral(dog, scopeOf(dog));
    expect(d.ingredientNotes.find((n) => n.name === 'propylene glycol')!.status).toBe('info');
    expect(d.score).toBe(93); // not a concern for dogs: no cap
  });
  it('never counts ingredients as good or bad: grains, by-products, unfamiliar names and cautions do not move the score', () => {
    const plain = assessGeneral(facts(), scopeOf(facts()));
    const f = facts({ ingredientsText: 'Chicken by-product meal, ground yellow corn, wheat flour, brewers rice, menadione sodium bisulfite complex, taurine' });
    expect(assessGeneral(f, scopeOf(f)).score).toBe(plain.score);
    const g = facts({ ingredientsText: 'Chicken, garlic, garlic powder, rice' });
    const withGarlic = assessGeneral(g, scopeOf(g));
    expect(withGarlic.score).toBe(plain.score); // a context-dependent caution is a flag, not points
    expect(withGarlic.findings.filter((x) => x.rule === 'G-KB-CAUTION')).toHaveLength(1); // one finding for both forms
    expect(withGarlic.findings.find((x) => x.rule === 'G-KB-CAUTION')!.text).toMatch(/^garlic, garlic powder: /);
  });
  it('gives each ingredient its role, without changing the score', () => {
    const a = assessGeneral(facts(), scopeOf(facts()));
    const role = (n: string) => a.ingredientNotes.find((x) => x.name.toLowerCase().startsWith(n))?.role;
    expect(role('chicken')).toBe('Protein source');
    expect(role('brown rice')).toBe('Carbohydrate source');
    expect(role('chicken fat')).toBe('Fat source');
    expect(role('dried beet pulp')).toBe('Fibre source');
  });
  it('does not hold treats to complete-diet standards', () => {
    const f = facts({ productName: { value: 'TEST FIXTURE Salmon Treats', source: SRC }, classificationSignals: [{ text: 'en:cat-treats', source: 't' }], adequacyText: 'Intended for intermittent or supplemental feeding only.' });
    const a = assessGeneral(f, scopeOf(f));
    expect(a.category).toBe('treat');
    expect(a.components.find((c) => c.key === 'feeding_statement')).toMatchObject({ points: 25, status: 'met' });
    expect(a.score).toBe(100);
  });
  it('gives supplements findings but no number', () => {
    const f = facts({ productName: { value: 'TEST FIXTURE Joint Supplement Chews', source: SRC }, classificationSignals: [{ text: 'en:dog-supplements', source: 't' }], adequacyText: '' });
    const a = assessGeneral(f, scopeOf(f));
    expect(a.category).toBe('supplement');
    expect(a.scoreApplicable).toBe(false);
    expect(a.score).toBeNull();
    expect(a.ingredientNotes.length).toBeGreaterThan(0);
  });
  it('reclassifies a "food" whose label says intermittent feeding', () => {
    const f = facts({ productName: { value: 'TEST FIXTURE Tuna dinner', source: SRC }, adequacyText: 'This product is intended for intermittent or supplemental feeding only.' });
    const a = assessGeneral(f, { ...scopeOf(f), category: 'complete_food' });
    expect(a.category).toBe('complementary');
  });
});

describe('personal fit', () => {
  it('two pets, same evidence: different personal findings, identical general score', () => {
    const f = facts();
    const scope = scopeOf(f);
    const general = assessGeneral(f, scope);
    const allergic = personalize(pet({ name: 'Miso', allergiesStatus: 'reported', allergies: ['chicken'] }), f, scope, general, noRecall, NOW);
    const notAllergic = personalize(pet({ petId: 'pet2', name: 'Pip' }), f, scope, general, noRecall, NOW);
    expect(allergic.state).toBe('mismatch');
    expect(allergic.findings.some((x) => /chicken/i.test(x.text) && x.rule === 'P-ALLERGEN')).toBe(true);
    expect(notAllergic.state).toBe('fits');
    expect(assessGeneral(f, scope).score).toBe(general.score);
    expect(allergic.trace.find((t) => t.rule === 'P-ALLERGEN')).toMatchObject({ value: 'chicken', effect: 'contains' });
  });
  it('flags a species mismatch from the product label, not the selected pet', () => {
    const f = facts();
    const scope = scopeOf(f);
    const p = personalize(pet({ species: 'dog', name: 'Rex' }), f, scope, assessGeneral(f, scope), noRecall, NOW);
    expect(p.state).toBe('not_for_species');
  });
  it('checks life stage against the adequacy claim', () => {
    const f = facts();
    const scope = scopeOf(f);
    const kitten = personalize(pet({ birthDate: '2026-06-01' }), f, scope, assessGeneral(f, scope), noRecall, NOW);
    expect(kitten.state).toBe('mismatch');
    expect(kitten.findings.find((x) => x.rule === 'P-LIFESTAGE')!.text).toMatch(/still growing/);
  });
  it('keeps "not sure" and "not provided" distinct and never claims "no interactions"', () => {
    const f = facts({ productName: { value: 'TEST FIXTURE Joint Supplement Chews', source: SRC }, classificationSignals: [{ text: 'en:cat-supplements', source: 't' }] });
    const scope = scopeOf(f);
    const g = assessGeneral(f, scope);
    const p = personalize(pet({ allergiesStatus: 'not_sure', medicationsStatus: 'not_provided' }), f, scope, g, noRecall, NOW);
    expect(p.unresolved.join(' ')).toMatch(/weren’t sure about allergies/);
    expect(p.unresolved.join(' ')).toMatch(/Medication information wasn’t provided/);
    expect(JSON.stringify(p)).not.toMatch(/no interactions/i);
  });
  it('judges a documented concern for the pet’s own species', () => {
    const both = facts({ productName: { value: 'TEST FIXTURE Soft Treats for Cats and Dogs', source: SRC }, ingredientsText: 'Chicken, glycerin, propylene glycol, salt', classificationSignals: [{ text: 'en:cat-treats', source: 't' }, { text: 'en:dog-treats', source: 't' }], adequacyText: 'Intended for intermittent or supplemental feeding only.' });
    const scope = scopeOf(both);
    const g = assessGeneral(both, scope);
    const cat = personalize(pet(), both, scope, g, noRecall, NOW);
    expect(cat.state).toBe('mismatch');
    expect(cat.findings.find((x) => x.rule === 'P-HAZARD')).toMatchObject({ kind: 'alert' });
    const dog = personalize(pet({ species: 'dog', name: 'Rex' }), both, scope, g, noRecall, NOW);
    expect(dog.findings.find((x) => x.rule === 'P-HAZARD')).toMatchObject({ kind: 'info', text: 'propylene glycol: a documented concern for cats, not for dogs.' });
    expect(dog.state).toBe('fits');
  });
  it('a supplement for a pet on medicines, with a condition or pregnant is a vet question, never "fits"', () => {
    const f = facts({ productName: { value: 'TEST FIXTURE Calming Chews', source: SRC }, classificationSignals: [{ text: 'en:cat-supplements', source: 't' }] });
    const scope = scopeOf(f);
    const g = assessGeneral(f, scope);
    expect(personalize(pet({ medicationsStatus: 'reported' }), f, scope, g, noRecall, NOW).state).toBe('review');
    expect(personalize(pet({ conditionsStatus: 'reported', medicationsStatus: 'none_reported' }), f, scope, g, noRecall, NOW).state).toBe('review');
    expect(personalize(pet({ reproductiveStatus: 'pregnant', medicationsStatus: 'none_reported' }), f, scope, g, noRecall, NOW).findings.some((x) => x.rule === 'P-REPRO')).toBe(true);
  });
  it('does not use breed', () => {
    const f = facts();
    const scope = scopeOf(f);
    const g = assessGeneral(f, scope);
    const a = personalize(pet({ breed: 'Siamese' }), f, scope, g, noRecall, NOW);
    const b = personalize(pet({ breed: null }), f, scope, g, noRecall, NOW);
    expect(a.state).toBe(b.state);
    expect(a.findings).toEqual(b.findings);
    expect(a.trace.find((t) => t.rule === 'P-BREED')!.effect).toMatch(/Not used/);
  });
  it('lets an exact recall match override the personal verdict', () => {
    const f = facts();
    const scope = scopeOf(f);
    const g = assessGeneral(f, scope);
    const recall: RecallCheck = { ...noRecall, status: 'exact_active', summary: 'Recall (test).' };
    expect(personalize(pet(), f, scope, g, recall, NOW).state).toBe('alert');
    expect(overallState(g, recall, scope)).toBe('alert');
  });
  it('works without a pet profile', () => {
    const f = facts();
    const scope = scopeOf(f);
    const g = assessGeneral(f, scope);
    const p = personalize(null, f, scope, g, noRecall, NOW);
    expect(p.state).toBe('no_pet');
    expect(g.score).not.toBeNull();
  });
});

describe('summary', () => {
  it('has at most five sentences and always ends with the disclaimer', () => {
    const f = facts();
    const scope = scopeOf(f);
    const g = assessGeneral(f, scope);
    const s = buildSummary(f, scope, g, personalize(pet(), f, scope, g, noRecall, NOW), noRecall);
    expect(s.length).toBeLessThanOrEqual(5);
    expect(s[s.length - 1]).toMatch(/not veterinary advice/);
  });
  it('tells a partial assessment by its range, never as a score or a lower bound', () => {
    const f = facts({ adequacyText: '' });
    const scope = scopeOf(f);
    const g = assessGeneral(f, scope);
    expect(g.scoreLabel).toBe('Partial assessment');
    const line = buildSummary(f, scope, g, personalize(pet(), f, scope, g, noRecall, NOW), noRecall).find((x) => /label score/.test(x))!;
    expect(line).toMatch(/^Its Purrbi label score is not final: based on \d+ of 100 points’ worth .* between \d+ and 100/);
    expect(line).not.toMatch(/lower bound|\d+\/100/);
  });
});
