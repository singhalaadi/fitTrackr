# Product Requirements Document (PRD): FitTrackr

## 1. Product Overview and Purpose
**FitTrackr** is a premium, high-performance fitness tracking application designed for dedicated athletes and fitness enthusiasts. The platform aims to simplify workout logging while providing deep insights into progress, strength gains, and personalized training recommendations. It combines a sleek, modern UI with robust data tracking to keep users motivated and informed about their kinetic journey.

---

## 2. Core Features and Functionalities

### 2.1. Authentication & Onboarding
- **Secure Login**: Integration with Firebase Auth for seamless user access.
- **Dynamic Onboarding**: A guided profile setup that collects essential biometric data (Height, Weight, Age, Sex) and fitness goals.
- **Biometric Calculations**: Automatic BMI calculation and "Ideal Weight Range" estimation based on user stats.

### 2.2. Interactive Dashboard
- **Performance Metrics**: Real-time tracking of total workouts, peak strength, total load (volume), and estimated energy burn.
- **Weekly Progress Visuals**: Custom-built bar charts showing daily peaks and caloric expenditure.
- **Personal Records (PRs)**: Auto-tracking of all-time and monthly best lifts with "High-Velocity Gains" comparison.
- **Push Notifications**: Integration with Firebase Cloud Messaging (FCM) for workout reminders and motivational alerts.

### 2.3. Advanced Workout Logger
- **Session Management**: Start/Stop functionality with a "kinetic-glow" active state.
- **Dynamic Logging**: Add/Remove exercises and sets on the fly.
- **Historical Context**: "Last Effort" tooltips that show previous performance for an exercise as the user types, enabling progressive overload.
- **Auto-Calculations**: Real-time volume calculation per session.

### 2.4. Training History
- **Searchable Database**: Filter past sessions by workout name or specific exercise.
- **Deep-Dive Views**: Expandable cards showing set-by-set details for every historical workout.
- **Volume Summaries**: High-level stats for every session at a glance.

### 2.5. Personalized Suggestions
- **Exercise Discovery**: Integration with ExerciseDB (RapidAPI) to provide thousands of exercises categorized by body part.
- **Goal-Oriented Filtering**: Tailored recommendations based on the user's primary goal (Cut, Bulk, Gain, Lose).
- **Rich Media**: High-quality exercise demonstrations (GIFs/Images) and equipment requirements.

---

## 3. User Flows and Key Interactions

### 3.1. First-Time Journey
1. **Sign Up/Login**: User authenticates.
2. **Onboarding**: Forced redirect to `/onboarding` if profile is incomplete.
3. **Stat Entry**: User enters weight, height, and goal.
4. **Landing**: Redirect to Dashboard once `profileComplete` is true.

### 3.2. Typical Training Session
1. **Start**: User navigates to 'Workout' and clicks "Start Workout".
2. **Logged Steps**: User adds exercises, sees "Last Effort" for weight/reps, and enters current sets.
3. **Finish**: User clicks "Finish", workout is synced to Firestore, and a success toast appears.
4. **Review**: Dashboard updates immediately with new stats and PRs.

---

## 4. System Architecture Summary

### 4.1. Frontend Architecture
- **Framework**: React 19 + Vite (for lightning-fast builds).
- **Styling**: Tailwind CSS 4 (utilizing the latest "linear-to-r" and "kinetic" utilities).
- **State Management**: 
  - `AuthContext`: Manages Firebase authentication state.
  - `UserContext`: Manages real-time Firestore user profiles.
- **Icons & UI**: Lucide React for consistent iconography; custom glassmorphism design system.

### 4.2. Backend System
- **Database**: Firebase Firestore (NoSQL) for workouts and user profiles.
- **Serverless Logic**: Firebase SDK handles all data operations (no dedicated backend server).
- **Cloud Messaging**: Firebase FCM for browser-based push notifications.
- **Media Storage**: Cloudinary (Unsigned Uploads) for profile image hosting.

---

## 5. API Structure Overview

### 5.1. Firebase Firestore Schema
- **`/users`**: Store user biometrics, goals, and notification tokens.
- **`/workouts`**: Stores workout sessions with exercise arrays and set sub-objects. Indexed by `userId` and `timestamp`.

### 5.2. External APIs
- **ExerciseDB (RapidAPI)**:
  - `GET /exercises/bodyPart/{bodyPart}`: Fetches exercises for suggestions.
  - `GET /image?exerciseId={id}`: Fetches exercise demonstration images.

---

## 6. Identified Gaps, Issues, or Inconsistencies

### 6.1. Technical Gaps
- **Pagination**: The History page fetches *all* workouts for a user; this will degrade performance as history grows.
- **Validation**: Minimal validation on set weights (e.g., negative weights or extreme values).
- **Offline Mode**: While Firebase has caching, the app lacks a service worker for true PWA "offline-first" capability.

### 6.2. UI/UX Inconsistencies
- **Edit Functionality**: Users cannot edit or delete workouts once saved in the History page.
- **Loading States**: Suggestions page is prone to API rate-limit errors (429) which could use more graceful fallbacks.
- **Goal Variety**: The choice of "Lose" (Weight) vs "Cut" (Fat) might be redundant for some users.

---

## 7. Recommendations for Improvements and Scalability

### 7.1. Short-Term Enhancements
1. **Editable History**: Add a "Edit/Delete" option to the History cards to fix logging mistakes.
2. **Pagination/Infinite Scroll**: Implement Firestore queries with `limit()` and `startAfter()` for the History page.
3. **PWA Support**: Add `vite-plugin-pwa` for offline logging (critical for gym environments with poor reception).

### 7.2. Long-Term Scalability
1. **Social Integration**: Implement "Workout Sharing" or "Follow" features for community-driven motivation.
2. **AI-Driven Insights**: Use the user's historical data to suggest specific weight increments (Progressive Overload Coach).
3. **Integration with Wearables**: Future expansion into Apple Health / Google Fit APIs for heart rate and caloric integration.
4. **Unit Testing**: Introduce Vitest to ensure biometric calculations (BMI, Goal logic) remain accurate during refactors.
