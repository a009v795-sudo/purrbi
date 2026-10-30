// Ingredient lists keep label order: position 1 is the first ingredient printed.

export interface IngredientChild {
  name: string; // as printed (shorthand in a blend written out: "D3" → "Vitamin D3")
  normalized: string;
  index: number; // 1-based within its group
  printed?: string; // the shorthand as printed, when `name` writes it out
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
    .trim()
    .replace(/^[\s.,;:]+/, '')
    .replace(/[^\s.,;:][\s.,;:]+$/, (m) => m[0]) // (a trailing run trimmed in one pass: no backtracking on long runs)
    .trim();
}

// A named vitamin or mineral blend, shown as one group whose items are assessed one by one.
const BLEND_WORD = String.raw`(?:(?:trace|chelated|essential|added)\s+)?(?:vitamins?|minerals?|vitamines?|vitaminas|vitaminen|mineraux|sels mineraux|mineralstoffe|minerales|minerali|sali minerali|mineralen|minerais|oligo-?elements|oligoelementos|oligoelementi|spurenelemente|trace elements)`;
const BLEND_HEAD = new RegExp(String.raw`^${BLEND_WORD}(?:(?:\s+(?:and|et|und|y|e|en)\s+|\s*[&/+-]\s*)${BLEND_WORD})?(?:\s+(?:premix|pre-mix|supplements?|supplement blend|blend|mix))?$`);
// Bracketed descriptions, not ingredients: "(preserved with mixed tocopherols)", "(a source of vitamin C)".
const QUALIFIER_LEAD = /^(?:(?:naturally\s+)?preserved\b|(?:an?\s+)?(?:natural\s+)?(?:preservatives?|antioxidants?)\b|(?:an?\s+)?(?:natural\s+)?sources?\s+of\b|used\s+(?:as|for|to)\b|added\s+(?:as|for|to)\b|as\s+an?\b|for\s+(?:freshness|flavou?r|colou?r)\b|to\s+(?:preserve|maintain|keep)\b|conserv|konserv)/;
const PERCENT_ONLY = /^(?:(?:min(?:imum)?|max(?:imum)?|ca|approx|at least|mindestens|au moins)\.?\s*)?\d+(?:[.,]\d+)?\s*%$/i;
const CONJUNCTION = /^(?:and|&|et|und)\s+(?=\S)/i; // "…, and salt": the last item, not "and salt"

// Words that describe an ingredient rather than name another one: "Chicken (Fresh, Deboned)" is chicken.
const DESCRIPTOR =
  /^(?:fresh|deboned|boneless|skinless|dried|dehydrated|freeze[- ]dried|air[- ]dried|sun[- ]dried|raw|frozen|cooked|smoked|brown|white|whole|ground|organic|natural|wild(?:[- ]caught)?|farm[- ]raised|pasture[- ]raised|grass[- ]fed|free[- ]range|cage[- ]free|human[- ]grade|hydroly[sz]ed|non[- ]gmo|ocean[- ]caught|fillets?|minced|shredded|flaked|chopped|sliced|diced|mechanically separated|\d+(?:[.,]\d+)?\s*%)$/;
// Inside a vitamin or mineral blend, shorthand names the nutrient: "Vitamins (A, D3, E)", "Minerals (Zn, Fe)".
const VITAMIN_CODE = /^(?:a|b1|b2|b3|b5|b6|b7|b9|b12|c|d|d2|d3|e|k|k1|k2|k3)$/;
const ELEMENT: Record<string, string> = { zn: 'Zinc', fe: 'Iron', cu: 'Copper', mn: 'Manganese', se: 'Selenium', i: 'Iodine', co: 'Cobalt', ca: 'Calcium', mg: 'Magnesium', k: 'Potassium', p: 'Phosphorus', na: 'Sodium' };
const VITAMIN_BLEND = /^(?:(?:trace|chelated|essential|added)\s+)?(?:vitamins?|vitamines?|vitaminas|vitaminen)\b/;
const MINERAL_BLEND = /\b(?:minerals?|mineraux|mineralstoffe|minerales|minerali|mineralen|minerais|oligo-?elements|oligoelementos|oligoelementi|spurenelemente|trace elements)\b/;

/** A blend item as the nutrient it names: "D3" in a vitamin blend is "Vitamin D3", "Zn" in a mineral blend "Zinc". */
function blendItem(printedName: string, head: string): string {
  const n = normalizeIngredientName(printedName);
  const h = normalizeIngredientName(head);
  if (VITAMIN_BLEND.test(h) && VITAMIN_CODE.test(n)) return `Vitamin ${n.toUpperCase()}`;
  if (MINERAL_BLEND.test(h) && ELEMENT[n]) return ELEMENT[n];
  return printedName;
}

const CLOSER_OF: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
const isOpener = (ch: string) => ch === '(' || ch === '[' || ch === '{';
const isCloser = (ch: string) => ch === ')' || ch === ']' || ch === '}';
const isDigit = (ch: string | undefined) => !!ch && ch >= '0' && ch <= '9';
/** A comma between two digits is part of a number ("1,5 %", "15,000 IU"), not a separator; "D3,Zinc" still splits. */
const isSeparatorAt = (prev: string | undefined, ch: string, next: string | undefined) => ch === ';' || (ch === ',' && !(isDigit(prev) && isDigit(next)));
const EDGE = new Set([' ', '.', ',', ';', ':']);
const clean = (s: string) => {
  const t = s.replace(/\s+/g, ' ');
  let a = 0;
  let b = t.length;
  while (a < b && EDGE.has(t[a])) a++;
  while (b > a && EDGE.has(t[b - 1])) b--;
  return t.slice(a, b);
};
const clip = (s: string) => {
  const t = clean(s);
  return t.length > 40 ? `${t.slice(0, 39)}…` : t;
};
const tail = (s: string) => {
  const t = clean(s);
  return t.length > 40 ? `…${t.slice(-39)}` : t;
};
/** Text outside complete brackets: "Chicken Fat (preserved with …)" → "Chicken Fat" (one pass; an unclosed bracket's text stays). */
const outsideBrackets = (s: string) => {
  const out: string[] = [];
  const starts: number[] = [];
  for (const ch of s) {
    if (isOpener(ch)) {
      starts.push(out.length);
      out.push(ch);
    } else if (isCloser(ch) && starts.length) {
      out.length = starts.pop()!;
      out.push(' ');
    } else out.push(ch);
  }
  return out.join('');
};
/** Labels never nest brackets this deep; deeper ones are read as text (so a crafted list cannot slow the parser). */
const MAX_DEPTH = 12;
/** Longer lists are cut at their last separator before this length (with a note). */
const MAX_LIST_CHARS = 8000;

/** A head that names a vitamin or mineral blend: "Vitamins", "Trace minerals", "Vitamin premix", "Vitamines et minéraux". */
function isBlendHead(head: string): boolean {
  const h = normalizeIngredientName(outsideBrackets(head)).replace(CONJUNCTION, '');
  return BLEND_HEAD.test(h) || ADDITIVE_GROUP.test(h);
}
// An EU or UK additives section heading ("Zusatzstoffe", "Nutritional additives") lists its items as a group too.
const ADDITIVE_GROUP = /^(?:(?:additives|additifs|zusatzstoffe|aditivos|additivi|toevoegingsmiddelen)\s*:?\s*)?(?:nutritional additives|technological additives|zootechnical additives|ernahrungsphysiologische zusatzstoffe|additives|additifs|zusatzstoffe|aditivos|additivi|toevoegingsmiddelen|trace elements|spurenelemente)(?:\s*\([^)]{0,40}\))?$/;

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
function repairBrackets(text: string, notes: string[], virtual: { opens: Set<number>; closes: Set<number> } = { opens: new Set(), closes: new Set() }): Tok[] {
  const opens: Opening[] = [];
  const stack: number[] = [];
  const itemStart = [0];
  const sepAt = [-1];
  const closes = new Map<number, { opener: number; before: number[] }>();
  const stray = new Set<number>();
  const inserts = new Map<number, string[]>(); // closers added before the character at this index, innermost first
  const insert = (at: number, o: Opening) => inserts.set(at, [...(inserts.get(at) ?? []), CLOSER_OF[o.ch]]);
  const named = (o: Opening) => `"${o.head ? `${o.head} ` : ''}${o.ch}"`;
  // An unclosed bracket that is not a blend's list (a description, a vitamin's chemical name, a compound's
  // parts) ends at its first comma: it takes no later label entry with it. A blend's list runs on.
  const shortClose = (o: Opening) => o.firstSep >= 0 && (!isBlendHead(o.head) || QUALIFIER_LEAD.test(normalizeIngredientName(text.slice(o.at + 1, Math.min(o.firstSep, o.at + 200)))));
  const skipped = new Set<number>(); // openers past MAX_DEPTH (and their closers), read as text
  let tooDeep = 0;
  const virtualOpeners = new Set<number>(); // indices in `opens` of colon blends
  for (let i = 0; i <= text.length; i++) {
    // A colon blend ends here: anything still open inside it closes first (a description at its first comma).
    if (virtual.closes.has(i)) {
      const v = [...stack].reverse().find((u) => virtualOpeners.has(u));
      if (v !== undefined) {
        while (stack.length && stack[stack.length - 1] !== v) {
          const b = stack.pop()!;
          insert(shortClose(opens[b]) && opens[b].firstSep < i ? opens[b].firstSep : i, opens[b]);
          notes.push(`${named(opens[b])} was not closed; closed it ${shortClose(opens[b]) ? 'at its first comma' : `with "${opens[v].head}:"`}.`);
        }
        stack.pop();
        insert(i, opens[v]);
      }
    }
    if (i === text.length) break;
    const ch = text[i];
    const depth = stack.length;
    if (virtual.opens.has(i)) {
      opens.push({ at: i, ch: '[', parent: depth ? stack[depth - 1] : -1, sep: sepAt[depth], firstSep: -1, head: clip(outsideBrackets(text.slice(itemStart[depth], Math.min(i, itemStart[depth] + 400)))) });
      virtualOpeners.add(opens.length - 1);
      stack.push(opens.length - 1);
      itemStart[depth + 1] = i + 1;
      sepAt[depth + 1] = -1;
      continue;
    }
    if (isOpener(ch) && depth >= MAX_DEPTH) {
      skipped.add(i);
      tooDeep++;
      continue;
    }
    if (isCloser(ch) && tooDeep) {
      skipped.add(i);
      tooDeep--;
      continue;
    }
    if (isOpener(ch)) {
      opens.push({ at: i, ch, parent: depth ? stack[depth - 1] : -1, sep: sepAt[depth], firstSep: -1, head: clip(outsideBrackets(text.slice(itemStart[depth], Math.min(i, itemStart[depth] + 400)))) });
      stack.push(opens.length - 1);
      itemStart[depth + 1] = i + 1;
      sepAt[depth + 1] = -1;
    } else if (isCloser(ch)) {
      if (!depth) {
        stray.add(i);
        notes.push(i ? `Ignored a stray "${ch}" after "${tail(text.slice(Math.max(0, i - 120), i))}".` : `Ignored a stray "${ch}" at the start.`);
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
          if (shortClose(opens[b])) {
            insert(opens[b].firstSep, opens[b]);
            notes.push(`${named(opens[b])} was not closed; closed it at its first comma.`);
          } else {
            before.push(b);
            notes.push(`${named(opens[b])} was not closed; closed it before "${ch}".`);
          }
        }
        closes.set(i, { opener: stack.pop()!, before });
      }
    } else if (isSeparatorAt(text[i - 1], ch, text[i + 1])) {
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
    let at = shortClose(o) ? o.firstSep : nested ? nested.sep : text.length;
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
    if (skipped.has(i)) toks.push({ ch: ' ', at: i });
    else if (virtual.opens.has(i)) toks.push({ ch: '[', at: i }); // the colon, read as the blend's bracket
    else if (stray.has(i)) toks.push({ ch: text[i], at: i, ghost: true });
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
    else if (!depth && isSeparatorAt(toks[i - 1]?.ch, t.ch, toks[i + 1]?.ch)) {
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
    subIngredients.push(...textOf(toks, o + 1, c).split(/;|(?<!\d),|,(?!\d)/).map(normalizeIngredientName).filter(Boolean));
    let items = splitItems(toks, o + 1, c)
      .map(([s, e]) => clean(textOf(toks, ...trimItem(toks, s, e))))
      .filter((t) => normalizeIngredientName(t) && !PERCENT_ONLY.test(t));
    if (!items.length) continue; // "(26%)" stays in the name
    // A blend's items are single nutrients: "Biotin and Folic Acid" is two of them; shorthand names the nutrient.
    if (blend) items = items.flatMap((t) => (/\s(?:and|&)\s/i.test(t) && !/[([{]/.test(t) ? t.split(/\s+(?:and|&)\s+/i) : [t]));
    // A list needs a head to belong to ("Minerals (Zinc, Iron)"); one item is a description ("(Vitamin K)"),
    // unless the head is a blend; descriptions only ("(Fresh, Deboned)") describe the head.
    const describes = items.every((t) => DESCRIPTOR.test(normalizeIngredientName(t)));
    if (normalizeIngredientName(head) && !QUALIFIER_LEAD.test(normalizeIngredientName(items[0])) && (blend || (items.length >= 2 && !describes))) {
      lists.push([o, c]);
      for (const item of items) {
        const name = blend ? blendItem(item, head) : item;
        children.push({ name, normalized: normalizeIngredientName(name), index: children.length + 1, ...(name !== item ? { printed: item } : {}) });
      }
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

// EU and UK additive sections, and blend headings, that follow a full stop.
const SECTION_WORDS = String.raw`(?:additives|additifs|zusatzstoffe|aditivos|additivi|toevoegingsmiddelen|nutritional additives|technological additives|ernahrungsphysiologische zusatzstoffe|zootechnical additives|trace elements|spurenelemente|${BLEND_WORD})`;
const SECTION_AFTER_STOP = new RegExp(String.raw`\.\s+(${SECTION_WORDS}(?:\s*\([^)]{0,40}\))?\s*:)`, 'gi');
const COLON_HEAD = new RegExp(String.raw`^${SECTION_WORDS}(?:\s*\([^)]{0,40}\))?$`, 'i');
const ADDITIVE_HEAD = /additi|zusatzstoffe|toevoegingsmiddelen|aditivos/i;
// Blend items that are vitamins, minerals or amino acids: a colon blend ("Minerals: Zinc Sulfate, …") runs while its items are.
const NUTRIENT_ITEM =
  /\b(?:vitamins?|thiamine?|riboflavin|niacin|niacinamide|pantothen\w*|pyridoxine|biotin|folic|folate|cobalamin|cyanocobalamin|choline|menadione|tocopher\w*|retinyl|cholecalciferol|ascorb\w*|inositol|zinc|iron|ferrous|ferric|copper|cupric|manganese|manganous|selenium|selenite|iodide|iodate|iodine|potassium|calcium|magnesium|sodium|cobalt|chromium|sulfate|sulphate|oxide|chelate|proteinate|carbonate|phosphate|chloride|eddi|ethylenediamine|lysine|methionine|taurine|carnitine|[abcdek]\d{0,2}|zn|fe|cu|mn|se|co|ca|mg|iu|ie|ui|mg|mcg|µg)\b/i;
/**
 * Where a blend written with a colon ("Minerals: Zinc Sulfate, Ferrous Sulfate; …", "Zusatzstoffe: Vitamin A
 * 1.500 IE, …") opens (the colon) and closes (before the separator that ends it): its items run to the next
 * semicolon, the end of the list, or (for a vitamin or mineral heading) the first item that is not a nutrient.
 * Read as a bracketed blend; the printed text keeps its colon.
 */
function colonBlends(text: string): { opens: Set<number>; closes: Set<number> } {
  const opens = new Set<number>();
  const closes = new Set<number>();
  let depth = 0;
  let open = false;
  let additive = false;
  let headStart = 0;
  let lastOpen = -1;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (isOpener(ch)) depth++;
    else if (isCloser(ch) && depth) depth--;
    else if (!depth && ch === ':' && !open && COLON_HEAD.test(normalizeIngredientName(text.slice(headStart, i)))) {
      open = true;
      additive = ADDITIVE_HEAD.test(text.slice(headStart, i));
      opens.add(i);
      lastOpen = i;
    } else if (!depth && ch === ':' && open && !/[,;]/.test(text.slice(lastOpen + 1, i)) && COLON_HEAD.test(normalizeIngredientName(text.slice(lastOpen + 1, i)))) {
      // A heading under the heading ("Zusatzstoffe: Ernährungsphysiologische Zusatzstoffe: …"): the list starts after it.
      opens.delete(lastOpen);
      opens.add(i);
      lastOpen = i;
    } else if (!depth && isSeparatorAt(text[i - 1], ch, text[i + 1])) {
      const next = text.slice(i + 1, Math.min(text.length, i + 120)).split(/[,;]/)[0];
      if (open && (ch === ';' || (!additive && !NUTRIENT_ITEM.test(next)))) {
        closes.add(i);
        open = false;
      }
      headStart = i + 1;
    }
  }
  if (open) closes.add(text.length);
  return { opens, closes };
}

/**
 * The label's entries in order, and the formatting repairs made to read them (for traceability). Malformed
 * brackets never lose or duplicate an ingredient: every printed item ends up in exactly one entry or child.
 */
export function parseIngredientListWithNotes(text: string | null | undefined, maxItems = 150): { ingredients: ParsedIngredient[]; notes: string[] } {
  const notes: string[] = [];
  if (!text) return { ingredients: [], notes };
  let cleaned = text.replace(LEADING_LABEL, '').replace(/\s+/g, ' ').trim().replace(/\.\s*$/, '');
  if (cleaned.length > MAX_LIST_CHARS) {
    const cut = Math.max(cleaned.lastIndexOf(',', MAX_LIST_CHARS), cleaned.lastIndexOf(';', MAX_LIST_CHARS));
    cleaned = cleaned.slice(0, cut > 0 ? cut : MAX_LIST_CHARS);
    notes.push(`The list is longer than ${MAX_LIST_CHARS.toLocaleString('en-US')} characters; only its first part was read.`);
  }
  // A footnote after the list ("… Chicken Fat. *Preserved with mixed tocopherols") is a note, not part of the last entry.
  const foot = /\.\s+([*†‡§]+)\s*\S/.exec(cleaned);
  if (foot) {
    notes.push(`Footnote: ${clean(cleaned.slice(foot.index + 1))}`);
    cleaned = cleaned.slice(0, foot.index);
  }
  // A section after a full stop ("… Zucker. Zusatzstoffe: …") starts a new entry.
  cleaned = cleaned.replace(SECTION_AFTER_STOP, '; $1');
  if (!cleaned) return { ingredients: [], notes };
  const toks = repairBrackets(cleaned, notes, colonBlends(cleaned));
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
