// What each guaranteed-analysis line means and, for complete foods, calculated context: dry matter,
// the AAFCO minimum for the life stage the label claims, estimated carbohydrate and energy density.
// Informational only — none of it changes the score. Label guarantees are minimums or maximums, not
// exact amounts, so every comparison is labelled as an approximate calculation.
import { aafcoTarget, energyPerKgDm, findNutrient, kcalPerKg } from './nutrition';
import type { AdequacyStatement, CalorieStatement, GuaranteedAnalysisEntry, NutrientKey, NutritionNote, ProductCategory, ProductSpecies } from './types';

const MEANING: Partial<Record<NutrientKey, string>> = {
  crude_protein: 'Protein in the food as sold. "Crude" names the lab method (calculated from nitrogen), not the quality.',
  crude_fat: 'Fat in the food as sold, the most concentrated energy source and a carrier of essential fatty acids.',
  crude_fiber: 'The least digestible part of plant material. It does not capture all dietary fiber.',
  moisture: 'Water content. Wet foods are mostly water, so foods are compared on a dry-matter basis.',
  ash: 'The mineral residue left after a sample is burned (calcium, phosphorus and other minerals).',
  calcium: 'A mineral for bones and teeth; its balance with phosphorus matters.',
  phosphorus: 'A mineral that works together with calcium.',
  sodium: 'The sodium (salt) content.',
  magnesium: 'A mineral.',
  taurine: 'An amino acid cats must get from their food; dogs usually make their own.',
  omega_3: 'Omega-3 fatty acids, such as EPA and DHA.',
  omega_6: 'Omega-6 fatty acids, such as linoleic acid.',
  dha: 'Docosahexaenoic acid, an omega-3 fatty acid.',
  epa: 'Eicosapentaenoic acid, an omega-3 fatty acid.',
  carbohydrate: 'Carbohydrate as reported by the source.',
};

const QUALIFIER: Record<GuaranteedAnalysisEntry['qualifier'], string> = {
  min: ' The label guarantees at least this much.',
  max: ' The label guarantees no more than this much.',
  typical: ' A typical (average) value.',
  not_stated: '',
};

/** AAFCO Dog and Cat Food Nutrient Profiles: minimums, % of dry matter, at 4,000 kcal ME/kg. */
const AAFCO_MIN_DM: Record<'dog' | 'cat', Record<'growth' | 'adult', Partial<Record<NutrientKey, number>>>> = {
  dog: { growth: { crude_protein: 22.5, crude_fat: 8.5 }, adult: { crude_protein: 18.0, crude_fat: 5.5 } },
  cat: { growth: { crude_protein: 30.0, crude_fat: 9.0 }, adult: { crude_protein: 26.0, crude_fat: 9.0 } },
};
export const AAFCO_SOURCE = 'AAFCO Dog and Cat Food Nutrient Profiles (AAFCO Official Publication)';
const CALC_SOURCE = 'Calculated by Purrbi from the guaranteed analysis';

const round1 = (n: number) => Math.round(n * 10) / 10;

function profileFor(species: ProductSpecies, adequacy: AdequacyStatement | undefined): { species: 'dog' | 'cat'; stage: 'growth' | 'adult'; label: string } | null {
  if (!adequacy || adequacy.type !== 'complete' || !adequacy.lifeStages.length) return null;
  const sp = species === 'cat' || species === 'dog' ? species : adequacy.species === 'cat' || adequacy.species === 'dog' ? adequacy.species : null;
  if (!sp) return null;
  const growth = adequacy.lifeStages.some((s) => s === 'growth' || s === 'all_life_stages' || s === 'gestation_lactation');
  return { species: sp, stage: growth ? 'growth' : 'adult', label: growth ? (adequacy.lifeStages.includes('all_life_stages') ? 'all life stages' : 'growth') : 'adult maintenance' };
}

export function nutritionNotes(
  ga: GuaranteedAnalysisEntry[] | undefined,
  args: { species: ProductSpecies; category: ProductCategory; adequacy?: AdequacyStatement; calories?: CalorieStatement[] },
): NutritionNote[] {
  if (!ga?.length) return [];
  const moisture = findNutrient(ga, 'moisture')?.value;
  const profile = args.category === 'complete_food' ? profileFor(args.species, args.adequacy) : null;
  const energyDm = energyPerKgDm(args.calories, moisture);

  return ga.map((e) => {
    const meaning = `${MEANING[e.nutrient] ?? 'As listed on the label.'}${QUALIFIER[e.qualifier]}`;
    let context = '';
    let contextSource = '';
    if (e.unit === '%' && e.nutrient !== 'moisture' && moisture !== undefined && moisture < 95) {
      const dm = round1((e.value / (100 - moisture)) * 100);
      context = `≈ ${dm}% of dry matter.`;
      contextSource = CALC_SOURCE;
      const min = profile ? AAFCO_MIN_DM[profile.species][profile.stage][e.nutrient] : undefined;
      if (profile && min !== undefined) {
        const { target, corrected } = aafcoTarget(min, energyDm);
        const verdict = dm >= target ? 'at or above' : 'below';
        context += ` AAFCO's minimum for ${profile.species} foods for ${profile.label} is ${min}% of dry matter${corrected ? ` (≈ ${target}% at this food's energy density)` : ''}; by this estimate the food is ${verdict} it.${verdict === 'below' ? ' Label guarantees are minimums, so the actual amount may be higher; ask the manufacturer if this matters for your pet.' : ''}`;
        contextSource = `${CALC_SOURCE}; ${AAFCO_SOURCE}`;
      }
    }
    return { nutrient: e.nutrient, label: e.label, meaning, context, contextSource };
  });
}

/** Whole-food context lines (energy density, estimated carbohydrate). */
export function nutritionContext(ga: GuaranteedAnalysisEntry[] | undefined, calories: CalorieStatement[] | undefined): string[] {
  const out: string[] = [];
  const kcal = kcalPerKg(calories);
  const moisture = findNutrient(ga, 'moisture')?.value;
  if (kcal !== null) {
    out.push(`Energy: ≈ ${Math.round(kcal / 10)} kcal per 100 g as sold${moisture !== undefined && moisture < 95 ? ` (≈ ${Math.round(kcal / (1 - moisture / 100) / 10)} kcal per 100 g of dry matter)` : ''}. Calculated from the calorie statement.`);
  }
  const p = findNutrient(ga, 'crude_protein')?.value;
  const f = findNutrient(ga, 'crude_fat')?.value;
  const fi = findNutrient(ga, 'crude_fiber')?.value;
  const a = findNutrient(ga, 'ash')?.value;
  if (p !== undefined && f !== undefined && fi !== undefined && a !== undefined && moisture !== undefined && moisture < 95) {
    const carbs = round1(100 - (p + f + fi + a + moisture));
    if (carbs >= 0) {
      out.push(`Estimated carbohydrate: ≈ ${carbs}% as sold (≈ ${round1((carbs / (100 - moisture)) * 100)}% of dry matter), calculated by difference. Label minimums and maximums make this an estimate.`);
    }
  }
  return out;
}
