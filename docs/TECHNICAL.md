# 4. Technical Documentation

## System Overview

Amantillo Property Co. is a React Native mobile application for property renters. It connects to a Symfony API Platform backend through REST API endpoints. The app uses JWT authentication, MySQL database storage through the backend, and a dual notification model:

- **Firebase Cloud Messaging (FCM)** — remote push when the Symfony backend (or admin tools) sends messages to the device token saved at login.
- **Local notifications (Notifee)** — on-device tray notification when checkout completes successfully (no backend FCM required for this message).

Firebase is used for Analytics, Crashlytics, optional Google Sign-In, and FCM delivery. **User login and API authorization remain JWT-based on Symfony**, not Firebase Auth for session management.

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React Native |
| Language | TypeScript |
| Backend | Symfony API Platform |
| Database | MySQL (via backend only) |
| Authentication | JWT Bearer Token |
| Remote notifications | Firebase Cloud Messaging (`@react-native-firebase/messaging`) |
| Local notifications | Notifee (`@notifee/react-native`) |
| Firebase services | Analytics, Crashlytics, Messaging (`@react-native-firebase/*`) |
| API hosting | Railway or local Symfony server |
| Package manager | npm |

## Installation Requirements

Install the following before running the project:

- Node.js version 22 or higher
- npm
- Android Studio
- Java Development Kit
- React Native development environment ([official setup guide](https://reactnative.dev/docs/set-up-your-environment))
- Git
- Symfony backend API
- MySQL database (configured on the backend)
- Firebase project (FCM, Analytics; `google-services.json` for Android)

## Project Installation

1. Clone or open the project folder.

   ```sh
   cd Amantillo
   ```

2. Install dependencies.

   ```sh
   npm install
   ```

3. Configure the API base URL. Copy `.env.example` to `.env.local` (gitignored):

   ```env
   API_BASE_URL=http://192.168.1.50:8080
   ```

   Use your computer’s LAN IPv4 when testing on a physical phone. Do not use `localhost` on a device.

4. Add Firebase config for Android (see [Firebase Setup](#firebase-setup)).

5. Start Metro Bundler.

   ```sh
   npm start
   ```

6. Run the Android app (rebuild after adding native dependencies such as Notifee or Firebase).

   ```sh
   npm run android
   ```

## Backend Setup

The Symfony backend must provide the following API endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/register` | User registration |
| POST | `/api/login` | JWT login |
| GET | `/api/me` | Current user / session validation |
| PATCH | `/api/me` | Profile updates |
| POST | `/api/logout` | Logout (optional; app clears locally if missing) |
| GET | `/api/properties` | Property catalog |
| GET | `/api/furniture` | Furniture catalog |
| GET | `/api/transactions` | User transactions |
| POST | `/api/transactions` | Create transaction |
| GET | `/api/payments` | Payments |
| POST | `/api/payments` | Create payment |
| POST | `/api/payments/{id}/submit` | Submit payment (or `/complete` per deployment) |
| GET | `/api/notifications` | In-app notification list |
| POST | `/api/me/device-token` | Store FCM device token for remote push |

The backend should be connected to a MySQL database and hosted locally or on Railway.

### Local Backend Setup

Start the Symfony backend on all network interfaces:

```sh
php -S 0.0.0.0:8000 -t public
```

Or using Symfony CLI:

```sh
symfony server:start --port=8000 --no-tls --allow-all-ip
```

Make sure the phone and computer are connected to the same Wi-Fi network. Verify connectivity from the PC:

```powershell
.\scripts\check-api.ps1
```

## Firebase Setup

1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Cloud Messaging** (enabled by default for new projects).
3. Add an Android app with package name:

   `com.amantillo`

4. Download `google-services.json`.
5. Place it in:

   `android/app/google-services.json`

6. Rebuild the app:

   ```sh
   npm run android
   ```

Firebase **does not replace Symfony JWT login**. It supplies FCM for remote pushes and optional Firebase Analytics/Crashlytics. Session tokens are issued by `POST /api/login` and stored on the device (see Authentication Flow).

### iOS (optional)

1. Add an iOS app in Firebase with the Xcode bundle ID.
2. Place `GoogleService-Info.plist` in `ios/Amantillo/`.
3. Upload an APNs key in Firebase → Project settings → Cloud Messaging.
4. Run `cd ios && pod install && cd ..` then `npm run ios`.

## Notifications

### Overview

| Type | When | Technology | Backend required? |
|------|------|------------|-------------------|
| **Local** | Checkout succeeds | Notifee | No |
| **Remote (FCM)** | Admin/backend sends push | Firebase Cloud Messaging | Yes (`POST /api/me/device-token` + server send) |
| **In-app list** | User opens notifications menu | REST `GET /api/notifications` | Yes |

### Android notification channel

On app start, Android creates channel `amantillo_notifications_sound_v2` with custom sound `notification.mp3` (`android/app/src/main/res/raw/notification.mp3`). The same channel ID is used for FCM payloads and local checkout notifications.

### FCM registration (remote push)

After login, when the user is authenticated:

1. The app requests notification permission (Android 13+ `POST_NOTIFICATIONS`; iOS via Firebase Messaging).
2. It obtains an FCM device token.
3. It sends the token to Symfony:

   ```http
   POST /api/me/device-token
   Content-Type: application/json
   Authorization: Bearer <jwt>

   {
     "token": "<fcm-device-token>",
     "platform": "android"
   }
   ```

   (`platform` may be `"ios"` on iOS.)

If this route returns 404 or 405, registration is skipped silently; local and in-app notifications still work.

Implementation: `src/utils/notifications.ts` (`initializePushNotifications`), called from `src/auth/AuthContext.tsx` when `token` and `user` exist.

### Remote FCM behavior (backend / admin)

When an admin sends a client notification (or the backend triggers FCM), Symfony should send a message to the stored token. Recommended Android payload:

```json
{
  "token": "<client-fcm-token>",
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

**Client behavior for incoming FCM:**

| App state | Behavior |
|-----------|----------|
| Background / quit | System notification tray (Android channel + sound) |
| Foreground | `Alert.alert` with title and body from payload |

Background handler entry point: `index.js` (`messaging().setBackgroundMessageHandler`).

Automatic FCM on `POST /api/transactions` is **not** implemented in the mobile app; the backend must send FCM if remote “transaction created” push is required.

### Local notification on checkout (Notifee)

When checkout completes successfully, the app shows a **local** system notification without waiting for the server:

- **Title:** Transaction successful  
- **Body:** Your transaction has been created.

Triggered from `src/screens/CheckoutScreen.tsx` via `showLocalTransactionSuccessNotification()` in `src/utils/notifications.ts`. The existing success `Alert` remains for in-app actions (e.g. navigate to My Transactions).

Requires notification permission (requested during push initialization at login). Rebuild the app after `npm install` so the Notifee native module is linked.

## Main Project Structure

```
src/
  api/              API request modules (auth, checkout, transactions, …)
  auth/             AuthContext, JWT storage (Keychain), profile photo storage
  config/           Environment configuration (API base URL)
  components/       Shared UI (headers, notifications menu, …)
  hooks/            Client and operations data hooks
  lib/              Shared apiFetch helper
  navigation/       Root navigator, auth stack, main tabs
  screens/          Login, Register, Dashboard, Checkout, Transactions, Profile, …
  types/            TypeScript models
  utils/
    firebase.ts     Firebase bootstrap, Analytics, Crashlytics, Google Sign-In helpers
    notifications.ts  FCM registration, device-token sync, local notifications (Notifee)
  theme/            UI theme tokens
App.tsx               Firebase bootstrap on launch
index.js              FCM background message handler registration
android/app/
  google-services.json   Firebase Android config (not committed; use .example template)
  src/main/res/raw/notification.mp3   Notification sound
```

## Authentication Flow

1. User logs in with username and password (`POST /api/login`).
2. Backend returns a JWT token.
3. The app stores the token securely (React Native Keychain; legacy tokens may migrate from AsyncStorage).
4. Protected API requests include:

   ```http
   Authorization: Bearer <token>
   ```

5. On app launch, if a token exists, `GET /api/me` validates the session.
6. If the token is invalid (`401`), storage is cleared and the user returns to login.
7. After successful login, push notification permission and FCM token registration run (see [Notifications](#notifications)).

## Checkout Flow

1. User selects an available property.
2. User optionally selects furniture and quantities.
3. User enters downpayment, payment plan (12 / 24 / 36 months), and payment method.
4. App sends transaction data to the backend (`POST /api/transactions` and related checkout steps in `src/api/checkout.ts`).
5. Backend creates the transaction and payment records.
6. App shows a **local notification**: “Transaction successful — Your transaction has been created.”
7. App shows an in-app success dialog with options to view transactions or go back.
8. User can view the transaction and payment schedule in the app.

## Testing and Verification

To verify the API connection:

```powershell
.\scripts\check-api.ps1
```

To check that the app runs:

```sh
npm start
npm run android
```

To verify notifications:

1. Log in on a physical device (Android 13+ will prompt for notification permission).
2. Complete a checkout — confirm a notification appears in the system tray with title “Transaction successful”.
3. For remote FCM, ensure `POST /api/me/device-token` is implemented on Symfony and send a test message from the backend or admin notification UI.

## Deployment Notes

- Use Railway or another cloud host for the Symfony backend.
- Set the backend `DATABASE_URL` for MySQL.
- Configure Firebase (`google-services.json` on Android; APNs on iOS) before testing FCM.
- Implement `POST /api/me/device-token` on the backend if admin or server-triggered push is required.
- Local checkout notifications work without backend FCM changes.
- Do not commit real `.env.local`, `google-services.json`, signing keys, or other secrets to Git.
