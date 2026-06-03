# Native build — what Jodi runs locally

The web app is fully native-ready. Capacitor config (`capacitor.config.json`)
points at the right app id (`app.gloria.luna`), brand name (`Luna by Gloria`),
and webDir (`dist`). The vite-plugin-pwa configuration is web-safe; native
builds load assets from the filesystem regardless.

What this doc covers: the exact commands to add iOS + Android platforms
and produce signed builds for App Store + Play Store submission. These
steps must be run **on Jodi's Mac** — they require Xcode (iOS) and
Android Studio (Android), neither of which is available from the
worktree environment.

## Prerequisites

- Mac running macOS 14+
- Xcode 15+ installed (App Store)
- Android Studio installed with Android SDK
- Apple Developer account ($99/yr) for App Store submission
- Google Play Console account ($25 one-time) for Play submission
- Node 18+ (already installed for the web build)

## One-time platform setup

Run these from the repo root:

```bash
# Build the web bundle that Capacitor will wrap
npm run build:native

# Add native platforms — creates ios/ and android/ folders
npx cap add ios
npx cap add android

# Sync the web build into both native projects
npx cap sync
```

After this, the `ios/` and `android/` folders are part of the repo
(they should be committed — they contain native project config).

## iOS build path

```bash
# Open the Xcode project
npx cap open ios
```

In Xcode:
1. **Signing & Capabilities** — set Team to your Apple Developer team.
   Bundle identifier is `app.gloria.luna` (already set in
   `capacitor.config.json`).
2. **App icons** — add 1024×1024 icon to Assets.xcassets/AppIcon.
3. **Launch screen** — use the existing splash images
   (`public/splash/*.png`).
4. **Build** — Product → Archive → Distribute → App Store Connect.
5. Submit via App Store Connect once the build appears.

## Android build path

```bash
# Open the Android Studio project
npx cap open android
```

In Android Studio:
1. **Signing config** — create a keystore (Build → Generate Signed
   Bundle/APK). Save the keystore file securely — losing it means
   never being able to update the app.
2. **App icon** — replace `android/app/src/main/res/mipmap-*/ic_launcher*`
   files.
3. **Build** — Build → Generate Signed Bundle → Android App Bundle.
4. Upload the `.aab` file to Google Play Console.

## Native plugins worth adding pre-launch

These are optional but improve the native experience. Install before
the first native build so they're wrapped in:

```bash
npm install @capacitor/splash-screen @capacitor/status-bar @capacitor/app @capacitor/haptics @capacitor/preferences
npx cap sync
```

- **splash-screen** — controls the splash duration + colour on launch
- **status-bar** — sets the iOS/Android status bar colour to match
  Luna's cream (#F4EFE5)
- **app** — handles back button on Android (currently a web-only stub)
- **haptics** — tactile feedback for save / log / period day one
  celebrations
- **preferences** — native key-value storage (currently using
  localStorage which works on native too, but Preferences is more
  reliable on iOS)

After installing, wire each into `src/App.jsx` or relevant components
behind `Capacitor.isNativePlatform()` checks so the web build is
unaffected.

## RevenueCat / IAP

The decision is to use **native StoreKit (iOS) + Google Play Billing
(Android) directly**, not RevenueCat as a wrapper. After platforms are
added:

- iOS: configure in-app subscription products in App Store Connect,
  use `@capacitor-community/in-app-purchases` or write a thin StoreKit
  wrapper. Lazy-load only on native.
- Android: configure subscription products in Play Console, use the
  same plugin or Google Play Billing Library bindings.

This is post-platform-add work, not blocking the initial submission.

## What's not in this doc

- Submitting to the App Store / Play Store (separate process per platform)
- Marketing assets (screenshots, app preview videos, store listing copy)
- Privacy policy URL configuration in store listings
- TestFlight / Play internal testing track setup
- Push notification setup (not yet implemented in Luna)

## After first submission

- Set up Sentry's native crash reporting (existing Sentry config is
  web-only; add `@sentry/capacitor` for native crashes).
- Set up PostHog's native session reporting (similar — current is web).
- Update [PRELAUNCH.md](PRELAUNCH.md) checkboxes.
