// Label photo stages: what an owner's photo reading is worth beyond the owner's own result.
import { describe, expect, it } from 'vitest';
import type { ValidatedLabel } from '../../src/ai/labelExtract';
import { corroborateLabel } from '../../src/pipeline/corroborate';
import { facts, GA_FULL } from '../helpers/fixtures';

const reading = (over: Partial<ValidatedLabel> = {}): ValidatedLabel => ({
  status: 'processed', reason: '', panels: ['guaranteed_analysis'], productName: null, brand: null, species: 'unknown', productTypeClaim: null,
  ingredientsText: null, ingredients: [], guaranteedAnalysis: [], calories: [], adequacy: null, feedingDirections: null, activeIngredients: [],
  uncertainFields: [], rejected: [], model: 'test', version: 'test', ...over,
});
const RECIPE = ['Chicken', 'chicken meal', 'brown rice', 'chicken fat (preserved with mixed tocopherols)', 'dried beet pulp', 'natural flavor', 'taurine'];

describe('label photo stages', () => {
  it('extracted: read twice, nothing public to compare with', () => {
    expect(corroborateLabel(reading({ guaranteedAnalysis: GA_FULL }), null)).toMatchObject({ stage: 'extracted', agreements: [], conflicts: [], note: 'Read twice, with the same result. Nothing public to compare it with yet.' });
  });
  it('extracted: says when what it shows agrees so far, but too little to confirm the product', () => {
    const soFar = 'Read twice, with the same result. It agrees with this barcode’s public record so far, but not enough to confirm it.';
    const f = facts();
    expect(corroborateLabel(reading({ adequacy: f.adequacy!.value, calories: [{ kcal: 3800, per: 'kg' }] }), f).note).toBe(soFar);
    expect(corroborateLabel(reading({ ingredients: ['Chicken', 'chicken meal', 'brown rice'] }), f).note).toBe(soFar); // three in order: too few
    expect(corroborateLabel(reading({ guaranteedAnalysis: GA_FULL.slice(0, 1) }), f).note).toBe(soFar); // one guarantee: too few
    // A newer bag sharing 4 of its first 6 ingredients with the record, in order: neither confirmed nor disputed.
    expect(corroborateLabel(reading({ ingredients: ['Chicken', 'chicken meal', 'peas', 'brown rice', 'lentils', 'chicken fat (preserved with mixed tocopherols)'] }), f).note).toBe('Read twice, with the same result. Part of it agrees with this barcode’s public record; not enough to confirm it yet.');
    // The front's name ("ONE") is not the record's, but the calories printed on the front are.
    expect(corroborateLabel(reading({ productName: 'ONE', calories: [{ kcal: 3800, per: 'kg' }] }), f).note).toBe('Read twice, with the same result. Part of it agrees with this barcode’s public record; not enough to confirm it yet.');
  });
  it('extracted: the record has a name, but the photo’s name (a sub-brand on the front) does not match it', () => {
    // As read from a real front photo: the two readings agreed on "ONE"; the record's name is the recipe's.
    const c = corroborateLabel(reading({ productName: 'ONE', brand: 'PURINA', panels: ['front'] }), facts());
    expect(c).toMatchObject({ stage: 'extracted', agreements: [], conflicts: [] });
    expect(c.note).toBe('Read twice, with the same result. What it shows could not be matched to this barcode’s public record yet.');
  });
  it('corroborated: the name matches the record, but nothing ties the photo to this barcode', () => {
    const c = corroborateLabel(reading({ productName: 'TEST FIXTURE Chicken Recipe' }), facts());
    expect(c.stage).toBe('corroborated');
    expect(c.note).toMatch(/the product itself is not yet confirmed/);
  });
  it('verified: the barcode is on the photo, or the photo shows this barcode’s recipe in order', () => {
    expect(corroborateLabel(reading({ barcodeMatch: true }), null).stage).toBe('verified');
    const r = corroborateLabel(reading({ ingredients: RECIPE }), facts());
    expect(r.stage).toBe('verified');
    expect(r.agreements[0]).toMatch(/ingredient list matches this barcode’s record \(\d of the first \d, in order\)/);
  });
  it('disputed: another recipe or another analysis than this barcode’s record', () => {
    expect(corroborateLabel(reading({ ingredients: ['Salmon', 'potatoes', 'peas', 'canola oil', 'tapioca', 'salt'] }), facts()).stage).toBe('disputed');
    const other = GA_FULL.map((e) => (e.nutrient === 'crude_protein' ? { ...e, value: 22 } : e));
    const d = corroborateLabel(reading({ barcodeMatch: true, guaranteedAnalysis: other }), facts());
    expect(d.stage).toBe('disputed'); // a conflict outweighs the barcode
    expect(d.conflicts[0]).toMatch(/protein 22% vs 30%/);
  });
  it('never compares against the owner’s own private facts', () => {
    const own = facts();
    own.ingredients = { value: ['Salmon', 'peas', 'potatoes', 'tapioca', 'salt'], source: { ...own.ingredients!.source, sourceType: 'user_label' } };
    expect(corroborateLabel(reading({ ingredients: RECIPE }), own).stage).toBe('extracted');
  });
});

describe('a partial analysis never blocks a fuller one', () => {
  it('one verified row from a web page gives way to a complete analysis from a label', async () => {
    const { fillMissing } = await import('../../src/pipeline/facts');
    const web = { sourceId: 'web:x', sourceType: 'manufacturer' as const, sourceName: 'x', retrievedAt: '2026-10-29T00:00:00Z', matchConfidence: 'brand_and_product' as const };
    const label = { ...web, sourceId: 'label:p1', sourceType: 'user_label' as const, sourceName: 'Your label photo' };
    const base = facts({ guaranteedAnalysis: { value: [{ nutrient: 'crude_protein', label: 'Protéine', qualifier: 'not_stated', value: 37, unit: '%' }], source: web } });
    const merged = fillMissing(base, { guaranteedAnalysis: { value: GA_FULL, source: label }, sources: [label] });
    expect(merged.filled).toContain('guaranteedAnalysis');
    expect(merged.facts.guaranteedAnalysis!.source.sourceId).toBe('label:p1');
    // A complete analysis is never replaced.
    const complete = fillMissing(facts(), { guaranteedAnalysis: { value: GA_FULL.slice(0, 2), source: label } });
    expect(complete.filled).not.toContain('guaranteedAnalysis');
  });
});

describe('ingredient roles in one vocabulary', () => {
  it('maps roles written on cited pages to the curated words, and reads common French label terms', async () => {
    const { normalizeRole, ingredientRole } = await import('../../src/domain/roles');
    expect(normalizeRole('grain (wheat) — carbohydrate and protein source')).toBe('Protein source');
    expect(normalizeRole('animal fat / fat source')).toBe('Fat source');
    expect(normalizeRole('grain / carbohydrate and energy source')).toBe('Carbohydrate source');
    expect(ingredientRole('Protéines de volaille déshydratées')).toBe('Protein source');
    expect(ingredientRole('Blé (14%)')).toBe('Carbohydrate source');
    expect(ingredientRole('Graisses animales')).toBe('Fat source');
    expect(ingredientRole('Pulpe de betterave déshydratée')).toBe('Fibre source');
  });
});
