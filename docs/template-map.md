# Purchased template — verified map (Purrbi V2 development, pulled 2026-10-28)

Paths relative to the fft workspace. Source: read-only mapping pass over all pages/components (file:line references are to the 2026-10-28 baseline snapshot in `flutterflow/baseline-2026-10-28/`). [inf] = inference.

## Key facts
- No backend, auth, API calls, payments, barcode decoding, AdMob declaration or AI integration exist. Login, sign-up, OTP, password reset, purchase, subscription, cancellation, scan analysis, results and AI chat are all simulated.
- Only persisted user data: `favouriteDataList`, `searchList`, `userDetail` edits, `modeIndex` (appearance), flags `isLogin`, `isIntro`, `isPro`, `isAdsTap`.
- Lists never written anywhere: `MainDataList`, `RecentidentifierList`, `BolgDataList`, `categorieDataList`, `introList`, `faqList`, `notificationsList`, `randomChat`, `mainChatModelList`, `historyList`, `messageList` (all `= []`).

## Start flow
- `SplashPage` (only `initial: true`): sets dark mode from `modeIndex`; loops while offline; ≈4 s of waits; then `isIntro ? (isLogin ? (isPro ? HomeMainPage : PremiumPage) : WelcomeScreenPage) : OnboardingPage` (splash_page.dart:42-54). A signed-in non-Pro user lands on the paywall at every launch.
- `OnboardingPage` (PageView over `introList`) → `PhotoTipsPage` → `WelcomeScreenPage` (Create account / Sign in; Google/Apple tiles and Terms link have no actions).
- `SignInPage`: fields pre-filled from persisted `userDetail` (defaults `bakerpatrick@watson.com` / `123456`, schema.dart:102-108). "Log in" sets `isLogin = true`, overwrites stored email/password with whatever was typed, sets `isPro = false`, pushes `PremiumPage` (sign_in_page.dart:195-211). Nothing is compared.
- `SignUpPage` → `isLogin = true` + `userDetail` from fields → `VerificationsPage` (PIN never checked) → `PremiumPage(isEmpty: '')` (String passed to a bool parameter).
- Forgot → ForgotVerifications (no code check) → ResetPassword (checks new == confirm only, stores nothing). ChangePassword: same placeholder.
- Logout / delete account → `DataClearBlock` (clears flags/lists, not `userDetail`).

## Navigation
- `HomeMainPage` is the shell: `ConditionalBuilder` on `appState.homePageIndex` (0 Home, 1 Explore, 2 History, else Profile) + custom bottom bar Row: Home · Explore · centre circle → `AIAssistantPage` · My scans · Profile (home_main_page.dart:10-231). No `BottomNav` in settings.dart.
- Detail pages "return" by pushing a new `HomeMainPage(allowBack: false)`.
- Routes: all pages print as `route: '/'` in fft; generated code gives each page a distinct path (`/splashPage`, …, 48 distinct) plus `/` → Splash (`_initialize`). **No real route conflict.**

## Scan / result flow (all simulated)
- Entry: Home hero "Tap to start scanning", "Scan now", Result "Find another" → `IdentifierPage`.
- `IdentifierPage`: ad gate when `isAdsTap >= 3` (rewarded ad with Google **test** unit ids; `google_mobile_ads` not declared), else `UploadData` gallery/camera → `AnalysisResultPage(imageUpload)`. No barcode decoding.
- `AnalysisResultPage`: 10 × `Wait(1000)` progress loop, then `ResultPage(title: 'Bengal Health & Beauty')` (fixed).
- `ResultPage`: uploaded image + `Card1`..`Card4` with hardcoded tea/retail data ('Canis latrans', '94% Match', '₹145', 'Brooke Bond Red Label', per-100 ml nutrition, cardamom/ginger…). "Save result" saves nothing.
- `ResultDetailsPage` / `HistorySaveDetailsPage`: same cards, opened from lists.
- History tab (`HistoryComponent`) shows `RecentidentifierList` (never written). Favourites (`AddOrRemoveIdentificationFavourite`) is the only working list.

## Fake features and entry points
- Premium chain: PremiumPage ($40/yr, $9/mo, $4/wk) → PaymentMethodPage (Stripe/Razorpay/PayPal radios) → ReviewSummaryPage "Checkout" (1 s wait → `isPro = true`) → hardcoded success dialog. MySubscription*/SelectReason/SubscriptionCancel/MyEmptySubscription/PaymentFailed are hardcoded. Entry points: splash, sign in, verification, Home "PREMIUM" chip, Profile upsell card, renew.
- AI chat: AIAssistantPage → ChatPageComponent replies with a random string from an empty list after 2 s. Entry: centre nav button, Home "AI chatbot".
- Ads: IdentifierPage gate + `initAds` / `rewardedInterstitialAds` custom actions.
- Blog, Explore (Popular/Trending/Category/CategoprieList), Notifications, FAQ: bound to never-written lists. Rate/Share settings rows have no actions. DemoPage: asset gallery.

## Assets from other FlutterFlow projects
| Where | Project | Asset |
|---|---|---|
| settings.dart:13,15 (app icon), mini_logo.dart:7 + ~90 UI images | a-i-barcode-identifier-app-ahbvz7 (template source [inf]) | logos, illustrations, demo images |
| settings.dart:20 | aura-cal-app-mlzal5 | error_image.png |
| icons.dart:7 | yoga-pose-76whl4 | custom icon font `YogaPoseIdentifier.ttf` (all custom icons) |
| profile_component.dart:15, edit_profile_page.dart:41 | a-i-tattoo-generator-app-5wmwuy | user avatar |
| welcome/sign-in/sign-up | chirag-ev-point-app-px5gfy | google_ic.svg |
| payment pages | dog-scan-a-i-4k1iqf | stripe/razorpay/paypal svgs |
| no_internet_component.dart:4-5 | main-project-dark-theme-kpiqrs | No_Wifi.json (Lottie) |

## Off-domain text
"AI Barcode Scanner" / "AI barcode identifier" / "AI Animal Barcode Identifier" (splash, welcome, legal pages, settings footer), watch-identifier copy (select_reason, tips sheet, `support@watchai.app`), tattoo feedback email (`tattoo@gmail.com`), animal-footprint copy (identifier, analysis, chat, blog, about/terms), Indian retail/tea data in Card1-4, placeholder persona (Baker Patrick, +91, 'Member since march 2026').

## Shared components
- `MainAppbar(title, isBack, backAction, isEdit, editAction, isShare, shareAction)` on 31 pages; a back arrow always shows (`safePop` unless `isBack`).
- `CenterAppbar(title)` on Explore/History/Profile tabs. `ScanComponent(detail: MainDataModel)` and `RecentIdentifier(detail: RecentiModel)` list rows with hardcoded fallbacks and an always-"Verified" pill. `RowComponent` section header. `MiniLogo` (template logo, 7 pages).

## Profile / settings / legal
ProfileComponent: My profile, subscription, change password, favourites, notifications (bug: switches to My scans tab), my scans, help & support, settings, appearance (real), log out. SettingsPage: about, terms, rate (no action), share (no action), privacy, FAQ, feedback (`tattoo@gmail.com`), delete account (clears local flags only, then claims data was "permanently removed"). Legal pages are three clones describing "AI Animal Barcode Identifier", "Last updated: March 2026".

## Repurposing plan (decided)
- Home → `HomeMainPage` shell + `HomeComponent` (centre nav button becomes Scan; stats/greeting replaced with active pet + recent results).
- Scan → `IdentifierPage` (barcode-first via `BarcodeScanner`, manual entry, photo recovery). Ad gate removed.
- Processing → `AnalysisResultPage` driven by real job status, not a timer.
- Results → `ResultPage` bound to `users/{uid}/scans/{scanId}`; Card1-4 replaced by evidence-backed sections.
- Pets → onboarding pages (`OnboardingPage`/`PhotoTipsPage` slots) + `MyProfilePage`/`EditProfilePage` patterns.
- History/Favorites → `HistoryComponent` pills (History / Saved) bound to scans.
- Settings/Help/Legal → existing pages with Purrbi copy.
- Hidden from active navigation: AI chat, Blog, Explore catalog, Notifications, Premium/payment chain, DemoPage, ad actions.
