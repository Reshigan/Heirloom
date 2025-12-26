# Heirloom Mobile App Build Guide

This guide explains how to build and submit the Heirloom iOS and Android apps to the App Store and Google Play.

## Overview

The Heirloom mobile apps use Capacitor to wrap the existing web application. The apps load the live heirloom.blue website directly, enabling instant "soft updates" without requiring app store resubmission for most changes.

## Prerequisites

### For iOS Development
- macOS with Xcode 15+ installed
- Apple Developer Account ($99/year)
- CocoaPods installed: `sudo gem install cocoapods`

### For Android Development
- Android Studio (latest version)
- Google Play Developer Account ($25 one-time fee)
- Java JDK 17+

## Project Structure

```
frontend/
├── ios/                    # iOS native project
│   └── App/
│       ├── App/           # Main app code
│       │   ├── Info.plist # App configuration
│       │   └── App.entitlements # Universal Links config
│       └── App.xcodeproj  # Xcode project
├── android/               # Android native project
│   └── app/
│       └── src/main/
│           └── AndroidManifest.xml
└── capacitor.config.ts    # Capacitor configuration
```

## Building for iOS

### 1. Install Dependencies

```bash
cd frontend
npm install
npm run build
npx cap sync ios
```

### 2. Open in Xcode

```bash
npx cap open ios
```

### 3. Configure Signing

1. In Xcode, select the "App" target
2. Go to "Signing & Capabilities"
3. Select your Team (Apple Developer account)
4. Xcode will automatically create provisioning profiles

### 4. Add Associated Domains Capability

1. In Xcode, select the "App" target
2. Go to "Signing & Capabilities"
3. Click "+ Capability"
4. Add "Associated Domains"
5. Add: `applinks:heirloom.blue`
6. Add: `webcredentials:heirloom.blue`

### 5. Configure App Icons

Replace the placeholder icons in `ios/App/App/Assets.xcassets/AppIcon.appiconset/` with your app icons:
- 1024x1024 (App Store)
- 180x180 (iPhone @3x)
- 120x120 (iPhone @2x)
- 167x167 (iPad Pro @2x)
- 152x152 (iPad @2x)
- 76x76 (iPad @1x)

### 6. Build for TestFlight

1. Select "Any iOS Device" as the build target
2. Product > Archive
3. Once archived, click "Distribute App"
4. Select "App Store Connect"
5. Follow the prompts to upload to TestFlight

### 7. App Store Submission

In App Store Connect (https://appstoreconnect.apple.com):

1. Create a new app with bundle ID: `blue.heirloom.app`
2. Fill in app information:
   - App Name: Heirloom
   - Subtitle: Preserve Your Family Legacy
   - Category: Lifestyle
   - Privacy Policy URL: https://heirloom.blue/privacy
   - Support URL: https://heirloom.blue/support
3. Add screenshots for all required device sizes
4. Submit for review

## Building for Android

### 1. Install Dependencies

```bash
cd frontend
npm install
npm run build
npx cap sync android
```

### 2. Open in Android Studio

```bash
npx cap open android
```

### 3. Configure Signing

1. In Android Studio, go to Build > Generate Signed Bundle/APK
2. Create a new keystore or use existing one
3. Fill in keystore details (keep this secure!)
4. Save the keystore file safely - you'll need it for all future updates

### 4. Configure App Icons

Replace the placeholder icons in `android/app/src/main/res/`:
- `mipmap-xxxhdpi/ic_launcher.png` (192x192)
- `mipmap-xxhdpi/ic_launcher.png` (144x144)
- `mipmap-xhdpi/ic_launcher.png` (96x96)
- `mipmap-hdpi/ic_launcher.png` (72x72)
- `mipmap-mdpi/ic_launcher.png` (48x48)

Also update the round icons in the same folders.

### 5. Build Release APK/AAB

For Google Play, build an Android App Bundle (AAB):

1. Build > Generate Signed Bundle/APK
2. Select "Android App Bundle"
3. Select your keystore
4. Choose "release" build variant
5. The AAB will be in `android/app/release/`

### 6. Google Play Submission

In Google Play Console (https://play.google.com/console):

1. Create a new app
2. Fill in app details:
   - App name: Heirloom
   - Short description: Preserve your family legacy with stories, memories, and more
   - Full description: [Your app description]
   - Category: Lifestyle
   - Privacy Policy URL: https://heirloom.blue/privacy
3. Upload the AAB file
4. Add screenshots for phone and tablet
5. Complete the content rating questionnaire
6. Set up pricing (Free with in-app purchases on web)
7. Submit for review

## Deep Links Configuration

The app is configured to handle these deep links:

- `https://heirloom.blue/gift/redeem/*` - Gift voucher redemption
- `https://heirloom.blue/gold/redeem/*` - Gold Legacy voucher redemption
- `https://heirloom.blue/verify-email/*` - Email verification
- `https://heirloom.blue/reset-password/*` - Password reset
- `heirloom://` - Custom URL scheme

### iOS Universal Links Setup

For Universal Links to work, you need to host an `apple-app-site-association` file at:
`https://heirloom.blue/.well-known/apple-app-site-association`

Content:
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.blue.heirloom.app",
        "paths": ["/gift/redeem/*", "/gold/redeem/*", "/verify-email/*", "/reset-password/*", "/inherit/*"]
      }
    ]
  },
  "webcredentials": {
    "apps": ["TEAM_ID.blue.heirloom.app"]
  }
}
```

Replace `TEAM_ID` with your Apple Developer Team ID.

### Android App Links Setup

For Android App Links to work, you need to host a `assetlinks.json` file at:
`https://heirloom.blue/.well-known/assetlinks.json`

Content:
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "blue.heirloom.app",
      "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT"]
    }
  }
]
```

Get your SHA256 fingerprint from your keystore:
```bash
keytool -list -v -keystore your-keystore.jks -alias your-alias
```

## Soft Updates

The app loads `https://heirloom.blue` directly, so any changes deployed to the website are immediately available in the app without requiring an app store update.

### When App Store Updates Are Required

You only need to submit a new app version when:
- Changing native code or plugins
- Updating the app icon or splash screen
- Changing the app name or bundle ID
- Adding new native capabilities

### When Soft Updates Work

These changes are instant (no app store update needed):
- UI changes
- New features in the web app
- Bug fixes in the web app
- Content updates
- API changes

## App Store Compliance Checklist

### Privacy Policy
- URL: https://heirloom.blue/privacy
- Must describe data collection and usage

### Terms of Service
- URL: https://heirloom.blue/terms

### Account Deletion
- Users can delete their account from Settings > Account > Delete Account
- Required by both Apple and Google

### In-App Purchases
- Subscriptions are handled on the web (not in-app)
- The app is for existing subscribers to access their content
- No in-app purchase implementation required

### Support
- Email: support@heirloom.blue
- Support URL: https://heirloom.blue/support

## Troubleshooting

### iOS Build Issues

**Code signing errors:**
- Ensure you're signed into your Apple Developer account in Xcode
- Check that your provisioning profiles are valid

**Pod install failures:**
```bash
cd ios/App
pod deintegrate
pod install
```

### Android Build Issues

**Gradle sync failures:**
- File > Invalidate Caches and Restart
- Check that JAVA_HOME is set correctly

**Signing issues:**
- Verify keystore path and passwords
- Ensure keystore file exists and is accessible

## Version Management

Update version numbers before each release:

### iOS
In Xcode, update:
- Version (CFBundleShortVersionString): e.g., "1.0.0"
- Build (CFBundleVersion): e.g., "1"

### Android
In `android/app/build.gradle`:
```gradle
versionCode 1
versionName "1.0.0"
```

## Contact

For technical support with the mobile apps:
- Email: support@heirloom.blue
- Admin: admin@heirloom.blue
