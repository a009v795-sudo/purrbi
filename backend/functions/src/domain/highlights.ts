// The concise result: at most two positives and two cautions, each a short title, one line and a value,
// chosen in priority order from findings that were already computed with their evidence (never invented,
// never "safe" or "no concerns" beyond what was checked). A recall match, a species mismatch or an
// allergy-profile match always comes first, whatever the general score.
import { lifeStageLabel } from './adequacy';
import { describeCalories } from './nutrition';
import type { Finding, GeneralAssessment, PersonalAssessment, ProductFacts, RecallCheck, ScopeResult } from './types';

export interface Highlight {
  kind: 'positive' | 'caution';
  severity: 'alert' | 'review' | 'info';
  title: string; // a few words
  detail: string; // one line
  value: string; // e.g. "chicken", "3,800 kcal/kg"; empty when none
  evidence: string;
  rule: string;
}

const oneLine = (s: string, max = 110) => {
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length <= max ? t : `${t.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
};

function caution(f: Finding, title: string, severity: Highlight['severity'], value = ''): Highlight {
  return { kind: 'caution', severity, title, detail: oneLine(f.text), value, evidence: f.evidence, rule: f.rule };
}

function positive(f: Finding, title: string, value = ''): Highlight {
  return { kind: 'positive', severity: 'info', title, detail: oneLine(f.text), value, evidence: f.evidence, rule: f.rule };
}

export function buildHighlights(args: { facts: ProductFacts; scope: ScopeResult; general: GeneralAssessment; personal: PersonalAssessment; recall: RecallCheck | null }): { positives: Highlight[]; cautions: Highlight[] } {
  const { facts, scope, general, personal, recall } = args;
  if (scope.status === 'out_of_scope') return { positives: [], cautions: [] };
  // While it is unresolved what the product is, only a recall or a documented concern is worth showing.
  const unresolved = scope.status !== 'supported';
  const cautions: Highlight[] = [];
  const positives: Highlight[] = [];
  const pf = (rule: string, kind?: Finding['kind']) => personal.findings.filter((f) => f.rule === rule && (!kind || f.kind === kind));
  const gf = (rule: string, kind?: Finding['kind']) => general.findings.filter((f) => f.rule === rule && (!kind || f.kind === kind));
  // The value is what the owner recorded ("chicken"); the detail line names the matching ingredients.
  const recorded = (text: string) => /you recorded (.+?) as an? /.exec(text)?.[1] ?? '';
  const matches = (text: string) => /^Contains (.+?)(?: —|, which)/.exec(text)?.[1] ?? '';

  // ---- cautions, most serious first ----
  if (recall?.status === 'exact_active') cautions.push({ kind: 'caution', severity: 'alert', title: 'Recall match', detail: oneLine(recall.summary), value: recall.records[0]?.recallNumber ?? '', evidence: 'Official notice (openFDA)', rule: 'G-RECALL' });
  for (const f of pf('P-SPECIES', 'alert')) cautions.push(caution(f, 'Made for another species', 'alert'));
  for (const f of [...pf('P-ALLERGEN', 'review'), ...pf('P-SENSITIVITY', 'review')]) {
    if (/^Contains /.test(f.text)) cautions.push(caution(f, f.rule === 'P-ALLERGEN' ? 'In the allergy profile' : 'In the sensitivity profile', 'alert', recorded(f.text)));
  }
  for (const f of gf('G-KB-CONCERN', 'alert')) cautions.push(caution(f, `${f.text.split(':')[0]}: documented concern`, 'alert', f.text.split(':')[0]));
  if (recall?.status === 'possible_active') cautions.push({ kind: 'caution', severity: 'review', title: 'Possible recall match', detail: oneLine(recall.summary), value: '', evidence: 'Official notice (openFDA)', rule: 'G-RECALL' });
  for (const f of pf('P-LIFESTAGE', 'review')) cautions.push(caution(f, 'Life stage', 'review'));
  for (const f of pf('P-LARGEGROWTH', 'review')) cautions.push(caution(f, 'Large-breed growth', 'review'));
  for (const f of [...pf('P-ALLERGEN', 'review'), ...pf('P-SENSITIVITY', 'review')]) {
    if (/^Lists /.test(f.text)) cautions.push(caution(f, 'May match the allergy profile', 'review'));
  }
  for (const f of pf('P-VET', 'review')) cautions.push(caution(f, 'Vet-directed diet', 'review'));
  for (const f of gf('G-ADEQUACY', 'review')) cautions.push(caution(f, 'Feeding statement', 'review'));
  for (const f of gf('G-KB-CAUTION', 'review')) cautions.push(caution(f, `${f.text.split(':')[0]}: caution`, 'review', f.text.split(':')[0]));
  for (const f of pf('P-AVOID', 'review')) cautions.push(caution(f, 'An ingredient you avoid', 'info', matches(f.text)));

  // ---- positives, evidence-backed and scoped to what was checked ----
  for (const f of pf('P-LIFESTAGE', 'positive')) positives.push(positive(f, 'Matches the known life stage'));
  const adequacy = facts.adequacy?.value;
  if (adequacy?.type === 'complete' && !positives.length) {
    for (const f of gf('G-ADEQUACY', 'positive')) positives.push(positive(f, 'Complete and balanced', adequacy.lifeStages.map(lifeStageLabel).join(', ')));
  }
  for (const f of pf('P-ALLERGEN', 'positive')) positives.push(positive(f, 'No listed allergy match'));
  const concerns = general.components.find((c) => c.key === 'concerns');
  if (concerns?.status === 'met') {
    positives.push({ kind: 'positive', severity: 'info', title: 'No documented ingredient concerns', detail: oneLine(`None of the listed ingredients is on Purrbi’s reviewed list of documented concerns for ${scope.species === 'cat' ? 'cats' : scope.species === 'dog' ? 'dogs' : 'cats and dogs'}.`), value: '', evidence: 'Purrbi ingredient review', rule: 'G-KB' });
  }
  if ((general.category === 'treat' || general.category === 'complementary') && facts.calories?.value.length) {
    positives.push({ kind: 'positive', severity: 'info', title: 'Calories listed', detail: 'Helps keep treats and toppers under about 10% of daily calories.', value: describeCalories(facts.calories.value[0]), evidence: 'Product label', rule: 'G-CALORIES' });
  }
  for (const f of pf('P-SPECIES', 'positive')) positives.push(positive(f, `Made for ${scope.species === 'cat' ? 'cats' : scope.species === 'dog' ? 'dogs' : 'cats and dogs'}`));

  const dedupe = (list: Highlight[]) => list.filter((h, i) => list.findIndex((x) => x.title === h.title && x.detail === h.detail) === i);
  if (unresolved) return { positives: [], cautions: dedupe(cautions.filter((c) => c.rule === 'G-RECALL' || c.rule === 'G-KB-CONCERN')).slice(0, 2) };
  return { positives: dedupe(positives).slice(0, 2), cautions: dedupe(cautions).slice(0, 2) };
}
