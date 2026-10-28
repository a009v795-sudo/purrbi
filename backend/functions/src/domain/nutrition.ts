// Guaranteed analysis and calorie statements. Values are kept as stated (as-fed);
// dry-matter figures are derived and labelled as calculated.
import type { CalorieStatement, CaloriePer, GuaranteedAnalysisEntry, NutrientKey } from './types';

const NUTRIENT_PATTERNS: [RegExp, NutrientKey][] = [
  [/\b(crude )?protein\b/, 'crude_protein'],
  [/\b(crude )?fat\b|\bfat content\b|\boils and fats\b/, 'crude_fat'],
  [/\b(crude )?fib(er|re)s?\b/, 'crude_fiber'],
  [/\bmoisture\b|\bwater\b/, 'moisture'],
  [/\b(crude )?ash\b|\binorganic matter\b/, 'ash'],
  [/\bcalcium\b/, 'calcium'],
  [/\bphosphorus\b/, 'phosphorus'],
  [/\bsodium\b/, 'sodium'],
  [/\bmagnesium\b/, 'magnesium'],
  [/\btaurine\b/, 'taurine'],
  [/\bdha\b|\bdocosahexaenoic\b/, 'dha'],
  [/\bepa\b|\beicosapentaenoic\b/, 'epa'],
  [/\bomega[- ]?3\b/, 'omega_3'],
  [/\bomega[- ]?6\b/, 'omega_6'],
  [/\bcarbohydrates?\b/, 'carbohydrate'],
];

export function nutrientKeyFromLabel(label: string): NutrientKey {
  const t = label.toLowerCase();
  for (const [re, key] of NUTRIENT_PATTERNS) if (re.test(t)) return key;
  return 'other';
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

/** Parses statements like "3,640 kcal ME/kg; 364 kcal ME/cup" or "6 kcal per treat". */
export function parseCalorieText(text: string | null | undefined): CalorieStatement[] {
  if (!text) return [];
  const out: CalorieStatement[] = [];
  const re = /(\d{1,3}(?:[,\s]\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)\s*(?:kcal|kilocalories|calories)\s*(?:me\s*)?(?:\/|per)\s*([a-z0-9 ]{1,20})/gi;
  for (const m of text.matchAll(re)) {
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
