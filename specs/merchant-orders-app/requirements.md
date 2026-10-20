# Requirements — Merchant Orders App (MVP)

> Spec version: CR-004 · see `CHANGELOG.md`

## 1. Introduction

A single Flutter app (Android + iOS) that replaces WhatsApp-based ordering for **one merchant** with **multiple admins** and many customers. Backend is **Firebase only** (Auth + Cloud Firestore) on the free **Spark plan with no billing account**. UI is **Arabic only (RTL)**.

### 1.1 Problems being solved

| # | Pain point (today, on WhatsApp) | Solved by |
|---|---|---|
| P1 | Merchant can't get the total requested quantity of each product | Req 7 — Product Demand Dashboard |
| P2 | Customer can't tell if the order is pending, being prepared, done… | Req 9, Req 10 — Order status tracking |
| P3 | Merchant doesn't know customers' locations | Req 2, Req 11, Req 12 — Home GPS location, opened in the Google Maps app |

### 1.2 Roles

- **Customer** — registers and is active immediately. Browses products, places orders, tracks them.
- **Admin** — registers as *pending*; can log in only after another admin (or someone in the Firebase Console) approves. Manages products, orders, admin approvals.

### 1.3 Out of scope (MVP)

- Push notifications (FCM / HMS Push)
- Payment methods of any kind (orders are settled offline)
- Customer cancelling an order
- Multi-merchant / multi-store
- English / multi-language
- Huawei Mobile Services (HMS) support
- Delivery fees, coupons, discounts
- Web / desktop builds
- Cloud Functions (keeps the project on the free Spark plan)
- Cloud Storage (requires Blaze) — product images are stored in Firestore
- In-app maps / Google Maps SDK — locations are GPS coordinates opened in the external Google Maps app

### 1.4 Glossary

- **Order status**: `pending` (قيد الانتظار) → `inProgress` (جاري التحضير) → `done` (تم) ; `pending | inProgress` → `cancelled` (ملغي).
- **Active quantity** of a product: sum of quantities in orders that are `pending` or `inProgress` — "what I still need to prepare".
- **Total requested quantity** of a product: sum of quantities in all orders that are **not** `cancelled`.
- **Home location**: GPS latitude/longitude captured from the device + address text (prefilled by reverse geocoding, editable) + optional details. No in-app map.
- **Offered product**: a product with `isActive = true`. Offered products are **always orderable**, regardless of stock.
- **Stock**: units the merchant physically has. It is decremented by every order and **can go negative** (e.g. stock 0 + 5 ordered → stock −5).
- **Shortage**: `max(0, −stock)` — units the merchant must buy/prepare to fulfil current orders.

---

## 2. Requirements

Format: user story + acceptance criteria in EARS style (`WHEN … THE APP SHALL …`).

### Requirement 1 — Customer registration

**User story:** As a customer, I want to create an account and use the app immediately, so that I can order without waiting for anyone.

1. THE APP SHALL let a new user choose a registration type: **عميل** (Customer) or **مسؤول** (Admin).
2. THE customer registration form SHALL require: full name, phone number, email, password, password confirmation, and home location (Req 2).
3. THE APP SHALL validate: name 3–50 chars; Egyptian mobile format `01[0125]XXXXXXXX`; valid email; password ≥ 8 chars; confirmation matches.
4. WHEN the form is valid, THE APP SHALL create a Firebase Auth account (email/password) AND a `users/{uid}` document with `role = customer` and `status = active`.
5. WHEN registration succeeds, THE APP SHALL log the customer in and open the customer home (products) screen with no approval step.
6. IF the email is already in use, THEN THE APP SHALL show "البريد الإلكتروني مستخدم بالفعل".
7. IF writing the Firestore profile fails after the Auth account was created, THEN THE APP SHALL delete the just-created Auth user and show a retry message (no orphan Auth accounts).

### Requirement 2 — Home location capture (GPS)

**User story:** As a customer, I want to save my home location from my phone's GPS, so that the merchant knows where to deliver.

1. THE registration and profile screens SHALL show a **"تحديد موقعي الحالي"** button that reads the device GPS position (high accuracy).
2. WHEN tapped, THE APP SHALL request location permission; IF denied, THEN show why it is needed and retry; IF permanently denied, THEN show a button that opens the app settings.
3. IF device location services (GPS) are off, THEN THE APP SHALL ask the user to enable them and offer a button that opens location settings.
4. THE APP SHALL show a hint: "تأكد إنك في المنزل أثناء تحديد الموقع".
5. WHEN a position is captured, THE APP SHALL show a success state, the accuracy in meters, and a **"معاينة في خرائط جوجل"** link that opens the coordinates in the external Google Maps app/browser.
6. IF accuracy is worse than 100 m, THEN THE APP SHALL warn the user and offer "إعادة المحاولة" (the user may still accept).
7. WHEN a position is captured, THE APP SHALL reverse-geocode it (device geocoder, Arabic) to prefill the **address** field; the address SHALL be required and editable (≤ 200 chars). IF geocoding fails, THEN the user types it.
8. THE APP SHALL provide an optional **details** field (building, floor, apartment, landmark), ≤ 200 chars.
9. THE APP SHALL NOT allow completing customer registration without captured coordinates AND an address.

### Requirement 3 — Admin registration & approval

**User story:** As a new admin, I want to request admin access, so that an existing admin can approve me.

1. THE admin registration form SHALL require: full name, phone, email, password, confirmation (location NOT required).
2. WHEN submitted, THE APP SHALL create the Auth account AND a `users/{uid}` document with `role = admin` and `status = pending`.
3. WHEN an admin with `status = pending` logs in, THE APP SHALL NOT open the admin area; it SHALL show a "طلبك قيد المراجعة" (awaiting approval) screen with Refresh and Logout buttons.
4. WHEN an admin with `status = rejected` logs in, THE APP SHALL show "تم رفض طلبك" and log out.
5. THE admin area SHALL contain an **Admin Requests** screen listing all users with `role = admin AND status = pending` (name, phone, email, request date).
6. WHEN an active admin taps **Approve**, THE APP SHALL set `status = active`, `approvedBy = <adminUid>`, `approvedAt = now`.
7. WHEN an active admin taps **Reject** (with confirmation dialog), THE APP SHALL set `status = rejected`.
8. WHEN a pending admin taps Refresh and their status is now `active`, THE APP SHALL open the admin area without re-login.
9. Approval SHALL also be possible manually from the Firebase Console by editing `users/{uid}.status` to `active`.
10. **Bootstrap:** the first admin SHALL be created by registering in the app and then setting `status = active` manually in the Firebase Console.

### Requirement 4 — Login, session, and account removal

**User story:** As any user, I want to log in once and stay logged in, and be routed to the right area for my role.

1. THE login screen SHALL accept email + password and offer "نسيت كلمة المرور" (Firebase password reset email).
2. WHEN login succeeds, THE APP SHALL load `users/{uid}` and route: customer → customer home; admin active → admin home; admin pending/rejected → Req 3.3/3.4.
3. WHEN the app starts with a persisted session, THE APP SHALL repeat the routing in 4.2 from a splash screen.
4. IF `users/{uid}` does not exist (e.g. deleted from the Firebase Console), THEN THE APP SHALL sign out and show "هذا الحساب غير موجود".
5. IF the Auth user was deleted/disabled in the Firebase Console, THEN THE APP SHALL treat the resulting auth error as signed-out and return to login.
6. THE APP SHALL listen to the current user's document in real time; IF `status` stops being `active` or the doc is deleted while the app is open, THEN THE APP SHALL sign out immediately.
7. Deleting an account is done by admins from the **Firebase Console** (Authentication user + `users/{uid}` doc). In-app account deletion is out of scope.

### Requirement 5 — Profile

**User story:** As a customer, I want to update my details and home location.

1. THE profile screen SHALL show name, phone, email (read-only), and home location (address, details, "فتح في خرائط جوجل").
2. THE customer SHALL be able to edit name, phone, and home location (re-capture GPS and/or edit address, Req 2).
3. WHEN saved, THE APP SHALL update `users/{uid}` (`updatedAt = now`). Existing orders SHALL keep their original location snapshot; new orders use the new location.
4. Admins SHALL be able to edit name and phone only.
5. THE profile screen SHALL have a Logout button with confirmation.

### Requirement 6 — Product management (Admin)

**User story:** As an admin, I want to create and update products, so that customers see an accurate catalog.

1. THE admin SHALL create a product with: name (required, ≤ 80), description (optional, ≤ 500), price in EGP (required, > 0, max 2 decimals), initial stock (required, integer ≥ 0, may be 0), image (required, from camera or gallery), offered/active flag (default true).
2. THE APP SHALL compress the image (max 600px on the longest side, JPEG ~70%, target ≤ 200 KB; re-compress at lower quality if larger) and store the bytes in Firestore `productImages/{productId}` (no Cloud Storage).
3. THE admin SHALL update any product field, including replacing the image and adjusting stock.
4. THE APP SHALL NOT hard-delete products (orders reference them). Instead the admin SHALL toggle **Active / Hidden**; hidden products don't appear to customers.
5. THE admin product list SHALL show image, name, price, stock, active flag, and a red **"عجز <n>"** (shortage) badge when stock < 0, with search by name.
6. WHILE saving, THE APP SHALL show a loading state and disable the Save button.
7. THE product data and its image SHALL be written atomically (one batch); IF saving fails, THEN nothing is saved and THE APP SHALL show a retry message.
8. THE admin SHALL have an **"إضافة كمية مستلمة"** (receive stock) action: enter a positive quantity → `stock += quantity` atomically (e.g. stock −5, receive 20 → stock 15).
9. THE admin MAY also set the stock to any integer directly from the product form (manual correction).

### Requirement 7 — Product demand dashboard (Admin) — solves P1

**User story:** As the merchant, I want to see how many units of each product are requested, so that I can prepare and buy stock without counting WhatsApp messages.

1. THE admin home SHALL show a **Product Demand** screen listing every product with: image, name, **active quantity** (pending + inProgress), **total requested quantity** (non-cancelled), current stock, and **shortage** (highlighted red when > 0).
2. THE list SHALL be sortable by active quantity (default, descending), total requested, or shortage (= "what to buy" list).
3. THE product quantities SHALL update in real time when orders are created or change status.
4. THE screen SHALL show summary cards at the top: count of orders per status (pending / inProgress / done / cancelled), refreshed on screen open, on pull-to-refresh, and after any status change.
5. WHEN an admin taps a product, THE APP SHALL show the list of active orders containing that product.
6. *(Assumption — confirm)* Date filtering (today / this week) is **not** in MVP; counters are all-time.

### Requirement 8 — Browse products (Customer)

**User story:** As a customer, I want to browse available products.

1. THE customer home SHALL show active products in a grid (image, name, price) with search by name, updating in real time.
2. Every offered product SHALL be orderable even when stock ≤ 0.
3. THE APP SHALL show stock to the customer: WHEN stock > 0 show "متوفر: <n>"; WHEN stock ≤ 0 show "متاح بالطلب — قد يستغرق التجهيز وقتاً أطول" (negative numbers are never shown to customers).
4. WHEN a customer taps a product, THE APP SHALL show details: large image, name, price, description, stock text (8.3), quantity selector, "أضف للسلة".
5. THE quantity selector SHALL be limited to 1…99 per product (not limited by stock).

### Requirement 9 — Cart & place order (Customer)

**User story:** As a customer, I want to put several products in a cart and send one order.

1. THE cart SHALL be local (on device), show items, quantities (editable), line totals, and grand total.
2. THE cart SHALL survive app restarts (local persistence).
3. THE order confirmation screen SHALL show items, total, delivery location (profile home location, read-only with "تغيير" → profile), and an optional note (≤ 300 chars).
4. WHEN the customer taps **تأكيد الطلب**, THE APP SHALL, in **one Firestore transaction**: re-read each product; verify it still exists and is offered (`isActive = true`); decrement stock (**allowed to go below 0**); increment `activeQty` and `totalQty`; create the order with `status = pending`.
5. IF any product was hidden or removed, THEN THE APP SHALL abort the whole transaction, show which item(s) are no longer available, and remove them from the cart. Stock level never blocks an order.
6. THE order SHALL snapshot product name and price (images are shown live by `productId`), plus customer name, phone, and location — later product/profile edits SHALL NOT change past orders.
7. WHEN the order is created, THE APP SHALL clear the cart and open the order details screen.
8. THE customer SHALL NOT be able to cancel or edit an order after it is placed.

### Requirement 10 — My orders (Customer) — solves P2

**User story:** As a customer, I want to see the status of my orders without asking on WhatsApp.

1. THE **طلباتي** screen SHALL list the customer's orders newest first: short order number, date, item count, total, status badge with color.
2. THE list SHALL have tabs/filters: الكل / قيد الانتظار / جاري التحضير / تم / ملغي.
3. THE order details screen SHALL show items, quantities, prices, total, note, delivery location, current status, and a **status timeline** (each status with date/time).
4. IF the order is cancelled, THEN details SHALL show the cancellation reason.
5. Status changes SHALL appear in real time while the screen is open (Firestore snapshot listener — no push notifications in MVP).

### Requirement 11 — Order management (Admin) — solves P2 & P3

**User story:** As an admin, I want to manage incoming orders and know where each customer is.

1. THE admin orders screen SHALL list all orders newest first, filterable by status, updating in real time, with a count badge on "pending".
2. THE admin order details SHALL show customer name, **tap-to-call phone**, items, total, note, status timeline, and delivery address + details.
3. THE location section SHALL have **"فتح في خرائط جوجل"** which opens the order's GPS coordinates in the external Google Maps app (URL — no in-app map, no API key).
4. THE admin SHALL change the status only along allowed transitions:
   - `pending` → `inProgress` or `cancelled`
   - `inProgress` → `done` or `cancelled`
   - `done` and `cancelled` are final.
5. WHEN cancelling, THE APP SHALL require a cancellation reason (≤ 200 chars) and confirmation.
6. WHEN status changes, THE APP SHALL in one transaction update the order (`status`, `statusHistory` entry with `by` and `at`, `updatedAt`) AND adjust product counters:
   - → `done`: `activeQty -= qty`
   - → `cancelled`: `activeQty -= qty`, `totalQty -= qty`, `stock += qty` (stock restored)
7. IF two admins update the same order at the same time, THEN the transaction SHALL re-check the current status and reject an invalid transition with "تم تحديث الطلب بواسطة مسؤول آخر".

### Requirement 12 — Customers directory (Admin) — solves P3

**User story:** As the merchant, I want to see my customers and where they live.

1. THE admin SHALL see a customers list (name, phone, address) with search by name/phone.
2. WHEN an admin taps a customer, THE APP SHALL show their details, address, "فتح في خرائط جوجل", tap-to-call, and their orders.
3. *(Phase 2 — needs Google Maps SDK + billing)* A map view showing all customers as markers.

### Requirement 13 — Security

1. Firestore Security Rules SHALL enforce all role and status rules server-side; the UI is not trusted.
2. A user SHALL NOT be able to set or change their own `role` or `status` (except creating their own doc with `customer/active` or `admin/pending`).
3. Customers SHALL read only their own user doc and their own orders; active admins SHALL read all.
4. Customers SHALL NOT create/edit products; on order placement they MAY change only `stock`, `activeQty`, `totalQty` with matching deltas, on offered products only (see design §5). Stock may become negative.
5. Only active admins SHALL change order status or approve admins.
6. `productImages`: only active admins can write (max ~300 KB per image); active users can read.

### Requirement 14 — Non-functional

1. **Language:** Arabic only, RTL layout, Arabic font (Cairo), Arabic number/date formatting (`intl`, `ar`).
2. **Platforms:** Android (minSdk 24 — Flutter 3.38 minimum, CR-004) and iOS (15+).
3. **Offline:** Firestore offline cache enabled; placing an order and changing status REQUIRE connectivity (transactions) — show "لا يوجد اتصال بالإنترنت".
4. **Performance:** lists use pagination/limits (e.g. 20 per page for orders); images cached.
5. **Errors:** every Firebase error mapped to a clear Arabic message; no raw exceptions shown.
6. **Cost:** runs on the Firebase Spark (free) plan with **no billing account** — no Cloud Storage, no Maps SDK, no Cloud Functions.

---

## 3. Assumptions & open points (please confirm)

1. **Auth method:** email + password (phone is stored, not verified by OTP). Phone OTP can come in Phase 2.
2. **Counters:** "total requests" = all-time non-cancelled quantity; plus "active quantity" (pending + inProgress) because that's what the merchant actually prepares.
3. **Admin rejection** exists alongside approval (otherwise pending requests stay forever).
4. **Delivery location per order** = customer's home location at the time of ordering (no per-order address).
5. **Order number:** 6-char short code derived from the doc id (sequential numbers need a counter doc — Phase 2 if wanted).
6. **Negative stock (confirmed):** offered products are always orderable; stock can go negative and the shortage drives the merchant's purchasing. Customers see positive stock numbers only.
7. **Max 99 per product per order** to prevent accidental huge quantities, since stock no longer limits the selector.
8. **Known MVP limitation:** without Cloud Functions, product counters are updated by the client inside transactions and protected by rules; a malicious client could still skew counters within the allowed delta rules. Acceptable for MVP; Phase 2 moves counters to Cloud Functions.
9. **Images in Firestore (CR-002):** product images are small, so they are stored as bytes in a separate `productImages` collection (kept out of `products` so counter updates on every order don't re-send image bytes). Move to Cloud Storage if the catalog grows large.
10. **GPS-only location (CR-002):** the customer must be at home when capturing (or update later from profile); the address text is required so the merchant can still find the place if GPS is off by a few meters.
