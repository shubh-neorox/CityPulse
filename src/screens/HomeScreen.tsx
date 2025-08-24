import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from '../hooks/useTranslation';
import TicketmasterAPI, { Event } from '../logic/TicketmasterAPI';
import LocalStorageManager from '../logic/LocalStorageManager';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { t, isRTL, setLanguage, currentLanguage } = useTranslation();
  const insets = useSafeAreaInsets();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Animation refs for header hide/show
  const headerHeight = 180 + insets.top; // Include safe area top
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const lastScrollY = useRef(0);
  const scrollDirection = useRef<'up' | 'down'>('down');

  useEffect(() => {
    loadFavorites();
    searchEvents();
  }, []);



  const loadFavorites = async () => {
    const favoriteEvents = await LocalStorageManager.getFavoriteEvents();
    setFavorites(favoriteEvents.map(event => event.id));
  };

  const searchEvents = async () => {
    setLoading(true);
    try {
      console.log('Searching for events with:', { keyword: searchKeyword, city: searchCity });
      const result = await TicketmasterAPI.searchEvents(searchKeyword || 'concert', searchCity || 'New York');
      console.log('Search result:', result);
      
      if (result.success) {
        console.log('Found events:', result.data.length);
        setEvents(result.data);
        if (result.data.length === 0) {
          const cityName = searchCity || 'New York';
          const keyword = searchKeyword || 'concert';
          
          let message = `No events found for "${keyword}" in "${cityName}".`;
          
          // Special message for cities that might not be covered
          if (cityName.toLowerCase().includes('mumbai') || 
              cityName.toLowerCase().includes('delhi') || 
              cityName.toLowerCase().includes('bangalore') ||
              cityName.toLowerCase().includes('kolkata')) {
            message += '\n\nNote: Ticketmaster primarily covers events in the US, Canada, and select European countries. Try searching for cities like New York, Los Angeles, London, or Toronto.';
          } else {
            message += '\n\nTry different keywords or check the spelling of the city name.';
          }
          
          Alert.alert('No Results', message);
        }
      } else {
        console.error('Search failed:', result.error);
        Alert.alert('Error', result.error || 'Failed to fetch events');
        setEvents([]); // Set empty array on error
      }
    } catch (error) {
      console.error('Search exception:', error);
      Alert.alert('Error', 'Failed to fetch events');
      setEvents([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await searchEvents();
    setRefreshing(false);
  };

  const toggleFavorite = async (event: Event) => {
    const isFavorite = favorites.includes(event.id);
    if (isFavorite) {
      await LocalStorageManager.removeFavoriteEvent(event.id);
      setFavorites(favorites.filter(id => id !== event.id));
    } else {
      await LocalStorageManager.saveFavoriteEvent(event);
      setFavorites([...favorites, event.id]);
    }
  };

  const toggleLanguage = () => {
    const newLanguage = currentLanguage === 'en' ? 'ar' : 'en';
    setLanguage(newLanguage);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollDiff = currentScrollY - lastScrollY.current;
    
    // Only trigger animation if scroll difference is significant (avoid jitter)
    if (Math.abs(scrollDiff) > 5) {
      if (scrollDiff > 0 && currentScrollY > 50) {
        // Scrolling down and past threshold - hide header
        if (scrollDirection.current !== 'up') {
          scrollDirection.current = 'up';
          Animated.parallel([
            Animated.timing(headerTranslateY, {
              toValue: -headerHeight,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(headerOpacity, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }),
          ]).start();
        }
      } else if (scrollDiff < 0) {
        // Scrolling up - show header
        if (scrollDirection.current !== 'down') {
          scrollDirection.current = 'down';
          Animated.parallel([
            Animated.timing(headerTranslateY, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(headerOpacity, {
              toValue: 1,
              duration: 250,
              useNativeDriver: true,
            }),
          ]).start();
        }
      }
    }
    
    lastScrollY.current = currentScrollY;
  };

  const renderEventCard = ({ item }: { item: Event }) => {
    const imageUrl = TicketmasterAPI.getImageUrl(item);
    const venue = TicketmasterAPI.getVenueInfo(item);
    const priceRange = TicketmasterAPI.getPriceRange(item);
    const isFavorite = favorites.includes(item.id);

    return (
      <TouchableOpacity 
        style={styles.eventCard}
        onPress={() => (navigation as any).navigate('EventDetails', { event: item })}
      >
        <Image source={{ uri: imageUrl }} style={styles.eventImage} />
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(item)}
        >
          <Text style={styles.favoriteIcon}>
            {isFavorite ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle} numberOfLines={2}>{item.name}</Text>
          {venue && (
            <Text style={styles.eventVenue} numberOfLines={1}>
              📍 {venue.name}, {venue.city}
            </Text>
          )}
          {item.dates.start.localDate && (
            <Text style={styles.eventDate}>
              📅 {item.dates.start.localDate}
              {item.dates.start.localTime && ` • ${item.dates.start.localTime}`}
            </Text>
          )}
          {priceRange && (
            <Text style={styles.eventPrice}>
              💰 ${priceRange.min} - ${priceRange.max} {priceRange.currency}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0e27" translucent />
      
      <Animated.View 
        style={[
          styles.header, 
          {
            paddingTop: insets.top + 10,
            transform: [{ translateY: headerTranslateY }],
            opacity: headerOpacity,
          }
        ]}
      >
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>City Pulse</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.languageButton}
              onPress={toggleLanguage}
            >
              <Text style={styles.languageText}>
                {currentLanguage === 'en' ? '🇸🇦' : '🇺🇸'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => navigation.navigate('Profile' as never)}
            >
              <Text style={styles.profileIcon}>👤</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={[styles.searchInput, isRTL && styles.inputRTL]}
            placeholder={t('searchPlaceholder')}
            placeholderTextColor="#666"
            value={searchKeyword}
            onChangeText={setSearchKeyword}
            textAlign={isRTL ? 'right' : 'left'}
          />
          <TextInput
            style={[styles.searchInput, styles.cityInput, isRTL && styles.inputRTL]}
            placeholder={t('cityPlaceholder')}
            placeholderTextColor="#666"
            value={searchCity}
            onChangeText={setSearchCity}
            textAlign={isRTL ? 'right' : 'left'}
          />
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={searchEvents}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.searchButtonText}>🔍</Text>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      <FlatList
        data={events}
        renderItem={renderEventCard}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={[
          styles.listContainer, 
          { 
            paddingTop: headerHeight + 20,
            paddingBottom: insets.bottom + 20,
          }
        ]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading ? 'Loading events...' : 'No events found. Try searching!'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0a0e27',
    paddingHorizontal: 20,
    paddingBottom: 10,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageButton: {
    marginRight: 15,
    padding: 8,
  },
  languageText: {
    fontSize: 20,
  },
  profileButton: {
    backgroundColor: '#16213e',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00d4ff',
  },
  profileIcon: {
    fontSize: 18,
    color: '#00d4ff',
  },
  searchContainer: {
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: '#1a1f3a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#2a2f4a',
    marginBottom: 10,
  },
  cityInput: {
    marginBottom: 15,
  },
  inputRTL: {
    textAlign: 'right',
  },
  searchButton: {
    backgroundColor: '#00d4ff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  searchButtonText: {
    fontSize: 18,
  },
  listContainer: {
    padding: 20,
    paddingTop: 0,
  },
  eventCard: {
    backgroundColor: '#1a1f3a',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#2a2f4a',
  },
  favoriteButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIcon: {
    fontSize: 20,
  },
  eventInfo: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  eventVenue: {
    fontSize: 14,
    color: '#00d4ff',
    marginBottom: 6,
  },
  eventDate: {
    fontSize: 14,
    color: '#a8a8a8',
    marginBottom: 6,
  },
  eventPrice: {
    fontSize: 14,
    color: '#4ade80',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#a8a8a8',
    textAlign: 'center',
  },
});
