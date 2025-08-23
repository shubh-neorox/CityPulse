import AsyncStorage from '@react-native-async-storage/async-storage';
import { Event } from './TicketmasterAPI';

const FAVORITES_KEY = 'user_favorites';
const USER_DATA_KEY = 'user_data';

export interface UserData {
  email?: string;
  name?: string;
  preferences?: {
    language: string;
    biometricEnabled: boolean;
  };
}

class LocalStorageManager {
  async saveFavoriteEvent(event: Event) {
    try {
      const favorites = await this.getFavoriteEvents();
      const updatedFavorites = [...favorites, event];
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async removeFavoriteEvent(eventId: string) {
    try {
      const favorites = await this.getFavoriteEvents();
      const updatedFavorites = favorites.filter(event => event.id !== eventId);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getFavoriteEvents(): Promise<Event[]> {
    try {
      const favoritesString = await AsyncStorage.getItem(FAVORITES_KEY);
      return favoritesString ? JSON.parse(favoritesString) : [];
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [];
    }
  }

  async isEventFavorite(eventId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavoriteEvents();
      return favorites.some(event => event.id === eventId);
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
  }

  async saveUserData(userData: UserData) {
    try {
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getUserData(): Promise<UserData | null> {
    try {
      const userDataString = await AsyncStorage.getItem(USER_DATA_KEY);
      return userDataString ? JSON.parse(userDataString) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  async clearAllData() {
    try {
      await AsyncStorage.multiRemove([FAVORITES_KEY, USER_DATA_KEY]);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export default new LocalStorageManager();
