import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface AccountabilityGoal {
  id: string;
  title: string;
  completed: boolean;
  verifiedByFriend: boolean;
}

export default function FriendshipHomeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Mock mapping for friend names (replace with Supabase query later)
  const friendNames: Record<string, string> = {
    '1': 'Parineet',
    'f1': 'Parineet',
    '2': 'Alex',
  };

  const friendName = (id && friendNames[id]) || 'Your Buddy';

  // Mock State
  const [petName, setPetName] = useState('Barnaby the Goat');
  const [heartCount, setHeartCount] = useState<number>(2); // 0 to 3 hearts
  const [streakDays, setStreakDays] = useState<number>(12);
  const [coins, setCoins] = useState<number>(350);

  const [goals, setGoals] = useState<AccountabilityGoal[]>([
    { id: '1', title: 'Study 1 hr focus session', completed: true, verifiedByFriend: true },
    { id: '2', title: 'Log 8k steps today', completed: false, verifiedByFriend: false },
    { id: '3', title: 'Drink 64oz water', completed: false, verifiedByFriend: false },
  ]);

  // Helper to render 0 to 3 hearts
  const renderHearts = () => {
    const hearts = [];
    for (let i = 1; i <= 3; i++) {
      hearts.push(
        <Ionicons
          key={i}
          name={i <= heartCount ? 'heart' : 'heart-outline'}
          size={24}
          color="#FF7675"
        />
      );
    }
    return hearts;
  };

  return (
    <View style={styles.container}>
      {/* Header Setup */}
      <Stack.Screen
        options={{
          title: `${friendName} & You`,
          headerRight: () => (
            <TouchableOpacity
              style={styles.shopHeaderBtn}
              onPress={() => router.push(`/friendship/${id}/shop`)}
              activeOpacity={0.7}
            >
              <Ionicons name="bag-handle" size={18} color="#6C5CE7" />
              <Text style={styles.shopBtnText}>Shop</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* TOP STATUS BAR: Currency & Streak */}
        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <Ionicons name="flame" size={20} color="#FF7675" />
            <Text style={styles.statText}>{streakDays} Day Streak</Text>
          </View>

          <View style={styles.statBadge}>
            <Ionicons name="sparkles" size={18} color="#FDCB6E" />
            <Text style={styles.statText}>{coins} Coins</Text>
          </View>
        </View>

        {/* PET HOME CARD */}
        <View style={styles.petCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.petEmoji}>🐐</Text>
          </View>

          <Text style={styles.petName}>{petName}</Text>

          {/* 0 to 3 Hearts Health Bar */}
          <View style={styles.healthContainer}>
            <Text style={styles.healthLabel}>Pet Health:</Text>
            <View style={styles.heartsRow}>{renderHearts()}</View>
          </View>
        </View>

        {/* YOUR ACCOUNTABILITY GOALS SECTION */}
        <View style={styles.goalsSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Your Accountability Goals</Text>
              <Text style={styles.sectionSubtitle}>
                Completed by you, checked off by {friendName}
              </Text>
            </View>
            <TouchableOpacity style={styles.addGoalBtn}>
              <Ionicons name="add-circle" size={26} color="#6C5CE7" />
            </TouchableOpacity>
          </View>

          {goals.map((item) => (
            <View key={item.id} style={styles.goalCard}>
              <View style={styles.goalMainInfo}>
                <Ionicons
                  name={item.completed ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={item.completed ? '#00B894' : '#B2BEC3'}
                  style={styles.checkIcon}
                />
                <View style={styles.goalTextContainer}>
                  <Text
                    style={[
                      styles.goalTitle,
                      item.completed && styles.goalCompletedText,
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Text style={styles.statusSubtext}>
                    {item.verifiedByFriend
                      ? `Verified by ${friendName}`
                      : item.completed
                      ? `Awaiting ${friendName}'s review`
                      : `Needs proof submission`}
                  </Text>
                </View>
              </View>

              {/* CAMERA PROOF BUTTON */}
              <TouchableOpacity
                style={styles.cameraBtn}
                onPress={() =>
                  router.push({
                    pathname: '/friendship/[id]/camera',
                    params: { id: id as string, goalTitle: item.title },
                  })
                }
                activeOpacity={0.7}
              >
                <Ionicons name="camera" size={18} color="#FFFFFF" />
                <Text style={styles.cameraBtnText}>Snap Proof</Text>
              </TouchableOpacity>
            </View>
          ))}
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
});