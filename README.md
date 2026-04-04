# FitTrackr v1.0 ⚡

**FitTrackr** is a high-performance, mobile-first fitness tracking application designed for serious athletes who demand precision, speed, and real-time data insights. Built with a "High-Velocity" aesthetic, it combines glassmorphism with advanced telemetry to offer a premium training experience.

![FitTrackr Logo](/public/logo.png)

## 🚀 Key Features

- **Dynamic Workout Journal**: Log sets, reps, and weights in real-time with an interface designed for the gym floor.
- **Progression Intelligence**: Instant "Last Session" hints during training to help you push for progressive overload.
- **Athlete Dashboard**: Live visualization of your training volume, weekly progress, and biometric status.
- **Advanced Personal Records**: Track your best lifts with dual-period monitoring (All-Time vs. Current Month).
- **Comprehensive History**: Deep-dive into every past session with an exercise-specific search engine.
- **Real-Time Notifications**: Synchronize your device for workout reminders and motivational alerts via Firebase Cloud Messaging (FCM).
- **Body Analytics**: Automatic BMI calculation and integrated "Healthy Weight Range" assessments based on your profile inputs.

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS 4
- **State Management**: React Context API
- **Backend-as-a-Service**: Firebase (Auth, Firestore, Cloud Messaging)
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **API Integration**: [RapidAPI](https://rapidapi.com/) - Exercise Data provided by **ExerciseDB**.

## ⚙️ Local Setup

To run FitTrackr locally:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/fit-trackr.git
   cd fit-trackr
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and add your Firebase and RapidAPI credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_VAPID_KEY=your_web_push_certificate_key
   VITE_RAPIDAPI_KEY=your_rapidapi_key
   VITE_RAPIDAPI_HOST=exercisedb.p.rapidapi.com
   VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset
   ```

4. **Launch Development Server**:
   ```bash
   npm run dev
   ```

## 🔐 Security & Production

### Firebase Public Identifiers
The keys found in `src/config/firebase.js` and `public/firebase-messaging-sw.js` are **Public Identifiers**. This is standard for Firebase web applications. They are not secret administrative keys. 

**True data security** is enforced through **Firebase Security Rules** in the Firebase Console. Ensure your `firestore.rules` allow users to read/write only their own documents:

```javascript
match /workouts/{workoutId} {
  allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
}
```

## 📦 Deployment

FitTrackr is optimized for deployment on **Vercel** or **Netlify**.

1. **Build the production bundle**:
   ```bash
   npm run build
   ```
2. **Deploy to Vercel**:
   - Push your code to GitHub.
   - Import the project into Vercel.
   - Add your `.env` variables in **Settings > Environment Variables**.
   - Set the build command to `npm run build` and output directory to `dist`.

---

### Acknowledgments
- Exercise data provided by **RapidAPI (ExerciseDB)**.
- Designed and engineered for peak performance tracking.
