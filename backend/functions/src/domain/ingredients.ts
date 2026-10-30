// Ingredient lists keep label order: position 1 is the first ingredient printed.

export interface IngredientChild {
  name: string; // as printed
  normalized: string;
  index: number; // 1-based within its group
}

export interface ParsedIngredient {
  name: string; // as printed, trimmed; a group's bracketed list is in children, not here
  labelText: string; // the entry exactly as printed, brackets included (traceability)
  normalized: string; // lowercase, no accents, no percentages or footnote marks
  position: number; // 1-based
  subIngredients: string[]; // normalized contents of parentheses/brackets
  /** single: one ingredient; group: a named blend ("Vitamins [ … ]", "Minerals ( … )"); compound: an ingredient made of listed ingredients. */
  kind: 'single' | 'group' | 'compound';
  children: IngredientChild[];
  /** Descriptions in parentheses that are not ingredients: "preserved with mixed tocopherols", "Vitamin K". */
  qualifiers: string[];
}

const LEADING_LABEL = /^\s*(ingredients?|composition|ingr[ée]dients|zutaten|ingredientes)\s*[:：-]\s*/i;

export function normalizeIngredientName(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\(?\s*\d+(?:[.,]\d+)?\s*%\s*\)?/g, ' ')
    .replace(/[*†‡§]+/g, ' ')
    .replace(/[“”"']/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^[\s.,;:]+|[\s.,;:]+$/g, '')
    .trim();
}

/** Splits on commas/semicolons that are not inside (), [] or {}. */
function splitTopLevel(text: string): { item: string; inner: string[] }[] {
  const out: { item: string; inner: string[] }[] = [];
  let depth = 0;
  let current = '';
  let innerBuf = '';
  let inner: string[] = [];
  for (const ch of text) {
    if ('([{'.includes(ch)) {
      depth++;
      current += ch;
      if (depth === 1) {
        innerBuf = '';
        continue;
      }
    } else if (')]}'.includes(ch)) {
      depth = Math.max(0, depth - 1);
      current += ch;
      if (depth === 0) {
        inner.push(innerBuf);
        innerBuf = '';
        continue;
      }
    } else if ((ch === ',' || ch === ';') && depth === 0) {
      out.push({ item: current, inner });
      current = '';
      inner = [];
      continue;
    } else {
      current += ch;
    }
    if (depth >= 1) innerBuf += ch;
  }
  if (current.trim()) out.push({ item: current, inner });
  return out;
}

export function parseIngredientList(text: string | null | undefined, maxItems = 150): ParsedIngredient[] {
  if (!text) return [];
  const cleaned = text.replace(LEADING_LABEL, '').replace(/\s+/g, ' ').trim().replace(/\.\s*$/, '');
  if (!cleaned) return [];
  const parts = splitTopLevel(cleaned);
  const result: ParsedIngredient[] = [];
  for (const part of parts) {
    const name = part.item.trim().replace(/^[.,;:\s]+|[.,;:\s]+$/g, '');
    const normalized = normalizeIngredientName(name);
    if (!normalized) continue;
    const subIngredients = part.inner
      .flatMap((s) => s.split(/[,;]/))
      .map(normalizeIngredientName)
      .filter(Boolean);
    result.push({ name, labelText: name, normalized, position: result.length + 1, subIngredients, kind: 'single', children: [], qualifiers: [] });
    if (result.length >= maxItems) break;
  }
  return result;
}

/** Whole-word / phrase containment on normalized text. */
export function containsTerm(normalizedText: string, term: string): boolean {
  const t = normalizeIngredientName(term);
  if (!t) return false;
  const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}(s|es)?($|[^a-z0-9])`).test(normalizedText);
}
