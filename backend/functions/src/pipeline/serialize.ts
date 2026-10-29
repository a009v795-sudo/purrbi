// Flattens assessment results into scan-document fields the FlutterFlow app binds to directly.
// Every list item is a plain map with fixed keys (mirrored by structs in the app's schema.dart).
import { lifeStageLabel } from '../domain/adequacy';
import { categoryLabel, speciesLabel } from '../domain/scope';
import { evidenceLabel } from '../domain/score';
import { describeCalories, describeEntry, dryMatterPercent, findNutrient } from '../domain/nutrition';
import type { GeneralAssessment, PersonalAssessment, ProductFacts, RecallCheck, ScopeResult } from '../domain/types';
import type { ResultState } from '../domain/summary';
import { summarizeCalls, type SourceCall } from '../util/diagnostics';
import type { PhotoRequest } from './facts';

/** What one job (scan, retry, photo, personal refresh) did; saved as `lastJob` with its sanitized calls. */
export interface JobInfo {
  kind: 'scan' | 'retry' | 'photo' | 'refresh';
  traceId: string;
  startedAt: Date;
  productCache: 'hit' | 'miss' | 'stale_used' | 'none';
  recallCache: 'hit' | 'miss' | 'skipped';
  explanationsCached: number;
  explanationsNew: number;
  evidenceNotes: string[];
}

export function jobFields(job: JobInfo, calls: SourceCall[], finishedAt: Date): Record<string, unknown> {
  const counts = summarizeCalls(calls);
  return {
    lastJob: {
      kind: job.kind,
      traceId: job.traceId,
      startedAt: job.startedAt,
      finishedAt,
      productCache: job.productCache,
      recallCache: job.recallCache,
      explanationsCached: job.explanationsCached,
      explanationsNew: job.explanationsNew,
      ...counts,
    },
    evidenceNotes: job.evidenceNotes,
    sourceChecks: calls.map((c) => ({ source: c.source, host: c.host, path: c.path, httpStatus: c.status ?? 0, outcome: c.outcome, ms: c.ms, attempt: c.attempt, detail: c.detail ?? '' })),
  };
}

/** Ingredient notes and supplement evidence notes, with their explanations (re-written when explanations arrive). */
export function explanationFields(general: GeneralAssessment, status: string): Record<string, unknown> {
  return {
    explanationsStatus: status,
    ingredientNotes: general.ingredientNotes.map((n) => ({
      name: n.name,
      position: n.position,
      status: n.status,
      note: n.note,
      sourceTitle: n.sourceTitle ?? '',
      sourceUrl: n.sourceUrl ?? '',
      explanationKind: n.explanationKind,
      explanation: n.explanation ?? '',
      explanationSourceTitle: n.explanationSourceTitle ?? '',
      explanationSourceUrl: n.explanationSourceUrl ?? '',
      explanationQuote: n.explanationQuote ?? '',
    })),
    supplementActives: (general.supplement?.actives ?? []).map((a) => ({ ...a })),
  };
}

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
    ingredientsText: facts.ingredientsText?.value ?? '',
    ingredientsSource: facts.ingredientsText ? evidenceLabel(facts.ingredientsText.source) : '',
    nutrition: ga.map((e, i) => {
      const dm = e.unit === '%' && e.nutrient !== 'moisture' ? dryMatterPercent(e.value, moisture) : null;
      const n = general.nutritionNotes[i];
      return {
        label: e.label,
        qualifier: e.qualifier,
        value: e.value,
        unit: e.unit,
        display: describeEntry(e),
        dryMatter: dm === null ? '' : `≈ ${dm}% dry matter (calculated)`,
        meaning: n?.meaning ?? '',
        context: n?.context ?? '',
        contextSource: n?.contextSource ?? '',
      };
    }),
    nutritionSource: facts.guaranteedAnalysis ? evidenceLabel(facts.guaranteedAnalysis.source) : '',
    nutritionContext: general.nutritionContext,
    activeIngredientsSource: facts.activeIngredients ? evidenceLabel(facts.activeIngredients.source) : '',
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

    supplementSummary: general.supplement?.summary ?? '',
    supplementPurposes: (general.supplement?.purposes ?? []).map((p) => ({ ...p })),
    supplementActivesSource: general.supplement?.activesSource ?? '',
    supplementWarnings: (general.supplement?.warnings ?? []).map((f) => ({ kind: f.kind, text: f.text, evidence: f.evidence, rule: f.rule })),
    supplementLimitations: general.supplement?.limitations ?? [],
    supplementQualitySignals: general.supplement?.qualitySignals ?? [],

    summary: args.summary,
    missingInfo: args.photoRequests.map((p) => p.purpose),
    photoRequests: args.photoRequests.map((p) => ({ ...p })),
    labelEvidenceUsed: args.labelEvidenceUsed,
    evidenceRevision: args.factsVersion,
  };
}
