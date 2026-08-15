import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function PairingScreen() {
  const router = useRouter();

  const [pairingCode, setPairingCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function joinBuddy() {
    const code = pairingCode.trim();

    if (!code) {
      Alert.alert('Missing Code', 'Please enter a pairing code.');
      return;
    }

    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('You must be logged in.');
      }

      // Find the friendship using the pairing code
      const { data: friendship, error: friendshipError } =
        await supabase
          .from('friendships')
          .select('*')
          .eq('pairing_code', code)
          .maybeSingle();

      if (friendshipError) {
        throw friendshipError;
      }

      if (!friendship) {
        Alert.alert(
          'Invalid Code',
          'We could not find a friendship with that pairing code.'
        );
        return;
      }

      // Prevent joining your own pairing code
      if (
        friendship.user_a_id === user.id ||
        friendship.user_b_id === user.id
      ) {
        Alert.alert(
          'Already Connected',
          'You are already part of this friendship.'
        );
        return;
      }

      // Add the current user as user_b
      if (!friendship.user_b_id) {
        const { error: updateError } = await supabase
          .from('friendships')
          .update({
            user_b_id: user.id,
          })
          .eq('id', friendship.id);

        if (updateError) {
          throw updateError;
        }

        Alert.alert(
          'Success! 🎉',
          'You are now connected with your buddy.',
          [
            {
              text: 'Continue',
              onPress: () => {
                router.replace(`/friendship/${friendship.id}`);
              },
            },
          ]
        );

        return;
      }

      Alert.alert(
        'Already Paired',
        'This pairing code is already being used by two people.'
      );
    } catch (error) {
      console.error('Failed to join buddy:', error);

      Alert.alert(
        'Error',
        'Could not connect with this buddy. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.emoji}>🤝</Text>

          <Text style={styles.title}>
            Find Your Buddy
          </Text>

          <Text style={styles.subtitle}>
            Enter your friend's pairing code to start
            your accountability journey together.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>
            Pairing Code
          </Text>

          <TextInput
            style={styles.input}
            value={pairingCode}
            onChangeText={setPairingCode}
            placeholder="Enter code"
            placeholderTextColor="#999"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={styles.joinButton}
            onPress={joinBuddy}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.joinButtonText}>
                Join Buddy
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>
            How pairing works
          </Text>

          <Text style={styles.infoText}>
            1. Your friend creates a friendship.
          </Text>

          <Text style={styles.infoText}>
            2. They share their pairing code with you.
          </Text>

          <Text style={styles.infoText}>
            3. Enter the code here to connect.
          </Text>

          <Text style={styles.infoText}>
            4. You can then create goals and care for
            your shared pet together.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  content: {
    flex: 1,
    padding: 20,
  },

  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },

  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6C5CE7',
  },

  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },

  emoji: {
    fontSize: 56,
    marginBottom: 12,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D3436',
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 14,
    color: '#636E72',
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 8,
    maxWidth: 330,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 8,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#DCDDE1',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#2D3436',
    backgroundColor: '#FAFAFA',
    marginBottom: 14,
  },

  joinButton: {
    height: 50,
    borderRadius: 10,
    backgroundColor: '#6C5CE7',
    justifyContent: 'center',
    alignItems: 'center',
  },

  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  infoBox: {
    marginTop: 24,
    backgroundColor: '#EDEAFF',
    borderRadius: 14,
    padding: 18,
  },

  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 10,
  },

  infoText: {
    fontSize: 13,
    color: '#636E72',
    lineHeight: 21,
    marginBottom: 4,
  },
});