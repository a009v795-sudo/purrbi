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
| `users/{uid}/scans/{scanId}/photos/{photoId}` | owner creates; backend updates | owner | |
| `users/{uid}/labelFacts/{gtin14}` | backend | owner | private label text read from the owner's photos; never copied to `products` |
| `products/{gtin14}` | backend | any signed-in user | public-source facts only (database / verified web), `factsVersion`, `factsHash`, `recall`, `recallCheckedAt` |
| `products/{gtin14}/evidence/{sourceId}` | backend | signed-in | `sourceType`, `sourceName`, `url`, `retrievedAt`, `matchConfidence`, `license`, `fieldsSupported[]`, `traceId` |
| `usage/{uid}_{yyyymmdd}`, `system/aiUsage_{yyyymmdd}` | backend | nobody | quotas and the global AI budget |

Barcode keys: `gtin14` = digits left-padded to 14 (UPC-A `036000291452` and EAN-13 `0036000291452` are the same product). `barcode` keeps the digits exactly as scanned.

## 3. Scan result fields (what the app binds to)

Scalars: `productName`, `brand`, `imageUrl`, `productSpecies` (`cat|dog|cat_and_dog|unknown`), `productSpeciesLabel`, `productCategory` (`complete_food|treat|complementary|supplement|unknown`), `productCategoryLabel`, `scope` (`supported|out_of_scope|unknown`), `scopeReason`, `outOfScopeKind`, `identitySource` (`opff|off|obf|opf|web|label`), `productFound` (bool), `resultState` (`strong|good|review|low|alert|incomplete|out_of_scope|not_scored`), `resultLabel`, `scoreAvailable` (bool), `score` (int, 0 when unavailable), `scoreBand`, `scoreLabel`, `scoreProvisional` (bool), `scoreWithheldReason`, `scoreVersion`, `kbVersion`, `ingredientsText`, `ingredientsSource`, `nutritionSource`, `caloriesText`, `adequacyText`, `adequacySummary`, `adequacySource`, `recallStatus` (`exact_active|possible_active|brand_history|none_found|unavailable|not_checked`), `recallSummary`, `recallCheckedAt` (timestamp), `petId`, `petName`, `profileVersion`, `personalState` (`fits|review|mismatch|not_for_species|alert|incomplete|no_pet|not_applicable`), `personalHeadline`, `labelEvidenceUsed`, `evidenceRevision` (= product `factsVersion`), `assessedAt`, `completedAt`, `gtin`, `barcodeKind`.

Lists (each item a map with fixed keys; mirrored as FlutterFlow data types):
| Field | Item keys |
|---|---|
| `scoreComponents` | `key, label, points (int), maxPoints (int), status (met\|partly_met\|not_met\|unverified\|not_applicable), explanation` |
| `generalFindings`, `personalFindings` | `kind (positive\|review\|alert\|missing\|info), text, evidence, rule` |
| `ingredientNotes` | `name, position (int, label order), status (positive\|caution\|concern\|unknown\|info), note, sourceUrl` |
| `nutrition` | `label, qualifier (min\|max\|typical\|not_stated), value (double), unit, display, dryMatter` |
| `recallRecords` | `recallNumber, status, classification, reason, reportDate, productDescription, recallingFirm, match` |
| `sources` | `name, type, url, retrievedAt, license, match, label` |
| `personalTrace` | `input, value, rule, effect` |
| `photoRequests` | `purpose, title, reason` |
| `summary`, `missingInfo`, `personalUnresolved` | String |

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

### Open Pet Food Facts — product identity & composition (pending live)
`GET https://world.openpetfoodfacts.org/api/v2/product/{code}?fields=code,product_name,product_name_en,generic_name,generic_name_en,brands,categories_tags,labels_tags,countries_tags,ingredients_text,ingredients_text_en,lang,nutriments,image_front_url,quantity,last_modified_t`
Header `User-Agent: Purrbi/0.1 (…)` — **owner to supply a contact address before production** (Open Food Facts asks for app name, version and contact).
Found: HTTP 200 with `status: 1` and `product`. Not found: HTTP 404 or `status: 0`. Codes tried: as scanned, then UPC-A↔EAN-13 zero-padded variant (both exact GTIN matches).
| Field | → Purrbi | Verification |
|---|---|---|
| `product_name_en` / `product_name` | productName | pending live |
| `brands` (first) | brand | pending live |
| `categories_tags`, `labels_tags`, `generic_name` | scope/category signals (`en:cat-food`, `en:dog-treats`, …) | pending live — tag names assumed from the Product Opener taxonomy |
| `ingredients_text_en` / `ingredients_text` | ingredientsText (label order kept) | pending live |
| `nutriments.{proteins,fat,fiber,moisture/water,ash,calcium,phosphorus,…}_100g` (+ `_unit`, `_modifier`) | guaranteed analysis, % (g/100 g) | **pending live — biggest unknown**: pet-food nutrient ids and min/max modifiers |
| `nutriments.energy-kcal_100g` | calories (×10 → per kg) | pending live |
| `image_front_url` | imageUrl (CC BY-SA, attribution shown) | pending live |
| (none known) | nutritional adequacy statement | not provided by Product Opener as far as known → comes from label photo or verified manufacturer page |
License: ODbL 1.0 (data), CC BY-SA 3.0 (images); attribution "Open Pet Food Facts" shown on sources.

### Open Food Facts / Open Beauty Facts / Open Products Facts — scope only (pending live)
Same API on `world.openfoodfacts.org`, `world.openbeautyfacts.org`, `world.openproductsfacts.org`; queried only when the pet database has no record, to classify human foods, human supplements, cosmetics and other products as out of scope.

### openFDA food enforcement — recalls (pending live)
`GET https://api.fda.gov/food/enforcement.json?search=(recalling_firm:"{brand}"+product_description:"{brand}")&limit=100&sort=report_date:desc` (optional `api_key`).
HTTP 404 = no matches. Records kept only if the description/reason mentions dogs, cats or pet food. Match: barcode digits in `product_description`/`code_info` → `exact_barcode`; ≥60 % product-name token overlap → `brand_and_product`; else `brand_only`. Active = status `Ongoing`/`Pending`.
**Open question for the live test:** whether animal-food recalls appear in this endpoint at all. If they do not, `none_found` would be misleading and the adapter must report coverage as unavailable. Coverage note always shown: updated weekly; not every FDA animal-product notice.

### OpenAI — label photos (pending live) and research (disabled)
- Label photos: `POST https://api.openai.com/v1/chat/completions`, model `OPENAI_VISION_MODEL` (default `gpt-4o-mini`), `response_format: json_schema` (strict, schema `pet_label_extraction` in `src/ai/labelExtract.ts`), image as base64 data URL. Output validated: barcode in photo must match the scan, guarantees range-checked, statements re-parsed deterministically. Key: Secret Manager `OPENAI_API_KEY`.
- Research: `POST https://api.openai.com/v1/responses` with `tools: [{type: "web_search"}]` and strict JSON schema; every kept field is re-found on the cited page fetched by Purrbi. **Off** (`RESEARCH_ENABLED=false`) until verified live.

## 6. Configuration

| Name | Kind | Default |
|---|---|---|
| `OPENAI_API_KEY` | Secret Manager secret | — (required to deploy) |
| `AI_ENABLED` | param | `true` |
| `RESEARCH_ENABLED` | param | `false` |
| `OPENAI_VISION_MODEL` / `OPENAI_RESEARCH_MODEL` | param | `gpt-4o-mini` / `gpt-4.1-mini` |
| `SOURCE_USER_AGENT` | param | `Purrbi/0.1 (development build)` |
| Limits | code (`DEFAULT_LIMITS`) | 40 scans, 20 photos, 10 research calls per user per day; 500 AI calls per day globally; 10 MB per photo; 6 photos per scan |
| Caching | code | product facts 30 days; recall check 12 hours |
