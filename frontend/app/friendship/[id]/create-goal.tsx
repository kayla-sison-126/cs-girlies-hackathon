import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';

import { createGoal } from '../../../lib/goals';
import {
  getCurrentUser,
  getFriendId,
  getFriendProfile,
} from '../../../lib/friendships';

export default function CreateGoalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Itim: require('../../../assets/fonts/Itim.ttf'),
  });

  const [title, setTitle] = useState('');
  const [isVerifiable, setIsVerifiable] = useState(true);
  const [showTip, setShowTip] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [friendId, setFriendId] = useState<string | null>(null);
  const [friendName, setFriendName] = useState('Buddy');

  const [assignedTo, setAssignedTo] = useState<'me' | 'friend'>('me');

  const [loadingPeople, setLoadingPeople] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPeople();
  }, [id]);

  async function loadPeople() {
    try {
      if (!id) throw new Error('Friendship ID is missing.');

      setLoadingPeople(true);
      const user = await getCurrentUser();
      const otherUserId = await getFriendId(id, user.id);
      const profile = await getFriendProfile(otherUserId);

      setCurrentUserId(user.id);
      setFriendId(otherUserId);
      setFriendName(profile?.username || 'Buddy');
    } catch (error) {
      console.error('Failed to load friendship members:', error);
      Alert.alert('Error', 'Could not load the people in this friendship.');
    } finally {
      setLoadingPeople(false);
    }
  }

  async function handleCreateGoal() {
    try {
      if (!id) {
        Alert.alert('Error', 'Friendship ID is missing.');
        return;
      }

      if (!title.trim()) {
        Alert.alert('Missing title', 'Please enter a goal title.');
        return;
      }

      if (!currentUserId || !friendId) {
        Alert.alert('Error', 'Could not determine who can complete this goal.');
        return;
      }

      const selectedUserId = assignedTo === 'me' ? currentUserId : friendId;

      setSaving(true);

      await createGoal(id, title.trim(), "", selectedUserId, isVerifiable);

      Alert.alert('Goal Created!', 'Your new goal has been added.');
      router.back();
    } catch (error: any) {
      console.error('Failed to create goal:', error);
      Alert.alert(
        'Could not create goal',
        error?.message || 'Something went wrong while creating the goal.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.overlayContainer}>
      <View style={styles.modalCard}>
        {loadingPeople || !fontsLoaded ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#824A20" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header Close Button */}
            <View style={styles.headerRow}>
              <Text style={styles.modalTitle}>Add New Goal</Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="close" size={26} color="#C7967D" />
              </TouchableOpacity>
            </View>

            {/* GOAL TITLE */}
            <Text style={styles.label}>Goal Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Type here..."
              placeholderTextColor="#B0A093"
              value={title}
              onChangeText={setTitle}
              editable={!saving}
            />

            {/* WHO IS COMPLETING THE GOAL */}
            <Text style={styles.label}>Who is completing this goal?</Text>
            <View style={styles.optionRow}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  assignedTo === 'me' && styles.selectedOption,
                ]}
                onPress={() => setAssignedTo('me')}
                disabled={saving}
              >
                <Text
                  style={[
                    styles.optionText,
                    assignedTo === 'me' && styles.selectedOptionText,
                  ]}
                >
                  You
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionButton,
                  assignedTo === 'friend' && styles.selectedOption,
                ]}
                onPress={() => setAssignedTo('friend')}
                disabled={saving}
              >
                <Text
                  style={[
                    styles.optionText,
                    assignedTo === 'friend' && styles.selectedOptionText,
                  ]}
                >
                  {friendName}
                </Text>
              </TouchableOpacity>
            </View>

            {/* GOAL TYPE TOGGLE WITH HIGH CONTRAST */}
            <Text style={styles.label}>Goal Type</Text>
            <View style={styles.switchRow}>
              <Text style={styles.switchTitle}>
                {isVerifiable ? 'Photo Verification' : 'Check-Off'}
              </Text>
              <Switch
                value={isVerifiable}
                onValueChange={setIsVerifiable}
                trackColor={{ false: '#C7967D', true: '#729AB5' }}
                thumbColor="#FFFDF6"
                disabled={saving}
              />
            </View>

            {/* ACTION ROW */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.addGoalBtn, saving && styles.disabledButton]}
                onPress={handleCreateGoal}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.addGoalBtnText}>Add Goal</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.infoCircleBtn}
                onPress={() => setShowTip(!showTip)}
              >
                <Text style={styles.infoCircleText}>?</Text>
              </TouchableOpacity>
            </View>

            {/* TIP BOX / EXPLANATION */}
            {showTip && (
              <View style={styles.tipBox}>
                <View style={styles.tipHeaderRow}>
                  <Text style={styles.tipTitle}>Photo Verification:</Text>
                  <TouchableOpacity onPress={() => setShowTip(false)}>
                    <Ionicons name="close" size={18} color="#C7967D" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.tipText}>
                  The person completing the goal sends a photo to the goal checker.
                  Then, the goal checker verifies the completion of the goal.
                </Text>

                <Text style={[styles.tipTitle, { marginTop: 10 }]}>Check-Off:</Text>
                <Text style={styles.tipText}>
                  The person completing the goal checks off the goal with no
                  verification required from the other person.
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  loadingContainer: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    fontFamily: 'Itim',
    marginTop: 12,
    fontSize: 16,
    color: '#824A20',
  },

  modalCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#FDF5E6',
    borderRadius: 32,
    borderWidth: 4,
    borderColor: '#C7967D',
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  modalTitle: {
    fontFamily: 'Itim',
    fontSize: 22,
    color: '#824A20',
    fontWeight: '700',
  },

  label: {
    fontFamily: 'Itim',
    fontSize: 14,
    fontWeight: '700',
    color: '#824A20',
    marginTop: 12,
    marginBottom: 6,
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#C7967D',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: 'Itim',
    fontSize: 15,
    color: '#824A20',
  },

  optionRow: {
    flexDirection: 'row',
    gap: 10,
  },

  optionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#C7967D',
    borderRadius: 24,
    paddingVertical: 10,
    alignItems: 'center',
  },

  selectedOption: {
    backgroundColor: '#C7967D',
  },

  optionText: {
    fontFamily: 'Itim',
    fontSize: 14,
    fontWeight: '700',
    color: '#824A20',
  },

  selectedOptionText: {
    color: '#FFFFFF',
  },

  switchRow: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#C7967D',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  switchTitle: {
    fontFamily: 'Itim',
    fontSize: 14,
    color: '#824A20',
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },

  addGoalBtn: {
    flex: 1,
    backgroundColor: '#729AB5',
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  addGoalBtnText: {
    fontFamily: 'Itim',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  infoCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#C7967D',
    justifyContent: 'center',
    alignItems: 'center',
  },

  infoCircleText: {
    fontFamily: 'Itim',
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },

  disabledButton: {
    opacity: 0.6,
  },

  tipBox: {
    marginTop: 16,
    backgroundColor: '#FFFDF6',
    borderWidth: 2.5,
    borderColor: '#C7967D',
    borderRadius: 20,
    padding: 14,
  },

  tipHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  tipTitle: {
    fontFamily: 'Itim',
    fontSize: 13,
    fontWeight: '700',
    color: '#824A20',
  },

  tipText: {
    fontFamily: 'Itim',
    fontSize: 12,
    color: '#824A20',
    marginTop: 2,
    lineHeight: 16,
  },
});