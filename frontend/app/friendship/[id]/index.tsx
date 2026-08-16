import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Dimensions,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import {
  useLocalSearchParams,
  useRouter,
  Stack,
  useFocusEffect,
} from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";

import {
  getCurrentUser,
  getFriendship,
  getFriendId,
  getFriendProfile,
  getFriendshipPet,
  getUserStats,
} from "../../../lib/friendships";

import { getGoals } from "../../../lib/goals";
import { getLatestGoalProofStatus } from "../../../lib/proofs";

interface AccountabilityGoal {
  id: string;
  title: string;
  completed: boolean;
  verifiedByFriend: boolean;
  isVerifiable: boolean;
  assignedToUser: boolean;
}

export default function FriendshipHomeScreen() {
  const { width: SCREEN_WIDTH } = Dimensions.get("window");
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Itim: require("../../../assets/fonts/Itim.ttf"),
  });

  const [friendName, setFriendName] = useState("Friend");
  const [petName, setPetName] = useState("Buttercup");
  const [heartCount, setHeartCount] = useState(4);
  const [streakDays, setStreakDays] = useState(15);
  const [coins, setCoins] = useState(410);

  const [goals, setGoals] = useState<AccountabilityGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedGoalForReview, setSelectedGoalForReview] =
    useState<AccountabilityGoal | null>(null);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadFriendship();
    }, [id]),
  );

  async function loadFriendship() {
    try {
      setLoading(true);

      if (!id) throw new Error("Friendship ID is missing.");

      const user = await getCurrentUser();
      await getFriendship(id);

      const friendId = await getFriendId(id, user.id);
      const profile = await getFriendProfile(friendId);
      setFriendName(profile?.username || "Buddy");

      const pet = await getFriendshipPet(id);
      if (pet) {
        setPetName(pet.name || "Buttercup");
        const health = pet.health ?? 100;
        const hearts = Math.max(0, Math.min(5, Math.ceil(health / 20)));
        setHeartCount(hearts);
      }

      const stats = await getUserStats(user.id);
      if (stats) {
        setStreakDays(stats.streak_days || 0);
        setCoins(stats.points || 0);
      }

      const goalData = await getGoals(id);
      const formattedGoals = await Promise.all(
        (goalData || []).map(async (goal: any) => {
          const proofStatus = await getLatestGoalProofStatus(goal.id);

          const targetUser =
            goal.assigned_to ?? goal.target_user_id ?? goal.user_id;
          const isForMe = String(targetUser) === String(user.id);

          return {
            id: goal.id,
            title: goal.title,
            isVerifiable: goal.is_verifiable,
            completed: goal.completed_by !== null,
            verifiedByFriend: proofStatus === "approved",
            assignedToUser: isForMe,
          };
        }),
      );

      setGoals(formattedGoals);
    } catch (error) {
      console.error("Failed to load friendship:", error);
      Alert.alert("Error", "Could not load this friendship.");
    } finally {
      setLoading(false);
    }
  }

  const handleOpenReviewModal = (goal: AccountabilityGoal) => {
    setSelectedGoalForReview(goal);
    setIsReviewModalVisible(true);
  };

  const handleApprove = () => {
    Alert.alert("Approved!", "Goal proof approved.");
    setIsReviewModalVisible(false);
  };

  const handleDeny = () => {
    Alert.alert("Denied", "Goal proof requested again.");
    setIsReviewModalVisible(false);
  };

  const renderHearts = () => {
    const hearts = [];
    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= heartCount;
      hearts.push(
        <View key={i} style={styles.heartContainer}>
          <Ionicons
            name="heart"
            size={20}
            color="#824A20"
            style={styles.heartBorder}
          />
          <Ionicons
            name="heart"
            size={16}
            color={isFilled ? "#E57373" : "#FCE4EC"}
            style={styles.heartInner}
          />
        </View>,
      );
    }
    return hearts;
  };

  if (loading || !fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#824A20" />
        <Text style={styles.loadingText}>Loading friendship...</Text>
      </View>
    );
  }

  const friendGoalsToReview = goals.filter((g) => !g.assignedToUser);
  const myGoals = goals.filter((g) => g.assignedToUser);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* HERO AREA */}
      <View style={styles.fixedHeroContainer}>
        {/* Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={28} color="#824A20" />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>{friendName}</Text>
            <Text style={styles.headerSubtitle}>& {petName}</Text>
          </View>

          <View style={styles.headerRightActions}>
            <TouchableOpacity
              style={styles.shopBtn}
              onPress={() => router.push(`/friendship/${id}/shop`)}
              activeOpacity={0.8}
            >
              <Ionicons name="bag-handle-outline" size={16} color="#FFFFFF" />
              <Text style={styles.shopBtnText}>Shop</Text>
            </TouchableOpacity>

            <View style={styles.coinBadge}>
              <Text style={styles.coinText}>${coins}</Text>
            </View>
          </View>
        </View>

        {/* Goat Character */}
        <View style={styles.goatContainer}>
          <Image
            source={require("../../../assets/images/friend/goat-main.png")}
            style={styles.goatImage}
            resizeMode="contain"
          />
        </View>

        {/* Hearts and Streak Row */}
        <View style={styles.statusRow}>
          <View style={styles.heartsRow}>{renderHearts()}</View>

          <View style={styles.streakBadge}>
            <Ionicons
              name="checkmark-circle-outline"
              size={18}
              color="#824A20"
            />
            <Text style={styles.streakText}>{streakDays}-Day Streak</Text>
          </View>
        </View>
      </View>

      {/* SVG GREEN HILL ARCH */}
      <View style={styles.hillArchWrapper}>
        <Svg
          height="40"
          width={SCREEN_WIDTH}
          viewBox={`0 0 ${SCREEN_WIDTH} 40`}
        >
          <Path
            d={`M 0,40 Q ${SCREEN_WIDTH / 2},-10 ${SCREEN_WIDTH},40 Z`}
            fill="#A1C99B"
          />
        </Svg>
      </View>

      {/* SCROLLABLE CARD SHEET */}
      <ScrollView
        style={styles.scrollSheet}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.scrollContent}>
          {/* GOALS FOR FRIEND */}
          <Text style={styles.sectionTitle}>{friendName}'s Goals</Text>

          {friendGoalsToReview.length === 0 ? (
            <View style={[styles.goalCard, styles.friendGoalCard]}>
              <View style={styles.goalInfo}>
                <Text style={styles.goalTitle}>No pending goals</Text>
                <Text style={styles.goalSubtext}>
                  Verification: Self-Checked
                </Text>
              </View>
            </View>
          ) : (
            friendGoalsToReview.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.goalCard,
                  styles.friendGoalCard,
                  item.completed && styles.completedGoalCard,
                ]}
              >
                <View style={styles.goalInfo}>
                  <Text style={styles.goalTitle}>{item.title}</Text>
                  <Text style={styles.goalSubtext}>
                    Type:{" "}
                    {item.isVerifiable
                      ? "Photo Verification"
                      : "Self Check-Off"}
                  </Text>
                </View>

                {item.completed ? (
                  <View style={styles.actionBtnGray}>
                    <Text style={styles.actionBtnText}>Completed</Text>
                  </View>
                ) : item.isVerifiable ? (
                  <TouchableOpacity
                    style={styles.actionBtnBlue}
                    onPress={() => handleOpenReviewModal(item)}
                  >
                    <Text style={styles.actionBtnText}>Check Photo</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))
          )}

          {/* YOUR GOALS */}
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
            Your Goals
          </Text>

          {myGoals.length === 0 ? (
            <View style={[styles.goalCard, styles.myGoalCard]}>
              <View style={styles.goalInfo}>
                <Text style={styles.goalTitle}>No goals created yet</Text>
                <Text style={styles.goalSubtext}>
                  Verification: Photo approval from {friendName}
                </Text>
              </View>
            </View>
          ) : (
            myGoals.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.goalCard,
                  styles.myGoalCard,
                  item.completed && styles.completedGoalCard,
                ]}
              >
                <View style={styles.goalInfo}>
                  <Text style={styles.goalTitle}>{item.title}</Text>
                  <Text style={styles.goalSubtext}>
                    Type:{" "}
                    {item.isVerifiable
                      ? "Photo Verification"
                      : "Self Check-Off"}
                  </Text>
                </View>

                {item.completed ? (
                  <View style={styles.actionBtnGray}>
                    <Text style={styles.actionBtnText}>Done!</Text>
                  </View>
                ) : item.isVerifiable ? (
                  <TouchableOpacity
                    style={styles.actionBtnBlue}
                    onPress={() =>
                      router.push({
                        pathname: "/friendship/[id]/camera",
                        params: {
                          id: id as string,
                          goalId: item.id,
                          goalTitle: item.title,
                        },
                      })
                    }
                  >
                    <Ionicons
                      name="camera-outline"
                      size={18}
                      color="#FFFFFF"
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.actionBtnText}>Take Proof</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))
          )}

          {/* ADD GOAL BUTTON */}
          <TouchableOpacity
            style={styles.addGoalCardBtn}
            onPress={() => router.push(`/friendship/${id}/create-goal`)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={32} color="#C7967D" />
            <Text style={styles.addGoalCardText}>Add Goal</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* CHECK GOAL PROOF MODAL */}
      <Modal
        visible={isReviewModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsReviewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Check Goal</Text>
              <TouchableOpacity onPress={() => setIsReviewModalVisible(false)}>
                <Ionicons name="close" size={24} color="#C7967D" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalGoalBox}>
              <Text style={styles.modalGoalLabel}>Goal:</Text>
              <Text style={styles.modalGoalText}>
                {selectedGoalForReview?.title || "Walk outside for 10 min"}
              </Text>
            </View>

            <View style={styles.modalImageFrame}>
              <Ionicons name="camera-outline" size={64} color="#824A20" />
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.approveBtn}
                onPress={handleApprove}
              >
                <Text style={styles.modalBtnText}>Approve</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.denyBtn} onPress={handleDeny}>
                <Text style={styles.modalBtnText}>Deny</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D2E7F5",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#D2E7F5",
  },

  loadingText: {
    fontFamily: "Itim",
    marginTop: 12,
    fontSize: 16,
    color: "#824A20",
  },

  /* FIXED TOP HERO AREA */
  fixedHeroContainer: {
    backgroundColor: "#D2E7F5",
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },

  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backBtn: {
    padding: 4,
  },

  titleContainer: {
    flex: 1,
    marginLeft: 8,
  },

  headerTitle: {
    fontFamily: "Itim",
    fontSize: 26,
    fontWeight: "700",
    color: "#824A20",
    lineHeight: 28,
  },

  headerSubtitle: {
    fontFamily: "Itim",
    fontSize: 18,
    color: "#824A20",
  },

  headerRightActions: {
    alignItems: "flex-end",
    gap: 6,
  },

  shopBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#C7967D",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    gap: 4,
  },

  shopBtnText: {
    fontFamily: "Itim",
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  coinBadge: {
    backgroundColor: "#FFFDF6",
    borderWidth: 2,
    borderColor: "#C7967D",
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 14,
  },

  coinText: {
    fontFamily: "Itim",
    fontSize: 13,
    fontWeight: "700",
    color: "#824A20",
  },

  goatContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    height: 160,
  },

  goatImage: {
    width: 200,
    height: 160,
  },

  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 6,
  },

  heartsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  heartContainer: {
    width: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
  },

  heartBorder: {
    position: "absolute",
  },

  heartInner: {
    position: "absolute",
  },

  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  streakText: {
    fontFamily: "Itim",
    fontSize: 15,
    fontWeight: "700",
    color: "#824A20",
  },

  /* SCROLLABLE SHEET WRAPPER & HILL */
  hillArchWrapper: {
    width: "100%",
    height: 35,
    backgroundColor: "transparent",
    overflow: "hidden",
  },

  scrollSheet: {
    flex: 1,
    backgroundColor: "#A1C99B",
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  sectionTitle: {
    fontFamily: "Itim",
    fontSize: 18,
    fontWeight: "700",
    color: "#824A20",
    marginBottom: 12,
  },

  /* GOAL CARDS */
  goalCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 28,
    borderWidth: 3,
    borderColor: "#C7967D",
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 12,
  },

  friendGoalCard: {
    backgroundColor: "#FFEBB9",
  },

  myGoalCard: {
    backgroundColor: "#FFFDF6",
  },

  completedGoalCard: {
    backgroundColor: "#E4DED4",
  },

  goalInfo: {
    flex: 1,
    marginRight: 10,
  },

  goalTitle: {
    fontFamily: "Itim",
    fontSize: 16,
    fontWeight: "700",
    color: "#824A20",
  },

  goalSubtext: {
    fontFamily: "Itim",
    fontSize: 11,
    color: "#824A20",
    marginTop: 2,
  },

  actionBtnBlue: {
    flexDirection: "row",
    backgroundColor: "#729AB5",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  actionBtnGray: {
    backgroundColor: "#A3A099",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  actionBtnText: {
    fontFamily: "Itim",
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  addGoalCardBtn: {
    backgroundColor: "#FFFDF6",
    borderWidth: 3,
    borderColor: "#C7967D",
    borderRadius: 28,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },

  addGoalCardText: {
    fontFamily: "Itim",
    fontSize: 16,
    fontWeight: "700",
    color: "#824A20",
    marginTop: -2,
  },

  /* MODAL STYLES */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  modalContent: {
    width: "100%",
    backgroundColor: "#FFFDF6",
    borderRadius: 28,
    borderWidth: 3,
    borderColor: "#C7967D",
    padding: 20,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  modalTitle: {
    fontFamily: "Itim",
    fontSize: 22,
    fontWeight: "700",
    color: "#824A20",
  },

  modalGoalBox: {
    backgroundColor: "#FFF8EC",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#C7967D",
    padding: 14,
    marginBottom: 16,
  },

  modalGoalLabel: {
    fontFamily: "Itim",
    fontSize: 14,
    color: "#824A20",
  },

  modalGoalText: {
    fontFamily: "Itim",
    fontSize: 16,
    fontWeight: "700",
    color: "#824A20",
    marginTop: 4,
  },

  modalImageFrame: {
    height: 240,
    backgroundColor: "#FFEBB9",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#C7967D",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  modalActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  approveBtn: {
    flex: 1,
    backgroundColor: "#729AB5",
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: "center",
  },

  denyBtn: {
    flex: 1,
    backgroundColor: "#D9777F",
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: "center",
  },

  modalBtnText: {
    fontFamily: "Itim",
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});