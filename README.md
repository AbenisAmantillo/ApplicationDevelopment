# The Amantillo Property Co. — React Native Client

Mobile client for property renters (`ROLE_USER`). Connects to the Symfony API Platform backend with JWT authentication.

## Features

- Register and login (no Google OAuth, no email verification UI)
- Client dashboard with available properties and furniture teasers
- Checkout: property rent + optional furniture, downpayment, 12/24/36-month installment plan
- My transactions with fully-paid / outstanding status
- Profile: photo, edit username (email read-only), logout
- Blocks staff/admin accounts (`ROLE_ADMIN`, `ROLE_STAFF`)

## Requirements

- Node.js ≥ 22
- React Native dev environment ([setup guide](https://reactnative.dev/docs/set-up-your-environment))
- Symfony API on [Railway](https://webdeployment-production.up.railway.app/) (production) or local Symfony for dev

## API base URL (Symfony backend)

The app never talks to MySQL directly. All data goes through the Symfony REST API.

1. Copy **`.env.example`** to **`.env.local`** (gitignored):

```env
API_BASE_URL=http://192.168.1.50:8080
```

Use your computer's LAN IPv4 and backend port for physical phones. Do not use
`localhost`, because that points at the phone itself. `VITE_API_BASE_URL` and
`NEXT_PUBLIC_API_BASE_URL` are also accepted aliases.

2. Restart Metro (`npm start`) after changing env files.

3. On the **Symfony service** (not in the mobile app), set:
   - `DATABASE_URL` — from the Railway MySQL plugin
   - `CORS_ALLOW_ORIGIN` — only needed for browser clients; native apps use Bearer JWT over HTTPS

`src/lib/api.ts` provides `apiFetch` (JSON + Bearer, `credentials: 'omit'`). Resource modules under `src/api/` use axios with the same base URL and error handling.

## Notifications

### Local (checkout success)

After a successful checkout, the app posts a **local** system notification (Notifee)
with title **Transaction successful** and body **Your transaction has been created.**
No backend FCM is required for this message. Implementation: `showLocalTransactionSuccessNotification`
in `src/utils/notifications.ts`, called from `CheckoutScreen`.

### Remote (FCM)

On login, the app asks for notification permission, creates the Android channel
`amantillo_notifications_sound_v2`, and sends the Firebase Cloud Messaging token to:

```http
POST /api/me/device-token
```

The Railway Symfony backend must store that token for the logged-in client. When
an admin sends a notification, the backend should create the notification record
and send an FCM message to the client's saved token. Automatic FCM on transaction
create is **not** implemented in the mobile client; use local notifications for checkout
success or add server-side FCM after `POST /api/transactions`.

Recommended Android FCM payload:

```json
{
  "token": "<client fcm token>",
  "notification": {
    "title": "Payment reminder",
    "body": "Your payment is due. Please settle your balance."
  },
  "android": {
    "notification": {
      "channel_id": "amantillo_notifications_sound_v2",
      "sound": "notification"
    }
  },
  "data": {
    "type": "payment_reminder",
    "title": "Payment reminder",
    "message": "Your payment is due. Please settle your balance."
  }
}
```

The custom sound file is `android/app/src/main/res/raw/notification.mp3`.

## WebSocket (real-time)

When the user is logged in, the app opens a WebSocket to the Symfony backend for
live updates (notifications, payments, transactions). FCM still handles background
push; WebSocket keeps the in-app notification list fresh while the app is open.

### Client configuration

| Variable | Default |
|----------|---------|
| `WS_BASE_URL` | Derived from `API_BASE_URL` (`http` → `ws`, `https` → `wss`) |
| `WS_PATH` | `/ws` |

Example `.env.local`:

```env
API_BASE_URL=http://192.168.1.50:8080
WS_PATH=/ws
```

### Backend contract

Connect (JWT in query string):

```http
GET ws://<host>:<port>/ws?token=<jwt>
```

Server → client JSON messages:

```json
{ "type": "notification", "payload": { "id": 1, "title": "...", "message": "...", "createdAt": "..." } }
{ "type": "notification.created", "payload": { ... } }
{ "type": "payment.updated", "payload": { ... } }
{ "type": "transaction.updated", "payload": { ... } }
{ "type": "ping" }
```

The client replies to `ping` with `{ "type": "pong" }`. Plain-text `ping` is also supported.

Close with code `4401` or `4001` when the JWT is invalid so the app stops reconnecting.

Implementation: `src/lib/websocketClient.ts`, `src/realtime/WebSocketContext.tsx`.

## Local Symfony (optional dev)

When `API_BASE_URL` is unset in `.env.local`, dev builds fall back to local HTTP (see `src/config/env.ts`).

### 1. App config

Edit **`src/config/env.ts`** — use your PC’s **Wi‑Fi** IPv4 from `ipconfig` (not VirtualBox/VMware adapters like `192.168.56.1`):

```ts
export const DEV_API_HOST: string | null = '192.168.5.200';
```

Reload Metro after saving (`R` in the app or restart `npm start`).

The login screen shows the API origin in dev mode.

### 2. Start Symfony on all interfaces

`127.0.0.1:8000` works on the PC but your **phone cannot use that**. Bind the server to every interface:

```sh
# In your Symfony project folder:
php -S 0.0.0.0:8000 -t public
```

Or with Symfony CLI:

```sh
symfony server:start --port=8000 --no-tls --allow-all-ip
```

### 3. Verify from your PC

```powershell
.\scripts\check-api.ps1
```

Both `127.0.0.1:8000` and `192.168.5.200:8000` should respond. If only localhost works, the phone will still get **Network Error**.

### 4. Same Wi‑Fi + firewall

- Phone and PC on the **same Wi‑Fi** (not mobile data).
- Allow inbound TCP **8000** in Windows Firewall (Private network), or temporarily allow the PHP/symfony process.

### Emulator

```ts
export const DEV_API_HOST: string | null = null;
```

| `DEV_API_HOST` | Device | API URL |
|----------------|--------|---------|
| `'192.168.x.x'` | Physical phone | `http://192.168.x.x:8000` |
| `null` | Android emulator | `http://10.0.2.2:8000` |
| `null` | iOS simulator | `http://localhost:8000` |

## Install and run

```sh
npm install
npm start
```

In another terminal:

```sh
# Android
npm run android

# iOS (first time: cd ios && bundle exec pod install)
npm run ios
```

## Auth

- **Register:** `POST /api/register` — on success, navigate to Login (no verify-email screen).
- **Login:** `POST /api/login` — JWT stored in AsyncStorage (`@amantillo/jwt`).
- **Session:** On launch, if a token exists, `GET /api/me` validates it; `401` clears storage and returns to login.
- **Logout:** `POST /api/logout` with Bearer token (records activity on the backend), then clears local JWT. If the route is unavailable, the app still signs out locally.

Protected requests send `Authorization: Bearer <token>`.

**Profile:** `GET /api/me`, `PATCH /api/me` (username only; email rejected), `POST /api/me/profile-image` (multipart field `file`), `POST /api/me/change-password` (`currentPassword`, `newPassword`). Images are served from `/uploads/profile_images/`.

## Project structure

```
src/
  lib/api.ts           # apiFetch, ApiError, 401 handler, shared getErrorMessage
  api/                 # axios client, resources, checkout orchestration
  auth/                # AuthContext, JWT storage (Keychain)
  navigation/          # Auth stack, main tabs, checkout stack
  screens/             # Login, Register, Dashboard, Checkout, Transactions, Profile
  utils/
    firebase.ts        # Analytics, Crashlytics, Google Sign-In bootstrap
    notifications.ts   # FCM token sync, local notifications (Notifee)
  types/               # TypeScript models
  config/env.ts        # apiBaseUrl from .env.local or dev fallback
```

## Checkout flow

The app mirrors the web `ClientDashboardController` flow via Api Platform:

1. `POST /api/transactions` (rent, customer, property)
2. `POST /api/transaction_furnitures` — one row per selected furniture line (requires API Platform resource on `TransactionFurniture`; see Symfony entity below)
3. `PUT /api/properties/{id}` → `status: sold`
4. `PUT /api/furniture/{id}` → deduct stock; `sold` if stock is 0
5. `POST /api/payments` — downpayment (`Completed`) + N installments (`Pending`)
6. `POST /api/payments/{id}/complete` — client marks the next pending installment as paid (preferred; see `ApiPaymentCompleteController` in Symfony)
7. `PUT /api/payments/{id}` — fallback full replacement if the complete route is not deployed. PATCH is not enabled on this resource.

**Symfony:** expose `transactionFurniture` on `Transaction` read groups and add `#[ApiResource]` on `TransactionFurniture` so the mobile client can persist and list line items. Without this, checkout succeeds but furniture lines are not stored.

If you prefer a single endpoint instead, add e.g. `POST /api/client/transactions` with:

```json
{
  "property_id": 1,
  "furniture_quantities": { "2": 1, "5": 3 },
  "amount": 50000,
  "payment_plan": 12,
  "payment_method": "debit_card"
}
```

## Business rules (client)

- Only `ROLE_USER` may use the app
- One unpaid transaction blocks new purchases (`canCreateTransaction`)
- Only `available` properties can be selected
- Furniture must be available with stock respected
- Currency displayed as Philippine Peso (₱)

## Security notes

See **[docs/SECURITY.md](docs/SECURITY.md)** for authentication, secrets handling, transport (HTTPS/WSS), role blocking, and release APK signing — for coursework / reviewer checklist.

## Out of scope

Google Sign-In, email verification, admin/staff CRUD, marketing landing pages.

## Firebase (push notifications)

The app uses [React Native Firebase](https://rnfirebase.io/) for **Cloud Messaging (FCM)**. JWT auth stays on the Symfony API; Firebase only handles device push delivery.

### 1. Create a Firebase project

1. Open the [Firebase Console](https://console.firebase.google.com/) and create a project (or use an existing one).
2. Enable **Cloud Messaging** (enabled by default for new apps).

### 2. Android app

1. Add an Android app with package name **`com.amantillo`** (must match `android/app/build.gradle`).
2. Download **`google-services.json`** and place it at:

   `android/app/google-services.json`

   A placeholder template is in `android/app/google-services.json.example` (copy to `google-services.json` for local builds). **Replace it with the real file from Firebase** before testing push notifications.

3. Rebuild: `npm run android`

### 3. iOS app

1. Add an iOS app with bundle ID **`org.reactjs.native.example.Amantillo`** (see Xcode → General).
2. Download **`GoogleService-Info.plist`** and place it at:

   `ios/Amantillo/GoogleService-Info.plist`

   A template is in `ios/Amantillo/GoogleService-Info.plist.example`.

3. In Xcode, add the plist to the **Amantillo** target (Copy items if needed).
4. Upload your **APNs authentication key** (.p8) under Firebase → Project settings → Cloud Messaging.
5. Install pods and rebuild:

   ```sh
   cd ios && pod install && cd ..
   npm run ios
   ```

6. For App Store / production builds, change `aps-environment` in `ios/Amantillo/Amantillo.entitlements` from `development` to `production`.

### 4. Backend (optional)

After login, the app POSTs the FCM token to:

`POST /api/me/device-token` — body: `{ "token": "<fcm-token>", "platform": "ios" | "android" }`

If this route is not deployed yet, registration is skipped silently; in-app notifications from `/api/notifications` still work.

### 5. What the app does

- Requests notification permission (iOS always; Android 13+).
- Obtains an FCM token and syncs it when the user is authenticated.
- Shows a **local** notification when checkout completes (Notifee).
- Shows an alert for foreground **remote** FCM payloads.
- Handles background/quit remote payloads via the system tray (see `index.js` background handler).

Config files are gitignored; only the `*.example` templates are committed.
