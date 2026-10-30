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

  // P-SPECIES: a mismatch is stated only when the product's own evidence confirms who it is for. A
  // retailer's catalogue title ("Dog Trt …") is not that: it may leave out a second species.
  const productSpecies = scope.species;
  const ev = scope.speciesEvidence;
  const confirmed = ev ? ev.confirmed : true;
  const basisText = ev?.basis === 'retailer_listing' ? 'a retailer’s listing' : ev?.basis === 'manufacturer_page' ? 'the manufacturer' : ev?.basis === 'adequacy_statement' ? 'the label’s feeding statement' : 'the product label';
  trace.push({ input: 'species', value: pet.species, rule: 'P-SPECIES', effect: `Compared with who the product is for (${productSpecies}${ev ? `, from ${ev.basis.replace(/_/g, ' ')}` : ''})` });
  if (productSpecies === 'unknown') {
    unresolved.push(ev?.disputed ? ev.note : 'We couldn’t confirm which species this product is for.');
    state = worse(state, 'incomplete');
  } else if (productSpecies !== 'cat_and_dog' && productSpecies !== pet.species) {
    if (confirmed) {
      state = worse(state, 'not_for_species');
      add('alert', `This product is made for ${productSpecies}s (${basisText}), and ${name} is a ${pet.species}.`, 'Product label', 'P-SPECIES');
    } else {
      state = worse(state, 'review');
      add('review', `Only ${basisText} says who it is for (${productSpecies}s); Purrbi couldn’t confirm whether it is also for ${pet.species}s.`, 'Retailer listing', 'P-SPECIES');
    }
  } else {
    add('positive', productSpecies === 'cat_and_dog' ? `Made for cats and dogs (${basisText}).` : `Made for ${pet.species}s.`, confirmed ? 'Product label' : 'Retailer listing', 'P-SPECIES');
  }

  // P-HAZARD: an entry of Purrbi's reviewed list, judged for this pet's species (one finding per entry).
  const flagged = general.ingredientNotes.filter((n) => n.status === 'concern' || n.status === 'caution');
  for (const id of [...new Set(flagged.map((n) => n.kbId ?? n.name))]) {
    const group = flagged.filter((n) => (n.kbId ?? n.name) === id);
    const n = group[0];
    const forms = group.map((g) => g.name).join(', ');
    const forSpecies = n.concernFor ?? [];
    if (forSpecies.length && !forSpecies.includes(pet.species)) {
      add('info', `${forms}: a documented ${n.status} for ${forSpecies.map((x) => `${x}s`).join(' and ')}, not for ${pet.species}s.`, 'Purrbi ingredient review', 'P-HAZARD');
      continue;
    }
    if (n.status === 'concern') {
      state = worse(state, 'mismatch');
      add('alert', `${forms}: ${n.note}`, 'Documented concern (regulatory or veterinary source)', 'P-HAZARD');
    } else {
      state = worse(state, 'review');
      add('review', `${forms}: ${n.note}`, 'Documented caution (veterinary source)', 'P-HAZARD');
    }
    trace.push({ input: 'species', value: pet.species, rule: 'P-HAZARD', effect: `${forms}: documented ${n.status} for ${pet.species}s` });
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
  const absent: { label: string; rule: string }[] = [];
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
        // A confirmed allergy match is a serious pet-specific conflict (it never changes the general score).
        add(rule === 'P-ALLERGEN' ? 'alert' : 'review', `Contains ${m.matches.join(', ')} — you recorded ${allergenLabel(key)} as ${rule === 'P-ALLERGEN' ? 'an allergy' : 'a sensitivity'} for ${name}.`, 'Owner-recorded + product label', rule);
      } else if (m.status === 'possible') {
        state = worse(state, 'review');
        // An unspecified source ("natural flavor") is unresolved, never a confirmed match.
        add('review', `Compatibility with ${name}’s recorded ${allergenLabel(key)} ${rule === 'P-ALLERGEN' ? 'allergy' : 'sensitivity'} is unconfirmed: the source of ${m.matches.join(', ')} isn’t stated on the label.`, 'Owner-recorded + product label', rule);
      } else if (m.status === 'unknown') {
        state = worse(state, 'incomplete');
        unresolved.push(`The ingredient list isn’t available, so ${allergenLabel(key)} couldn’t be checked.`);
      } else {
        absent.push({ label: allergenLabel(key), rule });
      }
    }
  };
  checkList(pet.allergiesStatus, pet.allergies, 'allergies', 'P-ALLERGEN', 'mismatch');
  checkList(pet.sensitivitiesStatus, pet.sensitivities, 'suspected sensitivities', 'P-SENSITIVITY', 'review');
  // One qualified line for everything not on the list (it is not an allergen-free claim).
  if (absent.length) {
    const labels = [...new Set(absent.map((a) => a.label))];
    const list = labels.length === 1 ? `${labels[0]} isn’t` : `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]} aren’t`;
    add('positive', `${list[0].toUpperCase()}${list.slice(1)} on the ingredient list Purrbi found (labels don’t cover cross-contact during manufacturing).`, 'Owner-recorded + product label', absent[0].rule);
  }

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
    // A supplement taken alongside a diagnosed condition needs the vet's view; a food gets a limit-of-advice note.
    if (general.category === 'supplement') {
      state = worse(state, 'review');
      add('review', `Ask your veterinarian whether this supplement suits ${name}’s condition before giving it.`, 'Owner-recorded', 'P-CONDITIONS');
    } else add('info', 'A label can’t show whether a product suits a diagnosed condition. Ask your veterinarian.', 'Owner-recorded', 'P-CONDITIONS');
    trace.push({ input: 'conditions', value: 'reported', rule: 'P-CONDITIONS', effect: general.category === 'supplement' ? 'Supplement: review with the vet' : 'Adds a limit-of-advice note' });
  }
  if (general.category === 'supplement') {
    // Suitability, not a score: medicines, conditions and pregnancy or nursing call for the vet's view.
    if (pet.medicationsStatus === 'reported') {
      state = worse(state, 'review');
      add('review', `${name} takes medicines: ask your veterinarian whether this supplement interacts with them before adding it.`, 'Owner-recorded', 'P-MEDS');
    } else if (pet.medicationsStatus !== 'none_reported') unresolved.push('Medication information wasn’t provided, so interactions can’t be considered.');
    else add('info', 'No medications were reported; supplements can still interact with future medications, so mention it to your vet.', 'Owner-recorded', 'P-MEDS');
    trace.push({ input: 'medications', value: pet.medicationsStatus ?? 'not provided', rule: 'P-MEDS', effect: 'Adds an interaction note; Purrbi never states that interactions are absent' });
    if (pet.reproductiveStatus === 'pregnant' || pet.reproductiveStatus === 'lactating') {
      state = worse(state, 'review');
      add('review', `${name} is ${pet.reproductiveStatus === 'pregnant' ? 'pregnant' : 'nursing'}: check with your veterinarian before giving a supplement.`, 'Owner-recorded', 'P-REPRO');
      trace.push({ input: 'reproductive status', value: pet.reproductiveStatus, rule: 'P-REPRO', effect: 'Supplement: review with the vet' });
    }
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

export interface RowRelevance {
  flag: 'conflict' | 'unconfirmed' | '';
  text: string;
}

/**
 * What one label entry means for this pet (shown under "For <pet>" in the ingredient detail): a recorded
 * allergy or sensitivity it contains, one whose source it doesn't state (unconfirmed, never a match), or a
 * documented concern for the pet's species. Keyed by the entry's name as printed.
 */
export function ingredientRelevance(pet: PetProfile | null, facts: ProductFacts, general: GeneralAssessment): Map<string, RowRelevance> {
  const out = new Map<string, RowRelevance>();
  if (!pet) return out;
  const ingredients = productIngredients(facts);
  const name = pet.name || 'your pet';
  const recorded = [
    ...(pet.allergiesStatus === 'reported' ? (pet.allergies ?? []).map((k) => ({ key: k, what: 'allergy' })) : []),
    ...(pet.sensitivitiesStatus === 'reported' ? (pet.sensitivities ?? []).map((k) => ({ key: k, what: 'sensitivity' })) : []),
  ];
  for (const { key, what } of recorded) {
    const m = matchAllergen(key, ingredients);
    for (const ing of m.matches) {
      if (m.status === 'contains') out.set(ing, { flag: 'conflict', text: `Contains ${allergenLabel(key)} — you recorded ${allergenLabel(key)} as ${what === 'allergy' ? 'an allergy' : 'a sensitivity'} for ${name}.` });
      else if (m.status === 'possible' && out.get(ing)?.flag !== 'conflict')
        out.set(ing, { flag: 'unconfirmed', text: `Compatibility with ${name}’s recorded ${allergenLabel(key)} ${what} is unconfirmed: the label doesn’t say what this is made from.` });
    }
  }
  for (const n of general.ingredientNotes) {
    if (out.has(n.name) || (n.status !== 'concern' && n.status !== 'caution')) continue;
    const forSpecies = n.concernFor ?? [];
    out.set(n.name, {
      flag: '',
      text: forSpecies.includes(pet.species) ? `A documented ${n.status} for ${pet.species}s like ${name}.` : `Documented for ${forSpecies.map((x) => `${x}s`).join(' and ')}, not for ${pet.species}s like ${name}.`,
    });
  }
  const none = recorded.length
    ? `Doesn’t match ${name}’s recorded ${recorded.length === 1 ? allergenLabel(recorded[0].key) : `${recorded.slice(0, -1).map((r) => allergenLabel(r.key)).join(', ')} or ${allergenLabel(recorded[recorded.length - 1].key)}`} (labels don’t cover cross-contact).`
    : `No allergies or sensitivities are recorded for ${name}.`;
  for (const ing of ingredients) if (!out.has(ing.name)) out.set(ing.name, { flag: '', text: none });
  return out;
}
