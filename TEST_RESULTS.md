# Purrbi test results

Mocked tests and live tests are kept separate. "Mocked" = synthetic inputs labelled `TEST FIXTURE`; "emulator" = Firebase Local Emulator Suite (no production data); "live" = real public services or the deployed backend.

## Categories (kept separate)
1. **Mocked** — unit tests with labelled TEST FIXTURE inputs; network stubbed.
2. **Emulator** — Firebase Local Emulator Suite; security rules and the real job code, sources mocked.
3. **Emulator + real network** — the real function code on emulators with real source adapters (GitHub Actions has open internet; this session does not).
4. **Live public providers** — real Open Pet Food Facts / Open Food Facts / openFDA / citation pages from GitHub Actions; no Purrbi backend involved.
5. **Live deployed backend** — the deployed Firebase project, driven by client requests (`live-e2e`). *Not run yet: nothing is deployed.*
6. **Android compilation** — `android-apk` workflow. *Not run yet: the Firebase client config files are not committed (public repository); CI needs them provided another way.*
7. **Physical device** — *pending; not possible in this environment.*

## Executed

| Date (UTC) | Suite | Kind | Where | Result |
|---|---|---|---|---|
| 2026-10-28 | Domain + evidence unit tests (barcode, ingredients, adequacy, nutrition + AAFCO context, scope, allergens, life stage, score, personal fit, summary, supplements, cited-explanation verification, database images, call diagnostics) | 1 mocked | sandbox + GitHub (`backend-ci`) | **56/56 passed** |
| 2026-10-28 | Security rules (Firestore + Storage, incl. server-only `productMeta`/`knowledge`) | 2 emulator | sandbox + GitHub | **12/12 passed** |
| 2026-10-28 | Scan-job lifecycle: path A/B, rescan reuse, wrong-product photo, skip photos, unknown barcode, human food, outage + retry, invalid barcode, quota, duplicate trigger (claimCount 1, duplicateDeliveries 1), pet switch, cited explanations reused with **no AI or database call** on rescan, supplement assessment, database label image fallback (not re-read on refetch), manufacturer research (failed search not repeated) | 2 emulator | sandbox + GitHub | **17/17 passed** |
| 2026-10-28 | Trigger E2E: Auth sign-up → client write through rules → real `processScanJob` → real adapters; account deletion → `cleanupDeletedUser` | 3 emulator + network | sandbox | **2/2 passed.** Sandbox blocks the pet database: `failed / source_unavailable / retryable`, trace `3f9434fc-55e`, calls `world.openpetfoodfacts.org /api/v2/product/:n → network` ×2; owner retry re-claimed (claimCount 2); account deletion left 0 documents |
| 2026-10-28 | Same trigger E2E with open internet | 3 emulator + network | GitHub `backend-ci` run 40787594932 | **passed.** UPC 036000291452: Open Pet Food Facts **404** (×2 code variants) → Open Food Facts **200** "Alaska Peanut Butter - Creamy" → `out_of_scope`, trace `f444cbd1-7fa`, claimCount 1, 7 external calls, 0 AI calls |
| 2026-10-28 | Provider reachability | 4 live providers | GitHub `live-contract` | Open Pet Food Facts API **200**, image host reachable, Open Food Facts **200**, Open Beauty Facts **200**, Open Products Facts **200**, openFDA **200**, OpenAI reachable (**401** without key), Firebase Auth/Firestore/Storage APIs reachable |
| 2026-10-28 | Live contract, first run | 4 live providers | GitHub run 40783753877 | 2 citation URLs **404** (FDA moved them) and Open Food Facts search **503** → citations replaced (all 5 now **200**); revealed two mapping defects (species from the generic `en:dog-and-cat-food` tag; pet `crude-*` nutrient keys not read) |
| 2026-10-28 | Live contract after fixes | 4 live providers | GitHub run 40788183281 | **passed.** Real records mapped with correct species; e.g. Whiskas Temptations Salmon 60g (5998749108536) cat treat **80/100**, Carnilove Chicken enriched with Thyme (8595602527212) **85**, Pedigree Biscrok (5010394133852) dog treat **60**, Purina Dentalife (7613035379114) **65**; complete foods withheld (no adequacy statement in the database — confirmed field absent); unknown barcode → not found; human food → out of scope; openFDA **200** (3 pet-food records: thin coverage, stated in results) |
| 2026-10-28 | FlutterFlow check + push of foundations | FlutterFlow validator | sandbox | all pushes accepted |
| 2026-10-28 | App compile (export → Flutter 3.47.8 web build) | build | sandbox | passed after removing the template's broken ad actions (before Firebase was connected) |
| 2026-10-28 | Visual check of pushed screens (web build) | screenshots | sandbox | `docs/screens/01-04` |
| 2026-10-29 | Unit, emulator and trigger E2E after pinning the Storage bucket (`STORAGE_BUCKET`) | 1, 2, 3 | sandbox (E2E with `loopback-no-proxy.cjs`) | **56/56, 29/29, 2/2 passed** |
| 2026-10-29 | FlutterFlow validation + push of the remaining screens (sign-up, splash, onboarding, scan, result, history, pets) | FlutterFlow validator | sandbox | **accepted** (local and server validation, commit 2026-10-29 00:58Z) |
| 2026-10-29 | App compile with Firebase connected (export → Flutter 3.47.8 web build) | build | sandbox | **passed** |
| 2026-10-29 | Configuration read-back, unauthenticated and read-only | live configuration (not a functional test) | sandbox → `purrbi-49c21` | Firestore list `users`/`scans` **403** (database exists, closed rules); bucket `purrbi-49c21.firebasestorage.app` **403** (exists); `purrbi-49c21.appspot.com` **404**; Email/Password sign-up with a 1-character password → **`WEAK_PASSWORD`** (provider enabled, no account created); app config on web, Android and iOS → project `purrbi-49c21`, bucket `purrbi-49c21.firebasestorage.app` |
| — | Live deployed backend (`live-e2e`, client requests only) | 5 | GitHub | **not run — nothing deployed yet** |
| — | Android APK (`android-apk`) | 6 | GitHub | **not run — Firebase client config not in the public repository** |
| — | Physical device | 7 | — | **pending** |

Notes:
- `backend/tools/loopback-no-proxy.cjs` is a sandbox-only test preload (firebase-tools ignores `NO_PROXY`); not used on GitHub.
- GitHub reports are read through check-run annotations because artifact downloads are blocked in this session.

## Required evidence — status

| Test | Required evidence | Status |
|---|---|---|
| Real authentication | sign-up/login/logout/reset; owner access | Rules verified on the emulator; sign-up/delete verified on the Auth emulator. App screens connected and compiled (2026-10-29). Live: **pending deploy** (the deployed rules today refuse the users document, so a live sign-up waits for the repository rules) |
| Real cat food / dog food | identified → evidence → assessment → saved → visible → reopened | Database mapping live-verified (category 4); full chain **pending deploy** (`live-e2e`) |
| Treat | category-specific treatment | Live-scored from real records (category 4); full chain pending deploy |
| Supplement | informational assessment, not empty | Emulator verified; live pending deploy |
| Product needing photo recovery | photos → extraction → assessment | Emulator verified (mocked extraction); live pending deploy (`live-e2e` uploads real package photos through the owner photo path) |
| Manufacturer/source fallback | at least one product | Emulator verified; live pending deploy |
| Unsupported human product | out of scope | **Live verified on real code** (emulator + network, GitHub) |
| Different pet profiles | different personal findings; stable general score | Unit + emulator; live pending |
| Duplicate events | no duplicate paid processing | Emulator verified (claim transaction; claimCount/duplicateDeliveries recorded); live pending |
| Forgery / other user's scan | refused | Emulator rules verified; live (client requests) pending |
| Retry path | specific retry | Emulator verified; live pending |
| Restart and rescan | saved, reused | Emulator verified (no database/AI call on rescan); live pending |
| Account isolation (client requests) | refused | Emulator; live `live-e2e` pending |
| Deployed rules = repository | match | `deploy-backend` verify step; pending deploy |
| Mobile experience | camera, layout, navigation, retry | **pending (no device here)** |
| Android APK | installable build | **pending (Firebase client config for CI)** |
