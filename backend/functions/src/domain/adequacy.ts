// Nutritional adequacy ("complete and balanced") statements: AAFCO (US) and EU/FEDIAF styles.
import type { AdequacyStatement, LifeStageClaim, ProductSpecies } from './types';

const norm = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’`]/g, "'")
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const INTERMITTENT = /\b(intermittent|supplemental feeding|for supplemental|complementary (pet )?(food|feed)|complementary feedingstuff|not (a )?complete (and balanced )?(diet|food|meal))\b/;
const COMPLETE =
  /\b(complete and balanced|formulated to meet the nutritional levels|nutrient profiles|nutritional levels established|animal feeding tests|feeding (trials?|protocols)|complete (pet |dry |wet )?(food|feed)|complete feedingstuff)\b/;
const FEEDING_TRIAL = /\b(animal feeding tests|feeding (trials?|tests|protocols))\b/;
const FORMULATION = /\b(formulated to meet|nutrient profiles|nutritional levels established)\b/;

export function detectSpecies(t: string): ProductSpecies {
  const dog = /\b(dogs?|canine|pupp(y|ies))\b/.test(t);
  const cat = /\b(cats?|feline|kittens?)\b/.test(t);
  if (dog && cat) return 'cat_and_dog';
  if (dog) return 'dog';
  if (cat) return 'cat';
  return 'unknown';
}

export function parseAdequacyStatement(raw: string | null | undefined): AdequacyStatement | null {
  if (!raw || !raw.trim()) return null;
  const text = raw.replace(/\s+/g, ' ').trim();
  const t = norm(text);

  let type: AdequacyStatement['type'] = 'unclear';
  if (INTERMITTENT.test(t)) type = 'intermittent';
  else if (COMPLETE.test(t)) type = 'complete';

  let method: AdequacyStatement['method'] = 'unknown';
  if (type === 'complete') {
    if (FEEDING_TRIAL.test(t)) method = 'feeding_trial';
    else if (FORMULATION.test(t)) method = 'formulation';
  }

  const lifeStages = new Set<LifeStageClaim>();
  if (/\ball life stages\b/.test(t)) lifeStages.add('all_life_stages');
  const withoutAls = t.replace(/all life stages( including| except( for)?)? growth of large size dogs[^.;]*/g, ' ');
  if (/\b(growth|growing|pupp(y|ies)|kittens?|junior)\b/.test(withoutAls) && !lifeStages.has('all_life_stages')) {
    lifeStages.add('growth');
  }
  if (/\b(gestation|lactation|reproduction|pregnant|nursing)\b/.test(t) && !lifeStages.has('all_life_stages')) {
    lifeStages.add('gestation_lactation');
  }
  if (/\b(adult maintenance|maintenance of adult|maintenance|adults?|senior|mature)\b/.test(withoutAls) && !lifeStages.has('all_life_stages')) {
    lifeStages.add('adult_maintenance');
  }

  let largeSizeGrowth: boolean | null = null;
  if (/\bexcept (for )?(the )?growth of large size dogs\b|\bexcept (for )?large size dogs\b/.test(t)) largeSizeGrowth = false;
  else if (/\bincluding (the )?growth of large size dogs\b|\bincluding large size dogs\b/.test(t)) largeSizeGrowth = true;

  const style: AdequacyStatement['style'] = /\baafco\b/.test(t)
    ? 'aafco'
    : /\b(complete|complementary) (pet )?(food|feed)|feedingstuff\b/.test(t)
      ? 'eu'
      : 'other';

  return {
    text,
    type,
    species: detectSpecies(t),
    lifeStages: [...lifeStages],
    method,
    largeSizeGrowth,
    style,
  };
}

export function lifeStageLabel(s: LifeStageClaim): string {
  return {
    growth: 'growth',
    adult_maintenance: 'adult maintenance',
    all_life_stages: 'all life stages',
    gestation_lactation: 'gestation/lactation',
  }[s];
}
