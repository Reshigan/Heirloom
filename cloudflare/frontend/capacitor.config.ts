import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'blue.heirloom.app',
  appName: 'Heirloom',
  webDir: 'dist',
  
  // Server configuration - load live site for instant updates
  server: {
    // In production, load the live site directly
    url: 'https://heirloom.blue',
    // Allow navigation to external URLs
    allowNavigation: ['heirloom.blue', '*.heirloom.blue', 'api.heirloom.blue'],
    // Clear text traffic for development
    cleartext: false,
  },
  
  // iOS specific configuration
  ios: {
    // Content inset adjustment for safe areas
    contentInset: 'automatic',
    // Allow mixed content
    allowsLinkPreview: true,
    // Scroll behavior
    scrollEnabled: true,
    // Background color while loading
    backgroundColor: '#0a0a0f',
    // Prefer web view for better performance
    preferredContentMode: 'mobile',
  },
  
  // Android specific configuration
  android: {
    // Allow mixed content
    allowMixedContent: true,
    // Background color while loading
    backgroundColor: '#0a0a0f',
    // Capture input for better keyboard handling
    captureInput: true,
    // Web view settings
    webContentsDebuggingEnabled: false,
  },
  
  // Plugins configuration
  plugins: {
    // Splash screen configuration
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0a0a0f',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    // Status bar configuration
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0a0f',
    },
    // Keyboard configuration
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
