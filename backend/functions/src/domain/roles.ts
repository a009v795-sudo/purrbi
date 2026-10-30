// What an ingredient does in a pet food, in plain words (curated, deterministic). Informational only:
// a role never changes the score, and no ingredient is counted as "good" or "bad".
// The role comes from what the ingredient is, not from a meat or fish word in its name: the head of the
// name decides ("tuna broth" is a broth, "chicken fat" a fat source, "chicken meal" a protein source).
// English puts the head last; French, Spanish, Italian and Portuguese put it first ("huile de saumon" is an
// oil). Only when the head is not in the table does the longest listed term anywhere in the name decide.
import { normalizeIngredientName } from './ingredients';

const ROLES: { role: string; terms: string[] }[] = [
  { role: 'Preservative', terms: ['mixed tocopherols', 'tocopherols', 'rosemary extract', 'citric acid', 'bha', 'bht', 'ethoxyquin', 'potassium sorbate', 'sodium nitrite', 'propyl gallate', 'calcium propionate', 'propionic acid', 'sorbic acid', 'ascorbyl palmitate'] },
  { role: 'Probiotic', terms: ['fermentation product', 'lactobacillus', 'bacillus', 'enterococcus', 'bifidobacterium', 'probiotic'] },
  { role: 'Water (processing)', terms: ['water', 'water sufficient for processing', 'water for processing', 'eau', 'wasser', 'agua', 'acqua'] },
  { role: 'Broth (moisture and flavour)', terms: ['broth', 'stock', 'bone broth', 'bouillon', 'brühe', 'caldo', 'brodo'] },
  { role: 'Fat source', terms: ['graisses animales', 'graisse', 'huile', 'huiles et graisses', 'öle und fette', 'aceite', 'grasa', 'chicken fat', 'poultry fat', 'beef fat', 'pork fat', 'animal fat', 'fish oil', 'salmon oil', 'sunflower oil', 'canola oil', 'flaxseed oil', 'coconut oil', 'vegetable oil', 'soybean oil', 'olive oil', 'safflower oil', 'corn oil', 'rapeseed oil', 'linseed oil', 'palm oil', 'herring oil', 'pollock oil', 'menhaden fish oil', 'krill oil', 'tallow', 'lard', 'oils and fats', 'fat', 'oil'] },
  { role: 'Fibre source', terms: ['pulpe de betterave', 'cellulose', 'fibres végétales', 'rübenschnitzel', 'beet pulp', 'cellulose', 'pumpkin', 'psyllium', 'inulin', 'chicory', 'fructooligosaccharides', 'pea fiber', 'pea fibre', 'tomato pomace', 'apple pomace', 'flaxseed', 'fibre', 'fiber'] },
  { role: 'Vitamin or mineral', terms: ['minéraux', 'mineraux', 'mineralstoffe', 'minerales', 'vitamines', 'vitamine', 'sel', 'vitamin', 'mineral', 'zinc', 'iron', 'copper', 'manganese', 'selenium', 'iodate', 'iodide', 'proteinate', 'chelate', 'choline chloride', 'calcium carbonate', 'dicalcium phosphate', 'calcium phosphate', 'potassium chloride', 'sodium selenite', 'biotin', 'folic acid', 'niacin', 'riboflavin', 'thiamine', 'pyridoxine', 'menadione', 'pantothenate', 'cobalamin', 'salt', 'sodium chloride', 'tricalcium phosphate', 'monocalcium phosphate', 'phosphate', 'magnesium sulfate', 'magnesium oxide', 'magnesium', 'calcium', 'potassium', 'cobalt', 'ferrous', 'cupric', 'manganous', 'iodine', 'methionine complex', 'amino acid complex', 'ascorbic acid', 'ascorbyl', 'tocopheryl acetate', 'cholecalciferol', 'retinyl', 'cyanocobalamin', 'inositol', 'beta-carotene', 'thiamin', 'phylloquinone', 'dihydriodide'] },
  { role: 'Amino acid (nutrient)', terms: ['taurine', 'methionine', 'lysine', 'carnitine', 'arginine', 'tryptophan', 'threonine', 'leucine', 'isoleucine', 'valine', 'histidine', 'phenylalanine', 'cystine', 'glycine'] },
  { role: 'Flavour', terms: ['levures', 'levure', 'arômes', 'aromes', 'hefe', 'natural flavor', 'natural flavour', 'animal digest', 'digest', 'yeast extract', 'flavor', 'flavour', 'palatant', 'garlic', 'onion'] },
  { role: 'Plant material (not specified)', terms: ['vegetable by-products', 'vegetable by products', 'vegetable derivatives', 'derivatives of vegetable origin'] },
  { role: 'Thickener or binder', terms: ['guar gum', 'xanthan gum', 'carrageenan', 'cassia gum', 'agar', 'locust bean gum', 'gelatin', 'gelatine', 'modified starch', 'gum arabic', 'acacia gum', 'tara gum', 'carob bean gum', 'gum', 'sodium alginate', 'alginate', 'pectin', 'konjac'] },
  { role: 'Humectant or sweetener', terms: ['sucres', 'zucker', 'azúcar', 'glycérine', 'glycerin', 'glycerine', 'glycerol', 'propylene glycol', 'sugar', 'molasses', 'corn syrup', 'honey', 'sorbitol', 'caramel'] },
  { role: 'Colour', terms: ['iron oxide', 'titanium dioxide', 'caramel color', 'red 40', 'yellow 5', 'yellow 6', 'blue 2', 'colorant', 'colourant', 'colour', 'color'] },
  { role: 'Protein source', terms: ['volaille', 'viande', 'poisson', 'protéines', 'proteines', 'sous-produits', 'canard', 'dinde', 'agneau', 'thon', 'oeuf', 'foie', 'fleisch', 'geflügel', 'huhn', 'fisch', 'lachs', 'pollo', 'carne', 'pescado', 'salmón', 'gluten de blé', 'gluten de ble', 'farine de protéines de maïs', 'farine de soja', 'soja', 'protein', 'pea protein', 'potato protein', 'soy protein', 'soya', 'soy', 'corn gluten meal', 'wheat gluten', 'meal', 'by-product', 'by-products', 'derivatives', 'chicken', 'turkey', 'beef', 'lamb', 'duck', 'salmon', 'tuna', 'whitefish', 'fish', 'egg', 'liver', 'heart', 'meat', 'poultry', 'venison', 'rabbit', 'pork', 'herring', 'menhaden', 'sardine', 'mackerel', 'krill', 'cod', 'trout', 'bison', 'quail', 'poulet', 'boeuf', 'saumon', 'gizzard', 'tripe', 'kidney', 'lung', 'whiting', 'pollock', 'anchovy', 'tilapia', 'catfish', 'pilchard', 'shrimp', 'crab', 'mussel', 'goat', 'veal', 'goose', 'pheasant', 'kangaroo', 'boar', 'elk', 'deer'] },
  { role: 'Carbohydrate source', terms: ['blé', 'ble', 'maïs', 'mais', 'riz', 'orge', 'avoine', 'pommes de terre', 'céréales', 'cereales', 'weizen', 'reis', 'getreide', 'trigo', 'arroz', 'maíz', 'amidon', 'brown rice', 'rice', 'barley', 'oatmeal', 'oats', 'corn', 'maize', 'wheat', 'sweet potatoes', 'sweet potato', 'potatoes', 'potato', 'peas', 'pea', 'chickpeas', 'chickpea', 'garbanzo bean', 'lentils', 'lentil', 'bean', 'oat', 'tapioca', 'sorghum', 'millet', 'quinoa', 'cereals', 'starch', 'flour', 'corn meal', 'cornmeal', 'cassava', 'arrowroot', 'buckwheat', 'rye', 'spelt', 'yam', 'pois', 'lentilles', 'kartoffel', 'kartoffeln', 'erbsen', 'patata', 'patate', 'guisantes', 'lentejas'] },
  { role: 'Fruit or vegetable', terms: ['carrots', 'carrot', 'cranberries', 'blueberries', 'apples', 'apple', 'spinach', 'kale', 'broccoli', 'parsley', 'vegetables', 'fruit', 'berries', 'tomato', 'green bean', 'celery', 'zucchini', 'squash', 'banana', 'pear', 'cucumber', 'beet', 'beetroot', 'cranberry', 'blueberry', 'raspberries', 'strawberries'] },
];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Terms are matched as whole words, singular or plural ("egg" also matches "eggs"), on normalized text
// (so the accented terms match too).
const TABLE = ROLES.map((r) => ({
  role: r.role,
  terms: [...new Set(r.terms.map(normalizeIngredientName))].map((term) => ({ term, re: new RegExp(`(?:^|[^a-z])${escape(term)}(?:s|es)?(?=[^a-z]|$)`, 'g') })),
}));

// Words after the head that only describe it: "water sufficient for processing", "chicken fat preserved with mixed tocopherols".
const POSTMODIFIER = /\s(?:sufficient\s+for|for\s+processing|(?:naturally\s+)?preserved\s+(?:with|by|using)|(?:as\s+)?an?\s+source\s+of|source\s+of|added\s+for|used\s+as)\b.*$/;
// "Vitamin E supplement": the nutrient is what it is, "supplement" says only that it was added.
const SUPPLEMENT = /\s(?:supplements?|supplementation)$/;
// "huile de saumon", "proteines de volaille": the head comes before "de".
const ROMANCE_OF = /\s(?:de|du|des|di|del|della|dei|degli|da|do|dos)\s/;

export interface RoleMatch {
  role: string;
  term: string; // the listed term that decided it (normalized)
}

function longestTerm(text: string, atEnd: boolean): RoleMatch | null {
  let best: RoleMatch | null = null;
  for (const r of TABLE) {
    for (const t of r.terms) {
      for (const m of text.matchAll(t.re)) {
        if (atEnd && m.index + m[0].length !== text.length) continue;
        if (!best || t.term.length > best.term.length) best = { role: r.role, term: t.term };
      }
    }
  }
  return best;
}

/** The ingredient's role and the term that decided it, or null when it is not in Purrbi's role list. */
export function ingredientRoleMatch(name: string): RoleMatch | null {
  // The ingredient itself, not what it is preserved with or made of: "chicken fat (preserved with mixed tocopherols)".
  let text = normalizeIngredientName(name);
  for (let prev = ''; prev !== text; ) [prev, text] = [text, text.replace(/[([{][^()[\]{}]*[)\]}]/g, ' ')];
  text = text.replace(/[([{].*$/, ' ').replace(/[)\]}]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return null;
  const head = text.split(ROMANCE_OF)[0].replace(POSTMODIFIER, '').replace(SUPPLEMENT, '').trim();
  return (head && longestTerm(head, true)) || longestTerm(text, false);
}

/** The ingredient's role, or null when it is not in Purrbi's role list. */
export function ingredientRole(name: string): string | null {
  return ingredientRoleMatch(name)?.role ?? null;
}

/** A role written on a cited page, in the same words as the curated table where it says the same thing. */
export function normalizeRole(text: string): string {
  const t = text.toLowerCase();
  if (/preserv/.test(t)) return 'Preservative';
  if (/probiotic/.test(t)) return 'Probiotic';
  if (/\bfat\b|\boil\b/.test(t)) return 'Fat source';
  if (/fib(re|er)/.test(t)) return 'Fibre source';
  if (/vitamin|mineral|micronutrient|trace element/.test(t)) return 'Vitamin or mineral';
  if (/amino acid/.test(t)) return 'Amino acid (nutrient)';
  if (/flavo/.test(t)) return 'Flavour';
  if (/protein/.test(t)) return 'Protein source';
  if (/carbohydrate|starch|energy/.test(t)) return 'Carbohydrate source';
  if (/thicken|binder|gelling/.test(t)) return 'Thickener or binder';
  if (/colou?r/.test(t)) return 'Colour';
  const short = text.trim().replace(/\s+/g, ' ').slice(0, 40);
  return short.charAt(0).toUpperCase() + short.slice(1);
}
