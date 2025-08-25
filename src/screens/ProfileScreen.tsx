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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import { useTranslation } from '../hooks/useTranslation';
import FirebaseManager from '../logic/FirebaseManager';
import LocalStorageManager from '../logic/LocalStorageManager';
import TicketmasterAPI, { Event } from '../logic/TicketmasterAPI';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setupBiometrics, checkBiometricType } from '../utils/BiometricUtils';
import PermissionManager from '../utils/PermissionManager';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { t, setLanguage, currentLanguage } = useTranslation();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<any>(null);
  const [favoriteEvents, setFavoriteEvents] = useState<Event[]>([]);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadUserData();
    loadFavorites();
    loadBiometricSettings();
    loadUserProfile();
  }, []);

  const loadUserData = () => {
    const currentUser = FirebaseManager.getCurrentUser();
    setUser(currentUser);
  };

  const loadFavorites = async () => {
    const favorites = await LocalStorageManager.getFavoriteEvents();
    setFavoriteEvents(favorites);
  };

  const loadUserProfile = async () => {
    try {
      const result = await FirebaseManager.getUserProfile();
      if (result.success) {
        setUserProfile(result.data);
      }
    } catch (error) {
      console.log('Error loading user profile:', error);
    }
  };

  const loadBiometricSettings = async () => {
    try {
      // Check if biometric is enabled in storage
      const enabled = await AsyncStorage.getItem('biometric_enabled');
      setBiometricEnabled(enabled === 'true');
      
      // Get the available biometric type
      const biometryInfo = await checkBiometricType();
      setBiometricType(biometryInfo.type);
    } catch (error) {
      console.log('Error loading biometric settings:', error);
    }
  };

  const toggleBiometric = async () => {
    try {
      if (biometricEnabled) {
        // Disable biometric
        Alert.alert(
          'Disable Biometric Login',
          'Are you sure you want to disable biometric authentication?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Disable',
              style: 'destructive',
              onPress: async () => {
                await AsyncStorage.setItem('biometric_enabled', 'false');
                await AsyncStorage.removeItem('useBiometrics');
                await AsyncStorage.removeItem('useFaceID');
                await AsyncStorage.removeItem('useFingerprint');
                setBiometricEnabled(false);
                Alert.alert('Success', 'Biometric authentication has been disabled.');
              },
            },
          ]
        );
      } else {
        // Enable biometric
        const biometryInfo = await checkBiometricType();
        
        if (!biometryInfo.type) {
          Alert.alert(
            'Biometric Unavailable',
            'Your device doesn\'t support biometric authentication or it\'s not set up in your device settings.'
          );
          return;
        }

        // Determine the biometric type to setup
        let biometricTypeToSetup = 'both';
        if (biometryInfo.hasFaceRecognition && !biometryInfo.hasFingerprint) {
          biometricTypeToSetup = 'face';
        } else if (biometryInfo.hasFingerprint && !biometryInfo.hasFaceRecognition) {
          biometricTypeToSetup = 'fingerprint';
        }

        const success = await setupBiometrics(true, biometricTypeToSetup);
        
        if (success) {
          await AsyncStorage.setItem('biometric_enabled', 'true');
          setBiometricEnabled(true);
          Alert.alert('Success', 'Biometric authentication has been enabled successfully!');
        } else {
          Alert.alert('Failed', 'Failed to enable biometric authentication. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error toggling biometric:', error);
      Alert.alert('Error', 'An error occurred while updating biometric settings.');
    }
  };

  const selectProfilePicture = () => {
    Alert.alert(
      'Select Profile Picture',
      'Choose an option',
      [
        { text: 'Camera', onPress: openCamera },
        { text: 'Photo Library', onPress: openImageLibrary },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const openCamera = async () => {
    const hasPermission = await PermissionManager.handleCameraPermission();
    if (!hasPermission) {
      return;
    }

    const options = {
      mediaType: 'photo' as MediaType,
      quality: 0.8 as any,
      maxWidth: 500,
      maxHeight: 500,
      includeBase64: true, // Include base64 data
      storageOptions: {
        skipBackup: true,
        path: 'images',
      },
    };

    launchCamera(options, handleImageResponse);
  };

  const openImageLibrary = async () => {
    const hasPermission = await PermissionManager.handlePhotoLibraryPermission();
    if (!hasPermission) {
      return;
    }

    const options = {
      mediaType: 'photo' as MediaType,
      quality: 0.8 as any,
      maxWidth: 500,
      maxHeight: 500,
      includeBase64: true, // Include base64 data
      storageOptions: {
        skipBackup: true,
        path: 'images',
      },
    };

    launchImageLibrary(options, handleImageResponse);
  };

  const handleImageResponse = async (response: ImagePickerResponse) => {
    console.log('Image picker response:', response);
    
    if (response.didCancel || !response.assets?.[0]) {
      console.log('Image picker cancelled or no assets');
      return;
    }

    const asset = response.assets[0];
    console.log('Selected asset:', asset);
    
    if (!asset.base64) {
      console.error('No base64 data in asset');
      Alert.alert('Error', 'Failed to process image. Please try again.');
      return;
    }

    console.log('Base64 data length:', asset.base64.length);
    setUploadingImage(true);
    
    try {
      console.log('Starting upload with base64 data');
      const result = await FirebaseManager.uploadProfilePicture(asset.base64);
      console.log('Upload result:', result);
      
      if (result.success) {
        // Create a data URI for displaying the image
        const imageDataUri = `data:image/jpeg;base64,${result.base64}`;
        setUserProfile((prev: any) => ({ 
          ...prev, 
          profilePictureBase64: result.base64,
          profilePictureDataUri: imageDataUri
        }));
        Alert.alert('Success', 'Profile picture updated successfully!');
      } else {
        console.error('Upload failed:', result.error);
        Alert.alert('Error', result.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Upload exception:', error);
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
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
              await AsyncStorage.multiRemove([
                'biometric_enabled',
                'last_logged_user',
                'useBiometrics',
                'useFaceID',
                'useFingerprint'
              ]);
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
          <TouchableOpacity style={styles.avatarContainer} onPress={selectProfilePicture}>
            {uploadingImage ? (
              <ActivityIndicator size="large" color="#00d4ff" />
            ) : userProfile?.profilePictureBase64 ? (
              <Image 
                source={{ uri: `data:image/jpeg;base64,${userProfile.profilePictureBase64}` }} 
                style={styles.profileImage} 
              />
            ) : userProfile?.profilePicture ? (
              <Image source={{ uri: userProfile.profilePicture }} style={styles.profileImage} />
            ) : (
              <Text style={styles.avatarText}>👤</Text>
            )}
            <View style={styles.cameraIconContainer}>
              <Text style={styles.cameraIcon}>📷</Text>
            </View>
          </TouchableOpacity>
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

          <TouchableOpacity style={styles.settingItem} onPress={toggleBiometric}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>
                {biometricType === 'Face ID' ? '👁️' : biometricType === 'Touch ID' ? '�' : '�🔒'}
              </Text>
              <Text style={styles.settingText}>
                {biometricType ? `${biometricType} Login` : t('biometricLogin')}
              </Text>
            </View>
            <Text style={[styles.settingValue, { color: biometricEnabled ? '#00d4ff' : '#ff6b6b' }]}>
              {biometricEnabled ? 'Enabled' : 'Disabled'}
            </Text>
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
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#00d4ff',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0a0e27',
  },
  cameraIcon: {
    fontSize: 14,
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
