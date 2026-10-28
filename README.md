# Purrbi

Cat and dog product scanner built on a purchased FlutterFlow template (FlutterFlow project
`purrbi-v2development-38b75z`) with a Firebase backend in this repository.

| Path | What |
|---|---|
| `backend/` | Firebase: Cloud Functions (codebase `purrbi`), Firestore/Storage rules, indexes |
| `backend/functions/src/domain` | Pure assessment logic: barcodes, ingredients, adequacy statements, nutrition, scope, allergens, life stage, score, personal fit |
| `backend/functions/src/sources` | Open Pet Food Facts (+ sister databases for scope), openFDA recalls, verified web research |
| `backend/functions/src/ai` | OpenAI label-photo extraction and research client (JSON-schema outputs) |
| `backend/functions/src/pipeline` | Firestore-triggered scan job, persistence, quotas |
| `backend/functions/test` | `unit` (mocked), `emulator` (rules + job, mocked sources), `e2e` (real code on emulators), `live` (real services) |
| `flutterflow/` | Text snapshots of the FlutterFlow project (`baseline-2026-10-28` = before changes) |
| `docs/` | Template map, prototype design cues |
| `MOXIS_TO_PURRBI.md`, `PURRBI_BUILD_PLAN.md`, `API_DATA_CONTRACT.md`, `TEST_RESULTS.md` | Working records |

## Run the tests
```bash
cd backend/functions && npm ci && npm test
```
```bash
cd backend && firebase emulators:exec --only firestore,storage --project demo-purrbi "cd functions && npx vitest run test/emulator"
```

## Deploy (GitHub Actions → `deploy-backend`)
Needs the repository secret `FIREBASE_SERVICE_ACCOUNT_PURRBI_DEV` and the Secret Manager secret
`OPENAI_API_KEY` in the target project. Firestore rules come from this repo — don't use
FlutterFlow's "Deploy rules" button.
