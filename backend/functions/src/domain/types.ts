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
  | 'verified_label' // an owner's label photo tied to this barcode (shared by the backend; unreviewed)
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

export type CaloriePer = 'kg' | 'cup' | 'can' | 'treat' | 'piece' | 'pouch' | 'tray' | 'chew' | 'g' | 'oz' | 'lb' | '100g' | 'other';

/** A supplement's active ingredient as printed (amounts are per serving as stated). */
export interface ActiveIngredient {
  name: string;
  amount: number | null;
  unit: string | null;
  per: string | null; // "chew", "tablet", "scoop", "ml"...
}

/** A package or serving size as printed ("2.8 oz", "85 g"), with its mass in grams when it is a mass. */
export interface PackageSize {
  amount: number;
  unit: 'oz' | 'lb' | 'g' | 'kg' | 'ml' | 'fl oz';
  grams: number | null;
  text: string;
}

export interface CalorieStatement {
  kcal: number;
  per: CaloriePer;
  text?: string;
  /** The package or piece the value is for ("per 2.8 oz can"): values for different sizes are never interchangeable. */
  size?: PackageSize;
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

/** Where the species a product is for comes from, strongest first. */
export type SpeciesBasis =
  | 'label' // the package itself (label photo or database label image)
  | 'adequacy_statement' // the nutritional adequacy statement names the species
  | 'manufacturer_page' // a manufacturer page shown to be this product
  | 'database_category' // the pet database's species category tags
  | 'database_name' // a name or label tag in the pet database record
  | 'retailer_listing' // a retailer's title, category or tags (abbreviated or catalogue wording)
  | 'none';

export interface SpeciesEvidence {
  /** Every species the product is for, as its evidence says (["cat", "dog"] for a dog-and-cat treat). */
  set: Species[];
  /** True when the strongest basis is the product's own label, its adequacy statement, its manufacturer or a pet database: a retailer's listing alone does not confirm it. */
  confirmed: boolean;
  basis: SpeciesBasis;
  /** Strong sources name different species (e.g. a cat-food label and a dog-food page): unresolved, never merged. */
  disputed: boolean;
  /** Species a weaker confirming source names besides `set` (e.g. a database record naming cats and dogs under a manufacturer's dog page): never a confirmed mismatch for them. */
  alsoNamed?: Species[];
  note: string;
}

/** What the product type (complete food, treat, topper, supplement) rests on. */
export type CategoryBasis =
  | 'adequacy_statement' // "complete and balanced …" or "for intermittent or supplemental feeding"
  | 'feeding_purpose_name' // the product is named a treat, topper, mixer or supplement
  | 'product_type_words' // only general words such as "cat food" or "wet dog food" (unconfirmed)
  | 'none';

export interface ScopeResult {
  status: ScopeStatus;
  species: ProductSpecies;
  category: ProductCategory;
  outOfScopeKind?: OutOfScopeKind;
  reason: string;
  signals: string[]; // which inputs drove the decision (for traceability)
  speciesEvidence?: SpeciesEvidence;
  categoryBasis?: CategoryBasis;
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
  /** The size of the package this barcode is for, as printed on a page proven to be this product or on the label. */
  packageSize?: Fact<PackageSize>;
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

// ---- Ingredient assessment (one row per label entry) -----------------------

export type IngredientColor = 'green' | 'yellow' | 'red' | 'gray';
export type ClaimType = 'identity' | 'function' | 'benefit' | 'risk';
/** Who or what a source's statement is about: a pig-nutrition page or a human food-additive review is not cat or dog evidence. */
export type SpeciesScope = 'cat' | 'dog' | 'cat_and_dog' | 'pets' | 'animal_feed' | 'other_species' | 'people' | 'not_species_specific';
export type EvidenceKind = 'regulation' | 'regulatory_assessment' | 'standards_body' | 'veterinary_reference' | 'peer_reviewed' | 'curated' | 'other';

/** One displayed claim with the passage that supports it (claim-by-claim validation). */
export interface ClaimSource {
  claimType: ClaimType;
  claim: string; // as shown: narrowed to what the passage supports
  ingredientForm: string; // the exact ingredient or chemical form the claim is about
  title: string;
  url: string;
  passage: string; // verbatim from the source
  speciesScope: SpeciesScope;
  evidence: EvidenceKind;
  doseContext: string; // exposure or dose the passage refers to; '' when not stated
  retrievedAt: string; // ISO date-time the page was fetched and checked
  publishedAt: string; // the page's own date when it gives one, else ''
  reviewStatus: 'automated_checks' | 'curated_unreviewed' | 'vet_reviewed';
}

export interface IngredientStatuses {
  identity: 'established' | 'not_established';
  role: 'explained' | 'not_explained';
  risk: 'documented_concern' | 'documented_caution' | 'consideration' | 'none_in_reviewed_list' | 'not_assessed';
  exposure: 'assessed' | 'not_assessed';
  humanReview: 'performed' | 'not_performed';
}

export interface IngredientRow {
  id: string; // "13" for a label entry, "13.2" for the second item of its group
  position: number; // label order (1-based)
  childIndex: number; // 0 for a label entry, 1-based within its group
  name: string; // as printed, without a group's bracketed list
  labelText: string; // the entry exactly as printed (traceability)
  kind: 'single' | 'group' | 'compound' | 'child';
  role: string;
  color: IngredientColor;
  reason: string; // one line: why this color
  statuses: IngredientStatuses;
  whatItIs: string;
  whyUsed: string;
  benefitsRisks: string;
  uncertainty: string;
  sources: ClaimSource[];
  children: IngredientRow[];
  concernRank: number; // red 3, yellow 2, gray 1, green 0 (for the concern-first order)
  kbId?: string;
  concernFor?: Species[];
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
  /** From Purrbi's curated list only (deterministic). A documented concern caps the score; nothing else does. */
  status: 'positive' | 'caution' | 'concern' | 'unknown' | 'info';
  note: string;
  /** The curated entry it matched (one finding per entry, however many forms are listed). */
  kbId?: string;
  /** The species a concern or caution applies to. */
  concernFor?: Species[];
  /** What the ingredient does (curated role table, or a verified cited explanation). Never changes the score. */
  role?: string;
  roleSource?: 'curated' | 'cited_ai';
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
  /** points' worth of label information the score rests on (components with evidence), 0-100 */
  scoreCoverage: number | null;
  /** the highest the score could reach once the unverified components are confirmed */
  scoreMaxPossible: number | null;
  /** the lowest it could reach (every unverified component failed); the score lies between the two */
  scoreMinPossible?: number | null;
  /** one line on what the score rests on and what is missing */
  scoreBasis: string;
  /** green (strong, good), yellow (fair), red (weak or a serious concern), gray (not scored) */
  ratingColor: 'green' | 'yellow' | 'red' | 'gray';
  /** what the score covers, kept apart from the score: "Based on 4 of 5 parts: … (calories not found)" */
  coverageText: string;
  /** documented serious concerns that cap the score, each with its evidence */
  criticalConcerns: string[];
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
