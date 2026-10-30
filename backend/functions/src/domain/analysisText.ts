// Reading a guaranteed analysis ("analytical constituents") from label or page text with fixed rules.
// Rows are read whether printed one per line or inline as EU packs print them ("Protéine : 37,0 %,
// Matières grasses : 13,0 %, …"), and nothing ambiguous is read:
// - only analysis sections: a composition, additives, feeding guide or dry-matter table is skipped;
// - each row needs a name of its own that names one nutrient (or, for other rows, a real word), with no
//   other number in it and balanced brackets, and a printed unit (or a "(%)" heading);
// - a value with no name of its own makes its line ambiguous, and so do values printed before their names;
// - anything an unreadable mark ([?]) touches is dropped.
import { normalizeUnit, nutrientKeysIn } from './nutrition';
import type { GuaranteedAnalysisEntry } from './types';

const UNSURE = /\[\?\]/;

/** The headings of an analysis section, in the languages Purrbi reads. */
export const ANALYSIS_HEADING =
  /(?:guaranteed analysis|typical analysis|average analysis|nutritional analysis|analytical constituents|analytical components|constituants analytiques|composants analytiques|analyse garantie|analyse moyenne|valeurs analytiques|analytische bestandteile|analytische inhaltsstoffe|inhaltsstoffe|componentes anal[ií]ticos|constituyentes anal[ií]ticos|an[aá]lisis garantizado|componenti analitici|costituenti analitici|analytische bestanddelen|constituintes anal[ií]ticos|(?<![\p{L}])(?:analysis|analyse|an[aá]lisis|analisi|an[aá]lise)(?=\s*(?:\([^)\n]*\)\s*)?[:：]))/iu;
const COMPOSITION = '(?<![\\p{L}])(?:ingredients?|ingr[eé]dients?|composition|composici[oó]n|composizione|composi[cç][aã]o|zusammensetzung|zutaten|ingredientes|ingredienti|samenstelling)(?=\\s*(?:\\([^)\\n]*\\)\\s*)?(?:[:：]|\\n|$))';
const ADDITIVES = '(?<![\\p{L}])(?:ern[aä]hrungsphysiologische zusatzstoffe|nutritional additives|additifs nutritionnels|additifs|additives|zusatzstoffe|aditivos|additivi|toevoegingsmiddelen)(?=\\s*(?:\\([^)\\n]*\\)\\s*)?(?:[:：]|\\n|$))';
const FEEDING = "(?<![\\p{L}])(?:feeding (?:guide(?:lines)?|directions|instructions)|conseils d'alimentation|mode d'emploi|f[üu]tterungs(?:empfehlung|hinweise?)|recomendaciones de alimentaci[oó]n|dosi consigliate|voedingsadvies)";
const DRY_MATTER = /dry[ -]matter|\bDM\b|mati[eè]re s[eè]che|trockensubstanz|trockenmasse|materia seca|sostanza secca|droge stof/iu;
const AS_FED = /as fed|tel quel|wie gef[üu]ttert|tal cual|tal quale/iu;
const SECTION = new RegExp(`(?<analysis>${ANALYSIS_HEADING.source})|(?<composition>${COMPOSITION})|(?<additives>${ADDITIVES})|(?<feeding>${FEEDING})`, 'giu');

// Units that end a row. The second group ends a row too but is not read (its basis is unclear: "5 g", "2000 mg", "12 g/kg").
const UNITS = '%|mg\\/kg|iu\\/kg|ui\\/kg|ie\\/kg|ppm|cfu\\/g|cfu\\/lb';
const OTHER_UNITS = 'g\\/kg|g\\/100\\s?g|mg\\/100\\s?g|kcal\\/kg|kcal\\/100\\s?g|kcal|kj|mg|g|iu|ui|ie|cfu';
// A min/max printed after the value ("15.0% min", "0.1 % (min.)", "30 % mín."); "Minéraux" is not "min".
const QUALIFIER_AFTER = '\\(?\\s*(?:minimum|maximum|m[ií]nimo|m[aá]ximo|mini|maxi|m[ií]n|m[aá]x)(?!\\p{L})\\.?\\s*\\)?';
const NUMBER = '[1-9]\\d{0,2}(?:([.,])\\d{3})(?:\\1\\d{3})*(?![.,]?\\d)|\\d+(?:[.,]\\d+)?|[.,]\\d+';
// Where a row ends: a value, its unit and a printed min/max.
const ROW_END = new RegExp(`(?<![\\d.,])(?<value>${NUMBER})\\s*(?<unit>${UNITS}|${OTHER_UNITS})(?![\\p{L}\\d/])(?:\\s*(?<qualifier>${QUALIFIER_AFTER}))?`, 'giu');
const LEADING_UNIT = new RegExp(`^(?:${UNITS})(?![\\p{L}\\d])`, 'iu');
// A value without a unit at the end of a line, read only under a "(%)" heading.
const UNITLESS_END = new RegExp(`^(?<name>.*?)(?<![\\d.,])(?<value>\\d+(?:[.,]\\d+)?)\\s*(?<qualifier>${QUALIFIER_AFTER})?$`, 'iu');

const MIN_PRINTED = /\(\s*min\.?\s*\)|(?<!\p{L})(?:min(?:imum)?|mini|m[ií]n(?:imo)?)(?!\p{L})|not less than/iu;
const MAX_PRINTED = /\(\s*max\.?\s*\)|(?<!\p{L})(?:max(?:imum)?|maxi|m[aá]x(?:imo)?)(?!\p{L})|not more than/iu;
// Digits that belong to a name: "Omega-3", "oméga 6", "Vitamin D3", "B12".
const NAME_DIGITS = /(?:om[eé]ga|ω)[\s-]*\d{1,2}(?:\s*(?:[,/&]|et|and|und|y|e)\s*\d{1,2})*(?![\d.,]*\s*(?:%|mg|g|iu|ui|ie|ppm|cfu))|(?<![\p{L}\d])\p{L}{1,2}-?\d{1,2}(?![\p{L}\d.,])/giu;
// Words that only connect or annotate values: a name made of these alone is not a name.
const NOTE_WORDS = /^(?:to|a|à|bis|and|et|und|y|e|o|or|ou|oder|dont|including|incl|of|which|davon|di|cui|waarvan|as|fed|dry|matter|mati[eè]re|s[eè]che|basis|per|par|pro|kg|max|min|maxi|mini|maximum|minimum|ca|approx|env|environ|total|value|values|amount|nutrient|typical|average)$/iu;

type Part = { name: string; value: string | null; unit: string | null; qualifier: string };

const clean = (s: string) => s.replace(/\|/g, ' ').replace(/[\s  ]+/g, ' ').trim();
const lead = (s: string) => s.replace(/^[\s,;.·•*–—\-:：|]+/u, '');
const trail = (s: string) => s.replace(/[\s.:：·…_|\-–—,;]+$/u, '');
const balanced = (s: string) => (s.match(/\(/g) ?? []).length === (s.match(/\)/g) ?? []).length;
const strayNumber = (s: string) => /\d/.test(s.replace(NAME_DIGITS, ' '));
// The end of a range: "1.0% to 1.5%", "1,0 % à 1,5 %", "1,0 % bis 1,5 %".
const RANGE = /^[\s,;]*(?:-|–|—|to|à|a|bis|hasta|fino a|tot|até)[\s:]*$/iu;
// "Oméga 3 et 6": two nutrients under one value.
const COMBINED = /(?:om[eé]ga|ω)[\s-]*\d{1,2}\s*(?:[,/&+]|et|and|und|y|e)\s*\d/iu;
const NAME_DIGIT_END = /(?:(?:om[eé]ga|ω)[\s-]*|(?<![\p{L}\d])\p{L}{1,2}-?)$/iu;
const realWord = (s: string) =>
  s
    .replace(/\([^)]*\)/g, ' ')
    .split(/[^\p{L}]+/u)
    .some((w) => w.length >= 3 && !NOTE_WORDS.test(w));

/** A value as printed: "37,0" and "0.15" are decimals; "15,000" or "1.500" in a per-kg unit is a thousand-grouped number. */
function readValue(text: string, unit: string): number | null {
  const grouped = /^[1-9]\d{0,2}([.,])\d{3}(?:\1\d{3})*$/.exec(text);
  if (grouped) return unit === '%' ? (text.split(/[.,]/).length === 2 ? Number(text.replace(',', '.')) : null) : Number(text.replace(/[.,]/g, ''));
  const n = Number(text.replace(',', '.').replace(/^\./, '0.'));
  return Number.isFinite(n) ? n : null;
}

/** The parts of one line: each ends at a value; text after the last value is a name continued on the next line. */
function partsOf(line: string): { parts: Part[]; rest: string } {
  const parts: Part[] = [];
  let start = 0;
  for (const m of line.matchAll(ROW_END)) {
    parts.push({ name: line.slice(start, m.index), value: m.groups!.value, unit: m.groups!.unit, qualifier: m.groups!.qualifier ?? '' });
    start = m.index + m[0].length;
  }
  return { parts, rest: line.slice(start) };
}

/** The rows of one analysis section (its text after the heading), with the rules above. */
function sectionRows(text: string, percentHeader: boolean): GuaranteedAnalysisEntry[] {
  const out: GuaranteedAnalysisEntry[] = [];
  const lines: string[] = [];
  for (const l of text.split(/\n+/).map(clean)) {
    if (!l || /^[-:|\s]+$/.test(l)) continue;
    // A unit printed at the start of a line belongs to the value that ended the line above ("36,6" / "% …").
    if (lines.length && LEADING_UNIT.test(l) && /\d$/.test(lines[lines.length - 1])) lines[lines.length - 1] += ` ${l}`;
    else lines.push(l);
  }
  // Values printed before their names ("30% Crude Protein / 18% Crude Fat"): which value is whose is unclear.
  const first = lead(lines[0] ?? '');
  if (first) {
    const { parts, rest } = partsOf(first);
    if (parts.length && !/\p{L}/u.test(parts[0].name) && /\p{L}/u.test(rest)) return [];
  }
  let percent = percentHeader;
  let carry = ''; // a name printed on the line above its value
  let poisoned = false; // the carried name had an unreadable part
  let pending = -1; // an "other" row followed by words on its line: kept only if those words name the next value
  const settle = (used: boolean) => {
    if (pending >= 0 && !used) out.splice(pending, 1);
    pending = -1;
  };
  const take = (rawName: string, value: string | null, unitText: string | null, qualifierText: string, inline: boolean) => {
    let name = rawName;
    // A note closed at the start belongs to the previous value: "(dont 80 % d'origine animale), Matières grasses 18 %".
    const close = name.indexOf(')');
    if (close >= 0 && !name.slice(0, close).includes('(')) name = name.slice(close + 1);
    name = trail(lead(name));
    const before = carry;
    const wasPoisoned = poisoned;
    carry = '';
    poisoned = false;
    const pendingBefore = pending;
    pending = -1;
    const settleWith = (used: boolean) => {
      if (pendingBefore >= 0 && !used) out.splice(pendingBefore, 1);
    };
    const own = nutrientKeysIn(name);
    const usesCarry = !!before && own.length === 0;
    settleWith(usesCarry);
    if (value === null || !balanced(name)) return;
    let label: string;
    if (own.length === 1) label = name;
    else if (own.length > 1 || wasPoisoned) return;
    else {
      label = trail(lead(`${before} ${name}`));
      const keys = nutrientKeysIn(label);
      if (keys.length > 1) return;
      if (!keys.length && (!realWord(label) || (inline && /^\(/.test(label)))) return;
    }
    if (!label || !/\p{L}/u.test(label) || !balanced(label) || strayNumber(label) || COMBINED.test(label) || DRY_MATTER.test(label)) return;
    const unit = unitText ? normalizeUnit(unitText.toLowerCase().replace(/^(ui|ie)\//, 'iu/').replace(/\s+/g, '')) : percent ? '%' : null;
    if (!unit || unit === 'other' || unit === 'mg' || unit === 'g') return;
    // Without a printed unit, a label that names one ("Oligo-éléments (mg/kg) Fer") is another unit's row.
    if (!unitText && /\b(?:mg|g|kg|iu|ui|ie|ppm|cfu)\b|\/\s*kg/iu.test(label)) return;
    const v = readValue(value, unit);
    if (v === null) return;
    const q = `${label} ${qualifierText}`;
    const qualifier = MIN_PRINTED.test(q) ? 'min' : MAX_PRINTED.test(q) ? 'max' : 'not_stated';
    const shown = label.replace(/\(\s*(?:min|max|m[ií]n|m[aá]x)\.?\s*\)/giu, ' ').replace(/\s+/g, ' ').trim();
    out.push({ nutrient: nutrientKeysIn(label)[0] ?? 'other', label: shown, qualifier, value: v, unit });
    return out.length - 1;
  };

  for (const line of lines) {
    if (/kcal|kilocal|\bkj\b/iu.test(line) && !partsOf(line).parts.some((p) => p.unit && !/kcal|kj/iu.test(p.unit))) {
      carry = '';
      poisoned = false;
      continue; // an energy statement is read as calorie content, not as an analysis row
    }
    const { parts, rest } = partsOf(line);
    if (!parts.length) {
      // No value with a unit: a name continued below, a sub-heading, or (under "(%)") a unit-less row.
      const m = percent && !UNSURE.test(line) ? UNITLESS_END.exec(line) : null;
      if (m && /\p{L}/u.test(m.groups!.name) && !NAME_DIGIT_END.test(m.groups!.name)) {
        take(m.groups!.name, m.groups!.value, null, m.groups!.qualifier ?? '', false);
        continue;
      }
      if (/\((?:mg|g|µg|iu|ui|ie)\b[^)]*\)|\b(?:per|par|pro) kg\b/iu.test(line)) percent = false; // a sub-heading with its own unit
      if (UNSURE.test(line)) {
        carry = '';
        poisoned = true;
      } else {
        carry = trail(lead(`${carry} ${line}`)).split(' ').slice(-8).join(' ');
      }
      continue;
    }
    // A later value with no name of its own ("Calcium 1.0% / 1.5%", "30% 28%"), or the end of a range ("1.0% to 1.5%"), makes the line ambiguous.
    if (parts.slice(1).some((p) => !/\p{L}/u.test(p.name.replace(/\([^)]*\)/g, '')) || RANGE.test(p.name))) {
      carry = '';
      poisoned = false;
      continue;
    }
    let last: number | undefined;
    parts.forEach((p, i) => {
      if (UNSURE.test(p.name) || UNSURE.test(p.value ?? '')) {
        settle(false);
        carry = '';
        poisoned = true;
        last = undefined;
        return;
      }
      if (i > 0) {
        carry = '';
        poisoned = false;
      }
      last = take(p.name, p.value, p.unit, p.qualifier, parts.length > 1);
    });
    const tail = trail(lead(rest));
    if (UNSURE.test(tail)) {
      carry = '';
      poisoned = true;
    } else if (tail && !/^\([^()]*\)?$/.test(tail)) {
      carry = tail.split(' ').slice(-8).join(' ');
      if (last !== undefined && out[last].nutrient === 'other') pending = last;
    }
  }
  settle(false);
  return out;
}

/**
 * Analysis rows from a panel's or page's text. `inAnalysis`: whether the text starts inside the analysis
 * (the analysis panel itself) or only after an analysis heading (any other panel, a web page).
 */
export function analysisRows(text: string, percentHeader: boolean, inAnalysis = true): GuaranteedAnalysisEntry[] {
  const body = text.slice(0, 8000);
  const out: GuaranteedAnalysisEntry[] = [];
  let mode: 'rows' | 'skip' = inAnalysis ? 'rows' : 'skip';
  let percent = percentHeader;
  let start = 0;
  const flush = (end: number) => {
    if (mode === 'rows' && end > start) out.push(...sectionRows(body.slice(start, end), percent));
  };
  for (const m of body.matchAll(SECTION)) {
    flush(m.index);
    start = m.index + m[0].length;
    if (m.groups!.analysis) {
      // The rest of the heading's line: "(%)", "(as fed)", or a dry-matter table.
      const lineRest = body.slice(start).split('\n')[0];
      const head = /^\s*(\([^()\n]*\))?\s*[:：.]?/u.exec(body.slice(start))!;
      const dryMatterTable = DRY_MATTER.test(lineRest.slice(0, 60)) && !AS_FED.test(lineRest.slice(0, 60));
      mode = dryMatterTable ? 'skip' : 'rows';
      percent = percentHeader || /%/.test(head[1] ?? '');
      start += head[0].length;
    } else mode = 'skip';
  }
  flush(body.length);
  return distinctRows(out);
}

/**
 * The same row twice (two languages, two panels) counts once; one nutrient with two values (variants, as fed
 * and dry matter) is ambiguous and not read. A printed minimum and maximum are two rows.
 */
export function distinctRows(rows: GuaranteedAnalysisEntry[]): GuaranteedAnalysisEntry[] {
  const keyOf = (e: GuaranteedAnalysisEntry) => `${e.nutrient === 'other' ? `other|${e.label.toLowerCase()}` : e.nutrient}|${e.unit}|${e.qualifier}`;
  const seen = new Map<string, number>();
  const conflict = new Set<string>();
  const once: GuaranteedAnalysisEntry[] = [];
  for (const e of rows) {
    const k = keyOf(e);
    if (!seen.has(k)) {
      seen.set(k, e.value);
      once.push(e);
    } else if (seen.get(k) !== e.value) conflict.add(k);
  }
  return once.filter((e) => !conflict.has(keyOf(e)));
}
