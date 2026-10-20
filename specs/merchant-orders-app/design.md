# Design — Merchant Orders App (MVP)

Traceability: `R<n>.<m>` refers to `requirements.md`.

## 1. Architecture overview

```
┌──────────────────────── Flutter app (one app, two roles) ────────────────────────┐
│ presentation  : Screens + Widgets + Cubits (flutter_bloc)                          │
│ domain        : Entities + Repository interfaces                                   │
│ data          : Models (fromFirestore/toMap) + Repository implementations          │
│ core          : DI (get_it), Router (go_router), Theme/RTL, Errors, Arabic strings │
└──────────────┬───────────────────────────┬───────────────────────────┬────────────┘
               │                           │                           │
        Firebase Auth              Cloud Firestore               Device services
       (email/password)   users · products · productImages   GPS (geolocator)
                          · orders (rules = the real backend) geocoder (address)
                                                              url_launcher → Google Maps app
```

- **No custom backend, no Cloud Functions, no Cloud Storage, no Maps SDK** → Spark plan, **no billing account** (CR-002). Business invariants (role, status transitions, stock/counter deltas) live in **Firestore Security Rules** + **client transactions**.
- **Real-time first**: lists use Firestore `snapshots()` so status changes appear without push notifications (R10.5).

### 1.1 Tech stack

| Concern | Choice |
|---|---|
| Flutter | latest stable 3.x, Dart 3 |
| State management | `flutter_bloc` (Cubit) + `equatable` |
| DI | `get_it` |
| Routing | `go_router` with role-based `redirect` |
| Firebase | `firebase_core`, `firebase_auth`, `cloud_firestore` (config via `flutterfire configure`) |
| Location | `geolocator` (GPS + permissions + open settings), `geocoding` (address prefill); Google Maps opened externally via `url_launcher` |
| Images | `image_picker`, `flutter_image_compress`; bytes in Firestore, rendered with `Image.memory` + in-memory LRU cache |
| Cart persistence | `hydrated_bloc` (or `shared_preferences`) |
| Utils | `url_launcher` (call / Google Maps), `intl` (ar dates & currency), `flutter_localizations` |
| Font | Cairo (bundled asset) |

Optional (fits your usual setup, not required for MVP): `dev` / `prod` flavors pointing at two Firebase projects.

## 2. Project structure (feature-first)

```
lib/
├── main.dart
├── app.dart                         # MaterialApp.router, locale ar, RTL, theme
├── firebase_options.dart
├── core/
│   ├── di/injection.dart
│   ├── router/app_router.dart       # routes + redirect by SessionState
│   ├── theme/app_theme.dart         # colors, Cairo font, status colors
│   ├── constants/app_strings.dart   # all Arabic UI strings
│   ├── constants/firestore_paths.dart
│   ├── errors/failure.dart          # Failure + mapFirebaseError() → Arabic message
│   ├── utils/validators.dart        # name, egyptian phone, email, password, price
│   ├── utils/formatters.dart        # EGP currency, ar dates, short order no.
│   └── widgets/                     # AppButton, AppTextField, StatusBadge, EmptyView, ErrorView, LoadingView, ConfirmDialog
└── features/
    ├── session/                     # SessionCubit: listens to auth + users/{uid}
    ├── auth/                        # login, register (customer/admin), forgot password, pending approval screen
    ├── location/                    # LocationCaptureSection (GPS), AddressTile (+ open in Google Maps), GeoLocation entity
    ├── profile/
    ├── products/                    # customer browsing + admin CRUD
    ├── cart/                        # CartCubit (hydrated)
    ├── orders/                      # place order, my orders, admin orders, status update
    ├── dashboard/                   # product demand + status counts (admin)
    ├── admin_requests/              # pending admins approve/reject
    └── customers/                   # customers directory (admin)

each feature/
├── data/        models/, repositories/<x>_repository_impl.dart
├── domain/      entities/, repositories/<x>_repository.dart
└── presentation/ cubit/, screens/, widgets/
```

## 3. Data model (Cloud Firestore)

### 3.1 `users/{uid}`

| Field | Type | Notes |
|---|---|---|
| `name` | string | |
| `phone` | string | `01XXXXXXXXX` |
| `email` | string | copy of Auth email, read-only |
| `role` | string | `customer` \| `admin` |
| `status` | string | `active` \| `pending` \| `rejected` |
| `location` | map? | customers only: `{ lat, lng, accuracyM: number, address: string, details: string, capturedAt: timestamp }` — device GPS |
| `approvedBy` | string? | admin uid (admins only) |
| `approvedAt` | timestamp? | |
| `createdAt` / `updatedAt` | timestamp | `FieldValue.serverTimestamp()` |

### 3.2 `products/{productId}`

| Field | Type | Notes |
|---|---|---|
| `name` | string | |
| `nameLower` | string | for prefix search |
| `description` | string | |
| `price` | number | EGP |
| `imageVersion` | int | +1 whenever the image changes (cache key); bytes live in `productImages/{productId}` (§3.5) |
| `stock` | int | physical units; **can be negative** (negative = shortage). UI computes `shortage = max(0, -stock)` |
| `activeQty` | int | Σ qty in `pending` + `inProgress` orders (R7) |
| `totalQty` | int | Σ qty in non-cancelled orders (R7) |
| `isActive` | bool | "offered": the **only** gate for ordering; hidden when false (R6.4, R8.2) |
| `createdAt` / `updatedAt` | timestamp | |
| `createdBy` | string | admin uid |

> **Why counters on the product doc?** The demand dashboard (P1) becomes a single real-time `products` query — no aggregation over orders, cheap reads, live updates.

### 3.3 `orders/{orderId}`

| Field | Type | Notes |
|---|---|---|
| `shortCode` | string | first 6 chars of id, upper-case (display only) |
| `customerId` | string | |
| `customerName`, `customerPhone` | string | snapshot (R9.6) |
| `location` | map | snapshot of customer location |
| `items` | array<map> | `{ productId, name, price, qty, lineTotal }` (image shown live by `productId`) |
| `productIds` | array<string> | for "orders containing product X" (R7.5) |
| `itemsCount` | int | Σ qty |
| `total` | number | Σ lineTotal |
| `note` | string | optional |
| `status` | string | `pending` \| `inProgress` \| `done` \| `cancelled` |
| `statusHistory` | array<map> | `{ status, at: timestamp, by: uid }` (R10.3) |
| `cancelReason` | string? | |
| `createdAt` / `updatedAt` | timestamp | |
| `updatedBy` | string? | admin uid of last status change |

> `statusHistory[].at` uses `Timestamp.now()` (client) because `serverTimestamp()` is not allowed inside arrays.

### 3.4 Status machine (R11.4)

```
           ┌──────────► cancelled (final)
           │               ▲
 pending ──┴──► inProgress ┴──► done (final)
```

| Transition | Product counter effect (per item qty) |
|---|---|
| create → `pending` | `stock -= q` (may go < 0), `activeQty += q`, `totalQty += q` |
| admin "receive stock" (R6.8) | `stock += received` |
| `pending` → `inProgress` | none |
| `inProgress` → `done` | `activeQty -= q` |
| `pending`/`inProgress` → `cancelled` | `activeQty -= q`, `totalQty -= q`, `stock += q` |

Status colors / labels: pending = amber "قيد الانتظار", inProgress = blue "جاري التحضير", done = green "تم", cancelled = red "ملغي".

### 3.5 `productImages/{productId}` (CR-002)

| Field | Type | Notes |
|---|---|---|
| `data` | bytes (`Blob`) | compressed JPEG, ≤ 200 KB target (rule hard cap 300 KB; Firestore doc limit 1 MiB) |
| `contentType` | string | `image/jpeg` |
| `updatedAt` | timestamp | |

> **Why a separate collection?** `products` docs change on every order (stock/counters). If the image lived inside the product doc, every order would re-send the image bytes to every listening admin/customer. Here the image is fetched once per `imageVersion` and cached.

**`ProductImage` widget:** key = `productId:imageVersion` → check in-memory LRU → else `productImages/{id}.get()` (Firestore offline cache serves repeats) → `Image.memory`. Placeholder while loading, icon on error.

## 4. Key flows

### 4.1 Session & routing (R4)

`SessionCubit` combines `FirebaseAuth.authStateChanges()` with a snapshot listener on `users/{uid}`:

| SessionState | Route |
|---|---|
| `unknown` | `/splash` |
| `unauthenticated` | `/login` |
| `customer` (active) | `/customer` shell (Products · Cart · My Orders · Profile) |
| `adminActive` | `/admin` shell (Dashboard · Orders · Products · More[Requests, Customers, Profile]) |
| `adminPending` | `/pending-approval` |
| `rejected` / doc missing | sign out + message → `/login` (R3.4, R4.4) |

`go_router.redirect` reads `SessionCubit.state` and `refreshListenable` is a stream adapter on the cubit, so a status change in the Firebase Console (approve / delete / reject) re-routes immediately (R4.6, R3.8).

### 4.2 Registration (R1, R3)

```
validate form → createUserWithEmailAndPassword
  → set users/{uid} { role, status: customer→active | admin→pending, ... }
     ├─ success → SessionCubit picks it up → routes
     └─ failure → currentUser.delete() → show retry (R1.7)
```

### 4.3 Place order transaction (R9.4–9.6)

```dart
await firestore.runTransaction((tx) async {
  // 1) READS FIRST (Firestore rule: all reads before writes)
  final snaps = <String, DocumentSnapshot>{};
  for (final item in cart.items) {
    snaps[item.productId] = await tx.get(productsRef.doc(item.productId));
  }
  // 2) VALIDATE — only "is it still offered?"; stock never blocks (R8.2)
  final unavailable = cart.items
      .where((i) => !snaps[i.productId]!.exists || snaps[i.productId]!['isActive'] != true)
      .toList();
  if (unavailable.isNotEmpty) throw ProductUnavailableException(unavailable); // R9.5 – nothing written
  // 3) WRITES
  for (final item in cart.items) {
    tx.update(productsRef.doc(item.productId), {
      'stock':     FieldValue.increment(-item.qty),   // may become negative
      'activeQty': FieldValue.increment(item.qty),
      'totalQty':  FieldValue.increment(item.qty),
    });
  }
  tx.set(orderRef, order.toMap());   // status: pending, snapshots, statusHistory[pending]
});
```

> Note: the same product must appear only once in the cart (merge quantities) so the rules' delta check sees one update per product.
>
> **Concurrency:** two customers ordering the same product at once both succeed — the second transaction is retried automatically by Firestore with fresh values, so the counters stay exact (e.g. stock 0 → −2 → −5). The transaction (not a plain batch) is still needed for the `isActive` re-check.

### 4.4 Change status transaction (R11.6–11.7)

```
tx.get(order) → if current status != expected `from` OR transition invalid → throw ConcurrentUpdate
for each item: tx.update(product, counter deltas from §3.4)   // use increment()
tx.update(order, { status, statusHistory: arrayUnion({status, at, by}), cancelReason?, updatedAt, updatedBy })
```
After success → refresh dashboard status counts.

### 4.5 Product create/update (R6)

```
pick image → compress (600px, q70) → if > 200 KB: re-compress (q50, then 480px)
→ productId = products.doc().id
→ WriteBatch:
     set products/{id}       { ..., imageVersion: 1, activeQty: 0, totalQty: 0 }
     set productImages/{id}  { data: Blob(bytes), contentType, updatedAt }
→ commit (atomic — R6.7)
```
Image replacement: same batch updates `productImages/{id}` and `products/{id}.imageVersion += 1` → all clients drop the old cache entry automatically.

### 4.6 Location capture — GPS only (R2)

```
tap "تحديد موقعي الحالي"
→ Geolocator.isLocationServiceEnabled()  — off → dialog + Geolocator.openLocationSettings()
→ checkPermission / requestPermission     — deniedForever → Geolocator.openAppSettings()
→ getCurrentPosition(accuracy: high, timeLimit: 15s)
→ accuracy > 100 m → warning + retry (user may accept)
→ placemarkFromCoordinates(lat, lng) with locale ar → prefill address (editable; manual if it fails)
→ GeoLocation(lat, lng, accuracyM, address, details, capturedAt)
```

- **`AddressTile`** (profile, order details, customer details): address + details + **"فتح في خرائط جوجل"** →
  `https://www.google.com/maps/search/?api=1&query=<lat>,<lng>` (or `/dir/?api=1&destination=<lat>,<lng>` for navigation) via `url_launcher` with `LaunchMode.externalApplication` (R11.3).
- No Google Maps SDK, no API key, no billing.

### 4.7 Dashboard (R7)

- **Product demand list:** `products.orderBy('activeQty', descending: true).snapshots()` — real-time, toggle sort to `totalQty`, or to shortage via `orderBy('stock')` ascending (most negative first).
- **Receive stock (R6.8):** `products/{id}.update({'stock': FieldValue.increment(received), 'updatedAt': serverTimestamp()})`.
- **Status cards:** 4 × `orders.where('status', isEqualTo: s).count().get()` (aggregation = cheap, not real-time → refreshed on open / pull / after status change).
- **Tap product:** `orders.where('productIds', arrayContains: id).where('status', whereIn: ['pending','inProgress']).orderBy('createdAt', descending: true)`.

## 5. Firestore Security Rules (R13)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function signedIn() { return request.auth != null; }
    function me() { return get(/databases/$(database)/documents/users/$(request.auth.uid)).data; }
    function hasProfile() { return exists(/databases/$(database)/documents/users/$(request.auth.uid)); }
    function isActiveAdmin()    { return signedIn() && hasProfile() && me().role == 'admin'    && me().status == 'active'; }
    function isActiveCustomer() { return signedIn() && hasProfile() && me().role == 'customer' && me().status == 'active'; }
    function changed() { return request.resource.data.diff(resource.data).affectedKeys(); }

    // ---------- users ----------
    match /users/{uid} {
      allow read: if signedIn() && (request.auth.uid == uid || isActiveAdmin());

      allow create: if signedIn() && request.auth.uid == uid
        && ((request.resource.data.role == 'customer' && request.resource.data.status == 'active'
             && request.resource.data.location is map)
         || (request.resource.data.role == 'admin' && request.resource.data.status == 'pending'));

      allow update: if signedIn() && (
           // self-edit: never role/status/approval/email
           (request.auth.uid == uid
             && !changed().hasAny(['role', 'status', 'approvedBy', 'approvedAt', 'email', 'createdAt']))
           // admin approves / rejects another admin
        || (isActiveAdmin() && request.auth.uid != uid
             && resource.data.role == 'admin'
             && changed().hasOnly(['status', 'approvedBy', 'approvedAt', 'updatedAt'])
             && request.resource.data.status in ['active', 'rejected'])
      );

      allow delete: if false;   // deletion only from Firebase Console (R4.7)
    }

    // ---------- products ----------
    match /products/{productId} {
      allow read: if isActiveAdmin() || (isActiveCustomer() && resource.data.isActive == true);
      allow create: if isActiveAdmin()
        && request.resource.data.activeQty == 0 && request.resource.data.totalQty == 0
        && request.resource.data.stock is int && request.resource.data.stock >= 0
        && request.resource.data.price > 0;
      allow update: if isActiveAdmin() || (isActiveCustomer() && validOrderDelta());
      allow delete: if false;   // soft delete via isActive (R6.4)

      // customer placing an order: stock goes down by d (may go negative), both counters go up by d
      function validOrderDelta() {
        let before = resource.data;
        let after  = request.resource.data;
        let d = before.stock - after.stock;
        return changed().hasOnly(['stock', 'activeQty', 'totalQty'])
          && before.isActive == true
          && d > 0 && d <= 99
          && after.activeQty == before.activeQty + d
          && after.totalQty  == before.totalQty  + d;
      }
    }

    // ---------- productImages (CR-002) ----------
    match /productImages/{productId} {
      allow read: if isActiveAdmin() || isActiveCustomer();
      allow create, update: if isActiveAdmin()
        && request.resource.data.data is bytes
        && request.resource.data.data.size() <= 300 * 1024;
      allow delete: if false;
    }

    // ---------- orders ----------
    match /orders/{orderId} {
      allow read: if isActiveAdmin()
        || (isActiveCustomer() && resource.data.customerId == request.auth.uid);

      allow create: if isActiveCustomer()
        && request.resource.data.customerId == request.auth.uid
        && request.resource.data.status == 'pending'
        && request.resource.data.items is list
        && request.resource.data.items.size() > 0
        && request.resource.data.items.size() <= 50;

      allow update: if isActiveAdmin()
        && changed().hasOnly(['status', 'statusHistory', 'cancelReason', 'updatedAt', 'updatedBy'])
        && validTransition(resource.data.status, request.resource.data.status)
        && (request.resource.data.status != 'cancelled' || request.resource.data.cancelReason is string);

      allow delete: if false;

      function validTransition(from, to) {
        return (from == 'pending'    && to in ['inProgress', 'cancelled'])
            || (from == 'inProgress' && to in ['done', 'cancelled']);
      }
    }
  }
}
```

> Customer product queries **must** include `where('isActive', isEqualTo: true)` or Firestore rejects the query (rules are not filters). Customer order queries **must** include `where('customerId', isEqualTo: uid)`.

### 5.1 Storage rules

Not used — no Cloud Storage (CR-002).

## 6. Firestore composite indexes (`firestore.indexes.json`)

| Collection | Fields | Used by |
|---|---|---|
| `orders` | `customerId ↑`, `createdAt ↓` | My orders (all) |
| `orders` | `customerId ↑`, `status ↑`, `createdAt ↓` | My orders by status |
| `orders` | `status ↑`, `createdAt ↓` | Admin orders by status |
| `orders` | `productIds (array-contains)`, `status ↑`, `createdAt ↓` | Dashboard → orders of a product |
| `products` | `isActive ↑`, `createdAt ↓` | Customer catalog |
| `products` | `isActive ↑`, `nameLower ↑` | Customer search |
| `products` | `stock ↑` (single-field, auto — **not** listed in `firestore.indexes.json`, the CLI rejects single-field composites) | Dashboard sort by shortage |
| `users` | `role ↑`, `status ↑`, `createdAt ↓` | Admin requests |
| `users` | `role ↑`, `name ↑` | Customers directory |

Search: prefix query `nameLower >= q && nameLower < q + ''` (Arabic: store normalized text — strip tashkeel, unify `أ/إ/آ → ا`, `ة → ه`, `ى → ي`).

## 7. Screens map

| Area | Screen | Req |
|---|---|---|
| Shared | Splash, Login, Forgot password, Choose account type, Register (customer), Register (admin), Pending approval, Location capture (GPS section), Profile | R1–R5 |
| Customer | Products grid, Product details, Cart, Checkout/confirm, My orders (tabs), Order details + timeline | R8–R10 |
| Admin | Dashboard (status cards + product demand), Orders (filter), Order details (call, map, status actions), Products list, Product form, Admin requests, Customers list, Customer details | R6, R7, R11, R12, R3 |

## 8. Error handling

`mapFirebaseError(e)` → `Failure(messageAr)`:

| Code | Arabic message |
|---|---|
| `email-already-in-use` | البريد الإلكتروني مستخدم بالفعل |
| `invalid-credential` / `wrong-password` / `user-not-found` | البريد الإلكتروني أو كلمة المرور غير صحيحة |
| `user-disabled` | تم إيقاف هذا الحساب |
| `network-request-failed` / `unavailable` | لا يوجد اتصال بالإنترنت |
| `permission-denied` | ليس لديك صلاحية لتنفيذ هذا الإجراء |
| `ProductUnavailableException` | المنتج "<اسم المنتج>" لم يعد متاحاً وتم حذفه من السلة |
| `ConcurrentUpdate` | تم تحديث الطلب بواسطة مسؤول آخر |
| location services off | من فضلك فعّل خدمة الموقع (GPS) |
| location permission denied | يجب السماح بالوصول للموقع لتحديد عنوان المنزل |
| GPS timeout | تعذر تحديد الموقع، حاول مرة أخرى في مكان مفتوح |
| default | حدث خطأ غير متوقع، حاول مرة أخرى |

## 9. Testing strategy

- **Unit:** validators, formatters, Arabic normalizer, status transition helper, counter-delta calculator, model `fromMap/toMap`.
- **Cubit tests:** `bloc_test` + `mocktail` for Session, Auth, Cart, PlaceOrder, OrderStatus.
- **Rules tests:** Firebase Emulator Suite + `@firebase/rules-unit-testing` — every allow/deny in §5 (self role escalation, customer editing product price, invalid transition, reading others' orders…).
- **Manual QA checklist:** two devices — customer places order, admin moves it pending → inProgress → done, customer sees timeline live; two customers ordering a stock-0 product at the same time → stock ends at exactly −(q1+q2) and both orders exist; cancel one → stock and counters restored; receive stock on a negative product; admin hides a product while it's in a customer's cart → checkout rejects it; approve admin from Console while pending screen is open; GPS permission denied / permanently denied / location services off during registration; "فتح في خرائط جوجل" opens the right point; large photo gets re-compressed under 200 KB; replacing an image updates it on another device.

## 10. Firebase / platform setup

1. Create Firebase project (stay on **Spark**, no billing) → enable **Email/Password** auth and **Firestore** (production mode, region close to Egypt — cannot be changed later). Do **not** enable Storage.
2. `flutterfire configure` (Android + iOS).
3. Android: `ACCESS_FINE_LOCATION` + `ACCESS_COARSE_LOCATION` in `AndroidManifest.xml`; `<queries>` entries for `VIEW https` and `DIAL tel` intents (url_launcher on Android 11+). No `CAMERA` / storage permission — `image_picker` uses the system camera intent and photo picker (CR-005).
4. iOS: `NSLocationWhenInUseUsageDescription`, `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription` (Arabic text) in `Info.plist`; `LSApplicationQueriesSchemes` = `comgooglemaps`, `tel` (CR-005).
5. Deploy `firestore.rules` and `firestore.indexes.json` via Firebase CLI (`firebase deploy --only firestore`).
6. Bootstrap first admin: register as admin in app → Console → `users/{uid}.status = "active"` (R3.10).

### 10.1 Provisioned environment (CR-003, verified 2026-10-20)

| Item | Value |
|---|---|
| Project ID / number | `merchant-orders-39dd1` / `658495017371` |
| Plan | Spark, no billing |
| Auth | Email/Password on · Email link off · no other providers |
| Firestore | `(default)` · Standard · Native · `europe-west1` · production mode |
| Rules | §5 deployed from repo `firestore.rules` via Firebase CLI (CR-004) |
| Indexes | 8 composite indexes deployed 2026-10-20 (T0.2c, CR-004) |
| Apps | Android `com.mostafasamy.merchant_orders` (`1:658495017371:android:851470e927dca09816d13e`) · iOS `com.mostafasamy.merchantOrders` (`1:658495017371:ios:96c4a81f3016720116d13e`) (CR-004) |
| Flutter project path | `/Users/mostafasamy/StudioProjects/merchant_orders` |

Repo layout for Firebase CLI (project root):
```
merchant_orders/
├── firebase.json            # firestore → rules + indexes (+ flutter section written by flutterfire)
├── .firebaserc              # { "projects": { "default": "merchant-orders-39dd1" } }
├── firestore.rules          # must equal §5 (deploy overwrites Console)
└── firestore.indexes.json   # from §6
```

## 11. Phase 2 candidates

Push notifications on status change (FCM + HMS Push) · Cloud Functions for counters & order numbers · date-range demand reports / export · in-app maps via Google Maps SDK (map picker, all-customers map — needs billing) · move images to Cloud Storage if catalog grows (needs Blaze) · phone OTP · per-order delivery address · delivery fee · HMS Map Kit for Huawei devices.
