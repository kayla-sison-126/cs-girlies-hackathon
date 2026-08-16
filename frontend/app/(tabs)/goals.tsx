import React, { useEffect, useState } from 'react';
import { setLastTab } from '../../lib/lastTab';
import {
  StyleSheet,
  Text,
  View,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';

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

  const [fontsLoaded] = useFonts({
    Itim: require('../../assets/fonts/Itim.ttf'),
  });

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingGoal, setCompletingGoal] = useState<string | null>(null);

  useEffect(() => {
    loadGoals();
  }, []);

  useEffect(() => {
    setLastTab('/(tabs)/goals');
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

  if (!fontsLoaded || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color="#824A20"
          />
          <Text style={styles.loadingText}>
            Loading your goals...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const dailyGoals = goals.filter((g) => g.completed_by === null);
  const completedGoals = goals.filter((g) => g.completed_by !== null);

  const sections = [
    { title: 'Your Daily Goals', data: dailyGoals },
    { title: 'Completed Goals', data: completedGoals },
  ];

  return (
    <View style={styles.container}>
      {/* Hide default Expo Router tab bar */}
      <Tabs.Screen options={{ tabBarStyle: { display: 'none' } }} />

      {/* Full-width Grass Hill background */}
      <View style={styles.grassWrapper} pointerEvents="none">
        <Image
          source={require('../../assets/images/GrassHill.png')}
          style={styles.grassHillBackground}
          resizeMode="stretch"
        />
      </View>

      <SafeAreaView style={{ flex: 1, zIndex: 10 }}>
        {goals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.emptyTitle}>No goals yet</Text>
            <Text style={styles.emptyText}>
              Create a goal with a streak buddy to get started!
            </Text>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            onRefresh={loadGoals}
            refreshing={loading}
            showsVerticalScrollIndicator={false}
            renderSectionHeader={({ section: { title, data } }) => {
              if (data.length === 0) return null;
              return <Text style={styles.sectionHeader}>{title}</Text>;
            }}
            renderItem={({ item }) => {
              const isDone = item.completed_by !== null;

              return (
                <View style={[styles.goalCard, isDone && styles.completedCard]}>
                  <View style={styles.goalInfo}>
                    <Text style={styles.goalTitle}>{item.title}</Text>
                    <Text style={styles.cardSubText}>
                      Goal Checker: {item.friendName}
                    </Text>
                    <Text style={styles.cardSubText}>
                      Type: {item.is_verifiable ? 'Photo Verification' : 'Check-off'}
                    </Text>
                  </View>

                  {isDone ? (
                    <View style={styles.doneBtn}>
                      <Text style={styles.actionBtnText}>Done!</Text>
                    </View>
                  ) : item.is_verifiable ? (
                    <TouchableOpacity
                      style={styles.blueActionBtn}
                      activeOpacity={0.8}
                      onPress={() => {
                        router.push({
                          pathname: '/(tabs)/camera',
                          params: {
                            friendshipId: item.friendship_id,
                            goalId: item.id,
                            returnTo: '/(tabs)/goals',
                          },
                        } as any);
                      }}
                    >
                      <Ionicons name="camera-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.actionBtnText}>Take Proof</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.blueActionBtn}
                      activeOpacity={0.8}
                      disabled={completingGoal === item.id}
                      onPress={() => handleCompleteGoal(item.id)}
                    >
                      {completingGoal === item.id ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : (
                        <Text style={styles.actionBtnText}>Mark as Complete</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              );
            }}
          />
        )}

        {/* Elevated Arched Bottom Navigation Bar */}
        <View style={styles.bottomNavContainer}>
          <TouchableOpacity
            style={[styles.navCircleButton, styles.sideNavButton]}
            onPress={() => router.push('/(tabs)' as any)}
            activeOpacity={0.85}
          >
            <Ionicons name="people-outline" size={36} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navCircleButton, styles.centerNavButton]}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-done-outline" size={38} color="#F8DC81" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navCircleButton, styles.sideNavButton]}
            onPress={() => router.push('/(tabs)/camera' as any)}
            activeOpacity={0.85}
          >
            <Ionicons name="camera-outline" size={36} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D2E7F5',
  },

  grassWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: 180,
    zIndex: 1,
  },

  grassHillBackground: {
    width: '100%',
    height: '100%',
  },

  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 180,
  },

  sectionHeader: {
    fontFamily: 'Itim',
    fontSize: 22,
    fontWeight: '700',
    color: '#824A20',
    marginTop: 12,
    marginBottom: 12,
  },

  goalCard: {
    backgroundColor: '#FFFDF6',
    borderRadius: 28,
    borderWidth: 3.5,
    borderColor: '#C7967D',
    padding: 18,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#8a6b59',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },

  completedCard: {
    backgroundColor: '#E4DDD3',
    borderColor: '#C7967D',
    opacity: 0.9,
  },

  goalInfo: {
    flex: 1,
    marginRight: 12,
  },

  goalTitle: {
    fontFamily: 'Itim',
    fontSize: 18,
    fontWeight: '700',
    color: '#824A20',
    marginBottom: 4,
  },

  cardSubText: {
    fontFamily: 'Itim',
    fontSize: 12,
    color: '#824A20',
    marginTop: 1,
  },

  blueActionBtn: {
    backgroundColor: '#729AB5',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 105,
    justifyContent: 'center',
  },

  doneBtn: {
    backgroundColor: '#A8B8C2',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  actionBtnText: {
    fontFamily: 'Itim',
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  bottomNavContainer: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    zIndex: 20,
  },

  navCircleButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#C7967D',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8a6b59',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
  },

  sideNavButton: {
    transform: [{ translateY: 0 }],
  },

  centerNavButton: {
    transform: [{ translateY: -18 }],
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    fontFamily: 'Itim',
    marginTop: 12,
    fontSize: 16,
    color: '#824A20',
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
    fontFamily: 'Itim',
    fontSize: 22,
    fontWeight: '700',
    color: '#824A20',
    marginBottom: 8,
  },

  emptyText: {
    fontFamily: 'Itim',
    fontSize: 14,
    color: '#824A20',
    textAlign: 'center',
    lineHeight: 20,
  },
});