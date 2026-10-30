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

// A named vitamin or mineral blend, shown as one group whose items are assessed one by one.
const BLEND_WORD = String.raw`(?:(?:trace|chelated|essential|added)\s+)?(?:vitamins?|minerals?|vitamines?|vitaminas|vitaminen|mineraux|sels mineraux|mineralstoffe|minerales|minerali|sali minerali|mineralen|minerais|oligo-?elements|oligoelementos|oligoelementi|spurenelemente|trace elements)`;
const BLEND_HEAD = new RegExp(String.raw`^${BLEND_WORD}(?:(?:\s+(?:and|et|und|y|e|en)\s+|\s*[&/+-]\s*)${BLEND_WORD})?(?:\s+(?:premix|pre-mix|supplements?|supplement blend|blend|mix))?$`);
// Bracketed descriptions, not ingredients: "(preserved with mixed tocopherols)", "(a source of vitamin C)".
const QUALIFIER_LEAD = /^(?:(?:naturally\s+)?preserved\b|(?:an?\s+)?(?:natural\s+)?(?:preservatives?|antioxidants?)\b|(?:an?\s+)?(?:natural\s+)?sources?\s+of\b|used\s+(?:as|for|to)\b|added\s+(?:as|for|to)\b|as\s+an?\b|for\s+(?:freshness|flavou?r|colou?r)\b|to\s+(?:preserve|maintain|keep)\b|conserv|konserv)/;
const PERCENT_ONLY = /^(?:(?:min(?:imum)?|max(?:imum)?|ca|approx|at least|mindestens|au moins)\.?\s*)?\d+(?:[.,]\d+)?\s*%$/i;
const CONJUNCTION = /^(?:and|&|et|und)\s+(?=\S)/i; // "…, and salt": the last item, not "and salt"

const CLOSER_OF: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
const isOpener = (ch: string) => ch === '(' || ch === '[' || ch === '{';
const isCloser = (ch: string) => ch === ')' || ch === ']' || ch === '}';
const isSeparator = (ch: string) => ch === ',' || ch === ';';
const clean = (s: string) => s.replace(/\s+/g, ' ').trim().replace(/^[\s.,;:]+|[\s.,;:]+$/g, '');
const clip = (s: string) => {
  const t = clean(s);
  return t.length > 40 ? `${t.slice(0, 39)}…` : t;
};
const tail = (s: string) => {
  const t = clean(s);
  return t.length > 40 ? `…${t.slice(-39)}` : t;
};
/** Text outside complete brackets: "Chicken Fat (preserved with …)" → "Chicken Fat". */
const outsideBrackets = (s: string) => {
  let t = s;
  for (let prev = ''; prev !== t; ) [prev, t] = [t, t.replace(/[([{][^()[\]{}]*[)\]}]/g, ' ')];
  return t;
};

/** A head that names a vitamin or mineral blend: "Vitamins", "Trace minerals", "Vitamin premix", "Vitamines et minéraux". */
function isBlendHead(head: string): boolean {
  return BLEND_HEAD.test(normalizeIngredientName(outsideBrackets(head)).replace(CONJUNCTION, ''));
}

/** A character of the list; `at` is its index in the printed text (-1 when a repair added it). A stray closer is a ghost: in labelText only. */
interface Tok {
  ch: string;
  at: number;
  ghost?: boolean;
}

interface Opening {
  at: number;
  ch: string;
  parent: number; // index in the openings list, -1 at the top level
  sep: number; // the separator before this opening's item at its own level, -1 when it is the first item
  firstSep: number; // the first separator inside it at its own level, -1 when none
  head: string; // the item's text before the bracket
}

/**
 * The list's characters with every bracket closed exactly once (`notes` records each repair):
 *  - a closer closes the innermost bracket; one that matches a deeper bracket closes those above it first;
 *  - a closer with nothing open is ignored;
 *  - a bracket the label never closes: a blend's list ends where another blend begins at its own level
 *    ("Vitamins [ …, Choline Chloride, Minerals [ … ]"), anything else at the end of the list. A label whose
 *    brackets balance is read as printed, even when it nests one blend in another;
 *  - an unclosed description ("(source of vitamin D, Niacin …") ends at its first comma, so it takes no item with it.
 */
function repairBrackets(text: string, notes: string[]): Tok[] {
  const opens: Opening[] = [];
  const stack: number[] = [];
  const itemStart = [0];
  const sepAt = [-1];
  const closes = new Map<number, { opener: number; before: number[] }>();
  const stray = new Set<number>();
  const inserts = new Map<number, string[]>(); // closers added before the character at this index, innermost first
  const insert = (at: number, o: Opening) => inserts.set(at, [...(inserts.get(at) ?? []), CLOSER_OF[o.ch]]);
  const named = (o: Opening) => `"${o.head ? `${o.head} ` : ''}${o.ch}"`;
  const description = (o: Opening) => o.firstSep >= 0 && QUALIFIER_LEAD.test(normalizeIngredientName(text.slice(o.at + 1, o.firstSep)));
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const depth = stack.length;
    if (isOpener(ch)) {
      opens.push({ at: i, ch, parent: depth ? stack[depth - 1] : -1, sep: sepAt[depth], firstSep: -1, head: clip(outsideBrackets(text.slice(itemStart[depth], i))) });
      stack.push(opens.length - 1);
      itemStart[depth + 1] = i + 1;
      sepAt[depth + 1] = -1;
    } else if (isCloser(ch)) {
      if (!depth) {
        stray.add(i);
        notes.push(i ? `Ignored a stray "${ch}" after "${tail(text.slice(0, i))}".` : `Ignored a stray "${ch}" at the start.`);
        continue;
      }
      let k = depth - 1;
      while (k >= 0 && CLOSER_OF[opens[stack[k]].ch] !== ch) k--;
      if (k < 0) {
        const opener = stack.pop()!;
        notes.push(`${named(opens[opener])} was closed by "${ch}"; read as one bracket.`);
        closes.set(i, { opener, before: [] });
      } else {
        const before: number[] = [];
        for (const b of stack.splice(k + 1).reverse()) {
          // innermost first
          if (description(opens[b])) {
            insert(opens[b].firstSep, opens[b]);
            notes.push(`${named(opens[b])} was not closed; closed it at its first comma.`);
          } else {
            before.push(b);
            notes.push(`${named(opens[b])} was not closed; closed it before "${ch}".`);
          }
        }
        closes.set(i, { opener: stack.pop()!, before });
      }
    } else if (isSeparator(ch)) {
      sepAt[depth] = i;
      itemStart[depth] = i + 1;
      if (depth && opens[stack[depth - 1]].firstSep < 0) opens[stack[depth - 1]].firstSep = i;
    }
  }

  const closeAt = new Map<number, number>();
  for (const u of stack) {
    // outermost first: an inner bracket closes no later than the bracket around it
    const o = opens[u];
    const nested = isBlendHead(o.head) ? opens.find((x, j) => j > u && x.parent === u && x.sep > o.at && isBlendHead(x.head)) : undefined;
    let at = description(o) ? o.firstSep : nested ? nested.sep : text.length;
    let outer: Opening | undefined;
    for (const [v, vAt] of closeAt) {
      if (vAt > o.at && vAt < at) [at, outer] = [vAt, opens[v]];
    }
    closeAt.set(u, at);
    if (outer) notes.push(`${named(o)} was not closed; closed it with ${named(outer)}.`);
    else if (at === o.firstSep) notes.push(`${named(o)} was not closed; closed it at its first comma.`);
    else if (nested) notes.push(`${named(o)} was not closed; closed it before "${nested.head}" (a blend inside another blend's brackets).`);
    else notes.push(`${named(o)} was not closed; closed it at the end of the list.`);
  }
  for (const u of [...stack].reverse()) insert(closeAt.get(u)!, opens[u]);

  const toks: Tok[] = [];
  for (let i = 0; i <= text.length; i++) {
    for (const c of inserts.get(i) ?? []) toks.push({ ch: c, at: -1 });
    if (i === text.length) break;
    const close = closes.get(i);
    if (stray.has(i)) toks.push({ ch: text[i], at: i, ghost: true });
    else if (close) {
      for (const b of close.before) toks.push({ ch: CLOSER_OF[opens[b].ch], at: -1 });
      toks.push({ ch: CLOSER_OF[opens[close.opener].ch], at: i }); // a mismatched closer is read as its bracket's own
    } else toks.push({ ch: text[i], at: i });
  }
  return toks;
}

function textOf(toks: Tok[], from: number, to: number): string {
  let s = '';
  for (let i = from; i < to; i++) if (!toks[i].ghost) s += toks[i].ch;
  return s;
}

/** The printed text a token range came from (stray closers included, added closers not). */
function printed(text: string, toks: Tok[], from: number, to: number): string {
  let a = -1;
  let b = -1;
  for (let i = from; i < to; i++) {
    if (toks[i].at < 0) continue;
    if (a < 0) a = toks[i].at;
    b = toks[i].at;
  }
  return a < 0 ? '' : text.slice(a, b + 1).trim();
}

/** Ranges of the items at the outer level of toks[from, to), split on commas and semicolons. */
function splitItems(toks: Tok[], from: number, to: number): [number, number][] {
  const out: [number, number][] = [];
  let depth = 0;
  let start = from;
  for (let i = from; i < to; i++) {
    const t = toks[i];
    if (t.ghost) continue;
    if (isOpener(t.ch)) depth++;
    else if (isCloser(t.ch)) depth--;
    else if (!depth && isSeparator(t.ch)) {
      out.push([start, i]);
      start = i + 1;
    }
  }
  out.push([start, to]);
  return out;
}

/** The outer brackets of toks[from, to), as [opener, closer] indices. */
function outerBrackets(toks: Tok[], from: number, to: number): [number, number][] {
  const out: [number, number][] = [];
  let depth = 0;
  let open = -1;
  for (let i = from; i < to; i++) {
    const t = toks[i];
    if (t.ghost) continue;
    if (isOpener(t.ch) && depth++ === 0) open = i;
    else if (isCloser(t.ch) && --depth === 0) out.push([open, i]);
  }
  return out;
}

/** Without surrounding spaces and punctuation, or a leading "and". */
function trimItem(toks: Tok[], from: number, to: number): [number, number] {
  const edge = (t: Tok) => !t.ghost && /[\s.,;:]/.test(t.ch);
  while (from < to && edge(toks[from])) from++;
  while (to > from && edge(toks[to - 1])) to--;
  const m = CONJUNCTION.exec(textOf(toks, from, Math.min(to, from + 8)));
  if (m && m[0].length < textOf(toks, from, to).length) {
    for (let n = m[0].length; n > 0 && from < to; from++) if (!toks[from].ghost) n--;
    while (from < to && edge(toks[from])) from++;
  }
  return [from, to];
}

function entryOf(text: string, toks: Tok[], from: number, to: number, position: number): ParsedIngredient | null {
  const brackets = outerBrackets(toks, from, to);
  const without = (skip: [number, number][]) => {
    let s = '';
    let k = from;
    for (const [o, c] of skip) {
      s += `${textOf(toks, k, o)} `;
      k = c + 1;
    }
    return clean(`${s}${textOf(toks, k, to)}`);
  };
  const head = without(brackets);
  const blend = isBlendHead(head);
  const lists: [number, number][] = [];
  const children: IngredientChild[] = [];
  const qualifiers: string[] = [];
  const subIngredients: string[] = [];
  for (const [o, c] of brackets) {
    subIngredients.push(...textOf(toks, o + 1, c).split(/[,;]/).map(normalizeIngredientName).filter(Boolean));
    const items = splitItems(toks, o + 1, c)
      .map(([s, e]) => clean(textOf(toks, ...trimItem(toks, s, e))))
      .filter((t) => normalizeIngredientName(t) && !PERCENT_ONLY.test(t));
    if (!items.length) continue; // "(26%)" stays in the name
    // A list needs a head to belong to ("Minerals (Zinc, Iron)"); one item is a description ("(Vitamin K)"), unless the head is a blend.
    if (normalizeIngredientName(head) && !QUALIFIER_LEAD.test(normalizeIngredientName(items[0])) && (blend || items.length >= 2)) {
      lists.push([o, c]);
      for (const name of items) children.push({ name, normalized: normalizeIngredientName(name), index: children.length + 1 });
    } else qualifiers.push(items.join(', '));
  }
  const name = clean(without(lists).replace(/\(\s*\)|\[\s*\]|\{\s*\}/g, ' '));
  const normalized = normalizeIngredientName(name);
  if (!normalized) return null;
  return {
    name,
    labelText: printed(text, toks, from, to),
    normalized,
    position,
    subIngredients,
    kind: lists.length ? (blend ? 'group' : 'compound') : 'single',
    children,
    qualifiers,
  };
}

/**
 * The label's entries in order, and the formatting repairs made to read them (for traceability). Malformed
 * brackets never lose or duplicate an ingredient: every printed item ends up in exactly one entry or child.
 */
export function parseIngredientListWithNotes(text: string | null | undefined, maxItems = 150): { ingredients: ParsedIngredient[]; notes: string[] } {
  const notes: string[] = [];
  if (!text) return { ingredients: [], notes };
  const cleaned = text.replace(LEADING_LABEL, '').replace(/\s+/g, ' ').trim().replace(/\.\s*$/, '');
  if (!cleaned) return { ingredients: [], notes };
  const toks = repairBrackets(cleaned, notes);
  const ingredients: ParsedIngredient[] = [];
  for (const [s, e] of splitItems(toks, 0, toks.length)) {
    const entry = entryOf(cleaned, toks, ...trimItem(toks, s, e), ingredients.length + 1);
    if (!entry) continue;
    ingredients.push(entry);
    if (ingredients.length >= maxItems) break;
  }
  return { ingredients, notes };
}

export function parseIngredientList(text: string | null | undefined, maxItems = 150): ParsedIngredient[] {
  return parseIngredientListWithNotes(text, maxItems).ingredients;
}

/** Whole-word / phrase containment on normalized text. */
export function containsTerm(normalizedText: string, term: string): boolean {
  const t = normalizeIngredientName(term);
  if (!t) return false;
  const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}(s|es)?($|[^a-z0-9])`).test(normalizedText);
}
