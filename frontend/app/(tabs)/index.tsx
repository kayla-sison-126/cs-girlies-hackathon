import React from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const MOCK_FRIENDSHIPS = [
  { id: 'f1', friendName: 'Sarah', petName: 'Whiskers', petEmoji: '🐱', streakDays: 12, hearts: 3, maxHearts: 5, coins: 150 },
  { id: 'f2', friendName: 'Alex', petName: 'Barnaby', petEmoji: '🐶', streakDays: 4, hearts: 2, maxHearts: 5, coins: 40 },
  { id: 'f3', friendName: 'Maya', petName: 'Bubbles', petEmoji: '🐰', streakDays: 21, hearts: 5, maxHearts: 5, coins: 310 },
];

export default function StreakBuddiesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.title}>Streak Buddies 🐾</Text>
        <Text style={styles.subtitle}>Keep your pets alive together!</Text>
      </View>

      <FlatList
        data={MOCK_FRIENDSHIPS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => router.push(`/friendship/${item.id}` as any)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.friendName}>With {item.friendName}</Text>
              <View style={styles.badge}>
                <Text style={styles.streakText}>🔥 {item.streakDays} Days</Text>
              </View>
            </View>

            <View style={styles.petSection}>
              <Text style={styles.petEmoji}>{item.petEmoji}</Text>
              <View style={styles.petDetails}>
                <Text style={styles.petName}>{item.petName}</Text>
                <Text style={styles.subText}>
                  ❤️ {item.hearts}/{item.maxHearts} Hearts  •  💰 {item.coins} Coins
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#BBB" />
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  headerBar: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1A1A1A' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 2 },
  listContainer: { paddingHorizontal: 20, paddingBottom: 30 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 14, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  friendName: { fontSize: 17, fontWeight: '700', color: '#2C3E50' },
  badge: { backgroundColor: '#FFEBEB', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  streakText: { fontSize: 13, fontWeight: '700', color: '#FF6B6B' },
  petSection: { flexDirection: 'row', alignItems: 'center' },
  petEmoji: { fontSize: 38 },
  petDetails: { flex: 1, marginLeft: 14 },
  petName: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  subText: { fontSize: 13, color: '#666', marginTop: 3 },
});