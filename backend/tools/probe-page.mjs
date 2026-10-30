// Fetches product pages from GitHub's network (this sandbox cannot reach most retailers) and reports
// what Purrbi's research would verify on them: title, barcodes printed or in the page's structured data,
// the label sections (ingredients, guaranteed analysis, calories, feeding statement) as short text
// windows, and species words. Read-only; no credentials. Published as the "Page probe" report.
//   node probe-page.mjs <url> [url...] [--barcode <digits>]
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { publish } from './report.mjs';

const UA = 'Purrbi/0.1 (page probe; contact@valenciainnovations.com)';
const args = process.argv.slice(2);
const bi = args.indexOf('--barcode');
const barcode = bi >= 0 ? args[bi + 1] : null;
const fi = args.indexOf('--find');
const find = fi >= 0 ? args[fi + 1] : null; // a phrase looked for in the raw HTML (where a page keeps a section)
const urls = args.filter((a, i) => /^https:\/\//.test(a) && !(bi >= 0 && i === bi + 1) && !(fi >= 0 && i === fi + 1));

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
    if ((res.headers.get('content-type') ?? '').includes('pdf')) {
      // A linked nutrition document: its text (pdftotext, when the runner has it).
      const file = join(mkdtempSync(join(tmpdir(), 'probe-')), 'doc.pdf');
      writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      try {
        entry.pdfText = execFileSync('pdftotext', ['-layout', file, '-'], { encoding: 'utf8' }).replace(/[ \t]+/g, ' ').slice(0, 6000);
      } catch (e) {
        entry.pdfText = `pdftotext unavailable or failed: ${String(e?.message ?? e).slice(0, 200)}`;
      }
      report.pages.push(entry);
      console.log(JSON.stringify(entry, null, 1));
      continue;
    }
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
    if (find) {
      const at = [...html.matchAll(new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'), 'gi'))].slice(0, 3);
      entry.found = at.map((m) => html.slice(Math.max(0, m.index - 400), m.index + 900).replace(/\s+/g, ' '));
      entry.foundInText = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'), 'i').test(t);
    }
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
// A Shopify store's catalogue (public /products.json): which product sells this barcode.
for (const origin of [...new Set(urls.map((u) => new URL(u).origin))]) {
  if (!barcode) break;
  const found = [];
  try {
    for (let page = 1; page <= 4; page++) {
      const res = await fetch(`${origin}/products.json?limit=250&page=${page}`, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
      if (!res.ok) break;
      const { products = [] } = await res.json();
      for (const p of products) {
        const v = (p.variants ?? []).find((x) => strip(x.barcode) === strip(barcode));
        if (v) found.push({ handle: p.handle, title: p.title, type: p.product_type, tags: (p.tags ?? []).slice(0, 12), variant: v.title, barcode: v.barcode, description: text(p.body_html ?? '').slice(0, 1200) });
      }
      if (products.length < 250) break;
    }
  } catch (e) {
    found.push({ error: String(e?.name ?? e) });
  }
  if (found.length) report.pages.push({ shopifyCatalogue: origin, found });
}
publish('Page probe', report);
