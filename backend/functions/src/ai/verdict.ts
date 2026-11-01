// The short verdict for the selected pet (25-40 words), written by a model from the assessment that
// Purrbi has already computed — never from anything else. The model gets only the computed facts,
// highlights and pet-fit findings as JSON; its sentence is then checked: length, no claims Purrbi does
// not make ("safe", "ideal", "no concerns", health or treatment claims), no number that is not in its
// input, the most serious caution must be named, and it must interpret the findings rather than repeat
// the score's missing-information message. Anything that fails the check is replaced by a
// deterministic sentence built from the same findings. Verdicts are cached by their input, so the same
// product and pet never cost a second call. The pet's name never leaves Purrbi: the model sees "your cat"
// or "your dog", and the name is put back only in the copy the app shows.
import { createHash } from 'node:crypto';
import type { Highlight } from '../domain/highlights';
import { SourceError } from '../util/http';
import { chatJson } from './openai';

export const VERDICT_VERSION = 'verdict-2.2.0'; // 2.2.0: who the product is for is stated only as confirmed as it is (a retailer's listing is not the package); what Purrbi has not found is never said to be missing from the product. 2.1.0: the most serious caution is named by what it is; the pet's name is replaced before any text is cut; product names are not claims

export interface VerdictInput {
  /** speciesConfirmed: false when only a retailer's listing says who it is for (speciesBasis says what does). */
  product: { name: string; brand: string; species: string; category: string; speciesConfirmed?: boolean; speciesBasis?: string };
  assessment: { score: number | null; provisional: boolean; label: string; basis: string; withheldReason: string; missing: string; coverage?: number | null; low?: number | null; high?: number | null; concerns?: string[] };
  pet: { name: string; species: string; fit: string; headline: string } | null;
  positives: { title: string; detail: string; value: string }[];
  cautions: { title: string; detail: string; value: string; severity: string; rule: string }[];
  unresolved: string[];
}

export function verdictInput(args: {
  productName: string;
  brand: string;
  species: string;
  /** Whether the product's own evidence (package, feeding statement, maker, pet database) says who it is for. */
  speciesConfirmed?: boolean;
  /** What says who it is for, in words ("a retailer’s listing"). */
  speciesBasis?: string;
  category: string;
  score: number | null;
  provisional: boolean;
  scoreLabel: string;
  scoreBasis: string;
  withheldReason: string;
  missing?: string[];
  coverage?: number | null;
  low?: number | null;
  high?: number | null;
  /** The documented concerns that cap the score (ingredient names). */
  concerns?: string[];
  pet: { name: string; species: string; fit: string; headline: string } | null;
  positives: Highlight[];
  cautions: Highlight[];
  unresolved: string[];
}): VerdictInput {
  const full: VerdictInput = {
    product: { name: args.productName || 'This product', brand: args.brand, species: args.species, category: args.category, speciesConfirmed: args.speciesConfirmed ?? true, ...(args.speciesBasis ? { speciesBasis: args.speciesBasis } : {}) },
    assessment: { score: args.score, provisional: args.provisional, label: args.scoreLabel, basis: args.scoreBasis, withheldReason: args.withheldReason, missing: (args.missing ?? []).join(' and the '), coverage: args.coverage ?? null, low: args.low ?? null, high: args.high ?? null, concerns: args.concerns ?? [] },
    pet: args.pet ? { name: petPlaceholder(args.pet.species), species: args.pet.species, fit: args.pet.fit, headline: args.pet.headline } : null,
    positives: args.positives.map((h) => ({ title: h.title, detail: h.full ?? h.detail, value: h.value })),
    cautions: args.cautions.map((h) => ({ title: h.title, detail: h.full ?? h.detail, value: h.value, severity: h.severity, rule: h.rule })),
    unresolved: args.unresolved.slice(0, 3),
  };
  // The name is replaced in the whole texts first: a text cut through the name would leave part of it in.
  const input = args.pet?.name ? replaceName(full, args.pet.name, petPlaceholder(args.pet.species)) : full;
  return { ...input, positives: input.positives.map((h) => ({ ...h, detail: cut(h.detail, 160) })), cautions: input.cautions.map((h) => ({ ...h, detail: cut(h.detail, 160) })) };
}

/** At most `n` characters, ending at a sentence or word boundary. */
function cut(s: string, n: number): string {
  if (s.length <= n) return s;
  const head = s.slice(0, n);
  const stop = head.lastIndexOf('. ');
  if (stop > n * 0.5) return head.slice(0, stop + 1);
  const space = head.lastIndexOf(' ');
  return (space > n * 0.6 ? head.slice(0, space) : head).replace(/[,;:]$/, '').trim();
}

/** What the model calls the pet instead of its name. */
export const petPlaceholder = (species: string) => (species === 'dog' ? 'your dog' : species === 'cat' ? 'your cat' : 'your pet');

const escapeRe = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wholeWord = (w: string) => new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(w)}(?![\\p{L}\\p{N}])`, 'gu');

function replaceName<T>(value: T, name: string, placeholder: string): T {
  const re = wholeWord(name);
  const walk = (v: unknown): unknown => (typeof v === 'string' ? v.replace(re, placeholder) : Array.isArray(v) ? v.map(walk) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)])) : v);
  return walk(value) as T;
}

/** The app's copy: "your cat" becomes the pet's name again. */
export function withPetName(text: string, species: string, name: string | null | undefined): string {
  if (!name) return text;
  const ph = petPlaceholder(species);
  return text.replace(wholeWord(ph[0].toUpperCase() + ph.slice(1)), name).replace(wholeWord(ph), name);
}

export const verdictKey = (input: VerdictInput, model: string) => createHash('sha256').update(`${VERDICT_VERSION}|${model}|${JSON.stringify(input)}`).digest('hex').slice(0, 32);

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean);
const sentence = (s: string) => {
  const t = s.trim().replace(/…$/, '').replace(/[,;:]$/, '');
  return /[.!?]$/.test(t) ? t : `${t}.`;
};

const MIN_WORDS = 25;
const MAX_WORDS = 40;

/**
 * A plain verdict from the same findings, used when no model is available or its sentence fails the
 * check: whole sentences (never cut with "…"), 25 to 40 words, the most serious caution first, then what
 * the findings mean; an unscored product gets one short clause on what a rating still needs.
 */
export function ruleVerdict(input: VerdictInput): string {
  const first = input.cautions[0];
  const name = input.product.name;
  const a = input.assessment;
  // The most serious caution first, without repeating the ingredient's name ("propylene glycol: …").
  const lead = first?.title.split(':')[0] ?? '';
  const alert = first?.severity === 'alert' ? (first.detail.toLowerCase().startsWith(lead.toLowerCase()) ? first.detail : `${first.title}: ${first.detail}`) : '';
  const opening = alert || (input.pet?.headline && input.pet.fit !== 'fits' ? input.pet.headline : '');
  // A capped score names its cause unless the opening sentence already did; an unscored product says only
  // that it is not rated yet (the screen lists what a rating needs).
  const cause = a.concerns?.length && !alert ? ` because it contains ${a.concerns.slice(0, 2).join(' and ')}, a documented ingredient concern` : '';
  const score = (short: boolean) =>
    a.score === null
      ? 'Not rated yet.'
      : a.label === 'Serious concern'
        ? `Its Purrbi score is ${a.score}/100 (serious concern)${cause}.`
        : short
          ? `Purrbi score: ${a.score}/100 (${a.label.toLowerCase()}).`
          : `Purrbi scores ${name} ${a.score}/100 (${a.label.toLowerCase()}).`;
  const fits = (parts: string[]) => words(parts.join(' ')).length <= MAX_WORDS;
  let required = [opening, score(false)].filter(Boolean).map(sentence);
  if (!fits(required)) required = [opening, score(true)].filter(Boolean).map(sentence);
  // Each finding as its sentence, or by its title when the sentence would not fit.
  const lowerFirst = (t: string) => (/^[A-Z][a-z]/.test(t) ? t[0].toLowerCase() + t.slice(1) : t);
  const item = (prefix: string, h: VerdictInput['positives'][number] | undefined): [string, string] => (h ? [`${prefix}: ${h.detail}`, `${prefix}: ${lowerFirst(h.title)}`] : ['', '']);
  const optional: [string, string][] = [
    item('Good to know', input.positives[0]),
    first && first.severity !== 'alert' ? item('To check', first) : ['', ''],
    item('Also check', input.cautions[1]),
    item('Also', input.positives[1]),
    [input.unresolved[0] ?? '', ''],
    ['The details and their sources are listed below.', ''],
  ];
  const out = [...required];
  for (const [long, short] of optional) {
    if (long && fits([...out, sentence(long)])) out.push(sentence(long));
    else if (short && fits([...out, sentence(short)])) out.push(sentence(short));
  }
  const closing = 'Purrbi’s findings come from the label information it found and are not a veterinary review.';
  if (words(out.join(' ')).length < MIN_WORDS && fits([...out, closing])) out.push(closing);
  let text = out.join(' ');
  // A single very long statement: end it at the last full stop before the limit, else at the limit.
  if (words(text).length > MAX_WORDS) {
    const head = words(text).slice(0, MAX_WORDS).join(' ');
    const stop = head.lastIndexOf('. ');
    text = stop > 40 ? head.slice(0, stop + 1) : sentence(head.replace(/[,;:]$/, ''));
  }
  return text;
}

// Claims Purrbi never makes, whatever the evidence: safety, quality superlatives, health or treatment claims.
const FORBIDDEN =
  /\b(safe|safer|safest|ideal|perfect|healthy|healthier|healthiest|nutritious|wholesome|great|excellent|outstanding|amazing|superb|superior|premium|top[- ]quality|high[- ]quality|quality food|best|recommended?|recommends|guarantee[sd]? (?:that|it|this|your|to|safe)|no concerns?|risk[- ]free|cures?|prevents?|treats? (?:allerg\w*|disease\w*|illness\w*)|heals?|vet[- ]approved|clinically)\b/i;

// The items a sentence may wrongly say the product lacks. Purrbi never knows that a product has no feeding statement,
// analysis, ingredient list or calorie statement: it has or has not found them. So these are always checked, whatever
// the assessment lists as missing (a complete food's calories and a treat's analysis can be "not found yet" without being
// missing for the score). "Complete and balanced" only while the adequacy statement is not found: a treat labeled for
// intermittent feeding truly is not labeled complete and balanced (review of verdict 2.2.0).
const LACKABLE = [
  '(?:nutritional\\s+)?adequacy(?:\\s+statement)?',
  'statement\\s+of\\s+(?:nutritional\\s+)?adequacy',
  'feeding\\s+statement',
  'aafco\\s+statement',
  '(?:guaranteed\\s+)?analysis',
  '(?:moisture|fiber|fibre|protein|fat|further|minimum|maximum)\\s+guarantees?',
  'guarantees',
  'ingredients?\\s+list',
  'list\\s+of\\s+ingredients',
  'calori\\w*(?:\\s+(?:content|statement|count))?',
  'nutrition(?:al)?\\s+(?:information|details|facts|panel)',
];
const COMPLETE_AND_BALANCED = 'complete[- ]and[- ]balanced(?:\\s+(?:statement|claim))?';
// Words that may stand before an item: "lacks an AAFCO nutritional adequacy statement", "the required feeding statement".
const ITEM_LEAD = '(?:(?:a|an|the|its|any|clear|full|printed|nutritional|guaranteed|complete|aafco|required|official|proper|standard|usual|valid|explicit|specific|formal|feeding|adequacy)\\s+){0,3}';

// Where one clause of a sentence ends: a full stop (not a decimal point), semicolon, comma, colon, dash or bracket.
const CLAUSE_END = /[;,:—–!?()]|\.(?!\d)/g;
/** The clause before `at`, from the last clause end. */
function clauseBefore(text: string, at: number): string {
  const before = text.slice(0, at);
  let cut = 0;
  for (const m of before.matchAll(CLAUSE_END)) cut = (m.index ?? 0) + 1;
  return before.slice(cut);
}
/** The clause after `at`, up to the next clause end. */
function clauseAfter(text: string, at: number): string {
  const after = text.slice(at);
  const m = new RegExp(CLAUSE_END.source).exec(after);
  return m ? after.slice(0, m.index) : after;
}
/**
 * The subject of the words at `at`, as its parts: its clause after the last subordinating word ("… named by source but
 * [] lacks …", "Purrbi notes that [it] lacks …"), split at "and" and "or" ("[its package] and [listing] don't …").
 */
function subjectBefore(text: string, at: number): string[] {
  const parts = clauseBefore(text, at).split(/\b(?:but|so|that|which|who|while|because|though|although|since|as|yet|whereas|where|when|if|however)\b/i);
  return parts[parts.length - 1].split(/\b(?:and|or|nor)\b/i).map((x) => x.trim());
}

// A subject that is Purrbi or what it read: "Purrbi", "Purrbi's record for this product", "the retailer's listing", "the
// information Purrbi found" (never the product, its package or its label).
const SEARCH_SUBJECT = new RegExp(
  String.raw`^(?:(?:the|its|this|a|an|one)\s+)?(?:(?:retailer|maker|manufacturer|shop|seller|store|brand|web|online)(?:[’']s)?\s+)?(?:(?:product|own|only)\s+)?` +
    String.raw`(?:purrbi(?:[’']s)?(?:\s+(?:records?|search(?:es)?|information|data|sources?|checks?))?|records?|information|data|search(?:es)?|listings?|pages?|sources?|results?)` +
    String.raw`(?:\s+(?:for|of|about|on)\s+(?:it|this(?:\s+[\p{L}-]+)?|the\s+product))?(?:\s+purrbi\s+(?:found|read|checked|saw|has|had))?` +
    String.raw`(?:\s+(?:has|have|had|found|finds|saw|sees|read|reads|checked|got|is|are|was|were|still|also|itself))*$`,
  'iu',
);
// Wording after it that makes it about the search: "was found", "not found yet", "so far", "on the page Purrbi read".
const SEARCH_AFTER = /\b(?:(?:was|were|been|be|is|are)\s+(?:yet\s+)?(?:found|located|seen)|(?:not|never)\s+(?:yet\s+)?(?:found|located|seen)|(?:found|located|seen)\s+(?:yet|so\s+far)|yet|so\s+far|purrbi)\b/i;
const PAGE_AFTER = /^\s*(?:on|in|from)\s+(?:(?:the|its|a|any|this|these)\s+)?(?:[\p{L}’']+\s+){0,2}(?:page|pages|listing|listings|record|records|source|sources|results)\b/iu;

/**
 * A sentence saying the product lacks, has no, omits or does not show one of the label items (which Purrbi has only not
 * found, or has found). The item must be what the wording refers to, and the statement about the product: one whose
 * subject is Purrbi or what it read ("Purrbi has no feeding statement for it yet", "the retailer's listing has no
 * adequacy statement"), or that says it was not found, passes (test B; review of verdict 2.2.0).
 */
function saysProductLacks(text: string, assessment: { missing: string; basis: string }): boolean {
  // What Purrbi has not found: the score's missing items and the parts its basis names as not found yet.
  const notFound = `${assessment.missing} ${/;\s*([^.;]*?)\s+not found yet/.exec(assessment.basis ?? '')?.[1] ?? ''}`;
  const adequacyNotFound = /adequacy|complete and balanced|feeding statement/i.test(notFound);
  const item = `(?:${[...LACKABLE, ...(adequacyNotFound ? [COMPLETE_AND_BALANCED] : [])].join('|')})`;
  const lead = ITEM_LEAD;
  const negations = [
    `\\b(?:lacks?|lacking|without|omits?|omitting)\\s+${lead}${item}\\b`,
    `\\b(?:has|have|had|with|there(?:[’']s|\\s+is|\\s+are|\\s+was)|shows?|gives?|carries|lists)\\s+no\\s+${lead}${item}\\b`,
    `\\b(?:no|missing)\\s+${lead}${item}\\b`,
    `\\b${item}\\s+(?:is|are)\\s+(?:missing|absent|lacking|not\\s+(?:given|listed|printed|stated|shown|included|provided))\\b`,
    `\\b(?:doesn[’']t|does\\s+not|don[’']t|do\\s+not|didn[’']t|did\\s+not)\\s+(?:have|include|carry|state|list|show|provide|give|mention|contain|print|bear)\\s+${lead}${item}\\b`,
    adequacyNotFound ? `\\b(?:isn[’']t|is\\s+not)\\s+(?:labell?ed\\s+|stated\\s+as\\s+|described\\s+as\\s+|shown\\s+as\\s+)?complete[- ]and[- ]balanced\\b` : '',
  ].filter(Boolean);
  // Looser wording, only for what Purrbi has not found: the item a few words on ("doesn't list how many calories it has").
  const loose = [
    adequacyNotFound ? 'adequacy|complete[- ]and[- ]balanced|feeding\\s+statement|aafco' : '',
    /analysis|guarantee/i.test(notFound) ? 'analysis|guarantee\\w*' : '',
    /ingredient/i.test(notFound) ? 'ingredients?' : '',
    /calori/i.test(notFound) ? 'calori\\w*' : '',
  ].filter(Boolean);
  if (loose.length) negations.push(`\\b(?:lacks?|lacking|has\\s+no|have\\s+no|(?:doesn[’']t|does\\s+not|don[’']t|do\\s+not)\\s+(?:have|include|carry|state|list|show|provide|give|mention|print|say)|(?:is|are)\\s+missing|missing)\\b[^.;,:]{0,30}?\\b(?:${loose.join('|')})\\b`);
  for (const source of negations) {
    for (const m of text.matchAll(new RegExp(source, 'giu'))) {
      const at = m.index ?? 0;
      const rest = clauseAfter(text, at + m[0].length);
      // About Purrbi or the pages it read, not the product: every part of the subject is.
      if (subjectBefore(text, at).every((x) => SEARCH_SUBJECT.test(x))) continue;
      if (SEARCH_AFTER.test(rest) || PAGE_AFTER.test(rest)) continue;
      return true;
    }
  }
  return false;
}

const SPECIES_NOUN = '(?:cats?|dogs?|kittens?|pupp(?:y|ies)|felines?|canines?)';
const SPECIES_PLURAL = '(?:cats|dogs|kittens|puppies|felines|canines)';
const SPECIES_MODS = '(?:(?:all|adult|senior|indoor|outdoor|small|large|young|mature|older|growing|active|picky|fussy)\\s+){0,2}';
// What a "for cats" describes when it is a claim about this product: it ("it is for cats"), the product's kind of food
// ("a pate for cats"), its name, or its suitability ("suitable for cats"); not "toxic for cats".
const PRODUCT_WORDS = '(?:(?:it|this|that)(?:\\s+is|[’\']s)|is|are|food|foods|treat|treats|product|diet|recipe|pate|pâté|meal|formula|topper|snack|kibble|dinner|entr[eé]e|pouch|can|bag|item|suitable|suited|appropriate)';
const THIS_ONE = String.raw`(?:it|this(?:\s+[\p{L}-]+)?|the\s+product)`;
/**
 * A hedge or attribution directly in front of a claim about who the product is for: "a retailer lists it (as)", "a
 * retailer's listing says it is", "listed (by a retailer) (as)", "Purrbi couldn't confirm (whether) it is (also)", "it
 * isn't confirmed as", "unclear whether it is", "it may (not) be". Only right in front: "a retailer lists it and it is
 * made for cats", "your cat may enjoy it since it is made for cats" state it (review of verdict 2.2.0).
 */
const SPECIES_HEDGE_BEFORE = new RegExp(
  `(?:${[
    String.raw`\b(?:retailers?|listings?|sellers?|shops?|stores?)(?:[’']s)?(?:\s+(?:own\s+)?listings?)?\s+(?:lists?|listed|says?|said|describes?|described|calls?|called|shows?|showed)(?:\s+(?:that\s+)?${THIS_ONE})?(?:\s+(?:is|as))?`,
    String.raw`\blisted(?:\s+by\s+(?:a|the|one)\s+(?:[\p{L}-]+\s+)?(?:retailers?|sellers?|shops?|stores?))?(?:\s+as)?`,
    String.raw`\b(?:couldn[’']t|could\s+not|cannot|can[’']t|can\s+not|isn[’']t|is\s+not|aren[’']t|are\s+not|not|unable\s+to|hasn[’']t|has\s+not|haven[’']t|have\s+not)(?:\s+yet)?(?:\s+been)?(?:\s+able\s+to)?\s+confirm(?:ed)?(?:\s+(?:whether|that|if))?(?:\s+${THIS_ONE})?(?:\s+(?:is|as|to\s+be))?(?:\s+(?:also|really|actually))?`,
    String.raw`\b(?:unclear|uncertain|unconfirmed|unknown|not\s+known|not\s+clear)\s+(?:whether|if)\s+${THIS_ONE}\s+is(?:\s+also)?`,
    String.raw`\b(?:may|might)(?:\s+not)?(?:\s+also)?\s+be`,
  ].join('|')})\\s+$`,
  'iu',
);
// An attribution right after it: "made for cats, according to a retailer's listing".
const SPECIES_HEDGE_AFTER = /^\s*,?\s*(?:according\s+to|as\s+(?:listed|stated|described)\s+by|per)\s+(?:(?:a|an|the|its|one)\s+)?(?:[\p{L}’'-]+\s+){0,2}?(?:retailers?|listings?|sellers?|shops?|stores?)(?:[’']s)?\b/iu;

/** Where whole-word copies of the given texts stand in `text` (case aside). */
function spansOf(text: string, texts: (string | null | undefined)[]): [number, number][] {
  const out: [number, number][] = [];
  for (const t of texts) {
    const w = t?.trim();
    if (!w || w.length < 3) continue;
    for (const m of text.matchAll(new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(w)}(?![\\p{L}\\p{N}])`, 'giu'))) out.push([m.index ?? 0, (m.index ?? 0) + m[0].length]);
  }
  return out;
}

/**
 * A sentence stating who the product is for as fact: made, formulated, designed, intended or meant for cats (adjectives
 * and "for use in" allowed), made for your cat, it is / a food / the product for cats, this cat food; unless a hedge or
 * attribution stands directly in front of it, or an attribution directly after. A claim inside the product's own name or
 * brand, or inside the words of Purrbi's own findings given to the model ("prohibited in or on cat food"), is not
 * Purrbi's claim; the bare "cat food" form is allowed when the name itself names the species.
 */
function assertsSpecies(text: string, product: { name?: string | null; brand?: string | null }, findingTexts: string[] = []): boolean {
  const own = spansOf(text, [product.name, product.brand, ...findingTexts]);
  const nameNamesSpecies = new RegExp(`\\b${SPECIES_NOUN}\\b`, 'i').test(product.name ?? '');
  const names = [product.name, product.brand].map((n) => n?.trim()).filter((n): n is string => !!n && n.length > 2).map(escapeRe);
  const before = `(?:${[PRODUCT_WORDS, ...names].join('|')})`;
  const claims = [
    `\\b(?:made|formulated|designed|intended|meant|developed|created|crafted|tailored|specifically)\\s+(?:[\\p{L}-]+\\s+){0,2}for\\s+(?:use\\s+(?:in|by|with)\\s+)?(?:(?:a|an|your)\\s+)?${SPECIES_MODS}${SPECIES_NOUN}(?:[’']s\\s+species)?\\b`,
    `(?<![\\p{L}\\p{N}])${before}\\s+(?:(?:also|only|mainly|mostly|specifically|just)\\s+)?for\\s+(?:use\\s+(?:in|by|with)\\s+)?${SPECIES_MODS}${SPECIES_PLURAL}\\b`,
    `(?<![\\p{L}\\p{N}])${before}\\s+for\\s+(?:a|an)\\s+${SPECIES_MODS}(?:cat|dog|kitten|puppy)\\b(?![’'])`,
    nameNamesSpecies ? '' : `\\b(?:a|an|this|the|its|that)\\s+(?:(?:wet|dry|canned|complete|senior|adult|kitten|puppy|grain[- ]free|premium)\\s+){0,2}(?:cat|dog|kitten|puppy|feline|canine)\\s+(?:food|treat|diet|snack|meal|pate|pâté|formula|recipe|kibble|topper|dinner|entr[eé]e|product)s?\\b`,
  ].filter(Boolean);
  // A shorter claim inside a hedged one ("for cats" in "a retailer lists it as made for cats") is that claim.
  const hedged: [number, number][] = [];
  for (const [n, source] of claims.entries()) {
    for (const m of text.matchAll(new RegExp(source, 'giu'))) {
      const at = m.index ?? 0;
      const end = at + m[0].length;
      if (own.some(([a, b]) => at >= a && end <= b)) continue;
      if (hedged.some(([a, b]) => at < b && end > a)) continue;
      // "It is unclear whether it is also [for dogs]": the hedge is tested in front of the "for" a "for cats" claim turns on.
      const fors = n === 1 || n === 2 ? [...m[0].matchAll(/\bfor\s/gi)] : [];
      const hedgeAt = fors.length ? at + (fors[fors.length - 1].index ?? 0) : at;
      if (SPECIES_HEDGE_BEFORE.test(text.slice(Math.max(0, hedgeAt - 120), hedgeAt)) || SPECIES_HEDGE_AFTER.test(text.slice(end))) {
        hedged.push([at, end]);
        continue;
      }
      return true;
    }
  }
  return false;
}

/** Why a model-written verdict cannot be used, or null if it can. */
export function checkVerdict(text: string, input: VerdictInput): string | null {
  const n = words(text).length;
  if (n < MIN_WORDS || n > MAX_WORDS) return `length ${n} words`;
  // It must interpret the findings, not restate the score's missing-information message.
  if (/not enough information to score|label score is not|preventing a full assessment|scoring engine|partial assessment|between \d+ and \d+/i.test(text)) return 'repeats the missing-information message instead of interpreting the findings';
  if (/…|\.\.\./.test(text)) return 'trailing ellipsis';
  // What Purrbi has not found is not missing from the product (test B: "it lacks a nutritional adequacy statement").
  if (saysProductLacks(text, input.assessment)) return 'says the product lacks what Purrbi has not found';
  // Who it is for is stated only as confirmed as it is: a retailer's listing is not the package (test B).
  if (input.product.speciesConfirmed === false && assertsSpecies(text, input.product, [...input.positives, ...input.cautions].flatMap((h) => [h.title, h.detail, h.value]))) return 'states who it is for as confirmed when only a retailer lists it';
  // A product's own name ("Perfect Portions", "Healthy Kitten") is not a claim Purrbi makes.
  const claims = [input.product.name, input.product.brand].filter((x) => x && x.length > 2).reduce((t, x) => t.replace(new RegExp(escapeRe(x), 'gi'), ' '), text);
  if (FORBIDDEN.test(claims)) return `claim Purrbi does not make (“${FORBIDDEN.exec(claims)![0]}”)`;
  // A score in the sentence must be the score; every other number must be one the assessment states.
  for (const m of text.matchAll(/(\d+(?:[.,]\d+)?)\s*(?:\/|out of)\s*100\b/gi)) {
    if (input.assessment.score === null || Number(m[1]) !== input.assessment.score) return `score not the assessment’s (${m[1]})`;
  }
  const stated = new Set(
    [String(input.assessment.score ?? ''), input.assessment.basis, ...input.positives.flatMap((h) => [h.title, h.detail, h.value]), ...input.cautions.flatMap((h) => [h.title, h.detail, h.value]), ...input.unresolved, input.product.name, input.pet?.headline ?? '']
      .join(' ')
      .match(/\d+(?:[.,]\d+)?/g) ?? [],
  );
  const others = text.replace(/(\d+(?:[.,]\d+)?)\s*(?:\/|out of)\s*100\b/gi, ' ').match(/\d+(?:[.,]\d+)?/g) ?? [];
  const invented = others.find((x) => !stated.has(x));
  if (invented) return `number not in the assessment (${invented})`;
  // An unscored product is never given a number as if it were a score.
  if (input.assessment.score === null && /\d+\s*(?:\/|out of)\s*100\b/i.test(text)) return 'gives a score to an unscored product';
  const first = input.cautions[0];
  if (first?.severity === 'alert') {
    // Named by what it is: the recall, the ingredient (a documented concern or the pet's allergen), or who
    // the product is made for ("your cat" does not count: the placeholder is in every verdict).
    const lower = text.toLowerCase();
    const withoutPet = input.pet ? lower.replace(new RegExp(escapeRe(petPlaceholder(input.pet.species)), 'g'), ' ') : lower;
    const madeFor = input.product.species === 'cat' ? ['cats', 'cat food', 'cat treat', 'for cats'] : input.product.species === 'dog' ? ['dogs', 'dog food', 'dog treat', 'for dogs'] : [];
    const named = (
      first.rule === 'G-RECALL' || first.rule === 'P-ALERT'
        ? ['recall']
        : first.rule === 'P-SPECIES'
          ? madeFor
          : first.rule === 'P-HAZARD' || first.rule === 'G-KB-CONCERN'
            ? [first.title.split(':')[0]]
            : [first.value]
    ).filter((x) => x && x.length > 2);
    const haystack = first.rule === 'P-SPECIES' ? withoutPet : lower;
    if (named.length && !named.some((k) => haystack.includes(k.toLowerCase()))) return 'does not name the most serious caution';
  }
  // With findings to interpret, at least one of them is named.
  const findingNames = [...input.positives, ...input.cautions].flatMap((h) => [h.title, h.value]).filter((x) => x && x.length > 2);
  if (findingNames.length && !findingNames.some((x) => text.toLowerCase().includes(x.toLowerCase().split(':')[0].split(' (')[0]))) {
    const keywords = [...input.positives, ...input.cautions].flatMap((h) => h.title.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 4));
    if (!keywords.some((k) => text.toLowerCase().includes(k))) return 'does not interpret any of the findings';
  }
  return null;
}

const SYSTEM = [
  'You write the verdict a cat or dog owner sees first: one or two plain sentences, between 25 and 40 words (count them), interpreting what Purrbi’s findings mean for their pet.',
  'Use only the facts in the JSON input. Never add facts, numbers, ingredients, health claims or advice that are not in it.',
  'If there is a caution with severity "alert" (a recall match, a product made for another species, an ingredient in the pet’s allergy profile), start with it.',
  'Interpret the positives and cautions: say what they mean for this pet. Do not restate missing-information messages; the screen shows them. If there is a score, call it the Purrbi score and give it as “N/100” with its label in lower case. If there is no score, you may say in a few words that it is not rated yet; never give a number out of 100.',
  'If there is no pet, speak about the product in general.',
  'If product.speciesConfirmed is false, only a retailer’s listing says who the product is for: never say it is made, formulated or intended for that species; you may say a retailer lists it for them.',
  'The assessment’s missing items are what Purrbi has not found yet, not something the product lacks: never say the product lacks, has no or is missing them.',
  'Never praise or judge the product beyond the findings: never say safe, ideal, perfect, healthy, nutritious, great, excellent, premium, high-quality, best, recommended, guaranteed or “no concerns”, and never make health or treatment claims. Do not give veterinary advice. Write numbers only as they appear in the input, and the score only as given.',
].join(' ');

export async function writeVerdict(opts: { apiKey: string | undefined; model: string; input: VerdictInput }): Promise<{ text: string; model: string }> {
  // OPENAI_VERDICT_MODEL may list several models: one that rejects the request (HTTP 400/404) or returns
  // no usable output hands over to the next.
  const models = opts.model.split(',').map((m) => m.trim()).filter(Boolean);
  let lastError: unknown = new SourceError('OpenAI', 'config', 'no verdict model configured');
  for (const m of models) {
    try {
      const { data, model } = await chatJson<{ verdict: string }>({
        apiKey: opts.apiKey,
        model: m,
        system: SYSTEM,
        userContent: [{ type: 'text', text: JSON.stringify(opts.input) }],
        format: { name: 'pet_verdict', schema: { type: 'object', additionalProperties: false, required: ['verdict'], properties: { verdict: { type: 'string' } } } },
        timeoutMs: 30000,
        maxTokens: 300,
      });
      return { text: String(data.verdict ?? '').replace(/\s+/g, ' ').trim(), model };
    } catch (err) {
      lastError = err;
      if (!(err instanceof SourceError && (err.kind === 'parse' || err.status === 400 || err.status === 404))) throw err;
    }
  }
  throw lastError;
}
