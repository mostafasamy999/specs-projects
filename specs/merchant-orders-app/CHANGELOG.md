# Spec Changelog — Merchant Orders App

Every change to `requirements.md`, `design.md`, or `tasks.md` is recorded here as a Change Request (CR), newest first.

IDs: `R<n>.<m>` = requirement · `D§<n>` = design section · `T<n>.<m>` = task.

---

## CR-007 — 2026-10-20 — Theme, Cairo font, RTL, Arabic strings (T0.5)

**Request:** Implement T0.5. Also: don't build/run iOS unless the change needs it (rule added to STATUS §6).

**Decision / done:**
- **Font:** with the user's OK, downloaded `Cairo[slnt,wght].ttf` (599,548 B) and `OFL.txt` from `github.com/google/fonts` (`ofl/cairo`) into `assets/fonts/` (`Cairo-Variable.ttf`). google/fonts only ships the variable font.
  - Declared as family `Cairo`. The OFL license is bundled and registered in `LicenseRegistry` (`main.dart`).
  - Variable font ⇒ `AppTheme` sets each text style's weight on the `wght` axis. Base `ThemeData` has no weights until `MaterialApp` merges the locale geometry, so `Typography.tall2021` (Arabic = tall script) is merged first. A test caught this.
  - Use `TextStyle.withCairoWeight()` for custom weights.
- **Theme** `core/theme/app_theme.dart`: Material 3, `ColorScheme.fromSeed(0xFF00695C)` (teal — placeholder brand color, adjustable).
  - `AppColors` status colors per D§3.4: pending amber `#F59E0B`, inProgress blue `#2563EB`, done green `#16A34A`, cancelled red `#DC2626`, plus shortage red.
- **Locale / RTL** `lib/app.dart`: `locale: Locale('ar')`, `supportedLocales: [ar]`, `GlobalMaterialLocalizations.delegates` (Material + Cupertino + Widgets). RTL comes from the locale.
- **Strings** `core/constants/app_strings.dart`: screen titles, nav labels, status labels, temporary dev links. All inline Arabic in screens/router moved there.
  - `appName = 'طلبات التاجر'` is provisional — the final Arabic name is T7.5.
- **Tests:** 5 pass — splash, Arabic + RTL (`Directionality.rtl`, Arabic `backButtonTooltip`), Cairo + `wght` axis on the theme, all routes, path params.
- **Verified:** `flutter analyze` clean.
  - Android emulator: AppBar title right-aligned, Cairo rendering, bottom nav ordered right-to-left.
  - iOS not run (no iOS-specific change).

**Affected:**
- Design: D§1.1 (font row)
- Tasks: T0.5 ✅
- STATUS.md (progress, conventions, iOS testing rule)

---

## CR-006 — 2026-10-20 — Packages, folder structure, DI, router skeleton (T0.4)

**Request:** Start T0.4.

**Decision / done:**
- **Packages (D§1.1):** `flutter_bloc` 9.1.1, `equatable` 3.0.0, `get_it` 9.3.0, `go_router` 17.2.3, `geolocator` 14.0.2, `geocoding` 5.0.0, `url_launcher` 6.3.2, `image_picker` 1.2.2, `flutter_image_compress` 2.5.1, `hydrated_bloc` 11.0.0, `intl` 0.20.2, `flutter_localizations` (sdk).
  - Pub reports 38 newer versions that don't fit the Flutter 3.38 constraints — expected while staying on 3.38.
  - `hydrated_bloc` storage init is deferred to T3.1 (cart). Test-only packages (`bloc_test`, `mocktail`) come with Phase 7.
- **Structure (D§2):**
  - `lib/app.dart` (`MaterialApp.router`), `lib/core/di/injection.dart`, `lib/core/router/{app_routes,app_router}.dart`, `lib/core/widgets/{placeholder_screen,nav_shell}.dart`.
  - `lib/features/<feature>/presentation/screens/` for session, auth, products, cart, orders, dashboard, admin_requests, customers, profile (23 placeholder screens).
  - `data/` and `domain/` folders are created with the first model/repository (git doesn't track empty dirs). `location/` arrives with T1.6.
- **DI:** `get_it` `sl` with lazy singletons for `FirebaseAuth`, `FirebaseFirestore`, `GoRouter`. Lazy, so widget tests don't touch Firebase. `main.dart` calls `configureDependencies()` after `Firebase.initializeApp`.
- **Router:** `initialLocation: /splash`.
  - Shared routes: login (+ forgot-password), register (+ customer / admin), pending-approval.
  - Two `StatefulShellRoute.indexedStack` shells with `NavigationBar` (D§4.1):
    - customer: Products · Cart · My Orders · Profile
    - admin: Dashboard · Orders · Products · More[Requests, Customers, Profile]
  - Detail routes with path params (`:productId`, `:orderId`, `:customerId`, `:productId/edit`, `new`).
  - **No `redirect` yet** — that is T1.4. The splash placeholder has temporary dev links.
  - The admin "More" screen lives in `features/dashboard` (D§2 had no home for it).
- Arabic placeholder titles are inline for now; T0.5 moves them to `app_strings.dart`. Still LTR until T0.5.
- **Tests:** `test/widget_test.dart` replaced the counter test — app starts on splash, all 24 routes build with the right AppBar title, path params reach the screen.
- **Verified:** `flutter analyze` clean · `flutter test` 3/3 pass · Android emulator: splash → admin shell, bottom nav renders · iOS simulator: launches with the new pods, no errors.

**Affected:**
- Design: D§2 (dashboard also holds the admin "More" screen)
- Tasks: T0.4 ✅
- STATUS.md (packages, progress, next steps)

---

## CR-005 — 2026-10-20 — Platform permissions & url_launcher config (T0.3)

**Request:** Start Phase 0.3.

**Decision / done:**
- **Android `AndroidManifest.xml`:**
  - `ACCESS_FINE_LOCATION` + `ACCESS_COARSE_LOCATION`.
  - `<queries>`: `VIEW` + `https` (Google Maps links, R11.3) and `DIAL` + `tel` (tap-to-call, R11.2 — added beyond D§10, which only listed `https`).
  - **No `CAMERA` / storage permissions:** `image_picker` uses the system camera intent and the Android photo picker. Declaring `CAMERA` without requesting it at runtime would break the camera intent.
- **iOS `Info.plist`:** Arabic strings —
  - `NSLocationWhenInUseUsageDescription`: «نحتاج الوصول إلى موقعك لتحديد عنوان المنزل حتى يصلك الطلب.»
  - `NSCameraUsageDescription`: «نحتاج الوصول إلى الكاميرا لتصوير صور المنتجات.»
  - `NSPhotoLibraryUsageDescription`: «نحتاج الوصول إلى الصور لاختيار صور المنتجات.»
  - `LSApplicationQueriesSchemes` = `comgooglemaps`, `tel`.
- No packages added (they belong to T0.4); no Maps API key.
- Verified: `plutil -lint` OK; `flutter build apk --debug` and `flutter build ios --simulator` succeed; permissions present in the built APK (`aapt2 dump permissions`) and the built `Info.plist`.

**Affected:**
- Design: D§10 steps 3–4
- Tasks: T0.3 ✅
- STATUS.md progress

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
