// Purrbi label score — deterministic and versioned. It measures how completely the documented
// label information supports the product's intended use, minus documented species-specific
// ingredient concerns. It is Purrbi's own methodology, not an FDA, AAFCO, WSAVA or veterinary
// rating, and it is independent of any pet profile.
//
// Missing-data rules (no silent denominators):
//  - every category has a fixed component set and a fixed maximum of 100;
//  - if a core component lacks evidence the score is withheld (never estimated);
//  - an optional component without evidence earns 0 points, is marked "unverified" and makes the
//    score "provisional" — it is shown as missing evidence, never as a negative finding.
import { lifeStageLabel } from './adequacy';
import { ingredientNotes, KB_VERSION } from './kb';
import { describeCalories, findNutrient, hasCoreGuaranteedAnalysis } from './nutrition';
import { nutritionContext, nutritionNotes } from './nutritionContext';
import { parseIngredientList, type ParsedIngredient } from './ingredients';
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

export const METHODOLOGY_VERSION = 'purrbi-score-1.0.0';

export function evidenceLabel(src: SourceRef | undefined): string {
  if (!src) return 'Unknown source';
  switch (src.sourceType) {
    case 'database':
      return `${src.sourceName} record`;
    case 'database_image':
      return `${src.sourceName} (read by AI, not reviewed)`;
    case 'user_label':
      return 'Your label photo (read by AI, not reviewed)';
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

function band(score: number): { band: GeneralAssessment['scoreBand']; label: string } {
  if (score >= 85) return { band: 'strong', label: 'Strong label information' };
  if (score >= 70) return { band: 'good', label: 'Good label information' };
  if (score >= 50) return { band: 'review', label: 'Review the details' };
  return { band: 'low', label: 'Significant gaps or concerns' };
}

function concernComponent(key: string, max: number, perConcern: number, perCaution: number, notes: IngredientNote[], hasIngredients: boolean): ScoreComponent {
  if (!hasIngredients) {
    return { key, label: 'Documented ingredient concerns', points: 0, maxPoints: max, status: 'unverified', explanation: 'No ingredient list is available, so documented concerns could not be checked.' };
  }
  const concerns = notes.filter((n) => n.status === 'concern');
  const cautions = notes.filter((n) => n.status === 'caution');
  const points = Math.max(0, max - perConcern * concerns.length - perCaution * cautions.length);
  const names = [...concerns, ...cautions].map((n) => n.name).join(', ');
  return {
    key,
    label: 'Documented ingredient concerns',
    points,
    maxPoints: max,
    status: points === max ? 'met' : points === 0 ? 'not_met' : 'partly_met',
    explanation:
      points === max
        ? 'None of the ingredients listed has a documented species-specific concern in Purrbi’s reviewed list.'
        : `Documented concern or caution: ${names}.`,
  };
}

function gaExtrasComponent(facts: ProductFacts, max: number): ScoreComponent {
  const ga = facts.guaranteedAnalysis?.value ?? [];
  const extras = new Set(ga.filter((e) => !['crude_protein', 'crude_fat', 'crude_fiber', 'moisture', 'other'].includes(e.nutrient)).map((e) => e.nutrient));
  const fromDatabase = facts.guaranteedAnalysis?.source.sourceType === 'database';
  if (!ga.length) {
    return { key: 'extra_guarantees', label: 'Guarantees beyond the required nutrients', points: 0, maxPoints: max, status: 'unverified', explanation: 'No guaranteed analysis is available.' };
  }
  if (extras.size >= 2) {
    return { key: 'extra_guarantees', label: 'Guarantees beyond the required nutrients', points: max, maxPoints: max, status: 'met', explanation: `Also guarantees ${[...extras].map((x) => x.replace('_', '-')).join(', ')}.` };
  }
  if (extras.size === 1) {
    return { key: 'extra_guarantees', label: 'Guarantees beyond the required nutrients', points: Math.round(max * 0.6), maxPoints: max, status: 'partly_met', explanation: `Also guarantees ${[...extras][0].replace('_', '-')}.` };
  }
  return {
    key: 'extra_guarantees',
    label: 'Guarantees beyond the required nutrients',
    points: 0,
    maxPoints: max,
    status: fromDatabase ? 'unverified' : 'not_met',
    explanation: fromDatabase
      ? 'The database record lists no further guarantees; the package may list more.'
      : 'The label lists no guarantees beyond the required nutrients.',
  };
}

function presence(key: string, label: string, max: number, known: boolean, metText: string, missingText: string): ScoreComponent {
  return known
    ? { key, label, points: max, maxPoints: max, status: 'met', explanation: metText }
    : { key, label, points: 0, maxPoints: max, status: 'unverified', explanation: missingText };
}

export function assessGeneral(facts: ProductFacts, scope: ScopeResult): GeneralAssessment {
  const ingredients = productIngredients(facts);
  const species = speciesList(scope.species);
  const notes = ingredientNotes(ingredients, species);
  const findings: Finding[] = [];
  const base = { methodologyVersion: METHODOLOGY_VERSION, kbVersion: KB_VERSION, ingredientNotes: notes, nutritionNotes: [], nutritionContext: [], supplement: null };

  if (scope.status === 'out_of_scope') {
    findings.push({ kind: 'info', text: scope.reason, evidence: 'Product classification', rule: 'G-SCOPE' });
    return { ...base, category: 'unknown', scoreApplicable: false, score: null, scoreBand: null, scoreLabel: 'Not assessed', scoreProvisional: false, scoreWithheldReason: scope.reason, components: [], findings, missingForScore: [] };
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
    const parts = [p && `protein ${p.value}%`, f && `fat ${f.value}%`, fi && `fiber ${fi.value}%`, m && `moisture ${m.value}%`].filter(Boolean);
    if (parts.length) findings.push({ kind: 'info', text: `Guaranteed analysis: ${parts.join(', ')}.`, evidence: evidenceLabel(facts.guaranteedAnalysis?.source), rule: 'G-GA' });
  } else if (category !== 'supplement') {
    findings.push({ kind: 'missing', text: 'Guaranteed analysis (protein, fat, fiber) is not available yet.', evidence: 'Missing evidence', rule: 'G-GA' });
  }

  const cals = facts.calories?.value;
  if (cals?.length) findings.push({ kind: 'info', text: `Calorie content: ${cals.map(describeCalories).join('; ')}.`, evidence: evidenceLabel(facts.calories?.source), rule: 'G-CALORIES' });
  else if (category !== 'supplement') findings.push({ kind: 'missing', text: 'Calorie content is not available yet.', evidence: 'Missing evidence', rule: 'G-CALORIES' });

  for (const n of notes) {
    if (n.status === 'concern') findings.push({ kind: 'alert', text: `${n.name}: ${n.note}`, evidence: 'Documented concern (regulatory or veterinary source)', rule: 'G-KB-CONCERN' });
    else if (n.status === 'caution') findings.push({ kind: 'review', text: `${n.name}: ${n.note}`, evidence: 'Documented caution (veterinary source)', rule: 'G-KB-CAUTION' });
  }
  if (!ingredients.length) findings.push({ kind: 'missing', text: 'The ingredient list is not available yet.', evidence: 'Missing evidence', rule: 'G-INGREDIENTS' });

  // ---- Score ----
  const hasIngredients = ingredients.length > 0;
  const coreGa = hasCoreGuaranteedAnalysis(ga);
  const moistureKnown = !!findNutrient(ga, 'moisture');
  const caloriesKnown = !!cals?.length;
  const components: ScoreComponent[] = [];
  const missingForScore: string[] = [];

  if (category === 'supplement') {
    return {
      ...explained,
      category,
      scoreApplicable: false,
      score: null,
      scoreBand: null,
      scoreLabel: 'Not scored',
      scoreProvisional: false,
      scoreWithheldReason: 'Purrbi does not give supplements a number: their purpose, dose and evidence vary by ingredient. The label facts, ingredients and any documented concerns are shown instead.',
      components,
      findings,
      missingForScore,
    };
  }

  if (category === 'unknown') {
    missingForScore.push('product type');
  } else if (category === 'complete_food') {
    if (!adequacy) {
      missingForScore.push('nutritional adequacy statement');
      components.push({ key: 'adequacy', label: 'Nutritional adequacy statement', points: 0, maxPoints: 40, status: 'unverified', explanation: 'Not available yet.' });
    } else {
      let points = 16;
      let status: ScoreComponent['status'] = 'partly_met';
      let explanation = 'The statement does not clearly say what the food is complete and balanced for.';
      if (adequacy.type === 'complete') {
        const speciesOk = adequacy.species === 'unknown' || adequacy.species === scope.species || scope.species === 'cat_and_dog' || adequacy.species === 'cat_and_dog';
        if (!speciesOk || !adequacy.lifeStages.length) {
          points = 24;
          explanation = !speciesOk ? 'The statement names a different species than the rest of the label.' : 'The statement does not name a life stage.';
        } else {
          points = adequacy.method === 'feeding_trial' ? 40 : 34;
          status = 'met';
          explanation = adequacy.method === 'feeding_trial'
            ? 'Complete and balanced, substantiated by animal feeding tests.'
            : 'Complete and balanced by formulation (feeding tests are an additional, optional substantiation).';
        }
      }
      components.push({ key: 'adequacy', label: 'Nutritional adequacy statement', points, maxPoints: 40, status, explanation });
    }
    if (!coreGa) missingForScore.push('guaranteed analysis (protein, fat, fiber)');
    components.push(presence('core_guarantees', 'Required guarantees (protein, fat, fiber)', 20, coreGa, 'Protein, fat and fiber guarantees are listed.', 'Not available yet.'));
    components.push(presence('moisture', 'Moisture guarantee', 5, moistureKnown, 'Moisture is listed.', 'Not available yet.'));
    components.push(presence('calories', 'Calorie content statement', 10, caloriesKnown, 'Calorie content is listed.', 'Not available yet.'));
    components.push(gaExtrasComponent(facts, 5));
    if (!hasIngredients) missingForScore.push('ingredient list');
    components.push(concernComponent('concerns', 20, 20, 5, notes, hasIngredients));
  } else {
    // treat or complementary
    const feeding = adequacy
      ? adequacy.type === 'unclear'
        ? { points: 8, status: 'partly_met' as const, text: 'A feeding statement is present but unclear.' }
        : { points: 15, status: 'met' as const, text: adequacy.type === 'complete' ? 'Labeled complete and balanced.' : 'Labeled for intermittent or supplemental feeding, as expected for this type of product.' }
      : null;
    components.push(
      feeding
        ? { key: 'feeding_statement', label: 'Feeding statement', points: feeding.points, maxPoints: 15, status: feeding.status, explanation: feeding.text }
        : { key: 'feeding_statement', label: 'Feeding statement', points: 0, maxPoints: 15, status: 'unverified', explanation: 'Not available yet.' },
    );
    if (!coreGa) missingForScore.push('guaranteed analysis (protein, fat, fiber)');
    components.push(presence('core_guarantees', 'Required guarantees (protein, fat, fiber)', 25, coreGa, 'Protein, fat and fiber guarantees are listed.', 'Not available yet.'));
    components.push(presence('calories', 'Calorie content statement', 20, caloriesKnown, 'Calorie content is listed, which helps keep treats under about 10% of daily calories.', 'Not available yet.'));
    components.push(presence('moisture', 'Moisture guarantee', 5, moistureKnown, 'Moisture is listed.', 'Not available yet.'));
    if (!hasIngredients) missingForScore.push('ingredient list');
    components.push(concernComponent('concerns', 35, 35, 10, notes, hasIngredients));
  }

  if (missingForScore.length) {
    return {
      ...explained,
      category,
      scoreApplicable: true,
      score: null,
      scoreBand: null,
      scoreLabel: 'Not enough information to score',
      scoreProvisional: false,
      scoreWithheldReason: `Purrbi needs the ${missingForScore.join(', ')} before it can score this ${categoryLabel(category).toLowerCase()}.`,
      components,
      findings,
      missingForScore,
    };
  }

  const score = components.reduce((s, c) => s + c.points, 0);
  const max = components.reduce((s, c) => s + c.maxPoints, 0);
  if (max !== 100) throw new Error(`score components must total 100, got ${max}`);
  const provisional = components.some((c) => c.status === 'unverified');
  const b = band(score);
  return {
    ...explained,
    category,
    scoreApplicable: true,
    score,
    scoreBand: b.band,
    scoreLabel: b.label,
    scoreProvisional: provisional,
    scoreWithheldReason: null,
    components,
    findings,
    missingForScore,
  };
}
