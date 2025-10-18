// Import Firebase services from CDN
import { db, auth } from './firebase-config.js';
import { 
    collection, 
    addDoc, 
    getDocs,
    getDoc, 
    doc, 
    setDoc,
    updateDoc, 
    deleteDoc, 
    query, 
    orderBy, 
    where 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// User Profile Service
export class UserService {
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
export class ClassService {
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
export class AuthService {
    constructor() {
        this.auth = auth;
    }

    async signUp(email, password) {
        try {
            console.log('AuthService.signUp called');
            const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
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
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            console.log('User signed in:', userCredential.user);
            return userCredential.user;
        } catch (error) {
            console.error('Error signing in:', error);
            throw error;
        }
    }

    async signOut() {
        try {
            await signOut(this.auth);
            console.log('User signed out');
        } catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    }

    onAuthStateChanged(callback) {
        return onAuthStateChanged(this.auth, callback);
    }

    getCurrentUser() {
        return this.auth.currentUser;
    }
}

// Document management service
export class DocumentService {
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
export class FolderService {
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
export class StudyGuideService {
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

// Calendar events service
export class EventService {
    // Save events to Firebase
    async saveEvents(userId, classId, events) {
        try {
            const eventsRef = doc(db, 'users', userId, 'classes', classId, 'data', 'events');
            await setDoc(eventsRef, {
                events: events,
                updatedAt: new Date()
            }, { merge: true });
            console.log('Events saved to Firebase');
        } catch (error) {
            console.error('Error saving events:', error);
            throw error;
        }
    }

    // Get events from Firebase
    async getEvents(userId, classId) {
        try {
            const eventsRef = doc(db, 'users', userId, 'classes', classId, 'data', 'events');
            const docSnap = await getDoc(eventsRef);
            if (docSnap.exists()) {
                return docSnap.data().events || [];
            }
            return [];
        } catch (error) {
            console.error('Error getting events:', error);
            return [];
        }
    }
}

// Chat conversations service
export class ChatService {
    // Save chat conversations to Firebase
    async saveChats(userId, classId, docId, chats) {
        try {
            const chatsRef = doc(db, 'users', userId, 'classes', classId, 'documents', docId, 'data', 'chats');
            await setDoc(chatsRef, {
                chats: chats,
                updatedAt: new Date()
            }, { merge: true });
            console.log('Chats saved to Firebase');
        } catch (error) {
            console.error('Error saving chats:', error);
            throw error;
        }
    }

    // Get chat conversations from Firebase
    async getChats(userId, classId, docId) {
        try {
            const chatsRef = doc(db, 'users', userId, 'classes', classId, 'documents', docId, 'data', 'chats');
            const docSnap = await getDoc(chatsRef);
            if (docSnap.exists()) {
                return docSnap.data().chats || {};
            }
            return {};
        } catch (error) {
            console.error('Error getting chats:', error);
            return {};
        }
    }

    // Save main Genius Chat conversations
    async saveGeniusChats(userId, chats) {
        try {
            const chatsRef = doc(db, 'users', userId, 'data', 'geniusChats');
            await setDoc(chatsRef, {
                chats: chats,
                updatedAt: new Date()
            }, { merge: true });
            console.log('Genius chats saved to Firebase');
        } catch (error) {
            console.error('Error saving genius chats:', error);
            throw error;
        }
    }

    // Get main Genius Chat conversations
    async getGeniusChats(userId) {
        try {
            const chatsRef = doc(db, 'users', userId, 'data', 'geniusChats');
            const docSnap = await getDoc(chatsRef);
            if (docSnap.exists()) {
                return docSnap.data().chats || [];
            }
            return [];
        } catch (error) {
            console.error('Error getting genius chats:', error);
            return [];
        }
    }
}

// Create singleton instances
export const userService = new UserService();
export const classService = new ClassService();
export const authService = new AuthService();
export const documentService = new DocumentService();
export const folderService = new FolderService();
export const studyGuideService = new StudyGuideService();
export const eventService = new EventService();
export const chatService = new ChatService();

console.log('Firebase services initialized:', { 
    classService, 
    authService, 
    documentService, 
    folderService, 
    studyGuideService,
    eventService,
    chatService
});
