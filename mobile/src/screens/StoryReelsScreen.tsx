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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../lib/api-client';

interface StoryReel {
  id: string;
  title: string;
  description?: string;
  memoryIds: string[];
  duration: number;
  style: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  status: 'draft' | 'generating' | 'ready' | 'failed';
  viewCount: number;
  isPublic: boolean;
  createdAt: string;
}

interface Memory {
  id: string;
  title: string;
  thumbnailUrl?: string;
}

export default function StoryReelsScreen({ navigation }: any) {
  const [reels, setReels] = useState<StoryReel[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMemoryIds, setSelectedMemoryIds] = useState<string[]>([]);
  const [style, setStyle] = useState('elegant');
  const [duration, setDuration] = useState(30);

  useEffect(() => {
    fetchReels();
    fetchMemories();
  }, []);

  const fetchReels = async () => {
    try {
      const data = await apiClient.get('/api/story-reels');
      setReels(data);
    } catch (error) {
      console.error('Failed to fetch story reels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMemories = async () => {
    try {
      const data = await apiClient.getMemories();
      setMemories(data);
    } catch (error) {
      console.error('Failed to fetch memories:', error);
    }
  };

  const handleCreateReel = async () => {
    if (!title || selectedMemoryIds.length === 0) {
      Alert.alert('Error', 'Please provide a title and select at least one memory');
      return;
    }

    try {
      const newReel = await apiClient.post('/api/story-reels', {
        title,
        description,
        memoryIds: selectedMemoryIds,
        duration,
        style,
      });

      setReels([newReel, ...reels]);
      setIsCreating(false);
      resetForm();
      Alert.alert('Success', 'Story reel created successfully!');
    } catch (error) {
      console.error('Failed to create story reel:', error);
      Alert.alert('Error', 'Failed to create story reel');
    }
  };

  const handleGenerateVideo = async (reelId: string) => {
    try {
      await apiClient.post(`/api/story-reels/${reelId}/generate`, {});
      
      setReels(reels.map(r => 
        r.id === reelId ? { ...r, status: 'generating' } : r
      ));

      Alert.alert('Success', 'Video generation started! This may take a few minutes.');
    } catch (error) {
      console.error('Failed to generate video:', error);
      Alert.alert('Error', 'Failed to generate video');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedMemoryIds([]);
    setStyle('elegant');
    setDuration(30);
  };

  const toggleMemorySelection = (memoryId: string) => {
    if (selectedMemoryIds.includes(memoryId)) {
      setSelectedMemoryIds(selectedMemoryIds.filter(id => id !== memoryId));
    } else {
      setSelectedMemoryIds([...selectedMemoryIds, memoryId]);
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
          <Text style={styles.headerTitle}>Create Story Reel</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.form}>
          <View style={styles.infoBox}>
            <Ionicons name="film-outline" size={20} color="#D4AF37" />
            <Text style={styles.infoText}>
              Create beautiful video reels from your memories with AI
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Reel Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Our Family Summer 2024"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="A beautiful collection of our summer memories..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Select Memories ({selectedMemoryIds.length} selected)
            </Text>
            <FlatList
              data={memories.slice(0, 12)}
              keyExtractor={(item) => item.id}
              numColumns={3}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.memoryThumbnail,
                    selectedMemoryIds.includes(item.id) && styles.memorySelected,
                  ]}
                  onPress={() => toggleMemorySelection(item.id)}
                >
                  {item.thumbnailUrl ? (
                    <Image
                      source={{ uri: item.thumbnailUrl }}
                      style={styles.memoryImage}
                    />
                  ) : (
                    <View style={styles.memoryPlaceholder}>
                      <Ionicons name="film-outline" size={24} color="#666" />
                    </View>
                  )}
                  {selectedMemoryIds.includes(item.id) && (
                    <View style={styles.memoryBadge}>
                      <Text style={styles.memoryBadgeText}>
                        {selectedMemoryIds.indexOf(item.id) + 1}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Style</Text>
              <View style={styles.picker}>
                {['elegant', 'modern', 'vintage', 'minimal'].map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.pickerOption,
                      style === s && styles.pickerOptionSelected,
                    ]}
                    onPress={() => setStyle(s)}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        style === s && styles.pickerOptionTextSelected,
                      ]}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Duration (seconds)</Text>
              <TextInput
                style={styles.input}
                value={duration.toString()}
                onChangeText={(text) => setDuration(parseInt(text) || 30)}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleCreateReel}>
            <Ionicons name="sparkles" size={20} color="#000" />
            <Text style={styles.primaryButtonText}>Create Reel</Text>
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
        <Text style={styles.headerTitle}>AI Story Reels</Text>
        <TouchableOpacity onPress={() => setIsCreating(true)}>
          <Ionicons name="add" size={24} color="#D4AF37" />
        </TouchableOpacity>
      </View>

      {reels.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="film-outline" size={64} color="#666" />
          <Text style={styles.emptyStateText}>No story reels yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Create your first AI-generated video reel
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setIsCreating(true)}
          >
            <Ionicons name="add" size={20} color="#000" />
            <Text style={styles.primaryButtonText}>New Reel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={reels}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.reelCard}>
              <View style={styles.reelThumbnail}>
                {item.thumbnailUrl ? (
                  <Image
                    source={{ uri: item.thumbnailUrl }}
                    style={styles.reelImage}
                  />
                ) : (
                  <View style={styles.reelPlaceholder}>
                    <Ionicons name="film-outline" size={48} color="#666" />
                  </View>
                )}
                {item.status === 'generating' && (
                  <View style={styles.reelOverlay}>
                    <ActivityIndicator size="large" color="#D4AF37" />
                  </View>
                )}
              </View>

              <View style={styles.reelContent}>
                <Text style={styles.reelTitle}>{item.title}</Text>
                {item.description && (
                  <Text style={styles.reelDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}

                <View style={styles.reelMeta}>
                  <View style={styles.reelMetaItem}>
                    <Ionicons name="eye-outline" size={14} color="#999" />
                    <Text style={styles.reelMetaText}>{item.viewCount} views</Text>
                  </View>
                  <Text style={styles.reelMetaText}>•</Text>
                  <Text style={styles.reelMetaText}>
                    {item.memoryIds.length} memories
                  </Text>
                  <Text style={styles.reelMetaText}>•</Text>
                  <Text style={styles.reelMetaText}>{item.duration}s</Text>
                </View>

                {item.status === 'draft' && (
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => handleGenerateVideo(item.id)}
                  >
                    <Ionicons name="sparkles" size={16} color="#000" />
                    <Text style={styles.primaryButtonText}>Generate Video</Text>
                  </TouchableOpacity>
                )}

                {item.status === 'ready' && (
                  <TouchableOpacity style={styles.primaryButton}>
                    <Ionicons name="play" size={16} color="#000" />
                    <Text style={styles.primaryButtonText}>Watch</Text>
                  </TouchableOpacity>
                )}

                {item.status === 'generating' && (
                  <View style={styles.generatingButton}>
                    <ActivityIndicator size="small" color="#D4AF37" />
                    <Text style={styles.generatingButtonText}>Generating...</Text>
                  </View>
                )}
              </View>
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
  form: {
    padding: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
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
    height: 80,
    textAlignVertical: 'top',
  },
  memoryThumbnail: {
    flex: 1,
    aspectRatio: 1,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  memorySelected: {
    borderColor: '#D4AF37',
  },
  memoryImage: {
    width: '100%',
    height: '100%',
  },
  memoryPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memoryBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memoryBadgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
  },
  picker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#1A1A1A',
  },
  pickerOptionSelected: {
    borderColor: '#D4AF37',
    backgroundColor: '#2A2A1A',
  },
  pickerOptionText: {
    color: '#999',
    fontSize: 14,
  },
  pickerOptionTextSelected: {
    color: '#D4AF37',
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
  },
  list: {
    padding: 16,
  },
  reelCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  reelThumbnail: {
    aspectRatio: 16 / 9,
    backgroundColor: '#0A0A0A',
  },
  reelImage: {
    width: '100%',
    height: '100%',
  },
  reelPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reelOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reelContent: {
    padding: 16,
  },
  reelTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  reelDescription: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  reelMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reelMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  reelMetaText: {
    fontSize: 12,
    color: '#999',
    marginHorizontal: 4,
  },
  generatingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 14,
    marginTop: 8,
  },
  generatingButtonText: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
