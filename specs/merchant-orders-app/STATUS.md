# Status & Session Handoff — Merchant Orders App

Read this first in any new session. Then read `requirements.md` → `design.md` → `tasks.md` → `CHANGELOG.md`.

_Last updated: 2026-10-20 (CR-007)_

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
| Security Rules | Deployed from repo `firestore.rules` (= `design.md` §5 verbatim) via `firebase deploy --only firestore` on 2026-10-20. Logic identical to the earlier Console version (that one had no comments). |
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
| Packages | `firebase_core` 5.0.0 · `firebase_auth` 7.0.0 · `cloud_firestore` 7.0.0 · `flutter_bloc` 9.1.1 · `equatable` 3.0.0 · `get_it` 9.3.0 · `go_router` 17.2.3 · `geolocator` 14.0.2 · `geocoding` 5.0.0 · `url_launcher` 6.3.2 · `image_picker` 1.2.2 · `flutter_image_compress` 2.5.1 · `hydrated_bloc` 11.0.0 · `intl` 0.20.2 · `flutter_localizations` (sdk) |
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
| Everything from T0.6 onward | ⬜ **waiting for the user's go-ahead** |

## 5. Next session — exact order

1. Wait for the user to say to start T0.6.
2. T0.6: core widgets (AppButton, AppTextField, StatusBadge using `AppColors.pending/inProgress/done/cancelled` + `AppStrings.status*`, LoadingView, ErrorView, EmptyView, ConfirmDialog).
3. Conventions: every Arabic string goes in `core/constants/app_strings.dart`; for a custom font weight use `style.withCairoWeight(FontWeight.wXXX)`, not `copyWith(fontWeight:)` (Cairo is a variable font).
4. Skeleton notes: routes live in `lib/core/router/app_routes.dart`; the splash placeholder has dev links to login / customer / admin until T1.4 adds the session `redirect`.

## 6. Rules for whoever continues

- Do **not** add billing, Cloud Storage, Cloud Functions, Maps SDK, Analytics.
- Do **not** change the Firestore location or rules semantics without a new CR in `CHANGELOG.md`.
- The repo's `firestore.rules` must stay identical to what's published; `firebase deploy` overwrites the Console version.
- Never commit secrets; `firebase_options.dart`, `google-services.json`, `GoogleService-Info.plist` are fine to commit (they are not secrets) but keep the repo private.
- Don't upgrade Flutter / switch channel without asking the user (CR-004).
- **Testing:** verify with `flutter analyze`, `flutter test` and the Android emulator. **Don't build/run iOS** unless the change is iOS-specific (`ios/` files, Podfile, Info.plist, iOS-only behaviour) — iOS builds take 7–10 min. If iOS is needed, ask the user first.
