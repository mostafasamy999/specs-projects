# Spec Changelog — Merchant Orders App

Every change to `requirements.md`, `design.md`, or `tasks.md` is recorded here as a Change Request (CR), newest first.

IDs: `R<n>.<m>` = requirement · `D§<n>` = design section · `T<n>.<m>` = task.

---

## CR-040 — 2026-10-21 — Admin requests (T4.6)

**Request:** Implement T4.6.

**Decision / done:**
- **`UsersRepository`** (`features/auth/`, in `get_it`; admin-only by the rules) for admin views of other users: `watchPendingAdmins()` (role admin + status pending, `createdAt`↓ — index exists), `decideAdmin(uid, approve:, byAdminUid:)`, `watchCustomers(limit:)` and `watchUser(uid)` (for T4.7). Malformed user docs are skipped in lists instead of failing them.
  - `decideAdmin` writes exactly `status` (active / rejected), `approvedBy` (= the deciding admin, as the CR-019 rule requires for approval), `approvedAt`, `updatedAt` (server). The decider is recorded for rejections too (audit).
- **`AdminRequestsScreen`** (R3.5–R3.7): live cards — name, phone, email, «تاريخ الطلب: …» — with «موافقة» (immediate) and «رفض» (confirmation «سيتم رفض طلب «…» …»). Buttons are disabled while that request is being decided; success / error SnackBars; empty → «لا توجد طلبات مسؤولين معلقة». The requester's app re-routes on its own (session listener, R3.8).
- **More menu:** «طلبات المسؤولين» shows the live number of pending requests.
- Test helper `useFakeUsers()`.
- **Tests:** 9 new (list fields, approve + approver uid, reject confirm / cancel, error, empty, More count; repo approve / reject fields, offline); 343 total pass. `flutter analyze` clean.

**Affected:**
- Tasks: T4.6 ✅
- STATUS.md

---

## CR-039 — 2026-10-21 — Orders update rule tightened (T4.5) — deploy pending

**Request:** Implement T4.5 (orders update rule `validTransition`; deploy).

**Decision / done:** the update rule now matches `OrderRepository.changeStatus` (CR-038) exactly:
- unchanged: active admin only; only `status, statusHistory, cancelReason, updatedAt, updatedBy` may change; `validTransition` (pending → inProgress | cancelled; inProgress → done | cancelled).
- new: `updatedBy == request.auth.uid`; `updatedAt == request.time`; **`validNewHistoryEntry()`** — `statusHistory` grows by exactly one entry whose `status` is the new status and `by` is this admin (the timeline can't be rewritten or skipped); `cancelReason` string 1–200 when cancelling, untouched otherwise.
- Product counter updates by admins were already allowed (CR-025).
- **D§5 synced** (identical, checked); `--dry-run` compiled successfully.
- **Not deployed** (production deploys blocked for Claude Code). **The same user command** deploys CR-019 + CR-025 + CR-034 + CR-039: `firebase deploy --only firestore:rules`.

**Affected:**
- Design: D§5 (orders update)
- Tasks: T4.5 (rules written; ⏳ deploy by user)
- STATUS.md

---

## CR-038 — 2026-10-21 — Order status change transaction + actions (T4.4)

**Request:** Implement T4.4.

**Decision / done:**
- **`OrderStatus.nextSteps` / `canMoveTo`** (R11.4): pending → inProgress | cancelled; inProgress → done | cancelled; done / cancelled final.
- **`OrderRepository.changeStatus(orderId, from, to, adminUid, cancelReason)`** (D§4.4): invalid move or empty cancel reason → `ArgumentError` before any I/O; online check; **transaction**: read the order → missing → new `OrderNotFoundException` («الطلب غير موجود»); status ≠ `from` → `ConcurrentUpdateException` («تم تحديث الطلب بواسطة مسؤول آخر», R11.7); for each item of the **stored** order, `counterDeltas` (D§3.4) with `increment` — done: `activeQty −q`; cancelled: `activeQty −q`, `totalQty −q`, `stock +q`; inProgress: none; then the order: `status`, `statusHistory: arrayUnion({status, at (client), by})`, `cancelReason` (trimmed, cancel only), `updatedAt` (server), `updatedBy`. Exactly the fields the orders update rule allows.
- **`OrderStatusActions`** on the admin order details (R11.4–R11.6): buttons for the allowed next steps — «بدء التحضير» (immediate), «تم التسليم» (confirmation, final), «إلغاء الطلب» (outlined) → **`CancelOrderDialog`**: explains stock is returned, requires a reason ≤ 200, «رجوع» / «إلغاء الطلب» (R11.5). Success → «تم تغيير حالة الطلب إلى «…»»; errors → SnackBar. Final orders show no actions. The screen updates from the live order.
- **Tests:** 14 new (transitions, deltas, inProgress = order only, done deltas, cancel deltas + reason, concurrent update, missing order, pre-I/O guards; UI: start, done confirm, cancel requires reason + sends it, back out, concurrent message, final = no actions); 334 total pass. `flutter analyze` clean.
- "Refresh dashboard status counts after a change" (D§4.4) comes with the dashboard (T5.2).

**Affected:**
- Tasks: T4.4 ✅
- STATUS.md

---

## CR-037 — 2026-10-21 — Admin order details (T4.3)

**Request:** Implement T4.3.

**Decision / done:**
- **`AdminOrderDetailsScreen`** (R11.2, R11.3): live (`watch(id)`), reuses `OrderDetailsView` with:
  - **`CustomerContactCard`**: customer name + phone (LTR) + «اتصال» → `tel:` via `PhoneLinks.call` (manifest DIAL query from T0.3); failure → «تعذر بدء الاتصال». Optional `onTap` for the customer page (T4.7).
  - **`directions: true`** → the address's «فتح في خرائط جوجل» opens turn-by-turn navigation to the GPS point (`/maps/dir/?api=1&destination=lat,lng`).
  - items, total, note, timeline as for the customer.
- Status actions come with T4.4.
- `core/utils/phone_links.dart`.
- **Tests:** 2 new (all sections + directions flag; tel URI); 320 total pass. `flutter analyze` clean.

**Affected:**
- Tasks: T4.3 ✅
- STATUS.md

---

## CR-036 — 2026-10-21 — Admin orders list (T4.2)

**Request:** Implement T4.2.

**Decision / done:**
- **`OrderRepository.watchAll(status:, limit:)`**: every order, `createdAt` ↓, optional `status ==` — indexes `createdAt` (automatic) and (status, createdAt↓) (deployed). Admins only by the rules.
- **`AdminOrdersScreen`** (R11.1): reuses `OrderListCubit` / `OrderListView` (live paging 20, status chips, empty / error states) and `OrderTile` with the customer's name as subtitle. Tap → admin order details.
- **Pending count on the «قيد الانتظار» chip** (same live `CountCubit` as the Orders tab badge, T4.1) via the new `OrderListView.badgeFor` hook.
- **Tests:** 3 new (all orders + customer name, no customer query; chip count + status filter query; tap → details); 318 total pass. `flutter analyze` clean.

**Affected:**
- Tasks: T4.2 ✅
- STATUS.md

---

## CR-035 — 2026-10-21 — Admin shell: pending badge, More menu, logout (T4.1)

**Request:** Start Phase 4; implement T4.1.

**Decision / done:**
- The admin bottom nav (Dashboard · Orders · Products · More) existed since T0.4. T4.1 adds:
  - **Live pending badge on the Orders tab** (R11.1): `OrderRepository.watchCountByStatus(pending)` → `CountCubit` (provided in the admin shell) → `PendingOrdersBadgeIcon`. A snapshot listener counts the docs because `count()` aggregations can't be listened to; pending orders are few.
  - **`AdminMoreScreen`**: «طلبات المسؤولين», «العملاء», «الملف الشخصي» (each with a one-line hint) and «تسجيل الخروج».
  - **Logout with confirmation** (R5.5): `confirmAndSignOut` / `LogoutTile` → `SessionCubit.signOut()`; the session redirect opens login.
- **Profile stand-in (until T6.1):** `ProfileScreen` now shows the signed-in user's name / phone / email and the logout tile, so active customers and admins can sign out (needed for the T1.10 checks). Editing stays in T6.1.
- `core/cubit/count_cubit.dart`: `CountCubit` for live badges (errors keep the last value).
- Test helper `useFakeOrders()` stubs the count; admin screen tests now use it (the shell reads orders).
- **Tests:** 4 new (live badge appears / disappears, More items + navigation, logout cancel / confirm, profile shows user + logout); 315 total pass. `flutter analyze` clean.

**Affected:**
- Tasks: T4.1 ✅
- STATUS.md

---

## CR-034 — 2026-10-21 — Orders rules tightened + cart cap (T3.8) — Phase 3 code complete, deploy pending

**Request:** Implement T3.8 (orders rules create/read + product `validOrderDelta`; orders indexes).

**Decision / done:**
- **orders create** now matches `OrderModel.toCreateMap` exactly: keys limited to the 14 written fields; `customerId == auth.uid`; **`customerName` / `customerPhone` must equal the customer's profile** (`me()`), so a snapshot can't be forged (R9.6); `location` map; `status == 'pending'`; items list 1–50 and `productIds` the same size; `itemsCount` int > 0; `total` number > 0; `note` string ≤ 300; `statusHistory` exactly one `pending` entry `by` the customer; `createdAt == request.time`.
- **orders read / update / delete:** unchanged (read: active admin or the order's own customer; the list query filters `customerId == uid` so it's allowed). Update is reviewed with the status change (T4.4/T4.5).
- **products `validOrderDelta`:** unchanged and still correct for the place-order transaction (exactly `stock`, `activeQty`, `totalQty`; `d` in 1…99, matching the cart's per-product cap; product must be `isActive`). Limitation kept (CR-000): rules can't loop over the order's items, so they can't prove each product delta belongs to an order in the same transaction.
- **Cart capped at 50 products** (`CartCubit.maxLines`, new `CartFullException` → «السلة ممتلئة (٥٠ منتجاً كحد أقصى للطلب الواحد)») so checkout can't hit the rules' 50-item limit; adding a 51st product shows the message on product details.
- **Indexes:** none needed — my orders uses (customerId, createdAt↓) and (customerId, status, createdAt↓), both deployed.
- **D§5 synced** (identical to repo `firestore.rules`, checked); `--dry-run` compiled successfully.
- **Not deployed** (production deploys blocked for Claude Code). **One user command** deploys CR-019 + CR-025 + CR-034: `firebase deploy --only firestore:rules`.
- **Tests:** +1 (51st product refused, existing lines still merge); 311 total pass. `flutter analyze` clean.
- **Phase 3 status:** all code done. Open: rules deploy (user) and device / two-device QA (D§9) once accounts exist (T1.10).

**Affected:**
- Design: D§5 (orders create)
- Tasks: T3.8 (rules written; ⏳ deploy by user)
- STATUS.md

---

## CR-033 — 2026-10-21 — Order details with status timeline (T3.7)

**Request:** Implement T3.7.

**Decision / done:**
- **`OrderDetailsScreen`** (customer, R10.3–R10.5): live via `OrderRepository.watch(id)`; missing → «الطلب غير موجود»; error → retry. Read-only — no cancel / edit (R9.8).
- **`OrderDetailsView`** (shared with the admin details, T4.3): «طلب #ABC123» + status badge, «تم الطلب: …»; cancelled → card «سبب الإلغاء» with the reason (R10.4); items (live image by `productId`, snapshot name, «price × qty», line total); total + pieces; note; «عنوان التوصيل» as `AddressTile` (admin can pass `directions: true`); «مراحل الطلب» timeline; optional `customerSection` / `actions` slots for the admin.
- **`StatusTimeline`**: every status in `statusHistory` with its date / time (colored check), then the normal steps not reached yet greyed out; a cancelled order ends at «ملغي».
- Item images use version 0 (the order doesn't store `imageVersion`): the current image is fetched once per session.
- Tests that relied on placeholder text now use a remaining placeholder (customer details) / the details AppBar.
- **Tests:** 5 new (content + no cancel button, timeline reached / upcoming, cancelled reason + no upcoming steps, live status change, missing + error); 310 total pass. `flutter analyze` clean.

**Affected:**
- Tasks: T3.7 ✅
- STATUS.md

---

## CR-032 — 2026-10-21 — My orders (T3.6)

**Request:** Implement T3.6.

**Decision / done:**
- **`OrderRepository.watchCustomerOrders(uid, status:, limit:)`**: `customerId == uid` (+ `status ==`), `createdAt` ↓, `limit` — uses the existing indexes (customerId, createdAt↓) and (customerId, status, createdAt↓). **`watch(orderId)`** for details (T3.7).
- **`OrderListCubit`** (shared with the admin list, T4.2): takes an `OrderQuery`; `setFilter(status)` restarts at one page; `loadMore()` widens the **live** query's limit by 20 (R14.4), so every loaded order keeps updating in real time; `hasMore` when a full page came back; error → failure (keeps loaded orders), `retry()`.
- **`OrderListView`**: status chips الكل / قيد الانتظار / جاري التحضير / تم / ملغي (R10.2 "tabs/filters" — chips fit five Arabic labels on a phone) + list; loads the next page near the end of the scroll; empty → «لا توجد طلبات بعد» / «لا توجد طلبات بهذه الحالة».
- **`OrderTile`**: «طلب #ABC123», date + time, «n قطعة», total, colored status badge (R10.1); optional subtitle (admin shows the customer).
- **`MyOrdersScreen`**: the customer's list; tap → order details.
- Test helpers: `useFakeOrders()` stubs empty lists; `test/helpers/order_fixtures.dart` (`testOrder`, `testLocation`). Removed the `devSampleOrder` string (admin orders placeholder kept until T4.2).
- **Tests:** 8 new (cubit first page / loadMore + hasMore / filter reset / error + retry; screen rows, filter chip query, empty, tap → details); 305 total pass. `flutter analyze` clean.

**Affected:**
- Tasks: T3.6 ✅
- STATUS.md

---

## CR-031 — 2026-10-21 — Unavailable products at checkout (T3.5)

**Request:** Implement T3.5.

**Decision / done:**
- `CheckoutCubit` catches `ProductUnavailableException` (thrown with nothing written, CR-029): removes those `productIds` from the cart (`CartCubit.removeAll`, saved on disk too) and emits the names.
- `CheckoutScreen` shows a dialog «تم تحديث السلة» with one line per product («المنتج "…" لم يعد متاحاً وتم حذفه من السلة») and «حسناً». The customer stays on checkout with the remaining items and can confirm again; if nothing is left the screen shows the empty-cart view («سلتك فارغة» + «تصفح المنتجات»).
- Other errors keep the SnackBar.
- **Tests:** 2 new (one item removed → dialog + rest kept; all removed → both names + empty view); 297 total pass. `flutter analyze` clean.

**Affected:**
- Tasks: T3.5 ✅
- STATUS.md

---

## CR-030 — 2026-10-21 — Cart + checkout screens (T3.2)

**Request:** Implement T3.2 (after T3.3 / T3.4, see CR-028).

**Decision / done:**
- **`CartScreen`** (R9.1): one line per product — image, name, unit price, `QuantitySelector` (1…99), line total, delete; bottom `CartTotalBar` (total, «n قطعة») + «متابعة الطلب» → checkout. Empty → «سلتك فارغة» + «تصفح المنتجات».
- **Cart tab badge** (`CartBadgeIcon`): number of pieces in the cart.
- **`CheckoutScreen`** + **`CheckoutCubit`** (R9.3–R9.7): items (name × qty, line total), note «الأسعار الحالية تُحتسب عند التأكيد», home location from the profile as `AddressTile` (read-only) with «تغيير» → profile, optional note (≤ 300, the field stops at 300), «تأكيد الطلب».
  - On open, `refreshPrices()` reads each product and updates the cart's names / prices (failures ignored — the transaction prices the order anyway).
  - Confirm → `OrderRepository.placeOrder` → cart emptied (also on disk) → «تم إرسال طلبك بنجاح» → order details (R9.7). Failure → message, cart kept. No saved location → message and confirm disabled.
  - Screen title renamed «مراجعة الطلب» (was the same text as the confirm button «تأكيد الطلب»).
- Layout: the total row stacks label + count so long prices don't overflow (caught by the tests).
- Test helper `useFakeOrders()`.
- **Tests:** 9 new (cart lines / totals / badge; quantity + remove; empty → browse; continue → checkout; checkout content + price refresh; confirm → emptied + details; failure keeps cart; note capped at 300; missing location); 295 total pass. `flutter analyze` clean.
- Unavailable products at checkout get their own handling in T3.5 (today: the generic message).
- **Not checked on a device:** needs an active customer (T1.10).

**Affected:**
- Tasks: T3.2 ✅
- STATUS.md

---

## CR-029 — 2026-10-21 — Place-order transaction (T3.4)

**Request:** Implement T3.4.

**Decision / done:**
- **`OrderRepository.placeOrder(customer, items, note)`** (`OrderRepositoryImpl`, in `get_it`), per D§4.3:
  1. guards: non-empty cart; customer has a saved location (new `MissingLocationException` → «حدد موقع المنزل من الملف الشخصي قبل الطلب»); online check.
  2. **Pre-check (design addition):** each product is read from the server on its own. A hidden product is *not readable* by customers (D§5), so inside the transaction a hidden item would fail the whole transaction with `permission-denied` without saying which one. Denied, missing or `isActive != true` → `ProductUnavailableException(names, productIds:)`, nothing written.
  3. **Transaction:** re-read every product; validate only "still offered" (stock never blocks, R8.2); for each item `stock: increment(-q)` (may go negative), `activeQty: increment(q)`, `totalQty: increment(q)` — exactly the three fields `validOrderDelta` allows; create the order (`pending`, snapshots, first timeline entry). **Name and price come from the transaction's reads**, not the cart (R9.6). Firestore retries the transaction on contention, so concurrent orders keep counters exact.
  4. If the transaction is denied (product hidden between 2 and 3), the pre-check runs again to name the item.
- `ProductUnavailableException` gains `productIds` (for removing them from the cart, T3.5).
- **Tests:** 10 new (fresh prices + totals + note trim + snapshots; exact counter fields; negative stock allowed; hidden / deleted / inactive named with no writes; hidden mid-checkout still named; inactive inside the transaction aborts before writes; offline; missing location; empty cart); 286 total pass. `flutter analyze` clean.
- Live check (two devices, concurrent orders) is in the D§9 manual QA list — needs accounts (T1.10) and the deployed rules.

**Affected:**
- Design: D§4.3 (pre-check note)
- Tasks: T3.4 ✅
- STATUS.md

---

## CR-028 — 2026-10-21 — Order entity + model (T3.3)

**Request:** Implement T3.3. (Done before T3.2: checkout's «تأكيد الطلب» needs the order model and the place-order transaction, so the order is T3.3 → T3.4 → T3.2 → T3.5.)

**Decision / done:**
- **`OrderEntity`** (`features/orders/domain/entities/order.dart`, every D§3.3 field) with `OrderItem` (productId, name, price, quantity, lineTotal — snapshots, R9.6) and `StatusChange` (status, at, by — timeline, R10.3). Derived `shortCode` (first 6 chars upper-case), `itemsCount`, `productIds`.
  - Named `OrderEntity` because `cloud_firestore` exports an `Order` class (index definitions) that clashes.
- **`OrderModel`:** `fromSnapshot` / `fromMap` (whole numbers read as double; pending server timestamps → null), `toCreateMap(order, now:)` → `shortCode`, customer + location snapshots, `items` (stored key `qty`), `productIds`, `itemsCount`, `total`, `note`, `status: pending`, `statusHistory: [{pending, at: now, by: customerId}]` (client time — `serverTimestamp()` isn't allowed in arrays), server `createdAt` / `updatedAt`. `itemToMap` / `changeToMap` for the status change (T4.4).
- `FirestorePaths.orders`.
- **Tests:** 4 new (derived fields, create map, round-trip, cancelled + reason + int total); 276 total pass. `flutter analyze` clean.

**Affected:**
- Tasks: T3.3 ✅
- STATUS.md

---

## CR-027 — 2026-10-21 — Cart (T3.1)

**Request:** Start Phase 3; implement T3.1.

**Decision / done:**
- **`CartItem`** (`features/cart/domain/entities/`): productId, name, price, imageVersion, quantity; `lineTotal` rounded to 2 decimals (`roundMoney`) so totals don't drift (12.1 × 3 = 36.3); JSON round-trip.
- **`CartCubit` / `CartState`** (`HydratedCubit`, R9.1, R9.2): `add` (merges the same product into one line — needed by the rules' one-update-per-product check, D§4.3 — capped at 99, returns the new quantity, refreshes name / price to what the customer just saw), `setQuantity` (1…99), `remove`, `removeAll` (for R9.5), `empty` (after an order; `clear` is HydratedMixin's storage wipe), `refresh(products)` (fresh prices at checkout). `itemsCount`, `total`, `quantityOf`. Corrupt saved data → empty cart.
  - **One cart per customer:** hydrated `id` = uid, so another customer on the same phone gets their own.
  - **Prices:** the cart shows the price last seen; the order is priced from the product re-read inside the transaction (T3.4), and checkout refreshes the cart first.
- **Wiring:** `main.dart` initializes `HydratedStorage` in the app-support directory (new dependency **`path_provider` 2.1.5** — required to get that folder). The customer shell provides `CartCubit(uid)` (keyed by uid). «أضف للسلة» on product details now adds and shows «تمت الإضافة للسلة — الكمية في السلة: n».
- `test/flutter_test_config.dart`: every test gets an in-memory `MemoryStorage` for hydrated cubits.
- **Tests:** 10 new (merge + totals, 1…99 caps, remove / removeAll / empty, refresh on re-add, refresh from reads, restart restore, per-uid carts, corrupt data, JSON, rounding) + details confirmation; 272 total pass. `flutter analyze` clean.
- **Not checked on a device:** needs an active customer (T1.10).

**Affected:**
- Tasks: T3.1 ✅
- STATUS.md

---

## CR-026 — 2026-10-21 — Receive stock dialog (T2.7) — Phase 2 code complete

**Request:** Implement T2.7.

**Decision / done:**
- **`ReceiveStockDialog`** (R6.8): opened from a new «إضافة كمية مستلمة» icon button on every admin product row. Shows the product name, «المخزون: n» and the red «عجز n» badge when negative; quantity field (integer > 0, Arabic digits accepted); live preview «المخزون بعد الاستلام: x» (e.g. −5 + 20 → 15); «إضافة» saves via `ProductRepository.receiveStock` (`FieldValue.increment` — orders placed at the same moment are kept). Success closes the dialog → «تمت إضافة n إلى المخزون»; failure keeps it open with the message; cancel saves nothing.
- **Manual stock correction (R6.9)** was already done in the edit form (T2.3, CR-022: «المخزون الحالي», any integer, written only when changed).
- **Tests:** 5 new (shortage + preview with Arabic digits, save + confirmation, 0 / text rejected, failure stays open, cancel); 262 total pass. `flutter analyze` clean.
- **Phase 2 status:** all code done. Still open: the rules deploy (user, CR-019 + CR-025) and device checks of the admin/customer product screens, which need the accounts from T1.10.

**Affected:**
- Tasks: T2.7 ✅
- STATUS.md

---

## CR-025 — 2026-10-21 — Products + productImages rules tightened (T2.6) — deploy pending

**Request:** Implement T2.6 (products + productImages rules; deploy; product indexes).

**Decision / done:** reviewed against what the app writes (`ProductModel`, `ProductRepositoryImpl`) and tightened; no new permissions.
- **`validProductFields(p)`** (create + admin update): name string 1–80, `nameLower` string, description string ≤ 500, price number > 0, stock int, `activeQty` / `totalQty` int ≥ 0, `isActive` bool, `imageVersion` int.
- **create (admin):** keys limited to exactly `ProductModel.toCreateMap`; stock ≥ 0; counters 0; `imageVersion == 1`; `createdBy == request.auth.uid`; `createdAt == request.time`; **`existsAfter(productImages/{id})`** — the image must be in the same batch (D§4.5).
- **update (admin):** `createdBy` / `createdAt` frozen; whole doc still valid after the write; `imageVersion` may only go up by exactly 1. Counters are *not* frozen for admins because the order status change (T4.4) updates them.
- **update (customer):** `validOrderDelta()` unchanged (Phase 3 reviews it with the order transaction).
- **productImages create / update (admin):** keys `data, contentType, updatedAt` only; `data` bytes ≤ 300 KB; `contentType == 'image/jpeg'`; `updatedAt == request.time`; **`existsAfter(products/{id})`** — no orphan images.
- **Indexes:** no change needed. Customer catalog uses `products (isActive, nameLower)` (exists); the admin list orders by `nameLower` alone (automatic single-field index); search is on-device (CR-023). `products (isActive, createdAt)` stays deployed but unused for now.
- **D§5 synced** — identical to the repo `firestore.rules` (checked). `firebase deploy --only firestore:rules --dry-run` → compiled successfully.
- **Not deployed** (Claude Code's permission check blocks production deploys). **The user must run** `firebase deploy --only firestore:rules` — this one deploy covers CR-019 and CR-025. Until then the live rules are the CR-004 version; the app works with both.

**Affected:**
- Design: D§5 (products, productImages)
- Tasks: T2.6 (rules written; ⏳ deploy by user)
- STATUS.md

---

## CR-024 — 2026-10-21 — Customer product grid + details (T2.5)

**Request:** Implement T2.5.

**Decision / done:**
- **`ProductsScreen`** (customer home, R8.1–R8.3): live grid of offered products (`watchActive`, A→Z) via the shared `ProductListCubit` + on-device search (CR-023). Card: image, name (2 lines), price, stock text. The image takes the remaining height so large text can't overflow the cell (an overflow was caught by the tests with the first layout). Empty → «لا توجد منتجات متاحة حالياً»; no match → «لا توجد نتائج مطابقة»; error → retry.
- **`StockText`** (R8.3): stock > 0 → «متوفر: n» (green); stock ≤ 0 → «متاح بالطلب» on cards, «متاح بالطلب — قد يستغرق التجهيز وقتاً أطول» on details (orange). Negative numbers and «عجز» are never shown to customers.
- **`ProductDetailsScreen`** (R8.4, R8.5): live (`watch(id)`): large image, name, price, long stock text, description, `QuantitySelector` + «أضف للسلة». If the admin hides the product while it's open, customers lose read access (D§5) → «هذا المنتج لم يعد متاحاً» (also for a missing or inactive product); other errors → retry.
  - «أضف للسلة» is **disabled until T3.1** (cart): the screen takes an `onAddToCart(product, quantity)` callback that T3.1 wires to `CartCubit`.
- **`QuantitySelector`** (`core/widgets`, reused by the cart): − n + limited to 1…99 (`maxPerProduct`), never by stock (CR-001); custom bounds supported.
- Removed the `devSampleProduct` placeholder string.
- **Tests:** 11 new (grid: stock texts incl. negative hidden + no `watchAll`, search no-match, empty, tap → details; details: content, quantity 1…99 at stock 0 + add callback, add disabled without cart, hidden while open, missing, other error; selector bounds); registration tests now use the fake product repo (customer home reads products); 257 total pass. `flutter analyze` clean.
- **Not checked on a device:** needs an active customer (T1.10).

**Affected:**
- Tasks: T2.5 ✅ (add-to-cart wired in T3.1; device check after T1.10)
- STATUS.md

---

## CR-023 — 2026-10-21 — Admin products list (T2.4)

**Request:** Implement T2.4.

**Decision / done:**
- **`AdminProductsScreen`** (R6.4, R6.5): live list of every product incl. hidden (`watchAll`, A→Z). Each row: image (dimmed when hidden), name, price, «المخزون: n», red «عجز n» when stock < 0 (stock 0 is not a shortage), grey «مخفي» badge, and a switch that shows / hides the product (`setActive`, SnackBar «المنتج معروض للعملاء الآن» / «تم إخفاء المنتج عن العملاء», error message on failure). Tap → edit form; FAB «إضافة منتج» → new form. Empty catalog → «لا توجد منتجات بعد» with an add button; no match → «لا توجد نتائج مطابقة»; stream error → retry.
- **`ProductListCubit`** (shared with the customer grid, T2.5): subscribes to a product stream, `search(query)`, `retry()`.
- **Search is on-device (design change from D§6):** `visible` = products whose `nameLower` *contains* `ArabicNormalizer.normalize(query)`. The single-merchant catalog is already in memory for the live list, so every keystroke is free (no reads, works offline), and "contains" finds «زيت» inside «عبوة زيت», which the Firestore prefix query couldn't. The `products (isActive, nameLower)` index is still used for the customer catalog's ordering. Revisit if the catalog grows to thousands of products.
- **`ProductSearchField`** widget (clear button). Removed the `devEditProduct` placeholder string.
- **Tests:** 10 new (cubit: live list, normalized contains, error + retry; screen: badges, live shortage update, search + no results, hide via switch, toggle error, edit / new navigation, empty catalog); 246 total pass. `flutter analyze` clean.
- **Not checked on a device:** needs an active admin (T1.10).

**Affected:**
- Design: D§6 (search note)
- Tasks: T2.4 ✅ (device check pending T1.10)
- STATUS.md

---

## CR-022 — 2026-10-21 — Admin product form (T2.3)

**Request:** Implement T2.3.

**Decision / done:**
- **`ProductFormScreen`** (`/admin/products/new`, `/admin/products/:id/edit`) + **`ProductFormCubit`**:
  - Image (required, R6.1): 200 px preview; tap or «إضافة صورة / تغيير الصورة» → bottom sheet «التقاط صورة» / «اختيار من المعرض» → `ProductImagePicker` (compressed, CR-021). Picking errors (too large, access denied) show as SnackBar.
  - Name (required ≤ 80), description (optional ≤ 500), price (> 0, 2 decimals, Arabic digits accepted), stock, «معروض للعملاء» switch (default on; off → hint «المنتج المخفي لا يظهر للعملاء ولا يمكن طلبه»).
  - Stock: «الكمية المتاحة» (integer ≥ 0) when creating; «المخزون الحالي» (any integer, negative = shortage) when editing — this is the manual correction of R6.9.
  - Save: loading + disabled while saving (R6.6); one batch for product + image (R6.7); failure → message, form keeps its values; success → «تم حفظ المنتج» + back. The saved image is put in `ProductImageCache` (new product v1, replaced image v+1) so the list shows it without a fetch.
  - Edit loads the product once (`get`); not found → «المنتج غير موجود»; load error → retry.
- **Stock is written only when the admin changed it (design decision):** orders change `stock` while the form is open; writing back the loaded value would erase them. `ProductRepository.update(..., updateStock:)` / `ProductModel.toUpdateMap(includeStock:)` leave `stock` out otherwise. A real correction still overwrites concurrent order deltas between loading and saving — accepted (R6.9 is a deliberate override; "receive stock" in T2.7 uses an atomic increment instead).
- `Validators.parsePrice` / `parseInteger` for values that passed validation.
- Test helper `useFakeProducts()` (`test/helpers/fake_repos.dart`); route tests use it (the admin screens now read real data) and the path-parameter test moved to a placeholder screen.
- **Tests:** 12 new (new: required errors incl. image, price/stock rules, save with Arabic digits + cache seed + back, save failure keeps form, image too large; edit: prefill, stock untouched → not written, stock corrected → written, new image v+1, hide → hint + isActive false, not found) + 1 model test; 236 total pass. `flutter analyze` clean.
- **Not checked on a device:** reaching the form needs an active admin, which comes from T1.10 (user). Camera / gallery / compression are therefore still unverified on a device.

**Affected:**
- Tasks: T2.3 ✅ (device check pending T1.10)
- STATUS.md

---

## CR-021 — 2026-10-21 — Product image pick, compression, cache + widget (T2.2)

**Request:** Implement T2.2.

**Decision / done:**
- **`ProductImageCompressor`** (R6.2, D§4.5): JPEG ≤ 200 KB, longest side ≤ 600 px. Steps (longest side, quality): (600, 70) → (600, 50) → (480, 50) → (360, 40); none fits → new `ImageTooLargeException` («الصورة كبيرة جداً، اختر صورة أخرى»).
  - `flutter_image_compress` scales so the **shorter** side reaches `min(minWidth, minHeight)` (checked in its Android source). The compressor reads the size first (`ui.ImageDescriptor`, no full decode) and passes the target short side for both, so the long side ends at the step's limit whatever the EXIF orientation. Never upscales.
  - Design said "re-compress (q50, then 480px)"; one extra step (360, 40) was added before giving up.
- **`ProductImagePicker` / `DeviceProductImagePicker`:** camera or gallery via `image_picker` (pre-shrunk to 1600 px, quality 95, no metadata), then the compressor. Cancel → null. `camera_access_denied` / `photo_access_denied` → new `ImageAccessDeniedException` («لا يمكن الوصول إلى الكاميرا أو الصور…»).
- **`ProductImageCache`** (in `get_it`): in-memory LRU (120 entries) keyed `id:imageVersion`; one request per key even with many tiles; failures not cached; `put` seeds the cache right after saving. Misses use `ProductRepository.getImage` (Firestore's offline cache serves repeats).
  - **Bug caught by the tests:** `whenComplete(() => _inFlight.remove(key))` returned the in-flight future itself, so the future waited on itself and never completed (every image would have spun forever). Fixed with a block body.
- **`ProductImage` widget:** synchronous hit from the cache, otherwise loading icon → image; missing → «no image» icon; error → retry button.
- **Tests:** 17 new (compressor steps / orientation / no upscale / too large; picker cancel / source + sizes / both access-denied codes; cache dedupe / version key / LRU / failure / put; widget load / missing / retry); 224 total pass. `flutter analyze` clean.
- Device check with real photos happens in T2.3 (the form is the first screen that picks).

**Affected:**
- Tasks: T2.2 ✅
- STATUS.md

---

## CR-020 — 2026-10-21 — Product model + repository (T2.1)

**Request:** Start Phase 2; implement T2.1.

**Decision / done:**
- **`features/products/domain/entities/product.dart`:** `Product` (every D§3.2 field; `shortage = max(0, -stock)`, `inStock`, `imageKey = id:imageVersion`) and `ProductDraft` (the fields an admin edits: name, description, price, stock, isActive).
- **`ProductModel`:** `fromSnapshot` / `fromMap` (whole prices read as double), `draftFields` (trimmed name, `nameLower = ArabicNormalizer.normalize(name)`, trimmed description, price rounded to 2 decimals), `toCreateMap` (counters 0, `imageVersion` 1, `createdBy`, server timestamps), `toUpdateMap` (never touches `activeQty` / `totalQty`; `imageVersion` += 1 only when the image changes), `imageMap` / `imageBytes` (`Blob` + `image/jpeg`).
- **`ProductRepository` + `ProductRepositoryImpl`** (in `get_it`): `watchActive` (`isActive == true` ordered by `nameLower` — index exists), `watchAll`, `watch(id)`, `get(id)`, `create` / `update` (product + image in **one `WriteBatch`**, D§4.5, R6.7), `setActive` (R6.4), `receiveStock` (`FieldValue.increment`, rejects ≤ 0, R6.8 — logic for T2.7), `getImage`. Writes check the connection first.
  - The product + image batch is in T2.1 (not T2.2) because a product can't be created without its image; T2.2 adds picking, compression and the image widget.
- `FirestorePaths`: `products`, `productImages`.
- **Tests:** 15 new (model fields, shortage, normalization + rounding, create/update maps, Blob round-trip; batch create, update with / without image, failed commit, offline, setActive, receiveStock + guard, getImage); 207 total pass. `flutter analyze` clean.

**Affected:**
- Tasks: T2.1 ✅
- STATUS.md

---

## CR-019 — 2026-10-21 — Users security rules tightened (T1.9) — deploy pending

**Request:** Implement T1.9 (users section of `firestore.rules`; deploy).

**Decision / done:** the users rules from CR-000 (deployed in CR-004) were reviewed against what the app writes and tightened. Same intent, no new permissions:
- **create:** keys limited to `name, phone, email, role, status, location, createdAt, updatedAt` (exactly `UserModel.toCreateMap`); `name` / `phone` strings; **`email == request.auth.token.email`** (no fake email copy); `createdAt` / `updatedAt == request.time` (server timestamps); admin profiles may not carry `location`. Before, any extra field (e.g. a planted `approvedBy`) and any email were accepted.
- **self-edit:** only `name, phone, location, updatedAt` may change (exactly `UserModel.toSelfUpdateMap`); `location` only for customers and must be a map; `updatedAt == request.time`. Before, any key except six named ones could be added or changed.
- **approve / reject:** unchanged, plus `approvedBy == request.auth.uid` when approving (audit trail can't be forged).
- read / delete unchanged.
- **D§5 updated** — the users block is identical to the repo `firestore.rules` (checked).
- `firebase deploy --only firestore:rules --dry-run` → compiled successfully against the project.
- **Not deployed:** the deploy to the live project was blocked by Claude Code's permission check (production deploy). **The user must run** `firebase deploy --only firestore:rules` in the Flutter project root. Until then the live project still runs the CR-004 rules (looser, but the app works with both).
- **Not tested on the emulator:** rules tests (D§9: Firebase Emulator + `@firebase/rules-unit-testing`) need the Firestore emulator jar and the npm package, which aren't installed; downloading them needs the user's OK.

**Affected:**
- Design: D§5 (users rules)
- Tasks: T1.9 (rules written; ⏳ deploy by user)
- STATUS.md

---

## CR-018 — 2026-10-21 — Admin registration + pending approval screen (T1.8)

**Request:** Implement T1.8.

**Decision / done:**
- **`RegisterAdminScreen`** (R3.1, R3.2): info note («بعد التسجيل سيراجع مسؤول آخر طلبك…») + shared `RegistrationFields` (no location) → `AuthRepository.registerAdmin`. The new profile is `pending`, so the session routes to the pending screen.
- **`PendingApprovalScreen`** (R3.3, R3.8): hourglass, «طلبك قيد المراجعة», explanation, the user's name + email, «تحديث» and «تسجيل الخروج». No back button. Approval (in the app or the Console) re-routes to the dashboard by itself through the session listener.
- **Refresh now asks the server (design change):** `SessionCubit.refresh()` is a `Future` that reads `users/{uid}` with `Source.server` (new `AuthRepository.fetchProfile`, online check first), applies it like a listener event (approved → admin area, rejected → signed out with «تم رفض طلبك», missing → «هذا الحساب غير موجود»), then re-subscribes the listener. The screen shows «لا يزال طلبك قيد المراجعة» when nothing changed and the connection message when offline.
- **Rejected handling (R3.4)** stays in the session (CR-013): a rejected admin is signed out with the message, shown on the login screen.
- **Bug fixed (found by the new tests):** `_forceSignOut` cleared the profile subscription only after awaiting its cancel, so a `refresh()` that ended in a forced sign-out re-subscribed a stale listener. The field is now cleared before the await.
- Test helper `useFakeSession` stubs `refresh` / `signOut`.
- **Tests:** 14 new (admin form: no location, submit, 5 required errors, pending redirect; pending screen: user shown + no back button, refresh still pending, refresh offline, live approval → dashboard, logout; session refresh: approved, still pending, rejected, offline, signed out; repo `fetchProfile` server source / missing / offline); 192 total pass. `flutter analyze` clean.
- **Device (Android emulator):** admin form renders RTL with the note. Pending screen needs a real pending account → checked in T1.10.

**Affected:**
- Design: D§4.1 (Refresh reads from the server) — see implementation notes
- Tasks: T1.8 ✅
- STATUS.md

---

## CR-017 — 2026-10-21 — Customer registration screen (T1.7) + location fixes found on device

**Request:** Implement T1.7.

**Decision / done:**
- **`RegisterCustomerScreen`** (R1.2–R1.7, R2): "بيانات الحساب" (shared `RegistrationFields`: name 3–50, Egyptian phone, email, password ≥ 8, confirmation) + `LocationCaptureSection` + «إنشاء الحساب» + «لديك حساب بالفعل؟ تسجيل الدخول».
  - `Form.validate()` covers every field and the GPS fix (R2.9); submit → `SubmitCubit` → `AuthRepository.registerCustomer`. Fields are disabled while submitting.
  - Errors: email in use (R1.6), rolled-back profile (R1.7) and the rest show as a SnackBar; the form keeps its values for retry. On success the session turns `customer` and the redirect opens products (R1.5).
- **`RegistrationFields` + `RegistrationControllers`** (`features/auth/presentation/widgets/`): reused by admin registration (T1.8).
- **Found on the Android emulator, fixed in the T1.6 code:**
  - **Google "Location Accuracy" consent:** geolocator's fused provider shows Google's consent dialog; declining it is reported as «location service off» although GPS is on, so the customer could never register. `PluginLocationPlatform.position` now retries once with the plain GPS provider (`AndroidSettings(forceLocationManager: true)`) when that happens and location services are on. Verified: declined → fix ± ٥ م.
  - **Messy Android address:** Android's `Placemark.street` is the whole address line (with postal code and country). `formatPlacemark` now builds the street from `subThoroughfare` + `thoroughfare` (falls back to `street`, as on iOS) and skips a level already contained in an earlier part. Verified: «1 شارع محمد محمود، ميدان التحرير، قسم قصر النيل، محافظة القاهرة».
  - The geocoder is created lazily (widget tests that use the real repository no longer touch the plugin).
  - Fix card: accuracy moved under the title (the row overflowed on narrow screens); login / register "have account" rows are `Wrap`s for the same reason.
- **Tests:** 9 new (empty form → 6 required errors + location error; R1.3 rules; no fix → not submitted; valid submit passes the captured `GeoLocation`; email-in-use and rollback messages keep the form; session → products) + 2 new placemark cases; 178 total pass. `flutter analyze` clean.
- **Device (Android emulator):** form renders RTL; permission prompt → «Only this time» → Google consent → «No thanks» → fix ± ٥ م + Arabic address prefilled. **Not submitted** — that would create a real account in the live project; the live registration run is part of T1.10 (with the user).
- Android permission dialog still shows the app as `merchant_orders` (label; final name is T7.5).

**Affected:**
- Tasks: T1.7 ✅
- STATUS.md

---

## CR-016 — 2026-10-21 — GPS location capture + AddressTile (T1.6)

**Request:** Implement T1.6.

**Decision / done:**
- **`LocationRepository`** (`features/location/`, in `get_it`): `currentFix()`, `addressFor(lat, lng)`, `openLocationSettings()`, `openAppSettings()`.
  - Flow per D§4.6: service off → `LocationServiceDisabledException`; permission `denied` → request once → still denied → `PermissionDeniedException`; `deniedForever` → new `LocationPermissionForeverException` («تم رفض إذن الموقع. اسمح به من إعدادات التطبيق»); high-accuracy fix with 15 s limit → `LocationTimeoutException`.
  - `addressFor` uses the device geocoder in Arabic (`locale: ar`), 8 s limit, never throws (null → user types it, R2.7). `formatPlacemark` joins street / district / city / governorate, drops blanks, repeats and plus codes ("8GQ7+XX"), caps at 200 chars.
  - Plugins sit behind a `LocationPlatform` adapter (`PluginLocationPlatform`) so the logic is unit-tested.
  - geocoding 5.0.0's `Geocoding(locale:)` constructor drops the locale, so the locale is passed on each call.
- **`LocationCaptureCubit`:** idle / locating / captured / failure, with `LocationFailureKind` (serviceOff, permissionDenied, permissionForever, other) choosing the UI action. A failed retry keeps the earlier fix. `GpsFix` value type added.
- **`LocationCaptureSection`** (form section, R2.1–R2.9): hint «تأكد إنك في المنزل أثناء تحديد الموقع»; capture button (→ «إعادة تحديد الموقع» after a fix); success card with accuracy («الدقة: ± ٨ م») and «معاينة في خرائط جوجل»; > 100 m → warning, value still accepted (R2.6); failure card with «فتح إعدادات الموقع» / «فتح إعدادات التطبيق» where relevant, otherwise the capture button is the retry; address (required ≤ 200, prefilled by the geocoder unless the user already typed one) + details (optional ≤ 200). A `FormField` makes `Form.validate()` fail without a fix (R2.9). `onChanged` returns the complete `GeoLocation` or null. `initial` supports the profile edit (T5.x).
- **`AddressTile`:** address + details + «فتح في خرائط جوجل»; `directions: true` opens navigation (admin, R11.3).
- **`core/utils/maps_links.dart`:** `MapsLinks.search` / `directions` (D§4.6 URLs) + `open` (external app, false on failure → «تعذر فتح خرائط جوجل»).
- **Tests:** 31 new (repository flow + timeouts + formatting; cubit success / 4 failure kinds / kept fix; section validation, prefill, typed address kept, cleared address, no geocoder result, low accuracy, settings buttons, denied once, initial value; AddressTile; URLs); 169 total pass. `flutter analyze` clean.
- Device check happens in T1.7, the first screen that uses the section.

**Affected:**
- Tasks: T1.6 ✅
- STATUS.md

---

## CR-015 — 2026-10-21 — Splash, Login, Forgot password, Choose account type (T1.5)

**Request:** Implement T1.5.

**Decision / done:**
- **`core/cubit/submit_cubit.dart`:** `SubmitCubit` / `SubmitState` (idle → loading → success | failure with the Arabic `mapFirebaseError` message). Ignores a second run while loading (double tap); no emit after close (screen left mid-request). Reused by every form from here on (login, reset, register, later profile/product forms).
- **`core/widgets/app_snack_bar.dart`:** `showAppSnackBar(context, message, isError:)`.
- **`features/auth/presentation/widgets/auth_form_layout.dart`:** scrollable, max-width 480 body for auth screens.
- **Splash:** app icon + name + `LoadingView(«جاري التحميل»)`; no links — the redirect moves on.
- **Login (R4.1):** email (Validators.email) + password (required only — length rules apply at registration), autofill, forgot-password + create-account links. Success: nothing to do here, the session routes. Shows `SessionState.message` once (forced sign-out: R3.4 / R4.4 / R4.6) — also when the message was set before the screen was built — then `clearMessage()`.
- **Forgot password:** sends the Firebase reset email, then a "sent" view with a neutral message («إذا كان البريد مسجلاً لدينا…»), because Firebase's email-enumeration protection doesn't say whether the email exists.
- **Choose account type (R1.1):** two cards (customer / admin) with a one-line hint each.
- New strings in `AppStrings` (auth forms block).
- **Tests:** 13 new (SubmitCubit 4; login validation / submit / error / session message live + preset / links; forgot password send + invalid; account type navigation); 138 total pass. Splash tests use `pump()` — its spinner never settles. `flutter analyze` clean.
- **Device (Android emulator, live Firebase):** login screen renders RTL; wrong credentials → «البريد الإلكتروني أو كلمة المرور غير صحيحة» from the real Auth error; account type cards show forward arrows (Material chevrons mirror in RTL).

**Affected:**
- Tasks: T1.5 ✅
- STATUS.md

---

## CR-014 — 2026-10-21 — Router redirect by session (T1.4)

**Request:** Implement T1.4 (user asked to run T1.4 → T1.10 in a row, committing after each).

**Decision / done:**
- **`core/router/session_redirect.dart`:** pure `sessionRedirect(status, location)` per D§4.1, plus `StreamListenable` (stream → `refreshListenable`).
  - unknown → `/splash`; unauthenticated → may stay under `/login/**` or `/register/**`, else `/login` (keeps the register screen up during registration — CR-013); customer → stays under `/customer/**`, else products; active admin → stays under `/admin/**`, else dashboard; pending admin → only `/pending-approval`.
  - Prefix match is by path segment (`/registered` is not under `/register`).
- **`createRouter`** reads `sl<SessionCubit>()`; every cubit emission re-runs the redirect, so sign-in, sign-out and Console edits re-route at once (R4.6, R3.8).
- **`app.dart`:** `BlocProvider.value(sl<SessionCubit>())` above `MaterialApp.router` → screens use `context.read<SessionCubit>()`. Creating the router starts the cubit at launch.
- `AppRoutes.customerRoot` / `adminRoot` added. Splash placeholder lost its dev links (redirect makes them pointless); `devCustomerArea` / `devAdminArea` strings removed.
- **Tests:** widget tests now swap the session for a `MockCubit` (`test/helpers/fake_session.dart`, `useFakeSession`) because the real cubit needs Firebase. Route tests grouped by session state + one live re-route sequence (unauth → pending → admin → unauth → customer); 9 pure redirect tests. 125 total pass. `flutter analyze` clean.
- **Device (Android emulator):** cold start with no session → splash → login; "إنشاء حساب" opens the choose-account-type screen (not bounced back).

**Affected:**
- Tasks: T1.4 ✅
- STATUS.md

---

## CR-013 — 2026-10-21 — Session cubit (T1.3)

**Request:** Implement T1.3.

**Decision / done:**
- **`features/session/presentation/cubit/`:** `SessionState` (`SessionStatus` unknown / unauthenticated / customer / adminActive / adminPending + live `user` + one-shot `message`) and `SessionCubit` (app-wide lazy singleton in `get_it`).
  - Auth uid → listener on `users/{uid}` → state per D§4.1. Live changes from the Console re-route while the app is open (R3.8, R4.6).
  - Forced sign-out + message: admin rejected → «تم رفض طلبك» (R3.4); customer not active → «تم إيقاف هذا الحساب» (R4.6); doc missing or malformed → «هذا الحساب غير موجود» (R4.4). Other listener errors → plain sign-out (R4.5). If `signOut` itself throws, the cubit still emits unauthenticated.
  - `signOut()` (logout, no message), `refresh()` (pending screen, re-subscribes — R3.8), `clearMessage()` (login screen after showing the message).
- **`AuthRepository` additions:** `authUidChanges()` (distinct uids), `watchProfile(uid)` and `isRegistering`.
  - **Cache miss ≠ missing:** `watchProfile` drops "doesn't exist" snapshots that come from the cache, so a cold offline start can't sign the user out by mistake.
  - **Registration race:** Firebase signs the new user in before the profile is written. `isRegistering` is true from account creation until the profile write finishes or is rolled back; the cubit ignores a missing profile then and keeps the current state, so the register screen stays up.
  - Known edge: Firestore shows the local profile write immediately, so a registration that later times out offline (T1.2 rollback) briefly routes to the home screen before returning to login. Needs the connection to drop right after the online check; accepted.
- New strings: `errorAccountNotFound`, `errorAdminRejected`.
- **Dev dependency:** `bloc_test` 10.0.0 (D§9).
- **Tests:** 23 new (18 cubit: every routing row, every forced sign-out, live approve / delete, registration with and without rollback, logout, failing signOut, clearMessage, refresh; 5 repo: cache-miss filter, malformed doc, distinct uids, `isRegistering` on success and failure); 111 total pass. `flutter analyze` clean.
- Not wired into the router or app yet (T1.4), so nothing to check on a device.

**Affected:**
- Design: D§4.1 (implementation notes)
- Tasks: T1.3 ✅
- STATUS.md

---

## CR-012 — 2026-10-21 — Auth repository (T1.2)

**Request:** Implement T1.2.

**Decision / done:**
- **`features/auth/domain/repositories/auth_repository.dart`:** `AuthRepository` interface — `signIn`, `signOut`, `sendPasswordReset`, `registerCustomer` (requires `GeoLocation`), `registerAdmin`.
  - Methods throw raw errors; callers map them with `mapFirebaseError`. They return nothing: the session (T1.3) routes from the auth + profile streams.
- **`features/auth/data/repositories/auth_repository_impl.dart`** (registered in `get_it`):
  - `ensureOnline()` before sign in, password reset and registration; `signOut` works offline.
  - Email trimmed (password never). Name trimmed; phone trimmed + Arabic-Indic digits → Western. Profile `email` = Auth's copy (lower-cased by Firebase).
  - Registration per D§4.2: create Auth user → write `users/{uid}` via `UserModel.toCreateMap` (customer → active + location, admin → pending).
  - **Rollback (R1.7):** if the profile write fails, `user.delete()` and throw new `RegistrationFailedException` → «تعذر إكمال إنشاء الحساب، حاول مرة أخرى» (new `AppStrings.errorRegistrationFailed`, new D§8 row).
  - **Profile-write timeout 20 s:** with offline persistence `set()` never fails offline — it waits for the server. The timeout turns that into a rollback instead of an endless spinner. A queued write that lands later is rejected by the rules because the Auth user is gone.
  - If the delete also fails: sign out. **Known limitation:** that leaves an Auth user without a profile — the email shows "already in use" on re-register and sign-in ends at R4.4 («هذا الحساب غير موجود») until it's deleted from the Console. Rare (needs the connection to drop between the two calls); accepted for MVP.
- **Dev dependency:** `mocktail` 1.0.5 (D§9).
- **Tests:** 11 new (customer/admin profile maps, digit conversion, email trimming, rollback on error / timeout / failed delete, email-in-use passthrough, offline guards, signOut offline, error message); 88 total pass. `flutter analyze` clean.
- **Not run against real Firebase** — it would create real accounts in the live project. First live check comes with the registration screens (T1.7/T1.8), full routing in T1.10.

**Affected:**
- Design: D§8 (`RegistrationFailedException` row)
- Tasks: T1.2 ✅
- STATUS.md

---

## CR-011 — 2026-10-21 — User + location models (T1.1)

**Request:** Implement T1.1.

**Decision / done:**
- **`features/auth/domain/entities/user_entity.dart`:** `UserEntity` (Equatable) with every D§3.1 field, plus `UserRole` (`customer` / `admin`) and `UserStatus` (`active` / `pending` / `rejected`) enums. Helpers: `isCustomer`, `isAdmin`, `isActive`, `isPending`, `isRejected`, `copyWith`.
  - Unknown role/status → `FormatException` (not a silent default), so a bad doc can't be routed as a valid user.
  - `createdAt` / `updatedAt` / `approvedAt` are nullable: server timestamps read back as `null` from the local cache until the write is confirmed.
- **`features/auth/data/models/user_model.dart`:** `UserModel.fromSnapshot` / `fromMap`, and two write maps that follow the D§5 users rules:
  - `toCreateMap`: profile + role + status + `location` (only when set) + server `createdAt` / `updatedAt`. No approval fields.
  - `toSelfUpdateMap`: only `name`, `phone`, optional `location`, `updatedAt`.
- **`features/location/`:** `GeoLocation` entity (`lat`, `lng`, `accuracyM`, `address`, `details`, `capturedAt`; `isLowAccuracy` > 100 m per R2.6) and `GeoLocationModel` map conversion. Whole numbers stored as `int` are read as `double`; missing `details` → `''`. Same map shape will be used for the order location snapshot (D§3.3).
- **`core/constants/firestore_paths.dart`** (listed in D§2, now created): `FirestorePaths.users`, `user(uid)`.
- No repository or DI changes (that's T1.2).
- **Tests:** 13 new (round-trip, int coordinates, accuracy threshold, all roles/statuses, pending timestamps, unknown values, write-map keys); 77 total pass. `flutter analyze` clean. No device run (models only).

**Affected:**
- Tasks: T1.1 ✅
- STATUS.md (progress, T1.1 conventions, §5 numbering fixed)

---

## CR-010 — 2026-10-20 — Offline cache + connectivity check (T0.8) — Phase 0 complete

**Request:** Implement T0.8 using `connectivity_plus` (user chose it over an internet-ping package or a timeout-only approach).

**Decision / done:**
- **Firestore offline cache:** `firestoreSettings = Settings(persistenceEnabled: true, cacheSizeBytes: 100 MB)`, applied in the `FirebaseFirestore` lazy singleton in `core/di/injection.dart`. That is the first access, as Firestore requires.
  - Persistence is already on by default on Android/iOS; this makes it explicit.
  - The cache is raised from the 40 MB default because product images live in Firestore (D§3.5).
- **`connectivity_plus` 7.3.1** behind `core/network/connectivity_service.dart`:
  - `ConnectivityService` interface (`isOnline`, `ensureOnline`) + `ConnectivityPlusService`. The check function is injectable for tests.
  - Registered in `get_it`.
  - It checks the network link, not real internet. Wi-Fi without internet still fails inside Firestore as `unavailable`, which maps to the same message.
- **New `NoConnectionException`** → «لا يوجد اتصال بالإنترنت» in `mapFirebaseError`.
- **Usage (later tasks):** `await sl<ConnectivityService>().ensureOnline()` at the start of place order (T3.4), change status (T4.4) and auth calls.
- **Tests:** 8 new (online for wifi / mobile / ethernet / vpn+wifi, offline for none / empty, exception mapping, cache settings); 64 total pass.
- **Device check (Android emulator, temporary probe, not committed):** Firestore settings read back as `persistence=true cache=104857600`. Airplane mode on → `online=false` + Arabic message; off → `online=true`.
- iOS not built (no iOS-specific change). The `connectivity_plus` pod will appear in `Podfile.lock` on the next iOS build.

**Affected:**
- Design: D§1.1 (Connectivity + Offline cache rows)
- Tasks: T0.8 ✅ — **Phase 0 done**
- STATUS.md

---

## CR-009 — 2026-10-20 — Errors, validators, formatters, Arabic normalizer (T0.7)

**Request:** Implement T0.7. User chose **`ar_EG` (Arabic-Indic digits)** for displayed numbers and dates.

**Decision / done:**
- **`core/errors/failure.dart`:** `Failure(message, cause)` (Equatable on message) and `mapFirebaseError(Object)`, which maps every D§8 case:
  - Auth/Firestore codes: `email-already-in-use`; `invalid-credential` / `wrong-password` / `user-not-found`; `user-disabled`; `network-request-failed` / `unavailable`; `permission-denied`.
  - Domain + location exceptions: `ProductUnavailableException` (one line per product name), `ConcurrentUpdateException`, geolocator `LocationServiceDisabledException` / `PermissionDeniedException`, `LocationTimeoutException`.
  - Everything else → default message. A `Failure` passes through unchanged.
- **`core/errors/app_exceptions.dart`:** `ProductUnavailableException`, `ConcurrentUpdateException`, `LocationTimeoutException`.
  - **Why a dedicated location timeout:** mapping every `TimeoutException` to the GPS message would mislabel unrelated timeouts. The location repo (T1.6) must throw `LocationTimeoutException`.
- **`core/utils/validators.dart`:**
  - name 3–50; Egyptian phone `01[0125]XXXXXXXX`; email; password ≥ 8 + confirm.
  - `requiredMax(n)` / `optionalMax(n)` for address 200, details 200, product name 80, description 500, note 300, cancel reason 200.
  - price > 0 with max 2 decimals; initial stock int ≥ 0; stock correction any int; received qty int > 0.
  - Numeric input accepts Arabic-Indic digits.
- **`core/utils/formatters.dart`** (ar_EG; `Formatters.init()` in `main.dart`):
  - `price` → «٢٥٠ ج.م» / «١٢٫٥٠ ج.م»
  - `number`
  - `date` → «٢٠ أكتوبر ٢٠٢٦»
  - `dateTime` → «٢٠ أكتوبر ٢٠٢٦، ٢:٠٥ م»
  - `shortOrderCode` → first 6 chars upper-case
- **`core/utils/arabic_normalizer.dart`:**
  - `normalize`: tashkeel/tatweel stripped, أ/إ/آ→ا, ة→ه, ى→ي, lower-case, Western digits, single spaces.
  - `digitsToWestern`: ٠-٩ / ۰-۹, ٫ → `.`, ٬ removed.
  - `prefixEnd` (U+F8FF) for Firestore prefix search.
- **`AppStrings`:** all D§8 errors + validation messages. Numbers inside messages use Arabic-Indic digits (`عجز ٥`, `الحد الأقصى ٢٠٠ حرفاً`). The phone example `01012345678` stays Western because users type it that way.
- **Tests:** 36 new (validators, formatters, normalizer, error mapping); 56 total pass.
- **Verified:** `flutter analyze` clean; Android launch OK (no startup errors). iOS not run.

**Affected:**
- Requirements: R14.1 (`ar_EG` digits, input digits accepted)
- Design: D§6 (search helper)
- Tasks: T0.7 ✅
- STATUS.md (conventions)

---

## CR-008 — 2026-10-20 — Core widgets (T0.6)

**Request:** Implement T0.6.

**Decision / done:** all in `lib/core/widgets/`.
- **`AppButton`:** variants filled / outlined / text / destructive, optional icon, full width by default. `isLoading` shows a spinner and ignores taps (R6.6).
- **`AppTextField`:** wraps `TextFormField` with an outlined border and validates on user interaction.
  - `isPassword` adds an eye toggle with Arabic tooltips and is always LTR.
  - `ltr` is for email / phone / numbers inside the RTL layout.
  - Also supports `maxLength`, `maxLines`, `readOnly`, `prefixIcon`, `autofillHints`.
- **`StatusBadge`:** colored pill.
  - `StatusBadge.order(OrderStatus)` uses the D§3.4 label + color.
  - `StatusBadge.shortage(n)` shows the red «عجز n» (R6.5).
- **`state_views.dart`:**
  - `LoadingView`: spinner + optional message.
  - `ErrorView`: Arabic message, default = D§8 «حدث خطأ غير متوقع، حاول مرة أخرى», optional «إعادة المحاولة».
  - `EmptyView`: message + optional action.
  - The three live in one file because they share a private layout.
- **`ConfirmDialog`:** `ConfirmDialog.show(...)` → `Future<bool>`, where dismiss counts as `false`. `isDestructive` gives a red confirm button (logout R5.5, reject admin R3.7).
- **New `OrderStatus` enum** in `features/orders/domain/entities/order_status.dart`, pulled forward from T3.3: Firestore `value`, `fromValue`, `isFinal`. `StatusBadge` needs it.
- **New `AppStrings`:** `confirm`, `cancel`, `retry`, `showPassword`, `hidePassword`, `emptyDefault`, `errorDefault`, `shortage(n)`.
- **Tests:** `test/core/widgets/core_widgets_test.dart` — 15 tests with the real theme + Arabic/RTL (loading blocks taps, destructive color, password toggle + LTR, RTL inheritance, validator, all 4 status labels/colors, shortage, `OrderStatus` mapping, state views, dialog confirm / cancel / dismiss). Total suite: 20 pass.
- **Verified:** `flutter analyze` clean. No device run — no screen uses the widgets yet. iOS not run.

**Affected:**
- Design: D§2 (`core/widgets` file list)
- Tasks: T0.6 ✅ (T3.3's `OrderStatus` part done early)
- STATUS.md

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
