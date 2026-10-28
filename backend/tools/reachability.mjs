// Reachability of every external service Purrbi depends on, from wherever this runs (GitHub Actions,
// a developer machine). One small request each; records host, path, HTTP status and latency only.
// No credentials are sent: an HTTP 401 from OpenAI still proves the host is reachable.
import { writeFileSync } from 'node:fs';
import { publish } from './report.mjs';

const UA = process.env.SOURCE_USER_AGENT ?? 'Purrbi/0.1 (development build; contact@valenciainnovations.com)';
const PROBES = [
  ['Open Pet Food Facts API', 'https://world.openpetfoodfacts.org/api/v2/search?page_size=1&fields=code'],
  ['Open Pet Food Facts images', 'https://images.openpetfoodfacts.org/images/products/'],
  ['Open Food Facts API', 'https://world.openfoodfacts.org/api/v2/product/3017620422003?fields=code'],
  ['Open Beauty Facts API', 'https://world.openbeautyfacts.org/api/v2/search?page_size=1&fields=code'],
  ['Open Products Facts API', 'https://world.openproductsfacts.org/api/v2/search?page_size=1&fields=code'],
  ['openFDA food enforcement', 'https://api.fda.gov/food/enforcement.json?limit=1'],
  ['OpenAI API (no key sent)', 'https://api.openai.com/v1/models'],
  ['Firebase Auth API', 'https://identitytoolkit.googleapis.com/v1/projects'],
  ['Cloud Firestore API', 'https://firestore.googleapis.com/v1/projects/-/databases'],
  ['Firebase Storage API', 'https://firebasestorage.googleapis.com/v0/b/'],
  ['FDA web (citations)', 'https://www.fda.gov/animal-veterinary'],
  ['eCFR (citations)', 'https://www.ecfr.gov/'],
  ['ASPCA (citations)', 'https://www.aspca.org/pet-care/aspca-poison-control'],
];

async function probe(name, url) {
  const t0 = Date.now();
  const u = new URL(url);
  const row = { provider: name, host: u.host, path: u.pathname, status: null, ms: 0, reachable: false, outcome: '' };
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json, text/html;q=0.9' }, signal: AbortSignal.timeout(15000), redirect: 'follow' });
    await res.arrayBuffer();
    row.status = res.status;
    row.reachable = true;
    row.outcome = res.ok ? 'ok' : res.status === 401 || res.status === 403 ? 'reachable (auth required)' : res.status === 404 ? 'reachable (not found)' : res.status === 429 ? 'reachable (rate limited)' : `reachable (HTTP ${res.status})`;
  } catch (e) {
    row.outcome = e.name === 'TimeoutError' ? 'timeout (15 s)' : `network error: ${String(e.cause?.code ?? e.message).slice(0, 80)}`;
  }
  row.ms = Date.now() - t0;
  return row;
}

const rows = [];
for (const [name, url] of PROBES) rows.push(await probe(name, url));
const report = { kind: 'reachability', ranAt: new Date().toISOString(), runner: process.env.GITHUB_ACTIONS ? 'github-actions' : 'local', rows };
console.table(rows.map(({ provider, status, ms, outcome }) => ({ provider, status, ms, outcome })));
if (process.env.REACHABILITY_REPORT_PATH) writeFileSync(process.env.REACHABILITY_REPORT_PATH, JSON.stringify(report, null, 2));
const md = ['| Provider | Host | HTTP | ms | Outcome |', '|---|---|---|---|---|', ...rows.map((r) => `| ${r.provider} | ${r.host} | ${r.status ?? '—'} | ${r.ms} | ${r.outcome} |`)].join('\n');
publish('Provider reachability', report, md);
