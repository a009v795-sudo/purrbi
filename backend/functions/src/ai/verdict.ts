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

export const VERDICT_VERSION = 'verdict-2.1.0'; // 2.1.0: the most serious caution is named by what it is; the pet's name is replaced before any text is cut; product names are not claims

export interface VerdictInput {
  product: { name: string; brand: string; species: string; category: string };
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
    product: { name: args.productName || 'This product', brand: args.brand, species: args.species, category: args.category },
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

/** Why a model-written verdict cannot be used, or null if it can. */
export function checkVerdict(text: string, input: VerdictInput): string | null {
  const n = words(text).length;
  if (n < MIN_WORDS || n > MAX_WORDS) return `length ${n} words`;
  // It must interpret the findings, not restate the score's missing-information message.
  if (/not enough information to score|label score is not|preventing a full assessment|scoring engine|partial assessment|between \d+ and \d+/i.test(text)) return 'repeats the missing-information message instead of interpreting the findings';
  if (/…|\.\.\./.test(text)) return 'trailing ellipsis';
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
