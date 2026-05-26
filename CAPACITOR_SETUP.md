# Capacitor setup — getting Luna onto the App Store and Play Store

Luna is built as a web app with React/Vite. To distribute via the App
Store and Play Store, the web build is wrapped in a thin native shell
using Capacitor. This document explains the steps from "fresh checkout"
to "binary you can submit."

## What's already in place

These are committed and don't need to be redone:

- `@capacitor/core`, `@capacitor/ios`, `@capacitor/android`, `@capacitor/cli` installed
- `capacitor.config.json` configured for Luna (appId `com.luna.app`)
- `vite.config.js` switches `base` to `/` when `VITE_NATIVE=true` (used by
  the `build:native` npm script)
- npm scripts:
  - `npm run build:native` — Vite build with the native-friendly base path
  - `npm run cap:sync` — build + copy assets into both native projects
  - `npm run ios` — sync, then open Xcode
  - `npm run android` — sync, then open Android Studio
- `src/lib/biometricNative.js` — native biometric adapter
- `src/lib/biometric.js` — already routes through native when
  `Capacitor.isNativePlatform()` returns true

## Prerequisites — install these once

### iOS (Mac only)

1. **Xcode** — install from the Mac App Store, or for older macOS use
   developer.apple.com/download/all/ to download an Xcode that works
   with your version
2. **Xcode Command Line Tools** — `xcode-select --install`
3. **CocoaPods** — Capacitor uses this to install iOS dependencies:
   ```
   brew install cocoapods
   ```
   (Install Homebrew first from brew.sh if you don't have it)

### Android (Mac, Windows, or Linux)

1. **Android Studio** — download from developer.android.com/studio
2. Open Android Studio once, complete the setup wizard. It installs
   the Android SDK during this step.
3. Add the SDK location to your shell profile (`~/.zshrc` or `~/.bash_profile`):
   ```
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```
   Then `source ~/.zshrc` (or restart your terminal).
4. **Java JDK 17** — Android Gradle needs this. Easiest:
   ```
   brew install --cask zulu@17
   ```

## First-time platform setup — run once

After the prerequisites above are installed:

```bash
npm run build:native
npx cap add ios
npx cap add android
```

This creates `ios/` and `android/` folders containing the native shell
projects. **Commit these folders to the repo** — they hold the iOS
bundle identifier, app icons, signing settings, and other config that
your build pipeline needs.

## Install the native biometric plugin

After platforms are added:

```bash
npm install @aparajita/capacitor-biometric-auth
npx cap sync
```

That's it — Luna's existing `enrollBiometric` / `unlockWithBiometric`
functions already route through the native plugin when running inside
the Capacitor shell. The plugin gives the user the iOS LocalAuthentication
prompt (instant Face ID, no system passkey sheet) and Android's
BiometricPrompt.

## Day-to-day workflow

When iterating on the web UI:

```bash
npm run dev          # local dev server, browser
```

When you want to test in the iOS simulator or device:

```bash
npm run ios          # builds, syncs, opens Xcode
```

Then in Xcode: select your simulator or device → ▶ Run.

For Android:

```bash
npm run android      # builds, syncs, opens Android Studio
```

Then in Android Studio: select emulator or device → ▶ Run.

## App icons + splash screen

Capacitor reads icons from `resources/` at the repo root. To replace
the default icons:

1. Create `resources/icon.png` — 1024×1024 PNG (no transparency,
   no rounded corners — iOS/Android round them).
2. Create `resources/splash.png` — 2732×2732 PNG, centered logo
   on Luna's cream background (#F4EFE5).
3. Install the icon/splash generator:
   ```
   npm install --save-dev @capacitor/assets
   npx capacitor-assets generate
   ```
4. `npx cap sync` to copy generated assets into both native projects.

## Building for the App Store

1. `npm run ios`
2. In Xcode: Product → Archive
3. Wait for the build to finish (~5-15 min)
4. Window → Organizer → select your archive → **Distribute App**
5. App Store Connect → upload
6. Switch over to App Store Connect (web) to fill in metadata and
   submit for review

## Building for Play Store

1. `npm run android`
2. In Android Studio: Build → Generate Signed Bundle / APK → AAB
3. Sign with your upload key (create one first time, save the keystore
   somewhere safe — losing it means you can't update the app later)
4. Upload the resulting `.aab` to Play Console

## Common pitfalls

- **`npx cap sync` fails on iOS with "pod: command not found"** — install
  CocoaPods (see Prerequisites).
- **`npx cap add android` fails with "ANDROID_HOME not set"** — finish
  the Android Studio setup wizard, then add the env vars from
  Prerequisites and restart the terminal.
- **Native biometric plugin can't be found at build time** — you ran
  the install command but forgot `npx cap sync` afterwards. Always
  sync after installing a Capacitor plugin.
- **Service worker scoping warnings in Capacitor** — the existing PWA
  setup is harmless in the native shell but does nothing useful there.
  Optional cleanup: conditionally disable `vite-plugin-pwa` when
  `VITE_NATIVE=true` is set. Not blocking — leave it for later.

## When ready to submit

See `PRELAUNCH.md` under "Native app distribution" for the App Store
and Play Store checklist — privacy nutrition labels, age rating,
screenshots, etc.
