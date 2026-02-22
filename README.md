# VT Staff

React Native app (CLI, no Expo) with Login, OTP verification, and Home screens.

## Requirements

- Node.js >= 22.11.0
- Android Studio (for Android) / Xcode (for iOS, macOS only)
- React Native environment set up ([guide](https://reactnative.dev/docs/set-up-your-environment))

## Setup

```bash
cd VTStaff
npm install
```

**iOS only (on macOS):**

```bash
cd ios && pod install && cd ..
```

## Run

Start Metro:

```bash
npm start
```

In another terminal:

- **Android:** `npm run android`
- **iOS (macOS):** `npm run ios`

## App flow

1. **Login** – Enter mobile number → "Send OTP" → POST `request-otp.php` → navigate to OTP.
2. **OTP** – Enter OTP → "Verify OTP" → POST `verify-otp.php` → on success save JWT in AsyncStorage and go to Home.
3. **Home** – Shows "Login Successful".

## Tech

- React Navigation (native stack)
- `fetch` for API calls
- `@react-native-async-storage/async-storage` for JWT
- JavaScript, functional components, hooks
