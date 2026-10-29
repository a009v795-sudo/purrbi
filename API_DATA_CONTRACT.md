# Purrbi API & data contract

Version: 2026-10-28 · backend `purrbi-functions` (Firebase codebase `purrbi`, Node 22, region `us-central1`).
Status column: **verified** = exercised by tests in this repo · **emulator** = verified on the Firebase emulator only · **pending live** = written against published docs, not yet checked against the live service (this session's network policy blocks those hosts; the CI job `live-contract` checks them).

## 1. Client ↔ backend protocol

There are **no HTTP or callable endpoints**. The app talks to the backend only through Firestore documents; Firestore rules restrict every path to its owner. Triggers run server-side with the Admin SDK.

| Step | Client writes | Backend trigger | Backend writes | Status |
|---|---|---|---|---|
| Start scan | `users/{uid}/scans/{scanId}` = `{barcode: String (digits, leading zeros kept), petId?: String, source?: "camera"\|"manual", status: "queued", createdAt: serverTimestamp, clientVersion?: String}` | `processScanJob` (onDocumentCreated) | status/progress updates, then result fields (§3) | emulator |
| Add label photo | upload image to Storage `users/{uid}/uploads/...` (FlutterFlow Upload), then `users/{uid}/scans/{scanId}/photos/{photoId}` = `{purpose: "front"\|"ingredients"\|"nutrition"\|"label", imageUrl: String (that file's download URL), status: "uploaded", createdAt: serverTimestamp}` | `processScanPhoto` | photo `{status: processing→processed\|unreadable\|different_product\|failed\|rejected, statusMessage, panels[], fieldsFound[], uncertainFields[], processedAt}`; scan re-assessed | emulator |
| Retry after failure | scan `{retryRequested: true}` (only when `status == "failed"` and `errorRetryable == true`) | `onScanRequestUpdated` | re-runs the job | emulator |
| Continue without photos | scan `{skipPhotos: true}` (only when `status == "needs_photos"`) | `onScanRequestUpdated` | `status: "complete"` with partial assessment | emulator |
| Personal fit for another pet / after profile edit | scan `{refreshPersonalRequested: true, petId}` (status `complete` or `needs_photos`) | `onScanRequestUpdated` | personal fields recomputed; general score unchanged unless evidence changed | emulator |
| Save / unsave | scan `{favorite: Boolean}` | — | — | emulator |
| Delete a result | delete scan document | `onScanDeleted` | deletes its photos, their files and the label text read from them | code reviewed |
| Delete account | Firebase Auth delete | `cleanupDeletedUser` (v1 auth onDelete) | recursive delete of `users/{uid}`, Storage `users/{uid}/`, usage counters | code reviewed |

Authentication: Firebase Auth ID token on every Firestore request (SDK-managed). Unauthenticated clients can read nothing.

### Scan status values
`queued` → `identifying` (10) → [`researching` (35)] → [`checking_alerts` (60)] → `assessing` (85) → `complete` | `needs_photos` | `out_of_scope`; `processing_photo` (70) while a photo is read; `failed` with an error code.

### Error codes (`errorCode`, `errorRetryable`, `errorMessage`)
| Code | Meaning | Retryable |
|---|---|---|
| `invalid_barcode` | not 8/12/13/14 digits or wrong GS1 check digit | no |
| `quota_exceeded` | per-user daily scan limit (40) reached | no (resets 00:00 UTC) |
| `source_unavailable` | product database timed out / unreachable and nothing cached | yes |
| `analysis_failed` | unexpected error during assessment | yes |
| `save_failed` | result could not be written | yes |
"Product not found" is **not** an error: it is `status: needs_photos`, `productFound: false`, `missingInfo` includes `front`.

Every scan has a `traceId` (12 hex chars) used in all backend logs and evidence records for that run.

## 2. Firestore collections

| Path | Written by | Read by | Notes |
|---|---|---|---|
| `users/{uid}` | owner (FlutterFlow auth fields + `activePetId`, `onboardingComplete`, `consentVersion`, `consentAcceptedAt`, `unitsPreference`) | owner | |
| `users/{uid}/pets/{petId}` | owner (validated) | owner, backend | §4 |
| `users/{uid}/scans/{scanId}` | owner: request + flags only; backend: everything else | owner | §3 |
| `users/{uid}/photos/{photoId}` | owner creates (`scanId`, `purpose`, `imageUrl`, `status: uploaded`, `createdAt`) for a scan that is waiting for photos or complete; backend updates | owner | one level below `users` because FlutterFlow does not support collections nested under subcollections |
| `users/{uid}/labelFacts/{gtin14}` | backend | owner | private label text read from the owner's photos; never copied to `products` |
| `products/{gtin14}` | backend | any signed-in user | public-source facts only (database / verified web), `factsVersion`, `factsHash`, `recall`, `recallCheckedAt` |
| `products/{gtin14}/evidence/{sourceId}` | backend | signed-in | `sourceType`, `sourceName`, `url`, `retrievedAt`, `matchConfidence`, `license`, `fieldsSupported[]`, `traceId` |
| `usage/{uid}_{yyyymmdd}`, `system/aiUsage_{yyyymmdd}` | backend | nobody | quotas and the global AI budget |
| `productMeta/{gtin14}` | backend | nobody | label-image links from the database and when optional enrichment (database label images, web research) was last attempted, so paid steps run at most once per product per 30 days |
| `knowledge/{species}_{kind}_{term}` | backend | nobody (copied into scans) | cited explanations of ingredients/supplement actives: `status (verified\|unverified\|not_found)`, `summary`, `role`, `sourceTitle`, `sourceUrl`, `quote`, `checkedAt`, `model`, `version`; verified kept 180 days, others 30 days |

Barcode keys: `gtin14` = digits left-padded to 14 (UPC-A `036000291452` and EAN-13 `0036000291452` are the same product). `barcode` keeps the digits exactly as scanned.

## 3. Scan result fields (what the app binds to)

Scalars: `productName`, `brand`, `imageUrl`, `productSpecies` (`cat|dog|cat_and_dog|unknown`), `productSpeciesLabel`, `productCategory` (`complete_food|treat|complementary|supplement|unknown`), `productCategoryLabel`, `scope` (`supported|out_of_scope|unknown`), `scopeReason`, `outOfScopeKind`, `identitySource` (`opff|off|obf|opf|web|label`), `productFound` (bool), `resultState` (`strong|good|review|low|alert|incomplete|out_of_scope|not_scored`), `resultLabel`, `scoreAvailable` (bool), `score` (int, 0 when unavailable), `scoreBand`, `scoreLabel`, `scoreProvisional` (bool), `scoreWithheldReason`, `scoreVersion`, `kbVersion`, `ingredientsText`, `ingredientsSource`, `nutritionSource`, `caloriesText`, `adequacyText`, `adequacySummary`, `adequacySource`, `recallStatus` (`exact_active|possible_active|brand_history|none_found|unavailable|not_checked`), `recallSummary`, `recallCheckedAt` (timestamp), `petId`, `petName`, `profileVersion`, `personalState` (`fits|review|mismatch|not_for_species|alert|incomplete|no_pet|not_applicable`), `personalHeadline`, `labelEvidenceUsed`, `evidenceRevision` (= product `factsVersion`), `assessedAt`, `completedAt`, `gtin`, `barcodeKind`.

Lists (each item a map with fixed keys; mirrored as FlutterFlow data types):
| Field | Item keys |
|---|---|
| `scoreComponents` | `key, label, points (int), maxPoints (int), status (met\|partly_met\|not_met\|unverified\|not_applicable), explanation` |
| `generalFindings`, `personalFindings` | `kind (positive\|review\|alert\|missing\|info), text, evidence, rule` |
| `ingredientNotes` | `name, position (int, label order), status (positive\|caution\|concern\|unknown\|info — curated list only, used by the score), note, sourceTitle, sourceUrl, explanationKind (curated\|cited_ai\|none), explanation, explanationSourceTitle, explanationSourceUrl, explanationQuote` |
| `nutrition` | `label, qualifier (min\|max\|typical\|not_stated), value (double), unit, display, dryMatter, meaning, context, contextSource` |
| `supplementPurposes` | `key, label, evidence` |
| `supplementActives` | `name, amountText, evidence (cited\|not_reviewed), note, sourceTitle, sourceUrl, quote` |
| `supplementWarnings` | `kind, text, evidence, rule` |
| `sourceChecks` | `source, host, path (no query), httpStatus (0 = no response), outcome (ok\|not_found\|http_error\|rate_limited\|timeout\|network\|parse), ms, attempt` |
| `lastJob` (map) | `kind (scan\|retry\|photo\|refresh), traceId, startedAt, finishedAt, productCache (hit\|miss\|stale_used\|none), recallCache (hit\|miss\|skipped), explanationsCached, explanationsNew, externalCalls, aiCalls, failedCalls` |
| `recallRecords` | `recallNumber, status, classification, reason, reportDate, productDescription, recallingFirm, match` |
| `sources` | `name, type, url, retrievedAt, license, match, label` |
| `personalTrace` | `input, value, rule, effect` |
| `photoRequests` | `purpose, title, reason` |
| `summary`, `missingInfo`, `personalUnresolved`, `nutritionContext`, `evidenceNotes`, `diagnosticNotes`, `supplementLimitations`, `supplementQualitySignals` | String |

`diagnosticNotes` says why AI-found information was or was not used (research pages that could not be verified, explanations whose quote was not on the cited page), sanitized, for tracing; the app does not need to show it.

More scalars: `explanationsStatus` (`ready|partial|pending|unavailable|not_needed`), `supplementSummary`, `supplementActivesSource`, `activeIngredientsSource`, `claimCount` (int: times the job was claimed; 1 per run, +1 per owner retry), `duplicateDeliveries` (int: repeated trigger deliveries that were ignored), `traceId`.

## 4. Pet profile (`users/{uid}/pets/{petId}`)

| Field | Type | Rules / meaning |
|---|---|---|
| `name` | String 1–40 | required |
| `species` | `cat`\|`dog` | required |
| `breed`, `breedType` | String ≤60, `known\|mixed\|unknown` | optional; **not used** in assessments |
| `birthDate` | timestamp | optional; or `approxAgeMonths` (int 0–360) + `ageCapturedAt` (timestamp) so age advances |
| `weightKg` | double 0.1–120 | normalised; `weightValue` + `weightUnit` (`kg\|lb`) keep what was entered |
| `sex` | `female\|male\|unknown` | optional |
| `neutered` | `yes\|no\|unknown` | optional |
| `reproductiveStatus` | `none\|pregnant\|lactating\|not_provided` | asked only for intact females |
| `expectedAdultSize` | `small` (<10 kg) \| `medium` (10–24) \| `large` (25–31) \| `xlarge` (≥32 kg / 70 lb) \| `unknown` | asked only for dogs under 24 months (AAFCO large-size growth) |
| `allergiesStatus`, `sensitivitiesStatus`, `vetDietStatus`, `conditionsStatus`, `medicationsStatus` | `none_reported\|not_sure\|not_provided\|reported` | the three "no" answers stay distinct |
| `allergies`, `sensitivities`, `avoidIngredients` | List<String> keys: `chicken, turkey, duck, beef, pork, lamb, fish, egg, dairy, wheat, corn, soy, rice, lentils_peas` or free text | |
| `vetDietNotes` | String ≤500 | |
| `conditions` | List<String> ≤20 | optional; only produces "ask your vet" notes |
| `goals` | List: `understand_ingredients, weight, digestion, skin_coat` | informational only |
| `preferences` | List: e.g. `wet, dry` | preferences, never health claims |
| `profileVersion` | int | client increments on every save; stored on each scan's personal fit |
| `onboardingStep`, `onboardingComplete` | int, bool | save/resume |

## 5. External sources

### Open Pet Food Facts — product identity & composition (live-verified 2026-10-28 from GitHub Actions)
`GET https://world.openpetfoodfacts.org/api/v2/product/{code}?fields=code,product_name,product_name_en,generic_name,generic_name_en,brands,categories_tags,labels_tags,countries_tags,ingredients_text,ingredients_text_en,lang,nutriments,image_front_url,image_ingredients_url,image_nutrition_url,quantity,last_modified_t`
Header `User-Agent: Purrbi/0.1 (development build; contact@valenciainnovations.com)`.
Found: HTTP 200 with `status: 1` and `product`. Not found: HTTP 404 (verified: unknown barcodes return 404). Codes tried: as scanned, then the UPC-A↔EAN-13 variant.
| Field | → Purrbi | Live finding |
|---|---|---|
| `product_name_en` / `product_name` | productName | ✅ present on sampled records (often in French/Dutch/German) |
| `brands` (first) | brand | ✅ |
| `categories_tags` | scope/category signals | ✅ `en:cat-food`, `en:dog-food`, `en:cat-treats`, `en:dog-treats`, `en:dry-cat-food`… **Every pet food also carries the generic `en:dog-and-cat-food`**, which is ignored for species (fixed after the first live run reported cat-only products as "cats and dogs") |
| `ingredients_text_en` / `ingredients_text` | ingredientsText (label order kept) | ✅ present on about half of sampled records |
| `nutriments.crude-protein/crude-fat/crude-fibre/crude-ash/moisture_100g` (pet keys, preferred), else `proteins/fat/fiber/ash/water_100g` | guaranteed analysis, % | ✅ pet records use the `crude-*` keys (fixed after the live run); values carry no min/max modifier (EU "analytical constituents" are typical values) |
| `nutriments.energy-kcal_100g` | calories (×10 → per kg) | ✅; values under 30 kcal/100 g are rejected (one sampled record had 5) |
| `image_ingredients_url`, `image_nutrition_url` | label images read by AI when the record lacks those panels (`productMeta`) | images host reachable from GitHub; full-resolution variant (`.full.jpg`) used |
| (none) | nutritional adequacy statement | ✅ confirmed absent on every sampled record → comes from a label image, a verified manufacturer page or the owner's photo |
License: ODbL 1.0 (data), CC BY-SA 3.0 (images); attribution shown on sources.

### Open Food Facts / Open Beauty Facts / Open Products Facts — scope only (live-verified)
Same API; queried only when the pet database has no record. Verified: UPC `036000291452` → Open Pet Food Facts 404 → Open Food Facts 200 "Alaska Peanut Butter - Creamy" → out of scope (human food). The Open Food Facts *search* endpoint sometimes returns HTTP 503; product lookups were unaffected.

### openFDA food enforcement — recalls (live-verified)
`GET https://api.fda.gov/food/enforcement.json?search=(recalling_firm:"{brand}"+product_description:"{brand}")&limit=100&sort=report_date:desc`
HTTP 200; the pet-food query (`"dog food" "cat food" "pet food"`) returns only a handful of records (3 on 2026-10-28), so coverage of animal-food recalls in this endpoint is thin. The result text always says so: "updated weekly and doesn't include every FDA animal-product notice". Match rules: barcode digits in `product_description`/`code_info` → `exact_barcode`; ≥60 % name overlap → `brand_and_product`; else `brand_only`; active = `Ongoing`/`Pending`.

### OpenAI — label reading, research and explanations (pending deploy)
- **Label reading** (owner photos and database label images): `POST /v1/chat/completions`, model `OPENAI_VISION_MODEL` (`gpt-4o-mini`), strict schema `pet_label_extraction` (now including `active_ingredients` with amount/unit/serving). Validated: the barcode in the image must match the scan, guarantees range-checked, statements re-parsed deterministically.
- **Manufacturer/web research**: `POST /v1/responses` with `web_search`, strict schema `pet_product_research`; a field is kept only if Purrbi finds it again on the cited page it fetches itself (barcode, or brand + name, on the page). On by default; attempted at most once per product per 30 days.
- **Cited explanations**: `POST /v1/responses` with `web_search` limited to 18 authoritative sites (FDA, eCFR, AAFCO, FEDIAF, EFSA, Merck/MSD Veterinary Manual, VCA, VIN Veterinary Partner, ASPCA, Pet Poison Helpline, WSAVA, AVMA, Cornell, Tufts Petfoodology, NCBI, NIH ODS, Today's Veterinary Practice); one call per scan for up to 8 new terms; kept only if the verbatim quote is on the cited page. Never changes a score.
- Key: Secret Manager `OPENAI_API_KEY`, readable only by `purrbi-functions@purrbi-49c21.iam.gserviceaccount.com`.

## 6. Configuration

| Name | Kind | Default |
|---|---|---|
| `OPENAI_API_KEY` | Secret Manager secret | — (required to deploy) |
| `AI_ENABLED` | param | `true` (master switch for every AI call) |
| `RESEARCH_ENABLED` / `DATABASE_IMAGES_ENABLED` / `EXPLANATIONS_ENABLED` | param | `true` / `true` / `true` |
| `OPENAI_VISION_MODEL` / `OPENAI_RESEARCH_MODEL` / `OPENAI_EXPLAIN_MODEL` | param | `gpt-4o-mini` / `gpt-4.1-mini` / `gpt-4.1-mini` (the explain model may be a comma-separated list, tried in order; dev uses `gpt-5-mini,gpt-4.1-mini`). The vision model may name two models: each label photo is read by both, and only what both readings agree on is kept (dev: `gpt-4.1-mini,gpt-5-mini`; one model reads twice) |
| `SOURCE_USER_AGENT` | param | `Purrbi/0.1 (development build; contact@valenciainnovations.com)` |
| Runtime identity | code (`setGlobalOptions`) | `purrbi-functions@` (all functions, including the account-deletion trigger) |
| Region | code | functions `us-central1`; Firestore database `nam5` (US multi-region; triggers are placed in `nam5`) |
| Storage bucket | `deploy-config.json` → `STORAGE_BUCKET` | `purrbi-49c21.firebasestorage.app` (US-EAST1). App uploads go to `users/{uid}/uploads/…`; the backend reads only that bucket and the owner's folder |
| Limits | code (`DEFAULT_LIMITS`) | 40 scans, 20 photos, 10 research calls per user per day; 500 AI calls per day globally; 10 MB per photo; 6 photos per scan; 8 new explanations per scan |
| Caching | code | product facts 30 days; recall check 24 hours (openFDA updates weekly); enrichment attempts 30 days; explanations 180 days (unverified 30) |
