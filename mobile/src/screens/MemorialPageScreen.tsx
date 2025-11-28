import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../lib/api-client';

interface MemorialPage {
  id: string;
  slug: string;
  displayName: string;
  birthDate?: string;
  deathDate?: string;
  biography?: string;
  isPublic: boolean;
  allowContributions: boolean;
  requireApproval: boolean;
  viewCount: number;
  contributionCount: number;
  createdAt: string;
}

export default function MemorialPageScreen({ navigation }: any) {
  const [memorialPage, setMemorialPage] = useState<MemorialPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  const [slug, setSlug] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [biography, setBiography] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [allowContributions, setAllowContributions] = useState(true);
  const [requireApproval, setRequireApproval] = useState(true);

  useEffect(() => {
    fetchMemorialPage();
  }, []);

  const fetchMemorialPage = async () => {
    try {
      const data = await apiClient.get('/api/memorial-pages/mine');
      if (data) {
        setMemorialPage(data);
        setSlug(data.slug);
        setDisplayName(data.displayName);
        setBirthDate(data.birthDate ? new Date(data.birthDate).toISOString().split('T')[0] : '');
        setDeathDate(data.deathDate ? new Date(data.deathDate).toISOString().split('T')[0] : '');
        setBiography(data.biography || '');
        setIsPublic(data.isPublic);
        setAllowContributions(data.allowContributions);
        setRequireApproval(data.requireApproval);
      }
    } catch (error) {
      console.error('Failed to fetch memorial page:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveMemorialPage = async () => {
    if (!slug || !displayName) {
      Alert.alert('Error', 'Slug and display name are required');
      return;
    }

    try {
      const data = await apiClient.post('/api/memorial-pages', {
        slug,
        displayName,
        birthDate: birthDate || undefined,
        deathDate: deathDate || undefined,
        biography: biography || undefined,
        isPublic,
        allowContributions,
        requireApproval,
      });

      setMemorialPage(data);
      setIsEditing(false);
      Alert.alert('Success', 'Memorial page saved successfully!');
    } catch (error: any) {
      console.error('Failed to save memorial page:', error);
      if (error.response?.status === 409) {
        Alert.alert('Error', 'This slug is already taken. Please choose a different one.');
      } else {
        Alert.alert('Error', 'Failed to save memorial page');
      }
    }
  };

  const getPublicUrl = () => {
    if (!memorialPage) return '';
    return `https://loom.vantax.co.za/memorial/${memorialPage.slug}`;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  if (isEditing || !memorialPage) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => memorialPage ? setIsEditing(false) : navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#D4AF37" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {memorialPage ? 'Edit Memorial Page' : 'Create Memorial Page'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.form}>
          <View style={styles.infoBox}>
            <Ionicons name="globe-outline" size={20} color="#D4AF37" />
            <Text style={styles.infoText}>
              Build a beautiful tribute page where friends and family can share memories,
              leave messages, and contribute photos after you're gone.
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Page URL Slug *</Text>
            <View style={styles.slugInput}>
              <Text style={styles.slugPrefix}>/memorial/</Text>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={slug}
                onChangeText={(text) => setSlug(text.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="john-smith"
                placeholderTextColor="#666"
                autoCapitalize="none"
              />
            </View>
            <Text style={styles.hint}>This will be your memorial page URL</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Display Name *</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="John Smith"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Birth Date (Optional)</Text>
            <TextInput
              style={styles.input}
              value={birthDate}
              onChangeText={setBirthDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Death Date (Optional)</Text>
            <TextInput
              style={styles.input}
              value={deathDate}
              onChangeText={setDeathDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Biography (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={biography}
              onChangeText={setBiography}
              placeholder="Share a brief biography or life story..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={6}
            />
          </View>

          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Privacy & Contribution Settings</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Make page public</Text>
                <Text style={styles.settingDescription}>
                  Allow anyone to view this memorial page
                </Text>
              </View>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{ false: '#333', true: '#D4AF37' }}
                thumbColor="#FFF"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Allow contributions</Text>
                <Text style={styles.settingDescription}>
                  Let others add photos and memories
                </Text>
              </View>
              <Switch
                value={allowContributions}
                onValueChange={setAllowContributions}
                trackColor={{ false: '#333', true: '#D4AF37' }}
                thumbColor="#FFF"
              />
            </View>

            {allowContributions && (
              <View style={[styles.settingRow, { marginLeft: 16 }]}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Require approval</Text>
                  <Text style={styles.settingDescription}>
                    Review contributions before they appear
                  </Text>
                </View>
                <Switch
                  value={requireApproval}
                  onValueChange={setRequireApproval}
                  trackColor={{ false: '#333', true: '#D4AF37' }}
                  thumbColor="#FFF"
                />
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleSaveMemorialPage}>
            <Text style={styles.primaryButtonText}>
              {memorialPage ? 'Update Page' : 'Create Page'}
            </Text>
          </TouchableOpacity>

          {memorialPage && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setIsEditing(false)}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#D4AF37" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Memorial Page</Text>
        <TouchableOpacity onPress={() => setIsEditing(true)}>
          <Ionicons name="create-outline" size={24} color="#D4AF37" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.pageCard}>
          <Text style={styles.pageName}>{memorialPage.displayName}</Text>
          {memorialPage.birthDate && memorialPage.deathDate && (
            <Text style={styles.pageYears}>
              {new Date(memorialPage.birthDate).getFullYear()} -{' '}
              {new Date(memorialPage.deathDate).getFullYear()}
            </Text>
          )}

          {memorialPage.biography && (
            <Text style={styles.pageBiography}>{memorialPage.biography}</Text>
          )}

          <View style={styles.pageStats}>
            <View style={styles.statItem}>
              <Ionicons name="eye-outline" size={16} color="#999" />
              <Text style={styles.statText}>{memorialPage.viewCount} views</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="cloud-upload-outline" size={16} color="#999" />
              <Text style={styles.statText}>
                {memorialPage.contributionCount} contributions
              </Text>
            </View>
            <View style={styles.statItem}>
              {memorialPage.isPublic ? (
                <>
                  <Ionicons name="globe-outline" size={16} color="#4CAF50" />
                  <Text style={[styles.statText, { color: '#4CAF50' }]}>Public</Text>
                </>
              ) : (
                <>
                  <Ionicons name="lock-closed-outline" size={16} color="#999" />
                  <Text style={styles.statText}>Private</Text>
                </>
              )}
            </View>
          </View>

          {memorialPage.isPublic && (
            <View style={styles.urlSection}>
              <Text style={styles.urlLabel}>Public URL:</Text>
              <View style={styles.urlBox}>
                <Text style={styles.urlText} numberOfLines={1}>
                  {getPublicUrl()}
                </Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => {
                    Alert.alert('Success', 'URL copied to clipboard!');
                  }}
                >
                  <Ionicons name="copy-outline" size={20} color="#D4AF37" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="people-outline" size={24} color="#D4AF37" />
            <Text style={styles.actionButtonText}>View Contributions</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubbles-outline" size={24} color="#D4AF37" />
            <Text style={styles.actionButtonText}>View Tributes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-outline" size={24} color="#D4AF37" />
            <Text style={styles.actionButtonText}>Share Page</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#D4AF37',
  },
  form: {
    padding: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    color: '#CCC',
    fontSize: 14,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#D4AF37',
    marginBottom: 8,
  },
  slugInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slugPrefix: {
    color: '#999',
    fontSize: 16,
    marginRight: 4,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    color: '#FFF',
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  settingsSection: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4AF37',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 14,
    color: '#FFF',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#999',
  },
  primaryButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryButtonText: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  pageCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  pageName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
  pageYears: {
    fontSize: 16,
    color: '#999',
    marginBottom: 16,
  },
  pageBiography: {
    fontSize: 14,
    color: '#CCC',
    lineHeight: 20,
    marginBottom: 16,
  },
  pageStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  urlSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  urlLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  urlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
  },
  urlText: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
  },
  copyButton: {
    marginLeft: 8,
  },
  actionsSection: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
  },
  actionButtonText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#D4AF37',
    fontWeight: '500',
  },
});
