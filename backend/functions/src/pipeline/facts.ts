// Merging product facts from several sources and deciding what is still missing.
import { ingredientsInUse, rowsInUse21, type ValidatedLabel } from '../ai/labelExtract';
import { hasCoreGuaranteedAnalysis } from '../domain/nutrition';
import type { ProductCategory, ProductFacts, ScopeResult, SourceRef } from '../domain/types';

type FactKey = 'productName' | 'brand' | 'imageUrl' | 'ingredientsText' | 'ingredients' | 'guaranteedAnalysis' | 'calories' | 'adequacy' | 'feedingDirections' | 'activeIngredients' | 'packageSize';
export const FACT_KEYS: FactKey[] = ['productName', 'brand', 'imageUrl', 'ingredientsText', 'ingredients', 'guaranteedAnalysis', 'calories', 'adequacy', 'feedingDirections', 'activeIngredients', 'packageSize'];

/**
 * Fills fields that `base` lacks from `extra`. Existing facts are never overwritten, with two exceptions:
 * an analysis without the required protein, fat and fiber guarantees (e.g. one row verified on a web page)
 * gives way to a fuller one, so a partial reading never blocks the label photo that completes it; and a
 * feeding statement that names no species, life stage or standard gives way to one that does.
 */
export function fillMissing(base: ProductFacts, extra: Partial<ProductFacts>): { facts: ProductFacts; filled: string[] } {
  const facts: ProductFacts = { ...base, classificationSignals: [...base.classificationSignals], sources: [...base.sources] };
  const filled: string[] = [];
  const partialAnalysis = (ga: ProductFacts['guaranteedAnalysis']) => !!ga && !hasCoreGuaranteedAnalysis(ga.value);
  const fuller = partialAnalysis(facts.guaranteedAnalysis) && !!extra.guaranteedAnalysis && (hasCoreGuaranteedAnalysis(extra.guaranteedAnalysis.value) || extra.guaranteedAnalysis.value.length > facts.guaranteedAnalysis!.value.length);
  for (const k of FACT_KEYS) {
    const v = extra[k];
    const clearer = k === 'adequacy' && facts.adequacy?.value.type === 'unclear' && !!extra.adequacy && extra.adequacy.value.type !== 'unclear';
    if (v && (!facts[k] || (k === 'guaranteedAnalysis' && fuller) || clearer)) {
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
 * With `canReread` false (a run that cannot read sources again: a photo job, a pet change), nothing that
 * would need reading again is dropped, and `kept` says what is still from older rules. `superseded` holds
 * the web research facts dropped, so a run whose new research cannot finish can put them back.
 */
export function dropStaleImageReads(
  facts: ProductFacts,
  readersInUse: ReadonlySet<string>,
  researchInUse?: ReadonlySet<string>,
  canReread = true,
): { facts: ProductFacts; dropped: string[]; setAside: string[]; kept?: string[]; superseded?: Partial<ProductFacts> } {
  // What label reader 2.1.0 read, as the current rules use it. An analysis with a row it may have misread:
  // a database image's is read again (dropped); a matched label photo's, which cannot be read again, keeps
  // only its plain rows. An ingredient list it let run into an analysis is cut again.
  const ga = facts.guaranteedAnalysis;
  const from21 = (f: { source: SourceRef } | undefined) => f?.source.readerVersion === 'label-extract-2.1.0';
  const kept = ga && from21(ga) ? rowsInUse21(ga.value) : null;
  if (ga && kept && kept.length < ga.value.length) {
    const out: ProductFacts = { ...facts };
    const reread = ga.source.sourceType === 'database_image' && canReread;
    if (reread || !kept.length) delete out.guaranteedAnalysis;
    else out.guaranteedAnalysis = { ...ga, value: kept };
    const rest = dropStaleImageReads(out, readersInUse, researchInUse, canReread);
    const n = ga.value.length - kept.length;
    const note = `${n} analysis row${n === 1 ? '' : 's'} from ${ga.source.sourceName} that the earlier label reader may have misread ${n === 1 ? 'was' : 'were'} set aside${reread ? '; the image is read again' : ''}`;
    return { ...rest, setAside: [note, ...rest.setAside] };
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
    const rest = dropStaleImageReads(out, readersInUse, researchInUse, canReread);
    return { ...rest, setAside: [`The ingredient list from ${facts.ingredientsText!.source.sourceName} was cut where its analysis starts (the earlier label reader ran on into it)`, ...rest.setAside] };
  }
  const stale = (s: SourceRef | undefined) =>
    (s?.sourceType === 'database_image' && !readersInUse.has(s.readerVersion ?? '')) ||
    (!!researchInUse && (s?.sourceType === 'manufacturer' || s?.sourceType === 'retailer_or_web') && !researchInUse.has(s.readerVersion ?? ''));
  const staleIds = new Set(facts.sources.filter(stale).map((s) => s.sourceId));
  if (!staleIds.size) return { facts, dropped: [], setAside: [] };
  if (!canReread) return { facts, dropped: [], setAside: [], kept: facts.sources.filter((s) => staleIds.has(s.sourceId)).map((s) => s.sourceName) };
  const out: ProductFacts = { ...facts, sources: facts.sources.filter((s) => !staleIds.has(s.sourceId)), classificationSignals: facts.classificationSignals.filter((c) => !staleIds.has(c.source)) };
  const isWeb = (s: SourceRef | undefined) => s?.sourceType === 'manufacturer' || s?.sourceType === 'retailer_or_web';
  const superseded: Partial<ProductFacts> = { sources: facts.sources.filter((s) => staleIds.has(s.sourceId) && isWeb(s)), classificationSignals: facts.classificationSignals.filter((c) => staleIds.has(c.source) && isWeb(facts.sources.find((s) => s.sourceId === c.source))) };
  const dropped: string[] = [];
  for (const k of FACT_KEYS) {
    const src = (out[k] as { source?: SourceRef } | undefined)?.source;
    if (stale(src)) {
      if (isWeb(src)) (superseded as Record<string, unknown>)[k] = out[k];
      delete (out as unknown as Record<string, unknown>)[k];
      dropped.push(k);
    }
  }
  return { facts: out, dropped, setAside: [], ...(superseded.sources!.length ? { superseded } : {}) };
}

/**
 * The name and brand an earlier research method took from a page that showed this barcode: they tell research
 * what to search for, and stay the product's identity until research under the current method gives it, with
 * what that page's own words said it is (its name and product type, as the current method reads them too). Who
 * it is for and the other facts of that method are read again (it could read them elsewhere on a page, or on
 * another page than the one that proved the product).
 */
export function supersededIdentity(superseded: Partial<ProductFacts> | undefined): Partial<ProductFacts> {
  const tied = (f: { source: SourceRef } | undefined) => f?.source.matchConfidence === 'exact_barcode';
  if (!superseded || (!tied(superseded.productName) && !tied(superseded.brand))) return {};
  const ids = new Set([superseded.productName, superseded.brand].filter(tied).map((f) => f!.source.sourceId));
  return {
    ...(tied(superseded.productName) ? { productName: superseded.productName } : {}),
    ...(tied(superseded.brand) ? { brand: superseded.brand } : {}),
    sources: (superseded.sources ?? []).filter((x) => ids.has(x.sourceId)),
    classificationSignals: (superseded.classificationSignals ?? []).filter((c) => ids.has(c.source) && !/^intended for /.test(c.text)),
  };
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

/**
 * Why a requested panel's information is still missing, so a search that was never made, a source that
 * could not be reached, information that is not on the sources, a label image that could not be read and a
 * value rejected by a check are never confused (and never shown as "product unknown").
 */
export type RetrievalStatus = 'not_searched' | 'source_unavailable' | 'not_found' | 'not_read' | 'rejected';
export interface FieldStatus {
  purpose: PhotoPurpose;
  status: RetrievalStatus;
  detail: string;
}
export interface RetrievalContext {
  /** Research under the current method (research version and model), as saved (this run's or an earlier one's). */
  research?: { outcome?: 'done' | 'fetch_failed' | 'hint_failed' | 'time_limited'; discarded: string[]; source: string; at?: Date | null };
  /** Why research did not run when it was wanted and none under the current method is saved ("time_limit": too little of the scan's time was left for a search). */
  researchNotRun?: 'quota' | 'ai_budget' | 'switched_off' | 'saved_evidence' | 'error' | 'time_limit';
  /** Database label images that could not be read: definitive (`skipped`) or technical (`failed`), by panel. */
  images?: { skipped: string[]; failed?: string[] };
}

const PANEL_WORDS: Record<PhotoPurpose, RegExp> = {
  front: /intended for|product name|who it is for|cats or dogs/i,
  ingredients: /ingredient/i,
  nutrition: /analysis|adequacy|feeding statement|calori/i,
};
const WHAT: Record<PhotoPurpose, string> = { front: 'details weren’t', ingredients: 'ingredient list wasn’t', nutrition: 'nutrition details weren’t' };

export function retrievalStatus(purpose: PhotoPurpose, ctx: RetrievalContext): FieldStatus {
  const out = (status: RetrievalStatus, detail: string): FieldStatus => ({ purpose, status, detail });
  const r = ctx.research;
  const panel = (x: string) => x.split(/[,:]/)[0].trim();
  if (r?.outcome === 'fetch_failed') {
    // Some pages could not be read while others were read and were not this product.
    const reached = r.discarded.some((d) => /match(?:es|ed) only|does not show this product’s barcode|another (?:recipe|variant)/.test(d));
    return out('source_unavailable', reached ? 'A page the search found couldn’t be read, and the others it could read didn’t show this product; Purrbi tries again later.' : 'The manufacturer’s and retailers’ pages couldn’t be reached; Purrbi tries again later.');
  }
  if (r?.outcome === 'hint_failed') {
    // A page tied to the barcode was found and used, but it says nothing of who the product is for (trace cdee0a88-3ff).
    const page = r.source.replace(/\s*\((?:manufacturer|retailer_or_web)\)$/, '');
    return out('source_unavailable', page ? `A page showing this barcode was found (${page}), but not this; the barcode database wasn’t available for more search words, so Purrbi searches again once it is.` : 'The barcode database wasn’t available, so the search had only the barcode to go on and found nothing; Purrbi tries again later.');
  }
  if (r?.outcome === 'time_limited') {
    // The scan's time limit cut the search short (a search, a check of its result pages or a read was left out).
    const page = r.source.replace(/\s*\((?:manufacturer|retailer_or_web)\)$/, '');
    return out('source_unavailable', page ? `A page showing this barcode was found (${page}), but not this; the search ran out of the scan’s time before it was done, so Purrbi searches again later.` : 'The search ran out of the scan’s time before it was done, and found nothing so far; Purrbi searches again later.');
  }
  if (!r && ctx.researchNotRun === 'error') return out('source_unavailable', 'Purrbi’s search for the manufacturer’s page didn’t work just now; it tries again later.');
  if (ctx.images?.failed?.some((x) => panel(x) === purpose)) return out('not_read', 'The database’s label image of this panel couldn’t be read just now; Purrbi tries again later.');
  if (r) {
    // The pages that show this barcode turn automated readers away (trace 6402eaaf-3d7: eBay, Ubuy): asking again won't change it.
    const refusing = [...new Set(r.discarded.map((d) => /^(?:[^:]+: )?(\S+) refuses automated readers/.exec(d)?.[1]).filter((h): h is string => !!h))];
    if (refusing.length && !r.source) return out('source_unavailable', `The pages that show this barcode (${refusing.slice(0, 3).join(', ')}) turn automated readers away, so it couldn’t be checked there.`);
    // The only page found was not this product: said as such, for every panel.
    if (r.discarded.some((d) => /does not show this product’s barcode or its brand and name/.test(d)) && !r.source)
      return out('rejected', 'The page the search found doesn’t show this barcode or this product’s name, so nothing from it was used.');
    const notes = r.discarded.filter((d) => PANEL_WORDS[purpose].test(d) || /nothing from it was used/.test(d));
    const weak = notes.find((d) => /match(?:es|ed) only/.test(d));
    const variant = notes.find((d) => /another variant/.test(d));
    if (variant) return out('rejected', 'The page found is for another variant of this product, so nothing from it was used.');
    if (weak) return out('rejected', `A page with this product’s name was found, but it doesn’t show this barcode or the same recipe, so its ${WHAT[purpose]} used.`);
    if (notes.length) return out('rejected', `What the search found didn’t match what the page prints, so the ${WHAT[purpose]} used.`);
  }
  if (ctx.images?.skipped.some((x) => panel(x) === purpose)) return out('not_read', 'The database’s label image of this panel isn’t clear enough to read.');
  if (r) {
    const when = r.at ? ` (checked ${r.at.toISOString().slice(0, 10)})` : '';
    const page = r.source.replace(/\s*\((?:manufacturer|retailer_or_web)\)$/, '');
    return page ? out('not_found', `Not printed on the page matched to this barcode (${page}${when.replace(' (', ', ').replace(')', '')}).`) : out('not_found', `No manufacturer or retailer page could be matched to this barcode${when}.`);
  }
  const why = {
    quota: 'today’s searches for this account are used up',
    ai_budget: 'today’s AI checks are used up',
    switched_off: 'the manufacturer search is switched off',
    saved_evidence: 'this check reused the saved evidence, and the next full check searches for it',
    error: 'the search failed',
    time_limit: 'this scan ran out of time before the search, and the next scan searches for it',
  }[ctx.researchNotRun ?? 'saved_evidence'];
  return out('not_searched', `The manufacturer’s page hasn’t been searched yet: ${why}.`);
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
