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
    withheldReason: r.general.scoreWithheldReason ?? '', missing: r.general.missingForScore, coverage: r.general.scoreCoverage, low: r.general.scoreMinPossible ?? null, high: r.general.scoreMaxPossible, pet: { name: p.name, species: p.species, fit: r.personal.state, headline: r.personal.headline },
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
    const ok = `Purrbi scores this chicken recipe ${v.assessment.score}/100, but it contains chicken, which you recorded as an allergy for your cat, so compare the ingredient list carefully before choosing it for your cat.`;
    expect(checkVerdict(ok, v)).toBeNull();
    expect(checkVerdict(ok.replace('compare the ingredient list', 'it is the safest choice; compare the list'), v)).toMatch(/claim Purrbi does not make/);
    expect(checkVerdict(ok.replace(`${v.assessment.score}/100`, '61/100'), v)).toMatch(/score not the assessment’s \(61\)/);
    expect(checkVerdict(ok.replace('compare the ingredient list', 'compare the 12 ingredients'), v)).toMatch(/number not in the assessment \(12\)/);
    expect(checkVerdict(ok.replace('this chicken recipe', 'this great, high-quality chicken recipe'), v)).toMatch(/claim Purrbi does not make/);
    expect(checkVerdict(ok.replace('compare the ingredient list', 'compare the ingredient list and guaranteed analysis'), v)).toBeNull(); // a label term, not a promise
    expect(checkVerdict(ok.replace('compare the ingredient list', 'it is guaranteed to suit your cat; compare the list'), v)).toMatch(/claim Purrbi does not make/);
    expect(checkVerdict('Contains chicken.', v)).toMatch(/length/);
    expect(checkVerdict(ok.replace('but it contains', 'not enough information to score, and it contains'), v)).toMatch(/repeats the missing-information message/);
    expect(checkVerdict(ok.replace(/chicken/g, 'poultry').replace('which you recorded as an allergy', 'which may matter'), v)).toMatch(/most serious caution/);
  });
  it('the rule-based verdict leads with the alert, is 25 to 40 words of whole sentences, and passes the check', () => {
    for (const p of [pet({ allergiesStatus: 'reported', allergies: ['chicken'] }), pet(), pet({ species: 'dog', name: 'Rex' })]) {
      for (const f of [facts(), facts({ adequacyText: '' }), facts({ ingredientsText: 'Chicken, glycerin, propylene glycol, salt' })]) {
        const v = input(result(f, p), p);
        const text = ruleVerdict(v);
        const n = text.split(/\s+/).length;
        expect(n).toBeGreaterThanOrEqual(25);
        expect(n).toBeLessThanOrEqual(40);
        expect(text).not.toMatch(/…/);
        expect(checkVerdict(text, v)).toBeNull();
      }
    }
    const allergic = pet({ allergiesStatus: 'reported', allergies: ['chicken'] });
    expect(ruleVerdict(input(result(facts(), allergic), allergic))).toMatch(/^In the allergy profile: Contains Chicken/);
    // An unscored product: the verdict interprets what was found and says only that it is not rated yet (the
    // screen lists what a rating needs), never a number.
    const unscored = input(result(facts({ guaranteedAnalysis: undefined })), pet());
    expect(ruleVerdict(unscored)).toMatch(/^Not rated yet\. /);
    expect(ruleVerdict(unscored)).not.toMatch(/a rating needs|guaranteed analysis|\d+\/100/);
    expect(checkVerdict('Purrbi’s label score is Not enough information to score because the ingredient list or guaranteed analysis is missing, preventing a full assessment of this chicken recipe for your cat today.', unscored)).toMatch(/repeats the missing-information message/);
    expect(checkVerdict('This chicken recipe for cats scores 60/100 for your cat; it is labeled complete and balanced for adult maintenance and lists chicken first, and the details are below.', unscored)).toMatch(/score not the assessment’s \(60\)/);
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

// Test B on research 2.9.2 (2026-10-31, trace ffb9aa4a-0ba): the header said "Listed for cats by a retailer’s listing (not
// confirmed)" while the highlight said "Made for cats" and the AI verdict "This cat food is made specifically for cats …
// but it lacks a nutritional adequacy statement".
describe('who the product is for and what is missing, said as Purrbi knows it (test B)', () => {
  const unconfirmed = (f: ProductFacts) => {
    const scope = scopeOf(f);
    return { ...scope, speciesEvidence: { set: ['cat' as const], confirmed: false, basis: 'retailer_listing' as const, disputed: false, note: '' } };
  };
  it('a species only a retailer lists is information, not a positive “Made for cats”', () => {
    const f = facts();
    const scope = unconfirmed(f);
    const general = assessGeneral(f, scope);
    const personal = personalize(pet(), f, scope, general, noRecall, NOW);
    expect(personal.findings.some((x) => x.rule === 'P-SPECIES' && x.kind === 'positive')).toBe(false);
    expect(personal.findings.find((x) => x.rule === 'P-SPECIES')?.text).toBe('Listed for cats by a retailer’s listing; Purrbi couldn’t confirm it from the package or the maker.');
    const highlights = buildHighlights({ facts: f, scope, general, personal, recall: noRecall });
    expect(highlights.positives.map((h) => h.title)).not.toContain('Made for cats');
  });
  it('the verdict check refuses “made for cats” when only a retailer lists it, and a missing statement said as the product lacking it', () => {
    const base = {
      product: { name: 'TEST FIXTURE Gravies', brand: 'TESTBRAND', species: 'cat', category: 'complete_food', speciesConfirmed: false, speciesBasis: 'retailer listing' },
      assessment: { score: null, provisional: false, label: 'Information incomplete', basis: '', withheldReason: 'Purrbi needs the nutritional adequacy statement.', missing: 'nutritional adequacy ("complete and balanced") statement' },
      pet: { name: 'your cat', species: 'cat', fit: 'incomplete', headline: '' },
      positives: [{ title: 'Main ingredients named by source', detail: 'The first 5 main ingredients each say which animal or plant they come from.', value: '' }],
      cautions: [],
      unresolved: [],
    };
    const asSeen = 'This cat food is made specifically for cats and lists the main ingredients by source, but it lacks a nutritional adequacy statement, so its suitability for your cat cannot be fully assessed yet.';
    expect(checkVerdict(asSeen, base)).toBe('says the product lacks what Purrbi has not found');
    const madeFor = 'This cat food is made specifically for cats and lists the main ingredients by source; Purrbi has not found its complete and balanced statement yet, so it is not rated for your cat.';
    expect(checkVerdict(madeFor, base)).toBe('states who it is for as confirmed when only a retailer lists it');
    expect(checkVerdict(madeFor, { ...base, product: { ...base.product, speciesConfirmed: true } })).toBeNull();
    const listed = 'A retailer lists this food for cats, and its main ingredients are named by source; Purrbi has not found its complete and balanced statement yet, so it is not rated for your cat.';
    expect(checkVerdict(listed, base)).toBeNull();
    // A finding that only says the product has no listed concern is not refused as missing information.
    expect(checkVerdict('Its main ingredients are named by source and it has no ingredient on Purrbi’s concern list for your cat; it is not rated yet, as Purrbi has not found its complete and balanced statement.', base)).toBeNull();
  });
  // Review of verdict 2.2.0: the checks catch the usual synonyms and adjectives, and let through what is said as Purrbi
  // knows it (its own search, a retailer's listing, a hedge or an attribution).
  it('the checks catch synonyms and adjectives, and pass wording about Purrbi’s search, hedges and attributions', () => {
    const base = {
      product: { name: 'TEST FIXTURE Gravies', brand: 'TESTBRAND', species: 'cat', category: 'complete_food', speciesConfirmed: false, speciesBasis: 'retailer listing' },
      assessment: { score: null, provisional: false, label: 'Information incomplete', basis: '', withheldReason: 'Purrbi needs the nutritional adequacy statement.', missing: 'nutritional adequacy ("complete and balanced") statement' },
      pet: { name: 'your cat', species: 'cat', fit: 'incomplete', headline: '' },
      positives: [{ title: 'Main ingredients named by source', detail: 'The first 5 main ingredients each say which animal or plant they come from.', value: '' }],
      cautions: [],
      unresolved: [],
    };
    const confirmed = { ...base, product: { ...base.product, speciesConfirmed: true } };
    const otherMissing = { ...confirmed, assessment: { ...confirmed.assessment, missing: 'guaranteed analysis and the calorie content' } };
    const nothingMissing = { ...confirmed, assessment: { ...confirmed.assessment, missing: '' } };
    const catFoodName = { ...base, product: { ...base.product, name: 'TEST FIXTURE Gravies Cat Food Chicken' } };
    const LACKS = 'says the product lacks what Purrbi has not found';
    const SPECIES = 'states who it is for as confirmed when only a retailer lists it';
    const table: [string | null, typeof base, string][] = [
      [LACKS, confirmed, 'Its main ingredients are named by source, but without a feeding statement on its package it may not be a complete diet, so it is not rated for your cat.'],
      [LACKS, confirmed, 'Its main ingredients are named by source, but there is no adequacy statement on the package, so it may not be a complete diet and is not rated for your cat.'],
      [LACKS, confirmed, 'Its main ingredients are named by source, but its package and listing don’t include a feeding statement, so it is not rated for your cat and may not be a complete diet.'],
      [LACKS, confirmed, 'Its main ingredients are named by source, but it isn’t labeled complete and balanced, so it may not suit your cat as an only food and is not rated.'],
      [LACKS, otherMissing, 'Its main ingredients are named by source, but with no guaranteed analysis on the package its protein and fat are unknown, so it is not rated for your cat.'],
      [LACKS, otherMissing, 'Its main ingredients are named by source, but the package doesn’t show calories, which makes portions harder to judge, and it is not rated for your cat.'],
      [LACKS, otherMissing, 'Its main ingredients are named by source, but the maker does not provide calorie content, which makes portions harder to judge, and it is not rated for your cat.'],
      [null, confirmed, 'Its main ingredients are named by source; Purrbi has no feeding statement for it yet, so it is not rated for your cat, and the details are listed below.'],
      [null, confirmed, 'No adequacy statement was found yet, so it is not rated for your cat; its main ingredients are named by source, and the details and sources are listed below.'],
      [null, confirmed, 'The retailer’s listing has no adequacy statement, so Purrbi cannot rate it for your cat yet; its main ingredients are named by source and listed below.'],
      [null, confirmed, 'There is no adequacy statement on the page Purrbi found, so it is not rated for your cat yet; its main ingredients are named by source, as listed below.'],
      // Nothing missing: a caution about an unclear feeding statement is not "lacking" anything.
      [null, nothingMissing, 'Its main ingredients are named by source, but its feeding statement doesn’t state what it is complete and balanced for, so check the package before it is your cat’s only food.'],
      [SPECIES, base, 'This food is made specifically for adult cats and its main ingredients are named by source; Purrbi has not found its complete and balanced statement yet, so it is not rated for your cat.'],
      [SPECIES, base, 'It is formulated for adult cats and its main ingredients are named by source; Purrbi has not found its complete and balanced statement yet, so it is not rated for your cat.'],
      [SPECIES, base, 'It is a food for cats whose main ingredients are named by source; Purrbi has not found its complete and balanced statement yet, so it is not rated for your cat.'],
      [SPECIES, base, 'This cat food has its main ingredients named by source; Purrbi has not found its complete and balanced statement yet, so it is not rated for your cat, as listed below.'],
      [SPECIES, base, 'It is intended for use in cats and its main ingredients are named by source; Purrbi has not found its complete and balanced statement yet, so it is not rated for your cat.'],
      [SPECIES, base, 'It is made for your cat’s species and its main ingredients are named by source; Purrbi has not found its complete and balanced statement yet, so it is not rated for your cat.'],
      [SPECIES, base, 'TEST FIXTURE Gravies for cats has its main ingredients named by source; Purrbi has not found its complete and balanced statement yet, so it is not rated for your cat.'],
      [null, base, 'A retailer lists it as made for cats, and its main ingredients are named by source; Purrbi has not found its complete and balanced statement yet, so it is not rated for your cat.'],
      [null, base, 'Purrbi couldn’t confirm it is made for cats, but its main ingredients are named by source; it is not rated for your cat until Purrbi finds its complete and balanced statement.'],
      [null, base, 'It is made for cats, according to a retailer’s listing, and its main ingredients are named by source; it is not rated for your cat until Purrbi finds its feeding statement.'],
      // The retailer's own title says "Cat Food": repeating the name is not Purrbi's claim.
      [null, catFoodName, 'This TEST FIXTURE Gravies cat food has its main ingredients named by source; it is not rated for your cat yet, as Purrbi has not found its complete and balanced statement.'],
    ];
    for (const [expected, input, text] of table) expect([text, checkVerdict(text, input)]).toEqual([text, expected]);
    // The rule-based verdict passes both checks.
    for (const input of [base, catFoodName, otherMissing]) expect(checkVerdict(ruleVerdict(input), input)).toBeNull();
  });
  // Re-review: a hedge counts only right in front of the claim; what the basis says is not found yet counts as not found.
  it('a hedge counts only right in front of the claim, and items the score’s basis has not found are checked too', () => {
    const base = {
      product: { name: 'TEST FIXTURE Gravies', brand: 'TESTBRAND', species: 'cat', category: 'complete_food', speciesConfirmed: false, speciesBasis: 'retailer listing' },
      assessment: { score: null as number | null, provisional: false, label: 'Information incomplete', basis: '', withheldReason: '', missing: 'nutritional adequacy ("complete and balanced") statement' },
      pet: { name: 'your cat', species: 'cat', fit: 'incomplete', headline: '' },
      positives: [{ title: 'Main ingredients named by source', detail: 'The first 5 main ingredients each say which animal or plant they come from.', value: '' }],
      cautions: [],
      unresolved: [],
    };
    const dog = { ...base, pet: { name: 'your dog', species: 'dog', fit: 'incomplete', headline: '' } };
    const scored = (basis: string, category = 'complete_food') => ({ ...base, product: { ...base.product, category, speciesConfirmed: true }, assessment: { ...base.assessment, score: 91, label: 'Strong', basis, missing: '' } });
    const caloriesNotFound = scored('Scored on the parts found (90 of 100 points’ worth); calorie content statement, further guarantees not found yet.');
    const treatAnalysisNotFound = scored('Scored on the parts found (70 of 100 points’ worth); feeding statement, guaranteed analysis (protein, fat, fiber) not found yet.', 'treat');
    const everythingFound = scored('Scored on every part Purrbi uses for this product type.', 'treat');
    const tail = ' Its main ingredients are named by source, and the details and their sources are listed below for you to check.';
    const LACKS = 'says the product lacks what Purrbi has not found';
    const SPECIES = 'states who it is for as confirmed when only a retailer lists it';
    const table: [string | null, typeof base, string][] = [
      // A hedge word earlier in the sentence does not make the claim a hedge.
      [SPECIES, base, `A retailer lists it and it is made for cats.${tail}`],
      [SPECIES, base, `It is listed by a retailer and is formulated for cats.${tail}`],
      [SPECIES, base, `Purrbi checked the listing and says it is made for cats.${tail}`],
      [SPECIES, base, `Your cat may enjoy it since it is made for cats.${tail}`],
      [SPECIES, base, `It isn’t a treat but a food made for cats.${tail}`],
      [SPECIES, base, `It is made for cats.${tail}`],
      // Right in front of it, or an attribution right after it.
      [null, base, `A retailer lists it for cats.${tail}`],
      [null, base, `It is listed for cats by a retailer.${tail}`],
      [null, base, `Only a retailer’s listing says it is for cats.${tail}`],
      [null, base, `It is made for cats, according to a retailer’s listing.${tail}`],
      [null, dog, `Purrbi couldn’t confirm whether it is also meant for dogs.${tail}`],
      [null, dog, `It isn’t confirmed as made for dogs.${tail}`],
      [null, dog, `It is not confirmed to be for dogs.${tail}`],
      [null, dog, `It is unclear whether it is also for dogs.${tail}`],
      [null, dog, `It may not be for dogs.${tail}`],
      // A complete food's calories and a treat's analysis, not found yet though not missing for the score.
      [LACKS, caloriesNotFound, 'Purrbi scores it 91/100 (strong), but it doesn’t list its calorie content, so check portions for your cat; its main ingredients are named by source.'],
      [LACKS, caloriesNotFound, 'Purrbi scores it 91/100 (strong), but the package doesn’t list how many calories it has; its main ingredients are named by source for your cat.'],
      [LACKS, caloriesNotFound, 'Purrbi scores it 91/100 (strong), but its calorie content is missing, so check portions carefully for your cat; its main ingredients are named by source, as listed below.'],
      [null, caloriesNotFound, 'Purrbi scores it 91/100 (strong); Purrbi has not found its calorie content yet, so check portions for your cat. Its main ingredients are named by source.'],
      [LACKS, treatAnalysisNotFound, 'Purrbi scores this treat 91/100 (strong), but it has no guaranteed analysis, so check it before feeding your cat; its main ingredients are named by source.'],
      // A treat labeled for intermittent feeding truly isn't labeled complete and balanced.
      [null, everythingFound, 'Purrbi scores this treat 91/100 (strong); it isn’t labeled complete and balanced, as it is for intermittent feeding, and its main ingredients are named by source.'],
      [LACKS, base, `It lacks clear nutritional information, so it is not rated for your cat.${tail}`],
      [LACKS, base, `Its nutritional adequacy statement is missing from the label, so it is not rated for your cat.${tail}`],
    ];
    for (const [expected, input, text] of table) expect([text, checkVerdict(text, input)]).toEqual([text, expected]);
    // Through the pipeline: a dog and a product only a retailer lists for cats; the rule-based verdict passes the checks.
    const f = facts();
    const scope = { ...scopeOf(f), speciesEvidence: { set: ['cat' as const], confirmed: false, basis: 'retailer_listing' as const, disputed: false, note: '' } };
    const general = assessGeneral(f, scope);
    const rex = pet({ species: 'dog', name: 'Rex' });
    const personal = personalize(rex, f, scope, general, noRecall, NOW);
    const highlights = buildHighlights({ facts: f, scope, general, personal, recall: noRecall });
    expect(highlights.cautions.some((h) => /couldn’t confirm whether it is also for dogs/.test(h.detail))).toBe(true);
    const v = verdictInput({
      productName: 'TEST FIXTURE Chicken Recipe', brand: 'TESTBRAND', species: scope.species, speciesConfirmed: false, speciesBasis: 'retailer listing', category: general.category,
      score: general.score, provisional: general.scoreProvisional, scoreLabel: general.scoreLabel, scoreBasis: general.scoreBasis, withheldReason: general.scoreWithheldReason ?? '', missing: general.missingForScore,
      coverage: general.scoreCoverage, low: general.scoreMinPossible ?? null, high: general.scoreMaxPossible, pet: { name: rex.name, species: rex.species, fit: personal.state, headline: personal.headline },
      positives: highlights.positives, cautions: highlights.cautions, unresolved: personal.unresolved,
    });
    expect(checkVerdict(ruleVerdict(v), v)).toBeNull();
  });
  // Second review of verdict 2.2.0: the subject decides who a "lacks" is about, not a "source" or "Purrbi" nearby; the
  // usual lead words and forms of the item; and Purrbi's own findings are not its claim.
  it('a “lacks” is about the product unless its subject is Purrbi or what it read; Purrbi’s own finding words are not a species claim', () => {
    const base = {
      product: { name: 'TEST FIXTURE Gravies', brand: 'TESTBRAND', species: 'cat', category: 'complete_food', speciesConfirmed: true, speciesBasis: 'retailer listing' },
      assessment: { score: null as number | null, provisional: false, label: 'Information incomplete', basis: '', withheldReason: '', missing: 'nutritional adequacy ("complete and balanced") statement' },
      pet: { name: 'your cat', species: 'cat', fit: 'incomplete', headline: '' },
      positives: [{ title: 'Main ingredients named by source', detail: 'The first 5 main ingredients each say which animal or plant they come from.', value: '' }],
      cautions: [],
      unresolved: [],
    };
    const unconfirmed = { ...base, product: { ...base.product, speciesConfirmed: false } };
    const otherMissing = { ...base, assessment: { ...base.assessment, missing: 'guaranteed analysis and the calorie content' } };
    const moisture = { ...base, assessment: { ...base.assessment, missing: 'moisture guarantee (to compare protein and fat on a dry-matter basis)' } };
    const LACKS = 'says the product lacks what Purrbi has not found';
    const SPECIES = 'states who it is for as confirmed when only a retailer lists it';
    const table: [string | null, typeof base, string][] = [
      [LACKS, base, 'This food lists the main ingredients by source but lacks a nutritional adequacy statement, so its suitability for your cat cannot be fully assessed yet.'],
      [LACKS, base, 'It lists its main ingredients by source and lacks a nutritional adequacy statement, so it may not be a complete diet and is not rated for your cat.'],
      [LACKS, base, 'Its main ingredients are named by source but it doesn’t include a guaranteed analysis, so its protein and fat are unknown and it is not rated for your cat.'],
      [LACKS, base, 'Its main ingredients are named by source; Purrbi notes that it lacks a nutritional adequacy statement, so it may not be a complete diet and is not rated for your cat.'],
      [LACKS, base, 'Its main ingredients are named by source, but it lacks an AAFCO nutritional adequacy statement, so it may not be a complete diet and is not rated for your cat.'],
      [LACKS, base, 'Its main ingredients are named by source, but it lacks the required nutritional adequacy statement, so it may not be a complete diet and is not rated for your cat.'],
      [LACKS, base, 'Its main ingredients are named by source, but it lacks a statement of nutritional adequacy, so it may not be a complete diet and is not rated for your cat.'],
      [LACKS, base, 'Its main ingredients are named by source, but it lacks the adequacy statement usually found on complete foods, so it is not rated for your cat.'],
      [LACKS, moisture, 'Its main ingredients are named by source and it is labeled complete and balanced for adult maintenance, but the label has no moisture guarantee, so it is not rated for your cat.'],
      [null, base, 'The retailer’s listing for this product has no adequacy statement, so Purrbi cannot rate it for your cat yet; its main ingredients are named by source and listed below.'],
      [null, base, 'The retailer’s product page has no adequacy statement, so Purrbi cannot rate it for your cat yet; its main ingredients are named by source and listed below.'],
      [null, base, 'Purrbi’s record for this product has no adequacy statement, so it is not rated for your cat yet; its main ingredients are named by source and listed below.'],
      [null, otherMissing, 'Its main ingredients are named by source, but its calorie content is not listed in Purrbi’s sources, which makes portions harder to judge, and it is not rated for your cat.'],
      [SPECIES, unconfirmed, 'This wet food is not rated yet but is made for cats, and its main ingredients are named by source; Purrbi has not found its complete and balanced statement.'],
      [SPECIES, unconfirmed, 'The package says it is made for adult cats, and its main ingredients are named by source; Purrbi has not found its complete and balanced statement, so it is not rated yet.'],
      [SPECIES, unconfirmed, 'Its label says it is formulated for adult cats and its main ingredients are named by source; Purrbi has not found its complete and balanced statement, so it is not rated yet.'],
      // A short name is not a hiding place: "Adult" or "Indoor" as the name or brand.
      [SPECIES, { ...unconfirmed, product: { ...unconfirmed.product, name: 'Adult' } }, 'This dry food is formulated for adult cats and its main ingredients are named by source; Purrbi has not found its complete and balanced statement, so it is not rated yet.'],
      [SPECIES, { ...unconfirmed, product: { ...unconfirmed.product, brand: 'Indoor' } }, 'This dry food is formulated for indoor cats and its main ingredients are named by source; Purrbi has not found its complete and balanced statement, so it is not rated yet.'],
    ];
    for (const [expected, input, text] of table) expect([text, checkVerdict(text, input)]).toEqual([text, expected]);
    // Through the pipeline: a jerky treat only a retailer lists for dogs, with propylene glycol (its note says "prohibited
    // in or on cat food"), for a cat and for no pet. The rule-based verdict and the alert in the input's words pass.
    const jerky = facts({ productName: { value: 'TEST FIXTURE Beef Jerky Strips', source: facts().productName!.source }, ingredientsText: 'Beef, glycerin, sugar, propylene glycol, salt, natural smoke flavor', adequacyText: '', classificationSignals: [] });
    for (const p of [pet(), null]) {
      const scope = classifyScope({ origin: 'opff', categoriesTags: [], texts: ['TEST FIXTURE Beef Jerky Strips', 'Dog Treats'], ingredientsText: jerky.ingredientsText?.value, adequacy: jerky.adequacy?.value, speciesClaims: [{ text: 'Dog Treats', basis: 'retailer_listing', source: 's0' }] });
      const general = assessGeneral(jerky, scope);
      const personal = personalize(p, jerky, scope, general, noRecall, NOW);
      const highlights = buildHighlights({ facts: jerky, scope, general, personal, recall: noRecall });
      const v = verdictInput({
        productName: 'TEST FIXTURE Beef Jerky Strips', brand: 'TESTBRAND', species: scope.species, speciesConfirmed: scope.speciesEvidence ? scope.speciesEvidence.confirmed : false, speciesBasis: 'retailer listing', category: general.category,
        score: general.score, provisional: general.scoreProvisional, scoreLabel: general.scoreLabel, scoreBasis: general.scoreBasis, withheldReason: general.scoreWithheldReason ?? '', missing: general.missingForScore,
        coverage: general.scoreCoverage, low: general.scoreMinPossible ?? null, high: general.scoreMaxPossible, concerns: general.criticalConcerns.map((c) => c.split(':')[0]),
        pet: p ? { name: p.name, species: p.species, fit: personal.state, headline: personal.headline } : null,
        positives: highlights.positives, cautions: highlights.cautions, unresolved: personal.unresolved,
      });
      expect(v.product.speciesConfirmed).toBe(false);
      expect(v.cautions[0]?.detail).toMatch(/in or on cat food/);
      expect(checkVerdict(ruleVerdict(v), v)).toBeNull();
      if (p) expect(checkVerdict(`Propylene glycol is prohibited in cat food because it affects cats’ red blood cells, and only a retailer lists this treat for dogs, so its Purrbi score is ${v.assessment.score}/100 (serious concern) for your cat.`, v)).toBeNull();
    }
  });
});
