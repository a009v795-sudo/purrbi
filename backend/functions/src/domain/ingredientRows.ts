// One row per label entry, in label order: a colour, a one-line reason, and the details behind it (what it
// is → why it is used → benefits and risks → uncertainty → sources). Deterministic and offline: Purrbi's
// role table (roles.ts), its reviewed list (kb.ts), and claims that already passed claim-by-claim source
// validation (claimsFor). Conservative by design:
//  - red: a documented concern for the species on the reviewed list. Never because an ingredient is
//    unfamiliar, synthetic or processed, or harmful only at unrelated exposures;
//  - yellow: a documented caution (harm depends on an amount the label does not state), or a supported
//    context-dependent consideration (pulses or potatoes among a dog food's main ingredients);
//  - green: a supported appropriate role in pet food: a curated role class, or a validated function or
//    identity claim about cats, dogs, pets or animal feed. Never because no study or recall was found;
//  - gray: everything else (not recognised, source not stated, not yet assessed), which is not "harmful".
// A blend's or compound's items are rows of their own, nested under it. Only top-level rows are label
// entries: children never count as separate positives.
import { containsTerm, normalizeIngredientName, type IngredientChild, type ParsedIngredient } from './ingredients';
import { curatedEntries, DCM_SOURCE, type KbEntry, type KbSource } from './kb';
import { ingredientRoleMatch, normalizeRole, type RoleMatch } from './roles';
import type { ClaimSource, ClaimType, IngredientColor, IngredientRow, IngredientStatuses, Species, SpeciesScope } from './types';

type ClaimsFor = (term: string) => ClaimSource[];
type Risk = IngredientStatuses['risk'];

const CONCERN_RANK: Record<IngredientColor, number> = { red: 3, yellow: 2, gray: 1, green: 0 };
const RISK_RANK: Record<Risk, number> = { documented_concern: 4, documented_caution: 3, consideration: 2, none_in_reviewed_list: 1, not_assessed: 0 };
const KB_SEVERITY = { concern: 3, caution: 2, info: 1, positive: 1 } as const;
/** A claim about these supports a role in pet food; one about people or other animals does not. */
const PET_SCOPES = new Set<SpeciesScope>(['cat', 'dog', 'cat_and_dog', 'pets', 'animal_feed']);

// A source the label names: an animal species (or eggs) or a plant. "Fish oil", "poultry fat", "meat",
// "bone broth" and "natural flavor" name none.
const FISH = ['salmon', 'tuna', 'mackerel', 'sardine', 'herring', 'anchovy', 'cod', 'pollock', 'whitefish', 'trout', 'menhaden', 'whiting', 'tilapia', 'catfish', 'flounder', 'haddock', 'hake', 'pilchard', 'sprat', 'saumon', 'thon', 'maquereau', 'hareng', 'cabillaud', 'lachs', 'thunfisch', 'atun', 'salmone', 'tonno'];
const SEAFOOD = ['krill', 'shrimp', 'crab', 'mussel', 'clam', 'squid'];
const POULTRY = ['chicken', 'turkey', 'duck', 'goose', 'quail', 'pheasant', 'poulet', 'dinde', 'canard', 'huhn', 'hahnchen', 'pute', 'truthahn', 'ente', 'pollo', 'pavo', 'pato', 'tacchino', 'anatra'];
const MEAT = ['beef', 'veal', 'bison', 'buffalo', 'lamb', 'mutton', 'goat', 'pork', 'venison', 'deer', 'elk', 'rabbit', 'kangaroo', 'boar', 'lard', 'boeuf', 'veau', 'agneau', 'porc', 'lapin', 'lamm', 'schwein', 'ternera', 'vacuno', 'cordero', 'cerdo', 'conejo', 'manzo', 'agnello', 'maiale', 'coniglio'];
const EGG = ['egg', 'oeuf', 'huevo', 'uovo'];
const ORGAN = ['liver', 'heart', 'kidney', 'gizzard', 'tripe', 'lung', 'spleen', 'foie'];
const PLANTS = ['sunflower', 'safflower', 'canola', 'rapeseed', 'flaxseed', 'flax', 'linseed', 'coconut', 'soybean', 'soy', 'soya', 'olive', 'corn', 'maize', 'palm', 'hemp', 'rice', 'barley', 'oat', 'oatmeal', 'wheat', 'sorghum', 'millet', 'quinoa', 'buckwheat', 'rye', 'spelt', 'amaranth', 'potato', 'sweet potato', 'tapioca', 'cassava', 'arrowroot', 'yam', 'pea', 'chickpea', 'garbanzo', 'lentil', 'bean', 'fava', 'beet', 'beetroot', 'pumpkin', 'squash', 'carrot', 'cranberry', 'cranberries', 'blueberry', 'blueberries', 'raspberries', 'strawberries', 'apple', 'banana', 'pear', 'spinach', 'kale', 'broccoli', 'parsley', 'tomato', 'celery', 'zucchini', 'cucumber', 'cellulose', 'psyllium', 'inulin', 'chicory', 'fructooligosaccharides', 'ble', 'mais', 'riz', 'orge', 'avoine', 'pommes de terre', 'pomme de terre', 'pois', 'lentilles', 'betterave', 'carotte', 'weizen', 'reis', 'gerste', 'hafer', 'kartoffel', 'kartoffeln', 'erbsen', 'trigo', 'arroz', 'maiz', 'cebada', 'avena', 'patata', 'patate', 'guisantes', 'lentejas', 'riso', 'orzo', 'piselli'];
const STANDARD_PRESERVATIVES = new Set(['mixed tocopherols', 'tocopherols', 'rosemary extract']);
const UNNAMED_FLAVOURS = new Set(['natural flavor', 'natural flavour', 'flavor', 'flavour', 'animal digest', 'digest', 'palatant', 'aromes']);
const VITAMIN = /vitamin|biotin|folic|niacin|riboflavin|thiamin|pyridoxine|menadione|pantothen|cobalamin|ascorb|tocopheryl|cholecalciferol|retinyl|inositol|carotene|phylloquinone/;

// The FDA's DCM investigation looked at dog foods with peas, lentils, other pulses or potatoes as main
// ingredients (listed within the first 10, before the vitamins and minerals); no causal link was established.
const PULSES = ['pea', 'lentil', 'chickpea', 'garbanzo', 'bean', 'fava', 'faba', 'legume', 'pulse', 'pois', 'lentilles', 'erbsen', 'linsen', 'guisantes', 'lentejas', 'piselli', 'lenticchie'];
const POTATOES = ['potato', 'pommes de terre', 'pomme de terre', 'kartoffel', 'kartoffeln', 'patata', 'patate'];
const NOT_DCM = /\bsweet potato(?:es)?\b|\bgreen beans?\b|\bsoy ?beans?\b|\blocust bean\b|\bcarob bean\b/g;
const DCM_NOTE =
  'The FDA investigated reports of heart disease (DCM) in dogs eating diets with peas, lentils, other pulses or potatoes among their main ingredients; no causal link was established. Ask your veterinarian if this concerns you.';
const DCM_NOT_MAIN = 'Here it is not among the main ingredients (the first 10, before the vitamins and minerals).';
const NONE_IN_LIST = 'Purrbi’s reviewed list has no species-specific concern for this ingredient; effects at the amount used aren’t assessed.';

type Kind = 'animal_protein' | 'fat' | 'vitamin' | 'mineral' | 'choline' | 'amino_acid' | 'preservative' | 'water' | 'broth' | 'carbohydrate' | 'fibre' | 'fruit_vegetable';
type RoleClass = Kind | 'unspecified' | 'unassessed' | 'unknown';

const has = (text: string, words: string[]) => words.some((w) => containsTerm(text, w));
const animal = (t: string) => has(t, FISH) || has(t, SEAFOOD) || has(t, POULTRY) || has(t, MEAT) || has(t, EGG);
const plant = (t: string) => has(t, PLANTS);

// Role classes Purrbi treats as an appropriate role in pet food, each with what it is, why it is used and the row's reason.
const KINDS: Record<Kind, { what: (own: string) => string; why: string; reason: string }> = {
  animal_protein: {
    what: (own) =>
      has(own, ORGAN) ? 'A named organ meat.' : containsTerm(own, 'meal') ? 'A named animal protein meal.' : has(own, FISH) ? 'A named fish ingredient.' : has(own, SEAFOOD) ? 'A named seafood ingredient.' : has(own, POULTRY) ? 'A named poultry ingredient.' : has(own, EGG) ? 'An egg ingredient (animal protein).' : 'A named meat ingredient.',
    why: 'A source of animal protein.',
    reason: 'Named animal protein source',
  },
  fat: {
    what: (own) => (has(own, FISH) ? 'A named fish oil.' : has(own, SEAFOOD) ? 'A named marine oil.' : animal(own) ? 'A named animal fat.' : 'A named plant oil.'),
    why: 'Supplies fat, for energy and fatty acids.',
    reason: 'Named fat source',
  },
  vitamin: { what: () => 'A vitamin source.', why: 'Added so the food supplies an essential vitamin.', reason: 'Vitamin source, added as a nutrient' },
  mineral: { what: () => 'A mineral source.', why: 'Added so the food supplies essential minerals.', reason: 'Mineral source, added as a nutrient' },
  choline: { what: () => 'A source of choline.', why: 'Added so the food supplies choline, an essential nutrient.', reason: 'Choline source, added as a nutrient' },
  amino_acid: { what: () => 'An amino acid.', why: 'Added as a nutrient.', reason: 'Amino acid, added as a nutrient' },
  preservative: { what: () => 'A preservative.', why: 'Keeps fats from going rancid.', reason: 'Common preservative that keeps fats fresh' },
  water: { what: () => 'Water.', why: 'Added for processing; it also adds moisture.', reason: 'Water used in processing' },
  broth: { what: () => 'A broth made from a named ingredient.', why: 'Adds moisture and flavour.', reason: 'Named broth: adds moisture and flavour' },
  carbohydrate: { what: () => 'A named carbohydrate source.', why: 'Supplies carbohydrate, a source of energy.', reason: 'Named carbohydrate source' },
  fibre: { what: () => 'A named fibre source.', why: 'Supplies dietary fibre.', reason: 'Named fibre source' },
  fruit_vegetable: { what: () => 'A named fruit or vegetable.', why: '', reason: 'Named fruit or vegetable' },
};

// Every role in the table, in plain words, for ingredients outside the classes above.
const ROLE_WORDS: Record<string, { what: string; why: string }> = {
  Preservative: { what: 'A preservative', why: 'Helps keep the food from spoiling.' },
  Probiotic: { what: 'A probiotic ingredient', why: 'Added as a probiotic.' },
  'Water (processing)': { what: 'Water', why: 'Added for processing; it also adds moisture.' },
  'Broth (moisture and flavour)': { what: 'A broth', why: 'Adds moisture and flavour.' },
  'Fat source': { what: 'A fat or oil', why: 'Supplies fat, for energy and fatty acids.' },
  'Fibre source': { what: 'A fibre ingredient', why: 'Supplies dietary fibre.' },
  'Vitamin or mineral': { what: 'A vitamin or mineral source', why: 'Added as a nutrient.' },
  'Amino acid (nutrient)': { what: 'An amino acid', why: 'Added as a nutrient.' },
  Flavour: { what: 'A flavouring', why: 'Adds flavour.' },
  'Plant material (not specified)': { what: 'Plant material', why: '' },
  'Thickener or binder': { what: 'A thickener or binder', why: 'Thickens the food or holds it together.' },
  'Humectant or sweetener': { what: 'A humectant or sweetener', why: 'Keeps the food moist, or sweetens it.' },
  Colour: { what: 'A colouring', why: 'Colours the food.' },
  'Protein source': { what: 'A protein ingredient', why: 'A source of protein.' },
  'Carbohydrate source': { what: 'A carbohydrate ingredient', why: 'Supplies carbohydrate, a source of energy.' },
  'Fruit or vegetable': { what: 'A fruit or vegetable', why: '' },
};

// Where a curated note that is not a concern or caution belongs in the details.
const NOTE_PLACE: Record<string, 'whatItIs' | 'whyUsed' | 'benefitsRisks'> = {
  meal: 'whatItIs',
  by_products: 'whatItIs',
  natural_flavor: 'whatItIs',
  taurine: 'whyUsed',
  mixed_tocopherols: 'whyUsed',
  propylene_glycol: 'whyUsed',
  pulses: 'benefitsRisks',
};

const SCOPE_PREFIX: Record<SpeciesScope, string> = {
  cat: 'In cats',
  dog: 'In dogs',
  cat_and_dog: 'In cats and dogs',
  pets: 'In pets',
  animal_feed: 'In animal feed generally',
  other_species: 'In other animals (not cats or dogs)',
  people: 'In people (not pets)',
  not_species_specific: 'Not specific to a species',
};

function roleClass(match: RoleMatch | null, own: string): RoleClass {
  if (!match) return 'unknown';
  const named = animal(own) || plant(own);
  switch (match.role) {
    case 'Protein source':
      return animal(own) ? 'animal_protein' : plant(own) ? 'unassessed' : 'unspecified';
    case 'Fat source':
      return named ? 'fat' : 'unspecified';
    case 'Broth (moisture and flavour)':
      return named ? 'broth' : 'unspecified';
    case 'Water (processing)':
      return 'water';
    case 'Vitamin or mineral':
      return /choline/.test(own) ? 'choline' : VITAMIN.test(own) ? 'vitamin' : 'mineral';
    case 'Amino acid (nutrient)':
      return 'amino_acid';
    case 'Preservative':
      return STANDARD_PRESERVATIVES.has(match.term) ? 'preservative' : 'unassessed';
    case 'Carbohydrate source':
      return plant(own) ? 'carbohydrate' : 'unspecified';
    case 'Fibre source':
      return plant(own) ? 'fibre' : 'unspecified';
    case 'Fruit or vegetable':
      return plant(own) ? 'fruit_vegetable' : 'unspecified';
    case 'Flavour':
      return UNNAMED_FLAVOURS.has(match.term) && !named ? 'unspecified' : 'unassessed';
    case 'Plant material (not specified)':
      return 'unspecified';
    default:
      return 'unassessed';
  }
}

/** What the ingredient itself is: its normalized name without bracketed descriptions or lists. */
function ownText(name: string): string {
  let t = normalizeIngredientName(name);
  for (let prev = ''; prev !== t; ) [prev, t] = [t, t.replace(/[([{][^()[\]{}]*[)\]}]/g, ' ')];
  return t.replace(/[([{].*$/, ' ').replace(/\s+/g, ' ').trim();
}

/** "pulse" or "potato" when the ingredient is one the FDA's DCM investigation looked at. */
function dcmKind(own: string): 'pulse' | 'potato' | null {
  const t = own.replace(NOT_DCM, ' ');
  return has(t, POTATOES) ? 'potato' : has(t, PULSES) ? 'pulse' : null;
}

const speciesWord = (s: Species[]) => s.map((x) => `${x}s`).join(' and ');
const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const upperFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** The curated note for these species (each species' own wording when they differ). */
function noteFor(e: KbEntry, species: Species[]): string {
  const withStatus = species.filter((s) => e.status[s]);
  const notes = [...new Set(withStatus.map((s) => e.note[s] ?? e.note.both ?? '').filter(Boolean))];
  if (notes.length <= 1) return notes[0] ?? '';
  return withStatus.map((s) => `For ${s}s: ${lowerFirst(e.note[s] ?? e.note.both ?? '')}`).join(' ');
}

function scopeOf(e: KbEntry, species: Species[]): SpeciesScope {
  const withStatus = species.filter((s) => e.status[s]);
  return withStatus.length === 1 ? withStatus[0] : 'cat_and_dog';
}

function curatedSource(src: KbSource, claimType: ClaimType, claim: string, form: string, scope: SpeciesScope, review: KbEntry['reviewStatus'], doseContext = ''): ClaimSource {
  return { claimType, claim, ingredientForm: form, title: src.title, url: src.url, passage: '', speciesScope: scope, evidence: 'curated', doseContext, retrievedAt: '', publishedAt: '', reviewStatus: review === 'vet_reviewed' ? 'vet_reviewed' : 'curated_unreviewed' };
}

/** Claims about the product's own species first, people and other animals last. */
function scopeOrder(species: Species[]) {
  const rank = (s: SpeciesScope) =>
    (s === 'cat' || s === 'dog') && species.includes(s) ? 0 : s === 'cat_and_dog' || s === 'pets' ? 1 : s === 'cat' || s === 'dog' ? 2 : s === 'animal_feed' ? 3 : s === 'not_species_specific' ? 4 : s === 'other_species' ? 5 : 6;
  return (a: ClaimSource, b: ClaimSource) => rank(a.speciesScope) - rank(b.speciesScope);
}

/** "One source is about people (human food), not pet food." for each source that is not about this pet food. */
function scopeNotes(used: ClaimSource[], species: Species[]): string[] {
  const counts = new Map<string, number>();
  for (const c of used) {
    const note =
      c.speciesScope === 'people' ? 'about people (human food), not pet food'
      : c.speciesScope === 'other_species' ? 'about other animals, not cats or dogs'
      : c.speciesScope === 'animal_feed' ? 'about animal feed in general, not pet food specifically'
      : c.speciesScope === 'not_species_specific' ? 'not specific to any species'
      : (c.speciesScope === 'cat' || c.speciesScope === 'dog') && !species.includes(c.speciesScope) ? `about ${c.speciesScope}s, not ${speciesWord(species)}`
      : '';
    if (note) counts.set(note, (counts.get(note) ?? 0) + 1);
  }
  return [...counts].map(([note, n]) => (n === 1 ? `One source is ${note}.` : `${n} sources are ${note}.`));
}

function addSource(list: ClaimSource[], c: ClaimSource) {
  if (!list.some((x) => x.url === c.url && x.claimType === c.claimType && x.claim === c.claim)) list.push(c);
}

interface Subject {
  name: string;
  own: string; // what it is (normalized, no brackets)
  texts: string[]; // what the reviewed list is matched on: the name with its descriptions, and listed parts
  qualifiers: string[];
  labelText: string;
  main: boolean; // among the product's main ingredients (the DCM consideration's criterion)
}

interface Assessed {
  role: string;
  color: IngredientColor;
  reason: string;
  statuses: IngredientStatuses;
  whatItIs: string;
  whyUsed: string;
  benefitsRisks: string;
  uncertainty: string;
  sources: ClaimSource[];
  kbId?: string;
  concernFor?: Species[];
  nutrient: boolean; // green as an essential-nutrient source
}

function assess(s: Subject, species: Species[], claimsFor: ClaimsFor): Assessed {
  const match = ingredientRoleMatch(s.name);
  const cls = roleClass(match, s.own);
  const claims = [...claimsFor(s.name)].sort(scopeOrder(species));
  const identity = claims.find((c) => c.claimType === 'identity');
  const fn = claims.find((c) => c.claimType === 'function');
  const supporting = claims.find((c) => (c.claimType === 'function' || c.claimType === 'identity') && PET_SCOPES.has(c.speciesScope));
  const findings = claims.filter((c) => c.claimType === 'benefit' || c.claimType === 'risk');

  // The reviewed list: the most severe entry anywhere in the name decides the colour; the entry for the
  // ingredient itself (not a qualifier) decides whether Purrbi's list covers it at all.
  const severity = (e: KbEntry) => Math.max(0, ...species.map((sp) => (e.status[sp] ? KB_SEVERITY[e.status[sp]!] : 0)));
  const found = curatedEntries(s.texts);
  const longest = [...found].sort((a, b) => b.term.length - a.term.length);
  const worst = [...longest].sort((a, b) => severity(b.entry) - severity(a.entry))[0];
  const own = curatedEntries([s.own]).sort((a, b) => b.term.length - a.term.length)[0];
  const concern = !!worst && species.some((sp) => worst.entry.status[sp] === 'concern');
  const caution = !concern && !!worst && species.some((sp) => worst.entry.status[sp] === 'caution');
  const dcmFor = species.includes('dog') ? dcmKind(s.own) : null;
  const dcm = !concern && !caution && s.main && !!dcmFor;
  const ownCovers = !!own && species.length > 0 && species.every((sp) => own.entry.status[sp] === 'info' || own.entry.status[sp] === 'positive');
  const flaggedEntry = concern || caution ? worst.entry : undefined;
  const statuses: IngredientStatuses = {
    identity: match || own || identity ? 'established' : 'not_established',
    role: match || fn ? 'explained' : 'not_explained',
    risk: concern ? 'documented_concern' : caution ? 'documented_caution' : dcm ? 'consideration' : ownCovers ? 'none_in_reviewed_list' : 'not_assessed',
    exposure: 'not_assessed', // labels give no amounts Purrbi could assess an exposure from
    humanReview: (flaggedEntry ?? own?.entry)?.reviewStatus === 'vet_reviewed' ? 'performed' : 'not_performed',
  };

  let color: IngredientColor;
  let reason: string;
  let byClaim = false; // green because a validated claim supports its role
  const shortFor = (e: KbEntry, level: 'concern' | 'caution') => {
    const sp = species.find((x) => e.status[x] === level)!;
    return e.short?.[sp] ?? e.short?.both ?? (level === 'concern' ? `Documented concern for ${sp}s` : 'Harm depends on an amount the label doesn’t state');
  };
  if (concern) [color, reason] = ['red', shortFor(worst.entry, 'concern')];
  else if (caution) [color, reason] = ['yellow', shortFor(worst.entry, 'caution')];
  else if (dcm) [color, reason] = ['yellow', `${dcmFor === 'potato' ? 'Potato' : 'Pulse'} in the first 10: FDA reviewed dog heart disease (DCM); no causal link established`];
  else if (cls === 'unspecified') [color, reason] = ['gray', 'Source not stated on the label'];
  else if (cls in KINDS) [color, reason] = ['green', KINDS[cls as Kind].reason];
  else if (supporting) [color, reason, byClaim] = ['green', supporting.speciesScope === 'animal_feed' ? 'Role in animal feed supported by a checked source' : 'Role in pet food supported by a checked source', true];
  else if (statuses.identity === 'established' || statuses.role === 'explained') [color, reason] = ['gray', 'Not yet assessed by Purrbi (not the same as harmful)'];
  else [color, reason] = ['gray', 'Not recognised by Purrbi yet (not the same as harmful)'];

  const sources: ClaimSource[] = [];
  const used: ClaimSource[] = [];
  const use = (c: ClaimSource) => {
    if (used.includes(c)) return;
    addSource(sources, c);
    used.push(c);
  };
  // A curated note that is not a concern or caution, where it belongs; one about a qualifier ("preserved with
  // mixed tocopherols") goes with why it is used.
  const infoNote = !flaggedEntry && own && species.some((sp) => own.entry.status[sp]) ? noteFor(own.entry, species) : '';
  const place = own ? (NOTE_PLACE[own.entry.id] ?? 'benefitsRisks') : 'benefitsRisks';
  const placed = (where: typeof place) => (infoNote && place === where && !(dcm && where === 'benefitsRisks') ? infoNote : '');
  const kind = cls in KINDS ? KINDS[cls as Kind] : undefined;
  const words = match ? ROLE_WORDS[match.role] : undefined;

  const whatItIs =
    identity?.claim ||
    placed('whatItIs') ||
    kind?.what(s.own) ||
    (cls === 'unspecified' && words ? `${words.what} whose source isn’t named on the label.` : '') ||
    (words ? `${words.what}.` : '') ||
    'Purrbi hasn’t identified this ingredient yet.';
  if (identity && whatItIs === identity.claim) use(identity);

  const why = [fn?.claim || placed('whyUsed') || kind?.why || words?.why || ''];
  if (fn && why[0] === fn.claim) use(fn);
  for (const f of found) {
    if (f.entry === own?.entry || f.entry === flaggedEntry || !species.some((sp) => f.entry.status[sp] === 'info' || f.entry.status[sp] === 'positive')) continue;
    const q = s.qualifiers.find((x) => containsTerm(normalizeIngredientName(x), f.term)) ?? f.term;
    const note = noteFor(f.entry, species);
    why.push(`${upperFirst(q)}: ${lowerFirst(note)}`);
    for (const src of f.entry.sources) addSource(sources, curatedSource(src, 'function', note, f.term, scopeOf(f.entry, species), f.entry.reviewStatus));
  }

  const risks: string[] = [];
  if (flaggedEntry) {
    const note = noteFor(flaggedEntry, species.filter((sp) => flaggedEntry.status[sp] === (concern ? 'concern' : 'caution')));
    const others = species.filter((sp) => !flaggedEntry.status[sp]);
    risks.push(species.length > 1 && others.length ? `${note} (Applies to ${speciesWord(species.filter((sp) => flaggedEntry.status[sp]))}.)` : note);
    for (const src of flaggedEntry.sources) addSource(sources, curatedSource(src, 'risk', note, worst.term, scopeOf(flaggedEntry, species), flaggedEntry.reviewStatus));
  }
  if (dcm) {
    risks.push(`Listed among this food’s main ingredients (the first 10, before the vitamins and minerals). ${DCM_NOTE}${species.length > 1 ? ' (Applies to dogs.)' : ''}`);
    addSource(sources, curatedSource(DCM_SOURCE, 'risk', DCM_NOTE, s.own, 'dog', 'draft', 'main ingredients: within the first 10, before the vitamins and minerals'));
  }
  if (placed('benefitsRisks')) risks.push(dcmFor ? `${infoNote} ${DCM_NOT_MAIN}` : infoNote);
  if (own && placed(place)) {
    const claimType: ClaimType = place === 'whatItIs' ? 'identity' : place === 'whyUsed' ? 'function' : 'risk';
    for (const src of own.entry.sources) addSource(sources, curatedSource(src, claimType, infoNote, own.term, scopeOf(own.entry, species), own.entry.reviewStatus));
  }
  for (const c of findings) {
    risks.push(`${SCOPE_PREFIX[c.speciesScope]}: ${c.claim}`);
    use(c);
  }
  if (!risks.length) risks.push(statuses.risk === 'none_in_reviewed_list' ? NONE_IN_LIST : 'Not assessed yet.');
  if (byClaim && supporting) use(supporting);

  const percent = /(\d+(?:[.,]\d+)?)\s*%/.exec(s.labelText)?.[1];
  const uncertainty = [
    percent ? `The label gives ${percent}%, but exposure isn’t assessed.` : 'The amount isn’t on the label, so exposure isn’t assessed.',
    statuses.humanReview === 'performed' ? 'Reviewed by a veterinarian.' : 'Not reviewed by a person yet.',
    ...scopeNotes(used, species),
  ].join(' ');

  // The entry behind the colour, else the one Purrbi's ingredient notes use (the longest term), when it covers the species.
  const kbEntry = flaggedEntry ?? longest[0]?.entry;
  const kbId = kbEntry && species.some((sp) => kbEntry.status[sp]) ? kbEntry.id : undefined;
  const concernFor = kbId ? species.filter((sp) => kbEntry!.status[sp] === 'concern' || kbEntry!.status[sp] === 'caution') : [];
  return {
    role: match?.role ?? (fn ? normalizeRole(fn.claim) : ''),
    color,
    reason,
    statuses,
    whatItIs,
    whyUsed: why.filter(Boolean).join(' '),
    benefitsRisks: risks.join(' '),
    uncertainty,
    sources,
    ...(kbId ? { kbId } : {}),
    ...(concernFor.length ? { concernFor } : {}),
    nutrient: color === 'green' && (cls === 'vitamin' || cls === 'mineral' || cls === 'choline' || cls === 'amino_acid'),
  };
}

function row(a: Assessed, meta: Pick<IngredientRow, 'id' | 'position' | 'childIndex' | 'name' | 'labelText' | 'kind'>, children: IngredientRow[] = []): IngredientRow {
  const { nutrient: _n, ...rest } = a;
  return { ...meta, ...rest, children, concernRank: CONCERN_RANK[a.color] };
}

const listed = (names: string[]) => {
  const t = names.length === 1 ? names[0] : `${names.length} items`;
  return t.length > 40 ? `${t.slice(0, 39)}…` : t;
};

/** A blend or compound: red if any part is red, yellow if any is yellow, green only if every part is green. */
function combined(parts: Assessed[]): IngredientColor {
  if (parts.some((p) => p.color === 'red')) return 'red';
  if (parts.some((p) => p.color === 'yellow')) return 'yellow';
  return parts.every((p) => p.color === 'green') ? 'green' : 'gray';
}

function combinedRisk(parts: Assessed[]): Risk {
  const top = parts.reduce<Risk>((r, p) => (RISK_RANK[p.statuses.risk] > RISK_RANK[r] ? p.statuses.risk : r), 'not_assessed');
  if (RISK_RANK[top] >= RISK_RANK.consideration) return top;
  return parts.every((p) => p.statuses.risk === 'none_in_reviewed_list') ? 'none_in_reviewed_list' : 'not_assessed';
}

function childSubject(c: IngredientChild): Subject {
  const qualifiers = [...c.name.matchAll(/\(([^()]*)\)|\[([^[\]]*)\]/g)].map((m) => (m[1] ?? m[2]).trim());
  return { name: c.name, own: ownText(c.name), texts: [c.normalized], qualifiers, labelText: c.name, main: false };
}

function entryRow(ing: ParsedIngredient, species: Species[], claimsFor: ClaimsFor, main: boolean): IngredientRow {
  const meta = { id: String(ing.position), position: ing.position, childIndex: 0, name: ing.name, labelText: ing.labelText, kind: ing.kind };
  if (ing.kind === 'single') {
    return row(assess({ name: ing.name, own: ownText(ing.name), texts: [ing.normalized, ...ing.subIngredients], qualifiers: ing.qualifiers, labelText: ing.labelText, main }, species, claimsFor), meta);
  }
  const kids = ing.children.map((c) => assess(childSubject(c), species, claimsFor));
  const kidRows = ing.children.map((c, i) => row(kids[i], { id: `${ing.position}.${c.index}`, position: ing.position, childIndex: c.index, name: c.name, labelText: c.name, kind: 'child' }));
  const flagged = (color: IngredientColor) => kids.filter((k) => k.color === color);
  const notesOf = (list: Assessed[]) => list.map((k) => `${ing.children[kids.indexOf(k)].name}: ${k.benefitsRisks}`);
  const sourcesOf = (list: Assessed[]) => {
    const out: ClaimSource[] = [];
    for (const k of list) for (const src of k.sources) addSource(out, src);
    return out;
  };
  const concernFor = species.filter((sp) => kids.some((k) => k.concernFor?.includes(sp)));
  const red = flagged('red');
  const yellow = flagged('yellow');
  const includes = (color: 'red' | 'yellow') => {
    const list = color === 'red' ? red : yellow;
    const what = list.length === 1 ? (color === 'red' ? ', a documented concern' : ', which needs context') : color === 'red' ? ' with a documented concern' : ' that need context';
    return `Includes ${listed(list.map((k) => ing.children[kids.indexOf(k)].name))}${what}`;
  };
  // The entry behind the colour, else the one Purrbi's ingredient notes use for the whole entry (the longest term in it or its items).
  const notesEntry = curatedEntries([ing.normalized, ...ing.subIngredients]).sort((a, b) => b.term.length - a.term.length)[0]?.entry;
  const entryKb = (red[0] ?? yellow[0])?.kbId ?? (notesEntry && species.some((sp) => notesEntry.status[sp]) ? notesEntry.id : undefined);

  if (ing.kind === 'group') {
    const head = normalizeIngredientName(ing.name);
    const vit = /vitamin/.test(head);
    const min = /mineral|minerau|oligo|spuren|trace/.test(head);
    const what = vit && min ? 'vitamins and minerals' : vit ? 'vitamins' : 'minerals';
    const noun = vit && min ? 'Vitamin and mineral blend' : vit ? 'Vitamin blend' : 'Mineral blend';
    const color = combined(kids);
    const gray = kids.filter((k) => k.color === 'gray').length;
    const reason =
      color === 'red' || color === 'yellow' ? includes(color)
      : color === 'green' ? (kids.every((k) => k.nutrient) ? `All ${kids.length} items are added nutrients` : `All ${kids.length} items have a supported role`)
      : `${gray} of ${kids.length} items not yet assessed by Purrbi (not the same as harmful)`;
    const flaggedKids = [...red, ...yellow];
    const allCovered = kids.every((k) => k.statuses.risk === 'none_in_reviewed_list');
    const blend: Assessed = {
      role: `${noun} (${kids.length})`,
      color,
      reason,
      statuses: { identity: 'established', role: 'explained', risk: combinedRisk(kids), exposure: 'not_assessed', humanReview: kids.every((k) => k.statuses.humanReview === 'performed') ? 'performed' : 'not_performed' },
      whatItIs: `A ${noun.toLowerCase()}: the label lists ${kids.length} items as one entry.`,
      whyUsed: `Added so the food supplies essential ${what}.`,
      benefitsRisks: flaggedKids.length ? notesOf(flaggedKids).join(' ') : allCovered ? 'Purrbi’s reviewed list has no species-specific concern for these items; effects at the amounts used aren’t assessed.' : 'Not assessed as a whole; each item has its own assessment.',
      uncertainty: 'The label doesn’t give the amounts, so exposure isn’t assessed. Not reviewed by a person yet.',
      sources: sourcesOf(flaggedKids),
      ...(entryKb ? { kbId: entryKb } : {}),
      ...(concernFor.length ? { concernFor } : {}),
      nutrient: false,
    };
    return row(blend, meta, kidRows);
  }

  // A compound is an ingredient of its own ("Chicken Broth") made of listed ones ("Water, Chicken").
  const own = assess({ name: ing.name, own: ownText(ing.name), texts: [ing.normalized], qualifiers: ing.qualifiers, labelText: ing.labelText, main }, species, claimsFor);
  const color = combined([own, ...kids]);
  const fromKids = color !== own.color && (color === 'red' || color === 'yellow');
  const gray = kids.filter((k) => k.color === 'gray').length;
  const reason = fromKids
    ? includes(color as 'red' | 'yellow')
    : color === 'gray' && own.color === 'green'
      ? `${gray} of ${kids.length} listed parts not yet assessed (not the same as harmful)`
      : own.reason;
  const flaggedKids = [...red, ...yellow];
  const ownFlagged = own.color === 'red' || own.color === 'yellow';
  const sources = [...own.sources];
  for (const src of sourcesOf(flaggedKids)) addSource(sources, src);
  const compound: Assessed = {
    ...own,
    color,
    reason,
    statuses: { ...own.statuses, risk: combinedRisk([own, ...kids]) },
    benefitsRisks: flaggedKids.length ? [...(ownFlagged ? [own.benefitsRisks] : []), ...notesOf(flaggedKids)].join(' ') : own.benefitsRisks,
    sources,
    kbId: ownFlagged ? own.kbId : entryKb,
    concernFor: species.filter((sp) => own.concernFor?.includes(sp) || concernFor.includes(sp)),
  };
  if (!compound.kbId) delete compound.kbId;
  if (!compound.concernFor?.length) delete compound.concernFor;
  return row(compound, meta, kidRows);
}

/**
 * The label's entries as rows, in label order, for the product's species. `claimsFor(term)` returns only claims
 * that already passed claim-by-claim source validation (it may return none). Children are nested, never listed
 * at the top level.
 */
export function ingredientRows(ingredients: ParsedIngredient[], species: Species[], claimsFor: ClaimsFor): IngredientRow[] {
  // The FDA's criterion for a main ingredient: listed within the first 10, before the vitamins and minerals.
  const firstNutrients = ingredients.find((i) => i.kind === 'group' || /vitamin|mineral|minerau|oligo-?element|spurenelement/.test(ownText(i.name)));
  const mainUpTo = Math.min(10, firstNutrients ? firstNutrients.position - 1 : 10);
  return ingredients.map((ing) => entryRow(ing, species, claimsFor, ing.position <= mainUpTo));
}
