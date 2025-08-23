// Test script to try different Ticketmaster API authentication methods
const axios = require('axios');

const CONSUMER_KEY = 'goGjC4obbARwEl3rwDH9TIAkVOozWMPb';
const CONSUMER_SECRET = 'ozGS6GEcS0BnK76u';
const BASE_URL = 'https://app.ticketmaster.com/discovery/v2';

async function testDifferentAuthMethods() {
  console.log('🔍 Testing different Ticketmaster API authentication methods...');
  
  // Method 1: Only Consumer Key (current approach)
  console.log('\n📡 Method 1: Consumer Key only');
  try {
    const response1 = await axios.get(`${BASE_URL}/events.json`, {
      params: {
        apikey: CONSUMER_KEY,
        size: 1,
      },
    });
    console.log('  Method 1 Success! Status:', response1.status);
    return;
  } catch (error) {
    console.log('   Method 1 failed:', error.response?.status, error.response?.data?.fault?.faultstring);
  }
  
  // Method 2: Basic Auth with Consumer Key and Secret
  console.log('\n📡 Method 2: Basic Authentication');
  try {
    const response2 = await axios.get(`${BASE_URL}/events.json`, {
      auth: {
        username: CONSUMER_KEY,
        password: CONSUMER_SECRET,
      },
      params: {
        size: 1,
      },
    });
    console.log('  Method 2 Success! Status:', response2.status);
    return;
  } catch (error) {
    console.log('   Method 2 failed:', error.response?.status, error.response?.data?.fault?.faultstring);
  }
  
  // Method 3: Both in params
  console.log('\n📡 Method 3: Both credentials in params');
  try {
    const response3 = await axios.get(`${BASE_URL}/events.json`, {
      params: {
        apikey: CONSUMER_KEY,
        secret: CONSUMER_SECRET,
        size: 1,
      },
    });
    console.log('  Method 3 Success! Status:', response3.status);
    return;
  } catch (error) {
    console.log('   Method 3 failed:', error.response?.status, error.response?.data?.fault?.faultstring);
  }
  
  // Method 4: Authorization header
  console.log('\n📡 Method 4: Authorization header');
  try {
    const token = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
    const response4 = await axios.get(`${BASE_URL}/events.json`, {
      headers: {
        'Authorization': `Basic ${token}`,
      },
      params: {
        size: 1,
      },
    });
    console.log('  Method 4 Success! Status:', response4.status);
    return;
  } catch (error) {
    console.log('   Method 4 failed:', error.response?.status, error.response?.data?.fault?.faultstring);
  }
  
  // Method 5: Try older API version
  console.log('\n📡 Method 5: Older API version');
  try {
    const response5 = await axios.get('https://app.ticketmaster.com/discovery/v1/events.json', {
      params: {
        apikey: CONSUMER_KEY,
        size: 1,
      },
    });
    console.log('  Method 5 Success! Status:', response5.status);
    return;
  } catch (error) {
    console.log('   Method 5 failed:', error.response?.status, error.response?.data?.fault?.faultstring);
  }

  console.log('\n   All authentication methods failed. The API credentials may need activation.');
}

testDifferentAuthMethods().catch(console.error);
