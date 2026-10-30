// Scope: Purrbi assesses products intended for cats or dogs only (foods, treats, toppers,
// complementary foods, supplements). The decision rests on affirmative evidence from the product's
// own data: its names, category tags, label statements, adequacy statement, verified manufacturer
// pages and label photos. Which database holds the record (and the record's product_type) is
// provenance, never proof: pet foods are found misfiled in Open Food Facts, with no categories.
// Three outcomes: supported (made for cats or dogs), out_of_scope (affirmatively something else),
// unknown (unresolved: research and, if needed, a label photo decide). Species never comes from the
// owner's selected pet or from pictures.
import { detectSpecies } from './adequacy';
import type { AdequacyStatement, CategoryBasis, OutOfScopeKind, ProductCategory, ProductSpecies, ScopeResult, Species, SpeciesBasis, SpeciesEvidence } from './types';

/** Version of these classification rules, saved with each product record and scan. */
export const SCOPE_VERSION = 'scope-3.0.0'; // 3.0.0: species from the strongest evidence (a retailer listing alone doesn't confirm it); product type from feeding statements, never from "broth" or "gravy"

export type DatabaseOrigin = 'opff' | 'off' | 'obf' | 'opf' | 'web' | 'label';

/** A name, tag or statement about the product with where it comes from (decides how much it says about the species). */
export interface SpeciesClaim {
  text: string;
  basis: SpeciesBasis;
  /** Where it was found (a source id): one record's names and category tags are one source, whatever species each names. */
  source?: string;
}

export interface ScopeInput {
  origin: DatabaseOrigin; // provenance only: never decides the outcome
  recordType?: string | null; // the database's product_type (food, petfood, beauty, product): provenance only
  categoriesTags: string[]; // the record's category tags (taxonomy ids such as en:dog-food)
  texts: string[]; // names, generic names, label tags, verified research and label-photo statements
  adequacy?: AdequacyStatement | null;
  ingredientsText?: string | null; // feed-ingredient vocabulary is evidence of an animal food
  /** The same names and statements with their basis; when given, the species comes from the strongest basis. */
  speciesClaims?: SpeciesClaim[];
}

/** Strongest first. A retailer's title or catalogue tags ("Dog Trt Frz Dr …") do not confirm who a product is for. */
const BASIS_ORDER: SpeciesBasis[] = ['label', 'adequacy_statement', 'manufacturer_page', 'database_category', 'database_name', 'retailer_listing'];
const CONFIRMING: ReadonlySet<SpeciesBasis> = new Set(['label', 'adequacy_statement', 'manufacturer_page', 'database_category', 'database_name']);
const BASIS_WORDS: Record<SpeciesBasis, string> = {
  label: 'the package label',
  adequacy_statement: 'the nutritional adequacy statement',
  manufacturer_page: 'the manufacturer’s page',
  database_category: 'the pet database’s categories',
  database_name: 'the pet database record',
  retailer_listing: 'a retailer’s listing',
  none: 'nothing yet',
};
const setOf = (s: ProductSpecies): Species[] => (s === 'cat_and_dog' ? ['cat', 'dog'] : s === 'cat' || s === 'dog' ? [s] : []);
const speciesOfSet = (set: Species[]): ProductSpecies => (set.includes('cat') && set.includes('dog') ? 'cat_and_dog' : set[0] ?? 'unknown');

/**
 * Who the product is for, from the strongest evidence that names a species: the species named at the
 * strongest basis (all of them: a dog-and-cat treat is ["cat", "dog"]). One source's statements count
 * together (a record tagged both "cat food" and "dog food" is for both, not a dispute). A weaker source
 * naming fewer species is consistent with it; a confirming source naming another species is noted
 * (`alsoNamed`), so that species is never told the product is not for it. Two sources at the strongest
 * basis that name different species dispute it.
 */
export function speciesEvidence(claims: SpeciesClaim[], adequacy?: AdequacyStatement | null): SpeciesEvidence {
  const named = [
    ...(adequacy && adequacy.species !== 'unknown' ? [{ set: setOf(adequacy.species), basis: 'adequacy_statement' as SpeciesBasis, source: 'adequacy statement' }] : []),
    ...claims
      // The pet database's generic parent categories ("en:dog-and-cat-food") say nothing about the species.
      .filter((c) => c.basis !== 'database_category' || !GENERIC_TAGS.test(stripLang(c.text)))
      .map((c, i) => ({ set: setOf(detectSpecies(notSpecies(norm(c.text)))), basis: c.basis, source: c.source ?? `${c.basis}#${i}` }))
      .filter((c) => c.set.length),
  ];
  if (!named.length) return { set: [], confirmed: false, basis: 'none', disputed: false, alsoNamed: [], note: 'Nothing found yet says whether it is for cats or dogs.' };
  const rankOf = (b: SpeciesBasis) => BASIS_ORDER.indexOf(b);
  // One entry per source: its strongest basis, and every species it names.
  const bySource = new Map<string, { set: Species[]; basis: SpeciesBasis }>();
  for (const c of named) {
    const e = bySource.get(c.source);
    if (!e) bySource.set(c.source, { set: [...c.set], basis: c.basis });
    else {
      e.set = (['cat', 'dog'] as Species[]).filter((sp) => e.set.includes(sp) || c.set.includes(sp));
      if (rankOf(c.basis) < rankOf(e.basis)) e.basis = c.basis;
    }
  }
  const sources = [...bySource.values()];
  const basis = BASIS_ORDER.find((b) => sources.some((c) => c.basis === b)) ?? 'retailer_listing';
  const top = sources.filter((c) => c.basis === basis);
  const set = (['cat', 'dog'] as Species[]).filter((sp) => top.some((c) => c.set.includes(sp)));
  // Disputed: at the strongest basis, one source names only cats and another only dogs.
  const disputed = top.some((a) => top.some((b) => !a.set.some((x) => b.set.includes(x))));
  const others = sources.filter((c) => c.basis !== basis && CONFIRMING.has(c.basis) && c.set.some((x) => !set.includes(x)));
  const alsoNamed = disputed ? [] : (['cat', 'dog'] as Species[]).filter((sp) => !set.includes(sp) && others.some((c) => c.set.includes(sp)));
  const say = (s: Species[]) => (s.length === 2 ? 'cats and dogs' : `${s[0]}s`);
  const note = disputed
    ? `Sources disagree on who it is for (${top.map((c) => say(c.set)).join(' vs ')}); a photo of the package settles it.`
    : `For ${say(set)}, according to ${BASIS_WORDS[basis]}${others.length ? ` (${BASIS_WORDS[others[0].basis]} says ${say(others[0].set)})` : ''}.`;
  return { set: disputed ? [] : set, confirmed: !disputed && CONFIRMING.has(basis), basis, disputed, alsoNamed, note };
}

const norm = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[-_:]/g, ' ')
    .replace(/\s+/g, ' ');

const OTHER_ANIMAL =
  /\b(other animals|bird|birds|parrot|budgie|canary|finch|rabbit|rabbits|hamster|guinea pig|rodent|rodents|ferret|chinchilla|gerbil|rat food|mouse food|reptile|turtle|tortoise|aquarium|koi|goldfish|tropical fish|fish food|fish flakes|pond fish|horse|horses|equine|pony)\b/;
const LIVESTOCK =
  /\b(livestock|cattle|calf|calves|dairy cow|poultry feed|layer(s)? (pellets|feed|mash)|chick starter|broiler feed|pig feed|swine|sheep|goat feed|goats|game feed|deer feed)\b/;
const VET_MEDICINE =
  /\b(flea|fleas|tick|ticks|dewormer|deworming|wormer|worming|anthelmintic|praziquantel|pyrantel|fenbendazole|milbemycin|ivermectin|selamectin|fipronil|imidacloprid|fluralaner|sarolaner|afoxolaner|spinosad|moxidectin|rx only|prescription only medicine|antibiotic|carprofen|meloxicam)\b/;
const GROOMING =
  /\b(shampoo|conditioner|grooming|cologne|perfume|deodori[sz]er|deodori[sz]ing spray|wipes|toothpaste|ear cleaner|paw balm|nose balm|coat spray|detangler)\b/;
const NON_FOOD = /\b(litter|toy|toys|collar|leash|harness|bowl|bed|scratcher|carrier)\b/;

const SUPPLEMENT =
  /\b(supplements?|multivitamins?|vitamins?|probiotics?|prebiotics?|glucosamine|chondroitin|joint (support|health|care|chews?)|hip (and|&) joint|fish oil|salmon oil|krill oil|pollock oil|calming (chews?|aid|supplement)|digestive (aid|support|chews?)|immune (support|chews?)|skin (and|&) coat (chews?|supplement|oil)|urinary (support|health) chews?|l lysine|lysine)\b/;
// A product named a supplement or multivitamin (or filed as one): only this outranks a complete-and-balanced statement.
const SUPPLEMENT_NAME = /\b(supplements?|multivitamins?|nutraceuticals?)\b/;
// "… Formula with Probiotics", "Chicken Recipe with Fish Oil": an added ingredient, not what the product is.
const withAdded = (t: string) => t.replace(/\b(with|plus|added|enriched with|fortified with|contains)\b[^|,;()]{0,60}/g, ' ');
const TREAT =
  /\b(treats?|snacks?|dental (chews?|sticks?)|chews?|biscuits?|jerky|cookies|bully stick|rawhide|lickable|puree tubes?|creamy treats?|training bites|crunchies|nibbles)\b/;
// Named as a topper or complementary feed. "Broth" and "gravy" are textures, not a feeding purpose.
const COMPLEMENTARY = /\b(toppers?|mixers?|meal enhancers?|food toppers?|complementary (pet )?(food|feed)|complementary feedingstuff)\b/;
const COMPLETE_FOOD =
  /\b(kibble|dry (dog |cat )?food|wet (dog |cat )?food|complete (pet |dry |wet )?(food|feed)|dinner|entree|pate|recipe|formula|chunks in gravy|loaf|stew|canned (dog |cat )?food|dog food|cat food|pet food)\b/;

// Open Pet Food Facts files every pet food under generic parent categories such as
// "en:dog-and-cat-food"; they say nothing about which species a product is for.
const GENERIC_TAGS = /^(dog-and-cat-food|cat-and-dog-food|dogs-and-cats-food|pet-food|pet-foods|pets|animal-food|open-pet-food-facts|open-pet-food|pet-food-products|dry-pet-food|wet-pet-food|pet-treats)$/;

const stripLang = (t: string) => t.replace(/^[a-z]{2}:/, '').toLowerCase();

// Category tags that place a record among pet products (species not necessarily stated).
const PET_TAG = /(^|-)(pets?|petfood|dogs?|cats?|puppy|puppies|kittens?|canine|feline|chiens?|chats?|hunde?|katzen?|perros?|gatos?|cani|gatti)(-|$)|animal-food|pet-food|pet-treats|pet-supplements/;
const SUPPLEMENT_TAG = /(dietary|food)-supplements?|vitamins?|minerals?-supplements?|multivitamins?/;
const COSMETIC_TAG = /cosmetics?|shampoos?|soaps?|deodorants?|toothpastes?|creams?|lotions?|perfumes?|make-up|hygiene/;

// Feed-ingredient names used on cat and dog food labels (US AAFCO and EU feed naming) and practically
// never on food for people. Two different ones are evidence of an animal food, not of the species.
const FEED_MARKERS: [string, RegExp][] = [
  ['vitamin supplement', /\b(vitamin [a-k]\d*( [a-z]+)?|riboflavin|niacin|biotin|thiamine|folic acid) supplement\b/],
  ['proteinate', /\b(zinc|iron|copper|manganese|cobalt) proteinate\b/],
  ['meat meal', /\b(chicken|lamb|beef|turkey|duck|salmon|fish|herring|menhaden|whitefish|poultry|meat|meat and bone|pork|by product) meal\b/],
  ['beet pulp', /\bbeet pulp\b/],
  ['brewers yeast', /\bbrewers? (dried )?yeast\b/],
  ['animal digest', /\b(animal|natural) digest\b/],
  ['dried egg product', /\bdried egg product\b/],
  ['menadione', /\bmenadione\b/],
  ['preserved with mixed tocopherols', /\bpreserved with mixed tocopherols\b/],
  ['choline chloride', /\bcholine chloride\b/],
  ['calcium iodate', /\bcalcium iodate\b/],
  ['animal derivatives', /\b(meat and animal derivatives|animal derivatives|sous produits animaux|tierische nebenerzeugnisse|subproductos animales|sottoprodotti di origine animale|dierlijke bijproducten)\b/],
  ['nutritional additives', /\b(nutritional additives|additifs nutritionnels|ernahrungsphysiologische zusatzstoffe|aditivos nutricionales|additivi nutrizionali)\b/],
];

export function feedMarkers(ingredientsText: string | null | undefined): string[] {
  if (!ingredientsText) return [];
  const t = norm(ingredientsText).replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ');
  return FEED_MARKERS.filter(([, re]) => re.test(t)).map(([name]) => name);
}

function readableTag(t: string): string {
  return stripLang(t).replace(/-/g, ' ');
}

function tagsText(tags: string[]): string {
  return norm(
    tags
      .map((t) => t.replace(/^[a-z]{2}:/, '').toLowerCase())
      .filter((t) => !GENERIC_TAGS.test(t))
      .join(' | '),
  );
}

function speciesFrom(text: string, adequacy?: AdequacyStatement | null): ProductSpecies {
  const fromText = detectSpecies(text);
  const fromAdequacy = adequacy?.species ?? 'unknown';
  if (fromText === 'unknown') return fromAdequacy;
  if (fromAdequacy === 'unknown' || fromAdequacy === fromText) return fromText;
  // conflicting signals: trust the adequacy statement (it is the regulated claim)
  return fromAdequacy;
}

// "Hot dog", "corn dog", "hush puppies" and "langues de chat" are foods for people, not dog or cat products.
const notSpecies = (t: string) => t.replace(/\b(hot|corn|chili|chilli|chile|salty) ?dogs?\b|\bhush ?pupp(y|ies)\b|\blangues? de chats?\b|\bcat ?s claw\b|\bcat'?s claw\b|\bdog ?wood\b|\bcat ?nip tea\b/g, ' ');
// A record filed only under foods for people (biscuits, snacks) names a species only with pet context.
const PET_CONTEXT =
  /\b(for|pour|fur|para|per|voor) (my |your |the |all |adult |senior |small |large |indoor )?(dogs?|cats?|pupp(y|ies)|kittens?|chiens?|chats?|hunde?n?|katzen|perros?|gatos?|cani|gatti|honden|katten)\b|\b(dogs?|cats?|pupp(y|ies)|kittens?|canine|feline) (food|foods|treats?|chews?|snacks?|biscuits?|supplements?|kibble|dinner|meals?|formula|recipe)\b|\b(croquettes|patee|friandises|nourriture|aliment) (pour )?(chiens?|chats?)\b|\b(adult|senior|indoor|mature|junior) (cats?|dogs?)\b|\b(cats?|dogs?) (pouches|cans?|wet|dry|jelly|gravy|pate|chunks)\b/;
const isPetTag = (tag: string) => {
  const t = stripLang(tag);
  return GENERIC_TAGS.test(t) || PET_TAG.test(notSpecies(t.replace(/-/g, ' ')).trim().replace(/\s+/g, '-'));
};

export function classifyScope(input: ScopeInput): ScopeResult {
  const tags = notSpecies(tagsText(input.categoriesTags));
  const texts = notSpecies(norm(input.texts.filter(Boolean).join(' | ')));
  const all = `${tags} | ${texts}`;
  const signals: string[] = [];
  if (input.recordType) signals.push(`record-type:${input.recordType}`); // recorded as provenance; not used to decide
  const humanRecord = input.categoriesTags.length > 0 && !input.categoriesTags.some(isPetTag);
  const claims = humanRecord ? input.speciesClaims?.filter((c) => c.basis !== 'database_name' || PET_CONTEXT.test(norm(c.text))) : input.speciesClaims;
  const evidence = claims ? speciesEvidence(claims, input.adequacy) : undefined;
  const species = evidence ? speciesOfSet(evidence.set) : speciesFrom(all, input.adequacy);
  // Disputed sources are unresolved, never merged into "cats and dogs".
  const isPet = species !== 'unknown' || !!evidence?.disputed;
  if (isPet) signals.push(`species:${species}`);
  const markers = feedMarkers(input.ingredientsText);
  const petCategory = input.categoriesTags.some(isPetTag);
  if (petCategory) signals.push('pet-category');
  if (markers.length >= 2) signals.push(`feed-ingredients:${markers.slice(0, 3).join('+')}`);

  const out = (kind: OutOfScopeKind, reason: string): ScopeResult => ({
    status: 'out_of_scope',
    species,
    category: 'unknown',
    outOfScopeKind: kind,
    reason,
    signals: [...signals, `out_of_scope:${kind}`],
    ...(evidence ? { speciesEvidence: evidence } : {}),
    categoryBasis: 'none',
  });

  // Products for other animals or non-food items, even when found in the pet database.
  if (VET_MEDICINE.test(all)) return out('veterinary_medicine', 'This looks like a veterinary medicine or parasite treatment. Purrbi only assesses foods, treats and supplements; ask your veterinarian about medicines.');
  if (GROOMING.test(all)) return out('grooming_or_cosmetic', 'This looks like a grooming or care product, not a food, treat or supplement.');
  if (!isPet && LIVESTOCK.test(all)) return out('livestock_feed', 'This looks like feed for livestock or poultry. Purrbi only assesses products for cats and dogs.');
  if (!isPet && OTHER_ANIMAL.test(all)) return out('other_animal', 'This product appears to be for an animal other than a cat or dog.');
  if (!isPet && NON_FOOD.test(all)) return out('non_food', 'This looks like a pet accessory rather than a food, treat or supplement.');

  if (evidence?.disputed) {
    return { status: 'unknown', species: 'unknown', category: 'unknown', reason: evidence.note, signals: [...signals, 'species-disputed'], speciesEvidence: evidence, categoryBasis: 'none' };
  }
  if (!isPet) {
    // Affirmative evidence of another kind of product: the record's own categories are all of another
    // kind (e.g. breakfast cereals, shampoos), or a verified manufacturer page says it is for people;
    // and nothing points to an animal food. Being in a non-pet database is not such evidence.
    const animalHints = petCategory || markers.length >= 2;
    const otherCategories = input.categoriesTags.filter((t) => !isPetTag(t)).map(stripLang);
    const forPeople = /\bintended for (people|humans)\b/.test(texts);
    if (!animalHints && (otherCategories.length || forPeople)) {
      const listed = otherCategories.length ? `its record lists it under ${otherCategories.slice(-2).map(readableTag).join(' and ')}` : 'the manufacturer’s page describes it as a product for people';
      signals.push(otherCategories.length ? `non-pet-categories:${otherCategories.slice(-3).join('+')}` : 'research:for-people');
      const catText = otherCategories.join(' ');
      if (SUPPLEMENT_TAG.test(catText) || /\b(dietary supplements?|food supplements?)\b/.test(texts)) return out('human_supplement', `This looks like a dietary supplement for people: ${listed}, and nothing on it says it is made for cats or dogs.`);
      if (COSMETIC_TAG.test(catText) || input.recordType === 'beauty') return out('grooming_or_cosmetic', `This looks like a cosmetic or personal-care product: ${listed}, and nothing on it says it is made for cats or dogs.`);
      if (input.recordType === 'product' && !forPeople) return out('non_food', `This looks like a non-food product: ${listed}, and nothing on it says it is made for cats or dogs.`);
      return out('human_food', `This looks like food for people: ${listed}, and nothing on it says it is made for cats or dogs.`);
    }
    return {
      status: 'unknown',
      species,
      category: 'unknown',
      reason: animalHints
        ? 'This looks like an animal food, but nothing on its record says yet whether it is made for cats or dogs.'
        : 'We couldn’t yet confirm from the product information whether this is made for cats or dogs.',
      signals: [...signals, 'unresolved'],
      ...(evidence ? { speciesEvidence: evidence } : {}),
      categoryBasis: 'none',
    };
  }

  // The product type rests on the feeding statement first ("complete and balanced …", "for intermittent or
  // supplemental feeding"), then on the product being named a treat, topper, mixer or supplement. Words such
  // as broth, gravy, flaked or entrée say nothing about it ("Entrée in Broth" is often a complete food).
  let category: ProductCategory = 'unknown';
  let categoryBasis: CategoryBasis = 'none';
  const adequacyType = input.adequacy?.type;
  // A product named a supplement is one (supplements are their own category); a food "with probiotics" or
  // "with glucosamine" is not, and against a complete-and-balanced statement only the word supplement counts.
  const supplementNamed = adequacyType === 'complete' ? SUPPLEMENT_NAME.test(all) : SUPPLEMENT.test(withAdded(all));
  if (supplementNamed && adequacyType !== 'intermittent') {
    category = 'supplement';
    categoryBasis = 'feeding_purpose_name';
    signals.push('category:supplement-terms');
  } else if (adequacyType === 'complete') {
    category = 'complete_food';
    categoryBasis = 'adequacy_statement';
    signals.push('category:adequacy-complete');
  } else if (adequacyType === 'intermittent') {
    // "As with all treats, give as part of a balanced diet": the statement itself may name a treat.
    category = SUPPLEMENT.test(withAdded(texts)) ? 'supplement' : TREAT.test(all) || TREAT.test(norm(input.adequacy?.text ?? '')) ? 'treat' : 'complementary';
    categoryBasis = 'adequacy_statement';
    signals.push('category:adequacy-intermittent');
  } else if (TREAT.test(all)) {
    category = 'treat';
    categoryBasis = 'feeding_purpose_name';
    signals.push('category:treat-terms');
  } else if (COMPLEMENTARY.test(all)) {
    category = 'complementary';
    categoryBasis = 'feeding_purpose_name';
    signals.push('category:complementary-terms');
  } else if (COMPLETE_FOOD.test(all)) {
    category = 'complete_food';
    categoryBasis = 'product_type_words';
    signals.push('category:food-terms');
  }

  return {
    status: 'supported',
    species,
    category,
    reason:
      category === 'unknown'
        ? 'Made for cats or dogs, but the product type (food, treat or supplement) is unclear.'
        : 'Made for cats or dogs.',
    signals,
    ...(evidence ? { speciesEvidence: evidence } : {}),
    categoryBasis,
  };
}

export function categoryLabel(c: ProductCategory): string {
  return {
    complete_food: 'Complete food',
    treat: 'Treat',
    complementary: 'Topper or complementary food',
    supplement: 'Supplement',
    unknown: 'Product type unclear',
  }[c];
}

export function speciesLabel(s: ProductSpecies): string {
  return { cat: 'Cats', dog: 'Dogs', cat_and_dog: 'Cats and dogs', unknown: 'Species not stated' }[s];
}
