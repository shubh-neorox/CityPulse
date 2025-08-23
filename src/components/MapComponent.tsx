import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Linking, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { testGoogleMapsAPI, getStaticMapUrl, openInMaps } from '../utils/MapUtils';

interface MapComponentProps {
  latitude: number;
  longitude: number;
  title: string;
  description: string;
}

export default function MapComponent({ latitude, longitude, title, description }: MapComponentProps) {
  const [mapError, setMapError] = useState(false);
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null);
  const [mapReady, setMapReady] = useState(false);



  const handleOpenMaps = () => {
    const url = openInMaps(latitude, longitude, title);
    Linking.openURL(url);
  };

  const handleMapError = (error: any) => {
    console.log('MapView Error:', error);
    setMapError(true);
    Alert.alert(
      'Map Error',
      'Unable to load the map. You can still open the location in your maps app.',
      [{ text: 'OK' }]
    );
  };

  // Show static map fallback if native map fails
  if (mapError || apiKeyValid === false) {
    const staticMapUrl = getStaticMapUrl(latitude, longitude, title);
    
    return (
      <View style={styles.container}>
        <Text style={styles.title}>📍 Location</Text>
        <View style={styles.mapContainer}>
          <Image 
            source={{ uri: staticMapUrl }}
            style={styles.staticMap}
            onError={(error) => {
              console.log('Static map error:', error);
              // If static map also fails, show basic info
            }}
          />
          <View style={styles.overlay}>
            <Text style={styles.overlayText}>{title}</Text>
            <Text style={styles.overlaySubtext}>{description}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.openMapButton} onPress={handleOpenMaps}>
          <Text style={styles.openMapText}>🗺️ Open in Google Maps</Text>
        </TouchableOpacity>
        {apiKeyValid === false && (
          <Text style={styles.errorText}>Map API key needs configuration</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📍 Location</Text>
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          onMapReady={() => {
            console.log('Map is ready');
            setMapReady(true);
          }}
          showsUserLocation={false}
          showsMyLocationButton={false}
          loadingEnabled={true}
          loadingIndicatorColor="#00d4ff"
          loadingBackgroundColor="#1a1f3a"
        >
          <Marker
            coordinate={{ latitude, longitude }}
            title={title}
            description={description}
            pinColor="red"
          />
        </MapView>
        {!mapReady && (
          <View style={styles.loadingOverlay}>
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        )}
      </View>
      <TouchableOpacity style={styles.openMapButton} onPress={handleOpenMaps}>
        <Text style={styles.openMapText}>🗺️ Open in Google Maps</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  mapContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1f3a',
  },
  map: {
    width: '100%',
    height: 200,
  },
  staticMap: {
    width: '100%',
    height: 200,
    backgroundColor: '#1a1f3a',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26, 31, 58, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#00d4ff',
    fontSize: 14,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
  },
  overlayText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  overlaySubtext: {
    color: '#a8a8a8',
    fontSize: 12,
    marginTop: 2,
  },
  openMapButton: {
    backgroundColor: '#00d4ff',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    alignSelf: 'center',
  },
  openMapText: {
    color: '#0a0e27',
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
});
