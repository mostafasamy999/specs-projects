# Spec Changelog — Merchant Orders App

Every change to `requirements.md`, `design.md`, or `tasks.md` is recorded here as a Change Request (CR), newest first.

IDs: `R<n>.<m>` = requirement · `D§<n>` = design section · `T<n>.<m>` = task.

---

## CR-004 — 2026-10-20 — Flutter project created, Firebase connected, Firestore deployed (T0.1, T0.2b, T0.2c)

**Request:** Execute T0.1, T0.2b, T0.2c; `<org>` = `mostafasamy`; keep the current Flutter version (no channel switch).

**Decision / done:**
- **T0.1** `flutter create --org com.mostafasamy --project-name merchant_orders --platforms android,ios` in `/Users/mostafasamy/StudioProjects/merchant_orders`.
  - Android ID `com.mostafasamy.merchant_orders`; **iOS bundle ID `com.mostafasamy.merchantOrders`**, because Apple doesn't allow `_` (user chose the Flutter default).
  - iOS deployment target 15.0 (`Podfile` `platform :ios, '15.0'` + 3× `IPHONEOS_DEPLOYMENT_TARGET`).
  - **Android minSdk = `flutter.minSdkVersion` (24), not 23:** Flutter 3.38's minimum is 24, and its Gradle migrator rewrites any hard-coded 16–23 back to `flutter.minSdkVersion` on every build.
  - **Flutter stays on 3.38.0** (detached tag, Dart `3.10.0-290.4.beta`) by user decision; the "stable channel" requirement is waived for now.
  - Only Firebase packages added; the rest of D§1.1 moves to T0.4.
- **T0.2b** Installed `firebase-tools` 15.34.0 (user logged in as `mostafasamy.dev@gmail.com`, Gemini declined). `flutterfire configure` (1.3.1) registered both apps and wrote `lib/firebase_options.dart`, `google-services.json`, `GoogleService-Info.plist`, the google-services Gradle plugin and the `flutter` section of `firebase.json`. Added `firebase_core` 5.0.0, `firebase_auth` 7.0.0, `cloud_firestore` 7.0.0. `main.dart` calls `WidgetsFlutterBinding.ensureInitialized()` + `Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform)`.
  - Android: `1:658495017371:android:851470e927dca09816d13e`
  - iOS: `1:658495017371:ios:96c4a81f3016720116d13e`
- **Android build fixes:** the `firebase-auth` 25.0.0 AAR has Kotlin 2.4 metadata → Kotlin Gradle plugin bumped `2.2.20 → 2.3.0`. Kotlin 2.3 turns `kotlinOptions.jvmTarget` into an error → moved to `kotlin { compilerOptions { jvmTarget.set(JvmTarget.JVM_17) } }`.
- **T0.2c** `.firebaserc` (default `merchant-orders-39dd1`), `firebase.json` (`flutter` section kept + `firestore.rules` / `firestore.indexes.json`), `firestore.rules` = D§5 byte-for-byte, `firestore.indexes.json` = 8 composite indexes from D§6 (`productIds` uses `arrayConfig: CONTAINS`). `products.stock ↑` left out because it is single-field/automatic.
  - Before deploy, the published Console rules were read back: same logic, only comments and blank lines differed. User approved, then ran `firebase deploy --only firestore`: rules released + indexes deployed, no errors.
- **Smoke test:** `flutter analyze` clean.
  - Android emulator (API 36): `FirebaseApp initialization successful` in the app process.
  - iOS simulator (iPhone 16 Pro, iOS 18.5): app renders (only possible after `initializeApp` completes), no exceptions. The native `I-COR000005 No app has been configured yet` log line is expected before Dart init.
- Git: the user had already created the repo (`main`, remote `github.com/mostafasamy999/merchantOrders`, private) with a first commit containing the generated + Firebase files.

**Affected:**
- Requirements: R14.2 (minSdk 23 → 24)
- Design: D§6 (`stock` note), D§10.1 (rules, indexes, apps)
- Tasks: T0.1 ✅ (packages beyond Firebase → T0.4), T0.2b ✅, T0.2c ✅, T0.4 (adds remaining D§1.1 packages)
- STATUS.md rewritten (IDs, toolchain, progress)

---

## CR-003 — 2026-10-20 — Firebase environment provisioned + session handoff

**Request:** Record the real Firebase setup and make the spec resumable in a new session; Flutter project goes in `/Users/mostafasamy/StudioProjects/`.

**Decision:**
- Firebase project `merchant-orders-39dd1` created on Spark (no billing). Email/Password on, Email link off. Firestore `(default)`, Standard, Native, `europe-west1`, production mode. Rules from D§5 published via Console. Analytics, Gemini, Storage not enabled. Verified in Console.
- Flutter project path: `/Users/mostafasamy/StudioProjects/merchant_orders`; Flutter **stable** channel; `<org>` for bundle ID still open.
- `flutterfire configure` must run inside the project root (earlier attempt failed with `FlutterAppRequiredException`).
- New `STATUS.md` = single source of current state and next steps.

**Affected:**
- New: `STATUS.md`
- Design: D§10.1 *(new)*
- Tasks: T0.1 (path, stable channel), T0.2 split into T0.2a ✅ / T0.2b / T0.2c; T2.6/T2.7 order fixed

---

## CR-002 — 2026-10-20 — No billing: images in Firestore, GPS-only location

**Request:** Product images are very small; location should be GPS only, not Google Maps.

**Decision:**
- Cloud Storage now requires the Blaze plan → dropped. Images stored as bytes in Firestore `productImages/{productId}` (separate from `products` so counter updates don't re-send image bytes); compress to ≤ 200 KB, rule cap 300 KB; `imageVersion` on product as cache key; product + image written in one batch.
- Google Maps SDK dropped (needs billing + API key). Location = device GPS (`geolocator`) + required address (prefilled by device reverse geocoding) + optional details; accuracy warning > 100 m.
- Merchant still opens locations in the **external** Google Maps app via URL (no key, no cost).
- Project runs on Spark with no billing account.
- Order items no longer snapshot an image URL.

**Affected:**
- Requirements: Intro, P3 row, Glossary (home location), Out of scope, R2 *(rewritten)*, R5.1, R5.2, R6.2, R6.6, R6.7, R9.6, R11.2, R11.3, R12.2, R12.3 (→ Phase 2), R13.6, R14.6, Assumptions 9–10 *(new)*
- Design: D§1, D§1.1, D§2, D§3.1, D§3.2, D§3.3, D§3.5 *(new)*, D§4.5, D§4.6, D§5 (productImages rules), D§5.1 (removed), D§7, D§8, D§9, D§10, D§11
- Tasks: T0.2, T0.3, T1.6, T2.2, T2.6, T4.3, T4.7, backlog

---

## CR-001 — 2026-10-20 — Negative stock (order when stock is 0)

**Request:** Offered products must stay orderable when stock is 0. If stock is 0 and 5 units are ordered, stock becomes −5. Customers can see stock.

**Decision:**
- `isActive` (offered) is the only gate for ordering; stock never blocks an order.
- Stock may go negative; `shortage = max(0, −stock)` shown on admin list and dashboard (sortable "what to buy" list).
- New admin action "receive stock" (`stock += qty`) + manual stock correction.
- Customers see positive stock only ("متوفر: n"); at ≤ 0 they see "متاح بالطلب".
- Max 99 units per product per order (selector no longer limited by stock).
- Checkout fails only if a product was hidden/removed → `ProductUnavailableException`.
- Concurrent orders on the same product all succeed; counters stay exact.

**Affected:**
- Requirements: Glossary (offered, stock, shortage), R6.1, R6.5, R6.8 *(new)*, R6.9 *(new)*, R7.1, R7.2, R8.2–8.5, R9.4, R9.5, R13.4, Assumptions 6–7 *(new)*
- Design: D§3.2, D§3.4, D§4.3, D§4.7, D§5 (`validOrderDelta`, product create rule), D§6, D§8, D§9
- Tasks: T2.4, T2.5, T2.7 *(new)*, T3.1, T3.4, T3.5, T5.1, T7.4

**Rejected / out of scope:** Handling a discontinued product with pending negative stock — explicitly ignored for MVP.

---

## CR-000 — 2026-10-20 — Baseline

Initial spec: R1–R14, D§1–§11, Phases 0–7.

Confirmed decisions: email/password auth (phone stored, no OTP) · customers auto-active, admins pending until approved in app or Firebase Console · admin reject added · first admin bootstrapped from Console · single merchant, multiple admins · one app with roles · Firebase only, no Cloud Functions (Spark plan) · Arabic only (RTL) · no FCM, no payments · customer cannot cancel · `activeQty` + `totalQty` counters on product · order snapshots customer home location · client-side counters accepted as MVP limitation.
