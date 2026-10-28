// Deterministic plain-language summary (at most 5 sentences), built only from computed findings.
import { categoryLabel, speciesLabel } from './scope';
import type { GeneralAssessment, PersonalAssessment, ProductFacts, RecallCheck, ScopeResult } from './types';

export type ResultState = 'strong' | 'good' | 'review' | 'low' | 'alert' | 'incomplete' | 'out_of_scope' | 'not_scored';

export function overallState(general: GeneralAssessment, recall: RecallCheck | null, scope: ScopeResult): ResultState {
  if (scope.status === 'out_of_scope') return 'out_of_scope';
  if (recall?.status === 'exact_active') return 'alert';
  if (!general.scoreApplicable) return 'not_scored';
  if (general.score === null || !general.scoreBand) return 'incomplete';
  return general.scoreBand;
}

export function buildSummary(
  facts: ProductFacts,
  scope: ScopeResult,
  general: GeneralAssessment,
  personal: PersonalAssessment,
  recall: RecallCheck | null,
): string[] {
  const name = facts.productName?.value ?? 'This product';
  const out: string[] = [];
  if (scope.status === 'out_of_scope') {
    out.push(scope.reason);
    out.push('No pet recommendation is given for products outside Purrbi’s scope.');
    return out;
  }
  const what = general.category === 'unknown' ? 'a pet product' : `a ${categoryLabel(general.category).toLowerCase()}`;
  out.push(`${name} is ${what} for ${speciesLabel(scope.species).toLowerCase()}.`);

  if (!general.scoreApplicable) out.push(general.scoreWithheldReason ?? 'This product type is not scored.');
  else if (general.score === null) out.push(general.scoreWithheldReason ?? 'There isn’t enough label information to score it yet.');
  else {
    const unverified = general.components.filter((c) => c.status === 'unverified').map((c) => c.label.toLowerCase());
    out.push(
      `Its Purrbi label score is ${general.score}/100 (${general.scoreLabel.toLowerCase()})${general.scoreProvisional ? `, provisional until ${unverified.join(' and ')} ${unverified.length > 1 ? 'are' : 'is'} confirmed` : ''}.`,
    );
  }

  if (personal.state === 'no_pet') out.push('Add a pet profile to see how it fits your pet.');
  else if (personal.state !== 'not_applicable') {
    const key = personal.findings.find((f) => f.kind === 'alert' || f.kind === 'review');
    out.push(key ? `${personal.headline}: ${key.text.charAt(0).toLowerCase()}${key.text.slice(1)}` : `${personal.headline}.`);
  }

  if (recall) out.push(recall.summary);
  out.push('This is educational information, not veterinary advice.');
  return out.slice(0, 5);
}
