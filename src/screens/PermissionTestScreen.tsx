import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const PermissionTestScreen: React.FC = () => {
  const [cameraStatus, setCameraStatus] = useState<string>('Unknown');
  const [photoLibraryStatus, setPhotoLibraryStatus] = useState<string>('Unknown');

  const checkCameraPermission = async () => {
    try {
      const result = await check(PERMISSIONS.IOS.CAMERA);
      setCameraStatus(result);
      console.log('Camera permission status:', result);
    } catch (error) {
      console.error('Error checking camera permission:', error);
      Alert.alert('Error', 'Failed to check camera permission');
    }
  };

  const requestCameraPermission = async () => {
    try {
      const result = await request(PERMISSIONS.IOS.CAMERA);
      setCameraStatus(result);
      console.log('Camera permission request result:', result);
      
      if (result === RESULTS.GRANTED) {
        Alert.alert('Success', 'Camera permission granted!');
      } else if (result === RESULTS.BLOCKED) {
        Alert.alert('Blocked', 'Camera permission is blocked. Please enable it in Settings.');
      } else if (result === RESULTS.DENIED) {
        Alert.alert('Denied', 'Camera permission was denied.');
      }
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      Alert.alert('Error', 'Failed to request camera permission');
    }
  };

  const checkPhotoLibraryPermission = async () => {
    try {
      const result = await check(PERMISSIONS.IOS.PHOTO_LIBRARY);
      setPhotoLibraryStatus(result);
      console.log('Photo Library permission status:', result);
    } catch (error) {
      console.error('Error checking photo library permission:', error);
      Alert.alert('Error', 'Failed to check photo library permission');
    }
  };

  const requestPhotoLibraryPermission = async () => {
    try {
      const result = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
      setPhotoLibraryStatus(result);
      console.log('Photo Library permission request result:', result);
      
      if (result === RESULTS.GRANTED || result === RESULTS.LIMITED) {
        Alert.alert('Success', 'Photo Library permission granted!');
      } else if (result === RESULTS.BLOCKED) {
        Alert.alert('Blocked', 'Photo Library permission is blocked. Please enable it in Settings.');
      } else if (result === RESULTS.DENIED) {
        Alert.alert('Denied', 'Photo Library permission was denied.');
      }
    } catch (error) {
      console.error('Error requesting photo library permission:', error);
      Alert.alert('Error', 'Failed to request photo library permission');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case RESULTS.GRANTED:
      case RESULTS.LIMITED:
        return '#4CAF50';
      case RESULTS.DENIED:
        return '#FF9800';
      case RESULTS.BLOCKED:
        return '#F44336';
      case RESULTS.UNAVAILABLE:
        return '#9E9E9E';
      default:
        return '#2196F3';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Permission Test Screen</Text>
      
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera Permission</Text>
        <Text style={[styles.statusText, { color: getStatusColor(cameraStatus) }]}>
          Status: {cameraStatus}
        </Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={checkCameraPermission}>
            <Text style={styles.buttonText}>Check Camera</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.button, styles.requestButton]} onPress={requestCameraPermission}>
            <Text style={styles.buttonText}>Request Camera</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Photo Library Permission</Text>
        <Text style={[styles.statusText, { color: getStatusColor(photoLibraryStatus) }]}>
          Status: {photoLibraryStatus}
        </Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={checkPhotoLibraryPermission}>
            <Text style={styles.buttonText}>Check Photo Library</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.button, styles.requestButton]} onPress={requestPhotoLibraryPermission}>
            <Text style={styles.buttonText}>Request Photo Library</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Permission Status Guide:</Text>
        <Text style={styles.infoText}>• <Text style={{color: '#4CAF50'}}>GRANTED</Text>: Permission is granted</Text>
        <Text style={styles.infoText}>• <Text style={{color: '#4CAF50'}}>LIMITED</Text>: Limited access (iOS 14+)</Text>
        <Text style={styles.infoText}>• <Text style={{color: '#FF9800'}}>DENIED</Text>: Permission denied but requestable</Text>
        <Text style={styles.infoText}>• <Text style={{color: '#F44336'}}>BLOCKED</Text>: Permission blocked, go to Settings</Text>
        <Text style={styles.infoText}>• <Text style={{color: '#9E9E9E'}}>UNAVAILABLE</Text>: Feature not available</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  permissionContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  statusText: {
    fontSize: 16,
    marginBottom: 15,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    flex: 0.48,
  },
  requestButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginTop: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
});

export default PermissionTestScreen;
