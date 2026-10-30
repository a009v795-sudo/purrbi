// A public barcode database (UPCitemdb's free lookup) as an identity HINT for research when the pet
// databases have no record: its title and brand only tell research what to search for. Nothing from it is
// shown or used as a product fact; facts come only from pages proven to be this product. A failure of this
// provider (rate limit, timeout) is recorded as such and never turns the product into "unknown".
// Switched by BARCODE_LOOKUP_ENABLED. The free endpoint allows about 100 lookups a day.
import { httpJson } from '../util/http';

export interface BarcodeHint {
  title: string;
  brand: string;
  category: string;
  source: string; // where the hint came from, for the evidence notes
}

interface UpcItemDbResponse {
  code?: string;
  items?: { title?: string; brand?: string; category?: string; upc?: string; ean?: string }[];
}

/** The barcode database's title and brand for this barcode, or null when it has no record. Throws SourceError on provider failure. */
export async function lookupBarcodeHint(gtin14: string, userAgent: string): Promise<BarcodeHint | null> {
  // UPC-A (12 digits) when the barcode is one, else EAN-13.
  const code = gtin14.startsWith('00') ? gtin14.slice(2) : gtin14.slice(1);
  const { status, json } = await httpJson<UpcItemDbResponse>(`https://api.upcitemdb.com/prod/trial/lookup?upc=${code}`, {
    source: 'UPCitemdb',
    headers: { 'User-Agent': userAgent, Accept: 'application/json' },
    timeoutMs: 6000,
    retries: 0,
    acceptStatuses: [400, 404],
  });
  if (status !== 200 || !json?.items?.length) return null;
  const item = json.items.find((i) => [i.upc, i.ean].some((x) => (x ?? '').replace(/^0+/, '') === gtin14.replace(/^0+/, ''))) ?? null;
  if (!item?.title) return null;
  return { title: item.title.slice(0, 200), brand: (item.brand ?? '').slice(0, 80), category: (item.category ?? '').slice(0, 200), source: 'UPCitemdb (barcode database)' };
}
