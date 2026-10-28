# Purrbi

Cat and dog product scanner built on a purchased FlutterFlow template (FlutterFlow project
`purrbi-v2development-38b75z`) with a Firebase backend in this repository.

| Path | What |
|---|---|
| `backend/` | Firebase: Cloud Functions (codebase `purrbi`), Firestore/Storage rules, indexes |
| `backend/functions/src/domain` | Pure assessment logic: barcodes, ingredients, adequacy statements, nutrition, scope, allergens, life stage, score, personal fit |
| `backend/functions/src/sources` | Open Pet Food Facts (+ sister databases for scope), its label images, openFDA recalls, verified web research |
| `backend/functions/src/knowledge` | Cited, page-verified explanations of ingredients and supplement actives |
| `backend/tools` | Cloud Shell setup script, deploy checks, provider reachability, live E2E (client requests only), report publishing |
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

## Deploy (development only, manual)
1. One-time, by the project Owner in Google Cloud Shell: `bash backend/tools/gcp/setup-dev-access.sh`
   (least-privilege runtime and deploy identities, GitHub OIDC sign-in, secret binding; no keys).
2. GitHub → Actions → `deploy-backend` → Run workflow (type `purrbi-49c21`). It checks the deploy
   identity's permissions, deploys, then verifies functions, runtime identity, secret binding,
   rules and indexes against this repository.
3. GitHub → Actions → `live-e2e` → Run workflow: client-only end-to-end run against the deployed backend.

Firestore and Storage rules come from this repository — don't use FlutterFlow's "Deploy rules" button.
