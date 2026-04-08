# Implementation Plan: Android Mobile App for FitTrackr (Capacitor)

This plan outlines the conversion of **FitTrackr** into a high-performance **Android application** using **Capacitor**. Based on your feedback, we are focusing exclusively on the Android platform.

## User Review Required

> [!IMPORTANT]
> **Android Focus**: We will initialize the project with the `com.fittrackr.app` bundle ID and focus all native optimizations on the Android ecosystem.

> [!TIP]
> **Hardware Back Button**: On Android, we must explicitly handle the hardware back button to ensure an expected user experience (e.g., navigating back through the router instead of exiting the app).

## Proposed Changes

We will execute this transformation in four technical phases.

---

### Phase 1: Android Platform Initialization
Setting up the native Android project and build pipeline.

#### [MODIFY] [package.json](file:///c:/Users/dibya/OneDrive/Documents/EXE/FitTracker/fitTrackr/package.json)
- Add Capacitor core and CLI.
- Add `@capacitor/android`, `@capacitor/app`, `@capacitor/status-bar`, and `@capacitor/haptics`.

#### [NEW] [capacitor.config.json](file:///c:/Users/dibya/OneDrive/Documents/EXE/FitTracker/fitTrackr/capacitor.config.json)
- Set `appId: "com.fittrackr.app"`.
- Configure `bundledWebRuntime: false`.

#### [NEW] [Android Native Project]
- Run `npx cap add android` to generate the `android/` directory.
- Update `AndroidManifest.xml` with `POST_NOTIFICATIONS` permissions.

---

### Phase 2: Mobile UI & Navigation Adaptations
Optimizing the layout for touch and Android-specific design patterns.

#### [NEW] [BottomNav.jsx](file:///c:/Users/dibya/OneDrive/Documents/EXE/FitTracker/fitTrackr/src/components/common/BottomNav.jsx)
- Implement a floating glassmorphic navigation bar optimized for Android screens.

#### [MODIFY] [Layout.jsx](file:///c:/Users/dibya/OneDrive/Documents/EXE/FitTracker/fitTrackr/src/components/common/Layout.jsx)
- Switch navigation mode on mobile devices (Top Header -> Bottom Tab Bar).
- Add `safe-area` padding to handle Android "hole-punch" cameras and navigation bars.

#### [MODIFY] [index.css](file:///c:/Users/dibya/OneDrive/Documents/EXE/FitTracker/fitTrackr/src/index.css)
- Add utility classes for safe areas using `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`.

---

### Phase 3: Android System Integration
Bridging the web app with the Android OS features.

#### [NEW] [useBackButton.js](file:///c:/Users/dibya/OneDrive/Documents/EXE/FitTracker/fitTrackr/src/hooks/useBackButton.js)
- A custom hook to listen for the Android hardware back button and integrate with `react-router-dom`.

#### [MODIFY] [main.jsx](file:///c:/Users/dibya/OneDrive/Documents/EXE/FitTracker/fitTrackr/src/main.jsx)
- Initialize the **StatusBar** plugin to set the background to `#09090b` (to match the app theme).
- Register the back button handler globally.

---

### Phase 4: Data & Persistence
Ensuring reliability and performance for gym usage.

#### [MODIFY] [firebase.js](file:///c:/Users/dibya/OneDrive/Documents/EXE/FitTracker/fitTrackr/src/config/firebase.js)
- Enable **Firestore Persistence** using `enableIndexedDbPersistence` to allow offline workout logging.

---

## Open Questions

1. **Launcher Icons**: I will use the current `logo.png` to generate the standard Android adaptive icons. Do you want any specific color for the background of the adaptive icon?
2. **Immersive Mode**: Would you like the app to run in "Full Screen" (hiding the status bar) or keep the status bar visible with coordinated colors?

## Verification Plan

### Automated/Tool Verification
- **Build Quality**: Run `npm run build` to verify the production bundle.
- **Capacitor Sync**: Run `npx cap sync android` to ensure all assets are synchronized with the native code.
- **Lighthouse**: Audit for mobile performance and PWA compliance (as a fallback).

### Manual Verification
- **Back Button**: Test the hardware back button on an Android emulator/device to ensure it doesn't close the app unexpectedly.
- **Offline Log**: Start a workout, disable network, log sets, re-enable network, and verify sync in Firestore.
- **Safe Area**: Verify UI alignment on devices with/without notches and navigation bars.
