# 🌟 City Pulse - Event Discovery App

A comprehensive React Native app for discovering events around you with Firebase authentication, biometric login, and real-time Ticketmaster API integration.

## 📱 Features

- **🔐 Firebase Authentication** - Secure email/password login with session persistence
- **👆 Biometric Authentication** - Fingerprint/Face ID login support
- **🎪 Live Event Data** - Real-time events from Ticketmaster API with rate limiting
- **🗺️ Google Maps Integration** - Interactive maps showing event venues
- **❤️ Favorites System** - Save and manage favorite events
- **🌍 Multi-language Support** - English and Arabic with RTL support
- **📱 Responsive Design** - Edge-to-edge display support with safe area handling
- **🎨 Animated UI** - Smooth animations including collapsible header
- **🔄 Pull to Refresh** - Refresh event data with intuitive gestures

## 🚀 Getting Started

### Prerequisites

Before running this app, make sure you have:

- **Node.js** (v16 or higher)
- **React Native development environment** set up
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)
- **Firebase project** configured
- **Google Maps API key** (paid tier recommended)
- **Ticketmaster API key**

### 📋 Setup Instructions

#### 1. Clone and Install Dependencies

```bash
git clone [your-repo-url]
cd CityPulse
yarn install
```

#### 2. iOS Setup (if targeting iOS)

```bash
cd ios
pod install
cd ..
```

#### 3. Firebase Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Enable Firestore Database
4. Enable Storage
5. Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
6. Place files in their respective directories:
   - `android/app/google-services.json`
   - `ios/GoogleService-Info.plist`

#### 4. API Keys Configuration

**Ticketmaster API:**
- Get your API key from [Ticketmaster Developer Portal](https://developer.ticketmaster.com/)
- Update `src/logic/TicketmasterAPI.ts` with your key

**Google Maps API:**
- Get your API key from [Google Cloud Console](https://console.cloud.google.com/)
- Enable "Maps SDK for Android" and "Maps SDK for iOS"
- Update `android/app/src/main/AndroidManifest.xml`:

```xml
<meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="YOUR_GOOGLE_MAPS_API_KEY" />
```

#### 5. Environment Setup

Create a `.env` file in the root directory:

```env
TICKETMASTER_API_KEY=your_ticketmaster_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
FIREBASE_PROJECT_ID=your_firebase_project_id
```

### 🏃‍♂️ Running the App

#### Start Metro Bundler

```bash
yarn start
```

#### Run on Android

```bash
yarn android
```

#### Run on iOS

```bash
yarn ios
```

### 🔧 Development Commands

```bash
# Clean and rebuild
yarn clean

# Type checking
yarn tsc

# Linting
yarn lint

# Reset Metro cache
yarn start --reset-cache
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   └── MapComponent.tsx # Google Maps integration
├── hooks/              # Custom React hooks
│   └── useTranslation.ts # Internationalization
├── logic/              # Business logic
│   ├── FirebaseManager.ts # Firebase operations
│   ├── TicketmasterAPI.ts # API integration
│   └── LocalStorageManager.ts # Local data management
├── navigation/         # Navigation configuration
│   └── AppNavigator.tsx
├── screens/           # App screens
│   ├── SplashScreen.tsx
│   ├── LoginScreen.tsx
│   ├── HomeScreen.tsx
│   ├── EventDetailScreen.tsx
│   └── ProfileScreen.tsx
└── translations/      # Language files
    ├── en.json
    └── ar.json
```

## 🔑 Key Dependencies

- **React Native 0.81.0** - Core framework
- **@react-native-firebase/auth** - Authentication
- **@react-native-firebase/firestore** - Database
- **react-native-maps** - Maps integration
- **react-native-biometrics** - Biometric authentication
- **@react-native-async-storage/async-storage** - Local storage
- **axios** - HTTP client with rate limiting
- **react-navigation** - Navigation
- **i18n-js** - Internationalization

## 🏗️ Architecture Decisions

### Rate Limiting
- Implemented 4 requests/second limit for Ticketmaster API
- Request queuing system prevents API throttling
- Automatic retry with exponential backoff

### Authentication Flow
- Firebase handles user authentication and session management
- Biometric login with fallback to email/password
- Session persistence across app restarts

### Data Management
- Firestore for user data and favorites
- AsyncStorage for app preferences and caching
- Real-time event data from Ticketmaster API

### UI/UX
- Material Design principles with custom theming
- Animated header that hides/shows on scroll
- Safe area handling for edge-to-edge displays
- RTL support for Arabic language

## 🧪 Testing

```bash
# Run tests
yarn test

# Run tests with coverage
yarn test --coverage
```

## 🚀 Production Build

### Android

```bash
cd android
./gradlew assembleRelease
```

### iOS

```bash
cd ios
xcodebuild -workspace CityPulse.xcworkspace -scheme CityPulse archive
```

## 🔒 Security Considerations

- API keys are properly configured and restricted
- Firebase security rules implemented
- Biometric data handled securely with device keychain
- Input validation and sanitization

## 📝 Assumptions Made

1. **API Access**: Users have valid Ticketmaster and Google Maps API keys
2. **Device Capabilities**: Target devices support biometric authentication
3. **Network**: App requires internet connection for core functionality
4. **Permissions**: Users grant location permissions for map features
5. **Platform Support**: Targeting Android 24+ and iOS 12+

## 🐛 Troubleshooting

### Common Issues

**Maps not showing:**
- Verify Google Maps API key is valid and properly configured
- Check if "Maps SDK for Android/iOS" are enabled in Google Cloud Console
- Ensure location permissions are granted

**Authentication issues:**
- Verify Firebase configuration files are correctly placed
- Check Firebase project settings and authentication methods
- Ensure app package name matches Firebase configuration

**API rate limiting:**
- Ticketmaster API has rate limits - check console for error messages
- Implemented automatic rate limiting, but excessive requests may still fail

### Reset Instructions

```bash
# Full reset (Android)
yarn android --reset-cache
cd android && ./gradlew clean && cd ..

# Full reset (iOS)
cd ios && xcodebuild clean && cd ..
yarn ios --reset-cache
```

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review React Native and Firebase documentation
3. Check API provider documentation (Ticketmaster, Google Maps)

## 📄 License

This project is developed for educational/demonstration purposes.

---

**Built with ❤️ using React Native, Firebase, and modern mobile development practices.**
