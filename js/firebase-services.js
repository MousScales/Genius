// Clean Firebase Services Module
// This file provides clean, working Firebase services

import { auth, db } from '../firebase-config.js';

// Wait for Firebase to be ready
async function waitForFirebase() {
    while (!db) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

// User Service
export class UserService {
    async getProfile(userId) {
        try {
            await waitForFirebase();
            console.log('📖 Loading profile for user:', userId);
            
            const doc = await db.collection('users').doc(userId).get();
            if (doc.exists) {
                const data = doc.data();
                console.log('✅ Profile loaded:', data);
                return data;
            } else {
                console.log('⚠️ No profile found for user:', userId);
                return null;
            }
        } catch (error) {
            console.error('❌ Error loading profile:', error);
            return null;
        }
    }

    async saveProfile(userId, profileData) {
        try {
            await waitForFirebase();
            console.log('💾 Saving profile for user:', userId);
            
            await db.collection('users').doc(userId).set(profileData, { merge: true });
            console.log('✅ Profile saved successfully');
            return true;
        } catch (error) {
            console.error('❌ Error saving profile:', error);
            return false;
        }
    }
}

// Class Service
export class ClassService {
    async getClasses(userId) {
        try {
            await waitForFirebase();
            console.log('📚 Loading classes for user:', userId);
            
            const snapshot = await db.collection('users').doc(userId).collection('classes').get();
            const classes = [];
            
            snapshot.forEach(doc => {
                classes.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            console.log('✅ Classes loaded:', classes.length);
            return classes;
        } catch (error) {
            console.error('❌ Error loading classes:', error);
            return [];
        }
    }

    async addClass(userId, classData) {
        try {
            await waitForFirebase();
            console.log('➕ Adding class for user:', userId);
            console.log('📋 Class data:', classData);
            
            const docRef = await db.collection('users').doc(userId).collection('classes').add(classData);
            console.log('✅ Class added to Firebase with ID:', docRef.id);
            console.log('🔗 Full path: users/' + userId + '/classes/' + docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('❌ Error adding class to Firebase:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            return null;
        }
    }

    async updateClass(userId, classId, classData) {
        try {
            await waitForFirebase();
            console.log('✏️ Updating class:', classId);
            
            await db.collection('users').doc(userId).collection('classes').doc(classId).update(classData);
            console.log('✅ Class updated successfully');
            return true;
        } catch (error) {
            console.error('❌ Error updating class:', error);
            return false;
        }
    }

    async deleteClass(userId, classId) {
        try {
            await waitForFirebase();
            console.log('🗑️ Deleting class:', classId);
            
            await db.collection('users').doc(userId).collection('classes').doc(classId).delete();
            console.log('✅ Class deleted successfully');
            return true;
        } catch (error) {
            console.error('❌ Error deleting class:', error);
            return false;
        }
    }
}

// Document Service
export class DocumentService {
    async getDocuments(userId, classId) {
        try {
            await waitForFirebase();
            console.log('📄 Loading documents for user:', userId, 'class:', classId);
            
            const snapshot = await db.collection('users').doc(userId).collection('classes').doc(classId).collection('documents').get();
            const documents = [];
            
            snapshot.forEach(doc => {
                documents.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            console.log('✅ Documents loaded:', documents.length);
            return documents;
        } catch (error) {
            console.error('❌ Error loading documents:', error);
            return [];
        }
    }

    async addDocument(userId, classId, documentData) {
        try {
            await waitForFirebase();
            console.log('📄 Adding document for user:', userId, 'class:', classId);
            
            const docRef = await db.collection('users').doc(userId).collection('classes').doc(classId).collection('documents').add(documentData);
            console.log('✅ Document added with ID:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('❌ Error adding document:', error);
            return null;
        }
    }

    async updateDocument(userId, classId, documentId, documentData) {
        try {
            await waitForFirebase();
            console.log('✏️ Updating document:', documentId);
            
            await db.collection('users').doc(userId).collection('classes').doc(classId).collection('documents').doc(documentId).update(documentData);
            console.log('✅ Document updated successfully');
            return true;
        } catch (error) {
            console.error('❌ Error updating document:', error);
            return false;
        }
    }

    async deleteDocument(userId, classId, documentId) {
        try {
            await waitForFirebase();
            console.log('🗑️ Deleting document:', documentId);
            
            await db.collection('users').doc(userId).collection('classes').doc(classId).collection('documents').doc(documentId).delete();
            console.log('✅ Document deleted successfully');
            return true;
        } catch (error) {
            console.error('❌ Error deleting document:', error);
            return false;
        }
    }
}

// Create service instances
export const userService = new UserService();
export const classService = new ClassService();
export const documentService = new DocumentService();

// Global logout function
export async function logout() {
    try {
        console.log('🚪 Logging out...');
        await auth.signOut();
        
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
        
        console.log('✅ Logged out successfully');
        
        // Redirect to login page
        window.location.href = 'login.html';
        return true;
    } catch (error) {
        console.error('❌ Error during logout:', error);
        // Even if there's an error, still redirect to login
        window.location.href = 'login.html';
        return false;
    }
}

console.log('🔥 Firebase services initialized');
