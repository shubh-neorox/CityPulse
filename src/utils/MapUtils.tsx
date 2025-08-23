import { Alert } from 'react-native';

// Test Google Maps API key validity
export const testGoogleMapsAPI = async (apiKey: string): Promise<boolean> => {
  try {
    // Test the API key with a simple geocoding request
    const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=New+York&key=${apiKey}`;
    
    const response = await fetch(testUrl);
    const data = await response.json();
    
    if (data.status === 'OK') {
      console.log('  Google Maps API key is valid and working');
      return true;
    } else if (data.status === 'REQUEST_DENIED') {
      console.log('   Google Maps API key is invalid or restricted');
      Alert.alert(
        'Maps Error',
        'Google Maps API key is invalid or restricted. Maps may not work properly.',
        [{ text: 'OK' }]
      );
      return false;
    } else {
      console.log('⚠️ Google Maps API issue:', data.status, data.error_message);
      return false;
    }
  } catch (error) {
    console.log('   Error testing Google Maps API:', error);
    return false;
  }
};

// Get static map URL as fallback
export const getStaticMapUrl = (lat: number, lon: number, title: string): string => {
  const zoom = 15;
  const size = '400x300';
  const apiKey = 'AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3lLao';
  
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lon}&zoom=${zoom}&size=${size}&markers=color:red%7Clabel:📍%7C${lat},${lon}&key=${apiKey}`;
};

// Open location in external maps app
export const openInMaps = (lat: number, lon: number, title?: string) => {
  const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
  return url;
};
