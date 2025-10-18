// Import Firebase using CDN
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

// Your web app's Firebase configuration
// In production, these should be loaded from environment variables
const firebaseConfig = {
  apiKey: window.FIREBASE_API_KEY || "AIzaSyB-JPtkbuIES5T_m7nkX0Ic1iO_lz0FbTk",
  authDomain: window.FIREBASE_AUTH_DOMAIN || "genius-b5656.firebaseapp.com",
  projectId: window.FIREBASE_PROJECT_ID || "genius-b5656",
  storageBucket: window.FIREBASE_STORAGE_BUCKET || "genius-b5656.firebasestorage.app",
  messagingSenderId: window.FIREBASE_MESSAGING_SENDER_ID || "567988128391",
  appId: window.FIREBASE_APP_ID || "1:567988128391:web:8a48294d736ec4013f8622",
  measurementId: window.FIREBASE_MEASUREMENT_ID || "G-3SEG2XJQMP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

console.log('Firebase initialized successfully');

// Export Firebase services
export { app, analytics, db, auth, storage };
