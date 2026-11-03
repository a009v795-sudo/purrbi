// Differential check of the analysis reader (reviews of 2.5.1): on generated label layouts (a row list run on and
// wrapped at any width, one row per line, rows wrapped one by one, alternating name and value lines, names stacked over
// values, values printed above names; English and French; with and without min/max), the reader never reads a wrong
// value, and never loses a row the reader before 2.5.1 (9b0b2fe, test/fixtures) read right.
import { it } from 'vitest';
import { analysisRows as now } from '../../src/domain/analysisText';
import { analysisRows as old } from '../fixtures/analysisText-9b0b2fe';
import { expect } from 'vitest';
type Row = [string, string, number, 'min' | 'max'];
const EN: Row[] = [['Crude Protein', 'crude_protein', 10, 'min'], ['Crude Fat', 'crude_fat', 6, 'min'], ['Crude Fiber', 'crude_fiber', 1.5, 'max'], ['Moisture', 'moisture', 78, 'max'], ['Ash', 'ash', 2.5, 'max'], ['Taurine', 'taurine', 0.05, 'min'], ['Calcium', 'calcium', 0.3, 'min'], ['Total Dietary Fiber', 'other', 4, 'max'], ['Omega-3 Fatty Acids', 'omega_3', 0.5, 'min']];
const FR: Row[] = [['Protéines brutes', 'crude_protein', 10, 'min'], ['Matières grasses brutes', 'crude_fat', 6, 'min'], ['Cellulose brute', 'crude_fiber', 1.5, 'max'], ['Humidité', 'moisture', 78, 'max'], ['Cendres brutes', 'ash', 2.5, 'max']];
let seed = 11;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
const q = (r: Row, style: number) => (style === 0 ? ` (${r[3] === 'min' ? 'Min.' : 'Max.'})` : style === 1 ? ` (${r[3]})` : '');
const wrap = (text: string, width: number) => {
  const lines: string[] = [];
  for (const para of text.split('\n')) {
    let cur = '';
    for (const w of para.split(' ')) cur && cur.length + 1 + w.length > width ? (lines.push(cur), (cur = w)) : (cur = cur ? `${cur} ${w}` : w);
    lines.push(cur);
  }
  return lines.join('\n');
};
it('never reads a wrong value, and never loses a row the reader before 2.5.1 read right (12,000 generated layouts)', () => {
  const tally: Record<string, { n: number; lost: number; wrongNew: number; wrongOld: number; gained: number }> = {};
  const examples: string[] = [];
  for (let n = 0; n < 12000; n++) {
    const lang = rnd() < 0.8 ? EN : FR;
    const picked = lang.filter((_, i) => i < 4 || rnd() < 0.4);
    const style = Math.floor(rnd() * 3);
    const layout = pick(['inline', 'perline', 'alternating', 'stacked', 'valuesAbove', 'perlineWrapped', 'inlineEnergy', 'valuesFirst']);
    // Headings as labels print them: a basis ("per 100 g", "As fed") or a typical-values line under the heading too
    // (third review of efb5e21).
    const head = pick(['GUARANTEED ANALYSIS: ', 'Guaranteed Analysis\n', lang === FR ? 'Constituants analytiques : ' : 'Analysis: ', lang === FR ? 'Constituants analytiques pour 100 g\n' : 'Analytical constituents per 100g\n', 'Guaranteed Analysis\nAs fed\n']);
    const energy = pick(['Metabolisable energy 3,900 kcal/kg', 'Calories 3500 kcal/kg', 'Calorie content (calculated): 1,181 kcal/kg']);
    const valueText = (r: Row) => (lang === FR ? `${String(r[2]).replace('.', ',')} %` : `${r[2]}%`);
    let text = '';
    if (layout === 'inline') text = wrap(head + picked.map((r) => `${r[0]}${q(r, style)} ${valueText(r)}`).join(pick([', ', ' • ', '; '])), 10 + Math.floor(rnd() * 60));
    else if (layout === 'perline') text = head + picked.map((r) => `${r[0]}${q(r, style)} ${valueText(r)}`).join('\n');
    else if (layout === 'perlineWrapped') text = head + picked.map((r) => wrap(`${r[0]}${q(r, style)} ${valueText(r)}`, 8 + Math.floor(rnd() * 20))).join('\n');
    else if (layout === 'alternating') text = head + picked.map((r) => `${r[0]}${q(r, style)}\n${valueText(r)}`).join('\n');
    else if (layout === 'stacked') text = head + picked.map((r) => `${r[0]}${q(r, style)}`).join('\n') + '\n' + picked.map(valueText).join('\n');
    else if (layout === 'inlineEnergy') {
      // An energy item inside a row list, at any place, the list wrapped at any width.
      const items = picked.map((r) => `${r[0]}${q(r, style)} ${valueText(r)}`);
      items.splice(Math.floor(rnd() * (items.length + 1)), 0, energy);
      text = wrap(head + items.join(pick([', ', ' • ', '; '])), 14 + Math.floor(rnd() * 60));
    } else if (layout === 'valuesFirst') {
      // Values printed before their names, an energy statement on the same line: never read (corpus R05).
      text = head + picked.map((r) => `${valueText(r)} ${r[0]}${q(r, style)}`).join(', ') + `. ${energy}.`;
    } else text = head + picked.map((r) => `${valueText(r)}\n${r[0]}${q(r, style)}`).join('\n');
    const truth = new Map(picked.map((r) => [r[1] === 'other' ? `other|${r[0].toLowerCase()}` : r[1], r]));
    const key = (e: { nutrient: string; label: string }) => (e.nutrient === 'other' ? `other|${e.label.toLowerCase()}` : e.nutrient);
    const right = (e: { nutrient: string; label: string; value: number; qualifier: string }) => {
      const r = truth.get(key(e));
      return !!r && Math.abs(r[2] - e.value) < 1e-9 && (e.qualifier === 'not_stated' || e.qualifier === r[3]);
    };
    const a = old(text, false);
    const b = now(text, false);
    const t = (tally[layout] ??= { n: 0, lost: 0, wrongNew: 0, wrongOld: 0, gained: 0 });
    t.n++;
    for (const e of a) if (right(e) && !b.some((x) => key(x) === key(e) && right(x))) { t.lost++; if (examples.length < 8) examples.push(`LOST ${key(e)} in ${layout}:\n${text}`); }
    for (const e of b) if (!right(e)) { t.wrongNew++; if (examples.length < 8) examples.push(`WRONG ${key(e)} ${e.value} in ${layout}:\n${text}`); }
    for (const e of a) if (!right(e)) t.wrongOld++;
    for (const e of b) if (right(e) && !a.some((x) => key(x) === key(e) && right(x))) t.gained++;
  }
  const sum = (k: 'lost' | 'wrongNew' | 'gained' | 'wrongOld') => Object.values(tally).reduce((t, x) => t + x[k], 0);
  expect(examples.slice(0, 3)).toEqual([]);
  expect(sum('wrongNew')).toBe(0);
  expect(sum('lost')).toBe(0);
  expect(sum('gained')).toBeGreaterThan(1000); // the run-on lists 2.5.1 reads
  expect(sum('wrongOld')).toBeGreaterThan(0); // the layouts the reader before 2.5.1 misread (values above names)
});
