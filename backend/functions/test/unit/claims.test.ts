// Claim-by-claim validation of cited explanations (explain-2.0.0): the five unsupported explanations seen
// in live results, run through the deterministic checks; the support check, with its model call mocked;
// and the withdrawal, with an audit record, of explanations made under the earlier rules. Every page here
// is a TEST FIXTURE: synthetic HTML holding only a live result's page title and the passage it quoted,
// under a test-fixture link. Other sentences are labelled TEST FIXTURE and come from no source.
import { Timestamp, type Firestore } from 'firebase-admin/firestore';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/ai/openai', async (importOriginal) => ({ ...(await importOriginal<typeof import('../../src/ai/openai')>()), chatJson: vi.fn(), researchJson: vi.fn() }));

import { chatJson, researchJson } from '../../src/ai/openai';
import {
  around,
  auditLegacyExplanation,
  checkClaim,
  checkSupport,
  evidenceKind,
  formMatch,
  isNamingRule,
  publishedDate,
  quoteOnPage,
  readPage,
  scopeProblem,
  sourceScope,
  type Candidate,
  type JudgeVerdict,
  type RawClaim,
} from '../../src/knowledge/claims';
import { EXPLAIN_VERSION, explainTerms, type CitedExplanation } from '../../src/knowledge/explain';
import { readExplanations } from '../../src/pipeline/store';
import { SourceError } from '../../src/util/http';

const NOW = new Date('2026-10-30T00:00:00Z');

/** TEST FIXTURE: a synthetic page with only a page title and one quoted passage. */
const fixturePage = (title: string, passage: string, head = '') =>
  `<!doctype html><html><head><title>${title}</title>${head}</head><body><p>TEST FIXTURE: synthetic page, not the real page.</p><p>${passage}</p></body></html>`;
/** TEST FIXTURE: a synthetic sentence naming something. */
const fx = (what: string) => `TEST FIXTURE sentence naming ${what}.`;

interface Case {
  term: string; // as printed on the label
  url: string; // a test-fixture link on the cited site
  title: string; // the cited page's title, as reported
  passage: string; // the quoted passage, as reported
}
// The five live results: the label term, the cited page's title and the passage it quoted.
const SUNFLOWER: Case = { term: 'Sunflower Oil', url: 'https://vcahospitals.com/test-fixture/s-adenosylmethionine-same-silybin', title: 'S-AdenosylMethionine SAMe Silybin', passage: 'SAMe is the bioactive form of methionine, an essential amino acid nutrient that is found abundantly in foods, especially in meat and sunflower seeds.' };
const VITAMIN_K: Case = { term: 'Menadione Sodium Bisulfite Complex (Vitamin K)', url: 'https://www.merckvetmanual.com/test-fixture/nutritional-requirements-of-pigs', title: 'Nutritional Requirements of Pigs', passage: 'The active form of vitamin K is menadione.' };
const MACKEREL: Case = { term: 'Mackerel', url: 'https://www.aafco.org/test-fixture/reading-labels', title: 'Reading Labels', passage: 'If it says beef, chicken or mackerel, the name must be true to its major ingredients, and it cannot rely on less expensive byproducts, meals or flavors.' };
const TUNA_BROTH: Case = { term: 'Tuna Broth', url: 'https://vcahospitals.com/test-fixture/nutrition-for-cats-with-chronic-kidney-disease', title: 'Nutrition for Cats with Chronic Kidney Disease', passage: 'If needed, you can add water, tuna juice, or low-sodium broth to the food to improve its flavor and palatability.' };
const GUAR_GUM: Case = { term: 'Guar Gum', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/test-fixture-guar-gum-e412/', title: 'Re‐evaluation of guar gum (E 412) as a food additive', passage: 'Guar Gum (E 412) is authorised as a food additive in the European Union (EU) in accordance with Annex II and Annex III to Regulation (EC) No 1333/2008 on food additives…' };
// Synthetic pages about cats, and about cats and dogs, for the support check's own scope and form readings.
const CAT_PAGE: Case = { term: 'Taurine', url: 'https://vcahospitals.com/test-fixture/taurine', title: 'TEST FIXTURE page about cats', passage: fx('taurine for cats') };
const CAT_DOG_PAGE: Case = { term: 'Taurine', url: 'https://vcahospitals.com/test-fixture/taurine-for-both', title: 'TEST FIXTURE page about cats and dogs', passage: fx('taurine for cats and dogs') };

const raw = (c: Case, claim_type: RawClaim['claim_type'], claim: string, over: Partial<RawClaim> = {}): RawClaim => ({
  claim_type, claim, citation_url: c.url, citation_title: c.title, citation_passage: c.passage, ingredient_words_in_passage: '', source_is_about: 'not_species_specific', dose_or_exposure: null, ...over,
});
const check = (c: Case, r: RawClaim, species: 'cat' | 'dog' | 'cat_and_dog' = 'cat') => checkClaim({ term: c.term, species, claim: r, page: readPage(fixturePage(c.title, c.passage), c.url), now: NOW });
const reasonOf = (x: ReturnType<typeof checkClaim>) => (x.ok ? 'kept' : x.reason);
const candidate = (c: Case, type: RawClaim['claim_type'], claim: string, species: 'cat' | 'dog' = 'cat'): Candidate => {
  const r = check(c, raw(c, type, claim), species);
  if (!r.ok) throw new Error(r.reason);
  return r.candidate;
};

describe('the five unsupported live explanations, through the deterministic checks', () => {
  it('1 sunflower oil: a passage about sunflower seeds says nothing about the oil', () => {
    const named = { ingredient_words_in_passage: 'sunflower seeds' };
    expect(reasonOf(check(SUNFLOWER, raw(SUNFLOWER, 'function', 'Sunflower oil provides methionine, an essential amino acid nutrient.', named)))).toBe('the passage names sunflower seeds, not sunflower oil');
    expect(reasonOf(check(SUNFLOWER, raw(SUNFLOWER, 'identity', 'Sunflower oil is found abundantly in foods.', named)))).toBe('the passage names sunflower seeds, not sunflower oil');
  });
  it('2 vitamin K from a pig-nutrition page: no benefit, risk or function claim for a cat food, at most an identity claim tagged other species', () => {
    const said = { source_is_about: 'cats' as const }; // the model's word is not taken: the page is about pigs
    expect(reasonOf(check(VITAMIN_K, raw(VITAMIN_K, 'benefit', 'Menadione sodium bisulfite complex supplies the vitamin K cats need.', said)))).toBe('pig-nutrition source used for a cat or dog claim');
    expect(reasonOf(check(VITAMIN_K, raw(VITAMIN_K, 'risk', 'Reported effects and safety can vary by species.', said)))).toBe('source is about pig nutrition, not cats or dogs');
    expect(reasonOf(check(VITAMIN_K, raw(VITAMIN_K, 'function', 'Menadione sodium bisulfite complex is added as a source of vitamin K.', said)))).toBe('source is about pig nutrition, not cats or dogs');
    const identity = check(VITAMIN_K, raw(VITAMIN_K, 'identity', 'Menadione is the active form of vitamin K.', said));
    expect(identity.ok && identity.candidate).toMatchObject({ form: 'synonym', source: { scope: 'other_species', about: 'pig nutrition' }, evidence: 'veterinary_reference', title: 'Nutritional Requirements of Pigs' });
  });
  it('3 mackerel: a rule for what a product name must contain is not about an ingredient-list entry', () => {
    for (const type of ['identity', 'function'] as const) {
      expect(reasonOf(check(MACKEREL, raw(MACKEREL, type, 'Labeling rules require that when a species is named it must reflect the major ingredient used.')))).toBe('a product-naming rule, not about an ingredient-list entry');
    }
  });
  it('4 tuna broth: tuna juice and a low-sodium broth, named separately, are not tuna broth', () => {
    expect(reasonOf(check(TUNA_BROTH, raw(TUNA_BROTH, 'function', 'Tuna broth is added to improve the flavor and palatability of the food.', { source_is_about: 'cats' })))).toBe('the passage names tuna juice and low-sodium broth, not tuna broth');
  });
  it('5 guar gum from a human food-additive re-evaluation: never pet-feed evidence; a plain technological function is kept, tagged people', () => {
    expect(reasonOf(check(GUAR_GUM, raw(GUAR_GUM, 'function', 'Regulatory and safety reviews (EFSA) find guar gum efficacious for these technological uses in pet feed.')))).toBe('human food-additive evidence presented as pet-feed evidence');
    expect(reasonOf(check(GUAR_GUM, raw(GUAR_GUM, 'benefit', 'Guar gum supports digestive health.')))).toBe('human food-additive evidence cannot support a benefit claim for cats or dogs');
    const plain = check(GUAR_GUM, raw(GUAR_GUM, 'function', 'In human foods, guar gum (E 412) is authorised as a food additive in the European Union.'), 'dog');
    expect(plain.ok && plain.candidate).toMatchObject({ form: 'exact', source: { scope: 'people', about: 'human food additives' }, evidence: 'peer_reviewed' });
  });
});

describe('deterministic checks', () => {
  it('a form is named exactly, by a synonym, or in the sentence just before the passage; a related form is not the same', () => {
    expect(formMatch('Menadione Sodium Bisulfite Complex (Vitamin K)', { passage: fx('vitamin K3') }).match).toBe('synonym');
    expect(formMatch('Menadione Sodium Bisulfite Complex (Vitamin K)', { passage: fx('vitamin K') })).toEqual({ match: 'related', named: 'vitamin k' });
    expect(formMatch('Vitamin E Supplement', { passage: fx('dl-alpha-tocopheryl acetate') }).match).toBe('synonym');
    expect(formMatch('Vitamin B1 Supplement', { passage: fx('vitamin B1') }).match).toBe('synonym');
    expect(formMatch('Thiamine Mononitrate', { passage: fx('vitamin B-1') }).match).toBe('synonym');
    expect(formMatch('D-Calcium Pantothenate', { passage: fx('pantothenic acid') }).match).toBe('synonym');
    expect(formMatch('Zinc Amino Acid Chelate', { passage: fx('chelated zinc') }).match).toBe('synonym');
    expect(formMatch('Guar Gum', { passage: fx('E412') }).match).toBe('synonym');
    expect(formMatch('Natural Flavors', { passage: fx('natural flavours') }).match).toBe('exact');
    expect(formMatch('Dried Beet Pulp', { passage: fx('beet pulp') }).match).toBe('synonym');
    expect(formMatch('L-Lysine', { passage: fx('lysine') }).match).toBe('synonym');
    // The sentence before counts only when the passage refers back to it ("It is …").
    expect(formMatch('Guar Gum', { passage: 'It is used to thicken wet foods.', before: fx('guar gum') }).match).toBe('exact');
    expect(formMatch('Guar Gum', { passage: fx('carrageenan'), after: fx('guar gum') }).match).toBe('different');
    expect(formMatch('Sunflower Oil', { passage: fx('sunflower meal') })).toEqual({ match: 'related', named: 'sunflower meal' });
    expect(formMatch('Calcium Iodate', { passage: fx('potassium iodide') }).match).toBe('different');
    // A label in another language is matched by its English name.
    expect(formMatch('Pulpes de betterave déshydratée', { passage: fx('beet pulp') }, 'dried beet pulp').match).toBe('synonym');
  });
  it('reads who a source is about from its title, link and passage, not from the ingredient’s own name', () => {
    const scope = (title: string, url: string, passage: string, ingredient?: string) => sourceScope({ title, url, passage, ingredient }).scope;
    expect(scope('TEST FIXTURE poultry fat', 'https://www.aafco.org/test-fixture/poultry-fat', fx('poultry fat'), 'Poultry Fat')).toBe('not_species_specific');
    expect(scope('TEST FIXTURE', 'https://www.aafco.org/test-fixture/pig-ears', fx('pig ears'))).toBe('not_species_specific');
    expect(scope('TEST FIXTURE: rat poison and dogs', 'https://www.aspca.org/test-fixture', fx('cholecalciferol'))).toBe('dog'); // a poison, not a laboratory animal
    expect(sourceScope({ title: 'TEST FIXTURE', url: 'https://www.merckvetmanual.com/test-fixture/nutrition-horses', passage: fx('biotin') })).toMatchObject({ scope: 'other_species', about: 'horse nutrition' });
    expect(scope('TEST FIXTURE', 'https://ods.od.nih.gov/test-fixture/vitamin-k', fx('vitamin K'))).toBe('people');
    expect(scope('TEST FIXTURE: safety of a feed additive for all animal species', 'https://www.efsa.europa.eu/test-fixture', fx('guar gum'))).toBe('animal_feed');
    expect(scope('TEST FIXTURE about cats and dogs', 'https://vcahospitals.com/test-fixture', fx('taurine'))).toBe('cat_and_dog');
    expect(scope('TEST FIXTURE', 'https://www.aafco.org/test-fixture/understanding-pet-food', fx('taurine'))).toBe('pets');
  });
  it('a benefit or risk needs a source about the product’s species, pets, or an animal-feed safety assessment for safety', () => {
    const src = (title: string) => sourceScope({ title, url: 'https://vcahospitals.com/test-fixture', passage: fx('taurine') });
    expect(scopeProblem('benefit', 'TEST FIXTURE benefit.', fx('taurine'), src('TEST FIXTURE about dogs'), 'cat')).toBe('source is about dogs, but this product is for cats');
    expect(scopeProblem('benefit', 'TEST FIXTURE benefit.', fx('taurine'), src('TEST FIXTURE about dogs'), 'cat_and_dog')).toBeNull();
    expect(scopeProblem('risk', 'TEST FIXTURE risk.', fx('taurine'), src('TEST FIXTURE'), 'cat')).toBe('the source does not say it is about cats, dogs or pets, which a risk claim needs');
    const feed = src('TEST FIXTURE feed additive');
    expect(scopeProblem('risk', 'TEST FIXTURE: safe for the target species.', fx('taurine'), feed, 'dog')).toBeNull();
    expect(scopeProblem('benefit', 'TEST FIXTURE benefit.', fx('taurine'), feed, 'dog')).toBe('an animal-feed assessment supports safety or tolerance statements only');
    expect(scopeProblem('function', 'TEST FIXTURE: used in pet food.', fx('taurine'), src('TEST FIXTURE'), 'dog')).toBe('the passage does not mention cats, dogs or pet food');
    expect(scopeProblem('function', 'TEST FIXTURE: safe as a thickener.', fx('taurine'), src('TEST FIXTURE'), 'dog')).toBe('a benefit or safety statement presented as a technological function');
  });
  it('tells a product-naming rule from a passage about the ingredient', () => {
    expect(isNamingRule(MACKEREL.passage)).toBe(true);
    expect(isNamingRule('TEST FIXTURE: a product named for one meat must have at least 95% of it.')).toBe(true);
    expect(isNamingRule('TEST FIXTURE: the "with" rule.')).toBe(true);
    expect(isNamingRule(VITAMIN_K.passage)).toBe(false);
    expect(isNamingRule(TUNA_BROTH.passage)).toBe(false);
    expect(isNamingRule(GUAR_GUM.passage)).toBe(false);
  });
  it('records the kind of evidence by site', () => {
    const urls = ['https://www.fda.gov/x', 'https://www.ecfr.gov/x', 'https://www.efsa.europa.eu/x', 'https://www.aafco.org/x', 'https://fediaf.org/x', 'https://www.merckvetmanual.com/x', 'https://vcahospitals.com/x', 'https://pmc.ncbi.nlm.nih.gov/articles/test-fixture/', 'https://www.ncbi.nlm.nih.gov/pmc/articles/test-fixture/', 'https://pubmed.ncbi.nlm.nih.gov/00000000/', 'https://www.ncbi.nlm.nih.gov/books/test-fixture/', 'https://ods.od.nih.gov/x'];
    expect(urls.map(evidenceKind)).toEqual(['regulation', 'regulation', 'regulatory_assessment', 'standards_body', 'standards_body', 'veterinary_reference', 'veterinary_reference', 'peer_reviewed', 'peer_reviewed', 'peer_reviewed', 'other', 'other']);
  });
  it('reads the page’s own date, and gives none when it has none', () => {
    expect(publishedDate('<meta property="article:published_time" content="2021-04-05T10:00:00Z">')).toBe('2021-04-05');
    expect(publishedDate('<script type="application/ld+json">{"dateModified":"2023-11-02"}</script>')).toBe('2023-11-02');
    expect(publishedDate('<p>TEST FIXTURE <time datetime="2019-02-03">3 Feb</time></p>')).toBe('2019-02-03');
    expect(publishedDate('<p>TEST FIXTURE. Last updated: March 4, 2022</p>')).toBe('2022-03-04');
    expect(publishedDate('<meta name="citation_publication_date" content="2017 Jul">')).toBe('2017-07');
    expect(publishedDate('<p>TEST FIXTURE without a date. Updated 12 hours ago.</p>')).toBe('');
    expect(readPage(fixturePage(GUAR_GUM.title, GUAR_GUM.passage, '<meta property="article:modified_time" content="2024-01-31">'), GUAR_GUM.url).publishedAt).toBe('2024-01-31');
  });
  it('finds a two-sentence passage on the page, in the page’s own words when the model’s differ, with the sentence before it', () => {
    const two = 'TEST FIXTURE first sentence naming guar gum as a thickener. TEST FIXTURE second sentence about the same gum.';
    const p = readPage(fixturePage('TEST FIXTURE page', two), 'https://www.fda.gov/test-fixture');
    const found = quoteOnPage(p, 'TEST FIXTURE first sentence naming guar gum as a thickener. TEST FIXTURE second sentence about that same gum.');
    expect(found).toBe(two);
    expect(around(p, found!)).toEqual({ before: 'TEST FIXTURE: synthetic page, not the real page.', after: '' });
  });
  it('rejects a claim with a number its passage does not have, but not a name with digits in it', () => {
    expect(reasonOf(check(GUAR_GUM, raw(GUAR_GUM, 'function', 'In human foods, guar gum (E 412) is authorised at up to 10 g/kg.')))).toBe('the claim has a number that is not in the passage (10)');
    expect(reasonOf(check(GUAR_GUM, raw(GUAR_GUM, 'identity', 'Guar gum (E412) is authorised under Regulation (EC) No 1333/2008.')))).toBe('kept');
  });
});

const verdict = (over: Partial<JudgeVerdict>): JudgeVerdict => ({ id: 0, supported: 'yes', narrowed_claim: '', species_scope: 'people', form_match: 'exact', dose_context: '', reason: 'TEST FIXTURE verdict', ...over });

describe('the support check (model call mocked)', () => {
  const chat = vi.mocked(chatJson);
  afterEach(() => {
    chat.mockReset();
    vi.mocked(researchJson).mockReset();
    vi.unstubAllGlobals();
  });

  it('shows what it confirms, the narrowed claim when only part is supported, and nothing it rejects', async () => {
    const candidates = [
      candidate(GUAR_GUM, 'function', 'In human foods, guar gum (E 412) is authorised as a food additive in the European Union.'),
      candidate(VITAMIN_K, 'identity', 'Menadione is the active form of vitamin K.'),
      candidate(GUAR_GUM, 'identity', 'Guar gum (E 412) is authorised as a food additive in the European Union and elsewhere.'),
      candidate(GUAR_GUM, 'identity', 'Guar gum (E 412) is authorised as a food additive.'),
      candidate(GUAR_GUM, 'identity', 'Guar gum is authorised in the European Union.'),
    ];
    chat.mockResolvedValueOnce({
      data: {
        verdicts: [
          verdict({ id: 0 }),
          verdict({ id: 1, species_scope: 'other_species', form_match: 'synonym' }),
          verdict({ id: 2, supported: 'partly', narrowed_claim: 'Guar gum (E 412) is authorised as a food additive in the European Union.' }),
          verdict({ id: 3, supported: 'partly', narrowed_claim: 'Guar gum (E 412) is authorised at up to 10 g/kg in foods.' }), // an invented number
          verdict({ id: 4, supported: 'no', reason: 'TEST FIXTURE: not what the passage says' }),
        ],
      },
      model: 'judge-model',
      usage: null,
    });
    const r = await checkSupport({ apiKey: 'k', model: 'judge-model', species: 'cat', candidates });
    expect(r.model).toBe('judge-model');
    expect(r.results.map((x) => (x.ok ? `${x.claim.speciesScope}: ${x.claim.claim}` : x.reason))).toEqual([
      'people: In human foods, guar gum (E 412) is authorised as a food additive in the European Union.',
      'other_species: Menadione is the active form of vitamin K.',
      'people: Guar gum (E 412) is authorised as a food additive in the European Union.',
      'the narrowed claim has a number that is not in the passage (10)',
      'the support check found the passage does not support it (TEST FIXTURE: not what the passage says)',
    ]);
    expect(r.results[0]).toEqual({
      ok: true,
      claim: {
        claimType: 'function', claim: 'In human foods, guar gum (E 412) is authorised as a food additive in the European Union.', ingredientForm: 'Guar Gum',
        title: GUAR_GUM.title, url: GUAR_GUM.url, passage: GUAR_GUM.passage, speciesScope: 'people', evidence: 'peer_reviewed', doseContext: '',
        retrievedAt: NOW.toISOString(), publishedAt: '', reviewStatus: 'automated_checks',
      },
    });
    // One call, without web search: each claim with its passage, the sentences around it, the page title and link.
    expect(chat).toHaveBeenCalledTimes(1);
    const sent = JSON.parse(String((chat.mock.calls[0][0].userContent[0] as { text: string }).text.split('\n').slice(2).join('\n')));
    expect(sent[1]).toEqual({
      id: 1, ingredient_as_printed: VITAMIN_K.term, claim_type: 'identity', claim: 'Menadione is the active form of vitamin K.', page_title: VITAMIN_K.title, url: VITAMIN_K.url,
      sentence_before: 'TEST FIXTURE: synthetic page, not the real page.', passage: VITAMIN_K.passage, sentence_after: '',
    });
  });
  it('the stricter of its reading and Purrbi’s own wins, for the source and for the form', async () => {
    const benefit = () => candidate(CAT_PAGE, 'benefit', 'TEST FIXTURE benefit claim about taurine for cats.');
    const both = candidate(CAT_DOG_PAGE, 'benefit', 'TEST FIXTURE benefit claim about taurine for cats and dogs.');
    expect([benefit().source.scope, both.source.scope]).toEqual(['cat', 'cat_and_dog']);
    chat.mockResolvedValueOnce({
      data: { verdicts: [verdict({ id: 0, species_scope: 'people' }), verdict({ id: 1, species_scope: 'cat', form_match: 'related' }), verdict({ id: 2, species_scope: 'cat_and_dog', dose_context: 'TEST FIXTURE at 1000 mg' }), verdict({ id: 3, species_scope: 'dog' })] },
      model: 'judge-model',
      usage: null,
    });
    const r = await checkSupport({ apiKey: 'k', model: 'judge-model', species: 'cat', candidates: [benefit(), benefit(), benefit(), both] });
    expect(r.results.map((x) => (x.ok ? `${x.claim.speciesScope} [${x.claim.doseContext}]` : x.reason))).toEqual([
      'evidence about people cannot support a benefit claim for cats or dogs',
      'the support check found the passage names a related form, not taurine',
      'cat []', // the narrower species is kept; a dose the passage does not state is not
      'source is about dogs, but this product is for cats',
    ]);
  });
  it('a claim the check returned no verdict for is not shown', async () => {
    chat.mockResolvedValueOnce({ data: { verdicts: [] }, model: 'judge-model', usage: null });
    const r = await checkSupport({ apiKey: 'k', model: 'judge-model', species: 'cat', candidates: [candidate(VITAMIN_K, 'identity', 'Menadione is the active form of vitamin K.')] });
    expect(r.results).toEqual([{ ok: false, reason: 'the support check gave no verdict' }]);
  });
  it('shows nothing from a batch whose support check fails, never the unchecked claims', async () => {
    const plain = raw(GUAR_GUM, 'function', 'In human foods, guar gum (E 412) is authorised as a food additive in the European Union.');
    vi.mocked(researchJson).mockResolvedValueOnce({ data: { items: [{ n: 1, term: 'Guar Gum', english_name: 'guar gum', claims: [plain] }] }, citations: [], searches: 1, model: 'model-a', searchLog: [] });
    chat.mockRejectedValueOnce(new SourceError('OpenAI', 'timeout', 'no response within 45000 ms'));
    vi.stubGlobal('fetch', vi.fn(async () => new Response(fixturePage(GUAR_GUM.title, GUAR_GUM.passage), { status: 200 })));
    const [e] = await explainTerms({ apiKey: 'k', model: 'model-a, model-b', species: 'cat', terms: [{ term: 'Guar Gum', kind: 'ingredient' }], userAgent: 'test', now: NOW });
    expect(e).toMatchObject({ status: 'unverified', reason: 'support check unavailable', claims: [], summary: '', quote: '', sourceUrl: '', model: 'model-a', judgeModel: '', version: EXPLAIN_VERSION });
    expect(e.rejected).toEqual([{ claimType: 'function', claim: plain.claim, url: GUAR_GUM.url, reason: 'support check unavailable (OpenAI: no response within 45000 ms)' }]);
    expect(chat.mock.calls[0][0].model).toBe('model-a'); // the first listed model
  });
  it('keeps each claim with its passage, source, evidence kind and dates, alongside the earlier single-explanation fields', async () => {
    const plain = raw(GUAR_GUM, 'function', 'In human foods, guar gum (E 412) is authorised as a food additive in the European Union.');
    const petFeed = raw(GUAR_GUM, 'function', 'Regulatory and safety reviews (EFSA) find guar gum efficacious for these technological uses in pet feed.');
    vi.mocked(researchJson).mockResolvedValueOnce({ data: { items: [{ n: 1, term: 'Guar Gum', english_name: 'guar gum', claims: [petFeed, plain] }] }, citations: [], searches: 1, model: 'model-a', searchLog: [] });
    chat.mockResolvedValueOnce({ data: { verdicts: [verdict({ id: 0 })] }, model: 'model-a', usage: null });
    const pages = vi.fn(async () => new Response(fixturePage(GUAR_GUM.title, GUAR_GUM.passage, '<meta property="article:published_time" content="2017-06-01">'), { status: 200 }));
    vi.stubGlobal('fetch', pages);
    const [e] = await explainTerms({ apiKey: 'k', model: 'model-a', species: 'cat', terms: [{ term: 'Guar Gum', kind: 'ingredient' }], userAgent: 'test', now: NOW });
    expect(pages).toHaveBeenCalledTimes(1); // one page, fetched once for both claims
    expect(e).toMatchObject({ key: 'cat_ingredient_guar-gum', status: 'verified', reason: '', judgeModel: 'model-a', summary: plain.claim, role: '', sourceTitle: GUAR_GUM.title, sourceUrl: GUAR_GUM.url, quote: GUAR_GUM.passage });
    expect(e.claims).toEqual([{ claimType: 'function', claim: plain.claim, ingredientForm: 'Guar Gum', title: GUAR_GUM.title, url: GUAR_GUM.url, passage: GUAR_GUM.passage, speciesScope: 'people', evidence: 'peer_reviewed', doseContext: '', retrievedAt: NOW.toISOString(), publishedAt: '2017-06-01', reviewStatus: 'automated_checks' }]);
    expect(e.rejected).toEqual([{ claimType: 'function', claim: petFeed.claim, url: GUAR_GUM.url, reason: 'human food-additive evidence presented as pet-feed evidence' }]);
  });
});

describe('explanations made under the earlier rules', () => {
  it('says why each of the five live explanations would not pass claim by claim', () => {
    const old = (c: Case, summary: string) => auditLegacyExplanation({ term: c.term, species: 'cat', summary, sourceTitle: c.title, sourceUrl: c.url, quote: c.passage });
    expect(old(SUNFLOWER, 'TEST FIXTURE summary: sunflower oil provides methionine, found in meat and sunflower seeds.')).toEqual(['the passage names sunflower seeds, not sunflower oil']);
    expect(old(VITAMIN_K, 'TEST FIXTURE summary: a source of vitamin K; reported effects and safety can vary by species.')).toEqual(['source is about pig nutrition, not cats or dogs']);
    expect(old(MACKEREL, 'TEST FIXTURE summary: labeling rules require that when a species is named it must reflect the major ingredient used.')).toEqual(['a product-naming rule, not about an ingredient-list entry']);
    expect(old(TUNA_BROTH, 'TEST FIXTURE summary: added to improve flavor and palatability.')).toEqual(['the passage names tuna juice and low-sodium broth, not tuna broth']);
    expect(old(GUAR_GUM, 'TEST FIXTURE summary: regulatory and safety reviews (EFSA) find it efficacious for these technological uses in pet feed.')).toEqual(['human food-additive evidence presented as pet-feed evidence']);
    expect(old(CAT_PAGE, 'TEST FIXTURE summary.')).toEqual(['superseded by claim-by-claim validation']);
  });

  /** An in-memory stand-in for the Firestore calls readExplanations makes: getAll, and batches of create and update (with a last-update precondition). */
  function memoryDb(initial: Record<string, Record<string, unknown>>, afterRead?: (write: (path: string, data: Record<string, unknown>) => void) => void) {
    const docs = new Map(Object.entries(initial));
    let clock = 1;
    const times = new Map([...docs.keys()].map((k) => [k, clock]));
    const write = (path: string, data: Record<string, unknown>) => {
      docs.set(path, data);
      times.set(path, ++clock);
    };
    const commits: string[][] = [];
    let failing = 0;
    type Ref = { path: string; id: string };
    const db = {
      doc: (path: string): Ref => ({ path, id: path.split('/').pop()! }),
      async getAll(...refs: Ref[]) {
        const snaps = refs.map((r) => {
          const d = docs.get(r.path);
          return { id: r.id, ref: r, exists: !!d, data: () => (d ? structuredClone(d) : undefined), get: (k: string) => d?.[k], updateTime: d ? { at: times.get(r.path) } : undefined };
        });
        afterRead?.(write);
        return snaps;
      },
      batch() {
        const ops: { name: string; check: () => void; apply: () => void }[] = [];
        const b = {
          create(r: Ref, data: Record<string, unknown>) {
            ops.push({ name: `create ${r.path}`, check: () => { if (docs.has(r.path)) throw new Error('ALREADY_EXISTS'); }, apply: () => write(r.path, data) });
            return b;
          },
          update(r: Ref, data: Record<string, unknown>, pre?: { lastUpdateTime?: { at: number } }) {
            ops.push({ name: `update ${r.path}`, check: () => { if (!docs.has(r.path) || (pre?.lastUpdateTime && pre.lastUpdateTime.at !== times.get(r.path))) throw new Error('FAILED_PRECONDITION'); }, apply: () => write(r.path, { ...docs.get(r.path), ...data }) });
            return b;
          },
          async commit() {
            if (failing > 0 && failing--) throw new Error('UNAVAILABLE');
            for (const o of ops) o.check();
            for (const o of ops) o.apply();
            commits.push(ops.map((o) => o.name));
          },
        };
        return b;
      },
    };
    return { db: db as unknown as Firestore, docs, commits, fail: (n: number) => { failing = n; } };
  }
  const legacy = (term: string, c: Case, over: Record<string, unknown> = {}) => ({
    key: `cat_ingredient_${term}`, term: c.term, kind: 'ingredient', species: 'cat', status: 'verified', summary: 'TEST FIXTURE summary shown under the earlier rules.', role: '',
    sourceTitle: c.title, sourceUrl: c.url, quote: c.passage, reason: '', checkedAt: '2026-10-01T00:00:00.000Z', model: 'mock', version: 'explain-1.2.0', ...over,
  });
  const current = (key: string): CitedExplanation => ({
    key, term: 'Taurine', kind: 'ingredient', species: 'cat', status: 'verified', claims: [], rejected: [], summary: 'TEST FIXTURE', role: '', sourceTitle: '', sourceUrl: '', quote: '',
    reason: '', checkedAt: '2026-10-29T00:00:00.000Z', model: 'mock', judgeModel: 'mock', version: EXPLAIN_VERSION,
  });

  it('withdraws a shown explanation once, with an audit record, and asks for it again under the current rules', async () => {
    const m = memoryDb({
      'knowledge/cat_ingredient_sunflower-oil': legacy('sunflower-oil', SUNFLOWER),
      'knowledge/cat_ingredient_guar-gum': legacy('guar-gum', GUAR_GUM, { status: 'unverified', summary: '', quote: '', sourceUrl: '', sourceTitle: '', reason: 'quote not found on the cited page (ncbi.nlm.nih.gov)' }),
      'knowledge/cat_ingredient_taurine': current('cat_ingredient_taurine') as unknown as Record<string, unknown>,
    });
    const keys = ['cat_ingredient_sunflower-oil', 'cat_ingredient_guar-gum', 'cat_ingredient_taurine'];
    expect([...(await readExplanations(m.db, keys, NOW)).keys()]).toEqual(['cat_ingredient_taurine']);
    // One batch: the record and the old entry marked; an explanation that was never shown has nothing to withdraw.
    expect(m.commits).toEqual([['create knowledgeAudit/cat_ingredient_sunflower-oil__explain-1.2.0', 'update knowledge/cat_ingredient_sunflower-oil']]);
    const audit = m.docs.get('knowledgeAudit/cat_ingredient_sunflower-oil__explain-1.2.0')!;
    expect(audit).toMatchObject({
      key: 'cat_ingredient_sunflower-oil', term: 'Sunflower Oil', species: 'cat', oldVersion: 'explain-1.2.0', oldSummary: 'TEST FIXTURE summary shown under the earlier rules.',
      oldSourceTitle: SUNFLOWER.title, oldSourceUrl: SUNFLOWER.url, oldQuote: SUNFLOWER.passage, supersededBy: EXPLAIN_VERSION, reasons: ['the passage names sunflower seeds, not sunflower oil'],
    });
    expect((audit.withdrawnAt as Timestamp).toDate()).toEqual(NOW);
    // Its version is set aside, so the sweep of earlier explanations moves on past it.
    expect(m.docs.get('knowledge/cat_ingredient_sunflower-oil')).toMatchObject({ version: 'withdrawn explain-1.2.0', supersededBy: EXPLAIN_VERSION });
    // Read again before it is made again: still missing, and not withdrawn a second time.
    expect((await readExplanations(m.db, keys, NOW)).has('cat_ingredient_sunflower-oil')).toBe(false);
    expect(m.commits).toHaveLength(1);
  });
  it('writes each record once when another scan withdrew one at the same moment, leaves a newer explanation alone, and never fails the scan', async () => {
    const entries = {
      'knowledge/cat_ingredient_sunflower-oil': legacy('sunflower-oil', SUNFLOWER),
      'knowledge/cat_ingredient_tuna-broth': legacy('tuna-broth', TUNA_BROTH),
      'knowledge/cat_ingredient_mackerel': legacy('mackerel', MACKEREL),
      'knowledgeAudit/cat_ingredient_sunflower-oil__explain-1.2.0': { reasons: ['TEST FIXTURE: written by another scan'] },
    };
    const keys = ['cat_ingredient_sunflower-oil', 'cat_ingredient_tuna-broth', 'cat_ingredient_mackerel'];
    // Between this read and its writes, another scan replaces the mackerel explanation with one made under the current rules.
    const m = memoryDb(entries, (write) => write('knowledge/cat_ingredient_mackerel', current('cat_ingredient_mackerel') as unknown as Record<string, unknown>));
    expect((await readExplanations(m.db, keys, NOW)).size).toBe(0);
    expect(m.commits).toEqual([['create knowledgeAudit/cat_ingredient_tuna-broth__explain-1.2.0', 'update knowledge/cat_ingredient_tuna-broth']]); // the batch failed; each was tried on its own
    expect(m.docs.get('knowledgeAudit/cat_ingredient_sunflower-oil__explain-1.2.0')).toEqual({ reasons: ['TEST FIXTURE: written by another scan'] });
    expect(m.docs.get('knowledgeAudit/cat_ingredient_tuna-broth__explain-1.2.0')!.reasons).toEqual(['the passage names tuna juice and low-sodium broth, not tuna broth']);
    expect(m.docs.has('knowledgeAudit/cat_ingredient_mackerel__explain-1.2.0')).toBe(false);
    expect(m.docs.get('knowledge/cat_ingredient_mackerel')).toEqual(current('cat_ingredient_mackerel'));
    // Firestore unavailable: nothing is written, and the read still answers.
    const down = memoryDb({ 'knowledge/cat_ingredient_sunflower-oil': legacy('sunflower-oil', SUNFLOWER), 'knowledge/cat_ingredient_tuna-broth': legacy('tuna-broth', TUNA_BROTH) });
    down.fail(10);
    expect((await readExplanations(down.db, keys, NOW)).size).toBe(0);
    expect(down.commits).toEqual([]);
  });
});

describe('review of the claim checks (2026-10-30)', () => {
  const page = (body: string, title = 'TEST FIXTURE page about dogs', url = 'https://vcahospitals.com/test-fixture/x') => readPage(fixturePage(title, body), url);
  it('a quote is matched with its numbers: a changed percentage is not the page’s passage', () => {
    const p = page('In feeding trials, diets with up to 2% guar gum were well tolerated by adult dogs.');
    // A misquoted number is never stored or shown: the passage is the page's own sentence, and the claim fails on it.
    expect(quoteOnPage(p, 'diets with up to 20% guar gum were well tolerated by adult dogs')).toBe('In feeding trials, diets with up to 2% guar gum were well tolerated by adult dogs.');
    expect(quoteOnPage(p, 'diets with up to 2% guar gum were well tolerated by adult dogs')).toBe('In feeding trials, diets with up to 2% guar gum were well tolerated by adult dogs.');
    const r = checkClaim({ term: 'Guar Gum', species: 'dog', page: p, now: NOW, claim: { claim_type: 'risk', claim: 'Diets with up to 20% guar gum were well tolerated by adult dogs.', citation_url: 'https://vcahospitals.com/test-fixture/x', citation_title: 'TEST FIXTURE', citation_passage: 'diets with up to 20% guar gum were well tolerated by adult dogs', ingredient_words_in_passage: 'guar gum', source_is_about: 'dogs', dose_or_exposure: 'up to 20% of the diet' } });
    expect(r.ok).toBe(false);
  });
  it('the passage is the page’s whole sentence, so a negation or condition is never cut off', () => {
    const myth = page('It is a myth that carrageenan causes intestinal cancer in cats; no study in cats has shown this.', 'TEST FIXTURE page about cats');
    expect(quoteOnPage(myth, 'carrageenan causes intestinal cancer in cats')).toBe('It is a myth that carrageenan causes intestinal cancer in cats; no study in cats has shown this.');
    const only = page('Guar gum is safe for cats only at the low amounts used to thicken food.', 'TEST FIXTURE page about cats');
    expect(quoteOnPage(only, 'Guar gum is safe for cats')).toBe('Guar gum is safe for cats only at the low amounts used to thicken food.');
  });
  it('a longer substance name is another form: oil cake, oil meal, extract', () => {
    expect(formMatch('Sunflower Oil', { passage: 'Sunflower oil cake is a protein-rich by-product of oil extraction.' }).match).not.toBe('exact');
    expect(formMatch('Soybean Oil', { passage: 'Soybean oil meal is a common plant protein source in dog foods.' }).match).not.toBe('exact');
    expect(formMatch('Rosemary', { passage: 'Rosemary extract is used as a natural preservative.' }).match).not.toBe('exact');
    expect(formMatch('Green Tea', { passage: 'Green tea extract has been linked to liver injury in dogs.' }).match).not.toBe('exact');
    expect(formMatch('Sunflower Oil', { passage: 'Sunflower oil is a source of linoleic acid.' }).match).toBe('exact');
  });
  it('vitamin E the nutrient and mixed tocopherols the preservative are not each other’s synonyms', () => {
    expect(formMatch('Vitamin E Supplement', { passage: 'Mixed tocopherols are used as natural preservatives.' }).match).not.toBe('synonym');
    expect(formMatch('Mixed Tocopherols', { passage: 'Vitamin E (alpha-tocopherol) is an essential nutrient.' }).match).not.toBe('synonym');
    expect(formMatch('Mixed Tocopherols', { passage: 'Tocopherols are added as preservatives to keep fats fresh.' }).match).toBe('synonym');
  });
  it('an English name that is another form of the label’s own words is not its translation', () => {
    expect(formMatch('Sunflower Oil', { passage: 'Sunflower seeds are a source of methionine.' }, 'sunflower seeds').match).not.toBe('synonym');
    expect(formMatch('Huile de tournesol', { passage: 'Sunflower oil is a source of linoleic acid.' }, 'sunflower oil').match).toBe('synonym');
  });
  it('other pets are not cats or dogs; hot dogs are not dogs; the model’s title can only make the scope stricter', () => {
    const scope = (title: string, url: string, passage: string) => sourceScope({ title, url, passage }).scope;
    expect(scope('Vitamin D3 and Calcium for Pet Reptiles', 'https://vcahospitals.com/test-fixture/reptiles', 'Vitamin D3 supplementation helps pet reptiles kept indoors absorb calcium.')).toBe('other_species');
    expect(scope('Carrageenan in processed meats', 'https://www.ncbi.nlm.nih.gov/pmc/articles/test-fixture', 'Carrageenan is used in hot dogs and other processed meats.')).not.toBe('dog');
    // A passing mention of another animal in a passage about cats does not make it a page about that animal.
    expect(scope('Nutrition in Cats', 'https://www.merckvetmanual.com/test-fixture/nutrition-in-cats', 'Unlike dogs and pigs, cats cannot make enough taurine and must get it from their food.')).not.toBe('other_species');
    expect(scope('TEST FIXTURE', 'https://vcahospitals.com/test-fixture/lamb', 'Lamb meal, made from sheep, is often used as a novel protein in diets for dogs.')).toBe('dog');
    // eCFR animal-feed parts are animal-feed evidence.
    expect(scope('21 CFR 573.620', 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-E/part-573/section-573.620', 'Menadione dimethylpyrimidinol bisulfite may be safely used in animal feed as a nutritional supplement source of vitamin K activity.')).toBe('animal_feed');
    // "Pets" in general support no benefit or risk for cats or dogs.
    expect(scopeProblem('benefit', 'It helps pets absorb calcium.', 'It helps pets kept indoors absorb calcium.', { scope: 'pets', about: 'pets', adj: 'pet' }, 'dog')).toMatch(/pets in general/);
    // A page about people (no species in its title or passage) is not made a cat page by the model's own title for it.
    const p = readPage(fixturePage('LiverTox: Menadione', 'Menadione given in high doses has caused liver injury.'), 'https://www.ncbi.nlm.nih.gov/books/test-fixture-livertox-menadione/');
    const r = checkClaim({ term: 'Menadione Sodium Bisulfite Complex', species: 'cat', page: p, now: NOW, claim: { claim_type: 'risk', claim: 'Menadione given in high doses has caused liver injury.', citation_url: 'https://www.ncbi.nlm.nih.gov/books/test-fixture-livertox-menadione/', citation_title: 'Menadione toxicity in cats', citation_passage: 'Menadione given in high doses has caused liver injury.', ingredient_words_in_passage: 'menadione', source_is_about: 'cats', dose_or_exposure: 'high doses' } });
    expect(r).toMatchObject({ ok: false, reason: expect.stringMatching(/does not say it is about cats, dogs or pets/) });
  });
  it('product-naming rules are recognised by their structure, and ordinary passages are not', () => {
    for (const t of [
      'If it says beef, chicken or mackerel, the food must be true to its major ingredients, and it cannot rely on less expensive byproducts.',
      'For example, in "Mackerel Dinner for Cats," mackerel must be at least 25% of the product.',
      'A product labeled "Cat Food with Mackerel" must contain at least 3% mackerel.',
      'Products such as "Mackerel Cat Food" must consist of at least 95 percent mackerel, not counting water.',
    ]) expect([t, isNamingRule(t)]).toEqual([t, true]);
    for (const t of ['Despite the word meal in the name, chicken meal is a concentrated source of protein for dogs.', 'An amino acid named taurine must be supplied in the diet of cats.'])
      expect([t, isNamingRule(t)]).toEqual([t, false]);
  });
  it('a dose hidden in a name (D3, B12, omega-3) is still an invented number', () => {
    const p = page('Cholecalciferol (vitamin D3) is toxic to dogs even at low doses.');
    const r = checkClaim({ term: 'Vitamin D3 Supplement', species: 'dog', page: p, now: NOW, claim: { claim_type: 'risk', claim: 'Vitamin D3 supplement is toxic to dogs at doses above 3 mg/kg.', citation_url: 'https://vcahospitals.com/test-fixture/x', citation_title: 'TEST FIXTURE', citation_passage: 'Cholecalciferol (vitamin D3) is toxic to dogs even at low doses.', ingredient_words_in_passage: 'vitamin D3', source_is_about: 'dogs', dose_or_exposure: null } });
    expect(r).toMatchObject({ ok: false, reason: expect.stringMatching(/number that is not in the passage \(3\)/) });
  });
});

describe('drug use is not an ingredient’s role in a food (live acceptance run of 2026-10-30, trace 74de5c85-803)', () => {
  it('rejects a therapeutic use or a dose by route, and keeps what the substance is in food', async () => {
    const { isDrugUse } = await import('../../src/knowledge/claims');
    // As the explanation step returned them for the Wellness can's minerals (Merck Veterinary Manual, Pharmacology).
    expect(isDrugUse('Sodium and potassium iodide have both been administered to treat selected bacterial, actinomycete, and fungal infections in animals.', 'Sodium and potassium iodide have been administered to treat selected bacterial, actinomycete, and fungal infections.', 'https://www.merckvetmanual.com/pharmacology/systemic-pharmacotherapeutics-of-the-integumentary-system/iodides-for-use-in-animals')).toBe(true);
    expect(isDrugUse('The passage identifies magnesium sulfate (Epsom salts) and lists oral doses for cats as "Cats: 2–5 g, PO, as needed" in the cathartic/laxative drugs context.', 'Magnesium sulfate (Epsom salts) Cats: 2–5 g, PO, as needed', 'https://www.merckvetmanual.com/pharmacology/systemic-pharmacotherapeutics-of-the-digestive-system/cathartic-and-laxative-drugs-used-in-monogastric-animals')).toBe(true);
    expect(isDrugUse('Used as a laxative agent in dogs.', 'Lactulose is used as a laxative agent.')).toBe(true);
    // What it is and why it is added to a food.
    expect(isDrugUse('Potassium iodide is a source of iodine in complete pet foods.', 'Iodine is supplied in pet foods as potassium iodide or calcium iodate.', 'https://www.aafco.org/consumers/understanding-pet-food/whats-in-the-ingredients-list')).toBe(false);
    expect(isDrugUse('Taurine is an amino acid cats must get from their food.', 'Cats require 0.1% taurine in dry food on a dry matter basis.', 'https://vcahospitals.com/know-your-pet/taurine')).toBe(false);
    expect(isDrugUse('Vitamin E supplementation of 5 mg per kg of food prevents deficiency.', 'Diets should contain at least 30 IU of vitamin E per kg.', 'https://www.merckvetmanual.com/management-and-nutrition/nutrition-small-animals/nutritional-requirements-of-small-animals')).toBe(false);
  });
});
