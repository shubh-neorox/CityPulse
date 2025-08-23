// Quick test with the corrected API key
const axios = require('axios');

const CORRECT_API_KEY = 'goGjC4obbARwEI3rwDH9TiAkVOozWMPb';
const BASE_URL = 'https://app.ticketmaster.com/discovery/v2';

async function testCorrectedKey() {
  console.log('🔍 Testing corrected API key...');
  console.log('API Key:', CORRECT_API_KEY);
  
  try {
    const response = await axios.get(`${BASE_URL}/events.json`, {
      params: {
        apikey: CORRECT_API_KEY,
        keyword: 'concert',
        size: 5,
      },
    });
    
    console.log('  SUCCESS! Status:', response.status);
    console.log('📊 Total events found:', response.data._embedded?.events?.length || 0);
    console.log('📄 First event:', response.data._embedded?.events?.[0]?.name || 'No events');
    console.log('🎯 API is working perfectly!');
    
  } catch (error) {
    console.log('   Still failed:', error.response?.status, error.response?.data?.fault?.faultstring);
  }
}

testCorrectedKey().catch(console.error);
