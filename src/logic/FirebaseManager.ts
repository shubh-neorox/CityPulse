import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

import { Platform } from 'react-native';

class FirebaseManager {
  public auth: FirebaseAuthTypes.Module;
  public firestore: FirebaseFirestoreTypes.Module;


  constructor() {
    this.auth = auth();
    this.firestore = firestore();
  }

  async signInWithEmail(email: string, password: string) {
    try {
      const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
      
      // Ensure user profile exists in Firestore
      await this.ensureUserProfileExists(email);
      
      return { success: true, user: userCredential.user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async signUpWithEmail(email: string, password: string) {
    try {
      const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
      
      // Create user profile in Firestore
      await this.initializeUserProfile(email);
      
      return { success: true, user: userCredential.user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Helper function to ensure user profile exists
  private async ensureUserProfileExists(email: string) {
    const user = this.getCurrentUser();
    if (!user) return;

    try {
      const doc = await this.firestore
        .collection('users')
        .doc(user.uid)
        .get();
      
      if (!doc.exists()) {
        // Create profile if it doesn't exist
        await this.initializeUserProfile(email);
      }
    } catch (error) {
      console.error('Error ensuring user profile exists:', error);
    }
  }

  async signOut() {
    try {
      await this.auth.signOut();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  getCurrentUser() {
    return this.auth.currentUser;
  }

  async saveFavoriteEvent(eventId: string, eventData: any) {
    const user = this.getCurrentUser();
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      await this.firestore
        .collection('users')
        .doc(user.uid)
        .collection('favorites')
        .doc(eventId)
        .set(eventData);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async removeFavoriteEvent(eventId: string) {
    const user = this.getCurrentUser();
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      await this.firestore
        .collection('users')
        .doc(user.uid)
        .collection('favorites')
        .doc(eventId)
        .delete();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getFavoriteEvents() {
    const user = this.getCurrentUser();
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const snapshot = await this.firestore
        .collection('users')
        .doc(user.uid)
        .collection('favorites')
        .get();
      
      const favorites = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { success: true, data: favorites };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }




  // Profile Picture Management using Firestore (no Storage needed)
  async uploadProfilePictureToFirestore(base64Data: string) {
    const user = this.getCurrentUser();
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      console.log('Uploading base64 image to Firestore...');
      
      // Store the base64 image directly in Firestore
      await this.firestore
        .collection('users')
        .doc(user.uid)
        .set({
          profilePictureBase64: base64Data,
          profilePictureUpdatedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });

      console.log('Profile picture saved to Firestore successfully');
      return { success: true, base64: base64Data };
      
    } catch (error: any) {
      console.error('Upload to Firestore error:', error);
      return { success: false, error: error.message || 'Failed to save image' };
    }
  }

  // Update the original uploadProfilePicture to accept base64
  async uploadProfilePicture(base64Data: string) {
    // Use Firestore instead of Storage
    return this.uploadProfilePictureToFirestore(base64Data);
  }

  // Initialize user profile in Firestore
  async initializeUserProfile(email: string) {
    const user = this.getCurrentUser();
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const userProfile = {
        email: email,
        displayName: email.split('@')[0], // Use email prefix as display name
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        profileComplete: false,
        // Initialize empty profile picture
        profilePictureBase64: null,
        profilePictureUpdatedAt: null,
        // User preferences
        biometricEnabled: false,
        language: 'en',
        notifications: true
      };

      await this.firestore
        .collection('users')
        .doc(user.uid)
        .set(userProfile, { merge: true });

      return { success: true, data: userProfile };
    } catch (error: any) {
      console.error('Error initializing user profile:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserProfile() {
    const user = this.getCurrentUser();
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const doc = await this.firestore
        .collection('users')
        .doc(user.uid)
        .get();
      
      if (doc.exists()) {
        return { success: true, data: doc.data() };
      } else {
        // Create basic profile if doesn't exist
        const basicProfile = {
          email: user.email,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await this.firestore
          .collection('users')
          .doc(user.uid)
          .set(basicProfile);
          
        return { success: true, data: basicProfile };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateUserProfile(updates: any) {
    const user = this.getCurrentUser();
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      await this.firestore
        .collection('users')
        .doc(user.uid)
        .update({
          ...updates,
          updatedAt: new Date().toISOString()
        });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export default new FirebaseManager();
