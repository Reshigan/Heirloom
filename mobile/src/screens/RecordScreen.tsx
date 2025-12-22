import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Alert,
  Animated,
} from 'react-native';
import { Audio } from 'expo-av';
import { voiceApi } from '../services/api';
import { VoiceRecording } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { colors, spacing, borderRadius } from '../utils/theme';

export const RecordScreen: React.FC = () => {
  const [recordings, setRecordings] = useState<VoiceRecording[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadRecordings();
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const loadRecordings = async () => {
    try {
      const response = await voiceApi.getAll();
      setRecordings(response.recordings || []);
    } catch (error) {
      console.error('Failed to load recordings:', error);
    }
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow microphone access to record voice messages.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      setRecording(null);
      setIsRecording(false);
      setRecordingUri(uri);
      setShowSaveModal(true);

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const saveRecording = async () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a title for your recording.');
      return;
    }

    if (!recordingUri) return;

    setSaving(true);
    try {
      const response = await voiceApi.create({
        title,
        description,
      });

      if (response.recording?.id) {
        await voiceApi.uploadAudio(response.recording.id, recordingUri);
      }

      setShowSaveModal(false);
      setTitle('');
      setDescription('');
      setRecordingUri(null);
      setRecordingDuration(0);
      await loadRecordings();
      Alert.alert('Success', 'Your voice message has been saved.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save recording. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const playRecording = async (item: VoiceRecording) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      if (playingId === item.id) {
        setPlayingId(null);
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: item.fileUrl },
        { shouldPlay: true }
      );

      soundRef.current = sound;
      setPlayingId(item.id);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingId(null);
        }
      });
    } catch (error) {
      console.error('Failed to play recording:', error);
      Alert.alert('Error', 'Failed to play recording.');
    }
  };

  const deleteRecording = async (id: string) => {
    Alert.alert(
      'Delete Recording',
      'Are you sure you want to delete this recording?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await voiceApi.delete(id);
              await loadRecordings();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete recording.');
            }
          },
        },
      ]
    );
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderRecording = ({ item }: { item: VoiceRecording }) => (
    <TouchableOpacity
      style={styles.recordingCard}
      onPress={() => playRecording(item)}
      onLongPress={() => deleteRecording(item.id)}
      activeOpacity={0.8}
    >
      <View style={styles.recordingIcon}>
        <Text style={styles.recordingIconText}>
          {playingId === item.id ? '⏸' : '▶️'}
        </Text>
      </View>
      <View style={styles.recordingContent}>
        <Text style={styles.recordingTitle}>{item.title}</Text>
        {item.description && (
          <Text style={styles.recordingDescription} numberOfLines={1}>
            {item.description}
          </Text>
        )}
        <Text style={styles.recordingMeta}>
          {formatDuration(item.duration)} • {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Voice Recordings</Text>
        <Text style={styles.subtitle}>Your voice is irreplaceable</Text>
      </View>

      <View style={styles.recorderContainer}>
        <Animated.View
          style={[
            styles.recordButton,
            isRecording && styles.recordButtonActive,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <TouchableOpacity
            style={styles.recordButtonInner}
            onPress={isRecording ? stopRecording : startRecording}
            activeOpacity={0.8}
          >
            {isRecording ? (
              <View style={styles.stopIcon} />
            ) : (
              <Text style={styles.micIcon}>🎙</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.recordingTime}>
          {isRecording ? formatDuration(recordingDuration) : 'Tap to record'}
        </Text>

        {isRecording && (
          <Text style={styles.recordingHint}>Tap again to stop</Text>
        )}
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>Your Recordings</Text>
        <FlatList
          data={recordings}
          renderItem={renderRecording}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🎤</Text>
              <Text style={styles.emptyTitle}>No recordings yet</Text>
              <Text style={styles.emptySubtitle}>
                Record your first voice message
              </Text>
            </View>
          }
        />
      </View>

      {showSaveModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Save Recording</Text>
            <Text style={styles.modalDuration}>
              Duration: {formatDuration(recordingDuration)}
            </Text>

            <Input
              label="Title"
              placeholder="Name your recording"
              value={title}
              onChangeText={setTitle}
            />

            <Input
              label="Description (optional)"
              placeholder="What is this recording about?"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <Button
                title="Discard"
                onPress={() => {
                  setShowSaveModal(false);
                  setRecordingUri(null);
                  setTitle('');
                  setDescription('');
                }}
                variant="secondary"
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <Button
                title="Save"
                onPress={saveRecording}
                loading={saving}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      )}
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
  recorderContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  recordButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.voidElevated,
    borderWidth: 3,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonActive: {
    borderColor: colors.blood,
    backgroundColor: 'rgba(139, 0, 0, 0.2)',
  },
  recordButtonInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micIcon: {
    fontSize: 40,
  },
  stopIcon: {
    width: 30,
    height: 30,
    backgroundColor: colors.blood,
    borderRadius: 4,
  },
  recordingTime: {
    fontSize: 24,
    fontWeight: '300',
    color: colors.paper,
    marginTop: spacing.md,
    letterSpacing: 2,
  },
  recordingHint: {
    fontSize: 12,
    color: colors.paperMuted,
    marginTop: spacing.xs,
  },
  listContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.paper,
    marginBottom: spacing.md,
    letterSpacing: 1,
  },
  list: {
    paddingBottom: spacing.xl,
  },
  recordingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.voidElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recordingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  recordingIconText: {
    fontSize: 20,
  },
  recordingContent: {
    flex: 1,
  },
  recordingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.paper,
  },
  recordingDescription: {
    fontSize: 14,
    color: colors.paperDim,
    marginTop: 2,
  },
  recordingMeta: {
    fontSize: 12,
    color: colors.paperMuted,
    marginTop: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.paper,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.paperDim,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modal: {
    backgroundColor: colors.voidElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.paper,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  modalDuration: {
    fontSize: 14,
    color: colors.gold,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
});
