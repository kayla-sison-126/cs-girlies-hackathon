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
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { createGoal } from '../../../lib/goals';
import {
  getCurrentUser,
  getFriendId,
  getFriendProfile,
} from '../../../lib/friendships';

export default function CreateGoalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [isVerifiable, setIsVerifiable] = useState(true);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [friendId, setFriendId] = useState<string | null>(null);
  const [friendName, setFriendName] = useState('Your Buddy');

  const [assignedTo, setAssignedTo] = useState<
    'me' | 'friend'
  >('me');

  const [loadingPeople, setLoadingPeople] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPeople();
  }, [id]);

  async function loadPeople() {
    try {
      if (!id) {
        throw new Error('Friendship ID is missing.');
      }

      setLoadingPeople(true);

      const user = await getCurrentUser();

      const otherUserId = await getFriendId(
        id,
        user.id
      );

      const profile = await getFriendProfile(
        otherUserId
      );

      setCurrentUserId(user.id);
      setFriendId(otherUserId);
      setFriendName(
        profile?.username || 'Your Buddy'
      );
    } catch (error) {
      console.error(
        'Failed to load friendship members:',
        error
      );

      Alert.alert(
        'Error',
        'Could not load the people in this friendship.'
      );
    } finally {
      setLoadingPeople(false);
    }
  }

  async function handleCreateGoal() {
    try {
      if (!id) {
        Alert.alert(
          'Error',
          'Friendship ID is missing.'
        );
        return;
      }

      if (!title.trim()) {
        Alert.alert(
          'Missing title',
          'Please enter a goal title.'
        );
        return;
      }

      if (!currentUserId || !friendId) {
        Alert.alert(
          'Error',
          'Could not determine who can complete this goal.'
        );
        return;
      }

      const selectedUserId =
        assignedTo === 'me'
          ? currentUserId
          : friendId;

      setSaving(true);

      await createGoal(
        id,
        title,
        description,
        selectedUserId,
        isVerifiable
      );

      Alert.alert(
        'Goal Created!',
        'Your new accountability goal has been added.'
      );

      router.back();
    } catch (error: any) {
      console.error(
        'Failed to create goal:',
        error
      );

      Alert.alert(
        'Could not create goal',
        error?.message ||
          'Something went wrong while creating the goal.'
      );
    } finally {
      setSaving(false);
    }
  }

  if (loadingPeople) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#6C5CE7"
        />

        <Text style={styles.loadingText}>
          Loading friendship...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Create Goal',
        }}
      />

      <View style={styles.content}>
        {/* GOAL TITLE */}

        <Text style={styles.label}>
          Goal Title
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your goal"
          value={title}
          onChangeText={setTitle}
          editable={!saving}
        />

        {/* DESCRIPTION */}

        <Text style={styles.label}>
          Description
        </Text>

        <TextInput
          style={[
            styles.input,
            styles.descriptionInput,
          ]}
          placeholder="Optional description"
          value={description}
          onChangeText={setDescription}
          multiline
          editable={!saving}
        />

        {/* WHO IS COMPLETING THE GOAL */}

        <Text style={styles.label}>
          Who is completing this goal?
        </Text>

        <View style={styles.optionRow}>
          <TouchableOpacity
            style={[
              styles.optionButton,
              assignedTo === 'me' &&
                styles.selectedOption,
            ]}
            onPress={() => setAssignedTo('me')}
            disabled={saving}
          >
            <Text
              style={[
                styles.optionText,
                assignedTo === 'me' &&
                  styles.selectedOptionText,
              ]}
            >
              You
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionButton,
              assignedTo === 'friend' &&
                styles.selectedOption,
            ]}
            onPress={() => setAssignedTo('friend')}
            disabled={saving}
          >
            <Text
              style={[
                styles.optionText,
                assignedTo === 'friend' &&
                  styles.selectedOptionText,
              ]}
            >
              {friendName}
            </Text>
          </TouchableOpacity>
        </View>

        {/* GOAL TYPE */}

        <Text style={styles.label}>
          Require photo verification?
        </Text>

        <View style={styles.switchRow}>
          <View style={styles.switchTextContainer}>
            <Text style={styles.switchTitle}>
              {isVerifiable
                ? 'Photo Verification'
                : 'Check-Off'}
            </Text>

            <Text style={styles.switchDescription}>
              {isVerifiable
                ? 'Your friend will review a photo before the goal is verified.'
                : 'The goal can be completed with a simple check-off.'}
            </Text>
          </View>

          <Switch
            value={isVerifiable}
            onValueChange={setIsVerifiable}
            disabled={saving}
          />
        </View>

        {/* CREATE GOAL */}

        <TouchableOpacity
          style={[
            styles.createButton,
            saving && styles.disabledButton,
          ]}
          onPress={handleCreateGoal}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.createButtonText}>
              Create Goal
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#636E72',
  },

  content: {
    padding: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 8,
    marginTop: 16,
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#2D3436',
  },

  descriptionInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },

  optionRow: {
    flexDirection: 'row',
    gap: 10,
  },

  optionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },

  selectedOption: {
    backgroundColor: '#EDEAFF',
    borderColor: '#6C5CE7',
  },

  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#636E72',
  },

  selectedOptionText: {
    color: '#6C5CE7',
    fontWeight: '700',
  },

  switchRow: {
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  switchTextContainer: {
    flex: 1,
    paddingRight: 12,
  },

  switchTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D3436',
  },

  switchDescription: {
    fontSize: 12,
    color: '#636E72',
    marginTop: 4,
    lineHeight: 17,
  },

  createButton: {
    backgroundColor: '#6C5CE7',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
  },

  disabledButton: {
    opacity: 0.6,
  },

  createButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});