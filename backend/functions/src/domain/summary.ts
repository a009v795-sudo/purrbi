// Deterministic plain-language summary (at most 5 sentences), built only from computed findings.
import { categoryLabel, speciesLabel } from './scope';
import type { GeneralAssessment, PersonalAssessment, ProductFacts, RecallCheck, ScopeResult } from './types';

export type ResultState = 'strong' | 'good' | 'review' | 'low' | 'partial' | 'alert' | 'incomplete' | 'unresolved' | 'out_of_scope' | 'not_scored';

export function overallState(general: GeneralAssessment, recall: RecallCheck | null, scope: ScopeResult): ResultState {
  if (scope.status === 'out_of_scope') return 'out_of_scope';
  if (recall?.status === 'exact_active') return 'alert';
  if (scope.status === 'unknown') return 'unresolved'; // not yet known whether it is for cats or dogs
  if (!general.scoreApplicable) return 'not_scored';
  if (general.score === null) return 'incomplete';
  if (general.scoreLabel === 'Partial assessment') return 'partial'; // scored, but on too little of the label for a band
  if (!general.scoreBand) return 'incomplete';
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
  // Never call a product a pet product before it is confirmed as one.
  if (scope.status === 'unknown') out.push(`It isn’t confirmed yet whether ${name} is made for cats or dogs.`);
  else {
    const what = general.category === 'unknown' ? 'a cat or dog product of an unclear type' : `a ${categoryLabel(general.category).toLowerCase()}`;
    out.push(`${name} is ${what} for ${speciesLabel(scope.species).toLowerCase()}.`);
  }

  if (!general.scoreApplicable) out.push(general.scoreWithheldReason ?? 'This product type is not scored.');
  else if (general.score === null) out.push(general.scoreWithheldReason ?? 'There isn’t enough label information to score it yet.');
  else {
    out.push(
      general.scoreProvisional
        ? `Its Purrbi label score so far is ${general.score}/100, a lower bound: ${general.scoreBasis.charAt(0).toLowerCase()}${general.scoreBasis.slice(1)}`
        : `Its Purrbi label score is ${general.score}/100 (${general.scoreLabel.toLowerCase()}).`,
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
