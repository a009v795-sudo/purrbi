// Scope: Purrbi assesses products intended for cats or dogs only (foods, treats, toppers,
// complementary foods, supplements). Species comes from the product's own data, never
// from the owner's selected pet.
import { detectSpecies } from './adequacy';
import type { AdequacyStatement, OutOfScopeKind, ProductCategory, ProductSpecies, ScopeResult } from './types';

export type DatabaseOrigin = 'opff' | 'off' | 'obf' | 'opf' | 'web' | 'label';

export interface ScopeInput {
  origin: DatabaseOrigin;
  categoriesTags: string[];
  texts: string[]; // product name, generic name, labels — as provided
  adequacy?: AdequacyStatement | null;
}

const norm = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[-_:]/g, ' ')
    .replace(/\s+/g, ' ');

const OTHER_ANIMAL =
  /\b(bird|birds|parrot|budgie|canary|finch|rabbit|rabbits|hamster|guinea pig|rodent|rodents|ferret|chinchilla|gerbil|rat food|mouse food|reptile|turtle|tortoise|aquarium|koi|goldfish|tropical fish|fish food|fish flakes|pond fish|horse|horses|equine|pony)\b/;
const LIVESTOCK =
  /\b(livestock|cattle|calf|calves|dairy cow|poultry feed|layer(s)? (pellets|feed|mash)|chick starter|broiler feed|pig feed|swine|sheep|goat feed|goats|game feed|deer feed)\b/;
const VET_MEDICINE =
  /\b(flea|fleas|tick|ticks|dewormer|deworming|wormer|worming|anthelmintic|praziquantel|pyrantel|fenbendazole|milbemycin|ivermectin|selamectin|fipronil|imidacloprid|fluralaner|sarolaner|afoxolaner|spinosad|moxidectin|rx only|prescription only medicine|antibiotic|carprofen|meloxicam)\b/;
const GROOMING =
  /\b(shampoo|conditioner|grooming|cologne|perfume|deodori[sz]er|deodori[sz]ing spray|wipes|toothpaste|ear cleaner|paw balm|nose balm|coat spray|detangler)\b/;
const NON_FOOD = /\b(litter|toy|toys|collar|leash|harness|bowl|bed|scratcher|carrier)\b/;

const SUPPLEMENT =
  /\b(supplements?|multivitamins?|vitamins?|probiotics?|prebiotics?|glucosamine|chondroitin|joint (support|health|care|chews?)|hip (and|&) joint|fish oil|salmon oil|krill oil|pollock oil|calming (chews?|aid|supplement)|digestive (aid|support|chews?)|immune (support|chews?)|skin (and|&) coat (chews?|supplement|oil)|urinary (support|health) chews?|l lysine|lysine)\b/;
const TREAT =
  /\b(treats?|snacks?|dental (chews?|sticks?)|chews?|biscuits?|jerky|cookies|bully stick|rawhide|lickable|puree tubes?|creamy treats?|training bites|crunchies)\b/;
const COMPLEMENTARY = /\b(toppers?|mixers?|meal enhancers?|broths?|bone broth|gravy topper|food topper|complementary (pet )?(food|feed)|complementary feedingstuff)\b/;
const COMPLETE_FOOD =
  /\b(kibble|dry (dog |cat )?food|wet (dog |cat )?food|complete (pet |dry |wet )?(food|feed)|dinner|entree|pate|recipe|formula|chunks in gravy|loaf|stew|canned (dog |cat )?food|dog food|cat food|pet food)\b/;

// Open Pet Food Facts files every pet food under generic parent categories such as
// "en:dog-and-cat-food"; they say nothing about which species a product is for.
const GENERIC_TAGS = /^(dog-and-cat-food|cat-and-dog-food|dogs-and-cats-food|pet-food|pet-foods|pets|animal-food|open-pet-food-facts|open-pet-food|pet-food-products|dry-pet-food|wet-pet-food|pet-treats)$/;

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

export function classifyScope(input: ScopeInput): ScopeResult {
  const tags = tagsText(input.categoriesTags);
  const texts = norm(input.texts.filter(Boolean).join(' | '));
  const all = `${tags} | ${texts}`;
  const signals: string[] = [];
  const species = speciesFrom(all, input.adequacy);
  const isPet = species !== 'unknown';
  if (isPet) signals.push(`species:${species}`);

  const out = (kind: OutOfScopeKind, reason: string): ScopeResult => ({
    status: 'out_of_scope',
    species,
    category: 'unknown',
    outOfScopeKind: kind,
    reason,
    signals: [...signals, `out_of_scope:${kind}`],
  });

  // Products for other animals or non-food items, even when found in the pet database.
  if (VET_MEDICINE.test(all)) return out('veterinary_medicine', 'This looks like a veterinary medicine or parasite treatment. Purrbi only assesses foods, treats and supplements; ask your veterinarian about medicines.');
  if (GROOMING.test(all)) return out('grooming_or_cosmetic', 'This looks like a grooming or care product, not a food, treat or supplement.');
  if (!isPet && LIVESTOCK.test(all)) return out('livestock_feed', 'This looks like feed for livestock or poultry. Purrbi only assesses products for cats and dogs.');
  if (!isPet && OTHER_ANIMAL.test(all)) return out('other_animal', 'This product appears to be for an animal other than a cat or dog.');
  if (!isPet && NON_FOOD.test(all)) return out('non_food', 'This looks like a pet accessory rather than a food, treat or supplement.');

  if (input.origin === 'off' && !isPet) {
    const supplement = /\b(dietary supplements?|food supplements?|vitamins?)\b/.test(all);
    return supplement
      ? out('human_supplement', 'This barcode is listed as a human dietary supplement. Purrbi only assesses products made for cats and dogs.')
      : out('human_food', 'This barcode is listed as a human food product. Purrbi only assesses products made for cats and dogs.');
  }
  if (input.origin === 'obf' && !isPet) return out('grooming_or_cosmetic', 'This barcode is listed as a cosmetic or personal-care product.');
  if (input.origin === 'opf' && !isPet) return out('non_food', 'This barcode is listed as a non-food product.');

  if (!isPet) {
    return {
      status: 'unknown',
      species,
      category: 'unknown',
      reason: "We couldn't confirm from the product information that this is made for cats or dogs.",
      signals,
    };
  }

  let category: ProductCategory = 'unknown';
  const adequacyType = input.adequacy?.type;
  if (SUPPLEMENT.test(all)) {
    category = 'supplement';
    signals.push('category:supplement-terms');
  } else if (TREAT.test(all)) {
    category = 'treat';
    signals.push('category:treat-terms');
  } else if (COMPLEMENTARY.test(all)) {
    category = 'complementary';
    signals.push('category:complementary-terms');
  } else if (adequacyType === 'complete') {
    category = 'complete_food';
    signals.push('category:adequacy-complete');
  } else if (adequacyType === 'intermittent') {
    category = 'complementary';
    signals.push('category:adequacy-intermittent');
  } else if (COMPLETE_FOOD.test(all)) {
    category = 'complete_food';
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
