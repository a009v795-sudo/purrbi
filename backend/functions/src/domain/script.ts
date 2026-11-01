// Which script a name is written in, and a brand's Latin-script words: shared by research (a manufacturer's brand in
// place of an import listing's), the scan job (a name or brand in another script giving way) and the FDA recall search.

/**
 * Whether a text has a letter of a script other than Latin. Letters shared by scripts (Common or Inherited: the modifier
 * apostrophe in "Hillʼs", the katakana prolonged-sound mark, µ) do not count (review of research 2.9.4).
 */
export function hasOtherScriptLetters(text: string | null | undefined): boolean {
  return /(?=\p{L})[^\p{Script=Latin}\p{Script=Common}\p{Script=Inherited}]/u.test(text ?? '');
}

/**
 * A brand's Latin-script words, as openFDA's search takes them (its records are in English, and it refuses another
 * script's characters: test B, 2026-11-01, HTTP 400 for "WELLNESS（ウェルネス）"). Apostrophe look-alikes become "'"
 * ("Hill’s"), symbols become spaces before any other change (™ would otherwise turn into "TM": "IAMS™" stays "IAMS"),
 * full-width letters and digits become plain ones, and what is left is Latin letters, ASCII digits, spaces and & ' . -.
 */
export function searchableBrand(brand: string): string {
  return brand
    .replace(/[‘’ʼʹ´`′]/g, "'")
    .replace(/\p{So}/gu, ' ')
    .normalize('NFKC')
    .replace(/[^\p{Script=Latin}0-9\s&'.-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s&'.-]+|[\s&'.-]+$/g, '')
    .trim();
}

/**
 * The brand's Latin-script words when they are the brand, not a stray mark beside a name in another script: all its
 * letters are Latin, or the Latin ones are at least three and at least half of them ("WELLNESS（ウェルネス）" gives
 * "WELLNESS"; "ピュリナ ONE" and "ロイヤルカナン JP" give nothing). Empty when there are none.
 */
export function latinBrand(brand: string): string {
  const latin = searchableBrand(brand);
  const letters = (t: string) => [...t].filter((c) => /\p{L}/u.test(c)).length;
  const all = letters(brand.replace(/\p{So}/gu, ' ').normalize('NFKC'));
  const kept = letters(latin);
  if (!kept) return '';
  if (kept === all) return latin;
  return kept >= 3 && kept * 2 >= all ? latin : '';
}

/** Lower-case words of a brand's Latin form, for comparing brands written differently ("WELLNESS（ウェルネス）", "Wellness"). */
const brandWords = (brand: string) =>
  latinBrand(brand)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/**
 * Whether `candidate` names the brand `original` names, as much or more precisely: the original's Latin words are, as
 * whole words, among the candidate's ("WELLNESS（ウェルネス）" → "Wellness" or "Wellness CORE"). A parent company or
 * another brand does not ("Fancy Feast（…）" → "Purina"; "Purina Pro Plan（…）" → "Purina"), nor anything when the
 * original has no Latin words.
 */
export function brandCovers(original: string | null | undefined, candidate: string | null | undefined): boolean {
  const x = brandWords(original ?? '');
  const y = brandWords(candidate ?? '');
  return !!x && !!y && ` ${y} `.includes(` ${x} `);
}
