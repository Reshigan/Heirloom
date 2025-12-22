import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { familyApi } from '../services/api';
import { FamilyMember } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { colors, spacing, borderRadius } from '../utils/theme';

const RELATIONSHIPS = [
  'Spouse', 'Child', 'Parent', 'Sibling', 'Grandparent', 'Grandchild',
  'Aunt', 'Uncle', 'Cousin', 'Niece', 'Nephew', 'Friend', 'Other'
];

export const FamilyScreen: React.FC = () => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    relationship: '',
    email: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const response = await familyApi.getAll();
      setMembers(response.members || []);
    } catch (error) {
      console.error('Failed to load family members:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMember = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Name Required', 'Please enter a name.');
      return;
    }

    if (!formData.relationship) {
      Alert.alert('Relationship Required', 'Please select a relationship.');
      return;
    }

    setSaving(true);
    try {
      await familyApi.add(formData);
      setModalVisible(false);
      setFormData({ name: '', relationship: '', email: '' });
      await loadMembers();
      Alert.alert('Success', 'Family member added successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to add family member.');
    } finally {
      setSaving(false);
    }
  };

  const removeMember = async (id: string, name: string) => {
    Alert.alert(
      'Remove Family Member',
      `Are you sure you want to remove ${name} from your family?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await familyApi.remove(id);
              await loadMembers();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove family member.');
            }
          },
        },
      ]
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderMember = ({ item }: { item: FamilyMember }) => (
    <TouchableOpacity
      style={styles.memberCard}
      onLongPress={() => removeMember(item.id, item.name)}
      activeOpacity={0.8}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.name}</Text>
        <Text style={styles.memberRelationship}>{item.relationship}</Text>
        {item.email && (
          <Text style={styles.memberEmail}>{item.email}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Family</Text>
        <Text style={styles.subtitle}>Your legacy circle</Text>
      </View>

      <FlatList
        data={members}
        renderItem={renderMember}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        numColumns={2}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👨‍👩‍👧‍👦</Text>
            <Text style={styles.emptyTitle}>No family members yet</Text>
            <Text style={styles.emptySubtitle}>
              Add your loved ones to your legacy circle
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
            <Text style={styles.modalTitle}>Add Family Member</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.modalContent}>
            <Input
              label="Name"
              placeholder="Enter their name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              autoCapitalize="words"
            />

            <Text style={styles.relationshipLabel}>Relationship</Text>
            <View style={styles.relationshipGrid}>
              {RELATIONSHIPS.map((rel) => (
                <TouchableOpacity
                  key={rel}
                  style={[
                    styles.relationshipChip,
                    formData.relationship === rel && styles.relationshipChipSelected,
                  ]}
                  onPress={() => setFormData({ ...formData, relationship: rel })}
                >
                  <Text
                    style={[
                      styles.relationshipChipText,
                      formData.relationship === rel && styles.relationshipChipTextSelected,
                    ]}
                  >
                    {rel}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Email (optional)"
              placeholder="Their email address"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Button
              title="Add to Family"
              onPress={addMember}
              loading={saving}
              style={styles.addButton}
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
  memberCard: {
    flex: 1,
    backgroundColor: colors.voidElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    margin: spacing.xs,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.void,
  },
  memberInfo: {
    alignItems: 'center',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.paper,
    textAlign: 'center',
  },
  memberRelationship: {
    fontSize: 12,
    color: colors.gold,
    marginTop: 2,
  },
  memberEmail: {
    fontSize: 10,
    color: colors.paperMuted,
    marginTop: 2,
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
    textAlign: 'center',
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
  relationshipLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.paper,
    marginBottom: spacing.sm,
  },
  relationshipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  relationshipChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.voidElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  relationshipChipSelected: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  relationshipChipText: {
    fontSize: 14,
    color: colors.paperDim,
  },
  relationshipChipTextSelected: {
    color: colors.void,
    fontWeight: '600',
  },
  addButton: {
    marginTop: spacing.lg,
  },
});
