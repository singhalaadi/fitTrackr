// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// Note: These are public values and safe to include in the service worker.
firebase.initializeApp({
  apiKey: "AIzaSyCCreDCc7UdGBgIIwo7gySScKLjXCCrV-c",
  authDomain: "fittrackr-70ba5.firebaseapp.com",
  projectId: "fittrackr-70ba5",
  storageBucket: "fittrackr-70ba5.firebasestorage.app",
  messagingSenderId: "619738369609",
  appId: "1:619738369609:web:64dc779006c90493e57998",
  measurementId: "G-DN8N1NQYJL"
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png',
    badge: '/logo.png',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
