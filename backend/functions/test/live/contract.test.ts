// LIVE contract tests against the real public services (no mocks). They need open internet, so they
// run in GitHub Actions (workflow live-contract.yml), not in the sandbox. Products are discovered from
// Open Pet Food Facts' own search, never invented. A JSON report is written to LIVE_REPORT_PATH.
import { writeFileSync } from 'node:fs';
import { afterAll, describe, expect, it } from 'vitest';
import { gs1CheckDigit, normalizeBarcode } from '../../src/domain/barcode';
import { kbSourceUrls } from '../../src/domain/kb';
import { classifyScope } from '../../src/domain/scope';
import { assessGeneral } from '../../src/domain/score';
import { checkRecalls } from '../../src/sources/openfda';
import { lookupOpenFacts, openFactsToFacts } from '../../src/sources/openFacts';
import { httpJson, httpRequest } from '../../src/util/http';

const UA = process.env.SOURCE_USER_AGENT ?? 'Purrbi/0.1 (development build; contract test)';
const report: Record<string, unknown> = { ranAt: new Date().toISOString(), userAgent: UA };
afterAll(() => {
  const path = process.env.LIVE_REPORT_PATH ?? 'live-contract-report.json';
  writeFileSync(path, JSON.stringify(report, null, 2));
  console.log(`LIVE REPORT → ${path}\n${JSON.stringify(report, null, 2).slice(0, 20000)}`);
});

interface SearchProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  categories_tags?: string[];
  ingredients_text?: string;
  nutriments?: Record<string, unknown>;
}

async function opffSearch(category: string, n: number): Promise<SearchProduct[]> {
  const fields = 'code,product_name,brands,categories_tags,ingredients_text,nutriments';
  const v2 = `https://world.openpetfoodfacts.org/api/v2/search?categories_tags_en=${category}&fields=${fields}&page_size=${n}&sort_by=unique_scans_n`;
  try {
    const { json } = await httpJson<{ products?: SearchProduct[] }>(v2, { source: 'OPFF search', headers: { 'User-Agent': UA }, timeoutMs: 20000, retries: 1 });
    if (json?.products?.length) return json.products;
  } catch (e) {
    report[`search_v2_error_${category}`] = String(e);
  }
  const legacy = `https://world.openpetfoodfacts.org/cgi/search.pl?action=process&tagtype_0=categories&tag_contains_0=contains&tag_0=${category}&json=1&page_size=${n}&fields=${fields}&sort_by=unique_scans_n`;
  const { json } = await httpJson<{ products?: SearchProduct[] }>(legacy, { source: 'OPFF search (legacy)', headers: { 'User-Agent': UA }, timeoutMs: 20000, retries: 1 });
  return json?.products ?? [];
}

describe('Open Pet Food Facts', () => {
  for (const [category, species] of [['cat-food', 'cat'], ['dog-food', 'dog'], ['dog-treats', 'dog'], ['cat-treats', 'cat']] as const) {
    it(`search returns real ${category} products and the adapter maps them`, async () => {
      const products = (await opffSearch(category, 20)).filter((p) => p.code && normalizeBarcode(p.code).ok);
      const nutrimentKeys = new Map<string, number>();
      const tagCounts = new Map<string, number>();
      const mapped: unknown[] = [];
      for (const p of products.slice(0, 8)) {
        for (const k of Object.keys(p.nutriments ?? {})) nutrimentKeys.set(k, (nutrimentKeys.get(k) ?? 0) + 1);
        for (const t of p.categories_tags ?? []) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
        const b = normalizeBarcode(p.code);
        const lookup = await lookupOpenFacts('opff', b, UA, new Date());
        if (!lookup.found) {
          mapped.push({ code: p.code, found: false });
          continue;
        }
        const facts = openFactsToFacts(lookup, b.gtin14, b.digits);
        const scope = classifyScope({ origin: 'opff', categoriesTags: facts.classificationSignals.map((s) => s.text), texts: [facts.productName?.value ?? ''] });
        const general = assessGeneral(facts, scope);
        mapped.push({
          code: p.code,
          name: facts.productName?.value,
          brand: facts.brand?.value,
          scope: scope.status,
          species: scope.species,
          category: scope.category,
          ingredients: facts.ingredients?.value.length ?? 0,
          guarantees: facts.guaranteedAnalysis?.value.map((g) => `${g.nutrient}:${g.qualifier}:${g.value}${g.unit}`) ?? [],
          calories: facts.calories?.value ?? [],
          score: general.score,
          withheld: general.scoreWithheldReason,
        });
      }
      report[`opff_${category}`] = {
        searched: products.length,
        topCategoryTags: [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25),
        nutrimentKeys: [...nutrimentKeys.entries()].sort((a, b) => b[1] - a[1]),
        mapped,
      };
      expect(products.length).toBeGreaterThan(0);
      const found = mapped.filter((m) => (m as { found?: boolean }).found !== false) as { species: string; ingredients: number }[];
      expect(found.length).toBeGreaterThan(0);
      // The species must come from the product data itself.
      expect(found.some((m) => m.species === species || m.species === 'cat_and_dog')).toBe(true);
      expect(found.some((m) => m.ingredients > 0)).toBe(true);
    });
  }
  it('an unknown barcode is reported as not found (not as an error)', async () => {
    const b = normalizeBarcode('299999999999' + gs1CheckDigit('299999999999')); // GS1 restricted-circulation range
    const r = await lookupOpenFacts('opff', b, UA, new Date());
    report.opff_not_found = r;
    expect(r.found).toBe(false);
  });
});

async function offSearch(): Promise<SearchProduct[] | 'unavailable'> {
  const urls = [
    'https://world.openfoodfacts.org/api/v2/search?categories_tags_en=breakfast-cereals&fields=code,product_name,categories_tags&page_size=5&sort_by=unique_scans_n',
    'https://world.openfoodfacts.org/cgi/search.pl?action=process&tagtype_0=categories&tag_contains_0=contains&tag_0=breakfast-cereals&json=1&page_size=5&fields=code,product_name,categories_tags',
  ];
  for (const url of urls) {
    try {
      const { json } = await httpJson<{ products?: SearchProduct[] }>(url, { source: 'OFF search', headers: { 'User-Agent': UA }, timeoutMs: 20000, retries: 2 });
      if (json?.products?.length) return json.products;
    } catch (e) {
      (report.off_search_errors ??= [] as string[]);
      (report.off_search_errors as string[]).push(String(e));
    }
  }
  return 'unavailable';
}

describe('scope databases', () => {
  it('a popular human food from Open Food Facts classifies as out of scope', async (ctx) => {
    const found = await offSearch();
    // The search endpoint is often overloaded (HTTP 503); that is the provider's state, not a Purrbi defect.
    if (found === 'unavailable') {
      report.off_out_of_scope = 'skipped: Open Food Facts search unavailable (see off_search_errors); product lookups are checked separately';
      ctx.skip();
      return;
    }
    const p = found.find((x) => x.code && normalizeBarcode(x.code).ok);
    expect(p).toBeTruthy();
    const b = normalizeBarcode(p!.code);
    const r = await lookupOpenFacts('off', b, UA, new Date());
    expect(r.found).toBe(true);
    if (!r.found) return;
    const facts = openFactsToFacts(r, b.gtin14, b.digits);
    const scope = classifyScope({ origin: 'off', categoriesTags: facts.classificationSignals.map((s) => s.text), texts: [facts.productName?.value ?? ''] });
    report.off_out_of_scope = { code: p!.code, name: facts.productName?.value, scope };
    expect(scope.status).toBe('out_of_scope');
  });
});

describe('openFDA food enforcement', () => {
  it('contains animal-food records (coverage check) and the adapter parses them', async () => {
    const url = 'https://api.fda.gov/food/enforcement.json?search=product_description:(%22dog+food%22+%22cat+food%22+%22pet+food%22)&limit=20&sort=report_date:desc';
    const { status, json } = await httpJson<{ meta?: { results?: { total?: number; last_updated?: string } }; results?: { recalling_firm?: string; product_description?: string; status?: string; report_date?: string }[] }>(url, { source: 'openFDA', timeoutMs: 20000, retries: 1, acceptStatuses: [404] });
    report.openfda_pet_coverage = {
      httpStatus: status,
      total: json?.meta?.results?.total ?? 0,
      lastUpdated: json?.meta?.results?.last_updated,
      sample: (json?.results ?? []).slice(0, 5).map((r) => ({ firm: r.recalling_firm, status: r.status, date: r.report_date, description: r.product_description?.slice(0, 160) })),
    };
    expect(status).toBe(200);
    expect(json?.meta?.results?.total ?? 0).toBeGreaterThan(0);
    const firm = json?.results?.find((r) => r.recalling_firm)?.recalling_firm;
    if (firm) {
      const check = await checkRecalls({ brand: firm, gtin14: '00000000000000' }, new Date());
      report.openfda_adapter = { firm, status: check.status, records: check.records.length, summary: check.summary };
      expect(['brand_history', 'possible_active', 'none_found']).toContain(check.status);
    }
  });
});

describe('knowledge-base citations', () => {
  for (const url of kbSourceUrls()) {
    it(`resolves ${url}`, async () => {
      const res = await httpRequest(url, { source: 'KB link', headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PurrbiLinkCheck/0.1)' }, timeoutMs: 20000, retries: 1 });
      (report.kbLinks ??= {} as Record<string, number>);
      (report.kbLinks as Record<string, number>)[url] = res.status;
      expect(res.status).toBe(200);
    });
  }
});
