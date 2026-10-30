// SYNTHETIC TEST FIXTURES — not real products. Names start with "TEST FIXTURE" so they can never be
// mistaken for product facts. Used only by mocked unit/emulator tests.
import { parseAdequacyStatement } from '../../src/domain/adequacy';
import { parseIngredientList } from '../../src/domain/ingredients';
import type { GuaranteedAnalysisEntry, PetProfile, ProductFacts, SourceRef } from '../../src/domain/types';

export const SRC: SourceRef = {
  sourceId: 'test:fixture',
  sourceType: 'database',
  sourceName: 'Test fixture database',
  retrievedAt: '2026-10-28T00:00:00.000Z',
  matchConfidence: 'exact_barcode',
};

export const GA_FULL: GuaranteedAnalysisEntry[] = [
  { nutrient: 'crude_protein', label: 'Crude protein', qualifier: 'min', value: 30, unit: '%' },
  { nutrient: 'crude_fat', label: 'Crude fat', qualifier: 'min', value: 15, unit: '%' },
  { nutrient: 'crude_fiber', label: 'Crude fiber', qualifier: 'max', value: 4, unit: '%' },
  { nutrient: 'moisture', label: 'Moisture', qualifier: 'max', value: 10, unit: '%' },
  { nutrient: 'taurine', label: 'Taurine', qualifier: 'min', value: 0.1, unit: '%' },
  { nutrient: 'omega_6', label: 'Omega-6 fatty acids', qualifier: 'min', value: 2, unit: '%' },
];

export function facts(over: Omit<Partial<ProductFacts>, 'ingredientsText'> & { ingredientsText?: string; adequacyText?: string } = {}): ProductFacts {
  const ingredientsText =
    over.ingredientsText ?? 'Chicken, chicken meal, brown rice, chicken fat (preserved with mixed tocopherols), dried beet pulp, natural flavor, taurine';
  const adequacy = over.adequacyText === undefined
    ? parseAdequacyStatement('TEST FIXTURE is formulated to meet the nutritional levels established by the AAFCO Cat Food Nutrient Profiles for adult maintenance.')
    : over.adequacyText ? parseAdequacyStatement(over.adequacyText) : null;
  const f: ProductFacts = {
    gtin: '00036000291452',
    barcode: '036000291452',
    productName: { value: 'TEST FIXTURE Chicken Recipe', source: SRC },
    brand: { value: 'TESTBRAND', source: SRC },
    ingredientsText: ingredientsText ? { value: ingredientsText, source: SRC } : undefined,
    ingredients: ingredientsText ? { value: parseIngredientList(ingredientsText).map((i) => i.labelText), source: SRC } : undefined,
    guaranteedAnalysis: { value: GA_FULL, source: SRC },
    calories: { value: [{ kcal: 3800, per: 'kg' }], source: SRC },
    adequacy: adequacy ? { value: adequacy, source: SRC } : undefined,
    classificationSignals: [{ text: 'en:cat-food', source: 'test' }, { text: 'en:dry-cat-food', source: 'test' }],
    sources: [SRC],
  };
  const { ingredientsText: _i, adequacyText: _a, ...rest } = over;
  return { ...f, ...rest };
}

export function pet(over: Partial<PetProfile> = {}): PetProfile {
  return {
    petId: 'pet1',
    name: 'Miso',
    species: 'cat',
    birthDate: '2022-01-01',
    allergiesStatus: 'none_reported',
    allergies: [],
    sensitivitiesStatus: 'none_reported',
    sensitivities: [],
    vetDietStatus: 'none_reported',
    conditionsStatus: 'not_provided',
    medicationsStatus: 'not_provided',
    avoidIngredients: [],
    goals: [],
    profileVersion: 3,
    ...over,
  };
}

export const NOW = new Date('2026-10-28T12:00:00Z');
