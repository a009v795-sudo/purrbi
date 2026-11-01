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

/**
 * A text made comparable before any other change: invisible format characters (soft hyphen, zero-width space) go,
 * apostrophe look-alikes become "'" ("Hill’s"), symbols and modifier letters become spaces (™, ®, ᵀᴹ would otherwise
 * turn into "TM" or "R": "IAMS™" stays "IAMS"), then full-width letters and digits become plain ones (NFKC).
 */
function prepared(text: string): string {
  return text
    .replace(/\p{Cf}/gu, '')
    .replace(/[‘’‛ʼʹʻʽˈ´`′]/g, "'")
    .replace(/[\p{So}\p{Lm}]/gu, ' ')
    .normalize('NFKC');
}

/** The text's Latin letters, ASCII digits, spaces and & ' . -, tidied, without a trademark mark written as a word. */
function latinWords(text: string): string {
  return text
    .replace(/[^\p{Script=Latin}0-9\s&'.-]/gu, ' ')
    .replace(/(?<![\p{L}\p{N}])(?:TM|SM)(?![\p{L}\p{N}])/gu, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s&'.-]+|[\s&'.-]+$/g, '')
    .trim();
}

/** The brand's Latin-script characters as openFDA's search takes them (see `latinBrand` for when they are its name). */
export function searchableBrand(brand: string): string {
  return latinWords(prepared(brand));
}

/** A bracketed trademark mark written in letters: "(TM)", "(R)", "(SM)", "(C)", and the French "(MD)", "(MC)". */
const MARK = /[(（［\[]\s*(?:tm|r|sm|c|md|mc)\s*[)）］\]]/giu;
const OPEN = /[(（【\[「『〈《{［｛]/u;
const CLOSE = /[)）】\]」』〉》}］｝]/u;

/**
 * The brand's Latin-script name when it is unambiguous; empty otherwise. A brand written in Latin script alone is its own
 * name ("Hill’s Science Diet", "IAMS™", "IAMS(TM)", "Café Nature"). A brand mixing scripts gives its name only in one
 * form: the Latin name with its reading or gloss in one pair of brackets after it ("WELLNESS（ウェルネス）", "K9 Natural
 * （K9ナチュラル）", "1st Choice（ファーストチョイス）"). Any other mix gives nothing ("ピュリナ ONE", "ウェルネス コア（CORE）",
 * "シーバ（Sheba）（Mars Japan）"): picking Latin words out of it may search words that are not the brand's, which find
 * nothing and say "none found" (review of research 2.9.4, 68 such strings). openFDA's records are in English and it
 * refuses another script's characters (test B, 2026-11-01, HTTP 400 for "WELLNESS（ウェルネス）").
 */
export function latinBrand(brand: string): string {
  const text = prepared(brand).replace(MARK, ' ');
  if (!OTHER.test(text)) return plainName(text);
  // Mixed: exactly "<Latin name>（<reading>）".
  const open = text.search(OPEN);
  if (open < 0) return '';
  const rest = text.slice(open + 1);
  const close = rest.search(CLOSE);
  if (close < 0) return '';
  const name = text.slice(0, open);
  const reading = rest.slice(0, close);
  const after = rest.slice(close + 1);
  if (OPEN.test(reading) || after.trim() || OTHER.test(name) || !OTHER.test(reading) || /[,;|/／・]/u.test(name)) return '';
  return latinWords(name);
}

/**
 * A brand written in Latin script alone, as one name: a "Brand:" label left out, only the first of several brands
 * ("Purina, Nestlé", "Royal Canin | Mars"), and only the text outside brackets ("Pro Plan (Purina)", "Hill's Science Diet
 * (Adult)"; the first bracketed part when nothing is outside them). A shorter phrase only finds more records, never fewer.
 */
function plainName(text: string): string {
  const first = text.replace(/^\s*(?:brand|marque|marca|marke)\s*:\s*/i, '').split(/[,;|]/)[0];
  const outside = first.replace(/[(（【\[「『〈《{［｛][^)）】\]」』〉》}］｝]*(?:[)）】\]」』〉》}］｝]|$)/gu, ' ');
  if (/\p{L}/u.test(latinWords(outside))) return latinWords(outside);
  const bracketed = /[(（【\[「『〈《{［｛]([^)）】\]」』〉》}］｝(（【\[「『〈《{［｛]*)/u.exec(first)?.[1] ?? '';
  return /\p{L}/u.test(latinWords(bracketed)) ? latinWords(bracketed) : latinWords(first);
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
