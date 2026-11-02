// Database label images (Open Pet Food Facts): an image is read for what it is filed as only when that panel was read.
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ValidatedLabel } from '../../src/ai/labelExtract';
import { readDatabaseLabelImages } from '../../src/sources/labelImages';

afterEach(() => vi.unstubAllGlobals());

const label = (over: Partial<ValidatedLabel> = {}): ValidatedLabel => ({
  status: 'processed', reason: '', panels: ['front'], productName: null, brand: null, species: 'unknown', productTypeClaim: null,
  ingredientsText: null, ingredients: [], guaranteedAnalysis: [], calories: [], adequacy: null, feedingDirections: null, activeIngredients: [],
  uncertainFields: [], rejected: [], model: 'test', version: 'test', ...over,
});
const URL_OF = (p: string) => `https://images.openpetfoodfacts.org/images/products/000/000/000/0000/${p}.400.jpg`;

describe('database label images', () => {
  it('reads an image for its purpose only when that panel was read (review of label reader 2.4.0)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new Uint8Array([0xff, 0xd8, 0xff]), { status: 200, headers: { 'content-type': 'image/jpeg' } })));
    // The ingredient image shows the front (for cats); the front image shows who it is for; the nutrition image shows only the name.
    const byPurpose: Record<string, ValidatedLabel> = {
      ingredient: label({ species: 'cat', panels: ['front'] }),
      front: label({ species: 'cat', productTypeClaim: 'Cat food' }),
      'guaranteed analysis': label({ productName: 'Salmon Pâté' }),
    };
    const r = await readDatabaseLabelImages({
      product: { image_front_url: URL_OF('front_en'), image_ingredients_url: URL_OF('ingredients_en'), image_nutrition_url: URL_OF('nutrition_en') } as never,
      code: '0000000000000',
      needs: ['front', 'ingredients', 'nutrition'],
      gtin14: '00000000000000',
      userAgent: 'test',
      now: new Date('2026-11-02T00:00:00Z'),
      extract: async (o) => byPurpose[Object.keys(byPurpose).find((k) => o.purpose.includes(k))!],
      beforeAiCall: async () => undefined,
    });
    expect(r.read).toEqual(['front']);
    expect(r.skipped).toEqual(['ingredients: read, but not the panel it is filed as', 'nutrition: read, but not the panel it is filed as']);
    expect(r.failed).toEqual([]);
    // What was read still counts where it applies (who it is for), with the image as its source.
    expect(r.facts.length).toBe(3);
  });
});
