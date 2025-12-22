import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { memoriesApi } from '../services/api';
import { Memory } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { colors, spacing, borderRadius } from '../utils/theme';

export const MemoriesScreen: React.FC = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newMemory, setNewMemory] = useState({ title: '', description: '', emotion: '' });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = async () => {
    try {
      const response = await memoriesApi.getAll();
      setMemories(response.memories || []);
    } catch (error) {
      console.error('Failed to load memories:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMemories();
    setRefreshing(false);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library to add memories.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow camera access to capture memories.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const saveMemory = async () => {
    if (!newMemory.title.trim()) {
      Alert.alert('Title Required', 'Please enter a title for your memory.');
      return;
    }

    setSaving(true);
    try {
      const response = await memoriesApi.create({
        title: newMemory.title,
        description: newMemory.description,
        emotion: newMemory.emotion,
      });

      if (selectedImage && response.memory?.id) {
        await memoriesApi.uploadImage(response.memory.id, selectedImage);
      }

      setModalVisible(false);
      setNewMemory({ title: '', description: '', emotion: '' });
      setSelectedImage(null);
      await loadMemories();
      Alert.alert('Success', 'Your memory has been preserved forever.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save memory. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const deleteMemory = async (id: string) => {
    Alert.alert(
      'Delete Memory',
      'Are you sure you want to delete this memory? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await memoriesApi.delete(id);
              await loadMemories();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete memory.');
            }
          },
        },
      ]
    );
  };

  const renderMemory = ({ item }: { item: Memory }) => (
    <TouchableOpacity
      style={styles.memoryCard}
      onLongPress={() => deleteMemory(item.id)}
      activeOpacity={0.8}
    >
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.memoryImage} />
      )}
      <View style={styles.memoryContent}>
        <Text style={styles.memoryTitle}>{item.title}</Text>
        {item.description && (
          <Text style={styles.memoryDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <View style={styles.memoryMeta}>
          {item.emotion && <Text style={styles.memoryEmotion}>{item.emotion}</Text>}
          <Text style={styles.memoryDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const emotions = ['Joy', 'Love', 'Gratitude', 'Pride', 'Nostalgia', 'Hope', 'Peace'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Memories</Text>
        <Text style={styles.subtitle}>Preserve what matters most</Text>
      </View>

      <FlatList
        data={memories}
        renderItem={renderMemory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.gold}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📸</Text>
            <Text style={styles.emptyTitle}>No memories yet</Text>
            <Text style={styles.emptySubtitle}>
              Start preserving your precious moments
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
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
            <Text style={styles.modalTitle}>New Memory</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.imagePickerContainer}
              onPress={pickImage}
            >
              {selectedImage ? (
                <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imagePlaceholderIcon}>📷</Text>
                  <Text style={styles.imagePlaceholderText}>Add Photo</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.imageButtons}>
              <Button
                title="Choose Photo"
                onPress={pickImage}
                variant="secondary"
                size="sm"
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <Button
                title="Take Photo"
                onPress={takePhoto}
                variant="secondary"
                size="sm"
                style={{ flex: 1 }}
              />
            </View>

            <Input
              label="Title"
              placeholder="Give your memory a title"
              value={newMemory.title}
              onChangeText={(text) => setNewMemory({ ...newMemory, title: text })}
            />

            <Input
              label="Description"
              placeholder="Tell the story behind this memory..."
              value={newMemory.description}
              onChangeText={(text) => setNewMemory({ ...newMemory, description: text })}
              multiline
              numberOfLines={4}
            />

            <Text style={styles.emotionLabel}>How does this memory make you feel?</Text>
            <View style={styles.emotionGrid}>
              {emotions.map((emotion) => (
                <TouchableOpacity
                  key={emotion}
                  style={[
                    styles.emotionChip,
                    newMemory.emotion === emotion && styles.emotionChipSelected,
                  ]}
                  onPress={() => setNewMemory({ ...newMemory, emotion })}
                >
                  <Text
                    style={[
                      styles.emotionChipText,
                      newMemory.emotion === emotion && styles.emotionChipTextSelected,
                    ]}
                  >
                    {emotion}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              title="Save Memory"
              onPress={saveMemory}
              loading={saving}
              style={styles.saveButton}
            />
          </View>
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
  memoryCard: {
    backgroundColor: colors.voidElevated,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  memoryImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  memoryContent: {
    padding: spacing.md,
  },
  memoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.paper,
    marginBottom: spacing.xs,
  },
  memoryDescription: {
    fontSize: 14,
    color: colors.paperDim,
    lineHeight: 20,
  },
  memoryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  memoryEmotion: {
    fontSize: 12,
    color: colors.gold,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  memoryDate: {
    fontSize: 12,
    color: colors.paperMuted,
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
  imagePickerContainer: {
    marginBottom: spacing.md,
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.lg,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.voidElevated,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: colors.paperDim,
  },
  imageButtons: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  emotionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.paper,
    marginBottom: spacing.sm,
  },
  emotionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  emotionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.voidElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emotionChipSelected: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  emotionChipText: {
    fontSize: 14,
    color: colors.paperDim,
  },
  emotionChipTextSelected: {
    color: colors.void,
    fontWeight: '600',
  },
  saveButton: {
    marginTop: spacing.md,
  },
});
