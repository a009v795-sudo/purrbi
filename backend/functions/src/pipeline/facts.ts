// Merging product facts from several sources and deciding what is still missing.
import type { ValidatedLabel } from '../ai/labelExtract';
import { hasCoreGuaranteedAnalysis } from '../domain/nutrition';
import type { ProductCategory, ProductFacts, ScopeResult, SourceRef } from '../domain/types';

type FactKey = 'productName' | 'brand' | 'imageUrl' | 'ingredientsText' | 'ingredients' | 'guaranteedAnalysis' | 'calories' | 'adequacy' | 'feedingDirections' | 'activeIngredients';
export const FACT_KEYS: FactKey[] = ['productName', 'brand', 'imageUrl', 'ingredientsText', 'ingredients', 'guaranteedAnalysis', 'calories', 'adequacy', 'feedingDirections', 'activeIngredients'];

/** Fills fields that `base` lacks from `extra`. Existing facts are never overwritten. */
export function fillMissing(base: ProductFacts, extra: Partial<ProductFacts>): { facts: ProductFacts; filled: string[] } {
  const facts: ProductFacts = { ...base, classificationSignals: [...base.classificationSignals], sources: [...base.sources] };
  const filled: string[] = [];
  for (const k of FACT_KEYS) {
    const v = extra[k];
    if (v && !facts[k]) {
      (facts as unknown as Record<string, unknown>)[k] = v;
      filled.push(k);
    }
  }
  if (extra.classificationSignals) facts.classificationSignals.push(...extra.classificationSignals);
  for (const s of extra.sources ?? []) if (!facts.sources.some((x) => x.sourceId === s.sourceId)) facts.sources.push(s);
  if (!facts.ingredientsLanguage && extra.ingredientsLanguage) facts.ingredientsLanguage = extra.ingredientsLanguage;
  return { facts, filled };
}

const ENRICHMENT_SOURCES = new Set(['database_image', 'manufacturer', 'retailer_or_web']);

/** Facts that came from enrichment (database label images, verified web pages), to carry over when the database record is re-fetched. */
export function enrichmentFacts(facts: ProductFacts | undefined): Partial<ProductFacts> {
  if (!facts) return {};
  const out: Partial<ProductFacts> = { sources: facts.sources.filter((s) => ENRICHMENT_SOURCES.has(s.sourceType)), classificationSignals: [] };
  for (const k of FACT_KEYS) {
    const f = facts[k] as { source?: { sourceType: string } } | undefined;
    if (f?.source && ENRICHMENT_SOURCES.has(f.source.sourceType)) (out as Record<string, unknown>)[k] = f;
  }
  return out;
}

export function labelToFacts(label: ValidatedLabel, source: SourceRef): Partial<ProductFacts> {
  const out: Partial<ProductFacts> = { sources: [source], classificationSignals: [] };
  if (label.productName) out.productName = { value: label.productName, source };
  if (label.brand) out.brand = { value: label.brand, source };
  if (label.ingredientsText && label.ingredients.length) {
    out.ingredientsText = { value: label.ingredientsText, source };
    out.ingredients = { value: label.ingredients, source };
  }
  if (label.guaranteedAnalysis.length) out.guaranteedAnalysis = { value: label.guaranteedAnalysis, source };
  if (label.calories.length) out.calories = { value: label.calories, source };
  if (label.adequacy) out.adequacy = { value: label.adequacy, source };
  if (label.feedingDirections) out.feedingDirections = { value: label.feedingDirections, source };
  if (label.activeIngredients?.length) out.activeIngredients = { value: label.activeIngredients, source };
  const signals = [label.productName, label.productTypeClaim, label.species !== 'unknown' ? `for ${label.species.replace('_and_', ' and ')}s` : null];
  out.classificationSignals = signals.filter((t): t is string => !!t).map((text) => ({ text, source: source.sourceId }));
  return out;
}

export type PhotoPurpose = 'front' | 'ingredients' | 'nutrition';

export interface PhotoRequest {
  purpose: PhotoPurpose;
  title: string;
  reason: string;
}

/** Only what is missing for this product type; a photo of several panels satisfies several requests. */
export function missingInfo(facts: ProductFacts, scope: ScopeResult, category: ProductCategory): PhotoRequest[] {
  if (scope.status === 'out_of_scope') return [];
  const out: PhotoRequest[] = [];
  const identityUnclear = !facts.productName || scope.status === 'unknown' || category === 'unknown';
  if (identityUnclear) {
    out.push({ purpose: 'front', title: 'Front of the package', reason: 'To confirm the product name, brand, species and product type.' });
  }
  if (category === 'supplement') {
    if (!facts.ingredients?.value.length && !facts.activeIngredients?.value.length) {
      out.push({ purpose: 'ingredients', title: 'Active and inactive ingredients', reason: 'Needed to list what the supplement contains and how much, and to check any allergies you recorded.' });
    }
    return out;
  }
  if (!facts.ingredients?.value.length) {
    out.push({ purpose: 'ingredients', title: 'Ingredient list', reason: 'Needed to check ingredients and any allergies you recorded.' });
  }
  const needsNutrition =
    (category === 'complete_food' && (!facts.adequacy || !hasCoreGuaranteedAnalysis(facts.guaranteedAnalysis?.value))) ||
    ((category === 'treat' || category === 'complementary') && !hasCoreGuaranteedAnalysis(facts.guaranteedAnalysis?.value));
  if (needsNutrition) {
    out.push({
      purpose: 'nutrition',
      title: category === 'complete_food' ? 'Guaranteed analysis and "complete and balanced" statement' : 'Guaranteed analysis',
      reason: category === 'complete_food' ? 'Needed to check what the food is complete and balanced for, and to score it.' : 'Needed to score this product.',
    });
  }
  return out;
}
