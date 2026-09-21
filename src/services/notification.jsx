import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "../config/firebase";
import toast from "react-hot-toast";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export const registerMessagingServiceWorker = async () => {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service workers are not supported.");
  }

  const registration = await navigator.serviceWorker.register(
    "/firebase-messaging-sw.js",
  );

  await navigator.serviceWorker.ready;
  return registration;
};

export const requestNotificationPermission = async () => {
  try {
    if (!messaging) {
      console.error("FCM messaging is not supported.");
      toast.error("Notifications are not supported in this browser.");
      return null;
    }

    if (!VAPID_KEY) {
      console.error("FCM Error: VITE_FIREBASE_VAPID_KEY is missing from .env");
      toast.error("Notification setup incomplete.");
      return null;
    }

    if (!("Notification" in window)) {
      toast.error("Notifications are not supported.");
      return null;
    }

    const registration = await registerMessagingServiceWorker();
    let permission = Notification.permission;

    if (permission !== "granted") {
      permission = await Notification.requestPermission();
    }

    if (permission !== "granted") {
      console.warn("Notification permission was not granted.");
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      console.warn("FCM token was not generated.");
      return null;
    }

    return token;
  } catch (error) {
    console.error("FCM registration error:", error);
    toast.error("Could not enable notifications.");
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve, reject) => {
    if (!messaging) {
      reject(new Error("Firebase Messaging is not initialized."));
      return;
    }

    onMessage(messaging, (payload) => {
      const title = payload?.notification?.title || "FitTrackr";

      const body =
        payload?.notification?.body || "You have a new notification.";

      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? "animate-enter" : "animate-leave"
            } max-w-md w-full bg-surface-container-high shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-primary/20 border border-primary/10 overflow-hidden`}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="shrink-0 pt-0.5">
                  <img
                    className="h-10 w-10 rounded-xl"
                    src="/logo.png"
                    alt="FitTrackr"
                  />
                </div>

                <div className="ml-3 flex-1">
                  <p className="text-sm font-black italic uppercase text-primary tracking-tight">
                    {title}
                  </p>

                  <p className="mt-1 text-[10px] sm:text-xs font-label uppercase tracking-widest text-surface-variant font-bold">
                    {body}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ),
        {
          duration: 5000,
        },
      );

      resolve(payload);
    });
});
