import {
    cleanupOutdatedCaches,
    createHandlerBoundToURL,
    precacheAndRoute,
} from "workbox-precaching";

import {
    NavigationRoute,
    registerRoute,
} from "workbox-routing";

import {
    clientsClaim,
} from "workbox-core";

import { initializeApp } from "firebase/app";
import {
    getMessaging,
    onBackgroundMessage,
} from "firebase/messaging/sw";

// --------------------------------------------------
// PWA / Workbox
// --------------------------------------------------

self.skipWaiting();
clientsClaim();

cleanupOutdatedCaches();

precacheAndRoute(self.__WB_MANIFEST);

// React Router offline support
// Only needed in production.
if (import.meta.env.PROD) {
    registerRoute(
        new NavigationRoute(
            createHandlerBoundToURL("/index.html")
        )
    );
}

// --------------------------------------------------
// Firebase Cloud Messaging
// --------------------------------------------------

const firebaseConfig = {
    apiKey: "AIzaSyCCreDCc7UdGBgIIwo7gySScKLjXCCrV-c",
    authDomain: "fittrackr-70ba5.firebaseapp.com",
    projectId: "fittrackr-70ba5",
    storageBucket: "fittrackr-70ba5.firebasestorage.app",
    messagingSenderId: "619738369609",
    appId: "1:619738369609:web:64dc779006c90493e57998",
};

const firebaseApp = initializeApp(firebaseConfig);

const messaging = getMessaging(firebaseApp);

onBackgroundMessage(messaging, (payload) => {
    const title =
        payload?.notification?.title || "FitTrackr";

    const options = {
        body:
            payload?.notification?.body ||
            "You have a new notification.",
        icon: "/logo.png",
    };

    self.registration.showNotification(
        title,
        options
    );
});