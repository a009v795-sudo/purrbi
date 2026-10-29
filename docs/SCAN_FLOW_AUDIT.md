# Scan flow audit: Purrbi and the Moxis reference

Date: 2026-10-29.

Sources:
- The FlutterFlow projects, read with `flutterflow ai inspect` and `flutterflow ai review`, and the `fft` workspace.
- The generated code.
- The backend at each commit named below.

Moxis was only read: nothing in it was edited, reordered, pushed or deployed. Its findings are listed in §5 for your decision.

## 1. Architecture

| | Moxis (reference, read-only) | Purrbi |
|---|---|---|
| Shape | One client-orchestrated action chain on the **Scan Now** button | Scan document plus server worker |
| What the button does | Barcode scanner → `GetProduct` (Open Food Facts, from the device) → client writes `products/{barcode}` → callable `generateVerdict` → raw HTTP `enrichAll` → raw HTTP `generateVerdictV2` | Creates `users/{uid}/scans/{id}` (`status: queued`) and opens the result page bound to that document |
| Where the outcome lives | Global app state `currentVerdict` | The scan document. Triggers claim it in a transaction and write status, then the result; the app only reads |
| Result page | Three live streams (product, verdicts by `goalsText`, evidence); no pending, empty or error state | One document stream; states queued/working, failed, needs photos, unresolved, out of scope, complete; a stopped job can be retried |
| Client calls to APIs / AI | Yes (OFF from the device; callable and raw HTTP to functions without an ID token) | None. All lookups and AI run server-side with the key in Secret Manager |

## 2. Scan Now: side-by-side action map

Purrbi "before" is the build installed at the time of the incident (app 3be6091). "After" is the current export (app 6ad57b2, APK build 3).

| # | Step | Moxis action | Purrbi before | Purrbi after | Input → output | Dependency | Difference / fix |
|---|---|---|---|---|---|---|---|
| 1 | Entry | Home card or nav → Scan | Home card "Tap to start scanning", Quick action "Scan now", nav centre → IdentifierPage | Same | tap → page | — | — |
| 2 | Guard | none | none | `creating` flag: taps while a request is being created are ignored; offline → "Please turn on internet" | tap → stop or continue | `appState.connected` | Repeated taps created several scans (each using quota) |
| 3 | Scanner | BarcodeScanner, QR mode | BarcodeScanner, QR mode → `scannedCode` | BarcodeScanner, **barcode mode** → `scannedBarcode` | camera → string, `-1` on cancel | native scanner | QR window for 1D barcodes |
| 4 | Cancel | none (`-1` sent to OFF) | `-1` → `1` → "No barcode was read" | `isScanCancelled` → stops quietly (traced) | `-1` → stop | — | A cancel looked like a failed read |
| 5 | Validation | none | 8–14 digits | GS1 check digit for 8/12/13/14 digits, UPC-E included (same rule as the backend) | digits → ok / message | `isLikelyBarcode` | 9–11 digits and bad check digits became failed scans |
| 6 | Lookup | `GetProduct` on the device | none on the device | none on the device | — | backend | Purrbi never calls APIs from the client |
| 7 | Write | Client `set()` of `products/{barcode}` (shared, client-trusted), then `scans` after the verdict | Create `users/{uid}/scans` {barcode, petId, source, status queued, createdAt server, clientVersion}, awaited | Same, `clientVersion purrbi-app-1.1.0`; trace `create_start` / `create_done` | barcode → scan doc | rules `onlyKeys`, server time | — |
| 8 | Assessment | callable `generateVerdict` and raw-HTTP `generateVerdictV2` from the client | server: claim → lookups → assessment → save | server, plus the checked verdict and highlights in the second update | scan doc → result fields | `processScanJob` trigger | No client AI calls |
| 9 | Navigate | "View Full Report", visible whenever `currentVerdict` is set (also for errors and the previous scan) | `push ScanResultPage(scanRef, scanId)` after the create is acknowledged | Same | ref → page | — | — |
| 10 | Observe | three streams, no states | one stream; "Identifying the product" shown in every state; score breakdown shown for unscored | one stream; compact layout; "Identifying…" only while working; "What is missing for a score" when unscored | doc → UI | `FirestoreRead` | Misleading texts removed |
| 11 | Retry | none ("scan it again") | "Try again" only for `failed` + retryable | Same, plus "Try again" for a job that stopped (no update for 6 minutes) | `retryRequested` | rules, `onScanRequestUpdated` | A stopped job looked pending forever |
| 12 | Typed entry | none | "Look up" (FFButton guard) | Same, plus the `creating` guard, offline check, check-digit message | text → scan doc | — | — |
| 13 | Not a pet product | n/a | dead end (no action) | "Add a photo of the front" (owner's package decides their own result) | photo → re-assessment | rules allow photos for `out_of_scope` | Misclassification could not be corrected |
| 14 | Trace | none | none | `[purrbi-trace]` lines: `camera_open`, `camera_cancelled`, `camera_unreadable`, `create_start`, `create_done`, `result_open`, `retry_failed`, `retry_stuck`, `photo_added`, `pet_refresh`, `result_deleted` (scan id, trace id, short detail; never a barcode, name or token) | — | `traceScan` custom action (temporary) | — |

### Ordering and timing checks

| Hypothesis | Moxis | Purrbi before | Purrbi after |
|---|---|---|---|
| Scanner output is awaited before it is used | yes | yes | yes |
| The create is awaited before navigation | product write before the verdict; history only after v1 succeeds | yes | yes |
| A previous or empty barcode is never reused | no (`scannedCode` is global and reused) | yes (`lastScan` reassigned per tap) | yes |
| Output references point at the right actions | stored names stale (`apiResultvf0`, `apiResult13q`) but keys resolve | yes | yes: renamed outputs (`scannedBarcode`, `cameraScan`, `manualScan`), so no reference reads an old action |
| Worker sequence | n/a | create → trigger → claim transaction (duplicate deliveries ignored) → status updates → result | the same, then a second update for explanations and the verdict, written only while the run's result is still the saved one; an older run never overwrites a newer result |

## 3. FlutterFlow issues (Purrbi), before → after

| Project | Page / widget | Trigger / action | Message | Level | Impact | Resolution | Status |
|---|---|---|---|---|---|---|---|
| Purrbi | Firestore `users.photo_url` | auth user creation | Your "users" collection's field, photo_url, must be a "ImagePath" | **error** (validator) | could block builds inside FlutterFlow | retyped to Image Path (same stored string) | **fixed**: validator baseline is empty |
| Purrbi | AppLogo | parameters height, width | [R1] parameter declared but not referenced | critical (SDK lint) | sizes ignored | bound to the container's height and width | **fixed** |
| Purrbi | CategopriePage list | — | [R19] dynamic ListView enables shrinkWrap | warning | performance | shrinkWrap off (the list sits in Expanded) | **fixed** |
| Purrbi | ScanResultPage: 17 nested lists (CautionList, PositiveList, …) | — | [R19] dynamic ListView enables shrinkWrap | warning | performance only; short lists | kept: nested vertical lists inside a scrolling page need shrinkWrap (the rule's own note exempts this). The highlights lists show at most 2 items. fft has no generated-children form for Column | open (by design) |
| Purrbi | PetOnboardingPage DraftList | — | [R19] | warning | one item | kept: it prevents an unbounded-height layout | open (by design) |
| Purrbi | ScanComponent.detail, RecentIdentifier.detail | — | [R1] parameter not referenced | critical (SDK lint) | none: the generated code reads `widget.detail`; stale stored binding names | template components outside the scan flow; left as they are | false positive |
| Purrbi | NotificationPage, FaqPage, BlogPage lists | — | [R14] LOCAL_STATE list without nodeKeyRef | critical (SDK lint) | none: the generated code reads `FFAppState().…` | re-picked each app-state source from scratch (two pushes); FlutterFlow stores app-state lists in this form, so the lint persists | false positive |
| Purrbi | ChatPage.chatList | — | [R15] listType wrapping a DataStruct | warning | unreachable template page; generated type is correct | not changed | open (template) |

These were found by reading the code; no FlutterFlow tool reports them:

| Page / widget | Fault | Fix | Status |
|---|---|---|---|
| ScanResultPage "Add photo" | A failed upload returned before `uploading = false`, so every photo button stayed disabled | `uploading` is set only after the upload succeeds | fixed |
| IdentifierPage camera | Repeated taps created several scans; no spinner | `creating` guard, spinner, offline check | fixed |
| IdentifierPage | Cancel shown as "No barcode was read"; QR mode | quiet cancel; barcode mode | fixed |
| IdentifierPage | Validation looser than the backend | check digit, UPC-E | fixed |
| ScanResultPage header | "Identifying the product" in every state | only while working; otherwise "Product not identified" | fixed |
| ScanResultPage score | Breakdown with "0 / N" rows for unscored results | "What is missing for a score", without points | fixed |
| ScanResultPage queued | Blank status line before the job starts | "Queued: starting the lookup…" | fixed |
| ScanResultPage out of scope | No action | front-photo action | fixed |
| ScanResultPage working | No way out of a stopped job | "Try again" after 6 minutes without an update | fixed |
| ScanResultPage pet chips | No re-entry guard | ignored while a refresh is pending | fixed |
| History | `createdAt!` null assertion | falls back to now | fixed |
| Policy text vs app | "scans can be deleted", no delete action | "Delete this result" with confirmation | fixed |
| PetOnboardingPage from a result | Returns Home, not to the result | — | open (low) |

## 4. Tests of the scan chain

See TEST_RESULTS.md for the live results with trace ids.

| Case | Method | Status |
|---|---|---|
| Scan page from Home "Scan now" | live, web build | **passed** |
| Known product, three rapid taps on "Look up" | live, web build | **passed**: 1 scan created (trace `383c17c7-e01`) |
| Retry after a source failure | live, web build | **passed**: `f85f2b9d-ceb` failed → `ce0c86b4-28a` complete, claimCount 2 |
| 099482480882 | live, web build | **passed**: unresolved, front photo requested (`a2643b66-5c7`) |
| Not a pet product → front photo offered | live, web build | **passed** (`b275c4d3-418`) |
| Reopen after an app restart | live, web build | **passed** |
| Client trace | live, web build | **passed**: `create_start → create_done → result_open`, `retry_failed` |
| Cancelled camera scan | — | **unverified**: the camera path runs only on a phone. The web build shows "Camera scanning needs the Android or iOS app" |
| Repeated camera taps | — | **unverified on a device**; the same guard is verified on "Look up" |

## 5. Moxis findings (report only; nothing changed)

Each needs your decision before anyone acts on it.

| # | Where | Finding | Impact |
|---|---|---|---|
| 1 | Scan, `getProduct` branch | Any non-2xx answer shows "Couldn't reach the product database"; OFF returns 404 for unknown barcodes | Unknown products are reported as connectivity failures |
| 2 | Scan, `products/{barcode}` create + update | `set()` replaces the shared product doc on every scan, then `scanCount += 1` | `scanCount` is always 1 (TopProducts ranks nothing); the previous scan's verdict text leaks into `aiVerdict` |
| 3 | firestore.rules (export) | `products` writable by any signed-in user | Anyone can overwrite shared product names and verdicts |
| 4 | `generate_verdict.js` | onCall without a `context.auth` check, no App Check | Anyone can spend the OpenAI credit |
| 5 | `callEnrichAll`, `callGenerateVerdictTwo` | Callable-format bodies sent by raw HTTP with no ID token | The endpoints must accept unauthenticated calls (inferred) |
| 6 | Scanner → app state | No check for `-1`, empty or format | A cancel triggers an OFF request for "-1" and a blank report |
| 7 | ProductIntelligence | No doc → `Container()` (no AppBar or back button); stream errors spin forever | Blank screen for unknown barcodes |
| 8 | "View Full Report" | Visible whenever `currentVerdict` is set | Opens stale or error results |
| 9 | `getJsonField(...).toString()` | Missing paths become the text "null" | Brand "null", image URL "null" |
| 10 | Stored output names | `apiResultvf0` / `apiResult13q` vs the actual outputs | The DSL is not round-trippable (the APK works) |
| 11 | Two verdict calls per scan | v1 and v2; history stores v1 while the screen shows v2 | Double cost; history disagrees with the screen |
| 12 | ProductIntelligence layout | Non-scrolling Column with fixed 100 px items | Content can overflow |
| 13 | Verdict query | `goalsText ==` current goals, `limit 1`, no orderBy | Verdict disappears after the goals change |
| 14 | `flutterflow ai review moxis-one-x51584` | 12 × [R1] unreferenced component parameters | e.g. `TextField.onSubmit`: no typed search submit |

## 6. Fault table (scan to result)

Location → observed failure → demonstrated cause → repair → retest evidence. Retest evidence names a live trace id, or "mocked" for emulator tests. TEST_RESULTS.md has the live runs.

| Location | Observed failure | Demonstrated cause | Repair | Retest |
|---|---|---|---|---|
| `domain/scope.ts` (3be6091) | 099482480882 shown as "Not a cat or dog product" | Origin rule: not in OPFF + found in OFF + no species word → `human_food` | Classification from the product's own evidence. The database is provenance only. Three states (`scope-2.1.0`) | live trace `ef9fef99-921`, `89fe4039-a62`; mocked regression tests |
| `pipeline/scanJob.ts` `aiOk` | No label-image read or research for records in sister databases | `origin ∉ {off, obf, opf}` gate | Gate removed; enrichment for every product not affirmatively out of scope | live `ef9fef99-921` (front image read, research run) |
| `sources/research.ts` | Species adopted from a page matched by brand and name only | No identity check | Strong identity: barcode on the page or the same recipe in order (`research-1.6.0`) | live `ef9fef99-921`: Whole Foods cat pages 6/10 → nothing used |
| `sources/openFacts.ts` | "product found with a different product type" read as "not found"; all sister databases queried | Only `status` checked | `status_verbose` parsed: only the named database is asked; empty answers are failures | mocked + live |
| `pipeline/scanJob.ts` `sisterRecord` | An outage reported as "not found" | `allSettled` dropped rejections | Failures throw → retryable `source_unavailable` with the source named | mocked |
| `sources/labelImages.ts`, `research.ts`, `knowledge/explain.ts` | One outage blocked enrichment for 30 days | Technical failures stamped like results | Retried after 6 h (images, explanations) or 12 h (research); never stored as "not found" | mocked (`no permanent negative caching` suite) |
| `pipeline/facts.ts` `enrichmentFacts` | Research species signals lost at refetch | Signals not carried | Carried with their sources | mocked |
| `pipeline/scanJob.ts` refresh path | Scan left at "assessing" after a refresh error | `try/finally` without `catch` | Error restores the earlier status | mocked |
| `pipeline/scanJob.ts` writes | An older job's second update mixed into a newer result | Unconditional `update` | Transactions with the run id and `assessmentInputsAt` | mocked |
| claim / rules | A job killed by the timeout stayed "processing" | No lease, no retry path | Owner retry after 6 minutes without an update (rules + backend) | mocked (rules + pipeline) |
| `domain/score.ts` 1.x | A cat food with propylene glycol scored 72 "Good"; the score fell when data was merely missing | Concerns were point deductions; missing = 0 points | 2.0.0: quality over assessable components, coverage and range separate, a documented concern caps at 20 | mocked; live after deploy 6 (TEST_RESULTS.md) |
| `ai/verdict.ts` | A verdict quoting a wrong score passed; "great, high-quality" passed; "guaranteed analysis" rejected | Substring number check; narrow and wrong forbidden list | Score must be the score; whole-token numbers from stated facts; claim list widened; label term allowed | mocked; live `3dbc1cae-098`, `524c74f7-707` (AI verdicts used) |
| app (3be6091) | See §3 | — | See §3 | web build run, TEST_RESULTS.md |
