// Label images that contributors published in Open Pet Food Facts (CC BY-SA), read by the same label
// reader as owner photos. Used only for fields the database record lacks, before Purrbi asks the
// owner for photos. The barcode check, validation and source labelling are the same as for owner
// photos; the facts are public (the image is public), so they may be stored in the shared record.
import type { ValidatedLabel } from '../ai/labelExtract';
import type { PhotoPurpose } from '../pipeline/facts';
import { labelToFacts } from '../pipeline/facts';
import type { ProductFacts, SourceRef } from '../domain/types';
import { httpBytes } from '../util/http';
import type { OpenFactsProduct } from './openFacts';

const IMAGE_HOSTS = new Set(['images.openpetfoodfacts.org', 'static.openpetfoodfacts.org', 'images.openfoodfacts.org']);
const MAX_BYTES = 10 * 1024 * 1024;

const PURPOSE_TEXT: Record<'ingredients' | 'nutrition', string> = {
  ingredients: 'the ingredient list (and any active ingredients with amounts)',
  nutrition: 'the guaranteed analysis, calorie content and nutritional adequacy statement',
};

/** The full-resolution version of a Product Opener image URL (".400.jpg" → ".full.jpg"). */
export function fullResolution(url: string): string {
  return url.replace(/\.(100|200|400)\.jpg$/, '.full.jpg');
}

export function candidateImages(product: OpenFactsProduct, needs: PhotoPurpose[]): { purpose: 'ingredients' | 'nutrition'; url: string }[] {
  const out: { purpose: 'ingredients' | 'nutrition'; url: string }[] = [];
  const add = (purpose: 'ingredients' | 'nutrition', raw: string | undefined) => {
    if (!raw) return;
    try {
      const u = new URL(raw);
      if (u.protocol === 'https:' && IMAGE_HOSTS.has(u.hostname)) out.push({ purpose, url: fullResolution(u.toString()) });
    } catch {
      /* ignore malformed URLs */
    }
  };
  if (needs.includes('ingredients')) add('ingredients', product.image_ingredients_url);
  if (needs.includes('nutrition')) add('nutrition', product.image_nutrition_url);
  return out;
}

export interface DatabaseImageOutcome {
  facts: Partial<ProductFacts>[];
  read: string[];
  skipped: string[];
}

export async function readDatabaseLabelImages(opts: {
  product: OpenFactsProduct;
  code: string;
  needs: PhotoPurpose[];
  gtin14: string;
  userAgent: string;
  now: Date;
  extract: (o: { imageBase64: string; mimeType: string; purpose: string; scanGtin14: string }) => Promise<ValidatedLabel>;
  beforeAiCall: () => Promise<void>;
}): Promise<DatabaseImageOutcome> {
  const result: DatabaseImageOutcome = { facts: [], read: [], skipped: [] };
  for (const img of candidateImages(opts.product, opts.needs).slice(0, 2)) {
    try {
      const file = await httpBytes(img.url, { source: 'Open Pet Food Facts image', headers: { 'User-Agent': opts.userAgent }, timeoutMs: 15000, maxBytes: MAX_BYTES });
      const mimeType = file.contentType || 'image/jpeg';
      if (!/^image\/(jpeg|png|webp)$/.test(mimeType)) {
        result.skipped.push(`${img.purpose}: unsupported image type`);
        continue;
      }
      await opts.beforeAiCall();
      const label = await opts.extract({ imageBase64: file.bytes.toString('base64'), mimeType, purpose: PURPOSE_TEXT[img.purpose], scanGtin14: opts.gtin14 });
      if (label.status !== 'processed') {
        result.skipped.push(`${img.purpose}: ${label.status}${label.rejected.length ? ` (${label.rejected.slice(0, 3).join('; ')})` : ''}`);
        continue;
      }
      if (label.rejected.length) result.skipped.push(`${img.purpose}, not kept: ${label.rejected.slice(0, 3).join('; ')}`);
      const source: SourceRef = {
        sourceId: `opff-image:${opts.code}:${img.purpose}`,
        sourceType: 'database_image',
        sourceName: 'Open Pet Food Facts label image',
        url: img.url,
        retrievedAt: opts.now.toISOString(),
        matchConfidence: 'exact_barcode',
        license: 'CC BY-SA 3.0 (image), contributors of Open Pet Food Facts',
        ...(label.version ? { readerVersion: label.version } : {}),
      };
      // Identity fields stay with the database record; the image only fills label panels.
      const facts = labelToFacts({ ...label, productName: null, brand: null }, source);
      result.facts.push(facts);
      result.read.push(img.purpose);
    } catch (err) {
      result.skipped.push(`${img.purpose}: ${(err as Error).message.slice(0, 120)}`);
    }
  }
  return result;
}
