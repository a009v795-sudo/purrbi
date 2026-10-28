// Flattens assessment results into scan-document fields the FlutterFlow app binds to directly.
// Every list item is a plain map with fixed keys (mirrored by structs in the app's schema.dart).
import { lifeStageLabel } from '../domain/adequacy';
import { categoryLabel, speciesLabel } from '../domain/scope';
import { evidenceLabel } from '../domain/score';
import { describeCalories, describeEntry, dryMatterPercent, findNutrient } from '../domain/nutrition';
import type { GeneralAssessment, PersonalAssessment, ProductFacts, RecallCheck, ScopeResult } from '../domain/types';
import type { ResultState } from '../domain/summary';
import type { PhotoRequest } from './facts';

const RESULT_LABELS: Record<ResultState, string> = {
  strong: 'Strong label information',
  good: 'Good label information',
  review: 'Review the details',
  low: 'Significant gaps or concerns',
  alert: 'Official recall match',
  incomplete: 'Information incomplete',
  out_of_scope: 'Not a cat or dog product',
  not_scored: 'Not scored',
};

export function resultFields(args: {
  facts: ProductFacts;
  scope: ScopeResult;
  general: GeneralAssessment;
  personal: PersonalAssessment;
  recall: RecallCheck | null;
  summary: string[];
  state: ResultState;
  photoRequests: PhotoRequest[];
  factsVersion: number;
  labelEvidenceUsed: boolean;
}): Record<string, unknown> {
  const { facts, scope, general, personal, recall } = args;
  const ga = facts.guaranteedAnalysis?.value ?? [];
  const moisture = findNutrient(ga, 'moisture')?.value;
  const adequacy = facts.adequacy?.value;
  return {
    productName: facts.productName?.value ?? '',
    brand: facts.brand?.value ?? '',
    imageUrl: facts.imageUrl?.value ?? '',
    productSpecies: scope.species,
    productSpeciesLabel: speciesLabel(scope.species),
    productCategory: general.category,
    productCategoryLabel: categoryLabel(general.category),
    scope: scope.status,
    scopeReason: scope.reason,
    outOfScopeKind: scope.outOfScopeKind ?? '',

    resultState: args.state,
    resultLabel: RESULT_LABELS[args.state],
    scoreAvailable: general.score !== null,
    score: general.score ?? 0,
    scoreBand: general.scoreBand ?? '',
    scoreLabel: general.scoreLabel,
    scoreProvisional: general.scoreProvisional,
    scoreWithheldReason: general.scoreWithheldReason ?? '',
    scoreVersion: general.methodologyVersion,
    kbVersion: general.kbVersion,
    scoreComponents: general.components.map((c) => ({ key: c.key, label: c.label, points: c.points, maxPoints: c.maxPoints, status: c.status, explanation: c.explanation })),
    generalFindings: general.findings.map((f) => ({ kind: f.kind, text: f.text, evidence: f.evidence, rule: f.rule })),
    ingredientNotes: general.ingredientNotes.map((n) => ({ name: n.name, position: n.position, status: n.status, note: n.note, sourceUrl: n.sourceUrl ?? '' })),
    ingredientsText: facts.ingredientsText?.value ?? '',
    ingredientsSource: facts.ingredientsText ? evidenceLabel(facts.ingredientsText.source) : '',
    nutrition: ga.map((e) => {
      const dm = e.unit === '%' && e.nutrient !== 'moisture' ? dryMatterPercent(e.value, moisture) : null;
      return { label: e.label, qualifier: e.qualifier, value: e.value, unit: e.unit, display: describeEntry(e), dryMatter: dm === null ? '' : `≈ ${dm}% dry matter (calculated)` };
    }),
    nutritionSource: facts.guaranteedAnalysis ? evidenceLabel(facts.guaranteedAnalysis.source) : '',
    caloriesText: (facts.calories?.value ?? []).map(describeCalories).join('; '),
    adequacyText: adequacy?.text ?? '',
    adequacySummary: adequacy
      ? adequacy.type === 'complete'
        ? `Complete and balanced for ${adequacy.lifeStages.map(lifeStageLabel).join(', ') || 'an unstated life stage'}`
        : adequacy.type === 'intermittent'
          ? 'For intermittent or supplemental feeding'
          : 'Statement unclear'
      : '',
    adequacySource: facts.adequacy ? evidenceLabel(facts.adequacy.source) : '',

    recallStatus: recall?.status ?? 'not_checked',
    recallSummary: recall?.summary ?? '',
    recallCheckedAt: recall ? new Date(recall.checkedAt) : null,
    recallRecords: (recall?.records ?? []).map((r) => ({ ...r })),

    sources: facts.sources.map((s) => ({ name: s.sourceName, type: s.sourceType, url: s.url ?? '', retrievedAt: s.retrievedAt, license: s.license ?? '', match: s.matchConfidence, label: evidenceLabel(s) })).concat(
      recall?.source ? [{ name: recall.source.sourceName, type: recall.source.sourceType, url: recall.source.url ?? '', retrievedAt: recall.source.retrievedAt, license: recall.source.license ?? '', match: recall.source.matchConfidence, label: recall.source.sourceName }] : [],
    ),

    petId: personal.petId ?? '',
    petName: personal.petName ?? '',
    profileVersion: personal.profileVersion ?? 0,
    personalState: personal.state,
    personalHeadline: personal.headline,
    personalFindings: personal.findings.map((f) => ({ kind: f.kind, text: f.text, evidence: f.evidence, rule: f.rule })),
    personalUnresolved: personal.unresolved,
    personalTrace: personal.trace.map((t) => ({ ...t })),

    summary: args.summary,
    missingInfo: args.photoRequests.map((p) => p.purpose),
    photoRequests: args.photoRequests.map((p) => ({ ...p })),
    labelEvidenceUsed: args.labelEvidenceUsed,
    evidenceRevision: args.factsVersion,
  };
}
