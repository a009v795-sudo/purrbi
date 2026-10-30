// Guaranteed analysis and calorie statements. Values are kept as stated (as-fed);
// dry-matter figures are derived and labelled as calculated.
import type { CalorieStatement, CaloriePer, GuaranteedAnalysisEntry, NutrientKey } from './types';

// Matched on the label without accents. English (US guaranteed analysis) first, then the EU
// "analytical constituents" terms in French, German, Spanish/Portuguese, Italian and Dutch.
const NUTRIENT_PATTERNS: [RegExp, NutrientKey][] = [
  [/\b(crude )?protein\b|\bprotei(ne|nes|na|nas)\b|\brohprotein\b|\b(ruw )?eiwit\b/, 'crude_protein'],
  [/\b(crude )?fat\b|\bfat content\b|\boils and fats\b|\bmatieres? grasses?\b|\bgraisses?\b|\blipides?\b|\brohfett\b|\bfett(gehalt)?\b|\bgrasas?\b|\bmateria grasa\b|\bgrass[io]\b|\b(ruw )?vet(gehalte)?\b|\bgordura\b/, 'crude_fat'],
  [/\b(crude )?fib(er|re)s?\b|\bcellulose brute\b|\brohfaser\b|\bfibras?\b|\bruwe? (celstof|vezels?)\b/, 'crude_fiber'],
  [/\bmoisture\b|\bwater\b|\bhumidite\b|\bfeuchtigkeit\b|\bfeuchte\b|\bwasser(gehalt)?\b|\bhumedad\b|\bhumidade\b|\bumidita\b|\bvocht(gehalte)?\b/, 'moisture'],
  [/\b(crude )?ash\b|\binorganic matter\b|\bcendres?\b|\bmatieres? minerales?\b|\brohasche\b|\bcenizas?\b|\bcinzas?\b|\bmateria (mineral|inorganica)\b|\bceneri\b|\bruwe as\b/, 'ash'],
  [/\bcalcium\b|\bkalzium\b|\bcalcio\b/, 'calcium'],
  [/\bphosphor(us|e)?\b|\bfosforo\b|\bfosfor\b/, 'phosphorus'],
  [/\bsodium\b|\bnatrium\b|\bsodio\b/, 'sodium'],
  [/\bmagnesium\b|\bmagnesio\b/, 'magnesium'],
  [/\btaurin[ea]?\b/, 'taurine'],
  [/\bdha\b|\bdocosahexaenoic\b/, 'dha'],
  [/\bepa\b|\beicosapentaenoic\b/, 'epa'],
  [/\bomega[- ]?3\b/, 'omega_3'],
  [/\bomega[- ]?6\b/, 'omega_6'],
  [/\bcarbohydrates?\b|\bglucides?\b|\bkohlenhydrate\b|\bcarbohidratos?\b|\bcarboidrati\b|\bkoolhydraten\b/, 'carbohydrate'],
];

// Additives declared as compounds ("sulfate de zinc", "iodate de calcium anhydre") are not analytical
// constituents, even when their name contains a mineral.
const COMPOUND = /\b(sulfate|sulphate|sulfat|sulfato|solfato|iodate|iodat|iodato|yodato|oxide|oxyde|oxid|oxido|ossido|carbonate|carbonat|carbonato|chloride|chlorure|chlorid|cloruro|selenite|selenit|selenito|chelate|chelat|chelato|quelato|monohydrate|hydrate|anhydre|anhydrous|wasserfrei|anidro)\b/;

// EU labels declare analytical constituents without minimum or maximum.
const EU_CONSTITUENT = /\bprotei(ne|nes|na|nas)\b|\brohprotein\b|\beiwit\b|\bmatieres? grasses?\b|\brohfett\b|\bgrasas?\b|\bgrass[io]\b|\bcellulose brute\b|\brohfaser\b|\bfibras?\b|\bcelstof\b|\bhumidite\b|\bfeuchtigkeit\b|\bhumedad\b|\bumidita\b|\bvocht\b|\bcendres?\b|\brohasche\b|\bcenizas?\b|\bceneri\b|\bruwe as\b|\bmatieres? minerales?\b/;

/** Lower case, accents removed, single spaces: "Protéine brute" → "proteine brute". */
export function plainLabel(label: string): string {
  return label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export function nutrientKeyFromLabel(label: string): NutrientKey {
  const t = plainLabel(label);
  if (COMPOUND.test(t)) return 'other';
  for (const [re, key] of NUTRIENT_PATTERNS) if (re.test(t)) return key;
  return 'other';
}

/** Every nutrient a label names: a label naming two ("Calcium/Phosphore", a name carried onto another row's) is ambiguous; a compound names none. */
export function nutrientKeysIn(label: string): NutrientKey[] {
  const t = plainLabel(label);
  if (COMPOUND.test(t)) return [];
  return NUTRIENT_PATTERNS.filter(([re]) => re.test(t)).map(([, key]) => key);
}

/**
 * Matches every analysis line again with the current names, so products read before a name was
 * known (e.g. a French label) are assessed correctly without reading the label again. On an EU
 * label (any line in an EU language), a line keeps "min"/"max" only when its own text prints it.
 */
export function rematchAnalysis(entries: GuaranteedAnalysisEntry[]): GuaranteedAnalysisEntry[] {
  const euLabel = entries.some((e) => EU_CONSTITUENT.test(plainLabel(e.label ?? '')));
  return entries.map((e) => {
    const t = plainLabel(e.label ?? '');
    const nutrient = t ? nutrientKeyFromLabel(e.label) : e.nutrient;
    const qualifier = euLabel && (e.qualifier === 'min' || e.qualifier === 'max') && !/\b(min|max)(imum|i)?\b/.test(t) ? 'not_stated' : e.qualifier;
    return nutrient === e.nutrient && qualifier === e.qualifier ? e : { ...e, nutrient, qualifier };
  });
}

export function normalizeUnit(raw: string | null | undefined): GuaranteedAnalysisEntry['unit'] {
  const u = (raw ?? '').toLowerCase().replace(/\s+/g, '');
  if (u === '%' || u === 'percent' || u === 'g/100g' || u === 'g') return u === 'g' ? 'g' : '%';
  if (u === 'mg/kg' || u === 'ppm') return 'mg/kg';
  if (u === 'iu/kg') return 'IU/kg';
  if (u === 'cfu/g') return 'CFU/g';
  if (u === 'cfu/lb') return 'CFU/lb';
  if (u === 'mg') return 'mg';
  return 'other';
}

export function qualifierFrom(raw: string | null | undefined): GuaranteedAnalysisEntry['qualifier'] {
  const q = (raw ?? '').toLowerCase();
  if (/min|>=|≥|>|not less/.test(q)) return 'min';
  if (/max|<=|≤|<|not more/.test(q)) return 'max';
  if (/typ|approx|~/.test(q)) return 'typical';
  return 'not_stated';
}

const PCT_LIMITS: Partial<Record<NutrientKey, number>> = {
  crude_protein: 95,
  crude_fat: 100,
  crude_fiber: 80,
  moisture: 95,
  ash: 60,
  calcium: 30,
  phosphorus: 30,
  sodium: 20,
  magnesium: 10,
  taurine: 10,
  omega_3: 100,
  omega_6: 100,
  dha: 50,
  epa: 50,
  carbohydrate: 100,
};

/** Drops entries whose values cannot be right; returns the reasons for anything dropped. */
export function validateGuaranteedAnalysis(entries: GuaranteedAnalysisEntry[]): {
  valid: GuaranteedAnalysisEntry[];
  rejected: string[];
} {
  const valid: GuaranteedAnalysisEntry[] = [];
  const rejected: string[] = [];
  for (const e of entries) {
    if (!Number.isFinite(e.value) || e.value < 0) {
      rejected.push(`${e.label}: not a valid number`);
      continue;
    }
    if (e.unit === '%') {
      const limit = PCT_LIMITS[e.nutrient] ?? 100;
      if (e.value > limit) {
        rejected.push(`${e.label}: ${e.value}% is outside the plausible range`);
        continue;
      }
    }
    valid.push(e);
  }
  return { valid, rejected };
}

export const CORE_GA: NutrientKey[] = ['crude_protein', 'crude_fat', 'crude_fiber'];

export function hasCoreGuaranteedAnalysis(entries: GuaranteedAnalysisEntry[] | undefined): boolean {
  if (!entries?.length) return false;
  return CORE_GA.every((k) => entries.some((e) => e.nutrient === k && e.unit === '%'));
}

export function findNutrient(entries: GuaranteedAnalysisEntry[] | undefined, key: NutrientKey) {
  return entries?.find((e) => e.nutrient === key);
}

/** Dry-matter percentage (calculated). Null when moisture is unknown or implausible. */
export function dryMatterPercent(value: number, moisturePercent: number | undefined): number | null {
  if (moisturePercent === undefined || moisturePercent >= 95 || moisturePercent < 0) return null;
  return Math.round((value / (100 - moisturePercent)) * 1000) / 10;
}

const PER_PATTERNS: [RegExp, CaloriePer][] = [
  [/kg\b|kilogram/, 'kg'],
  [/100 ?g\b/, '100g'],
  [/\bcup\b/, 'cup'],
  [/\bcan\b/, 'can'],
  [/\bpouch\b/, 'pouch'],
  [/\btray\b/, 'tray'],
  [/\bchew\b/, 'chew'],
  [/\btreat\b/, 'treat'],
  [/\b(piece|stick|biscuit|bar|tube)\b/, 'piece'],
];

const KCAL_LIMITS: Partial<Record<CaloriePer, [number, number]>> = {
  kg: [300, 9500],
  '100g': [30, 950],
  cup: [40, 1200],
  can: [5, 1500],
  pouch: [5, 1000],
  tray: [5, 1000],
  treat: [0.2, 1500],
  chew: [0.2, 1500],
  piece: [0.2, 1500],
};

const UPPER_BOUND = /(<|≤|less than|fewer than|under|up to|moins de|menos de|weniger als|meno di|minder dan)\s*$/i;

/** Parses statements like "3,640 kcal ME/kg; 364 kcal ME/cup" or "6 kcal per treat". */
export function parseCalorieText(text: string | null | undefined): CalorieStatement[] {
  if (!text) return [];
  const out: CalorieStatement[] = [];
  const re = /(\d{1,3}(?:[,\s]\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)\s*(?:kcal|kilocalories|calories)\s*(?:me\s*)?(?:\/|per)\s*([a-z0-9 ]{1,20})/gi;
  for (const m of text.matchAll(re)) {
    // "<2 kcal", "less than 2 kcal", "menos de 2 kcal": an upper bound, not the calorie content.
    if (UPPER_BOUND.test(text.slice(Math.max(0, (m.index ?? 0) - 14), m.index))) continue;
    const kcal = Number(m[1].replace(/[,\s]/g, ''));
    const perText = m[2].toLowerCase();
    const per = PER_PATTERNS.find(([p]) => p.test(perText))?.[1] ?? 'other';
    if (!Number.isFinite(kcal)) continue;
    const limits = KCAL_LIMITS[per];
    if (limits && (kcal < limits[0] || kcal > limits[1])) continue;
    out.push({ kcal, per, text: m[0].trim() });
  }
  return out;
}

export function describeCalories(c: CalorieStatement): string {
  const per = { kg: 'kg', '100g': '100 g', cup: 'cup', can: 'can', pouch: 'pouch', tray: 'tray', treat: 'treat', chew: 'chew', piece: 'piece', g: 'g', other: 'serving' }[c.per];
  return `${c.kcal.toLocaleString('en-US')} kcal per ${per}`;
}

export function describeEntry(e: GuaranteedAnalysisEntry): string {
  const q = e.qualifier === 'min' ? ' (min)' : e.qualifier === 'max' ? ' (max)' : '';
  const unit = e.unit === '%' ? '%' : ` ${e.unit}`;
  return `${e.label}${q}: ${e.value}${unit}`;
}
