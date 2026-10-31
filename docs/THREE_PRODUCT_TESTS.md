# Three-product tests A, B, C (2026-10-30)

Barcode-only lookups of three products through the real app, the failures they showed, the repairs, and the
clean final run. Every attempt is listed, not only the last one.

| Test | Barcode (stored as a string) | Product (independent reference research, never an app input) |
|---|---|---|
| A | `099482481087` | Whole Paws Grain-Free Wet Cat Food, Salmon Paté Loaf Recipe, 5.5 oz can (Whole Foods Market). Cat, complete food (adult maintenance). Pages showing this barcode: Amazon listing B07NRQHKNS, a cats.com review table (three Whole Paws barcodes on one page), Spoonful. Whole Foods' own page shows no barcode. |
| B | `076344886570` | Wellness Complete Health Healthy Indulgence Gravies Chicken & Turkey, 3 oz (85 g) pouch. Cat, complete food (AAFCO cat maintenance). Crude protein ≥4 %, fat ≥2 %, fibre ≤1 %, moisture ≤85 %, ash ≤2.5 %; 670 kcal/kg, 57 kcal per pouch. |
| C | `099482517243` | Whole Paws Cat Treats, Salmon & Avocado Recipe, 3 oz. Cat treat. Ingredients: Salmon, Vegetable Glycerin, Pea Flour, Avocado, Pea Protein, Rosemary Extract. No guaranteed analysis is published. Only Amazon (B09GLF13DF, "Item model number 0099482517243") ties the barcode to it. |

The reference research came from web searches and three ground-truth agents. The sandbox cannot open Amazon,
Petco, Chewy or the Yahoo page directly (its network policy blocks them), so extracts were read through search.
Not confused with `099482480882` (Whole Paws dry cat food, chicken & pea) or `099482080754`.

## Test environment

- **Firebase project:** `purrbi-49c21` (development); functions in `us-central1`.
- **App:** the release web build of `app/lib`, in Chromium at phone size (390×844), driven through the
  accessibility tree (`p4_scan.mjs`): Home "Scan now" → Scan page → typed barcode → "Look up" → result page.
  - Account `accept` (test), pet "Test Cat": cat, 4 years, no allergies recorded.
  - Regressions and persistence: account `demo`, pet Miso. A second cat, Pip (fish allergy), was added for the
    pet-switch test.
- **App source and build per run:**
  - `5fe0c12` (APK build 7's source, `clientVersion purrbi-app-1.1.0`): first lookups and cycles 1–5.
  - `638eb45` (APK build 8's source, `purrbi-app-1.2.0`): smoke, final, regression and persistence runs.
- **Backend revision per run:** read from the scan's own `lastJob.backend.revision`, recorded from cycle 1 on.
  The first lookups ran on `b1d47cb` (deploy 41038637859), before the revision was recorded.
- **Providers in force (`lastJob.backend`):** AI, research, barcode database, database images, explanations and
  verdicts all on.
  - Research model: `gpt-4.1-mini`
  - Explanations: `gpt-5-mini,gpt-4.1-mini`
  - Verdicts: `gpt-4.1-mini,gpt-5-mini`
  - Label reading: `gpt-4.1-mini,gpt-5-mini`
- **Camera: NOT RUN.** There is no Android device here, and the web build has no camera scanner. Only typed entry
  was tested.
- **Photographs: not received.** Both messages that mention them arrived as text only. Photo-assisted recovery is
  NOT RUN, and the barcodes could not be checked against the photos or a scanner's output. They were typed
  exactly as given, leading zeros included.

## Summary

| Barcode | Initial outcome | Demonstrated cause | Repair | Final lookup type | Actual score / verdict | Save / reopen | Test environment |
|---|---|---|---|---|---|---|---|
| A `099482481087` | Fresh lookup (trace `1baccc53-64b`): "Product not identified". | The barcode database answered HTTP 429: its free allowance (100 a day per address) is shared by Cloud Functions. The one web search found nothing. After the repairs, the search returns only eBay and Ubuy listings, and both refuse automated readers (HTTP 403). Whole Foods' page shows no barcode, and cats.com prints three Whole Paws barcodes on one page, which is a listing. | Research 2.2.0–2.6.0 and the barcode-database pause (below). | The saved outcome was reused within its 12-hour retry: no repeated research, Open Pet Food Facts only (trace `70452e05-8bc`). | **Unscored**, "Not yet confirmed for cats or dogs". Verdict: "We couldn’t confirm yet whether this is made for cats or dogs, so Purrbi hasn’t assessed it. A photo of the front of the package, where it says who it is for, will settle it." Front photo: "The manufacturer’s and retailers’ pages couldn’t be reached; Purrbi tries again later." | Listed in history; a repeat scan reuses the saved outcome. | App `638eb45` web build, backend `1021e47`, typed entry. **Blocked:** source access. Photo recovery: NOT RUN. |
| B `076344886570` | Stale or incomplete record (trace `4fc9f86c-753`): research was in its 12-hour retry after the 09:42Z outage, so none ran. "Not yet confirmed for cats or dogs". | One cause per cycle: (1) a single bare search and the barcode database's limit; (2) result pages never checked by Purrbi; (3) **another variant's analysis accepted** from a Japanese listing page; (4) checks spent on one site's other products, plus a brand-only search; (5) the brand added to the query, and a truncated trace. Remaining: the only readable page that ties the barcode is a Japanese shop's page. It gives name, brand and size, but not species, ingredients or analysis in a form Purrbi can verify. | Research 2.2.0, 2.3.0, 2.4.0, 2.5.0 and 2.6.0 (below); 2.3.0's wrong values were withdrawn. | Cache hit on the shared record (trace `0845fc2e-fe7`). | **Unscored**, "Not yet confirmed for cats or dogs" (same verdict as A). Name "WELLNESS（ウェルネス） ヘルシーインダルジェンス 柔らか味わいグレービー仕立て チキン＆ターキー 85gパウチ (86570)", brand "WELLNESS（ウェルネス）", 85 g, all from `store.shopping.yahoo.co.jp`, which shows the barcode. Front photo is for species and type; ingredients: "Not printed on the page matched to this barcode (store.shopping.yahoo.co.jp, checked 2026-10-30)". | Listed in history; a repeat scan is a cache hit. | As above. **Partial:** identity is verified, but species, ingredients and analysis are unresolved. Photo recovery: NOT RUN. |
| C `099482517243` | Fresh lookup (trace `22515393-8b7`): "Product not identified". | The barcode database answered 429. The backend's web search returns **no result** for this barcode (0 results in cycle 5). The only page tying it, Amazon, is not returned and cannot be read by automated clients. | Same research repairs. | The saved outcome was reused within its 12-hour retry (barcode-database outage) (trace `10eed360-eef`). | **Unscored**, "Not yet confirmed for cats or dogs" (same verdict). It is not classified as a complete meal or as dog-only. Front photo: "The barcode database wasn’t available, so the search had only the barcode to go on and found nothing; Purrbi tries again later." | Listed in history; a repeat scan reuses the saved outcome. | As above. **Blocked:** source coverage. Photo recovery: NOT RUN. |

None of the three reached a supported score from barcode-only retrieval. For each, the app names what is missing
and why, and asks only for the panels still needed. A and C stay blocked by source access or coverage, not by a
code defect still open. B has a verified identity but no verified species, ingredients or analysis.

When the barcode database answers again (its pause ends 2026-10-31 13:13 UTC), research has a name to search
by. The unit-tested hint path then finds the Wellness page, whose markup carries the barcode. B was researched
under 2.6.0, though, so another research method version is needed before it is searched again. That path is
unit-tested, not live-tested.

## All attempts

| # | Time (UTC) | App / backend | Barcode | Scan / trace | Lookup type | Outcome |
|---|---|---|---|---|---|---|
| first | 15:4x | 5fe0c12 / b1d47cb | A | `x22NbkV8gWgLSFqaamZx` / `1baccc53-64b` | fresh | Open Pet Food Facts 404 ×2, barcode database 429, one search with 0 citations: "no matching product". Needs photos. Each photo card repeated the same reason (screen 15). |
| first | 15:4x | 5fe0c12 / b1d47cb | B | `toWJq7k1n47HYY4bGzha` / `4fc9f86c-753` | stale (retry window) | Open Pet Food Facts only. Needs photos. |
| first | 15:4x | 5fe0c12 / b1d47cb | C | `4uGMr80p2nOGjWtj4pon` / `22515393-8b7` | fresh | As A. Needs photos. |
| cycle 1 | 16:16 | 5fe0c12 / 1e955ef | B | `NrKF0s1apE0BuK4TMcwL` / `cdd31e2d-f90` | refresh (method 2.2.0) | Barcode database 429, now paused until 2026-10-31 13:13 UTC. One search: "no matching product". |
| cycle 2 | 16:34 | 5fe0c12 / a8b9838 | B | `SlhU4Umr2UaISsO2RZ9d` / `864a81dd-46a` | refresh (2.3.0) | The trace now shows the search: "076344886570", 24 results. Purrbi checked the result pages and found the barcode on `store.shopping.yahoo.co.jp`. **It took protein 9 % and fat 3 %, which are wrong for this recipe (4 % and 2 %).** Caught by checking against the reference. |
| cycle 3 | 16:51 | 5fe0c12 / b9fbec4 | B | `j6KoSEbCFh2qOZVVmkA7` / `56bd298f-a6a` | refresh (2.4.0) | The wrong analysis was dropped ("Dropped … under older rules"). Four page checks went to the manufacturer's other products, and a brand-only search found other businesses. |
| cycle 4 | 17:04 | 5fe0c12 / 8de4dc7 | B | `61nmCtv3O37QKAKvchRI` / `11f7cc1e-842` | refresh (2.5.0) | Eight sites were checked in turn, but the query "Wellness product 076344886570" returned wellness clinics. A later search reached the Wellness Gravies page; why it was not used fell outside the four notes then kept. |
| cycle 5 | 17:15 | 5fe0c12 / 1021e47 | B | `gGLdTiwkR2IQaBm6vOGA` / `cdee0a88-3ff` | refresh (2.6.0) | The digits alone, "076344886570", returned 24 results. The Yahoo page was read: name, brand and 85 g verified. The manufacturer search used the Japanese name and found the Japanese Wellness site, which does not show the barcode, so it was rejected. |
| cycle 5 | 17:16 | 5fe0c12 / 1021e47 | A | `1DHnsVodKwp30s026zVV` / `6402eaaf-3d7` | refresh (2.6.0) | `"099482481087"`: 2 results (ebay.com, ubuy.com.lb), both 403. The answer's name was searched next: 12 results, none tied to this barcode alone. cats.com lists it among three barcodes. Recorded as unreachable and retried after 12 hours. |
| cycle 5 | 17:17 | 5fe0c12 / 1021e47 | C | `LFDcrHAtUYziLSxPMKFm` / `1ba6a7a3-4ca` | refresh (2.6.0) | `"099482517243"`: 0 results. "No matching product". |
| smoke | 17:41 | 638eb45 / 1021e47 | A | `tsPtV18ibwPcJSMjt3lK` | saved outcome | New Scan page create path, `clientVersion purrbi-app-1.2.0`, no app errors. |
| final | 17:45 | 638eb45 / 1021e47 | A, B, C | `TUArsjeRcbWIeHmoaYfT` / `70452e05-8bc`, `bSWD0XJBlh40fAqssbM6` / `0845fc2e-fe7`, `PNZKLk0ZbY6MPMGqL7tu` / `10eed360-eef` | saved outcome, cache hit, saved outcome | As in the summary. No paid calls were repeated. |

Each scan's record holds the full trace: status timeline, `sourceChecks` (host, path, HTTP status, time),
`evidenceNotes`, `diagnosticNotes`, `fieldStatus` and `lastJob`. Captured copies are in the session's
`demo/p4-*.json` files, kept outside the repository because they hold account ids.

## Repairs, each with a regression test that fails on the code before it

| Commit | Research | What changed | Tests failing on the previous commit |
|---|---|---|---|
| 1e955ef | 2.2.0 | The barcode is searched in its printed forms (12 and 13 digits, spaced as under the bars). Catalogues, price lists and search pages are not a product's page. A page that ties the barcode but shows nothing else no longer ends the search. With no name known, the answer's name is searched (search words only; the page must show the barcode). A barcode between other numbers is found. The barcode database is paused until its reset time after a 429 (`system/pause_upcitemdb`). A shared photo reason is said once. Each job records the backend revision and provider configuration. | 5 unit, 2 emulator (on 547e440) |
| c946725, a8b9838 | 2.3.0 | Each search's query and result pages are recorded in the trace. Purrbi checks the result pages for the barcode itself and reads the first that shows it from its own copy. The pause note gives the date. | 3 unit |
| b9fbec4 | 2.4.0 | A page printing other barcodes besides this one is a listing (weak identity). An analysis value counts only as the first number after its nutrient's name (English, EU languages, Japanese). The manufacturer's page is sought by the answer's name. **Results of 2.3.0 are not used.** | 2 unit |
| 8de4dc7 | 2.5.0 | Result pages are checked site by site, at most eight. A brand alone is never searched. | 1 unit |
| 1021e47 | 2.6.0 | The barcode's digits are searched alone first. A scan keeps up to twelve research notes. | assertion added |

At `1021e47`: unit tests 450/450 and emulator tests 86/86. CI is green: test type-check, composite indexes,
unit, emulator, and the trigger end-to-end with real sources and no AI. Deploys: 41087732417, 41090562484,
41093120760, 41095015790 and 41096553777, all manual development deploys of `main`.

**A defect introduced during this work and withdrawn:** research 2.3.0 saved another variant's analysis to B's
shared record (16:34–16:51Z, development project, test accounts only). Research 2.4.0 withdrew it through the
version rule, with no manual deletion. The record has held no analysis since.

## FlutterFlow: issues before and after

**`flutterflow ai review` (the project's issue list):** the same before and after: 5 critical and 20 warnings,
all pre-existing and classified in `SCAN_FLOW_AUDIT.md`.
- R1: template components' unused `detail` parameter.
- R14: local-state lists on the template's Notification, FAQ and Blog pages.
- R15: the template's chat list type.
- R19: `shrinkWrap` lists, by design inside the scrolling result page.

None was introduced by these changes. `flutterflow ai issue candidates` derives nothing. `flutter analyze` on
the export: 0 errors. Warnings rose from 1604 to 1653; the new ones are unused imports in FlutterFlow's fixed
header for custom code.

**Action-flow audit.** Read-only. It covered every trigger of the Scan page, Scan Now and the barcode callback,
typed entry, page-load actions, photo actions, retries, shared blocks and routes, with a read-only comparison
against Moxis. Two skeptics checked SE-01 to SE-04 independently. I checked the rest against the generated code
myself; the remaining skeptic agents were stopped by a container restart.

| Id | Location | Severity | Behaviour | Status |
|---|---|---|---|---|
| F01 | Scan page camera → BarcodeScanner | error | Cancel button had no label (iOS: no visible way out) | **Fixed**: "Cancel" (FF `2pNlKI2wW5vjQjXQYpyw`) |
| SE-01 / F06 | Scan page camera and "Look up" → create scan | warning | A failed create left the page locked on "STARTING…" with no message | **Fixed**: `createScanRequest` never throws; guard released; message (`Gx9qpm9yBvmUbkkPt7Jb`) |
| SE-02 | same | warning | Offline create hung the page | **Fixed**: 10 s cap; the queued request opens from the local copy |
| SE-03 / F05 | camera tap | warning (split verdict) | Double tap opened the scanner twice | **Fixed**: guard set before the scanner opens |
| SE-04 | camera tap | warning / info | No permission request; a denied camera looked like a quiet cancel | **Fixed**: permission requested first; a cancelled scan says how to allow the camera or type the number |
| SHARED-01 / SE-08 | routes | warning | Home and Scan did not require sign-in | **Fixed**: `onlyAuthenticated` |
| F1 / F02 | result page photo buttons | warning | A refused photo create left every photo button disabled | **Fixed**: `addLabelPhoto` always releases `uploading` and says why |
| F2 | photo upload | warning | Full-size photos over the 10 MB rule failed silently | **Fixed**: 2048 px, JPEG 85; "too large" message |
| F08 | photo rows | warning | Rows shared one upload field (a cancelled row could reuse another's photo) | **Fixed**: each call keeps its own file and address |
| F4 / F03 / F5 | pet chips | warning | Chips shown where a re-check is refused or ignored | **Fixed**: only for complete or needs_photos |
| F6 | re-check failure | warning | A failed pet re-check was never shown | **Fixed**: shown on the result |
| F7 | "Continue without photos" | warning | Could be lost to a re-check started on load | **Fixed** in the app: disabled while a re-check is pending |
| F8 / F07 | page-load re-check | warning | `!=` version test re-requested newer results | **Fixed**: `isOlderAssessment` |
| SHARED-02 | splash | warning | A signed-in account without a profile document stopped on the splash screen | **Fixed**: signed out with a message (`accountState`) |
| SHARED-03 | account deletion | warning | "Your account has been deleted" shown even when Firebase refused | **Fixed**: shown only when the account is gone |
| SHARED-04 / 05 | pet and owner name fields | warning | Over-long names refused by the rules locked the save | **Fixed**: 40 and 80 character limits |
| I2 / F10 | sources | info | Sources without an address looked like links | **Fixed** |
| I5 / F09, I6 | texts | info | Variable name in a snackbar; hint naming the wrong control | **Fixed** |
| — | "Add photo" button | (screen) | Label touched the button edges | **Fixed**: inner padding (`mpSoXWQoHKKORyrtIqYk`) |
| F3 / F04 | stuck-job "Try again" | warning | Re-evaluated only on rebuild | **Remaining, nonblocking.** FlutterFlow's periodic action has no body in the editable format. Reopening the result re-checks it, and the screen already says the result is saved to history. |
| SE-05 | native scanner on Android 15+ | warning | Bottom bar may sit under the navigation bar | **Remaining: needs a device check** (NOT RUN) |
| SE-06, SE-07, SE-09, SE-10, I1, I3, I4 / F11, SHARED-06–09 | traces, snackbar queue, keyboard layout, subtitle, missing-document state, current pet's chip, return after "Add a pet", history double tap, empty-state button, badge rebuild, init action listing | info | No effect on scanning results or data | **Remaining, nonblocking.** I3's condition is refused by FlutterFlow's validator. |

FlutterFlow checkpoints: 4CG9NF9QRXhqLXdCRGYX, Gx9qpm9yBvmUbkkPt7Jb, 2pNlKI2wW5vjQjXQYpyw, the result-page push,
8onllN0jh9JO8YTny4Xc, M9doErcRlBJnBhwRm9pN and mpSoXWQoHKKORyrtIqYk. After the pushes,
`flutterflow ai codegen refresh` regenerated the code from the live project, and every fix above is in it: the
"Cancel" text, `createScanRequest` and `lastScanRef`, `addLabelPhoto`, `isOlderAssessment`, `isRefreshFailure`,
`accountState`, four `requireAuth` routes, and `permission_handler`. That export is commit `638eb45`. Moxis was
only read.

## Interface and persistence (real app, `638eb45`)

- **New result shown, not stale state:** each run's screen matched the scan document, and the status timeline was
  captured live.
- **Reasons said once:** the photo cards say a shared reason only once (screen 15 before, screens 09 and 10 after).
- **Restart:** a new browser session with the saved sign-in opened Home without signing in again.
- **History:** "My scans" lists the results, e.g. "97 Flaked Skipjack Tuna & Wild Salmon Entrée in Broth Strong",
  "Freeze Dried Wild Caught Salmon Dog Treats Information incomplete", and the A, B and C entries (screen 12).
  A result reopens from history.
- **Repeat scan:** B is a cache hit with no external calls. A and C reuse their saved outcomes within the retry
  window, so no paid call is repeated.
- **Pet switch** (Wellness can, scan `SLw3uXqziUfuQoerCeBj`):
  - Pip: "Possible mismatch for Pip", with "In the allergy profile: fish. Contains Tuna, Tuna Broth, Mackerel,
    Salmon" (screen 13), assessment run `f54615cb-93a`.
  - Back to Miso: "Fits Miso’s profile", run `f22847e6-983`.
  - The product's general result stayed **97 "Strong"** throughout.
- **Label photo path (new action) in the browser:**
  - The picker opens, and ending a pick without a file releases the buttons.
  - Headless Chromium gets no file chooser from Flutter's web image picker, so the upload, photo request and
    processing steps of this build were checked in code and by compiling only. **Device test: NOT RUN.**

## Regression reruns (backend `1021e47`, app `638eb45`)

| Product | Result | Checks |
|---|---|---|
| `076344060048` Wellness can | **97 "Strong"**, complete food, for cats (feeding statement); "70 kcal per 2.8-oz can" (scan `SLw3uXqziUfuQoerCeBj`, trace `2d9df455-e0a`) | One package size's calories. Cache hit, no external call. Six saved drug-use claims withheld. |
| `850063633017` A Better Treat salmon | **Unscored**, "Information incomplete"; **"For cats and dogs (manufacturer)", treat**, 1.5 oz (trace `69a13d82-1e6`) | Not dog-only; not a complete food. Analysis not taken from a page matched by name. Only the nutrition panel is requested. No unsupported citation: explanations "unavailable", none shown. Better than before (it was "Review", product type unclear). |
| `099482480882` Whole Paws | **Unscored**, "Not yet confirmed for cats or dogs" (trace `744447c5-b20`) | Not "human food". Nothing taken from the similarly named Whole Foods page ("matches only by brand and name"). |

## Not run, and limits

- **Physical camera:** NOT RUN (no device).
- **Photo-assisted recovery:** NOT RUN. The photos were not received.
- **Label photo upload on this build:** device test NOT RUN (see above).
- **Sites the sandbox can't open:** the network policy blocks Amazon, the Yahoo shop, admc.us and others. The
  deployed backend reaches them, or is refused, as recorded per call in each scan's `sourceChecks`.
- **Barcode database:** the free UPCitemdb tier limits each address to 100 requests a day, shared by all Cloud
  Functions instances. It is paused until its own reset time, not retried. A paid key or a fixed outbound
  address would avoid this; both are account and billing decisions, and neither was made.

## Android APK, build 8

| | |
|---|---|
| Workflow run | `android-apk` 41101143210, succeeded 2026-10-30 18:00:58Z |
| Source revision | `638eb45caae9e972e9137e3ce46c7267fe0b2882` (the app export above; the code the final runs used) |
| Version | versionName 1.0.0, **versionCode 8** (`--build-number=8`); application id `com.mycompany.purrbiv2development` |
| File | `app-release.apk`, 113,130,790 bytes, SHA-256 `3545784c6cbbffae01ff8239b340377763a609b1aec1ecbb0f19ba002e864bf4` |
| Artifact | `purrbi-android-apk-8` (54,760,368 bytes zipped, kept until 2027-01-28) |
| Backend environment | development project `purrbi-49c21`, backend `1021e47` (deploy 41096553777) |
| Signing | The development key that builds 6 and 7 used, restored from the workflow's cache (`purrbi-dev-debug-keystore-v1`), so it updates build 7 in place. This session can't read the cache or job logs, so the cache hit itself is not shown here. |
| Installation test | **NOT RUN.** There is no Android device or emulator in this environment. |

## Cycle 6 (2026-10-31): barcode-only, research 2.7.0

The owner withheld the photographs on purpose: the goal is to see how far the barcode alone goes, and what stops it.

**Causes in the cycle-5 traces, and the repairs** (commit `4dd9bea`, deploy 41160259073):
- **One search per call, 12 digits only.** A found only eBay and Ubuy; C found nothing. When the 12 digits find nothing usable, a
  UPC-A's 13-digit form is now searched on its own. It is skipped when the first search already ran it, and never used for EAN-8.
- **B saved as "done" after a search made while the barcode database was paused.** Its only name (a Japanese listing's) then kept the
  database from ever being asked again. Now:
  - the database is asked when no record or label names the product and no Latin-script name is known;
  - its answer is kept 30 days;
  - it is not asked while the AI budget is used up;
  - a run during its outage that leaves who the product is for unknown is stored as `hint_failed`, and repeated once the database
    answers again.
- **The manufacturer search used the Japanese heading** and reached Wellness Japan. Search words now prefer a Latin-script name.

**Adversarial review before deploying** (workflow `wf_a90dae4d-2e0`: three lenses, policy, correctness and cost, plus skeptics). Every
finding was fixed and has a test:
- **A loosening of matching.** A search on the English title, with the Japanese trusted name reduced to "wellness", could have let
  another flavour's page in by name. Now a search on words other than the trusted name uses only a page tied by barcode, recipe or
  variants, and a name in another script is never matched by name.
- **Unbounded retries.** Unfinished runs are now retried after 12 hours, 2 days and 7 days, then not until a new method or 30 days.
  A refusal (HTTP 401, 403, 404 or 410) is a final answer, said as "the pages that show this barcode turn automated readers away".
- **Smaller fixes:**
  - a page refused once is not fetched again in the same run;
  - the result-page option is asked for only by research, and a refusal is remembered per model;
  - a page found during the outage is described as found;
  - the search by name uses the barcode search that names the product;
  - short Latin names such as "Go!" stay Latin.

Unit tests 459/459, emulator tests 89/89. The new tests fail on `1021e47`.

**Incident: the OpenAI key expired.** The first rescans on `4dd9bea` (02:35Z; A `bTBe1jviVUuO4pCUfc2G`, C `YU16Gx0EeUs8MTOw8evK`) got HTTP
401 "Your API key has expired". The app said honestly that the search "didn't work just now; it tries again later" and invented
nothing. The owner saved a new key version, and deploy 41161558917 picked it up. OpenAI answered 200 again from 02:5xZ.

**Results** (app `638eb45` web build, backend `4dd9bea`, typed entry):

| Test | Scan / trace | What the backend's search returned | Outcome |
|---|---|---|---|
| A `099482481087` | `rKCp0dFtT6nUBstCiDhi` / `3fccab49-4e3` | `"099482481087"`: eBay and Ubuy, both HTTP 403 (now recorded as refusals). `"0099482481087"`: 0 results. Search by the answer's name: 12 results (Whole Foods, PawDiet, Shein, cats.com, Petco 403, …); none ties the barcode alone, and cats.com lists three Whole Paws barcodes. | Unscored, "Not yet confirmed for cats or dogs". Stored as `hint_failed`, to repeat after the barcode database's reset. |
| C `099482517243` | `DZc8RD72DjDWH6yr6INN` / `d86e2aa8-99b` | `"099482517243"`: 0 results. `"0099482517243"`: 0 results. | Same. |

The 13-digit search works as designed, but OpenAI's web search, the provider the backend uses, barely indexes these two barcodes.
Other engines find A on Amazon and Spoonful and C on Amazon, and those are not in its results. This is a coverage limit of the search
provider, not a code defect still open.

**Regressions on `4dd9bea` (demo account):**

| Product | Scan / trace | Result |
|---|---|---|
| Wellness can `076344060048` | `UknFp0EoXESaVPjwzJbq` / `7f6dd378-01e` | 97 "Strong", cache hit, no external calls |
| Salmon treat `850063633017` | `9WRyLXeLP4OoeWgRG4XL` / `bb78c30e-4b2` | Cats and dogs, a treat, "Information incomplete" (only the nutrition panel requested) |
| Whole Paws `099482480882` | `d2eLTkM9cbqLZaXJgKtc` / `99877a3e-234` | Still unresolved, not "human food". The 13-digit search found **a page that shows the barcode with the same recipe** (plainfoodsafe.com, 10 of 10 ingredients in order); it does not say who the food is for. The Whole Foods cat-food page matches only by brand and name, so nothing was taken from it, per the rule on similarly named variants. |

One wording issue to fix: when a page was verified but added nothing new, the closing note says "nothing could be verified against a
page".

**B:** rescanned after the barcode database's reset (2026-10-31 13:13 UTC), when its English title is available (below).

## Cycle 7 (2026-10-31): gpt-5-mini as the research model, research 2.8.0

The owner asked to try gpt-5-mini for research and rerun A and C, barcode only (no photos).

**Change** (commit `024eac7`):
- `OPENAI_RESEARCH_MODEL` is `gpt-5-mini` in the development deploy (was `gpt-4.1-mini`).
- Each run records its model. Another model is a new method, so a product still missing information is searched again with it.
  A and C were in their retry wait; this made them due at once. A complete product is not searched again.
- gpt-5-mini also opens pages. Pages it opened are listed in the trace ("opened …") and checked by Purrbi for the barcode, like
  search results.
- Its calls get 90 s, as explanations and label reading already do.

**Adversarial review before deploying** (workflow `wf_9dac78f5-7d6`: three lenses, each finding checked by a skeptic). 8 findings
confirmed, 3 refuted. All 8 fixed in `8e8e63c`, each with a test that fails on `024eac7`:
- A run the time limit stopped before any search was saved as finished ("no page could be matched", no search for 30 days).
  Research is now not started with less time left than a search needs, and nothing is saved as searched.
- A run the time limit cut short that found nothing was saved as an ordinary negative, and result pages it skipped were not
  mentioned. It is now stored as `time_limited` and retried on the bounded schedule; the skipped pages are named in the trace.
- Result pages are now checked before another paid search.
- The status shown after a model switch could be the old model's "not found". It now uses only the same version and model.
- A shop's own search page (`?q=<barcode>`) that only repeats the barcode from its address counted as showing it. It no longer does.
- gpt-5-mini's `queries` list lost to the older single `query` field, which would have caused an extra paid search.
- Page opens were counted as searches.
- The API contract had dropped research 2.6.0 from the results in use.

Unit tests 466/466, emulator tests 94/94, CI green. Deploy 41172579999 (`8e8e63c`).

**Results** (app `638eb45` web build, backend `8e8e63c`, research model `gpt-5-mini-2025-08-07`, typed entry, account `accept`). The
barcode database (UPCitemdb) was still paused until 13:13 UTC, so neither search had its product title:

| Test | Scan / trace | What gpt-5-mini searched and found | Outcome |
|---|---|---|---|
| A `099482481087` | `G2sYGmecI9tA2bdeL14o` / `345c0a6b-6b8` | Call 1 (17 s): the three printed forms in one search (4 results: ubuy.com.lb, scribd.com, e-chinalife.com, pi.bigparadox.com), then "Whole Paws Salmon Pate UPC 099482481087 …" (18 results: eBay, Whole Foods Market, Health First Market, instagrid.me, …); opened wholefoodsmarket.com. The 13-digit search was not repeated (call 1 ran it). Purrbi checked 8 result pages: none readable shows the barcode; ubuy.com.lb, ebay.com and healthfirstmarket.com refuse automated readers (HTTP 403). Whole Foods' page shows no barcode, and the name is unverified, so it is not matched by name. Call 2 (16 s), search by the answer's name "Whole Paws Salmon Paté Loaf": 19 + 2 results; opened healthfirstmarket.com; eBay and Ubuy refuse readers. | Unscored, "Not yet confirmed for cats or dogs". Stored as `hint_failed`: searched again after 12 hours, once the barcode database answers. |
| C `099482517243` | `vwvE7E2Y1xrF3osiFfRG` / `49ae946d-859` | One call (5 s): the three printed forms (2 results: beda.cz, scribd.com), then "UPC", "pet food" and "dog cat food" variants (16 results: pet-food lookup sites' home pages, admc.us, fda.gov, …). The model reported no matching product. Purrbi checked 8 result pages: none shows the barcode; fda.gov answered 401. beda.cz and admc.us were not among the 8 checked. Page checks leave documents out, and the trace records hosts only, so whether they show the barcode is unknown. | Same. |

**Compared with gpt-4.1-mini (cycle 6):**

| | gpt-4.1-mini | gpt-5-mini |
|---|---|---|
| A, searches | one search per call; 12 digits: eBay and Ubuy; 13 digits: 0 results; by name: 12 results | several searches per call, all three printed forms at once; 22 results in call 1; opens pages itself |
| A, pages tying the barcode | eBay, Ubuy (both refuse readers) | eBay, Ubuy, Health First Market (all refuse readers) |
| C, results | 0 for either form | 18, none a product page showing the barcode |
| Model calls, time | 3–4 calls | A: 2 calls (17 s, 16 s); C: 1 call (5 s) |
| Outcome | unscored | unscored |

gpt-5-mini searches more widely and was not slower here. It found no page that Purrbi can read and that ties either barcode,
so neither outcome changed. What stops A and C now:
- A: every page found that shows its barcode turns automated readers away. Purrbi does not get around that.
- C: no product page with its barcode is in the search provider's results. Two results, possibly documents (beda.cz, admc.us),
  were left out of the checks. The trace does not record their addresses, so this can't be settled from the trace.
- Both: no product title from the barcode database while it is paused.

**Issue seen (wording, not new):** for A the front card says the search "found nothing", but it found pages that refuse automated
readers. The barcode-database message takes precedence over the refusal message. To fix next.

**B** is rescanned after the barcode database's reset (13:20 UTC scheduled), now on research 2.8.0 with gpt-5-mini. Its saved
run is 2.7.0's, so it is searched again at once. A and C's retries fall due after about 17:30 UTC.
