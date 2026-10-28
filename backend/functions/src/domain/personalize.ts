// Personal fit for one pet. Separate from the general score: it never changes the score, and every
// profile field it uses is recorded as  input → rule → effect  (trace) for traceability.
// Rules: species and life stage are compared with the label's own claims; owner-reported allergies
// are matched against documented ingredients; preferences stay preferences; breed is not used;
// missing medication information never produces "no interactions".
import { lifeStageLabel } from './adequacy';
import { allergenLabel, matchAllergen } from './allergens';
import { petLifeStage } from './lifeStage';
import { describeCalories, findNutrient } from './nutrition';
import { productIngredients } from './score';
import type { Finding, GeneralAssessment, PersonalAssessment, PersonalState, PetProfile, ProductFacts, RecallCheck, ScopeResult, TraceItem } from './types';

const ORDER: PersonalState[] = ['alert', 'not_for_species', 'mismatch', 'incomplete', 'review', 'fits'];
const worse = (a: PersonalState, b: PersonalState) => (ORDER.indexOf(a) <= ORDER.indexOf(b) ? a : b);

export function personalize(
  pet: PetProfile | null,
  facts: ProductFacts,
  scope: ScopeResult,
  general: GeneralAssessment,
  recall: RecallCheck | null,
  now: Date,
): PersonalAssessment {
  if (!pet) {
    return { petId: null, petName: null, profileVersion: null, state: 'no_pet', headline: 'Add a pet to see how this fits them', findings: [], unresolved: [], trace: [] };
  }
  const base = { petId: pet.petId, petName: pet.name, profileVersion: pet.profileVersion };
  if (scope.status === 'out_of_scope') {
    return { ...base, state: 'not_applicable', headline: 'Not a cat or dog food, treat or supplement', findings: [], unresolved: [], trace: [] };
  }

  const findings: Finding[] = [];
  const unresolved: string[] = [];
  const trace: TraceItem[] = [];
  let state: PersonalState = 'fits';
  const name = pet.name || 'your pet';
  const add = (kind: Finding['kind'], text: string, evidence: string, rule: string) => findings.push({ kind, text, evidence, rule });

  // P-ALERT: an exact recall match overrides everything else.
  if (recall?.status === 'exact_active') {
    state = 'alert';
    add('alert', 'An active FDA recall record matches this product’s barcode. Check the lot code before feeding.', 'Official notice (openFDA)', 'P-ALERT');
    trace.push({ input: 'barcode', value: facts.gtin, rule: 'P-ALERT', effect: 'Recall match overrides the personal verdict' });
  } else if (recall?.status === 'possible_active') {
    state = worse(state, 'review');
    add('review', 'An active FDA recall from this brand may involve this product. Compare the lot codes before feeding.', 'Official notice (openFDA)', 'P-ALERT');
  }

  // P-SPECIES
  const productSpecies = scope.species;
  trace.push({ input: 'species', value: pet.species, rule: 'P-SPECIES', effect: `Compared with the product's labeled species (${productSpecies})` });
  if (productSpecies === 'unknown') {
    unresolved.push('We couldn’t confirm which species this product is for.');
    state = worse(state, 'incomplete');
  } else if (productSpecies !== 'cat_and_dog' && productSpecies !== pet.species) {
    state = worse(state, 'not_for_species');
    add('alert', `This product is labeled for ${productSpecies}s, and ${name} is a ${pet.species}.`, 'Product label', 'P-SPECIES');
  } else {
    add('positive', `Made for ${pet.species}s.`, 'Product label', 'P-SPECIES');
  }

  // P-LIFESTAGE (complete foods only: treats and supplements are not meant to meet a life-stage profile)
  const ls = petLifeStage(pet, now);
  const adequacy = facts.adequacy?.value;
  if (general.category === 'complete_food') {
    trace.push({ input: 'age / reproductive status', value: ls.ageMonths === null ? 'not provided' : `${Math.floor(ls.ageMonths)} months`, rule: 'P-LIFESTAGE', effect: `Life stage: ${ls.stage}` });
    if (ls.stage === 'unknown') {
      unresolved.push(`Add ${name}’s age to check the life stage.`);
    } else if (!adequacy || adequacy.type !== 'complete' || !adequacy.lifeStages.length) {
      unresolved.push('The label’s life-stage claim isn’t available, so life-stage fit can’t be checked.');
      state = worse(state, 'incomplete');
    } else {
      const claims = adequacy.lifeStages;
      const als = claims.includes('all_life_stages');
      const claimText = claims.map(lifeStageLabel).join(', ');
      if (ls.stage === 'reproduction') {
        if (als || claims.includes('gestation_lactation') || claims.includes('growth')) add('positive', `Labeled for ${claimText}, which covers pregnancy and nursing.`, 'Product label', 'P-LIFESTAGE');
        else {
          state = worse(state, 'mismatch');
          add('review', `Labeled for ${claimText}. Pregnant or nursing pets need a food for growth/reproduction or all life stages.`, 'Product label', 'P-LIFESTAGE');
        }
      } else if (ls.stage === 'growth' || ls.stage === 'transition') {
        const growthOk = als || claims.includes('growth');
        if (!growthOk && ls.stage === 'growth') {
          state = worse(state, 'mismatch');
          add('review', `Labeled for ${claimText}. ${name} is still growing and needs a food for growth or all life stages.`, 'Product label', 'P-LIFESTAGE');
        } else if (!growthOk) {
          state = worse(state, 'review');
          add('review', `Labeled for ${claimText}. ${ls.explanation} Ask your vet when to switch from a growth food.`, 'Product label', 'P-LIFESTAGE');
        } else {
          add('positive', `Labeled for ${claimText}, which covers growth.`, 'Product label', 'P-LIFESTAGE');
          // P-LARGEGROWTH
          if (pet.species === 'dog') {
            trace.push({ input: 'expected adult size', value: pet.expectedAdultSize ?? 'not provided', rule: 'P-LARGEGROWTH', effect: 'Checks the large-size growth wording' });
            if (ls.needsLargeSizeGrowthClaim === true) {
              if (adequacy.largeSizeGrowth === false) {
                state = worse(state, 'mismatch');
                add('review', 'The label excludes growth of large size dogs (70 lb / 32 kg or more as adults).', 'Product label', 'P-LARGEGROWTH');
              } else if (adequacy.largeSizeGrowth === null) {
                state = worse(state, 'review');
                add('review', 'The label doesn’t say whether it suits growth of large size dogs (70 lb / 32 kg or more as adults).', 'Product label', 'P-LARGEGROWTH');
              } else add('positive', 'Includes growth of large size dogs.', 'Product label', 'P-LARGEGROWTH');
            } else if (ls.needsLargeSizeGrowthClaim === 'unknown' && adequacy.largeSizeGrowth !== true) {
              unresolved.push(`If ${name} will weigh 70 lb (32 kg) or more as an adult, check that the label says "including growth of large size dogs".`);
            }
          }
        }
      } else if (ls.stage === 'adult') {
        if (als || claims.includes('adult_maintenance')) add('positive', `Labeled for ${claimText}, which covers adults.`, 'Product label', 'P-LIFESTAGE');
        else {
          state = worse(state, 'review');
          add('review', `Labeled for ${claimText} only. Growth foods are formulated for young animals; ask your vet whether it suits an adult.`, 'Product label', 'P-LIFESTAGE');
        }
      }
    }
  } else if (general.category === 'treat' || general.category === 'complementary') {
    add('info', 'Treats and toppers aren’t meant to be a complete diet; a common guideline is to keep treats under about 10% of daily calories.', 'General guidance', 'P-TREAT');
  }

  // P-ALLERGEN / P-SENSITIVITY / P-AVOID
  const ingredients = productIngredients(facts);
  const checkList = (status: PetProfile['allergiesStatus'], keys: string[] | undefined, field: string, rule: string, severity: 'mismatch' | 'review') => {
    if (status === 'not_sure') {
      unresolved.push(`You weren’t sure about ${field}; compare the ingredient list with your vet if symptoms appear.`);
      trace.push({ input: field, value: 'not sure', rule, effect: 'No ingredient conflict check' });
      return;
    }
    if (status !== 'reported' || !keys?.length) {
      trace.push({ input: field, value: status === 'none_reported' ? 'none reported' : 'not provided', rule, effect: 'No ingredient conflict check' });
      return;
    }
    for (const key of keys) {
      const m = matchAllergen(key, ingredients);
      trace.push({ input: field, value: allergenLabel(key), rule, effect: m.status });
      if (m.status === 'contains') {
        state = worse(state, severity);
        add('review', `Contains ${m.matches.join(', ')} — you recorded ${allergenLabel(key)} as ${rule === 'P-ALLERGEN' ? 'an allergy' : 'a sensitivity'}.`, 'Owner-recorded + product label', rule);
      } else if (m.status === 'possible') {
        state = worse(state, 'review');
        add('review', `Lists ${m.matches.join(', ')}, which may include ${allergenLabel(key)}; the label doesn’t say.`, 'Owner-recorded + product label', rule);
      } else if (m.status === 'unknown') {
        state = worse(state, 'incomplete');
        unresolved.push(`The ingredient list isn’t available, so ${allergenLabel(key)} couldn’t be checked.`);
      } else {
        add('positive', `No listed ingredient matches ${allergenLabel(key)} (labels don’t cover cross-contact).`, 'Owner-recorded + product label', rule);
      }
    }
  };
  checkList(pet.allergiesStatus, pet.allergies, 'allergies', 'P-ALLERGEN', 'mismatch');
  checkList(pet.sensitivitiesStatus, pet.sensitivities, 'suspected sensitivities', 'P-SENSITIVITY', 'review');

  for (const key of pet.avoidIngredients ?? []) {
    const m = matchAllergen(key, ingredients);
    trace.push({ input: 'ingredients to avoid (preference)', value: allergenLabel(key), rule: 'P-AVOID', effect: m.status });
    if (m.status === 'contains') {
      state = worse(state, 'review');
      add('review', `Contains ${m.matches.join(', ')}, which you prefer to avoid (a preference, not a health finding).`, 'Owner preference', 'P-AVOID');
    }
  }

  // P-VET / P-CONDITIONS / P-MEDS: limits on advice, never diagnoses.
  if (pet.vetDietStatus === 'reported') {
    state = worse(state, 'review');
    add('review', `You noted a vet-directed diet for ${name}. Check with your veterinarian before changing foods or adding treats.`, 'Owner-recorded', 'P-VET');
    trace.push({ input: 'veterinary diet', value: 'reported', rule: 'P-VET', effect: 'Adds a vet check' });
  }
  if (pet.conditionsStatus === 'reported') {
    add('info', 'A label can’t show whether a product suits a diagnosed condition. Ask your veterinarian.', 'Owner-recorded', 'P-CONDITIONS');
    trace.push({ input: 'conditions', value: 'reported', rule: 'P-CONDITIONS', effect: 'Adds a limit-of-advice note' });
  }
  if (general.category === 'supplement') {
    if (pet.medicationsStatus === 'reported') add('review', 'Ask your veterinarian whether this supplement interacts with your pet’s medications.', 'Owner-recorded', 'P-MEDS');
    else if (pet.medicationsStatus !== 'none_reported') unresolved.push('Medication information wasn’t provided, so interactions can’t be considered.');
    else add('info', 'No medications were reported; supplements can still interact with future medications, so mention it to your vet.', 'Owner-recorded', 'P-MEDS');
    trace.push({ input: 'medications', value: pet.medicationsStatus ?? 'not provided', rule: 'P-MEDS', effect: 'Adds an interaction note; Purrbi never states that interactions are absent' });
  }

  // P-GOALS: informational only, never changes the state.
  const goals = pet.goals ?? [];
  if (goals.includes('weight')) {
    const cals = facts.calories?.value;
    add('info', cals?.length ? `For weight goals: ${cals.map(describeCalories).join('; ')}.` : 'For weight goals: calorie content isn’t available, which makes portions harder to plan.', 'Product label', 'P-GOALS');
    trace.push({ input: 'goals', value: 'weight management', rule: 'P-GOALS', effect: 'Shows calorie content' });
  }
  if (goals.includes('digestion')) {
    const fiber = findNutrient(facts.guaranteedAnalysis?.value, 'crude_fiber');
    if (fiber) add('info', `For digestion goals: crude fiber ${fiber.qualifier === 'max' ? 'up to ' : ''}${fiber.value}%.`, 'Product label', 'P-GOALS');
    trace.push({ input: 'goals', value: 'digestion', rule: 'P-GOALS', effect: fiber ? 'Shows fiber guarantee' : 'No fiber data' });
  }
  if (goals.includes('skin_coat')) {
    const o3 = findNutrient(facts.guaranteedAnalysis?.value, 'omega_3');
    const o6 = findNutrient(facts.guaranteedAnalysis?.value, 'omega_6');
    if (o3 || o6) add('info', `For skin and coat goals: ${[o3 && `omega-3 ${o3.value}%`, o6 && `omega-6 ${o6.value}%`].filter(Boolean).join(', ')} guaranteed.`, 'Product label', 'P-GOALS');
    trace.push({ input: 'goals', value: 'skin and coat', rule: 'P-GOALS', effect: o3 || o6 ? 'Shows fatty-acid guarantees' : 'No fatty-acid guarantees listed' });
  }
  if (pet.breed) trace.push({ input: 'breed', value: pet.breed, rule: 'P-BREED', effect: 'Not used: breed alone doesn’t establish allergies or nutritional needs' });

  const headline = {
    fits: `Fits ${name}’s profile`,
    review: `Review the details for ${name}`,
    mismatch: `Possible mismatch for ${name}`,
    not_for_species: `Made for ${productSpecies}s, not ${pet.species}s`,
    alert: 'Recall match — check before feeding',
    incomplete: `Not enough information for ${name} yet`,
    no_pet: '',
    not_applicable: '',
  }[state];
  return { ...base, state, headline, findings, unresolved, trace };
}
