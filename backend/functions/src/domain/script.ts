// Which script a name is written in, and a brand's Latin-script name: shared by research (a manufacturer's brand in
// place of an import listing's), the scan job (a name or brand in another script giving way) and the FDA recall search.

/**
 * Whether a text has a letter of a script other than Latin. Letters shared by scripts (Common or Inherited: the modifier
 * apostrophe in "Hillʼs", the katakana prolonged-sound mark, µ) do not count (review of research 2.9.4).
 */
export function hasOtherScriptLetters(text: string | null | undefined): boolean {
  return /(?=\p{L})[^\p{Script=Latin}\p{Script=Common}\p{Script=Inherited}]/u.test(text ?? '');
}

const OTHER = /(?=\p{L})[^\p{Script=Latin}\p{Script=Common}\p{Script=Inherited}]/u;
const LATIN_OR_DIGIT = /[\p{Script=Latin}0-9]/u;

/**
 * A text made comparable before any other change: apostrophe look-alikes become "'" ("Hill’s"), symbols and modifier
 * letters become spaces (™, ®, ᵀᴹ would otherwise turn into "TM" or "R": "IAMS™" stays "IAMS"), then full-width letters
 * and digits become plain ones (NFKC).
 */
function prepared(text: string): string {
  return text
    .replace(/[‘’ʼʹʻ´`′]/g, "'")
    .replace(/[\p{So}\p{Lm}]/gu, ' ')
    .normalize('NFKC');
}

/** The text's Latin letters, ASCII digits, spaces and & ' . -, tidied: a segment's search words. */
function latinWords(text: string): string {
  return text
    .replace(/[^\p{Script=Latin}0-9\s&'.-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s&'.-]+|[\s&'.-]+$/g, '')
    .trim();
}

/** The brand's Latin-script characters as openFDA's search takes them (see `latinBrand` for which words are the brand). */
export function searchableBrand(brand: string): string {
  return latinWords(prepared(brand));
}

/** A bracketed trademark mark written in letters: "(TM)", "(R)", "(SM)", "(C)". */
const MARK = /^(?:tm|r|sm|c)$/i;

/**
 * The brand's Latin-script name, from the parts of it that are written in Latin script alone; empty when it has none.
 * Brackets separate a name from its reading or gloss: "WELLNESS（ウェルネス）", "K9 Natural（K9ナチュラル）" and
 * "K9ナチュラル（K9 Natural）" give "WELLNESS" and "K9 Natural" (never "K9 Natural K9"), "Hill's（ヒルズ）Science Diet"
 * gives "Hill's Science Diet". Text outside brackets is used when all of it is Latin; otherwise a bracketed Latin part.
 * Without brackets, Latin words beside another script's name count only when no word mixes the two scripts and they
 * are at least three letters and half of the letters ("WELLNESS ウェルネス" gives "WELLNESS"; "ピュリナ ONE" and
 * "ロイヤルカナン JP" give nothing). openFDA's records are in English and it refuses another script's characters (test B,
 * 2026-11-01, HTTP 400 for "WELLNESS（ウェルネス）"); a wrong word would find nothing and say "none found".
 */
export function latinBrand(brand: string): string {
  const text = prepared(brand);
  // Outside text and bracketed parts, in order.
  const outside: string[] = [];
  const inside: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of text) {
    if (/[(（【\[「『〈《{［｛]/u.test(ch)) {
      (depth === 0 ? outside : inside).push(current);
      current = '';
      depth++;
    } else if (/[)）】\]」』〉》}］｝]/u.test(ch) && depth > 0) {
      (depth === 1 ? inside : inside).push(current);
      current = '';
      depth--;
    } else current += ch;
  }
  (depth === 0 ? outside : inside).push(current);
  const kind = (s: string) => (OTHER.test(s) ? (LATIN_OR_DIGIT.test(s) ? 'mixed' : 'other') : LATIN_OR_DIGIT.test(s) ? 'latin' : 'empty');
  const parts = (xs: string[]) => xs.map((s) => s.trim()).filter((s) => kind(s) !== 'empty' && !MARK.test(latinWords(s)));
  const out = parts(outside);
  const ins = parts(inside);
  if (out.length && out.every((s) => kind(s) === 'latin')) return latinWords(out.join(' '));
  const bracketed = ins.filter((s) => kind(s) === 'latin').map(latinWords).sort((a, b) => b.length - a.length);
  if (bracketed.length && (out.length || ins.some((s) => kind(s) !== 'latin'))) return bracketed[0];
  if (out.length + ins.length !== 1) return '';
  // One part mixing scripts, with no brackets: its Latin words when they stand apart and are most of its letters.
  const [only] = [...out, ...ins];
  const words = only.split(/\s+/).filter(Boolean);
  if (words.some((w) => OTHER.test(w) && LATIN_OR_DIGIT.test(w))) return '';
  const latin = latinWords(words.filter((w) => !OTHER.test(w)).join(' '));
  const letters = (t: string) => [...t].filter((c) => /\p{L}/u.test(c)).length;
  const kept = letters(latin);
  return kept >= 3 && kept * 2 >= letters(only) ? latin : '';
}

/** Words that only name a company around a brand ("Wellness Pet Company", "Hill's Pet Nutrition, Inc."). */
const COMPANY_WORDS = new Set(['pet', 'pets', 'company', 'co', 'inc', 'incorporated', 'llc', 'ltd', 'limited', 'nutrition', 'petcare', 'food', 'foods', 'corporation', 'corp', 'group', 'holdings', 'brands', 'international', 'usa', 'us', 'sas', 'gmbh', 'ag', 'sa', 'plc', 'kk', 'japan']);

/** A brand's Latin words for comparing, lower-case: accents and apostrophes dropped, "&" as "and". */
function brandWords(brand: string): string[] {
  return latinBrand(brand)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/'/g, '')
    .replace(/&/g, ' and ')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/**
 * Whether `candidate` names the brand `original` names, as much or more precisely: the original's Latin words are, as
 * whole words or run together, among the candidate's ("WELLNESS（ウェルネス）" → "Wellness" or "Wellness CORE"; "Hill’s"
 * → "Hills"; "ZIWI Peak" → "ZiwiPeak"; "Stella & Chewy’s" → "Stella and Chewy's"). Never a parent company or another
 * brand ("Fancy Feast（…）" → "Purina"; "Purina Pro Plan（…）" → "Purina"), nor a company name around the brand
 * ("Wellness Pet Company"), nor anything when the original has no Latin words.
 */
export function brandCovers(original: string | null | undefined, candidate: string | null | undefined): boolean {
  const x = brandWords(original ?? '');
  const y = brandWords(candidate ?? '');
  if (!x.length || !y.length) return false;
  const joined = x.join('');
  for (let i = 0; i < y.length; i++) {
    for (let j = i + 1; j <= y.length; j++) {
      const run = y.slice(i, j);
      if (run.join(' ') !== x.join(' ') && run.join('') !== joined) continue;
      // What the candidate adds beside the brand's words must not be only a company's.
      const extra = [...y.slice(0, i), ...y.slice(j)];
      if (extra.length && extra.every((w) => COMPANY_WORDS.has(w))) return false;
      return true;
    }
  }
  return false;
}
