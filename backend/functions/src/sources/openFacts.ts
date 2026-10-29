// Open Pet Food Facts (pet products) and its sister databases, used only for identity and scope:
// Open Food Facts (human food), Open Beauty Facts (cosmetics), Open Products Facts (other products).
// All share the Product Opener API v2: GET /api/v2/product/{code}?fields=...
// Field mapping for pet-food nutrients is UNVERIFIED until the live contract test (test/live) passes;
// see API_DATA_CONTRACT.md.
import { lookupVariants, type NormalizedBarcode } from '../domain/barcode';
import { parseAdequacyStatement } from '../domain/adequacy';
import { parseIngredientList } from '../domain/ingredients';
import { nutrientKeyFromLabel, qualifierFrom, validateGuaranteedAnalysis } from '../domain/nutrition';
import type { CalorieStatement, GuaranteedAnalysisEntry, ProductFacts, SourceRef } from '../domain/types';
import { httpJson, SourceError } from '../util/http';

export type OpenFactsDb = 'opff' | 'off' | 'obf' | 'opf';

const HOSTS: Record<OpenFactsDb, { host: string; name: string; license: string }> = {
  opff: { host: 'world.openpetfoodfacts.org', name: 'Open Pet Food Facts', license: 'ODbL 1.0 (data), CC BY-SA 3.0 (images)' },
  off: { host: 'world.openfoodfacts.org', name: 'Open Food Facts', license: 'ODbL 1.0 (data), CC BY-SA 3.0 (images)' },
  obf: { host: 'world.openbeautyfacts.org', name: 'Open Beauty Facts', license: 'ODbL 1.0 (data), CC BY-SA 3.0 (images)' },
  opf: { host: 'world.openproductsfacts.org', name: 'Open Products Facts', license: 'ODbL 1.0 (data), CC BY-SA 3.0 (images)' },
};

const FIELDS = [
  'code',
  'product_name',
  'product_name_en',
  'generic_name',
  'generic_name_en',
  'brands',
  'categories_tags',
  'labels_tags',
  'countries_tags',
  'ingredients_text',
  'ingredients_text_en',
  'lang',
  'nutriments',
  'image_front_url',
  'image_ingredients_url',
  'image_nutrition_url',
  'quantity',
  'last_modified_t',
].join(',');

export interface OpenFactsProduct {
  code?: string;
  product_name?: string;
  product_name_en?: string;
  generic_name?: string;
  generic_name_en?: string;
  brands?: string;
  categories_tags?: string[];
  labels_tags?: string[];
  countries_tags?: string[];
  ingredients_text?: string;
  ingredients_text_en?: string;
  lang?: string;
  nutriments?: Record<string, unknown>;
  image_front_url?: string;
  image_ingredients_url?: string;
  image_nutrition_url?: string;
  quantity?: string;
  last_modified_t?: number;
}

export type OpenFactsLookup =
  | { found: true; db: OpenFactsDb; code: string; product: OpenFactsProduct; source: SourceRef }
  | { found: false; db: OpenFactsDb; tried: string[] };

export async function lookupOpenFacts(db: OpenFactsDb, barcode: NormalizedBarcode, userAgent: string, now: Date): Promise<OpenFactsLookup> {
  const { host, name, license } = HOSTS[db];
  const tried: string[] = [];
  for (const code of lookupVariants(barcode)) {
    tried.push(code);
    const url = `https://${host}/api/v2/product/${encodeURIComponent(code)}?fields=${FIELDS}`;
    const { status, json } = await httpJson<{ status?: number; product?: OpenFactsProduct }>(url, {
      source: name,
      headers: { 'User-Agent': userAgent, Accept: 'application/json' },
      timeoutMs: 8000,
      retries: 1,
      acceptStatuses: [404],
    });
    if (status === 404 || !json || json.status !== 1 || !json.product) continue;
    const productCode = json.product.code ?? code;
    return {
      found: true,
      db,
      code: productCode,
      product: json.product,
      source: {
        sourceId: `${db}:${productCode}`,
        sourceType: 'database',
        sourceName: name,
        url: `https://${host}/product/${encodeURIComponent(productCode)}`,
        retrievedAt: now.toISOString(),
        matchConfidence: 'exact_barcode',
        license,
      },
    };
  }
  return { found: false, db, tried };
}

// Pet-food keys first (crude-*), then the generic ones some records use; the first one found per
// nutrient wins.
const NUTRIMENT_IDS: [string, string][] = [
  ['crude-protein', 'Crude protein'],
  ['proteins', 'Crude protein'],
  ['crude-fat', 'Crude fat'],
  ['fat', 'Crude fat'],
  ['crude-fibre', 'Crude fiber'],
  ['crude-fiber', 'Crude fiber'],
  ['fiber', 'Crude fiber'],
  ['moisture', 'Moisture'],
  ['water', 'Moisture'],
  ['crude-ash', 'Crude ash'],
  ['ash', 'Crude ash'],
  ['calcium', 'Calcium'],
  ['phosphorus', 'Phosphorus'],
  ['sodium', 'Sodium'],
  ['magnesium', 'Magnesium'],
  ['taurine', 'Taurine'],
  ['omega-3-fat', 'Omega-3 fatty acids'],
  ['omega-6-fat', 'Omega-6 fatty acids'],
  ['docosahexaenoic-acid', 'DHA'],
  ['eicosapentaenoic-acid', 'EPA'],
  ['carbohydrates', 'Carbohydrates'],
];

/**
 * Why a database record's analysis cannot be per 100 g, or null. Without a moisture value, protein and
 * fat together below 4 % fit no cat or dog food or treat: such values are per serving or mistyped.
 */
export function implausibleAnalysis(entries: GuaranteedAnalysisEntry[]): string | null {
  const v = (k: string) => entries.find((e) => e.nutrient === k && e.unit === '%')?.value;
  const protein = v('crude_protein');
  const fat = v('crude_fat');
  if (protein === undefined || fat === undefined || v('moisture') !== undefined || protein + fat >= 4) return null;
  return `Open Pet Food Facts lists ${protein}% protein and ${fat}% fat, which cannot be per 100 g of this product (likely per serving or a typing error), so its analysis was not used.`;
}

/** Maps Product Opener nutriments (values per 100 g, mass nutrients in grams) to guarantees, unless implausible. */
export function nutrimentsToGuarantees(nutriments: Record<string, unknown> | undefined): GuaranteedAnalysisEntry[] {
  const entries = databaseGuarantees(nutriments);
  return implausibleAnalysis(entries) ? [] : entries;
}

/** The record's analysis as listed, before the plausibility check. */
export function databaseGuarantees(nutriments: Record<string, unknown> | undefined): GuaranteedAnalysisEntry[] {
  if (!nutriments) return [];
  const out: GuaranteedAnalysisEntry[] = [];
  for (const [id, label] of NUTRIMENT_IDS) {
    const v = nutriments[`${id}_100g`];
    if (typeof v !== 'number' || !Number.isFinite(v)) continue;
    const nutrient = nutrientKeyFromLabel(label);
    if (out.some((e) => e.nutrient === nutrient)) continue;
    const unit = String(nutriments[`${id}_unit`] ?? 'g').toLowerCase();
    // _100g values are grams per 100 g for mass units, i.e. percent.
    if (!['g', 'mg', 'µg', 'mcg', '%'].includes(unit)) continue;
    out.push({ nutrient, label, qualifier: qualifierFrom(String(nutriments[`${id}_modifier`] ?? '')), value: Math.round(v * 1000) / 1000, unit: '%' });
  }
  return validateGuaranteedAnalysis(out).valid;
}

export function nutrimentsToCalories(nutriments: Record<string, unknown> | undefined): CalorieStatement[] {
  const v = nutriments?.['energy-kcal_100g'];
  // Below 30 kcal per 100 g is not plausible for a pet food or treat (a data-entry error or a per-serving value).
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 30 || v > 950) return [];
  return [{ kcal: Math.round(v * 10), per: 'kg', text: `${v} kcal per 100 g (database value, converted to per kg)` }];
}

/** Builds product facts from a pet-database record. Missing fields stay missing. */
export function openFactsToFacts(lookup: Extract<OpenFactsLookup, { found: true }>, gtin14: string, barcode: string): ProductFacts {
  const p = lookup.product;
  const src = lookup.source;
  const name = (p.product_name_en || p.product_name || '').trim();
  const brand = (p.brands || '').split(',')[0]?.trim();
  const ingredientsText = (p.ingredients_text_en || p.ingredients_text || '').trim();
  const ingredientsLanguage = p.ingredients_text_en ? 'en' : p.lang;
  const ingredients = parseIngredientList(ingredientsText).map((i) => i.name);
  const ga = nutrimentsToGuarantees(p.nutriments);
  const calories = nutrimentsToCalories(p.nutriments);
  const facts: ProductFacts = {
    gtin: gtin14,
    barcode,
    classificationSignals: [
      ...(p.categories_tags ?? []).map((t) => ({ text: t, source: src.sourceId })),
      ...(p.labels_tags ?? []).map((t) => ({ text: t, source: src.sourceId })),
      ...[name, p.generic_name_en || p.generic_name].filter(Boolean).map((t) => ({ text: t as string, source: src.sourceId })),
    ],
    sources: [src],
    ingredientsLanguage,
  };
  if (name) facts.productName = { value: name, source: src };
  if (brand) facts.brand = { value: brand, source: src };
  if (p.image_front_url && /^https:\/\//.test(p.image_front_url)) facts.imageUrl = { value: p.image_front_url, source: src };
  if (ingredientsText && ingredients.length) {
    facts.ingredientsText = { value: ingredientsText, source: src };
    facts.ingredients = { value: ingredients, source: src };
  }
  if (ga.length) facts.guaranteedAnalysis = { value: ga, source: src };
  if (calories.length) facts.calories = { value: calories, source: src };
  // Product Opener has no adequacy-statement field; only a label photo or manufacturer page supplies it.
  return facts;
}

export function adequacyFromText(text: string | null | undefined) {
  return parseAdequacyStatement(text);
}

export { SourceError };
