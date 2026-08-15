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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

export default function GlobalCameraScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

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
                <Ionicons name="close" size={24} color="#FFF" />
                <Text style={styles.retakeText}>Retake</Text>
              </TouchableOpacity>

              <Text style={styles.bannerTitle}>Proof Preview</Text>

              <View style={{ width: 60 }} />
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
                  color="#FF6B6B"
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
                  color="#FFF"
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
                  >
                    <Ionicons
                      name="close-circle"
                      size={26}
                      color="#999"
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
              <Text style={styles.bannerTitle}>
                Snap Proof Photo 📷
              </Text>
            </View>

            <View style={styles.bottomControls}>
              <TouchableOpacity
                style={styles.flipBtn}
                onPress={() =>
                  setFacing(
                    facing === 'back' ? 'front' : 'back'
                  )
                }
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
              >
                <View style={styles.shutterInner} />
              </TouchableOpacity>

              <View style={{ width: 44 }} />
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
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    marginHorizontal: 20,
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  bannerTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },

  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  retakeText: {
    color: '#FFF',
    fontSize: 14,
    marginLeft: 4,
  },

  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 30,
  },

  flipBtn: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 25,
  },

  shutterBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B6B',
  },

  reviewBottomBar: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  goalSelectorCard: {
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  selectorLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#888',
    marginBottom: 2,
  },

  selectedGoalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  submitBtn: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  disabledBtn: {
    opacity: 0.6,
  },

  submitBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },

  loadingText: {
    textAlign: 'center',
    color: '#666',
    paddingVertical: 20,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },

  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '50%',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  goalOption: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  selectedGoalOption: {
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
  },

  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },

  optionBuddy: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});