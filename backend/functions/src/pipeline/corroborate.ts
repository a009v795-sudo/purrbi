// What an owner's label photo is worth beyond the owner's own result. Its stages:
//   submitted    the owner uploaded it;
//   extracted    two independent readings agreed on what the label says (AI);
//   corroborated an independent public source agrees with it (this barcode's database record: its
//                recipe in order, its guaranteed analysis or its name);
//   verified     it is also tied to this barcode: the barcode is on the photo, or the photo shows this
//                barcode's recipe; only a verified reading may fill gaps in the shared product record,
//                and only the backend does that;
//   disputed     it conflicts with this barcode's public record (another recipe, another analysis):
//                its details are not used, and the owner is asked to check the package.
import type { ValidatedLabel } from '../ai/labelExtract';
import { normalizeIngredientName } from '../domain/ingredients';
import { findNutrient } from '../domain/nutrition';
import type { NutrientKey, ProductFacts } from '../domain/types';
import { compareRecipes } from '../sources/research';

export type PhotoStage = 'submitted' | 'extracted' | 'corroborated' | 'verified' | 'disputed';

export interface Corroboration {
  stage: PhotoStage;
  agreements: string[];
  conflicts: string[];
  note: string; // one line for the owner
}

const PUBLIC = new Set(['database', 'database_image', 'manufacturer', 'retailer_or_web', 'verified_label']);
const words = (s: string) => new Set(s.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter((w) => w.length > 1));

export function corroborateLabel(label: ValidatedLabel, record: ProductFacts | null | undefined): Corroboration {
  const agreements: string[] = [];
  const conflicts: string[] = [];
  let tied = false;
  // For the note when nothing confirms the photo yet: what both show, and whether it agrees so far.
  let compared = 0;
  let agreeing = 0;
  if (label.barcodeMatch) {
    agreements.push('the barcode on the photo is the scanned one');
    tied = true;
  }
  const pub = <T>(f: { value: T; source: { sourceType: string } } | undefined) => (f && PUBLIC.has(f.source.sourceType) ? f.value : undefined);

  const recipe = pub(record?.ingredients);
  if (recipe?.length && label.ingredients.length) {
    const r = compareRecipes(recipe, label.ingredients);
    if (r.compared >= 5 && r.same / r.compared >= 0.8) {
      agreements.push(`its ingredient list matches this barcode’s record (${r.same} of the first ${r.compared}, in order)`);
      tied = true;
    } else if (r.compared >= 5 && r.same / r.compared < 0.6) {
      conflicts.push(`its ingredient list differs from this barcode’s record (${r.same} of the first ${r.compared} match)`);
    }
    compared++;
    if (r.compared > 0 && r.same === r.compared) agreeing++; // the same so far, if too few to confirm
  }

  const analysis = pub(record?.guaranteedAnalysis);
  if (analysis?.length && label.guaranteedAnalysis.length) {
    const keys: NutrientKey[] = ['crude_protein', 'crude_fat', 'crude_fiber', 'moisture'];
    const same: string[] = [];
    const differ: string[] = [];
    for (const k of keys) {
      const a = findNutrient(analysis, k);
      const b = findNutrient(label.guaranteedAnalysis, k);
      if (!a || !b || a.unit !== b.unit) continue;
      (Math.abs(a.value - b.value) <= 0.5 ? same : differ).push(`${k.replace('crude_', '')} ${b.value}% vs ${a.value}%`);
    }
    if (differ.length) conflicts.push(`its guaranteed analysis differs from this barcode’s record (${differ.join(', ')})`);
    else if (same.length >= 2) agreements.push('its guaranteed analysis matches this barcode’s record');
    if (same.length || differ.length) {
      compared++;
      if (!differ.length) agreeing++;
    }
  }

  const name = pub(record?.productName);
  if (name && label.productName) {
    const [a, b] = [words(name), words(label.productName)];
    const shared = [...b].filter((w) => a.has(w)).length;
    if (b.size && shared / Math.min(a.size, b.size) >= 0.6) agreements.push('its product name matches this barcode’s record');
    compared++;
  }

  // Too general to confirm a product on their own, but they agree or not: the statement, the calories, the actives.
  const adequacy = pub(record?.adequacy);
  if (adequacy && label.adequacy) {
    compared++;
    const stages = (x: { lifeStages: string[] }) => [...x.lifeStages].sort().join();
    if (adequacy.type === label.adequacy.type && adequacy.species === label.adequacy.species && stages(adequacy) === stages(label.adequacy)) agreeing++;
  }
  const calories = pub(record?.calories);
  if (calories?.length && label.calories.length) {
    compared++;
    if (label.calories.some((c) => calories.some((d) => d.per === c.per && Math.abs(d.kcal - c.kcal) <= Math.max(1, d.kcal * 0.01)))) agreeing++;
  }
  const actives = pub(record?.activeIngredients);
  if (actives?.length && label.activeIngredients.length) {
    compared++;
    const names = new Set(actives.map((x) => normalizeIngredientName(x.name)));
    if (label.activeIngredients.every((x) => names.has(normalizeIngredientName(x.name)))) agreeing++;
  }

  if (conflicts.length) {
    // A glare or a fold can make both readings misread the same digit, so a retake is the other way out.
    return { stage: 'disputed', agreements, conflicts, note: `Not used: ${conflicts[0]}. Check that the photo shows this package; if it does, retake it straight on, in good light.` };
  }
  if (tied) return { stage: 'verified', agreements, conflicts, note: `Matched to this product: ${agreements[0]}.` };
  if (agreements.length) return { stage: 'corroborated', agreements, conflicts, note: `Partly matched: ${agreements[0]}; the product itself is not yet confirmed.` };
  const note = !compared
    ? 'Read twice, with the same result. Nothing public to compare it with yet.'
    : agreeing === compared
      ? 'Read twice, with the same result. It agrees with this barcode’s public record so far, but not enough to confirm it.'
      : agreeing
        ? 'Read twice, with the same result. Part of it agrees with this barcode’s public record; not enough to confirm it yet.'
        : 'Read twice, with the same result. What it shows could not be matched to this barcode’s public record yet.';
  return { stage: 'extracted', agreements, conflicts, note };
}
