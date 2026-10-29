// Shared domain types. Every product fact carries the source it came from.

export type Species = 'cat' | 'dog';
export type ProductSpecies = 'cat' | 'dog' | 'cat_and_dog' | 'unknown';

export type ProductCategory =
  | 'complete_food'
  | 'treat'
  | 'complementary' // toppers, mixers, broths, complementary feeds
  | 'supplement'
  | 'unknown';

export type ScopeStatus = 'supported' | 'out_of_scope' | 'unknown';

export type OutOfScopeKind =
  | 'human_food'
  | 'human_supplement'
  | 'other_animal'
  | 'livestock_feed'
  | 'veterinary_medicine'
  | 'grooming_or_cosmetic'
  | 'non_food';

export type SourceType =
  | 'database' // e.g. Open Pet Food Facts
  | 'database_image' // a label image published in the database, read by AI
  | 'manufacturer' // manufacturer web page
  | 'retailer_or_web' // other web page found by research
  | 'official_notice' // FDA / openFDA
  | 'user_label'; // the owner's own label photo (private, unreviewed)

export type MatchConfidence = 'exact_barcode' | 'brand_and_product' | 'brand_only' | 'none';

export interface SourceRef {
  sourceId: string; // stable id, e.g. "opff:0012345678905"
  sourceType: SourceType;
  sourceName: string;
  url?: string;
  retrievedAt: string; // ISO-8601
  matchConfidence: MatchConfidence;
  license?: string;
  readerVersion?: string; // AI-read label images: the label reader that read them
}

export interface Fact<T> {
  value: T;
  source: SourceRef;
}

export type NutrientKey =
  | 'crude_protein'
  | 'crude_fat'
  | 'crude_fiber'
  | 'moisture'
  | 'ash'
  | 'calcium'
  | 'phosphorus'
  | 'sodium'
  | 'magnesium'
  | 'taurine'
  | 'omega_3'
  | 'omega_6'
  | 'dha'
  | 'epa'
  | 'carbohydrate'
  | 'other';

export interface GuaranteedAnalysisEntry {
  nutrient: NutrientKey;
  label: string; // as printed / as provided by the source
  qualifier: 'min' | 'max' | 'typical' | 'not_stated';
  value: number;
  unit: '%' | 'mg/kg' | 'IU/kg' | 'CFU/g' | 'CFU/lb' | 'mg' | 'g' | 'other';
}

export type CaloriePer = 'kg' | 'cup' | 'can' | 'treat' | 'piece' | 'pouch' | 'tray' | 'chew' | 'g' | '100g' | 'other';

/** A supplement's active ingredient as printed (amounts are per serving as stated). */
export interface ActiveIngredient {
  name: string;
  amount: number | null;
  unit: string | null;
  per: string | null; // "chew", "tablet", "scoop", "ml"...
}

export interface CalorieStatement {
  kcal: number;
  per: CaloriePer;
  text?: string;
}

export type LifeStageClaim = 'growth' | 'adult_maintenance' | 'all_life_stages' | 'gestation_lactation';

export interface AdequacyStatement {
  text: string;
  type: 'complete' | 'intermittent' | 'unclear';
  species: ProductSpecies;
  lifeStages: LifeStageClaim[];
  method: 'formulation' | 'feeding_trial' | 'unknown';
  /** true: "including growth of large size dogs"; false: "except…"; null: not stated / not applicable */
  largeSizeGrowth: boolean | null;
  style: 'aafco' | 'eu' | 'other';
}

export interface ScopeResult {
  status: ScopeStatus;
  species: ProductSpecies;
  category: ProductCategory;
  outOfScopeKind?: OutOfScopeKind;
  reason: string;
  signals: string[]; // which inputs drove the decision (for traceability)
}

export interface ProductFacts {
  gtin: string; // 14-digit key
  barcode: string; // digits as scanned
  productName?: Fact<string>;
  brand?: Fact<string>;
  imageUrl?: Fact<string>;
  ingredientsText?: Fact<string>;
  ingredients?: Fact<string[]>; // ordered, top-level, as printed
  ingredientsLanguage?: string;
  guaranteedAnalysis?: Fact<GuaranteedAnalysisEntry[]>;
  calories?: Fact<CalorieStatement[]>;
  adequacy?: Fact<AdequacyStatement>;
  feedingDirections?: Fact<string>;
  activeIngredients?: Fact<ActiveIngredient[]>; // supplements: "active ingredients per chew"
  /** raw classification inputs from sources (categories, labels, names), with what each one is */
  classificationSignals: ClassificationSignal[];
  /** the database record's own product type (Product Opener product_type: food, petfood, beauty, product); provenance only */
  recordType?: string;
  sources: SourceRef[];
}

/**
 * category: a database category tag (e.g. en:dog-food); label: a database label tag; name: a product or
 * generic name; research: a statement verified on a fetched web page; photo: printed text read from a
 * label photo. Signals saved before kinds existed have none.
 */
export interface ClassificationSignal {
  text: string;
  source: string;
  kind?: 'category' | 'label' | 'name' | 'research' | 'photo';
}

// ---- Pets ----------------------------------------------------------------

export type DisclosureStatus = 'none_reported' | 'not_sure' | 'not_provided' | 'reported';

export interface PetProfile {
  petId: string;
  name: string;
  species: Species;
  breed?: string | null;
  breedType?: 'known' | 'mixed' | 'unknown' | null;
  birthDate?: string | null; // ISO date
  approxAgeMonths?: number | null;
  ageCapturedAt?: string | null; // ISO date the approximate age was entered
  weightKg?: number | null;
  sex?: 'female' | 'male' | 'unknown' | null;
  neutered?: 'yes' | 'no' | 'unknown' | null;
  reproductiveStatus?: 'none' | 'pregnant' | 'lactating' | 'not_provided' | null;
  expectedAdultSize?: 'small' | 'medium' | 'large' | 'xlarge' | 'unknown' | null; // small <10 kg, medium 10-24, large 25-31, xlarge >=32 kg adult
  allergiesStatus?: DisclosureStatus | null;
  allergies?: string[];
  sensitivitiesStatus?: DisclosureStatus | null;
  sensitivities?: string[];
  vetDietStatus?: DisclosureStatus | null;
  vetDietNotes?: string | null;
  conditionsStatus?: DisclosureStatus | null;
  conditions?: string[];
  medicationsStatus?: DisclosureStatus | null;
  avoidIngredients?: string[];
  goals?: string[];
  profileVersion: number;
}

// ---- Assessment output ----------------------------------------------------

export type FindingKind = 'positive' | 'review' | 'alert' | 'missing' | 'info';

export interface Finding {
  kind: FindingKind;
  text: string;
  evidence: string; // "Product label (database)", "Owner-recorded", "Official notice", ...
  rule: string; // rule id for traceability
}

export interface ScoreComponent {
  key: string;
  label: string;
  points: number;
  maxPoints: number;
  status: 'met' | 'partly_met' | 'not_met' | 'unverified' | 'not_applicable';
  explanation: string;
}

export interface IngredientNote {
  name: string;
  position: number; // 1-based label order
  /** From Purrbi's curated list only (deterministic; the score uses it). */
  status: 'positive' | 'caution' | 'concern' | 'unknown' | 'info';
  note: string;
  sourceUrl?: string;
  sourceTitle?: string;
  /** Plain-language explanation: curated, or an AI summary of a cited page Purrbi verified. Never affects the score. */
  explanation?: string;
  explanationKind: 'curated' | 'cited_ai' | 'none';
  explanationSourceTitle?: string;
  explanationSourceUrl?: string;
  explanationQuote?: string;
}

export interface NutritionNote {
  nutrient: NutrientKey;
  label: string;
  meaning: string; // what the line means
  context: string; // comparison or calculation, '' when none
  contextSource: string;
}

export interface SupplementActiveNote {
  name: string;
  amountText: string; // "500 mg per chew" or "amount not stated"
  evidence: 'cited' | 'not_reviewed';
  note: string;
  sourceTitle: string;
  sourceUrl: string;
  quote: string;
}

export interface SupplementAssessment {
  purposes: { key: string; label: string; evidence: string }[];
  actives: SupplementActiveNote[];
  activesSource: string;
  warnings: Finding[];
  limitations: string[];
  qualitySignals: string[];
  summary: string;
}

export interface GeneralAssessment {
  methodologyVersion: string;
  kbVersion: string;
  category: ProductCategory;
  scoreApplicable: boolean;
  score: number | null;
  scoreBand: 'strong' | 'good' | 'review' | 'low' | null;
  scoreLabel: string;
  scoreProvisional: boolean;
  scoreWithheldReason: string | null;
  components: ScoreComponent[];
  findings: Finding[];
  ingredientNotes: IngredientNote[];
  nutritionNotes: NutritionNote[];
  nutritionContext: string[];
  supplement: SupplementAssessment | null;
  missingForScore: string[];
}

export type PersonalState =
  | 'fits'
  | 'review'
  | 'mismatch'
  | 'not_for_species'
  | 'alert'
  | 'incomplete'
  | 'no_pet'
  | 'not_applicable';

export interface TraceItem {
  input: string; // profile field used
  value: string;
  rule: string;
  effect: string;
}

export interface PersonalAssessment {
  petId: string | null;
  petName: string | null;
  profileVersion: number | null;
  state: PersonalState;
  headline: string;
  findings: Finding[];
  unresolved: string[];
  trace: TraceItem[];
}

export type RecallStatus = 'exact_active' | 'possible_active' | 'brand_history' | 'none_found' | 'unavailable' | 'not_checked';

export interface RecallRecord {
  recallNumber: string;
  status: string;
  classification: string;
  reason: string;
  reportDate: string;
  productDescription: string;
  recallingFirm: string;
  match: 'exact_barcode' | 'brand_and_product' | 'brand_only';
}

export interface RecallCheck {
  status: RecallStatus;
  summary: string;
  checkedAt: string;
  source: SourceRef | null;
  records: RecallRecord[];
}
