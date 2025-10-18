// Firebase initialization module
// Load Firebase SDKs dynamically to avoid module conflicts
let firebaseApp, firebaseAuth, firebaseDb, googleProvider;
let createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged;
let collection, addDoc, query, where, getDocs, doc, setDoc, getDoc;

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

// Initialize Firebase when the module loads
(async function initFirebase() {
    try {
        console.log('Loading Firebase modules...');
        
        // Import Firebase modules
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
        const { getAuth, createUserWithEmailAndPassword: createUser, signInWithEmailAndPassword: signInEmail, signInWithPopup: signInPopup, GoogleAuthProvider: GoogleProvider, signOut: signOutFunc, onAuthStateChanged: onAuthState } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        const { getFirestore, collection: collectionFunc, addDoc: addDocFunc, query: queryFunc, where: whereFunc, getDocs: getDocsFunc, doc: docFunc, setDoc: setDocFunc, getDoc: getDocFunc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

        // Initialize Firebase
        firebaseApp = initializeApp(firebaseConfig);
        firebaseAuth = getAuth(firebaseApp);
        firebaseDb = getFirestore(firebaseApp);
        googleProvider = new GoogleProvider();

        // Assign functions
        createUserWithEmailAndPassword = createUser;
        signInWithEmailAndPassword = signInEmail;
        signInWithPopup = signInPopup;
        GoogleAuthProvider = GoogleProvider;
        signOut = signOutFunc;
        onAuthStateChanged = onAuthState;
        
        collection = collectionFunc;
        addDoc = addDocFunc;
        query = queryFunc;
        where = whereFunc;
        getDocs = getDocsFunc;
        doc = docFunc;
        setDoc = setDocFunc;
        getDoc = getDocFunc;

        console.log('Firebase initialized successfully');
        console.log('Auth object created:', firebaseAuth);
        
        // Set global variables for immediate access
        window.firebaseAuth = firebaseAuth;
        window.firebaseDb = firebaseDb;
        window.googleProvider = googleProvider;
        
    } catch (error) {
        console.error('Error initializing Firebase:', error);
    }
})();

// Export everything
export { 
    firebaseApp, 
    firebaseAuth as auth, 
    firebaseDb as db, 
    googleProvider,
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

