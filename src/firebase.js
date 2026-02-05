import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration - works in both Vite (frontend) and Node.js (backend)
// Priority: import.meta.env (Vite) > process.env (Node.js) > hardcoded fallback
const getEnv = (key, fallback) => {
    // Vite environment (frontend build)
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
        return import.meta.env[key];
    }
    // Node.js environment (backend)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
        return process.env[key];
    }
    // Fallback for production reliability
    return fallback;
};

const firebaseConfig = {
    apiKey: getEnv('VITE_FIREBASE_API_KEY', 'AIzaSyAKBQN9HiniJ7uMWrrf9tIenEwMHB-gEmc'),
    authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN', 'news-indian-24x7.firebaseapp.com'),
    projectId: getEnv('VITE_FIREBASE_PROJECT_ID', 'news-indian-24x7'),
    storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET', 'news-indian-24x7.firebasestorage.app'),
    messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '647285212122'),
    appId: getEnv('VITE_FIREBASE_APP_ID', '1:647285212122:web:50273ef2e4f804208876e3'),
    measurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID', 'G-NP7539EMB6')
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let analytics;
if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
}
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, analytics, auth, db, storage, firebaseConfig };

