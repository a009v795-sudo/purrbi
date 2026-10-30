import { describe, expect, it } from 'vitest';
import { parseIngredientList } from '../../src/domain/ingredients';
import { ingredientRows } from '../../src/domain/ingredientRows';
import { ingredientNotes, kbSourceUrls } from '../../src/domain/kb';
import type { ClaimSource, IngredientRow, Species } from '../../src/domain/types';

// Real Wellness lists (the manufacturer's copy of the tuna list never closes "Vitamins [").
const WELLNESS_TUNA =
  'Tuna, Tuna Broth, Water Sufficient for Processing, Mackerel, Salmon, Tapioca Starch, Sunflower Oil, Natural Flavor, Guar Gum, Tricalcium Phosphate, Taurine, Magnesium Sulfate, Vitamins [Vitamin E Supplement, Thiamine Hydrochloride, Niacin, Vitamin A Supplement, Pyridoxine Hydrochloride, d-Calcium Pantothenate, Riboflavin Supplement, Folic Acid, Vitamin D3 Supplement, Biotin, Vitamin B12 Supplement, Potassium Chloride, Choline Chloride, Minerals [Zinc Amino Acid Chelate, Iron Amino Acid Chelate, Manganese Amino Acid Chelate, Copper Amino Acid Chelate, Potassium Iodide, Sodium Selenite], Menadione Sodium Bisulfite Complex (Vitamin K).';
const WELLNESS_GRAVIES =
  'Chicken Broth, Water Sufficient For Processing, Chicken, Potato Starch, Turkey, Eggs, Chicken Liver, Carrots, Natural Flavor, Salt, Guar Gum, Tricalcium Phosphate, Potassium Chloride, Taurine, Magnesium Sulfate, Vitamins [Vitamin E Supplement, Thiamine Hydrochloride, Niacin, Vitamin A Supplement, Pyridoxine Hydrochloride, d-Calcium Pantothenate, Riboflavin Supplement, Folic Acid, Vitamin D3 Supplement, Biotin, Vitamin B12 Supplement], Cranberries, Blueberries, White Sweet Potatoes, Xanthan Gum, Choline Chloride, Zinc Amino Acid Chelate, Iron Amino Acid Chelate, Manganese Amino Acid Chelate, Copper Amino Acid Chelate, Potassium Iodide, Sodium Selenite.';
const CFR_PG = 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-E/part-589/subpart-B/section-589.1001';
const FDA_DCM = 'https://www.fda.gov/animal-veterinary/outbreaks-and-advisories/fda-investigation-potential-link-between-certain-diets-and-canine-dilated-cardiomyopathy';

const none = (): ClaimSource[] => [];
const rows = (text: string, species: Species[], claimsFor: (term: string) => ClaimSource[] = none) => ingredientRows(parseIngredientList(text), species, claimsFor);
const row = (list: IngredientRow[], name: string) => list.find((r) => r.name === name)!;
const everyRow = (list: IngredientRow[]) => list.flatMap((r) => [r, ...r.children]);
/** A claim as the source-validation module would return it (synthetic: example.org is not a real source). */
const claim = (over: Partial<ClaimSource>): ClaimSource => ({
  claimType: 'function',
  claim: 'Used in animal feed to reduce ammonia odour.',
  ingredientForm: 'yucca schidigera extract',
  title: 'TEST SOURCE (synthetic)',
  url: 'https://example.org/test-source',
  passage: 'TEST PASSAGE',
  speciesScope: 'animal_feed',
  evidence: 'regulatory_assessment',
  doseContext: '',
  retrievedAt: '2026-10-29T00:00:00.000Z',
  publishedAt: '',
  reviewStatus: 'automated_checks',
  ...over,
});
const claimsOnly = (name: string, claims: ClaimSource[]) => (term: string) => (term === name ? claims : []);

describe('ingredient rows: the Wellness tuna list for a cat', () => {
  const list = rows(WELLNESS_TUNA, ['cat']);

  it('has one row per label entry, in label order, with each blend’s items nested under it', () => {
    expect(list.map((r) => r.id)).toEqual(Array.from({ length: 15 }, (_, i) => String(i + 1)));
    expect(list.every((r) => r.childIndex === 0 && r.kind !== 'child')).toBe(true); // items are never top-level rows
    const vitamins = row(list, 'Vitamins');
    expect(vitamins).toMatchObject({ id: '13', position: 13, kind: 'group', color: 'green', role: 'Vitamin blend (13)', reason: 'All 13 items are added nutrients' });
    expect(vitamins.labelText.startsWith('Vitamins [Vitamin E Supplement,')).toBe(true);
    expect(vitamins.children.map((c) => c.id)).toEqual(Array.from({ length: 13 }, (_, i) => `13.${i + 1}`));
    expect(vitamins.children.every((c) => c.kind === 'child' && c.position === 13 && c.color === 'green' && c.children.length === 0)).toBe(true);
    expect(vitamins.children[12]).toMatchObject({ name: 'Choline Chloride', childIndex: 13, role: 'Vitamin or mineral' });
    expect(row(list, 'Minerals')).toMatchObject({ color: 'green', role: 'Mineral blend (6)' });
    expect(row(list, 'Minerals').children).toHaveLength(6);
  });

  it('flags nothing red, and colours each entry by what it is', () => {
    expect(everyRow(list).filter((r) => r.color === 'red')).toEqual([]);
    expect(row(list, 'Tuna Broth')).toMatchObject({ role: 'Broth (moisture and flavour)', color: 'green', reason: 'Named broth: adds moisture and flavour' });
    expect(row(list, 'Tuna')).toMatchObject({ role: 'Protein source', color: 'green', whatItIs: 'A named fish ingredient.', whyUsed: 'A source of animal protein.' });
    expect(row(list, 'Water Sufficient for Processing')).toMatchObject({ role: 'Water (processing)', color: 'green' });
    expect(row(list, 'Sunflower Oil')).toMatchObject({ role: 'Fat source', color: 'green' });
    expect(row(list, 'Taurine')).toMatchObject({ color: 'green', role: 'Amino acid (nutrient)', kbId: 'taurine', statuses: { risk: 'none_in_reviewed_list' } });
    expect(row(list, 'Taurine').whyUsed).toBe('An amino acid cats must get from their food; it is added to complete cat foods.');
    expect(row(list, 'Menadione Sodium Bisulfite Complex (Vitamin K)')).toMatchObject({ color: 'green', role: 'Vitamin or mineral' });
  });

  it('shows an unnamed source gray, and an ingredient Purrbi has not assessed gray, never as harmful', () => {
    const flavor = row(list, 'Natural Flavor');
    expect(flavor).toMatchObject({ color: 'gray', concernRank: 1, reason: 'Source not stated on the label', role: 'Flavour', kbId: 'natural_flavor' });
    expect(flavor.whatItIs).toMatch(/exact source is not disclosed/);
    expect(row(list, 'Guar Gum')).toMatchObject({ color: 'gray', reason: 'Not yet assessed by Purrbi (not the same as harmful)', statuses: { identity: 'established', role: 'explained', risk: 'not_assessed' } });
  });

  it('states every status honestly: exposure never assessed, nothing reviewed by a person', () => {
    for (const r of everyRow(list)) {
      expect(r.reason.length).toBeLessThanOrEqual(90);
      expect(r.statuses.exposure).toBe('not_assessed');
      expect(r.statuses.humanReview).toBe('not_performed');
      expect(r.concernRank).toBe({ red: 3, yellow: 2, gray: 1, green: 0 }[r.color]);
      expect(r.uncertainty).toMatch(/exposure isn’t assessed\. Not reviewed by a person yet\./);
      expect(r.whatItIs.length).toBeGreaterThan(0);
      expect(r.benefitsRisks.length).toBeGreaterThan(0);
    }
    expect(row(list, 'Tuna').benefitsRisks).toBe('Not assessed yet.');
    expect(row(list, 'Taurine').benefitsRisks).toBe('Purrbi’s reviewed list has no species-specific concern for this ingredient; effects at the amount used aren’t assessed.');
  });

  it('is deterministic', () => {
    expect(rows(WELLNESS_TUNA, ['cat'])).toEqual(list);
  });
});

describe('ingredient rows: documented concerns and cautions (Purrbi’s reviewed list)', () => {
  const PG = 'Chicken, Glycerin, Propylene Glycol, Salt';

  it('propylene glycol is red for a cat food, with the regulation as its source', () => {
    const pg = row(rows(PG, ['cat']), 'Propylene Glycol');
    expect(pg).toMatchObject({ color: 'red', concernRank: 3, reason: 'Prohibited in U.S. cat food: it harms cats’ red blood cells', kbId: 'propylene_glycol', concernFor: ['cat'], statuses: { risk: 'documented_concern', identity: 'established' } });
    expect(pg.benefitsRisks).toBe('U.S. regulations prohibit propylene glycol in or on cat food because it affects cats’ red blood cells.');
    expect(pg.sources).toEqual([expect.objectContaining({ claimType: 'risk', url: CFR_PG, evidence: 'curated', reviewStatus: 'curated_unreviewed', speciesScope: 'cat', ingredientForm: 'propylene glycol', retrievedAt: '' })]);
  });

  it('propylene glycol is not red for a dog food', () => {
    const pg = row(rows(PG, ['dog']), 'Propylene Glycol');
    expect(pg).toMatchObject({ color: 'gray', kbId: 'propylene_glycol', statuses: { risk: 'none_in_reviewed_list' } });
    expect(pg.concernFor).toBeUndefined();
    expect(pg.whyUsed).toMatch(/permitted in dog food/);
  });

  it('xylitol is red for dogs only', () => {
    expect(row(rows('Peanut Butter, Xylitol', ['dog']), 'Xylitol')).toMatchObject({ color: 'red', reason: 'Toxic to dogs, even in small amounts', concernFor: ['dog'] });
    expect(row(rows('Peanut Butter, Xylitol', ['cat']), 'Xylitol')).toMatchObject({ color: 'gray', statuses: { risk: 'not_assessed' } });
    const both = row(rows('Peanut Butter, Xylitol', ['cat', 'dog']), 'Xylitol');
    expect(both).toMatchObject({ color: 'red', concernFor: ['dog'] });
    expect(both.benefitsRisks).toMatch(/\(Applies to dogs\.\)$/);
  });

  it('garlic is yellow: harm depends on an amount the label does not state', () => {
    for (const species of [['cat'], ['dog']] as Species[][]) {
      const g = row(rows('Chicken, Rice, Garlic', species), 'Garlic');
      expect(g).toMatchObject({ color: 'yellow', concernRank: 2, reason: 'Large amounts can harm red blood cells; the amount isn’t stated', statuses: { risk: 'documented_caution' }, kbId: 'garlic', concernFor: species });
      expect(g.sources[0]).toMatchObject({ claimType: 'risk', evidence: 'curated' });
    }
  });

  it('a concern in a description is not hidden by a longer harmless term', () => {
    expect(row(rows('Chicken, Natural Flavor (contains onion)', ['cat']), 'Natural Flavor (contains onion)')).toMatchObject({ color: 'red', kbId: 'onion' });
  });

  it('a blend or compound with a concern among its items is red; a caution makes it yellow', () => {
    const v = row(rows('Chicken, Vitamins [Vitamin E Supplement, Xylitol]', ['dog']), 'Vitamins');
    expect(v).toMatchObject({ kind: 'group', color: 'red', reason: 'Includes Xylitol, a documented concern', kbId: 'xylitol', concernFor: ['dog'], statuses: { risk: 'documented_concern' } });
    expect(v.children.map((c) => [c.id, c.color])).toEqual([['2.1', 'green'], ['2.2', 'red']]);
    expect(v.benefitsRisks).toMatch(/^Xylitol: Xylitol is toxic to dogs/);
    expect(v.sources.map((s) => s.url)).toEqual(['https://www.fda.gov/consumers/consumer-updates/paws-xylitol-its-dangerous-dogs']);
    expect(row(rows('Gravy (Water, Onion Powder)', ['cat']), 'Gravy')).toMatchObject({ kind: 'compound', color: 'red', reason: 'Includes Onion Powder, a documented concern', concernFor: ['cat'] });
    expect(row(rows('Vitamins [Niacin, Garlic]', ['cat']), 'Vitamins')).toMatchObject({ color: 'yellow', reason: 'Includes Garlic, which needs context' });
    expect(row(rows('Vitamins [Niacin, Yucca Schidigera Extract]', ['cat']), 'Vitamins')).toMatchObject({ color: 'gray', reason: '1 of 2 items not yet assessed by Purrbi (not the same as harmful)' });
  });

  it('uses the same curated entry and species as the ingredient notes do', () => {
    const text = 'Chicken, Glycerin, Propylene Glycol, Chicken Meal, Garlic, Taurine, Natural Flavor, Peas, Xylitol, Gravy (Water, Natural Flavor), Vitamins [Niacin, Taurine], Seasoning (Salt, Garlic Powder), Salt';
    for (const species of [['cat'], ['dog'], ['cat', 'dog']] as Species[][]) {
      const parsed = parseIngredientList(text);
      const fromRows = ingredientRows(parsed, species, none).map((r) => [r.kbId, r.concernFor]);
      expect(fromRows).toEqual(ingredientNotes(parsed, species).map((n) => [n.kbId, n.concernFor]));
    }
  });
});

describe('ingredient rows: the FDA DCM consideration (dogs only)', () => {
  it('peas as the 3rd ingredient are yellow for a dog food, with the FDA as source and no causal link claimed', () => {
    const peas = row(rows('Chicken, Rice, Peas, Chicken Fat', ['dog']), 'Peas');
    expect(peas).toMatchObject({ color: 'yellow', role: 'Carbohydrate source', statuses: { risk: 'consideration' }, reason: 'Pulse in the first 10: FDA reviewed dog heart disease (DCM); no causal link established' });
    expect(peas.benefitsRisks).toMatch(/no causal link was established/);
    expect(peas.sources).toEqual([expect.objectContaining({ claimType: 'risk', url: FDA_DCM, speciesScope: 'dog', evidence: 'curated' })]);
    expect(peas.concernFor).toBeUndefined(); // a consideration, not a documented concern or caution
  });

  it('does not apply to cats', () => {
    const peas = row(rows('Chicken, Rice, Peas, Chicken Fat', ['cat']), 'Peas');
    expect(peas).toMatchObject({ color: 'green', reason: 'Named carbohydrate source', statuses: { risk: 'not_assessed' } });
  });

  it('applies to potatoes among the main ingredients, not to sweet potatoes or to pulses after the first 10 or after the vitamins', () => {
    const g = rows(WELLNESS_GRAVIES, ['dog']);
    expect(row(g, 'Potato Starch')).toMatchObject({ color: 'yellow', reason: 'Potato in the first 10: FDA reviewed dog heart disease (DCM); no causal link established' });
    expect(row(g, 'White Sweet Potatoes').color).toBe('green');
    const late = row(rows('Chicken, Rice, Barley, Oats, Chicken Fat, Beet Pulp, Salmon, Eggs, Carrots, Apples, Flaxseed, Peas', ['dog']), 'Peas');
    expect(late).toMatchObject({ color: 'green', statuses: { risk: 'none_in_reviewed_list' } });
    expect(late.benefitsRisks).toMatch(/not among the main ingredients/);
    expect(row(rows('Chicken, Water, Vitamins [Niacin, Biotin], Peas', ['dog']), 'Peas').color).toBe('green');
  });
});

describe('ingredient rows: what can make a row green', () => {
  const YUCCA = 'Chicken, Yucca Schidigera Extract';

  it('nothing found is not a positive: an unrecognised ingredient is gray', () => {
    const y = row(rows(YUCCA, ['dog']), 'Yucca Schidigera Extract');
    expect(y).toMatchObject({ color: 'gray', reason: 'Not recognised by Purrbi yet (not the same as harmful)', role: '', whatItIs: 'Purrbi hasn’t identified this ingredient yet.', whyUsed: '', sources: [] });
    expect(y.statuses).toEqual({ identity: 'not_established', role: 'not_explained', risk: 'not_assessed', exposure: 'not_assessed', humanReview: 'not_performed' });
  });

  it('a validated function claim about people does not make it green', () => {
    const c = claim({ speciesScope: 'people', claim: 'Used as a foaming agent in beverages.' });
    const y = row(rows(YUCCA, ['dog'], claimsOnly('Yucca Schidigera Extract', [c])), 'Yucca Schidigera Extract');
    expect(y).toMatchObject({ color: 'gray', reason: 'Not yet assessed by Purrbi (not the same as harmful)', whyUsed: 'Used as a foaming agent in beverages.', statuses: { role: 'explained' } });
    expect(y.sources).toEqual([c]);
    expect(y.uncertainty).toMatch(/One source is about people \(human food\), not pet food\./);
  });

  it('a validated function claim about animal feed does', () => {
    const c = claim({ speciesScope: 'animal_feed' });
    const y = row(rows(YUCCA, ['dog'], claimsOnly('Yucca Schidigera Extract', [c])), 'Yucca Schidigera Extract');
    expect(y).toMatchObject({ color: 'green', reason: 'Role in animal feed supported by a checked source', whyUsed: c.claim, statuses: { role: 'explained' } });
    expect(y.sources).toEqual([c]);
    expect(y.uncertainty).toMatch(/One source is about animal feed in general, not pet food specifically\./);
    const pets = claim({ claimType: 'identity', speciesScope: 'pets', claim: 'A plant extract used in pet foods.' });
    expect(row(rows(YUCCA, ['dog'], claimsOnly('Yucca Schidigera Extract', [pets])), 'Yucca Schidigera Extract')).toMatchObject({ color: 'green', reason: 'Role in pet food supported by a checked source', whatItIs: pets.claim, statuses: { identity: 'established' } });
  });

  it('shows validated benefit and risk claims with their scope, without changing the colour', () => {
    const risk = claim({ claimType: 'risk', speciesScope: 'other_species', claim: 'High intakes reduced weight gain in rats.' });
    const benefit = claim({ claimType: 'benefit', speciesScope: 'dog', claim: 'Reduced faecal odour in a dog feeding study.', url: 'https://example.org/test-source-2' });
    const y = row(rows(YUCCA, ['dog'], claimsOnly('Yucca Schidigera Extract', [risk, benefit])), 'Yucca Schidigera Extract');
    expect(y.color).toBe('gray');
    expect(y.benefitsRisks).toBe('In dogs: Reduced faecal odour in a dog feeding study. In other animals (not cats or dogs): High intakes reduced weight gain in rats.');
    expect(y.uncertainty).toMatch(/One source is about other animals, not cats or dogs\./);
    expect(y.sources).toHaveLength(2);
  });

  it('a source that names no species is gray: "source not stated", even with a claim', () => {
    const list = rows('Animal Fat, Meat, Poultry By-Products, Fish Oil, Natural Flavors, Animal Digest, Bone Broth, Chicken By-Products', ['dog'], () => [claim({ speciesScope: 'pets' })]);
    expect(list.slice(0, 7).map((r) => [r.name, r.color, r.reason])).toEqual(
      ['Animal Fat', 'Meat', 'Poultry By-Products', 'Fish Oil', 'Natural Flavors', 'Animal Digest', 'Bone Broth'].map((n) => [n, 'gray', 'Source not stated on the label']),
    );
    expect(row(list, 'Chicken By-Products')).toMatchObject({ color: 'green', reason: 'Named animal protein source' });
  });

  it('a named fat with a preservative: green, the preservative explained, its curated entry kept as the notes keep it', () => {
    const fat = row(rows('Chicken, Chicken Fat (preserved with mixed tocopherols)', ['cat']), 'Chicken Fat (preserved with mixed tocopherols)');
    expect(fat).toMatchObject({ color: 'green', role: 'Fat source', kbId: 'mixed_tocopherols', statuses: { risk: 'not_assessed' } }); // chicken fat itself is not on the reviewed list
    expect(fat.whyUsed).toBe('Supplies fat, for energy and fatty acids. Preserved with mixed tocopherols: used as a preservative to keep fats from going rancid.');
    expect(fat.sources).toEqual([expect.objectContaining({ claimType: 'function', ingredientForm: 'mixed tocopherols', evidence: 'curated' })]);
  });

  it('says the label gives a percentage but exposure is still not assessed', () => {
    expect(row(rows('Poulet (26%), Riz', ['cat']), 'Poulet (26%)').uncertainty).toBe('The label gives 26%, but exposure isn’t assessed. Not reviewed by a person yet.');
  });

  it('never cites a URL that is neither in Purrbi’s list nor from a validated claim', () => {
    const c = claim({});
    const known = new Set([...kbSourceUrls(), c.url]);
    const text = `${WELLNESS_TUNA.replace(/\.$/, '')}, Propylene Glycol, Garlic, Peas, Xylitol, Yucca Schidigera Extract`;
    for (const species of [['cat'], ['dog'], ['cat', 'dog']] as Species[][]) {
      for (const r of everyRow(rows(text, species, () => [c]))) for (const s of r.sources) expect(known.has(s.url), s.url).toBe(true);
    }
  });
});

describe('ingredient rows: the Wellness gravies list for a cat', () => {
  it('27 rows, an 11-item vitamin blend, nothing red or yellow', () => {
    const list = rows(WELLNESS_GRAVIES, ['cat']);
    expect(list).toHaveLength(27);
    expect(row(list, 'Vitamins')).toMatchObject({ id: '16', color: 'green', role: 'Vitamin blend (11)' });
    expect(everyRow(list).filter((r) => r.color === 'red' || r.color === 'yellow')).toEqual([]);
    expect(['Chicken Broth', 'Eggs', 'Chicken Liver', 'Potato Starch', 'Carrots', 'Cranberries', 'Salt'].map((n) => row(list, n).color)).toEqual(Array(7).fill('green'));
    expect(row(list, 'Chicken Liver').whatItIs).toBe('A named organ meat.');
    expect(['Natural Flavor', 'Guar Gum', 'Xanthan Gum'].map((n) => row(list, n).color)).toEqual(['gray', 'gray', 'gray']);
  });
});

describe('review of the ingredient rows (2026-10-30)', () => {
  it('a red row and the score agree: the note uses the most severe entry too', async () => {
    const { assessGeneral } = await import('../../src/domain/score');
    const { classifyScope } = await import('../../src/domain/scope');
    const { facts } = await import('../helpers/fixtures');
    const f = facts({ ingredientsText: 'Chicken, Brown Rice, Peanut Butter (Peanuts, Natural Flavors, Xylitol), Chicken Fat', classificationSignals: [{ text: 'en:dog-food', source: 't' }], adequacyText: 'TEST FIXTURE is formulated to meet the nutritional levels established by the AAFCO Dog Food Nutrient Profiles for adult maintenance.' });
    const scope = classifyScope({ origin: 'opff', categoriesTags: ['en:dog-food'], texts: [''], adequacy: f.adequacy?.value });
    expect(row(rows('Chicken, Brown Rice, Peanut Butter (Peanuts, Natural Flavors, Xylitol), Chicken Fat', ['dog']), 'Peanut Butter').color).toBe('red');
    const g = assessGeneral(f, scope);
    expect(g.scoreLabel).toBe('Serious concern');
    expect(g.criticalConcerns.join(' ')).toMatch(/Peanut Butter/);
    expect(ingredientNotes(parseIngredientList('Natural Flavor (contains onion)'), ['cat'])[0].status).toBe('concern');
  });
  it('cooking liquids are broths, and modifier words never make a protein source', () => {
    const list = rows('Tuna Juice, Chicken Gravy, Tuna Consommé, Soy Lecithin, Bone Meal, Alfalfa Meal, Coconut Water, Magnesium Stearate', ['cat']);
    expect(['Tuna Juice', 'Chicken Gravy', 'Tuna Consommé'].map((n) => row(list, n).role)).toEqual(['Broth (moisture and flavour)', 'Broth (moisture and flavour)', 'Broth (moisture and flavour)']);
    expect(row(list, 'Soy Lecithin').role).toBe('Emulsifier');
    expect(row(list, 'Bone Meal').role).toBe('Vitamin or mineral');
    expect(row(list, 'Alfalfa Meal').role).toBe('Fibre source');
    expect(row(list, 'Coconut Water').role).toBe('Fruit or vegetable');
    expect(row(list, 'Magnesium Stearate').role).toBe('Processing aid');
    expect(everyRow(list).some((r) => r.reason === 'Named animal protein source')).toBe(false);
    expect(row(rows('Turkey Giblets, Dried Egg Product', ['dog']), 'Turkey Giblets').reason).toBe('Named animal protein source');
  });
  it('a claim about the other species does not make a row green', () => {
    const dogClaim = claim({ claimType: 'function', claim: 'Used in dog foods and supplements as an antioxidant.', ingredientForm: 'alpha-lipoic acid', speciesScope: 'dog' });
    const forCats = row(rows('Chicken, Alpha-Lipoic Acid', ['cat'], (t) => (/lipoic/i.test(t) ? [dogClaim] : [])), 'Alpha-Lipoic Acid');
    expect(forCats.color).not.toBe('green');
    const forDogs = row(rows('Chicken, Alpha-Lipoic Acid', ['dog'], (t) => (/lipoic/i.test(t) ? [dogClaim] : [])), 'Alpha-Lipoic Acid');
    expect(forDogs.color).toBe('green');
  });
  it('a checked risk for the product’s species makes the row yellow and its risk a consideration, and lifts the blend', () => {
    const risk = claim({ claimType: 'risk', claim: 'Fed in excess, it caused steatitis in cats.', ingredientForm: 'tuna oil', speciesScope: 'cat', doseContext: 'in excess' });
    const tuna = row(rows('Chicken, Tuna Oil', ['cat'], (t) => (/tuna oil/i.test(t) ? [risk] : [])), 'Tuna Oil');
    expect(tuna).toMatchObject({ color: 'yellow', statuses: expect.objectContaining({ risk: 'consideration' }) });
    const vitRisk = claim({ claimType: 'risk', claim: 'Excess vitamin D3 is toxic to dogs.', ingredientForm: 'vitamin d3 supplement', speciesScope: 'dog' });
    const blend = row(rows('Chicken, Vitamins [Vitamin E Supplement, Vitamin D3 Supplement]', ['dog'], (t) => (/d3/i.test(t) ? [vitRisk] : [])), 'Vitamins');
    expect(blend.color).toBe('yellow');
  });
  it('a blend item’s claim keeps its source, and a claim sentence is never shown as a role', () => {
    const feed = claim({ claimType: 'function', claim: 'As a feed additive, ethylenediamine dihydriodide supplies iodine.', ingredientForm: 'ethylenediamine dihydroiodide', speciesScope: 'animal_feed' });
    const people = claim({ claimType: 'function', claim: 'Used as a foaming agent in beverages.', ingredientForm: 'yucca schidigera extract', speciesScope: 'people' });
    const list = rows('Chicken, Minerals (Zinc Proteinate, Ethylenediamine Dihydroiodide), Vitamins [Vitamin E Supplement, Yucca Schidigera Extract]', ['dog'], (t) => (/ethylenediamine/i.test(t) ? [feed] : /yucca/i.test(t) ? [people] : []));
    expect(row(list, 'Minerals').sources.some((s) => s.url === feed.url)).toBe(true);
    const yucca = row(list, 'Vitamins').children.find((c) => c.name === 'Yucca Schidigera Extract')!;
    expect(yucca.role).toBe('');
  });
  it('sweet potatoes are not potatoes in any label language; a mineral listed by name ends the main ingredients', () => {
    for (const t of ['Agneau, Patate douce (25%), Riz', 'Agnello, Patate dolci, Riso', 'Lamm, Süßkartoffeln, Reis']) expect([t, rows(t, ['dog'])[1].color]).not.toEqual([t, 'yellow']);
    const list = rows('Chicken, Rice, Chicken Fat, Natural Flavor, Dicalcium Phosphate, Salt, Potatoes, Vitamin E Supplement', ['dog']);
    expect(row(list, 'Potatoes').color).not.toBe('yellow');
  });
  it('nutrient texts say no more than is true', () => {
    const list = rows('Chicken, Ascorbic Acid, Inositol, Beta-Carotene, L-Carnitine', ['cat']);
    expect(row(list, 'Ascorbic Acid').whatItIs).toMatch(/make themselves/);
    expect(row(list, 'Inositol').whatItIs).toMatch(/make themselves/);
    expect(row(list, 'Beta-Carotene').whatItIs).toMatch(/cats cannot/);
    expect(row(list, 'L-Carnitine').whatItIs).toMatch(/not an essential amino acid/);
    expect(everyRow(list).filter((r) => /essential vitamin/.test(r.whyUsed))).toEqual([]);
  });
  it('named sources in other languages are named; a named digest discloses its source', () => {
    const list = rows('Huile de colza, Huile de tournesol, Algae Oil, Chicken Digest', ['cat']);
    expect(['Huile de colza', 'Huile de tournesol', 'Algae Oil'].map((n) => row(list, n).reason)).toEqual(['Named fat source', 'Named fat source', 'Named fat source']);
    expect(row(list, 'Chicken Digest').whatItIs).not.toMatch(/not disclosed/);
  });
});
