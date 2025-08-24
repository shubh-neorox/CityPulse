import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import storage, { FirebaseStorageTypes } from '@react-native-firebase/storage';

class FirebaseManager {
  public auth: FirebaseAuthTypes.Module;
  public firestore: FirebaseFirestoreTypes.Module;
  public storage: FirebaseStorageTypes.Module;

  constructor() {
    this.auth = auth();
    this.firestore = firestore();
    this.storage = storage();
  }

  async signInWithEmail(email: string, password: string) {
    try {
      const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
      return { success: true, user: userCredential.user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async signUpWithEmail(email: string, password: string) {
    try {
      const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
      return { success: true, user: userCredential.user };
    } catch (error: any) {
      return { success: false, error: error.message };
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

  // Test Firebase connection
  async testFirebaseConnection() {
    try {
      // Test Firestore connection by writing and reading a test document
      const testDocRef = this.firestore.collection('test').doc('connection');
      await testDocRef.set({ 
        timestamp: new Date().toISOString(),
        platform: 'mobile',
        test: true 
      });
      
      const testDoc = await testDocRef.get();
      
      if (testDoc.exists()) {
        // Clean up test document
        await testDocRef.delete();
        return { success: true, message: 'Firebase connection successful' };
      } else {
        return { success: false, error: 'Failed to read test document' };
      }
    } catch (error: any) {
      console.error('Firebase connection test failed:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new FirebaseManager();
