# Status & Session Handoff — Merchant Orders App

Read this first in any new session. Then read `requirements.md` → `design.md` → `tasks.md` → `CHANGELOG.md`.

_Last updated: 2026-10-21 (CR-038)_

## 1. Where things live

| What | Path / value |
|---|---|
| Spec folder | `/Users/mostafasamy/work/specs-projects/specs/merchant-orders-app/` |
| Flutter project | `/Users/mostafasamy/StudioProjects/merchant_orders` (git, branch `main`, remote `https://github.com/mostafasamy999/merchantOrders.git` — private) |
| Dart package name | `merchant_orders` |
| Android application ID | `com.mostafasamy.merchant_orders` |
| iOS bundle ID | `com.mostafasamy.merchantOrders` (Apple forbids `_` in bundle IDs — CR-004) |
| Platforms | Android + iOS only |
| Android `minSdk` | `flutter.minSdkVersion` = **24** (Flutter 3.38 minimum; 23 is auto-migrated away — CR-004) |
| iOS deployment target | **15.0** (`Podfile` + all 3 `IPHONEOS_DEPLOYMENT_TARGET` in `project.pbxproj`) |

## 2. Firebase environment (provisioned & verified 2026-10-20)

| Item | Value |
|---|---|
| Project name | `merchant-orders` |
| Project ID | `merchant-orders-39dd1` |
| Project number | `658495017371` |
| Plan | **Spark (no-cost), no billing account** — never upgrade |
| Auth | Email/Password **enabled**; Email link (passwordless) **off**; no other providers |
| Firestore | Database `(default)` · Standard edition · Native mode · **`europe-west1` (Belgium)** · production mode |
| Security Rules | **Live: CR-004 version** (deployed 2026-10-20). **Repo: CR-034 version** (users CR-019, products/productImages CR-025, orders create CR-034 — tightened 2026-10-21, not deployed yet). |
| Indexes | **Deployed** 2026-10-20 — 8 composite indexes from `design.md` §6 (`products.stock` is single-field/automatic, not in the file) |
| Cloud Storage / Analytics / Gemini | Not enabled (by design) |
| Registered apps | Android `1:658495017371:android:851470e927dca09816d13e` (`com.mostafasamy.merchant_orders`) · iOS `1:658495017371:ios:96c4a81f3016720116d13e` (`com.mostafasamy.merchantOrders`) |
| Data | Empty — collections are created by the app |
| First admin | **Not bootstrapped yet** (task T1.10) |

## 3. Local toolchain (user's Mac, verified 2026-10-20)

| Tool | Version / note |
|---|---|
| Flutter | **3.38.0** (detached HEAD at tag `3.38.0`, channel shows `[user-branch]`), Dart `3.10.0-290.4.beta`. User decided to keep this version instead of switching to stable (CR-004). |
| Firebase CLI | `firebase-tools` 15.34.0 (npm global, `/opt/homebrew`); logged in as `mostafasamy.dev@gmail.com` |
| FlutterFire CLI | 1.3.1 (1.4.1 available — not updated; its update prompt blocks non-interactive runs) |
| Node / npm | v26.0.0 / 11.12.1 |
| Xcode / CocoaPods | 26.6 / 1.16.2 |
| Packages | `connectivity_plus` 7.3.1 · `firebase_core` 5.0.0 · `firebase_auth` 7.0.0 · `cloud_firestore` 7.0.0 · `flutter_bloc` 9.1.1 · `equatable` 3.0.0 · `get_it` 9.3.0 · `go_router` 17.2.3 · `geolocator` 14.0.2 · `geocoding` 5.0.0 · `url_launcher` 6.3.2 · `image_picker` 1.2.2 · `flutter_image_compress` 2.5.1 · `hydrated_bloc` 11.0.0 · `intl` 0.20.2 · `flutter_localizations` (sdk) |
| Android build | Kotlin Gradle plugin **2.3.0** (needed by `firebase-auth` 25.0.0, compiled with Kotlin metadata 2.4) · `kotlin { compilerOptions { jvmTarget = JVM_17 } }` (old `kotlinOptions.jvmTarget` is an error in Kotlin 2.3) · AGP 8.11.1 · Gradle 8.14 |
| Test devices | Android emulator `Medium_Phone_API_36.0` · iOS simulator iPhone 16 Pro (iOS 18.5) |
| Disk | ~83 GB free |

- `flutterfire configure` **must run inside the Flutter project root**. It regenerates `android/app/build.gradle.kts`, so re-check custom edits afterwards.
- First iOS build takes about 10 min (`pod install` about 3.5 min + Firestore compile about 7 min).

## 4. Progress

| Task | State |
|---|---|
| T0.1 Create Flutter project | ✅ done 2026-10-20 (CR-004) |
| T0.2a Firebase project + Auth + Firestore + rules (Console) | ✅ done 2026-10-20 |
| T0.2b `flutterfire configure` + `firebase_options.dart` + init in `main.dart` | ✅ done 2026-10-20 (CR-004) |
| T0.2c `firebase.json` / `.firebaserc` / `firestore.rules` / `firestore.indexes.json` in repo + deploy | ✅ done 2026-10-20 (CR-004) |
| Smoke test | ✅ `flutter analyze` clean; Android: `FirebaseApp initialization successful`; iOS: app renders after `initializeApp`, no exceptions |
| T0.3 Permissions (Arabic strings) + url_launcher queries | ✅ done 2026-10-20 (CR-005) |
| T0.4 Packages + folder structure + `get_it` DI + `go_router` skeleton | ✅ done 2026-10-20 (CR-006) |
| T0.5 Theme (Cairo variable font), RTL, `ar` locale, status colors, `app_strings.dart` | ✅ done 2026-10-20 (CR-007) |
| T0.6 Core widgets + `OrderStatus` enum | ✅ done 2026-10-20 (CR-008) |
| T0.7 `Failure` / `mapFirebaseError`, validators, formatters (ar_EG), Arabic normalizer | ✅ done 2026-10-20 (CR-009) |
| T0.8 Firestore offline cache (100 MB) + `ConnectivityService` (`connectivity_plus`) | ✅ done 2026-10-20 (CR-010) — **Phase 0 complete** |
| T1.1 `UserEntity` / `UserModel` + `GeoLocation` / `GeoLocationModel` + `FirestorePaths` | ✅ done 2026-10-21 (CR-011) |
| T1.2 `AuthRepository` + `AuthRepositoryImpl` (rollback, online check, 20 s profile-write timeout) | ✅ done 2026-10-21 (CR-012) |
| T1.3 `SessionCubit` + `SessionState` (+ `authUidChanges` / `watchProfile` / `isRegistering` on `AuthRepository`) | ✅ done 2026-10-21 (CR-013) |
| T1.4 Router `redirect` + `refreshListenable` (`sessionRedirect`, `StreamListenable`) | ✅ done 2026-10-21 (CR-014) |
| T1.5 Splash, Login, Forgot password, Choose account type + `SubmitCubit` | ✅ done 2026-10-21 (CR-015) |
| T1.6 `LocationRepository` + `LocationCaptureSection` + `AddressTile` + `MapsLinks` | ✅ done 2026-10-21 (CR-016) |
| T1.7 Customer registration + `RegistrationFields` (+ GPS-provider fallback, Android address fix) | ✅ done 2026-10-21 (CR-017) |
| T1.8 Admin registration + Pending approval screen (server Refresh via `fetchProfile`) | ✅ done 2026-10-21 (CR-018) |
| T1.9 Users rules tightened (`firestore.rules` + D§5) | 🟡 written + compiled (dry run) 2026-10-21 (CR-019) — ⏳ **user must deploy** |
| T1.10 Bootstrap first admin + verify routing for all states | ⏳ **user** — checklist in §5a (after deploying the CR-019 rules) |
| T2.1 `Product` / `ProductModel` / `ProductRepository` (batch create/update, receiveStock) | ✅ done 2026-10-21 (CR-020) |
| T2.2 Image pick + `ProductImageCompressor` + `ProductImageCache` + `ProductImage` | ✅ done 2026-10-21 (CR-021) |
| T2.3 Admin product form + `ProductFormCubit` (stock written only when corrected) | ✅ done 2026-10-21 (CR-022) — device check after T1.10 |
| T2.4 Admin products list + `ProductListCubit` (on-device search) | ✅ done 2026-10-21 (CR-023) — device check after T1.10 |
| T2.5 Customer grid + product details + `QuantitySelector` / `StockText` (add-to-cart in T3.1) | ✅ done 2026-10-21 (CR-024) — device check after T1.10 |
| T2.6 Products + productImages rules tightened (`firestore.rules` + D§5) | 🟡 written + compiled 2026-10-21 (CR-025) — ⏳ **user must deploy** |
| T2.7 Receive stock dialog (+ manual correction from T2.3) | ✅ done 2026-10-21 (CR-026) — **Phase 2 code complete** |
| T3.1 `CartCubit` (hydrated, per uid) + add-to-cart wired | ✅ done 2026-10-21 (CR-027) |
| T3.3 `OrderEntity` / `OrderModel` | ✅ done 2026-10-21 (CR-028) |
| T3.4 `OrderRepository.placeOrder` (pre-check + transaction) | ✅ done 2026-10-21 (CR-029) |
| T3.2 Cart + Checkout screens + `CheckoutCubit` + cart badge | ✅ done 2026-10-21 (CR-030) |
| T3.5 Unavailable products removed from the cart + dialog | ✅ done 2026-10-21 (CR-031) |
| T3.6 My orders + `OrderListCubit` / `OrderListView` / `OrderTile` (live paging) | ✅ done 2026-10-21 (CR-032) |
| T3.7 Order details + `StatusTimeline` (shared `OrderDetailsView`) | ✅ done 2026-10-21 (CR-033) |
| T3.8 Orders rules tightened + cart cap 50 | 🟡 written + compiled 2026-10-21 (CR-034) — ⏳ **user must deploy** — **Phase 3 code complete** |
| T4.1 Admin shell: pending badge, More menu, logout (+ profile stand-in) | ✅ done 2026-10-21 (CR-035) |
| T4.2 Admin orders list (`watchAll`, chip pending count) | ✅ done 2026-10-21 (CR-036) |
| T4.3 Admin order details (call, navigation) | ✅ done 2026-10-21 (CR-037) |
| T4.4 `changeStatus` transaction + status actions + cancel dialog | ✅ done 2026-10-21 (CR-038) |
| Everything from T4.5 onward | ⬜ not started |

## 5. Next session — exact order

1. **User action:** in `/Users/mostafasamy/StudioProjects/merchant_orders` run `firebase deploy --only firestore:rules` (covers CR-019 + CR-025 + CR-034; deploys from Claude Code are blocked by its permission check). Then T1.10 (checklist §5a). Phase 2–3 screens still need a device check once an admin and a customer exist (D§9 QA list: two devices, concurrent orders on a stock-0 product, hide while in cart).
2. Then Phase 4 (T4.1 admin shell). Reuse from Phase 3: `OrderListCubit` / `OrderListView` / `OrderTile` (admin query: `status ==` + `createdAt`↓, index exists), `OrderDetailsView(customerSection:, directions: true, actions:)`, `OrderModel.changeToMap` for `statusHistory` (client time, `arrayUnion`). Tests: `useFakeOrders()` + `test/helpers/order_fixtures.dart`.
3. Conventions from T1.3:
   - `sl<SessionCubit>()` is an app-wide lazy singleton — nothing creates it yet. T1.4 must read it (e.g. in `createRouter` and a `BlocProvider.value` in `app.dart`) so it starts at launch.
   - Route by `state.status` (`SessionStatus.unknown` → splash, `unauthenticated` → login, `customer`, `adminActive`, `adminPending`). There is no `rejected` status: those are signed out and arrive as `unauthenticated` with `state.message`.
   - The login screen shows `state.message` once (SnackBar) and calls `clearMessage()`.
   - Logout buttons call `SessionCubit.signOut()` (not the repository directly). The pending screen's Refresh calls `refresh()`.
   - During registration the state stays `unauthenticated`, so the redirect must allow `/register/**` routes while unauthenticated — otherwise the register screen is thrown away mid-registration.
4. Conventions from T1.2:
   - Use `sl<AuthRepository>()`. Its methods throw raw errors; cubits call `mapFirebaseError(e).message` for the UI. Nothing is returned — routing after sign-in/registration comes from the session (T1.3).
   - The repository already calls `ensureOnline()` (not for `signOut`) and converts phone digits to Western; screens don't repeat that.
   - A failed profile write deletes the new Auth user and throws `RegistrationFailedException` («تعذر إكمال إنشاء الحساب، حاول مرة أخرى»). If the delete also fails it signs out; that orphan Auth user has no profile, so the session must treat "signed in, no `users/{uid}`" as R4.4 (sign out + «هذا الحساب غير موجود»).
   - Repo tests mock Firebase with `mocktail` (dev dep). Mocking `DocumentReference` needs `// ignore: subtype_of_sealed_class`.
   - Not run against real Firebase yet (would create real accounts) — first live check is T1.7/T1.8, full routing check T1.10.
5. Conventions from T1.1:
   - Read `users/{uid}` with `UserModel.fromSnapshot` / `fromMap`. A malformed doc (unknown role/status, missing field) throws — the session (T1.3) must treat that like a missing profile.
   - Write with `UserModel.toCreateMap` (registration; caller sets customer→active + location, admin→pending) and `UserModel.toSelfUpdateMap` (profile edits). Both match the D§5 users rules.
   - Collection names come from `FirestorePaths` (`core/constants/firestore_paths.dart`), not string literals.
   - `GeoLocationModel` map shape is reused for the order location snapshot (T3.3). `capturedAt` is device time; `createdAt`/`updatedAt` are server timestamps and read back as `null` while a local write is pending.
6. Conventions from T0.8: before any server-only action call `await sl<ConnectivityService>().ensureOnline()` (throws `NoConnectionException` → «لا يوجد اتصال بالإنترنت» via `mapFirebaseError`). Get Firestore only via `sl<FirebaseFirestore>()` so the offline settings apply.
7. Next iOS build will add the `connectivity_plus` pod to `Podfile.lock` (not built in T0.8).
8. Conventions from T0.7: show numbers via `Formatters` (ar_EG, Arabic-Indic digits); pass user-typed numbers through `ArabicNormalizer.digitsToWestern` before saving; store `nameLower = ArabicNormalizer.normalize(name)`; the location repo throws `LocationTimeoutException` (not a bare `TimeoutException`).
9. Conventions: every Arabic string goes in `core/constants/app_strings.dart`; for a custom font weight use `style.withCairoWeight(FontWeight.wXXX)`, not `copyWith(fontWeight:)` (Cairo is a variable font).
10. Routes live in `lib/core/router/app_routes.dart`; `sessionRedirect` (T1.4) decides access. Remaining placeholder screens (cart, orders, dashboard, customers, profile) still use `PlaceholderScreen`.

## 5a. T1.10 checklist (user + Android emulator)

Run the app: `flutter run -d emulator-5554` in the Flutter project root. Use real email addresses you control.

1. **Deploy rules first** (CR-019): `firebase deploy --only firestore:rules`.
2. **Admin bootstrap (R3.10):** register an admin in the app → pending screen with your name/email. Tap «تحديث» → «لا يزال طلبك قيد المراجعة».
3. In the Console → Firestore → `users/{uid}` → set `status` = `active` **while the pending screen is open** → app opens the dashboard by itself (R3.8).
4. Kill and relaunch the app → splash → dashboard (persisted session, R4.3). To switch accounts later, sign out by clearing app data: `adb shell pm clear com.mostafasamy.merchant_orders` (no logout button for active users until the profile screen, Phase 5).
5. **Customer:** clear app data, register a customer with GPS → products screen (R1.5). Check `users/{uid}` has `location` with `lat/lng/accuracyM/address/details/capturedAt` and server `createdAt`.
6. **Customer disabled:** Console: set the customer's `status` = `rejected` while signed in → signed out, login shows «تم إيقاف هذا الحساب» (R4.6). Set it back to `active`.
7. **Admin rejected:** register a second admin, Console `status` = `rejected` → signed out with «تم رفض طلبك» (R3.4); logging in again → same message.
8. **Profile deleted:** Console: delete a customer's `users/{uid}` doc while signed in → «هذا الحساب غير موجود» (R4.4). (The Auth user stays; delete it in Authentication.)
9. **Errors:** wrong password → «البريد الإلكتروني أو كلمة المرور غير صحيحة»; register an email again → «البريد الإلكتروني مستخدم بالفعل»; airplane mode + login → «لا يوجد اتصال بالإنترنت».
10. Password reset email arrives (check spam).

## 6. Rules for whoever continues

- Do **not** add billing, Cloud Storage, Cloud Functions, Maps SDK, Analytics.
- Do **not** change the Firestore location or rules semantics without a new CR in `CHANGELOG.md`.
- The repo's `firestore.rules` must stay identical to what's published; `firebase deploy` overwrites the Console version.
- Never commit secrets; `firebase_options.dart`, `google-services.json`, `GoogleService-Info.plist` are fine to commit (they are not secrets) but keep the repo private.
- Don't upgrade Flutter / switch channel without asking the user (CR-004).
- **Testing:** verify with `flutter analyze`, `flutter test` and the Android emulator. **Don't build/run iOS** unless the change is iOS-specific (`ios/` files, Podfile, Info.plist, iOS-only behaviour) — iOS builds take 7–10 min. If iOS is needed, ask the user first.
