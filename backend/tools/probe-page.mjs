// Fetches product pages from GitHub's network (this sandbox cannot reach most retailers) and reports
// what Purrbi's research would verify on them: title, barcodes printed or in the page's structured data,
// the label sections (ingredients, guaranteed analysis, calories, feeding statement) as short text
// windows, and species words. Read-only; no credentials. Published as the "Page probe" report.
//   node probe-page.mjs <url> [url...] [--barcode <digits>]
import { publish } from './report.mjs';

const UA = 'Purrbi/0.1 (page probe; contact@valenciainnovations.com)';
const args = process.argv.slice(2);
const bi = args.indexOf('--barcode');
const barcode = bi >= 0 ? args[bi + 1] : null;
const urls = args.filter((a, i) => /^https:\/\//.test(a) && i !== bi + 1);

const text = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;|&rsquo;|&#8217;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&reg;|&trade;|&#174;|&#8482;/g, '')
    .replace(/\s+/g, ' ');

// Short windows of page text after each label-section word (first two occurrences each).
const SECTIONS = [
  ['ingredients', /\bingredients?\b/gi],
  ['guaranteed analysis', /guaranteed analysis/gi],
  ['calories', /calori(e|c) content|\bkcal\b/gi],
  ['adequacy', /formulated to meet|complete and balanced|intermittent|supplemental feeding|aafco/gi],
  ['species', /\bfor (dogs?|cats?)\b|\bdogs? (and|&) cats?\b|\bcats? (and|&) dogs?\b/gi],
  ['size', /\b\d+(\.\d+)?\s?(oz|ounce|g|lb)\b[^.]{0,20}(can|pouch|bag)?/gi],
];
const windows = (t) =>
  Object.fromEntries(
    SECTIONS.map(([name, re]) => [
      name,
      [...t.matchAll(re)]
        .slice(0, name === 'calories' || name === 'adequacy' ? 3 : 2)
        .map((m) => t.slice(Math.max(0, m.index - (name === 'species' || name === 'size' ? 60 : 0)), m.index + (name === 'ingredients' ? 700 : 260)).trim()),
    ]),
  );

/** GTINs named in JSON-LD / microdata / a Shopify product object in the raw HTML. */
function structuredGtins(html) {
  const out = new Set();
  for (const m of html.matchAll(/"(?:gtin(?:8|12|13|14)?|barcode|upc|ean)"\s*:\s*"?(\d{8,14})"?/gi)) out.add(m[1]);
  for (const m of html.matchAll(/itemprop=["'](?:gtin(?:8|12|13|14)?)["'][^>]*content=["'](\d{8,14})["']/gi)) out.add(m[1]);
  return [...out].slice(0, 20);
}

const strip = (d) => (d ?? '').replace(/^0+/, '');
const report = { kind: 'page-probe', at: new Date().toISOString(), barcode, pages: [] };
for (const url of urls) {
  const entry = { url };
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html' }, redirect: 'follow', signal: AbortSignal.timeout(20000) });
    entry.status = res.status;
    entry.finalUrl = res.url;
    const html = await res.text();
    const t = text(html);
    entry.title = (/<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1] ?? '').trim().slice(0, 200);
    entry.length = t.length;
    entry.structuredGtins = structuredGtins(html);
    if (barcode) {
      entry.barcodeInText = t.replace(/\D+/g, ' ').split(' ').some((d) => d && strip(d) === strip(barcode));
      entry.barcodeInHtml = html.replace(/\D+/g, ' ').split(' ').some((d) => d && strip(d) === strip(barcode));
      entry.barcodeInStructured = entry.structuredGtins.some((g) => strip(g) === strip(barcode));
    }
    entry.speciesWords = { cat: (t.match(/\bcats?\b|\bkittens?\b|\bfeline\b/gi) ?? []).length, dog: (t.match(/\bdogs?\b|\bpupp(y|ies)\b|\bcanine\b/gi) ?? []).length };
    entry.windows = windows(t);
    // Shopify stores publish the product (variants with barcodes, description) at <product url>.js.
    if (/\/products\/[^/?#]+\/?$/.test(new URL(res.url).pathname)) {
      try {
        const js = await fetch(`${res.url.replace(/\/$/, '').replace(/[?#].*$/, '')}.js`, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
        if (js.ok) {
          const p = await js.json();
          entry.shopify = { title: p.title, type: p.type, tags: (p.tags ?? []).slice(0, 12), variants: (p.variants ?? []).slice(0, 6).map((v) => ({ title: v.title, barcode: v.barcode ?? null, sku: v.sku ?? null })), description: text(p.description ?? '').slice(0, 900) };
        } else entry.shopify = { status: js.status };
      } catch (e) {
        entry.shopify = { error: String(e?.name ?? e) };
      }
    }
  } catch (e) {
    entry.error = String(e?.name ?? e);
  }
  report.pages.push(entry);
  console.log(JSON.stringify(entry, null, 1));
}
publish('Page probe', report);
