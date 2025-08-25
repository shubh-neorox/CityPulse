import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

/**
 * Comprehensive Firestore Service for CityPulse
 * This service provides advanced Firestore operations and patterns
 */

export interface UserEvent {
  id: string;
  name: string;
  date: string;
  venue: string;
  city: string;
  category: string;
  price?: number;
  imageUrl?: string;
  description?: string;
  ticketmasterId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserReview {
  id: string;
  eventId: string;
  userId: string;
  userEmail: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserActivity {
  id: string;
  userId: string;
  action: 'view' | 'favorite' | 'unfavorite' | 'share' | 'review';
  eventId: string;
  eventName: string;
  timestamp: string;
  metadata?: any;
}

class FirestoreService {
  private db = firestore();

  // Collection references
  private getUsersCollection() {
    return this.db.collection('users');
  }

  private getEventsCollection() {
    return this.db.collection('events');
  }

  private getReviewsCollection() {
    return this.db.collection('reviews');
  }

  private getActivitiesCollection() {
    return this.db.collection('activities');
  }

  private getCurrentUserId(): string | null {
    const user = auth().currentUser;
    return user ? user.uid : null;
  }

  // ==== USER MANAGEMENT ====

  /**
   * Create or update user profile
   */
  async createUserProfile(userData: {
    email: string;
    displayName?: string;
    photoURL?: string;
    preferences?: {
      language: string;
      biometricEnabled: boolean;
      notificationsEnabled: boolean;
      preferredCategories: string[];
      location?: {
        city: string;
        country: string;
        coordinates?: {
          latitude: number;
          longitude: number;
        };
      };
    };
  }) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    try {
      await this.getUsersCollection().doc(userId).set({
        ...userData,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
        lastLoginAt: firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      return { success: true };
    } catch (error: any) {
      console.error('Error creating user profile:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user profile with real-time updates
   */
  subscribeToUserProfile(callback: (profile: any) => void, onError?: (error: any) => void) {
    const userId = this.getCurrentUserId();
    if (!userId) return null;

    return this.getUsersCollection()
      .doc(userId)
      .onSnapshot(
        (doc) => {
          if (doc.exists()) {
            callback({ id: doc.id, ...doc.data() });
          } else {
            callback(null);
          }
        },
        onError || ((error) => console.error('Error listening to user profile:', error))
      );
  }

  // ==== EVENT MANAGEMENT ====

  /**
   * Save event with enhanced metadata
   */
  async saveEvent(eventData: UserEvent) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    try {
      const eventRef = this.getEventsCollection().doc(eventData.id);
      
      // Use transaction to ensure data consistency
      await this.db.runTransaction(async (transaction) => {
        const eventDoc = await transaction.get(eventRef);
        
        if (eventDoc.exists()) {
          // Update existing event
          transaction.update(eventRef, {
            ...eventData,
            updatedAt: firestore.FieldValue.serverTimestamp(),
            saveCount: firestore.FieldValue.increment(1),
          });
        } else {
          // Create new event
          transaction.set(eventRef, {
            ...eventData,
            createdAt: firestore.FieldValue.serverTimestamp(),
            updatedAt: firestore.FieldValue.serverTimestamp(),
            saveCount: 1,
            viewCount: 0,
          });
        }

        // Add to user's favorites
        const userFavoriteRef = this.getUsersCollection()
          .doc(userId)
          .collection('favorites')
          .doc(eventData.id);
        
        transaction.set(userFavoriteRef, {
          ...eventData,
          addedAt: firestore.FieldValue.serverTimestamp(),
        });
      });

      // Track activity
      await this.trackUserActivity({
        action: 'favorite',
        eventId: eventData.id,
        eventName: eventData.name,
        metadata: { category: eventData.category, city: eventData.city }
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error saving event:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get popular events with pagination
   */
  async getPopularEvents(options: {
    limit?: number;
    category?: string;
    city?: string;
    startAfter?: any;
  } = {}) {
    try {
      let query = this.getEventsCollection()
        .orderBy('saveCount', 'desc')
        .orderBy('createdAt', 'desc');

      if (options.category) {
        query = query.where('category', '==', options.category);
      }

      if (options.city) {
        query = query.where('city', '==', options.city);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.startAfter) {
        query = query.startAfter(options.startAfter);
      }

      const snapshot = await query.get();
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastDoc: doc // For pagination
      }));

      return { success: true, data: events };
    } catch (error: any) {
      console.error('Error getting popular events:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Track event view with analytics
   */
  async trackEventView(eventId: string, eventData: any) {
    const userId = this.getCurrentUserId();
    if (!userId) return { success: false, error: 'User not authenticated' };

    try {
      // Update event view count
      await this.getEventsCollection()
        .doc(eventId)
        .update({
          viewCount: firestore.FieldValue.increment(1),
          lastViewedAt: firestore.FieldValue.serverTimestamp(),
        });

      // Track user activity
      await this.trackUserActivity({
        action: 'view',
        eventId,
        eventName: eventData.name || 'Unknown Event',
        metadata: {
          category: eventData.category,
          city: eventData.city,
          venue: eventData.venue
        }
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error tracking event view:', error);
      return { success: false, error: error.message };
    }
  }

  // ==== REVIEWS SYSTEM ====

  /**
   * Add or update event review
   */
  async addEventReview(review: Omit<UserReview, 'id' | 'userId' | 'userEmail' | 'createdAt' | 'updatedAt'>) {
    const userId = this.getCurrentUserId();
    const user = auth().currentUser;
    if (!userId || !user) throw new Error('User not authenticated');

    try {
      const reviewRef = this.getReviewsCollection().doc();
      
      await reviewRef.set({
        ...review,
        id: reviewRef.id,
        userId,
        userEmail: user.email || '',
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      // Update event average rating
      await this.updateEventRating(review.eventId);

      return { success: true, id: reviewRef.id };
    } catch (error: any) {
      console.error('Error adding review:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get reviews for an event
   */
  async getEventReviews(eventId: string, limit: number = 20) {
    try {
      const snapshot = await this.getReviewsCollection()
        .where('eventId', '==', eventId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      const reviews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { success: true, data: reviews };
    } catch (error: any) {
      console.error('Error getting event reviews:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update event average rating
   */
  private async updateEventRating(eventId: string) {
    try {
      const reviewsSnapshot = await this.getReviewsCollection()
        .where('eventId', '==', eventId)
        .get();

      if (reviewsSnapshot.empty) return;

      const reviews = reviewsSnapshot.docs.map(doc => doc.data());
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;

      await this.getEventsCollection()
        .doc(eventId)
        .update({
          averageRating,
          reviewCount: reviews.length,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      console.error('Error updating event rating:', error);
    }
  }

  // ==== ACTIVITY TRACKING ====

  /**
   * Track user activity for analytics
   */
  async trackUserActivity(activity: Omit<UserActivity, 'id' | 'userId' | 'timestamp'>) {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    try {
      const activityRef = this.getActivitiesCollection().doc();
      
      await activityRef.set({
        ...activity,
        id: activityRef.id,
        userId,
        timestamp: firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Error tracking user activity:', error);
    }
  }

  /**
   * Get user activity history
   */
  async getUserActivity(limit: number = 50) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    try {
      const snapshot = await this.getActivitiesCollection()
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      const activities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { success: true, data: activities };
    } catch (error: any) {
      console.error('Error getting user activity:', error);
      return { success: false, error: error.message };
    }
  }

  // ==== REAL-TIME SUBSCRIPTIONS ====

  /**
   * Subscribe to user's favorites with real-time updates
   */
  subscribeToFavorites(callback: (favorites: any[]) => void, onError?: (error: any) => void) {
    const userId = this.getCurrentUserId();
    if (!userId) return null;

    return this.getUsersCollection()
      .doc(userId)
      .collection('favorites')
      .orderBy('addedAt', 'desc')
      .onSnapshot(
        (snapshot) => {
          const favorites = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          callback(favorites);
        },
        onError || ((error) => console.error('Error listening to favorites:', error))
      );
  }

  /**
   * Subscribe to event reviews in real-time
   */
  subscribeToEventReviews(eventId: string, callback: (reviews: any[]) => void, onError?: (error: any) => void) {
    return this.getReviewsCollection()
      .where('eventId', '==', eventId)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .onSnapshot(
        (snapshot) => {
          const reviews = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          callback(reviews);
        },
        onError || ((error) => console.error('Error listening to reviews:', error))
      );
  }

  // ==== SEARCH AND FILTERING ====

  /**
   * Search events by text (requires Algolia or similar for production)
   * This is a basic implementation using Firestore queries
   */
  async searchEvents(searchTerm: string, filters: {
    category?: string;
    city?: string;
    dateRange?: { start: string; end: string };
  } = {}) {
    try {
      let query: any = this.getEventsCollection();

      // Basic text search (limited in Firestore)
      if (searchTerm) {
        const searchTermLower = searchTerm.toLowerCase();
        query = query
          .where('name', '>=', searchTermLower)
          .where('name', '<=', searchTermLower + '\uf8ff');
      }

      if (filters.category) {
        query = query.where('category', '==', filters.category);
      }

      if (filters.city) {
        query = query.where('city', '==', filters.city);
      }

      if (filters.dateRange) {
        query = query
          .where('date', '>=', filters.dateRange.start)
          .where('date', '<=', filters.dateRange.end);
      }

      const snapshot = await query.limit(50).get();
      const events = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));

      return { success: true, data: events };
    } catch (error: any) {
      console.error('Error searching events:', error);
      return { success: false, error: error.message };
    }
  }

  // ==== OFFLINE SUPPORT ====

  /**
   * Enable offline persistence (call once in app initialization)
   */
  async enableOfflineSupport() {
    try {
      await firestore().settings({
        persistence: true,
        cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
      });
      console.log('Firestore offline support enabled');
    } catch (error) {
      console.error('Error enabling offline support:', error);
    }
  }

  /**
   * Detect network status for Firestore
   */
  async getNetworkStatus() {
    try {
      await firestore().disableNetwork();
      await firestore().enableNetwork();
      return { online: true };
    } catch (error) {
      return { online: false };
    }
  }
}

export default new FirestoreService();
