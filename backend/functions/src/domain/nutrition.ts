// Guaranteed analysis and calorie statements. Values are kept as stated (as-fed);
// dry-matter figures are derived and labelled as calculated.
import type { CalorieStatement, CaloriePer, GuaranteedAnalysisEntry, NutrientKey, PackageSize } from './types';

// Matched on the label without accents. English (US guaranteed analysis) first, then the EU
// "analytical constituents" terms in French, German, Spanish/Portuguese, Italian and Dutch.
const NUTRIENT_PATTERNS: [RegExp, NutrientKey][] = [
  [/\b(crude )?protein\b|\bprotei(ne|nes|na|nas)\b|\brohprotein\b|\b(ruw )?eiwit\b/, 'crude_protein'],
  [/\b(crude )?fat\b|\bfat content\b|\b(crude )?oils and fats\b|\bmatieres? grasses?\b|\bgraisses?\b|\blipides?\b|\brohfett\b|\bfett(gehalt)?\b|\bgrasas?\b|\bmateria grasa\b|\bmateria grassa\b|(?<!\bacidi )\bgrass[io]\b|\b(ruw )?vet(gehalte)?\b|\bgordura\b/, 'crude_fat'],
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
  for (const [re, key] of NUTRIENT_PATTERNS) if (re.test(t) && !(key === 'crude_fiber' && FIBRE_FRACTION.test(t))) return key;
  return 'other';
}

// A fibre fraction (total dietary, soluble, insoluble fibre) is not the crude fibre guarantee.
const FIBRE_FRACTION = /\b(?:total dietary|dietary|soluble|insoluble)\s+fib(?:er|re)s?\b|\bfib(?:er|re)s?\s+(?:alimentaires?|solubles?|insolubles?)\b|\bballaststoff|\bfibra (?:alimentaria|dietetica|soluble|insoluble)\b/;

/** Every nutrient a label names: a label naming two ("Calcium/Phosphore", a name carried onto another row's) is ambiguous; a compound names none. */
export function nutrientKeysIn(label: string): NutrientKey[] {
  const t = plainLabel(label);
  if (COMPOUND.test(t)) return [];
  return NUTRIENT_PATTERNS.filter(([re, key]) => re.test(t) && !(key === 'crude_fiber' && FIBRE_FRACTION.test(t))).map(([, key]) => key);
}

/** Whether a label starts with a nutrient's name ("Crude" + "Protein" does; "complet" + "Protéine" does not). */
export function startsWithNutrientName(label: string): boolean {
  const t = plainLabel(label);
  return !COMPOUND.test(t) && NUTRIENT_PATTERNS.some(([re]) => re.exec(t)?.index === 0);
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
  [/\b(pouch|retort pouch)\b/, 'pouch'],
  [/\b(tray|tub|cup pot)\b/, 'tray'],
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

const OUNCE_G = 28.3495;
const UNIT_OF: Record<string, PackageSize['unit']> = { oz: 'oz', ounce: 'oz', ounces: 'oz', 'fl oz': 'fl oz', 'fl. oz': 'fl oz', lb: 'lb', lbs: 'lb', pound: 'lb', pounds: 'lb', g: 'g', gram: 'g', grams: 'g', gr: 'g', kg: 'kg', ml: 'ml' };
const SIZE = /(\d+(?:[.,]\d+)?)\s*-?\s*(fl\.? oz|ounces?|oz|pounds?|lbs?|grams?|gr|g|kg|ml)\b/i;

function sizeOf(amount: number, rawUnit: string, text: string): PackageSize | null {
  const unit = UNIT_OF[rawUnit.toLowerCase().replace(/\s+/g, ' ')];
  if (!unit || !Number.isFinite(amount) || amount <= 0) return null;
  const grams = unit === 'oz' ? amount * OUNCE_G : unit === 'lb' ? amount * 453.592 : unit === 'g' ? amount : unit === 'kg' ? amount * 1000 : null;
  return { amount, unit, grams: grams === null ? null : Math.round(grams * 10) / 10, text: text.trim() };
}

/**
 * The package size in a title or size field: "2.8 oz", "2.8 Ounce Can", "3 Ounce Retort Pouch", "85 g",
 * "6 x 1.5 oz" (a case of six: the unit is 1.5 oz). Null when none is stated or several different ones are.
 */
export function parsePackageSize(text: string | null | undefined): PackageSize | null {
  if (!text) return null;
  const found = [...text.matchAll(new RegExp(`(?:(\\d+)\\s*[x×]\\s*)?${SIZE.source}`, 'gi'))]
    .map((m) => sizeOf(Number(m[2].replace(',', '.')), m[3], m[0].replace(/^\d+\s*[x×]\s*/i, '')))
    .filter((x): x is PackageSize => !!x);
  const distinct = [...new Map(found.map((f) => [`${f.amount}${f.unit}`, f])).values()];
  return distinct.length === 1 ? distinct[0] : null;
}

/** Same package: equal mass within 3% (2.8 oz = 79 g), or the same amount and unit. */
export function samePackage(a: PackageSize | undefined | null, b: PackageSize | undefined | null): boolean {
  if (!a || !b) return false;
  if (a.grams !== null && b.grams !== null) return Math.abs(a.grams - b.grams) <= Math.max(a.grams, b.grams) * 0.03;
  return a.unit === b.unit && a.amount === b.amount;
}

/**
 * Parses statements like "3,640 kcal ME/kg; 364 kcal ME/cup", "6 kcal per treat" and package-specific
 * values "70 kcal/2.8 oz can, 133 kcal/5.3 oz can": each value keeps the package it is for, so values
 * for different sizes are never shown as interchangeable servings.
 */
export function parseCalorieText(text: string | null | undefined): CalorieStatement[] {
  if (!text) return [];
  const out: CalorieStatement[] = [];
  const re = /(\d{1,3}(?:[,\s]\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)\s*(?:kcal|kilocalories|calories)\s*(?:me\s*)?(?:\/|per)\s*((?:\d+(?:[.,]\d+)?\s*-?\s*(?:fl\.? oz|ounces?|oz|grams?|g|ml)\b\.?\s*)?[a-z][a-z ]{0,19}|\d+ ?g\b)/gi;
  for (const m of text.matchAll(re)) {
    // "<2 kcal", "less than 2 kcal", "menos de 2 kcal": an upper bound, not the calorie content.
    if (UPPER_BOUND.test(text.slice(Math.max(0, (m.index ?? 0) - 14), m.index))) continue;
    const kcal = Number(m[1].replace(/[,\s]/g, ''));
    const perText = m[2].toLowerCase().trim();
    const sized = /^\d/.test(perText) && !/^100 ?g\b/.test(perText) ? SIZE.exec(perText) : null;
    const size = sized ? sizeOf(Number(sized[1].replace(',', '.')), sized[2], sized[0]) : null;
    const rest = sized ? perText.slice(sized.index + sized[0].length) : perText;
    let per = PER_PATTERNS.find(([p]) => p.test(rest))?.[1] ?? PER_PATTERNS.find(([p]) => p.test(perText))?.[1] ?? 'other';
    if (size && per === 'other') per = 'piece'; // "kcal per 1.5 oz" without a container word: the stated amount
    if (!Number.isFinite(kcal)) continue;
    const limits = KCAL_LIMITS[per];
    if (limits && (kcal < limits[0] || kcal > limits[1])) continue;
    out.push({ kcal, per, text: m[0].trim(), ...(size ? { size } : {}) });
  }
  return out;
}

const PER_WORD: Record<CaloriePer, string> = { kg: 'kg', '100g': '100 g', cup: 'cup', can: 'can', pouch: 'pouch', tray: 'tray', treat: 'treat', chew: 'chew', piece: 'piece', g: 'g', other: 'serving' };
const sizeText = (s: PackageSize) => `${s.amount.toLocaleString('en-US')}-${s.unit === 'fl oz' ? 'fl-oz' : s.unit}`;

export function describeCalories(c: CalorieStatement): string {
  if (c.size) return `${c.kcal.toLocaleString('en-US')} kcal per ${sizeText(c.size)} ${c.per === 'piece' || c.per === 'other' ? 'portion' : PER_WORD[c.per]}`;
  return `${c.kcal.toLocaleString('en-US')} kcal per ${PER_WORD[c.per]}`;
}

/**
 * The calorie statements to show for the scanned package: per kg (or 100 g) always, and of the
 * package-specific values only the one for this package's size when it is known. Values for other sizes
 * are left out rather than shown as interchangeable; when the size is unknown they are all kept, each
 * with its own size.
 */
export function caloriesForPackage(cals: CalorieStatement[] | undefined, size: PackageSize | undefined | null): CalorieStatement[] {
  if (!cals?.length) return [];
  const sized = cals.filter((c) => c.size);
  if (!size || !sized.length) return cals;
  const match = sized.filter((c) => samePackage(c.size, size));
  return cals.filter((c) => !c.size || match.includes(c));
}

export function describeEntry(e: GuaranteedAnalysisEntry): string {
  const q = e.qualifier === 'min' ? ' (min)' : e.qualifier === 'max' ? ' (max)' : '';
  const unit = e.unit === '%' ? '%' : ` ${e.unit}`;
  return `${e.label}${q}: ${e.value}${unit}`;
}
