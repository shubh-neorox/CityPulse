import axios from 'axios';

const TICKETMASTER_CONSUMER_KEY = 'goGjC4obbARwEI3rwDH9TiAkVOozWMPb';
const TICKETMASTER_CONSUMER_SECRET = 'ozGS6GEcS0BnK76u';
const BASE_URL = 'https://app.ticketmaster.com/discovery/v2';

export interface Event {
  id: string;
  name: string;
  url: string;
  info?: string;
  dates: {
    start: {
      localDate?: string;
      localTime?: string;
    };
  };
  images: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  _embedded?: {
    venues?: Array<{
      name: string;
      city: {
        name: string;
      };
      address?: {
        line1: string;
      };
      location?: {
        latitude: string;
        longitude: string;
      };
    }>;
  };
  priceRanges?: Array<{
    type: string;
    currency: string;
    min: number;
    max: number;
  }>;
}

class TicketmasterAPI {
  private consumerKey: string;
  private consumerSecret: string;
  private lastRequestTime: number = 0;
  private requestQueue: Array<() => void> = [];
  private isProcessingQueue: boolean = false;

  constructor() {
    this.consumerKey = TICKETMASTER_CONSUMER_KEY;
    this.consumerSecret = TICKETMASTER_CONSUMER_SECRET;
  }

  // Rate limiting method - ensures we don't exceed 5 requests per second
  private async throttleRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          // Ensure at least 250ms between requests (4 requests per second to be safe)
          const now = Date.now();
          const timeSinceLastRequest = now - this.lastRequestTime;
          const minInterval = 250; // 250ms = 4 requests per second (under the 5/sec limit)
          
          if (timeSinceLastRequest < minInterval) {
            const delayTime = minInterval - timeSinceLastRequest;
            console.log(`⏱️ Rate limiting: waiting ${delayTime}ms before next request`);
            await new Promise<void>(resolve => setTimeout(resolve, delayTime));
          }
          
          this.lastRequestTime = Date.now();
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }
    
    this.isProcessingQueue = true;
    
    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        await request();
      }
    }
    
    this.isProcessingQueue = false;
  }

  async searchEvents(keyword: string, city: string, page: number = 0) {
    return this.throttleRequest(async () => {
      try {
        const params: any = {
          apikey: this.consumerKey,
          size: 20,
          page,
        };

        // Add keyword parameter
        if (keyword && keyword.trim()) {
          params.keyword = keyword.trim();
        }

        // Add city parameter - Ticketmaster API uses specific field names
        if (city && city.trim()) {
          // The correct parameter name for Ticketmaster API is 'city'
          // But we should also handle state codes for US cities
          const cityTrimmed = city.trim();
          if (cityTrimmed.toLowerCase() === 'mumbai') {
            // Mumbai is in India, but Ticketmaster primarily covers US/Canada/UK events
            params.city = 'Mumbai';
            params.countryCode = 'IN';
          } else {
            params.city = cityTrimmed;
          }
        }

        // Add classification for better results (comedy, music, sports, etc.)
        if (keyword && keyword.trim()) {
          const keywordLower = keyword.toLowerCase();
          if (keywordLower.includes('comedy')) {
            params.classificationName = 'Comedy';
          } else if (keywordLower.includes('music') || keywordLower.includes('concert')) {
            params.classificationName = 'Music';
          } else if (keywordLower.includes('sport')) {
            params.classificationName = 'Sports';
          } else if (keywordLower.includes('theater') || keywordLower.includes('theatre')) {
            params.classificationName = 'Arts & Theatre';
          }
        }

        console.log('API Request params:', params);
        console.log('API URL:', `${BASE_URL}/events.json`);

        const response = await axios.get(`${BASE_URL}/events.json`, { 
          params,
          timeout: 15000, // Increased timeout
        });
        
        console.log('API Response status:', response.status);
        console.log('API Response data keys:', Object.keys(response.data));
        console.log('Events found:', response.data._embedded?.events?.length || 0);
        
        if (response.data._embedded?.events) {
          console.log('Sample event:', response.data._embedded.events[0]?.name);
        } else {
          console.log('No events in response');
        }
        
        return {
          success: true,
          data: response.data._embedded?.events || [],
          totalPages: response.data.page?.totalPages || 0,
          currentPage: response.data.page?.number || 0,
          totalElements: response.data.page?.totalElements || 0,
        };
      } catch (error: any) {
        console.error('Ticketmaster API Error:', error);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
        
        // Check if it's a rate limit error
        if (error.response?.data?.fault?.faultstring?.includes('rate') || 
            error.response?.data?.fault?.faultstring?.includes('Rate')) {
          console.log('🚦 Rate limit hit - will retry with longer delay');
          // Wait a bit longer and retry once
          await new Promise<void>(resolve => setTimeout(resolve, 2000));
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        }
        
        return {
          success: false,
          error: error.response?.data?.fault?.faultstring || error.message || 'Failed to fetch events',
          data: [],
          totalPages: 0,
          currentPage: 0,
        };
      }
    });
  }

  async getEventDetails(eventId: string) {
    return this.throttleRequest(async () => {
      try {
        console.log('Fetching event details for ID:', eventId);
        console.log('Consumer Key being used:', this.consumerKey?.substring(0, 10) + '...');
        
        const response = await axios.get(`${BASE_URL}/events/${eventId}.json`, {
          params: { apikey: this.consumerKey },
          timeout: 10000,
        });

        console.log('Event details response status:', response.status);

        return {
          success: true,
          data: response.data,
        };
      } catch (error: any) {
        console.error('Ticketmaster API Error:', error);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
        
        return {
          success: false,
          error: error.response?.data?.fault?.faultstring || error.message || 'Failed to fetch event details',
        };
      }
    });
  }

  getImageUrl(event: Event, width: number = 640) {
    const images = event.images || [];
    const image = images.find(img => img.width >= width) || images[0];
    return image?.url || '';
  }

  getVenueInfo(event: Event) {
    const venue = event._embedded?.venues?.[0];
    if (!venue) return null;

    return {
      name: venue.name,
      city: venue.city?.name,
      address: venue.address?.line1,
      location: venue.location ? {
        latitude: parseFloat(venue.location.latitude),
        longitude: parseFloat(venue.location.longitude),
      } : null,
    };
  }

  getPriceRange(event: Event) {
    const priceRange = event.priceRanges?.[0];
    if (!priceRange) return null;

    return {
      min: priceRange.min,
      max: priceRange.max,
      currency: priceRange.currency,
    };
  }

  // Test method to verify API key
  async testAPIKey() {
    return this.throttleRequest(async () => {
      try {
        console.log('Testing API credentials...');
        console.log('Consumer Key:', this.consumerKey?.substring(0, 10) + '...');
        
        const response = await axios.get(`${BASE_URL}/events.json`, {
          params: { 
            apikey: this.consumerKey,
            size: 1,
          },
          timeout: 10000,
        });
        
        console.log('API credentials test successful! Status:', response.status);
        return { success: true, status: response.status };
      } catch (error: any) {
        console.error('API credentials test failed:', error.response?.status, error.response?.data);
        
        return { 
          success: false, 
          status: error.response?.status,
          error: error.response?.data,
        };
      }
    });
  }
}

export default new TicketmasterAPI();
