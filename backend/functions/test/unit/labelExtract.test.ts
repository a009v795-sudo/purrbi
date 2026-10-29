// Grounded label-photo reading: values come from Purrbi's own parsing of verbatim transcriptions and
// are kept only when two independent readings agree. Model output is mocked; inputs are TEST FIXTUREs
// modelled on a real French bag (Ultima Nature) whose front photo a single reading once "read" as a
// full analysis, adequacy statement and calorie content that the photo does not show.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { gs1CheckDigit } from '../../src/domain/barcode';
import { analysisRows, combineReadings, extractLabel, LABEL_EXTRACTION_VERSION, parseReading, type RawLabelExtraction, type RawPanel } from '../../src/ai/labelExtract';

afterEach(() => vi.unstubAllGlobals());

const GTIN = '08410650233925';
const raw = (panels: RawPanel[], over: Partial<RawLabelExtraction> = {}): RawLabelExtraction => ({
  legible: true, product_name: 'ultima Nature', brand: 'affinity', species_claim: 'cat', product_type_claim: 'Adult', barcode_digits: null, panels, ...over,
});
const FRONT: RawPanel = { kind: 'front', legibility: 'clear', heading: 'ultima Nature', text: 'NO GRAIN\nAdult\nDinde Fraîche\nPommes de terre et Pois\nHuile de Poisson\nCarotte et Brocoli, Pomme et Fruits Rouges' };
const BACK: RawPanel[] = [
  { kind: 'ingredients', legibility: 'clear', heading: null, text: 'Aliment complet et équilibré élaboré pour les chats adultes.\nCOMPOSITION: Dinde (22%), protéines de volaille déshydratées (13%), farine de pois, pommes de terre déshydratées, graisses animales, huile de poisson (2%)' },
  { kind: 'guaranteed_analysis', legibility: 'clear', heading: 'Constituants analytiques', text: 'Protéine / Proteína / Protein 35%\nTeneur en matières grasses / Contenido de grasa\n/ Fat content 16%\nCellulose brute / Fibra bruta 2,5%\nMatières minérales / Inorganic matter 8%' },
];
const read = (panels: RawPanel[], over: Partial<RawLabelExtraction> = {}, model = 'model-a') => parseReading(raw(panels, over), model);

describe('grounded label reading', () => {
  it('keeps nothing a second reading does not confirm: an invented analysis on a front photo is dropped', () => {
    const invented: RawPanel[] = [
      FRONT,
      { kind: 'guaranteed_analysis', legibility: 'clear', heading: null, text: 'Protein (min) 32%\nFat (min) 15%\nCrude Ash (max) 8%\nCrude Fiber (max) 3%' },
      { kind: 'adequacy_statement', legibility: 'clear', heading: null, text: 'Complete and balanced' },
      { kind: 'calorie_statement', legibility: 'clear', heading: null, text: '3700 kcal/kg' },
    ];
    const label = combineReadings(read(invented), read([FRONT], {}, 'model-b'), GTIN);
    expect(label.status).toBe('processed'); // only the product name, which both readings show
    expect(label.productName).toBe('ultima Nature');
    expect(label.guaranteedAnalysis).toEqual([]);
    expect(label.calories).toEqual([]);
    expect(label.adequacy).toBeNull();
    expect(label.ingredients).toEqual([]); // front callouts are not an ingredient list
    expect(label.rejected).toEqual(expect.arrayContaining(['analysis: "Protein 32%" not confirmed by the second reading', 'calorie statement: the two readings differ', 'adequacy statement: the two readings differ ("Complete and balanced" / "none")']));
    expect(label.version).toBe(LABEL_EXTRACTION_VERSION);
  });
  it('keeps what both readings of a legible back label say, parsed by Purrbi’s own rules', () => {
    const b = BACK.map((p) => (p.kind === 'ingredients' ? { ...p, text: p.text!.replace('(13%)', '(13 %)') } : p)); // the same words, spaced differently
    const label = combineReadings(read(BACK), read(b, {}, 'model-b'), GTIN);
    expect(label.status).toBe('processed');
    expect(label.ingredients.slice(0, 3)).toEqual(['Dinde (22%)', 'protéines de volaille déshydratées (13%)', 'farine de pois']);
    expect(label.adequacy).toMatchObject({ type: 'complete', species: 'cat', lifeStages: ['adult_maintenance'] });
    expect(label.guaranteedAnalysis.map((g) => `${g.nutrient}:${g.qualifier}:${g.value}`)).toEqual(['crude_protein:not_stated:35', 'crude_fat:not_stated:16', 'crude_fiber:not_stated:2.5', 'ash:not_stated:8']);
    expect(label.rejected).toEqual([]);
    expect(label.model).toBe('model-a + model-b');
  });
  it('rejects values the two readings disagree on, and anything marked [?]', () => {
    const b: RawPanel[] = [
      { ...BACK[0], text: BACK[0].text!.replace('farine de pois', 'farine de [?]') },
      { ...BACK[1], text: 'Protéine / Proteína / Protein 33%\nTeneur en matières grasses / Contenido de grasa\n/ Fat content 16%\nCellulose brute / Fibra bruta [?]%\nMatières minérales / Inorganic matter 8%' },
    ];
    const label = combineReadings(read(BACK), read(b, {}, 'model-b'), GTIN);
    expect(label.ingredients).toEqual([]); // the second reading could not read the whole list
    expect(label.guaranteedAnalysis.map((g) => `${g.nutrient}:${g.value}`)).toEqual(['crude_fat:16', 'ash:8']);
    expect(label.rejected).toEqual(expect.arrayContaining(['ingredients: only one reading found a printed ingredient list', 'analysis: "Protéine / Proteína / Protein 35%" not confirmed by the second reading']));
  });
  it('keeps a treat statement that one reading printed on its own and the other inside the feeding guide', () => {
    // As printed on a real UK treat pack (Coshida Crunchy n Creamy, back label).
    const alone: RawPanel = { kind: 'adequacy_statement', legibility: 'clear', heading: null, text: 'This product is not a substitute for complete pet food. As with all treats, give as part of a balanced diet.' };
    const guide: RawPanel = { kind: 'feeding_directions', legibility: 'clear', heading: null, text: 'This is a guideline only. This product is not a substitute for complete pet food. As with all treats, give as part of a balanced diet. Feed at room temperature.' };
    const label = combineReadings(read([FRONT, alone]), read([FRONT, guide], {}, 'model-b'), GTIN);
    expect(label.adequacy).toMatchObject({ type: 'intermittent', text: alone.text });
    expect(label.rejected).toEqual([]);
  });
  it('says the photo is unreadable when the readings share nothing', () => {
    const blurry: RawPanel = { kind: 'ingredients', legibility: 'partial', heading: null, text: 'COMPOSITION: Dinde [?] (22%), [?]' };
    const label = combineReadings(read([blurry], { product_name: null }), read([blurry], { product_name: null }, 'model-b'), GTIN);
    expect(label).toMatchObject({ status: 'unreadable', reason: 'No label details were readable in this photo. Retake it closer to the panel you need.' });
    expect(label.uncertainFields).toEqual(['ingredients']);
  });
  it('calls it another product only when both readings show the same other valid barcode', () => {
    const otherCode = `400604022103${gs1CheckDigit('400604022103')}`;
    const other = (model: string) => read([FRONT], { barcode_digits: otherCode }, model);
    const none = read([FRONT], {}, 'model-b');
    const same = read([FRONT], { barcode_digits: '8410650233925' }, 'model-b');
    // A real Purina pack prints the barcode next to internal codes: 43695803 (not a valid EAN-8) and 100101943.
    const internal = (model: string) => read([FRONT], { barcode_digits: '43695803' }, model);
    expect(combineReadings(other('model-a'), other('model-b'), GTIN).status).toBe('different_product');
    expect(combineReadings(other('model-a'), none, GTIN).status).toBe('processed'); // one reading is not enough
    expect(combineReadings(other('model-a'), same, GTIN).status).toBe('processed');
    expect(combineReadings(internal('model-a'), internal('model-b'), GTIN).status).toBe('processed');
  });
});

describe('analysis rows', () => {
  it('reads one row per line, joins a name printed above its value, and keeps printed min/max', () => {
    expect(analysisRows('Crude Protein (min) 30.0%\nCrude Fat ..... 15.0% min\nMoisture (max.) 10%\nVitamin E 150 IU/kg\nCalcium 1.0% / 1.5%', false).map((r) => `${r.nutrient}:${r.qualifier}:${r.value}${r.unit}`)).toEqual([
      'crude_protein:min:30%', 'crude_fat:min:15%', 'moisture:max:10%', 'other:not_stated:150IU/kg',
    ]);
    expect(analysisRows('Constituants analytiques (%)\nProtéine 35\nCendres brutes 7,5', true).map((r) => `${r.nutrient}:${r.value}`)).toEqual(['crude_protein:35', 'ash:7.5']);
    expect(analysisRows('Protéine 35', false)).toEqual([]); // no unit printed and no "%" header: not read
  });
});

describe('two independent readings', () => {
  it('asks two models, and reads twice with the first when the second is not available', async () => {
    const asked: Record<string, unknown>[] = [];
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body));
      asked.push(body);
      if (body.model === 'gpt-5-mini') return new Response(JSON.stringify({ error: { message: 'The model `gpt-5-mini` does not exist' } }), { status: 404 });
      return new Response(JSON.stringify({ model: body.model, choices: [{ message: { content: JSON.stringify(raw(BACK)) }, finish_reason: 'stop' }] }), { status: 200 });
    }));
    const label = await extractLabel({ apiKey: 'k', model: 'gpt-4.1-mini,gpt-5-mini', imageBase64: 'AAAA', mimeType: 'image/jpeg', purpose: 'the ingredient list', scanGtin14: GTIN });
    expect(asked.map((b) => b.model).sort()).toEqual(['gpt-4.1-mini', 'gpt-4.1-mini', 'gpt-5-mini']);
    const gpt5 = asked.find((b) => b.model === 'gpt-5-mini')!;
    expect(gpt5.reasoning_effort).toBe('low'); // reasoning models take no temperature
    expect(gpt5.temperature).toBeUndefined();
    expect(label).toMatchObject({ status: 'processed', model: 'gpt-4.1-mini (read twice)' });
  });
});
