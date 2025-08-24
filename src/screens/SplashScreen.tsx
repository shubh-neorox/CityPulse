import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from '../hooks/useTranslation';
import ReactNativeBiometrics from 'react-native-biometrics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FirebaseManager from '../logic/FirebaseManager';
import { validateBiometric, checkBiometricType } from '../utils/BiometricUtils';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.3);
  const [showBiometricOption, setShowBiometricOption] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [showSkipButton, setShowSkipButton] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    initializeApp();
    
    // Show emergency skip button after 4 seconds
    const skipTimer = setTimeout(() => {
      setShowSkipButton(true);
    }, 4000);

    return () => {
      clearTimeout(skipTimer);
    };
  }, [navigation]);

  // Separate effect for biometric fallback timer
  useEffect(() => {
    let biometricFallbackTimer: ReturnType<typeof setTimeout>;
    
    if (showBiometricOption && !isAuthenticated) {
      // Add a fallback timer for biometric option
      biometricFallbackTimer = setTimeout(() => {
        console.log('Biometric fallback timer triggered');
        navigation.navigate('Login' as never);
      }, 10000); // 10 seconds fallback
    }

    return () => {
      if (biometricFallbackTimer) {
        clearTimeout(biometricFallbackTimer);
      }
    };
  }, [showBiometricOption, isAuthenticated, navigation]);

  const initializeApp = async () => {
    // Add safety timeout to prevent getting stuck
    const safetyTimeout = setTimeout(() => {
      console.log('Safety timeout triggered - navigating to login');
      navigation.navigate('Login' as never);
    }, 6000); // 6 seconds maximum

    try {
      // Use simpler animations on Android for better performance
      const animationDuration = Platform.OS === 'android' ? 600 : 800;
      const springConfig = Platform.OS === 'android' 
        ? { tension: 120, friction: 10 } 
        : { tension: 100, friction: 8 };

      // Start animations with completion callback
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: animationDuration,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          ...springConfig,
          useNativeDriver: true,
        }),
      ]).start(async ({ finished }) => {
        if (finished) {
          // Clear safety timeout since animation completed
          clearTimeout(safetyTimeout);
          
          // Small delay before checking session to ensure UI is ready
          setTimeout(async () => {
            await checkUserSession();
          }, 2000);
        }
      });
    } catch (error) {
      console.log('Animation error:', error);
      clearTimeout(safetyTimeout);
      navigation.navigate('Login' as never);
    }
  };

  const checkUserSession = async () => {
    try {
      console.log('Checking user session...');
      
      // Check if there's a stored user session
      const biometricEnabled = await AsyncStorage.getItem('biometric_enabled');
      const lastUser = await AsyncStorage.getItem('last_logged_user');
      
      console.log('Biometric enabled:', biometricEnabled);
      console.log('Last user exists:', !!lastUser);

      // Check biometric availability with safer error handling
      let biometricAvailable = false;
      try {
        const biometricInfo = await checkBiometricType();
        biometricAvailable = biometricInfo.type !== null;
        console.log('Biometric check result:', biometricInfo);
      } catch (biometricError) {
        console.log('Biometric check failed (safe fallback):', biometricError);
        biometricAvailable = false;
      }
      
      setBiometricAvailable(biometricAvailable);

      // If user was previously logged in and biometric is available, show biometric option
      if (biometricEnabled === 'true' && lastUser && biometricAvailable) {
        console.log('Showing biometric option...');
        setShowBiometricOption(true);
        
        // Auto-trigger biometric prompt with improved error handling
        setTimeout(async () => {
          try {
            console.log('Auto-triggering biometric prompt...');
            
            const success = await validateBiometric(setIsAuthenticated, false);
            
            if (success) {
              console.log('Biometric authentication successful');
              navigation.navigate('Home' as never);
            } else {
              console.log('Biometric authentication cancelled/failed');
              // Don't navigate immediately, let user try again or use password
              setTimeout(() => {
                if (!isAuthenticated) {
                  navigation.navigate('Login' as never);
                }
              }, 2000);
            }
          } catch (error: any) {
            console.log('Auto biometric error:', error);
            
            // Check if it's a user cancellation vs system error
            if (error?.message && error.message.includes('UserCancel')) {
              console.log('User cancelled biometric');
              // Give user another chance
              setTimeout(() => {
                if (!isAuthenticated) {
                  navigation.navigate('Login' as never);
                }
              }, 2000);
            } else {
              console.log('Biometric system error, fallback to login');
              navigation.navigate('Login' as never);
            }
          }
        }, 1500);
      } else {
        // Navigate to login after shorter delay
        console.log('Navigating to login...');
        setTimeout(() => {
          navigation.navigate('Login' as never);
        }, 1500);
      }
    } catch (error) {
      console.log('Session check error (safe fallback):', error);
      // Immediate fallback to login screen on any error
      setTimeout(() => {
        navigation.navigate('Login' as never);
      }, 500);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      console.log('Manual biometric login triggered');
      
      const success = await validateBiometric(setIsAuthenticated, false);
      
      if (success) {
        // Navigate directly to Home
        navigation.navigate('Home' as never);
      } else {
        // User cancelled or failed, go to login
        navigation.navigate('Login' as never);
      }
    } catch (error: any) {
      console.log('Manual biometric login error:', error);
      
      if (error?.message && error.message.includes('UserCancel')) {
        console.log('User cancelled manual biometric');
        // Stay on splash screen, user can try again
      } else if (error?.message && error.message.includes('timeout')) {
        console.log('Biometric prompt timeout');
        Alert.alert('Timeout', 'Biometric authentication timed out. Please try again.');
      } else {
        Alert.alert('Error', 'Biometric authentication failed. Please try again.');
        navigation.navigate('Login' as never);
      }
    }
  };  const handleSkipBiometric = () => {
    console.log('User skipped biometric login');
    navigation.navigate('Login' as never);
  };

  // Add an emergency skip function in case the screen gets stuck
  const handleEmergencySkip = () => {
    console.log('Emergency skip triggered');
    navigation.navigate('Login' as never);
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}>
        <View style={styles.logo}>
          <View style={styles.buildingsContainer}>
            <View style={[styles.building, styles.building1]} />
            <View style={[styles.building, styles.building2]} />
            <View style={[styles.building, styles.building3]} />
          </View>
          <View style={styles.pulseWave} />
        </View>
        <Text style={styles.appName}>CITY PULSE</Text>
        <Text style={styles.tagline}>{t('welcome')}</Text>
      </Animated.View>
      
      {showBiometricOption && (
        <Animated.View style={[styles.biometricContainer, { opacity: fadeAnim }]}>
          <Text style={styles.biometricTitle}>Welcome back!</Text>
          <Text style={styles.biometricSubtitle}>Authentication in progress...</Text>
          
          <TouchableOpacity 
            style={styles.biometricButton}
            onPress={handleBiometricLogin}
          >
            <Text style={styles.biometricButtonText}>🔒 Try Biometric Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.skipButton}
            onPress={handleSkipBiometric}
          >
            <Text style={styles.skipButtonText}>Use Email & Password</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
      
      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <Text style={styles.footerText}>Discover events around you</Text>
        
        {(showSkipButton || showBiometricOption) && (
          <TouchableOpacity 
            style={styles.emergencySkipButton}
            onPress={handleEmergencySkip}
          >
            <Text style={styles.emergencySkipText}>
              {showBiometricOption ? 'Skip Biometric →' : 'Skip to Login →'}
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#16213e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 3,
    borderColor: '#00d4ff',
  },
  buildingsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: 8,
  },
  building: {
    marginHorizontal: 2,
    borderRadius: 2,
  },
  building1: {
    width: 12,
    height: 25,
    backgroundColor: '#4a69bd',
  },
  building2: {
    width: 14,
    height: 35,
    backgroundColor: '#0097e6',
  },
  building3: {
    width: 12,
    height: 28,
    backgroundColor: '#ff6348',
  },
  pulseWave: {
    width: 30,
    height: 3,
    backgroundColor: '#ffffff',
    borderRadius: 2,
    position: 'relative',
  },
  logoText: {
    fontSize: 50,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 16,
    color: '#a8a8a8',
    textAlign: 'center',
    marginTop: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  biometricContainer: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 30,
  },
  biometricTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  biometricSubtitle: {
    fontSize: 16,
    color: '#a8a8a8',
    textAlign: 'center',
    marginBottom: 30,
  },
  biometricButton: {
    backgroundColor: '#00d4ff',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 40,
    marginBottom: 15,
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  biometricButtonText: {
    color: '#0a0e27',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  skipButton: {
    borderWidth: 1,
    borderColor: '#666666',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  skipButtonText: {
    color: '#a8a8a8',
    fontSize: 14,
    textAlign: 'center',
  },
  emergencySkipButton: {
    marginTop: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  emergencySkipText: {
    color: '#00d4ff',
    fontSize: 12,
    textAlign: 'center',
  },
});
