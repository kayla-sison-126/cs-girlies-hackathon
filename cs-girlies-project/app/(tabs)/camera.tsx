import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Image,
  FlatList,
  Modal,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Mock list of active goals for selection after taking a photo
const MOCK_ACTIVE_GOALS = [
  { id: 'g1', friendshipId: 'f1', friendName: 'Sarah', title: 'Take a 10-min walk' },
  { id: 'g3', friendshipId: 'f2', friendName: 'Alex', title: 'Study for 1 hour' },
  { id: 'g5', friendshipId: 'f3', friendName: 'Maya', title: 'Gym Workout' },
];

export default function GlobalCameraScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  // Selected goal state (initializes from route params if passed from a goal card)
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(
    (params.goalId as string) || null
  );
  const [isPickerOpen, setIsPickerOpen] = useState(false);

const cameraRef = useRef<CameraView>(null);

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.message}>We need camera access to submit goal proof!</Text>
        <TouchableOpacity style={styles.permButton} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // 1. Take Photo Action
  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (photo?.uri) {
        setCapturedPhoto(photo.uri);
      }
    }
  };

  // Find object of currently selected goal
  const currentSelectedGoal = MOCK_ACTIVE_GOALS.find((g) => g.id === selectedGoalId);

  // 2. Submit Proof Action
  const handleSubmitProof = () => {
    if (!selectedGoalId) {
      alert('Please select a goal for this photo!');
      setIsPickerOpen(true);
      return;
    }

    alert(`Proof submitted for "${currentSelectedGoal?.title}"!`);
    // Reset and return home
    setCapturedPhoto(null);
    router.push('/');
  };

  return (
    <View style={styles.container}>
      {/* SCENARIO A: PREVIEW CAPTURED PHOTO */}
      {capturedPhoto ? (
        <View style={StyleSheet.absoluteFillObject}>
          <Image source={{ uri: capturedPhoto }} style={StyleSheet.absoluteFillObject} />

          <SafeAreaView style={styles.overlayContainer}>
            {/* Top Bar: Retake & Status */}
            <View style={styles.topBanner}>
              <TouchableOpacity
                style={styles.retakeBtn}
                onPress={() => setCapturedPhoto(null)}
              >
                <Ionicons name="close" size={24} color="#FFF" />
                <Text style={styles.retakeText}>Retake</Text>
              </TouchableOpacity>

              <Text style={styles.bannerTitle}>Proof Preview</Text>
              <View style={{ width: 60 }} />
            </View>

            {/* Bottom Controls: Goal Selector & Send */}
            <View style={styles.reviewBottomBar}>
              {/* Goal Selector Trigger */}
              <TouchableOpacity
                style={styles.goalSelectorCard}
                onPress={() => setIsPickerOpen(true)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectorLabel}>ATTACH TO GOAL:</Text>
                  <Text style={styles.selectedGoalTitle}>
                    {currentSelectedGoal
                      ? `${currentSelectedGoal.title} (${currentSelectedGoal.friendName})`
                      : 'Tap to select a goal...'}
                  </Text>
                </View>
                <Ionicons name="chevron-up" size={20} color="#FF6B6B" />
              </TouchableOpacity>

              {/* Submit Button */}
              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitProof}>
                <Ionicons name="paper-plane" size={20} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.submitBtnText}>Send Proof</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {/* Goal Picker Modal */}
          <Modal visible={isPickerOpen} animationType="slide" transparent={true}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Goal for Proof</Text>
                  <TouchableOpacity onPress={() => setIsPickerOpen(false)}>
                    <Ionicons name="close-circle" size={26} color="#999" />
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={MOCK_ACTIVE_GOALS}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.goalOption,
                        selectedGoalId === item.id && styles.selectedGoalOption,
                      ]}
                      onPress={() => {
                        setSelectedGoalId(item.id);
                        setIsPickerOpen(false);
                      }}
                    >
                      <View>
                        <Text style={styles.optionTitle}>{item.title}</Text>
                        <Text style={styles.optionBuddy}>Buddy: {item.friendName}</Text>
                      </View>
                      {selectedGoalId === item.id && (
                        <Ionicons name="checkmark-circle" size={22} color="#FF6B6B" />
                      )}
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          </Modal>
        </View>
      ) : (
        /* SCENARIO B: ACTIVE CAMERA VIEW */
        <View style={StyleSheet.absoluteFillObject}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFillObject}
            facing={facing}
          />

          <SafeAreaView style={styles.overlayContainer} pointerEvents="box-none">
            <View style={styles.topBanner}>
              <Text style={styles.bannerTitle}>Snap Proof Photo 📷</Text>
            </View>

            <View style={styles.bottomControls}>
              <TouchableOpacity
                style={styles.flipBtn}
                onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
              >
                <Ionicons name="camera-reverse" size={28} color="#FFF" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.shutterBtn} onPress={takePicture}>
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
  container: { flex: 1, backgroundColor: '#000' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  message: { fontSize: 16, textAlign: 'center', marginBottom: 20, color: '#333' },
  permButton: { backgroundColor: '#FF6B6B', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10 },
  permBtnText: { color: '#FFF', fontWeight: 'bold' },

  overlayContainer: { flex: 1, justifyContent: 'space-between' },
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
  bannerTitle: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  retakeBtn: { flexDirection: 'row', alignItems: 'center' },
  retakeText: { color: '#FFF', fontSize: 14, marginLeft: 4 },

  bottomControls: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 30 },
  flipBtn: { backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 25 },
  shutterBtn: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FF6B6B' },

  // Review & Modal Styles
  reviewBottomBar: { padding: 20, backgroundColor: 'rgba(0,0,0,0.7)', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  goalSelectorCard: {
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectorLabel: { fontSize: 11, fontWeight: 'bold', color: '#888', marginBottom: 2 },
  selectedGoalTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  submitBtn: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '50%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  goalOption: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedGoalOption: { backgroundColor: '#FFF5F5', borderRadius: 8 },
  optionTitle: { fontSize: 15, fontWeight: '600' },
  optionBuddy: { fontSize: 12, color: '#666', marginTop: 2 },
});