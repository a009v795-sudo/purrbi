// What an ingredient does in a pet food, in plain words (curated, deterministic). Informational only:
// a role never changes the score, and no ingredient is counted as "good" or "bad".
// The most specific match wins (e.g. "chicken fat" is a fat source, "chicken" a protein source).
import { normalizeIngredientName } from './ingredients';

const ROLES: { role: string; terms: string[] }[] = [
  { role: 'Preservative', terms: ['mixed tocopherols', 'tocopherols', 'rosemary extract', 'citric acid', 'bha', 'bht', 'ethoxyquin', 'potassium sorbate', 'sodium nitrite', 'propyl gallate'] },
  { role: 'Probiotic', terms: ['fermentation product', 'lactobacillus', 'bacillus', 'enterococcus', 'bifidobacterium', 'probiotic'] },
  { role: 'Fat source', terms: ['chicken fat', 'poultry fat', 'beef fat', 'pork fat', 'animal fat', 'fish oil', 'salmon oil', 'sunflower oil', 'canola oil', 'flaxseed oil', 'coconut oil', 'vegetable oil', 'soybean oil', 'olive oil', 'tallow', 'lard', 'oils and fats', 'fat'] },
  { role: 'Fibre source', terms: ['beet pulp', 'cellulose', 'pumpkin', 'psyllium', 'inulin', 'chicory', 'fructooligosaccharides', 'pea fiber', 'pea fibre', 'tomato pomace', 'apple pomace', 'flaxseed', 'fibre', 'fiber'] },
  { role: 'Vitamin or mineral', terms: ['vitamin', 'mineral', 'zinc', 'iron', 'copper', 'manganese', 'selenium', 'iodate', 'iodide', 'proteinate', 'chelate', 'choline chloride', 'calcium carbonate', 'dicalcium phosphate', 'calcium phosphate', 'potassium chloride', 'sodium selenite', 'biotin', 'folic acid', 'niacin', 'riboflavin', 'thiamine', 'pyridoxine', 'menadione', 'pantothenate', 'cobalamin', 'salt', 'sodium chloride'] },
  { role: 'Amino acid (nutrient)', terms: ['taurine', 'methionine', 'lysine', 'carnitine', 'arginine', 'tryptophan'] },
  { role: 'Flavour', terms: ['natural flavor', 'natural flavour', 'animal digest', 'digest', 'yeast extract', 'flavor', 'flavour', 'palatant', 'garlic'] },
  { role: 'Plant material (not specified)', terms: ['vegetable by-products', 'vegetable by products', 'vegetable derivatives', 'derivatives of vegetable origin'] },
  { role: 'Thickener or binder', terms: ['guar gum', 'xanthan gum', 'carrageenan', 'cassia gum', 'agar', 'locust bean gum', 'gelatin', 'gelatine', 'modified starch'] },
  { role: 'Humectant or sweetener', terms: ['glycerin', 'glycerine', 'glycerol', 'propylene glycol', 'sugar', 'molasses', 'corn syrup', 'honey', 'sorbitol', 'caramel'] },
  { role: 'Colour', terms: ['iron oxide', 'titanium dioxide', 'caramel color', 'red 40', 'yellow 5', 'yellow 6', 'blue 2', 'colorant', 'colourant', 'colour', 'color'] },
  { role: 'Protein source', terms: ['protein', 'pea protein', 'potato protein', 'soy protein', 'corn gluten meal', 'wheat gluten', 'meal', 'by-product', 'by-products', 'derivatives', 'chicken', 'turkey', 'beef', 'lamb', 'duck', 'salmon', 'tuna', 'whitefish', 'fish', 'egg', 'liver', 'heart', 'meat', 'poultry', 'venison', 'rabbit', 'pork', 'herring', 'menhaden', 'sardine', 'mackerel', 'krill', 'cod', 'trout', 'bison', 'quail', 'poulet', 'boeuf', 'saumon'] },
  { role: 'Carbohydrate source', terms: ['brown rice', 'rice', 'barley', 'oatmeal', 'oats', 'corn', 'maize', 'wheat', 'sweet potatoes', 'sweet potato', 'potatoes', 'potato', 'peas', 'pea', 'chickpeas', 'garbanzo beans', 'lentils', 'beans', 'tapioca', 'sorghum', 'millet', 'quinoa', 'cereals', 'starch', 'flour'] },
  { role: 'Fruit or vegetable', terms: ['carrots', 'carrot', 'cranberries', 'blueberries', 'apples', 'apple', 'spinach', 'kale', 'broccoli', 'parsley', 'vegetables', 'fruit', 'berries', 'tomato'] },
];

const has = (text: string, term: string) => new RegExp(`(^|[^a-z])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`).test(text);

/** The ingredient's role, or null when it is not in Purrbi's role list. */
export function ingredientRole(name: string): string | null {
  // The ingredient itself, not what it is preserved with: "chicken fat (preserved with mixed tocopherols)".
  const text = normalizeIngredientName(name).toLowerCase().replace(/\(.*?\)|\[.*?\]/g, ' ').replace(/\s+/g, ' ').trim();
  let best: { role: string; len: number } | null = null;
  for (const r of ROLES) {
    for (const t of r.terms) {
      if (has(text, t) && (!best || t.length > best.len)) best = { role: r.role, len: t.length };
    }
  }
  return best?.role ?? null;
}
