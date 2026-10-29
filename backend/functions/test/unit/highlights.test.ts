// The concise result: at most two positives and two cautions in a fixed priority, and the verdict check.
import { describe, expect, it } from 'vitest';
import { checkVerdict, ruleVerdict, verdictInput, verdictKey, withPetName } from '../../src/ai/verdict';
import { buildHighlights } from '../../src/domain/highlights';
import { personalize } from '../../src/domain/personalize';
import { classifyScope } from '../../src/domain/scope';
import { assessGeneral } from '../../src/domain/score';
import type { ProductFacts, RecallCheck } from '../../src/domain/types';
import { recallDisplay } from '../../src/pipeline/serialize';
import { facts, NOW, pet } from '../helpers/fixtures';

const scopeOf = (f: ProductFacts) =>
  classifyScope({ origin: 'opff', categoriesTags: f.classificationSignals.map((s) => s.text), texts: [f.productName?.value ?? ''], adequacy: f.adequacy?.value });
const noRecall: RecallCheck = { status: 'none_found', summary: 'No FDA enforcement record found (test).', checkedAt: NOW.toISOString(), source: null, records: [] };

function result(f: ProductFacts, p = pet(), recall: RecallCheck = noRecall) {
  const scope = scopeOf(f);
  const general = assessGeneral(f, scope);
  const personal = personalize(p, f, scope, general, recall, NOW);
  return { scope, general, personal, highlights: buildHighlights({ facts: f, scope, general, personal, recall }) };
}

const input = (r: ReturnType<typeof result>, p = pet()) =>
  verdictInput({
    productName: 'TEST FIXTURE Chicken Recipe', brand: 'TESTBRAND', species: r.scope.species, category: r.general.category,
    score: r.general.score, provisional: r.general.scoreProvisional, scoreLabel: r.general.scoreLabel, scoreBasis: r.general.scoreBasis,
    withheldReason: r.general.scoreWithheldReason ?? '', pet: { name: p.name, species: p.species, fit: r.personal.state, headline: r.personal.headline },
    positives: r.highlights.positives, cautions: r.highlights.cautions, unresolved: r.personal.unresolved,
  });

describe('highlights', () => {
  it('puts an allergy-profile match first, whatever the score, with the recorded allergen as its value', () => {
    const r = result(facts(), pet({ allergiesStatus: 'reported', allergies: ['chicken'] }));
    expect(r.general.score).toBeGreaterThan(80);
    expect(r.highlights.cautions[0]).toMatchObject({ severity: 'alert', title: 'In the allergy profile', value: 'chicken', rule: 'P-ALLERGEN' });
    expect(r.highlights.cautions[0].detail).toMatch(/^Contains Chicken, chicken meal, chicken fat/);
  });
  it('puts an exact recall match before everything else', () => {
    const recall: RecallCheck = { ...noRecall, status: 'exact_active', summary: 'TEST FIXTURE recall summary.', records: [{ recallNumber: 'V-000-2026', status: 'Ongoing', classification: 'Class II', reason: 'TEST FIXTURE', reportDate: '20261001', productDescription: 'TEST FIXTURE', recallingFirm: 'TEST FIXTURE', match: 'exact_barcode' }] };
    const r = result(facts(), pet({ allergiesStatus: 'reported', allergies: ['chicken'] }), recall);
    expect(r.highlights.cautions.map((c) => c.rule)).toEqual(['G-RECALL', 'P-ALLERGEN']);
    expect(r.highlights.cautions[0]).toMatchObject({ title: 'Recall match', value: 'V-000-2026' });
  });
  it('never shows more than two of each, and never says "safe" or "no concerns" beyond what was checked', () => {
    const r = result(facts());
    expect(r.highlights.positives.length).toBeLessThanOrEqual(2);
    expect(r.highlights.cautions.length).toBeLessThanOrEqual(2);
    const text = JSON.stringify(r.highlights);
    expect(text).not.toMatch(/\bsafe\b|no concerns/i);
    for (const h of [...r.highlights.positives, ...r.highlights.cautions]) expect(h.evidence.length).toBeGreaterThan(0);
  });
  it('a species mismatch is an alert caution', () => {
    const r = result(facts(), pet({ species: 'dog', name: 'Rex' }));
    expect(r.highlights.cautions[0]).toMatchObject({ severity: 'alert', title: 'Made for another species', rule: 'P-SPECIES' });
  });
  it('shows no positives while it is unresolved what the product is', () => {
    const f = facts({ classificationSignals: [] });
    const scope = classifyScope({ origin: 'off', recordType: 'food', categoriesTags: [], texts: ['Original'], ingredientsText: f.ingredientsText?.value });
    expect(scope.status).toBe('unknown');
    const general = assessGeneral(f, scope);
    const personal = personalize(pet(), f, scope, general, noRecall, NOW);
    expect(buildHighlights({ facts: f, scope, general, personal, recall: noRecall }).positives).toEqual([]);
  });
});

describe('verdict', () => {
  it('the model never sees the pet’s name; the app’s copy has it', () => {
    const p = pet({ name: 'Zoé', allergiesStatus: 'reported', allergies: ['chicken'] });
    const v = input(result(facts(), p), p);
    expect(JSON.stringify(v)).not.toContain('Zoé');
    expect(v.pet).toMatchObject({ name: 'your cat', fit: 'mismatch' });
    expect(withPetName('Your cat is allergic to chicken; check your cat’s food.', 'cat', 'Zoé')).toBe('Zoé is allergic to chicken; check Zoé’s food.');
  });
  it('rejects claims Purrbi does not make, invented numbers, wrong lengths and a missing alert', () => {
    const p = pet({ allergiesStatus: 'reported', allergies: ['chicken'] });
    const v = input(result(facts(), p), p);
    const ok = `Purrbi’s label score for this chicken recipe is ${v.assessment.score}/100, but it contains chicken, which you recorded as an allergy for your cat, so compare the ingredient list before choosing it.`;
    expect(checkVerdict(ok, v)).toBeNull();
    expect(checkVerdict(ok.replace('compare the ingredient list', 'it is the safest choice; compare the list'), v)).toMatch(/claim Purrbi does not make/);
    expect(checkVerdict(ok.replace(`${v.assessment.score}/100`, '97/100'), v)).toMatch(/number not in the assessment/);
    expect(checkVerdict('Contains chicken.', v)).toMatch(/length/);
    expect(checkVerdict(ok.replace(/chicken/g, 'poultry').replace('which you recorded as an allergy', 'which may matter'), v)).toMatch(/most serious caution/);
  });
  it('the rule-based verdict leads with the alert and stays within 45 words', () => {
    const p = pet({ allergiesStatus: 'reported', allergies: ['chicken'] });
    const v = input(result(facts(), p), p);
    const text = ruleVerdict(v);
    expect(text).toMatch(/chicken/);
    expect(text.split(/\s+/).length).toBeLessThanOrEqual(46);
    expect(checkVerdict(text, v) ?? '').not.toMatch(/claim|number/);
  });
  it('the cache key changes with the evidence or the pet, not with the pet’s name', () => {
    const named = (over: Parameters<typeof pet>[0]) => {
      const p = pet(over);
      return input(result(facts(), p), p);
    };
    const miso = named({ name: 'Miso' });
    expect(verdictKey(miso, 'm')).toBe(verdictKey(named({ name: 'Pip' }), 'm'));
    expect(verdictKey(miso, 'm')).not.toBe(verdictKey(named({ name: 'Miso', allergiesStatus: 'reported', allergies: ['chicken'] }), 'm'));
    expect(verdictKey(miso, 'm')).not.toBe(verdictKey(miso, 'other-model'));
  });
});

describe('recall statuses', () => {
  it('distinguishes a confirmed match, a possible lot-specific match, none found, and a failed check', () => {
    const base = { ...noRecall, checkedAt: NOW.toISOString() };
    expect(recallDisplay({ ...base, status: 'exact_active' })).toMatchObject({ recallStatusLabel: 'Recall notice matches this barcode', recallSeverity: 'alert' });
    expect(recallDisplay({ ...base, status: 'possible_active' })).toMatchObject({ recallStatusLabel: 'Possible match: compare the lot code', recallSeverity: 'review' });
    expect(recallDisplay({ ...base, status: 'none_found' })).toMatchObject({ recallStatusLabel: 'No matching notice found in the sources checked', recallSeverity: 'info' });
    expect(recallDisplay({ ...base, status: 'unavailable' })).toMatchObject({ recallStatusLabel: 'The recall check failed; try again later', recallSeverity: 'review' });
    expect(recallDisplay(null).recallStatusLabel).toBe('Not checked');
  });
});
