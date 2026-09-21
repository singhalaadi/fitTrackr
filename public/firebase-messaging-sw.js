importScripts(
    "https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js"
);

importScripts(
    "https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js"
);

/* global importScripts, firebase */

firebase.initializeApp({
    apiKey: "AIzaSyCCreDCc7UdGBgIIwo7gySScKLjXCCrV-c",
    authDomain: "fittrackr-70ba5.firebaseapp.com",
    projectId: "fittrackr-70ba5",
    storageBucket: "fittrackr-70ba5.firebasestorage.app",
    messagingSenderId: "619738369609",
    appId: "1:619738369609:web:64dc779006c90493e57998",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    const title =
        payload?.notification?.title || "FitTrackr";

    const options = {
        body:
            payload?.notification?.body ||
            "You have a new notification.",
        icon: "/logo.png",
    };

    self.registration.showNotification(title, options);
});