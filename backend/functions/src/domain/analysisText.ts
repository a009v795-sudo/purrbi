// Reading a guaranteed analysis ("analytical constituents") from label or page text with fixed rules.
// Rows are read whether printed one per line or inline as EU packs print them ("Protéine : 37,0 %,
// Matières grasses : 13,0 %, …"), and nothing ambiguous is read:
// - only analysis sections: a composition, additives, feeding guide, dry-matter table or a block in a
//   language Purrbi does not read is skipped;
// - each row needs a name of its own that names one nutrient (or, for other rows, a real word), with no
//   other number in it and balanced brackets, and a printed unit (or a "(%)" heading);
// - a value with no name of its own makes its line ambiguous, and values printed before their names make
//   the whole section ambiguous;
// - anything an unreadable mark ([?]) touches is dropped.
import { normalizeUnit, nutrientKeysIn, startsWithNutrientName } from './nutrition';
import type { GuaranteedAnalysisEntry } from './types';

const UNSURE = /\[\?\]/;
// Words of a heading may be split across printed lines ("Constituants\nanalytiques").
const words = (...alternatives: string[]) => alternatives.map((a) => a.replace(/ /g, '\\s+')).join('|');

/**
 * The headings of an analysis section, in the languages whose nutrient names Purrbi reads (English, French,
 * German, Spanish, Italian, Dutch, Portuguese). A block in another language is skipped, not read as rows.
 */
export const ANALYSIS_HEADING = new RegExp(
  `(?:${words(
    'guaranteed analysis', 'typical analysis', 'average analysis', 'nutritional analysis', 'analytical constituents', 'analytical components',
    'analytical composition', 'nutritional composition', 'nutrient composition', 'constituants analytiques', 'composants analytiques', 'composition analytique',
    'analyse garantie', 'analyse moyenne', 'valeurs analytiques', 'analytische bestandteile', 'analytische inhaltsstoffe', 'analytische zusammensetzung',
    'componentes anal[ií]ticos', 'constituyentes anal[ií]ticos', 'composici[oó]n anal[ií]tica', 'an[aá]lisis garantizado', 'componenti analitici',
    'costituenti analitici', 'composizione analitica', 'analytische bestanddelen', 'constituintes anal[ií]ticos',
  )}|(?<![\\p{L}])(?:analysis|analyse|an[aá]lisis|analisi|an[aá]lise|inhaltsstoffe)(?=\\s*(?:\\([^)]*\\)\\s*)?(?:[:：]|\\n|$)))`,
  'iu',
);
const ENDS = '(?=\\s*(?:\\([^)]*\\)\\s*)?(?:[:：]|\\n|$))';
const COMPOSITION = `(?<![\\p{L}])(?:${words(
  'ingredients?', 'ingr[eé]dients?', 'composition', 'composici[oó]n', 'composizione', 'composi[cç][aã]o', 'zusammensetzung', 'zutaten', 'ingredientes',
  'ingredienti', 'samenstelling', 'sk[lł]ad', 'sk[lł]adniki', 'sammans[aä]ttning', 'sammens[aæ]tning', 'sammensetning', 'koostumus', 'slo[zž]en[ií]',
  'zlo[zž]enie', '[oö]sszet[eé]tel', 'compozi[tț]i[ae]', 'sastav', 'sestava',
)})${ENDS}`;
const ADDITIVES = `(?<![\\p{L}])(?:${words(
  'ern[aä]hrungsphysiologische zusatzstoffe', 'zusatzstoffe', 'additifs', 'additives', 'aditivos', 'additivi', 'toevoegingsmiddelen', 'dodatki',
  'tillsatser', 'tils[aæ]tningsstoffer', 'tilsetningsstoffer', 'lis[aä]aineet', 'dopl[nň]kov[eé] l[aá]tky', 'adal[eé]kanyagok', 'aditivi',
)})(?:\\s+(?:nutri\\p{L}*|zootechni\\p{L}*|sensori\\p{L}*|technolog\\p{L}*|organolepti\\p{L}*|ern[aä]hrungsphysiologische))?(?:\\s*(?:\\/\\s*kg|(?:per|pro|je|por|par|au|al|na)\\s+kg))?${ENDS}`;
const FEEDING = `(?<![\\p{L}])(?:${words(
  'feeding (?:guide(?:lines)?|directions|instructions)', "conseils d'alimentation", "mode d'emploi", 'f[üu]tterungs(?:empfehlung|hinweise?)',
  'recomendaciones de alimentaci[oó]n', 'dosi consigliate', 'voedingsadvies',
)})`;
// A new block in another language: "PL Skład: …", "SE Sammansättning: …" at the start of a line (case matters:
// "en matières grasses" is not one).
const LANGUAGE_BLOCK = /(?<=^|\n)[ \t]*(?:EN|FR|DE|NL|IT|ES|PT|PL|SE|SV|DK|DA|NO|FI|CZ|CS|SK|HU|RO|HR|SI|SL|EL|GR|BG|LT|LV|ET|EE)[ \t](?=\p{Lu})/gu;
const DRY_MATTER = /dry[ -]matter|\bDM\b|mati[eè]re s[eè]che|trockensubstanz|trockenmasse|materia seca|sostanza secca|droge stof/iu;
const AS_FED = /as fed|tel quel|wie gef[üu]ttert|tal cual|tal quale/iu;
const SECTION = new RegExp(`(?<analysis>${ANALYSIS_HEADING.source})|(?<composition>${COMPOSITION})|(?<additives>${ADDITIVES})|(?<feeding>${FEEDING})`, 'giu');

// Units that end a row. The second group ends a row too but is not read (its basis is unclear: "5 g", "2000 mg", "12 g/kg").
const UNITS = '%|mg\\/kg|iu\\/kg|ui\\/kg|ie\\/kg|ppm|cfu\\/g|cfu\\/lb';
const OTHER_UNITS = 'g\\/kg|g\\/100\\s?g|mg\\/100\\s?g|kcal\\/kg|kcal\\/100\\s?g|kcal|kj|mg|g|iu|ui|ie|cfu';
// A min/max printed after the value ("15.0% min", "0.1 % (min.)", "30 % mín."); "Minéraux" is not "min".
const QUALIFIER_WORD = '(?:minimum|maximum|m[ií]nimo|m[aá]ximo|mini|maxi|m[ií]n|m[aá]x)(?!\\p{L})\\.?';
const QUALIFIER_AFTER = `\\(?\\s*${QUALIFIER_WORD}\\s*\\)?`;
const NUMBER = '[1-9]\\d{0,2}(?:([.,])\\d{3})(?:\\1\\d{3})*(?![.,]?\\d)|\\d+(?:[.,]\\d+)?|[.,]\\d+';
// Where a row ends: a value, its unit and a printed min/max.
const ROW_END = new RegExp(`(?<![\\d.,])(?<value>${NUMBER})\\s*(?<unit>${UNITS}|${OTHER_UNITS})(?![\\p{L}\\d/])(?:\\s*(?<qualifier>${QUALIFIER_AFTER}))?`, 'giu');
const LEADING_UNIT = new RegExp(`^(?:${UNITS})(?![\\p{L}\\d])`, 'iu');
// A value without a unit at the end of a line, read only under a "(%)" heading.
const UNITLESS_END = new RegExp(`^(?<name>.*?)(?<![\\d.,])(?<value>\\d+(?:[.,]\\d+)?)\\s*(?<qualifier>${QUALIFIER_AFTER})?$`, 'iu');
// A qualifier on its own ("min", "(max.)", "Minimum:") or opening a part ("min, Crude Fiber"): the row before's.
const QUALIFIER_ALONE = new RegExp(`^[\\s(]*${QUALIFIER_WORD}[\\s)]*[:：]?$`, 'iu');
const QUALIFIER_LEAD = new RegExp(`^[\\s(]*(${QUALIFIER_WORD})[\\s)]*[,;:：]\\s*`, 'iu');
// A name that ends with its qualifier is complete ("Protéines brutes (min.)"): it does not go on to the next line.
const QUALIFIER_END = new RegExp(`(?:\\(\\s*${QUALIFIER_WORD}\\s*\\)|(?<!\\p{L})${QUALIFIER_WORD})\\s*[:：]?$`, 'iu');

const MIN_PRINTED = /\(\s*min\.?\s*\)|(?<!\p{L})(?:min(?:imum)?|mini|m[ií]n(?:imo)?)(?!\p{L})|not less than/iu;
const MAX_PRINTED = /\(\s*max\.?\s*\)|(?<!\p{L})(?:max(?:imum)?|maxi|m[aá]x(?:imo)?)(?!\p{L})|not more than/iu;
// Digits that belong to a name: "Omega-3", "oméga 6", "Vitamin D3", "B12".
const NAME_DIGITS = /(?:om[eé]ga|ω)[\s-]*\d{1,2}(?:\s*(?:[,/&]|et|and|und|y|e)\s*\d{1,2})*(?![\d.,]*\s*(?:%|mg|g|iu|ui|ie|ppm|cfu))|(?<![\p{L}\d])\p{L}{1,2}-?\d{1,2}(?![\p{L}\d.,])/giu;
// Words that only connect or annotate values: a name made of these alone is not a name.
const NOTE_WORDS = /^(?:to|a|à|bis|and|et|und|y|e|o|or|ou|oder|dont|including|incl|of|which|davon|di|cui|waarvan|w|tym|varav|heraf|hvorav|incluido|incluidos|as|fed|dry|matter|mati[eè]re|s[eè]che|basis|per|par|pro|kg|max|min|maxi|mini|maximum|minimum|m[ií]nimo|m[aá]ximo|ca|approx|env|environ|total|value|values|amount|nutrient|typical|average)$/iu;
// A line naming a group of rows, not a row: "Water-soluble vitamins", "Oligo-éléments", "Amino acids". (Fatty
// acids are not one: "Acides gras oméga" goes on to "6 : 3,5 %" on the next line.)
const SUBHEADING = /^[\p{L}\s-]*\b(?:vitamins?|vitamines?|vitaminas?|vitamine|minerals?|min[eé]raux|mineralstoffe|minerales|mineralen|oligo-?[eé]l[eé]ments|trace elements|spurenelemente|amino acids|acides amin[eé]s|amino(?:s[aä]uren|[aá]cidos))\b[\p{L}\s-]*:?$/iu;

type Part = { name: string; value: string | null; unit: string | null; qualifier: string };

const clean = (s: string) => s.replace(/\|/g, ' ').replace(/[\s  ]+/g, ' ').trim();
const lead = (s: string) => s.replace(/^[\s,;.·•*–—\-:：|]+/u, '');
const trail = (s: string) => s.replace(/[\s.:：·…_|\-–—,;]+$/u, '');
/** Whether a row's name opens and closes its brackets. */
export const balanced = (s: string) => (s.match(/\(/g) ?? []).length === (s.match(/\)/g) ?? []).length;
const unclosed = (s: string) => (s.match(/\(/g) ?? []).length > (s.match(/\)/g) ?? []).length;
/** A number left in a row's name once the digits that belong to names (Omega-3, D3, B12) are set aside: another value. */
export const strayNumber = (s: string) => /\d/.test(s.replace(NAME_DIGITS, ' '));
// Table header words before the first row's name ("Nutrient Guaranteed Units Crude Protein").
const HEADER_WORD = /^(?:nutrients?|guaranteed|units?|amounts?|values?|typical|average|analysis|per|100\s?g|nutriments?|valeurs?|teneur moyenne|nährstoffe?|gehalt|valor|valores|nutrienti|valori)$/iu;
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
const qualifierOf = (s: string) => (MIN_PRINTED.test(s) ? 'min' : MAX_PRINTED.test(s) ? 'max' : null);

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
  let percent = percentHeader;
  let carry = ''; // a name printed on the line above its value
  let poisoned = false; // the carried name had an unreadable part
  let pending = -1; // an "other" row followed by words on its line: kept only if those words name the next value
  const settle = (used: boolean) => {
    if (pending >= 0 && !used) out.splice(pending, 1);
    pending = -1;
  };
  // A qualifier printed apart from its row ("min" on the next line) belongs to the row before, when it has none.
  const qualifyLast = (word: string) => {
    const last = out[out.length - 1];
    const q = qualifierOf(word);
    if (last && q && last.qualifier === 'not_stated') last.qualifier = q;
  };
  const take = (rawName: string, value: string | null, unitText: string | null, qualifierText: string, inline: boolean) => {
    let name = rawName;
    const before = carry;
    const wasPoisoned = poisoned;
    carry = '';
    poisoned = false;
    // "min, Crude Fiber 1.0% max": the "min" is the row before's.
    const q = QUALIFIER_LEAD.exec(name);
    if (q) {
      qualifyLast(q[1]);
      name = name.slice(q[0].length);
    }
    // A note closed at the start belongs to the previous value ("(dont 80 % d'origine animale), Matières
    // grasses 18 %"), unless the name above opened that bracket ("DHA (Docosahexaenoic / Acid)* 0.10%").
    const close = name.indexOf(')');
    if (close >= 0 && !name.slice(0, close).includes('(') && !unclosed(before)) name = name.slice(close + 1);
    name = trail(lead(name));
    const own = nutrientKeysIn(name);
    const joined = trail(lead(`${before} ${name}`));
    // Whether the name above goes on into this one: this name names nothing by itself, or the two together
    // name the same nutrient from their start ("Crude" + "Protein (min)"). A name above that ends with its
    // qualifier is complete ("Protéines brutes (min.)" above "Crude Fat (min.) 18 %").
    const continues =
      !!before && !QUALIFIER_END.test(before) &&
      (own.length === 0 || (nutrientKeysIn(joined).length === 1 && nutrientKeysIn(joined)[0] === own[0] && startsWithNutrientName(joined)) || unclosed(before));
    const pendingBefore = pending;
    pending = -1;
    if (pendingBefore >= 0 && !continues) out.splice(pendingBefore, 1);
    if (value === null) return;
    let label: string;
    if (wasPoisoned && (continues || own.length !== 1)) return;
    if (continues) label = joined;
    else if (own.length === 1) label = name;
    else if (own.length > 1) return;
    else label = name;
    const keys = nutrientKeysIn(label);
    if (keys.length > 1 || !balanced(label)) return;
    if (!keys.length && (!realWord(label) || (inline && /^\(/.test(label)))) return;
    if (!label || !/\p{L}/u.test(label) || strayNumber(label) || COMBINED.test(label) || DRY_MATTER.test(label)) return;
    // A table's header cells read before the first row's name are not part of it.
    const parts = label.split(' ');
    while (parts.length > 1 && HEADER_WORD.test(parts[0]) && nutrientKeysIn(parts.slice(1).join(' ')).length === keys.length) parts.shift();
    label = parts.join(' ');
    const unit = unitText ? normalizeUnit(unitText.toLowerCase().replace(/^(ui|ie)\//, 'iu/').replace(/\s+/g, '')) : percent ? '%' : null;
    if (!unit || unit === 'other' || unit === 'mg' || unit === 'g') return;
    // Without a printed unit, a label that names one ("Oligo-éléments (mg/kg) Fer") is another unit's row.
    if (!unitText && /\b(?:mg|g|kg|iu|ui|ie|ppm|cfu)\b|\/\s*kg/iu.test(label)) return;
    const v = readValue(value, unit);
    if (v === null) return;
    // The min/max printed right after the value is the row's own; otherwise the one printed in its name.
    const qualifier = qualifierOf(qualifierText) ?? qualifierOf(label) ?? 'not_stated';
    const shown = label.replace(/\(\s*(?:min|max|m[ií]n|m[aá]x)\.?\s*\)/giu, ' ').replace(/\s+/g, ' ').trim();
    out.push({ nutrient: keys[0] ?? 'other', label: shown, qualifier, value: v, unit });
    return out.length - 1;
  };

  // Values printed before their names ("30% Crude Protein / 18% Crude Fat", "Minimum: 30% Crude Protein, …"):
  // which value is whose is unclear, so nothing in the section is read.
  let carryForCheck = '';
  for (const line of lines) {
    const { parts, rest } = partsOf(line);
    if (!parts.length) {
      if (!QUALIFIER_ALONE.test(line)) carryForCheck = line;
      continue;
    }
    const first = lead(parts[0].name).replace(QUALIFIER_LEAD, '');
    const ownName = realWord(first) || nutrientKeysIn(first).length > 0;
    const carried = realWord(carryForCheck) || nutrientKeysIn(carryForCheck).length > 0;
    const goesOn = /\p{L}/u.test(rest) || parts.slice(1).some((p) => /\p{L}/u.test(p.name));
    if (!ownName && !carried && goesOn) return [];
    carryForCheck = /\p{L}/u.test(rest) ? rest : '';
  }

  for (const line of lines) {
    if (/kcal|kilocal|\bkj\b/iu.test(line) && !partsOf(line).parts.some((p) => p.unit && !/kcal|kj/iu.test(p.unit))) {
      carry = '';
      poisoned = false;
      continue; // an energy statement is read as calorie content, not as an analysis row
    }
    const { parts, rest } = partsOf(line);
    // A dry-matter list (its own heading line, or a line that starts by saying so): not the guarantees.
    const opening = parts.length ? parts[0].name : line;
    if (DRY_MATTER.test(opening) && !AS_FED.test(opening) && !nutrientKeysIn(opening.replace(DRY_MATTER, ' ')).length) break;
    if (!parts.length) {
      if (QUALIFIER_ALONE.test(line)) {
        qualifyLast(line);
        continue;
      }
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
      } else if (SUBHEADING.test(line) && !NAME_DIGIT_END.test(line)) {
        carry = '';
        poisoned = false;
      } else {
        carry = trail(lead(`${carry} ${line}`)).split(' ').slice(-8).join(' ');
      }
      continue;
    }
    // A later value with no name of its own ("Calcium 1.0% / 1.5%", "30% 28%"), or the end of a range ("1.0% to 1.5%"), makes the line ambiguous.
    if (parts.slice(1).some((p) => !/\p{L}/u.test(p.name.replace(/\([^)]*\)/g, '')) || RANGE.test(p.name))) {
      settle(false);
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
    } else if (QUALIFIER_ALONE.test(tail)) {
      qualifyLast(tail);
    } else if (tail && !/^\([^()]*\)?$/.test(tail)) {
      carry = tail.split(' ').slice(-8).join(' ');
      if (last !== undefined && out[last]?.nutrient === 'other') pending = last;
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
  const marks = [
    ...[...body.matchAll(SECTION)].map((m) => ({ index: m.index, text: m[0], analysis: !!m.groups!.analysis })),
    ...[...body.matchAll(LANGUAGE_BLOCK)].map((m) => ({ index: m.index, text: m[0], analysis: false })),
  ].sort((a, b) => a.index - b.index);
  for (const m of marks) {
    if (m.index < start) continue; // inside the heading just read
    flush(m.index);
    start = m.index + m.text.length;
    if (m.analysis) {
      // The heading's line, before and after it: "(%)", "(as fed)", or a dry-matter table ("Dry Matter Analysis:").
      const lineStart = body.lastIndexOf('\n', m.index - 1) + 1;
      const line = `${body.slice(lineStart, m.index)} ${body.slice(start).split('\n')[0].slice(0, 60)}`;
      const head = /^\s*(\([^()]*\))?\s*[:：.]?/u.exec(body.slice(start))!;
      mode = DRY_MATTER.test(line) && !AS_FED.test(line) ? 'skip' : 'rows';
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
