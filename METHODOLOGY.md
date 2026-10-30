# Purrbi assessment methodology

Version: `assessment-3.0.0` overall, made of `purrbi-score-3.0.0` (score), `scope-3.0.0` (classification), `verdict-2.1.0` (verdict),
`kb-2026-10-28-draft` (ingredient notes), `label-extract-2.3.0` (label reader), `research-2.0.0` (web research), `explain-2.0.0` (claim-checked explanations).
A saved result records `assessmentVersion` and its parts (`scoreVersion`, `kbVersion`, `scopeVersion`); the shared product record its
classification version; each fact read from a label, page or document its reader's version; each explanation its own. When the app opens
a result saved under an older `assessmentVersion` it asks for a re-check (section 10), so a known bad classification is corrected without
deleting history or reinstalling.

The Purrbi score is Purrbi's own, **provisional** methodology for rating what a product's label shows about it for its intended use. It is
not an FDA, AAFCO, WSAVA or veterinary rating, and no qualified reviewer has reviewed it. It does not depend on the pet profile: two pets see
the same general score for the same evidence. Personal fit is assessed separately (section 6).

Code: `backend/functions/src/domain/score.ts` (score), `scope.ts` (classification), `ingredientRows.ts` and `roles.ts` (ingredient rows),
`highlights.ts`, `personalize.ts`, `../knowledge/explain.ts` and `claims.ts` (claim checks), `../ai/verdict.ts`, `../sources/research.ts` and
`pageEvidence.ts` (retrieval).

## 1. What the product is, first

Every scan is classified from the product's own evidence before anything is scored.

| State | When | What the app shows |
|---|---|---|
| **Confirmed pet product** (`supported`) | Some evidence says it is for cats or dogs (see species, below) | The assessment |
| **Confirmed not a pet product** (`out_of_scope`) | Affirmative evidence of another kind of product (its own categories are all human-food or cosmetic ones, or a verified page says it is for people) and nothing points to an animal food | Why it is out of scope; no score |
| **Unresolved** (`unknown`) | Neither of the above, or strong sources disagree | "Not scored yet", with a request for the front of the package |

**Species (a set, from the strongest evidence).** A product can be for cats, dogs, or both (`productSpeciesSet: ["cat", "dog"]`). Each name or
statement counts by where it comes from, strongest first: the package label (photo or database label image) → the nutritional adequacy
statement → the manufacturer's page → the pet database's species categories → a pet-database record's name → a retailer's listing. The species
named at the strongest basis present are the set. A weaker source naming fewer species is consistent, not a conflict (a retailer's "Dog Trt …"
for a "Dog and Cat Treat"). Two sources at the same strongest basis naming different species leave it unresolved, never merged.
**Confirmed** means the strongest basis is not a retailer's listing: a retailer's catalogue title, category or tags alone do not confirm who a
product is for, so a mismatch with the pet is shown as "review", never as "made for another species" (section 6). The selected pet, package
pictures, the database a record is filed in, a URL or a single keyword never decide the species.
Each source counts once, at its own strongest basis (a retailer's page naming dogs in its title and cats in its tags is one retailer listing for
cats and dogs). A species that a weaker source names but the strongest does not is kept (`alsoNamed`): a pet of that species is told "review",
never that the product is not for it. While the species is unconfirmed, documented concerns and the score's species rules are applied for
**both** cats and dogs (the stricter values), so weak evidence never makes a result less careful than no evidence.

**Product type (`categoryBasis`).** Complete food, treat, topper/complementary or supplement rests on, in order: a product named a supplement;
the feeding statement ("complete and balanced …" → complete food; "for intermittent or supplemental feeding" → treat or complementary);
the product named a treat, topper, mixer or complementary food; and only then general words such as "cat food" (unconfirmed). Words such as
broth, gravy, flaked or entrée never make a topper. Marketing copy ("complete and balanced nutrition for everyday feeding") is not an
adequacy statement: a real one names the species or life stage, or the standard it was substantiated against (AAFCO, FEDIAF, "formulated to
meet", feeding tests). A manufacturer's "AAFCO nutrient profile claim substantiation" document is such a statement.

- A page found by brand and name alone never decides the species when nothing else says it, and gives only what does not vary between a
  product's package sizes (section 9).
- When a saved classification changes, an audit entry is written to `products/{gtin}/classifications`.

## 2. Minimum evidence per category

Essential inputs are required before any number is shown; without them the score is withheld (never estimated) and the result names the exact
missing requirement while still showing what was found. A number is also shown only when the parts assessed are worth at least 70 points.

| Category | Essential (no number without) | Optional (coverage only) |
|---|---|---|
| Complete food | Nutritional adequacy statement; guaranteed protein and fat (with moisture for the dry-matter comparison); ingredient list | Calorie statement; further guarantees |
| Treat / complementary | Ingredient list; and the calorie statement, or both the feeding statement and the guaranteed analysis | Feeding statement; guaranteed analysis |
| Supplement | Active ingredients or ingredient list (no number: see below) | Amounts per serving; warnings; quality signals |
| Any | Confirmed identity, species and category (section 1) | — |

## 3. Parts and weights (each category totals 100)

**Complete food**

| Part | Points | Rule |
|---|---|---|
| Nutritional adequacy statement | 30 | Complete and balanced for a named life stage: feeding tests 30, formulation 27, method not stated 24; no life stage 18; names another species 10; unclear 8 |
| Protein and fat (AAFCO minimums, dry matter) | 30 | Both at or above the AAFCO minimum for the species and life stage 30; one 12; neither 0 (see below) |
| Main ingredients named by source | 20 | 20 × the share of the first five source ingredients that name their animal or plant |
| Calorie content statement | 10 | Listed 10; not found: left out |
| Further guarantees | 10 | Two or more beyond protein, fat, fiber and moisture 10; one 6; none 0 (left out when the only analysis is a database record's) |

AAFCO minimums used (% of dry matter): cats, adult protein 26 and fat 9, growth protein 30 and fat 9; dogs, adult protein 18 and fat 5.5,
growth protein 22.5 and fat 8.5. A product for both species is held to the stricter (cat) values; "all life stages" and gestation/lactation
claims use the growth values. Dry matter is computed from the guaranteed **minimums** and the **maximum** moisture, so it is conservative (the
true values can only be higher). Without a moisture guarantee a value already at the minimum as fed passes; otherwise moisture is required.
The AAFCO profiles assume 4,000 kcal ME per kg of dry matter: for a denser food (calories per kg, per 100 g, per oz or per lb as sold, with the
moisture), the minimum is raised in proportion; a less dense food is held to the
plain minimum (no correction downwards), and the result gives both ("minimum 26%, ≈ 30.1% at this food's energy density"). A part that is not
met says what would reach it.
Guaranteed minimums and maximums are never presented as exact analytical values.

**Treat or complementary product**

| Part | Points | Rule |
|---|---|---|
| Main ingredients named by source | 40 | 40 × the share of the first five source ingredients that name their animal or plant |
| Calorie content statement | 30 | Listed 30 (portion control: treats under about 10% of daily calories) |
| Feeding statement | 15 | Clear 15; unclear 8 |
| Guaranteed analysis (protein, fat, fiber) | 15 | Listed 15 |

"Source ingredients" leave out processing liquids (water, broth), vitamins and minerals, and technological additives (gums, preservatives,
salt). An ingredient "names its source" unless it is a generic name: meat, animal, poultry, fish, by-products, derivatives, digest, cereals,
vegetable oils, natural flavor(s). "Chicken by-product meal" names its animal; what part is used is not what this checks.

**Supplements** get no number: their purpose, dose and evidence vary by ingredient. They get the label facts, their active ingredients with
amounts, any documented concerns and personal suitability checks (section 6).

## 4. One score; coverage kept separate

- A part without evidence is left out of the score, never counted as poor quality and never filled in. **Score** = points earned ÷ points'
  worth of the parts assessed × 100, rounded.
- **Coverage** is shown apart from the score (`coverageText`, e.g. "Based on 4 of 5 parts: … (calorie content statement not found)").
  The app shows one number, never a range.
- **Critical concerns cannot be averaged away.** A documented concern for the product's species (section 5) caps the score at **20** and
  labels it **Serious concern**, whatever the other parts earned; the concern and its source are listed (`criticalConcerns`). It is
  counted only there (no second penalty elsewhere). A context-dependent caution never caps or lowers the score. An unsupported hypothetical
  risk is never a concern.
- **Ratings**: 85+ Strong (green); 70–84 Good (green); 50–69 Fair (yellow); below 50 Weak (red); capped: Serious concern (red).
  Not scored: gray, with the exact missing requirement.
- Stable inputs give the same score (deterministic). Vitamin and mineral blends count once, and splitting a blend adds nothing.

## 5. Ingredients: rows, colors and claims

Each label entry is one row, in label order (a "concerns first" order is offered separately). A vitamin or mineral blend is one row with
its items as children, each assessed and searchable; children never count as separate positives. Malformed brackets are repaired without
losing or duplicating an ingredient, and the entry as printed is kept for traceability.

| Color | Meaning |
|---|---|
| **Green** | A supported favourable or appropriate role under the assessed conditions: Purrbi's curated role classes (named animal proteins and fats, essential nutrients, standard preservatives, processing water or broth, named carbohydrate and fibre sources), or a claim-checked explanation from a pet-food or animal-feed source. Not a guarantee of benefit or safety; never given because no study or recall was found. |
| **Yellow** | A supported context-dependent consideration, with its reason: a documented caution whose harm depends on an amount the label does not state (garlic), or a documented consideration (for dogs, pulses or potatoes among the first ten ingredients: the FDA's DCM investigation, which found no causal link). |
| **Red** | A documented concern for the species from a regulatory or veterinary toxicology source (propylene glycol in cat food, onion, xylitol for dogs). A confirmed allergy match is shown separately as a pet-specific conflict. Never red because an ingredient is unfamiliar, synthetic or processed, or harmful only at unrelated exposures. |
| **Gray** | Not enough applicable evidence yet, or an unstated source ("natural flavor"): not harmful by default. |

The row, the score's cap and the ingredient note always use the same curated entry: of every entry the name and its listed parts match, the
most severe for the product's species, then the one named by the longest term ("Peanut Butter (Peanuts, Natural Flavors, Xylitol)" is
xylitol's). Roles come from the role table, matched on the head of the name ("Tuna Broth" and "chicken gravy" are broths, "Salmon Oil" a fat,
"Soy Lecithin" an emulsifier, "Magnesium Stearate" a processing aid, "Bone Meal" a mineral source; a meat word that is not the head does not make
a protein source). A cited claim supplies a role only when it is about cats and dogs, pets, animal feed or the product's own species, and only in
the table's words. A claim-checked risk for the product's species makes the row yellow with its reason. Vitamin C, inositol and beta-carotene are
"optional nutrients" (dogs and cats make the first two; cats cannot use beta-carotene), and carnitine is not an essential amino acid. Sweet
potatoes (also in French, German, Italian and Spanish) and green, soy, locust or carob beans are not pulses or potatoes for the DCM note. A blend lists the sources
of all its items, and each item keeps its own label text, checks and sources.

Tapping a row shows: what it is → why it is used → supported benefits and risks → relevance to this pet → what is not known → sources. Each row
keeps five separate statuses: identity established; role explained; risk evidence assessed; exposure assessed (labels give no amounts, so
"not assessed"); human review (not performed: the curated list is a draft). An AI explanation never marks anything "reviewed".

**Claims are checked one by one** (`explain-2.0.0`). Each displayed claim keeps: the exact ingredient or chemical form → the claim → the
source passage (verbatim, found on the fetched page) → the species or use the source is about → dose or exposure when it matters → evidence
strength → retrieval and publication date → review status ("automated checks"). Purrbi checks that the passage names that exact form (sunflower
seeds are not sunflower oil), that a benefit or risk claim comes from a source about cats, dogs, pets or animal-feed safety (never swine
nutrition or human food-additive evidence presented as pet evidence), that a product-naming rule is not applied to an ingredient-list entry,
and then asks a second model whether the passage supports the claim, narrowing or rejecting it. A quote keeps its numbers and its whole
sentence. Explanations made under the earlier method were withdrawn and are written again under these checks; each withdrawal is recorded with
its reasons (`knowledgeAudit`), including terms no scan asks for any more (a sweep of earlier entries on each assessment).

## 6. Personal fit (separate from the score)

Personal fit is checked against the selected pet's recorded information:

- species, from the product's own evidence (not from the pet). A mismatch ("made for dogs, not cats") is stated only when that evidence is confirmed (section 1); when only a retailer's listing names a species, the fit is "review" ("Only a retailer's listing says who it is for …"). Unknown species is never a mismatch;
- documented concerns and cautions, judged for the pet's own species. A cat-only concern in a product for cats and dogs is noted as "not for dogs" for a dog. A concern for the pet's species makes the fit a possible mismatch; a caution makes it "review";
- life stage, against the adequacy claim;
- large-breed growth;
- allergies and sensitivities: "Contains chicken — you recorded chicken as an allergy" is a pet-specific conflict (it never changes the general score); a recorded sensitivity is flagged as a sensitivity, never as an allergy, and ranked after an allergy; an ingredient whose source is not stated ("natural flavor") makes compatibility **unconfirmed**, never a confirmed match ("Compatibility with milly's recorded pork allergy is unconfirmed: the source of natural flavor isn't stated on the label"); recorded allergens not on the list are one qualified line that never implies allergen-free manufacturing;
- owner preferences;
- vet-directed diets;
- for supplements, suitability: medicines, a reported condition, or pregnancy or nursing call for the vet's view, so the fit is "review", never "fits".

"Not sure" and "not provided" stay distinct, and Purrbi never claims "no interactions". Breed alone is not used.

## 7. The concise result

**Highlights.** At most 2 positives and 2 cautions, chosen in this fixed priority from computed findings. Each carries its evidence.

Cautions:
1. Recall notice matching the barcode
2. Documented ingredient concern, judged for the selected pet's species (without a pet, for the product's)
3. Made for another species
4. Contains an ingredient in the allergy or sensitivity profile
4a. Who it is for isn't confirmed (only a retailer's listing names a species other than the pet's)
5. Possible (lot-specific) recall match
6. Life-stage mismatch
7. Large-breed growth
8. Allergy match unconfirmed (an ingredient whose source isn't stated)
9. Vet-directed diet
10. Unclear feeding statement
11. Documented caution (a flag; no points)
12. A supplement question for the vet (medicines, condition, pregnancy or nursing)
13. An ingredient the owner avoids

Positives:
- matches the known life stage;
- complete and balanced;
- protein and fat above the AAFCO minimums (dry matter);
- main ingredients named by source;
- recorded allergens not on the ingredient list (one qualified line);
- calories listed (treats);
- made for the pet's species.

"No documented ingredient concerns" is never a positive. Purrbi's reviewed list is short, so finding nothing on it is not a strength.

While the product is unresolved, only recall and documented-concern cautions are shown, and no positives.

**Verdict.** 25–40 words written by a model (`OPENAI_VERDICT_MODEL`). It interprets the findings for the pet; it never restates the score's missing-information message (the screen shows that).

- **Input.** Only the computed assessment, highlights (their full statements) and pet-fit findings, as JSON.
- **Privacy.** The pet's name is replaced by "your cat" or "your dog" before the call and put back only in the app's copy.
- **Checks.** The sentence is rejected, and a rule-based sentence from the same findings is used instead, if it:
  - is under 25 or over 40 words, or ends with "…";
  - repeats a missing-information message ("not enough information to score", "partial assessment", a range) instead of interpreting the findings, or names none of the findings when there are some;
  - makes a claim Purrbi does not make: safety, praise such as "great", "high-quality", "premium", "nutritious" or "best", "recommended", "no concerns", or health and treatment claims;
  - gives a score ("N/100", "N out of 100") other than the assessment's score;
  - uses any other number that is not stated in the score, its basis, the highlights or the unresolved items;
  - gives an unscored product a number out of 100;
  - omits the most serious caution.
- **Fallback.** The rule-based sentence is built from whole sentences, 25–40 words, with the most serious caution first, then what the findings mean; an unscored product gets one short clause on what a rating still needs. It passes the same checks.
- **Fixed sentences.** Out-of-scope and unresolved products get a fixed sentence.
- **Caching.**
  - Verdicts are cached per account by the hash of their input and model (`users/{uid}/verdicts/{key}`, server-only), so the same evidence and pet never cost a second call.
  - A rule-based fallback is reused for the product freshness window only.
  - A failed call is not cached.

## 8. Recalls

Purrbi checks the official FDA enforcement reports (openFDA, updated weekly). The result is cached for 24 hours (a check that could not be made is not cached).

| Status | Shown as |
|---|---|
| `exact_active` | "Recall notice matches this barcode" (alert; overrides the verdict) |
| `possible_active` | "Possible match: compare the lot code" (lot- or brand-and-name match) |
| `brand_history` | "No current matching notice (older notices exist for this brand)"; the summary names a closed recall of this barcode and counts open records of the brand's other products |
| `none_found` | "No matching notice found in the sources checked" (never "no recalls") |
| `unavailable` | "The recall check failed; try again later" |
| `not_checked` | "Not checked" (e.g. the brand isn't known yet) |

Icons say what kind of outcome it is, never a certification: a match is red, a possible match or a failed check orange, and "no match found",
brand history and "not checked" use neutral icons (no green badge): no match in the sources checked is not a safety guarantee. The result
keeps when the check was made (a cached check shows its original date, never "checked" again), what was searched (`recallCoverage`: openFDA
enforcement reports by barcode, then brand and product name; FDA's recall page, manufacturers' notices and lot codes are not checked) and
what a match rests on (`recallMatchBasis`). Recall checking is separate from nutrition completeness: it runs whenever the brand is known.

## 9. Evidence labels and label photos

Each fact shows where it came from:

- the database record;
- a database label image read by AI (two readings must agree);
- a manufacturer or retailer page, where each fact was found on the page;
- a label photo matched to this barcode (shared);
- the owner's own label photo (private).

Nothing is marked as reviewed by a person unless it was.

**How a label is read** (label photos and database label images; reader `label-extract-2.3.0`, `ai/labelExtract.ts`):
- The model only transcribes each visible panel, word for word, marking anything it cannot read with certainty. Two independent readings are made (two different models where configured); only what both say is kept.
- Purrbi takes the values from the transcription with its own fixed rules (`domain/analysisText.ts` for the analysis):
  - the ingredient list only after a printed "Ingredients"/"Composition" heading;
  - the adequacy statement as printed, also from a line a partly legible panel shows in full (no unreadable mark), without the composition that may follow it on the same line ("Aliment complet pour chat adulte. Composition : …");
  - analysis rows only from an analysis section ("Guaranteed analysis", "Constituants analytiques", "Analytische Bestandteile", … in English, French, German, Spanish, Italian, Dutch and Portuguese, also when a heading breaks across two lines): a composition, additives (with or without "nutritional" or "per kg" in the heading), a feeding guide, a dry-matter list, or a block in another language ("PL Skład: …") is not read, so an ingredient's percentage is never an analysis row;
  - rows printed one per line or inline as on EU packs ("Protéine : 37,0 %, Matières grasses : 13,0 %, …"); a name printed above its value, a name wrapped inside its brackets, or a unit printed on the next line is joined to it — but not a complete name above (one that ends with its min/max, as in a bilingual table) or a group heading ("Water-soluble vitamins");
  - each row needs a name of its own that names one nutrient (or, for another row, a real word), with no other number in it and balanced brackets, and a printed unit (or a "(%)" heading); a fibre fraction ("total dietary fibre") is not the crude fibre guarantee, and fatty acids ("acidi grassi") are not fat;
  - a min/max printed after the value is the row's own; one wrapped onto the next line ("6.0%\nmin, Crude Fiber") goes to the row before;
  - nothing ambiguous is read: a printed line where a value has no name of its own ("1.0% / 1.5%", "30% 28%") or which gives a range is skipped; a section where values are printed before their names ("Minimum: 30% Crude Protein, …") is not read at all; nor are values printed inline without units, a space that may be a thousands separator ("36 900 UI/kg"), one value under two nutrients ("oméga 3 et 6"), anything an unreadable mark touches, and a nutrient given two different values (two recipes, as fed and dry matter); "15,000 IU/kg" is fifteen thousand.
- Readings made by `label-extract-2.2.0` stay in use as they are (2.3.0 only reads an adequacy line 2.2.0 left out); a database label image's nutrition panel is read again once.
- Readings made by `label-extract-2.1.0` stay in use as the current rules use them: only their plain analysis rows (a row naming one nutrient, with no other number in its name, in %, within food-level bounds for minor nutrients, and no second value for that nutrient), and an ingredient list cut again where its analysis starts. A row set aside that was a required guarantee is asked for again; a reading that was disputed only because of a row now set aside is compared with the public record again (its photo's stage and note change with it). A database label image whose 2.1.0 analysis had a row set aside, or whose nutrition panel 2.1.0 could not read, is read again once, and retried after a technical failure.
- The same analysis rules read the analysis printed on a manufacturer's or retailer's page (research `research-2.0.0`), from the fetched page that is itself shown to be this product (the one with the barcode, or else the one with the brand and the name): the page's own analysis is used when it gives more than the model's answer, or when the answer disagrees with it, and the result says so only when it uses it.

An owner's label photo goes through these stages, recorded on the photo (`stage`, `stageNote`) by the backend only (`pipeline/corroborate.ts`):

| Stage | Meaning | Used for |
|---|---|---|
| submitted | Uploaded by the owner | — |
| extracted | Two independent AI readings agreed on the label text. Its note says whether there was anything public to compare it with, whether what it shows agrees so far but too little to confirm it, agrees in part (e.g. a recipe partly the same), or could not be matched yet | The owner's own result |
| corroborated | An independent public source agrees: this barcode's record has the same analysis (at least two guarantees, ±0.5 points) or the same name | The owner's own result |
| verified | Also tied to this barcode: the barcode is on the photo, or the photo shows this barcode's recipe (at least 80% of the first 10 ingredients, in order) | The owner's result, **and** gaps in Purrbi's shared record for this barcode |
| disputed | Conflicts with this barcode's record (another recipe, under 60% match, or another analysis) | Not used; the owner is asked to check the package |

Promotion rules for verified readings:
- They fill only fields the shared record lacks, and never overwrite.
- They are shown to others as "A label photo matched to this barcode (read by AI, not reviewed)".
- Each promotion is audited in `products/{gtin}/contributions` with a one-way hash, not the account id. The image itself is never shared.
- The switch is `PROMOTE_LABEL_PHOTOS`.

A result that uses the owner's photo before it is tied to the barcode says "Label-based assessment with product identity not yet independently verified".

## 10. Retrieval before photos, and keeping results current

**Research `research-2.0.0`** (`sources/research.ts`, `pageEvidence.ts`). When the pet databases lack something, research looks for it before
any photo is asked for:
- With no name or brand from any database, a public barcode database (UPCitemdb's free lookup, `BARCODE_LOOKUP_ENABLED`) is asked for the
  product's title, only to tell research what to search for; nothing from it is shown or used as a fact. Its failure is recorded as such.
- Purrbi fetches each candidate page itself and reads its visible text, **image alternative text** (manufacturers publish ingredient lists
  as an image's alt text), barcodes in its **markup** (a shop widget's `ps-sku`, `data-upc`, JSON-LD `gtin`) or its **Shopify product
  record**, and **linked nutrition documents** (a "Nutrient Profiles" PDF: the AAFCO claim and calories per package).
- Every fact is checked on its own page, and each page is tied to the product on its own. Strong identity is the barcode on the page (in its
  text, as its markup's one barcode, or as the Shopify variant it shows, tied to the link by `?variant=` when the product has several), or the
  same recipe in the same order (at least 5 ingredients compared, 80% matching, with the brand on the page). A barcode that is one of several on
  a page (sizes or flavours) or a trusted name in the product's heading is weak: such a page gives only what a weak match may give (below), and
  nothing at all while it is unknown whether the product is for cats or dogs. Downloads are bounded and the research step stops after 200 s,
  keeping what was verified; when the AI budget runs out before the manufacturer follow-up, what the first page verified is kept. After a retailer's page,
  the manufacturer's own page is sought for what is missing; it may be matched by brand and the product name with catalogue abbreviations
  written out ("Dog Trt Frz Dr Wld Salmn" = "freeze dried wild salmon … treat"). From such a name-level match only what does not vary between
  package sizes is used: who it is for (only when it includes the species already known), the feeding statement, and a single-ingredient list
  named in the product's name; never the analysis or calories. The manufacturer's product name replaces a retailer's catalogue title on screen.
- Calories keep the package they are for ("70 kcal per 2.8-oz can", "133 kcal per 5.3-oz can"); the scanned package's size (from the
  barcode's own page or the label) selects the one shown. Values for other sizes are never shown as interchangeable servings.
- For each missing field the result distinguishes: not searched, source unavailable, not on the source, not read, rejected by a check, and
  the photo request that follows. A provider error is never "product unknown"; partial findings are kept.
- Only panels still missing after this are requested; one photo can cover several requests; "Continue without photos" keeps the findings.

**Keeping results current.** Every result records `assessmentVersion`. When the app opens a result saved under an older version (complete,
waiting for photos, or out of scope), it asks the backend to re-check it (`refreshPersonalRequested`, allowed by the security rules for those
states): the product's evidence is re-read where its saved record is out of date (bounded by the same per-product freshness as a scan, so no
repeated paid processing), explanations are checked under the current rules, the photos the current rules need are asked for again (unless the
owner chose "Continue without photos"), and the result is saved with a note saying it was re-checked. Re-checks have their own daily quota per
owner (40); past it, the saved evidence is used and the result keeps its old version, so the re-check happens on a later opening.
- Research saved by an earlier method is kept until research under the current method has returned: a provider error, quota, switch or time
  limit never turns a known product into an unknown one, and such a result keeps its old version so it is re-checked later. A run that cannot
  re-read sources (a photo, a pet change) never removes saved research, and every write to the shared record is conditional on the record the
  run read: when another job changed it meanwhile, the newer record is kept.
- A result made under newer rules than the backend's (a later release, before a rollback) is left as it is. A late or duplicate job never
  overwrites a newer result (`assessmentInputsAt`). Explanations and the verdict that a job reaches late are added by a run of their own.
