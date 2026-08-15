import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
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

      // Get all friendships belonging to the current user
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

          // A friendship can exist before the second user joins
          if (!friendId) {
            return null;
          }

          // Get friend's profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
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
            friendName:
              profile?.display_name ||
              profile?.username ||
              'Friend',
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C5CE7" />

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
  <View>
    <Text style={styles.title}>Streak Buddies 🐾</Text>
    <Text style={styles.subtitle}>
      Keep your pets alive together!
    </Text>
  </View>

  <TouchableOpacity
    style={styles.logoutButton}
    onPress={async () => {
      await supabase.auth.signOut();
      router.replace('/auth/login');
    }}
  >
    <Text style={styles.logoutButtonText}>Log Out</Text>
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

          {/* ADD BUDDY BUTTON */}
          <TouchableOpacity
            style={styles.addBuddyButton}
            onPress={() => router.push('/pairing')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="person-add"
              size={20}
              color="#FFFFFF"
            />

            <Text style={styles.addBuddyButtonText}>
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
                router.push(`/friendship/${item.id}` as any)
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

  addBuddyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C5CE7',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },

  addBuddyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  logoutButton: {
  marginTop: 10,
  backgroundColor: '#FFE8E8',
  paddingHorizontal: 14,
  paddingVertical: 8,
  borderRadius: 10,
  alignSelf: 'flex-start',
},

logoutButtonText: {
  color: '#FF6B6B',
  fontWeight: '700',
  fontSize: 13,
},
});

