import React, { useState } from 'react';
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
import { supabase } from '../../../lib/supabase';

export default function CreateGoalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isVerifiable, setIsVerifiable] = useState(true);
  const [saving, setSaving] = useState(false);

  async function createGoal() {
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

      setSaving(true);

      /*
       * Get the currently logged-in user.
       */
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          'You must be logged in to create a goal.'
        );
      }

      /*
       * Create the goal in Supabase.
       */
      const { error: goalError } = await supabase
        .from('goals')
        .insert({
          friendship_id: id,
          created_by: user.id,
          title: title.trim(),
          description:
            description.trim() || null,
          is_verifiable: isVerifiable,
        });

      if (goalError) {
        throw goalError;
      }

      Alert.alert(
        'Goal Created!',
        'Your new accountability goal has been added.'
      );

      /*
       * Return to the friendship page.
       */
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

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Create Goal',
        }}
      />

      <View style={styles.content}>
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

        <View style={styles.switchRow}>
          <View style={styles.switchTextContainer}>
            <Text style={styles.switchTitle}>
              Require photo proof
            </Text>

            <Text style={styles.switchDescription}>
              Your friend will review a photo before
              the goal is verified.
            </Text>
          </View>

          <Switch
            value={isVerifiable}
            onValueChange={setIsVerifiable}
            disabled={saving}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.createButton,
            saving && styles.disabledButton,
          ]}
          onPress={createGoal}
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

  switchRow: {
    marginTop: 24,
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