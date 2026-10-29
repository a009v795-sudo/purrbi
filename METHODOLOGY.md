# Purrbi assessment methodology

Version: `purrbi-score-1.1.0` (score), `scope-2.1.0` (classification), `verdict-1.0.0` (verdict),
`kb-2026-10-28-draft` (ingredient notes). Every saved result records the versions it was made with.

The Purrbi label score is Purrbi's own measure. It says how completely the product's documented label information supports its intended use, less any documented species-specific ingredient concerns. It is not an FDA, AAFCO, WSAVA or veterinary rating. It does not depend on the pet profile: two pets see the same general score for the same evidence. Personal fit is assessed separately.

Code: `backend/functions/src/domain/score.ts` (score), `scope.ts` (classification), `highlights.ts`,
`personalize.ts`, `../ai/verdict.ts`.

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

Essential inputs are required. Without them the score is withheld, never estimated. Optional inputs only change how complete the score is.

| Category | Essential (no score without) | Optional (provisional without) |
|---|---|---|
| Complete food | Ingredient list; guaranteed analysis (protein, fat, fiber) | Nutritional adequacy statement; calorie statement; moisture; further guarantees |
| Treat / complementary | Ingredient list **or** guaranteed analysis | Feeding statement; calorie statement; moisture; the other of ingredients / analysis |
| Supplement | Active ingredients or ingredient list | Amounts per serving; warnings; quality signals |
| Any | Confirmed identity, species and category (section 1) | — |

## 3. Components and weights (each category totals 100)

**Complete food**

| Component | Points | Rule |
|---|---|---|
| Nutritional adequacy statement | 40 | Feeding tests 40; formulation 34; complete but no life stage or a different species 24; unclear 16; missing 0 (unverified) |
| Required guarantees (protein, fat, fiber) | 20 | Listed 20 |
| Calorie content statement | 10 | Listed 10 |
| Moisture guarantee | 5 | Listed 5 |
| Further guarantees | 5 | 2 or more 5; one 3; none 0 (unverified if from a database record) |
| Documented ingredient concerns | 20 | −20 per documented concern, −5 per caution (floor 0) |

**Treat or complementary product**

| Component | Points | Rule |
|---|---|---|
| Feeding statement | 15 | Present and clear 15; unclear 8; missing 0 (unverified) |
| Required guarantees | 25 | Listed 25 |
| Calorie content statement | 20 | Listed 20 |
| Moisture guarantee | 5 | Listed 5 |
| Documented ingredient concerns | 35 | −35 per documented concern, −10 per caution (floor 0) |

**Supplements** get no number: their purpose, dose and evidence vary by ingredient. They get the label facts, their active ingredients and amounts, any documented concerns, and personal suitability checks instead.

## 4. Coverage is kept separate from quality

- Missing information earns 0 points and is marked **unverified**. It is never treated as poor quality and never filled in.
- A score with unverified components is **provisional**: a lower bound. The result carries:
  - `scoreCoverage`: how many of the 100 points rest on evidence;
  - `scoreMaxPossible`: the highest the score could reach once the gaps are filled;
  - `scoreBasis`: one line, e.g. "Based on 60 of 100 points' worth of label information; nutritional adequacy statement could add up to 40."
- With 20 or more points unverified, the label is **Partial assessment**, not a quality band.
- Bands, used only when fewer than 20 points are unverified: 85+ Strong label information; 70–84 Good label information; 50–69 Review the details; below 50 Significant gaps or concerns.
- The app shows `scoreText` and never the raw number on its own:
  - **Unscored** when essential evidence is missing;
  - **Not scored** for supplements and out-of-scope products.
  - An unscored result is never shown as 0/100.

## 5. Ingredients: roles and documented concerns, not counts

- Ingredients are listed in label order with their role (curated, or an AI summary of a cited page that Purrbi checked against the page).
- Only Purrbi's reviewed list of documented species-specific concerns and cautions changes the score:
  - **concern**: a regulatory or veterinary toxicology source documents harm for that species;
  - **caution**: harm depends on an amount the label does not state.
- Grains, by-products, unfamiliar names and synthetic nutrients are not penalised.
- "Good" and "bad" ingredients are never counted.
- Explanations never change a status or the score.
- "Unknown" means not yet reviewed, not harmful.

## 6. Personal fit (separate from the score)

Personal fit is checked against the selected pet's recorded information:

- species, from the product label (not from the pet);
- life stage, against the adequacy claim;
- large-breed growth;
- allergies and sensitivities ("Contains" versus "may include");
- owner preferences;
- vet-directed diets.

"Not sure" and "not provided" stay distinct, and Purrbi never claims "no interactions". Breed alone is not used.

## 7. The concise result

**Highlights.** At most 2 positives and 2 cautions, chosen in this fixed priority from computed findings. Each carries its evidence.

Cautions:
1. Recall notice matching the barcode
2. Made for another species
3. Contains an ingredient in the allergy or sensitivity profile
4. Documented ingredient concern
5. Possible (lot-specific) recall match
6. Life-stage mismatch
7. Large-breed growth
8. May match the allergy profile
9. Vet-directed diet
10. Unclear feeding statement
11. Documented caution
12. An ingredient the owner avoids

Positives:
- matches the known life stage;
- complete and balanced;
- no listed allergy match;
- no documented ingredient concerns, worded as "in Purrbi's reviewed list" (never "safe" or "no concerns");
- calories listed (treats);
- made for the pet's species.

While the product is unresolved, only recall and documented-concern cautions are shown, and no positives.

**Verdict.** 25–45 words written by a model (`OPENAI_VERDICT_MODEL`).

- Its input is only the computed assessment, highlights and pet-fit findings, as JSON.
- The pet's name is replaced by "your cat" or "your dog" before the call and put back only in the app's copy.
- The sentence is rejected, and a rule-based sentence from the same findings is used instead, if it:
  - is under 20 or over 50 words;
  - makes a claim Purrbi does not make ("safe", "ideal", "healthy", "best", "recommended", "no concerns", treatment claims);
  - contains a number not in its input;
  - omits the most serious caution.
- Out-of-scope and unresolved products get a fixed sentence.
- Verdicts are cached per account by the hash of their input and model (`users/{uid}/verdicts/{key}`, server-only), so the same evidence and pet never cost a second call.
- A rule-based fallback is reused for the product freshness window only. A failed call is not cached.

## 8. Recalls

Purrbi checks the official FDA enforcement reports (openFDA, updated weekly). The result is cached for 12 hours.

| Status | Shown as |
|---|---|
| `exact_active` | "Recall notice matches this barcode" (alert; overrides the verdict) |
| `possible_active` | "Possible match: compare the lot code" (lot- or brand-and-name match) |
| `brand_history` | "No current matching notice (older notices exist for this brand)" |
| `none_found` | "No matching notice found in the sources checked" (never "no recalls") |
| `unavailable` | "The recall check failed; try again later" |

## 9. Evidence labels

Each fact shows where it came from:

- the database record;
- a database label image read by AI (two readings must agree);
- a manufacturer or retailer page, where each fact was found on the page;
- the owner's label photo, read by AI.

A result based on the owner's photo says "Label-based assessment with product identity not yet independently verified". Nothing is marked as reviewed by a person unless it was.
