# Moxis → Purrbi implementation map

Status: verified 2026-10-28 from read-only copies. Moxis was not modified.

## What was inspected

| Source | Where | Access |
|---|---|---|
| Moxis FlutterFlow project `moxis-one-x51584` (text pull) | `/home/user/reference/moxis-readonly` (push launcher removed, credentials removed, files read-only) | Read |
| Moxis generated code export (incl. `firebase/`) | `/home/user/reference/moxis-export` | Read |
| Moxis Firebase project `moxis-one-dev` (deployed functions, rules, logs, secrets) | Google Cloud | **No access** (no credentials; `*.cloudfunctions.net` also blocked by this session's network policy). Not probed. |
| Local repo `C:\Users\alexa\OneDrive\Documents\GitHub\moxis-one-V2` | Owner's Windows PC (named in archived session "moxis-finish", Sept 2026) | **No access** (no GitHub repo or Remote Control folder available) |

The FlutterFlow project and the local repo are **not the same code**. The archived session edited hand-written files that do not exist in the FlutterFlow export (`scan_controller.dart`, `auth/session_guard.dart`, an `AppSession` owner+epoch primitive, isolation tests, "537 regression tests"), under Astra review item REL-03 (still open). Those repairs cannot be reused here; their lesson (bind every write to the verified Firebase uid) is built into Purrbi's server-side ownership checks.

## The working Moxis sequence (FlutterFlow project, `pages/scan.dart`)

1. `BarcodeScanner` → `barcode` (String) → `appState.scannedCode`.
2. `getProduct` — client **GET** `https://world.openfoodfacts.org/api/v2/product/{barcode}.json` (human-food database). Header `User-Agent: MoxisOne/1.0 (contact)`. JSON paths: `$.status`, `$.product.product_name`, `.brands`, `.ingredients_text`, `.allergens`, `.image_front_url`.
3. If `status == 1`:
   1. Client `FirestoreCreate products/{barcode}` (document id = barcode) with OFF fields; then client `scanCount += 1`.
   2. `generateVerdict` — **Firebase callable** (`https.onCall`, firebase-functions v1 API, `us-central1`, secret `OPENAI_KEY`) invoked from the app with `FirebaseFunctions.httpsCallable` (auth token attached by the SDK). Input `{productName, ingredients, goals}` → OpenAI Chat Completions `gpt-4o-mini`, fixed "product health advisor" prompt → returns a free-text string. Source: `firebase/custom_cloud_functions/generate_verdict.js`.
   3. On success: update `aiVerdict`, create `users/{uid}/scans/{auto}` (barcode, productName, brand, imageUrl, verdictShown, goalsUsed, scannedAt).
   4. `callEnrichAll` — **plain HTTP POST** to `https://us-central1-moxis-one-dev.cloudfunctions.net/enrichAll`, body text `{"data":{"barcode","brand","productName"}}`, header `Content-Type` only. The body uses the callable wire format but **no `Authorization` header is sent**, so the function sees no auth context. Response not used by the client.
   5. `callGenerateVerdictTwo` — plain HTTP POST to `.../generateVerdictV2`, body `{"data":{"barcode","goals"}}`; client reads `$.result.plainText` (callable response envelope).
4. Else: "We don't have this product in our database yet." Network failure: "Couldn't reach the product database."
5. "View Full Report" → `ProductIntelligence(barcode)`: reads `products` where `barcode ==`, `products/{id}/verdicts` where `goalsText ==` a rebuilt free-text goals string, and `products/{id}/evidence` (labels for `matchConfidence`: `exact_upc`, `brand_product_match`, `brand_only`; `sourceId` `fda_enforcement` → `recallCount`, `fda_warning_letters` → `letterCount`; `license`, `retrievedAt`).
6. History: `users/{uid}/scans` ordered by `scannedAt desc` → `ProductIntelligence(barcode)`.

`enrichAll` and `generateVerdictV2` source is **not in FlutterFlow** (only `generateVerdict` is a FlutterFlow custom cloud function; `firebase/functions/` holds only FlutterFlow's generated `onUserDeleted` and an empty private-API router). Their behaviour is inferred only from the client contract and the `evidence`/`verdicts` schemas (fields `fdcId`, `dsldId`, `recallCount`, `letterCount`, `offMarket`, `license` suggest USDA FoodData Central, NIH DSLD, openFDA enforcement and FDA warning letters). **Unverified: no source, deployment config, region settings beyond the URL, or logs were available.**

### Defects found in the Moxis chain (do not carry over)

- Any signed-in user can create/overwrite any `products/*` document (`allow write: if request.auth != null`), so one client can rewrite global product facts.
- `enrichAll`/`generateVerdictV2` are called without an ID token, so they cannot know who is calling (no ownership, quota or abuse control).
- `generateVerdict` does not check `context.auth`, validate input, handle OpenAI errors, or constrain output; any non-200 response throws on `result.choices[0]`.
- Verdicts are looked up by exact string equality on a free-text goals sentence (`goalsText`).
- In the FlutterFlow text the success condition reads `ActionOutput('apiResultvf0')` while the step's output is `verdictResult` (generated code checks `verdictResult`; works at runtime but is fragile).
- `disclaimerVersion` is a `String` in the schema but written/compared as the number `1.0`.
- `getVerdict` (unused) is a direct client call to `api.openai.com` — a client-side AI key would be exposed.
- Login page shows Google/Apple buttons with no actions; `FirebaseAuth(providers: [])`.

## Reconciling the "copied action chain"

Not present in Purrbi V2 development (`purrbi-v2development-38b75z`): the pulled project has no API calls, no cloud-function calls, no Firestore collections, no `unsupported(...)` steps, and the code export has no `backend/api_requests` or `firebase/` folder. The original `purrbi-mjd5zw` (this project was duplicated from it on 2026-10-28) has none either. FlutterFlow copy/paste of actions does not bring API definitions, cloud functions or collections, so nothing usable landed. **Decision: do not duplicate; rebuild a Purrbi-specific chain** using the patterns below.

## Mapping

| Moxis action/function | Input | Output | Purrbi equivalent | Changes required | Verification |
|---|---|---|---|---|---|
| `BarcodeScanner` on Scan page | camera | barcode string | Reuse `BarcodeScanner` on the template's scan entry | Keep as string; normalise digits without dropping leading zeros; handle cancel (`-1`/empty) | Unit tests on normaliser; device test pending |
| `getProduct` (client GET to Open **Food** Facts) | barcode | name, brand, ingredients, allergens, image | Server-side **Open Pet Food Facts** adapter inside the scan job | Pet database, exact barcode identity, species/category classification, per-field provenance, ODbL attribution | Live contract test (blocked here; runs in CI) |
| Client `FirestoreCreate products/{barcode}` + `scanCount` | OFF fields | product doc | `products/{gtin}` written **only by the backend** | Rules deny client writes; facts versioned (`factsVersion`) | Rules emulator tests |
| `generateVerdict` callable (free-text OpenAI) | name, ingredients, goals | string | Deterministic, versioned assessment (`assessment/score.ts`) + personal fit (`assessment/personalize.ts`) | No AI in the scoring path; AI used only for label-photo extraction and bounded research with JSON-schema outputs; key in Secret Manager `OPENAI_API_KEY` | Unit tests (repeatability), emulator job tests |
| `callEnrichAll` (raw HTTP, no auth) | barcode, brand, name | evidence docs | Enrichment adapters (openFDA enforcement, optional manufacturer research) run **inside** the scan job | No client-callable enrichment; job is authorised by Firestore rules on `users/{uid}/scans`; trace id on every evidence record | Emulator job tests; live CI contract tests |
| `callGenerateVerdictTwo` (raw HTTP, no auth) | barcode, free-text goals | `{result:{plainText…}}` + verdict doc | Personal fit computed from the selected **pet profile** and stored on the scan with `profileVersion` | Structured pet fields instead of free text; recomputable without changing the general score | Unit test: two pets, same evidence → different personal findings, same score |
| `ProductIntelligence(barcode)` | barcode | product + verdict + evidence queries | Template result page bound to one `users/{uid}/scans/{scanId}` document | No string-equality lookups; status-driven states (processing / needs photos / complete / failed) | Emulator test of job states; UI review |
| `users/{uid}/scans` (client-created, full result written by client) | scan fields | history | Same path, but the client creates only a job request (`barcode`, `petId`, `status: queued`); the backend writes results | Rules validate allowed keys and transitions | Rules emulator tests |
| `products/{id}/evidence` (server-written) | — | source records | Same pattern: `products/{gtin}/evidence/{sourceId}` | Adds `fieldsSupported`, `sourceType`, explicit `matchConfidence` (`exact_barcode`, `brand_and_product`, `brand_only`, `none`) | Emulator tests |
| `users` goals/filters/onboarding/disclaimer | quiz answers | user doc | `users/{uid}` (consent version, active pet) + `users/{uid}/pets/{petId}` | Cat/dog questions only; "none reported" vs "not sure" vs "not provided" | Rules tests; UI review |
| Login / SignUp (email+password) | email, password | Firebase user | Template SignIn/SignUp/Forgot/Reset pages on real Firebase Auth | Remove simulated `isLogin` check and hardcoded sample credentials | Live auth test after Firebase connection |
| `onUserDeleted` (deletes `users/{uid}`) | auth delete | — | Same trigger, also deletes `pets`, `scans`, photo subcollections and `users/{uid}/` Storage files | Recursive delete | Emulator test |
| `getVerdict` (client → OpenAI) | prompt | text | **Dropped** | Client-side AI calls would expose the key | — |

## Function protocols

| Function | Moxis protocol (verified from client code) | Purrbi protocol |
|---|---|---|
| `generateVerdict` | Firebase **callable**, called with the callable SDK (auth attached) | — (replaced) |
| `enrichAll` | Callable wire format sent as **plain HTTP** without auth | — (replaced) |
| `generateVerdictV2` | Callable wire format sent as **plain HTTP** without auth | — (replaced) |
| `processScan` | — | **Firestore-triggered job** (`onDocumentCreated users/{uid}/scans/{scanId}`): the app writes a request document, the backend updates `status` and results on the same document; no HTTP endpoint is exposed |
| `processScanPhoto` | — | Firestore-triggered (`users/{uid}/scans/{scanId}/photos/{photoId}`) |
| `onScanUpdated` | — | Firestore-triggered for client-requested retries and personal-fit refreshes |
| `cleanupDeletedUser` | v1 auth `onDelete` | v1 auth `onDelete` (no 2nd-gen equivalent) |

Rationale: FlutterFlow's typed Firestore actions and live document bindings work without custom code; the job survives the app closing (resumable); authentication and ownership are enforced by Firestore rules; no unauthenticated endpoint exists.
