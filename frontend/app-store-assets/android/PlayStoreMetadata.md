# Heirloom - Google Play Store Submission Requirements

## App Information

### Basic Info
- **App Name:** Heirloom - Your Memories, Forever
- **Package Name:** blue.heirloom.app
- **Default Language:** English (United States)
- **App Category:** Lifestyle
- **Tags:** memories, legacy, family, photos, voice recording, letters

### Contact Details
- **Email:** support@heirloom.blue
- **Website:** https://heirloom.blue
- **Privacy Policy:** https://heirloom.blue/privacy

## Store Listing

### Short Description (80 characters max)
Preserve your precious memories forever. Write letters, record your voice, create your legacy.

### Full Description (4000 characters max)
Heirloom is your digital sanctuary for preserving life's most precious moments. Create a lasting legacy through photos, voice recordings, and heartfelt letters that can be delivered to your loved ones at just the right moment.

KEY FEATURES:

MEMORIES VAULT
Store and organize your most treasured photos and videos with rich stories and context. Add emotions, locations, and tags to create a comprehensive archive of your life's journey.

VOICE RECORDINGS
Capture your voice with guided prompts that help you share wisdom, stories, and messages. Your authentic voice becomes a timeless gift for future generations.

TIME-CAPSULE LETTERS
Write heartfelt letters to loved ones that can be delivered immediately, on a specific date, or posthumously. Each letter is sealed with care and delivered at the perfect moment.

FAMILY TREE
Build your family tree and connect memories to the people who matter most. Share access with family members to create a collaborative legacy.

DEAD MAN'S SWITCH
Set up automatic check-ins to ensure your legacy reaches your loved ones when the time comes. Designate trusted contacts who can verify and receive your precious content.

END-TO-END ENCRYPTION
Your memories are protected with military-grade encryption. Only you and your designated recipients can access your content.

YEAR IN REVIEW (WRAPPED)
Celebrate your journey with beautiful annual summaries of your memories, recordings, and letters.

SUBSCRIPTION PLANS:
- Free Trial: 14 days with full access
- Keeper: Essential features for individuals
- Guardian: Advanced features for families
- Legacy: Premium features with priority support
- Eternal: Lifetime access with all features

Start preserving your legacy today. Your memories deserve to live forever.

Download Heirloom now and begin your journey of preserving what matters most.

## Graphics Assets

### App Icon
- **Size:** 512x512 PNG
- **Design:** Gold infinity symbol on dark background (#050505)
- **Requirements:** 32-bit PNG, no alpha channel

### Feature Graphic
- **Size:** 1024x500 PNG or JPG
- **Design:** Heirloom logo with tagline "Your Memories, Forever" on dark gradient background

### Screenshots (Required)

#### Phone Screenshots (16:9 or 9:16)
Minimum 2, Maximum 8
1. Dashboard with desk and candle (1080x1920)
2. Memories gallery view (1080x1920)
3. Letter composition page (1080x1920)
4. Voice recording with prompts (1080x1920)
5. Family tree view (1080x1920)
6. Settings page (1080x1920)

#### 7-inch Tablet Screenshots
Same as phone but 1200x1920

#### 10-inch Tablet Screenshots
Same as phone but 1600x2560

### Promo Video (Optional)
- **Length:** 30 seconds - 2 minutes
- **Format:** YouTube URL
- **Content:** App walkthrough showing key features

## Content Rating

### Content Rating Questionnaire

**Violence:**
- Does the app contain violence? No
- Is violence graphic? N/A
- Is violence towards specific groups? N/A

**Sexual Content:**
- Does the app contain sexual content? No
- Is there nudity? No

**Language:**
- Does the app contain profanity? No
- Does the app contain crude humor? No

**Controlled Substances:**
- Does the app reference drugs? No
- Does the app reference alcohol? No
- Does the app reference tobacco? No

**Miscellaneous:**
- Does the app contain gambling? No
- Does the app contain horror content? No
- Does the app allow user-generated content? Yes (private, encrypted)
- Does the app share location? No

**Expected Rating:** Everyone (E)

## Target Audience

### Target Age Group
- 18 and over (primary)
- All ages can use the app

### Target Countries
- All countries (initial release)

## App Access

### Login Required
Yes - Account required to use the app

### Demo Account for Review
- **Email:** demo@heirloom.app
- **Password:** demo123456

### Special Instructions for Reviewers
Heirloom is a digital legacy preservation app. The app requires:
1. Account creation or login
2. Internet connection for syncing
3. Camera/microphone permissions for content creation

The Dead Man's Switch feature requires multiple check-ins over time. The demo account has sample data pre-loaded for review purposes.

## Pricing & Distribution

### Pricing
Free (with In-App Purchases)

### In-App Products

#### Subscriptions
1. **Keeper Monthly** - $4.99/month
   - 10GB storage
   - Unlimited memories
   - Voice recordings
   - Basic support

2. **Keeper Annual** - $49.99/year
   - Same as monthly (17% savings)

3. **Guardian Monthly** - $9.99/month
   - 50GB storage
   - Family sharing (5 members)
   - Priority support
   - Advanced analytics

4. **Guardian Annual** - $99.99/year
   - Same as monthly (17% savings)

5. **Legacy Monthly** - $19.99/month
   - 200GB storage
   - Unlimited family members
   - Premium support
   - All features

6. **Legacy Annual** - $199.99/year
   - Same as monthly (17% savings)

#### One-Time Purchase
7. **Eternal (Lifetime)** - $499.99
   - Unlimited storage
   - All features forever
   - Priority support
   - Early access to new features

### Distribution
- All countries
- All devices (phones and tablets)

## App Content

### Data Safety

#### Data Collection
- **Personal info:** Name, email address
- **Photos and videos:** User-uploaded content
- **Audio:** Voice recordings
- **App activity:** App interactions, in-app search history

#### Data Sharing
- No data is shared with third parties
- All content is encrypted end-to-end

#### Security Practices
- Data is encrypted in transit (TLS 1.3)
- Data is encrypted at rest (AES-256)
- Users can request data deletion
- Independent security audits

### Permissions Required

#### Android Permissions
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.USE_BIOMETRIC" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

#### Permission Justifications
- **INTERNET:** Required for syncing content to cloud
- **CAMERA:** Required for capturing photos and videos
- **RECORD_AUDIO:** Required for voice recordings
- **STORAGE:** Required for importing/exporting media
- **BIOMETRIC:** Required for secure app access
- **BOOT_COMPLETED:** Required for check-in reminders
- **VIBRATE:** Required for haptic feedback
- **POST_NOTIFICATIONS:** Required for delivery and reminder notifications

## Technical Requirements

### Minimum SDK Version
- **minSdkVersion:** 24 (Android 7.0 Nougat)

### Target SDK Version
- **targetSdkVersion:** 34 (Android 14)

### Supported Architectures
- arm64-v8a
- armeabi-v7a
- x86_64
- x86

### App Bundle
- Use Android App Bundle (.aab) format
- Enable Play App Signing

## Release Management

### Release Track
- Internal testing (first)
- Closed testing (beta)
- Open testing (public beta)
- Production

### Staged Rollout
- Start with 10% rollout
- Monitor crash rates and reviews
- Increase to 50%, then 100%

### Update Priority
- Normal priority for feature updates
- High priority for security updates

## Localization

### Supported Languages (Initial Release)
- English (United States) - Default
- English (United Kingdom)
- English (Australia)

### Future Languages (Planned)
- Spanish (Spain)
- Spanish (Latin America)
- French (France)
- German (Germany)
- Portuguese (Brazil)
- Japanese
- Chinese (Simplified)
- Korean

## Store Listing Experiments

### A/B Testing (Planned)
- Test different app icons
- Test different feature graphics
- Test different descriptions

## Pre-Launch Report

### Test Devices
- Pixel 7 Pro
- Samsung Galaxy S23
- OnePlus 11
- Various tablets

### Accessibility Testing
- TalkBack compatibility
- High contrast mode
- Large text support
