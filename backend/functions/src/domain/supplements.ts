// Supplements get an informational assessment instead of a score: what the label says it is for,
// which actives it lists and how much, documented safety notes, evidence notes (cited and verified,
// or plainly "not reviewed yet") and the limits of what a label can tell. Deterministic; the cited
// evidence notes are attached later from the explanation cache.
import { normalizeIngredientName } from './ingredients';
import type { ActiveIngredient, Finding, GuaranteedAnalysisEntry, IngredientNote, ProductFacts, SupplementActiveNote, SupplementAssessment } from './types';

const PURPOSES: [key: string, label: string, re: RegExp][] = [
  ['joint', 'Joint and mobility support', /\b(joint|hips?|mobility|glucosamine|chondroitin|green lipped mussel|msm)\b/],
  ['calming', 'Calming', /\b(calm(ing)?|anxiety|stress|relax(ing)?|composure)\b/],
  ['digestive', 'Digestive support', /\b(digest(ive|ion)?|probiotics?|prebiotics?|gut|stool|tummy)\b/],
  ['skin_coat', 'Skin and coat', /\b(skin|coat|itch(ing)?|shedding|fish oil|salmon oil|krill oil|omega)\b/],
  ['urinary', 'Urinary support', /\b(urinary|bladder|cranberry)\b/],
  ['dental', 'Dental care', /\b(dental|teeth|breath|plaque|tartar)\b/],
  ['immune', 'Immune support', /\b(immune|immunity|colostrum)\b/],
  ['multivitamin', 'Vitamins and minerals', /\b(multi ?vitamins?|vitamins?|minerals)\b/],
  ['hairball', 'Hairball control', /\bhairballs?\b/],
  ['lysine', 'L-lysine', /\bl lysine\b|\blysine\b/],
  ['liver', 'Liver support', /\b(liver|milk thistle)\b/],
];

const norm = (s: string) => normalizeIngredientName(s).replace(/[-_:]/g, ' ');

export function supplementPurposes(facts: ProductFacts): SupplementAssessment['purposes'] {
  const name = norm(facts.productName?.value ?? '');
  const signals = norm(facts.classificationSignals.map((s) => s.text.replace(/^[a-z]{2}:/, '')).join(' | '));
  const out: SupplementAssessment['purposes'] = [];
  for (const [key, label, re] of PURPOSES) {
    if (re.test(name)) out.push({ key, label, evidence: 'Product name' });
    else if (re.test(signals)) out.push({ key, label, evidence: 'Database categories' });
  }
  return out;
}

const AMOUNT = /^(.+?)[\s:(]+(?:\(?(?:min(?:imum)?|max(?:imum)?)\.?\)?\s*)?(\d+(?:[.,]\d+)?)\s*(billion cfu|million cfu|cfu|mg|mcg|µg|g|iu|%)\b(?:\s*(?:\/|per)\s*([a-z ]{1,20}))?/i;

function parseActiveItem(item: string, perDefault: string | null): ActiveIngredient | null {
  const text = item.replace(/\s+/g, ' ').trim().replace(/^[.,;:\s]+|[.,;:\s]+$/g, '');
  if (!text) return null;
  const m = AMOUNT.exec(text);
  if (!m) return { name: text.slice(0, 80), amount: null, unit: null, per: perDefault };
  return { name: m[1].replace(/[(\s]+$/, '').trim().slice(0, 80), amount: Number(m[2].replace(',', '.')), unit: m[3].toLowerCase(), per: m[4]?.trim() ?? perDefault };
}

/** "Active Ingredients per Chew: Glucosamine HCl 500 mg, MSM 250 mg. Inactive Ingredients: ..." */
export function parseActiveIngredients(text: string | null | undefined): ActiveIngredient[] {
  if (!text) return [];
  const m = /active ingredients?\s*(?:\(?\s*per\s+([a-z ]+?)\s*\)?)?\s*[:：]\s*([\s\S]+?)(?=inactive ingredients?|other ingredients?|$)/i.exec(text);
  if (!m) return [];
  const per = m[1]?.trim().toLowerCase() || null;
  return m[2]
    .split(/[,;](?![^(]*\))/)
    .map((x) => parseActiveItem(x, per))
    .filter((x): x is ActiveIngredient => !!x && x.name.length > 1)
    .slice(0, 30);
}

/** Supplement labels often list actives in the guaranteed analysis with mg, IU or CFU units. */
export function activesFromGuarantees(ga: GuaranteedAnalysisEntry[] | undefined): ActiveIngredient[] {
  return (ga ?? [])
    .filter((e) => ['mg', 'mg/kg', 'IU/kg', 'CFU/g', 'CFU/lb'].includes(e.unit) || (e.nutrient === 'other' && e.unit !== '%'))
    .map((e) => ({ name: e.label, amount: e.value, unit: e.unit, per: null }));
}

export function describeAmount(a: ActiveIngredient): string {
  if (a.amount === null) return 'amount not stated';
  return `${a.amount.toLocaleString('en-US')} ${a.unit ?? ''}${a.per ? ` per ${a.per}` : ''}`.replace(/\s+/g, ' ').trim();
}

export const SUPPLEMENT_LIMITATIONS = [
  'Purrbi does not give supplements a score: their purpose, dose and evidence differ from one ingredient to the next.',
  'Amounts and claims are as stated by the manufacturer. Purrbi does not verify them or check the dose for your pet.',
  'Ask your veterinarian before starting a supplement, especially if your pet takes medication, is pregnant or nursing, or has a health condition.',
];

export function assessSupplement(facts: ProductFacts, notes: IngredientNote[]): SupplementAssessment {
  const purposes = supplementPurposes(facts);
  const fromFacts = facts.activeIngredients?.value ?? [];
  const parsed = fromFacts.length ? fromFacts : parseActiveIngredients(facts.ingredientsText?.value);
  const actives = parsed.length ? parsed : activesFromGuarantees(facts.guaranteedAnalysis?.value);
  const activesSource = fromFacts.length
    ? facts.activeIngredients!.source.sourceName
    : parsed.length
      ? `${facts.ingredientsText!.source.sourceName} (ingredient text)`
      : actives.length
        ? `${facts.guaranteedAnalysis!.source.sourceName} (guaranteed analysis)`
        : '';

  const activeNotes: SupplementActiveNote[] = actives.map((a) => ({
    name: a.name,
    amountText: describeAmount(a),
    evidence: 'not_reviewed',
    note: 'Purrbi hasn’t reviewed published evidence for this ingredient yet.',
    sourceTitle: '',
    sourceUrl: '',
    quote: '',
  }));

  const warnings: Finding[] = notes
    .filter((n) => n.status === 'concern' || n.status === 'caution')
    .map((n) => ({ kind: n.status === 'concern' ? 'alert' : 'review', text: `${n.name}: ${n.note}`, evidence: n.sourceTitle ?? 'Documented source', rule: 'S-KB' }));
  if (!actives.length) {
    warnings.push({ kind: 'missing', text: 'No active ingredients or amounts are available yet, so the supplement can’t be described in detail.', evidence: 'Missing evidence', rule: 'S-ACTIVES' });
  } else if (actives.every((a) => a.amount === null)) {
    warnings.push({ kind: 'missing', text: 'Active ingredients are listed without amounts.', evidence: 'Product label', rule: 'S-AMOUNTS' });
  }

  const allText = norm([facts.productName?.value ?? '', ...facts.classificationSignals.map((s) => s.text)].join(' '));
  const qualitySignals = /\bnasc\b/.test(allText) ? ['The product information mentions the NASC Quality Seal (National Animal Supplement Council quality audit).'] : [];

  const what = purposes.length ? `Labeled for ${purposes.map((p) => p.label.toLowerCase()).join(', ')}.` : 'The label’s intended purpose isn’t stated in the available information.';
  const listed = actives.length
    ? `${actives.length} active ingredient${actives.length > 1 ? 's are' : ' is'} listed${actives.some((a) => a.amount !== null) ? ' with amounts' : ''}.`
    : 'Active ingredients aren’t available yet.';
  return {
    purposes,
    actives: activeNotes,
    activesSource,
    warnings,
    limitations: SUPPLEMENT_LIMITATIONS,
    qualitySignals,
    summary: `${what} ${listed} Purrbi shows label facts and cited evidence notes instead of a score.`,
  };
}
