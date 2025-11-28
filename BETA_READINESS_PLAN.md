# Beta Readiness & App Store Preparation Plan

## Phase 1: Sentiment-Driven Engagement (Current)

### 1.1 Welcome Message Enhancement
- [ ] Add sentiment analysis summary to welcome screen
- [ ] Show emotional journey stats (e.g., "15 joyful moments, 8 nostalgic memories")
- [ ] Display sentiment distribution chart
- [ ] Add motivational message based on sentiment patterns

### 1.2 Notification System Enhancement
- [ ] Sentiment-driven reminder notifications
- [ ] Examples:
  - "It's been a while since you captured a joyful moment. Share what made you smile today!"
  - "Your nostalgic memories are beautiful. Add another cherished moment from the past."
  - "You've been capturing loving moments. Keep building your family legacy!"
- [ ] Implement notification scheduling based on user activity
- [ ] Add sentiment-based notification templates

### 1.3 Search Functionality Verification
- [ ] Test search with sentiment filters
- [ ] Verify keyword search works
- [ ] Test date range filtering
- [ ] Verify search results display correctly

## Phase 2: Mobile Responsiveness & Testing

### 2.1 Device Testing
- [ ] iPhone SE (375x667)
- [ ] iPhone 14/15 (390x844)
- [ ] iPhone 14/15 Pro Max (430x932)
- [ ] Pixel 7 (412x915)
- [ ] Pixel 8 (412x915)
- [ ] iPad (768x1024 portrait)
- [ ] iPad (1024x768 landscape)

### 2.2 Component Testing
- [ ] Auth modal responsiveness
- [ ] Navigation menu on mobile
- [ ] Memory upload modal
- [ ] Timeline view touch interactions
- [ ] Action buttons tap targets (minimum 44x44px)
- [ ] Search modal on mobile
- [ ] Notification center on mobile

### 2.3 Playwright Mobile Tests
- [ ] Add mobile device configurations
- [ ] Test auth flow on mobile
- [ ] Test memory upload on mobile
- [ ] Test timeline navigation on mobile
- [ ] Test search on mobile

## Phase 3: PWA (Progressive Web App)

### 3.1 Manifest Configuration
- [ ] Create manifest.json
- [ ] Add app name, description
- [ ] Add theme colors (luxury gold/obsidian)
- [ ] Configure display mode (standalone)
- [ ] Add start URL

### 3.2 Icons
- [ ] Create 192x192 icon
- [ ] Create 512x512 icon
- [ ] Create maskable icons
- [ ] Add favicon variations

### 3.3 Service Worker
- [ ] Implement offline support
- [ ] Cache static assets
- [ ] Cache API responses
- [ ] Add update notification

### 3.4 Meta Tags
- [ ] Add theme-color meta tag
- [ ] Add apple-touch-icon
- [ ] Add apple-mobile-web-app-capable
- [ ] Add viewport meta tag

## Phase 4: Notifications & Reminders

### 4.1 Check-in Reminders
- [ ] Verify pg-boss scheduler is running
- [ ] Test check-in reminder emails
- [ ] Test check-in reminder push notifications
- [ ] Add sentiment-based reminder content

### 4.2 Recipient Notifications
- [ ] Test SSE connection
- [ ] Test notification delivery
- [ ] Add email fallback
- [ ] Add SMS fallback (if configured)

### 4.3 In-App Notifications
- [ ] Test notification center UI
- [ ] Test real-time updates via SSE
- [ ] Test notification read/unread status
- [ ] Test notification actions

## Phase 5: iOS & Android Apps (React Native/Expo)

### 5.1 Project Setup
- [ ] Initialize Expo project
- [ ] Configure TypeScript
- [ ] Set up navigation (React Navigation)
- [ ] Configure environment variables

### 5.2 Design System
- [ ] Create tokens.ts with luxury colors
- [ ] Port Bodoni Moda and Montserrat fonts
- [ ] Create shared components
- [ ] Implement dark theme

### 5.3 Core Screens
- [ ] Splash screen
- [ ] Auth screen (login/register)
- [ ] Home/Dashboard screen
- [ ] Timeline screen
- [ ] Memory detail screen
- [ ] Upload screen
- [ ] Profile screen
- [ ] Settings screen

### 5.4 Features
- [ ] Camera integration
- [ ] Photo/video picker
- [ ] Biometric authentication
- [ ] Push notifications (FCM/APNs)
- [ ] Offline support
- [ ] Background sync

## Phase 6: App Store Requirements

### 6.1 iOS App Store
- [ ] App icons (all required sizes)
- [ ] Screenshots (iPhone 6.7", 6.5", 5.5")
- [ ] Screenshots (iPad Pro 12.9", 12.9" 2nd gen)
- [ ] App preview video (optional)
- [ ] Privacy policy URL
- [ ] Terms of service URL
- [ ] Support URL
- [ ] Marketing URL
- [ ] App description (4000 chars max)
- [ ] Keywords (100 chars max)
- [ ] Promotional text (170 chars max)
- [ ] App Store Connect account
- [ ] Apple Developer Program membership
- [ ] Code signing certificates
- [ ] Provisioning profiles
- [ ] TestFlight beta testing

### 6.2 Google Play Store
- [ ] App icons (512x512 high-res, 192x192)
- [ ] Feature graphic (1024x500)
- [ ] Screenshots (phone: 16:9 or 9:16, min 320px)
- [ ] Screenshots (7" tablet, 10" tablet)
- [ ] Promo video (YouTube URL, optional)
- [ ] Privacy policy URL
- [ ] Terms of service URL
- [ ] Short description (80 chars max)
- [ ] Full description (4000 chars max)
- [ ] App category
- [ ] Content rating questionnaire
- [ ] Target audience
- [ ] Google Play Console account
- [ ] App signing key
- [ ] Internal testing track
- [ ] Closed testing track
- [ ] Open testing track

### 6.3 Legal & Privacy
- [ ] Privacy policy document
- [ ] Terms of service document
- [ ] Data safety form (Google Play)
- [ ] App privacy details (Apple)
- [ ] GDPR compliance
- [ ] COPPA compliance (if applicable)
- [ ] Data retention policy
- [ ] User data deletion process

### 6.4 App Metadata
- [ ] App name
- [ ] Subtitle/tagline
- [ ] Description (compelling copy)
- [ ] Keywords/tags
- [ ] Category selection
- [ ] Age rating
- [ ] Content warnings
- [ ] In-app purchases (if applicable)
- [ ] Subscription details (if applicable)

## Phase 7: Testing & QA

### 7.1 Functional Testing
- [ ] Auth flow (login, register, logout)
- [ ] Memory upload (photo, video, document)
- [ ] Timeline navigation
- [ ] Search functionality
- [ ] Sentiment analysis display
- [ ] Notifications
- [ ] Profile management
- [ ] Settings

### 7.2 Performance Testing
- [ ] App launch time
- [ ] Memory usage
- [ ] Battery consumption
- [ ] Network efficiency
- [ ] Image loading optimization
- [ ] Video playback performance

### 7.3 Security Testing
- [ ] Authentication security
- [ ] Data encryption
- [ ] API security
- [ ] Secure storage
- [ ] SSL/TLS verification

### 7.4 Compatibility Testing
- [ ] iOS versions (iOS 13+)
- [ ] Android versions (Android 8+)
- [ ] Device sizes
- [ ] Screen orientations
- [ ] Dark mode
- [ ] Accessibility

## Phase 8: Deployment

### 8.1 Web Deployment
- [ ] Deploy sentiment features
- [ ] Deploy PWA updates
- [ ] Update production environment
- [ ] Test on production

### 8.2 iOS Deployment
- [ ] Build release version
- [ ] Upload to App Store Connect
- [ ] Submit for review
- [ ] TestFlight beta testing
- [ ] Address review feedback
- [ ] Release to App Store

### 8.3 Android Deployment
- [ ] Build release APK/AAB
- [ ] Upload to Google Play Console
- [ ] Internal testing
- [ ] Closed testing
- [ ] Open testing
- [ ] Submit for review
- [ ] Address review feedback
- [ ] Release to Google Play

## Current Status

✅ Completed:
- Seed data (33 memories spanning 1920s-2020s)
- Sentiment API fix (returns sentimentLabel, sentimentScore, keywords)
- PR #42 created

🔄 In Progress:
- Sentiment-driven welcome message
- Sentiment-driven notifications

📋 Next:
- Mobile responsiveness testing
- PWA implementation
- iOS/Android app development
- App Store preparation

## Timeline Estimate

- Phase 1-2: 1-2 days
- Phase 3-4: 1 day
- Phase 5: 3-4 days
- Phase 6: 2-3 days
- Phase 7-8: 2-3 days

**Total: 9-14 days for complete beta + App Store readiness**
