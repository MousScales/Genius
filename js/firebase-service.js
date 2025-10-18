// Firebase services using global Firebase SDK
// Wait for Firebase to be available
let db, auth, collection, addDoc, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc, query, orderBy, where;

async function initFirebaseServices() {
    // Wait for Firebase to be available
    while (!window.firebase) {
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
    auth = window.firebase.auth();
    
    // Get Firestore functions
    collection = window.firebase.firestore().collection;
    addDoc = window.firebase.firestore().addDoc;
    getDocs = window.firebase.firestore().getDocs;
    getDoc = window.firebase.firestore().getDoc;
    doc = window.firebase.firestore().doc;
    setDoc = window.firebase.firestore().setDoc;
    updateDoc = window.firebase.firestore().updateDoc;
    deleteDoc = window.firebase.firestore().deleteDoc;
    query = window.firebase.firestore().query;
    orderBy = window.firebase.firestore().orderBy;
    where = window.firebase.firestore().where;
    
    console.log('Firebase services initialized in firebase-service.js');
}

// Initialize Firebase services
initFirebaseServices();
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
            const classesRef = collection(db, 'users', userId, 'classes');
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
            const classesRef = collection(db, 'users', userId, 'classes');
            const q = query(classesRef, orderBy('createdAt', 'desc'));
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
            const documentsRef = collection(db, 'users', userId, 'classes', classId, 'documents');
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
            const documentsRef = collection(db, 'users', userId, 'classes', classId, 'documents');
            const q = query(documentsRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const documents = [];
            querySnapshot.forEach((doc) => {
                documents.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            return documents;
        } catch (error) {
            console.error('Error getting documents:', error);
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
            const foldersRef = collection(db, 'users', userId, 'classes', classId, 'folders');
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
            const foldersRef = collection(db, 'users', userId, 'classes', classId, 'folders');
            const q = query(foldersRef, orderBy('createdAt', 'desc'));
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
            const studyGuidesRef = collection(db, 'users', userId, 'classes', classId, 'studyGuides');
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
            const studyGuidesRef = collection(db, 'users', userId, 'classes', classId, 'studyGuides');
            const q = query(studyGuidesRef, orderBy('createdAt', 'desc'));
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
            const chatsRef = collection(db, 'users', userId, 'geniusChats');
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
                    const chatsRef = collection(db, 'users', userId, 'geniusChats');
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

    async saveGeniusChat(userId, chatData) {
        try {
            const chatsRef = collection(db, 'users', userId, 'geniusChats');
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
    }
};

// Set global variables for easy access
window.classService = classService;
window.authService = authService;
window.documentService = documentService;
window.folderService = folderService;
window.studyGuideService = studyGuideService;
window.chatService = chatService;

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
        
        // Redirect to login page
        window.location.href = 'login.html';
        
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
