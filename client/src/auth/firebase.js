// src/auth/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// (optional analytics)
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBNwfttvXW1d7NbvZvMLfJt2hCW2GffUuY",
  authDomain: "falcon-nitr-dispensary.firebaseapp.com",
  projectId: "falcon-nitr-dispensary",
  storageBucket: "falcon-nitr-dispensary.firebasestorage.app",
  messagingSenderId: "171637549520",
  appId: "1:171637549520:web:81bd1baf9d24cb965571d5",
  measurementId: "G-ZEJMTG7TBP",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ EXPORT AUTH (THIS WAS MISSING)
export const auth = getAuth(app);

// optional
export const analytics = getAnalytics(app);

export default app;
