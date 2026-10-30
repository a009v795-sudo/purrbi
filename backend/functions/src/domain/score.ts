// Purrbi product score 3.0.0 — deterministic and versioned; Purrbi's own provisional methodology (not an
// FDA, AAFCO, WSAVA or veterinary rating; no qualified reviewer has reviewed it). It rates what the label
// shows about the product for its intended use, independent of any pet. Documented in METHODOLOGY.md.
//
//  - Category-appropriate parts, worth 100 points per category. Each part needs evidence: a part whose
//    evidence was not found is left out (never scored as failed), and the score is the share of points
//    earned on the parts assessed. What the score covers is reported separately (coverage).
//  - Essential parts must be assessed before any number is shown; a number is also shown only when the
//    parts assessed are worth at least MIN_COVERAGE points. Otherwise the result is "not enough
//    information" with the exact missing requirement, and the findings found so far are still shown.
//  - Complete foods: the nutritional adequacy statement, protein and fat against the AAFCO minimums on a
//    dry-matter basis (from the guaranteed minimums and maximum moisture, so conservative), named
//    ingredient sources, the calorie statement and further guarantees.
//  - Treats and toppers: named ingredient sources, the calorie statement (portion control), the feeding
//    statement and the guaranteed analysis.
//  - Ingredients count once each, in label order: a vitamin or mineral blend is one entry, never several
//    "good" ones, and no ingredient is scored good or bad by its name.
//  - A documented species-specific concern (Purrbi's reviewed list) caps the score at HAZARD_CAP, whatever
//    else the label shows: favourable parts cannot average it away. It is counted only there (no double
//    penalty). A context-dependent caution is shown but never caps or lowers the score.
//  - Supplements get no number: their purpose, dose and evidence vary by ingredient.
import { lifeStageLabel } from './adequacy';
import { ingredientNotes, KB_VERSION } from './kb';
import { aafcoTarget, describeCalories, dryMatterPercent, energyPerKgDm, findNutrient, hasCoreGuaranteedAnalysis } from './nutrition';
import { nutritionContext, nutritionNotes } from './nutritionContext';
import { normalizeIngredientName, parseIngredientList, type ParsedIngredient } from './ingredients';
import { categoryLabel } from './scope';
import { assessSupplement } from './supplements';
import type {
  Finding,
  GeneralAssessment,
  IngredientNote,
  ProductCategory,
  ProductFacts,
  ScopeResult,
  ScoreComponent,
  SourceRef,
  Species,
} from './types';

export const METHODOLOGY_VERSION = 'purrbi-score-3.0.0';
/** A documented concern for the product's species caps the score here. */
export const HAZARD_CAP = 20;
/** A number is shown only when the parts assessed are worth at least this many points. */
export const MIN_COVERAGE = 70;

/** AAFCO minimums, % of dry matter (AAFCO Dog and Cat Food Nutrient Profiles). */
export const AAFCO_MIN: Record<Species, Record<'adult' | 'growth', { protein: number; fat: number }>> = {
  cat: { adult: { protein: 26, fat: 9 }, growth: { protein: 30, fat: 9 } },
  dog: { adult: { protein: 18, fat: 5.5 }, growth: { protein: 22.5, fat: 8.5 } },
};

/**
 * Minimum evidence per category: the parts without which no number is given, and the optional ones that
 * only change the coverage. Identity, species and category come first for every category.
 */
export const MINIMUM_EVIDENCE: Record<'complete_food' | 'treat' | 'complementary' | 'supplement', { essential: string[]; optional: string[] }> = {
  complete_food: { essential: ['nutritional adequacy statement', 'guaranteed analysis (protein, fat; moisture for the dry-matter comparison)', 'ingredient list'], optional: ['calorie content statement', 'further guarantees'] },
  treat: { essential: ['ingredient list', 'calorie content statement, or both the feeding statement and the guaranteed analysis'], optional: ['feeding statement', 'guaranteed analysis'] },
  complementary: { essential: ['ingredient list', 'calorie content statement, or both the feeding statement and the guaranteed analysis'], optional: ['feeding statement', 'guaranteed analysis'] },
  supplement: { essential: ['active ingredients or ingredient list'], optional: ['amounts per serving', 'warnings', 'quality signals'] },
};

export function evidenceLabel(src: SourceRef | undefined): string {
  if (!src) return 'Unknown source';
  switch (src.sourceType) {
    case 'database':
      return `${src.sourceName} record`;
    case 'database_image':
      return `${src.sourceName} (read by AI, not reviewed)`;
    case 'user_label':
      return 'Your label photo (read by AI, not reviewed)';
    case 'verified_label':
      return 'A label photo matched to this barcode (read by AI, not reviewed)';
    case 'manufacturer':
      return 'Manufacturer web page';
    case 'retailer_or_web':
      return 'Web page';
    case 'official_notice':
      return src.sourceName;
  }
}

export function productIngredients(facts: ProductFacts): ParsedIngredient[] {
  if (facts.ingredientsText?.value) return parseIngredientList(facts.ingredientsText.value);
  if (facts.ingredients?.value?.length) return parseIngredientList(facts.ingredients.value.join(', '));
  return [];
}

export function speciesList(s: ScopeResult['species']): Species[] {
  if (s === 'cat') return ['cat'];
  if (s === 'dog') return ['dog'];
  return ['cat', 'dog'];
}

/**
 * The species a product is assessed for: who it is for, or both while that is unconfirmed (a retailer's
 * "Dog Trt …" listing alone): weak evidence never makes a result less careful than no evidence.
 */
export function assessedSpecies(scope: ScopeResult): Species[] {
  return scope.speciesEvidence && !scope.speciesEvidence.confirmed ? ['cat', 'dog'] : speciesList(scope.species);
}

function band(score: number): { band: GeneralAssessment['scoreBand']; label: string; color: GeneralAssessment['ratingColor'] } {
  if (score >= 85) return { band: 'strong', label: 'Strong', color: 'green' };
  if (score >= 70) return { band: 'good', label: 'Good', color: 'green' };
  if (score >= 50) return { band: 'review', label: 'Fair', color: 'yellow' };
  return { band: 'low', label: 'Weak', color: 'red' };
}

/** Documented concerns for the species, one per curated entry however many forms are listed. */
function hazards(notes: IngredientNote[]): IngredientNote[] {
  const seen = new Set<string>();
  return notes.filter((n) => n.status === 'concern' && !seen.has(n.kbId ?? n.name) && !!seen.add(n.kbId ?? n.name));
}

const speciesNames = (s: ScopeResult['species']) => (s === 'cat' ? 'cats' : s === 'dog' ? 'dogs' : 'cats or dogs');

// Ingredients that are not a source of the food: processing liquids, vitamin and mineral additions and
// technological additives. Left out when judging how clearly the main ingredients are named.
const NOT_A_SOURCE = /\b(water|broth|stock|vitamins?|minerals?|mineralstoffe|substances minerales|sels mineraux|sustancias minerales|sostanze minerali|mineralen|premix|supplement|chelate|proteinate|chloride|sulfate|sulphate|phosphate|carbonate|oxide|iodide|iodate|selenite|selenium yeast|taurine|choline|menadione|gum|carrageenan|agar|gelatin|tocopherols?|rosemary extract|citric acid|salt|colou?r)\b/;
// Names that do not say which animal or plant the ingredient comes from ("meat by-products", "poultry fat",
// "fish meal", "natural flavor"). "Chicken by-product meal" names its animal: what part of it is used is not
// what this checks.
// The same generic names in the EU label languages ("Viandes et sous-produits animaux", "Fleisch und tierische
// Nebenerzeugnisse", "céréales", "huiles et graisses") and the common US ones ("ocean fish", "liver",
// "natural and artificial flavors").
const GENERIC_SOURCE =
  /^(?:meats?|animal|poultry|fish|ocean fish|white fish|fowl|by-?products?|derivatives|digest|cereals?|grains?|vegetables?|vegetable (?:protein extracts?|oils?|fats?)|oils and fats|fats and oils|(?:natural|artificial)(?: and (?:natural|artificial))? flavou?rs?|flavou?rs?|liver$|viandes?|poissons?|cereales|sous[- ]produits|huiles? et graisses|graisses et huiles|extraits? de proteines vegetales|substances minerales|fleisch|fisch|tierische|getreide|pflanzliche|ole und fette|fette und ole|carnes?|pescados?|cereales|aceites y grasas|subproductos|carni|pesce|cereali|oli e grassi|sottoprodotti|vlees|vis|granen|olien en vetten|dierlijke bijproducten|plantaardige|sugars?|sucres?|zucker|azucares|zuccheri|suikers)\b/;

/** Whether an ingredient name says which animal or plant it comes from ("chicken meal" yes, "meat by-products" no). */
export function namedSource(name: string): boolean {
  const n = normalizeIngredientName(name.replace(/\([^)]*\)|\[[^\]]*\]/g, ' '));
  return !!n && !GENERIC_SOURCE.test(n);
}

/** The first five source ingredients (label order, blends and additives left out). */
export function mainSources(ingredients: ParsedIngredient[]): ParsedIngredient[] {
  // "Chicken fat (preserved with mixed tocopherols)" is a fat source: what it is preserved with is not.
  return ingredients.filter((i) => i.kind !== 'group' && !NOT_A_SOURCE.test(normalizeIngredientName(i.name.replace(/\([^)]*\)|\[[^\]]*\]/g, ' ')))).slice(0, 5);
}

function namedSourcesComponent(ingredients: ParsedIngredient[], max: number): ScoreComponent {
  const main = mainSources(ingredients);
  const label = 'Main ingredients named by source';
  if (!main.length) return { key: 'named_sources', label, points: max, maxPoints: max, status: 'met', explanation: 'The listed ingredients are processing liquids, nutrients and additives only.' };
  const named = main.filter((i) => namedSource(i.name));
  const points = Math.round((max * named.length) / main.length);
  const generic = main.filter((i) => !namedSource(i.name)).map((i) => i.name);
  return {
    key: 'named_sources',
    label,
    points,
    maxPoints: max,
    status: points === max ? 'met' : points === 0 ? 'not_met' : 'partly_met',
    explanation: generic.length
      ? `${named.length} of the first ${main.length} main ingredients say which animal or plant they come from; ${generic.slice(0, 2).join(', ')} ${generic.length === 1 ? 'does' : 'do'} not (this matters most for pets with food allergies).`
      : `The first ${main.length} main ingredients each say which animal or plant they come from.`,
  };
}

/**
 * Protein and fat against the AAFCO minimums for the product's species and life stage, on a dry-matter
 * basis from the guaranteed minimums and the maximum moisture (conservative: the true values can only be
 * higher). Without moisture, a value already at the minimum as fed passes (as fed is never above dry matter).
 */
function proteinFatComponent(facts: ProductFacts, scope: ScopeResult, max: number): ScoreComponent | null {
  const ga = facts.guaranteedAnalysis?.value;
  const p = findNutrient(ga, 'crude_protein');
  const f = findNutrient(ga, 'crude_fat');
  if (!p || !f || p.unit !== '%' || f.unit !== '%') return null;
  const stages = facts.adequacy?.value.lifeStages ?? [];
  const stage = stages.some((x) => x === 'growth' || x === 'all_life_stages' || x === 'gestation_lactation') ? 'growth' : 'adult';
  const species = assessedSpecies(scope);
  const moisture = findNutrient(ga, 'moisture');
  const dm = (v: number) => (moisture?.unit === '%' ? dryMatterPercent(v, moisture.value) : null);
  // As the nutrition rows: a food denser than AAFCO's 4,000 kcal per kg of dry matter must contain more.
  const energyDm = moisture?.unit === '%' ? energyPerKgDm(facts.calories?.value, moisture.value) : null;
  const meets = (value: number, min: number) => {
    const d = dm(value);
    return d !== null ? d >= aafcoTarget(min, energyDm).target : value >= min ? true : null;
  };
  // A product for both species (or not yet confirmed for one) is held to the stricter (cat) minimums.
  const min = species.map((sp) => AAFCO_MIN[sp][stage]).reduce((a, b) => ({ protein: Math.max(a.protein, b.protein), fat: Math.max(a.fat, b.fat) }));
  const pm = meets(p.value, min.protein);
  const fm = meets(f.value, min.fat);
  const label = 'Protein and fat (AAFCO minimums, dry matter)';
  if (pm === null || fm === null) return { key: 'protein_fat', label, points: 0, maxPoints: max, status: 'unverified', explanation: 'Moisture isn’t available, so protein and fat can’t be compared on a dry-matter basis.' };
  const both = pm && fm;
  const points = both ? max : pm || fm ? Math.round(max * 0.4) : 0;
  const show = (v: number) => (dm(v) === null ? `${v}% as fed` : `≈ ${dm(v)}% of dry matter`);
  const minText = (m: number) => {
    const t = aafcoTarget(m, dm(p.value) === null ? null : energyDm);
    return t.corrected ? `minimum ${m}%, ≈ ${t.target}% at this food’s energy density` : `minimum ${m}%`;
  };
  return {
    key: 'protein_fat',
    label,
    points,
    maxPoints: max,
    status: both ? 'met' : points ? 'partly_met' : 'not_met',
    explanation: `Protein ${show(p.value)} (${minText(min.protein)}), fat ${show(f.value)} (${minText(min.fat)}) for ${stage === 'growth' ? 'growth' : 'adult maintenance'}; from the guaranteed minimums, so actual amounts can be higher.`,
  };
}

/**
 * What a rating still needs, from the parts actually missing: the smallest sets of them that would bring the
 * coverage to the minimum ("calorie content statement, or the feeding statement and the guaranteed analysis").
 */
function whatWouldReach(coverage: number, missing: ScoreComponent[]): string {
  const sets: ScoreComponent[][] = [];
  for (let mask = 1; mask < 1 << missing.length; mask++) {
    const set = missing.filter((_, i) => mask & (1 << i));
    if (coverage + set.reduce((s, c) => s + c.maxPoints, 0) >= MIN_COVERAGE) sets.push(set);
  }
  // Each alternative that suffices, without anything it doesn't need.
  const minimal = sets.filter((s) => !sets.some((t) => t.length < s.length && t.every((x) => s.includes(x)))).sort((a, b) => a.length - b.length).slice(0, 3);
  const name = (c: ScoreComponent) => c.label.toLowerCase().replace(/\s*\(.*\)$/, '');
  const say = (set: ScoreComponent[], i: number) => (set.length === 1 ? `${i ? 'the ' : ''}${name(set[0])}` : `both the ${set.map(name).join(' and the ')}`);
  return minimal.length ? minimal.map(say).join(', or ') : missing.map(name).join(' and the ');
}

function extraGuaranteesComponent(facts: ProductFacts, max: number): ScoreComponent {
  const ga = facts.guaranteedAnalysis?.value ?? [];
  const extras = new Set(ga.filter((e) => !['crude_protein', 'crude_fat', 'crude_fiber', 'moisture', 'other'].includes(e.nutrient)).map((e) => e.nutrient));
  const label = 'Further guarantees';
  const fromDatabase = facts.guaranteedAnalysis?.source.sourceType === 'database';
  if (!ga.length || (!extras.size && fromDatabase)) return { key: 'extra_guarantees', label, points: 0, maxPoints: max, status: 'unverified', explanation: fromDatabase ? 'The database record lists no further guarantees; the package may list more.' : 'No guaranteed analysis is available.' };
  const named = [...extras].map((x) => x.replace('_', '-')).join(', ');
  if (extras.size >= 2) return { key: 'extra_guarantees', label, points: max, maxPoints: max, status: 'met', explanation: `Also guarantees ${named}.` };
  if (extras.size === 1) return { key: 'extra_guarantees', label, points: Math.round(max * 0.6), maxPoints: max, status: 'partly_met', explanation: `Also guarantees ${named}.` };
  return { key: 'extra_guarantees', label, points: 0, maxPoints: max, status: 'not_met', explanation: 'The label lists no guarantees beyond the required nutrients.' };
}

const caloriesComponent = (facts: ProductFacts, max: number, why: string): ScoreComponent =>
  facts.calories?.value.length
    ? { key: 'calories', label: 'Calorie content statement', points: max, maxPoints: max, status: 'met', explanation: `Calorie content is listed (${describeCalories(facts.calories.value[0])}), ${why}.` }
    : { key: 'calories', label: 'Calorie content statement', points: 0, maxPoints: max, status: 'unverified', explanation: 'Not found yet.' };

export function assessGeneral(facts: ProductFacts, scope: ScopeResult): GeneralAssessment {
  const ingredients = productIngredients(facts);
  const species = assessedSpecies(scope);
  const notes = ingredientNotes(ingredients, species);
  const findings: Finding[] = [];
  const base = { methodologyVersion: METHODOLOGY_VERSION, kbVersion: KB_VERSION, ingredientNotes: notes, nutritionNotes: [], nutritionContext: [], supplement: null, criticalConcerns: [] as string[] };
  const unscored = (over: Partial<GeneralAssessment>): GeneralAssessment => ({
    ...base,
    category: 'unknown',
    scoreApplicable: false,
    score: null,
    scoreBand: null,
    scoreLabel: 'Not assessed',
    scoreProvisional: false,
    scoreWithheldReason: null,
    scoreCoverage: null,
    scoreMaxPossible: null,
    scoreMinPossible: null,
    scoreBasis: '',
    ratingColor: 'gray',
    coverageText: '',
    components: [],
    findings,
    missingForScore: [],
    ...over,
  });

  if (scope.status === 'out_of_scope') {
    findings.push({ kind: 'info', text: scope.reason, evidence: 'Product classification', rule: 'G-SCOPE' });
    return unscored({ scoreWithheldReason: scope.reason });
  }

  const adequacy = facts.adequacy?.value;
  let category: ProductCategory = scope.category;
  if (category === 'complete_food' && adequacy?.type === 'intermittent') {
    category = 'complementary';
    findings.push({ kind: 'review', text: 'The label says this is for intermittent or supplemental feeding, so it is assessed as a complementary product, not a complete diet.', evidence: evidenceLabel(facts.adequacy?.source), rule: 'G-CATEGORY' });
  }

  const explained = {
    ...base,
    nutritionNotes: category === 'supplement' ? [] : nutritionNotes(facts.guaranteedAnalysis?.value, { species: scope.species, category, adequacy, calories: facts.calories?.value }),
    nutritionContext: category === 'supplement' ? [] : nutritionContext(facts.guaranteedAnalysis?.value, facts.calories?.value),
    supplement: category === 'supplement' ? assessSupplement(facts, notes) : null,
  };
  if ([facts.ingredientsText, facts.guaranteedAnalysis, facts.adequacy, facts.calories, facts.activeIngredients].some((f) => f?.source.sourceType === 'database_image')) {
    findings.push({ kind: 'info', text: 'Some details were read by AI from a label image published in the product database. Check them against the package.', evidence: 'Database label image', rule: 'G-DBIMAGE' });
  }

  // ---- General findings (pet-independent) ----
  if (adequacy) {
    const ev = evidenceLabel(facts.adequacy?.source);
    if (adequacy.type === 'complete') {
      const stages = adequacy.lifeStages.length ? adequacy.lifeStages.map(lifeStageLabel).join(', ') : 'an unstated life stage';
      const how = adequacy.method === 'feeding_trial' ? 'substantiated by animal feeding tests' : adequacy.method === 'formulation' ? 'by formulation' : 'as stated on the label';
      findings.push({ kind: 'positive', text: `Labeled complete and balanced for ${stages} (${how}).`, evidence: ev, rule: 'G-ADEQUACY' });
    } else if (adequacy.type === 'intermittent') {
      findings.push({ kind: category === 'complete_food' ? 'review' : 'info', text: 'Labeled for intermittent or supplemental feeding only — not a complete diet on its own.', evidence: ev, rule: 'G-ADEQUACY' });
    } else {
      findings.push({ kind: 'review', text: 'A feeding statement was found but it does not clearly say what the product is complete and balanced for.', evidence: ev, rule: 'G-ADEQUACY' });
    }
  } else if (category === 'complete_food') {
    findings.push({ kind: 'missing', text: 'No nutritional adequacy ("complete and balanced") statement is available yet.', evidence: 'Missing evidence', rule: 'G-ADEQUACY' });
  }

  const ga = facts.guaranteedAnalysis?.value;
  if (ga?.length) {
    const p = findNutrient(ga, 'crude_protein');
    const f = findNutrient(ga, 'crude_fat');
    const fi = findNutrient(ga, 'crude_fiber');
    const m = findNutrient(ga, 'moisture');
    const q = (e: { qualifier: string }) => (e.qualifier === 'min' ? ' min' : e.qualifier === 'max' ? ' max' : '');
    const parts = [p && `protein ${p.value}%${q(p)}`, f && `fat ${f.value}%${q(f)}`, fi && `fiber ${fi.value}%${q(fi)}`, m && `moisture ${m.value}%${q(m)}`].filter(Boolean);
    if (parts.length) findings.push({ kind: 'info', text: `Guaranteed analysis: ${parts.join(', ')}.`, evidence: evidenceLabel(facts.guaranteedAnalysis?.source), rule: 'G-GA' });
  } else if (category !== 'supplement') {
    findings.push({ kind: 'missing', text: 'Guaranteed analysis (protein, fat, fiber) is not available yet.', evidence: 'Missing evidence', rule: 'G-GA' });
  }

  const cals = facts.calories?.value;
  if (cals?.length) findings.push({ kind: 'info', text: `Calorie content: ${cals.map(describeCalories).join('; ')}.`, evidence: evidenceLabel(facts.calories?.source), rule: 'G-CALORIES' });
  else if (category !== 'supplement') findings.push({ kind: 'missing', text: 'Calorie content is not available yet.', evidence: 'Missing evidence', rule: 'G-CALORIES' });

  // One finding per curated entry, naming every form listed ("garlic, garlic powder").
  const byEntry = new Map<string, IngredientNote[]>();
  for (const n of notes) if (n.status === 'concern' || n.status === 'caution') byEntry.set(n.kbId ?? n.name, [...(byEntry.get(n.kbId ?? n.name) ?? []), n]);
  for (const group of byEntry.values()) {
    const n = group[0];
    const names = group.map((g) => g.name).join(', ');
    if (n.status === 'concern') findings.push({ kind: 'alert', text: `${names}: ${n.note}`, evidence: 'Documented concern (regulatory or veterinary source)', rule: 'G-KB-CONCERN' });
    else findings.push({ kind: 'review', text: `${names}: ${n.note}`, evidence: 'Documented caution (veterinary source); not part of the score', rule: 'G-KB-CAUTION' });
  }
  if (!ingredients.length) findings.push({ kind: 'missing', text: 'The ingredient list is not available yet.', evidence: 'Missing evidence', rule: 'G-INGREDIENTS' });

  if (category === 'supplement') {
    return unscored({
      ...explained,
      category,
      scoreLabel: 'Not scored',
      scoreWithheldReason: 'Purrbi does not give supplements a number: their purpose, dose and evidence vary by ingredient. The label facts, ingredients and any documented concerns are shown instead.',
    });
  }

  // ---- Score ----
  const components: ScoreComponent[] = [];
  const missingForScore: string[] = [];
  const hasIngredients = ingredients.length > 0;
  if (category === 'unknown') {
    missingForScore.push('product type (complete food, treat or supplement)');
  } else if (category === 'complete_food') {
    if (!adequacy) missingForScore.push('nutritional adequacy ("complete and balanced") statement');
    else {
      let points = 8;
      let status: ScoreComponent['status'] = 'partly_met';
      let explanation = 'The statement does not clearly say what the food is complete and balanced for.';
      if (adequacy.type === 'complete') {
        const speciesOk = adequacy.species === 'unknown' || adequacy.species === scope.species || scope.species === 'cat_and_dog' || adequacy.species === 'cat_and_dog';
        if (!speciesOk) {
          points = 10;
          explanation = 'The statement names a different species than the rest of the label.';
        } else if (!adequacy.lifeStages.length) {
          points = 18;
          explanation = 'Complete and balanced, but the statement does not name a life stage.';
        } else {
          points = adequacy.method === 'feeding_trial' ? 30 : adequacy.method === 'formulation' ? 27 : 24;
          status = 'met';
          explanation =
            adequacy.method === 'feeding_trial'
              ? `Complete and balanced for ${adequacy.lifeStages.map(lifeStageLabel).join(', ')}, substantiated by animal feeding tests.`
              : `Complete and balanced for ${adequacy.lifeStages.map(lifeStageLabel).join(', ')}${adequacy.method === 'formulation' ? ' by formulation (feeding tests are an additional, optional substantiation)' : ''}.`;
        }
      }
      components.push({ key: 'adequacy', label: 'Nutritional adequacy statement', points, maxPoints: 30, status, explanation });
    }
    const pf = proteinFatComponent(facts, scope, 30);
    if (!pf) missingForScore.push('guaranteed analysis (protein and fat)');
    else if (pf.status === 'unverified') missingForScore.push('moisture guarantee (to compare protein and fat on a dry-matter basis)');
    else components.push(pf);
    if (!hasIngredients) missingForScore.push('ingredient list');
    else components.push(namedSourcesComponent(ingredients, 20));
    components.push(caloriesComponent(facts, 10, 'which helps with portions'));
    components.push(extraGuaranteesComponent(facts, 10));
  } else {
    // treat or complementary
    if (!hasIngredients) missingForScore.push('ingredient list');
    else components.push(namedSourcesComponent(ingredients, 40));
    components.push(caloriesComponent(facts, 30, 'which helps keep treats and toppers under about 10% of daily calories'));
    components.push(
      adequacy && adequacy.type !== 'unclear'
        ? { key: 'feeding_statement', label: 'Feeding statement', points: 15, maxPoints: 15, status: 'met', explanation: adequacy.type === 'complete' ? 'Labeled complete and balanced.' : 'Labeled for intermittent or supplemental feeding, as expected for this type of product.' }
        : adequacy
          ? { key: 'feeding_statement', label: 'Feeding statement', points: 8, maxPoints: 15, status: 'partly_met', explanation: 'A feeding statement is present but unclear.' }
          : { key: 'feeding_statement', label: 'Feeding statement', points: 0, maxPoints: 15, status: 'unverified', explanation: 'Not found yet.' },
    );
    components.push(
      hasCoreGuaranteedAnalysis(ga)
        ? { key: 'core_guarantees', label: 'Guaranteed analysis (protein, fat, fiber)', points: 15, maxPoints: 15, status: 'met', explanation: 'Protein, fat and fiber guarantees are listed.' }
        : { key: 'core_guarantees', label: 'Guaranteed analysis (protein, fat, fiber)', points: 0, maxPoints: 15, status: 'unverified', explanation: 'Not found yet.' },
    );
  }

  const assessed = components.filter((c) => c.status !== 'unverified');
  const coverage = assessed.reduce((s, c) => s + c.maxPoints, 0);
  const unverified = components.filter((c) => c.status === 'unverified');
  if (!missingForScore.length && coverage < MIN_COVERAGE) missingForScore.push(whatWouldReach(coverage, unverified));
  const coverageText = assessed.length
    ? `Based on ${assessed.length} of ${category === 'complete_food' ? 5 : 4} parts: ${assessed.map((c) => c.label.toLowerCase()).join(', ')}${unverified.length ? ` (${unverified.map((c) => c.label.toLowerCase()).join(', ')} not found)` : ''}.`
    : '';

  if (missingForScore.length) {
    return unscored({
      ...explained,
      category,
      scoreApplicable: true,
      scoreLabel: scope.status === 'unknown' ? 'Not scored yet' : 'Not enough information to score',
      scoreWithheldReason:
        scope.status === 'unknown'
          ? 'Not scored yet: it isn’t confirmed whether this product is made for cats or dogs.'
          : category === 'unknown'
            ? 'Purrbi needs to know whether this is a complete food, a treat or a supplement before it can score it.'
            : `Purrbi needs the ${missingForScore.join(' and the ')} before it can score this ${categoryLabel(category).toLowerCase()}.`,
      scoreCoverage: coverage || null,
      coverageText,
      components,
      missingForScore,
    });
  }

  const max = components.reduce((s, c) => s + c.maxPoints, 0);
  if (max !== 100) throw new Error(`score components must total 100, got ${max}`);
  const earned = assessed.reduce((s, c) => s + c.points, 0);
  let score = Math.round((100 * earned) / coverage);
  // A documented concern for the species caps the score, whatever the other parts earned.
  const hazard = hazards(notes);
  const critical = hazard.map((h) => `${h.name}: ${h.note}`);
  if (hazard.length) score = Math.min(score, HAZARD_CAP);
  const b = band(score);
  return {
    ...explained,
    category,
    scoreApplicable: true,
    score,
    scoreBand: hazard.length ? 'low' : b.band,
    scoreLabel: hazard.length ? 'Serious concern' : b.label,
    scoreProvisional: unverified.length > 0,
    scoreWithheldReason: null,
    scoreCoverage: coverage,
    scoreMaxPossible: score,
    scoreMinPossible: score,
    scoreBasis: [
      unverified.length ? `Scored on the parts found (${coverage} of 100 points’ worth); ${unverified.map((c) => c.label.toLowerCase()).join(', ')} not found yet.` : 'Scored on every part Purrbi uses for this product type.',
      hazard.length ? `Capped at ${HAZARD_CAP}: ${hazard.map((h) => h.name).join(', ')} ${hazard.length === 1 ? 'is a' : 'are'} documented concern${hazard.length === 1 ? '' : 's'} for ${speciesNames(scope.species)}.` : '',
    ]
      .filter(Boolean)
      .join(' '),
    ratingColor: hazard.length ? 'red' : b.color,
    coverageText,
    criticalConcerns: critical,
    components,
    findings,
    missingForScore,
  };
}
