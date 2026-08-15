import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function FriendCameraScreen() {
  const { id, goalTitle } = useLocalSearchParams<{ id: string; goalTitle?: string }>();
  const router = useRouter();

  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (photo?.uri) {
        setPhotoUri(photo.uri);
      }
    }
  };

  const submitProof = () => {
    // TODO: Upload photo to Supabase storage & mark goal as submitted
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Hide default header so camera can take full screen */}
      <Stack.Screen options={{ headerShown: false }} />

      {photoUri ? (
        // PREVIEW MODE
        <View style={styles.fullScreen}>
          <Image source={{ uri: photoUri }} style={styles.previewImage} />
          <SafeAreaView style={styles.previewOverlay}>
            <Text style={styles.goalBanner}>
              Proof for: {goalTitle || 'Accountability Goal'}
            </Text>

            <View style={styles.previewActionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.retakeBtn]}
                onPress={() => setPhotoUri(null)}
              >
                <Ionicons name="refresh" size={20} color="#2D3436" />
                <Text style={styles.retakeBtnText}>Retake</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.submitBtn]}
                onPress={submitProof}
              >
                <Ionicons name="send" size={18} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>Send Proof</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      ) : (
        // CAMERA MODE
        <View style={styles.fullScreen}>
          {/* Absolutely positioned CameraView to prevent crashes */}
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing={facing} />

          <SafeAreaView style={styles.cameraOverlay}>
            {/* Top Bar with Back Button */}
            <View style={styles.topBar}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              {goalTitle && (
                <View style={styles.goalTag}>
                  <Text style={styles.goalTagText} numberOfLines={1}>
                    Target: {goalTitle}
                  </Text>
                </View>
              )}

              <TouchableOpacity style={styles.flipBtn} onPress={toggleCameraFacing}>
                <Ionicons name="camera-reverse" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Bottom Shutter Controls */}
            <View style={styles.bottomControls}>
              <TouchableOpacity
                style={styles.shutterOuter}
                onPress={takePicture}
                activeOpacity={0.8}
              >
                <View style={styles.shutterInner} />
              </TouchableOpacity>
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
    backgroundColor: '#000000',
  },
  fullScreen: {
    flex: 1,
    position: 'relative',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8F9FA',
  },
  permissionText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#2D3436',
    marginBottom: 16,
  },
  permissionBtn: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalTag: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    maxWidth: '60%',
  },
  goalTagText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  bottomControls: {
    alignItems: 'center',
    marginBottom: 24,
  },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  previewImage: {
    ...StyleSheet.absoluteFillObject,
  },
  previewOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  goalBanner: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    fontWeight: '600',
    marginTop: 12,
  },
  previewActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  retakeBtn: {
    backgroundColor: '#FFFFFF',
  },
  retakeBtnText: {
    color: '#2D3436',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#6C5CE7',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});