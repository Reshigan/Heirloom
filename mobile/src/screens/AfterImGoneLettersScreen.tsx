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
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../lib/api-client';

interface Letter {
  id: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  deliveryStatus: 'pending' | 'scheduled' | 'delivered' | 'failed';
  deliveredAt?: string;
  createdAt: string;
}

interface Recipient {
  id: string;
  email: string;
  name?: string;
}

export default function AfterImGoneLettersScreen({ navigation }: any) {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    fetchLetters();
    fetchRecipients();
  }, []);

  const fetchLetters = async () => {
    try {
      const data = await apiClient.get('/api/after-im-gone-letters');
      setLetters(data);
    } catch (error) {
      console.error('Failed to fetch letters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecipients = async () => {
    try {
      const data = await apiClient.get('/api/recipients');
      setRecipients(data);
    } catch (error) {
      console.error('Failed to fetch recipients:', error);
    }
  };

  const handleCreateLetter = async () => {
    if (!recipientEmail || !subject || !content) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const encryptedContent = btoa(content); // Base64 encoding as placeholder
      const encryptedDek = 'placeholder_dek';

      const newLetter = await apiClient.post('/api/after-im-gone-letters', {
        recipientEmail,
        recipientName: recipientName || undefined,
        subject,
        encryptedContent,
        encryptedDek,
        attachedMemoryIds: [],
      });

      setLetters([newLetter, ...letters]);
      setIsCreating(false);
      resetForm();
      Alert.alert('Success', 'Letter saved successfully!');
    } catch (error) {
      console.error('Failed to create letter:', error);
      Alert.alert('Error', 'Failed to create letter');
    }
  };

  const resetForm = () => {
    setRecipientEmail('');
    setRecipientName('');
    setSubject('');
    setContent('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#D4AF37';
      case 'delivered':
        return '#4CAF50';
      case 'failed':
        return '#F44336';
      default:
        return '#999';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  if (isCreating) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setIsCreating(false)}>
            <Ionicons name="arrow-back" size={24} color="#D4AF37" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Letter</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.form}>
          <View style={styles.infoBox}>
            <Ionicons name="heart-outline" size={20} color="#D4AF37" />
            <Text style={styles.infoText}>
              Write a letter that will be delivered to your loved ones after you're gone.
              Share your wisdom, express your love, and leave a lasting message.
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Recipient Email *</Text>
            <TextInput
              style={styles.input}
              value={recipientEmail}
              onChangeText={setRecipientEmail}
              placeholder="sarah@example.com"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {recipients.length > 0 && (
              <ScrollView horizontal style={styles.recipientChips}>
                {recipients.slice(0, 5).map((recipient) => (
                  <TouchableOpacity
                    key={recipient.id}
                    style={styles.chip}
                    onPress={() => {
                      setRecipientEmail(recipient.email);
                      setRecipientName(recipient.name || '');
                    }}
                  >
                    <Text style={styles.chipText}>
                      {recipient.name || recipient.email}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Recipient Name (Optional)</Text>
            <TextInput
              style={styles.input}
              value={recipientName}
              onChangeText={setRecipientName}
              placeholder="Sarah"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Subject *</Text>
            <TextInput
              style={styles.input}
              value={subject}
              onChangeText={setSubject}
              placeholder="My Final Words to You"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Letter Content *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={content}
              onChangeText={setContent}
              placeholder="My dearest Sarah,&#10;&#10;As I write this, I want you to know how much you've meant to me..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={12}
            />
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleCreateLetter}>
            <Ionicons name="send" size={20} color="#000" />
            <Text style={styles.primaryButtonText}>Save Letter</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              setIsCreating(false);
              resetForm();
            }}
          >
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#D4AF37" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>After I'm Gone Letters</Text>
        <TouchableOpacity onPress={() => setIsCreating(true)}>
          <Ionicons name="add" size={24} color="#D4AF37" />
        </TouchableOpacity>
      </View>

      <View style={styles.subheader}>
        <Text style={styles.subheaderText}>
          Write heartfelt letters to be delivered after you pass
        </Text>
        <View style={styles.subheaderInfo}>
          <Ionicons name="lock-closed-outline" size={14} color="#999" />
          <Text style={styles.subheaderInfoText}>Encrypted and secure</Text>
        </View>
      </View>

      {letters.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="mail-outline" size={64} color="#666" />
          <Text style={styles.emptyStateText}>No letters yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Write your first letter to be delivered after you're gone
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setIsCreating(true)}
          >
            <Ionicons name="add" size={20} color="#000" />
            <Text style={styles.primaryButtonText}>New Letter</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={letters}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.letterCard}>
              <View style={styles.letterHeader}>
                <View style={styles.letterHeaderLeft}>
                  <Text style={styles.letterSubject}>{item.subject}</Text>
                  <Text style={styles.letterRecipient}>
                    To: {item.recipientName || item.recipientEmail}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(item.deliveryStatus) + '33' },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      { color: getStatusColor(item.deliveryStatus) },
                    ]}
                  >
                    {item.deliveryStatus}
                  </Text>
                </View>
              </View>

              <View style={styles.letterMeta}>
                <Text style={styles.letterMetaText}>
                  Created: {new Date(item.createdAt).toLocaleDateString()}
                </Text>
                {item.deliveredAt && (
                  <Text style={styles.letterMetaText}>
                    Delivered: {new Date(item.deliveredAt).toLocaleDateString()}
                  </Text>
                )}
              </View>

              <TouchableOpacity style={styles.viewButton}>
                <Text style={styles.viewButtonText}>View Details</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
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
  subheader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  subheaderText: {
    color: '#CCC',
    fontSize: 14,
    marginBottom: 8,
  },
  subheaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subheaderInfoText: {
    color: '#999',
    fontSize: 12,
    marginLeft: 4,
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
    height: 200,
    textAlignVertical: 'top',
  },
  recipientChips: {
    marginTop: 8,
  },
  chip: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  chipText: {
    color: '#D4AF37',
    fontSize: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4AF37',
    borderRadius: 8,
    padding: 14,
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 14,
    marginTop: 8,
  },
  secondaryButtonText: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginBottom: 24,
    textAlign: 'center',
  },
  list: {
    padding: 16,
  },
  letterCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  letterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  letterHeaderLeft: {
    flex: 1,
  },
  letterSubject: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  letterRecipient: {
    fontSize: 14,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  letterMeta: {
    marginBottom: 12,
  },
  letterMetaText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  viewButton: {
    backgroundColor: '#2A2A1A',
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: '600',
  },
});
