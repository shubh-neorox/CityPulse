import FirebaseManager from '../logic/FirebaseManager';

export const debugFirebaseSetup = async () => {
  console.log('=== FIREBASE DEBUG START ===');
  
  try {
    // Test 1: Check if user is authenticated
    const user = FirebaseManager.getCurrentUser();
    console.log('User authenticated:', !!user);
    console.log('User UID:', user?.uid);
    console.log('User email:', user?.email);
    
    if (!user) {
      console.log('❌ No user authenticated');
      return;
    }
    
    // Test 2: Test Firestore connection
    console.log('Testing Firestore...');
    const firestoreResult = await FirebaseManager.testFirebaseConnection();
    console.log('Firestore test result:', firestoreResult);
    
    // Test 3: Test Storage connection
    console.log('Testing Storage...');
    const storageResult = await FirebaseManager.testStorageConnection();
    console.log('Storage test result:', storageResult);
    
    // Test 4: Try to get user profile
    console.log('Testing user profile access...');
    const profileResult = await FirebaseManager.getUserProfile();
    console.log('Profile test result:', profileResult);
    
    console.log('=== FIREBASE DEBUG COMPLETE ===');
    
  } catch (error) {
    console.error('=== FIREBASE DEBUG ERROR ===', error);
  }
};

export default { debugFirebaseSetup };
