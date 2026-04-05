import { getToken, onMessage } from "firebase/messaging";
import { messaging, firebaseConfig } from "../config/firebase";
import toast from "react-hot-toast";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export const requestNotificationPermission = async () => {
    try {
        if (!VAPID_KEY) {
            console.error("FCM Error: VITE_FIREBASE_VAPID_KEY is missing from .env");
            toast.error("Notification setup incomplete.");
            return null;
        }
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const swUrl = `/firebase-messaging-sw.js?` + 
                `apiKey=${encodeURIComponent(firebaseConfig.apiKey)}` +
                `&authDomain=${encodeURIComponent(firebaseConfig.authDomain)}` +
                `&projectId=${encodeURIComponent(firebaseConfig.projectId)}` +
                `&storageBucket=${encodeURIComponent(firebaseConfig.storageBucket)}` +
                `&messagingSenderId=${encodeURIComponent(firebaseConfig.messagingSenderId)}` +
                `&appId=${encodeURIComponent(firebaseConfig.appId)}`;

            const registration = await navigator.serviceWorker.register(swUrl);

            const token = await getToken(messaging, { 
                vapidKey: VAPID_KEY,
                serviceWorkerRegistration: registration
            });
            return token;
        } else {
            console.warn("Notification permission denied by athlete.");
            return null;
        }
    } catch (error) {
        console.error("FCM Synchronization Error:", error);
        return null;
    }
};

export const onMessageListener = () =>
    new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            toast.custom((t) => (
                <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-surface-container-high shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-primary/20 border border-primary/10 overflow-hidden`}>
                    <div className="flex-1 w-0 p-4">
                        <div className="flex items-start">
                            <div className="shrink-0 pt-0.5">
                                <img className="h-10 w-10 rounded-xl" src="/logo.png" alt="FT" />
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-black italic uppercase text-primary tracking-tight"> {payload.notification.title} </p>
                                <p className="mt-1 text-[10px] sm:text-xs font-label uppercase tracking-widest text-surface-variant font-bold"> {payload.notification.body} </p>
                            </div>
                        </div>
                    </div>
                </div>
            ), { duration: 5000 });
            resolve(payload);
        });
    });
