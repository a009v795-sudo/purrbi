# Purrbi build plan

Editable project: FlutterFlow `purrbi-v2development-38b75z` ("Purrbi V2 development"), branch `main`.
Recoverable baseline: FlutterFlow branch `baseline-template-2026-10-28` (same commit as `main` before any change) + text snapshot `flutterflow/baseline-2026-10-28/`.
References (read-only): Moxis FlutterFlow `moxis-one-x51584` (pulled and export, locked); prototype JSX (design cues in `docs/prototype-design-cues.md`).

## Decisions (owner, 2026-10-28)
- Backend: Firebase project **purrbi-49c21** (development; separate from Moxis). Connected to the FlutterFlow project by the owner.
- Spending approved for development: Firebase **Blaze** (with budget alert) + **OpenAI** (Purrbi-only key, stored by the owner in Secret Manager as `OPENAI_API_KEY`).
- Code and records: GitHub `a009v795-sudo/purrbi` (pushed with full history; **the repository is currently public** — owner to decide on private).
- Deploys: manually started GitHub Actions run, signed in with **GitHub OIDC / Workload Identity Federation** — no service-account key.
- Android application ID for development: `com.mycompany.purrbiv2development` (production ID decided before release; it gets its own Firebase app).
- Contact for database User-Agent and in-app support: `contact@valenciainnovations.com`.

## Setup values the code expects
| Setting | Value |
|---|---|
| Firebase project ID | `purrbi-49c21` (`backend/.firebaserc`, `backend/deploy-config.json`) |
| Android package / iOS bundle ID | `com.mycompany.purrbiv2development` |
| Cloud Firestore | `(default)` database, Native mode, **`nam5`** (US multi-region; found by the setup script 2026-10-29 — it already existed). Firestore triggers are placed in the database's location (`nam5`) by the deploy tool and deliver to the functions in `us-central1` |
| Cloud Storage | default bucket **`purrbi-49c21.firebasestorage.app`**, **`US-EAST1`** (owner's choice; Blaze; no-cost tier location). Verified 2026-10-29: the bucket exists (unauthenticated request → 403), there is no `purrbi-49c21.appspot.com` (404), the app's web/Android/iOS config all name this bucket, and the functions are pinned to it (`STORAGE_BUCKET` from `deploy-config.json`; refuses images from any other bucket or folder). Functions in `us-central1` read label photos across regions: negligible at photo sizes |
| Cloud Functions | **`us-central1`**, Node 22, 2nd gen (+ one 1st-gen auth trigger), codebase `purrbi` |
| Runtime identity | `purrbi-functions@purrbi-49c21.iam.gserviceaccount.com` |
| Deploy identity | `purrbi-deployer@purrbi-49c21.iam.gserviceaccount.com` via WIF pool `github`, provider `purrbi-github` |
| Secret | `OPENAI_API_KEY` in Secret Manager |

## Architecture decisions
- **Firestore-job protocol** instead of HTTP/callable endpoints: the app creates `users/{uid}/scans/{scanId}`; triggers fill results on the same document (resumable, owner-isolated by rules, FlutterFlow-native bindings). See `API_DATA_CONTRACT.md`.
- **Evidence order** (each later step only when earlier ones left something important missing): Purrbi's saved product record (30 days) → Open Pet Food Facts → its published label images read by AI → manufacturer/web research verified against the page → the owner's label photos. Paid enrichment is attempted at most once per product per 30 days and carried over when the record is re-fetched.
- **Deterministic, versioned score** (`purrbi-score-2.0.0`), pet-independent; **personal fit** separate and traceable. AI never decides scores: it reads labels (owner photos, database images), does verified research and writes cited explanations, which never change a score.
- **Grounded label reading** (`label-extract-2.2.0`): the model only transcribes each visible panel verbatim with its legibility and [?] for anything uncertain; Purrbi parses the values itself (ingredient list only after a printed Ingredients/Composition heading; analysis rows each with their own name, one per line or inline as on EU packs, only from the analysis section; statements as printed) and keeps a value only when two independent readings agree (dev: gpt-4.1-mini and gpt-5-mini). A photo counts as another product only when both readings show the same other valid barcode. Readings by 2.1.0 stay in use without the analysis rows 2.1.0 may have misread; older readings are dropped and read again. The same analysis rules read the analysis printed on a manufacturer's page (research 1.7.0).
- **AI web steps are verified by Purrbi's own fetch**: research keeps a field only if it is found on the page Purrbi fetches (models attach no citations to JSON output, so citations are not required); explanations keep a summary only if its quote is on the fetched page of an allowed site (the page's own sentence is shown when the model's wording is close but not exact). The explain model may be a list, tried in order (dev: gpt-5-mini, which accepts the search domain filter, then gpt-4.1-mini). Why something was not used is recorded per scan (`diagnosticNotes`).
- **Supplements**: no number; purposes, actives and amounts, documented safety notes, cited evidence notes, limitations.
- **Reuse**: a rescan of a current product makes no database, research or AI call; recall checks are reused for 24 hours; explanations for 180 days. Each scan records what it reused (`lastJob`, `evidenceNotes`) and every outbound call (`sourceChecks`).
- **Separate deploy codebase** `purrbi`, so Firebase deploys never delete FlutterFlow-managed functions. **Rules are owned by this repo**: don't press FlutterFlow's "Deploy rules"; the deploy workflow verifies the deployed rules equal the repository files.
- Owner label photos stay private (`users/{uid}/labelFacts`); shared `products/*` hold only public-source facts.

## Functional coverage (owner's list, 2026-10-28)
| Requirement | Status |
|---|---|
| Pet-product lookup from appropriate sources | ✅ live: Open Pet Food Facts (+ sister databases for scope); database label images read by the grounded label reader; database analyses that cannot be per 100 g are rejected with the reason |
| Manufacturer/source research when the database lacks important information | ✅ live: purina.fr analysis filled with every value found on the fetched page; pages of another variant rejected |
| Evidence-backed ingredient and nutrition explanations | ✅ live: cited explanations verified against fetched pages (7 of 8 on a French label: aafco.org, vcahospitals.com, merckvetmanual.com); nutrition meaning, dry matter, AAFCO-minimum context |
| Clear general assessment | ✅ score components, findings, summary, evidence notes |
| Separate pet-specific verdict | ✅ personal fit with trace (unit/emulator-tested) |
| Photo recovery only when evidence is insufficient | ✅ live: asked only after database, database images and research; one photo completed a scan with values identical to the pack |
| Persistent results and reuse | ✅ live: reopen after restart; a rescan of a current product makes no database, research or AI call |
| Supplements: useful assessment without a score | ✅ live (probiotic for dogs: purpose, limitations, what is missing) |
| FlutterFlow app: real auth, onboarding, schemas, photo recovery, results, favorites, history | ✅ live in a release web build against the deployed backend; Android compile check passed; device test pending |

## Milestones
| # | Milestone | Status |
|---|---|---|
| 1 | Verify binding, baseline, records | ✅ done |
| 2 | Moxis map (`MOXIS_TO_PURRBI.md`) | ✅ done |
| 3 | Backend: adapters, scope, scoring, personal fit, scan job, rules, tests | ✅ done |
| 3b | Evidence layer: database label images, research on, cited explanations, supplements, nutrition context, diagnostics, reuse | ✅ code + tests (unit 56/56, emulator 29/29, e2e 2/2) |
| 4 | Template foundations in FlutterFlow | ✅ pushed and verified in a web build |
| 5 | Firebase config files; real auth; collections & data types; scan → result → history | ✅ live |
| 6 | Pet onboarding, pet switcher, edit | ✅ onboarding and switcher live; edit not exercised |
| 7 | Photo recovery UI | ✅ live |
| 8 | Deploy backend (OIDC); deployed-rules check; live E2E with client requests | ✅ live (two E2E runs) |
| 9 | Visual refinement; legal/privacy/methodology copy; spoken labels for icon-only buttons | pending |
| 10 | Android APK via GitHub Actions; checksum; test report | ✅ APK built (build 1: run 40920027599; current: build 4, see TEST_RESULTS.md); device test pending |
| 11 | Targeted repair (2026-10-29): classification by evidence (099482480882), research identity, no permanent negative caching, score 2.0.0 (coverage apart from quality, concern cap, roles), checked AI verdict, photo stages with backend-only promotion, compact result page, guarded scan chains, FlutterFlow issues | ✅ deployed, live-tested in the browser build; device test pending (`docs/SCAN_FLOW_AUDIT.md`, `METHODOLOGY.md`) |

## Owner actions, in order (one at a time)
1. ~~FlutterFlow → Generate Config Files~~ — **done** (export configured for `purrbi-49c21`).
2. ~~Blaze plan~~ — **done** (owner confirmed; set a budget alert if not yet).
3. ~~Email/Password sign-in; Storage; FlutterFlow Users Collection~~ — **done, verified 2026-10-29**: sign-up endpoint answers `WEAK_PASSWORD` to a 1-character password (not `OPERATION_NOT_ALLOWED`; no account created); Storage bucket exists in US-EAST1; FlutterFlow's auth user collection is `users` (the `currentUser` bindings validate against it).
4. ~~Google Cloud Shell: `backend/tools/gcp/setup-dev-access.sh`~~ — **done 2026-10-29** (re-run after IAM propagation retries; Cloud Billing API enabled; the default build identity's Editor role removed and replaced with the Cloud Build builder role).
5. ~~Deploy and live tests~~ — **done 2026-10-29**: `deploy-backend` runs (all verified), two `live-e2e` runs, live app demos (`TEST_RESULTS.md`).
6. ~~Repository secret `FIREBASE_GOOGLE_SERVICES_JSON`~~ — **done 2026-10-29**; `android-apk` run 40920027599 built the installable APK.
7. **Next — new OpenAI key (blocking AI features):** at ~22:35 UTC on 2026-10-29 OpenAI started answering the deployed backend with HTTP 401 "Your API key has been invalidated". Create a new key in the OpenAI dashboard (API keys → Create new secret key), then in Google Cloud console → Security → Secret Manager → `OPENAI_API_KEY` → **+ New version**, paste it there (never in chat), and say "secret saved"; Purrbi then redeploys so the functions pick up the new version.
8. **Then — device test:** on the Android phone, **uninstall the earlier Purrbi build first** (its signing key differs, so the new APK cannot install over it), then install `app-release.apk` from the latest `android-apk` run's artifact and try a camera scan (also cancel one), repeated taps on the camera button, a label photo, and 099482480882.

## FlutterFlow changes so far (main)
- Theme from the prototype (cream/teal/coral/sun/alert/slate, Nunito; 318 hard-coded Inter overrides reset to the theme font).
- App name Purrbi; app icon, adaptive icon, logo and error image rendered from the prototype's own mark (`brand/`), replacing assets from other projects.
- Permissions: camera + photo library with accurate text; notifications/microphone no longer requested.
- Sample persona and password removed from app-state defaults; test AdMob ids removed.
- Paywall routes removed (splash, sign-in, verification); premium, notifications, social sign-in, store links, support contact and template sample stats/lists hidden behind feature-flag constants (`feature* = false` in settings.dart). Note: a literal `visible: false` is ignored by FlutterFlow's code generator; use a constant.
- Centre nav button → Scan; scan screen reads real barcodes (`BarcodeScanner` + `isLikelyBarcode`), fake 9-second analysis and watch "tips" removed; honest message until the backend is connected.
- First run: Splash → Welcome (template intro slides with an empty list removed from the path).
- Legal pages rewritten as drafts that match actual behaviour, marked "not yet legally reviewed".
- **Template defect fixed:** two ad custom actions imported `google_mobile_ads` without declaring it, so the exported app did not compile (web or Android). Removed.
- Firebase milestone (pushed 2026-10-29): real email sign-up (Auth account + `users/{uid}` with consent version and time), log in, log out, password reset, account deletion; splash routes by `onboardingComplete`; 4-step pet onboarding saved per step with a resume banner; scan request from the camera or a typed barcode; result screen for every job state (processing, failed + retry, out of scope, needs photos with in-place upload, score, personal fit with a pet switch, supplement purposes, findings, ingredients, nutrition, recall, sources with trace id); history (All / Favorites) reopening saved results; Pets tab (active pet, add a pet).
- Document ids in actions: FlutterFlow can't read `.id` from a reference inside an action, so the id is taken from page state through a code expression (`(petRef).id.trim()`); query items use `item.reference.id`.
- FlutterFlow's export includes its own `firebase/` rules with **open reads**; they are never deployed (only `backend/` is) and `app/.gitignore` keeps them out of the repository.
- Firebase client config (`google-services.json`, `GoogleService-Info.plist`, `firebase_config.dart`) is not committed while the repository is public (secret scanning push protection would flag the Firebase API key); builds here use the local export.
- **Template defect fixed:** the template's connectivity check (`connected` custom action) polled four unrelated third-party hosts every 10 s (icanhazip.com, one.one.one.one, jsonplaceholder.typicode.com, pokeapi.co), and the sign-in/sign-up buttons refused to work when they were unreachable. It now checks only Firebase's own Auth/Firebase API hosts every 30 s with a keyless GET (refused before any project is involved, so no cost; GET because Google answers HEAD without CORS headers).
- Still template content: profile/edit-profile fields, Terms link on Welcome without action.
- 2026-10-29: Cat/Dog chips without icons (labels were cut off); result page: the "Check it for another pet" chip row now has a fixed height — without it, release builds pushed every later section (label findings, ingredients, nutrition, sources) out of view.
- 2026-10-29 (targeted repair):
  - **Scan page:** one scan at a time (taps while a request is created are ignored, spinner); offline check; a cancelled scan stops quietly; barcode scan mode; check-digit validation as the backend applies it (UPC-E included); temporary client trace (`traceScan` custom action, `[purrbi-trace]` in the device log).
  - **Compact result page:** score circle (band colour; `scoreText`, so never 0 for unscored; a partial assessment shows its range); label; basis; verdict for the pet; at most 2 cautions and 2 positives (`HighlightRow` component); photo requests; label photo stages; ingredient preview with roles and the full list on demand; recall row; expandable details (personal fit with pet chips, nutrition, score breakdown or "what is missing", label findings, sources); delete a result.
  - **Fixes:** a failed upload no longer disables the photo buttons; "Identifying the product" only while working; a stopped job can be retried; out-of-scope results offer a front photo; pet chips ignore taps during a refresh; history dates never null-assert.
  - **FlutterFlow issues:** `users.photo_url` is an Image Path (the validator error is gone); AppLogo uses its size parameters; a category list no longer shrink-wraps. The remaining review items are verified false positives or by-design warnings (`docs/SCAN_FLOW_AUDIT.md` §3).
  - **Note:** after a structural rewrite, FlutterFlow re-used the old lists' stored item types by position. The page was pushed in two steps (lists removed, then added) so each list got its own type.
- Accessibility gap: icon-only buttons (back, favorite) and the custom terms checkbox have no spoken label, and two onboarding fields are merged into their parent in the accessibility tree. FlutterFlow's Tooltip widget does not provide a label (it uses `aligned_tooltip`, which excludes itself from semantics), so a tooltip attempt was reverted; the fix needs a small custom widget with a `Semantics` label.

## Environment limits found in this session
- This Claude session's network policy blocks Open Pet Food Facts, Open Food Facts, openFDA, fda.gov, OpenAI and `dl.google.com`. Google APIs, npm, pub.dev, GitHub and FlutterFlow are reachable. The environment supports an allow-list (**environment settings → Network access → Allowed domains**, applies to new sessions); nothing was bypassed.
- Live data checks therefore run on GitHub Actions, where every provider was verified reachable (2026-10-28): Open Pet Food Facts 200, its image host reachable, Open Food Facts 200, Open Beauty Facts 200, Open Products Facts 200, openFDA 200, OpenAI reachable (401 without a key), Firebase APIs reachable.
- The deployed Cloud Functions (Google's network) are the environment that will serve the app; their reachability is reported per scan in `sourceChecks` once deployed.
- No browser automation for the owner's Google/FlutterFlow accounts in this session; no Android device or emulator (no KVM).
- GitHub artifact downloads are blocked here (blob storage host); workflow reports are therefore also published as annotations and job summaries.
- OpenAI's documentation hosts (`platform.openai.com`, `developers.openai.com`) are not reachable here; model support for the web-search domain filter was taken from the deployed function's own 400 response ("Parameter 'filters' not supported with model 'gpt-4.1-mini'").
