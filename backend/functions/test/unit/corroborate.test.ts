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
    expect(corroborateLabel(reading({ guaranteedAnalysis: GA_FULL }), null)).toMatchObject({ stage: 'extracted', agreements: [], conflicts: [] });
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
