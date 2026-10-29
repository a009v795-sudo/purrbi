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

// EU labels declare a "complete" or "complementary" feed in the label language (fr, de, es, it, nl, pt).
const EU_COMPLETE = /\b(aliment complet|alleinfutter(mittel)?|(alimento|pienso|mangime) completo|volledig(e)? (dier)?voe(der|ding))\b/;
const EU_COMPLEMENTARY = /\b(aliment complementaire|erganzungsfutter(mittel)?|(alimento|pienso) complementario|(alimento|mangime) complementare|alimento complementar|aanvullend(e)? (dier)?voe(der|ding))\b/;
const INTERMITTENT = /\b(intermittent|supplemental feeding|for supplemental|complementary (pet )?(food|feed)|complementary feedingstuff|not (a )?complete (and balanced )?(diet|food|meal))\b/;
const COMPLETE =
  /\b(complete and balanced|formulated to meet the nutritional levels|nutrient profiles|nutritional levels established|animal feeding tests|feeding (trials?|protocols)|complete (pet |dry |wet )?(food|feed)|complete feedingstuff)\b/;
// Life-stage words in the same languages.
const ALL_STAGES = /\b(all life stages|tous les stades de (la )?vie|toutes les etapes de (la )?vie|alle lebens(phasen|abschnitte|stadien)|todas las etapas de (la )?vida|tutte le fasi (della )?vita|alle levensfasen|todas as fases da vida)\b/;
const GROWTH = /\b(growth|growing|pupp(y|ies)|kittens?|junior|croissance|chatons?|chiots?|wachstum|welpen?|katzchen|crecimiento|cachorros?|gatitos?|crescita|cuccioli|gattini|groei|crescimento)\b/;
const REPRODUCTION = /\b(gestation|lactation|reproduction|pregnant|nursing|gestantes?|allaitantes?|trachtig(e|en)?|saugend(e|en)?|gestacion|lactancia|gestazione|allattamento|dracht(ig)?|zogend(e)?|gestacao|lactacao)\b/;
const ADULT = /\b(adult maintenance|maintenance of adult|maintenance|adults?|senior|mature|adultes?|adultos?|adulti|ausgewachsene?n?|erwachsene?n?|volwassen(en)?)\b/;
const FEEDING_TRIAL = /\b(animal feeding tests|feeding (trials?|tests|protocols))\b/;
const FORMULATION = /\b(formulated to meet|nutrient profiles|nutritional levels established)\b/;

// English plus the label languages most common in Open Pet Food Facts (fr, de, es, it, nl, pt).
const DOG_WORDS = /\b(dogs?|canine|pupp(y|ies)|chiens?|chiots?|hunde?|welpen?|perros?|cachorros?|hond(en)?|cani)\b/;
const CAT_WORDS = /\b(cats?|feline|kittens?|chats?|chatons?|katzen?|katzchen|gatos?|gatitos?|gatti|gatto|katten)\b/;

export function detectSpecies(t: string): ProductSpecies {
  const dog = DOG_WORDS.test(t);
  const cat = CAT_WORDS.test(t);
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
  if (INTERMITTENT.test(t) || EU_COMPLEMENTARY.test(t)) type = 'intermittent';
  else if (COMPLETE.test(t) || EU_COMPLETE.test(t)) type = 'complete';

  let method: AdequacyStatement['method'] = 'unknown';
  if (type === 'complete') {
    if (FEEDING_TRIAL.test(t)) method = 'feeding_trial';
    else if (FORMULATION.test(t)) method = 'formulation';
  }

  const lifeStages = new Set<LifeStageClaim>();
  if (ALL_STAGES.test(t)) lifeStages.add('all_life_stages');
  const withoutAls = t.replace(/all life stages( including| except( for)?)? growth of large size dogs[^.;]*/g, ' ');
  if (GROWTH.test(withoutAls) && !lifeStages.has('all_life_stages')) {
    lifeStages.add('growth');
  }
  if (REPRODUCTION.test(t) && !lifeStages.has('all_life_stages')) {
    lifeStages.add('gestation_lactation');
  }
  if (ADULT.test(withoutAls) && !lifeStages.has('all_life_stages')) {
    lifeStages.add('adult_maintenance');
  }

  let largeSizeGrowth: boolean | null = null;
  if (/\bexcept (for )?(the )?growth of large size dogs\b|\bexcept (for )?large size dogs\b/.test(t)) largeSizeGrowth = false;
  else if (/\bincluding (the )?growth of large size dogs\b|\bincluding large size dogs\b/.test(t)) largeSizeGrowth = true;

  const style: AdequacyStatement['style'] = /\baafco\b/.test(t)
    ? 'aafco'
    : /\b(complete|complementary) (pet )?(food|feed)|feedingstuff\b/.test(t) || EU_COMPLETE.test(t) || EU_COMPLEMENTARY.test(t)
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
