import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import {
  getAllUserGoals,
  completeGoal,
} from '../../lib/goals';

import { getFriendProfile } from '../../lib/friendships';

type Goal = {
  id: string;
  friendship_id: string;
  created_by: string;
  title: string;
  description: string | null;
  is_verifiable: boolean;
  completed_by: string | null;
  completed_at: string | null;
  created_at: string;
  friendName: string;
};

export default function AllGoalsScreen() {
  const router = useRouter();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingGoal, setCompletingGoal] = useState<string | null>(null);

  useEffect(() => {
    loadGoals();
  }, []);

  async function loadGoals() {
    try {
      setLoading(true);

      const {
        goals: goalData,
        friendships,
        userId,
      } = await getAllUserGoals();

      if (!goalData || goalData.length === 0) {
        setGoals([]);
        return;
      }

      const formattedGoals = await Promise.all(
        goalData.map(async (goal) => {
          const friendship = friendships.find(
            (friendship) =>
              friendship.id === goal.friendship_id
          );

          if (!friendship) {
            return null;
          }

          const friendId =
            friendship.user_a_id === userId
              ? friendship.user_b_id
              : friendship.user_a_id;

          let friendName = 'Friend';

          if (friendId) {
            const profile =
              await getFriendProfile(friendId);

            if (profile?.username) {
              friendName = profile.username;
            }
          }

          return {
            ...goal,
            friendName,
          };
        })
      );

      setGoals(
        formattedGoals.filter(
          (goal): goal is Goal => goal !== null
        )
      );
    } catch (error) {
      console.error(
        'Failed to load goals:',
        error
      );

      Alert.alert(
        'Error',
        'Could not load your goals.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteGoal(goalId: string) {
    try {
      setCompletingGoal(goalId);

      const result = await completeGoal(goalId);

      setGoals((currentGoals) =>
        currentGoals.map((goal) =>
          goal.id === goalId
            ? {
                ...goal,
                completed_by:
                  result.completed_by ?? 'completed',
                completed_at:
                  result.completed_at ??
                  new Date().toISOString(),
              }
            : goal
        )
      );
    } catch (error) {
      console.error(
        'Failed to complete goal:',
        error
      );

      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Could not complete this goal.'
      );
    } finally {
      setCompletingGoal(null);
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
            Loading your goals...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.title}>
          All Goals 📋
        </Text>

        <Text style={styles.subtitle}>
          Your master accountability checklist
        </Text>
      </View>

      {goals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>
            🎯
          </Text>

          <Text style={styles.emptyTitle}>
            No goals yet
          </Text>

          <Text style={styles.emptyText}>
            Create a goal with a streak buddy
            to get started!
          </Text>
        </View>
      ) : (
        <FlatList
          data={goals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          onRefresh={loadGoals}
          refreshing={loading}
          renderItem={({ item }) => {
            const isDone =
              item.completed_by !== null;

            return (
              <View
                style={[
                  styles.goalCard,
                  isDone &&
                    styles.completedCard,
                ]}
              >
                <View style={styles.goalInfo}>
                  <Text
                    style={[
                      styles.goalTitle,
                      isDone &&
                        styles.completedText,
                    ]}
                  >
                    {item.title}
                  </Text>

                  <Text
                    style={styles.friendTag}
                  >
                    Buddy: {item.friendName}
                  </Text>

                  {item.is_verifiable &&
                    !isDone && (
                      <Text
                        style={
                          styles.proofLabel
                        }
                      >
                        📷 Photo proof required
                      </Text>
                    )}
                </View>

                {isDone ? (
                  <View
                    style={styles.doneBadge}
                  >
                    <Text
                      style={styles.doneText}
                    >
                      ✓ Completed
                    </Text>
                  </View>
                ) : item.is_verifiable ? (
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      styles.photoBtn,
                    ]}
                    onPress={() => {
                      router.push({
                        pathname:
                          '/(tabs)/camera',
                        params: {
                          friendshipId:
                            item.friendship_id,
                          goalId: item.id,
                        },
                      } as any);
                    }}
                  >
                    <Text
                      style={styles.btnText}
                    >
                      📷 Proof
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      styles.checkBtn,
                    ]}
                    disabled={
                      completingGoal ===
                      item.id
                    }
                    onPress={() =>
                      handleCompleteGoal(
                        item.id
                      )
                    }
                  >
                    {completingGoal ===
                    item.id ? (
                      <ActivityIndicator
                        color="#FFF"
                      />
                    ) : (
                      <Text
                        style={styles.btnText}
                      >
                        ✅ Complete
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
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

  goalCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 1,
  },

  completedCard: {
    backgroundColor: '#F0F4F8',
    opacity: 0.8,
  },

  goalInfo: {
    flex: 1,
    marginRight: 10,
  },

  goalTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },

  completedText: {
    textDecorationLine: 'line-through',
    color: '#888',
  },

  friendTag: {
    fontSize: 12,
    color: '#4A90E2',
    marginTop: 4,
    fontWeight: '600',
  },

  proofLabel: {
    fontSize: 11,
    color: '#FF6B6B',
    marginTop: 5,
    fontWeight: '600',
  },

  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
  },

  photoBtn: {
    backgroundColor: '#FF6B6B',
  },

  checkBtn: {
    backgroundColor: '#4CAF50',
  },

  btnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },

  doneBadge: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },

  doneText: {
    color: '#2E7D32',
    fontWeight: 'bold',
    fontSize: 12,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
});
