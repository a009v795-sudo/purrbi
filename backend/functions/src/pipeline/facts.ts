// Merging product facts from several sources and deciding what is still missing.
import { ingredientsInUse, rowsInUse21, type ValidatedLabel } from '../ai/labelExtract';
import { dryMatterPercent, findNutrient, hasCoreGuaranteedAnalysis } from '../domain/nutrition';
import { stillNeededOnceListed } from '../domain/score';
import type { GeneralAssessment, GuaranteedAnalysisEntry } from '../domain/types';
import type { ProductCategory, ProductFacts, ScopeResult, SourceRef } from '../domain/types';

type FactKey = 'productName' | 'brand' | 'imageUrl' | 'ingredientsText' | 'ingredients' | 'guaranteedAnalysis' | 'calories' | 'adequacy' | 'feedingDirections' | 'activeIngredients' | 'packageSize';
export const FACT_KEYS: FactKey[] = ['productName', 'brand', 'imageUrl', 'ingredientsText', 'ingredients', 'guaranteedAnalysis', 'calories', 'adequacy', 'feedingDirections', 'activeIngredients', 'packageSize'];

/** A moisture guarantee in % that a dry-matter comparison can use (the scorer needs it for a complete food). */
export function hasUsableMoisture(ga: GuaranteedAnalysisEntry[] | undefined): boolean {
  const m = findNutrient(ga, 'moisture');
  return m?.unit === '%' && dryMatterPercent(10, m.value) !== null;
}

/**
 * Fills fields that `base` lacks from `extra`. Existing facts are never overwritten, with two exceptions:
 * an analysis without the required protein, fat and fiber guarantees (e.g. one row verified on a web page)
 * gives way to a fuller one, so a partial reading never blocks the label photo that completes it; and a
 * feeding statement that names no species, life stage or standard gives way to one that does.
 */
const CORE_ROWS = ['crude_protein', 'crude_fat', 'crude_fiber'] as const;
/** A reading's row `x` gives the row in use `r`: the same value and unit, and its min/max unless `r` states none. */
const sameRow = (r: GuaranteedAnalysisEntry, x: GuaranteedAnalysisEntry | undefined) =>
  !!x && x.unit === r.unit && (x.qualifier === r.qualifier || r.qualifier === 'not_stated') && Math.abs(x.value - r.value) < 1e-9;
const rowKey = (e: GuaranteedAnalysisEntry) => (e.nutrient === 'other' ? `other|${e.label.toLowerCase()}` : e.nutrient);

/**
 * For one owner's result only (2.5.1, reviews of 2.5.1): what an owner's own reading of the label adds to an analysis in
 * use that has no usable moisture guarantee. The reading must give a usable moisture guarantee and exactly the protein,
 * fat and fiber of the analysis in use (the same value and unit, and the same min/max where the analysis in use states
 * one), the rows the moisture is used with for the dry-matter comparison. It adds its moisture guarantee and every row
 * the analysis in use lacks; the rows in use stay as they are. A reading that differs on protein, fat or fiber adds
 * nothing: which analysis is this package's is unclear. The shared record never gets it (it is written before).
 */
export function rowsFromOwnReading(inUse: GuaranteedAnalysisEntry[] | undefined, readings: GuaranteedAnalysisEntry[][]): { reading: GuaranteedAnalysisEntry[]; added: GuaranteedAnalysisEntry[] } | null {
  if (!inUse?.length || hasUsableMoisture(inUse)) return null;
  const reading = readings.find((c) => hasUsableMoisture(c) && CORE_ROWS.every((k) => !!findNutrient(inUse, k) && sameRow(findNutrient(inUse, k)!, findNutrient(c, k))));
  if (!reading) return null;
  const moisture = findNutrient(reading, 'moisture')!;
  const have = new Set(inUse.filter((e) => e.nutrient !== 'moisture').map(rowKey));
  return { reading, added: reading.filter((e) => (e.nutrient === 'moisture' ? e === moisture : !have.has(rowKey(e)))) };
}

/** How an owner's reading's protein, fat and fiber differ from the analysis in use ("crude fat 6% vs 5.5%"), for its note. */
export function coreDifferences(inUse: GuaranteedAnalysisEntry[] | undefined, reading: GuaranteedAnalysisEntry[]): string[] {
  return CORE_ROWS.flatMap((k) => {
    const a = findNutrient(inUse, k);
    const b = findNutrient(reading, k);
    if (!a && !b) return [];
    if (a && sameRow(a, b)) return [];
    const name = k.replace('crude_', 'crude ');
    return [`${name} ${b ? `${b.value}${b.unit}` : 'not read'} vs ${a ? `${a.value}${a.unit}` : 'none'}`];
  });
}

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

/** Pages Purrbi itself found showing this barcode: a result page it checked, or a page that shows only the barcode (a price list). */
export function barcodeHosts(discarded: string[]): string[] {
  const hosts = discarded.map((d) => /^(?:[^:]+: )?(\S+) (?:\((?:a search result|a page the model opened)\) shows this barcode|shows this barcode but nothing else about the product)/.exec(d)?.[1]);
  return [...new Set(hosts.filter((h): h is string => !!h))];
}

/**
 * Pages the search named for this barcode that turn automated readers away (HTTP 401, 403), from research's notes.
 * Asking again won't change it (trace 6402eaaf-3d7: eBay, Ubuy). A page that is gone (404, 410) is not one, nor a site
 * the same run read on another address (a result page it checked).
 */
export function refusingHosts(discarded: string[]): string[] {
  const read = new Set(barcodeHosts(discarded));
  for (const d of discarded) for (const item of /result pages without this barcode: (.*)$/.exec(d)?.[1].split(', ') ?? []) read.add(item.split(' ')[0]);
  const hosts = discarded.map((d) => /^(?:[^:]+: )?(\S+) refuses automated readers(?: or has no such page)? \(HTTP (\d+)\)/.exec(d)).filter((m): m is RegExpExecArray => !!m && (m[2] === '401' || m[2] === '403') && !read.has(m[1]));
  return [...new Set(hosts.map((m) => m[1]))];
}

/**
 * A page (or pages) the search named that turned automated readers away, said of the page, not the site: the same run
 * may have read another page there (review of research 2.8.1).
 */
export function refusalOf(hosts: string[]): { said: string; it: string } {
  const one = hosts.length === 1;
  return { said: `${one ? 'A page' : 'Pages'} found for this barcode (on ${hosts.slice(0, 3).join(', ')}) ${one ? 'turns' : 'turn'} automated readers away`, it: one ? 'it' : 'them' };
}

/**
 * What a search that took nothing from a page came to, for the cards and the closing evidence note: a page that shows
 * the barcode but gave nothing (its read found nothing or was cut by the time limit, or it shows only the barcode),
 * else pages the search named that turn automated readers away, else that no page it could check shows the barcode
 * (for a finished search, nothing: the caller says no page could be matched).
 */
export function searchStop(outcome: 'done' | 'hint_failed' | 'time_limited', discarded: string[]): string | null {
  const shown = barcodeHosts(discarded);
  const refusing = refusingHosts(discarded);
  const names = (hs: string[]) => hs.slice(0, 3).join(', ');
  const later = { done: '', hint_failed: '; the barcode database wasn’t available for more search words, so Purrbi searches again once it is', time_limited: '' }[outcome];
  if (shown.length) {
    return outcome === 'time_limited'
      ? `A page showing this barcode was found (${names(shown)}), but nothing about the product was taken from it before the search ran out of the scan’s time; Purrbi searches again later.`
      : `A page showing this barcode was found (${names(shown)}), but nothing about the product could be taken from it${later}.`;
  }
  if (refusing.length) {
    const { said: refused, it } = refusalOf(refusing);
    return {
      done: `${refused}, so nothing could be checked on ${it}.`,
      hint_failed: `${refused}, and the barcode database wasn’t available for more search words; Purrbi searches again once it is.`,
      time_limited: `${refused}, and the search ran out of the scan’s time before it was done; Purrbi searches again later.`,
    }[outcome];
  }
  return {
    done: null,
    hint_failed: 'The barcode database wasn’t available, so the search had only the barcode to go on, and none of the pages it could check shows this barcode; Purrbi tries again later.',
    time_limited: 'The search ran out of the scan’s time before it was done, and no page it checked so far shows this barcode; Purrbi searches again later.',
  }[outcome];
}

/** The only page the search named was not this product (no barcode, or no brand and name to tie it). */
const MISMATCH = /does not show this product’s barcode or its brand and name/;

/**
 * Notes that say what was searched, opened, fetched or checked, never that a value was rejected: a query may name
 * "ingredients" (gpt-5-mini, test A), an address "guaranteed-analysis", a price list "no ingredients".
 */
const TRACE_ONLY =
  /^(?:[^:]+: )?(?:searched |opened |result (?:pages|documents) |model reported no matching product|no source page was named|could not fetch |nutrition document \S+ not read |\S+ not fetched \(the scan’s time limit\)|\S+ (?:refuses automated readers|has no such page)|\S+ \((?:a search result|a page the model opened)\) shows this barcode|\S+ (?:shows this barcode|lists the same recipe|matches this product by brand and name) but nothing else about the product|not (?:run|searched) \(the scan’s time limit\))/;

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
    return out('source_unavailable', page ? `A page showing this barcode was found (${page}), but not this; the barcode database wasn’t available for more search words, so Purrbi searches again once it is.` : (searchStop('hint_failed', r.discarded) ?? ''));
  }
  if (r?.outcome === 'time_limited') {
    // The scan's time limit cut the search short (a search, a check of its result pages or a read was left out).
    const page = r.source.replace(/\s*\((?:manufacturer|retailer_or_web)\)$/, '');
    return out('source_unavailable', page ? `A page showing this barcode was found (${page}), but not this; the search ran out of the scan’s time before it was done, so Purrbi searches again later.` : (searchStop('time_limited', r.discarded) ?? ''));
  }
  if (!r && ctx.researchNotRun === 'error') return out('source_unavailable', 'Purrbi’s search for the manufacturer’s page didn’t work just now; it tries again later.');
  if (ctx.images?.failed?.some((x) => panel(x) === purpose)) return out('not_read', 'The database’s label image of this panel couldn’t be read just now; Purrbi tries again later.');
  if (r) {
    // A value or page rejected by a check is said first; then, when no page was used, what stopped the search.
    const notes = r.discarded.filter((d) => !TRACE_ONLY.test(d) && !MISMATCH.test(d) && (PANEL_WORDS[purpose].test(d) || /nothing from it was used/.test(d)));
    const weak = notes.find((d) => /match(?:es|ed) only/.test(d));
    const variant = notes.find((d) => /another variant/.test(d));
    if (variant) return out('rejected', 'The page found is for another variant of this product, so nothing from it was used.');
    if (weak) return out('rejected', `A page with this product’s name was found, but it doesn’t show this barcode or the same recipe, so its ${WHAT[purpose]} used.`);
    if (notes.length) return out('rejected', `What the search found didn’t match what the page prints, so the ${WHAT[purpose]} used.`);
    if (!r.source) {
      const stop = searchStop('done', r.discarded);
      if (stop) return out(barcodeHosts(r.discarded).length ? 'not_found' : 'source_unavailable', stop);
      // The only page found was not this product: said as such, for every panel.
      if (r.discarded.some((d) => MISMATCH.test(d))) return out('rejected', 'The page the search found doesn’t show this barcode or this product’s name, so nothing from it was used.');
    }
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

/**
 * Only what is missing for this product type; a photo of several panels satisfies several requests. `scored`: the score
 * is shown, so a request completes the assessment and never says it is needed for the score (review of 2.5.1).
 */
export function missingInfo(facts: ProductFacts, scope: ScopeResult, category: ProductCategory, scored = false): PhotoRequest[] {
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
  const core = hasCoreGuaranteedAnalysis(facts.guaranteedAnalysis?.value);
  if (category === 'complete_food' && !facts.adequacy) {
    out.push({
      purpose: 'nutrition',
      title: core ? '"Complete and balanced" statement' : 'Guaranteed analysis and "complete and balanced" statement',
      reason: 'Needed to check what the food is complete and balanced for, and to score it.',
    });
  } else if ((category === 'complete_food' || category === 'treat' || category === 'complementary') && !core) {
    out.push({
      purpose: 'nutrition',
      title: 'Guaranteed analysis',
      reason: scored
        ? 'The protein, fat and fiber guarantees aren’t all listed yet; they complete the assessment.'
        : category === 'complete_food'
          ? 'Needed to compare protein and fat with the nutrient profiles, and to score it.'
          : 'Needed to score this product.',
    });
  }
  return out;
}

/**
 * The request for a moisture guarantee (2.5.1). Research and the database's label images never add one: an analysis in
 * use is never replaced by another source's (only by the owner's own reading of the whole analysis, for their result),
 * so the card says what Purrbi has rather than promising a search (review of 2.5.1).
 */
export const MOISTURE_REQUEST: PhotoRequest = { purpose: 'nutrition', title: 'Guaranteed analysis, with moisture', reason: 'Needed to compare protein and fat as dry matter, and to score it.' };
export const isMoistureRequest = (r: PhotoRequest) => r.purpose === MOISTURE_REQUEST.purpose && r.title === MOISTURE_REQUEST.title;

/** The moisture request's reason once the owner's photo of the analysis was read without one (review of 2.5.1). */
export const MOISTURE_RETAKE_REASON = 'If the panel prints one, a sharper photo of it is needed to compare protein and fat as dry matter, and to score it.';

/**
 * Why the moisture guarantee is still missing: the analysis in use, named by its source, gives none (and, `readWithout`,
 * the owner's photo of the analysis was read without one).
 */
export function moistureStatus(facts: ProductFacts, readWithout = false): FieldStatus {
  const s = facts.guaranteedAnalysis?.source;
  const from = !s ? '' : s.sourceType === 'user_label' ? ' (from your label photo)' : s.sourceType === 'verified_label' ? ' (from a label photo matched to this barcode)' : ` (from ${s.sourceName})`;
  const photo = readWithout && s?.sourceType !== 'user_label' && s?.sourceType !== 'verified_label' ? ', and your label photo of the analysis was read without one' : '';
  return { purpose: 'nutrition', status: 'not_found', detail: `The guaranteed analysis Purrbi has${from} gives no moisture guarantee${photo}.` };
}

/**
 * No dead end: the photo requests with what a withheld score still needs (2.5.1). The scorer and `missingInfo` decide
 * separately, and a gap between them left a result unscored with nothing to add. Only for a withheld score: nothing is
 * added for a scored food (review of 2.5.1). A need no request covers adds the request that supplies it. A treat's or
 * topper's need for its calorie content or feeding statement (also the one it would still have once its missing ingredient
 * list is in) rewords the nutrition request it shares a panel with, so one round of photos asks for all of it.
 */
export function withScoreNeeds(
  assessment: Pick<GeneralAssessment, 'score' | 'missingForScore' | 'category' | 'components' | 'scoreCoverage'>,
  scope: ScopeResult,
  requests: PhotoRequest[],
): PhotoRequest[] {
  if (assessment.score !== null || !assessment.missingForScore.length || scope.status !== 'supported') return requests;
  const out = requests.map((r) => ({ ...r }));
  const ask = (r: PhotoRequest, reword = false) => {
    const same = out.find((x) => x.purpose === r.purpose);
    if (!same) out.push(r);
    else if (reword) Object.assign(same, { title: r.title, reason: r.reason });
  };
  for (const m of assessment.missingForScore) {
    if (/ingredient/i.test(m)) ask({ purpose: 'ingredients', title: 'Ingredient list', reason: 'Needed to check ingredients and to score this product.' });
    else if (/moisture/i.test(m)) ask(MOISTURE_REQUEST);
    else if (/product type/i.test(m)) ask({ purpose: 'front', title: 'Front of the package', reason: 'To confirm the product name, brand, species and product type.' });
    else ask({ purpose: 'nutrition', title: 'Nutrition panel', reason: `Needed to score this product: Purrbi still needs the ${m}.` }, /calorie|feeding statement/i.test(m));
  }
  const later = stillNeededOnceListed(assessment);
  if (later) ask({ purpose: 'nutrition', title: 'Nutrition panel', reason: `Needed to score this product: with the ingredient list, Purrbi still needs the ${later}.` }, true);
  return out;
}
