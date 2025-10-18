// Firebase initialization module using global Firebase SDK
// This avoids ES6 module conflicts with Firebase CDN

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

// Wait for Firebase to load from global scripts
function waitForFirebase() {
    return new Promise((resolve) => {
        if (window.firebase && window.firebase.apps && window.firebase.apps.length > 0) {
            resolve();
        } else {
            const checkFirebase = setInterval(() => {
                if (window.firebase && window.firebase.apps && window.firebase.apps.length > 0) {
                    clearInterval(checkFirebase);
                    resolve();
                }
            }, 100);
        }
    });
}

// Initialize Firebase
let firebaseApp, firebaseAuth, firebaseDb, googleProvider;

async function initFirebase() {
    try {
        console.log('Waiting for Firebase to load...');
        await waitForFirebase();
        
        // Initialize Firebase
        firebaseApp = window.firebase.initializeApp(firebaseConfig);
        firebaseAuth = window.firebase.auth();
        firebaseDb = window.firebase.firestore();
        googleProvider = new window.firebase.auth.GoogleAuthProvider();

        console.log('Firebase initialized successfully');
        console.log('Auth object created:', firebaseAuth);
        
        // Set global variables
        window.firebaseAuth = firebaseAuth;
        window.firebaseDb = firebaseDb;
        window.googleProvider = googleProvider;
        
    } catch (error) {
        console.error('Error initializing Firebase:', error);
    }
}

// Initialize Firebase
initFirebase();

// Export everything
export { 
    firebaseApp, 
    firebaseAuth as auth, 
    firebaseDb as db, 
    googleProvider
};

