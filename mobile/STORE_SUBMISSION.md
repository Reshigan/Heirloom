# Heirloom Mobile App - Store Submission Checklist

## App Information

- **App Name:** Heirloom
- **Bundle ID (iOS):** com.heirloom.app
- **Package Name (Android):** com.heirloom.app
- **Version:** 1.0.0
- **Build Number:** 1

## App Store (iOS) Requirements

### Required Assets
- [ ] App Icon (1024x1024 PNG, no alpha)
- [ ] Screenshots for iPhone 6.7" (1290x2796 or 2796x1290)
- [ ] Screenshots for iPhone 6.5" (1242x2688 or 2688x1242)
- [ ] Screenshots for iPad Pro 12.9" (2048x2732 or 2732x2048)
- [ ] App Preview Video (optional, 15-30 seconds)

### App Store Connect Information
- [ ] App Name: Heirloom - Your Memories, Forever
- [ ] Subtitle: Preserve Your Digital Legacy
- [ ] Promotional Text: Create a lasting legacy for your loved ones
- [ ] Description (see below)
- [ ] Keywords: legacy, memories, family, photos, voice recording, letters, time capsule, inheritance, digital vault
- [ ] Support URL: https://heirloom.blue/help
- [ ] Marketing URL: https://heirloom.blue
- [ ] Privacy Policy URL: https://heirloom.blue/privacy

### App Store Description
```
Heirloom is your sanctuary for preserving what matters most. Create a lasting digital legacy that your loved ones will treasure forever.

PRESERVE YOUR MEMORIES
- Upload photos with stories and emotions
- Record voice messages in your own words
- Write heartfelt letters for future delivery

BUILD YOUR FAMILY TREE
- Connect with family members
- Share memories across generations
- Create a constellation of your loved ones

SECURE YOUR LEGACY
- Military-grade encryption for all your data
- Set up legacy contacts for inheritance
- Schedule letters for future delivery

FEATURES:
- Beautiful, intuitive interface
- Cloud backup and sync
- Privacy-first design
- 14-day free trial

Your voice is irreplaceable. Your memories are priceless. Start preserving your legacy today.
```

### Privacy & Permissions
- [ ] Camera Usage Description: "Heirloom needs camera access to capture photos for your memories."
- [ ] Photo Library Usage Description: "Heirloom needs photo library access to save and upload your memories."
- [ ] Microphone Usage Description: "Heirloom needs microphone access to record voice messages for your legacy."
- [ ] Photo Library Add Usage Description: "Heirloom needs permission to save photos to your library."

### App Privacy (Data Collection)
- [ ] Contact Info: Email address (for account creation)
- [ ] User Content: Photos, audio, and other user-generated content
- [ ] Identifiers: User ID
- [ ] Usage Data: Product interaction

### Review Information
- [ ] Demo Account Email: demo@heirloom.blue
- [ ] Demo Account Password: (provide test credentials)
- [ ] Notes for Reviewer: "This app allows users to create and preserve digital memories, voice recordings, and letters for their loved ones."

### Age Rating
- [ ] Rating: 4+ (No objectionable content)

### Sign in with Apple
- [ ] Not required (email/password only authentication)

---

## Google Play Store (Android) Requirements

### Required Assets
- [ ] App Icon (512x512 PNG)
- [ ] Feature Graphic (1024x500 PNG)
- [ ] Screenshots (minimum 2, recommended 8)
  - Phone: 16:9 or 9:16 aspect ratio
  - 7-inch tablet (optional)
  - 10-inch tablet (optional)
- [ ] Promo Video (YouTube URL, optional)

### Store Listing Information
- [ ] App Name: Heirloom - Your Memories, Forever
- [ ] Short Description (80 chars): Preserve your digital legacy for loved ones
- [ ] Full Description (see iOS description above)
- [ ] Application Type: Application
- [ ] Category: Lifestyle
- [ ] Tags: legacy, memories, family, photos, voice recording

### Content Rating
- [ ] Complete IARC questionnaire
- [ ] Expected Rating: Everyone

### Data Safety
- [ ] Data collected:
  - Personal info: Name, email address
  - Photos and videos
  - Audio files
  - App activity
- [ ] Data shared: None
- [ ] Security practices:
  - Data is encrypted in transit
  - You can request that data be deleted
  - Data is encrypted at rest

### Privacy Policy
- [ ] URL: https://heirloom.blue/privacy

### App Access
- [ ] Login required: Yes
- [ ] Provide test credentials for review

### Target Audience
- [ ] Target age group: 18 and over
- [ ] Not designed for children

---

## Pre-Submission Checklist

### Technical
- [ ] App builds successfully for iOS
- [ ] App builds successfully for Android
- [ ] All API endpoints working
- [ ] Authentication flow tested
- [ ] Deep links configured (if applicable)
- [ ] Push notifications configured (if applicable)
- [ ] Analytics configured (if applicable)
- [ ] Crash reporting configured (if applicable)

### Legal
- [ ] Privacy Policy published and accessible
- [ ] Terms of Service published and accessible
- [ ] GDPR compliance verified
- [ ] CCPA compliance verified

### Testing
- [ ] Tested on multiple iOS devices
- [ ] Tested on multiple Android devices
- [ ] Tested on tablets
- [ ] Tested offline behavior
- [ ] Tested login/logout flow
- [ ] Tested all core features

---

## Build Commands

### iOS (requires macOS)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build for iOS
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

### Android
```bash
# Build for Android
eas build --platform android

# Submit to Play Store
eas submit --platform android
```

---

## Contact Information

- **Developer Name:** Heirloom Technologies
- **Support Email:** support@heirloom.blue
- **Website:** https://heirloom.blue
- **Privacy Policy:** https://heirloom.blue/privacy
- **Terms of Service:** https://heirloom.blue/terms
