import { Platform, Alert, Linking } from 'react-native';
import { check, request, PERMISSIONS, RESULTS, Permission } from 'react-native-permissions';

export class PermissionManager {
  
  /**
   * Check and request camera permission
   */
  static async requestCameraPermission(): Promise<boolean> {
    try {
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.CAMERA 
        : PERMISSIONS.ANDROID.CAMERA;

      const result = await check(permission);
      
      switch (result) {
        case RESULTS.GRANTED:
          return true;
        
        case RESULTS.DENIED:
          const requestResult = await request(permission);
          return requestResult === RESULTS.GRANTED;
        
        case RESULTS.BLOCKED:
          this.showPermissionBlockedAlert('Camera');
          return false;
        
        default:
          return false;
      }
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return false;
    }
  }

  /**
   * Check and request photo library permission
   */
  static async requestPhotoLibraryPermission(): Promise<boolean> {
    try {
      let permission: Permission;
      
      if (Platform.OS === 'ios') {
        permission = PERMISSIONS.IOS.PHOTO_LIBRARY;
      } else {
        // For Android 13+ use READ_MEDIA_IMAGES, for older versions use READ_EXTERNAL_STORAGE
        if (typeof Platform.Version === 'number' && Platform.Version >= 33) {
          permission = PERMISSIONS.ANDROID.READ_MEDIA_IMAGES;
        } else {
          permission = PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
        }
      }

      const result = await check(permission);
      
      switch (result) {
        case RESULTS.GRANTED:
          return true;
        
        case RESULTS.DENIED:
          const requestResult = await request(permission);
          return requestResult === RESULTS.GRANTED;
        
        case RESULTS.BLOCKED:
          this.showPermissionBlockedAlert('Photo Library');
          return false;
        
        default:
          return false;
      }
    } catch (error) {
      console.error('Error requesting photo library permission:', error);
      return false;
    }
  }

  /**
   * Request both camera and photo library permissions
   */
  static async requestImagePickerPermissions(): Promise<{ camera: boolean; photoLibrary: boolean }> {
    const [cameraGranted, photoLibraryGranted] = await Promise.all([
      this.requestCameraPermission(),
      this.requestPhotoLibraryPermission()
    ]);

    return {
      camera: cameraGranted,
      photoLibrary: photoLibraryGranted
    };
  }

  /**
   * Check if camera permission is granted
   */
  static async isCameraPermissionGranted(): Promise<boolean> {
    try {
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.CAMERA 
        : PERMISSIONS.ANDROID.CAMERA;

      const result = await check(permission);
      return result === RESULTS.GRANTED;
    } catch (error) {
      console.error('Error checking camera permission:', error);
      return false;
    }
  }

  /**
   * Check if photo library permission is granted
   */
  static async isPhotoLibraryPermissionGranted(): Promise<boolean> {
    try {
      let permission: Permission;
      
      if (Platform.OS === 'ios') {
        permission = PERMISSIONS.IOS.PHOTO_LIBRARY;
      } else {
        if (typeof Platform.Version === 'number' && Platform.Version >= 33) {
          permission = PERMISSIONS.ANDROID.READ_MEDIA_IMAGES;
        } else {
          permission = PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
        }
      }

      const result = await check(permission);
      return result === RESULTS.GRANTED;
    } catch (error) {
      console.error('Error checking photo library permission:', error);
      return false;
    }
  }

  /**
   * Show alert when permission is blocked/denied permanently
   */
  private static showPermissionBlockedAlert(permissionType: string) {
    Alert.alert(
      `${permissionType} Permission Required`,
      `Please enable ${permissionType} access in your device settings to use this feature.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Settings', 
          onPress: () => Linking.openSettings() 
        }
      ]
    );
  }

  /**
   * Show permission rationale before requesting
   */
  static showPermissionRationale(permissionType: 'camera' | 'photoLibrary', onAccept: () => void) {
    const message = permissionType === 'camera' 
      ? 'This app needs camera access to take profile pictures.'
      : 'This app needs photo library access to select profile pictures.';

    Alert.alert(
      'Permission Required',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Allow', onPress: onAccept }
      ]
    );
  }

  /**
   * Handle permission for camera with user-friendly flow
   */
  static async handleCameraPermission(): Promise<boolean> {
    const isGranted = await this.isCameraPermissionGranted();
    
    if (isGranted) {
      return true;
    }

    return new Promise((resolve) => {
      this.showPermissionRationale('camera', async () => {
        const granted = await this.requestCameraPermission();
        resolve(granted);
      });
    });
  }

  /**
   * Handle permission for photo library with user-friendly flow
   */
  static async handlePhotoLibraryPermission(): Promise<boolean> {
    const isGranted = await this.isPhotoLibraryPermissionGranted();
    
    if (isGranted) {
      return true;
    }

    return new Promise((resolve) => {
      this.showPermissionRationale('photoLibrary', async () => {
        const granted = await this.requestPhotoLibraryPermission();
        resolve(granted);
      });
    });
  }
}

export default PermissionManager;
