// Firebase services using global Firebase SDK
// Wait for Firebase to be available
let db, firebaseAuth, collection, addDoc, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc, query, orderBy, where;

async function initFirebaseServices() {
    // Wait for Firebase to be available
    while (!window.firebase) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Wait for Firebase config to be loaded
    while (!window.FIREBASE_API_KEY) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Initialize Firebase if not already initialized
    if (!window.firebase.apps || window.firebase.apps.length === 0) {
        const firebaseConfig = {
            apiKey: window.FIREBASE_API_KEY || "AIzaSyB-JPtkbuIES5T_m7nkX0Ic1iO_lz0FbTk",
            authDomain: window.FIREBASE_AUTH_DOMAIN || "genius-b5656.firebaseapp.com",
            projectId: window.FIREBASE_PROJECT_ID || "genius-b5656",
            storageBucket: window.FIREBASE_STORAGE_BUCKET || "genius-b5656.firebasestorage.app",
            messagingSenderId: window.FIREBASE_MESSAGING_SENDER_ID || "567988128391",
            appId: window.FIREBASE_APP_ID || "1:567988128391:web:8a48294d736ec4013f8622",
            measurementId: window.FIREBASE_MEASUREMENT_ID || "G-3SEG2XJQMP"
        };
        
        window.firebase.initializeApp(firebaseConfig);
    }
    
    // Get Firebase services
    db = window.firebase.firestore();
    firebaseAuth = window.firebase.auth();
    
    console.log('Firebase services initialized:', {
        db: !!db,
        firebaseAuth: !!firebaseAuth,
        firestore: !!window.firebase.firestore
    });
    
    // Get Firestore functions - use the proper API
    collection = (path) => db.collection(path);
    addDoc = (ref, data) => ref.add(data);
    getDocs = (ref) => ref.get();
    getDoc = (ref) => ref.get();
    doc = (db, ...pathSegments) => {
        let ref = db;
        for (let i = 0; i < pathSegments.length; i += 2) {
            if (i + 1 < pathSegments.length) {
                ref = ref.collection(pathSegments[i]).doc(pathSegments[i + 1]);
            } else {
                ref = ref.collection(pathSegments[i]);
            }
        }
        return ref;
    };
    setDoc = (ref, data, options) => ref.set(data, options);
    updateDoc = (ref, data) => ref.update(data);
    deleteDoc = (ref) => ref.delete();
    query = (ref) => ref;
    orderBy = (ref, field, direction = 'desc') => ref.orderBy(field, direction);
    where = (ref, field, op, value) => ref.where(field, op, value);
    
    console.log('Firebase services initialized in firebase-service.js');
}

// Initialize Firebase services after config is loaded
async function waitForConfigAndInit() {
    // Wait for config to be loaded
    while (!window.FIREBASE_API_KEY) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log('Config loaded, initializing Firebase services...');
    await initFirebaseServices();
}

// Start the initialization process
waitForConfigAndInit();
// Auth functions will be accessed through window.firebase.auth()

// User Profile Service
class UserService {
    // Save user profile data
    async saveProfile(userId, profileData) {
        try {
            const userRef = doc(db, 'users', userId);
            await setDoc(userRef, {
                ...profileData,
                createdAt: new Date(),
                updatedAt: new Date()
            }, { merge: true });
            console.log('Profile saved for user:', userId);
            return userId;
        } catch (error) {
            console.error('Error saving profile:', error);
            throw error;
        }
    }

    // Get user profile
    async getProfile(userId) {
        try {
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
                return userDoc.data();
            }
            return null;
        } catch (error) {
            console.error('Error getting profile:', error);
            throw error;
        }
    }
}

// Class management service
class ClassService {
    // Add a new class to user's subcollection
    async addClass(userId, classData) {
        try {
            const classesRef = db.collection('users').doc(userId).collection('classes');
            const docRef = await addDoc(classesRef, {
                ...classData,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log('Class added with ID:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('Error adding class:', error);
            throw error;
        }
    }

    // Get all classes for a specific user
    async getClasses(userId) {
        try {
            const classesRef = db.collection('users').doc(userId).collection('classes');
            const q = classesRef.orderBy('createdAt', 'desc');
            const querySnapshot = await getDocs(q);
            const classes = [];
            querySnapshot.forEach((doc) => {
                classes.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            return classes;
        } catch (error) {
            console.error('Error getting classes:', error);
            throw error;
        }
    }

    // Update a class
    async updateClass(userId, classId, classData) {
        try {
            const classRef = doc(db, 'users', userId, 'classes', classId);
            await updateDoc(classRef, {
                ...classData,
                updatedAt: new Date()
            });
            console.log('Class updated successfully');
        } catch (error) {
            console.error('Error updating class:', error);
            throw error;
        }
    }

    // Delete a class
    async deleteClass(userId, classId) {
        try {
            const classRef = doc(db, 'users', userId, 'classes', classId);
            await deleteDoc(classRef);
            console.log('Class deleted successfully');
        } catch (error) {
            console.error('Error deleting class:', error);
            throw error;
        }
    }
}

// Authentication service
class AuthService {
    constructor() {
        // Auth is accessed through window.firebase.auth()
    }

    async signUp(email, password) {
        try {
            console.log('AuthService.signUp called');
            const userCredential = await window.firebase.auth().createUserWithEmailAndPassword(email, password);
            console.log('User created:', userCredential.user);
            return userCredential.user;
        } catch (error) {
            console.error('Error signing up:', error);
            throw error;
        }
    }

    async signIn(email, password) {
        try {
            console.log('AuthService.signIn called');
            const userCredential = await window.firebase.auth().signInWithEmailAndPassword(email, password);
            console.log('User signed in:', userCredential.user);
            return userCredential.user;
        } catch (error) {
            console.error('Error signing in:', error);
            throw error;
        }
    }

    async signOut() {
        try {
            await window.firebase.auth().signOut();
            console.log('User signed out');
        } catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    }

    onAuthStateChanged(callback) {
        return window.firebase.auth().onAuthStateChanged(callback);
    }

    getCurrentUser() {
        return window.firebase.auth().currentUser;
    }
}

// Document management service
class DocumentService {
    // Save a document to Firebase
    async saveDocument(userId, classId, documentData) {
        try {
            const documentsRef = db.collection('users').doc(userId).collection('classes').doc(classId).collection('documents');
            const docRef = await addDoc(documentsRef, {
                ...documentData,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log('Document saved with ID:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('Error saving document:', error);
            throw error;
        }
    }

    // Get all documents for a class
    async getDocuments(userId, classId) {
        try {
            console.log('🔍 DocumentService.getDocuments called with:', { userId, classId });
            console.log('🔍 Firebase db object:', !!db);
            console.log('🔍 Current user:', window.firebase.auth().currentUser?.uid);
            
            const documentsRef = db.collection('users').doc(userId).collection('classes').doc(classId).collection('documents');
            console.log('🔍 Documents ref path:', documentsRef.path);
            
            const q = documentsRef.orderBy('createdAt', 'desc');
            console.log('🔍 About to execute query...');
            
            const querySnapshot = await getDocs(q);
            console.log('🔍 Query executed successfully! Snapshot size:', querySnapshot.size);
            
            const documents = [];
            querySnapshot.forEach((doc) => {
                const docData = {
                    id: doc.id,
                    ...doc.data()
                };
                console.log('🔍 Document found:', doc.id, docData.title || 'No title');
                documents.push(docData);
            });
            
            console.log('🔍 Total documents returned:', documents.length);
            return documents;
        } catch (error) {
            console.error('❌ Error getting documents:', error);
            console.error('❌ Error code:', error.code);
            console.error('❌ Error message:', error.message);
            console.error('❌ Full error:', error);
            throw error;
        }
    }

    // Update a document
    async updateDocument(userId, classId, documentId, documentData) {
        try {
            const documentRef = doc(db, 'users', userId, 'classes', classId, 'documents', documentId);
            await updateDoc(documentRef, {
                ...documentData,
                updatedAt: new Date()
            });
            console.log('Document updated successfully');
        } catch (error) {
            console.error('Error updating document:', error);
            throw error;
        }
    }

    // Delete a document
    async deleteDocument(userId, classId, documentId) {
        try {
            const documentRef = doc(db, 'users', userId, 'classes', classId, 'documents', documentId);
            await deleteDoc(documentRef);
            console.log('Document deleted successfully');
        } catch (error) {
            console.error('Error deleting document:', error);
            throw error;
        }
    }
}

// Folder management service
class FolderService {
    // Save a folder to Firebase
    async saveFolder(userId, classId, folderData) {
        try {
            const foldersRef = db.collection('users').doc(userId).collection('classes').doc(classId).collection('folders');
            const docRef = await addDoc(foldersRef, {
                ...folderData,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log('Folder saved with ID:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('Error saving folder:', error);
            throw error;
        }
    }

    // Get all folders for a class
    async getFolders(userId, classId) {
        try {
            const foldersRef = db.collection('users').doc(userId).collection('classes').doc(classId).collection('folders');
            const q = foldersRef.orderBy('createdAt', 'desc');
            const querySnapshot = await getDocs(q);
            const folders = [];
            querySnapshot.forEach((doc) => {
                folders.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            return folders;
        } catch (error) {
            console.error('Error getting folders:', error);
            throw error;
        }
    }

    // Update a folder
    async updateFolder(userId, classId, folderId, folderData) {
        try {
            const folderRef = doc(db, 'users', userId, 'classes', classId, 'folders', folderId);
            await updateDoc(folderRef, {
                ...folderData,
                updatedAt: new Date()
            });
            console.log('Folder updated successfully');
        } catch (error) {
            console.error('Error updating folder:', error);
            throw error;
        }
    }

    // Delete a folder
    async deleteFolder(userId, classId, folderId) {
        try {
            const folderRef = doc(db, 'users', userId, 'classes', classId, 'folders', folderId);
            await deleteDoc(folderRef);
            console.log('Folder deleted successfully');
        } catch (error) {
            console.error('Error deleting folder:', error);
            throw error;
        }
    }
}

// Study guide management service
class StudyGuideService {
    // Save a study guide to Firebase
    async saveStudyGuide(userId, classId, studyGuideData) {
        try {
            const studyGuidesRef = db.collection('users').doc(userId).collection('classes').doc(classId).collection('studyGuides');
            const docRef = await addDoc(studyGuidesRef, {
                ...studyGuideData,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log('Study guide saved with ID:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('Error saving study guide:', error);
            throw error;
        }
    }

    // Get all study guides for a class
    async getStudyGuides(userId, classId) {
        try {
            const studyGuidesRef = db.collection('users').doc(userId).collection('classes').doc(classId).collection('studyGuides');
            const q = studyGuidesRef.orderBy('createdAt', 'desc');
            const querySnapshot = await getDocs(q);
            const studyGuides = [];
            querySnapshot.forEach((doc) => {
                studyGuides.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            return studyGuides;
        } catch (error) {
            console.error('Error getting study guides:', error);
            throw error;
        }
    }

    // Update a study guide
    async updateStudyGuide(userId, classId, studyGuideId, studyGuideData) {
        try {
            const studyGuideRef = doc(db, 'users', userId, 'classes', classId, 'studyGuides', studyGuideId);
            await updateDoc(studyGuideRef, {
                ...studyGuideData,
                updatedAt: new Date()
            });
            console.log('Study guide updated successfully');
        } catch (error) {
            console.error('Error updating study guide:', error);
            throw error;
        }
    }

    // Delete a study guide
    async deleteStudyGuide(userId, classId, studyGuideId) {
        try {
            const studyGuideRef = doc(db, 'users', userId, 'classes', classId, 'studyGuides', studyGuideId);
            await deleteDoc(studyGuideRef);
            console.log('Study guide deleted successfully');
        } catch (error) {
            console.error('Error deleting study guide:', error);
            throw error;
        }
    }
}

// Create singleton instances
const userService = new UserService();
const classService = new ClassService();
const authService = new AuthService();
const documentService = new DocumentService();
const folderService = new FolderService();
const studyGuideService = new StudyGuideService();

// Chat Service for Genius Chat functionality
class ChatService {
    async getGeniusChats(userId) {
        try {
            console.log('Getting genius chats for user:', userId);
            console.log('db object:', db);
            
            // Wait for Firebase to be ready
            if (!db) {
                console.log('Firebase not ready, waiting...');
                await this.waitForFirebase();
            }
            
            const chatsRef = db.collection('users').doc(userId).collection('geniusChats');
            const snapshot = await getDocs(chatsRef);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting genius chats:', error);
            // If there's a permissions error, try to create the collection first
            if (error.code === 'permission-denied') {
                console.log('Permission denied for genius chats, trying to initialize...');
                try {
                    // Try to create an empty chat to initialize the collection
                    const chatsRef = db.collection('users').doc(userId).collection('geniusChats');
                    await addDoc(chatsRef, {
                        title: 'Welcome to Genius Chat',
                        messages: [],
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                    console.log('Genius chats collection initialized');
                    return [];
                } catch (initError) {
                    console.error('Failed to initialize genius chats collection:', initError);
                }
            }
            return [];
        }
    }
    
    async waitForFirebase() {
        let attempts = 0;
        while (!db && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        if (!db) {
            throw new Error('Firebase not available after waiting');
        }
    }

    async saveGeniusChat(userId, chatData) {
        try {
            const chatsRef = db.collection('users').doc(userId).collection('geniusChats');
            const docRef = await addDoc(chatsRef, {
                ...chatData,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            return docRef.id;
        } catch (error) {
            console.error('Error saving genius chat:', error);
            throw error;
        }
    }

    async updateGeniusChat(userId, chatId, chatData) {
        try {
            const chatRef = doc(db, 'users', userId, 'geniusChats', chatId);
            await setDoc(chatRef, {
                ...chatData,
                updatedAt: new Date()
            }, { merge: true });
        } catch (error) {
            console.error('Error updating genius chat:', error);
            throw error;
        }
    }

    async deleteGeniusChat(userId, chatId) {
        try {
            const chatRef = doc(db, 'users', userId, 'geniusChats', chatId);
            await deleteDoc(chatRef);
        } catch (error) {
            console.error('Error deleting genius chat:', error);
            throw error;
        }
    }
}

// Lazy initialization of chatService to ensure Firebase is ready
let _chatService = null;
// Event Service
const eventService = {
    async getEvents(userId, classId) {
        try {
            if (!userId || !classId) {
                console.log('No userId or classId provided for getEvents');
                return [];
            }
            
            const eventsRef = db.collection('users').doc(userId).collection('classes').doc(classId).collection('events');
            const q = eventsRef.orderBy('date', 'asc');
            const querySnapshot = await getDocs(q);
            const events = [];
            querySnapshot.forEach((doc) => {
                events.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            return events;
        } catch (error) {
            console.error('Error getting events:', error);
            return [];
        }
    },

    async saveEvent(userId, classId, eventData) {
        try {
            const eventsRef = db.collection('users').doc(userId).collection('classes').doc(classId).collection('events');
            const docRef = await addDoc(eventsRef, {
                ...eventData,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            return docRef.id;
        } catch (error) {
            console.error('Error saving event:', error);
            throw error;
        }
    },

    async updateEvent(userId, classId, eventId, eventData) {
        try {
            const eventRef = db.collection('users').doc(userId).collection('classes').doc(classId).collection('events').doc(eventId);
            await updateDoc(eventRef, {
                ...eventData,
                updatedAt: new Date()
            });
        } catch (error) {
            console.error('Error updating event:', error);
            throw error;
        }
    },

    async deleteEvent(userId, classId, eventId) {
        try {
            const eventRef = db.collection('users').doc(userId).collection('classes').doc(classId).collection('events').doc(eventId);
            await deleteDoc(eventRef);
        } catch (error) {
            console.error('Error deleting event:', error);
            throw error;
        }
    }
};

const chatService = {
    get instance() {
        if (!_chatService) {
            _chatService = new ChatService();
        }
        return _chatService;
    },
    async getGeniusChats(userId) {
        return this.instance.getGeniusChats(userId);
    },
    async saveGeniusChat(userId, chatData) {
        return this.instance.saveGeniusChat(userId, chatData);
    },
    async updateGeniusChat(userId, chatId, chatData) {
        return this.instance.updateGeniusChat(userId, chatId, chatData);
    },
    async deleteGeniusChat(userId, chatId) {
        return this.instance.deleteGeniusChat(userId, chatId);
    },
    // Add the missing methods that documentEditor.js expects
    async getChats(userId, classId, docId) {
        try {
            console.log('Getting chats for user:', userId, 'class:', classId, 'doc:', docId);
            
            // Wait for Firebase to be ready
            if (!db) {
                console.log('Firebase not ready, waiting...');
                await this.instance.waitForFirebase();
            }
            
            const chatsRef = db.collection('users').doc(userId).collection('classes').doc(classId).collection('documents').doc(docId).collection('chats');
            const snapshot = await getDocs(chatsRef);
            const chats = {};
            snapshot.docs.forEach(doc => {
                chats[doc.id] = {
                    id: doc.id,
                    ...doc.data()
                };
            });
            return chats;
        } catch (error) {
            console.error('Error getting chats:', error);
            return {};
        }
    },
    async saveChats(userId, classId, docId, chats) {
        try {
            console.log('Saving chats for user:', userId, 'class:', classId, 'doc:', docId);
            
            // Wait for Firebase to be ready
            if (!db) {
                console.log('Firebase not ready, waiting...');
                await this.instance.waitForFirebase();
            }
            
            const chatsRef = db.collection('users').doc(userId).collection('classes').doc(classId).collection('documents').doc(docId).collection('chats');
            
            // Save each chat
            for (const [chatId, chatData] of Object.entries(chats)) {
                const chatDocRef = chatsRef.doc(chatId);
                await setDoc(chatDocRef, {
                    ...chatData,
                    updatedAt: new Date()
                }, { merge: true });
            }
            
            console.log('Chats saved successfully');
        } catch (error) {
            console.error('Error saving chats:', error);
            throw error;
        }
    }
};

// Set global variables immediately - no waiting
window.userService = userService;
window.classService = classService;
window.authService = authService;
window.documentService = documentService;
window.folderService = folderService;
window.studyGuideService = studyGuideService;
window.eventService = eventService;
window.chatService = chatService;

console.log('Global services set immediately:', {
    userService: !!window.userService,
    classService: !!window.classService,
    authService: !!window.authService,
    logout: !!window.logout
});

// Global logout function
window.logout = async function() {
    try {
        console.log('Global logout function called');
        
        // Wait for Firebase to be available
        let attempts = 0;
        while (!window.firebase && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.firebase) {
            console.error('Firebase not available for logout');
            throw new Error('Firebase not available');
        }
        
        // Sign out from Firebase
        await window.firebase.auth().signOut();
        console.log('Successfully signed out from Firebase');
        
        // Clear localStorage
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userData');
        localStorage.removeItem('genius_chats');
        
        // Clear all user-specific localStorage data
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('profile_') || key.includes('classes_') || key.includes('suggestions_'))) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        console.log('Cleared all user data from localStorage');
        
               // Redirect to main landing page
               window.location.href = '/';
        
    } catch (error) {
        console.error('Logout error:', error);
        throw error;
    }
};

console.log('Firebase services initialized:', { 
    classService, 
    authService, 
    documentService, 
    folderService, 
    studyGuideService, 
    chatService 
});

// Services are available on window object

// Services are also available on window object
