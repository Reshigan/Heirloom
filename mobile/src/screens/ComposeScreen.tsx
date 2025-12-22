import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
} from 'react-native';
import { lettersApi } from '../services/api';
import { Letter } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { colors, spacing, borderRadius } from '../utils/theme';

export const ComposeScreen: React.FC = () => {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    recipientName: '',
    recipientEmail: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadLetters();
  }, []);

  const loadLetters = async () => {
    try {
      const response = await lettersApi.getAll();
      setLetters(response.letters || []);
    } catch (error) {
      console.error('Failed to load letters:', error);
    } finally {
      setLoading(false);
    }
  };

  const openNewLetter = () => {
    setSelectedLetter(null);
    setFormData({
      title: '',
      body: '',
      recipientName: '',
      recipientEmail: '',
    });
    setModalVisible(true);
  };

  const openEditLetter = (letter: Letter) => {
    if (letter.sealed) {
      Alert.alert('Sealed Letter', 'This letter has been sealed and cannot be edited.');
      return;
    }
    setSelectedLetter(letter);
    setFormData({
      title: letter.title,
      body: letter.body,
      recipientName: letter.recipientName || '',
      recipientEmail: letter.recipientEmail || '',
    });
    setModalVisible(true);
  };

  const saveLetter = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Title Required', 'Please enter a title for your letter.');
      return;
    }

    if (!formData.body.trim()) {
      Alert.alert('Content Required', 'Please write something in your letter.');
      return;
    }

    setSaving(true);
    try {
      if (selectedLetter) {
        await lettersApi.update(selectedLetter.id, formData);
      } else {
        await lettersApi.create(formData);
      }

      setModalVisible(false);
      await loadLetters();
      Alert.alert('Success', 'Your letter has been saved.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save letter. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const sealLetter = async (id: string) => {
    Alert.alert(
      'Seal Letter',
      'Once sealed, this letter cannot be edited. Are you sure you want to seal it?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Seal',
          onPress: async () => {
            try {
              await lettersApi.seal(id);
              await loadLetters();
              Alert.alert('Sealed', 'Your letter has been sealed and will be delivered as scheduled.');
            } catch (error) {
              Alert.alert('Error', 'Failed to seal letter.');
            }
          },
        },
      ]
    );
  };

  const deleteLetter = async (id: string) => {
    Alert.alert(
      'Delete Letter',
      'Are you sure you want to delete this letter?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await lettersApi.delete(id);
              await loadLetters();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete letter.');
            }
          },
        },
      ]
    );
  };

  const renderLetter = ({ item }: { item: Letter }) => (
    <TouchableOpacity
      style={styles.letterCard}
      onPress={() => openEditLetter(item)}
      onLongPress={() => deleteLetter(item.id)}
      activeOpacity={0.8}
    >
      <View style={styles.letterHeader}>
        <Text style={styles.letterTitle}>{item.title}</Text>
        {item.sealed && (
          <View style={styles.sealedBadge}>
            <Text style={styles.sealedText}>Sealed</Text>
          </View>
        )}
      </View>
      <Text style={styles.letterPreview} numberOfLines={2}>
        {item.body}
      </Text>
      <View style={styles.letterMeta}>
        {item.recipientName && (
          <Text style={styles.letterRecipient}>To: {item.recipientName}</Text>
        )}
        <Text style={styles.letterDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      {!item.sealed && (
        <TouchableOpacity
          style={styles.sealButton}
          onPress={() => sealLetter(item.id)}
        >
          <Text style={styles.sealButtonText}>Seal Letter</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const prompts = [
    "What do you want your children to know about life?",
    "What's your favorite memory with your family?",
    "What advice would you give your younger self?",
    "What are you most grateful for?",
    "What legacy do you want to leave behind?",
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Letters</Text>
        <Text style={styles.subtitle}>Words they'll read forever</Text>
      </View>

      <FlatList
        data={letters}
        renderItem={renderLetter}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.promptsContainer}>
            <Text style={styles.promptsTitle}>Writing Prompts</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {prompts.map((prompt, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.promptCard}
                  onPress={() => {
                    setFormData({ ...formData, body: prompt + '\n\n' });
                    openNewLetter();
                  }}
                >
                  <Text style={styles.promptText}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✉️</Text>
            <Text style={styles.emptyTitle}>No letters yet</Text>
            <Text style={styles.emptySubtitle}>
              Start writing your first letter
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={openNewLetter}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedLetter ? 'Edit Letter' : 'New Letter'}
            </Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <Input
              label="Title"
              placeholder="Give your letter a title"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
            />

            <Input
              label="To (optional)"
              placeholder="Who is this letter for?"
              value={formData.recipientName}
              onChangeText={(text) => setFormData({ ...formData, recipientName: text })}
            />

            <Input
              label="Their Email (optional)"
              placeholder="For delivery when the time comes"
              value={formData.recipientEmail}
              onChangeText={(text) => setFormData({ ...formData, recipientEmail: text })}
              keyboardType="email-address"
            />

            <Input
              label="Your Letter"
              placeholder="Write from your heart..."
              value={formData.body}
              onChangeText={(text) => setFormData({ ...formData, body: text })}
              multiline
              numberOfLines={12}
              style={{ minHeight: 200 }}
            />

            <Button
              title="Save Letter"
              onPress={saveLetter}
              loading={saving}
              style={styles.saveButton}
            />
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.void,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.paper,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: colors.paperDim,
    marginTop: spacing.xs,
  },
  list: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  promptsContainer: {
    marginBottom: spacing.lg,
  },
  promptsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.paper,
    marginBottom: spacing.sm,
    letterSpacing: 1,
  },
  promptCard: {
    backgroundColor: colors.voidElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginRight: spacing.sm,
    width: 200,
    borderWidth: 1,
    borderColor: colors.border,
  },
  promptText: {
    fontSize: 14,
    color: colors.paperDim,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  letterCard: {
    backgroundColor: colors.voidElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  letterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  letterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.paper,
    flex: 1,
  },
  sealedBadge: {
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  sealedText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.void,
    letterSpacing: 1,
  },
  letterPreview: {
    fontSize: 14,
    color: colors.paperDim,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  letterMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  letterRecipient: {
    fontSize: 12,
    color: colors.gold,
  },
  letterDate: {
    fontSize: 12,
    color: colors.paperMuted,
  },
  sealButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sealButtonText: {
    fontSize: 14,
    color: colors.gold,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.paper,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.paperDim,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 28,
    color: colors.void,
    fontWeight: '300',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.void,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalCancel: {
    fontSize: 16,
    color: colors.gold,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.paper,
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  saveButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
});
