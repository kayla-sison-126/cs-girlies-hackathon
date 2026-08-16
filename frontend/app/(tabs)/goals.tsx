
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
  Modal,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';

import {
  getAllUserGoals,
  completeGoal,
} from '../../lib/goals';

import { getFriendProfile } from '../../lib/friendships';
import { supabase } from '../../lib/supabase';

// Fixed demo image.
// Put the image at:
// assets/images/demo-image.jpg
const DEMO_PROOF_IMAGE = require('../../assets/images/demo-image.jpg');

type Goal = {
  id: string;
  friendship_id: string;
  created_by: string;
  assigned_to: string;
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

  const [completingGoal, setCompletingGoal] =
    useState<string | null>(null);

  // Current logged-in user
  const [currentUserId, setCurrentUserId] =
    useState<string | null>(null);

  // Demo verification modal
  const [reviewModalVisible, setReviewModalVisible] =
    useState(false);

  const [selectedGoal, setSelectedGoal] =
    useState<Goal | null>(null);

  const [reviewingGoal, setReviewingGoal] =
    useState(false);

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

      setCurrentUserId(userId);

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
          (goal): goal is Goal =>
            goal !== null
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

  /*
   * ------------------------------------------------
   * NORMAL CHECK-OFF GOAL
   * ------------------------------------------------
   *
   * Used when the goal does NOT require photo
   * verification.
   */
  async function handleCompleteGoal(
    goalId: string
  ) {
    try {
      setCompletingGoal(goalId);

      const result =
        await completeGoal(goalId);

      setGoals((currentGoals) =>
        currentGoals.map((goal) =>
          goal.id === goalId
            ? {
                ...goal,
                completed_by:
                  result.completed_by ??
                  currentUserId ??
                  'completed',
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

  /*
   * ------------------------------------------------
   * OPEN DEMO VERIFICATION
   * ------------------------------------------------
   *
   * We intentionally do NOT query goal_proofs here.
   *
   * For the demo, every verifiable goal uses the
   * same local demo image.
   */
  function handleVerifyGoal(goal: Goal) {
    setSelectedGoal(goal);
    setReviewModalVisible(true);
  }

  /*
   * ------------------------------------------------
   * APPROVE DEMO PROOF
   * ------------------------------------------------
   *
   * The creator is verifying the friend's goal.
   *
   * The assigned friend receives the completed_by
   * value because they are the person who completed
   * the goal.
   */
  async function handleApproveGoal() {
    if (!selectedGoal) {
      return;
    }

    try {
      setReviewingGoal(true);

      const now =
        new Date().toISOString();

      const {
        data: completedGoal,
        error,
      } = await supabase
        .from('goals')
        .update({
          completed_by:
            selectedGoal.assigned_to,
          completed_at: now,
        })
        .eq('id', selectedGoal.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      /*
       * Update the UI immediately.
       */
      setGoals((currentGoals) =>
        currentGoals.map((goal) =>
          goal.id === selectedGoal.id
            ? {
                ...goal,
                completed_by:
                  completedGoal.completed_by ??
                  selectedGoal.assigned_to,
                completed_at:
                  completedGoal.completed_at ??
                  now,
              }
            : goal
        )
      );

      /*
       * Close the modal.
       */
      setReviewModalVisible(false);
      setSelectedGoal(null);

      Alert.alert(
        'Goal Verified!',
        'The goal has been checked off successfully.'
      );
    } catch (error: any) {
      console.error(
        'Failed to approve goal:',
        error
      );

      Alert.alert(
        'Verification Failed',
        error?.message ??
          'Could not check off this goal.'
      );
    } finally {
      setReviewingGoal(false);
    }
  }

  /*
   * ------------------------------------------------
   * REJECT DEMO PROOF
   * ------------------------------------------------
   *
   * For the demo, simply close the verification
   * window. The goal stays incomplete.
   */
  function handleRejectGoal() {
    if (reviewingGoal) {
      return;
    }

    setReviewModalVisible(false);
    setSelectedGoal(null);
  }

  /*
   * ------------------------------------------------
   * CLOSE MODAL
   * ------------------------------------------------
   */
  function closeReviewModal() {
    if (reviewingGoal) {
      return;
    }

    setReviewModalVisible(false);
    setSelectedGoal(null);
  }

  /*
   * ------------------------------------------------
   * LOADING
   * ------------------------------------------------
   */
  if (!fontsLoaded || loading) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View
          style={styles.loadingContainer}
        >
          <ActivityIndicator
            size="large"
            color="#824A20"
          />

          <Text
            style={styles.loadingText}
          >
            Loading your goals...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /*
   * ------------------------------------------------
   * GOAL SECTIONS
   * ------------------------------------------------
   */
  const dailyGoals = goals.filter(
    (goal) =>
      goal.completed_by === null
  );

  const completedGoals = goals.filter(
    (goal) =>
      goal.completed_by !== null
  );

  const sections = [
    {
      title: 'Your Daily Goals',
      data: dailyGoals,
    },
    {
      title: 'Completed Goals',
      data: completedGoals,
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />

      <Tabs.Screen
        options={{
          tabBarStyle: {
            display: 'none',
          },
        }}
      />

      {/* Grass background */}
      <View
        style={styles.grassWrapper}
        pointerEvents="none"
      >
        <Image
          source={require('../../assets/images/GrassHill.png')}
          style={
            styles.grassHillBackground
          }
          resizeMode="stretch"
        />
      </View>

      <SafeAreaView
        style={{
          flex: 1,
          zIndex: 10,
        }}
      >
        {goals.length === 0 ? (
          <View
            style={styles.emptyContainer}
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
              Create a goal with a streak
              buddy to get started!
            </Text>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) =>
              item.id
            }
            contentContainerStyle={
              styles.listContainer
            }
            onRefresh={loadGoals}
            refreshing={loading}
            showsVerticalScrollIndicator={
              false
            }
            renderSectionHeader={({
              section: {
                title,
                data,
              },
            }) => {
              if (data.length === 0) {
                return null;
              }

              return (
                <Text
                  style={
                    styles.sectionHeader
                  }
                >
                  {title}
                </Text>
              );
            }}
            renderItem={({ item }) => {
              const isDone =
                item.completed_by !==
                null;

              const isGoalCreator =
                item.created_by ===
                currentUserId;

              const isAssignedFriend =
                item.assigned_to ===
                currentUserId;

              return (
                <View
                  style={[
                    styles.goalCard,
                    isDone &&
                      styles.completedCard,
                  ]}
                >
                  <View
                    style={
                      styles.goalInfo
                    }
                  >
                    <Text
                      style={
                        styles.goalTitle
                      }
                    >
                      {item.title}
                    </Text>

                    <Text
                      style={
                        styles.cardSubText
                      }
                    >
                      Goal Checker:{' '}
                      {item.friendName}
                    </Text>

                    <Text
                      style={
                        styles.cardSubText
                      }
                    >
                      Type:{' '}
                      {item.is_verifiable
                        ? 'Photo Verification'
                        : 'Check-off'}
                    </Text>
                  </View>

                  {/* COMPLETED */}
                  {isDone ? (
                    <View
                      style={
                        styles.doneBtn
                      }
                    >
                      <Text
                        style={
                          styles.actionBtnText
                        }
                      >
                        Done!
                      </Text>
                    </View>
                  ) : (
                    <>
                      {/* CREATOR */}
                      {isGoalCreator ? (
                        item.is_verifiable ? (
                          <TouchableOpacity
                            style={
                              styles.blueActionBtn
                            }
                            activeOpacity={
                              0.8
                            }
                            onPress={() =>
                              handleVerifyGoal(
                                item
                              )
                            }
                            disabled={
                              reviewingGoal
                            }
                          >
                            <Ionicons
                              name="eye-outline"
                              size={18}
                              color="#FFFFFF"
                            />

                            <Text
                              style={
                                styles.actionBtnText
                              }
                            >
                              Verify
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            style={
                              styles.blueActionBtn
                            }
                            activeOpacity={
                              0.8
                            }
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
                                size="small"
                              />
                            ) : (
                              <Text
                                style={
                                  styles.actionBtnText
                                }
                              >
                                Verify Goal
                              </Text>
                            )}
                          </TouchableOpacity>
                        )
                      ) : null}

                      {/* ASSIGNED FRIEND */}
                      {isAssignedFriend &&
                      !isGoalCreator ? (
                        <View
                          style={
                            styles.waitingBtn
                          }
                        >
                          <Text
                            style={
                              styles.waitingText
                            }
                          >
                            Waiting for
                            verification
                          </Text>
                        </View>
                      ) : null}
                    </>
                  )}
                </View>
              );
            }}
          />
        )}

        {/* =================================================
            DEMO PROOF VERIFICATION MODAL
            ================================================= */}
        <Modal
          visible={
            reviewModalVisible
          }
          transparent
          animationType="slide"
          onRequestClose={
            closeReviewModal
          }
        >
          <View
            style={
              styles.modalOverlay
            }
          >
            <View
              style={
                styles.reviewModal
              }
            >
              {/* Header */}
              <View
                style={
                  styles.reviewHeader
                }
              >
                <View
                  style={{
                    flex: 1,
                  }}
                >
                  <Text
                    style={
                      styles.reviewTitle
                    }
                  >
                    Verify Goal
                  </Text>

                  {selectedGoal && (
                    <Text
                      style={
                        styles.reviewGoalTitle
                      }
                    >
                      {selectedGoal.title}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={
                    styles.closeModalBtn
                  }
                  onPress={
                    closeReviewModal
                  }
                  disabled={
                    reviewingGoal
                  }
                >
                  <Ionicons
                    name="close"
                    size={26}
                    color="#824A20"
                  />
                </TouchableOpacity>
              </View>

              {/* Fixed demo image */}
              <View
                style={
                  styles.proofImageContainer
                }
              >
                <Image
                  source={
                    DEMO_PROOF_IMAGE
                  }
                  style={
                    styles.proofImage
                  }
                  resizeMode="cover"
                />
              </View>

              {/* Instruction */}
              <Text
                style={
                  styles.proofInstruction
                }
              >
                Does this photo prove that
                the goal was completed?
              </Text>

              {/* Buttons */}
              <View
                style={
                  styles.reviewButtons
                }
              >
                <TouchableOpacity
                  style={
                    styles.rejectBtn
                  }
                  disabled={
                    reviewingGoal
                  }
                  onPress={
                    handleRejectGoal
                  }
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={22}
                    color="#824A20"
                  />

                  <Text
                    style={
                      styles.rejectBtnText
                    }
                  >
                    Reject
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={
                    styles.approveBtn
                  }
                  disabled={
                    reviewingGoal
                  }
                  onPress={
                    handleApproveGoal
                  }
                >
                  {reviewingGoal ? (
                    <ActivityIndicator
                      color="#FFFFFF"
                    />
                  ) : (
                    <>
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={22}
                        color="#FFFFFF"
                      />

                      <Text
                        style={
                          styles.approveBtnText
                        }
                      >
                        Approve
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* =================================================
            BOTTOM NAVIGATION
            ================================================= */}
        <View
          style={
            styles.bottomNavContainer
          }
        >
          <TouchableOpacity
            style={[
              styles.navCircleButton,
              styles.sideNavButton,
            ]}
            onPress={() =>
              router.push(
                '/(tabs)' as any
              )
            }
            activeOpacity={0.85}
          >
            <Ionicons
              name="people-outline"
              size={36}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navCircleButton,
              styles.centerNavButton,
            ]}
            activeOpacity={0.85}
          >
            <Ionicons
              name="checkmark-done-outline"
              size={38}
              color="#F8DC81"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navCircleButton,
              styles.sideNavButton,
            ]}
            onPress={() =>
              router.push(
                '/(tabs)/camera' as any
              )
            }
            activeOpacity={0.85}
          >
            <Ionicons
              name="camera-outline"
              size={36}
              color="#FFFFFF"
            />
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
    backgroundColor: '#FEF9F0',
    borderRadius: 28,
    borderWidth: 3.5,
    borderColor: '#C7967D',
    padding: 18,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#8a6b59',
    shadowOffset: {
      width: 0,
      height: 3,
    },
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

  waitingBtn: {
    backgroundColor: '#D8D0C7',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 145,
  },

  waitingText: {
    fontFamily: 'Itim',
    fontSize: 11,
    fontWeight: '700',
    color: '#824A20',
    textAlign: 'center',
  },

  /* =================================================
     DEMO VERIFICATION MODAL
     ================================================= */

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },

  reviewModal: {
    backgroundColor: '#FEF9F0',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 35,
    maxHeight: '90%',
    borderWidth: 4,
    borderBottomWidth: 0,
    borderColor: '#C7967D',
  },

  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  reviewTitle: {
    fontFamily: 'Itim',
    fontSize: 24,
    fontWeight: '700',
    color: '#824A20',
  },

  reviewGoalTitle: {
    fontFamily: 'Itim',
    fontSize: 15,
    color: '#824A20',
    marginTop: 2,
  },

  closeModalBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3E5D8',
  },

  proofImageContainer: {
    width: '100%',
    height: 360,
    backgroundColor: '#E8E1D9',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#D8BDAA',
  },

  proofImage: {
    width: '100%',
    height: '100%',
  },

  proofInstruction: {
    fontFamily: 'Itim',
    fontSize: 16,
    color: '#824A20',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 15,
  },

  reviewButtons: {
    flexDirection: 'row',
    gap: 12,
  },

  rejectBtn: {
    flex: 1,
    backgroundColor: '#F3E5D8',
    borderRadius: 24,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: '#C7967D',
  },

  rejectBtnText: {
    fontFamily: 'Itim',
    fontSize: 16,
    fontWeight: '700',
    color: '#824A20',
  },

  approveBtn: {
    flex: 1,
    backgroundColor: '#729AB5',
    borderRadius: 24,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },

  approveBtnText: {
    fontFamily: 'Itim',
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* =================================================
     BOTTOM NAVIGATION
     ================================================= */

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
    borderWidth: 3,
    borderColor: '#FEF9F0',
    backgroundColor: '#C7967D',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8a6b59',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
  },

  sideNavButton: {
    transform: [
      {
        translateY: 0,
      },
    ],
  },

  centerNavButton: {
    transform: [
      {
        translateY: -18,
      },
    ],
  },

  /* =================================================
     LOADING
     ================================================= */

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

  /* =================================================
     EMPTY STATE
     ================================================= */

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
