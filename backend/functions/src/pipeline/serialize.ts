// Flattens assessment results into scan-document fields the FlutterFlow app binds to directly.
// Every list item is a plain map with fixed keys (mirrored by structs in the app's schema.dart).
import { lifeStageLabel } from '../domain/adequacy';
import { categoryLabel, speciesLabel } from '../domain/scope';
import { evidenceLabel } from '../domain/score';
import { caloriesForPackage, describeCalories, describeEntry, dryMatterPercent, findNutrient } from '../domain/nutrition';
import { SCOPE_VERSION } from '../domain/scope';
import { ASSESSMENT_VERSION, type RuntimeConfig } from './config';
import type { RowRelevance } from '../domain/personalize';
import type { ClaimSource, EvidenceKind, GeneralAssessment, IngredientRow, IngredientStatuses, PersonalAssessment, ProductFacts, RecallCheck, ScopeResult, SpeciesBasis, SpeciesScope } from '../domain/types';
import type { ResultState } from '../domain/summary';
import type { Highlight } from '../domain/highlights';
import { summarizeCalls, type SourceCall } from '../util/diagnostics';
import type { FieldStatus, PhotoRequest } from './facts';

/** What one job (scan, retry, photo, personal refresh) did; saved as `lastJob` with its sanitized calls. */
export interface JobInfo {
  kind: 'scan' | 'retry' | 'photo' | 'refresh';
  traceId: string;
  runId: string; // this run only (a refresh shares the scan's trace id)
  startedAt: Date;
  /** Wall-clock start (ms), for the function's time limit (startedAt follows the job's clock, which tests fix). */
  clockStart?: number;
  productCache: 'hit' | 'miss' | 'stale_used' | 'none';
  recallCache: 'hit' | 'miss' | 'skipped';
  explanationsCached: number;
  explanationsNew: number;
  evidenceNotes: string[];
  diagnosticNotes: string[]; // why AI-found information was or was not used (sanitized, for tracing)
}

/** The backend that ran a job: its deployed commit and the provider configuration in force (no secrets). */
export function backendInfo(c: RuntimeConfig): Record<string, unknown> {
  return {
    revision: c.backendRevision ?? 'local',
    ai: c.aiEnabled, research: c.researchEnabled, barcodeLookup: c.barcodeLookupEnabled !== false, databaseImages: c.databaseImagesEnabled,
    explanations: c.explanationsEnabled, verdicts: c.verdictsEnabled !== false,
    models: { research: c.researchModel, explain: c.explainModel, verdict: c.verdictModel, vision: c.visionModel },
  };
}

export function jobFields(job: JobInfo, calls: SourceCall[], finishedAt: Date, config?: RuntimeConfig): Record<string, unknown> {
  const counts = summarizeCalls(calls);
  return {
    lastJob: {
      ...(config ? { backend: backendInfo(config) } : {}),
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
    // Up to twenty research notes come with the others; a note naming result documents keeps their addresses (2026-10-31).
    diagnosticNotes: job.diagnosticNotes.slice(0, 28).map((n) => n.slice(0, 600)),
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
  fieldStatus?: FieldStatus[]; // why each requested panel's information is still missing
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
    // Every species the product is for (["cat", "dog"] for a dog-and-cat treat), and what that rests on.
    productSpeciesSet: scope.speciesEvidence?.set ?? (scope.species === 'cat_and_dog' ? ['cat', 'dog'] : scope.species === 'unknown' ? [] : [scope.species]),
    speciesBasis: scope.speciesEvidence?.basis ?? '',
    speciesConfirmed: scope.speciesEvidence?.confirmed ?? scope.species !== 'unknown',
    speciesNote: scope.speciesEvidence?.note ?? '',
    speciesLine: speciesLine(scope),
    productCategory: general.category,
    productCategoryLabel: categoryLabel(general.category),
    categoryBasis: scope.categoryBasis ?? '',
    packageSizeText: facts.packageSize?.value.text ?? '',
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
    // Per kg and, of the package-specific values, the scanned package's (values for other sizes are not interchangeable).
    caloriesText: caloriesForPackage(facts.calories?.value, facts.packageSize?.value).map(describeCalories).join('; '),
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

    assessmentVersion: ASSESSMENT_VERSION,
    scopeVersion: SCOPE_VERSION,

    summary: args.summary,
    ingredientsPreview: `${(facts.ingredients?.value ?? []).slice(0, 5).join(', ')}${(facts.ingredients?.value.length ?? 0) > 5 ? ', …' : ''}`,
    ingredientsCount: facts.ingredients?.value.length ?? 0,
    verificationStatus: verificationStatus(facts, args.labelIdentityVerified !== false),
    missingInfo: args.photoRequests.map((p) => p.purpose),
    missingForScore: general.missingForScore, // what the score still needs (photo requests are separate)
    photoRequests: args.photoRequests.map((p) => ({ ...p })),
    fieldStatus: (args.fieldStatus ?? []).map((f) => ({ ...f })),
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
  // The icon says what kind of outcome it is, never a certification: a search that found nothing is neutral.
  const icon = { exact_active: 'alert', possible_active: 'warning', brand_history: 'history', none_found: 'searched', unavailable: 'error', not_checked: 'unknown' }[status];
  const match = recall?.records[0]?.match;
  return {
    recallStatusLabel: label,
    recallSeverity: severity,
    recallIcon: icon,
    recallCoverage:
      status === 'not_checked' || status === 'unavailable'
        ? ''
        : 'Searched FDA enforcement reports (openFDA, updated weekly) by barcode, then by brand and product name. FDA’s recall web page, manufacturers’ own notices and lot codes were not checked.',
    recallMatchBasis: match === 'exact_barcode' ? 'barcode' : match === 'brand_and_product' ? 'brand and product name' : match === 'brand_only' ? 'brand only' : '',
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

const BASIS_WORDS: Partial<Record<SpeciesBasis, string>> = { label: 'package label', adequacy_statement: 'feeding statement', manufacturer_page: 'manufacturer', database_category: 'pet database', database_name: 'pet database', retailer_listing: 'a retailer’s listing' };

/** "For cats and dogs (manufacturer)", or "Listed for dogs by a retailer (not confirmed)". */
export function speciesLine(scope: ScopeResult): string {
  const ev = scope.speciesEvidence;
  if (scope.status !== 'supported' || scope.species === 'unknown') return ev?.disputed ? 'Sources disagree on whether it is for cats or dogs' : '';
  const who = speciesLabel(scope.species).toLowerCase();
  if (!ev) return `For ${who}`;
  return ev.confirmed ? `For ${who} (${BASIS_WORDS[ev.basis] ?? 'product evidence'})` : `Listed for ${who} by ${BASIS_WORDS[ev.basis] ?? 'a retailer'} (not confirmed)`;
}

const STATUS_TEXT: { [K in keyof IngredientStatuses]: Record<IngredientStatuses[K], string> } = {
  identity: { established: 'Identified', not_established: 'Not identified yet' },
  role: { explained: 'Role explained', not_explained: 'Role not explained yet' },
  risk: { documented_concern: 'Documented concern', documented_caution: 'Documented caution', consideration: 'Context-dependent consideration', none_in_reviewed_list: 'No concern in Purrbi’s reviewed list', not_assessed: 'Risk not assessed yet' },
  exposure: { assessed: 'Exposure assessed', not_assessed: 'Exposure not assessed (no amounts on the label)' },
  humanReview: { performed: 'Reviewed by a person', not_performed: 'Not reviewed by a veterinarian' },
};
const SCOPE_TEXT: Record<SpeciesScope, string> = { cat: 'about cats', dog: 'about dogs', cat_and_dog: 'about cats and dogs', pets: 'about pets', animal_feed: 'about animal feed', other_species: 'about other animals, not cats or dogs', people: 'about people, not pet evidence', not_species_specific: 'not species-specific' };
const EVIDENCE_TEXT: Record<EvidenceKind, string> = { regulation: 'regulation', regulatory_assessment: 'regulatory assessment', standards_body: 'standards body', veterinary_reference: 'veterinary reference', peer_reviewed: 'peer-reviewed research', curated: 'Purrbi’s curated list (draft)', other: 'source' };

/** A source as the app lists it, with one line saying what kind of evidence it is, whom it is about and when. */
const sourceRow = (x: ClaimSource) => ({
  ...x,
  label: [x.title || x.url, EVIDENCE_TEXT[x.evidence], SCOPE_TEXT[x.speciesScope], x.publishedAt ? `published ${x.publishedAt.slice(0, 10)}` : '', x.retrievedAt ? `checked ${x.retrievedAt.slice(0, 10)}` : ''].filter(Boolean).join(' · '),
});

/**
 * The ingredient rows as the app binds them (label order, and the same rows concerns first), with what each
 * means for the selected pet. Statuses are plain words; every source keeps its passage, scope and dates.
 */
export function ingredientRowFields(rows: IngredientRow[], relevance: Map<string, RowRelevance>): Record<string, unknown> {
  const flat = rows.map((r) => {
    const rel = relevance.get(r.name);
    const st = r.statuses;
    return {
      id: r.id,
      position: r.position,
      name: r.name,
      labelText: r.labelText,
      kind: r.kind,
      role: r.role,
      color: r.color,
      reason: r.reason,
      whatItIs: r.whatItIs,
      whyUsed: r.whyUsed,
      benefitsRisks: r.benefitsRisks,
      relevance: rel?.text ?? '',
      petFlag: rel?.flag ?? '',
      uncertainty: r.uncertainty,
      statusIdentity: st.identity,
      statusRole: st.role,
      statusRisk: st.risk,
      statusExposure: st.exposure,
      statusHumanReview: st.humanReview,
      checksText: [STATUS_TEXT.identity[st.identity], STATUS_TEXT.role[st.role], STATUS_TEXT.risk[st.risk], STATUS_TEXT.exposure[st.exposure], STATUS_TEXT.humanReview[st.humanReview]].join(' · '),
      sources: r.sources.map(sourceRow),
      // Each item keeps its own checks and sources, so a blend's colour that rests on an item's claim shows its passage.
      children: r.children.map((c) => ({
        id: c.id, name: c.name, labelText: c.labelText, role: c.role, color: c.color, reason: c.reason, whatItIs: c.whatItIs, whyUsed: c.whyUsed, benefitsRisks: c.benefitsRisks, uncertainty: c.uncertainty,
        checksText: [STATUS_TEXT.identity[c.statuses.identity], STATUS_TEXT.role[c.statuses.role], STATUS_TEXT.risk[c.statuses.risk]].join(' · '),
        sources: c.sources.map(sourceRow),
      })),
      concernRank: r.concernRank,
    };
  });
  // A pet-specific conflict is shown first in the concerns-first order too (an allergy before a sensitivity).
  const rank = (x: (typeof flat)[number]) => x.concernRank + (x.petFlag === 'conflict' ? 4 : x.petFlag === 'sensitivity' ? 2 : x.petFlag === 'unconfirmed' ? 0.5 : 0);
  return { ingredientRows: flat, ingredientRowsByConcern: [...flat].sort((a, b) => rank(b) - rank(a) || a.position - b.position) };
}
