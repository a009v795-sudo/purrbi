// Reading a guaranteed analysis from label or page text: TEST FIXTURE transcriptions (one printed line per
// line, as a vision model returns them) in seven languages, with the rows a careful reader would take. A row
// is read only when it is unambiguous; where Purrbi deliberately reads less than a person might, `why` says so.
import { describe, expect, it } from 'vitest';
import { analysisRows } from '../../src/domain/analysisText';
import { misreadBy21, readingInUse, type ValidatedLabel } from '../../src/ai/labelExtract';
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
  it('stays fast on hostile text (a photo is untrusted)', () => {
    for (const text of [`Protein${' '.repeat(6000)}30%`, `Protein ${'1 '.repeat(4000)}30%`, 'Protéine 30 %, '.repeat(2000), '('.repeat(5000), '[?] '.repeat(3000)]) {
      const t0 = Date.now();
      analysisRows(text, false);
      expect(Date.now() - t0).toBeLessThan(500);
    }
  });
});

describe('readings by label reader 2.1.0', () => {
  const row = (label: string, value: number) => ({ nutrient: 'other' as const, label, qualifier: 'not_stated' as const, value, unit: '%' as const });
  it('flags the rows 2.1.0 could misread, and none of the common names', () => {
    // As 2.1.0 saved them: another row's value under a name, inline values without units, an ingredient's
    // percentage, the tail of a thousands group.
    for (const [label, value] of [['Crude Fiber 4.0% Moisture', 10], ['Protein 30% min (as fed) Fat', 18], ['Protéine 37, Matières grasses 13, Cendres', 7.5], ['Taurine : 1', 500], ['Vitamine A : 15', 0], ['Composition : protéines de volaille déshydratées (', 35], ['), riz (', 20], ['Calcium (min) 1.2% * Phosphorus (min)', 1], ['Vit A: 36', 900]] as const) {
      expect(misreadBy21(row(label, value)), label).toBe(true);
    }
    for (const [label, value] of [['Crude Protein (min)', 30], ['Acides gras Oméga 6', 2], ['Omega-3 Fatty Acids*', 0.3], ['Vitamin D3', 500], ['Vitamin B12', 100], ['Taurine', 0.15], ['Matières grasses brutes', 8], ['Teneur en matières grasses', 13], ['Proteína bruta', 30], ['Omega 3', 400], ['Cendres brutes', 7.5], ['Moisture', 10]] as const) {
      expect(misreadBy21(row(label, value)), label).toBe(false);
    }
  });
  it('a 2.1.0 reading is used without those rows; a current reading is used as it is', () => {
    const base = { status: 'processed', reason: '', panels: ['guaranteed_analysis'], productName: null, brand: null, species: 'cat', productTypeClaim: null, ingredientsText: null, ingredients: [], calories: [], adequacy: null, feedingDirections: null, activeIngredients: [], uncertainFields: [], rejected: [], model: 'test' } as unknown as ValidatedLabel;
    const ga = [{ ...row('Crude Protein', 30), nutrient: 'crude_protein' as const }, { ...row('Crude Fiber 4.0% Moisture', 10), nutrient: 'crude_fiber' as const }];
    expect(readingInUse({ ...base, version: 'label-extract-2.1.0', guaranteedAnalysis: ga }).guaranteedAnalysis.map((e) => e.label)).toEqual(['Crude Protein']);
    expect(readingInUse({ ...base, version: 'label-extract-2.2.0', guaranteedAnalysis: ga }).guaranteedAnalysis).toHaveLength(2);
  });
});
