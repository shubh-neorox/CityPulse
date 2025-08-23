import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useTranslation } from '../hooks/useTranslation';
import FirebaseManager from '../logic/FirebaseManager';
import ReactNativeBiometrics from 'react-native-biometrics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

export default function LoginScreen() {
  const navigation = useNavigation();
  const { t, isRTL } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  React.useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const rnBiometrics = new ReactNativeBiometrics();
      const { available } = await rnBiometrics.isSensorAvailable();
      setBiometricAvailable(available);
    } catch (error) {
      console.log('Biometric check error:', error);
    }
  };

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const result = await FirebaseManager.signInWithEmail(values.email, values.password);
      if (result.success) {
        // Save user for biometric login
        await AsyncStorage.setItem('last_logged_user', values.email);
        
        // Ask user if they want to enable biometric login
        if (biometricAvailable) {
          Alert.alert(
            'Enable Biometric Login',
            'Would you like to use biometric authentication for faster login next time?',
            [
              {
                text: 'Maybe Later',
                onPress: () => navigation.navigate('Home' as never),
                style: 'cancel',
              },
              {
                text: 'Enable',
                onPress: async () => {
                  await AsyncStorage.setItem('biometric_enabled', 'true');
                  navigation.navigate('Home' as never);
                },
              },
            ]
          );
        } else {
          navigation.navigate('Home' as never);
        }
      } else {
        Alert.alert('Login Failed', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const rnBiometrics = new ReactNativeBiometrics();
      const { success } = await rnBiometrics.simplePrompt({
        promptMessage: 'Authenticate to login to City Pulse',
        fallbackPromptMessage: 'Use passcode',
      });
      
      if (success) {
        // Enable biometric for future logins
        await AsyncStorage.setItem('biometric_enabled', 'true');
        navigation.navigate('Home' as never);
      }
    } catch (error) {
      console.log('Biometric login error:', error);
      Alert.alert('Error', 'Biometric authentication failed. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.buildingsContainer}>
              <View style={[styles.building, styles.building1]} />
              <View style={[styles.building, styles.building2]} />
              <View style={[styles.building, styles.building3]} />
            </View>
            <View style={styles.pulseWave} />
          </View>
          <Text style={styles.title}>CITY PULSE</Text>
          <Text style={styles.subtitle}>{t('welcome')}</Text>
        </View>

        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={LoginSchema}
          onSubmit={handleLogin}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, isRTL && styles.inputRTL]}
                  placeholder={t('email')}
                  placeholderTextColor="#666"
                  value={values.email}
                  onChangeText={handleChange('email')}
                  onBlur={handleBlur('email')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  textAlign={isRTL ? 'right' : 'left'}
                />
                {touched.email && errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, isRTL && styles.inputRTL]}
                  placeholder={t('password')}
                  placeholderTextColor="#666"
                  value={values.password}
                  onChangeText={handleChange('password')}
                  onBlur={handleBlur('password')}
                  secureTextEntry
                  textAlign={isRTL ? 'right' : 'left'}
                />
                {touched.password && errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
              </View>

              <TouchableOpacity 
                style={styles.loginButton} 
                onPress={handleSubmit as any}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.loginButtonText}>{t('login')}</Text>
                )}
              </TouchableOpacity>

              {biometricAvailable && (
                <TouchableOpacity 
                  style={styles.biometricButton} 
                  onPress={handleBiometricLogin}
                >
                  <Text style={styles.biometricButtonText}>🔒 {t('biometricLogin')}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                style={styles.signUpLink}
                onPress={() => navigation.navigate('SignUp' as never)}
              >
                <Text style={styles.signUpText}>
                  Don't have an account? <Text style={styles.signUpLinkText}>{t('signup')}</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Formik>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#16213e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#00d4ff',
  },
  buildingsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: 4,
  },
  building: {
    marginHorizontal: 1,
    borderRadius: 1,
  },
  building1: {
    width: 8,
    height: 15,
    backgroundColor: '#4a69bd',
  },
  building2: {
    width: 10,
    height: 20,
    backgroundColor: '#0097e6',
  },
  building3: {
    width: 8,
    height: 16,
    backgroundColor: '#ff6348',
  },
  pulseWave: {
    width: 20,
    height: 2,
    backgroundColor: '#ffffff',
    borderRadius: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#a8a8a8',
    marginTop: 5,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#1a1f3a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#2a2f4a',
  },
  inputRTL: {
    textAlign: 'right',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  loginButton: {
    backgroundColor: '#00d4ff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  biometricButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#00d4ff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 15,
  },
  biometricButtonText: {
    color: '#00d4ff',
    fontSize: 14,
    fontWeight: '600',
  },
  signUpLink: {
    alignItems: 'center',
    marginTop: 30,
  },
  signUpText: {
    color: '#a8a8a8',
    fontSize: 14,
  },
  signUpLinkText: {
    color: '#00d4ff',
    fontWeight: 'bold',
  },
});
