# Purrbi prototype — design cues

Extracted 2026-10-28 from the owner's React prototype `pet-product-scanner_1.jsx` (2329 lines, read in full). `Lnnn` = line in that file. *Inference* marks interpretation. The prototype calls itself "Pet Product Scanner" ("working title"); every product, brand, recall, source and community report in it is fictional.

## Theme tokens (L26-66)
- cream `#FCF7EE` page · card `#FFFFFF` · ink `#2A3038` text · soft `#68727E` secondary · line `#EFE7DA` hairlines
- teal `#0E8A80` primary / tealSoft `#E0F2EF` · aqua `#35B8A8` · green `#3E9B6E`/`#E4F4EA` positive · coral `#EE7A5C`/`#FDEAE2` caution/warm · sun `#E9A83B`/`#FBF0D8` mild caution · alert `#C24A38`/`#F9E4DF` (official alerts only) · slate `#8A93A0`/`#EEF0F2` unknown
- shadow `0 6px 22px rgba(42,48,56,0.07)`; rounded font stack (ui-rounded, SF Pro Rounded, Quicksand…)
- Result states: Strong fit (green) · Generally suitable (teal) · Review details (sun) · Possible mismatch (coral) · Official alert (red) · Information incomplete (slate). Ingredient statuses: Positive / Mild caution / Documented concern / Unknown.
- The prototype's score mixes pet factors into one number (start 62, species/life-stage/sensitivity adjustments, caps). **Purrbi does not reuse this**: the brief requires a pet-independent product score and a separate personal verdict.

## Navigation (L2164-2328)
- Bottom bar: Home · Scan (raised centre teal button ~64px, glow `0 8px 18px rgba(14,138,128,0.4)`) · Discover · Community · Profile. Active teal, inactive slate; 10px extrabold labels.
- Hidden on welcome/onboarding/add-edit pet/processing. Detail screens (result, ingredients, nutrition, sources, brand) keep the bar.
- Sheets: pet switcher, "How this was calculated", report, compare, ingredient detail, source record.
- Start: splash with logo 52px, "Fetching your crew…"; onboarded → Home else Welcome. Finishing onboarding opens Scan.

## Screens (top → bottom)
- **Welcome**: hero illustration (logo motif) · logo + name · "Know what's in their bowl." (32px) · "Scan cat and dog food, treats, and supplements for simple label facts, official alerts, and a personalized product snapshot." · primary "Meet my pet" · footer "Educational information only. Not veterinary advice."
- **Home**: pet switcher (avatar 46px + "Switch pet ▾") + logo · "What are we checking for {pet}?" (26px) · full-width teal scan card (ScanLine 28px, "Scan a product", chevron, glow `0 10px 26px rgba(14,138,128,0.35)`) · Official alerts card (only when active, 1.5px red border) · Recent scans (horizontal 150px cards, status badge; empty: "No scans yet" / "Scan a bag … first snapshot.") · Saved products · tip card ("Good to know").
- **Scan**: "Scan for {pet}" · (prototype order: demo shortcuts, camera, code entry, catalog search, label photo). Camera states idle / starting / live / unavailable with honest copy ("we won't pretend it scanned"). Code entry: numeric field + "Go". Label photo: preview + disclaimer (no real OCR in prototype).
- **Processing**: product art pulsing, 5-step checklist (Reading product → Checking label facts → Checking official alerts → Comparing with pet profile → Preparing simple verdict); in the prototype this is only a timer. **Purrbi must drive it from real job status.**
- **Result**: top bar "Scan result" + bookmark · main card (art 72px, name 18px extrabold, brand link, tags: category · For {pet} · confidence) · score ring 116px + status badge + "How this was calculated" — **or**, when an official alert is active, a red-bordered alert panel replaces the ring · condition reminder card · "Snapshot" (≤5 verdict sentences, 15px) · "Good to know" (green dots) and "Review" (sun dots), each finding with an evidence tag · Official status · Data confidence · 2×3 button grid (ingredients, nutrition, sources, save, compare, report) · footer disclaimer.
- **Ingredients**: label order, tap for sheet (status chip, evidence tag, why, "Why this status … Last reviewed"). Sensitivity matches get a coral border.
- **Nutrition & label facts**: 12 expandable rows (species, life stage, adequacy statement, protein min, fat min, fiber max, moisture max, calories, feeding directions, package size, manufacturer, record reviewed).
- **Sources**: cards (type heading, status tag, title, published/event/last checked, summary, open record).
- **Profile/settings**: pets list (select/edit/delete), activity (history, saved), preferences (notifications, data & privacy), about (methodology, sources policy, legal, report incorrect information).
- **History** / **Saved**: product rows with date + "for {pet}"; empty states with an action.
- Demo-only screens: Discover (catalog search by fit), Community (owner reports), Premium ($7.99/mo, $69/yr), Brand timeline. **Not part of Purrbi's first release.**

## Onboarding (L778-963) — 8 steps, progress bar, back, no skip
1. Dog / Cat tiles (required) 2. avatar colour or photo, name (required), breed (optional), sex (optional) 3. age in years (decimals) + life-stage chips suggested from age 4. weight with lb/kg + activity 5. goals (multi-select, wellness preferences, not treatment) 6. owner-recorded allergies/sensitivities chips + custom 7. ingredients to avoid (preference only) 8. diagnosed-condition toggle with vet disclaimer.
Purrbi changes (brief §6): fewer steps (4), save/resume, conditional questions (large-breed growth, pregnancy/lactation), "none reported" vs "not sure" vs "not provided", normalised weight + original unit, species-appropriate life stage.

## UI primitives (L535-743)
- Button: radius 16, weight 600, min height 48 (small 40), padding 20×12, icon 19. Kinds: primary teal/white, secondary tealSoft/teal, ghost, quiet (white, 1.5px line border), danger (alertSoft/alert).
- Card: white, radius 24, shadow as above, padding 16 (also 12/14/20/24).
- Chip: pill, min height 36, 1.5px border; off = soft fill + coloured text, on = solid + white.
- Tag/badge: pill, 10×4 padding, 12px bold, 12px icon. Evidence tag: 10px bold uppercase, radius 4, slate on slateSoft.
- Score ring: 116px, stroke 10, track `#EFE7DA`, arc in state colour, score 30px extrabold over "PRODUCT FIT" 10px.
- Sheet: radius 24 top, cream, max 75% (88% tall), title 18px extrabold, round white close.
- Input: radius 16, padding 16×12, 1.5px line border, 2px teal focus ring. Field label 14px bold, hint 12px soft, error 12px semibold red.
- Section title: 14px extrabold uppercase, letter-spacing 0.05em, soft colour, 24px above / 8px below.
- Product row: card padding 12, art 52px, name 15px bold, "{brand} · {form}" 12px.
- Disclaimer card: radius 16, 13px medium, Info icon; sunSoft/#8a6414 (alert variant alertSoft/alert).

## Typography
Sizes: 32 welcome · 26 home heading · 24 screen titles · 18 bar/sheet titles, product name · 16 buttons/inputs · 15 item names, verdict sentences · 14 body, chips · 13 disclaimers · 12 captions/tags/errors · 11 meta · 10 evidence tags, tab labels. Weights: 800 titles/scores, 700 names/labels, 600 buttons/chips, 500 body. Line heights 1.25 titles, 1.625 body. *Inference for FlutterFlow:* "Nunito" or "Quicksand" (Google Fonts) is the closest available rounded face.

## Icons
lucide (Home, ScanLine, Compass, Users, User, Camera, Search, ImagePlus, CheckCircle2, Eye, AlertTriangle, Info, ShieldCheck, Dog, Cat, Bone, Fish, Pill, PawPrint, Bookmark, Flag…). In FlutterFlow use the nearest Material icons.

### Logo (owner's original "paw-in-magnifier" mark, L552-563), as plain SVG
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <circle cx="21" cy="21" r="15" fill="#E0F2EF" stroke="#0E8A80" stroke-width="3.4"/>
  <rect x="32.2" y="30" width="13" height="6.4" rx="3.2" transform="rotate(45 32.2 30)" fill="#0E8A80"/>
  <ellipse cx="21" cy="24.6" rx="4.9" ry="4" fill="#0E8A80"/>
  <circle cx="15.2" cy="18.6" r="2.3" fill="#0E8A80"/><circle cx="20" cy="15.6" r="2.3" fill="#0E8A80"/>
  <circle cx="24.9" cy="16.6" r="2.3" fill="#0E8A80"/><circle cx="27.9" cy="21" r="2.1" fill="#0E8A80"/>
  <path d="M36 10.5c1.6-2.4 5-1.4 5 1.2 0 1.9-2.6 3.6-5 5-2.4-1.4-5-3.1-5-5 0-2.6 3.4-3.6 5-1.2z" fill="#EE7A5C"/>
</svg>
```
Transparent background; an app icon needs a background tile and padding.

## Tone of voice
Warm, plain, never alarmist, never says "safe": "Know what's in their bowl." · "None of your recorded sensitivities or avoided ingredients were detected on the label." · "An unfamiliar ingredient name is not evidence of harm. 'Unknown' is an honest answer." · "Missing information earns no points, but is not treated as a fault." · "No Product Fit score is shown while an official alert is active." · "This information is educational and should not replace guidance from your veterinarian."

## Demo-only in the prototype — do not present as real
Fictional catalog/brands/recalls/sources; hard-coded community stats and moderation; simulated premium; report sheet stores nothing; label "extraction" has no OCR; processing is a timer; AI rewording calls api.anthropic.com from the browser without a key; demo pet "Biscuit"; prototype banner.

## Accessibility notes
Reduced motion honoured only in processing/premium; focus rings on controls; labelled icon buttons; sheets as modal dialogs; status ring read as "Product Fit {n} out of 100". Gaps: nested toggle inside a card button, no aria-expanded on nutrition rows, small icon targets (~31-39px), sheets don't trap focus.
