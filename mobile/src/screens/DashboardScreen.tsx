import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { legacyApi, memoriesApi, voiceApi, lettersApi, familyApi } from '../services/api';
import { colors, spacing, borderRadius } from '../utils/theme';
import { LegacyScore } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

interface DashboardStats {
  memoriesCount: number;
  voiceMinutes: number;
  lettersCount: number;
  familyCount: number;
}

export const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [legacyScore, setLegacyScore] = useState<LegacyScore | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    memoriesCount: 0,
    voiceMinutes: 0,
    lettersCount: 0,
    familyCount: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [scoreData, memories, voice, letters, family] = await Promise.all([
        legacyApi.getScore().catch(() => null),
        memoriesApi.getAll().catch(() => ({ memories: [] })),
        voiceApi.getAll().catch(() => ({ recordings: [] })),
        lettersApi.getAll().catch(() => ({ letters: [] })),
        familyApi.getAll().catch(() => ({ members: [] })),
      ]);

      if (scoreData) {
        setLegacyScore(scoreData);
      }

      setStats({
        memoriesCount: memories?.memories?.length || 0,
        voiceMinutes: Math.round((voice?.recordings?.reduce((acc: number, r: any) => acc + (r.duration || 0), 0) || 0) / 60),
        lettersCount: letters?.letters?.length || 0,
        familyCount: family?.members?.length || 0,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const StatCard = ({ icon, title, value, onPress }: { icon: string; title: string; value: string | number; onPress: () => void }) => (
    <TouchableOpacity style={styles.statCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.statCardCorner} />
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <View style={styles.statCardCornerBottom} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.gold}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.sanctuary}>YOUR SANCTUARY AWAITS</Text>
          <Text style={styles.welcome}>
            Welcome back, <Text style={styles.name}>{user?.firstName}</Text>
          </Text>
          <Text style={styles.subtitle}>
            Every moment you preserve becomes eternal. What will you create today?
          </Text>
        </View>

        {legacyScore && (
          <View style={styles.scoreContainer}>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreValue}>{legacyScore.score}</Text>
              <Text style={styles.scoreLabel}>Legacy Score</Text>
            </View>
            <Text style={styles.scoreTier}>{legacyScore.tier}</Text>
          </View>
        )}

        <View style={styles.statsGrid}>
          <StatCard
            icon="🖼"
            title="MEMORIES"
            value={`${stats.memoriesCount} preserved`}
            onPress={() => navigation.navigate('Memories')}
          />
          <StatCard
            icon="✉️"
            title="LETTERS"
            value={`${stats.lettersCount} written`}
            onPress={() => navigation.navigate('Compose')}
          />
          <StatCard
            icon="🎙"
            title="VOICE"
            value={`${stats.voiceMinutes} minutes`}
            onPress={() => navigation.navigate('Record')}
          />
          <StatCard
            icon="👨‍👩‍👧‍👦"
            title="FAMILY"
            value={`${stats.familyCount} connected`}
            onPress={() => navigation.navigate('Family')}
          />
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Memories')}
          >
            <Text style={styles.actionIcon}>📸</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Add a Memory</Text>
              <Text style={styles.actionSubtitle}>Capture a moment that matters</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Record')}
          >
            <Text style={styles.actionIcon}>🎤</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Record Your Voice</Text>
              <Text style={styles.actionSubtitle}>Share a story in your own words</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Compose')}
          >
            <Text style={styles.actionIcon}>💌</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Write a Letter</Text>
              <Text style={styles.actionSubtitle}>Express what's in your heart</Text>
            </View>
          </TouchableOpacity>
        </View>
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
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  sanctuary: {
    fontSize: 12,
    color: colors.gold,
    letterSpacing: 3,
    marginBottom: spacing.sm,
  },
  welcome: {
    fontSize: 28,
    color: colors.paper,
    fontWeight: '300',
    letterSpacing: 2,
    textAlign: 'center',
  },
  name: {
    color: colors.gold,
    fontStyle: 'italic',
    fontFamily: 'Georgia',
  },
  subtitle: {
    fontSize: 14,
    color: colors.paperDim,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.voidElevated,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '600',
    color: colors.gold,
  },
  scoreLabel: {
    fontSize: 10,
    color: colors.paperDim,
    letterSpacing: 1,
  },
  scoreTier: {
    fontSize: 14,
    color: colors.gold,
    marginTop: spacing.sm,
    letterSpacing: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    width: '47%',
    backgroundColor: colors.voidElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  statCardCorner: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 20,
    height: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: colors.gold,
  },
  statCardCornerBottom: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.gold,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  statTitle: {
    fontSize: 12,
    color: colors.gold,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: 14,
    color: colors.paperDim,
  },
  quickActions: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    color: colors.paper,
    fontWeight: '600',
    marginBottom: spacing.md,
    letterSpacing: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.voidElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    color: colors.paper,
    fontWeight: '500',
  },
  actionSubtitle: {
    fontSize: 12,
    color: colors.paperDim,
    marginTop: 2,
  },
});
