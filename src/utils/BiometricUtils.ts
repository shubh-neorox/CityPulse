import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Platform, NativeModules } from "react-native";
import ReactNativeBiometrics, { BiometryTypes } from "react-native-biometrics";

const rnBiometrics = new ReactNativeBiometrics();

// Get BiometricsModule if available (for Android)
const { BiometricsModule } = NativeModules;

export interface BiometryInfo {
  type: string | null; // "Face ID", "Touch ID", "Biometrics", or null if unavailable
  hasFaceRecognition: boolean;
  hasFingerprint: boolean;
}

export const checkBiometricType = async (): Promise<BiometryInfo> => {
  try {
    // For Android, use our custom native module if available
    if (Platform.OS === 'android' && BiometricsModule) {
      console.log("Using native BiometricsModule for Android");
      try {
        const result = await BiometricsModule.isBiometricAvailable();
        console.log("Native biometrics check result:", result);
        
        if (result.available) {
          return {
            type: result.biometryType || "Biometrics",
            hasFaceRecognition: result.hasFaceRecognition || false,
            hasFingerprint: result.hasFingerprint || false
          };
        } else {
          console.log("No biometric sensor available on Android:", result.error);
          return {
            type: null,
            hasFaceRecognition: false,
            hasFingerprint: false
          };
        }
      } catch (error) {
        console.error("Error using native BiometricsModule:", error);
        // Fall back to RNBiometrics if native module fails
        console.log("Falling back to ReactNativeBiometrics");
      }
    }

    // Default flow using ReactNativeBiometrics
    const { available, biometryType } = await rnBiometrics.isSensorAvailable();

    if (available) {
      switch (biometryType) {
        case BiometryTypes.FaceID:
          console.log("Face ID is available");
          return {
            type: "Face ID",
            hasFaceRecognition: true,
            hasFingerprint: false
          };
        case BiometryTypes.TouchID:
          console.log("Touch ID is available");
          return {
            type: "Touch ID",
            hasFaceRecognition: false,
            hasFingerprint: true
          };
        case BiometryTypes.Biometrics:
          console.log("Generic biometrics available");
          // On Android, we'll assume both might be available
          // This is just a fallback in case our native module fails
          if (Platform.OS === 'android') {
            return {
              type: "Biometrics",
              hasFaceRecognition: true, // Assuming modern Android might have face recognition
              hasFingerprint: true // Most Android devices with biometrics have fingerprint
            };
          }
          return {
            type: "Biometrics",
            hasFaceRecognition: false,
            hasFingerprint: true
          };
        default:
          console.log("Unknown biometric type");
          return {
            type: "Biometrics",
            hasFaceRecognition: false,
            hasFingerprint: true
          };
      }
    } else {
      console.log("No biometric sensor available");
      return {
        type: null,
        hasFaceRecognition: false,
        hasFingerprint: false
      };
    }
  } catch (error) {
    console.error("Error checking biometrics:", error);
    return {
      type: null,
      hasFaceRecognition: false,
      hasFingerprint: false
    };
  }
};

/**
 * Setup biometrics for the user and save preference in AsyncStorage.
 * @param {boolean} isEnabling - Whether to enable or disable biometrics
 * @param {string} biometricType - The type of biometric to enable ("face" or "fingerprint")
 */
export const setupBiometrics = async (isEnabling = true, biometricType = "both") => {
  try {
    const biometryInfo = await checkBiometricType();
    
    if (!biometryInfo.type) {
      Alert.alert(
        "Biometrics Unavailable",
        "Your device doesn't support biometric authentication or it's not set up in your device settings."
      );
      return false;
    }

    // Check if the requested biometric type is available
    if (biometricType === "face" && !biometryInfo.hasFaceRecognition) {
      Alert.alert(
        "Face Recognition Unavailable",
        "Your device doesn't support face recognition authentication."
      );
      return false;
    }

    if (biometricType === "fingerprint" && !biometryInfo.hasFingerprint) {
      Alert.alert(
        "Fingerprint Authentication Unavailable",
        "Your device doesn't support fingerprint authentication."
      );
      return false;
    }

    if (isEnabling) {
      // Get appropriate prompt message based on biometric type
      let promptMessage = "Enable biometrics for authentication";
      if (biometricType === "face") {
        promptMessage = Platform.OS === 'ios' ? "Enable Face ID for authentication" : "Enable Face Recognition for authentication";
      } else if (biometricType === "fingerprint") {
        promptMessage = Platform.OS === 'ios' ? "Enable Touch ID for authentication" : "Enable Fingerprint for authentication";
      }

      let success = false;
      
      // For Android, use our custom native module if available
      if (Platform.OS === 'android' && BiometricsModule) {
        try {
          console.log("Using native BiometricsModule for authentication");
          const result = await BiometricsModule.authenticate(
            promptMessage, 
            "Cancel"
          );
          success = result.success;
          console.log("Native authentication result:", result);
        } catch (error) {
          console.error("Error using Android native biometrics:", error);
          // Fall back to RNBiometrics if our module fails
          console.log("Falling back to ReactNativeBiometrics");
          const rnResult = await rnBiometrics.simplePrompt({
            promptMessage,
            cancelButtonText: "Cancel"
          });
          success = rnResult.success;
        }
      } 
      // For iOS, use standard RNBiometrics
      else {
        const { success: rnSuccess } = await rnBiometrics.simplePrompt({
          promptMessage,
          cancelButtonText: "Cancel"
        });
        success = rnSuccess;
      }

      if (success) {
        // Save the appropriate setting based on biometric type
        if (biometricType === "face" || biometricType === "both") {
          await AsyncStorage.setItem("useFaceID", "true");
        }
        
        if (biometricType === "fingerprint" || biometricType === "both") {
          await AsyncStorage.setItem("useFingerprint", "true");
        }
        
        // For backward compatibility, also set the general biometrics flag
        await AsyncStorage.setItem("useBiometrics", "true");
        
        // Return success without showing alerts - let the caller handle the UI feedback
        return true;
      } else {
        return false;
      }
    } else {
      // Disabling biometrics
      if (biometricType === "face" || biometricType === "both") {
        await AsyncStorage.setItem("useFaceID", "false");
      }
      
      if (biometricType === "fingerprint" || biometricType === "both") {
        await AsyncStorage.setItem("useFingerprint", "false");
      }
      
      // Check if both are disabled
      if (biometricType === "both" || 
          (biometricType === "face" && await AsyncStorage.getItem("useFingerprint") === "false") ||
          (biometricType === "fingerprint" && await AsyncStorage.getItem("useFaceID") === "false")) {
        await AsyncStorage.setItem("useBiometrics", "false");
      }
      
      // Return success without showing alerts - let the caller handle the UI feedback
      return true;
    }
  } catch (error) {
    console.error("Error setting up biometrics:", error);
    return false;
  }
};

/**
 * Validate biometrics during authentication.
 * @param {Function} setIsAuthenticated - Function to set authenticated state
 * @param {Boolean} isLoggingOut - Flag to indicate if user is logging out
 * @returns {Promise<Boolean>} - Returns true if biometric auth was successful
 */
export const validateBiometric = async (setIsAuthenticated?: (value: boolean) => void, isLoggingOut?: boolean) => {
  // Skip biometric authentication entirely if user is logging out
  if (isLoggingOut) {
    console.log("User is logging out - skipping biometric authentication completely");
    return false;
  }

  try {
    // For backward compatibility, check biometric_enabled
    const biometricEnabled = await AsyncStorage.getItem("biometric_enabled");
    
    // Check if any biometric auth is enabled
    const useBiometrics = await AsyncStorage.getItem("useBiometrics");
    const useFaceID = await AsyncStorage.getItem("useFaceID");
    const useFingerprint = await AsyncStorage.getItem("useFingerprint");
    
    // If no biometrics are enabled, exit early
    if (useBiometrics !== "true" && useFaceID !== "true" && useFingerprint !== "true" && biometricEnabled !== "true") {
      console.log("Biometric authentication is not enabled.");
      return false;
    }

    // Get biometric info to determine what's available on the device
    const biometryInfo = await checkBiometricType();
    console.log("Biometric info during validation:", biometryInfo);
    
    if (!biometryInfo.type) {
      console.log("Biometric sensor not available or biometric data not enrolled.");
      return false;
    }

    // Platform-specific biometric handling
    let promptMessage = "Authenticate to continue";
    let cancelButtonText = "Use Password";
    
    if (Platform.OS === 'ios') {
      // For iOS, prioritize Face ID first, then Touch ID
      if (biometryInfo.hasFaceRecognition) {
        promptMessage = "Use Face ID to access City Pulse";
        cancelButtonText = "Use Passcode";
      } else if (biometryInfo.hasFingerprint) {
        promptMessage = "Use Touch ID to access City Pulse";
        cancelButtonText = "Use Passcode";
      }
    } else {
      // For Android, prioritize fingerprint first
      if (biometryInfo.hasFingerprint) {
        promptMessage = "Use Fingerprint to access City Pulse";
        cancelButtonText = "Use PIN";
      } else if (biometryInfo.hasFaceRecognition) {
        promptMessage = "Use Face Recognition to access City Pulse";
        cancelButtonText = "Use PIN";
      }
    }
    
    console.log(`Platform: ${Platform.OS}, Prompt: ${promptMessage}`);

    // Create new instance with allowDeviceCredentials for fallback
    const rnBiometrics = new ReactNativeBiometrics({ 
      allowDeviceCredentials: true 
    });

    // For iOS, ensure we have the proper setup
    if (Platform.OS === 'ios') {
      try {
        // Check if keys exist, create them if they don't
        const { keysExist } = await rnBiometrics.biometricKeysExist();
        console.log("iOS biometric keys exist:", keysExist);
        
        if (!keysExist) {
          console.log("Creating biometric keys for iOS...");
          const keyResult = await rnBiometrics.createKeys();
          console.log("Biometric keys created:", keyResult);
          
          // Keys creation doesn't guarantee success, continue with simplePrompt regardless
        }
      } catch (keyError) {
        console.log("Key creation/check error, continuing with simplePrompt:", keyError);
      }
    }

    // Use simplePrompt for authentication
    const { success } = await rnBiometrics.simplePrompt({
      promptMessage,
      cancelButtonText
    });

    if (success) {
      console.log("Biometric authentication successful!");
      if (setIsAuthenticated) {
        setIsAuthenticated(true);
      }
      return true;
    }

    console.log("Biometric authentication failed or was cancelled.");
    return false;
  } catch (error: any) {
    // Handle specific error cases
    if (error?.message === "UserCancel" || error?.message === "user_cancelled" || 
        error?.message === "User cancellation" || error?.message === "User cancelled") {
      console.log("Biometric authentication canceled by user.");
      return false;
    }
    
    if (error?.message === "UserFallback") {
      console.log("User selected fallback option.");
      return false;
    }
    
    if (error?.message && error.message.includes("lockout")) {
      Alert.alert(
        "Too Many Attempts",
        "Too many failed biometric attempts. Please use your PIN instead."
      );
      return false;
    }

    console.error("Error during biometric validation:", error);
    return false;
  }
};
