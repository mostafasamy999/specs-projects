# Status & Session Handoff — Merchant Orders App

Read this first in any new session. Then read `requirements.md` → `design.md` → `tasks.md` → `CHANGELOG.md`.

_Last updated: 2026-10-20 (CR-003)_

## 1. Where things live

| What | Path / value |
|---|---|
| Spec folder | `/Users/mostafasamy/work/specs-projects/specs/merchant-orders-app/` |
| Flutter project (to be created) | `/Users/mostafasamy/StudioProjects/merchant_orders` |
| Dart package name | `merchant_orders` |
| Bundle / application ID | `com.<org>.merchant_orders` — **`<org>` not decided yet; ask the user before `flutter create`** |
| Platforms | Android + iOS only |

## 2. Firebase environment (provisioned & verified 2026-10-20)

| Item | Value |
|---|---|
| Project name | `merchant-orders` |
| Project ID | `merchant-orders-39dd1` |
| Project number | `658495017371` |
| Plan | **Spark (no-cost), no billing account** — never upgrade |
| Auth | Email/Password **enabled**; Email link (passwordless) **off**; no other providers |
| Firestore | Database `(default)` · Standard edition · Native mode · **`europe-west1` (Belgium)** · production mode |
| Security Rules | Published from Console, identical to `design.md` §5 |
| Indexes | **Not deployed yet** (see `design.md` §6) |
| Cloud Storage / Analytics / Gemini | Not enabled (by design) |
| Registered apps | **None yet** — `flutterfire configure` will register Android + iOS |
| Data | Empty — collections are created by the app |
| First admin | **Not bootstrapped yet** (task T1.10) |

## 3. Local toolchain notes (user's Mac)

- `flutterfire_cli` 1.3.1 installed globally; `firebase-tools` assumed installed (verify with `firebase --version`).
- Flutter was on the **beta** channel (Dart `3.10.0-290.4.beta`). Spec requires **stable** → run `flutter channel stable && flutter upgrade` before `flutter create`.
- `flutterfire configure` **must run inside the Flutter project root** (it failed earlier with `FlutterAppRequiredException` when run elsewhere).
- Disk is ~96 % full (~19 GB free); old iOS simulator runtimes can be removed if space runs out.

## 4. Progress

| Task | State |
|---|---|
| T0.1 Create Flutter project | ⬜ next |
| T0.2a Firebase project + Auth + Firestore + rules (Console) | ✅ done 2026-10-20 |
| T0.2b `flutterfire configure` + `firebase_options.dart` | ⬜ next (after T0.1) |
| T0.2c Put `firestore.rules` + `firestore.indexes.json` in repo, deploy indexes | ⬜ |
| Everything from T0.3 onward | ⬜ |

## 5. Next session — exact order

1. Ask the user for `<org>`; switch Flutter to stable.
2. `cd /Users/mostafasamy/StudioProjects && flutter create --org com.<org> --project-name merchant_orders --platforms android,ios merchant_orders`
3. `cd merchant_orders && flutterfire configure --project=merchant-orders-39dd1 --platforms=android,ios`
4. `flutter pub add firebase_core firebase_auth cloud_firestore` and initialize Firebase in `main.dart` with `DefaultFirebaseOptions.currentPlatform`.
5. `firebase use merchant-orders-39dd1` → create `firebase.json` (firestore section only), `firestore.rules` (copy of design §5), `firestore.indexes.json` (design §6) → `firebase deploy --only firestore`.
6. Smoke test: app launches on Android + iOS with Firebase initialized.
7. Update this file, `tasks.md` checkboxes, and `CHANGELOG.md`.

## 6. Rules for whoever continues

- Do **not** add billing, Cloud Storage, Cloud Functions, Maps SDK, Analytics.
- Do **not** change the Firestore location or rules semantics without a new CR in `CHANGELOG.md`.
- The repo's `firestore.rules` must stay identical to what's published; `firebase deploy` overwrites the Console version.
- Never commit secrets; `firebase_options.dart`, `google-services.json`, `GoogleService-Info.plist` are fine to commit (they are not secrets) but keep the repo private.
