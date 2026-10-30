import { describe, expect, it } from 'vitest';
import { normalizeIngredientName, parseIngredientList, parseIngredientListWithNotes, type ParsedIngredient } from '../../src/domain/ingredients';
import { ingredientRole } from '../../src/domain/roles';

// Real manufacturer and retailer lists (Wellness). The manufacturer's copy, from its page's image alt text,
// never closes "Vitamins [": the "]" after Sodium Selenite closes "Minerals [".
const WELLNESS_TUNA =
  'Tuna, Tuna Broth, Water Sufficient for Processing, Mackerel, Salmon, Tapioca Starch, Sunflower Oil, Natural Flavor, Guar Gum, Tricalcium Phosphate, Taurine, Magnesium Sulfate, Vitamins [Vitamin E Supplement, Thiamine Hydrochloride, Niacin, Vitamin A Supplement, Pyridoxine Hydrochloride, d-Calcium Pantothenate, Riboflavin Supplement, Folic Acid, Vitamin D3 Supplement, Biotin, Vitamin B12 Supplement, Potassium Chloride, Choline Chloride, Minerals [Zinc Amino Acid Chelate, Iron Amino Acid Chelate, Manganese Amino Acid Chelate, Copper Amino Acid Chelate, Potassium Iodide, Sodium Selenite], Menadione Sodium Bisulfite Complex (Vitamin K).';
const WELLNESS_TUNA_RETAILER = WELLNESS_TUNA.replace('Choline Chloride, Minerals [', 'Choline Chloride], Minerals [');
const WELLNESS_GRAVIES =
  'Chicken Broth, Water Sufficient For Processing, Chicken, Potato Starch, Turkey, Eggs, Chicken Liver, Carrots, Natural Flavor, Salt, Guar Gum, Tricalcium Phosphate, Potassium Chloride, Taurine, Magnesium Sulfate, Vitamins [Vitamin E Supplement, Thiamine Hydrochloride, Niacin, Vitamin A Supplement, Pyridoxine Hydrochloride, d-Calcium Pantothenate, Riboflavin Supplement, Folic Acid, Vitamin D3 Supplement, Biotin, Vitamin B12 Supplement], Cranberries, Blueberries, White Sweet Potatoes, Xanthan Gum, Choline Chloride, Zinc Amino Acid Chelate, Iron Amino Acid Chelate, Manganese Amino Acid Chelate, Copper Amino Acid Chelate, Potassium Iodide, Sodium Selenite.';

/** Every item printed, as normalized names: split on commas and brackets, without a leading "and". */
const printedItems = (text: string) =>
  text
    .split(/[,;()[\]{}]/)
    .map((x) => normalizeIngredientName(x.replace(/^\s*(?:and|&)\s+/i, '')))
    .filter(Boolean)
    .sort();
/** The same, from what the parser returned: each entry's name and its children's names. */
const parsedItems = (list: ParsedIngredient[]) => list.flatMap((i) => [i.name, ...i.children.map((c) => c.name)]).flatMap(printedItems).sort();
const words = (s: string) => (normalizeIngredientName(s).match(/[a-z0-9]+/g) ?? []).sort();

describe('ingredient list parser', () => {
  it('reads the manufacturer’s malformed Wellness list as 15 entries: a blend inside an open blend closes it first', () => {
    const { ingredients: list, notes } = parseIngredientListWithNotes(WELLNESS_TUNA);
    expect(list).toHaveLength(15);
    expect(list.map((i) => i.name)).toEqual([
      'Tuna', 'Tuna Broth', 'Water Sufficient for Processing', 'Mackerel', 'Salmon', 'Tapioca Starch', 'Sunflower Oil', 'Natural Flavor', 'Guar Gum',
      'Tricalcium Phosphate', 'Taurine', 'Magnesium Sulfate', 'Vitamins', 'Minerals', 'Menadione Sodium Bisulfite Complex (Vitamin K)',
    ]);
    expect(list.map((i) => i.position)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
    const [vitamins, minerals, menadione] = list.slice(12);
    expect(vitamins).toMatchObject({ kind: 'group', normalized: 'vitamins', qualifiers: [] });
    expect(vitamins.children).toHaveLength(13);
    expect(vitamins.children[0]).toEqual({ name: 'Vitamin E Supplement', normalized: 'vitamin e supplement', index: 1 });
    expect(vitamins.children[12]).toEqual({ name: 'Choline Chloride', normalized: 'choline chloride', index: 13 });
    expect(vitamins.labelText).toBe('Vitamins [Vitamin E Supplement, Thiamine Hydrochloride, Niacin, Vitamin A Supplement, Pyridoxine Hydrochloride, d-Calcium Pantothenate, Riboflavin Supplement, Folic Acid, Vitamin D3 Supplement, Biotin, Vitamin B12 Supplement, Potassium Chloride, Choline Chloride'); // as printed: never closed
    expect(minerals).toMatchObject({ kind: 'group', labelText: 'Minerals [Zinc Amino Acid Chelate, Iron Amino Acid Chelate, Manganese Amino Acid Chelate, Copper Amino Acid Chelate, Potassium Iodide, Sodium Selenite]' });
    expect(minerals.children.map((c) => c.name)).toEqual(['Zinc Amino Acid Chelate', 'Iron Amino Acid Chelate', 'Manganese Amino Acid Chelate', 'Copper Amino Acid Chelate', 'Potassium Iodide', 'Sodium Selenite']);
    expect(menadione).toMatchObject({ kind: 'single', qualifiers: ['Vitamin K'], subIngredients: ['vitamin k'], children: [] });
    expect(notes).toEqual(['"Vitamins [" was not closed; closed it before "Minerals" (a blend inside another blend\'s brackets).']);
    expect(parsedItems(list)).toEqual(printedItems(WELLNESS_TUNA)); // nothing lost or duplicated
    expect(vitamins.subIngredients).toHaveLength(13); // allergen matching and the curated list still see every item
  });

  it('reads the retailer’s well-formed copy of the same list the same way, with nothing to repair', () => {
    const repaired = parseIngredientList(WELLNESS_TUNA);
    const { ingredients: list, notes } = parseIngredientListWithNotes(WELLNESS_TUNA_RETAILER);
    expect(notes).toEqual([]);
    const shape = (l: ParsedIngredient[]) => l.map(({ name, normalized, kind, children, qualifiers, position }) => ({ name, normalized, kind, children, qualifiers, position }));
    expect(shape(list)).toEqual(shape(repaired));
    expect(list[12].labelText.endsWith('Choline Chloride]')).toBe(true);
    expect(parsedItems(list)).toEqual(printedItems(WELLNESS_TUNA_RETAILER));
  });

  it('reads the Wellness gravies list: 27 entries, one vitamin blend of 11', () => {
    const { ingredients: list, notes } = parseIngredientListWithNotes(WELLNESS_GRAVIES);
    expect(notes).toEqual([]);
    expect(list).toHaveLength(27);
    expect(list.filter((i) => i.kind !== 'single').map((i) => [i.position, i.name, i.kind, i.children.length])).toEqual([[16, 'Vitamins', 'group', 11]]);
    expect(list[16].name).toBe('Cranberries');
    expect(list[26]).toMatchObject({ name: 'Sodium Selenite', position: 27 }); // the trailing period is not part of it
    expect(parsedItems(list)).toEqual(printedItems(WELLNESS_GRAVIES));
  });

  it('keeps a single-item description in the name as a qualifier', () => {
    const [fat] = parseIngredientList('Chicken Fat (preserved with mixed tocopherols), Rice');
    expect(fat).toMatchObject({ kind: 'single', name: 'Chicken Fat (preserved with mixed tocopherols)', labelText: 'Chicken Fat (preserved with mixed tocopherols)', qualifiers: ['preserved with mixed tocopherols'], subIngredients: ['preserved with mixed tocopherols'], children: [] });
    const [c] = parseIngredientList('Ascorbic Acid (a source of vitamin C), Rosemary Extract (natural preservative)');
    expect(c.qualifiers).toEqual(['a source of vitamin C']);
    // A description with a comma is still one description, not a list of ingredients.
    expect(parseIngredientList('Fish Oil (preserved with mixed tocopherols, citric acid)')[0]).toMatchObject({ kind: 'single', qualifiers: ['preserved with mixed tocopherols, citric acid'] });
  });

  it('reads a named mineral blend in parentheses as a group, and an ingredient made of others as a compound', () => {
    const [minerals, broth, cheese] = parseIngredientList('Minerals (Zinc Proteinate, Iron Proteinate), Chicken Broth (Water, Chicken), Cheese (Milk, Salt, Enzymes)');
    expect(minerals).toMatchObject({ kind: 'group', name: 'Minerals', labelText: 'Minerals (Zinc Proteinate, Iron Proteinate)', subIngredients: ['zinc proteinate', 'iron proteinate'] });
    expect(minerals.children).toEqual([
      { name: 'Zinc Proteinate', normalized: 'zinc proteinate', index: 1 },
      { name: 'Iron Proteinate', normalized: 'iron proteinate', index: 2 },
    ]);
    expect(broth).toMatchObject({ kind: 'compound', name: 'Chicken Broth', normalized: 'chicken broth', subIngredients: ['water', 'chicken'] });
    expect(cheese.children.map((c) => c.name)).toEqual(['Milk', 'Salt', 'Enzymes']);
    // EU blend words, and one item is still a list under a blend head
    expect(parseIngredientList('Vitamines (vitamine A, vitamine D3), Mineralstoffe (Zink), Trace Minerals [Zinc Proteinate]').map((i) => [i.kind, i.children.length])).toEqual([['group', 2], ['group', 1], ['group', 1]]);
    // "Vitamin E (dl-alpha tocopheryl acetate)" is one vitamin, not a blend
    expect(parseIngredientList('Vitamin E (dl-alpha tocopheryl acetate)')[0]).toMatchObject({ kind: 'single', qualifiers: ['dl-alpha tocopheryl acetate'] });
  });

  it('keeps EU percentages in the name and label text but not in the normalized form, and never as a qualifier', () => {
    const [poulet, riz] = parseIngredientList('Composition: Poulet (26%), Riz');
    expect(poulet).toMatchObject({ name: 'Poulet (26%)', labelText: 'Poulet (26%)', normalized: 'poulet', qualifiers: [], children: [], kind: 'single', subIngredients: [] });
    expect(riz).toMatchObject({ name: 'Riz', position: 2 });
    expect(parseIngredientList('Viandes et sous-produits animaux (poulet 4%, boeuf 2%)')[0]).toMatchObject({ kind: 'compound', name: 'Viandes et sous-produits animaux' });
  });

  it('keeps nested parentheses inside a blend item in that item’s name', () => {
    const [v, t] = parseIngredientList('Vitamins [Vitamin D3 Supplement (source of vitamin D), Niacin, Biotin], Taurine');
    expect(v.children.map((c) => c.name)).toEqual(['Vitamin D3 Supplement (source of vitamin D)', 'Niacin', 'Biotin']);
    expect(v.subIngredients).toEqual(['vitamin d3 supplement (source of vitamin d)', 'niacin', 'biotin']); // as before
    expect(t.name).toBe('Taurine');
  });

  it('ignores a stray closer without losing the item it follows', () => {
    const { ingredients: list, notes } = parseIngredientListWithNotes('Chicken, Rice), Salt');
    expect(list.map((i) => [i.name, i.labelText])).toEqual([['Chicken', 'Chicken'], ['Rice', 'Rice)'], ['Salt', 'Salt']]);
    expect(notes).toEqual(['Ignored a stray ")" after "Chicken, Rice".']);
  });

  it('reads "[" closed by ")" as one bracket, and closes a description left open inside a blend at its first comma', () => {
    const a = parseIngredientListWithNotes('Vitamins [Vitamin E Supplement, Niacin), Taurine');
    expect(a.ingredients.map((i) => [i.name, i.children.length])).toEqual([['Vitamins', 2], ['Taurine', 0]]);
    expect(a.notes).toEqual(['"Vitamins [" was closed by ")"; read as one bracket.']);
    const b = parseIngredientListWithNotes('Vitamins [Vitamin D3 Supplement (source of vitamin D, Niacin], Taurine');
    expect(b.ingredients[0].children.map((c) => c.name)).toEqual(['Vitamin D3 Supplement (source of vitamin D)', 'Niacin']);
    expect(b.ingredients[1].name).toBe('Taurine');
    expect(b.notes).toEqual(['"Vitamin D3 Supplement (" was not closed; closed it at its first comma.']);
  });

  it('closes a bracket left open at the end of the list, and two open blends one after the other', () => {
    // Not a blend: it ends at its first comma and takes no later entry with it.
    const a = parseIngredientListWithNotes('Chicken, Chicken Broth (Water, Chicken');
    expect(a.ingredients.map((i) => i.name)).toEqual(['Chicken', 'Chicken Broth (Water)', 'Chicken']);
    expect(a.notes).toEqual(['"Chicken Broth (" was not closed; closed it at its first comma.']);
    const b = parseIngredientListWithNotes('Vitamins [Niacin, Biotin, Minerals [Zinc Oxide, Iron Oxide');
    expect(b.ingredients.map((i) => [i.name, i.children.map((c) => c.name)])).toEqual([['Vitamins', ['Niacin', 'Biotin']], ['Minerals', ['Zinc Oxide', 'Iron Oxide']]]);
    expect(b.notes).toHaveLength(2);
  });

  it('reads balanced brackets as printed, even a blend nested inside a blend', () => {
    const { ingredients: list, notes } = parseIngredientListWithNotes('Vitamins and Minerals [Vitamins (Niacin, Biotin), Minerals (Zinc, Iron)], Taurine');
    expect(notes).toEqual([]);
    expect(list.map((i) => [i.name, i.kind, i.children.map((c) => c.name)])).toEqual([
      ['Vitamins and Minerals', 'group', ['Vitamins (Niacin, Biotin)', 'Minerals (Zinc, Iron)']],
      ['Taurine', 'single', []],
    ]);
  });

  it('drops a trailing period and the "and" before the last item, losing nothing', () => {
    expect(parseIngredientList('Chicken, Rice, and Salt.').map((i) => i.name)).toEqual(['Chicken', 'Rice', 'Salt']);
    expect(parseIngredientList('Vitamins (Niacin, Biotin, and Folic Acid).')[0].children.map((c) => c.name)).toEqual(['Niacin', 'Biotin', 'Folic Acid']);
    expect(parseIngredientList('Meat and Animal Derivatives, Oils and Fats').map((i) => i.name)).toEqual(['Meat and Animal Derivatives', 'Oils and Fats']); // "and" inside a name stays
  });

  it('keeps maxItems for label entries (a blend’s items are not entries)', () => {
    const list = parseIngredientList(WELLNESS_TUNA, 13);
    expect(list).toHaveLength(13);
    expect(list[12]).toMatchObject({ name: 'Vitamins', kind: 'group' });
    expect(list[12].children).toHaveLength(13);
  });

  it('never loses or duplicates an item, however the brackets are broken (3 seeds × 300 variants)', () => {
    for (const seed of [1, 7, 42]) {
      let s = seed;
      const random = () => {
        // mulberry32: deterministic
        s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
      for (let n = 0; n < 300; n++) {
        let text = WELLNESS_TUNA;
        for (let k = 1 + Math.floor(random() * 4); k > 0; k--) {
          const brackets = [...text.matchAll(/[()[\]]/g)].map((m) => m.index);
          if (random() < 0.4 && brackets.length) {
            const at = brackets[Math.floor(random() * brackets.length)];
            text = text.slice(0, at) + text.slice(at + 1);
          } else {
            // only next to a space or comma, so no word is split in two
            const gaps = [...text.matchAll(/[ ,]/g)].map((m) => m.index);
            const at = gaps[Math.floor(random() * gaps.length)];
            text = text.slice(0, at) + '()[]'[Math.floor(random() * 4)] + text.slice(at);
          }
        }
        const list = parseIngredientList(text);
        expect(words(list.flatMap((i) => [i.name, ...i.children.map((c) => c.name)]).join(' ')), text).toEqual(words(text));
        expect(list.map((i) => i.position)).toEqual(list.map((_, i) => i + 1));
        for (const i of list) {
          expect(text.replace(/\s+/g, ' ')).toContain(i.labelText);
          if (i.kind !== 'single') expect(i.children.length).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe('ingredient roles: from what the ingredient is, not a meat or fish word in its name', () => {
  const cases: [string, string][] = [
    ['Tuna Broth', 'Broth (moisture and flavour)'],
    ['Chicken Broth', 'Broth (moisture and flavour)'],
    ['Bone Broth', 'Broth (moisture and flavour)'],
    ['Fish Stock', 'Broth (moisture and flavour)'],
    ['Water', 'Water (processing)'],
    ['Water Sufficient for Processing', 'Water (processing)'],
    ['Chicken Fat', 'Fat source'],
    ['Chicken Fat (preserved with mixed tocopherols)', 'Fat source'],
    ['Salmon Oil', 'Fat source'],
    ['Sunflower Oil', 'Fat source'],
    ['Chicken Meal', 'Protein source'],
    ['Pea Protein', 'Protein source'],
    ['Dried Beet Pulp', 'Fibre source'],
    ['Rice Flour', 'Carbohydrate source'],
    ['Tapioca Starch', 'Carbohydrate source'],
    ['Potato Starch', 'Carbohydrate source'],
    ['Vitamin E Supplement', 'Vitamin or mineral'],
    ['Vitamin D3 Supplement', 'Vitamin or mineral'],
    ['Vitamin B12 Supplement', 'Vitamin or mineral'],
    ['Riboflavin Supplement', 'Vitamin or mineral'],
    ['Zinc Amino Acid Chelate', 'Vitamin or mineral'],
    ['Iron Amino Acid Chelate', 'Vitamin or mineral'],
    ['Manganese Amino Acid Chelate', 'Vitamin or mineral'],
    ['Copper Amino Acid Chelate', 'Vitamin or mineral'],
    ['Zinc Proteinate', 'Vitamin or mineral'],
    ['Tricalcium Phosphate', 'Vitamin or mineral'],
    ['Magnesium Sulfate', 'Vitamin or mineral'],
    ['Potassium Chloride', 'Vitamin or mineral'],
    ['Potassium Iodide', 'Vitamin or mineral'],
    ['Sodium Selenite', 'Vitamin or mineral'],
    ['Salt', 'Vitamin or mineral'],
    ['Choline Chloride', 'Vitamin or mineral'],
    ['Menadione Sodium Bisulfite Complex (Vitamin K)', 'Vitamin or mineral'],
    ['Vitamins', 'Vitamin or mineral'],
    ['Minerals', 'Vitamin or mineral'],
    ['Taurine', 'Amino acid (nutrient)'],
    ['Natural Flavor', 'Flavour'],
    ['Chicken Flavor', 'Flavour'],
    ['Guar Gum', 'Thickener or binder'],
    ['Xanthan Gum', 'Thickener or binder'],
    ['Eggs', 'Protein source'],
    ['Chicken Liver', 'Protein source'],
    ['Cranberries', 'Fruit or vegetable'],
    ['Blueberries', 'Fruit or vegetable'],
    ['Carrots', 'Fruit or vegetable'],
    ['White Sweet Potatoes', 'Carbohydrate source'],
    // Romance languages put the head first
    ['Huile de saumon', 'Fat source'],
    ['Protéines de volaille déshydratées', 'Protein source'],
    ['Pulpe de betterave déshydratée', 'Fibre source'],
  ];
  it.each(cases)('%s → %s', (name, role) => {
    expect(ingredientRole(name)).toBe(role);
  });
  it('still knows nothing about what is not in the table', () => {
    expect(ingredientRole('Yucca Schidigera Extract')).toBeNull();
    expect(ingredientRole('')).toBeNull();
  });
});

describe('review of the ingredient parser (2026-10-30)', () => {
  const names = (text: string) => parseIngredientList(text).map((i) => i.name);
  const kids = (text: string) => parseIngredientList(text).map((i) => [i.name, i.children.map((c) => c.name)]);
  it('an unclosed bracket that is not a blend takes no later entry with it', () => {
    expect(names('Chicken, Rice, Thiamine Mononitrate (Vitamin B1, Garlic Powder, Chicken Fat, Salt')).toEqual(['Chicken', 'Rice', 'Thiamine Mononitrate (Vitamin B1)', 'Garlic Powder', 'Chicken Fat', 'Salt']);
    expect(names('Deboned Chicken, Chicken Meal (dehydrated, Peas, Potatoes, Chicken Fat, Salt')).toEqual(['Deboned Chicken', 'Chicken Meal (dehydrated)', 'Peas', 'Potatoes', 'Chicken Fat', 'Salt']);
    // Inside a blend: the item's chemical name ends at its comma, so the blend keeps all its items.
    expect(kids('Vitamins [Vitamin E Supplement (dl-alpha tocopheryl acetate, Niacin, Biotin, Thiamine Mononitrate], Taurine')).toEqual([
      ['Vitamins', ['Vitamin E Supplement (dl-alpha tocopheryl acetate)', 'Niacin', 'Biotin', 'Thiamine Mononitrate']], ['Taurine', []],
    ]);
  });
  it('a comma inside a number is part of the number', () => {
    expect(parseIngredientList('Poulet (26%), Riz, Huile de saumon 1,5%, Pulpe de betterave').map((i) => i.labelText)).toEqual(['Poulet (26%)', 'Riz', 'Huile de saumon 1,5%', 'Pulpe de betterave']);
    expect(names('Chicken, Vitamin A 15,000 IU, Vitamin D3 1,500 IU')).toEqual(['Chicken', 'Vitamin A 15,000 IU', 'Vitamin D3 1,500 IU']);
    expect(parseIngredientList('Fleisch und tierische Nebenerzeugnisse (davon 4,5% Huhn), Getreide')[0]).toMatchObject({ kind: 'single', qualifiers: ['davon 4,5% Huhn'] });
    expect(names('Vitamin D3,Zinc Oxide')).toEqual(['Vitamin D3', 'Zinc Oxide']);
  });
  it('a section after a full stop starts its own entry; a footnote is a note, not part of the last entry', () => {
    const de = parseIngredientList('Fleisch, Getreide, Mineralstoffe, Zucker. Zusatzstoffe: Ernährungsphysiologische Zusatzstoffe: Vitamin A 1.500 IE, Vitamin D3 200 IE');
    expect(de.map((i) => i.name)).toContain('Zucker');
    expect(de.find((i) => i.children.some((c) => c.name.startsWith('Vitamin A')))?.children.map((c) => c.name)).toEqual(['Vitamin A 1.500 IE', 'Vitamin D3 200 IE']);
    const foot = parseIngredientListWithNotes('Chicken, Chicken Fat. *Preserved with mixed tocopherols');
    expect(foot.ingredients.map((i) => i.name)).toEqual(['Chicken', 'Chicken Fat']);
    expect(foot.notes).toContain('Footnote: *Preserved with mixed tocopherols');
    expect(names('Chicken, Rice, Salt. *Organic')).toEqual(['Chicken', 'Rice', 'Salt']);
    expect(names('Chicken, B. subtilis, Rice')).toEqual(['Chicken', 'B. subtilis', 'Rice']); // not every full stop
  });
  it('a blend written with a colon is one group', () => {
    expect(kids('Chicken, Rice, Minerals: Zinc Sulfate, Ferrous Sulfate, Copper Sulfate, Taurine')).toEqual([
      ['Chicken', []], ['Rice', []], ['Minerals', ['Zinc Sulfate', 'Ferrous Sulfate', 'Copper Sulfate', 'Taurine']],
    ]);
    expect(kids('Chicken, Rice, Vitamins: Vitamin E, Niacin, Biotin; Minerals: Zinc Oxide, Iron Sulfate')).toEqual([
      ['Chicken', []], ['Rice', []], ['Vitamins', ['Vitamin E', 'Niacin', 'Biotin']], ['Minerals', ['Zinc Oxide', 'Iron Sulfate']],
    ]);
    expect(parseIngredientList('Chicken, Minerals: Zinc Sulfate, Iron Sulfate')[1].labelText).toBe('Minerals: Zinc Sulfate, Iron Sulfate'); // as printed
  });
  it('blend shorthand names its nutrients, and "and" joins two of them', () => {
    expect(kids('Chicken, Vitamins (A, D3, E, K3), Minerals (Zn, Fe)')).toEqual([
      ['Chicken', []], ['Vitamins', ['Vitamin A', 'Vitamin D3', 'Vitamin E', 'Vitamin K3']], ['Minerals', ['Zinc', 'Iron']],
    ]);
    expect(kids('Vitamins (Niacin, Biotin and Folic Acid), Minerals (Zinc, Iron & Copper)')).toEqual([['Vitamins', ['Niacin', 'Biotin', 'Folic Acid']], ['Minerals', ['Zinc', 'Iron', 'Copper']]]);
    expect(parseIngredientList('Vitamins (A, D3)')[0].children[0]).toMatchObject({ name: 'Vitamin A', printed: 'A' });
    expect(names('Meat and Animal Derivatives, Rice')).toEqual(['Meat and Animal Derivatives', 'Rice']); // "and" outside a blend stays
  });
  it('descriptors in brackets describe the ingredient', () => {
    expect(parseIngredientList('Chicken (Fresh, Deboned), Rice (Brown, White), Salmon').map((i) => [i.name, i.kind])).toEqual([['Chicken (Fresh, Deboned)', 'single'], ['Rice (Brown, White)', 'single'], ['Salmon', 'single']]);
  });
  it('a crafted list cannot slow the parser down (it was cubic)', () => {
    for (const text of ['Chicken ' + '. '.repeat(1250) + 'x' + ')'.repeat(2500), 'x ' + '. '.repeat(1250) + 'y' + ' (b)'.repeat(625), '('.repeat(1000) + 'a' + ')'.repeat(1000) + ' (b)'.repeat(750), 'a, '.repeat(4000)]) {
      const t0 = performance.now();
      parseIngredientListWithNotes(text);
      expect(performance.now() - t0).toBeLessThan(300);
    }
  });
});
