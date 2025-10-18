// Firebase initialization module
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, collection, addDoc, query, where, getDocs, doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase configuration
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
const auth = getAuth(app);
const db = getFirestore(app);

console.log('Firebase initialized');
console.log('Auth object created:', auth);

// Create Google Auth Provider instance
const googleProvider = new GoogleAuthProvider();

// Export everything individually to ensure proper module resolution
export const firebaseApp = app;
export const firebaseAuth = auth;
export const firebaseDb = db;
export const googleAuthProvider = googleProvider;

// Re-export Firebase functions
export { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut, 
    onAuthStateChanged,
    collection,
    addDoc,
    query,
    where,
    getDocs,
    doc,
    setDoc,
    getDoc
};

// Also export with the expected names for backward compatibility
export { auth, db, googleProvider };

