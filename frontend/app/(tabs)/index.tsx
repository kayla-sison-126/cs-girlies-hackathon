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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { setLastTab } from '../../lib/lastTab';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

import {
  getMyPairingCode,
  sendFriendRequest,
  getReceivedFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
} from '../../lib/friendRequests';

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

  const [friendships, setFriendships] = useState<FriendshipCard[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Buddy modal
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

      const cards = await Promise.all(
        friendshipData.map(async (friendship) => {
          const friendId =
            friendship.user_a_id === user.id
              ? friendship.user_b_id
              : friendship.user_a_id;

          if (!friendId) {
            return null;
          }

          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', friendId)
            .maybeSingle();

          const { data: stats } = await supabase
            .from('user_stats')
            .select('*')
            .eq('user_id', friendId)
            .maybeSingle();

          const { data: pet } = await supabase
            .from('pets')
            .select('*')
            .eq('friendship_id', friendship.id)
            .maybeSingle();

          const health = pet?.health ?? 100;

          const hearts = Math.max(
            0,
            Math.min(5, Math.ceil(health / 20))
          );

          return {
            id: friendship.id,
            friendName:
              profile?.username || 'Friend',
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
      console.error(
        'Failed to load buddy information:',
        error
      );

      Alert.alert(
        'Error',
        'Could not load your buddy information.'
      );
    } finally {
      setRequestLoading(false);
    }
  }

  async function handleSendRequest() {
    if (!friendCode.trim()) {
      Alert.alert(
        'Missing Code',
        'Please enter your friend’s pairing code.'
      );
      return;
    }

    try {
      setRequestLoading(true);

      await sendFriendRequest(friendCode);

      setFriendCode('');

      Alert.alert(
        'Request Sent! 🎉',
        'Your friend request has been sent.'
      );
    } catch (error: any) {
      console.error(
        'Failed to send friend request:',
        error
      );

      Alert.alert(
        'Could not send request',
        error?.message ||
          'Something went wrong.'
      );
    } finally {
      setRequestLoading(false);
    }
  }

  async function handleAcceptRequest(
    requestId: string
  ) {
    try {
      setRequestLoading(true);

      const friendship =
        await acceptFriendRequest(requestId);

      setRequests((currentRequests) =>
        currentRequests.filter(
          (request) => request.id !== requestId
        )
      );

      setModalVisible(false);

      await loadFriendships();

      Alert.alert(
        'Connected! 🎉',
        'You are now streak buddies!'
      );

      if (friendship?.id) {
        router.push(
          `/friendship/${friendship.id}` as any
        );
      }
    } catch (error: any) {
      console.error(
        'Failed to accept friend request:',
        error
      );

      Alert.alert(
        'Could not accept request',
        error?.message ||
          'Something went wrong.'
      );
    } finally {
      setRequestLoading(false);
    }
  }

  async function handleDeclineRequest(
    requestId: string
  ) {
    try {
      setRequestLoading(true);

      await declineFriendRequest(requestId);

      setRequests((currentRequests) =>
        currentRequests.filter(
          (request) => request.id !== requestId
        )
      );
    } catch (error: any) {
      console.error(
        'Failed to decline friend request:',
        error
      );

      Alert.alert(
        'Could not decline request',
        error?.message ||
          'Something went wrong.'
      );
    } finally {
      setRequestLoading(false);
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
        <View style={styles.headerContent}>
          <Text style={styles.title}>
            Streak Buddies 🐾
          </Text>

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
          <Text style={styles.logoutButtonText}>
            Log Out
          </Text>
        </TouchableOpacity>
      </View>

      {/* ADD BUDDY BUTTON */}

      <TouchableOpacity
        style={styles.addBuddyTopButton}
        onPress={openBuddyModal}
        activeOpacity={0.8}
      >
        <Ionicons
          name="person-add"
          size={20}
          color="#FFFFFF"
        />

        <Text style={styles.addBuddyTopButtonText}>
          Add Buddy
        </Text>
      </TouchableOpacity>

      {friendships.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>
            🐾
          </Text>

          <Text style={styles.emptyTitle}>
            No streak buddies yet
          </Text>

          <Text style={styles.emptyText}>
            Pair up with a friend to start taking
            care of a pet together!
          </Text>

          <TouchableOpacity
            style={styles.addBuddyButton}
            onPress={openBuddyModal}
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
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() =>
          setModalVisible(false)
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  Add a Buddy 🤝
                </Text>

                <Text style={styles.modalSubtitle}>
                  Connect with someone and start
                  your streak together.
                </Text>
              </View>

              <TouchableOpacity
                onPress={() =>
                  setModalVisible(false)
                }
                style={styles.closeButton}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color="#636E72"
                />
              </TouchableOpacity>
            </View>

            {/* MY CODE */}

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>
                Your Pairing Code
              </Text>

              <View style={styles.codeBox}>
                <Text style={styles.codeText}>
                  {myPairingCode || 'Loading...'}
                </Text>
              </View>

              <Text style={styles.helperText}>
                Share this code with a friend so
                they can send you a request.
              </Text>
            </View>

            {/* SEND REQUEST */}

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>
                Enter Friend's Code
              </Text>

              <TextInput
                style={styles.codeInput}
                value={friendCode}
                onChangeText={setFriendCode}
                placeholder="Enter pairing code"
                placeholderTextColor="#999"
                autoCapitalize="characters"
                autoCorrect={false}
              />

              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendRequest}
                disabled={requestLoading}
              >
                {requestLoading ? (
                  <ActivityIndicator
                    color="#FFFFFF"
                  />
                ) : (
                  <>
                    <Ionicons
                      name="paper-plane"
                      size={18}
                      color="#FFFFFF"
                    />

                    <Text
                      style={styles.sendButtonText}
                    >
                      Send Request
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* RECEIVED REQUESTS */}

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>
                Friend Requests
              </Text>

              {requests.length === 0 ? (
                <Text style={styles.noRequestsText}>
                  No pending requests.
                </Text>
              ) : (
                requests.map((request) => (
                  <View
                    key={request.id}
                    style={styles.requestCard}
                  >
                    <View
                      style={styles.requestInfo}
                    >
                      <Text
                        style={
                          styles.requestName
                        }
                      >
                        {request.sender?.username || 'Someone'}
                      </Text>

                      <Text
                        style={
                          styles.requestCode
                        }
                      >
                        {request.sender
                          ?.pairing_code ||
                          ''}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.requestActions
                      }
                    >
                      <TouchableOpacity
                        style={
                          styles.acceptButton
                        }
                        onPress={() =>
                          handleAcceptRequest(
                            request.id
                          )
                        }
                        disabled={
                          requestLoading
                        }
                      >
                        <Text
                          style={
                            styles.acceptButtonText
                          }
                        >
                          Accept
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={
                          styles.declineButton
                        }
                        onPress={() =>
                          handleDeclineRequest(
                            request.id
                          )
                        }
                        disabled={
                          requestLoading
                        }
                      >
                        <Text
                          style={
                            styles.declineButtonText
                          }
                        >
                          Decline
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
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
  },

  headerContent: {
    flex: 1,
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

  addBuddyTopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C5CE7',
    marginHorizontal: 20,
    marginBottom: 14,
    paddingVertical: 11,
    borderRadius: 10,
    gap: 8,
  },

  addBuddyTopButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
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

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },

  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3436',
  },

  modalSubtitle: {
    fontSize: 13,
    color: '#636E72',
    marginTop: 4,
    maxWidth: 280,
  },

  closeButton: {
    padding: 4,
  },

  modalSection: {
    marginBottom: 22,
  },

  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 8,
  },

  codeBox: {
    backgroundColor: '#EDEAFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },

  codeText: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 3,
    color: '#6C5CE7',
  },

  helperText: {
    fontSize: 12,
    color: '#636E72',
    marginTop: 6,
  },

  codeInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#DCDDE1',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#2D3436',
    backgroundColor: '#FAFAFA',
    marginBottom: 10,
  },

  sendButton: {
    height: 48,
    borderRadius: 10,
    backgroundColor: '#6C5CE7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  noRequestsText: {
    fontSize: 13,
    color: '#636E72',
    backgroundColor: '#F8F9FA',
    padding: 14,
    borderRadius: 10,
  },

  requestCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },

  requestInfo: {
    marginBottom: 10,
  },

  requestName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D3436',
  },

  requestCode: {
    fontSize: 11,
    color: '#636E72',
    marginTop: 2,
  },

  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },

  acceptButton: {
    flex: 1,
    backgroundColor: '#00B894',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },

  acceptButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  declineButton: {
    flex: 1,
    backgroundColor: '#FFE8E8',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },

  declineButtonText: {
    color: '#FF6B6B',
    fontWeight: '700',
    fontSize: 13,
  },
});

