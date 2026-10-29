// Curated ingredient notes. Conservative by design:
//  - "concern" only where a regulatory or veterinary toxicology source documents harm for that species;
//  - "caution" where harm depends on an amount the label does not state;
//  - no penalties for grains, by-products, unfamiliar names or synthetic nutrients (WSAVA: ingredient
//    lists alone do not establish food quality);
//  - human-only evidence is not translated into cat/dog claims.
// Every URL is checked by the live link check (test/live/contract.test.ts, run on GitHub). Entries are drafts until a
// veterinary reviewer signs them off (reviewStatus).
import { containsTerm, type ParsedIngredient } from './ingredients';
import { ingredientRole } from './roles';
import type { IngredientNote, Species } from './types';

export const KB_VERSION = 'kb-2026-10-28-draft';

export type KbStatus = 'concern' | 'caution' | 'info' | 'positive';

interface KbSource {
  title: string;
  url: string;
}

interface KbEntry {
  id: string;
  terms: string[];
  exclude?: string[];
  status: Partial<Record<Species, KbStatus>>;
  note: Partial<Record<Species | 'both', string>>;
  sources: KbSource[];
  reviewStatus: 'draft' | 'vet_reviewed';
}

const SRC = {
  cfrPropyleneGlycol: { title: '21 CFR 589.1001 — Propylene glycol in or on cat food (eCFR)', url: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-E/part-589/subpart-B/section-589.1001' },
  fdaXylitol: { title: "FDA: Paws Off Xylitol; It's Dangerous for Dogs", url: 'https://www.fda.gov/consumers/consumer-updates/paws-xylitol-its-dangerous-dogs' },
  aspcaPeopleFoods: { title: 'ASPCA Animal Poison Control: People foods to avoid feeding your pets', url: 'https://www.aspca.org/pet-care/aspca-poison-control/people-foods-avoid-feeding-your-pets' },
  fdaLabels: { title: 'FDA: Animal Food Labeling and Pet Food Claims', url: 'https://www.fda.gov/animal-veterinary/animal-food-feeds/animal-food-labeling-and-pet-food-claims' },
  fdaDcm: { title: 'FDA: Investigation into potential link between certain diets and canine dilated cardiomyopathy', url: 'https://www.fda.gov/animal-veterinary/outbreaks-and-advisories/fda-investigation-potential-link-between-certain-diets-and-canine-dilated-cardiomyopathy' },
} satisfies Record<string, KbSource>;

const ENTRIES: KbEntry[] = [
  {
    id: 'propylene_glycol',
    terms: ['propylene glycol'],
    status: { cat: 'concern', dog: 'info' },
    note: {
      cat: 'U.S. regulations prohibit propylene glycol in or on cat food because it affects cats’ red blood cells.',
      dog: 'A humectant used to keep soft products moist; it is permitted in dog food. The cat-food prohibition does not apply to dogs.',
    },
    sources: [SRC.cfrPropyleneGlycol],
    reviewStatus: 'draft',
  },
  {
    id: 'xylitol',
    terms: ['xylitol', 'birch sugar'],
    status: { dog: 'concern' },
    note: { dog: 'Xylitol is toxic to dogs; even small amounts can cause a dangerous drop in blood sugar.' },
    sources: [SRC.fdaXylitol],
    reviewStatus: 'draft',
  },
  {
    id: 'grapes_raisins',
    terms: ['grape', 'grapes', 'raisin', 'raisins'],
    exclude: ['grape seed extract', 'grapeseed extract', 'grapeseed oil', 'grape seed oil'],
    status: { dog: 'concern' },
    note: { dog: 'Grapes and raisins can cause kidney injury in dogs; the toxic amount is unpredictable.' },
    sources: [SRC.aspcaPeopleFoods],
    reviewStatus: 'draft',
  },
  {
    id: 'onion',
    terms: ['onion', 'onions', 'onion powder', 'dehydrated onion', 'chives', 'leek', 'leeks'],
    status: { dog: 'concern', cat: 'concern' },
    note: { both: 'Onions and related Allium plants can damage red blood cells in dogs and cats.' },
    sources: [SRC.aspcaPeopleFoods],
    reviewStatus: 'draft',
  },
  {
    id: 'garlic',
    terms: ['garlic', 'garlic powder', 'garlic oil', 'dehydrated garlic'],
    status: { dog: 'caution', cat: 'caution' },
    note: {
      both: 'Garlic is an Allium; large amounts can damage red blood cells and cats are more sensitive than dogs. The amount in this product is not stated on the label.',
    },
    sources: [SRC.aspcaPeopleFoods],
    reviewStatus: 'draft',
  },
  {
    id: 'chocolate',
    terms: ['chocolate', 'cocoa', 'cacao', 'theobromine'],
    exclude: ['cocoa butter'],
    status: { dog: 'concern', cat: 'concern' },
    note: { both: 'Chocolate and cocoa contain methylxanthines that are toxic to dogs and cats.' },
    sources: [SRC.aspcaPeopleFoods],
    reviewStatus: 'draft',
  },
  {
    id: 'macadamia',
    terms: ['macadamia', 'macadamia nuts'],
    status: { dog: 'concern' },
    note: { dog: 'Macadamia nuts can cause weakness, vomiting and tremors in dogs.' },
    sources: [SRC.aspcaPeopleFoods],
    reviewStatus: 'draft',
  },
  {
    id: 'caffeine',
    terms: ['caffeine', 'coffee', 'guarana'],
    status: { dog: 'concern', cat: 'concern' },
    note: { both: 'Caffeine is a methylxanthine that is toxic to dogs and cats.' },
    sources: [SRC.aspcaPeopleFoods],
    reviewStatus: 'draft',
  },
  // Neutral explanations of common label terms (no score effect).
  {
    id: 'taurine',
    terms: ['taurine'],
    status: { cat: 'positive', dog: 'info' },
    note: {
      cat: 'An amino acid cats must get from their food; it is added to complete cat foods.',
      dog: 'An amino acid dogs can usually make themselves; some foods add it.',
    },
    sources: [SRC.fdaLabels],
    reviewStatus: 'draft',
  },
  {
    id: 'meal',
    terms: ['chicken meal', 'turkey meal', 'lamb meal', 'beef meal', 'fish meal', 'salmon meal', 'duck meal', 'poultry meal', 'meat meal', 'menhaden fish meal', 'herring meal', 'whitefish meal'],
    status: { cat: 'info', dog: 'info' },
    note: { both: 'A "meal" is rendered, dried and ground animal tissue, a concentrated protein source. The name alone says nothing about quality.' },
    sources: [SRC.fdaLabels],
    reviewStatus: 'draft',
  },
  {
    id: 'by_products',
    terms: ['by-products', 'by products', 'by-product meal', 'byproducts', 'animal derivatives', 'meat and animal derivatives'],
    status: { cat: 'info', dog: 'info' },
    note: { both: 'By-products are parts other than muscle meat, such as organs. They are a permitted ingredient and are not a sign of poor quality by themselves.' },
    sources: [SRC.fdaLabels],
    reviewStatus: 'draft',
  },
  {
    id: 'natural_flavor',
    terms: ['natural flavor', 'natural flavors', 'natural flavour', 'natural flavours', 'animal digest', 'digest'],
    status: { cat: 'info', dog: 'info' },
    note: { both: 'A flavouring whose exact source is not disclosed on the label. If your pet has a protein allergy, ask the manufacturer what it is made from.' },
    sources: [SRC.fdaLabels],
    reviewStatus: 'draft',
  },
  {
    id: 'mixed_tocopherols',
    terms: ['mixed tocopherols', 'tocopherols', 'rosemary extract'],
    status: { cat: 'info', dog: 'info' },
    note: { both: 'Used as a preservative to keep fats from going rancid.' },
    sources: [SRC.fdaLabels],
    reviewStatus: 'draft',
  },
  {
    id: 'pulses',
    terms: ['peas', 'pea protein', 'pea fiber', 'pea starch', 'lentils', 'chickpeas', 'pea', 'lentil', 'chickpea', 'legumes', 'pulses'],
    status: { dog: 'info' },
    note: {
      dog: 'The FDA investigated reports of heart disease (DCM) in dogs eating diets high in peas, lentils or other pulses; no causal link was established. Ask your veterinarian if this concerns you.',
    },
    sources: [SRC.fdaDcm],
    reviewStatus: 'draft',
  },
];

const SEVERITY: Record<IngredientNote['status'], number> = { concern: 4, caution: 3, info: 1, positive: 1, unknown: 0 };

function entryFor(ing: ParsedIngredient): KbEntry | undefined {
  const texts = [ing.normalized, ...ing.subIngredients];
  let best: KbEntry | undefined;
  let bestLen = 0;
  for (const e of ENTRIES) {
    for (const text of texts) {
      if (e.exclude?.some((x) => containsTerm(text, x))) continue;
      for (const term of e.terms) {
        if (containsTerm(text, term) && term.length > bestLen) {
          best = e;
          bestLen = term.length;
        }
      }
    }
  }
  return best;
}

/**
 * Notes per ingredient for the product's species. For products whose species is unknown or both,
 * the most severe status across cats and dogs is used and the note says which species it applies to.
 */
export function ingredientNotes(ingredients: ParsedIngredient[], species: Species[]): IngredientNote[] {
  return ingredients.map((ing): IngredientNote => {
    const role = ingredientRole(ing.name);
    const withRole = (n: IngredientNote): IngredientNote => (role ? { ...n, role, roleSource: 'curated' } : n);
    const entry = entryFor(ing);
    if (!entry) {
      return withRole({ name: ing.name, position: ing.position, status: 'unknown', note: 'Not yet reviewed by Purrbi. Unknown is not the same as harmful.', explanationKind: 'none' });
    }
    let status: IngredientNote['status'] = 'unknown';
    let note = '';
    let forSpecies: Species | null = null;
    for (const s of species) {
      const st = entry.status[s];
      if (!st) continue;
      if (SEVERITY[st] > SEVERITY[status]) {
        status = st;
        note = entry.note[s] ?? entry.note.both ?? '';
        forSpecies = s;
      }
    }
    if (status === 'unknown') {
      return withRole({ name: ing.name, position: ing.position, status: 'unknown', note: 'Not yet reviewed by Purrbi for this species.', explanationKind: 'none' });
    }
    if (species.length > 1 && forSpecies && (status === 'concern' || status === 'caution') && !entry.status[species.find((x) => x !== forSpecies)!]) {
      note = `${note} (Applies to ${forSpecies}s.)`;
    }
    const concernFor = species.filter((s) => entry.status[s] === 'concern' || entry.status[s] === 'caution');
    return withRole({ name: ing.name, position: ing.position, status, note, kbId: entry.id, ...(concernFor.length ? { concernFor } : {}), sourceUrl: entry.sources[0]?.url, sourceTitle: entry.sources[0]?.title, explanationKind: 'curated' });
  });
}

export function kbSourceUrls(): string[] {
  return [...new Set(ENTRIES.flatMap((e) => e.sources.map((s) => s.url)))];
}
