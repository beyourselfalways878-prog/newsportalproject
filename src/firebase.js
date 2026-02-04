import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAKBQN9HiniJ7uMWrrf9tIenEwMHB-gEmc",
    authDomain: "news-indian-24x7.firebaseapp.com",
    projectId: "news-indian-24x7",
    storageBucket: "news-indian-24x7.firebasestorage.app",
    messagingSenderId: "647285212122",
    appId: "1:647285212122:web:50273ef2e4f804208876e3",
    measurementId: "G-NP7539EMB6"
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

