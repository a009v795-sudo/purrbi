# Purrbi test results

Mocked tests and live tests are kept separate. "Mocked" = synthetic inputs labelled `TEST FIXTURE`; "emulator" = Firebase Local Emulator Suite (no production data); "live" = real public services or the deployed backend.

## Executed

| Date (UTC) | Suite | Kind | Command | Result |
|---|---|---|---|---|
| 2026-10-28 | Domain unit tests (barcode, ingredients, adequacy, nutrition, scope, allergens, life stage, score, personal fit, summary) | mocked | `cd backend/functions && npm test` | **41/41 passed** |
| 2026-10-28 | Security rules (Firestore + Storage) | emulator | `firebase emulators:exec --only firestore,storage --project demo-purrbi "cd functions && npx vitest run test/emulator"` | **12/12 passed** |
| 2026-10-28 | Scan-job lifecycle (path A, path B with photo, rescan reuse, wrong-product photo, skip photos, unknown barcode, human food, source outage + retry, invalid barcode, quota, duplicate trigger, pet switch) | emulator + mocked sources | same run as above | **13/13 passed** |
| 2026-10-28 | Trigger end-to-end: Auth sign-up → client write through rules → real `processScanJob` → real source adapters | emulator, real code, real adapters | `NODE_OPTIONS="--require ./tools/loopback-no-proxy.cjs" firebase emulators:exec --only auth,firestore,functions,storage --project demo-purrbi "cd functions && npx vitest run test/e2e"` | **1/1 passed.** Outcome: `status: failed`, `errorCode: source_unavailable`, `errorRetryable: true`, `traceId: de1897dd-a09`, `gtin: 00036000291452` — the sandbox blocks the pet database, and the app gets a specific retryable failure, not "unknown product". Owner retry through the rules re-ran the job. |
| 2026-10-28 | Live contract (Open Pet Food Facts, Open Food Facts, openFDA, KB citation URLs) | live | `npx vitest run test/live` | **Not run successfully here: 12/12 failed with `fetch failed`** — this session's network policy denies `world.openpetfoodfacts.org`, `world.openfoodfacts.org`, `api.fda.gov`, `www.fda.gov`, `www.ecfr.gov`, `www.aspca.org`. Runs in GitHub Actions (`live-contract.yml`). |

Notes:
- `tools/loopback-no-proxy.cjs` is a test-harness preload for this sandbox only: firebase-tools ignores `NO_PROXY`, so emulator-to-emulator calls on 127.0.0.1 were sent to the egress proxy and blocked. It sends loopback traffic directly; nothing else changes. Not needed in CI.

## Required evidence (brief §11) — status

| Test | Required evidence | Status |
|---|---|---|
| Real authentication | sign-up/login/logout/reset; owner access | **Blocked**: no Firebase project connected to the FlutterFlow project yet. Rules for owner access verified on the emulator. |
| Known cat and dog foods | identity, real evidence, assessment, saved result | **Pending live** (`live-e2e.yml` after deploy). Mocked path verified on the emulator. |
| Treat and pet supplement | category-specific treatment | Mocked/emulator verified (treats not held to complete-diet rules; supplements not scored). Live pending. |
| Unknown catalog item → photo recovery | extraction continues to assessment | Emulator verified with mocked extraction; live AI extraction pending (needs `OPENAI_API_KEY` + deploy). |
| Unsupported human product | clear out-of-scope result | Emulator verified (mocked Open Food Facts record); live pending. |
| Different pet profiles | different personal findings; stable general score | Unit + emulator verified; live pending. |
| Service/upload failure | specific recoverable failure | Verified on emulators with the real code path (`source_unavailable`, retryable). |
| Restart and rescan | saved findings persist; cache reused | Emulator verified (one database call for two scans; label photo reused). Live pending. |
| Account isolation | no cross-account access | Emulator rules verified; live REST check in `live-e2e.yml` (needs `FIREBASE_WEB_API_KEY`). |
| Mobile experience | camera permission, layout, navigation, retry | **Not possible in this environment**: no Android device, no emulator (no KVM). |
| Android APK | installable build | **Blocked here** (`dl.google.com` denied, no Android SDK). Workflow `android-apk.yml` builds it on GitHub. |
