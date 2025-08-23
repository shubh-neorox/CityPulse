// Simple test script to debug Ticketmaster API
const axios = require('axios');

const API_KEY = 'goGjC4obbARwEl3rwDH9TIAkVOozWMPb';
const BASE_URL = 'https://app.ticketmaster.com/discovery/v2';

async function testAPI() {
  console.log('🔍 Testing Ticketmaster API...');
  console.log('API Key:', API_KEY);
  console.log('Base URL:', BASE_URL);
  
  try {
    // Test 1: Basic events endpoint
    console.log('\n📡 Test 1: Basic events call');
    const response1 = await axios.get(`${BASE_URL}/events.json`, {
      params: {
        apikey: API_KEY,
        size: 1,
      },
    });
    console.log('  Success! Status:', response1.status);
    console.log('Response keys:', Object.keys(response1.data));
    
  } catch (error) {
    console.log('   Test 1 failed');
    console.log('Status:', error.response?.status);
    console.log('Error data:', error.response?.data);
    
    // Test 2: Try with different parameter format
    console.log('\n📡 Test 2: Different parameter format');
    try {
      const response2 = await axios.get(`${BASE_URL}/events`, {
        params: {
          apikey: API_KEY,
          size: 1,
        },
      });
      console.log('  Success! Status:', response2.status);
    } catch (error2) {
      console.log('   Test 2 also failed');
      console.log('Status:', error2.response?.status);
      console.log('Error data:', error2.response?.data);
      
      // Test 3: Check if the API key format is wrong
      console.log('\n📡 Test 3: Check API key format');
      console.log('API Key length:', API_KEY.length);
      console.log('API Key format valid:', /^[a-zA-Z0-9]+$/.test(API_KEY));
    }
  }
}

testAPI().catch(console.error);
