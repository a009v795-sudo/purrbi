// Grounded label-photo reading: values come from Purrbi's own parsing of verbatim transcriptions and
// are kept only when two independent readings agree. Model output is mocked; inputs are TEST FIXTUREs
// modelled on a real French bag (Ultima Nature) whose front photo a single reading once "read" as a
// full analysis, adequacy statement and calorie content that the photo does not show.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { gs1CheckDigit } from '../../src/domain/barcode';
import { analysisRows, combineReadings, extractLabel, LABEL_EXTRACTION_VERSION, panelsReadDifferentlySince, parseReading, readingInUse, type RawLabelExtraction, type RawPanel, type ValidatedLabel } from '../../src/ai/labelExtract';

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
/** Lines a text takes at `width` characters a line, words wrapped as the app wraps them. */
const wrapped = (text: string, width: number) => text.split(' ').reduce((ls, w) => (ls[ls.length - 1].length + 1 + w.length <= width && ls[ls.length - 1] ? [...ls.slice(0, -1), `${ls[ls.length - 1]} ${w}`] : [...ls.filter(Boolean), w]), ['']).length;

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
    expect(label.rejected.at(-1)).toBe('readings: model-a: guaranteed_analysis; 5 rows [crude_protein 10%, crude_fiber 1%, crude_fat 8%, ash 5.5%, moisture 10%]; name "ultima Nature" / model-b: guaranteed_analysis (not clear: guaranteed_analysis); 4 rows [crude_protein 10%, crude_fiber 1%, crude_fat 8%, ash 5.5%]; name "ultima Nature"');
  });
  it('says the photo is unreadable when the readings share nothing', () => {
    const blurry: RawPanel = { kind: 'ingredients', legibility: 'partial', heading: null, text: 'COMPOSITION: Dinde [?] (22%), [?]' };
    const label = combineReadings(read([blurry], { product_name: null }), read([blurry], { product_name: null }, 'model-b'), GTIN);
    // The panel both readings found but could not read in full is named (2.4.0). Its brand and species do not make a
    // back-panel photo "read": only a front photo's do.
    expect(label).toMatchObject({ status: 'unreadable', reason: 'Couldn’t read all of the ingredient list. Retake it straight on, in good light.' });
    expect(label.uncertainFields).toEqual(['ingredients']);
    // What each reading saw is kept for tracing, even when nothing was read.
    expect(label.rejected).toEqual(['readings: model-a: ingredients (not clear: ingredients); 0 rows / model-b: ingredients (not clear: ingredients); 0 rows']);
  });
  // The owner's photos of test A (Whole Paws salmon pâté, 2026-11-02): one of three readings of the same front photo
  // dropped the name, and the photo was called unreadable though both readings agreed on brand and species; the
  // barcode side's ingredient panel is cut off at the photo's edge.
  const WP_FRONT: RawPanel = { kind: 'front', legibility: 'clear', heading: 'WHOLE PAWS', text: 'BY WHOLE FOODS MARKET\nPREMIUM CAT FOOD\nGRAIN FREE\nSALMON PÂTÉ\nLOAF RECIPE\nNET WT 5.5 OZ (156g)' };
  const WP = { brand: 'WHOLE PAWS', species_claim: 'cat' as const, product_type_claim: 'PREMIUM CAT FOOD' };
  const pair = (panels: RawPanel[], na: string | null, nb: string | null, over: Partial<RawLabelExtraction> = WP, overB: Partial<RawLabelExtraction> = over) =>
    combineReadings(read(panels, { ...over, product_name: na }), read(panels, { ...overB, product_name: nb }, 'model-b'), GTIN);
  const name2 = (text: string, na: string, nb: string) => pair([{ kind: 'front', legibility: 'clear', heading: null, text }], na, nb, { brand: null, species_claim: 'cat', product_type_claim: null }).productName;
  it('a front photo’s name agrees when one reading adds the brand or a type line; its agreed brand and species are read', () => {
    expect(pair([WP_FRONT], 'WHOLE PAWS GRAIN FREE SALMON PÂTÉ LOAF RECIPE', 'GRAIN FREE SALMON PÂTÉ LOAF RECIPE')).toMatchObject({ status: 'processed', productName: 'GRAIN FREE SALMON PÂTÉ LOAF RECIPE', brand: 'WHOLE PAWS', species: 'cat', productTypeClaim: 'PREMIUM CAT FOOD' });
    // The type line after it, a dash between; the same words, so the one not in capitals is kept.
    expect(pair([WP_FRONT], 'GRAIN FREE SALMON PÂTÉ LOAF RECIPE – PREMIUM CAT FOOD', 'Grain Free Salmon Pâté Loaf Recipe').productName).toBe('Grain Free Salmon Pâté Loaf Recipe');
    // The type line, printed on its own, given in front of the name: the name without it.
    expect(pair([WP_FRONT], 'PREMIUM CAT FOOD GRAIN FREE SALMON PÂTÉ LOAF RECIPE', 'GRAIN FREE SALMON PÂTÉ LOAF RECIPE').productName).toBe('GRAIN FREE SALMON PÂTÉ LOAF RECIPE');
    // Both in capitals, a dash left between: the name without the dash.
    expect(pair([WP_FRONT], 'GRAIN FREE SALMON PÂTÉ LOAF RECIPE – PREMIUM CAT FOOD', 'GRAIN FREE SALMON PÂTÉ LOAF RECIPE').productName).toBe('GRAIN FREE SALMON PÂTÉ LOAF RECIPE');
    // Both with the brand: the name without it.
    expect(pair([WP_FRONT], 'Whole Paws Grain Free Salmon Pâté Loaf Recipe', 'WHOLE PAWS GRAIN FREE SALMON PÂTÉ LOAF RECIPE').productName).toBe('Grain Free Salmon Pâté Loaf Recipe');
    // A brand printed with a trademark sign and another apostrophe is the same brand, and printed.
    const hills: RawPanel = { kind: 'front', legibility: 'clear', heading: 'HILL’S™ SCIENCE DIET', text: 'Adult 7+\nIndoor\nChicken Recipe\nCat Food' };
    expect(combineReadings(read([hills], { brand: "Hill's", product_name: 'Science Diet Adult 7+ Indoor Chicken Recipe', product_type_claim: 'Cat Food' }), read([hills], { brand: 'Hill’s', product_name: "Hill's Science Diet Adult 7+ Indoor Chicken Recipe", product_type_claim: 'Cat Food' }, 'model-b'), GTIN)).toMatchObject({ brand: "Hill's", productName: 'Science Diet Adult 7+ Indoor Chicken Recipe', species: 'cat' });
    // "&", "and" and "with" printed either way are the same name.
    const tuna: RawPanel = { kind: 'front', legibility: 'clear', heading: null, text: 'TUNA & SALMON FEAST\nCAT FOOD' };
    expect(pair([tuna], 'Tuna & Salmon Feast', 'Tuna and Salmon Feast', { brand: null, species_claim: 'cat', product_type_claim: null }).productName).toBe('Tuna & Salmon Feast');
    // One reading gives the GRAIN FREE line as its product type and leaves it out of the name (live, three of five runs
    // of the owner's photo): the fuller name, both readings having read every word of it; never the shorter one.
    const gfType = combineReadings(read([WP_FRONT], { ...WP, product_name: 'GRAIN FREE SALMON PÂTÉ LOAF RECIPE' }), read([WP_FRONT], { ...WP, product_type_claim: 'GRAIN FREE', product_name: 'SALMON PÂTÉ LOAF RECIPE' }, 'model-b'), GTIN, 'front');
    expect(gfType).toMatchObject({ productName: 'GRAIN FREE SALMON PÂTÉ LOAF RECIPE', brand: 'WHOLE PAWS', species: 'cat', productTypeClaim: null });
    expect(combineReadings(read([WP_FRONT], { ...WP, product_type_claim: 'GRAIN FREE', product_name: 'SALMON PÂTÉ LOAF RECIPE' }), read([WP_FRONT], { ...WP, product_name: 'GRAIN FREE SALMON PÂTÉ LOAF RECIPE' }, 'model-b'), GTIN).productName).toBe('GRAIN FREE SALMON PÂTÉ LOAF RECIPE');
    // What the fuller name adds may not be a flavour the shorter leaves out: two flavours are two products.
    expect(name2('FLAKED TUNA & MACKEREL FEAST', 'Flaked Tuna & Mackerel Feast', 'Flaked Tuna Feast')).toBeNull();
    // A flavour line given as one reading's type completes its name too (the fuller-name rule alone refuses an added flavour).
    const ffType: RawPanel = { kind: 'front', legibility: 'clear', heading: 'FANCY FEAST', text: 'CLASSIC PÂTÉ\nCHICKEN FEAST\nGOURMET WET CAT FOOD' };
    const ffc = { brand: 'Fancy Feast', species_claim: 'cat' as const };
    expect(combineReadings(read([ffType], { ...ffc, product_type_claim: 'Chicken Feast', product_name: 'Classic Pâté' }), read([ffType], { ...ffc, product_type_claim: null, product_name: 'Classic Pâté Chicken Feast' }, 'model-b'), GTIN).productName).toBe('Classic Pâté Chicken Feast');
    expect(combineReadings(read([ffType], { ...ffc, product_type_claim: null, product_name: 'Classic Pâté Chicken Feast' }), read([ffType], { ...ffc, product_type_claim: 'Chicken Feast', product_name: 'Classic Pâté' }, 'model-b'), GTIN).productName).toBe('Classic Pâté Chicken Feast');
    // The life stage given as one reading's type completes the kitten name, never shortens it to the adult one.
    const kittenFront: RawPanel = { kind: 'front', legibility: 'clear', heading: 'FANCY FEAST', text: 'KITTEN\nCLASSIC PÂTÉ\nCHICKEN FEAST' };
    const ff = { brand: 'Fancy Feast', species_claim: 'cat' as const };
    expect(combineReadings(read([kittenFront], { ...ff, product_type_claim: 'Kitten', product_name: 'Classic Pâté Chicken Feast' }), read([kittenFront], { ...ff, product_type_claim: null, product_name: 'Kitten Classic Pâté Chicken Feast' }, 'model-b'), GTIN).productName).toBe('Kitten Classic Pâté Chicken Feast');
    expect(combineReadings(read([kittenFront], { ...ff, product_type_claim: null, product_name: 'Kitten Classic Pâté Chicken Feast' }), read([kittenFront], { ...ff, product_type_claim: 'Kitten', product_name: 'Classic Pâté Chicken Feast' }, 'model-b'), GTIN).productName).toBe('Kitten Classic Pâté Chicken Feast');
    // A name both readings gave but not kept is traced as each gave it (not in `rejected`, which says what to retake).
    expect(pair([WP_FRONT], 'CHICKEN FEAST', 'GRAIN FREE SALMON PÂTÉ LOAF RECIPE')).toMatchObject({ rejected: [], notKept: ['name: "CHICKEN FEAST" / "GRAIN FREE SALMON PÂTÉ LOAF RECIPE"'] });
    expect(pair([WP_FRONT], 'GRAIN FREE SALMON PÂTÉ LOAF RECIPE', 'GRAIN FREE SALMON PÂTÉ LOAF RECIPE').notKept).toBeUndefined();
    // One reading's name leaves out printed lines of it ("SALMON"; live: "SALMON PÂTÉ LOAF RECIPE"): the fuller name.
    expect(pair([WP_FRONT], 'SALMON', 'GRAIN FREE SALMON PÂTÉ LOAF RECIPE').productName).toBe('GRAIN FREE SALMON PÂTÉ LOAF RECIPE');
    expect(pair([WP_FRONT], 'GRAIN FREE SALMON PÂTÉ LOAF RECIPE', 'SALMON PÂTÉ LOAF RECIPE').productName).toBe('GRAIN FREE SALMON PÂTÉ LOAF RECIPE');
    // Names that are not the same name are not kept, but the front's agreed, printed brand and species still are.
    expect(pair([WP_FRONT], 'CHICKEN FEAST', 'GRAIN FREE SALMON PÂTÉ LOAF RECIPE')).toMatchObject({ status: 'processed', productName: null, brand: 'WHOLE PAWS', species: 'cat', productTypeClaim: 'PREMIUM CAT FOOD' });
    // Nothing agreed on a front photo: unreadable, and the owner is asked to retake the front.
    expect(pair([WP_FRONT], 'A', 'C', { brand: 'B', species_claim: 'not_visible', product_type_claim: null }, { brand: 'D', species_claim: 'not_visible', product_type_claim: null })).toMatchObject({ status: 'unreadable', reason: 'Couldn’t read the name or who it is for. Retake the front in good light.' });
  });
  // Review of 7accb55: the ways two models transcribe the same front (test A's can, test C's treats, a Fancy Feast can).
  it('reads a printed name whatever order or panels a model transcribes its lines in', () => {
    const lines = (heading: string | null, ...text: string[]): RawPanel => ({ kind: 'front', legibility: 'clear', heading, text: text.join('\n') });
    const asPrinted = lines('WHOLE PAWS', 'BY WHOLE FOODS MARKET', 'PREMIUM CAT FOOD', 'GRAIN FREE', 'SALMON PÂTÉ', 'LOAF RECIPE', 'NET WT 5.5 OZ (156g)');
    const NAME = 'GRAIN FREE SALMON PÂTÉ LOAF RECIPE';
    const both = (pa: RawPanel[], pb: RawPanel[], na = NAME, nb = NAME, over: Partial<RawLabelExtraction> = WP) => combineReadings(read(pa, { ...over, product_name: na }), read(pb, { ...over, product_name: nb }, 'model-b'), GTIN);
    const ok = { status: 'processed', productName: NAME, brand: 'WHOLE PAWS', species: 'cat', productTypeClaim: 'PREMIUM CAT FOOD' };
    // The badge read after the flavour; the largest line as the heading; the front split into panels.
    expect(both([asPrinted], [lines('WHOLE PAWS', 'BY WHOLE FOODS MARKET', 'PREMIUM CAT FOOD', 'SALMON PÂTÉ', 'LOAF RECIPE', 'GRAIN FREE', 'NET WT 5.5 OZ (156g)')])).toMatchObject(ok);
    expect(both([asPrinted], [lines('SALMON PÂTÉ', 'WHOLE PAWS', 'PREMIUM CAT FOOD', 'GRAIN FREE', 'LOAF RECIPE', 'NET WT 5.5 OZ (156g)')])).toMatchObject(ok);
    expect(both([asPrinted], [lines('WHOLE PAWS', 'BY WHOLE FOODS MARKET', 'PREMIUM CAT FOOD'), lines('SALMON PÂTÉ', 'LOAF RECIPE'), lines('GRAIN FREE'), { kind: 'other', legibility: 'clear', heading: null, text: 'NET WT 5.5 OZ (156g)' }])).toMatchObject(ok);
    // One reading leaves the logo or the type line out of its transcription, or writes the name with the brand, the type
    // line or the size: name, brand, species and type are all still read.
    const noLogo = lines(null, 'BY WHOLE FOODS MARKET', 'PREMIUM CAT FOOD', 'GRAIN FREE', 'SALMON PÂTÉ', 'LOAF RECIPE');
    expect(both([asPrinted], [noLogo])).toMatchObject(ok);
    expect(both([asPrinted], [noLogo], NAME, `WHOLE PAWS ${NAME}`)).toMatchObject(ok);
    expect(both([asPrinted], [lines('WHOLE PAWS', 'GRAIN FREE', 'SALMON PÂTÉ', 'LOAF RECIPE')])).toMatchObject(ok);
    expect(both([asPrinted], [asPrinted], `${NAME} PREMIUM CAT FOOD`, `${NAME} 5.5 OZ`)).toMatchObject(ok);
    expect(both([asPrinted], [asPrinted], NAME, 'GRAIN FREE SALMON PATE LOAF')).toMatchObject(ok); // "Recipe" and the accents aside
    // Test C's treats, the type line above the flavour; a Fancy Feast can whose name is given in another order.
    const c = lines('WHOLE PAWS', 'CAT TREATS', 'SALMON & AVOCADO RECIPE', 'NET WT 3 OZ (85g)');
    expect(both([c], [c], 'Salmon & Avocado Recipe Treats', 'SALMON & AVOCADO RECIPE TREATS', { brand: 'WHOLE PAWS', species_claim: 'cat', product_type_claim: 'CAT TREATS' })).toMatchObject({ productName: 'Salmon & Avocado Recipe Treats', species: 'cat', productTypeClaim: 'CAT TREATS' });
    const ff = lines('FANCY FEAST', 'CLASSIC PÂTÉ', 'SAVORY SALMON FEAST', 'GOURMET WET CAT FOOD', 'NET WT 3 OZ (85g)');
    expect(both([ff], [ff], 'Savory Salmon Feast Classic Pâté', 'Savory Salmon Feast Classic Pâté', { brand: 'Fancy Feast', species_claim: 'cat', product_type_claim: 'Gourmet Wet Cat Food' }).productName).toBe('Savory Salmon Feast Classic Pâté');
    // A type line of format words printed between the name's lines (review of 3bd9ca0).
    const ffBetween = lines('FANCY FEAST', 'CLASSIC PÂTÉ', 'GOURMET WET CAT FOOD', 'SAVORY SALMON FEAST');
    expect(both([ffBetween], [ffBetween], 'Classic Pâté Savory Salmon Feast', 'Fancy Feast Classic Pâté Savory Salmon Feast', { brand: 'Fancy Feast', species_claim: 'cat', product_type_claim: null }).productName).toBe('Classic Pâté Savory Salmon Feast');
    // A brand word only one reading's brand has is part of the name: a range in a brand claim does not hide.
    const medleys = lines('FANCY FEAST', 'MEDLEYS', 'TUSCANY CHICKEN');
    expect(combineReadings(read([medleys], { brand: 'Fancy Feast Medleys', species_claim: 'cat', product_type_claim: null, product_name: 'Fancy Feast Medleys Tuscany Chicken' }), read([medleys], { brand: 'Fancy Feast', species_claim: 'cat', product_type_claim: null, product_name: 'Tuscany Chicken' }, 'model-b'), GTIN).productName).toBe('Medleys Tuscany Chicken'); // the fuller, never "Tuscany Chicken"
    const gl = lines('FANCY FEAST', 'GRAVY LOVERS', 'CHICKEN FEAST');
    expect(combineReadings(read([gl], { brand: 'Fancy Feast Gravy Lovers', species_claim: 'cat', product_type_claim: null, product_name: 'Fancy Feast Gravy Lovers Chicken Feast' }), read([gl], { brand: 'Fancy Feast', species_claim: 'cat', product_type_claim: null, product_name: 'Chicken Feast' }, 'model-b'), GTIN).productName).toBe('Gravy Lovers Chicken Feast'); // the fuller, never "Chicken Feast"
    // A logo word that is one reading's own printed brand, when the readings' brands differ (review of 3bd9ca0).
    const blue = lines('BLUE', 'WILDERNESS', 'INDOOR', 'CHICKEN RECIPE', 'NATURAL ADULT DRY CAT FOOD');
    const blueB = combineReadings(read([blue], { brand: 'BLUE', species_claim: 'cat', product_type_claim: null, product_name: 'BLUE Wilderness Indoor Chicken Recipe' }), read([blue], { brand: 'Blue Buffalo', species_claim: 'cat', product_type_claim: null, product_name: 'Wilderness Indoor Chicken Recipe' }, 'model-b'), GTIN);
    expect(blueB).toMatchObject({ productName: 'Wilderness Indoor Chicken Recipe', brand: null, species: 'cat' });
    // One reading left a name line out of its own transcription: the other's prints the whole name (review of 3bd9ca0);
    // a transcription that shows a life stage beside it still says no.
    const noBadge = lines('WHOLE PAWS', 'BY WHOLE FOODS MARKET', 'PREMIUM CAT FOOD', 'SALMON PÂTÉ', 'LOAF RECIPE');
    expect(both([asPrinted], [noBadge])).toMatchObject(ok);
    const kitten = lines('WHOLE PAWS', 'KITTEN', 'GRAIN FREE', 'SALMON PÂTÉ', 'LOAF RECIPE');
    expect(both([kitten], [noBadge]).productName).toBeNull(); // the name both give leaves KITTEN out
    expect(both([asPrinted], [kitten]).productName).toBeNull(); // one transcription shows KITTEN beside it: that is enough to refuse it
    expect(both([noBadge], [noBadge]).productName).toBeNull(); // neither transcription prints all of the name
    // A name of thousands of spaces is read as quickly as any other.
    const started = Date.now();
    expect(both([asPrinted], [asPrinted], `GRAIN FREE${' '.repeat(10000)}SALMON PÂTÉ LOAF RECIPE`, NAME).productName).toBe(NAME);
    expect(Date.now() - started).toBeLessThan(1000);
    // The two printed lines given the other way round by one reading: the same name, shown in the printed order.
    expect(both([ff], [ff], 'Savory Salmon Feast Classic Pâté', 'Classic Pâté Savory Salmon Feast', { brand: 'Fancy Feast', species_claim: 'cat', product_type_claim: 'Gourmet Wet Cat Food' }).productName).toBe('Classic Pâté Savory Salmon Feast');
    // A type line printed as part of the name stays in it.
    const oneLine = lines('WHOLE PAWS', 'SALMON & AVOCADO RECIPE TREATS', 'FOR CATS');
    expect(both([oneLine], [oneLine], 'SALMON & AVOCADO RECIPE TREATS', 'SALMON & AVOCADO RECIPE TREATS', { brand: 'WHOLE PAWS', species_claim: 'cat', product_type_claim: 'TREATS' })).toMatchObject({ productName: 'SALMON & AVOCADO RECIPE TREATS', productTypeClaim: 'TREATS' });
  });
  // Review of label reader 2.4.0 (first version, never deployed): each of these was kept, and none may be.
  it('never keeps a name that differs in a flavour, variant, life stage or pack, nor two different flavours', () => {
    const front = (text: string): RawPanel => ({ kind: 'front', legibility: 'clear', heading: null, text });
    const name = (text: string, na: string, nb: string, brand: string | null = null) => pair([front(text)], na, nb, { brand, species_claim: 'cat', product_type_claim: null }).productName;
    expect(name('FANCY FEAST\nFLAKED TUNA & MACKEREL FEAST\nGOURMET CAT FOOD', 'Flaked Tuna & Mackerel Feast', 'Flaked Tuna Feast', 'Fancy Feast')).toBeNull();
    expect(name('Classic Pâté\nTender Liver & Chicken Feast', 'Classic Pâté Tender Liver & Chicken Feast', 'Classic Pâté Chicken Feast')).toBeNull();
    expect(name('Tuna with Salmon\nin Gravy', 'Tuna with Salmon in Gravy', 'Tuna in Gravy')).toBeNull();
    // One reading leaves the life stage out: the fuller name, the kitten food's own; never the adult one.
    expect(name('FANCY FEAST\nKITTEN\nCLASSIC PÂTÉ\nCHICKEN FEAST', 'Fancy Feast Kitten Classic Pâté Chicken Feast', 'Classic Pâté Chicken Feast', 'Fancy Feast')).toBe('Kitten Classic Pâté Chicken Feast');
    expect(name('HILL’S SCIENCE DIET\nADULT 7+ INDOOR\nCHICKEN RECIPE', "Hill's Science Diet Adult 7+ Indoor Chicken Recipe", 'Science Diet Adult Indoor Chicken Recipe', "Hill's")).toBe('Science Diet Adult 7+ Indoor Chicken Recipe');
    // A claim about ageing beside it is not a life stage ("Supports healthy aging" under "Adult 7+ … Chicken Recipe").
    expect(name("HILL'S\nSCIENCE DIET\nAdult 7+\nIndoor\nChicken Recipe\ncat food\nSupports healthy aging", "Hill's Science Diet Adult 7+ Indoor Chicken Recipe", 'Science Diet Adult 7+ Indoor Chicken Recipe', "Hill's")).toBe('Science Diet Adult 7+ Indoor Chicken Recipe');
    expect(name('Classic Pâté\nPoultry & Beef Feast\nVariety Pack', 'Classic Pâté Poultry & Beef Feast Variety Pack', 'Classic Pâté Beef Feast')).toBeNull();
    // Both readings leave the same word out: the name they give is not printed on the photo as they transcribed it.
    expect(name('FLAKED TUNA & MACKEREL FEAST', 'Flaked Tuna Feast', 'Flaked Tuna Feast')).toBeNull();
    // Review of 7accb55: one reading puts the brand in front, and both leave out a line printed between the brand and the
    // rest (a life stage, a range): the name as that reading gave it is not printed, so neither is kept.
    expect(name('FANCY FEAST\nKITTEN\nCLASSIC PÂTÉ\nCHICKEN FEAST', 'Fancy Feast Classic Pâté Chicken Feast', 'Classic Pâté Chicken Feast', 'Fancy Feast')).toBeNull();
    expect(name('FANCY FEAST\nGRAVY LOVERS\nCHICKEN FEAST\nIN ROASTED CHICKEN FLAVOR GRAVY\nGOURMET CAT FOOD IN GRAVY', 'Fancy Feast Chicken Feast', 'Chicken Feast', 'Fancy Feast')).toBeNull();
    // A cross-sell line is not the product's name: its other words are not the brand or the size.
    expect(name('TEMPTATIONS\nTASTY CHICKEN FLAVOR\nTRY NEW TEMPTATIONS MIXUPS!', 'Temptations Mixups', 'Mixups', 'Temptations')).toBeNull();
    // Neither reading adds the brand, and both leave out a printed life stage next to the name: the kitten food is not
    // named as the adult one; an adult line next to it is the default and may be left out.
    expect(name('FANCY FEAST\nKITTEN\nCLASSIC PÂTÉ\nCHICKEN FEAST', 'Classic Pâté Chicken Feast', 'Classic Pâté Chicken Feast')).toBeNull();
    expect(name('SCIENCE DIET\nCHICKEN RECIPE\nSENIOR\nCAT FOOD', 'Chicken Recipe', 'Chicken Recipe')).toBeNull();
    expect(name('WHISKAS\n7+\nTUNA IN JELLY', 'Tuna in Jelly', 'Tuna in Jelly')).toBeNull();
    expect(name('FANCY FEAST\nADULT\nCLASSIC PÂTÉ\nCHICKEN FEAST', 'Classic Pâté Chicken Feast', 'Classic Pâté Chicken Feast')).toBe('Classic Pâté Chicken Feast');
    // Life stages printed with an age or a qualifier, or on the brand's line (review of 3bd9ca0); "1+" is the adult one.
    for (const stage of ['SENIOR 7+', 'ADULT 7+', 'MATURE ADULT', 'HEALTHY KITTEN', 'KITTEN 2-12 MONTHS', '2-12 MONTHS', '(11+)', 'LARGE BREED PUPPY'])
      expect(name(`SCIENCE DIET\nCHICKEN RECIPE\n${stage}\nCAT FOOD`, 'Chicken Recipe', 'SCIENCE DIET Chicken Recipe', 'SCIENCE DIET'), stage).toBeNull();
    expect(name('ROYAL CANIN KITTEN\nPERSIAN\nDRY CAT FOOD', 'Persian', 'Persian', 'Royal Canin')).toBeNull();
    expect(name('WHISKAS\n1+\nTUNA IN JELLY', 'Tuna in Jelly', 'Whiskas Tuna in Jelly', 'Whiskas')).toBe('Tuna in Jelly'); // the adult line may be left out
    expect(name('WHISKAS\nADULT 1-6\nTUNA IN JELLY', 'Tuna in Jelly', 'Whiskas Tuna in Jelly', 'Whiskas')).toBe('Tuna in Jelly');
    expect(name('WHISKAS\nADULT 7+\nTUNA IN JELLY', 'Tuna in Jelly', 'Whiskas Tuna in Jelly', 'Whiskas')).toBeNull(); // a senior stage may not
    expect(name('WHISKAS\n1+\nTUNA IN JELLY', 'Tuna in Jelly', 'Tuna in Jelly')).toBe('Tuna in Jelly');
    expect(name('WHISKAS\n1+\nTUNA IN JELLY', '1+', '1+')).toBeNull(); // an age band is not a name
    // A texture or flavour line beside the name that both readings leave out (review of 3bd9ca0).
    expect(name('WHISKAS\n1+\nTUNA\nIN JELLY', 'Tuna', 'Whiskas Tuna', 'Whiskas')).toBeNull();
    expect(name('FANCY FEAST\nGRAVY LOVERS\nCHICKEN FEAST\nGOURMET CAT FOOD', 'Chicken Feast', 'Chicken Feast 3 oz', 'Fancy Feast')).toBeNull();
    expect(name('PURINA ONE\nINDOOR\nADULT\nTURKEY RECIPE\nDRY CAT FOOD', 'Indoor Adult', 'Indoor Adult', 'Purina ONE')).toBeNull();
    expect(name('FANCY FEAST\nCLASSIC PÂTÉ COLLECTION\nCHICKEN FEAST\nSALMON FEAST\nTUNA FEAST', 'Chicken Feast', 'Chicken Feast', 'Fancy Feast')).toBeNull(); // one flavour of a variety pack
    // A line printed between two of the name's lines, not beside them: still never left out.
    expect(name('FANCY FEAST\nCLASSIC PÂTÉ\nKITTEN\nCHICKEN FEAST', 'Classic Pâté Chicken Feast', 'Classic Pâté Chicken Feast')).toBeNull();
    // A range line between the brand and the name, unknown as a texture or flavour, that the reading adding the brand leaves out.
    expect(name('FANCY FEAST\nMEDLEYS\nCLASSIC PÂTÉ\nCHICKEN FEAST', 'Fancy Feast Classic Pâté Chicken Feast', 'Classic Pâté Chicken Feast', 'Fancy Feast')).toBeNull();
    // An age band alone is not a name, whatever stands beside it.
    expect(name('WHISKAS\n1+\nCAT FOOD', '1+', '1+')).toBeNull();
    // The name's own flavour on a line beside it does not stop it.
    expect(name('FANCY FEAST\nSALMON\nCLASSIC PÂTÉ\nSAVORY SALMON FEAST', 'Classic Pâté Savory Salmon Feast', 'Classic Pâté Savory Salmon Feast', 'Fancy Feast')).toBe('Classic Pâté Savory Salmon Feast');
    // A claim about what is in it is not a flavour of its own.
    expect(name('PURINA ONE\n+PLUS\nINDOOR ADVANTAGE\nWITH REAL TURKEY\nDRY CAT FOOD', '+Plus Indoor Advantage', '+Plus Indoor Advantage', 'Purina ONE')).toBe('+Plus Indoor Advantage');
    expect(name('PURINA ONE\n+PLUS\nWITH REAL TURKEY\nINDOOR ADVANTAGE\nDRY CAT FOOD', '+Plus Indoor Advantage', '+Plus Indoor Advantage', 'Purina ONE')).toBe('+Plus Indoor Advantage');
    // A callout naming the flavour the name already has does not stop it.
    expect(name('WHOLE PAWS\nSALMON PÂTÉ\nLOAF RECIPE\nREAL SALMON', 'Salmon Pâté Loaf Recipe', 'Salmon Pâté Loaf Recipe', 'Whole Paws')).toBe('Salmon Pâté Loaf Recipe');
    // Only the rest of the brand's printed line is the brand's line ("PURINA ONE" with the brand "Purina"), not a name.
    expect(name('PURINA ONE\nINDOOR ADVANTAGE\nDRY CAT FOOD', 'Purina ONE', 'Purina ONE', 'Purina')).toBeNull();
    // A word the readings could not read inside the printed name: the name they give without it is not read.
    expect(name('FANCY FEAST\nCLASSIC PÂTÉ\nTENDER [?] & CHICKEN FEAST\nGOURMET CAT FOOD', 'Classic Pâté Tender Chicken Feast', 'Classic Pâté Tender Chicken Feast')).toBeNull();
    // Generic words in the label languages are not a name.
    expect(name('COMPANINO\nCROQUETTES POUR CHAT ADULTE', 'Croquettes pour chat adulte', 'Croquettes pour chat adulte')).toBeNull();
    expect(name('GREAT VALUE\nALIMENTO PARA GATO ADULTO', 'Alimento para Gato Adulto', 'Alimento para Gato Adulto')).toBeNull();
    expect(name('KATTOVIT\nNASSFUTTER FÜR KATZEN', 'Nassfutter für Katzen', 'Nassfutter für Katzen')).toBeNull();
    // A type a model gives that is a life stage or a texture stays in the name: "Persian" is another product than "Persian Kitten".
    const kept = (text: string, n: string, type: string) => pair([front(text)], n, n, { brand: null, species_claim: 'cat', product_type_claim: type }).productName;
    expect(kept('ROYAL CANIN\nPERSIAN\nKITTEN\nDRY CAT FOOD', 'Persian Kitten', 'Kitten')).toBe('Persian Kitten');
    expect(kept('PURINA\nPRO PLAN\nSTERILISED\nADULT\nRICH IN SALMON\nCAT FOOD', 'Pro Plan Sterilised Adult Rich in Salmon', 'Adult')).toBe('Pro Plan Sterilised Adult Rich in Salmon');
    // The flavour line printed right after it, left out: another flavour's name, or not all of it.
    expect(kept('PURINA\nPRO PLAN\nSTERILISED\nADULT\nRICH IN SALMON\nCAT FOOD', 'Pro Plan Sterilised Adult', 'Adult')).toBeNull();
    expect(kept('PERFECT PORTIONS\nCHICKEN PÂTÉ\nCAT FOOD', 'Perfect Portions Chicken Pâté', 'Pâté')).toBe('Perfect Portions Chicken Pâté');
    // Chicken against salmon, with or without the brand in one reading, and brands that are not the same brand.
    const flavours = front('WHOLE PAWS\nGRAIN FREE\nCHICKEN PÂTÉ LOAF RECIPE\nGRAIN FREE SALMON PÂTÉ LOAF RECIPE');
    expect(pair([flavours], 'WHOLE PAWS GRAIN FREE CHICKEN PÂTÉ LOAF RECIPE', 'GRAIN FREE SALMON PÂTÉ LOAF RECIPE').productName).toBeNull();
    expect(pair([flavours], 'Grain Free Chicken Pâté Loaf Recipe', 'Grain Free Salmon Pâté Loaf Recipe').productName).toBeNull();
    expect(pair([flavours], 'Whole Paws Grain Free Salmon Pâté Loaf Recipe', 'Grain Free Salmon Pâté Loaf Recipe', { ...WP, brand: 'Whole Paws' }, { ...WP, brand: 'Whole Foods Market' })).toMatchObject({ brand: null, productName: null });
    // An unreadable mark in either name, also where both readings marked the same word.
    expect(pair([WP_FRONT], 'Grain Free [?] Pâté Loaf Recipe', 'Whole Paws Grain Free Salmon Pâté Loaf Recipe Premium Cat Food').productName).toBeNull();
    const marked: RawPanel = { ...WP_FRONT, text: WP_FRONT.text!.replace('SALMON PÂTÉ', '[?] PÂTÉ') };
    expect(pair([marked], 'GRAIN FREE [?] PÂTÉ LOAF RECIPE', 'GRAIN FREE [?] PÂTÉ LOAF RECIPE')).toMatchObject({ productName: null, brand: 'WHOLE PAWS' });
  });
  it('never keeps a range name, a type line or generic words as the name', () => {
    const front = (text: string): RawPanel => ({ kind: 'front', legibility: 'clear', heading: null, text });
    const name = (text: string, na: string, nb: string, brand: string | null = null, type: string | null = null) => pair([front(text)], na, nb, { brand, species_claim: 'cat', product_type_claim: type }).productName;
    expect(name('PURINA PRO PLAN\nCOMPLETE ESSENTIALS\nADULT CHICKEN & RICE FORMULA', 'Purina Pro Plan Complete Essentials Adult Chicken & Rice Formula', 'Pro Plan Complete Essentials', 'Purina')).toBeNull();
    expect(name('SALMON PÂTÉ\nPREMIUM CAT FOOD', 'Salmon Pâté Premium Cat Food', 'Premium Cat Food', null, 'Premium Cat Food')).toBeNull();
    expect(name('PREMIUM CAT FOOD', 'Premium Cat Food', 'Premium Cat Food')).toBeNull();
    expect(name('ADULT COMPLETE CAT FOOD\nwith Chicken', 'Adult Complete Cat Food with Chicken', 'Adult Complete Cat Food')).toBeNull();
    expect(name('GRAIN FREE\nSALMON PÂTÉ RECIPE', 'Grain Free Salmon Pâté Recipe', 'Grain Free Recipe')).toBeNull();
    expect(name('WHISKAS\nCAT FOOD', 'Whiskas Cat Food', 'Cat Food', 'Whiskas')).toBeNull();
  });
  const front2 = (text: string): RawPanel => ({ kind: 'front', legibility: 'clear', heading: null, text });
  it('a species, brand or name not printed in the transcription is not read: a blank front is not a read front', () => {
    // Nothing legible on the front; the models' species is a guess from the picture.
    const blank: RawPanel = { kind: 'front', legibility: 'illegible', heading: null, text: null };
    const guessed = combineReadings(read([blank], { product_name: null, brand: null, species_claim: 'cat', product_type_claim: null }), read([blank], { legible: false, product_name: null, brand: null, species_claim: 'cat', product_type_claim: null }, 'model-b'), GTIN);
    expect(guessed).toMatchObject({ status: 'unreadable', species: 'unknown' });
    const marks: RawPanel = { kind: 'front', legibility: 'partial', heading: '[?]', text: '[?] [?]\n[?]' };
    expect(combineReadings(read([marks], { product_name: null, brand: 'Rex', species_claim: 'dog', product_type_claim: null }), read([marks], { product_name: null, brand: 'Rex', species_claim: 'dog', product_type_claim: null }, 'model-b'), GTIN)).toMatchObject({ status: 'unreadable', species: 'unknown', brand: null });
    // A product type both readings give but neither transcribed is not read; the brand they transcribed is.
    const plain: RawPanel = { kind: 'front', legibility: 'clear', heading: 'WHOLE PAWS', text: 'GRAIN FREE\nSALMON PÂTÉ\nLOAF RECIPE' };
    expect(pair([plain], null, null, { brand: 'WHOLE PAWS', species_claim: 'not_visible', product_type_claim: 'Premium Cat Food' })).toMatchObject({ status: 'processed', productTypeClaim: null, brand: 'WHOLE PAWS', species: 'unknown' });
    // The species the panel prints, and only that one: "for cats and dogs" is not "for cats".
    const both: RawPanel = { kind: 'front', legibility: 'clear', heading: 'RANCH TREATS', text: 'FOR CATS AND DOGS' };
    expect(pair([both], null, null, { brand: null, species_claim: 'cat', product_type_claim: null }).species).toBe('unknown');
    expect(pair([both], null, null, { brand: null, species_claim: 'cat_and_dog', product_type_claim: null })).toMatchObject({ status: 'processed', species: 'cat_and_dog' });
    // Compound species words and other languages, which both readings transcribe (review of 7accb55); not "hundert".
    const sp = (text: string, claim: 'cat' | 'dog') => pair([front2(text)], null, null, { brand: null, species_claim: claim, product_type_claim: null }).species;
    expect(sp('FELIX\nSo gut wie es aussieht\nKatzenfutter nass', 'cat')).toBe('cat');
    expect(sp('PEDIGREE\nAdult\nmit Rind & Kartoffeln\nHundefutter trocken', 'dog')).toBe('dog');
    expect(sp('WHISKAS\n1+\nmet zalm\nKATTENVOER', 'cat')).toBe('cat');
    expect(sp('WHISKAS\nKATTMAT\nMED LAX', 'cat')).toBe('cat');
    expect(sp('FELIX\nSENSATIONS\nKARMA DLA KOTÓW', 'cat')).toBe('cat');
    expect(sp('Premium Hondenvoer', 'dog')).toBe('dog');
    expect(sp('HUNDERT PROZENT HUHN', 'dog')).toBe('unknown');
    for (const [text, claim] of [['KISSANRUOKA', 'cat'], ['KOIRANRUOKA', 'dog'], ['KRMIVO PRO KOČKY', 'cat'], ['KRMIVO PRO PSY', 'dog'], ['MACSKAELEDEL', 'cat'], ['KUTYAELEDEL', 'dog'], ['HRANĂ PENTRU PISICI', 'cat'], ['HRANĂ PENTRU CÂINI', 'dog'], ['KEDİ MAMASI', 'cat'], ['KÖPEK MAMASI', 'dog'], ['FODER TIL KATTE', 'cat']] as const)
      expect(sp(text, claim), text).toBe(claim);
    // Not from a species named only to rule it out, nor from a line where the other species may be the word not read.
    expect(sp('BULLY STICKS\n100% NATURAL\nNOT FOR CATS\n6 INCH', 'cat')).toBe('unknown');
    expect(sp('PUREBITES\nFREEZE DRIED\nCHICKEN BREAST\nTREATS FOR CATS & [?]', 'cat')).toBe('unknown');
    expect(sp('FRISKIES\nPARTY MIX\nCAT TREATS\nNot suitable for dogs', 'cat')).toBe('cat');
    // Both claim cats, but one reading's transcription also names dogs ("& DOGS" the other did not transcribe): not read.
    const catsOnly: RawPanel = { kind: 'front', legibility: 'clear', heading: null, text: 'RANCH TREATS\nFOR CATS' };
    const catsDogs: RawPanel = { kind: 'front', legibility: 'clear', heading: null, text: 'RANCH TREATS\nFOR CATS & DOGS' };
    const cat = { product_name: null, brand: null, species_claim: 'cat' as const, product_type_claim: null };
    expect(combineReadings(read([catsOnly], cat), read([catsDogs], cat, 'model-b'), GTIN).species).toBe('unknown');
    // A retailer's "BY …" line is not the brand.
    const byLine: RawPanel = { kind: 'front', legibility: 'clear', heading: 'WHOLE PAWS', text: 'BY WHOLE FOODS MARKET\nPREMIUM CAT FOOD\nGRAIN FREE\nSALMON PÂTÉ\nLOAF RECIPE' };
    expect(pair([byLine], null, null, { brand: 'Whole Foods Market', species_claim: 'cat', product_type_claim: null }).brand).toBeNull();
    expect(pair([byLine], null, null, { brand: 'Whole Paws', species_claim: 'cat', product_type_claim: null }).brand).toBe('Whole Paws');
    // One reading leaves the species line out of its transcription: the other's transcription names it.
    const typeLess: RawPanel = { kind: 'front', legibility: 'clear', heading: 'WHOLE PAWS', text: 'GRAIN FREE\nSALMON PÂTÉ\nLOAF RECIPE' };
    expect(combineReadings(read([WP_FRONT], { ...WP, product_name: 'GRAIN FREE SALMON PÂTÉ LOAF RECIPE' }), read([typeLess], { ...WP, product_name: 'GRAIN FREE SALMON PÂTÉ LOAF RECIPE' }, 'model-b'), GTIN)).toMatchObject({ species: 'cat', productTypeClaim: 'PREMIUM CAT FOOD', brand: 'WHOLE PAWS' });
    // A front one reading calls illegible as a whole is not read for its brand and species alone.
    const half = combineReadings(read([WP_FRONT], { ...WP, product_name: null }), read([WP_FRONT], { ...WP, legible: false, product_name: null }, 'model-b'), GTIN);
    expect(half.status).toBe('unreadable');
  });
  it('a back-panel photo is not read for its brand or a logo band: it says which panel to retake', () => {
    const band: RawPanel = { kind: 'front', legibility: 'clear', heading: null, text: 'WHOLE PAWS' };
    const cutList: RawPanel = { kind: 'ingredients', legibility: 'partial', heading: null, text: '[?] Guar Gum, Salt, [?] Amino Acid Chelate, [?]' };
    const brandOnly = { product_name: null, brand: 'WHOLE PAWS', species_claim: 'not_visible' as const, product_type_claim: null };
    const back = (pa: RawPanel[], pb: RawPanel[], purpose?: string) => combineReadings(read(pa, brandOnly), read(pb, brandOnly, 'model-b'), GTIN, purpose);
    const RETAKE_LIST = 'Couldn’t read all of the ingredient list. Retake it straight on, in good light.';
    expect(back([band, cutList], [band, cutList])).toMatchObject({ status: 'unreadable', reason: RETAKE_LIST });
    // Taken for the ingredient list, with the band and a cut list one reading saw: the list, never the front (review of 7accb55).
    expect(back([band], [band, cutList], 'ingredients')).toMatchObject({ status: 'unreadable', reason: RETAKE_LIST });
    // A front taken for the ingredient list is read as a front (its note says the list was not read: corroborate.ts).
    expect(back([band], [band], 'ingredients')).toMatchObject({ status: 'processed', brand: 'WHOLE PAWS' });
    const side: RawPanel = { kind: 'other', legibility: 'clear', heading: null, text: 'DISTRIBUTED BY: WHOLE FOODS MARKET\nAUSTIN, TX 78703' };
    expect(back([side], [side], 'ingredients').reason).toBe('No ingredient list was found. Photograph that panel, straight on.');
    expect(back([side], [side], 'nutrition').reason).toBe('No nutrition panel was found. Photograph that panel, straight on.');
    // The list seen clearly by both readings but not read, its heading not in the photo: the heading is asked for.
    const unheaded: RawPanel = { kind: 'ingredients', legibility: 'clear', heading: null, text: 'Salmon, Water Sufficient For Processing, Guar Gum' };
    expect(back([unheaded], [unheaded], 'ingredients').reason).toBe('Couldn’t read the ingredient list. Include its “Ingredients” heading.');
    // A panel a reading calls clear but marks a word in is not read in full either.
    const marked: RawPanel = { kind: 'ingredients', legibility: 'clear', heading: 'INGREDIENTS:', text: 'Salmon, Water, [?], Guar Gum, Salt' };
    expect(back([marked], [marked], 'ingredients')).toMatchObject({ status: 'unreadable', reason: RETAKE_LIST, uncertainFields: ['ingredients'] });
    const ga: RawPanel = { kind: 'guaranteed_analysis', legibility: 'partial', heading: 'GUARANTEED ANALYSIS', text: 'Crude Protein (Min) [?]%\nCrude Fat (Min) [?]%' };
    expect(back([band, ga], [band, { ...ga, kind: 'other', heading: '[?] ANALYSIS' }], 'nutrition').reason).toBe('Couldn’t read all of the nutrition panel. Retake it straight on, in good light.');
    // The same photo taken for the front: the front.
    expect(back([band, cutList], [band, cutList], 'front')).toMatchObject({ status: 'processed', brand: 'WHOLE PAWS' }); // the owner's front: its brand is read
    // A front both read clearly, with a printed species, and a back-panel sliver neither could read: read as a front.
    const sliver: RawPanel = { kind: 'ingredients', legibility: 'illegible', heading: null, text: null };
    const names = (na: string, nb: string) => combineReadings(read([WP_FRONT, sliver], { ...WP, product_name: na }), read([WP_FRONT], { ...WP, product_name: nb }, 'model-b'), GTIN);
    expect(names('SALMON', 'GRAIN FREE SALMON PÂTÉ LOAF RECIPE')).toMatchObject({ status: 'processed', species: 'cat', productTypeClaim: 'PREMIUM CAT FOOD' });
    // A photo taken of the nutrition panel, glare on it, a feeding-guide header both call the front: the panel is asked for again.
    const header: RawPanel = { kind: 'front', legibility: 'clear', heading: 'FEEDING GUIDELINES', text: 'For adult cats' };
    const glare: RawPanel = { kind: 'guaranteed_analysis', legibility: 'partial', heading: 'GUARANTEED ANALYSIS', text: 'Crude Protein [?]' };
    const cat = { product_name: null, brand: null, species_claim: 'cat' as const, product_type_claim: null };
    expect(combineReadings(read([header, glare], cat), read([header, glare], cat, 'model-b'), GTIN, 'nutrition')).toMatchObject({ status: 'unreadable', reason: 'Couldn’t read all of the nutrition panel. Retake it straight on, in good light.' });
  });
  it('a photo whose needed panel is cut off says which panel to retake, and only a panel Purrbi asks for', () => {
    const barcode: RawPanel = { kind: 'barcode', legibility: 'clear', heading: null, text: '0 99482 48108 7' };
    const side: RawPanel = { kind: 'other', legibility: 'clear', heading: null, text: 'DISTRIBUTED BY: WHOLE FOODS MARKET\nAUSTIN, TX 78703' };
    const cutList: RawPanel = { kind: 'ingredients', legibility: 'partial', heading: null, text: '[?] Guar Gum, Salt, [?] Amino Acid Chelate, [?]' };
    const cutGuide: RawPanel = { kind: 'feeding_directions', legibility: 'partial', heading: 'Feeding Guidelines', text: 'For adult cats, [?]' };
    const none = { product_name: null, brand: null, species_claim: 'not_visible' as const, product_type_claim: null, barcode_digits: '099482481087' };
    const label = combineReadings(read([barcode, side], none), read([barcode, side, cutGuide, cutList], none, 'model-b'), '00099482481087', 'ingredients');
    expect(label).toMatchObject({ status: 'unreadable', reason: 'Couldn’t read all of the ingredient list. Retake it straight on, in good light.' });
    // A feeding guide is not asked for.
    expect(combineReadings(read([cutGuide], none), read([cutGuide], none, 'model-b'), '00099482481087').reason).toBe('No label details could be read. Retake it closer to the panel you need.');
    // A blurry front where one reading filed callouts as an ingredient panel: taken for the front, the front is asked for.
    const blurryFront: RawPanel = { kind: 'front', legibility: 'partial', heading: null, text: '[?] [?]' };
    const callouts: RawPanel = { kind: 'ingredients', legibility: 'partial', heading: null, text: 'Real salmon [?]' };
    expect(combineReadings(read([blurryFront], { ...none, barcode_digits: null }), read([blurryFront, callouts], { ...none, barcode_digits: null }, 'model-b'), GTIN, 'front').reason).toBe('Couldn’t read the name or who it is for. Retake the front in good light.');
  });
  it('every reason fits the app’s two lines of a photo’s message', () => {
    // About 43 characters a line in the app's font at a phone's width (reviews of 7accb55 and 3bd9ca0), words wrapped.
    const P = (kind: RawPanel['kind'], legibility: RawPanel['legibility'] = 'partial'): RawPanel => ({ kind, legibility, heading: null, text: '[?] [?]' });
    const none = { product_name: null, brand: null, species_claim: 'not_visible' as const, product_type_claim: null };
    const reasons = new Set<string>();
    const kinds: RawPanel['kind'][] = ['front', 'ingredients', 'active_ingredients', 'guaranteed_analysis', 'adequacy_statement', 'calorie_statement', 'feeding_directions', 'other'];
    for (const purpose of [undefined, 'front', 'ingredients', 'nutrition', 'label'])
      for (const x of kinds) for (const y of kinds) reasons.add(combineReadings(read([P(x), P(y)], none), read([P(y)], none, 'model-b'), GTIN, purpose).reason);
    reasons.add(combineReadings(read([P('front')], { ...none, legible: false }), read([P('front')], { ...none, legible: false }, 'model-b'), GTIN).reason);
    const otherCode = `400604022103${gs1CheckDigit('400604022103')}`;
    reasons.add(combineReadings(read([FRONT], { barcode_digits: otherCode }), read([FRONT], { barcode_digits: otherCode }, 'model-b'), GTIN).reason);
    reasons.add(combineReadings(read([FRONT, { ...BACK[0], text: 'COMPOSITION: Dinde, pois' }]), read([FRONT], {}, 'model-b'), GTIN).reason);
    const unheaded: RawPanel = { kind: 'ingredients', legibility: 'clear', heading: null, text: 'Salmon, Water, Guar Gum' };
    for (const purpose of ['ingredients', 'nutrition']) reasons.add(combineReadings(read([unheaded], none), read([unheaded], none, 'model-b'), GTIN, purpose).reason);
    for (const purpose of ['ingredients', 'nutrition']) reasons.add(combineReadings(read([P('guaranteed_analysis', 'clear'), P('ingredients')], none), read([P('ingredients'), P('guaranteed_analysis')], none, 'model-b'), GTIN, purpose).reason);
    reasons.delete('');
    expect(reasons.size).toBeGreaterThan(6);
    for (const r of reasons) expect(wrapped(r, 43), r).toBeLessThanOrEqual(2);
  });
  it('an earlier reader’s name, brand or type with an unreadable mark is not used', () => {
    const saved = (over: Partial<ValidatedLabel>): ValidatedLabel => ({ ...combineReadings(read([WP_FRONT], { ...WP, product_name: 'GRAIN FREE SALMON PÂTÉ LOAF RECIPE' }), read([WP_FRONT], { ...WP, product_name: 'GRAIN FREE SALMON PÂTÉ LOAF RECIPE' }, 'model-b'), GTIN), ...over });
    expect(readingInUse(saved({ version: 'label-extract-2.3.0', productName: 'Grain Free [?] Pâté Loaf Recipe' }))).toMatchObject({ productName: null, brand: 'WHOLE PAWS', species: 'cat' });
    expect(readingInUse(saved({ version: 'label-extract-2.3.0', brand: 'WHOLE [?]' }))).toMatchObject({ productName: 'GRAIN FREE SALMON PÂTÉ LOAF RECIPE', brand: null });
    const clean = saved({ version: 'label-extract-2.3.0' });
    expect(readingInUse(clean)).toBe(clean); // unchanged, so it is not compared with the record again
  });
  it('after a new reader, the database label images it reads differently are read once more', () => {
    expect([...panelsReadDifferentlySince('label-extract-2.3.0')]).toEqual(['front']);
    expect([...panelsReadDifferentlySince('label-extract-2.2.0')].sort()).toEqual(['front', 'nutrition']);
    expect([...panelsReadDifferentlySince('label-extract-2.1.0')].sort()).toEqual(['front', 'nutrition']);
    expect([...panelsReadDifferentlySince(LABEL_EXTRACTION_VERSION)]).toEqual([]);
    expect([...panelsReadDifferentlySince(undefined)]).toEqual([]);
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
