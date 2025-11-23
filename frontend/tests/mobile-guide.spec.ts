import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Mobile App Guide Documentation', () => {
  const repoRoot = path.join(__dirname, '../../');
  const mobileGuidePath = path.join(repoRoot, 'MOBILE_APP_GUIDE.md');
  const performanceGuidePath = path.join(repoRoot, 'PERFORMANCE_GUIDE.md');

  test('should have MOBILE_APP_GUIDE.md file', () => {
    expect(fs.existsSync(mobileGuidePath)).toBe(true);
  });

  test('should have comprehensive mobile app guide content', () => {
    const content = fs.readFileSync(mobileGuidePath, 'utf-8');
    
    expect(content).toContain('# Mobile App Development Guide');
    expect(content).toContain('React Native');
    expect(content).toContain('Authentication');
    expect(content).toContain('Push Notifications');
    expect(content).toContain('Encryption');
    
    expect(content).toContain('```typescript');
    expect(content).toContain('```bash');
    
    expect(content).toContain('npm install');
    expect(content).toContain('Expo');
    
    expect(content.length).toBeGreaterThan(10000);
  });

  test('should document authentication implementation', () => {
    const content = fs.readFileSync(mobileGuidePath, 'utf-8');
    
    expect(content).toContain('AuthService');
    expect(content).toContain('login');
    expect(content).toContain('register');
    expect(content).toContain('AsyncStorage');
  });

  test('should document push notification setup', () => {
    const content = fs.readFileSync(mobileGuidePath, 'utf-8');
    
    expect(content).toContain('NotificationService');
    expect(content).toContain('registerForPushNotifications');
    const hasNotificationLib = content.includes('expo-notifications') || content.includes('firebase/messaging');
    expect(hasNotificationLib).toBe(true);
  });

  test('should document encryption service', () => {
    const content = fs.readFileSync(mobileGuidePath, 'utf-8');
    
    expect(content).toContain('EncryptionService');
    expect(content).toContain('encrypt');
    expect(content).toContain('decrypt');
    const hasCrypto = content.includes('CryptoJS') || content.includes('crypto');
    expect(hasCrypto).toBe(true);
  });

  test('should include screen examples', () => {
    const content = fs.readFileSync(mobileGuidePath, 'utf-8');
    
    expect(content).toContain('LoginScreen');
    expect(content).toContain('VaultScreen');
    expect(content).toContain('StyleSheet');
  });

  test('should document building and deployment', () => {
    const content = fs.readFileSync(mobileGuidePath, 'utf-8');
    
    expect(content).toContain('Building and Deployment');
    expect(content).toContain('iOS');
    expect(content).toContain('Android');
    const hasBuildInstructions = content.includes('eas build') || content.includes('gradlew');
    expect(hasBuildInstructions).toBe(true);
  });

  test('should have PERFORMANCE_GUIDE.md file', () => {
    expect(fs.existsSync(performanceGuidePath)).toBe(true);
  });

  test('should document Redis caching', () => {
    const content = fs.readFileSync(performanceGuidePath, 'utf-8');
    
    expect(content).toContain('Redis');
    expect(content).toContain('Caching');
    expect(content).toContain('REDIS_URL');
  });

  test('should document database optimization', () => {
    const content = fs.readFileSync(performanceGuidePath, 'utf-8');
    
    expect(content).toContain('Database Optimization');
    expect(content).toContain('Indexes');
    expect(content).toContain('Connection Pooling');
  });

  test('should document CDN configuration', () => {
    const content = fs.readFileSync(performanceGuidePath, 'utf-8');
    
    expect(content).toContain('CDN');
    const hasCDNProvider = content.includes('Cloudflare') || content.includes('CloudFront');
    expect(hasCDNProvider).toBe(true);
  });

  test('should include capacity planning', () => {
    const content = fs.readFileSync(performanceGuidePath, 'utf-8');
    
    expect(content).toContain('Capacity Planning');
    const hasUserScale = content.includes('1M Users') || content.includes('1M users') || content.includes('1 million');
    expect(hasUserScale).toBe(true);
  });
});
