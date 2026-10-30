// Flattens assessment results into scan-document fields the FlutterFlow app binds to directly.
// Every list item is a plain map with fixed keys (mirrored by structs in the app's schema.dart).
import { lifeStageLabel } from '../domain/adequacy';
import { categoryLabel, speciesLabel } from '../domain/scope';
import { evidenceLabel } from '../domain/score';
import { describeCalories, describeEntry, dryMatterPercent, findNutrient } from '../domain/nutrition';
import type { GeneralAssessment, PersonalAssessment, ProductFacts, RecallCheck, ScopeResult } from '../domain/types';
import type { ResultState } from '../domain/summary';
import type { Highlight } from '../domain/highlights';
import { summarizeCalls, type SourceCall } from '../util/diagnostics';
import type { PhotoRequest } from './facts';

/** What one job (scan, retry, photo, personal refresh) did; saved as `lastJob` with its sanitized calls. */
export interface JobInfo {
  kind: 'scan' | 'retry' | 'photo' | 'refresh';
  traceId: string;
  runId: string; // this run only (a refresh shares the scan's trace id)
  startedAt: Date;
  productCache: 'hit' | 'miss' | 'stale_used' | 'none';
  recallCache: 'hit' | 'miss' | 'skipped';
  explanationsCached: number;
  explanationsNew: number;
  evidenceNotes: string[];
  diagnosticNotes: string[]; // why AI-found information was or was not used (sanitized, for tracing)
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
    diagnosticNotes: job.diagnosticNotes.slice(0, 16).map((n) => n.slice(0, 240)),
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
      role: n.role ?? '', // what it does (curated or from a verified cited page); never part of the score
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
  strong: 'Strong',
  good: 'Good',
  review: 'Fair',
  low: 'Weak',
  alert: 'Official recall match',
  incomplete: 'Information incomplete',
  unresolved: 'Not yet confirmed for cats or dogs',
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
  labelIdentityVerified?: boolean; // every label photo used is tied to this barcode (verified)
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
    resultLabel: general.criticalConcerns.length && args.state === 'low' ? 'Serious concern' : RESULT_LABELS[args.state],
    scoreAvailable: general.score !== null,
    // The app shows scoreText, never score alone: an unscored result is never displayed as 0.
    score: general.score ?? 0,
    // One supported number, or none: what the score covers is shown apart from it (coverageText), never as a range.
    scoreText: general.score === null ? (general.scoreApplicable ? 'Unscored' : 'Not scored') : String(general.score),
    ratingColor: general.ratingColor,
    coverageText: general.coverageText,
    criticalConcerns: general.criticalConcerns,
    scoreMaxPossible: general.scoreMaxPossible ?? 0,
    scoreMinPossible: general.scoreMinPossible ?? 0,
    scoreCoverage: general.scoreCoverage ?? 0,
    scoreBasis: general.scoreBasis,
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
    ...recallDisplay(recall),
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
    ingredientsPreview: `${(facts.ingredients?.value ?? []).slice(0, 5).join(', ')}${(facts.ingredients?.value.length ?? 0) > 5 ? ', …' : ''}`,
    ingredientsCount: facts.ingredients?.value.length ?? 0,
    verificationStatus: verificationStatus(facts, args.labelIdentityVerified !== false),
    missingInfo: args.photoRequests.map((p) => p.purpose),
    missingForScore: general.missingForScore, // what the score still needs (photo requests are separate)
    photoRequests: args.photoRequests.map((p) => ({ ...p })),
    labelEvidenceUsed: args.labelEvidenceUsed,
    evidenceRevision: args.factsVersion,
  };
}

/**
 * Recall status in four plain outcomes (FDA notices are published separately and openFDA enforcement
 * data is updated weekly: no outcome is a "recall-free" guarantee, and an old record is never read as a
 * current recall).
 */
export function recallDisplay(recall: RecallCheck | null): Record<string, unknown> {
  const status = recall?.status ?? 'not_checked';
  const label = {
    exact_active: 'Recall notice matches this barcode',
    possible_active: 'Possible match: compare the lot code',
    brand_history: 'No current matching notice (older notices exist for this brand)',
    none_found: 'No matching notice found in the sources checked',
    unavailable: 'The recall check failed; try again later',
    not_checked: 'Not checked',
  }[status];
  const severity = status === 'exact_active' ? 'alert' : status === 'possible_active' ? 'review' : status === 'unavailable' ? 'review' : 'info';
  const checked = recall?.checkedAt ? new Date(recall.checkedAt) : null;
  const day = checked ? checked.toISOString().slice(0, 10) : '';
  return {
    recallStatusLabel: label,
    recallSeverity: severity,
    // Only a check that was made says "Checked"; a failed one says when it failed.
    recallCheckedLabel: !checked || status === 'not_checked' ? '' : status === 'unavailable' ? `Check failed on ${day}` : `Checked ${day} in FDA enforcement reports (openFDA, updated weekly)`,
  };
}

/** Where the facts shown come from, as one line (verified by a person never; checked against sources how). */
function verificationStatus(facts: ProductFacts, identityVerified: boolean): string {
  const kinds = new Set(facts.sources.map((s) => s.sourceType));
  const parts: string[] = [];
  if (kinds.has('database')) parts.push('database record');
  if (kinds.has('manufacturer') || kinds.has('retailer_or_web')) parts.push('web page, each fact found on it');
  if (kinds.has('database_image')) parts.push('database label image read by AI');
  if (kinds.has('verified_label')) parts.push('a label photo matched to this barcode, read by AI');
  if (kinds.has('user_label')) parts.push(identityVerified ? 'your label photo, matched to this barcode, read by AI' : 'your label photo read by AI');
  const based = parts.length ? `Based on: ${parts.join('; ')}. Not reviewed by a person.` : 'No product record yet.';
  return kinds.has('user_label') && !identityVerified ? `Label-based assessment with product identity not yet independently verified. ${based}` : based;
}

/** The concise result: up to two positives and two cautions, and the short verdict for the pet. */
export function highlightFields(h: { positives: Highlight[]; cautions: Highlight[] }, verdict: { text: string; source: string; status: string }): Record<string, unknown> {
  const row = (x: Highlight) => ({ kind: x.kind, severity: x.severity, title: x.title, detail: x.detail, value: x.value, evidence: x.evidence, rule: x.rule });
  return {
    positives: h.positives.map(row),
    cautions: h.cautions.map(row),
    verdict: verdict.text,
    verdictSource: verdict.source, // 'ai' (checked against the assessment) or 'rules'
    verdictStatus: verdict.status, // 'pending' while the written verdict is on its way
  };
}
