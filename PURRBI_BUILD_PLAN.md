# Purrbi build plan

Editable project: FlutterFlow `purrbi-v2development-38b75z` ("Purrbi V2 development"), branch `main`.
Recoverable baseline: FlutterFlow branch `baseline-template-2026-10-28` (same commit as `main` before any change) + text snapshot `flutterflow/baseline-2026-10-28/`.
References (read-only): Moxis FlutterFlow `moxis-one-x51584` (pulled and export, locked); prototype JSX (design cues in `docs/prototype-design-cues.md`).

## Decisions (owner, 2026-10-28)
- Backend: new Firebase project **purrbi-dev** (separate from `moxis-one-dev`).
- Spending approved for development: Firebase **Blaze** (with budget alert) + **OpenAI** (new Purrbi-only key).
- Code and records live in a private **GitHub** repo; deploys use a **service account**.
- Android application ID for development: `com.mycompany.purrbiv2development` (production ID decided before release).

## Architecture decisions
- **Firestore-job protocol** instead of HTTP/callable endpoints: the app creates `users/{uid}/scans/{scanId}`; triggers fill results on the same document (resumable, owner-isolated by rules, FlutterFlow-native bindings). See `API_DATA_CONTRACT.md`.
- **Deterministic, versioned score** (`purrbi-score-1.0.0`), pet-independent; **personal fit** separate and traceable. AI never decides scores; it only reads label photos and (optionally) does verified research.
- **Separate deploy codebase** `purrbi`, so Firebase deploys never delete FlutterFlow-managed functions. **Rules are owned by this repo**: don't press FlutterFlow's "Deploy rules".
- Owner label photos stay private (`users/{uid}/labelFacts`); shared `products/*` hold only public-source facts.

## Milestones
| # | Milestone | Status |
|---|---|---|
| 1 | Verify binding, baseline, records | ✅ done |
| 2 | Moxis map (`MOXIS_TO_PURRBI.md`) | ✅ done (enrichAll/generateVerdictV2 source not accessible) |
| 3 | Backend: adapters, scope, scoring, personal fit, scan job, rules, tests | ✅ code complete; unit 41/41, emulator 25/25, trigger e2e 1/1 |
| 4 | Template foundations in FlutterFlow (theme, branding, assets, permissions, fake features out of the active journey, hardcoded credentials removed) | in progress |
| 5 | Firebase connected; real auth; collections & data types; scan → result → history bound to Firestore | **blocked on owner steps 1–2 below** |
| 6 | Pet onboarding (4 steps, conditional questions, save/resume), pet switcher, edit | after 5 |
| 7 | Photo recovery UI (requests, thumbnails, status, retake, continue without photos) | after 5 |
| 8 | Deploy backend; live contract + live e2e; enable research after it passes live | **blocked on owner steps 3–5** |
| 9 | Visual refinement of active journey; legal/privacy/methodology copy | after 5 |
| 10 | Android APK via GitHub Actions; checksum; test report | after 5 and repo access |

## Current blockers (owner actions)
1. **Connect Firebase** in FlutterFlow: Settings → Project Setup → Firebase → create/connect `purrbi-dev` (region `nam5` unless you're in Europe → `eur3`), then **Generate Config Files** with package name `com.mycompany.purrbiv2development`. FlutterFlow refuses Firebase Auth/Firestore until this is done (verified with a dry-run check).
2. **Firebase console** (purrbi-dev): upgrade to **Blaze** + budget alert; enable **Authentication → Email/Password**; create **Firestore** and **Storage** (production mode).
3. **OpenAI key** for Purrbi → Google Cloud **Secret Manager** secret `OPENAI_API_KEY` in purrbi-dev.
4. **GitHub**: create an empty private repo, connect GitHub at https://claude.ai/connect-github, install the Claude GitHub App on it, tell Claude `owner/name`. (This session's files are lost when the container is reclaimed until they're pushed.)
5. **Deploy key**: service account in purrbi-dev with Editor, Cloud Functions Admin, Cloud Run Admin, Service Account User, Secret Manager Admin → add its JSON key as the GitHub Actions secret `FIREBASE_SERVICE_ACCOUNT_PURRBI_DEV` (recommended: deploys and live tests then run in GitHub Actions, which has open internet), plus the public web API key as `FIREBASE_WEB_API_KEY` for the live isolation check.
6. Small decisions still open: support/feedback email address for the app; contact address for the database User-Agent; production application ID before release.

## Environment limits found in this session
- Network policy blocks Open Pet Food Facts, Open Food Facts, openFDA, fda.gov, OpenAI and `dl.google.com` (Android SDK). Google APIs (`*.googleapis.com`), npm, pub.dev, GitHub, Maven and FlutterFlow are reachable. Live data checks and the APK build therefore run in GitHub Actions. (Optional: allow those hosts in the environment's network settings for future sessions.)
- No Google credentials in the container; no Android device or emulator (no KVM).
