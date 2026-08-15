import React from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';

const MOCK_ALL_GOALS = [
  { id: 'g1', friendshipId: 'f1', friendName: 'Sarah', title: 'Take a 10-min walk', requiresPhoto: true, isDone: false },
  { id: 'g2', friendshipId: 'f1', friendName: 'Sarah', title: 'Drink 8 glasses of water', requiresPhoto: false, isDone: true },
  { id: 'g3', friendshipId: 'f2', friendName: 'Alex', title: 'Study for 1 hour', requiresPhoto: true, isDone: false },
  { id: 'g4', friendshipId: 'f3', friendName: 'Maya', title: 'Read 10 pages of a book', requiresPhoto: false, isDone: false },
];

export default function AllGoalsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.title}>All Goals 📋</Text>
        <Text style={styles.subtitle}>Your master accountability checklist</Text>
      </View>

      <FlatList
        data={MOCK_ALL_GOALS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={[styles.goalCard, item.isDone && styles.completedCard]}>
            <View style={styles.goalInfo}>
              <Text style={[styles.goalTitle, item.isDone && styles.completedText]}>
                {item.title}
              </Text>
              <Text style={styles.friendTag}>Buddy: {item.friendName}</Text>
            </View>

            {item.isDone ? (
              <View style={styles.doneBadge}>
                <Text style={styles.doneText}>✓ Completed</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.actionBtn, item.requiresPhoto ? styles.photoBtn : styles.checkBtn]}
                onPress={() => {
                  if (item.requiresPhoto) {
                    router.push({
                      pathname: '/(tabs)/camera',
                      params: { friendshipId: item.friendshipId, goalId: item.id },
                    } as any);
                  }
                }}
              >
                <Text style={styles.btnText}>
                  {item.requiresPhoto ? '📷 Proof' : '✅ Complete'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
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
  goalCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 1 },
  completedCard: { backgroundColor: '#F0F4F8', opacity: 0.8 },
  goalInfo: { flex: 1, marginRight: 10 },
  goalTitle: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  completedText: { textDecorationLine: 'line-through', color: '#888' },
  friendTag: { fontSize: 12, color: '#4A90E2', marginTop: 4, fontWeight: '600' },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  photoBtn: { backgroundColor: '#FF6B6B' },
  checkBtn: { backgroundColor: '#4CAF50' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  doneBadge: { backgroundColor: '#E8F5E9', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  doneText: { color: '#2E7D32', fontWeight: 'bold', fontSize: 12 },
});