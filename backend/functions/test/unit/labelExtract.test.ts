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
  it('reads the legible rows of a panel that glare makes partly legible, and traces what each reading saw', () => {
    // As printed on a real French dog biscuit pack (U "Biscuits fourrés"); one reading calls the panel partial.
    const rows = 'Protéine brute 10%\nCellulose brute 1%\nMatières grasses brutes 8%\nCendres brutes 5,5%\nHumidité 10%';
    const clearPanel: RawPanel = { kind: 'guaranteed_analysis', legibility: 'clear', heading: 'Constituants analytiques', text: rows };
    const glare: RawPanel = { ...clearPanel, legibility: 'partial', heading: '[?] analytiques', text: rows.replace('Humidité 10%', 'Humidité [?]') };
    const label = combineReadings(read([clearPanel]), read([glare], {}, 'model-b'), GTIN);
    expect(label.guaranteedAnalysis.map((g) => `${g.nutrient}:${g.value}`)).toEqual(['crude_protein:10', 'crude_fiber:1', 'crude_fat:8', 'ash:5.5']);
    expect(label.rejected.at(-1)).toBe('readings: model-a: guaranteed_analysis; 5 rows [crude_protein 10%, crude_fiber 1%, crude_fat 8%, ash 5.5%, moisture 10%] / model-b: guaranteed_analysis (not clear: guaranteed_analysis); 4 rows [crude_protein 10%, crude_fiber 1%, crude_fat 8%, ash 5.5%]');
  });
  it('says the photo is unreadable when the readings share nothing', () => {
    const blurry: RawPanel = { kind: 'ingredients', legibility: 'partial', heading: null, text: 'COMPOSITION: Dinde [?] (22%), [?]' };
    const label = combineReadings(read([blurry], { product_name: null }), read([blurry], { product_name: null }, 'model-b'), GTIN);
    expect(label).toMatchObject({ status: 'unreadable', reason: 'No label details were readable in this photo. Retake it closer to the panel you need.' });
    expect(label.uncertainFields).toEqual(['ingredients']);
    // What each reading saw is kept for tracing, even when nothing was read.
    expect(label.rejected).toEqual(['readings: model-a: ingredients (not clear: ingredients); 0 rows / model-b: ingredients (not clear: ingredients); 0 rows']);
  });
  it('two readings agree whether a model kept the printed lines of an inline analysis or put one row per line', () => {
    // As on a real French bag (Purina ONE chat stérilisé): one model kept the printed lines, the other did not.
    const inline: RawPanel = { kind: 'guaranteed_analysis', legibility: 'partial', heading: 'Constituants analytiques', text: 'Protéine : 37,0 %, Teneur en matières\ngrasses : 13,0 %, Cendres brutes : 7,5 %, Cellulose brute : 4,0 %' };
    const perLine: RawPanel = { ...inline, legibility: 'clear', text: 'Protéine : 37,0 %\nTeneur en matières grasses : 13,0 %\nCendres brutes : 7,5 %\nCellulose brute : 4,0 %' };
    const label = combineReadings(read([inline]), read([perLine], {}, 'model-b'), GTIN);
    expect(label.status).toBe('processed');
    expect(label.guaranteedAnalysis.map((e) => `${e.nutrient}:${e.value}${e.unit}`)).toEqual(['crude_protein:37%', 'crude_fat:13%', 'ash:7.5%', 'crude_fiber:4%']);
    expect(label.rejected).toEqual([]);
  });
  it('reads the analysis in a block the reading calls the ingredient panel, as on a real Purina ONE back label', () => {
    // As on the back of a real French bag (Purina ONE chat stérilisé, 7613032759155): one printed block.
    const block: RawPanel = { kind: 'ingredients', legibility: 'partial', heading: null, text: 'Aliment complet pour chat adulte. Composition : Saumon (15%), protéines de volaille déshydratées, blé (15%), farine de soja, maïs.\nAdditifs : Additifs nutritionnels UI/kg : Vit A : 36 960 ; Vit D3 : 1 200 ; mg/kg : Taurine : 780.\nConstituants analytiques : Protéine : 37,0 %, Teneur en matières grasses : 13,0 %,\nCendres brutes : 7,5 %, Cellulose brute : 4,0 %, Acides gras Oméga 6 : 2,0 %.' };
    const asAnalysis: RawPanel = { ...block, kind: 'guaranteed_analysis' };
    const label = combineReadings(read([block]), read([asAnalysis], {}, 'model-b'), GTIN);
    expect(label.guaranteedAnalysis.map((e) => `${e.nutrient}:${e.value}`)).toEqual(['crude_protein:37', 'crude_fat:13', 'ash:7.5', 'crude_fiber:4', 'omega_6:2']);
    // The statement on the partly legible panel's first line, without the composition printed after it.
    expect(label.adequacy).toMatchObject({ type: 'complete', species: 'cat', lifeStages: ['adult_maintenance'], text: 'Aliment complet pour chat adulte.' });
    expect(read([{ ...block, text: 'Aliment comp[?]et pour chat adulte. Composition : Saumon (15%)' }]).adequacy).toBeNull(); // not when a mark touches it
    // Two panels giving one nutrient two values (two recipes in a multipack): that nutrient is not read.
    const chicken: RawPanel = { kind: 'guaranteed_analysis', legibility: 'clear', heading: 'Constituants analytiques', text: 'Protéine 11 %\nMatières grasses 5 %' };
    const beef: RawPanel = { ...chicken, text: 'Protéine 10,5 %\nMatières grasses 5 %' };
    expect(read([chicken, beef]).analysis.map((e) => `${e.nutrient}:${e.value}`)).toEqual(['crude_fat:5']);
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
  it('reads an analysis printed inline, as EU labels print it, row by row, and nothing that is ambiguous', () => {
    const rows = (t: string, pct = false) => analysisRows(t, pct).map((r) => `${r.nutrient}:${r.value}${r.unit}`);
    // TEST FIXTURE modelled on a French dry cat food bag: composition and analysis in one block, lines wrapped as printed.
    expect(rows('Aliment complet pour chat adulte. Composition : Saumon (15%), protéines de volaille déshydratées (17%), blé (14%).\nConstituants analytiques : Protéine : 37,0 %, Teneur en matières\ngrasses : 13,0 %, Cendres brutes : 7,5 %, Cellulose brute : 4,0 %, Acides gras Oméga 6 : 2,0 %.')).toEqual([
      'crude_protein:37%', 'crude_fat:13%', 'ash:7.5%', 'crude_fiber:4%', 'omega_6:2%',
    ]);
    expect(analysisRows('Constituants analytiques : Protéine : 37,0 %, Cendres brutes : 7,5 %', false).map((r) => r.label)).toEqual(['Protéine', 'Cendres brutes']);
    expect(rows('Analytische Bestandteile: Rohprotein 31 %, Fettgehalt 20 %, Rohasche 6 %, Rohfaser 2,5 %')).toEqual(['crude_protein:31%', 'crude_fat:20%', 'ash:6%', 'crude_fiber:2.5%']);
    expect(rows('Constituants analytiques (%) : Protéine 35\nCendres brutes 7,5')).toEqual(['crude_protein:35%', 'ash:7.5%']); // "(%)" printed in the text
    expect(analysisRows('Taurine 0.1 % (min), Vitamin E 150 IU/kg (min.)', false).map((r) => `${r.nutrient}:${r.qualifier}:${r.value}${r.unit}`)).toEqual(['taurine:min:0.1%', 'other:min:150IU/kg']);
    // A value printed under its name, and a note after a value, stay with their own rows.
    expect(rows('Protéine 37 % Matières grasses\n13 %')).toEqual(['crude_protein:37%', 'crude_fat:13%']);
    expect(rows('Protein 30% min (as fed)\nFat 18%')).toEqual(['crude_protein:30%', 'crude_fat:18%']);
    // Never a value under another nutrient's name, and nothing ambiguous:
    expect(rows('Protéine 37, Matières grasses 13, Cendres 7,5', true)).toEqual([]); // values without units, inline
    expect(rows('Composition: protéines de volaille (17%), graisses animales (5%)')).toEqual([]); // ingredient percentages
    expect(rows('Vitamine A : 36 900 UI/kg ; Vitamine D3 : 1 200 UI/kg ; Vitamine E : 460 mg/kg')).toEqual(['other:460mg/kg']); // a thousands space
    expect(rows('Protéine 3[?],0 %, Matières grasses 13,0 %')).toEqual(['crude_fat:13%']); // only the row a [?] touches is dropped
    expect(rows('30% 28%')).toEqual([]);
    expect(rows('Calcium 1.0% min, 1.5% max')).toEqual([]);
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
