// Shows exactly what the Open*Facts databases return for given barcodes, from GitHub's network (this
// sandbox cannot reach them): HTTP status, redirects (not followed), the record's product_type and the
// fields Purrbi classifies with. Read-only; no credentials. Published as the "Barcode probe" report.
//   node probe-barcode.mjs <barcode> [barcode...]
import { publish } from './report.mjs';

const UA = 'Purrbi/0.1 (barcode probe; contact@valenciainnovations.com)';
const HOSTS = { opff: 'world.openpetfoodfacts.org', off: 'world.openfoodfacts.org', obf: 'world.openbeautyfacts.org', opf: 'world.openproductsfacts.org' };
const FIELDS = 'code,product_type,product_name,product_name_en,generic_name,generic_name_en,brands,brand_owner,owner,categories_tags,labels_tags,countries_tags,stores,quantity,lang,ingredients_text,ingredients_text_en,image_front_url,image_ingredients_url,image_nutrition_url,nutriments,data_sources_tags,last_modified_t,created_t';

const short = (v, n = 160) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').slice(0, n) : v);

async function get(url) {
  const started = Date.now();
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'manual', signal: AbortSignal.timeout(20000) });
    const location = res.headers.get('location');
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
    return { status: res.status, ms: Date.now() - started, location, json };
  } catch (e) {
    return { status: 'network', ms: Date.now() - started, error: String(e?.name ?? e) };
  }
}

function summarize(p) {
  if (!p) return null;
  const nutr = p.nutriments ?? {};
  return {
    product_type: p.product_type ?? null,
    product_name: short(p.product_name_en || p.product_name),
    generic_name: short(p.generic_name_en || p.generic_name),
    brands: p.brands ?? null,
    brand_owner: p.brand_owner ?? null,
    owner: p.owner ?? null,
    quantity: p.quantity ?? null,
    lang: p.lang ?? null,
    categories_tags: (p.categories_tags ?? []).slice(0, 25),
    labels_tags: (p.labels_tags ?? []).slice(0, 15),
    countries_tags: (p.countries_tags ?? []).slice(0, 8),
    stores: p.stores ?? null,
    data_sources_tags: p.data_sources_tags ?? null,
    ingredients_text: short(p.ingredients_text_en || p.ingredients_text, 400),
    images: { front: !!p.image_front_url, ingredients: !!p.image_ingredients_url, nutrition: !!p.image_nutrition_url },
    nutriment_keys: Object.keys(nutr).filter((k) => k.endsWith('_100g')).slice(0, 20),
    last_modified: p.last_modified_t ? new Date(p.last_modified_t * 1000).toISOString() : null,
  };
}

const codes = process.argv.slice(2).filter((c) => /^\d{8,14}$/.test(c));
if (!codes.length) {
  console.error('usage: node probe-barcode.mjs <barcode> [barcode...]');
  process.exit(2);
}
const report = { kind: 'barcode-probe', at: new Date().toISOString(), barcodes: [] };
for (const code of codes) {
  const entry = { code, v2: {}, v3: {} };
  for (const [db, host] of Object.entries(HOSTS)) {
    const r = await get(`https://${host}/api/v2/product/${code}?fields=${FIELDS}`);
    entry.v2[db] = { status: r.status, ms: r.ms, redirect: r.location ?? undefined, apiStatus: r.json?.status ?? null, statusVerbose: r.json?.status_verbose ?? null, product: summarize(r.json?.product), error: r.error };
  }
  // API v3 reports the record's product_type and, with product_type=all, finds records of any type.
  for (const pt of ['all', 'food', 'petfood']) {
    const r = await get(`https://world.openfoodfacts.org/api/v3/product/${code}?product_type=${pt}&fields=code,product_type,product_name,brands,categories_tags`);
    entry.v3[pt] = { status: r.status, redirect: r.location ?? undefined, result: r.json?.result ?? null, errors: r.json?.errors ?? null, product: r.json?.product ? { product_type: r.json.product.product_type ?? null, product_name: short(r.json.product.product_name), brands: r.json.product.brands ?? null, categories_tags: (r.json.product.categories_tags ?? []).slice(0, 15) } : null };
  }
  // The public barcode database the backend uses for search words (UPCitemdb's keyless trial): its answer
  // and its rate-limit headers, from this runner's address (the deployed functions share Google's addresses).
  {
    const upc = code.length === 13 && code.startsWith('0') ? code.slice(1) : code;
    const started = Date.now();
    try {
      const res = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${upc}`, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
      const headers = Object.fromEntries([...res.headers].filter(([k]) => /rate|retry|limit|reset/i.test(k)));
      let json = null;
      try {
        json = JSON.parse(await res.text());
      } catch {
        json = null;
      }
      entry.upcitemdb = { status: res.status, ms: Date.now() - started, headers, code: json?.code ?? null, message: json?.message ?? null, items: (json?.items ?? []).map((i) => ({ title: short(i.title, 200), brand: i.brand ?? null, category: short(i.category, 120), upc: i.upc ?? null, ean: i.ean ?? null, size: i.size ?? null, offers: (i.offers ?? []).slice(0, 5).map((o) => ({ merchant: o.merchant, domain: o.domain, title: short(o.title, 120), link: o.link ? short(o.link, 160) : null })) })) };
    } catch (e) {
      entry.upcitemdb = { status: 'network', ms: Date.now() - started, error: String(e?.name ?? e) };
    }
  }
  report.barcodes.push(entry);
  console.log(JSON.stringify(entry, null, 1));
}
publish('Barcode probe', report);
