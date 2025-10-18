// Import Firebase using CDN
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB-JPtkbuIES5T_m7nkX0Ic1iO_lz0FbTk",
  authDomain: "genius-b5656.firebaseapp.com",
  projectId: "genius-b5656",
  storageBucket: "genius-b5656.firebasestorage.app",
  messagingSenderId: "567988128391",
  appId: "1:567988128391:web:8a48294d736ec4013f8622",
  measurementId: "G-3SEG2XJQMP"
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
