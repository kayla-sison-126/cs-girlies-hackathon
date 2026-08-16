
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  useLocalSearchParams,
  useRouter,
  Stack,
  useFocusEffect,
} from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import {
  getCurrentUser,
  getFriendship,
  getFriendId,
  getFriendProfile,
  getFriendshipPet,
  getUserStats,
} from '../../../lib/friendships';

import { getGoals } from '../../../lib/goals';
import { getLatestGoalProofStatus } from '../../../lib/proofs';

interface AccountabilityGoal {
  id: string;
  title: string;
  completed: boolean;
  verifiedByFriend: boolean;
  isVerifiable: boolean;
}

export default function FriendshipHomeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [friendName, setFriendName] = useState('Your Buddy');

  const [petName, setPetName] = useState('Buddy');
  const [heartCount, setHeartCount] = useState(3);
  const [streakDays, setStreakDays] = useState(0);
  const [coins, setCoins] = useState(0);

  const [goals, setGoals] = useState<AccountabilityGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
  useCallback(() => {
    loadFriendship();
  }, [id])
);

  async function loadFriendship() {
    try {
      setLoading(true);

      if (!id) {
        throw new Error('Friendship ID is missing.');
      }

      /*
       * ------------------------------------------------
       * 1. GET CURRENT USER
       * ------------------------------------------------
       */

      const user = await getCurrentUser();

      /*
       * ------------------------------------------------
       * 2. GET FRIENDSHIP
       * ------------------------------------------------
       */

      await getFriendship(id);

      /*
       * ------------------------------------------------
       * 3. GET FRIEND'S PROFILE
       * ------------------------------------------------
       */

      const friendId = await getFriendId(
        id,
        user.id
      );

      const profile =
        await getFriendProfile(friendId);

      setFriendName(
        profile?.username || 'Your Buddy'
      );

      /*
       * ------------------------------------------------
       * 4. GET SHARED PET
       * ------------------------------------------------
       */

      const pet = await getFriendshipPet(id);
      

      if (pet) {
        setPetName(pet.name || 'Buddy');

        /*
         * Pet health is stored from 0-100.
         * Convert it to 0-3 hearts for the UI.
         */

        const health = pet.health ?? 100;

        const hearts = Math.max(
          0,
          Math.min(
            3,
            Math.ceil(health / 33.34)
          )
        );

        setHeartCount(hearts);
      }

      /*
       * ------------------------------------------------
       * 5. GET USER STATS
       * ------------------------------------------------
       */

      const stats =
        await getUserStats(user.id);

      if (stats) {
        setStreakDays(
          stats.streak_days || 0
        );

        setCoins(
          stats.points || 0
        );
      }

      /*
       * ------------------------------------------------
       * 6. GET GOALS
       * ------------------------------------------------
       */

      const goalData =
        await getGoals(id);

      /*
       * ------------------------------------------------
       * 7. GET LATEST PROOF STATUS
       * ------------------------------------------------
       */

      const formattedGoals =
        await Promise.all(
          (goalData || []).map(
            async (goal) => {
              const proofStatus =
                await getLatestGoalProofStatus(
                  goal.id
                );

              return {
                id: goal.id,
                title: goal.title,
                isVerifiable:
                  goal.is_verifiable,
                completed:
                  goal.completed_by !== null,
                verifiedByFriend:
                  proofStatus === 'approved',
              };
            }
          )
        );

      setGoals(formattedGoals);
    } catch (error) {
      console.error(
        'Failed to load friendship:',
        error
      );

      Alert.alert(
        'Error',
        'Could not load this friendship.'
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * Render the pet's health as 3 hearts.
   */

  const renderHearts = () => {
    const hearts = [];

    for (let i = 1; i <= 3; i++) {
      hearts.push(
        <Ionicons
          key={i}
          name={
            i <= heartCount
              ? 'heart'
              : 'heart-outline'
          }
          size={24}
          color="#FF7675"
        />
      );
    }

    return hearts;
  };

  if (loading) {
    return (
      <View
        style={styles.loadingContainer}
      >
        <ActivityIndicator
          size="large"
          color="#6C5CE7"
        />

        <Text
          style={styles.loadingText}
        >
          Loading friendship...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: `${friendName} & You`,

          headerRight: () => (
            <TouchableOpacity
              style={styles.shopHeaderBtn}
              onPress={() =>
                router.push(
                  `/friendship/${id}/shop`
                )
              }
              activeOpacity={0.7}
            >
              <Ionicons
                name="bag-handle"
                size={18}
                color="#6C5CE7"
              />

              <Text
                style={styles.shopBtnText}
              >
                Shop
              </Text>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
      >
        {/* TOP STATUS BAR */}

        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <Ionicons
              name="flame"
              size={20}
              color="#FF7675"
            />

            <Text style={styles.statText}>
              {streakDays} Day Streak
            </Text>
          </View>

          <View style={styles.statBadge}>
            <Ionicons
              name="sparkles"
              size={18}
              color="#FDCB6E"
            />

            <Text style={styles.statText}>
              {coins} Coins
            </Text>
          </View>
        </View>

        {/* PET HOME CARD */}

        <View style={styles.petCard}>
          <View
            style={styles.avatarContainer}
          >
            <Text style={styles.petEmoji}>
              🐐
            </Text>
          </View>

          <Text style={styles.petName}>
            {petName}
          </Text>

          <View
            style={styles.healthContainer}
          >
            <Text
              style={styles.healthLabel}
            >
              Pet Health:
            </Text>

            <View style={styles.heartsRow}>
              {renderHearts()}
            </View>
          </View>
        </View>

        {/* ACCOUNTABILITY GOALS */}

        <View style={styles.goalsSection}>
          <View
            style={styles.sectionHeader}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={styles.sectionTitle}
              >
                Your Accountability Goals
              </Text>

              <Text
                style={styles.sectionSubtitle}
              >
                Completed by you, checked off
                by {friendName}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.addGoalBtn}
              onPress={() =>
                router.push(
                  `/friendship/${id}/create-goal`
                )
              }
            >
              <Ionicons
                name="add-circle"
                size={26}
                color="#6C5CE7"
              />
            </TouchableOpacity>
          </View>

          {goals.length === 0 ? (
            <View
              style={styles.emptyGoals}
            >
              <Text
                style={styles.emptyEmoji}
              >
                🎯
              </Text>

              <Text
                style={styles.emptyTitle}
              >
                No goals yet
              </Text>

              <Text
                style={styles.emptyText}
              >
                Add an accountability goal to
                get started.
              </Text>
            </View>
          ) : (
            goals.map((item) => (
              <View
                key={item.id}
                style={styles.goalCard}
              >
                <View
                  style={styles.goalMainInfo}
                >
                  <Ionicons
                    name={
                      item.completed
                        ? 'checkmark-circle'
                        : 'ellipse-outline'
                    }
                    size={24}
                    color={
                      item.completed
                        ? '#00B894'
                        : '#B2BEC3'
                    }
                    style={styles.checkIcon}
                  />

                  <View
                    style={
                      styles.goalTextContainer
                    }
                  >
                    <Text
                      style={[
                        styles.goalTitle,
                        item.completed &&
                          styles.goalCompletedText,
                      ]}
                    >
                      {item.title}
                    </Text>

                    <Text
                      style={
                        styles.statusSubtext
                      }
                    >
                      {item.verifiedByFriend
                        ? `Verified by ${friendName}`
                        : item.completed
                        ? `Awaiting ${friendName}'s review`
                        : item.isVerifiable
                        ? 'Needs proof submission'
                        : 'Not completed yet'}
                    </Text>
                  </View>
                </View>

                {/* CAMERA PROOF BUTTON */}

                {item.isVerifiable &&
                  !item.verifiedByFriend && (
                    <TouchableOpacity
                      style={
                        styles.cameraBtn
                      }
                      onPress={() =>
                        router.push({
                          pathname:
                            '/friendship/[id]/camera',
                          params: {
                            id: id as string,
                            goalId:
                              item.id,
                            goalTitle:
                              item.title,
                          },
                        })
                      }
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="camera"
                        size={18}
                        color="#FFFFFF"
                      />

                      <Text
                        style={
                          styles.cameraBtnText
                        }
                      >
                        Snap Proof
                      </Text>
                    </TouchableOpacity>
                  )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
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
    color: '#666',
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },

  shopHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDEAFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },

  shopBtnText: {
    color: '#6C5CE7',
    fontWeight: '700',
    fontSize: 14,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },

  statText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D3436',
  },

  petCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },

  avatarContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#FFEAA7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  petEmoji: {
    fontSize: 56,
  },

  petName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 10,
  },

  healthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  healthLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#636E72',
  },

  heartsRow: {
    flexDirection: 'row',
    gap: 4,
  },

  goalsSection: {
    gap: 12,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3436',
  },

  sectionSubtitle: {
    fontSize: 12,
    color: '#636E72',
    marginTop: 2,
  },

  addGoalBtn: {
    paddingLeft: 8,
  },

  goalCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    gap: 12,
  },

  goalMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  checkIcon: {
    marginRight: 10,
  },

  goalTextContainer: {
    flex: 1,
  },

  goalTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3436',
  },

  goalCompletedText: {
    textDecorationLine: 'line-through',
    color: '#B2BEC3',
  },

  statusSubtext: {
    fontSize: 12,
    color: '#636E72',
    marginTop: 2,
  },

  cameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C5CE7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
    alignSelf: 'flex-start',
  },

  cameraBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  emptyGoals: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
  },

  emptyEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3436',
  },

  emptyText: {
    fontSize: 13,
    color: '#636E72',
    textAlign: 'center',
    marginTop: 4,
  },
});

