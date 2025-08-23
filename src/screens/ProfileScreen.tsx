import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  FlatList,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from '../hooks/useTranslation';
import FirebaseManager from '../logic/FirebaseManager';
import LocalStorageManager from '../logic/LocalStorageManager';
import TicketmasterAPI, { Event } from '../logic/TicketmasterAPI';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { t, setLanguage, currentLanguage } = useTranslation();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<any>(null);
  const [favoriteEvents, setFavoriteEvents] = useState<Event[]>([]);

  useEffect(() => {
    loadUserData();
    loadFavorites();
  }, []);

  const loadUserData = () => {
    const currentUser = FirebaseManager.getCurrentUser();
    setUser(currentUser);
  };

  const loadFavorites = async () => {
    const favorites = await LocalStorageManager.getFavoriteEvents();
    setFavoriteEvents(favorites);
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            const result = await FirebaseManager.signOut();
            if (result.success) {
              // Clear all user data including biometric settings
              await LocalStorageManager.clearAllData();
              await AsyncStorage.removeItem('biometric_enabled');
              await AsyncStorage.removeItem('last_logged_user');
              navigation.navigate('Login' as never);
            }
          },
        },
      ]
    );
  };

  const toggleLanguage = () => {
    const newLanguage = currentLanguage === 'en' ? 'ar' : 'en';
    setLanguage(newLanguage);
  };

  const clearFavorites = async () => {
    Alert.alert(
      'Clear Favorites',
      'Are you sure you want to clear all favorite events?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            const favorites = await LocalStorageManager.getFavoriteEvents();
            for (const event of favorites) {
              await LocalStorageManager.removeFavoriteEvent(event.id);
            }
            setFavoriteEvents([]);
          },
        },
      ]
    );
  };

  const renderFavoriteEvent = ({ item }: { item: Event }) => {
    const imageUrl = TicketmasterAPI.getImageUrl(item);
    const venue = TicketmasterAPI.getVenueInfo(item);

    return (
      <TouchableOpacity 
        style={styles.favoriteCard}
        onPress={() => (navigation as any).navigate('EventDetails', { event: item })}
      >
        <Image source={{ uri: imageUrl }} style={styles.favoriteImage} />
        <View style={styles.favoriteInfo}>
          <Text style={styles.favoriteTitle} numberOfLines={2}>{item.name}</Text>
          {venue && (
            <Text style={styles.favoriteVenue} numberOfLines={1}>
              📍 {venue.name}, {venue.city}
            </Text>
          )}
          {item.dates.start.localDate && (
            <Text style={styles.favoriteDate}>
              📅 {item.dates.start.localDate}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0e27" translucent />
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('profile')}</Text>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <Text style={styles.userName}>{user?.email || 'Guest User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>{t('settings')}</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={toggleLanguage}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🌐</Text>
              <Text style={styles.settingText}>{t('language')}</Text>
            </View>
            <Text style={styles.settingValue}>
              {currentLanguage === 'en' ? t('english') : t('arabic')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🔔</Text>
              <Text style={styles.settingText}>Notifications</Text>
            </View>
            <Text style={styles.settingValue}>Enabled</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🔒</Text>
              <Text style={styles.settingText}>{t('biometricLogin')}</Text>
            </View>
            <Text style={styles.settingValue}>Enabled</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.favoritesSection}>
          <View style={styles.favoritesHeader}>
            <Text style={styles.sectionTitle}>{t('favorites')} ({favoriteEvents.length})</Text>
            {favoriteEvents.length > 0 && (
              <TouchableOpacity onPress={clearFavorites}>
                <Text style={styles.clearButton}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {favoriteEvents.length === 0 ? (
            <View style={styles.emptyFavorites}>
              <Text style={styles.emptyText}>No favorite events yet</Text>
              <Text style={styles.emptySubtext}>Add events to favorites from the home screen</Text>
            </View>
          ) : (
            <FlatList
              data={favoriteEvents}
              renderItem={renderFavoriteEvent}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          )}
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>🚪 Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  backButton: {
    backgroundColor: '#16213e',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#00d4ff',
  },
  backIcon: {
    fontSize: 24,
    color: '#00d4ff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1,
  },
  profileSection: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#16213e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#00d4ff',
  },
  avatarText: {
    fontSize: 40,
    color: '#00d4ff',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#a8a8a8',
  },
  settingsSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
  },
  settingItem: {
    backgroundColor: '#1a1f3a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  settingText: {
    fontSize: 16,
    color: '#ffffff',
  },
  settingValue: {
    fontSize: 14,
    color: '#00d4ff',
    fontWeight: '600',
  },
  favoritesSection: {
    padding: 20,
    paddingTop: 0,
  },
  favoritesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  clearButton: {
    fontSize: 14,
    color: '#ff6b6b',
    fontWeight: '600',
  },
  emptyFavorites: {
    backgroundColor: '#1a1f3a',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#a8a8a8',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  favoriteCard: {
    backgroundColor: '#1a1f3a',
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  favoriteImage: {
    width: 80,
    height: 80,
    backgroundColor: '#2a2f4a',
  },
  favoriteInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  favoriteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  favoriteVenue: {
    fontSize: 12,
    color: '#00d4ff',
    marginBottom: 2,
  },
  favoriteDate: {
    fontSize: 12,
    color: '#a8a8a8',
  },
  signOutButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    margin: 20,
    marginTop: 10,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
