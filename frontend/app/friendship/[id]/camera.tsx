import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Image,
  FlatList,
  Modal,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { supabase } from '../../../lib/supabase';
import { getLastTab } from '../../../lib/lastTab';

export default function FriendCameraScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [fontsLoaded] = useFonts({
    Itim: require('../../../assets/fonts/Itim.ttf'),
  });

  const handleBack = () => {
    const returnTo = params.returnTo as string | undefined;
    if (returnTo) {
      router.push(returnTo as any);
      return;
    }

    // If there is navigation history, pop back to the previous screen
    if (router.canGoBack()) {
      router.back();
      return;
    }

    const last = getLastTab();
    if (last && last !== '/(tabs)/camera') {
      router.push(last as any);
      return;
    }

    router.push('/(tabs)/index');
  };

  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(
    (params.goalId as string) || null
  );

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [goals, setGoals] = useState<
    {
      id: string;
      friendshipId: string;
      title: string;
      friendName: string;
    }[]
  >([]);

  const [loadingGoals, setLoadingGoals] = useState(true);

  const cameraRef = useRef<CameraView>(null);

  const loadGoals = async () => {
    try {
      setLoadingGoals(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error('You must be logged in.');
      }

      const { data, error } = await supabase
        .from('goals')
        .select(`
          id,
          friendship_id,
          title,
          friendships (
            user_a_id,
            user_b_id
          )
        `);

      if (error) {
        throw error;
      }

      const formattedGoals = (data || []).map((goal: any) => {
        const friendship = goal.friendships;

        const friendId =
          friendship.user_a_id === user.id
            ? friendship.user_b_id
            : friendship.user_a_id;

        return {
          id: goal.id,
          friendshipId: goal.friendship_id,
          title: goal.title,
          friendName: friendId || 'Friend',
        };
      });

      setGoals(formattedGoals);
    } catch (error: any) {
      console.error('Error loading goals:', error);

      Alert.alert(
        'Could not load goals',
        error?.message || 'Something went wrong.'
      );
    } finally {
      setLoadingGoals(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const currentSelectedGoal = goals.find(
    (goal) => goal.id === selectedGoalId
  );

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <Text style={{ color: '#FEF9F0', fontFamily: 'Itim' }}>Loading...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.message}>
          We need camera access to submit goal proof!
        </Text>

        <TouchableOpacity
          style={styles.permButton}
          onPress={requestPermission}
        >
          <Text style={styles.permBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current) return;

    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.7,
    });

    if (photo?.uri) {
      setCapturedPhoto(photo.uri);
    }
  };

  const handleSubmitProof = async () => {
    if (!selectedGoalId) {
      Alert.alert(
        'Select a goal',
        'Please select a goal for this photo.'
      );
      setIsPickerOpen(true);
      return;
    }

    if (!capturedPhoto) {
      Alert.alert('No photo', 'Please take a photo first.');
      return;
    }

    setUploading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error('You must be logged in to submit proof.');
      }

      const response = await fetch(capturedPhoto);
      const arrayBuffer = await response.arrayBuffer();

      const filePath = `${user.id}/${selectedGoalId}/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('goal-proofs')
        .upload(filePath, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage
        .from('goal-proofs')
        .getPublicUrl(filePath);

      const { error: proofError } = await supabase
        .from('goal_proofs')
        .insert({
          goal_id: selectedGoalId,
          submitted_by: user.id,
          image_url: publicUrl,
          status: 'pending',
        });

      if (proofError) {
        throw proofError;
      }

      Alert.alert(
        'Proof Submitted!',
        'Your friend can now review your goal proof.'
      );

      setCapturedPhoto(null);

      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Proof submission error:', error);

      Alert.alert(
        'Submission Failed',
        error?.message ||
          'Something went wrong while submitting your proof.'
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar hidden={true} />
      {capturedPhoto ? (
        <View style={StyleSheet.absoluteFillObject}>
          <Image
            source={{ uri: capturedPhoto }}
            style={StyleSheet.absoluteFillObject}
          />

          <SafeAreaView style={styles.overlayContainer}>
            <View style={styles.topBanner}>
              <TouchableOpacity
                style={styles.retakeBtn}
                onPress={() => setCapturedPhoto(null)}
                disabled={uploading}
              >
                <Ionicons name="close" size={24} color="#FEF9F0" />
                <Text style={styles.retakeText}>Retake</Text>
              </TouchableOpacity>

              <Text style={styles.bannerTitle}>Proof Preview</Text>

              <View style={styles.headerSpacer} />
            </View>

            <View style={styles.reviewBottomBar}>
              <TouchableOpacity
                style={styles.goalSelectorCard}
                onPress={() => setIsPickerOpen(true)}
                disabled={uploading}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectorLabel}>
                    ATTACH TO GOAL:
                  </Text>

                  <Text style={styles.selectedGoalTitle}>
                    {currentSelectedGoal
                      ? `${currentSelectedGoal.title} (${currentSelectedGoal.friendName})`
                      : 'Tap to select a goal...'}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-up"
                  size={20}
                  color="#824A20"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  uploading && styles.disabledBtn,
                ]}
                onPress={handleSubmitProof}
                disabled={uploading}
              >
                <Ionicons
                  name="paper-plane"
                  size={20}
                  color="#FEF9F0"
                  style={{ marginRight: 8 }}
                />

                <Text style={styles.submitBtnText}>
                  {uploading ? 'Uploading...' : 'Send Proof'}
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          <Modal
            visible={isPickerOpen}
            animationType="slide"
            transparent
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    Select Goal for Proof
                  </Text>

                  <TouchableOpacity
                    onPress={() => setIsPickerOpen(false)}
                    style={styles.closeModalBtn}
                  >
                    <Ionicons
                      name="close"
                      size={26}
                      color="#824A20"
                    />
                  </TouchableOpacity>
                </View>

                {loadingGoals ? (
                  <Text style={styles.loadingText}>
                    Loading goals...
                  </Text>
                ) : goals.length === 0 ? (
                  <Text style={styles.loadingText}>
                    No active goals found.
                  </Text>
                ) : (
                  <FlatList
                    data={goals}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.goalOption,
                          selectedGoalId === item.id &&
                            styles.selectedGoalOption,
                        ]}
                        onPress={() => {
                          setSelectedGoalId(item.id);
                          setIsPickerOpen(false);
                        }}
                      >
                        <View>
                          <Text style={styles.optionTitle}>
                            {item.title}
                          </Text>

                          <Text style={styles.optionBuddy}>
                            Buddy: {item.friendName}
                          </Text>
                        </View>

                        {selectedGoalId === item.id && (
                          <Ionicons
                            name="checkmark-circle"
                            size={22}
                            color="#FF6B6B"
                          />
                        )}
                      </TouchableOpacity>
                    )}
                  />
                )}
              </View>
            </View>
          </Modal>
        </View>
      ) : (
        <View style={StyleSheet.absoluteFillObject}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFillObject}
            facing={facing}
          />

          <SafeAreaView
            style={styles.overlayContainer}
            pointerEvents="box-none"
          >
            <View style={styles.topBanner}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="chevron-back"
                  size={28}
                  color="#FFF"
                />
              </TouchableOpacity>

              <Text style={styles.topLabel}>Snap Your Proof!</Text>

              <View style={styles.topSpacer} />
            </View>

            <View style={styles.bottomControls}>
              <TouchableOpacity
                style={styles.flipBtn}
                onPress={() =>
                  setFacing(
                    facing === 'back' ? 'front' : 'back'
                  )
                }
                activeOpacity={0.8}
              >
                <Ionicons
                  name="camera-reverse"
                  size={28}
                  color="#FFF"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shutterBtn}
                onPress={takePicture}
                activeOpacity={0.9}
              >
                <View style={styles.shutterInner} />
              </TouchableOpacity>

              <View style={styles.controlSpacer} />
            </View>
          </SafeAreaView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },

  permButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },

  permBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
  },

  overlayContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },

  topBanner: {
    position: 'absolute',
    top: 72,
    left: 18,
    right: 18,
    zIndex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerSpacer: {
    width: 60,
    height: 30,
  },

  backButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },

  topLabel: {
    color: '#FEF9F0',
    fontFamily: 'Itim',
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 0.4,
    flex: 1,
    textAlign: 'right',
  },

  topSpacer: {
    width: 30,
    height: 30,
  },

  bannerTitle: {
    color: '#FEF9F0',
    fontFamily: 'Itim',
    fontWeight: '700',
    fontSize: 17,
    textAlign: 'center',
    flex: 1,
  },

  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 60,
  },

  retakeText: {
    color: '#FEF9F0',
    fontFamily: 'Itim',
    fontSize: 14,
    marginLeft: 4,
  },

  bottomControls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 26,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 36,
  },

  flipBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(254,249,240,0.35)',
  },

  shutterBtn: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 4,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },

  shutterInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#FEF9F0',
  },

  controlSpacer: {
    width: 52,
    height: 52,
  },

  reviewBottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 28,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 0,
    zIndex: 4,
  },

  goalSelectorCard: {
    backgroundColor: '#FEF9F0',
    padding: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#D8BDAA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },

  selectorLabel: {
    fontFamily: 'Itim',
    fontSize: 11,
    fontWeight: '700',
    color: '#824A20',
    marginBottom: 2,
  },

  selectedGoalTitle: {
    fontFamily: 'Itim',
    fontSize: 15,
    fontWeight: '700',
    color: '#824A20',
  },

  submitBtn: {
    backgroundColor: '#729AB5',
    paddingVertical: 14,
    borderRadius: 999,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    width: '72%',
    shadowColor: '#1F4D66',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },

  disabledBtn: {
    opacity: 0.6,
  },

  submitBtnText: {
    color: '#FEF9F0',
    fontFamily: 'Itim',
    fontWeight: '700',
    fontSize: 16,
  },

  loadingText: {
    fontFamily: 'Itim',
    textAlign: 'center',
    color: '#824A20',
    paddingVertical: 20,
  },

  closeModalBtn: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    backgroundColor: 'transparent',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  
  modalContent: {
    backgroundColor: '#FEF9F0',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '55%',
    borderColor: '#D8BDAA',
    borderWidth: 4.5,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 0,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },

  modalTitle: {
    fontFamily: 'Itim',
    fontSize: 18,
    fontWeight: '700',
    color: '#824A20',
  },

  goalOption: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E7D3C2',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  selectedGoalOption: {
    backgroundColor: '#F7E8DB',
    borderRadius: 10,
  },

  optionTitle: {
    fontFamily: 'Itim',
    fontSize: 15,
    fontWeight: '600',
    color: '#824A20',
  },

  optionBuddy: {
    fontFamily: 'Itim',
    fontSize: 12,
    color: '#824A20',
    marginTop: 2,
  },
});