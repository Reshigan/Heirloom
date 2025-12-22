import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { colors, spacing, borderRadius } from '../utils/theme';

export const SettingsScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out.');
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open link.');
    });
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return (first + last).toUpperCase() || '?';
  };

  const SettingsItem = ({
    icon,
    title,
    subtitle,
    onPress,
    showArrow = true,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showArrow?: boolean;
  }) => (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.settingsIcon}>{icon}</Text>
      <View style={styles.settingsContent}>
        <Text style={styles.settingsTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingsSubtitle}>{subtitle}</Text>}
      </View>
      {showArrow && <Text style={styles.settingsArrow}>›</Text>}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getInitials(user?.firstName, user?.lastName)}
            </Text>
          </View>
          <Text style={styles.profileName}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <View style={styles.tierBadge}>
            <Text style={styles.tierText}>{user?.tier || 'FREE'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <SettingsItem
            icon="👤"
            title="Edit Profile"
            subtitle="Update your name and photo"
            onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available soon.')}
          />
          <SettingsItem
            icon="🔐"
            title="Change Password"
            subtitle="Update your password"
            onPress={() => Alert.alert('Coming Soon', 'Password change will be available soon.')}
          />
          <SettingsItem
            icon="💳"
            title="Subscription"
            subtitle={`Current plan: ${user?.tier || 'Free'}`}
            onPress={() => openLink('https://heirloom.blue/billing')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <SettingsItem
            icon="🔔"
            title="Push Notifications"
            subtitle="Manage notification preferences"
            onPress={() => Alert.alert('Coming Soon', 'Notification settings will be available soon.')}
          />
          <SettingsItem
            icon="📧"
            title="Email Preferences"
            subtitle="Control email reminders"
            onPress={() => Alert.alert('Coming Soon', 'Email preferences will be available soon.')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legacy Settings</Text>
          <SettingsItem
            icon="🛡️"
            title="Legacy Contacts"
            subtitle="Manage who receives your legacy"
            onPress={() => openLink('https://heirloom.blue/settings')}
          />
          <SettingsItem
            icon="⏰"
            title="Check-in Schedule"
            subtitle="Set your check-in frequency"
            onPress={() => openLink('https://heirloom.blue/settings')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <SettingsItem
            icon="❓"
            title="Help Center"
            subtitle="Get help and support"
            onPress={() => openLink('https://heirloom.blue/help')}
          />
          <SettingsItem
            icon="💬"
            title="Contact Us"
            subtitle="Reach out to our team"
            onPress={() => openLink('mailto:support@heirloom.blue')}
          />
          <SettingsItem
            icon="⭐"
            title="Rate the App"
            subtitle="Share your feedback"
            onPress={() => Alert.alert('Thank You!', 'We appreciate your support!')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <SettingsItem
            icon="📜"
            title="Privacy Policy"
            onPress={() => openLink('https://heirloom.blue/privacy')}
          />
          <SettingsItem
            icon="📋"
            title="Terms of Service"
            onPress={() => openLink('https://heirloom.blue/terms')}
          />
          <SettingsItem
            icon="🗑️"
            title="Delete Account"
            subtitle="Permanently delete your account"
            onPress={() => {
              Alert.alert(
                'Delete Account',
                'This action is permanent and cannot be undone. All your memories, letters, and recordings will be deleted.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => openLink('https://heirloom.blue/settings'),
                  },
                ]
              );
            }}
          />
        </View>

        <Button
          title="Sign Out"
          onPress={handleLogout}
          variant="secondary"
          loading={loggingOut}
          style={styles.logoutButton}
        />

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.void,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.paper,
    letterSpacing: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.lg,
    backgroundColor: colors.voidElevated,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: colors.void,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.paper,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.paperDim,
    marginTop: spacing.xs,
  },
  tierBadge: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: borderRadius.full,
  },
  tierText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gold,
    letterSpacing: 1,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.paperMuted,
    letterSpacing: 1,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.voidElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingsIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  settingsContent: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.paper,
  },
  settingsSubtitle: {
    fontSize: 12,
    color: colors.paperDim,
    marginTop: 2,
  },
  settingsArrow: {
    fontSize: 24,
    color: colors.paperMuted,
  },
  logoutButton: {
    marginTop: spacing.lg,
  },
  version: {
    fontSize: 12,
    color: colors.paperMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
});
