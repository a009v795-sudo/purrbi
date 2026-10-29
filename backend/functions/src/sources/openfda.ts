// FDA recall evidence from openFDA food enforcement reports (https://open.fda.gov/apis/food/enforcement/).
// Coverage limits, always shown to users: the data is updated weekly and does not include every FDA
// animal-product notice, so "none found" is not proof that no recall exists.
import { textContainsGtin } from '../domain/barcode';
import { normalizeIngredientName } from '../domain/ingredients';
import type { RecallCheck, RecallRecord, SourceRef } from '../domain/types';
import { httpJson, SourceError } from '../util/http';

const ENDPOINT = 'https://api.fda.gov/food/enforcement.json';
const COVERAGE = 'openFDA enforcement data is updated weekly and doesn\u2019t include every FDA animal-product notice.';
const PET_TERMS = /\b(dogs?|cats?|pets?|canine|feline|kittens?|pupp(y|ies)|animal food|pet food|treats?|kibble)\b/i;

interface EnforcementResult {
  recall_number?: string;
  status?: string;
  classification?: string;
  reason_for_recall?: string;
  report_date?: string;
  recall_initiation_date?: string;
  product_description?: string;
  code_info?: string;
  recalling_firm?: string;
}

function quote(term: string): string {
  return `"${term.replace(/["\\]/g, ' ').replace(/\s+/g, ' ').trim()}"`;
}

function tokenOverlap(a: string, b: string): number {
  const ta = new Set(normalizeIngredientName(a).split(/[^a-z0-9]+/).filter((t) => t.length > 2));
  const tb = new Set(normalizeIngredientName(b).split(/[^a-z0-9]+/).filter((t) => t.length > 2));
  if (!ta.size) return 0;
  let hit = 0;
  for (const t of ta) if (tb.has(t)) hit++;
  return hit / ta.size;
}

const fmtDate = (yyyymmdd?: string) =>
  yyyymmdd && /^\d{8}$/.test(yyyymmdd) ? `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}` : yyyymmdd ?? '';

export async function checkRecalls(
  input: { brand?: string; productName?: string; gtin14: string },
  now: Date,
  apiKey?: string,
): Promise<RecallCheck> {
  const checkedAt = now.toISOString();
  if (!input.brand) {
    return { status: 'not_checked', summary: 'The brand is unknown, so FDA recall records could not be searched.', checkedAt, source: null, records: [] };
  }
  const brand = input.brand.trim();
  const search = `(recalling_firm:${quote(brand)}+product_description:${quote(brand)})`;
  const url = `${ENDPOINT}?search=${encodeURIComponent(search).replace(/%2B/g, '+')}&limit=100&sort=report_date:desc${apiKey ? `&api_key=${encodeURIComponent(apiKey)}` : ''}`;
  const source: SourceRef = {
    sourceId: `openfda:enforcement:${brand.toLowerCase()}`,
    sourceType: 'official_notice',
    sourceName: 'FDA enforcement reports (openFDA)',
    url: 'https://open.fda.gov/apis/food/enforcement/',
    retrievedAt: checkedAt,
    matchConfidence: 'brand_only',
    license: 'Public domain (U.S. government data)',
  };
  let results: EnforcementResult[] = [];
  try {
    const { status, json } = await httpJson<{ results?: EnforcementResult[] }>(url, { source: 'openFDA', timeoutMs: 8000, retries: 1, acceptStatuses: [404] });
    if (status !== 404 && !Array.isArray(json?.results)) throw new SourceError('openFDA', 'parse', `unexpected answer (HTTP ${status})`);
    results = status === 404 ? [] : json!.results!;
  } catch (err) {
    const kind = err instanceof SourceError ? err.kind : 'network';
    return { status: 'unavailable', summary: `The FDA recall check couldn\u2019t be completed right now (${kind}). Try again later.`, checkedAt, source: null, records: [] };
  }

  const records: RecallRecord[] = [];
  for (const r of results) {
    const text = `${r.product_description ?? ''} ${r.code_info ?? ''}`;
    if (!PET_TERMS.test(`${r.product_description ?? ''} ${r.reason_for_recall ?? ''}`)) continue;
    const exact = textContainsGtin(text, input.gtin14);
    const nameMatch = input.productName ? tokenOverlap(input.productName, r.product_description ?? '') >= 0.6 : false;
    records.push({
      recallNumber: r.recall_number ?? '',
      status: r.status ?? '',
      classification: r.classification ?? '',
      reason: (r.reason_for_recall ?? '').slice(0, 500),
      reportDate: fmtDate(r.report_date),
      productDescription: (r.product_description ?? '').slice(0, 600),
      recallingFirm: r.recalling_firm ?? '',
      match: exact ? 'exact_barcode' : nameMatch ? 'brand_and_product' : 'brand_only',
    });
  }
  const active = (r: RecallRecord) => /^(ongoing|pending)$/i.test(r.status);
  const exactActive = records.filter((r) => r.match === 'exact_barcode' && active(r));
  const possibleActive = records.filter((r) => r.match === 'brand_and_product' && active(r));
  const top = [...exactActive, ...possibleActive, ...records.filter((r) => !exactActive.includes(r) && !possibleActive.includes(r))].slice(0, 10);

  if (exactActive.length) {
    return { status: 'exact_active', summary: `An active FDA recall record lists this product\u2019s barcode (${exactActive[0].recallNumber}). Check the lot code and stop feeding affected lots. ${COVERAGE}`, checkedAt, source: { ...source, matchConfidence: 'exact_barcode' }, records: top };
  }
  if (possibleActive.length) {
    return { status: 'possible_active', summary: `An active FDA recall from ${brand} may involve this product; it doesn\u2019t list this barcode. Compare the lot codes. ${COVERAGE}`, checkedAt, source: { ...source, matchConfidence: 'brand_and_product' }, records: top };
  }
  if (records.length) {
    // Said as it is: a closed recall of this barcode is named; open records of other products are counted, not hidden.
    const years = [...new Set(records.map((r) => r.reportDate.slice(0, 4)).filter(Boolean))].sort();
    const closedExact = records.find((r) => r.match === 'exact_barcode');
    const openOther = records.filter((r) => active(r)).length;
    const lead = closedExact
      ? `A closed FDA recall listed this barcode (${closedExact.recallNumber}, ${closedExact.status || 'not active'}); no open recall matches it.`
      : 'No FDA recall record matches this product\u2019s barcode or name.';
    const other = `${brand} has ${records.length} pet-product enforcement record${records.length > 1 ? 's' : ''}${years.length ? ` (${years[0]}\u2013${years[years.length - 1]})` : ''}${openOther ? `, ${openOther} still open, for other products` : ''}, shown for context.`;
    return { status: 'brand_history', summary: `${lead} ${other} ${COVERAGE}`, checkedAt, source, records: top };
  }
  return { status: 'none_found', summary: `No FDA enforcement record for ${brand} pet products was found in openFDA. ${COVERAGE}`, checkedAt, source, records: [] };
}
