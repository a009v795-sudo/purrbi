// Matches owner-reported allergies/sensitivities against the documented ingredient list.
// "not_listed" never means "safe": labels do not cover cross-contact or undisclosed sources.
import { containsTerm, type ParsedIngredient } from './ingredients';

export interface AllergenDef {
  label: string;
  contains: string[];
  possible: string[]; // ambiguous terms that may include this source
  exclude?: string[]; // look-alike terms that are not this source
}

const MEAT_AMBIGUOUS = [
  'meat',
  'meat meal',
  'meat by-products',
  'meat by products',
  'meat and animal derivatives',
  'derivatives of animal origin',
  'animal fat',
  'animal digest',
  'animal protein',
  'natural flavor',
  'natural flavour',
  'natural flavors',
  'gelatin',
  'digest',
];
const POULTRY_AMBIGUOUS = ['poultry', 'poultry meal', 'poultry fat', 'poultry by-product meal', 'poultry by products', 'poultry digest', 'fowl', ...MEAT_AMBIGUOUS];

export const ALLERGENS: Record<string, AllergenDef> = {
  chicken: { label: 'chicken', contains: ['chicken'], possible: POULTRY_AMBIGUOUS },
  turkey: { label: 'turkey', contains: ['turkey'], possible: POULTRY_AMBIGUOUS },
  duck: { label: 'duck', contains: ['duck'], possible: POULTRY_AMBIGUOUS },
  beef: { label: 'beef', contains: ['beef', 'bovine', 'veal', 'ox'], possible: [...MEAT_AMBIGUOUS, 'tallow'] },
  pork: { label: 'pork', contains: ['pork', 'porcine', 'bacon', 'ham', 'swine'], possible: MEAT_AMBIGUOUS },
  lamb: { label: 'lamb', contains: ['lamb', 'mutton', 'sheep'], possible: [...MEAT_AMBIGUOUS, 'tallow'] },
  fish: {
    label: 'fish',
    contains: ['fish', 'salmon', 'tuna', 'whitefish', 'white fish', 'herring', 'menhaden', 'anchovy', 'sardine', 'trout', 'cod', 'pollock', 'pollack', 'mackerel', 'whiting', 'tilapia', 'catfish', 'ocean fish', 'krill', 'haddock', 'hake', 'pilchard', 'sprat'],
    possible: ['marine', 'seafood', 'natural flavor', 'natural flavour', 'natural flavors', 'animal digest', 'animal fat'],
  },
  egg: { label: 'egg', contains: ['egg', 'eggs', 'egg product', 'dried egg product', 'whole egg', 'egg yolk', 'egg powder'], possible: ['derivatives of animal origin'] },
  dairy: {
    label: 'dairy',
    contains: ['milk', 'cheese', 'whey', 'casein', 'caseinate', 'lactose', 'yogurt', 'yoghurt', 'butter', 'cream', 'dairy', 'buttermilk', 'goat milk'],
    possible: ['derivatives of animal origin'],
    exclude: ['milk thistle', 'coconut milk', 'cocoa butter', 'shea butter', 'peanut butter', 'cream of tartar'],
  },
  wheat: { label: 'wheat', contains: ['wheat', 'wheat flour', 'wheat gluten', 'whole wheat', 'wheat germ', 'semolina', 'spelt', 'durum'], possible: ['cereals', 'cereal', 'grains', 'gluten'], exclude: ['corn gluten', 'corn gluten meal', 'rice gluten'] },
  corn: { label: 'corn', contains: ['corn', 'maize', 'corn gluten meal', 'cornmeal', 'corn starch', 'cornstarch', 'hominy'], possible: ['cereals', 'cereal', 'grains', 'vegetable protein extracts'] },
  soy: { label: 'soy', contains: ['soy', 'soya', 'soybean', 'soybeans', 'soybean meal', 'soy protein', 'soy flour', 'soybean oil', 'tofu'], possible: ['vegetable protein extracts', 'derivatives of vegetable origin', 'vegetable protein'] },
  rice: { label: 'rice', contains: ['rice', 'brewers rice', 'brown rice', 'rice flour', 'rice bran'], possible: ['cereals', 'cereal', 'grains'] },
  lentils_peas: { label: 'peas or lentils', contains: ['pea', 'peas', 'pea protein', 'pea fiber', 'pea starch', 'lentil', 'lentils', 'chickpea', 'chickpeas'], possible: ['legumes', 'pulses'] },
};

export function allergenLabel(key: string): string {
  return ALLERGENS[key]?.label ?? key;
}

export interface AllergenMatch {
  key: string;
  label: string;
  status: 'contains' | 'possible' | 'not_listed' | 'unknown';
  matches: string[]; // ingredient names as printed
}

function haystacks(ing: ParsedIngredient): string[] {
  return [ing.normalized, ...ing.subIngredients];
}

function excluded(text: string, def: AllergenDef | undefined): boolean {
  return !!def?.exclude?.some((x) => containsTerm(text, x));
}

export function matchAllergen(key: string, ingredients: ParsedIngredient[]): AllergenMatch {
  const def = ALLERGENS[key];
  const label = def?.label ?? key;
  if (!ingredients.length) return { key, label, status: 'unknown', matches: [] };
  const contains = def?.contains ?? [key];
  const possible = def?.possible ?? [];
  const hits: string[] = [];
  const maybes: string[] = [];
  for (const ing of ingredients) {
    for (const text of haystacks(ing)) {
      if (excluded(text, def)) continue;
      if (contains.some((t) => containsTerm(text, t))) {
        if (!hits.includes(ing.name)) hits.push(ing.name);
      } else if (possible.some((t) => containsTerm(text, t))) {
        if (!maybes.includes(ing.name)) maybes.push(ing.name);
      }
    }
  }
  if (hits.length) return { key, label, status: 'contains', matches: hits };
  if (maybes.length) return { key, label, status: 'possible', matches: maybes };
  return { key, label, status: 'not_listed', matches: [] };
}
