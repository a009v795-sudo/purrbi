// Reading a guaranteed analysis from label or page text: TEST FIXTURE transcriptions (one printed line per
// line, as a vision model returns them) in seven languages, with the rows a careful reader would take. A row
// is read only when it is unambiguous; where Purrbi deliberately reads less than a person might, `why` says so.
import { describe, expect, it } from 'vitest';
import { analysisRows } from '../../src/domain/analysisText';
import { readingInUse, rowsInUse21, type ValidatedLabel } from '../../src/ai/labelExtract';
import type { GuaranteedAnalysisEntry } from '../../src/domain/types';
import corpus from '../fixtures/analysis-corpus.json';

const key = (r: { nutrient: string; value: number; unit: string; qualifier: string }, withQualifier: boolean) =>
  `${r.nutrient}:${r.value}${r.unit}${withQualifier && r.qualifier !== 'not_stated' ? `:${r.qualifier}` : ''}`;

describe('analysis rows: corpus', () => {
  for (const c of corpus as { id: string; pct: boolean; text: string; expect: string[]; why?: string }[]) {
    it(`${c.id}${c.why ? ` (${c.why})` : ''}`, () => {
      const withQualifier = c.expect.some((e) => e.split(':').length > 2);
      expect(analysisRows(c.text, c.pct).map((r) => key(r, withQualifier)).sort()).toEqual([...c.expect].sort());
    });
  }
});

describe('analysis rows: generated inline panels', () => {
  // Seven languages, eight separators, random line wraps (also between a value and its "%"), decimal commas.
  const LANGS: [string, [string, string][]][] = [
    ['Constituants analytiques', [['Protéine', 'crude_protein'], ['Teneur en matières grasses', 'crude_fat'], ['Cendres brutes', 'ash'], ['Cellulose brute', 'crude_fiber'], ['Humidité', 'moisture'], ['Calcium', 'calcium'], ['Phosphore', 'phosphorus'], ['Acides gras oméga 3', 'omega_3'], ['Acides gras oméga 6', 'omega_6'], ['Taurine', 'taurine']]],
    ['Analytische Bestandteile', [['Rohprotein', 'crude_protein'], ['Fettgehalt', 'crude_fat'], ['Rohasche', 'ash'], ['Rohfaser', 'crude_fiber'], ['Feuchtigkeit', 'moisture'], ['Natrium', 'sodium'], ['Omega-3-Fettsäuren', 'omega_3']]],
    ['Analytical constituents', [['Protein', 'crude_protein'], ['Fat content', 'crude_fat'], ['Crude ash', 'ash'], ['Crude fibres', 'crude_fiber'], ['Moisture', 'moisture'], ['Omega-6 fatty acids', 'omega_6']]],
    ['Componentes analíticos', [['Proteína bruta', 'crude_protein'], ['Grasa bruta', 'crude_fat'], ['Ceniza bruta', 'ash'], ['Fibra bruta', 'crude_fiber'], ['Humedad', 'moisture']]],
    ['Componenti analitici', [['Proteina grezza', 'crude_protein'], ['Grassi grezzi', 'crude_fat'], ['Ceneri grezze', 'ash'], ['Fibra grezza', 'crude_fiber'], ['Umidità', 'moisture']]],
    ['Analytische bestanddelen', [['Ruw eiwit', 'crude_protein'], ['Ruw vet', 'crude_fat'], ['Ruwe as', 'ash'], ['Ruwe celstof', 'crude_fiber'], ['Vocht', 'moisture']]],
    ['Constituintes analíticos', [['Proteína bruta', 'crude_protein'], ['Gordura bruta', 'crude_fat'], ['Cinza bruta', 'ash'], ['Fibra bruta', 'crude_fiber'], ['Humidade', 'moisture']]],
  ];
  const SEPS = [', ', '; ', ' - ', ' · ', ' ', '. ', ' | ', ' / '];
  it('never gives a value to another nutrient, and reads every row (3 seeds × 2,000 panels)', () => {
    let wrong = 0;
    let lost = 0;
    const examples: string[] = [];
    for (const start of [7, 11, 23]) {
      let seed = start;
      const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
      const pick = <T>(a: T[]) => a[Math.floor(rnd() * a.length)];
      for (let i = 0; i < 2000; i++) {
        const [head, names] = pick(LANGS);
        const n = Math.min(2 + Math.floor(rnd() * 5), names.length);
        const rows: [string, string, number][] = [];
        const used = new Set<string>();
        while (rows.length < n) {
          const [name, k] = pick(names);
          if (used.has(k)) continue;
          used.add(k);
          rows.push([name, k, Math.floor(rnd() * 400) / 10]);
        }
        const comma = rnd() < 0.6;
        const sep = pick(SEPS);
        const nv = pick([' ', ' : ', ': ']);
        const sp = rnd() < 0.5 ? ' ' : '';
        const fmt = (v: number) => (comma ? v.toFixed(1).replace('.', ',') : v.toFixed(1));
        let body = rows.map(([name, , v]) => `${name}${nv}${fmt(v)}${sp}%`).join(sep);
        if (rnd() < 0.7) body = `${head} : ${body}`;
        const width = 25 + Math.floor(rnd() * 60);
        const lines: string[] = [];
        let cur = '';
        for (const w of body.split(' ')) {
          if (cur && `${cur} ${w}`.length > width) {
            lines.push(cur);
            cur = w;
          } else cur = cur ? `${cur} ${w}` : w;
        }
        if (cur) lines.push(cur);
        const text = lines.join('\n');
        const truth = rows.map(([, k, v]) => `${k}:${v}`);
        const got = analysisRows(text, false).map((r) => `${r.nutrient}:${r.value}`);
        const bad = got.filter((g) => !truth.includes(g));
        wrong += bad.length;
        lost += truth.filter((t) => !got.includes(t)).length;
        if (bad.length && examples.length < 3) examples.push(JSON.stringify({ text, got, truth }));
      }
    }
    expect(examples).toEqual([]);
    expect(wrong).toBe(0);
    expect(lost).toBe(0);
  });
  it('reads nothing from a panel that only mentions a heading word in a sentence (a front panel)', () => {
    expect(analysisRows('Mit ausgewählten Inhaltsstoffen\nHuhn 26 %, Lachs 4 %', false, false)).toEqual([]);
    expect(analysisRows('Composition : poulet (26 %), riz.\nConstituants analytiques : Protéine 32 %', false, false).map((r) => `${r.nutrient}:${r.value}`)).toEqual(['crude_protein:32']);
  });
  it('stays fast on hostile text (a photo is untrusted)', () => {
    for (const text of [`Protein${' '.repeat(6000)}30%`, `Protein ${'1 '.repeat(4000)}30%`, 'Protéine 30 %, '.repeat(2000), '('.repeat(5000), '[?] '.repeat(3000)]) {
      const t0 = Date.now();
      analysisRows(text, false);
      expect(Date.now() - t0).toBeLessThan(500);
    }
  });
});

describe('readings by label reader 2.1.0', () => {
  const row = (nutrient: string, label: string, value: number, unit = '%') => ({ nutrient, label, qualifier: 'not_stated', value, unit }) as GuaranteedAnalysisEntry;
  it('keeps only the plain rows the current rules read the same way', () => {
    // As 2.1.0 saved them (each from a real layout the reviews reproduced with the 2.1.0 reader).
    const misread = [
      row('crude_protein', 'Crude Protein Crude Fat', 18), // a name without its value, carried onto the next row's
      row('magnesium', 'Magnesium (max)', 9), // ".09%" without its point
      row('taurine', 'Taurine (min)', 10), // ".10%"
      row('omega_3', 'Omega-3 Fatty Acids* (min)', 30), // ".30%"
      row('other', 'Vitamin A (min)', 15, 'IU/kg'), // "15,000 IU/kg" read as 15
      row('crude_fiber', 'Crude Fiber 4.0% Moisture', 10), // another row's value
      row('crude_protein', 'Protein 30 Fat', 15), // "Protein 30 Fat 15%"
      row('calcium', 'Calcium 1,0 -', 1.5), // a range
      row('other', 'grezze', 15.3), // a wrapped fragment
      row('other', 'Composition : protéines de volaille déshydratées (', 35), // an ingredient's share
    ];
    expect(rowsInUse21(misread)).toEqual([]);
    const plain = [row('crude_protein', 'Crude Protein (min)', 30), row('crude_fat', 'Teneur en matières grasses', 13), row('ash', 'Cendres brutes', 7.5), row('omega_6', 'Acides gras Oméga 6', 2), row('omega_3', 'Omega-3 Fatty Acids* (min)', 0.3), row('taurine', 'Taurine (min)', 0.1), row('magnesium', 'Magnesium (max)', 0.09)];
    expect(rowsInUse21(plain)).toEqual(plain);
    // A dry-matter table read as a second set of values: that nutrient is not used.
    expect(rowsInUse21([row('crude_protein', 'Crude Protein (min)', 30), row('crude_protein', 'Protein', 33.3), row('crude_fat', 'Crude Fat (min)', 18)]).map((e) => e.nutrient)).toEqual(['crude_fat']);
  });
  it('a 2.1.0 reading is used without those rows and with its ingredient list cut where the analysis starts', () => {
    const base = { status: 'processed', reason: '', panels: ['ingredients'], productName: null, brand: null, species: 'cat', productTypeClaim: null, calories: [], adequacy: null, feedingDirections: null, activeIngredients: [], uncertainFields: [], rejected: [], model: 'test' } as unknown as ValidatedLabel;
    // 2.1.0 did not know the German heading "Inhaltsstoffe" and let the list run into the analysis.
    const ingredientsText = 'Fleisch und tierische Nebenerzeugnisse (davon Huhn 4%), Getreide, pflanzliche Eiweißextrakte, Mineralstoffe, Zucker.\nInhaltsstoffe: Rohprotein 8,5%, Fettgehalt 5,0%';
    const reading = { ...base, version: 'label-extract-2.1.0', ingredientsText, ingredients: ['x'], guaranteedAnalysis: [row('crude_protein', 'Crude Protein', 30), row('crude_fiber', 'Crude Fiber 4.0% Moisture', 10)] };
    const used = readingInUse(reading);
    expect(used.guaranteedAnalysis.map((e) => e.label)).toEqual(['Crude Protein']);
    expect(used.ingredientsText).toBe('Fleisch und tierische Nebenerzeugnisse (davon Huhn 4%), Getreide, pflanzliche Eiweißextrakte, Mineralstoffe, Zucker.');
    expect(used.ingredients).toHaveLength(5);
    // Readings by 2.2.0 and the current reader are used as they are.
    for (const version of ['label-extract-2.2.0', 'label-extract-2.3.0']) {
      const later = { ...reading, version };
      expect(readingInUse(later)).toBe(later);
    }
  });
});
