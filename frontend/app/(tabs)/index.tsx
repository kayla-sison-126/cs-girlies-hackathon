import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

type FriendshipCard = {
  id: string;
  friendName: string;
  petName: string;
  petEmoji: string;
  streakDays: number;
  hearts: number;
  maxHearts: number;
  coins: number;
};

export default function StreakBuddiesScreen() {
  const router = useRouter();

  const [friendships, setFriendships] = useState<FriendshipCard[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddBuddyOpen, setIsAddBuddyOpen] = useState(false);
  const [pairingCode, setPairingCode] = useState('');
  const [joiningBuddy, setJoiningBuddy] = useState(false);

  useEffect(() => {
    loadFriendships();
  }, []);

  async function loadFriendships() {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('You must be logged in.');
      }

      // Get all friendships involving the current user
      const { data: friendshipData, error: friendshipError } =
        await supabase
          .from('friendships')
          .select('*')
          .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`);

      if (friendshipError) {
        throw friendshipError;
      }

      if (!friendshipData || friendshipData.length === 0) {
        setFriendships([]);
        return;
      }

      const cards = await Promise.all(
        friendshipData.map(async (friendship) => {
          // Figure out who the other person is
          const friendId =
            friendship.user_a_id === user.id
              ? friendship.user_b_id
              : friendship.user_a_id;

          // Skip friendships where there is no second user yet
          if (!friendId) {
            return null;
          }

          // Get friend's profile
          // Your profiles table has username, not display_name.
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', friendId)
            .maybeSingle();

          // Get friend's stats
          const { data: stats } = await supabase
            .from('user_stats')
            .select('*')
            .eq('user_id', friendId)
            .maybeSingle();

          // Get the shared pet
          const { data: pet } = await supabase
            .from('pets')
            .select('*')
            .eq('friendship_id', friendship.id)
            .maybeSingle();

          // Convert pet health (0-100) into hearts (0-5)
          const health = pet?.health ?? 100;

          const hearts = Math.max(
            0,
            Math.min(5, Math.ceil(health / 20))
          );

          return {
            id: friendship.id,
            friendName: profile?.username || 'Friend',
            petName: pet?.name || 'Buddy',
            petEmoji: '🐾',
            streakDays: stats?.streak_days || 0,
            hearts,
            maxHearts: 5,
            coins: stats?.points || 0,
          };
        })
      );

      setFriendships(
        cards.filter(
          (card): card is FriendshipCard => card !== null
        )
      );
    } catch (error) {
      console.error('Failed to load friendships:', error);
      setFriendships([]);
    } finally {
      setLoading(false);
    }
  }

  async function joinBuddy() {
    const code = pairingCode.trim();

    if (!code) {
      Alert.alert(
        'Enter a pairing code',
        'Please enter your friend\'s pairing code.'
      );
      return;
    }

    try {
      setJoiningBuddy(true);

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
        throw new Error('Invalid pairing code.');
      }

      // Prevent joining your own friendship
      if (friendship.user_a_id === user.id) {
        throw new Error(
          'You cannot use your own pairing code.'
        );
      }

      // Make sure this friendship is still waiting for someone
      if (friendship.user_b_id) {
        throw new Error(
          'This pairing code has already been used.'
        );
      }

      // Join the friendship
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
        'Buddy Connected! 🎉',
        'You are now streak buddies!'
      );

      setPairingCode('');
      setIsAddBuddyOpen(false);

      await loadFriendships();
    } catch (error: any) {
      console.error('Failed to join buddy:', error);

      Alert.alert(
        'Could not connect',
        error?.message || 'Something went wrong.'
      );
    } finally {
      setJoiningBuddy(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color="#6C5CE7"
          />

          <Text style={styles.loadingText}>
            Loading your streak buddies...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>
            Streak Buddies 🐾
          </Text>

          <Text style={styles.subtitle}>
            Keep your pets alive together!
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addBuddyButton}
          onPress={() => setIsAddBuddyOpen(true)}
          activeOpacity={0.7}
        >
          <Ionicons
            name="person-add"
            size={18}
            color="#FFFFFF"
          />

          <Text style={styles.addBuddyText}>
            Add Buddy
          </Text>
        </TouchableOpacity>
      </View>

      {friendships.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🐾</Text>

          <Text style={styles.emptyTitle}>
            No streak buddies yet
          </Text>

          <Text style={styles.emptyText}>
            Pair up with a friend to start taking care of a pet
            together!
          </Text>

          <TouchableOpacity
            style={styles.emptyAddButton}
            onPress={() => setIsAddBuddyOpen(true)}
          >
            <Ionicons
              name="person-add"
              size={20}
              color="#FFFFFF"
            />

            <Text style={styles.emptyAddButtonText}>
              Add a Buddy
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={friendships}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          onRefresh={loadFriendships}
          refreshing={loading}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.7}
              onPress={() =>
                router.push(
                  `/friendship/${item.id}` as any
                )
              }
            >
              <View style={styles.cardHeader}>
                <Text style={styles.friendName}>
                  With {item.friendName}
                </Text>

                <View style={styles.badge}>
                  <Text style={styles.streakText}>
                    🔥 {item.streakDays} Days
                  </Text>
                </View>
              </View>

              <View style={styles.petSection}>
                <Text style={styles.petEmoji}>
                  {item.petEmoji}
                </Text>

                <View style={styles.petDetails}>
                  <Text style={styles.petName}>
                    {item.petName}
                  </Text>

                  <Text style={styles.subText}>
                    ❤️ {item.hearts}/{item.maxHearts}
                    {'  •  '}
                    💰 {item.coins} Coins
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={22}
                  color="#BBB"
                />
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* ADD BUDDY MODAL */}
      <Modal
        visible={isAddBuddyOpen}
        animationType="slide"
        transparent
        onRequestClose={() => {
          if (!joiningBuddy) {
            setIsAddBuddyOpen(false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  Add a Buddy 🐾
                </Text>

                <Text style={styles.modalSubtitle}>
                  Enter your friend's pairing code.
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  if (!joiningBuddy) {
                    setIsAddBuddyOpen(false);
                  }
                }}
              >
                <Ionicons
                  name="close-circle"
                  size={28}
                  color="#999"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>
              Pairing Code
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter pairing code"
              placeholderTextColor="#999"
              value={pairingCode}
              onChangeText={setPairingCode}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!joiningBuddy}
            />

            <TouchableOpacity
              style={[
                styles.joinButton,
                joiningBuddy && styles.disabledButton,
              ]}
              onPress={joinBuddy}
              disabled={joiningBuddy}
            >
              {joiningBuddy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name="people"
                    size={20}
                    color="#FFFFFF"
                  />

                  <Text style={styles.joinButtonText}>
                    Connect Buddy
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  headerBar: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  headerTextContainer: {
    flex: 1,
    marginRight: 12,
  },

  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },

  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },

  addBuddyButton: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  addBuddyText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  friendName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2C3E50',
  },

  badge: {
    backgroundColor: '#FFEBEB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  streakText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF6B6B',
  },

  petSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  petEmoji: {
    fontSize: 38,
  },

  petDetails: {
    flex: 1,
    marginLeft: 14,
  },

  petName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  subText: {
    fontSize: 13,
    color: '#666',
    marginTop: 3,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },

  emptyEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 14,
    color: '#636E72',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },

  emptyAddButton: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  emptyAddButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },

  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#444',
    marginBottom: 8,
  },

  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 16,
  },

  joinButton: {
    backgroundColor: '#6C5CE7',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  disabledButton: {
    opacity: 0.6,
  },

  joinButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});