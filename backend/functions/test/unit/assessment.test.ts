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
  it('scores a complete food with full evidence as one number, and explains every part', () => {
    const f = facts();
    const a = assessGeneral(f, scopeOf(f));
    expect(a.category).toBe('complete_food');
    // adequacy by formulation 27 + protein/fat above the cat minimums on dry matter 30 + named sources 20 + calories 10 + further guarantees 10
    expect(a.score).toBe(97);
    expect(a).toMatchObject({ scoreProvisional: false, scoreCoverage: 100, scoreLabel: 'Strong', ratingColor: 'green', scoreMinPossible: 97, scoreMaxPossible: 97 });
    expect(a.components.find((c) => c.key === 'protein_fat')?.explanation).toMatch(/Protein ≈ 33.3% of dry matter \(minimum 26%\), fat ≈ 16.7% of dry matter \(minimum 9%\)/);
    expect(a.components.every((c) => c.explanation.length > 0)).toBe(true);
  });
  it('withholds the number when an essential part is missing, naming exactly what is missing (never estimates)', () => {
    const noGa = facts({ guaranteedAnalysis: undefined });
    const a = assessGeneral(noGa, scopeOf(noGa));
    expect(a.score).toBeNull();
    expect(a.scoreLabel).toBe('Not enough information to score');
    expect(a.missingForScore).toEqual(['guaranteed analysis (protein and fat)']);
    expect(a.scoreWithheldReason).toBe('Purrbi needs the guaranteed analysis (protein and fat) before it can score this complete food.');
    // The adequacy statement is what makes a food complete: without it a complete food is not scored either.
    const noAdequacy = facts({ adequacyText: '' });
    const b = assessGeneral(noAdequacy, { ...scopeOf(noAdequacy), category: 'complete_food' });
    expect(b.score).toBeNull();
    expect(b.missingForScore[0]).toMatch(/nutritional adequacy/);
    expect(b.findings.some((x) => x.kind === 'missing' && /adequacy/.test(x.text))).toBe(true);
  });
  it('keeps coverage apart from the score: an optional part not found lowers coverage, never the score', () => {
    const full = assessGeneral(facts(), scopeOf(facts()));
    const noCal = facts({ calories: undefined });
    const a = assessGeneral(noCal, scopeOf(noCal));
    expect(a.score).toBe(Math.round((100 * 87) / 90));
    expect(a.scoreCoverage).toBe(90);
    expect(a.scoreProvisional).toBe(true);
    expect(a.coverageText).toMatch(/^Based on 4 of 5 parts: .*\(calorie content statement not found\)\.$/);
    expect(Math.abs((a.score ?? 0) - (full.score ?? 0))).toBeLessThanOrEqual(1);
  });
  it('a documented concern for the species caps the score however good the rest is (propylene glycol in a cat food); a caution never does', () => {
    const f = facts({ ingredientsText: 'Chicken, chicken meal, brown rice, propylene glycol, chicken fat, taurine' });
    const a = assessGeneral(f, scopeOf(f));
    expect(a.score).toBeLessThanOrEqual(20);
    expect(a).toMatchObject({ scoreLabel: 'Serious concern', ratingColor: 'red', scoreBand: 'low' });
    expect(a.criticalConcerns[0]).toMatch(/^propylene glycol: U.S. regulations prohibit/);
    expect(a.findings.find((x) => x.kind === 'alert')?.rule).toBe('G-KB-CONCERN');
    const g = facts({ ingredientsText: 'Chicken, chicken meal, brown rice, chicken fat, garlic powder, taurine' });
    expect(assessGeneral(g, scopeOf(g)).score).toBe(97);
  });
  it('never scores ingredients good or bad by name: grains and by-products of a named animal do not move the score; only unnamed sources lower the naming part', () => {
    const base = assessGeneral(facts(), scopeOf(facts()));
    const grains = facts({ ingredientsText: 'Chicken by-product meal, corn, wheat, chicken fat, dried beet pulp, taurine' });
    expect(assessGeneral(grains, scopeOf(grains)).score).toBe(base.score);
    const generic = facts({ ingredientsText: 'Meat by-products, poultry fat, corn, wheat, fish meal, taurine' });
    const g = assessGeneral(generic, scopeOf(generic));
    expect(g.components.find((c) => c.key === 'named_sources')).toMatchObject({ points: 8, status: 'partly_met' }); // 2 of 5 named
  });
  it('counts a vitamin or mineral blend once: a long blend adds nothing', () => {
    const plain = facts({ ingredientsText: 'Chicken, chicken meal, brown rice, chicken fat, dried beet pulp' });
    const blend = facts({ ingredientsText: 'Chicken, chicken meal, brown rice, chicken fat, dried beet pulp, Vitamins [Vitamin E Supplement, Niacin, Biotin, Folic Acid, Vitamin D3 Supplement], Minerals [Zinc Proteinate, Iron Proteinate]' });
    expect(assessGeneral(blend, scopeOf(blend)).score).toBe(assessGeneral(plain, scopeOf(plain)).score);
  });
  it('gives each ingredient its role, without changing the score', () => {
    const a = assessGeneral(facts(), scopeOf(facts()));
    const role = (n: string) => a.ingredientNotes.find((x) => x.name.toLowerCase().startsWith(n))?.role;
    expect(role('chicken')).toBe('Protein source');
    expect(role('brown rice')).toBe('Carbohydrate source');
    expect(role('chicken fat')).toBe('Fat source');
    expect(role('dried beet pulp')).toBe('Fibre source');
  });
  it('holds treats to treat criteria, and gives no number on the ingredient list alone', () => {
    const f = facts({ productName: { value: 'TEST FIXTURE Salmon Treats', source: SRC }, classificationSignals: [{ text: 'en:cat-treats', source: 't' }], adequacyText: 'Intended for intermittent or supplemental feeding only.', calories: { value: [{ kcal: 3, per: 'treat' }], source: SRC } });
    const a = assessGeneral(f, scopeOf(f));
    expect(a.category).toBe('treat');
    expect(a.components.map((c) => c.key)).toEqual(['named_sources', 'calories', 'feeding_statement', 'core_guarantees']);
    expect(a.score).toBe(100);
    const bare = facts({ productName: { value: 'TEST FIXTURE Salmon Treats', source: SRC }, classificationSignals: [{ text: 'en:cat-treats', source: 't' }], adequacyText: '', calories: undefined, guaranteedAnalysis: undefined, ingredientsText: 'Salmon' });
    const b = assessGeneral(bare, scopeOf(bare));
    expect(b.score).toBeNull();
    expect(b.scoreWithheldReason).toBe('Purrbi needs the calorie content statement, or both the feeding statement and the guaranteed analysis before it can score this treat.');
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
  it('states one score and what it covers, or exactly what is missing — never a range', () => {
    const f = facts({ calories: undefined });
    const scope = scopeOf(f);
    const g = assessGeneral(f, scope);
    const line = buildSummary(f, scope, g, personalize(pet(), f, scope, g, noRecall, NOW), noRecall).find((x) => /Purrbi score/.test(x))!;
    expect(line).toBe(`Its Purrbi score is ${g.score}/100 (strong), from the parts of the label found; the calorie content statement wasn’t found.`);
    const none = facts({ guaranteedAnalysis: undefined });
    const ns = scopeOf(none);
    const gn = assessGeneral(none, ns);
    const missing = buildSummary(none, ns, gn, personalize(pet(), none, ns, gn, noRecall, NOW), noRecall).join(' ');
    expect(missing).toMatch(/Purrbi needs the guaranteed analysis \(protein and fat\)/);
    expect(missing).not.toMatch(/between \d+ and \d+|–/);
  });
});
