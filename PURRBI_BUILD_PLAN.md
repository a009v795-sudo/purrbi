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
| Cloud Firestore | `(default)` database, Native mode, **`us-central1`** (Firestore triggers run in the database's location; `nam5` maps onto `us-central1` but a regional database keeps database, triggers and functions together) |
| Cloud Storage | default bucket (`purrbi-49c21.firebasestorage.app`), **`US-CENTRAL1`** (Blaze required; no-cost tier location) |
| Cloud Functions | **`us-central1`**, Node 22, 2nd gen (+ one 1st-gen auth trigger), codebase `purrbi` |
| Runtime identity | `purrbi-functions@purrbi-49c21.iam.gserviceaccount.com` |
| Deploy identity | `purrbi-deployer@purrbi-49c21.iam.gserviceaccount.com` via WIF pool `github`, provider `purrbi-github` |
| Secret | `OPENAI_API_KEY` in Secret Manager |

## Architecture decisions
- **Firestore-job protocol** instead of HTTP/callable endpoints: the app creates `users/{uid}/scans/{scanId}`; triggers fill results on the same document (resumable, owner-isolated by rules, FlutterFlow-native bindings). See `API_DATA_CONTRACT.md`.
- **Evidence order** (each later step only when earlier ones left something important missing): Purrbi's saved product record (30 days) → Open Pet Food Facts → its published label images read by AI → manufacturer/web research verified against the page → the owner's label photos. Paid enrichment is attempted at most once per product per 30 days and carried over when the record is re-fetched.
- **Deterministic, versioned score** (`purrbi-score-1.0.0`), pet-independent; **personal fit** separate and traceable. AI never decides scores: it reads labels (owner photos, database images), does verified research and writes cited explanations, which never change a score.
- **Supplements**: no number; purposes, actives and amounts, documented safety notes, cited evidence notes, limitations.
- **Reuse**: a rescan of a current product makes no database, research or AI call; recall checks are reused for 24 hours; explanations for 180 days. Each scan records what it reused (`lastJob`, `evidenceNotes`) and every outbound call (`sourceChecks`).
- **Separate deploy codebase** `purrbi`, so Firebase deploys never delete FlutterFlow-managed functions. **Rules are owned by this repo**: don't press FlutterFlow's "Deploy rules"; the deploy workflow verifies the deployed rules equal the repository files.
- Owner label photos stay private (`users/{uid}/labelFacts`); shared `products/*` hold only public-source facts.

## Functional coverage (owner's list, 2026-10-28)
| Requirement | Status |
|---|---|
| Pet-product lookup from appropriate sources | ✅ Open Pet Food Facts (+ sister databases for scope) — live-verified from GitHub; label images in the database read by AI — implemented, emulator-tested, live pending deploy |
| Manufacturer/source research when the database lacks important information | ✅ implemented and on by default (verified-against-page rule), emulator-tested; live pending deploy |
| Evidence-backed ingredient and nutrition explanations | ✅ curated notes with citations (all 5 citation URLs 200 live); cited AI explanations verified against the page and cached; nutrition meaning, dry matter, AAFCO-minimum context, carbohydrate estimate — unit/emulator-tested; AI part live pending deploy |
| Clear general assessment | ✅ score components, findings, summary, evidence notes |
| Separate pet-specific verdict | ✅ personal fit with trace (unit/emulator-tested) |
| Photo recovery only when evidence is insufficient | ✅ photos requested only after database, database images and research; per-panel requests |
| Persistent results and reuse | ✅ saved scans, product cache, recall cache, explanation cache, private label facts; reuse proven on the emulator (no database or AI call on rescan) |
| Supplements: useful assessment without a score | ✅ implemented, emulator-tested |
| FlutterFlow app: real auth, onboarding, schemas, photo recovery, results, favorites, history | ⏳ blocked until Firebase config files are generated in FlutterFlow |

## Milestones
| # | Milestone | Status |
|---|---|---|
| 1 | Verify binding, baseline, records | ✅ done |
| 2 | Moxis map (`MOXIS_TO_PURRBI.md`) | ✅ done |
| 3 | Backend: adapters, scope, scoring, personal fit, scan job, rules, tests | ✅ done |
| 3b | Evidence layer: database label images, research on, cited explanations, supplements, nutrition context, diagnostics, reuse | ✅ code + tests (unit 56/56, emulator 29/29, e2e 2/2) |
| 4 | Template foundations in FlutterFlow | ✅ pushed and verified in a web build |
| 5 | Firebase config files; real auth; collections & data types; scan → result → history | **owner step 1** |
| 6 | Pet onboarding, pet switcher, edit | after 5 |
| 7 | Photo recovery UI | after 5 |
| 8 | Deploy backend (OIDC); deployed-rules check; live E2E with client requests | **owner steps 2–4** |
| 9 | Visual refinement; legal/privacy/methodology copy | after 5 |
| 10 | Android APK via GitHub Actions; checksum; test report | after 5 |

## Owner actions, in order (one at a time)
1. **FlutterFlow → Settings & Integrations → Project Setup → Firebase → Generate Config Files** (package `com.mycompany.purrbiv2development`).
2. **Firebase console (purrbi-49c21) → Usage and billing → Details & settings**: confirm the plan is Blaze (Modify plan if Spark) and set a budget alert.
3. **Firebase console → Authentication → Sign-in method → Email/Password → Enable**; **Storage → Get started → US-CENTRAL1, production mode**.
4. **Google Cloud Shell** (signed in as Owner): run `backend/tools/gcp/setup-dev-access.sh` once — APIs, Firestore `us-central1`, runtime and deploy identities, secret binding, OIDC sign-in, image cleanup policy. It prints the project number for `backend/deploy-config.json`.
5. Then Claude runs `deploy-backend` and `live-e2e` from GitHub (manual runs) and builds the APK.

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
- Still template content (to be replaced with the Firebase milestone): Explore tab, My scans tab lists, result cards (Card1–4), profile/edit-profile fields, sign-in/up/forgot pages (still simulated until Firebase Auth), Terms link on Welcome without action.

## Environment limits found in this session
- This Claude session's network policy blocks Open Pet Food Facts, Open Food Facts, openFDA, fda.gov, OpenAI and `dl.google.com`. Google APIs, npm, pub.dev, GitHub and FlutterFlow are reachable. The environment supports an allow-list (**environment settings → Network access → Allowed domains**, applies to new sessions); nothing was bypassed.
- Live data checks therefore run on GitHub Actions, where every provider was verified reachable (2026-10-28): Open Pet Food Facts 200, its image host reachable, Open Food Facts 200, Open Beauty Facts 200, Open Products Facts 200, openFDA 200, OpenAI reachable (401 without a key), Firebase APIs reachable.
- The deployed Cloud Functions (Google's network) are the environment that will serve the app; their reachability is reported per scan in `sourceChecks` once deployed.
- No browser automation for the owner's Google/FlutterFlow accounts in this session; no Android device or emulator (no KVM).
- GitHub artifact downloads are blocked here (blob storage host); workflow reports are therefore also published as annotations and job summaries.
