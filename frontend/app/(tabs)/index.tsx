import React, { useCallback, useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect, Tabs } from 'expo-router';
import { setLastTab } from '../../lib/lastTab';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../../lib/supabase';

import {
  getMyPairingCode,
  sendFriendRequest,
  getReceivedFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
} from '../../lib/friendRequests';

// Assets
const titleImage = require('../../assets/images/GoatTogetherTitle.png');

const goatHeads = [
  require('../../assets/images/home/goat-1.png'),
  require('../../assets/images/home/goat-2.png'),
];

type FriendshipCard = {
  id: string;
  friendName: string;
  petName: string;
  goatVariant: number;
  streakDays: number;
  hearts: number;
  coins: number;
  hasCompletedGoalToday: boolean;
};

type FriendRequest = {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  sender: {
    id: string;
    username: string | null;
    pairing_code: string;
  } | null;
};

export default function StreakBuddiesScreen() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Itim: require('../../assets/fonts/Itim.ttf'),
  });

  const [friendships, setFriendships] = useState<FriendshipCard[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Buddy modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [myPairingCode, setMyPairingCode] = useState('');
  const [friendCode, setFriendCode] = useState('');
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [requestLoading, setRequestLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadFriendships();
    }, [])
  );

  useEffect(() => {
    setLastTab('/(tabs)/index');
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

      const todayStr = new Date().toISOString().split('T')[0];

      const cards = await Promise.all(
        friendshipData.map(async (friendship, index) => {
          const friendId =
            friendship.user_a_id === user.id
              ? friendship.user_b_id
              : friendship.user_a_id;

          if (!friendId) {
            return null;
          }

          const [
            { data: profile },
            { data: myStats },
            { data: friendStats },
            { data: pet },
          ] = await Promise.all([
            supabase
              .from('profiles')
              .select('id, username')
              .eq('id', friendId)
              .maybeSingle(),
            supabase
              .from('user_stats')
              .select('*')
              .eq('user_id', user.id)
              .maybeSingle(),
            supabase
              .from('user_stats')
              .select('*')
              .eq('user_id', friendId)
              .maybeSingle(),
            supabase
              .from('pets')
              .select('*')
              .eq('friendship_id', friendship.id)
              .maybeSingle(),
          ]);

          const health = pet?.health ?? 100;
          const hearts = Math.max(0, Math.min(5, Math.ceil(health / 20)));
          const goatVariant = (pet?.avatar_variant ?? index) % 3;

          const currentStreak = Math.max(
            myStats?.streak_days || 0,
            friendStats?.streak_days || 0
          );

          // Requires at least 1 day streak AND recent activity today
          const myActiveToday = myStats?.last_active_date === todayStr;
          const friendActiveToday = friendStats?.last_active_date === todayStr;
          const hasCompletedGoalToday =
            currentStreak > 0 && (myActiveToday || friendActiveToday);

          return {
            id: friendship.id,
            friendName: profile?.username || 'Friend',
            petName: pet?.name || 'Buttercup',
            goatVariant,
            streakDays: currentStreak,
            hearts,
            coins: friendStats?.points || 0,
            hasCompletedGoalToday,
          };
        })
      );

      setFriendships(
        cards.filter((card): card is FriendshipCard => card !== null)
      );
    } catch (error) {
      console.error('Failed to load friendships:', error);
      setFriendships([]);
    } finally {
      setLoading(false);
    }
  }

  async function openBuddyModal() {
    try {
      setRequestLoading(true);

      const [code, receivedRequests] = await Promise.all([
        getMyPairingCode(),
        getReceivedFriendRequests(),
      ]);

      setMyPairingCode(code || '');
      setRequests(receivedRequests);
      setModalVisible(true);
    } catch (error) {
      console.error('Failed to load buddy information:', error);
      Alert.alert('Error', 'Could not load your buddy information.');
    } finally {
      setRequestLoading(false);
    }
  }

  async function handleSendRequest() {
    if (!friendCode.trim()) {
      Alert.alert('Missing Code', 'Please enter your friend’s pairing code.');
      return;
    }

    try {
      setRequestLoading(true);
      await sendFriendRequest(friendCode);
      setFriendCode('');
      Alert.alert('Request Sent! 🎉', 'Your friend request has been sent.');
    } catch (error: any) {
      console.error('Failed to send friend request:', error);
      Alert.alert('Could not send request', error?.message || 'Something went wrong.');
    } finally {
      setRequestLoading(false);
    }
  }

  async function handleAcceptRequest(requestId: string) {
    try {
      setRequestLoading(true);
      const friendship = await acceptFriendRequest(requestId);

      setRequests((currentRequests) =>
        currentRequests.filter((request) => request.id !== requestId)
      );

      setModalVisible(false);
      await loadFriendships();

      Alert.alert('Connected! 🎉', 'You are now streak buddies!');

      if (friendship?.id) {
        router.push(`/friendship/${friendship.id}` as any);
      }
    } catch (error: any) {
      console.error('Failed to accept friend request:', error);
      Alert.alert('Could not accept request', error?.message || 'Something went wrong.');
    } finally {
      setRequestLoading(false);
    }
  }

  async function handleDeclineRequest(requestId: string) {
    try {
      setRequestLoading(true);
      await declineFriendRequest(requestId);
      setRequests((currentRequests) =>
        currentRequests.filter((request) => request.id !== requestId)
      );
    } catch (error: any) {
      console.error('Failed to decline friend request:', error);
      Alert.alert('Could not decline request', error?.message || 'Something went wrong.');
    } finally {
      setRequestLoading(false);
    }
  }

  const renderHearts = (heartCount: number) => {
    const hearts = [];
    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= heartCount;
      hearts.push(
        <View key={i} style={styles.heartContainer}>
          <Ionicons name="heart" size={20} color="#824A20" style={styles.heartBorder} />
          <Ionicons
            name="heart"
            size={16}
            color={isFilled ? '#E57373' : '#A3A099'}
            style={styles.heartInner}
          />
        </View>
      );
    }
    return hearts;
  };

  if (!fontsLoaded || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#824A20" />
          <Text style={styles.loadingText}>Loading your streak buddies...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      <Tabs.Screen options={{ tabBarStyle: { display: 'none' } }} />

      <View style={styles.grassWrapper} pointerEvents="none">
        <Image
          source={require('../../assets/images/GrassHill.png')}
          style={styles.grassHillBackground}
          resizeMode="stretch"
        />
      </View>

      <SafeAreaView style={{ flex: 1, zIndex: 10 }}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <View style={styles.headerLeftPlaceholder} />

          <View style={styles.headerTitleGroup}>
            <Image
              source={titleImage}
              style={styles.titleImage}
              resizeMode="contain"
            />
          </View>

          <TouchableOpacity
            style={styles.logoutBtn}
            activeOpacity={0.8}
            onPress={async () => {
              await supabase.auth.signOut();
              router.replace('/auth/login');
            }}
          >
            <Ionicons name="log-out-outline" size={18} color="#824A20" />
            <Text style={styles.logoutBtnText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable List */}
        <FlatList
          data={friendships}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          onRefresh={loadFriendships}
          refreshing={loading}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.sectionHeader}>Your Pets</Text>
          }
          renderItem={({ item }) => {
            const isCompleted = item.hasCompletedGoalToday;

            return (
              <TouchableOpacity
                style={styles.petCard}
                activeOpacity={0.85}
                onPress={() => router.push(`/friendship/${item.id}` as any)}
              >
                <Image
                  source={goatHeads[item.goatVariant] || goatHeads[1]}
                  style={[
                    styles.goatAvatar,
                    !isCompleted && styles.silhouetteAvatar,
                  ]}
                  resizeMode="contain"
                />

                <View style={styles.petCardInfo}>
                  <Text style={styles.withText}>With {item.friendName}</Text>
                  <Text style={styles.petNameText}>{item.petName}</Text>

                  <View style={styles.heartsRow}>{renderHearts(item.hearts)}</View>

                  <View style={styles.streakRow}>
                    <Ionicons
                      name={
                        isCompleted
                          ? 'checkmark-circle'
                          : 'checkmark-circle-outline'
                      }
                      size={16}
                      color={isCompleted ? '#4CAF50' : '#824A20'}
                    />
                    <Text style={styles.streakText}>{item.streakDays}-Day Streak</Text>
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={24} color="#C7967D" />
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={
            <TouchableOpacity
              style={styles.addFriendCardBtn}
              onPress={openBuddyModal}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={36} color="#C7967D" />
              <Text style={styles.addFriendCardText}>Add Friend</Text>
            </TouchableOpacity>
          }
        />

        {/* Floating Nav */}
        <View style={styles.bottomNavContainer}>
          <TouchableOpacity
            style={[styles.navCircleButton, styles.sideNavButton]}
            activeOpacity={0.85}
          >
            <Ionicons name="people-outline" size={36} color="#F8DC81" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navCircleButton, styles.centerNavButton]}
            onPress={() => router.push('/(tabs)/goals' as any)}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-done-outline" size={38} color="#FFFFFF" />
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

      {/* Add Buddy Modal */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Friend</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#C7967D" />
              </TouchableOpacity>
            </View>

            <View style={styles.sectionBox}>
              <Text style={styles.sectionLabel}>Share your friend code:</Text>
              <Text style={styles.shareCodeText}>
                {myPairingCode || 'Loading...'}
              </Text>
            </View>

            <View style={styles.sectionBox}>
              <Text style={styles.sectionLabel}>Enter a friend code:</Text>
              <TextInput
                style={styles.pillInput}
                value={friendCode}
                onChangeText={setFriendCode}
                autoCapitalize="characters"
                autoCorrect={false}
              />

              <TouchableOpacity
                style={styles.blueButton}
                onPress={handleSendRequest}
                disabled={requestLoading}
                activeOpacity={0.8}
              >
                {requestLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Send Request</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.sectionBox}>
              <Text style={styles.sectionLabel}>Received Friend Requests</Text>

              {requests.length === 0 ? (
                <Text style={styles.noRequestsText}>No pending requests.</Text>
              ) : (
                requests.map((request) => (
                  <View key={request.id} style={styles.innerCard}>
                    <View style={styles.innerCardTop}>
                      <Text style={styles.requestText}>
                        {request.sender?.username || 'Someone'}{' '}
                        [{request.sender?.pairing_code || ''}]
                        {'\n'}wants to be friends!
                      </Text>

                      <Image
                        source={goatHeads[1]}
                        style={styles.modalGoatHead}
                        resizeMode="contain"
                      />
                    </View>

                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.blueButtonSmall}
                        onPress={() => handleAcceptRequest(request.id)}
                        disabled={requestLoading}
                      >
                        <Text style={styles.buttonText}>Accept</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.redButtonSmall}
                        onPress={() => handleDeclineRequest(request.id)}
                        disabled={requestLoading}
                      >
                        <Text style={styles.buttonText}>Decline</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
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

  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },

  headerLeftPlaceholder: {
    width: 84,
  },

  headerTitleGroup: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  titleImage: {
    width: 170,
    height: 55,
  },

  logoutBtn: {
    width: 84,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF9F0',
    borderWidth: 2,
    borderColor: '#C7967D',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },

  logoutBtnText: {
    fontFamily: 'Itim',
    fontSize: 11,
    fontWeight: '700',
    color: '#824A20',
  },

  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 180,
  },

  sectionHeader: {
    fontFamily: 'Itim',
    fontSize: 22,
    fontWeight: '700',
    color: '#824A20',
    marginBottom: 10,
    marginTop: 4,
  },

  petCard: {
    backgroundColor: '#FEF9F0',
    borderRadius: 30,
    borderWidth: 3.5,
    borderColor: '#C7967D',
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#8a6b59',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },

  goatAvatar: {
    width: 75,
    height: 75,
    marginRight: 12,
  },

  silhouetteAvatar: {
    tintColor: '#5C3820',
    opacity: 0.3,
  },

  petCardInfo: {
    flex: 1,
    marginRight: 8,
  },

  withText: {
    fontFamily: 'Itim',
    fontSize: 16,
    fontWeight: '700',
    color: '#824A20',
  },

  petNameText: {
    fontFamily: 'Itim',
    fontSize: 12,
    color: '#824A20',
    marginBottom: 4,
  },

  heartsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 4,
  },

  heartContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  heartBorder: {
    position: 'absolute',
  },

  heartInner: {
    position: 'absolute',
  },

  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  streakText: {
    fontFamily: 'Itim',
    fontSize: 11,
    color: '#824A20',
  },

  addFriendCardBtn: {
    backgroundColor: '#FEF9F0',
    borderWidth: 3.5,
    borderColor: '#C7967D',
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#8a6b59',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },

  addFriendCardText: {
    fontFamily: 'Itim',
    fontSize: 16,
    fontWeight: '700',
    color: '#824A20',
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
    borderWidth: 3,
    borderColor: '#FEF9F0',
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

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  modalCard: {
    width: '100%',
    backgroundColor: '#FFFDF6',
    borderRadius: 28,
    borderWidth: 4,
    borderColor: '#C7967D',
    padding: 20,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  modalTitle: {
    fontFamily: 'Itim',
    fontSize: 22,
    fontWeight: '700',
    color: '#824A20',
  },

  closeButton: {
    padding: 4,
  },

  sectionBox: {
    borderWidth: 3,
    borderColor: '#C7967D',
    borderRadius: 20,
    backgroundColor: '#FFFDF6',
    padding: 14,
    marginBottom: 14,
    alignItems: 'center',
  },

  sectionLabel: {
    fontFamily: 'Itim',
    fontSize: 15,
    fontWeight: '700',
    color: '#824A20',
    alignSelf: 'flex-start',
    marginBottom: 8,
  },

  shareCodeText: {
    fontFamily: 'Itim',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 3,
    color: '#824A20',
    marginVertical: 2,
  },

  pillInput: {
    width: '100%',
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#C7967D',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    textAlign: 'center',
    fontFamily: 'Itim',
    fontSize: 18,
    color: '#824A20',
    marginBottom: 10,
  },

  blueButton: {
    backgroundColor: '#729AB5',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 24,
    alignItems: 'center',
  },

  blueButtonSmall: {
    flex: 1,
    backgroundColor: '#729AB5',
    borderRadius: 16,
    paddingVertical: 6,
    alignItems: 'center',
  },

  redButtonSmall: {
    flex: 1,
    backgroundColor: '#C76A6A',
    borderRadius: 16,
    paddingVertical: 6,
    alignItems: 'center',
  },

  buttonText: {
    fontFamily: 'Itim',
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  innerCard: {
    width: '100%',
    borderWidth: 3,
    borderColor: '#C7967D',
    borderRadius: 16,
    padding: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },

  innerCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  requestText: {
    flex: 1,
    fontFamily: 'Itim',
    fontSize: 13,
    fontWeight: '700',
    color: '#824A20',
    lineHeight: 16,
    marginRight: 8,
  },

  modalGoatHead: {
    width: 40,
    height: 40,
  },

  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },

  noRequestsText: {
    fontFamily: 'Itim',
    fontSize: 14,
    color: '#824A20',
    marginTop: 2,
  },
});