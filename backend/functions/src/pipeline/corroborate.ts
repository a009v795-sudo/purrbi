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
// A photo whose barcode is the scanned one shows this package, so when its only conflict is one analysis row whose last
// digit reads differently (26% vs 28%: glare, a stylised digit), the record and the photo read that digit differently,
// unless its name, statement or calorie content differs from the record too (another formula on the same barcode). It is
// verified for the rest: none of its analysis is used (the record's stays), it is used for this owner only, and it is
// never added to the shared record. Any other conflict (another recipe, a tens digit or a wider gap) still disputes it.
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

// Digits glare or a stylised typeface lets both readings take for each other (both ways).
const CONFUSABLE = new Set(['3:8', '6:8', '5:6', '0:8', '1:7', '5:8', '6:9', '8:9', '0:6', '0:9']);
/**
 * A misread of one printed digit: the two values written to the same decimals (3 and 3.8 as 3.0 and 3.8) differ only in
 * their last digit, and those two digits are within 2 of each other or look alike (26 and 28, 10 and 12, 3.5 and 3.8).
 * A tens digit (10 and 20) or a wider gap (1 and 9) is not a misread.
 */
function oneDigitApart(x: number, y: number): boolean {
  const decimals = (v: number) => (String(v).split('.')[1] ?? '').length;
  const d = Math.max(decimals(x), decimals(y));
  const [s, t] = [x.toFixed(d), y.toFixed(d)];
  if (s.length !== t.length || s.slice(0, -1) !== t.slice(0, -1)) return false;
  const [p, q] = [Number(s.slice(-1)), Number(t.slice(-1))];
  return p !== q && (Math.abs(p - q) <= 2 || CONFUSABLE.has(`${Math.min(p, q)}:${Math.max(p, q)}`));
}

export function corroborateLabel(label: ValidatedLabel, record: ProductFacts | null | undefined): Corroboration {
  const agreements: string[] = [];
  const conflicts: string[] = [];
  let tied = false;
  // For the note when nothing confirms the photo yet: what both show, and whether it agrees so far or in part.
  let compared = 0;
  let agreeing = 0;
  let partly = 0;
  // One analysis row read one digit apart from the record, and nothing else differing (see the header).
  let misread = 0;
  let misreadOnly = false;
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
    if (r.compared > 0) {
      compared++;
      if (r.same === r.compared) agreeing++; // the same so far, if too few to confirm
      else if (r.same > 0) partly++; // a newer bag, or a cut-off photo
    }
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
      if (Math.abs(a.value - b.value) > 0.5 && oneDigitApart(a.value, b.value)) misread++;
    }
    if (differ.length) conflicts.push(`its guaranteed analysis differs from this barcode’s record (${differ.join(', ')})`);
    else if (same.length >= 2) agreements.push('its guaranteed analysis matches this barcode’s record');
    misreadOnly = differ.length === 1 && misread === 1;
    if (same.length || differ.length) {
      compared++;
      if (!differ.length) agreeing++;
    }
  }

  // Another name, statement or calorie content than the record's: another formula, never a misread digit.
  let otherDiffers = false;
  const name = pub(record?.productName);
  if (name && label.productName) {
    const [a, b] = [words(name), words(label.productName)];
    const shared = [...b].filter((w) => a.has(w)).length;
    if (b.size && shared / Math.min(a.size, b.size) >= 0.6) agreements.push('its product name matches this barcode’s record');
    else otherDiffers = true;
    compared++;
  }

  // Too general to confirm a product on their own, but they agree or not: the statement, the calories, the actives.
  const adequacy = pub(record?.adequacy);
  if (adequacy && label.adequacy) {
    compared++;
    const stages = (x: { lifeStages: string[] }) => [...x.lifeStages].sort().join();
    if (adequacy.type === label.adequacy.type && adequacy.species === label.adequacy.species && stages(adequacy) === stages(label.adequacy)) agreeing++;
    else otherDiffers = true;
  }
  const calories = pub(record?.calories);
  if (calories?.length && label.calories.length) {
    compared++;
    if (label.calories.some((c) => calories.some((d) => d.per === c.per && Math.abs(d.kcal - c.kcal) <= Math.max(1, d.kcal * 0.01)))) agreeing++;
    else if (label.calories.some((c) => calories.some((d) => d.per === c.per))) otherDiffers = true;
  }
  const actives = pub(record?.activeIngredients);
  if (actives?.length && label.activeIngredients.length) {
    compared++;
    const names = new Set(actives.map((x) => normalizeIngredientName(x.name)));
    if (label.activeIngredients.every((x) => names.has(normalizeIngredientName(x.name)))) agreeing++;
  }

  if (label.barcodeMatch && conflicts.length === 1 && misreadOnly && !otherDiffers) {
    const rows = conflicts[0].replace(/^its guaranteed analysis differs from this barcode’s record \((.*)\)$/, '$1');
    return { stage: 'verified', agreements, conflicts, note: `Matched by its barcode. Its analysis reads differently (${rows}); the saved analysis is kept.` };
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
      : agreeing || partly
        ? 'Read twice, with the same result. Part of it agrees with this barcode’s public record; not enough to confirm it yet.'
        : 'Read twice, with the same result. What it shows could not be matched to this barcode’s public record yet.';
  return { stage: 'extracted', agreements, conflicts, note };
}

/**
 * What the owner reads under a read photo. When the reading did not give what the photo was taken for, that it was not
 * read and what to retake (a photo read only for its name must not look like a read ingredient list; review of label
 * reader 2.4.0), alone: it fits the app's three lines, and the stage label above it already says how far the photo is
 * matched. Otherwise, or for a disputed reading (none of it is used), how far the reading is confirmed.
 */
export function photoNote(purpose: string, label: ValidatedLabel, c: Corroboration): string {
  const missing =
    purpose === 'ingredients' && !label.ingredients.length && !label.activeIngredients.length
      ? 'The ingredient list wasn’t read from this photo. Retake it straight on, with the whole list in the frame.'
      : purpose === 'nutrition' && !label.guaranteedAnalysis.length && !label.calories.length && !label.adequacy
        ? 'The nutrition panel wasn’t read from this photo. Retake it straight on, with the whole panel in the frame.'
        : purpose === 'front' && label.species === 'unknown' && !label.productTypeClaim
          ? 'Who it is for wasn’t read from this photo. Retake the front where it says “for cats” or “dog food”.'
          : '';
  return missing && c.stage !== 'disputed' ? missing : c.note;
}
