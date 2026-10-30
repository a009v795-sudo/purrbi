# Purrbi assessment methodology

Version: `purrbi-score-2.0.0` (score), `scope-2.1.0` (classification), `verdict-1.3.0` (verdict),
`kb-2026-10-28-draft` (ingredient notes), `label-extract-2.2.0` (label reader), `explain-1.2.0` (cited explanations).
A saved result records its score and ingredient-note versions (`scoreVersion`, `kbVersion`); the shared product record its
classification version (`scopeVersion`); each fact read from a label or a web page its reader's version; each explanation its own.

The Purrbi label score is Purrbi's own measure of how well the label information that is available supports the product's intended use. It is not an FDA, AAFCO, WSAVA or veterinary rating. It does not depend on the pet profile: two pets see the same general score for the same evidence. Personal fit is assessed separately.

Code: `backend/functions/src/domain/score.ts` (score), `scope.ts` (classification), `roles.ts` (ingredient roles), `highlights.ts`, `personalize.ts`, `../ai/verdict.ts`.

## 1. What the product is, first

Every scan is classified from the product's own evidence before anything is scored. The evidence comes from the record's categories, label text, ingredients, a verified manufacturer or retailer page, or the owner's label photo.

| State | When | What the app shows |
|---|---|---|
| **Confirmed pet product** (`supported`) | Pet categories, a feeding statement for cats or dogs, label words such as "cat food", or a verified page or label photo saying who it is for | The assessment |
| **Confirmed not a pet product** (`out_of_scope`) | Affirmative evidence of another kind of product. Examples: the record's own categories are all human-food or cosmetic ones, or a verified page describes it as for people. Nothing may point to an animal food | Why it is out of scope; no score |
| **Unresolved** (`unknown`) | Neither of the above, or the evidence conflicts | "Not scored yet", with a request for the front of the package |

- Which database a record is filed in (Open Food Facts vs Open Pet Food Facts, `product_type`) is provenance only, never proof.
- The selected pet profile and package illustrations never decide the species.
- A page found by brand and name alone never decides it either. It must show the barcode, or the same recipe in the same order: at least 80% of the first 10 ingredients, with at least 5 compared.
- When a saved classification changes, an audit entry is written to `products/{gtin}/classifications`.

## 2. Minimum evidence per category

Essential inputs are required. Without them the score is withheld, never estimated. Other inputs change only the coverage. The one exception is a complete food's adequacy statement: without it, the score is capped at 74.

| Category | Essential (no score without) | Other inputs (coverage only) |
|---|---|---|
| Complete food | Ingredient list; guaranteed analysis (protein, fat, fiber) | Nutritional adequacy statement (score capped at 74 until it is known); calorie statement; moisture; further guarantees |
| Treat / complementary | Ingredient list **or** guaranteed analysis | Feeding statement; calorie statement; moisture; the other of ingredients / analysis |
| Supplement | Active ingredients or ingredient list | Amounts per serving; warnings; quality signals |
| Any | Confirmed identity, species and category (section 1) | — |

## 3. Components and weights (each category totals 100)

**Complete food**

| Component | Points | Rule |
|---|---|---|
| Nutritional adequacy statement | 50 | Feeding tests 50; formulation 43; complete but no life stage or a different species 30; unclear 20; missing: unverified |
| Required guarantees (protein, fat, fiber) | 25 | Listed 25 |
| Calorie content statement | 15 | Listed 15 |
| Moisture guarantee | 5 | Listed 5 |
| Further guarantees | 5 | 2 or more 5; one 3; none 0 (unverified if from a database record) |

**Treat or complementary product**

| Component | Points | Rule |
|---|---|---|
| Feeding statement | 25 | Present and clear 25; unclear 13; missing: unverified |
| Required guarantees | 40 | Listed 40 |
| Calorie content statement | 30 | Listed 30 |
| Moisture guarantee | 5 | Listed 5 |

Ingredients earn and lose no points: see section 5.

**Supplements** get no number: their purpose, dose and evidence vary by ingredient. Instead they get:
- the label facts, and their active ingredients with amounts;
- any documented concerns;
- personal suitability checks (section 6).

## 4. Coverage is kept separate from quality

- A component without evidence is **unverified**. It is left out of the score, never counted as poor quality and never filled in.
- **Score (quality)** = points earned ÷ points' worth of the components that could be assessed × 100.
- **Coverage** (`scoreCoverage`) = points' worth of the components that could be assessed (0–100).
- **Range**: `scoreMinPossible` (every unverified item failed) to `scoreMaxPossible` (every one met). The score always lies within it.
- `scoreBasis` gives all three in one line, e.g. "Based on 50 of 100 points' worth of label information (nutritional adequacy statement not available yet); the complete label could put it between 50 and 100. Score capped at 74 until the adequacy statement is known."
- Below 80 points' coverage the label is **Partial assessment**, not a quality band.
- **Caps** (stated in `scoreBasis`):
  - a documented concern for the product's species caps the score at 20, labelled **Documented ingredient concern** (section 5);
  - a complete food without its adequacy statement is capped at 74, so it is never "strong".
- **Bands** (coverage of 80 or more, no documented concern):
  - 85+ Strong label information;
  - 70–84 Good label information;
  - 50–69 Review the details;
  - below 50 Weak label information.
- The app shows `scoreText`, never the raw number on its own:
  - **Unscored** when essential evidence is missing;
  - **Not scored** for supplements and out-of-scope products;
  - an unscored result is never shown as 0/100.

## 5. Ingredients: roles and documented concerns, not counts

- **No counting.** Ingredients are never counted as "good" or "bad". Grains, by-products, unfamiliar names and synthetic nutrients are not penalised. "Unknown" means not yet reviewed, not harmful.
- **Roles.** Each ingredient is listed in label order with its role, e.g. "Protein source", "Fibre source", "Preservative" or "Vitamin or mineral". The role comes from Purrbi's curated role table (`roles.ts`). Where that table has none, it comes from a cited page whose quote Purrbi found on the page. A role never changes the score.
- **Purrbi's reviewed list** (`kb.ts`) changes the result in two ways only:
  - a **concern** is harm that a regulatory or veterinary toxicology source documents for that species. Examples: propylene glycol in cat food (21 CFR 589.1001), onion, xylitol for dogs. It caps the score at 20 and comes first among the cautions;
  - a **caution** is harm that depends on an amount the label does not state (e.g. garlic). It is a flag only, with no points.
- Each listed entry gives one finding, naming every form listed (e.g. "garlic, garlic powder").
- Explanations never change a status or the score.

## 6. Personal fit (separate from the score)

Personal fit is checked against the selected pet's recorded information:

- species, from the product label (not from the pet);
- documented concerns and cautions, judged for the pet's own species. A cat-only concern in a product for cats and dogs is noted as "not for dogs" for a dog. A concern for the pet's species makes the fit a possible mismatch; a caution makes it "review";
- life stage, against the adequacy claim;
- large-breed growth;
- allergies and sensitivities ("Contains" versus "may include");
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
5. Possible (lot-specific) recall match
6. Life-stage mismatch
7. Large-breed growth
8. May match the allergy profile
9. Vet-directed diet
10. Unclear feeding statement
11. Documented caution (a flag; no points)
12. A supplement question for the vet (medicines, condition, pregnancy or nursing)
13. An ingredient the owner avoids

Positives:
- matches the known life stage;
- complete and balanced;
- no listed allergy match;
- calories listed (treats);
- made for the pet's species.

"No documented ingredient concerns" is never a positive. Purrbi's reviewed list is short, so finding nothing on it is not a strength.

While the product is unresolved, only recall and documented-concern cautions are shown, and no positives.

**Verdict.** 25–45 words written by a model (`OPENAI_VERDICT_MODEL`).

- **Input.** Only the computed assessment, highlights (their full statements) and pet-fit findings, as JSON.
- **Privacy.** The pet's name is replaced by "your cat" or "your dog" before the call and put back only in the app's copy.
- **Checks.** The sentence is rejected, and a rule-based sentence from the same findings is used instead, if it:
  - is under 25 or over 45 words, or ends with "…";
  - makes a claim Purrbi does not make: safety, praise such as "great", "high-quality", "premium", "nutritious" or "best", "recommended", "no concerns", or health and treatment claims;
  - gives a score ("N/100", "N out of 100") other than the assessment's score;
  - uses any other number that is not stated in the score, its basis, the highlights or the unresolved items;
  - calls a full assessment partial, or the reverse;
  - gives a partial assessment's score as if it were final: a partial assessment is described by how much of the label could be assessed (coverage) or by the range the complete label could give, never by its score alone;
  - omits the most serious caution.
- **Fallback.** The rule-based sentence is built from whole sentences, 25–45 words, with the most serious caution first. It passes the same checks.
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

## 9. Evidence labels and label photos

Each fact shows where it came from:

- the database record;
- a database label image read by AI (two readings must agree);
- a manufacturer or retailer page, where each fact was found on the page;
- a label photo matched to this barcode (shared);
- the owner's own label photo (private).

Nothing is marked as reviewed by a person unless it was.

**How a label is read** (label photos and database label images; reader `label-extract-2.2.0`, `ai/labelExtract.ts`):
- The model only transcribes each visible panel, word for word, marking anything it cannot read with certainty. Two independent readings are made (two different models where configured); only what both say is kept.
- Purrbi takes the values from the transcription with its own fixed rules:
  - the ingredient list only after a printed "Ingredients"/"Composition" heading;
  - analysis rows each with their own name, whether printed one per line or inline as on EU packs ("Protéine : 37,0 %, Matières grasses : 13,0 %, …"), and only from the analysis section, so an ingredient's percentage is never an analysis row;
  - a row is dropped when anything in it is unreadable, when a value has no name of its own ("1.0% / 1.5%"), when values are printed inline without units, or when a space may be a thousands separator ("36 900 UI/kg").
- Readings made by `label-extract-2.1.0` stay in use (2.2.0 only reads rows that 2.1.0 left out); label-image panels that 2.1.0 could not read are read again once.

An owner's label photo goes through these stages, recorded on the photo (`stage`, `stageNote`) by the backend only (`pipeline/corroborate.ts`):

| Stage | Meaning | Used for |
|---|---|---|
| submitted | Uploaded by the owner | — |
| extracted | Two independent AI readings agreed on the label text; its note says whether there was anything public to compare it with, or whether what it shows could not be matched yet | The owner's own result |
| corroborated | An independent public source agrees: this barcode's record has the same recipe in order, the same analysis (±0.5 points), or the same name | The owner's own result |
| verified | Also tied to this barcode: the barcode is on the photo, or the photo shows this barcode's recipe (at least 80% of the first 10 ingredients, in order) | The owner's result, **and** gaps in Purrbi's shared record for this barcode |
| disputed | Conflicts with this barcode's record (another recipe, under 60% match, or another analysis) | Not used; the owner is asked to check the package |

Promotion rules for verified readings:
- They fill only fields the shared record lacks, and never overwrite.
- They are shown to others as "A label photo matched to this barcode (read by AI, not reviewed)".
- Each promotion is audited in `products/{gtin}/contributions` with a one-way hash, not the account id. The image itself is never shared.
- The switch is `PROMOTE_LABEL_PHOTOS`.

A result that uses the owner's photo before it is tied to the barcode says "Label-based assessment with product identity not yet independently verified".
