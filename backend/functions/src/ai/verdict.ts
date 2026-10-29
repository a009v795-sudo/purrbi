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

export const VERDICT_VERSION = 'verdict-1.2.0';

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
    positives: args.positives.map((h) => ({ title: h.title, detail: (h.full ?? h.detail).slice(0, 160), value: h.value })),
    cautions: args.cautions.map((h) => ({ title: h.title, detail: (h.full ?? h.detail).slice(0, 160), value: h.value, severity: h.severity, rule: h.rule })),
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
const sentence = (s: string) => {
  const t = s.trim().replace(/…$/, '');
  return /[.!?]$/.test(t) ? t : `${t}.`;
};

/**
 * A plain verdict from the same findings, used when no model is available or its sentence fails the
 * check: whole sentences (never cut with "…"), 25 to 45 words, the most serious caution first.
 */
export function ruleVerdict(input: VerdictInput): string {
  const first = input.cautions[0];
  const name = input.product.name;
  const a = input.assessment;
  const score =
    a.score === null
      ? a.withheldReason || `Purrbi hasn’t scored ${name} yet.`
      : a.label === 'Partial assessment'
        ? `Purrbi’s label score for ${name} is ${a.score}/100 so far, a partial assessment.`
        : a.label === 'Documented ingredient concern'
          ? `Purrbi’s label score for ${name} is capped at ${a.score}/100 because of a documented ingredient concern.`
          : `Purrbi’s label score for ${name} is ${a.score}/100 (${a.label.toLowerCase()}).`;
  const required = [first?.severity === 'alert' ? `${first.title}: ${first.detail}` : input.pet?.headline && input.pet.fit !== 'fits' ? input.pet.headline : '', score].filter(Boolean).map(sentence);
  const optional = [
    first && first.severity !== 'alert' ? `To check: ${first.detail}` : '',
    input.cautions[1] ? `Also check: ${input.cautions[1].detail}` : '',
    input.positives[0] ? `Good to know: ${input.positives[0].detail}` : '',
    input.unresolved[0] ?? '',
    'The details and their sources are listed below.',
  ].filter(Boolean).map(sentence);
  const out = [...required];
  for (const s of optional) if (words([...out, s].join(' ')).length <= 45) out.push(s);
  if (words(out.join(' ')).length < 25) out.push('Purrbi’s findings come from the label information it found and are not a veterinary review.');
  let text = out.join(' ');
  // A single very long statement: end it at the last full stop before word 45, else at word 45.
  if (words(text).length > 45) {
    const head = words(text).slice(0, 45).join(' ');
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
  if (n < 25 || n > 45) return `length ${n} words`;
  if (/…|\.\.\./.test(text)) return 'trailing ellipsis';
  if (FORBIDDEN.test(text)) return `claim Purrbi does not make (“${FORBIDDEN.exec(text)![0]}”)`;
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
  'You write the verdict a cat or dog owner sees first: one or two plain sentences, between 25 and 45 words (count them), saying what Purrbi’s assessment of this product means for their pet.',
  'Use only the facts in the JSON input. Never add facts, numbers, ingredients, health claims or advice that are not in it.',
  'If there is a caution with severity "alert" (a recall match, a product made for another species, an ingredient in the pet’s allergy profile), start with it.',
  'Call the score “Purrbi’s label score” and use the assessment label exactly as given. Only if the label is “Partial assessment”, say it is a partial assessment and say how much of the label could be assessed or the range the complete label could give (both are in basis), never the score alone as if it were final; if provisional is true with any other label, you may say some optional label details are not confirmed yet. If there is no score, say what is missing.',
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
