import { describe, expect, it } from 'vitest';
import { assessGeneral, METHODOLOGY_VERSION } from '../../src/domain/score';
import { personalize } from '../../src/domain/personalize';
import { buildSummary, overallState } from '../../src/domain/summary';
import { classifyScope } from '../../src/domain/scope';
import type { ProductFacts, RecallCheck } from '../../src/domain/types';
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
    expect(a.score).toBe(34 + 20 + 5 + 10 + 5 + 20);
    expect(a.scoreProvisional).toBe(false);
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
  it('scores a complete food without its adequacy statement as a lower bound, by coverage, not as poor quality', () => {
    const f = facts({ adequacyText: '' });
    const a = assessGeneral(f, scopeOf(f));
    const full = assessGeneral(facts(), scopeOf(facts()));
    expect(a.score).toBe(full.score! - full.components.find((c) => c.key === 'adequacy')!.points);
    expect(a).toMatchObject({ scoreProvisional: true, scoreLabel: 'Partial assessment', scoreCoverage: 60, scoreMaxPossible: a.score! + 40 });
    expect(a.scoreBasis).toBe('Based on 60 of 100 points’ worth of label information; nutritional adequacy statement could add up to 40.');
    expect(a.findings.find((x) => x.rule === 'G-ADEQUACY')!.kind).toBe('missing'); // shown as missing evidence, not as a fault
  });
  it('marks a score provisional when an optional item lacks evidence, without calling it a fault', () => {
    const f = facts({ calories: undefined });
    const a = assessGeneral(f, scopeOf(f));
    expect(a.score).toBe(84);
    expect(a.scoreProvisional).toBe(true);
    const cal = a.components.find((c) => c.key === 'calories')!;
    expect(cal.status).toBe('unverified');
    expect(a.findings.find((x) => x.rule === 'G-CALORIES')!.kind).toBe('missing');
  });
  it('applies species-specific documented concerns (propylene glycol in a cat product)', () => {
    const f = facts({ ingredientsText: 'Chicken, glycerin, propylene glycol, salt' });
    const a = assessGeneral(f, scopeOf(f));
    expect(a.ingredientNotes.find((n) => n.name === 'propylene glycol')!.status).toBe('concern');
    expect(a.components.find((c) => c.key === 'concerns')!.points).toBe(0);
    const dog = facts({ ingredientsText: 'Chicken, glycerin, propylene glycol, salt', classificationSignals: [{ text: 'en:dog-food', source: 't' }], adequacyText: 'X is formulated to meet the nutritional levels established by the AAFCO Dog Food Nutrient Profiles for adult maintenance.' });
    const d = assessGeneral(dog, scopeOf(dog));
    expect(d.ingredientNotes.find((n) => n.name === 'propylene glycol')!.status).toBe('info');
    expect(d.components.find((c) => c.key === 'concerns')!.points).toBe(20);
  });
  it('does not penalise grains, by-products or unfamiliar names', () => {
    const f = facts({ ingredientsText: 'Chicken by-product meal, ground yellow corn, wheat flour, brewers rice, menadione sodium bisulfite complex, taurine' });
    const a = assessGeneral(f, scopeOf(f));
    expect(a.components.find((c) => c.key === 'concerns')!.points).toBe(20);
  });
  it('does not hold treats to complete-diet standards', () => {
    const f = facts({ productName: { value: 'TEST FIXTURE Salmon Treats', source: SRC }, classificationSignals: [{ text: 'en:cat-treats', source: 't' }], adequacyText: 'Intended for intermittent or supplemental feeding only.' });
    const a = assessGeneral(f, scopeOf(f));
    expect(a.category).toBe('treat');
    expect(a.components.find((c) => c.key === 'feeding_statement')).toMatchObject({ points: 15, status: 'met' });
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
});
