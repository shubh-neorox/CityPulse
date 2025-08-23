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

const SignUpSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
});

export default function SignUpScreen() {
  const navigation = useNavigation();
  const { t, isRTL } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (values: { email: string; password: string; confirmPassword: string }) => {
    setLoading(true);
    try {
      const result = await FirebaseManager.signUpWithEmail(values.email, values.password);
      if (result.success) {
        Alert.alert('Success', 'Account created successfully!', [
          { text: 'OK', onPress: () => navigation.navigate('Login' as never) }
        ]);
      } else {
        Alert.alert('Sign Up Failed', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join City Pulse today</Text>
        </View>

        <Formik
          initialValues={{ email: '', password: '', confirmPassword: '' }}
          validationSchema={SignUpSchema}
          onSubmit={handleSignUp}
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

              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, isRTL && styles.inputRTL]}
                  placeholder={t('confirmPassword')}
                  placeholderTextColor="#666"
                  value={values.confirmPassword}
                  onChangeText={handleChange('confirmPassword')}
                  onBlur={handleBlur('confirmPassword')}
                  secureTextEntry
                  textAlign={isRTL ? 'right' : 'left'}
                />
                {touched.confirmPassword && errors.confirmPassword && (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}
              </View>

              <TouchableOpacity 
                style={styles.signUpButton} 
                onPress={handleSubmit as any}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.signUpButtonText}>{t('signup')}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.loginLink}
                onPress={() => navigation.navigate('Login' as never)}
              >
                <Text style={styles.loginText}>
                  Already have an account? <Text style={styles.loginLinkText}>{t('login')}</Text>
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
  signUpButton: {
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
  signUpButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 30,
  },
  loginText: {
    color: '#a8a8a8',
    fontSize: 14,
  },
  loginLinkText: {
    color: '#00d4ff',
    fontWeight: 'bold',
  },
});
