import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import MapView, { Marker } from 'react-native-maps';
import { useTranslation } from '../hooks/useTranslation';
import TicketmasterAPI, { Event } from '../logic/TicketmasterAPI';
import LocalStorageManager from '../logic/LocalStorageManager';
import { testGoogleMapsAPI } from '../utils/MapUtils';

const { width } = Dimensions.get('window');

export default function EventDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [isFavorite, setIsFavorite] = useState(false);
  
  const event = (route.params as any)?.event as Event;



  const checkFavoriteStatus = async () => {
    const favoriteStatus = await LocalStorageManager.isEventFavorite(event.id);
    setIsFavorite(favoriteStatus);
  };

  const toggleFavorite = async () => {
    if (isFavorite) {
      await LocalStorageManager.removeFavoriteEvent(event.id);
      setIsFavorite(false);
    } else {
      await LocalStorageManager.saveFavoriteEvent(event);
      setIsFavorite(true);
    }
  };

  const openEventUrl = () => {
    if (event.url) {
      Linking.openURL(event.url);
    }
  };

  const imageUrl = TicketmasterAPI.getImageUrl(event, 800);
  const venue = TicketmasterAPI.getVenueInfo(event);
  const priceRange = TicketmasterAPI.getPriceRange(event);

  if (!event) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0e27" translucent />
        <Text style={styles.errorText}>Event not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0e27" translucent />
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.eventImage} />
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.favoriteButton}
            onPress={toggleFavorite}
          >
            <Text style={styles.favoriteIcon}>
              {isFavorite ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.eventTitle}>{event.name}</Text>
          
          {venue && (
            <View style={styles.venueContainer}>
              <Text style={styles.venueTitle}>📍 {t('venue')}</Text>
              <Text style={styles.venueText}>{venue.name}</Text>
              <Text style={styles.venueAddress}>{venue.address}, {venue.city}</Text>
            </View>
          )}

          <View style={styles.detailsContainer}>
            {event.dates.start.localDate && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>📅 {t('date')}</Text>
                <Text style={styles.detailValue}>{event.dates.start.localDate}</Text>
              </View>
            )}

            {event.dates.start.localTime && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>🕐 {t('time')}</Text>
                <Text style={styles.detailValue}>{event.dates.start.localTime}</Text>
              </View>
            )}

            {priceRange && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>💰 {t('price')}</Text>
                <Text style={styles.detailValue}>
                  ${priceRange.min} - ${priceRange.max} {priceRange.currency}
                </Text>
              </View>
            )}
          </View>

          {event.info && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionTitle}>{t('description')}</Text>
              <Text style={styles.descriptionText}>{event.info}</Text>
            </View>
          )}

          {venue?.location ? (
            <View style={styles.mapContainer}>
              <Text style={styles.mapTitle}>📍 Location</Text>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: venue.location.latitude,
                  longitude: venue.location.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                showsUserLocation={true}
                showsMyLocationButton={true}
                onMapReady={() => {
                  console.log('Map loaded successfully with API key');
                }}
              >
                <Marker
                  coordinate={{
                    latitude: venue.location.latitude,
                    longitude: venue.location.longitude,
                  }}
                  title={venue.name}
                  description={`${venue.address}, ${venue.city}`}
                />
              </MapView>
              <TouchableOpacity 
                style={styles.openMapButton}
                onPress={() => {
                  if (venue?.location) {
                    const url = `https://www.google.com/maps/search/?api=1&query=${venue.location.latitude},${venue.location.longitude}`;
                    Linking.openURL(url);
                  }
                }}
              >
                <Text style={styles.openMapText}>🗺️ Open in Google Maps</Text>
              </TouchableOpacity>
            </View>
          ) : venue ? (
            <View style={styles.mapContainer}>
              <Text style={styles.mapTitle}>📍 Location</Text>
              <View style={styles.mapPlaceholder}>
                <Text style={styles.mapPlaceholderText}>
                  {`${venue.name}\n${venue.address}, ${venue.city}`}
                </Text>
                <TouchableOpacity 
                  style={styles.searchLocationButton}
                  onPress={() => {
                    const query = encodeURIComponent(`${venue.name} ${venue.address} ${venue.city}`);
                    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
                    Linking.openURL(url);
                  }}
                >
                  <Text style={styles.searchLocationText}>� Search Location</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          <TouchableOpacity 
            style={styles.ticketsButton}
            onPress={openEventUrl}
          >
            <Text style={styles.ticketsButtonText}>🎫 Buy Tickets</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
  },
  imageContainer: {
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#1a1f3a',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#ffffff',
  },
  favoriteButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIcon: {
    fontSize: 24,
  },
  contentContainer: {
    padding: 20,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
    lineHeight: 32,
  },
  venueContainer: {
    backgroundColor: '#1a1f3a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  venueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00d4ff',
    marginBottom: 8,
  },
  venueText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  venueAddress: {
    fontSize: 14,
    color: '#a8a8a8',
  },
  detailsContainer: {
    backgroundColor: '#1a1f3a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2f4a',
  },
  detailLabel: {
    fontSize: 16,
    color: '#a8a8a8',
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
    textAlign: 'right',
  },
  descriptionContainer: {
    backgroundColor: '#1a1f3a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00d4ff',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 24,
  },
  mapContainer: {
    marginBottom: 20,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00d4ff',
    marginBottom: 12,
  },
  map: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  mapPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#1a1f3a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2f4a',
  },
  mapPlaceholderText: {
    color: '#a8a8a8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
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
  searchLocationButton: {
    backgroundColor: '#4ade80',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  searchLocationText: {
    color: '#0a0e27',
    fontSize: 11,
    fontWeight: '600',
  },
  ticketsButton: {
    backgroundColor: '#00d4ff',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  ticketsButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  errorText: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 50,
  },
});
