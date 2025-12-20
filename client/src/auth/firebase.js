import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBgic8GeuGrB6Nl68sbbYxYDsoR0sB-xD4",
  authDomain: "falcon-nitr-dispensary.firebaseapp.com",
  projectId: "falcon-nitr-dispensary",
  storageBucket: "falcon-nitr-dispensary.firebasestorage.app",
  messagingSenderId: "171637549520",
  appId: "1:171637549520:web:f6abe54fbacbd7145571d5"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ ONLY Auth (no analytics)
export const auth = getAuth(app);
