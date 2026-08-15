import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PetHomeScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  // Mock State for this friendship pet
  const [petData, setPetData] = useState({
    friendName: 'Sarah',
    petName: 'Whiskers',
    petEmoji: '🐱',
    streakDays: 12,
    hearts: 3,
    maxHearts: 5,
    coins: 150,
    equippedHat: '🎩 Top Hat',
    equippedAccessory: '🕶️ Sunglasses',
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/')}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>With {petData.friendName}</Text>
        <View style={styles.coinBadge}>
          <Text style={styles.coinText}>💰 {petData.coins}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
    
        {/* Pet Stage Display */}
        <View style={styles.petStage}>
          {/* Accessories Overlay Display */}
          <View style={styles.accessoriesRow}>
            {petData.equippedHat ? <Text style={styles.equippedBadge}>{petData.equippedHat}</Text> : null}
            {petData.equippedAccessory ? <Text style={styles.equippedBadge}>{petData.equippedAccessory}</Text> : null}
          </View>

          <Text style={styles.petGraphic}>{petData.petEmoji}</Text>
          <Text style={styles.petNameText}>{petData.petName}</Text>

          {/* Hearts Health System */}
          <View style={styles.heartsRow}>
            {Array.from({ length: petData.maxHearts }).map((_, i) => (
              <Ionicons
                key={i}
                name={i < petData.hearts ? 'heart' : 'heart-outline'}
                size={28}
                color="#FF6B6B"
                style={{ marginHorizontal: 3 }}
              />
            ))}
          </View>
          <Text style={styles.heartsStatusText}>
            {petData.hearts}/{petData.maxHearts} Health Remaining
          </Text>
        </View>

        {/* Streak Counter Card */}
        <View style={styles.streakCard}>
          <Text style={styles.streakFlame}>🔥</Text>
          <Text style={styles.streakCount}>{petData.streakDays} Day Streak!</Text>
          <Text style={styles.streakSub}>Keep completing goals to protect {petData.petName}</Text>
        </View>

        {/* Nudge / Quick Action Bar */}
        <TouchableOpacity
          style={styles.nudgeBtn}
          onPress={() => alert(`You nudged ${petData.friendName} to complete today's goals!`)}
        >
          <Ionicons name="notifications" size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.nudgeBtnText}>Nudge {petData.friendName}!</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F5' },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  coinBadge: { backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, elevation: 1 },
  coinText: { fontWeight: '700', color: '#D97706', fontSize: 14 },

  content: { padding: 20, alignItems: 'center' },
  streakCard: {
    backgroundColor: '#FFF',
    width: '100%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    marginBottom: 20,
  },
  streakFlame: { fontSize: 28, marginBottom: 4 },
  streakCount: { fontSize: 20, fontWeight: '800', color: '#FF6B6B' },
  streakSub: { fontSize: 12, color: '#777', marginTop: 2 },

  petStage: {
    backgroundColor: '#FFF',
    width: '100%',
    paddingVertical: 30,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 2,
    marginBottom: 20,
  },
  accessoriesRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  equippedBadge: { backgroundColor: '#F0F4F8', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontSize: 12, fontWeight: '600' },
  petGraphic: { fontSize: 90, marginVertical: 10 },
  petNameText: { fontSize: 22, fontWeight: '800', color: '#2C3E50', marginBottom: 8 },
  heartsRow: { flexDirection: 'row', marginBottom: 6 },
  heartsStatusText: { fontSize: 13, fontWeight: '600', color: '#888' },

  nudgeBtn: {
    backgroundColor: '#4A90E2',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nudgeBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});