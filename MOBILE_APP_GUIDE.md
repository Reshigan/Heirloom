# Mobile App Development Guide (Phase 3)

This guide covers the implementation of React Native mobile apps for iOS and Android with push notifications.

## Overview

The Heirloom mobile app provides:
- Cross-platform support (iOS and Android)
- Authentication with JWT tokens
- Vault viewing and management
- Push notifications for check-ins and alerts
- Offline support with local caching
- End-to-end encryption

## Technology Stack

- **React Native**: Cross-platform mobile framework
- **Expo**: Development and build tooling (recommended for faster development)
- **React Navigation**: Navigation library
- **Async Storage**: Local data persistence
- **Expo Notifications**: Push notification support
- **Axios**: HTTP client for API calls
- **React Native Crypto**: Encryption support

## Project Setup

### Option 1: Expo (Recommended)

```bash
# Install Expo CLI
npm install -g expo-cli

# Create new Expo project
npx create-expo-app HeirloomApp
cd HeirloomApp

# Install dependencies
npm install @react-navigation/native @react-navigation/stack
npm install react-native-screens react-native-safe-area-context
npm install @react-native-async-storage/async-storage
npm install axios
npm install expo-notifications
npm install expo-secure-store
npm install react-native-crypto-js
```

### Option 2: React Native CLI

```bash
# Install React Native CLI
npm install -g react-native-cli

# Create new project
npx react-native init HeirloomApp
cd HeirloomApp

# Install dependencies
npm install @react-navigation/native @react-navigation/stack
npm install react-native-screens react-native-safe-area-context
npm install @react-native-async-storage/async-storage
npm install axios
npm install @react-native-firebase/app @react-native-firebase/messaging
npm install react-native-crypto-js

# iOS specific
cd ios && pod install && cd ..
```

## Project Structure

```
HeirloomApp/
├── src/
│   ├── api/
│   │   ├── client.ts          # Axios client with auth
│   │   ├── auth.ts            # Auth API calls
│   │   ├── vault.ts           # Vault API calls
│   │   └── notifications.ts   # Notification API calls
│   ├── components/
│   │   ├── VaultItem.tsx      # Vault item card
│   │   ├── MemoryCard.tsx     # Memory display card
│   │   └── NotificationBadge.tsx
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── VaultScreen.tsx
│   │   ├── MemoryDetailScreen.tsx
│   │   ├── CheckInScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── navigation/
│   │   ├── AppNavigator.tsx   # Main navigation
│   │   └── AuthNavigator.tsx  # Auth flow navigation
│   ├── services/
│   │   ├── auth.service.ts    # Auth logic
│   │   ├── encryption.service.ts # E2E encryption
│   │   ├── notification.service.ts # Push notifications
│   │   └── storage.service.ts # Local storage
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── VaultContext.tsx
│   ├── types/
│   │   └── index.ts           # TypeScript types
│   └── utils/
│       ├── constants.ts
│       └── helpers.ts
├── App.tsx
└── app.json
```

## Core Implementation

### 1. API Client (src/api/client.ts)

```typescript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://loom.vantax.co.za/api';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle token expiration
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('auth_token');
      // Navigate to login screen
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 2. Authentication Service (src/services/auth.service.ts)

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';

export class AuthService {
  static async login(email: string, password: string) {
    const response = await apiClient.post('/auth/login', { email, password });
    const { token, user } = response.data;
    
    await AsyncStorage.setItem('auth_token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    
    return { token, user };
  }

  static async register(email: string, password: string, name: string) {
    const response = await apiClient.post('/auth/register', {
      email,
      password,
      name,
    });
    const { token, user } = response.data;
    
    await AsyncStorage.setItem('auth_token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    
    return { token, user };
  }

  static async logout() {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user');
  }

  static async getCurrentUser() {
    const userJson = await AsyncStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  }

  static async isAuthenticated() {
    const token = await AsyncStorage.getItem('auth_token');
    return !!token;
  }
}
```

### 3. Push Notifications (src/services/notification.service.ts)

#### For Expo:

```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import apiClient from '../api/client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  static async registerForPushNotifications() {
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Push token:', token);

    // Send token to backend
    await apiClient.post('/notifications/register-device', {
      token,
      platform: Platform.OS,
    });

    return token;
  }

  static setupNotificationListeners(
    onNotificationReceived: (notification: any) => void,
    onNotificationTapped: (response: any) => void
  ) {
    // Notification received while app is in foreground
    const receivedSubscription = Notifications.addNotificationReceivedListener(
      onNotificationReceived
    );

    // Notification tapped
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      onNotificationTapped
    );

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }

  static async scheduleLocalNotification(title: string, body: string, data?: any) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null, // Show immediately
    });
  }
}
```

#### For React Native CLI (Firebase):

```typescript
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import apiClient from '../api/client';

export class NotificationService {
  static async registerForPushNotifications() {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.log('Push notification permission denied');
      return null;
    }

    const token = await messaging().getToken();
    console.log('FCM Token:', token);

    // Send token to backend
    await apiClient.post('/notifications/register-device', {
      token,
      platform: Platform.OS,
    });

    return token;
  }

  static setupNotificationListeners(
    onNotificationReceived: (notification: any) => void,
    onNotificationTapped: (response: any) => void
  ) {
    // Foreground messages
    const unsubscribeForeground = messaging().onMessage(onNotificationReceived);

    // Background/quit state messages
    messaging().onNotificationOpenedApp(onNotificationTapped);
    messaging().getInitialNotification().then(onNotificationTapped);

    return () => {
      unsubscribeForeground();
    };
  }
}
```

### 4. Encryption Service (src/services/encryption.service.ts)

```typescript
import CryptoJS from 'react-native-crypto-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class EncryptionService {
  private static MASTER_KEY = 'vault_master_key';

  static async generateMasterKey(password: string, salt: string): Promise<string> {
    // Use PBKDF2 to derive key from password
    const key = CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: 10000,
    });
    return key.toString();
  }

  static async storeMasterKey(key: string) {
    await AsyncStorage.setItem(this.MASTER_KEY, key);
  }

  static async getMasterKey(): Promise<string | null> {
    return await AsyncStorage.getItem(this.MASTER_KEY);
  }

  static encrypt(data: string, key: string): string {
    return CryptoJS.AES.encrypt(data, key).toString();
  }

  static decrypt(encryptedData: string, key: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  static async clearMasterKey() {
    await AsyncStorage.removeItem(this.MASTER_KEY);
  }
}
```

### 5. Login Screen (src/screens/LoginScreen.tsx)

```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

export const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      await AuthService.login(email, password);
      
      // Register for push notifications
      await NotificationService.registerForPushNotifications();
      
      navigation.replace('Main');
    } catch (error: any) {
      Alert.alert('Login Failed', error.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Heirloom</Text>
      <Text style={styles.subtitle}>Your Digital Legacy</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Don't have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#0a0a0a',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#d4af37',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#d4af37',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    color: '#fff',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#d4af37',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  link: {
    color: '#d4af37',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
});
```

### 6. Vault Screen (src/screens/VaultScreen.tsx)

```typescript
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
} from 'react-native';
import apiClient from '../api/client';

interface VaultItem {
  id: string;
  type: string;
  title: string;
  thumbnailUrl?: string;
  emotionCategory?: string;
  importanceScore: number;
  createdAt: string;
}

export const VaultScreen = ({ navigation }: any) => {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadVaultItems = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/vault/items');
      setItems(response.data.items);
    } catch (error) {
      console.error('Failed to load vault items:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadVaultItems();
  }, []);

  const renderItem = ({ item }: { item: VaultItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('MemoryDetail', { itemId: item.id })}
    >
      {item.thumbnailUrl && (
        <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} />
      )}
      <View style={styles.cardContent}>
        <Text style={styles.title}>{item.title || 'Untitled Memory'}</Text>
        <View style={styles.metadata}>
          <Text style={styles.metadataText}>
            {item.emotionCategory || 'neutral'} • {item.importanceScore}/10
          </Text>
          <Text style={styles.date}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadVaultItems} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No memories yet</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#d4af37',
    borderRadius: 12,
    margin: 10,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metadataText: {
    color: '#d4af37',
    fontSize: 14,
  },
  date: {
    color: '#888',
    fontSize: 12,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
});
```

## Backend Changes Required

### 1. Add Device Registration Endpoint

```typescript
// backend-node/src/routes/notifications.ts

router.post('/register-device', async (req: AuthRequest, res, next) => {
  try {
    const { token, platform } = req.body;
    
    // Store device token in database
    await prisma.deviceToken.create({
      data: {
        userId: req.user!.userId,
        token,
        platform,
      },
    });
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});
```

### 2. Add DeviceToken Model to Prisma Schema

```prisma
model DeviceToken {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  token     String   @unique
  platform  String   // ios, android
  createdAt DateTime @default(now()) @map("created_at")
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@map("device_tokens")
}
```

### 3. Send Push Notifications

```typescript
// backend-node/src/services/PushNotificationService.ts

import { Expo } from 'expo-server-sdk';

const expo = new Expo();

export class PushNotificationService {
  static async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: any
  ) {
    const devices = await prisma.deviceToken.findMany({
      where: { userId },
    });

    const messages = devices
      .filter((device) => Expo.isExpoPushToken(device.token))
      .map((device) => ({
        to: device.token,
        sound: 'default',
        title,
        body,
        data,
      }));

    const chunks = expo.chunkPushNotifications(messages);
    
    for (const chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        console.error('Failed to send push notification:', error);
      }
    }
  }
}
```

## Building and Deployment

### iOS (Expo)

```bash
# Build for iOS
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

### Android (Expo)

```bash
# Build for Android
eas build --platform android

# Submit to Google Play
eas submit --platform android
```

### iOS (React Native CLI)

```bash
cd ios
pod install
cd ..

# Open Xcode
open ios/HeirloomApp.xcworkspace

# Build and archive in Xcode
# Upload to App Store Connect
```

### Android (React Native CLI)

```bash
cd android
./gradlew assembleRelease

# APK will be at: android/app/build/outputs/apk/release/app-release.apk
# Upload to Google Play Console
```

## Testing

### Local Testing

```bash
# iOS Simulator
npm run ios

# Android Emulator
npm run android

# Expo
expo start
```

### Push Notification Testing

1. Use Expo Push Notification Tool: https://expo.dev/notifications
2. Or use Firebase Console for FCM testing
3. Test on physical devices (push notifications don't work on simulators)

## Security Considerations

1. **Token Storage**: Use Expo SecureStore or React Native Keychain for sensitive data
2. **SSL Pinning**: Implement certificate pinning for API calls
3. **Biometric Auth**: Add Face ID/Touch ID support
4. **Encryption**: Encrypt all sensitive data before storing locally
5. **API Keys**: Never commit API keys to version control

## Performance Optimization

1. **Image Caching**: Use react-native-fast-image for better image performance
2. **List Virtualization**: FlatList automatically virtualizes, but optimize renderItem
3. **Code Splitting**: Use React.lazy for lazy loading screens
4. **Bundle Size**: Analyze and reduce bundle size with metro-bundler
5. **Offline Support**: Implement offline-first architecture with local database

## Next Steps

1. Implement remaining screens (Check-in, Settings, etc.)
2. Add biometric authentication
3. Implement offline sync
4. Add analytics and crash reporting
5. Implement deep linking
6. Add app icon and splash screen
7. Set up CI/CD pipeline
8. Submit to app stores

## Estimated Timeline

- **Week 1**: Project setup, authentication, basic navigation
- **Week 2**: Vault viewing, memory details, push notifications
- **Week 3**: Check-in management, settings, encryption
- **Week 4**: Testing, bug fixes, app store submission

Total: **4 weeks** for MVP mobile app
