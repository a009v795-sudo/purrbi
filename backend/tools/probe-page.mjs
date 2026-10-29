// Fetches product pages from GitHub's network (this sandbox cannot reach most retailers) and reports
// what Purrbi's research would verify on them: title, barcodes printed, the ingredient list, species
// words. Read-only; no credentials. Published as the "Page probe" report.
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
    .replace(/&#39;|&apos;|&rsquo;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ');

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
    const ing = /ingredients?\s*[:：]?\s*(.{20,900}?)(guaranteed analysis|calorie content|feeding|nutrition|$)/i.exec(t);
    entry.ingredients = ing ? ing[1].trim().slice(0, 700) : null;
    entry.digitRuns = [...new Set(t.match(/\b\d{11,14}\b/g) ?? [])].slice(0, 15);
    if (barcode) entry.barcodeOnPage = t.replace(/\D+/g, ' ').includes(barcode.replace(/^0+/, ''));
    entry.speciesWords = { cat: (t.match(/\bcats?\b|\bkittens?\b|\bfeline\b/gi) ?? []).length, dog: (t.match(/\bdogs?\b|\bpupp(y|ies)\b|\bcanine\b/gi) ?? []).length };
    const ga = /guaranteed analysis\s*[:：]?\s*(.{10,400}?)(ingredients|calorie|feeding|$)/i.exec(t);
    entry.guaranteedAnalysis = ga ? ga[1].trim().slice(0, 300) : null;
    const aafco = /(formulated to meet[^.]{10,200}\.|complete and balanced[^.]{0,200}\.)/i.exec(t);
    entry.adequacy = aafco ? aafco[1].slice(0, 250) : null;
  } catch (e) {
    entry.error = String(e?.name ?? e);
  }
  report.pages.push(entry);
  console.log(JSON.stringify(entry, null, 1));
}
publish('Page probe', report);
