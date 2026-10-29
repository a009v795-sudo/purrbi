// The short verdict for the selected pet (25-45 words), written by a model from the assessment that
// Purrbi has already computed — never from anything else. The model gets only the computed facts,
// highlights and pet-fit findings as JSON; its sentence is then checked: length, no claims Purrbi does
// not make ("safe", "ideal", "no concerns", health or treatment claims), no number that is not in its
// input, and the most serious caution must be named. Anything that fails the check is replaced by a
// deterministic sentence built from the same findings. Verdicts are cached by their input, so the same
// product and pet never cost a second call. The pet's name never leaves Purrbi: the model sees "your cat"
// or "your dog", and the name is put back only in the copy the app shows.
import { createHash } from 'node:crypto';
import type { Highlight } from '../domain/highlights';
import { SourceError } from '../util/http';
import { chatJson } from './openai';

export const VERDICT_VERSION = 'verdict-1.1.0';

export interface VerdictInput {
  product: { name: string; brand: string; species: string; category: string };
  assessment: { score: number | null; provisional: boolean; label: string; basis: string; withheldReason: string };
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
  pet: { name: string; species: string; fit: string; headline: string } | null;
  positives: Highlight[];
  cautions: Highlight[];
  unresolved: string[];
}): VerdictInput {
  const input: VerdictInput = {
    product: { name: args.productName || 'This product', brand: args.brand, species: args.species, category: args.category },
    assessment: { score: args.score, provisional: args.provisional, label: args.scoreLabel, basis: args.scoreBasis, withheldReason: args.withheldReason },
    pet: args.pet ? { name: petPlaceholder(args.pet.species), species: args.pet.species, fit: args.pet.fit, headline: args.pet.headline } : null,
    positives: args.positives.map((h) => ({ title: h.title, detail: h.detail, value: h.value })),
    cautions: args.cautions.map((h) => ({ title: h.title, detail: h.detail, value: h.value, severity: h.severity, rule: h.rule })),
    unresolved: args.unresolved.slice(0, 3),
  };
  return args.pet?.name ? replaceName(input, args.pet.name, petPlaceholder(args.pet.species)) : input;
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
const trimTo = (s: string, max: number) => {
  const w = words(s);
  return w.length <= max ? s.trim() : `${w.slice(0, max).join(' ').replace(/[,;:]$/, '')}…`;
};

/** A plain verdict from the same findings, used when no model is available or its sentence fails the check. */
export function ruleVerdict(input: VerdictInput): string {
  const first = input.cautions[0];
  const name = input.product.name;
  if (first?.severity === 'alert') return trimTo(`${input.pet?.headline ? `${input.pet.headline}. ` : ''}${first.detail}`, 45);
  const score =
    input.assessment.score === null
      ? input.assessment.withheldReason
      : input.assessment.label === 'Partial assessment'
        ? `Purrbi’s label score for ${name} is ${input.assessment.score}/100 so far, a partial assessment.`
        : `Purrbi’s label score for ${name} is ${input.assessment.score}/100 (${input.assessment.label.toLowerCase()}).`;
  const why = first ? `Check: ${first.detail}` : input.positives[0] ? input.positives[0].detail : '';
  const fit = input.pet?.headline && input.pet.fit !== 'fits' ? `${input.pet.headline}.` : '';
  return trimTo([fit, score, why].filter(Boolean).join(' '), 45);
}

const FORBIDDEN = /\b(safe|safest|ideal|perfect|healthy|healthiest|recommended?|guarantee[sd]?|no concerns?|cures?|treats? (?:allerg|disease)|best|excellent)\b/i;

/** Why a model-written verdict cannot be used, or null if it can. */
export function checkVerdict(text: string, input: VerdictInput): string | null {
  const n = words(text).length;
  if (n < 20 || n > 50) return `length ${n} words`;
  if (FORBIDDEN.test(text)) return `claim Purrbi does not make (“${FORBIDDEN.exec(text)![0]}”)`;
  const source = JSON.stringify(input);
  // "/100" is the scale, not a figure; every other number must come from the assessment.
  const numbers = text.replace(/\/\s*100\b/g, '').match(/\d+(?:[.,]\d+)?/g) ?? [];
  const invented = numbers.find((x) => !source.includes(x));
  if (invented) return `number not in the assessment (${invented})`;
  // The label is used as given: a full assessment is never called partial, nor the reverse.
  const partial = input.assessment.label === 'Partial assessment';
  if (!partial && /\bpartial\b/i.test(text)) return 'calls a full assessment partial';
  if (partial && !/\bpartial\b/i.test(text)) return 'does not say it is a partial assessment';
  const first = input.cautions[0];
  if (first?.severity === 'alert') {
    const named = [first.value, ...(first.rule === 'G-RECALL' ? ['recall'] : []), ...(first.rule === 'P-SPECIES' ? ['dog', 'cat'] : [])].filter(Boolean);
    if (named.length && !named.some((k) => text.toLowerCase().includes(k.toLowerCase()))) return 'does not name the most serious caution';
  }
  return null;
}

const SYSTEM = [
  'You write the verdict a cat or dog owner sees first: one or two plain sentences, 25 to 45 words, saying what Purrbi’s assessment of this product means for their pet.',
  'Use only the facts in the JSON input. Never add facts, numbers, ingredients, health claims or advice that are not in it.',
  'If there is a caution with severity "alert" (a recall match, a product made for another species, an ingredient in the pet’s allergy profile), start with it.',
  'Call the score “Purrbi’s label score” and use the assessment label exactly as given. Only if the label is “Partial assessment”, say it is a partial assessment; if provisional is true with any other label, you may say some optional label details are not confirmed yet. If there is no score, say what is missing.',
  'If there is no pet, speak about the product in general.',
  'Never say safe, ideal, perfect, healthy, best, excellent, recommended, guaranteed or “no concerns”; say “no documented concerns in Purrbi’s reviewed list” only if a positive says so. Do not give veterinary advice.',
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
