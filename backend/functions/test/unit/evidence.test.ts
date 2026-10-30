// Mocked unit tests for the evidence layer: nutrition context, supplements, cited explanations,
// database label images and call diagnostics. Network calls are stubbed; inputs are TEST FIXTUREs.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nutritionContext, nutritionNotes } from '../../src/domain/nutritionContext';
import { activesFromGuarantees, assessSupplement, describeAmount, parseActiveIngredients, supplementPurposes } from '../../src/domain/supplements';
import { assessGeneral } from '../../src/domain/score';
import { classifyScope } from '../../src/domain/scope';
import type { GuaranteedAnalysisEntry } from '../../src/domain/types';
import { explainTerms, explanationKey, needsExplanation } from '../../src/knowledge/explain';
import { candidateImages, fullResolution } from '../../src/sources/labelImages';
import { currentCalls, runWithCallLog, sanitizeUrl } from '../../src/util/diagnostics';
import { httpRequest } from '../../src/util/http';
import { researchJson } from '../../src/ai/openai';
import { researchProduct } from '../../src/sources/research';
import { facts, SRC } from '../helpers/fixtures';

const GA: GuaranteedAnalysisEntry[] = [
  { nutrient: 'crude_protein', label: 'Crude Protein', qualifier: 'min', value: 30, unit: '%' },
  { nutrient: 'crude_fat', label: 'Crude Fat', qualifier: 'min', value: 15, unit: '%' },
  { nutrient: 'crude_fiber', label: 'Crude Fiber', qualifier: 'max', value: 4, unit: '%' },
  { nutrient: 'moisture', label: 'Moisture', qualifier: 'max', value: 10, unit: '%' },
  { nutrient: 'ash', label: 'Ash', qualifier: 'max', value: 8, unit: '%' },
];
const adultCat = { text: 'x', type: 'complete' as const, species: 'cat' as const, lifeStages: ['adult_maintenance' as const], method: 'formulation' as const, largeSizeGrowth: null, style: 'aafco' as const };

afterEach(() => vi.unstubAllGlobals());

describe('nutrition context', () => {
  it('explains each line and compares dry matter with the AAFCO minimum for the claimed life stage', () => {
    const notes = nutritionNotes(GA, { species: 'cat', category: 'complete_food', adequacy: adultCat, calories: [{ kcal: 4000, per: 'kg' }] });
    const protein = notes.find((n) => n.nutrient === 'crude_protein')!;
    expect(protein.meaning).toMatch(/lab method/);
    expect(protein.meaning).toMatch(/at least/);
    expect(protein.context).toMatch(/≈ 33.3% of dry matter/);
    // 4,000 kcal/kg as fed at 10% moisture ≈ 4,444 kcal/kg DM → AAFCO minimum scales to ≈ 28.9%
    expect(protein.context).toMatch(/AAFCO's minimum for cat foods for adult maintenance is 26% of dry matter \(≈ 28.9% at this food's energy density\); by this estimate the food is at or above it/);
    expect(notes.find((n) => n.nutrient === 'moisture')!.context).toBe('');
  });
  it('flags an estimate below the minimum as approximate, not as a fault', () => {
    const low = GA.map((e) => (e.nutrient === 'crude_protein' ? { ...e, value: 20 } : e));
    const n = nutritionNotes(low, { species: 'cat', category: 'complete_food', adequacy: adultCat })[0];
    expect(n.context).toMatch(/below it\. Label guarantees are minimums/);
  });
  it('gives no AAFCO comparison for treats or without a life-stage claim', () => {
    expect(nutritionNotes(GA, { species: 'cat', category: 'treat', adequacy: adultCat })[0].context).not.toMatch(/AAFCO/);
    expect(nutritionNotes(GA, { species: 'cat', category: 'complete_food' })[0].context).not.toMatch(/AAFCO/);
  });
  it('estimates carbohydrate by difference only when every input is listed', () => {
    expect(nutritionContext(GA, [{ kcal: 3800, per: 'kg' }])).toEqual([
      'Energy: ≈ 380 kcal per 100 g as sold (≈ 422 kcal per 100 g of dry matter). Calculated from the calorie statement.',
      'Estimated carbohydrate: ≈ 33% as sold (≈ 36.7% of dry matter), calculated by difference. Label minimums and maximums make this an estimate.',
    ]);
    expect(nutritionContext(GA.filter((e) => e.nutrient !== 'ash'), undefined)).toEqual([]);
  });
});

describe('supplements', () => {
  it('parses active ingredients with amounts and serving', () => {
    expect(parseActiveIngredients('Active Ingredients per Chew: Glucosamine HCl (Shellfish) 500 mg, MSM 250 mg; Vitamin E 20 IU. Inactive Ingredients: Brewers Yeast, Glycerin')).toEqual([
      { name: 'Glucosamine HCl (Shellfish)', amount: 500, unit: 'mg', per: 'chew' },
      { name: 'MSM', amount: 250, unit: 'mg', per: 'chew' },
      { name: 'Vitamin E', amount: 20, unit: 'iu', per: 'chew' },
    ]);
    expect(parseActiveIngredients('Active ingredients: Bacillus coagulans 2 billion CFU per scoop')).toEqual([{ name: 'Bacillus coagulans', amount: 2, unit: 'billion cfu', per: 'scoop' }]);
    expect(parseActiveIngredients('Chicken, rice')).toEqual([]);
    expect(describeAmount({ name: 'MSM', amount: 1500, unit: 'mg', per: 'chew' })).toBe('1,500 mg per chew');
    expect(describeAmount({ name: 'MSM', amount: null, unit: null, per: null })).toBe('amount not stated');
  });
  it('reads purposes from the label and database, never from the pet', () => {
    const f = facts({ productName: { value: 'TEST FIXTURE Calming Chews', source: SRC }, classificationSignals: [{ text: 'en:dog-supplements', source: 't' }, { text: 'en:hip-and-joint-supplements', source: 't' }] });
    expect(supplementPurposes(f).map((p) => `${p.key}:${p.evidence}`)).toEqual(['joint:Database categories', 'calming:Product name']);
  });
  it('is never empty: missing actives are stated, limitations are always present', () => {
    const f = facts({ productName: { value: 'TEST FIXTURE Skin & Coat Supplement', source: SRC }, ingredientsText: '', classificationSignals: [{ text: 'en:cat-supplements', source: 't' }], adequacyText: '' });
    const a = assessSupplement({ ...f, ingredientsText: undefined, ingredients: undefined, guaranteedAnalysis: undefined }, []);
    expect(a.purposes[0].key).toBe('skin_coat');
    expect(a.actives).toEqual([]);
    expect(a.warnings.map((w) => w.rule)).toEqual(['S-ACTIVES']);
    expect(a.limitations.length).toBe(3);
    expect(a.summary).toMatch(/Active ingredients aren’t available yet/);
  });
  it('falls back to mg/IU/CFU lines in the guaranteed analysis', () => {
    expect(activesFromGuarantees([{ nutrient: 'other', label: 'Glucosamine', qualifier: 'min', value: 500, unit: 'mg' }, GA[0]])).toEqual([{ name: 'Glucosamine', amount: 500, unit: 'mg', per: null }]);
  });
  it('is attached to the general assessment of a supplement, with documented safety notes', () => {
    const f = facts({
      productName: { value: 'TEST FIXTURE Dental Chews', source: SRC },
      ingredientsText: 'Active Ingredients per Chew: Zinc Gluconate 5 mg. Inactive Ingredients: glycerin, xylitol',
      classificationSignals: [{ text: 'en:dog-supplements', source: 't' }],
      adequacyText: '',
    });
    const g = assessGeneral(f, classifyScope({ origin: 'opff', categoriesTags: ['en:dog-supplements'], texts: ['TEST FIXTURE Dental Chews'] }));
    expect(g.scoreApplicable).toBe(false);
    expect(g.supplement!.actives[0]).toMatchObject({ name: 'Zinc Gluconate', amountText: '5 mg per chew', evidence: 'not_reviewed' });
    expect(g.supplement!.warnings.some((w) => w.kind === 'alert' && /xylitol/i.test(w.text))).toBe(true);
    expect(g.findings.some((x) => x.rule === 'G-GA' && x.kind === 'missing')).toBe(false);
  });
});

function openAiResponse(items: unknown[], citations: string[]) {
  return {
    output: [
      { type: 'web_search_call' },
      { type: 'message', content: [{ type: 'output_text', text: JSON.stringify({ items }), annotations: citations.map((url) => ({ type: 'url_citation', url, title: 't' })) }] },
    ],
  };
}
/** A term with its claims, as the explanation model returns them (TEST FIXTURE). */
const item = (n: number, term: string, claims: Record<string, unknown>[], english_name = term) => ({ n, term, english_name, claims });
const claimOf = (claim: string, citation_url: string, citation_passage: string, over: Record<string, unknown> = {}) => ({
  claim_type: 'function', claim, citation_url, citation_title: 'TEST FIXTURE page', citation_passage, ingredient_words_in_passage: '', source_is_about: 'not_species_specific', dose_or_exposure: null, ...over,
});
/** The claims a support check request (Chat Completions) was sent. */
const sentClaims = (body: string) => JSON.parse(JSON.parse(body).messages[1].content[0].text.split('\n').slice(2).join('\n')) as { id: number; claim: string; model?: string }[];
/** The support check's answer: every claim it was sent, confirmed as stated. */
function confirmAll(body: string) {
  const verdicts = sentClaims(body).map((c) => ({ id: c.id, supported: 'yes', narrowed_claim: '', species_scope: 'not_species_specific', form_match: 'exact', dose_context: '', reason: 'TEST FIXTURE' }));
  return new Response(JSON.stringify({ model: 'judge-mock', choices: [{ message: { content: JSON.stringify({ verdicts }) }, finish_reason: 'stop' }] }), { status: 200 });
}
const RESEARCH = 'https://api.openai.com/v1/responses';
const SUPPORT = 'https://api.openai.com/v1/chat/completions';

describe('cited explanations', () => {
  it('keeps a claim only when its passage is on the cited page and the support check confirms it', async () => {
    const quote = 'Carrageenan is a thickener extracted from red seaweed and used in canned foods.';
    const judged: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      if (url === RESEARCH) {
        return new Response(JSON.stringify(openAiResponse([
          item(1, 'carrageenan', [claimOf('Carrageenan is used as a thickener in canned foods.', 'https://www.merckvetmanual.com/test', quote)]),
          item(2, 'sodium hexametaphosphate', [claimOf('Sodium hexametaphosphate binds calcium in saliva.', 'https://www.merckvetmanual.com/test', 'This sentence is not on the page at all, so it must be rejected.')]),
          item(3, 'guar gum', [claimOf('Guar gum is a thickener.', 'https://random-blog.example/guar', 'Guar gum is a thickener used in many pet foods and treats.')]),
        ], ['https://www.merckvetmanual.com/test'])), { status: 200 });
      }
      if (url === SUPPORT) {
        judged.push(String(init?.body));
        return confirmAll(String(init?.body));
      }
      return new Response(`<html><body><p>TEST FIXTURE page.</p><p>${quote}</p><script>ignored()</script></body></html>`, { status: 200 });
    }));
    const out = await explainTerms({ apiKey: 'k', model: 'm', species: 'dog', terms: [
      { term: 'carrageenan', kind: 'ingredient' }, { term: 'sodium hexametaphosphate', kind: 'ingredient' }, { term: 'guar gum', kind: 'ingredient' }, { term: 'beet pulp', kind: 'ingredient' },
    ], userAgent: 'test', now: new Date('2026-10-28T00:00:00Z') });
    expect(out.map((e) => `${e.term}:${e.status}:${e.reason}`)).toEqual([
      'carrageenan:verified:',
      'sodium hexametaphosphate:unverified:passage not found on the cited page (merckvetmanual.com)',
      'guar gum:not_found:cited page is not on the allowed list (random-blog.example)',
      'beet pulp:not_found:no explanation returned',
    ]);
    expect(out[0]).toMatchObject({ key: 'dog_ingredient_carrageenan', summary: 'Carrageenan is used as a thickener in canned foods.', role: 'Thickener or binder', sourceUrl: 'https://www.merckvetmanual.com/test', quote, model: 'm', judgeModel: 'judge-mock' });
    expect(out[0].claims).toEqual([{
      claimType: 'function', claim: 'Carrageenan is used as a thickener in canned foods.', ingredientForm: 'carrageenan', title: 'TEST FIXTURE page', url: 'https://www.merckvetmanual.com/test', passage: quote,
      speciesScope: 'not_species_specific', evidence: 'veterinary_reference', doseContext: '', retrievedAt: '2026-10-28T00:00:00.000Z', publishedAt: '', reviewStatus: 'automated_checks',
    }]);
    // Unverified text is never kept; why each claim was left out is.
    expect(out[1]).toMatchObject({ summary: '', quote: '', claims: [], rejected: [{ claimType: 'function', claim: 'Sodium hexametaphosphate binds calcium in saliva.', reason: 'passage not found on the cited page (merckvetmanual.com)' }] });
    // One support check for the batch, sent only the claim that passed the checks on its page.
    expect(judged.map((b) => sentClaims(b).map((c) => c.claim))).toEqual([['Carrageenan is used as a thickener in canned foods.']]);
  });
  it('shows the page’s own sentence when the model’s passage is close but not word for word, without needing search citations', async () => {
    const onPage = 'Beet pulp is a source of fiber that is fermented slowly by bacteria in the colon.';
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      if (url === RESEARCH) {
        return new Response(JSON.stringify(openAiResponse([
          // translated term, matched by its number and named on the page by its English name; the passage changes one word
          item(1, 'dried beet pulp', [claimOf('Dried sugar beet pulp adds slowly fermented fiber.', 'https://vcahospitals.com/test-fixture/fiber', 'Beet pulp is a source of fibre that is fermented slowly by bacteria in the colon.')]),
          // a different sentence altogether is still rejected
          item(2, 'Levures déshydratées', [claimOf('Dried yeast adds B vitamins.', 'https://vcahospitals.com/test-fixture/fiber', 'Dried yeast is a rich natural source of B vitamins for dogs and cats.')], 'dried yeast'),
        ], [])), { status: 200 });
      }
      if (url === SUPPORT) return confirmAll(String(init?.body));
      return new Response(`<html><body><h1>Fiber</h1><p>Some pet foods add fiber.</p><p>${onPage}</p><p>Too much fiber can reduce how well other nutrients are digested.</p></body></html>`, { status: 200 });
    }));
    const out = await explainTerms({ apiKey: 'k', model: 'm', species: 'cat', terms: [
      { term: 'Pulpes de betterave déshydratée', kind: 'ingredient' }, { term: 'Levures déshydratées', kind: 'ingredient' },
    ], userAgent: 'test', now: new Date('2026-10-29T00:00:00Z') });
    expect(out.map((e) => `${e.term}:${e.status}:${e.reason}`)).toEqual([
      'Pulpes de betterave déshydratée:verified:',
      'Levures déshydratées:unverified:passage not found on the cited page (vcahospitals.com)',
    ]);
    expect(out[0].quote).toBe(onPage); // the page's wording, not the model's
    expect(out[0].claims[0]).toMatchObject({ ingredientForm: 'Pulpes de betterave déshydratée', passage: onPage, title: 'Fiber' });
    expect(out[0].role).toBe('Fibre source');
    expect(out[0].version).toBe('explain-2.0.0');
  });
  it('tries the next listed model when one is rejected, and reports pages it could not use', async () => {
    const models: string[] = [];
    let judged = 0;
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      if (url === SUPPORT) {
        judged++;
        return confirmAll(String(init?.body));
      }
      if (url === RESEARCH) {
        const body = JSON.parse(String(init?.body));
        models.push(body.model);
        if (body.model === 'missing-model') return new Response(JSON.stringify({ error: { message: 'The model `missing-model` does not exist' } }), { status: 404 });
        expect(body.reasoning).toBeUndefined(); // only reasoning models get a reasoning effort
        return new Response(JSON.stringify({ model: body.model, ...openAiResponse([
          item(1, 'carrageenan', [claimOf('Carrageenan is a thickener.', 'https://www.fda.gov/moved', 'Carrageenan is a thickener extracted from red seaweed and used in canned foods.')]),
          item(2, 'guar gum', [claimOf('Guar gum is a thickener.', 'https://www.aspca.org/blocked', 'Guar gum is a thickener used in many pet foods and treats.')]),
        ], []) }), { status: 200 });
      }
      if (url.includes('aspca.org')) return new Response('Forbidden', { status: 403 });
      const res = new Response('<p>Carrageenan is a thickener extracted from red seaweed and used in canned foods.</p>', { status: 200 });
      Object.defineProperty(res, 'url', { value: 'https://elsewhere.example/landing' });
      return res;
    }));
    const out = await explainTerms({ apiKey: 'k', model: 'missing-model, gpt-4.1-mini', species: 'dog', terms: [
      { term: 'carrageenan', kind: 'ingredient' }, { term: 'guar gum', kind: 'ingredient' },
    ], userAgent: 'test', now: new Date('2026-10-29T00:00:00Z') });
    expect(models).toEqual(['missing-model', 'gpt-4.1-mini']);
    expect(out.map((e) => `${e.model}:${e.status}:${e.reason}`)).toEqual([
      'gpt-4.1-mini:unverified:cited page redirected off the allowed sites (elsewhere.example)',
      'gpt-4.1-mini:unverified:cited page could not be fetched (aspca.org, HTTP 403)',
    ]);
    expect(judged).toBe(0); // nothing passed the checks on its page: no support check is paid for
  });
  it('shows nothing when the support check fails, and runs it with the first listed model the API knows', async () => {
    const quote = 'Carrageenan is a thickener extracted from red seaweed and used in canned foods.';
    const judgedBy: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      if (url === RESEARCH) {
        if (body.model === 'missing-model') return new Response(JSON.stringify({ error: { message: 'The model `missing-model` does not exist' } }), { status: 404 });
        return new Response(JSON.stringify(openAiResponse([item(1, 'carrageenan', [claimOf('Carrageenan is used as a thickener in canned foods.', 'https://www.merckvetmanual.com/test', quote)])], [])), { status: 200 });
      }
      if (url === SUPPORT) {
        judgedBy.push(body.model);
        return new Response(JSON.stringify({ error: { message: 'TEST FIXTURE: the support check is unavailable' } }), { status: 400 });
      }
      return new Response(`<p>${quote}</p>`, { status: 200 });
    }));
    const [e] = await explainTerms({ apiKey: 'k', model: 'missing-model, gpt-4.1-mini', species: 'dog', terms: [{ term: 'carrageenan', kind: 'ingredient' }], userAgent: 'test', now: new Date('2026-10-30T00:00:00Z') });
    expect(judgedBy).toEqual(['gpt-4.1-mini']);
    expect(e).toMatchObject({ status: 'unverified', reason: 'support check unavailable', claims: [], summary: '', sourceUrl: '', quote: '', judgeModel: '' });
    expect(e.rejected.map((r) => r.reason)).toEqual([expect.stringMatching(/^support check unavailable \(OpenAI: HTTP 400/)]);
  });
  it('reports a cited PDF as a file Purrbi cannot check, not as a passage missing from the page', async () => {
    const asked: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      if (url === RESEARCH) {
        asked.push(String(JSON.parse(String(init?.body)).instructions ?? JSON.stringify(JSON.parse(String(init?.body)).input)));
        return new Response(JSON.stringify(openAiResponse([
          item(1, 'Glycerol', [claimOf('Glycerin keeps soft treats moist.', 'https://www.aafco.org/wp-content/uploads/2023/01/manual.pdf', 'Glycerin is a humectant that keeps soft treats moist during storage.')]),
          item(2, 'Yeast', [claimOf('Dried yeast adds flavor.', 'https://www.aafco.org/wp-content/uploads/2026/01/chapter.pdf', 'Dried yeast is used in pet foods as a source of flavor and B vitamins.')]),
        ], [])), { status: 200 });
      }
      // One PDF is served with its content type, the other only recognisable by its first bytes.
      if (url.endsWith('manual.pdf')) return new Response('%PDF-1.7 binary', { status: 200, headers: { 'Content-Type': 'application/pdf' } });
      return new Response('%PDF-1.4 binary', { status: 200, headers: { 'Content-Type': 'application/octet-stream' } });
    }));
    const out = await explainTerms({ apiKey: 'k', model: 'm', species: 'dog', terms: [{ term: 'Glycerol', kind: 'ingredient' }, { term: 'Yeast', kind: 'ingredient' }], userAgent: 'test', now: new Date('2026-10-30T00:00:00Z') });
    expect(out.map((e) => `${e.status}:${e.reason}`)).toEqual([
      'unverified:cited page is a PDF document, which Purrbi cannot check yet (aafco.org)',
      'unverified:cited page is a PDF document, which Purrbi cannot check yet (aafco.org)',
    ]);
    expect(asked.join(' ')).toMatch(/not a PDF/); // the model is asked for web pages
  });
  it('treats an Office document or another file as a file, and an HTML page as a page whatever it is served as', async () => {
    const quote = 'Carrageenan is a thickener extracted from red seaweed and used in canned foods.';
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      if (url === RESEARCH) {
        return new Response(JSON.stringify(openAiResponse([
          item(1, 'Glycerol', [claimOf('Glycerin keeps soft treats moist.', 'https://www.aafco.org/manual.docx', 'Glycerin is a humectant that keeps soft treats moist during storage.')]),
          item(2, 'Yeast', [claimOf('Dried yeast adds flavor.', 'https://www.aafco.org/data.json', 'Dried yeast is used in pet foods as a source of flavor and B vitamins.')]),
          item(3, 'carrageenan', [claimOf('Carrageenan is used as a thickener in canned foods.', 'https://www.aafco.org/page', quote)]),
        ], [])), { status: 200 });
      }
      if (url === SUPPORT) return confirmAll(String(init?.body));
      if (url.endsWith('.docx')) return new Response('PK\u0003\u0004 zip', { status: 200, headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' } });
      if (url.endsWith('.json')) return new Response('{"a":1}', { status: 200, headers: { 'Content-Type': 'application/json' } });
      return new Response(`<!doctype html><html><body><p>${quote}</p></body></html>`, { status: 200, headers: { 'Content-Type': 'application/octet-stream' } });
    }));
    const out = await explainTerms({ apiKey: 'k', model: 'm', species: 'dog', terms: [{ term: 'Glycerol', kind: 'ingredient' }, { term: 'Yeast', kind: 'ingredient' }, { term: 'carrageenan', kind: 'ingredient' }], userAgent: 'test', now: new Date('2026-10-30T00:00:00Z') });
    expect(out.map((e) => `${e.status}:${e.reason}`)).toEqual([
      'unverified:cited page is a document file, which Purrbi cannot check yet (aafco.org)',
      'unverified:cited page is a file (application/json), which Purrbi cannot check yet (aafco.org)',
      'verified:',
    ]);
    expect(out[2].claims[0].evidence).toBe('standards_body');
  });
  it('does not pay to explain plain whole foods', () => {
    expect(needsExplanation('Chicken', 'ingredient')).toBe(false);
    expect(needsExplanation('Brown rice', 'ingredient')).toBe(false);
    expect(needsExplanation('Menadione sodium bisulfite complex', 'ingredient')).toBe(true);
    expect(needsExplanation('Salmon oil', 'active')).toBe(true);
    expect(explanationKey('cat', 'active', 'L-Lysine HCl (99%)')).toBe('cat_active_l-lysine-hcl');
  });
});

describe('database label images', () => {
  it('uses only full-resolution images from the database image hosts', () => {
    expect(fullResolution('https://images.openpetfoodfacts.org/images/products/123/ingredients_en.5.400.jpg')).toBe('https://images.openpetfoodfacts.org/images/products/123/ingredients_en.5.full.jpg');
    expect(candidateImages({ image_ingredients_url: 'https://images.openpetfoodfacts.org/a/ingredients_en.3.400.jpg', image_nutrition_url: 'https://evil.example/n.jpg' }, ['ingredients', 'nutrition'])).toEqual([
      { purpose: 'ingredients', url: 'https://images.openpetfoodfacts.org/a/ingredients_en.3.full.jpg' },
    ]);
    expect(candidateImages({ image_ingredients_url: 'https://images.openpetfoodfacts.org/a/i.400.jpg' }, ['nutrition'])).toEqual([]);
  });
});

describe('call diagnostics', () => {
  it('records each attempt without query strings, headers or bodies', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => new Response('{}', { status: url.includes('missing') ? 404 : 200 })));
    const calls = await runWithCallLog(async () => {
      await httpRequest('https://world.openpetfoodfacts.org/api/v2/product/0012345678905?fields=code', { source: 'OPFF', headers: { Authorization: 'Bearer secret' } });
      await httpRequest('https://api.fda.gov/missing.json?search=brand&api_key=SECRET', { source: 'openFDA', acceptStatuses: [404] });
      return currentCalls();
    });
    expect(calls.map(({ ms: _ms, ...c }) => c)).toEqual([
      { source: 'OPFF', host: 'world.openpetfoodfacts.org', path: '/api/v2/product/:n', status: 200, outcome: 'ok', attempt: 1 },
      { source: 'openFDA', host: 'api.fda.gov', path: '/missing.json', status: 404, outcome: 'not_found', attempt: 1 },
    ]);
    expect(JSON.stringify(calls)).not.toMatch(/secret|SECRET|api_key|search=/);
    expect(currentCalls()).toEqual([]); // nothing recorded outside a job
    expect(sanitizeUrl('not a url')).toEqual({ host: 'invalid-url', path: '' });
  });
});

describe('failed-call reasons and the research domain filter', () => {
  it('keeps a short, redacted reason for a failed call, never for a successful one', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: { message: "Invalid value for 'tools[0].filters'. Key sk-proj-abc123SECRET, see https://example.org/doc?token=SECRET" } }), { status: 400 })));
    const calls = await runWithCallLog(async () => {
      await httpRequest('https://api.openai.com/v1/responses', { source: 'OpenAI', method: 'POST', retries: 0 }).catch(() => undefined);
      return currentCalls();
    });
    expect(calls[0]).toMatchObject({ status: 400, outcome: 'http_error' });
    expect(calls[0].detail).toContain("Invalid value for 'tools[0].filters'");
    expect(calls[0].detail).not.toMatch(/SECRET|abc123/);
  });
  it('asks once more without the domain filter when a model rejects it', async () => {
    const bodies: Record<string, unknown>[] = [];
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
      bodies.push(JSON.parse(String(init.body)));
      if (bodies.length === 1) return new Response(JSON.stringify({ error: { message: 'filters are not supported' } }), { status: 400 });
      return new Response(JSON.stringify({ model: 'mock', output: [{ type: 'message', content: [{ type: 'output_text', text: '{"items":[]}', annotations: [] }] }] }), { status: 200 });
    }));
    const r = await researchJson<{ items: unknown[] }>({ apiKey: 'test', model: 'mock', system: 's', user: 'u', format: { name: 'x', schema: { type: 'object' } }, timeoutMs: 1000, allowedDomains: ['fda.gov'] });
    expect(r.data).toEqual({ items: [] });
    expect(bodies).toHaveLength(2);
    expect((bodies[0].tools as { filters?: unknown }[])[0].filters).toEqual({ allowed_domains: ['fda.gov'] });
    expect((bodies[1].tools as { filters?: unknown }[])[0].filters).toBeUndefined();
    expect(JSON.stringify(bodies[1].input)).toContain('Search and cite only pages on these sites: fda.gov.');
  });
  it('gives reasoning models a reasoning effort and room for it, and reports a cut-off answer', async () => {
    const bodies: Record<string, unknown>[] = [];
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
      bodies.push(JSON.parse(String(init.body)));
      return new Response(JSON.stringify({ status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' }, output: [{ type: 'reasoning' }] }), { status: 200 });
    }));
    await expect(researchJson({ apiKey: 'test', model: 'gpt-5-mini', system: 's', user: 'u', format: { name: 'x', schema: { type: 'object' } }, timeoutMs: 1000 })).rejects.toThrow('output incomplete (max_output_tokens)');
    expect(bodies[0]).toMatchObject({ reasoning: { effort: 'low' }, max_output_tokens: 16000 });
  });
  it('does not retry other failures', async () => {
    const fetchMock = vi.fn(async () => new Response('{"error":{"message":"bad key"}}', { status: 401 }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(researchJson({ apiKey: 'test', model: 'mock', system: 's', user: 'u', format: { name: 'x', schema: { type: 'object' } }, timeoutMs: 1000, allowedDomains: ['fda.gov'] })).rejects.toThrow(/401/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('manufacturer research', () => {
  const PAGE = `<html><head><title>PURINA ONE® Stérilisé Saumon</title></head><body>
    <h1>PURINA ONE<sup>&reg;</sup> St&eacute;rilis&eacute; Croquettes au Saumon</h1><p>Marque&nbsp;: Purina</p>
    <h2>Composition</h2><p>Saumon (17%), prot&eacute;ines de volaille d&eacute;shydrat&eacute;es, bl&eacute;, ma&iuml;s</p>
    <h2>Constituants analytiques</h2><p>Prot&eacute;ine : 34 %, Mati&egrave;res grasses brutes : 12,5 %, Cellulose brute : 3,5 %</p>
    <p>Aliment complet pour chats adultes st&eacute;rilis&eacute;s.</p></body></html>`;
  // The same page naming its product's barcode in a shop widget's markup (as wellnesspetfood.com does): this product, proven.
  const PAGE_EAN = PAGE.replace('</h1>', '</h1><div class="ps-widget" ps-sku=" 7613032759155 "></div>');
  const answer = (over: Record<string, unknown> = {}) => ({
    found: true, product_name: 'PURINA ONE® Stérilisé Croquettes au Saumon', brand: 'Purina', intended_for: 'cats', product_type: 'dry cat food',
    ingredients_verbatim: 'Saumon (17%), protéines de volaille déshydratées, blé, maïs', active_ingredients_verbatim: null,
    adequacy_statement_verbatim: 'Aliment complet pour chats adultes stérilisés.',
    guaranteed_analysis: [{ label: 'Protéine', qualifier: 'not_stated', value: 34, unit: '%' }, { label: 'Matières grasses brutes', qualifier: 'not_stated', value: 12.5, unit: '%' }],
    calorie_statement_verbatim: null, source_urls: ['https://www.purina.fr/chat/purina-one-sterilise-saumon'], barcode_seen_on_source: false, ...over,
  });
  const stub = (json: Record<string, unknown>, page = PAGE) =>
    vi.stubGlobal('fetch', vi.fn(async (url: string) => (url.startsWith('https://api.openai.com/')
      ? new Response(JSON.stringify({ output: [{ type: 'web_search_call' }, { type: 'message', content: [{ type: 'output_text', text: JSON.stringify(json), annotations: [] }] }] }), { status: 200 })
      : new Response(page, { status: 200 }))));
  // The database record already establishes a cat food; the page then only has to be the same product by brand and name.
  const run = (over: Record<string, unknown> = {}) => researchProduct({ apiKey: 'k', model: 'm', gtin14: '07613032759155', barcode: '7613032759155', knownBrand: 'Purina', knownSpecies: 'cat', userAgent: 'test', now: new Date('2026-10-29T00:00:00Z'), ...over });

  it('verifies a page the model names without a search citation, ignoring markup, entities, ® and decimal commas', async () => {
    stub(answer(), PAGE_EAN);
    const r = await run();
    expect(r.discarded).toEqual([]);
    expect(r.sources[0]).toMatchObject({ sourceType: 'manufacturer', sourceName: 'purina.fr', matchConfidence: 'exact_barcode' });
    expect(r.facts?.productName?.value).toBe('PURINA ONE® Stérilisé Croquettes au Saumon');
    expect(r.facts?.ingredients?.value.slice(0, 2)).toEqual(['Saumon (17%)', 'protéines de volaille déshydratées']);
    expect(r.facts?.adequacy?.value).toMatchObject({ type: 'complete', species: 'cat', lifeStages: ['adult_maintenance'] });
    // The model's answer gave protein and fat; the analysis printed on the page also gives fibre ("3,5 %").
    expect(r.facts?.guaranteedAnalysis?.value.map((g) => `${g.nutrient}:${g.value}`)).toEqual(['crude_protein:34', 'crude_fat:12.5', 'crude_fiber:3.5']);
    expect(r.verified).toEqual(['purina.fr shows this product’s barcode in its page data.']);
    expect(r.analysisNote).toBe('Read the analysis printed on purina.fr (3 rows).'); // shown only when the result uses it
  });
  it('reads the printed analysis only from a page shown to be this product, not from another variant fetched with it', async () => {
    // As reproduced in review: the first page is the brand's page of another flavour; the second, a retailer's
    // page showing this barcode, prints the answer's values.
    const variant = PAGE.replace(/Saumon/g, 'Poulet').replace(/34 %/, '37 %').replace('12,5 %', '14 %').replace('3,5 %', '2,5 %');
    const retailer = `<html><body><h1>PURINA ONE® Stérilisé Croquettes au Saumon</h1><p>EAN 7613032759155</p><h2>Composition</h2><p>Saumon (17%), protéines de volaille déshydratées, blé, maïs</p><h2>Constituants analytiques</h2><p>Protéine : 34 %, Matières grasses brutes : 12,5 %, Cellulose brute : 3,5 %</p></body></html>`;
    vi.stubGlobal('fetch', vi.fn(async (url: string) => (url.startsWith('https://api.openai.com/')
      ? new Response(JSON.stringify({ output: [{ type: 'web_search_call' }, { type: 'message', content: [{ type: 'output_text', text: JSON.stringify(answer({ source_urls: ['https://www.purina.fr/chat/purina-one-sterilise-poulet', 'https://www.shop.example/purina-one-saumon'] })), annotations: [] }] }] }), { status: 200 })
      : new Response(url.includes('poulet') ? variant : retailer, { status: 200 }))));
    const r = await run();
    expect(r.sources[0]).toMatchObject({ sourceName: 'shop.example', matchConfidence: 'exact_barcode' });
    expect(r.facts?.guaranteedAnalysis?.value.map((g) => g.value)).toEqual([34, 12.5, 3.5]);
    expect(r.verified).toContain('shop.example shows this product’s barcode.');
  });
  it('a heading mentioned without rows (a tab bar) does not hide the page’s analysis', async () => {
    const { pageAnalysis } = await import('../../src/sources/research');
    expect(pageAnalysis('Description Ingredients Guaranteed Analysis Feeding Instructions Reviews ... Guaranteed Analysis Crude Protein (min) 26.0%, Crude Fat (min) 16.0%, Crude Fiber (max) 4.0%').map((g) => `${g.nutrient}:${g.value}`)).toEqual(['crude_protein:26', 'crude_fat:16', 'crude_fiber:4']);
    // A retailer's table: the header cells are not part of the first row's name.
    expect(pageAnalysis('Guaranteed Analysis Nutrient Guaranteed Units Crude Protein 26.0% Min Crude Fat 16.0% Min').map((g) => g.label)).toEqual(['Crude Protein', 'Crude Fat']);
  });
  it('prefers the analysis printed on the page to an answer that disagrees with it', async () => {
    // The answer's value is nowhere on the page: the page's own analysis is used, and the note says so.
    stub(answer({ guaranteed_analysis: [{ label: 'Protéine', qualifier: 'not_stated', value: 33, unit: '%' }] }), PAGE_EAN);
    const r = await run();
    expect(r.facts?.guaranteedAnalysis?.value.map((g) => `${g.nutrient}:${g.value}`)).toEqual(['crude_protein:34', 'crude_fat:12.5', 'crude_fiber:3.5']);
    expect(r.discarded).toEqual(['barcode search: guaranteed analysis: the answer’s Protéine 33 is not on the page; the analysis printed on the page was used']);
    // The answer's value is on the page, but as another row's (fibre's 3,5 % given as protein): since research
    // 2.4.0 a value counts only where the page prints it after its nutrient's name, so it is not on the page.
    stub(answer({ guaranteed_analysis: [{ label: 'Protéine', qualifier: 'not_stated', value: 3.5, unit: '%' }] }), PAGE_EAN);
    const differ = await run();
    expect(differ.facts?.guaranteedAnalysis?.value.map((g) => `${g.nutrient}:${g.value}`)).toEqual(['crude_protein:34', 'crude_fat:12.5', 'crude_fiber:3.5']);
    expect(differ.discarded).toEqual(['barcode search: guaranteed analysis: the answer’s Protéine 3.5 is not on the page; the analysis printed on the page was used']);
  });
  it('a value counts as on the page only where the page prints it as a number of its own', async () => {
    // "7" is printed only inside "17%" (the salmon's share), so an ash of 7 % is not on the page.
    const plain = PAGE_EAN.replace('<h2>Constituants analytiques</h2>', '<h2>Valeurs</h2>');
    vi.stubGlobal('fetch', vi.fn(async (url: string) => (url.startsWith('https://api.openai.com/')
      ? new Response(JSON.stringify({ output: [{ type: 'web_search_call' }, { type: 'message', content: [{ type: 'output_text', text: JSON.stringify(answer({ guaranteed_analysis: [...answer().guaranteed_analysis as unknown[], { label: 'Cendres brutes', qualifier: 'not_stated', value: 7, unit: '%' }] })), annotations: [] }] }] }), { status: 200 })
      : new Response(plain, { status: 200 }))));
    const r = await run();
    expect(r.facts?.guaranteedAnalysis?.value.map((g) => g.value)).toEqual([34, 12.5]);
    expect(r.discarded).toEqual(['barcode search: guaranteed analysis: kept 2 of 3 values; not on the page: Cendres brutes 7']);
  });
  it('says which analysis values were left out when others were kept', async () => {
    // A page whose analysis has no heading Purrbi recognises: only the answer's values, each checked on the page.
    const plain = PAGE_EAN.replace('<h2>Constituants analytiques</h2>', '<h2>Valeurs</h2>');
    vi.stubGlobal('fetch', vi.fn(async (url: string) => (url.startsWith('https://api.openai.com/')
      ? new Response(JSON.stringify({ output: [{ type: 'web_search_call' }, { type: 'message', content: [{ type: 'output_text', text: JSON.stringify(answer({ guaranteed_analysis: [...answer().guaranteed_analysis as unknown[], { label: 'Cendres brutes', qualifier: 'not_stated', value: 9, unit: '%' }] })), annotations: [] }] }] }), { status: 200 })
      : new Response(plain, { status: 200 }))));
    const r = await run();
    expect(r.facts?.guaranteedAnalysis?.value.map((g) => g.value)).toEqual([34, 12.5]);
    expect(r.discarded).toEqual(['barcode search: guaranteed analysis: kept 2 of 3 values; not on the page: Cendres brutes 9']);
  });
  it('takes who it is for only from a page proven to be this product (barcode or same recipe), never from brand and name alone', async () => {
    // Real case 099482480882: a brand sells cat and dog recipes under the same name.
    stub(answer());
    const nameOnly = await run({ knownSpecies: 'unknown', knownName: 'PURINA ONE® Stérilisé Croquettes au Saumon' });
    expect(nameOnly.facts).toBeNull();
    expect(nameOnly.discarded.join(' ')).toMatch(/matches only by brand and name .* it is not yet known whether this product is for cats or dogs/);
    // The answer's own name for the page is not what the page is checked against (it would match any page it chose).
    const noName = await run({ knownSpecies: 'unknown' });
    expect(noName.facts).toBeNull();
    expect(noName.discarded[0]).toBe('barcode search: the cited page does not show this product’s barcode or its brand and name (brand "Purina" found, no product name known to compare)');
    const sameRecipe = await run({ knownSpecies: 'unknown', knownIngredients: ['Saumon (17%)', 'protéines de volaille déshydratées', 'blé', 'maïs'] });
    expect(sameRecipe.facts).toBeNull(); // four ingredients compared is too few to call it the same recipe
    const page5 = PAGE.replace('ma&iuml;s</p>', 'ma&iuml;s, graisses animales</p>');
    vi.stubGlobal('fetch', vi.fn(async (url: string) => (url.startsWith('https://api.openai.com/')
      ? new Response(JSON.stringify({ output: [{ type: 'web_search_call' }, { type: 'message', content: [{ type: 'output_text', text: JSON.stringify(answer({ ingredients_verbatim: 'Saumon (17%), protéines de volaille déshydratées, blé, maïs, graisses animales' })), annotations: [] }] }] }), { status: 200 })
      : new Response(page5, { status: 200 }))));
    const recipe = await run({ knownSpecies: 'unknown', knownIngredients: ['Saumon (17%)', 'protéines de volaille déshydratées', 'blé', 'maïs', 'graisses animales'] });
    expect(recipe.facts?.classificationSignals?.map((c) => c.text)).toContain('intended for cats');
    expect(recipe.verified).toEqual(['Same recipe on purina.fr: 5 of the first 5 ingredients match the database record in order (Saumon (17%), protéines de volaille déshydratées, blé, maïs …).']);
  });
  it('says what it looked for when the page does not show the product', async () => {
    stub(answer({ product_name: 'Purina Gourmet Gold Mousse au Thon' }));
    const r = await run();
    expect(r.facts).toBeNull();
    // The barcode search and then the search by brand and name each found only this page.
    expect(r.discarded).toEqual(['barcode search', 'name search'].map((a) => `${a}: the cited page does not show this product’s barcode or its brand and name (brand "Purina" found, no product name known to compare)`));
    // With the database's name for the product, the page must show that name in its heading.
    const known = await run({ knownName: 'Purina Gourmet Gold Mousse au Thon' });
    expect(known.facts).toBeNull();
    expect(known.discarded[0]).toBe('barcode search: the cited page does not show this product’s barcode or its brand and name (brand "Purina" found, name "Purina Gourmet Gold Mousse au Thon" not in the product’s heading)');
  });
});

describe('fixes found by the live contract run', () => {
  it('ignores Open Pet Food Facts’ generic "dog and cat food" parent category when reading species', async () => {
    const { classifyScope } = await import('../../src/domain/scope');
    expect(classifyScope({ origin: 'opff', categoriesTags: ['en:dog-and-cat-food', 'en:cat-food', 'en:cat-treats'], texts: ['Temptations Salmon 60g'] })).toMatchObject({ species: 'cat', category: 'treat' });
    expect(classifyScope({ origin: 'opff', categoriesTags: ['en:dog-and-cat-food', 'en:pet-food'], texts: ['Picnic Festival'] }).species).toBe('unknown');
    expect(classifyScope({ origin: 'opff', categoriesTags: ['fr:aliment-chat'], texts: ['Bouchées pour chats'] }).species).toBe('cat');
    expect(classifyScope({ origin: 'opff', categoriesTags: ['en:dog-and-cat-food', 'en:dog-food', 'en:cat-food'], texts: [''] }).species).toBe('cat_and_dog');
  });
  it('reads the pet-food crude-* nutrient keys before the generic ones and rejects implausible calories', async () => {
    const { nutrimentsToCalories, nutrimentsToGuarantees } = await import('../../src/sources/openFacts');
    const ga = nutrimentsToGuarantees({ 'crude-protein_100g': 32, proteins_100g: 3.1, 'crude-fat_100g': 14, 'crude-fibre_100g': 2.5, 'crude-ash_100g': 7, moisture_100g: 8 });
    expect(ga.map((e) => `${e.nutrient}:${e.value}`)).toEqual(['crude_protein:32', 'crude_fat:14', 'crude_fiber:2.5', 'moisture:8', 'ash:7']);
    expect(nutrimentsToCalories({ 'energy-kcal_100g': 5 })).toEqual([]);
    expect(nutrimentsToCalories({ 'energy-kcal_100g': 380 })[0].kcal).toBe(3800);
  });
});
