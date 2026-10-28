// Species-appropriate life stage. No universal age thresholds: dogs depend on expected adult size.
import type { PetProfile } from './types';

export type PetLifeStage = 'growth' | 'adult' | 'transition' | 'reproduction' | 'unknown';

/** Growth ends somewhere in [from, to] months; inside the window the stage is "transition". */
const DOG_GROWTH_WINDOW: Record<string, [number, number]> = {
  small: [9, 12], // expected adult weight under 10 kg
  medium: [12, 15], // 10–24 kg
  large: [12, 18], // 25–31 kg
  xlarge: [18, 24], // 32 kg (70 lb) or more — AAFCO "large size dogs"
  unknown: [9, 24],
};
const CAT_GROWTH_WINDOW: [number, number] = [12, 12];

export const LARGE_SIZE_DOG_KG = 32; // AAFCO: "70 lb or more as an adult"

export function petAgeMonths(pet: Pick<PetProfile, 'birthDate' | 'approxAgeMonths' | 'ageCapturedAt'>, now: Date): number | null {
  if (pet.birthDate) {
    const b = new Date(pet.birthDate);
    if (!Number.isNaN(b.getTime()) && b <= now) {
      return (now.getTime() - b.getTime()) / (1000 * 60 * 60 * 24 * 30.4375);
    }
  }
  if (typeof pet.approxAgeMonths === 'number' && pet.approxAgeMonths >= 0) {
    const captured = pet.ageCapturedAt ? new Date(pet.ageCapturedAt) : null;
    const elapsed = captured && !Number.isNaN(captured.getTime()) && captured <= now
      ? (now.getTime() - captured.getTime()) / (1000 * 60 * 60 * 24 * 30.4375)
      : 0;
    return pet.approxAgeMonths + elapsed;
  }
  return null;
}

export interface LifeStageResult {
  stage: PetLifeStage;
  ageMonths: number | null;
  explanation: string;
  needsLargeSizeGrowthClaim: boolean | 'unknown';
}

export function petLifeStage(pet: PetProfile, now: Date): LifeStageResult {
  const ageMonths = petAgeMonths(pet, now);
  if (pet.reproductiveStatus === 'pregnant' || pet.reproductiveStatus === 'lactating') {
    return {
      stage: 'reproduction',
      ageMonths,
      explanation: `${pet.reproductiveStatus === 'pregnant' ? 'Pregnant' : 'Nursing'}: needs a food for growth/reproduction or all life stages.`,
      needsLargeSizeGrowthClaim: false,
    };
  }
  if (ageMonths === null) {
    return { stage: 'unknown', ageMonths, explanation: 'Age not provided.', needsLargeSizeGrowthClaim: false };
  }
  const size = pet.species === 'dog' ? pet.expectedAdultSize ?? 'unknown' : 'n/a';
  const [from, to] = pet.species === 'cat' ? CAT_GROWTH_WINDOW : DOG_GROWTH_WINDOW[size] ?? DOG_GROWTH_WINDOW.unknown;
  const ageText = ageMonths < 24 ? `${Math.floor(ageMonths)} months` : `${Math.floor(ageMonths / 12)} years`;
  let stage: PetLifeStage;
  if (ageMonths < from) stage = 'growth';
  else if (ageMonths >= to) stage = 'adult';
  else stage = 'transition';

  let needsLarge: boolean | 'unknown' = false;
  if (pet.species === 'dog' && stage !== 'adult') {
    needsLarge = size === 'xlarge' ? true : size === 'unknown' ? 'unknown' : false;
  }

  const explanation =
    pet.species === 'cat'
      ? `${ageText} old; cats are usually treated as growing until about 12 months.`
      : stage === 'transition'
        ? `${ageText} old; dogs of this expected size usually finish growing between ${from} and ${to} months.`
        : `${ageText} old.`;
  return { stage, ageMonths, explanation, needsLargeSizeGrowthClaim: needsLarge };
}
