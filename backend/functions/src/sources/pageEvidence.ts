// What a product page holds beyond its visible text, read by Purrbi itself (deterministic, no AI):
// image alternative text (manufacturers often publish the ingredient list only as an image's alt text),
// barcodes in the page's markup and structured data (a widget's `ps-sku`, JSON-LD `gtin12`, a Shopify
// variant's `barcode`), and linked nutrition documents (a "Nutrient Profiles" PDF with the AAFCO claim and
// the calories per package). Every value used is printed in the page or document it is taken from.
import { gs1CheckDigit } from '../domain/barcode';
import { normalizeIngredientName, parseIngredientList } from '../domain/ingredients';
import { parseCalorieText, parsePackageSize } from '../domain/nutrition';
import type { CalorieStatement } from '../domain/types';

const charFrom = (code: number) => (code > 0 && code < 0x110000 ? String.fromCodePoint(code) : ' ');

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, d: string) => charFrom(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => charFrom(parseInt(h, 16)))
    .replace(/&([a-zA-Z])(acute|grave|circ|uml|tilde|cedil|ring|slash);/g, '$1')
    .replace(/&szlig;/g, 'ss')
    .replace(/&(oe|ae)lig;/gi, '$1')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;|&rsquo;|&lsquo;/g, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/&(reg|trade|copy);/g, ' ');
}

const ALT = /<img\b[^>]*?\balt\s*=\s*(?:"([^"]*)"|'([^']*)')[^>]*>/gi;

/** Visible text plus image alternative text, so an ingredient list published as an image's alt text is read. */
export function pageText(html: string): string {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(ALT, (_, a?: string, b?: string) => ` ${a ?? b ?? ''} `)
      .replace(/<[^>]+>/g, ' '),
  ).replace(/\s+/g, ' ');
}

/**
 * Image alt texts that read as an ingredient list (at least six comma-separated items, mostly words found
 * on pet-food labels), in page order. A page usually has one; several different ones mean variants.
 */
export function altTextIngredientLists(html: string): string[] {
  const out: string[] = [];
  for (const m of html.matchAll(ALT)) {
    const alt = decodeEntities(m[1] ?? m[2] ?? '').replace(/\s+/g, ' ').trim();
    if (alt.length < 40 || alt.length > 4000) continue;
    const items = parseIngredientList(alt);
    if (items.length < 6) continue;
    const labelish = items.filter((i) => /\b(water|broth|chicken|turkey|beef|lamb|salmon|tuna|fish|meal|fat|oil|starch|rice|pea|potato|flavou?r|gum|salt|taurine|vitamin|mineral|chloride|supplement|phosphate|sulfate|sulphate|chelate|proteinate|selenite|iodide|carrots?|egg)s?\b/.test(i.normalized)).length;
    if (labelish / items.length >= 0.5 && !out.includes(alt)) out.push(alt);
  }
  return out;
}

const validGtin = (digits: string) => /^\d{8,14}$/.test(digits) && gs1CheckDigit(digits.slice(0, -1)) === Number(digits[digits.length - 1]);

/**
 * Barcodes the page's markup names for its product: widget and data attributes (ps-sku, data-upc,
 * data-gtin, data-ean, data-barcode), microdata (itemprop="gtin…") and JSON keys (gtin, gtin8–14, upc,
 * ean, barcode, sku). Only valid GTINs count, as 14-digit keys. A listing page names many products: when
 * more than three different ones appear, none is taken as the page's product.
 */
export function markupGtins(html: string): string[] {
  const found = new Set<string>();
  const add = (raw: string) => {
    const d = raw.replace(/\s+/g, '');
    if (validGtin(d)) found.add(d.padStart(14, '0'));
  };
  for (const m of html.matchAll(/\b(?:ps-sku|data-(?:upc|gtin|ean|barcode|sku))\s*=\s*["']\s*(\d{8,14})\s*["']/gi)) add(m[1]);
  for (const m of html.matchAll(/itemprop\s*=\s*["']gtin(?:8|12|13|14)?["'][^>]*?content\s*=\s*["']\s*(\d{8,14})\s*["']/gi)) add(m[1]);
  for (const m of html.matchAll(/content\s*=\s*["']\s*(\d{8,14})\s*["'][^>]*?itemprop\s*=\s*["']gtin(?:8|12|13|14)?["']/gi)) add(m[1]);
  for (const m of html.matchAll(/"(?:gtin(?:8|12|13|14)?|upc|ean|barcode|sku)"\s*:\s*"?\s*(\d{8,14})\s*"?/gi)) add(m[1]);
  return found.size > 3 ? [] : [...found];
}

/** A Shopify product page publishes its product, with each variant's barcode, at "<product url>.js". */
export function shopifyProductUrl(url: string): string | null {
  try {
    const u = new URL(url);
    return /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?(?:collections\/[^/]+\/)?products\/[^/?#]+\/?$/i.test(u.pathname) ? `${u.origin}${u.pathname.replace(/\/$/, '')}.js` : null;
  } catch {
    return null;
  }
}

export interface ShopifyProduct {
  title: string;
  type: string;
  tags: string[];
  barcodes: string[]; // 14-digit keys of the variants' valid barcodes
  variantTitles: string[];
  description: string;
}

export function parseShopifyProduct(json: unknown): ShopifyProduct | null {
  if (!json || typeof json !== 'object') return null;
  const p = json as { title?: unknown; type?: unknown; tags?: unknown; variants?: unknown; description?: unknown };
  if (typeof p.title !== 'string' || !Array.isArray(p.variants)) return null;
  const variants = p.variants as { barcode?: unknown; title?: unknown }[];
  return {
    title: p.title,
    type: typeof p.type === 'string' ? p.type : '',
    tags: Array.isArray(p.tags) ? p.tags.filter((t): t is string => typeof t === 'string').slice(0, 30) : [],
    barcodes: variants.map((v) => String(v.barcode ?? '').replace(/\s+/g, '')).filter(validGtin).map((d) => d.padStart(14, '0')),
    variantTitles: variants.map((v) => String(v.title ?? '')).filter(Boolean).slice(0, 12),
    description: typeof p.description === 'string' ? pageText(p.description).slice(0, 6000) : '',
  };
}

const DOC_WORDS = /nutrient profiles?|nutrition(?:al)? (?:info|information|facts|data|panel|sheet)|guaranteed analysis|feeding (?:guide|chart)|product (?:sheet|specifications?)|spec(?:ification)? sheet|aafco/i;

/** Links to nutrition documents (PDF) on a product page, by their link text or file name; at most two. */
export function nutritionDocLinks(html: string, pageUrl: string): string[] {
  const out: string[] = [];
  for (const m of html.matchAll(/<a\b[^>]*?\bhref\s*=\s*["']([^"']+)["'][^>]*>([\s\S]{0,300}?)<\/a>/gi)) {
    const href = decodeEntities(m[1]).trim();
    const label = pageText(m[2]);
    if (!/\.pdf(?:$|[?#])/i.test(href) || !(DOC_WORDS.test(label) || DOC_WORDS.test(href.replace(/[-_]/g, ' ')))) continue;
    try {
      const abs = new URL(href, pageUrl);
      if (abs.protocol === 'https:' && !out.includes(abs.toString())) out.push(abs.toString());
    } catch {
      // not a link
    }
    if (out.length >= 2) break;
  }
  return out;
}

// "FELINE MAINTENANCE AAFCO NUTRIENT PROFILE CLAIM SUBSTANTIATION", "AAFCO Dog Food Nutrient Profiles for All Life Stages".
const DOC_CLAIM =
  /(?:(?:feline|canine)\s+(?:adult\s+)?(?:maintenance|growth(?:\s+(?:and|&)\s+reproduction)?|all\s+life\s+stages|gestation\s*\/\s*lactation|reproduction)\s+aafco\s+nutrient\s+profiles?[^\n.]{0,60}|(?:formulated\s+to\s+meet|meets)[^\n.]{0,80}aafco\s+(?:cat|dog)\s+food\s+nutrient\s+profiles?[^\n.]{0,80}|aafco\s+(?:cat|dog)\s+food\s+nutrient\s+profiles?\s+for\s+[^\n.]{3,60})/i;

export interface DocumentFacts {
  adequacyText: string | null; // the claim as printed in the document
  calories: CalorieStatement[]; // per package, each with its size
  notes: string[];
}

/**
 * The AAFCO nutrient-profile claim and the calories per package from a manufacturer's nutrition document
 * (text as extracted from the PDF). Per-package calories are read only from a "M.E. kcal/kg" row whose last
 * values line up with the document's "Per 2.8 oz can" columns, and only when every value is a plausible
 * energy density for its package (and, with several sizes, the same density across them): a table read in
 * the wrong order is left out rather than guessed.
 */
export function documentFacts(text: string): DocumentFacts {
  const notes: string[] = [];
  const t = text.replace(/[ \t]+/g, ' ');
  const claim = DOC_CLAIM.exec(t)?.[0].replace(/\s+/g, ' ').trim() ?? null;
  const sizes = [...t.matchAll(/\bper\s+(\d+(?:\.\d+)?\s*-?\s*(?:fl\.?\s*oz|oz|ounces?|g|grams?)\s*(can|pouch|tray|cup|carton|tub)?)/gi)].map((m) => ({ size: parsePackageSize(m[1]), container: (m[2] ?? '').toLowerCase(), text: m[0] }));
  const calories: CalorieStatement[] = [];
  const me = /\bM\.?\s?E\.?\s+kcal\s*\/\s*kg\b([^\n]*)/i.exec(t);
  if (me && sizes.length && sizes.every((s) => s.size?.grams)) {
    const nums = [...me[1].matchAll(/(?<![\d.,])(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)(?![\d.,])/g)].map((m) => Number(m[1].replace(/,/g, '')));
    const values = nums.slice(-sizes.length);
    const densities = values.map((v, i) => v / sizes[i].size!.grams!);
    const plausible = values.length === sizes.length && densities.every((d) => d >= 0.3 && d <= 6);
    const consistent = densities.every((d) => Math.abs(d - densities[0]) <= densities[0] * 0.05);
    if (plausible && consistent) {
      values.forEach((kcal, i) => {
        const per = (sizes[i].container || 'can') as CalorieStatement['per'];
        const [c] = parseCalorieText(`${kcal} kcal per ${sizes[i].size!.text} ${per}`);
        if (c) calories.push({ ...c, text: `${sizes[i].text}: ${kcal} kcal (M.E.)` });
      });
    } else notes.push('the document’s calorie table could not be lined up with its package sizes, so it was not used');
  }
  return { adequacyText: claim, calories, notes };
}

// Abbreviations in retailer and distributor catalogue titles ("Dog Trt Frz Dr Wld Salmn").
const ABBREVIATIONS: Record<string, string> = {
  trt: 'treat', trts: 'treats', frz: 'freeze', fz: 'freeze', dr: 'dried', drd: 'dried', wld: 'wild', slmn: 'salmon', salmn: 'salmon',
  chkn: 'chicken', chk: 'chicken', ckn: 'chicken', trky: 'turkey', tky: 'turkey', bf: 'beef', lmb: 'lamb', dck: 'duck', tna: 'tuna', whtfsh: 'whitefish',
  grn: 'grain', fr: 'free', rcp: 'recipe', frmla: 'formula', frm: 'formula', dnr: 'dinner', entr: 'entree', grvy: 'gravy', pte: 'pate', lvr: 'liver', ktn: 'kitten',
  pup: 'puppy', adlt: 'adult', sr: 'senior', ind: 'indoor', org: 'organic', nat: 'natural', bts: 'bites', chw: 'chew', chws: 'chews', jrky: 'jerky', snk: 'snack', slcd: 'sliced',
  shrd: 'shredded', flkd: 'flaked', mrsl: 'morsels', ptty: 'patty', rw: 'raw', swt: 'sweet',
};
// Words that say nothing about which product it is (species and packaging words are checked separately).
const STOP = new Set(['a', 'an', 'and', 'the', 'with', 'in', 'for', 'of', 'to', 'by', 'oz', 'lb', 'lbs', 'g', 'kg', 'ct', 'count', 'pack', 'pk', 'bag', 'can', 'pouch', 'case', 'x', 'dog', 'dogs', 'cat', 'cats', 'puppy', 'kitten', 'pet', 'pets', 'treat', 'treats', 'food', 'recipe', 'formula', 'new', 'size', 'standard', 'half', 'single', 'ingredient', 'natural', 'premium']);

/** The words that identify a product in its name, with catalogue abbreviations written out. */
export function nameTokens(name: string): string[] {
  return normalizeIngredientName(name)
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => ABBREVIATIONS[w] ?? w)
    .filter((w) => !STOP.has(w) && !/^\d/.test(w) && w.length > 1);
}

/** Every identifying word of the name appears on the page (catalogue abbreviations written out), and at least two. */
export function nameOnPage(name: string, pageWords: string): boolean {
  const tokens = [...new Set(nameTokens(name))];
  const words = ` ${pageWords} `;
  const stem = (w: string) => (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w);
  return tokens.length >= 2 && tokens.every((w) => words.includes(` ${w} `) || words.includes(` ${stem(w)} `) || words.includes(` ${w}s `));
}
