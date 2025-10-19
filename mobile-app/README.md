# 📱 Heirloom Mobile App

The mobile companion to the revolutionary Heirloom legacy preservation platform.

## 🌟 Features

### 📱 Native Experience
- **Native Constellation Visualization**: Interactive 3D memory constellation optimized for mobile
- **Touch Gestures**: Pinch to zoom, pan to explore your memory universe
- **Haptic Feedback**: Feel the connections between your memories

### 🔔 Smart Notifications
- **Memory Reminders**: AI-powered suggestions to capture important moments
- **Time Capsule Alerts**: Notifications when time capsules are ready to open
- **Family Updates**: Stay connected with your family's shared memories

### 📸 Instant Capture
- **Quick Memory Capture**: Instantly save photos, videos, and voice notes
- **AI Tagging**: Automatic categorization and connection suggestions
- **Offline Mode**: Capture memories even without internet connection

### 🔐 Biometric Security
- **Face ID / Touch ID**: Secure access to your precious memories
- **Encrypted Storage**: All data encrypted on device and in transit
- **Privacy Controls**: Granular control over what you share and with whom

## 🚀 Getting Started

### Prerequisites
- React Native development environment
- iOS 13+ or Android 8+
- Node.js 16+

### Installation

1. **Clone and navigate**
   ```bash
   cd mobile-app
   npm install
   ```

2. **iOS Setup**
   ```bash
   cd ios && pod install && cd ..
   npm run ios
   ```

3. **Android Setup**
   ```bash
   npm run android
   ```

## 🏗️ Architecture

### State Management
- **Zustand**: Lightweight state management
- **React Query**: Server state and caching
- **AsyncStorage**: Persistent local storage

### Navigation
- **React Navigation 6**: Type-safe navigation
- **Stack Navigator**: Screen transitions
- **Tab Navigator**: Bottom tab navigation

### UI Components
- **React Native SVG**: Custom constellation graphics
- **React Native Reanimated**: Smooth animations
- **Linear Gradient**: Beautiful background effects

## 📱 Screens

### 🌌 Constellation Screen
Interactive 3D visualization of your memory constellation with:
- Touch-based navigation
- Memory node interactions
- Connection visualization
- Zoom and pan gestures

### 📸 Capture Screen
Quick memory capture with:
- Camera integration
- Voice recording
- Text notes
- AI-powered tagging

### 👨‍👩‍👧‍👦 Family Screen
Family collaboration features:
- Shared family trees
- Collaborative storytelling
- Memory sharing
- Privacy controls

### ⏰ Time Capsules
Future message management:
- Create time capsules
- Schedule delivery
- View received messages
- AI-generated suggestions

### 🔔 Notifications
Smart notification system:
- Memory reminders
- Family updates
- Time capsule alerts
- Achievement notifications

## 🔧 Development

### Scripts
```bash
# Start Metro bundler
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run tests
npm test

# Lint code
npm run lint

# Build for production
npm run build:ios
npm run build:android
```

### Testing
- **Jest**: Unit testing framework
- **React Native Testing Library**: Component testing
- **Detox**: E2E testing (coming soon)

## 🚀 Deployment

### iOS App Store
1. Build release version
2. Archive in Xcode
3. Upload to App Store Connect
4. Submit for review

### Google Play Store
1. Generate signed APK
2. Upload to Play Console
3. Submit for review

## 🌟 Future Features

### Phase 1: Enhanced AI
- Voice-to-text transcription
- Emotion detection in photos
- Smart memory recommendations
- Automated story generation

### Phase 2: AR/VR Integration
- Augmented reality memory viewing
- Virtual reality constellation exploration
- 3D memory reconstruction
- Spatial audio experiences

### Phase 3: Social Features
- Memory sharing with friends
- Community storytelling
- Legacy preservation challenges
- Generational connections

## 🤝 Contributing

We welcome contributions to make the mobile experience even better!

### Development Guidelines
1. Follow React Native best practices
2. Write tests for new features
3. Maintain TypeScript types
4. Follow the existing code style

## 📄 License

MIT License - see the [LICENSE](../LICENSE) file for details.

---

**📱 Download from App Store and Google Play (Coming Soon)**

*Heirloom Mobile - Your memories, always with you*