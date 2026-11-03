// No dead ends (label reader 2.5.1, 2026-11-02): test A's can prints "…, Moisture (Max.)" at the end of one line and
// "78%, Taurine (Min.) 0.05%" at the start of the next. A faithful transcription lost the moisture guarantee, the newer
// reading's thinner analysis blocked the fuller one, and the scorer withheld the score for moisture while nothing was
// asked for: "complete" and "unscored" with no way forward (account accept, trace 36da991d-34a).
import { describe, expect, it } from 'vitest';
import { analysisRows } from '../../src/domain/analysisText';
import { classifyScope } from '../../src/domain/scope';
import { assessGeneral } from '../../src/domain/score';
import type { GuaranteedAnalysisEntry, ProductFacts } from '../../src/domain/types';
import { coreDifferences, fillMissing, missingInfo, MOISTURE_REQUEST, moistureStatus, rowsFromOwnReading, withScoreNeeds } from '../../src/pipeline/facts';
import { facts, SRC } from '../helpers/fixtures';

const rows = (text: string) => analysisRows(text, false).map((r) => `${r.nutrient}:${r.value}${r.unit}:${r.qualifier}`);
const ga = (pairs: [string, number][]): GuaranteedAnalysisEntry[] =>
  pairs.map(([nutrient, value]) => ({ nutrient: nutrient as GuaranteedAnalysisEntry['nutrient'], label: nutrient, qualifier: nutrient === 'crude_fiber' || nutrient === 'moisture' ? 'max' : 'min', value, unit: '%' }));
const scopeOf = (f: ProductFacts) => classifyScope({ origin: 'opff', categoriesTags: f.classificationSignals.map((s) => s.text), texts: [f.productName?.value ?? ''], adequacy: f.adequacy?.value });
/** What the guard adds to, or rewords in, the photo requests. */
const byGuard = (a: Parameters<typeof withScoreNeeds>[0], scope: Parameters<typeof withScoreNeeds>[1], req: ReturnType<typeof missingInfo>) =>
  withScoreNeeds(a, scope, req).filter((r) => !req.some((x) => x.purpose === r.purpose && x.title === r.title && x.reason === r.reason));

describe('an analysis value wrapped onto the next printed line', () => {
  it('is read with its row (test A’s can)', () => {
    const can = 'Crude Protein (Min.) 10%, Crude Fat (Min.) 6%, Crude Fiber (Max.) 1%, Moisture (Max.)\n78%, Taurine (Min.) 0.05%';
    expect(rows(can)).toEqual(['crude_protein:10%:min', 'crude_fat:6%:min', 'crude_fiber:1%:max', 'moisture:78%:max', 'taurine:0.05%:min']);
    expect(rows('Crude Protein (Min.) 10%\nCrude Fat (Min.) 6%\nCrude Fiber (Max.) 1%\nMoisture (Max.)\n78%')).toEqual(['crude_protein:10%:min', 'crude_fat:6%:min', 'crude_fiber:1%:max', 'moisture:78%:max']);
  });
  it('joins nothing else: a line that already ends with a value, a heading, or a value that is not a guarantee', () => {
    expect(rows('Crude Protein (min) 30%\n28% of the recipe is chicken')).toEqual([]); // a value before its words: the section is ambiguous, as before 2.5.1
    expect(rows('Made with chicken\n100% natural')).toEqual([]);
    expect(rows('Crude Protein (Min.) 30%, Moisture (Max.)\n3,500 kcal/kg')).toEqual(['crude_protein:30%:min']); // an energy statement
  });
  // Review of 2.5.1: each layout below gave one row's value to another nutrient, or lost rows already read, on the first
  // 2.5.1 draft. Each now reads what the reader read before 2.5.1.
  it('joins nothing where names and values are printed apart, which value is whose being unclear', () => {
    const CORE = ['crude_protein:10%:min', 'crude_fat:6%:min', 'crude_fiber:1%:max'];
    // Names stacked above values: the first value would go to the last name (taurine's 0.05% as moisture).
    expect(rows('Crude Protein (min) 10%\nCrude Fat (min) 6%\nCrude Fiber (max) 1%\nTaurine (min)\nMoisture (max)\n0.05%\n78%')).toEqual(CORE);
    expect(rows('Crude Protein (min)\nCrude Fat (min)\nCrude Fiber (max)\nMoisture (max)\n10%\n6%\n1%\n78%')).toEqual([]);
    expect(rows('Crude Protein\nCrude Fat\nCrude Fiber\nMoisture\n10%\n6%\n1%\n78%')).toEqual([]);
    expect(rows('Analytical constituents:\nProtein\nFat content\nMoisture\n10%\n5%\n80%')).toEqual([]);
    expect(rows('Moisture / Humidité\nProtein / Protéine\n80%\n10%')).toEqual([]);
    // A stacked French block after the English rows adds no second moisture value, so the English one is kept.
    const twoLanguages = 'Crude Protein (min) 10%\nCrude Fat (min) 6%\nCrude Fiber (max) 1%\nMoisture (max) 78%\nProtéines brutes (min.)\nMatières grasses brutes (min.)\nFibres brutes (max.)\nHumidité (max.)\n10 %\n6 %\n1 %\n78 %';
    expect(rows(twoLanguages)).toEqual([...CORE, 'moisture:78%:max']);
    // Values printed above their names: each value would go to the name above it, one row off.
    expect(rows('36%\nCrude Protein (min)\n16%\nCrude Fat (min)\n3%\nCrude Fiber (max)\n10%\nMoisture (max)')).toEqual([]);
    expect(rows('Guaranteed Analysis\n32%\nCrude Protein (min)\n18%\nCrude Fat (min)')).toEqual([]);
    // A value line that is ambiguous on its own leaves the line above as it was read.
    const LINE = 'Crude Protein (min) 26%, Crude Fat (min) 15%, Crude Fiber (max) 4%, Moisture (max) 10%, Calcium';
    const READ = ['crude_protein:26%:min', 'crude_fat:15%:min', 'crude_fiber:4%:max', 'moisture:10%:max'];
    expect(rows(`${LINE} (min)\n1.2%, (max) 1.7%, Phosphorus (min) 1.0%`)).toEqual(READ);
    expect(rows(`${LINE}\n1.2% min, 1.7% max`)).toEqual(READ);
    expect(rows(`${LINE}\n1.0% - 1.5%`)).toEqual(READ);
  });
  // Second review of 2.5.1: a row list that wraps more than once, other separators, names that are no nutrient of
  // Purrbi's stacked above values, and a line above that is ambiguous on its own.
  it('reads a row list wrapped twice or after a line of its own, in any separator, and in French', () => {
    const FOUR = ['crude_protein:10%:min', 'crude_fat:6%:min', 'crude_fiber:1%:max', 'moisture:78%:max'];
    expect(rows('Crude Protein (Min.) 10%, Crude Fat (Min.)\n6%, Crude Fiber (Max.) 1%, Moisture (Max.)\n78%')).toEqual(FOUR);
    expect(rows('Crude Protein (Min.) 10%, Crude Fat (Min.)\n6%, Crude Fiber (Max.) 1%, Moisture (Max.) 78%, Taurine (Min.)\n0.05%')).toEqual([...FOUR, 'taurine:0.05%:min']);
    expect(rows('GUARANTEED ANALYSIS: Crude Protein (Min.)\n10%, Crude Fat (Min.) 6%, Crude Fiber (Max.) 1%, Moisture (Max.)\n78%')).toEqual(FOUR);
    expect(rows('Crude Protein (Min.) 10% • Crude Fat (Min.) 6% • Crude Fiber (Max.) 1% • Moisture (Max.)\n78% • Taurine (Min.) 0.05%')).toEqual([...FOUR, 'taurine:0.05%:min']);
    expect(rows('Protéines brutes (min.) 10 %, Matières grasses brutes (min.)\n6 %, Cellulose brute (max.) 1 %, Humidité (max.)\n78 %')).toEqual(FOUR);
    // An ingredient list above lists several things: not a name stacked over a value.
    const can = 'Ingredients: Chicken, Water, Liver, Natural Flavor, Guar Gum, Taurine, d-Calcium Pantothenate.\nGuaranteed Analysis: Crude Protein (Min.) 10%, Crude Fat (Min.) 6%, Crude Fiber (Max.) 1%, Moisture (Max.)\n78%, Taurine (Min.) 0.05%';
    expect(rows(can)).toEqual([...FOUR, 'taurine:0.05%:min']);
    expect(rows('Ingredients: Salmon, Chicken, Peas, Taurine\nGUARANTEED ANALYSIS: Crude Protein (Min.) 10%, Crude Fat (Min.) 6%, Crude Fiber (Max.) 1%, Moisture (Max.)\n78%, Taurine (Min.) 0.05%')).toEqual([...FOUR, 'taurine:0.05%:min']);
  });
  it('never gives a value to the wrong row when the stacked names are not Purrbi’s nutrients, or a line above is ambiguous', () => {
    expect(rows('Guaranteed Analysis\nCrude Fat (min)\nVitamin E (min)\nMoisture (max)\n6%\n200 IU/lb\n78%')).toEqual([]);
    expect(rows('Guaranteed Analysis\nOmega-3 Fatty Acids* (min)\nTotal Microorganisms* (min)\nCrude Protein (min)\n0.2%\n100,000,000 CFU/lb\n26%').filter((r) => r.startsWith('crude_protein'))).toEqual([]);
    // The rows of the value line are read as before; the ambiguous line above stays unread.
    expect(rows('Crude Protein (min) 10%, Crude Fat (min) 6%, Crude Fiber (max) 1%, Calcium (min) 0.2% (max) 0.4%, Moisture (max)\n78%, Ash (max) 3%, Taurine (min) 0.05%')).toEqual(['ash:3%:max', 'taurine:0.05%:min']);
  });
  it('generated: an analysis printed as one row list and wrapped at any width loses no row and gives none to another nutrient', () => {
    const ROWS: [string, string, number, string][] = [
      ['Crude Protein (Min.)', 'crude_protein', 10, 'min'], ['Crude Fat (Min.)', 'crude_fat', 6, 'min'], ['Crude Fiber (Max.)', 'crude_fiber', 1.5, 'max'],
      ['Moisture (Max.)', 'moisture', 78, 'max'], ['Ash (Max.)', 'ash', 2.5, 'max'], ['Taurine (Min.)', 'taurine', 0.05, 'min'], ['Calcium (Min.)', 'calcium', 0.3, 'min'],
    ];
    let seed = 7;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
    let lost = 0;
    let wrong = 0;
    for (let n = 0; n < 2000; n++) {
      const picked = ROWS.filter((_, i) => i < 4 || rnd() < 0.5);
      const sep = [', ', ', ', ' • ', '; '][Math.floor(rnd() * 4)];
      const words = `GUARANTEED ANALYSIS: ${picked.map(([name, , v]) => `${name} ${v}%`).join(sep)}`.split(' ');
      const width = 12 + Math.floor(rnd() * 56);
      const lines: string[] = [''];
      for (const w of words) lines[lines.length - 1] && lines[lines.length - 1].length + 1 + w.length > width ? lines.push(w) : (lines[lines.length - 1] = lines[lines.length - 1] ? `${lines[lines.length - 1]} ${w}` : w);
      const got = analysisRows(lines.join('\n'), false);
      for (const [, key, v, q] of picked) {
        const r = got.find((x) => x.nutrient === key);
        if (!r) lost++;
        else if (r.value !== v || r.qualifier !== q) wrong++;
      }
      wrong += got.filter((x) => !picked.some(([, key]) => key === x.nutrient)).length;
    }
    expect(wrong).toBe(0);
    expect(lost).toBe(0);
  });
  it('joins only a row list that runs on: names and values on lines of their own read as before 2.5.1', () => {
    const ALL = ['crude_protein:10%:min', 'crude_fat:6%:min', 'crude_fiber:1%:max', 'moisture:78%:max'];
    expect(rows('Crude Protein (Min.) 10%, Crude Fat (Min.)\n6%, Crude Fiber (Max.) 1%, Moisture (Max.)\n78%, Taurine (Min.) 0.05%')).toEqual([...ALL, 'taurine:0.05%:min']);
    // A name ending with its min/max on a line of its own, its value alone below: which value is whose is unclear (a
    // stack, a column, or values above names look the same line by line), so it is not read, as before 2.5.1.
    expect(rows('Crude Protein (min)\n10%\nCrude Fat (min)\n6%\nCrude Fiber (max)\n1%\nMoisture (max)\n78%')).toEqual([]);
    expect(rows('Guaranteed Analysis\nCrude Protein (min)\n10%\nCrude Fat (min)\n6%')).toEqual([]);
    // Unless the value line goes on to other rows: then it is the list's next line.
    expect(rows('Crude Protein (min)\n10%, Crude Fat (min) 6%')).toEqual(['crude_protein:10%:min', 'crude_fat:6%:min']);
  });
  // Third review of 2.5.1: a name printed over two lines, and values printed above names whose names wrap.
  it('a name over two lines is read whole or not at all, as before 2.5.1: a fibre fraction is never crude fibre', () => {
    expect(rows('Crude Protein (min) 30.0%\nCrude Fat (min) 9.0%\nCrude Fiber (max) 11.0%\nTotal Dietary\nFiber (max)\n20.0%\nMoisture (max) 10.0%')).toEqual(['crude_protein:30%:min', 'crude_fat:9%:min', 'crude_fiber:11%:max', 'moisture:10%:max']);
    expect(rows('Guaranteed Analysis\nCrude Protein\n30.0%\nCrude Fat\n9.0%\nCrude Fiber\n11.0%\nTotal Dietary\nFiber\n20.0%\nMoisture\n10.0%')).toContain('crude_fiber:11%:not_stated');
    expect(rows('Total Dietary\nFiber (max)\n20.0%')).toEqual([]);
    expect(rows('Guaranteed Analysis\nCrude Protein\n30.0%\nCrude Fat\n9.0%\nInsoluble\nFiber (max)\n8.0%\nMoisture\n10.0%').filter((r) => r.startsWith('crude_fiber'))).toEqual([]);
    // An Italian list that wraps inside "acidi grassi essenziali": the fat row stays.
    const it = rows('Componenti analitici: proteina grezza 30 %, materia grassa grezza 15 %, ceneri grezze 7 %, fibra grezza 2 %, umidità 8 %, acidi\ngrassi essenziali\n4 %.');
    expect(it).toContain('crude_fat:15%:not_stated');
    expect(it.filter((r) => r.startsWith('crude_fat'))).toHaveLength(1);
    // One value under two nutrients is not read.
    expect(rows('Acides gras oméga-3,\ndont DHA\n0,2 %').filter((r) => r.startsWith('dha'))).toEqual([]);
  });
  // Review of efb5e21: an energy item in a list, a basis heading, and a heading line that names nothing.
  it('an energy item in a list, a "per 100 g" heading or an "As fed" line never changes what is read', () => {
    expect(rows('Guaranteed Analysis: 30% Crude Protein (min), 18% Crude Fat (min), 4% Crude Fiber (max), 10% Moisture (max). Calorie content (calculated): 3,650 kcal/kg ME.')).toEqual([]);
    expect(rows('Analytical constituents: Metabolisable energy 3,900 kcal/kg, Protein 30%, Fat content\n15%, Crude ash 7%, Crude fibres 2%, Moisture 8%')).toEqual(['crude_protein:30%:not_stated', 'crude_fat:15%:not_stated', 'ash:7%:not_stated', 'crude_fiber:2%:not_stated', 'moisture:8%:not_stated']);
    expect(rows('Guaranteed Analysis: Crude Protein (min) 30%, Calories 3500 kcal/kg, Crude Fat (min)\n18%, Crude Fiber (max) 4%, Moisture (max) 10%')).toEqual(['crude_protein:30%:min', 'crude_fat:18%:min', 'crude_fiber:4%:max', 'moisture:10%:max']);
    expect(rows('Constituants analytiques : Protéines brutes 10 %, Calories 3500 kcal/kg, Cellulose\nbrute (Max.) 1,5 %')).toEqual(['crude_protein:10%:not_stated', 'crude_fiber:1.5%:max']);
    expect(rows('Analytical constituents per 100g\nProtein\n10%\nFat content\n5%\nCrude ash\n2%\nMoisture\n80%')).toEqual(['crude_protein:10%:not_stated', 'crude_fat:5%:not_stated', 'ash:2%:not_stated', 'moisture:80%:not_stated']);
    expect(rows('Analytische Bestandteile je 100 g:\nRohprotein\n10 %, Fettgehalt 5 %, Rohasche 2 %, Feuchtigkeit 80 %')).toEqual(['crude_protein:10%:not_stated', 'crude_fat:5%:not_stated', 'ash:2%:not_stated', 'moisture:80%:not_stated']);
    expect(rows('GUARANTEED ANALYSIS\nAs fed\n36%\nCrude Protein\n16%\nCrude Fat\n3%\nCrude Fiber\n10%\nMoisture')).toEqual([]);
  });
  it('values printed above names stay unread when a name wraps, or the first value shares its line', () => {
    expect(rows('Guaranteed Analysis\n36%\nCrude\nProtein (min)\n16%\nCrude Fat (min)\n3%\nCrude Fiber (max)\n10%\nMoisture (max)')).toEqual([]);
    expect(rows('Guaranteed Analysis\n36%\nCrude Protein (min)\n16%\nCrude Fat (min)\n3%\nCrude\nFiber (max)\n10%\nMoisture (max)\n0.1%\nTaurine (min)')).toEqual([]);
    expect(rows('Guaranteed Analysis: 36%\nCrude Protein (min)\n16%\nCrude Fat (min)\n3%\nCrude Fiber (max)\n10%\nMoisture (max)')).toEqual([]);
  });
});

describe('moisture from the owner’s own reading of the same label (this owner’s result only)', () => {
  const inUse = ga([['crude_protein', 10], ['crude_fat', 6], ['crude_fiber', 1]]);
  const full = ga([['crude_protein', 10], ['crude_fat', 6], ['crude_fiber', 1], ['moisture', 78], ['taurine', 0.05]]);
  const added = (inUseRows: GuaranteedAnalysisEntry[] | undefined, readings: GuaranteedAnalysisEntry[][]) => rowsFromOwnReading(inUseRows, readings)?.added.map((r) => `${r.nutrient}:${r.value}:${r.qualifier}`) ?? null;
  it('adds the moisture guarantee, and the rows the analysis in use lacks, of a reading with the same protein, fat and fiber', () => {
    expect(added(inUse, [ga([['crude_protein', 10]]), full])).toEqual(['moisture:78:max', 'taurine:0.05:min']);
    // The rows in use stay as they are: a taurine the reading gives differently is not taken (reviews of 2.5.1).
    expect(added([...inUse, ...ga([['taurine', 0.1]])], [full])).toEqual(['moisture:78:max']);
    // A row only the analysis in use has is kept: the reading adds, it never removes.
    expect(added([...inUse, ...ga([['omega_6', 2]])], [full])).toEqual(['moisture:78:max', 'taurine:0.05:min']);
    // An unusable moisture row in use gives way to the reading's.
    expect(added([...inUse, ...ga([['moisture', 99]])], [full])).toEqual(['moisture:78:max', 'taurine:0.05:min']);
  });
  it('adds nothing from a reading that differs on protein, fat or fiber or their min/max, has no usable moisture, or when moisture is there', () => {
    expect(added(inUse, [ga([['crude_protein', 12], ['crude_fat', 6], ['crude_fiber', 1], ['moisture', 78]])])).toBeNull();
    const otherFat = ga([['crude_protein', 10], ['crude_fat', 5.5], ['crude_fiber', 1], ['moisture', 78]]);
    expect(added(inUse, [otherFat])).toBeNull();
    expect(coreDifferences(inUse, otherFat)).toEqual(['crude fat 5.5% vs 6%']);
    // A reading that lost a "(Max.)" still gives the same row (the rows in use keep theirs); the other min/max does not
    // (third review of 2.5.1), and its note shows both rather than "1% vs 1%".
    const noMax = full.map((r) => (r.nutrient === 'crude_fiber' ? { ...r, qualifier: 'not_stated' as const } : r));
    expect(added(inUse, [noMax])).toEqual(['moisture:78:max', 'taurine:0.05:min']);
    const otherQualifier = full.map((r) => (r.nutrient === 'crude_fiber' ? { ...r, qualifier: 'min' as const } : r));
    expect(added(inUse, [otherQualifier])).toBeNull();
    expect(coreDifferences(inUse, otherQualifier)).toEqual(['crude fiber 1% min vs 1% max']);
    // A min/max the analysis in use does not state may be the reading's.
    expect(added(inUse.map((r) => ({ ...r, qualifier: 'not_stated' as const })), [full])).toEqual(['moisture:78:max', 'taurine:0.05:min']);
    expect(added(inUse, [ga([['crude_protein', 10], ['crude_fat', 6], ['crude_fiber', 1], ['moisture', 99]])])).toBeNull(); // implausible
    expect(added(inUse, [inUse])).toBeNull(); // no moisture to add
    expect(added(full, [full])).toBeNull(); // moisture already there
    expect(added(ga([['crude_protein', 10], ['crude_fat', 6]]), [full])).toBeNull(); // no fiber in use to compare
    expect(added(undefined, [full])).toBeNull();
  });
  it('fillMissing never replaces an analysis that has protein, fat and fiber (a photo never overwrites the shared record)', () => {
    const base = facts({ guaranteedAnalysis: { value: [...inUse, ...ga([['taurine', 0.05], ['calcium', 0.3]])], source: SRC } });
    const photo = { ...SRC, sourceId: 'photo:x', sourceType: 'verified_label' as const, sourceName: 'A label photo matched to this barcode' };
    expect(fillMissing(base, { guaranteedAnalysis: { value: full, source: photo } }).filled).toEqual([]);
  });
});

describe('a withheld score always leaves something to add', () => {
  it('asks for the nutrition panel when a wet complete food’s score waits only for the moisture guarantee', () => {
    const f = facts({ guaranteedAnalysis: { value: ga([['crude_protein', 10], ['crude_fat', 6], ['crude_fiber', 1]]), source: SRC } });
    const scope = scopeOf(f);
    const a = assessGeneral(f, scope);
    expect(a.score).toBeNull();
    expect(a.missingForScore).toEqual(['moisture guarantee (to compare protein and fat on a dry-matter basis)']);
    const req = missingInfo(f, scope, a.category, a.score !== null);
    expect(req).toEqual([]);
    expect(withScoreNeeds(a, scope, req)).toEqual([MOISTURE_REQUEST]);
    expect(MOISTURE_REQUEST).toEqual({ purpose: 'nutrition', title: 'Guaranteed analysis, with moisture', reason: 'Needed to compare protein and fat as dry matter, and to score it.' });
    // Its card says what Purrbi has, never that a search will add it (no other source's analysis replaces the one in use).
    expect(moistureStatus(f)).toEqual({ purpose: 'nutrition', status: 'not_found', detail: 'The guaranteed analysis Purrbi has (from Test fixture database) gives no moisture guarantee.' });
    const own = { ...SRC, sourceId: 'label:p1', sourceType: 'user_label' as const, sourceName: 'Your label photo' };
    expect(moistureStatus({ ...f, guaranteedAnalysis: { ...f.guaranteedAnalysis!, source: own } }).detail).toBe('The guaranteed analysis Purrbi has (from your label photo) gives no moisture guarantee.');
  });
  it('asks a treat missing its ingredient list for the nutrition panel in the same round, when the list alone would not be enough', () => {
    const treat = (over: Parameters<typeof facts>[0] = {}) =>
      facts({ classificationSignals: [{ text: 'en:cat-treats', source: 'test' }], ingredientsText: '', ingredients: undefined, adequacyText: '', guaranteedAnalysis: { value: ga([['crude_protein', 30], ['crude_fat', 12], ['crude_fiber', 3]]), source: SRC }, calories: undefined, ...over });
    const f = treat();
    const scope = scopeOf(f);
    const a = assessGeneral(f, scope);
    expect(a.missingForScore).toEqual(['ingredient list']); // the scorer names the shortfall only once nothing essential is missing
    const req = missingInfo(f, scope, a.category, a.score !== null);
    expect(req.map((r) => r.purpose)).toEqual(['ingredients']);
    expect(byGuard(a, scope, req)).toEqual([{ purpose: 'nutrition', title: 'Nutrition panel', reason: 'Needed to score this product: with the ingredient list, Purrbi still needs the calorie content statement, or the feeding statement.' }]);
    // With its calorie content, the ingredient list alone would do: nothing more is asked.
    const withKcal = treat({ calories: { value: [{ kcal: 3500, per: 'kg' }], source: SRC } });
    const b = assessGeneral(withKcal, scopeOf(withKcal));
    expect(b.missingForScore).toEqual(['ingredient list']);
    expect(byGuard(b, scopeOf(withKcal), missingInfo(withKcal, scopeOf(withKcal), b.category))).toEqual([]);
    // Both photos in: scored.
    const done = treat({ ingredientsText: 'Salmon, rice flour, sunflower oil', calories: { value: [{ kcal: 3500, per: 'kg' }], source: SRC } });
    expect(assessGeneral(done, scopeOf(done)).score).not.toBeNull();
  });
  it('asks nothing of a dry food scored without moisture (protein and fat pass as fed)', () => {
    const f = facts({ guaranteedAnalysis: { value: ga([['crude_protein', 32], ['crude_fat', 16], ['crude_fiber', 3], ['taurine', 0.1]]), source: SRC } });
    const scope = scopeOf(f);
    const a = assessGeneral(f, scope);
    expect(a.score).not.toBeNull();
    expect(withScoreNeeds(a, scope, missingInfo(f, scope, a.category, true))).toEqual([]);
  });
  it('a treat known by name only is asked in one round for everything its score needs (second review of 2.5.1)', () => {
    const bare = facts({ classificationSignals: [{ text: 'en:cat-treats', source: 'test' }], ingredientsText: '', ingredients: undefined, adequacyText: '', guaranteedAnalysis: undefined, calories: undefined });
    const scope = scopeOf(bare);
    const a = assessGeneral(bare, scope);
    const req = withScoreNeeds(a, scope, missingInfo(bare, scope, a.category, false));
    expect(req.map((r) => [r.purpose, r.title])).toEqual([['ingredients', 'Ingredient list'], ['nutrition', 'Nutrition panel']]);
    expect(req[1].reason).toBe('Needed to score this product: with the ingredient list, Purrbi still needs the calorie content statement, or both the feeding statement and the guaranteed analysis.');
    // With its ingredient list on record: the analysis request names the calorie statement too.
    const listed = facts({ classificationSignals: [{ text: 'en:cat-treats', source: 'test' }], adequacyText: '', guaranteedAnalysis: undefined, calories: undefined });
    const b = assessGeneral(listed, scopeOf(listed));
    expect(withScoreNeeds(b, scopeOf(listed), missingInfo(listed, scopeOf(listed), b.category, false))).toEqual([{ purpose: 'nutrition', title: 'Nutrition panel', reason: 'Needed to score this product: Purrbi still needs the calorie content statement, or both the feeding statement and the guaranteed analysis.' }]);
  });
  it('a scored product’s request completes the assessment and never says it is needed for the score (second review of 2.5.1)', () => {
    const treat = facts({ classificationSignals: [{ text: 'en:cat-treats', source: 'test' }], adequacyText: '', guaranteedAnalysis: undefined });
    const t = assessGeneral(treat, scopeOf(treat));
    expect(t.score).not.toBeNull();
    expect(withScoreNeeds(t, scopeOf(treat), missingInfo(treat, scopeOf(treat), t.category, true))).toEqual([{ purpose: 'nutrition', title: 'Guaranteed analysis', reason: 'The protein, fat and fiber guarantees aren’t all listed yet; they complete the assessment.' }]);
    // A complete food with its statement, scored without a fiber guarantee: asked for the analysis only.
    const noFiber = facts({ guaranteedAnalysis: { value: ga([['crude_protein', 10], ['crude_fat', 6], ['moisture', 78]]), source: SRC } });
    const c = assessGeneral(noFiber, scopeOf(noFiber));
    expect(c.score).not.toBeNull();
    expect(missingInfo(noFiber, scopeOf(noFiber), c.category, true)).toEqual([{ purpose: 'nutrition', title: 'Guaranteed analysis', reason: 'The protein, fat and fiber guarantees aren’t all listed yet; they complete the assessment.' }]);
    // A complete food without its statement: asked for the statement, for the score.
    const noStatement = facts({ adequacyText: '' });
    const d = assessGeneral(noStatement, scopeOf(noStatement));
    expect(missingInfo(noStatement, scopeOf(noStatement), d.category, d.score !== null)).toEqual([{ purpose: 'nutrition', title: '"Complete and balanced" statement', reason: 'Needed to check what the food is complete and balanced for, and to score it.' }]);
  });
  it('for every mix of evidence a complete food or a treat can have, an unscored result asks for a photo', () => {
    const analyses: (GuaranteedAnalysisEntry[] | undefined)[] = [
      undefined,
      ga([['crude_protein', 30]]),
      ga([['crude_protein', 30], ['crude_fat', 15]]),
      ga([['crude_protein', 30], ['crude_fat', 15], ['crude_fiber', 4]]),
      ga([['crude_protein', 30], ['crude_fat', 15], ['crude_fiber', 4], ['moisture', 10]]),
      ga([['crude_protein', 30], ['crude_fat', 15], ['crude_fiber', 4], ['moisture', 99]]), // implausible moisture
    ];
    let unscored = 0;
    const guarded: string[] = [];
    for (const kind of ['en:cat-food', 'en:cat-treats'])
      for (const g of analyses)
        for (const adequacyText of [undefined, '', 'Complete and balanced', 'Intended for intermittent or supplemental feeding only.'])
          for (const ingredientsText of [undefined, ''])
            for (const calories of [true, false]) {
              const f = facts({
                classificationSignals: [{ text: kind, source: 'test' }],
                ...(adequacyText === undefined ? {} : { adequacyText }),
                ...(ingredientsText === undefined ? {} : { ingredientsText, ingredients: undefined }),
                guaranteedAnalysis: g ? { value: g, source: SRC } : undefined,
                calories: calories ? { value: [{ kcal: 3800, per: 'kg' }], source: SRC } : undefined,
              });
              const scope = scopeOf(f);
              if (scope.status !== 'supported') continue;
              const a = assessGeneral(f, scope);
              if (a.score !== null) continue;
              unscored++;
              const requests = missingInfo(f, scope, a.category, false);
              const all = withScoreNeeds(a, scope, requests);
              expect(all.length, `${kind} ${JSON.stringify(g)} ${adequacyText} ${ingredientsText} ${calories}: ${a.missingForScore.join('; ')}`).toBeGreaterThan(0);
              for (const r of all) expect(r.reason.length).toBeGreaterThan(10);
              // The backstop was needed (before 2.5.1 these were dead ends): a treat with protein, fat and fiber but
              // too little else to score (no calorie content and no feeding statement), a wet food without moisture.
              if (byGuard(a, scope, requests).length) guarded.push(`${kind}: ${a.missingForScore.join('; ')}`);
            }
    expect(unscored).toBeGreaterThan(20);
    expect(guarded.length).toBeGreaterThan(0);
  });
});
