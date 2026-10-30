// What a product page holds beyond its visible text, read by Purrbi itself (deterministic, no AI):
// image alternative text (manufacturers often publish the ingredient list only as an image's alt text),
// barcodes in the page's markup and structured data (a widget's `ps-sku`, JSON-LD `gtin12`, a Shopify
// variant's `barcode`), and linked nutrition documents (a "Nutrient Profiles" PDF with the AAFCO claim and
// the calories per package). Every value used is printed in the page or document it is taken from.
import { constants as zlibConstants, inflateSync } from 'node:zlib';
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
 * The product's own heading, as the page names it: the document title, the first headings (h1), the
 * og:title and a structured-data Product's name and category. Menus, footers and other products' tiles are
 * left out, so "Dog | Cat" in a site menu is not read as who the product is for.
 */
export function productHeading(html: string): string {
  const parts: string[] = [];
  const title = /<title[^>]*>([\s\S]{0,400}?)<\/title>/i.exec(html)?.[1];
  if (title) parts.push(title);
  for (const m of [...html.matchAll(/<h1\b[^>]*>([\s\S]{0,600}?)<\/h1>/gi)].slice(0, 2)) parts.push(m[1]);
  const og = /<meta\b[^>]*?property\s*=\s*["']og:title["'][^>]*?content\s*=\s*["']([^"']{0,400})["']/i.exec(html) ?? /<meta\b[^>]*?content\s*=\s*["']([^"']{0,400})["'][^>]*?property\s*=\s*["']og:title["']/i.exec(html);
  if (og) parts.push(og[1]);
  for (const m of html.matchAll(/<script\b[^>]*application\/ld\+json[^>]*>([\s\S]{0,200000}?)<\/script>/gi)) {
    try {
      const nodes: unknown[] = [];
      const walk = (x: unknown) => {
        if (Array.isArray(x)) x.forEach(walk);
        else if (x && typeof x === 'object') {
          nodes.push(x);
          const g = (x as Record<string, unknown>)['@graph'];
          if (g) walk(g);
        }
      };
      walk(JSON.parse(m[1]));
      for (const n of nodes as Record<string, unknown>[]) {
        const type = n['@type'];
        if (!(type === 'Product' || (Array.isArray(type) && type.includes('Product')))) continue;
        if (typeof n.name === 'string') parts.push(n.name.slice(0, 400));
        if (typeof n.category === 'string') parts.push(n.category.slice(0, 200));
      }
    } catch {
      // not JSON
    }
  }
  return decodeEntities(parts.map((x) => x.replace(/<[^>]+>/g, ' ')).join(' | ')).replace(/\s+/g, ' ').trim();
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
  variants: { id: string; title: string; barcode: string }[]; // barcode: 14-digit key, '' when none or invalid
  description: string;
}

export function parseShopifyProduct(json: unknown): ShopifyProduct | null {
  if (!json || typeof json !== 'object') return null;
  const p = json as { title?: unknown; type?: unknown; tags?: unknown; variants?: unknown; description?: unknown };
  if (typeof p.title !== 'string' || !Array.isArray(p.variants)) return null;
  const variants = p.variants as { id?: unknown; barcode?: unknown; title?: unknown }[];
  const key = (b: unknown) => {
    const d = String(b ?? '').replace(/\s+/g, '');
    return validGtin(d) ? d.padStart(14, '0') : '';
  };
  return {
    title: p.title,
    type: typeof p.type === 'string' ? p.type : '',
    tags: Array.isArray(p.tags) ? p.tags.filter((t): t is string => typeof t === 'string').slice(0, 30) : [],
    barcodes: variants.map((v) => String(v.barcode ?? '').replace(/\s+/g, '')).filter(validGtin).map((d) => d.padStart(14, '0')),
    variantTitles: variants.map((v) => String(v.title ?? '')).filter(Boolean).slice(0, 12),
    variants: variants.slice(0, 100).map((v) => ({ id: String(v.id ?? ''), title: String(v.title ?? ''), barcode: key(v.barcode) })),
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

// Claim wording only: "FELINE MAINTENANCE AAFCO NUTRIENT PROFILE CLAIM SUBSTANTIATION", "… is formulated to meet the
// nutritional levels established by the AAFCO Dog Food Nutrient Profiles for …". A bare reference to a profile
// ("AAFCO Dog Food Nutrient Profiles for Growth and Reproduction Minimum", a comparison column) is not a claim.
const DOC_CLAIM =
  /(?:(?:feline|canine)\s+(?:adult\s+)?(?:maintenance|growth(?:\s+(?:and|&)\s+reproduction)?|all\s+life\s+stages|gestation\s*\/\s*lactation|reproduction)\s+aafco\s+nutrient\s+profiles?\s+claim(?:\s+substantiation)?|(?:is\s+|are\s+)?(?:formulated\s+to\s+meet|meets)[^\n.]{0,80}aafco\s+(?:cat|dog)\s+food\s+nutrient\s+profiles?[^\n.]{0,80}|(?:animal\s+feeding\s+tests[^\n.]{0,160}?)?complete\s+(?:and|&)\s+balanced\s+(?:nutrition\s+)?for\s+[^\n.]{3,80})/gi;
const DOC_NEGATED = /\bnot\s+(?:formulated|intended)\s+to\s+meet|\bdoes\s+not\s+meet\b/i;
const DOC_INTERMITTENT = /[^\n.]{0,80}\bintermittent\s+(?:or\s+supplemental\s+)?feeding(?:\s+only)?[^\n.]{0,40}|[^\n.]{0,80}\bsupplemental\s+feeding\s+only[^\n.]{0,40}/i;

export interface DocumentFacts {
  adequacyText: string | null; // the claim as printed in the document
  calories: CalorieStatement[]; // per package, each with its size
  notes: string[];
  namesProduct: boolean; // the document names this product (its barcode, or most of its name's words)
}

/**
 * The AAFCO nutrient-profile claim and the calories per package from a manufacturer's nutrition document
 * (text as extracted from the PDF). Per-package calories are read only from a "M.E. kcal/kg" row whose last
 * values line up with the document's "Per 2.8 oz can" columns, and only when every value is a plausible
 * energy density for its package (and, with several sizes, the same density across them): a table read in
 * the wrong order is left out rather than guessed.
 */
export function documentFacts(text: string, product: { gtin14: string; name: string }): DocumentFacts {
  const notes: string[] = [];
  const t = text.replace(/[ \t]+/g, ' ');
  // A product line's document (several products' claims) or another product's is not this product's.
  const tokens = [...new Set(nameTokens(product.name, { species: true }))];
  const docWords = ` ${normalizeIngredientName(t).replace(/[^a-z0-9]+/g, ' ')} `;
  const stem = (w: string) => (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w);
  const hits = tokens.filter((w) => docWords.includes(` ${w} `) || docWords.includes(` ${stem(w)} `) || docWords.includes(` ${w}s `)).length;
  const namesProduct = t.replace(/\D+/g, ' ').split(' ').some((d) => d.length >= 8 && d.padStart(14, '0') === product.gtin14) || (tokens.length >= 2 && hits >= Math.max(2, Math.ceil(tokens.length * 0.6)));
  if (!namesProduct) return { adequacyText: null, calories: [], notes: ['the document does not name this product, so nothing from it was used'], namesProduct };
  const claims = [...new Set([...t.matchAll(DOC_CLAIM)].map((m) => m[0].replace(/\s+/g, ' ').trim()).filter((c) => !DOC_NEGATED.test(c)))];
  const intermittent = DOC_INTERMITTENT.exec(t)?.[0].replace(/\s+/g, ' ').trim() ?? null;
  let claim: string | null = null;
  if (intermittent && claims.length) notes.push('the document has both a nutrient-profile claim and an intermittent-feeding statement, so neither was used');
  else if (intermittent) claim = intermittent;
  else if (claims.length > 1) notes.push(`the document has ${claims.length} different nutrient-profile claims, so none was used`);
  else claim = claims[0] ?? null;
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
  return { adequacyText: claim, calories, notes, namesProduct };
}

/**
 * Whether a PDF is safe to extract text from: every compressed stream unpacks (Flate) to `cap` bytes in all,
 * at most. A small file can unpack to hundreds of megabytes (a decompression bomb) and exhaust the function's
 * memory while its text is read. Streams in other text encodings (LZW, run-length, ASCII armour) or damaged
 * ones are refused rather than guessed at; image encodings are left alone (text extraction does not decode them).
 */
export function pdfSafety(bytes: Buffer, cap: number): { ok: true; unpacked: number } | { ok: false; reason: string } {
  const s = bytes.toString('latin1');
  const IMAGE = new Set(['DCTDecode', 'JPXDecode', 'JBIG2Decode', 'CCITTFaxDecode']);
  let total = 0;
  let streams = 0;
  for (const m of s.matchAll(/stream\r?\n/g)) {
    const at = m.index ?? 0;
    if (s.slice(Math.max(0, at - 3), at) === 'end') continue;
    const objAt = s.lastIndexOf('obj', at);
    const dict = s.slice(objAt >= 0 && at - objAt < 20000 ? objAt : Math.max(0, at - 2000), at);
    const filters = [...dict.matchAll(/\/([A-Za-z0-9]+Decode)\b/g)].map((f) => f[1]);
    if (!filters.length) continue;
    if (filters.some((f) => f !== 'FlateDecode' && !IMAGE.has(f))) return { ok: false, reason: 'it uses an encoding Purrbi does not read' };
    if (!filters.includes('FlateDecode')) continue;
    if (++streams > 2000) return { ok: false, reason: 'too many compressed parts' };
    const end = s.indexOf('endstream', at + m[0].length);
    if (end < 0) return { ok: false, reason: 'a damaged compressed part' };
    try {
      total += inflateSync(bytes.subarray(at + m[0].length, end), { maxOutputLength: Math.max(1, cap - total), finishFlush: zlibConstants.Z_SYNC_FLUSH }).length;
    } catch (err) {
      if ((err as { code?: string }).code === 'ERR_BUFFER_TOO_LARGE' || err instanceof RangeError) return { ok: false, reason: `it unpacks to more than ${Math.round(cap / 1048576)} MB` };
      return { ok: false, reason: 'a damaged compressed part' };
    }
    if (total > cap) return { ok: false, reason: `it unpacks to more than ${Math.round(cap / 1048576)} MB` };
  }
  return { ok: true, unpacked: total };
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

const SPECIES_WORDS = new Set(['dog', 'dogs', 'cat', 'cats', 'puppy', 'kitten']);

/**
 * The words that identify a product in its name, with catalogue abbreviations written out. With
 * `species`, who it is for counts too (a dog treat's name must not match the same brand's cat treat).
 */
export function nameTokens(name: string, o: { species?: boolean } = {}): string[] {
  return normalizeIngredientName(name)
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => ABBREVIATIONS[w] ?? w)
    .map((w) => (w === 'dogs' ? 'dog' : w === 'cats' ? 'cat' : w))
    .filter((w) => (!STOP.has(w) || (o.species && SPECIES_WORDS.has(w))) && !/^\d/.test(w) && w.length > 1);
}

/** Every identifying word of the name appears on the page (catalogue abbreviations written out), and at least two. */
export function nameOnPage(name: string, pageWords: string, o: { species?: boolean } = {}): boolean {
  const tokens = [...new Set(nameTokens(name, o))];
  const words = ` ${pageWords} `;
  const stem = (w: string) => (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w);
  return tokens.length >= 2 && tokens.every((w) => words.includes(` ${w} `) || words.includes(` ${stem(w)} `) || words.includes(` ${w}s `));
}
