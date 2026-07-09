// src/auth/firebase.js

import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
// (optional analytics)
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ EXPORT AUTH (THIS WAS MISSING)
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("Auth persistence could not be set:", err);
});

// optional
let analytics = null;
try {
  if (typeof window !== "undefined" && import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) {
    analytics = getAnalytics(app);
  }
} catch (e) {
  console.warn("Analytics could not be initialized:", e);
}
export { analytics };

export default app;
