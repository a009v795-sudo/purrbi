// Merging product facts from several sources and deciding what is still missing.
import { ingredientsInUse, rowsInUse21, type ValidatedLabel } from '../ai/labelExtract';
import { hasCoreGuaranteedAnalysis } from '../domain/nutrition';
import type { ProductCategory, ProductFacts, ScopeResult, SourceRef } from '../domain/types';

type FactKey = 'productName' | 'brand' | 'imageUrl' | 'ingredientsText' | 'ingredients' | 'guaranteedAnalysis' | 'calories' | 'adequacy' | 'feedingDirections' | 'activeIngredients';
export const FACT_KEYS: FactKey[] = ['productName', 'brand', 'imageUrl', 'ingredientsText', 'ingredients', 'guaranteedAnalysis', 'calories', 'adequacy', 'feedingDirections', 'activeIngredients'];

/**
 * Fills fields that `base` lacks from `extra`. Existing facts are never overwritten, with one exception:
 * an analysis without the required protein, fat and fiber guarantees (e.g. one row verified on a web page)
 * gives way to a fuller one, so a partial reading never blocks the label photo that completes it.
 */
export function fillMissing(base: ProductFacts, extra: Partial<ProductFacts>): { facts: ProductFacts; filled: string[] } {
  const facts: ProductFacts = { ...base, classificationSignals: [...base.classificationSignals], sources: [...base.sources] };
  const filled: string[] = [];
  const partialAnalysis = (ga: ProductFacts['guaranteedAnalysis']) => !!ga && !hasCoreGuaranteedAnalysis(ga.value);
  const fuller = partialAnalysis(facts.guaranteedAnalysis) && !!extra.guaranteedAnalysis && (hasCoreGuaranteedAnalysis(extra.guaranteedAnalysis.value) || extra.guaranteedAnalysis.value.length > facts.guaranteedAnalysis!.value.length);
  for (const k of FACT_KEYS) {
    const v = extra[k];
    if (v && (!facts[k] || (k === 'guaranteedAnalysis' && fuller))) {
      (facts as unknown as Record<string, unknown>)[k] = v;
      filled.push(k);
    }
  }
  if (extra.classificationSignals) facts.classificationSignals.push(...extra.classificationSignals);
  for (const s of extra.sources ?? []) {
    const i = facts.sources.findIndex((x) => x.sourceId === s.sourceId);
    if (i < 0) facts.sources.push(s);
    // A newer read of the same panel or page that supplied something is the one the source list names.
    else if (filled.some((k) => (facts as unknown as Record<string, { source?: SourceRef } | undefined>)[k]?.source?.sourceId === s.sourceId) && s.retrievedAt > facts.sources[i].retrievedAt) facts.sources[i] = s;
  }
  if (!facts.ingredientsLanguage && extra.ingredientsLanguage) facts.ingredientsLanguage = extra.ingredientsLanguage;
  return { facts, filled };
}

const ENRICHMENT_SOURCES = new Set(['database_image', 'manufacturer', 'retailer_or_web', 'verified_label']);

/**
 * Removes enrichment made under older rules, so it is done again: facts read from database label images
 * by a label reader no longer in use, and facts or statements taken from web pages by older research rules.
 */
export function dropStaleImageReads(facts: ProductFacts, readersInUse: ReadonlySet<string>, researchInUse?: ReadonlySet<string>): { facts: ProductFacts; dropped: string[]; setAside: string[] } {
  // What label reader 2.1.0 read, as the current rules use it. An analysis with a row it may have misread:
  // a database image's is read again (dropped); a matched label photo's, which cannot be read again, keeps
  // only its plain rows. An ingredient list it let run into an analysis is cut again.
  const ga = facts.guaranteedAnalysis;
  const from21 = (f: { source: SourceRef } | undefined) => f?.source.readerVersion === 'label-extract-2.1.0';
  const kept = ga && from21(ga) ? rowsInUse21(ga.value) : null;
  if (ga && kept && kept.length < ga.value.length) {
    const out: ProductFacts = { ...facts };
    const reread = ga.source.sourceType === 'database_image';
    if (reread || !kept.length) delete out.guaranteedAnalysis;
    else out.guaranteedAnalysis = { ...ga, value: kept };
    const rest = dropStaleImageReads(out, readersInUse, researchInUse);
    const n = ga.value.length - kept.length;
    const note = `${n} analysis row${n === 1 ? '' : 's'} from ${ga.source.sourceName} that the earlier label reader may have misread ${n === 1 ? 'was' : 'were'} set aside${reread ? '; the image is read again' : ''}`;
    return { facts: rest.facts, dropped: rest.dropped, setAside: [note, ...rest.setAside] };
  }
  const list = facts.ingredientsText && from21(facts.ingredientsText) ? ingredientsInUse(facts.ingredientsText.value) : null;
  if (list && list.text !== facts.ingredientsText!.value) {
    const out: ProductFacts = { ...facts };
    if (list.ingredients.length) {
      out.ingredientsText = { ...facts.ingredientsText!, value: list.text };
      out.ingredients = { value: list.ingredients, source: facts.ingredientsText!.source };
    } else {
      delete out.ingredientsText;
      delete out.ingredients;
    }
    const rest = dropStaleImageReads(out, readersInUse, researchInUse);
    return { facts: rest.facts, dropped: rest.dropped, setAside: [`The ingredient list from ${facts.ingredientsText!.source.sourceName} was cut where its analysis starts (the earlier label reader ran on into it)`, ...rest.setAside] };
  }
  const stale = (s: SourceRef | undefined) =>
    (s?.sourceType === 'database_image' && !readersInUse.has(s.readerVersion ?? '')) ||
    (!!researchInUse && (s?.sourceType === 'manufacturer' || s?.sourceType === 'retailer_or_web') && !researchInUse.has(s.readerVersion ?? ''));
  const staleIds = new Set(facts.sources.filter(stale).map((s) => s.sourceId));
  if (!staleIds.size) return { facts, dropped: [], setAside: [] };
  const out: ProductFacts = { ...facts, sources: facts.sources.filter((s) => !staleIds.has(s.sourceId)), classificationSignals: facts.classificationSignals.filter((c) => !staleIds.has(c.source)) };
  const dropped: string[] = [];
  for (const k of FACT_KEYS) {
    if (stale((out[k] as { source?: SourceRef } | undefined)?.source)) {
      delete (out as unknown as Record<string, unknown>)[k];
      dropped.push(k);
    }
  }
  return { facts: out, dropped, setAside: [] };
}

/** Facts that came from enrichment (database label images, verified web pages), to carry over when the database record is re-fetched. */
export function enrichmentFacts(facts: ProductFacts | undefined): Partial<ProductFacts> {
  if (!facts) return {};
  const sources = facts.sources.filter((s) => ENRICHMENT_SOURCES.has(s.sourceType));
  const ids = new Set(sources.map((s) => s.sourceId));
  const out: Partial<ProductFacts> = { sources, classificationSignals: facts.classificationSignals.filter((c) => ids.has(c.source)) };
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
  out.classificationSignals = signals.filter((t): t is string => !!t).map((text) => ({ text, source: source.sourceId, kind: 'photo' as const }));
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
