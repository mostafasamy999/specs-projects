# Implementation Tasks — Merchant Orders App (MVP)

Each task references requirements (`R<n>.<m>`) and design sections (`D§<n>`). Complete in order; each phase ends in a runnable app.

## Phase 0 — Project setup

- [ ] **0.1** Create Flutter project (`com.<company>.merchant_orders`), Android minSdk 23, iOS 15. Add packages from D§1.1. _(R14.2)_
- [ ] **0.2** Create Firebase project; enable Email/Password, Firestore, Storage; run `flutterfire configure`. _(D§10)_
- [ ] **0.3** Enable Maps SDK (Android + iOS), add API key + location/camera/photos permissions with Arabic usage strings. _(D§10, R2)_
- [ ] **0.4** Set up folder structure, `get_it` DI, `go_router` skeleton with placeholder screens. _(D§2)_
- [ ] **0.5** App theme: Cairo font, RTL, `locale: Locale('ar')`, Material localization delegates, status colors, `app_strings.dart`. _(R14.1, D§3.4)_
- [ ] **0.6** Core widgets: AppButton, AppTextField, StatusBadge, LoadingView, ErrorView, EmptyView, ConfirmDialog. _(D§2)_
- [ ] **0.7** `Failure` + `mapFirebaseError()` with Arabic messages; validators; formatters (EGP, ar dates, short order code); Arabic search normalizer. _(R14.5, D§8, D§6)_
- [ ] **0.8** Enable Firestore offline persistence; connectivity check before transactions. _(R14.3)_

## Phase 1 — Auth, session, roles

- [ ] **1.1** `UserEntity` / `UserModel` (role, status, location). _(D§3.1)_
- [ ] **1.2** `AuthRepository`: signIn, signOut, sendPasswordReset, registerCustomer, registerAdmin (with Auth rollback on profile failure). _(R1.4, R1.7, R3.2, R4.1)_
- [ ] **1.3** `SessionCubit`: authStateChanges + `users/{uid}` listener → SessionState; sign out on missing doc / non-active status. _(R4.2–4.6, D§4.1)_
- [ ] **1.4** Router `redirect` + `refreshListenable` per SessionState table. _(D§4.1)_
- [ ] **1.5** Screens: Splash, Login, Forgot password, Choose account type. _(R1.1, R4.1)_
- [ ] **1.6** Location picker screen + `LocationPreview` widget (permission, my-location, reverse geocoding ar, details field, Cairo fallback, manual address on geocode failure). _(R2, D§4.6)_
- [ ] **1.7** Customer registration screen (validation + required location). _(R1.2–1.6, R2.6)_
- [ ] **1.8** Admin registration screen + Pending approval screen (Refresh / Logout) + rejected handling. _(R3.1–3.4, R3.8)_
- [ ] **1.9** Write `firestore.rules` users section; deploy. _(D§5, R13.2)_
- [ ] **1.10** Bootstrap first admin from Console and verify routing for all states. _(R3.10)_

## Phase 2 — Products

- [ ] **2.1** `ProductEntity` / `ProductModel`, `ProductRepository` (watch active, watch all, get, create, update, setActive). _(D§3.2)_
- [ ] **2.2** Image pick (camera/gallery) + compression + Storage upload with progress. _(R6.2, R6.6, R6.7, D§4.5)_
- [ ] **2.3** Admin product form (create/edit, validation, image replace). _(R6.1, R6.3)_
- [ ] **2.4** Admin products list (search, stock badge, active toggle). _(R6.4, R6.5)_
- [ ] **2.5** Customer products grid (real-time, search, out-of-stock state) + product details with quantity selector. _(R8)_
- [ ] **2.6** Products + Storage rules; deploy; indexes for products. _(D§5, D§5.1, D§6)_

## Phase 3 — Cart & orders (customer)

- [ ] **3.1** `CartCubit` (hydrated): add/merge, change qty (≤ stock), remove, clear, totals. _(R9.1, R9.2)_
- [ ] **3.2** Cart screen + Checkout screen (location from profile, note). _(R9.3)_
- [ ] **3.3** `OrderEntity` / `OrderModel` (items, productIds, snapshots, statusHistory). _(D§3.3)_
- [ ] **3.4** `OrderRepository.placeOrder` transaction with stock validation & `OrderStockException`. _(R9.4–9.7, D§4.3)_
- [ ] **3.5** Handle stock failures in UI: show per-item message, adjust cart. _(R9.5)_
- [ ] **3.6** My orders screen (status tabs, pagination 20, real-time). _(R10.1, R10.2, R14.4)_
- [ ] **3.7** Order details screen with status timeline + cancel reason, real-time. _(R10.3–10.5)_
- [ ] **3.8** Orders rules (create/read) + product `validOrderDelta`; indexes for orders. _(D§5, D§6, R13.4)_

## Phase 4 — Admin operations

- [ ] **4.1** Admin shell (bottom nav: Dashboard · Orders · Products · More). _(D§7)_
- [ ] **4.2** Admin orders list (status filter, pending badge, real-time, pagination). _(R11.1)_
- [ ] **4.3** Admin order details: tap-to-call, `LocationPreview` + open in Google Maps, timeline. _(R11.2, R11.3)_
- [ ] **4.4** `OrderRepository.changeStatus` transaction (allowed transitions, counter deltas, concurrency check) + cancel reason dialog. _(R11.4–11.7, D§4.4)_
- [ ] **4.5** Orders update rule (`validTransition`); deploy. _(D§5)_
- [ ] **4.6** Admin requests screen (pending list, approve, reject with confirm). _(R3.5–3.7)_
- [ ] **4.7** Customers directory + customer details (map, call, orders). _(R12.1, R12.2)_

## Phase 5 — Dashboard (P1)

- [ ] **5.1** Product demand list (real-time, sort by activeQty / totalQty, stock). _(R7.1–7.3, D§4.7)_
- [ ] **5.2** Status count cards via `count()` aggregation, refreshed on open / pull / after status change. _(R7.4)_
- [ ] **5.3** Tap product → active orders containing it (`productIds array-contains`). _(R7.5, D§6)_

## Phase 6 — Profile

- [ ] **6.1** Profile screen (customer: name, phone, location edit; admin: name, phone), logout. _(R5)_
- [ ] **6.2** Verify self-edit can't change role/status (rules). _(R13.2)_

## Phase 7 — Quality & release

- [ ] **7.1** Unit tests: validators, formatters, normalizer, transitions, models. _(D§9)_
- [ ] **7.2** Cubit tests (`bloc_test`, `mocktail`): Session, Cart, PlaceOrder, ChangeStatus. _(D§9)_
- [ ] **7.3** Security rules tests on Firebase Emulator (all allow/deny cases). _(D§9, R13)_
- [ ] **7.4** Manual QA checklist on two devices (live status, last-unit race, Console approve/delete). _(D§9)_
- [ ] **7.5** App icon, Arabic app name, splash; release builds (Android AAB, iOS archive). _(R14.2)_

## Optional / Phase 2 backlog

- [ ] All-customers map view _(R12.3)_
- [ ] Date-range filter for demand _(R7.6)_
- [ ] FCM / HMS Push on status change
- [ ] Cloud Functions for counters & sequential order numbers
- [ ] `dev` / `prod` flavors
