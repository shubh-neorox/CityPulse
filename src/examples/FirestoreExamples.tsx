/**
 * Firestore Integration Examples for CityPulse
 * 
 * This file demonstrates how to use Firestore in your React Native app
 * with real-world examples for the CityPulse project.
 */

import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import FirebaseManager from '../logic/FirebaseManager';
import FirestoreService from '../services/FirestoreService';

// ===== EXAMPLE 1: User Profile Management =====

export const useUserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to real-time profile updates
    const unsubscribe = FirestoreService.subscribeToUserProfile(
      (profileData) => {
        setProfile(profileData);
        setLoading(false);
      },
      (error) => {
        console.error('Profile subscription error:', error);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const updateProfile = async (updates: any) => {
    setLoading(true);
    try {
      const result = await FirebaseManager.updateUserProfile(updates);
      if (result.success) {
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return { profile, loading, updateProfile };
};

// ===== EXAMPLE 2: Event Favorites with Real-time Updates =====

export const useFavoriteEvents = () => {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to real-time favorites updates
    const unsubscribe = FirestoreService.subscribeToFavorites(
      (favoritesData) => {
        setFavorites(favoritesData);
        setLoading(false);
      },
      (error) => {
        console.error('Favorites subscription error:', error);
        setLoading(false);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const addToFavorites = async (eventData: any) => {
    try {
      const result = await FirebaseManager.saveFavoriteEvent(eventData.id, {
        ...eventData,
        addedAt: new Date().toISOString(),
      });
      
      if (result.success) {
        // Also track the event in our enhanced service
        await FirestoreService.saveEvent(eventData);
        Alert.alert('Success', 'Event added to favorites!');
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add event to favorites');
    }
  };

  const removeFromFavorites = async (eventId: string) => {
    try {
      const result = await FirebaseManager.removeFavoriteEvent(eventId);
      if (result.success) {
        Alert.alert('Success', 'Event removed from favorites!');
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to remove event from favorites');
    }
  };

  return { favorites, loading, addToFavorites, removeFromFavorites };
};

// ===== EXAMPLE 3: Event Reviews System =====

export const useEventReviews = (eventId: string) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;

    // Subscribe to real-time reviews updates
    const unsubscribe = FirestoreService.subscribeToEventReviews(
      eventId,
      (reviewsData) => {
        setReviews(reviewsData);
        setLoading(false);
      },
      (error) => {
        console.error('Reviews subscription error:', error);
        setLoading(false);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [eventId]);

  const addReview = async (rating: number, comment: string) => {
    try {
      const result = await FirestoreService.addEventReview({
        eventId,
        rating,
        comment,
      });
      
      if (result.success) {
        Alert.alert('Success', 'Review added successfully!');
        return true;
      } else {
        Alert.alert('Error', result.error);
        return false;
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add review');
      return false;
    }
  };

  return { reviews, loading, addReview };
};

// ===== EXAMPLE 4: Popular Events Discovery =====

export const usePopularEvents = () => {
  const [popularEvents, setPopularEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPopularEvents = async (options: {
    category?: string;
    city?: string;
    limit?: number;
  } = {}) => {
    setLoading(true);
    try {
      const result = await FirestoreService.getPopularEvents({
        limit: 20,
        ...options,
      });
      
      if (result.success && result.data) {
        setPopularEvents(result.data);
      } else {
        console.error('Error loading popular events:', result.error);
      }
    } catch (error) {
      console.error('Error loading popular events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPopularEvents();
  }, []);

  return { popularEvents, loading, loadPopularEvents };
};

// ===== EXAMPLE 5: User Activity Tracking =====

export const trackEventInteraction = async (
  action: 'view' | 'favorite' | 'share',
  eventData: any
) => {
  try {
    // Track in Firebase Manager for basic analytics
    if (action === 'view') {
      await FirebaseManager.trackEventView(eventData.id, eventData);
    }

    // Track in enhanced Firestore Service for detailed analytics
    await FirestoreService.trackUserActivity({
      action,
      eventId: eventData.id,
      eventName: eventData.name,
      metadata: {
        category: eventData.category,
        city: eventData.city,
        venue: eventData.venue,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Error tracking event interaction:', error);
  }
};

// ===== EXAMPLE 6: Search and Filter Events =====

export const useEventSearch = () => {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const searchEvents = async (
    searchTerm: string,
    filters: {
      category?: string;
      city?: string;
      dateRange?: { start: string; end: string };
    } = {}
  ) => {
    setLoading(true);
    try {
      const result = await FirestoreService.searchEvents(searchTerm, filters);
      
      if (result.success && result.data) {
        setSearchResults(result.data);
      } else {
        console.error('Search error:', result.error);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  return { searchResults, loading, searchEvents };
};

// ===== EXAMPLE 7: User Preferences Management =====

export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadPreferences = async () => {
    try {
      const result = await FirebaseManager.getUserPreferences();
      if (result.success && result.data) {
        setPreferences(result.data);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (newPreferences: any) => {
    try {
      const result = await FirebaseManager.saveUserPreferences(newPreferences);
      if (result.success) {
        setPreferences(newPreferences);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving preferences:', error);
      return false;
    }
  };

  useEffect(() => {
    loadPreferences();
  }, []);

  return { preferences, loading, savePreferences };
};

// ===== EXAMPLE 8: Offline Support =====

export const useOfflineSupport = () => {
  const [isOnline, setIsOnline] = useState(true);

  const checkNetworkStatus = async () => {
    try {
      const status = await FirestoreService.getNetworkStatus();
      setIsOnline(status.online);
      return status.online;
    } catch (error) {
      setIsOnline(false);
      return false;
    }
  };

  const enableOfflineSupport = async () => {
    try {
      await FirestoreService.enableOfflineSupport();
      console.log('Offline support enabled');
    } catch (error) {
      console.error('Failed to enable offline support:', error);
    }
  };

  useEffect(() => {
    // Enable offline support on app start
    enableOfflineSupport();
    
    // Check network status periodically
    const interval = setInterval(checkNetworkStatus, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  return { isOnline, checkNetworkStatus };
};

// ===== EXAMPLE 9: Initialize Firestore in App =====

export const initializeFirestore = async () => {
  try {
    // Test Firebase connection
    const connectionTest = await FirebaseManager.testFirebaseConnection();
    if (connectionTest.success) {
      console.log('✅ Firebase connected successfully');
    } else {
      console.error('❌ Firebase connection failed:', connectionTest.error);
    }

    // Enable offline support
    await FirestoreService.enableOfflineSupport();
    console.log('✅ Offline support enabled');

    return true;
  } catch (error) {
    console.error('❌ Firestore initialization failed:', error);
    return false;
  }
};

// ===== EXAMPLE 10: Batch Operations =====

export const batchUpdateFavorites = async (operations: Array<{
  type: 'add' | 'remove';
  eventId: string;
  eventData?: any;
}>) => {
  try {
    const result = await FirebaseManager.batchUpdateFavorites(operations);
    if (result.success) {
      Alert.alert('Success', 'Favorites updated successfully!');
      return true;
    } else {
      Alert.alert('Error', result.error);
      return false;
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to update favorites');
    return false;
  }
};

// ===== USAGE IN COMPONENTS =====

/*
// Example usage in a React component:

import React from 'react';
import { View, Text, Button } from 'react-native';
import { useFavoriteEvents, trackEventInteraction } from './FirestoreExamples';

const EventCard = ({ event }) => {
  const { addToFavorites } = useFavoriteEvents();

  const handleFavorite = async () => {
    await addToFavorites(event);
    await trackEventInteraction('favorite', event);
  };

  const handleView = async () => {
    await trackEventInteraction('view', event);
    // Navigate to event details
  };

  return (
    <View>
      <Text>{event.name}</Text>
      <Button title="Add to Favorites" onPress={handleFavorite} />
      <Button title="View Details" onPress={handleView} />
    </View>
  );
};

// Example usage in App.tsx initialization:

import { initializeFirestore } from './src/examples/FirestoreExamples';

const App = () => {
  useEffect(() => {
    initializeFirestore();
  }, []);

  return (
    // Your app content
  );
};
*/
