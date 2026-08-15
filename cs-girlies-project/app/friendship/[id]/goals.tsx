import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PairGoalsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [goals, setGoals] = useState([
    { id: 'pg1', title: 'Take a 10-min walk', requiresPhoto: true, isDone: false },
    { id: 'pg2', title: 'Drink 8 glasses of water', requiresPhoto: false, isDone: true },
  ]);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [requiresPhoto, setRequiresPhoto] = useState(true);

  const handleAddGoal = () => {
    if (!newGoalTitle.trim()) return;
    setGoals([
      ...goals,
      { id: Date.now().toString(), title: newGoalTitle, requiresPhoto, isDone: false },
    ]);
    setNewGoalTitle('');
    setIsAddModalOpen(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.title}>Pair Goals 🎯</Text>
          <Text style={styles.subtitle}>Complete these together to gain pet health</Text>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={() => setIsAddModalOpen(true)}>
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={goals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => (
          <View style={styles.goalCard}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.goalTitle}>{item.title}</Text>
              <Text style={styles.typeTag}>
                {item.requiresPhoto ? '📷 Photo Proof Required' : '✅ Standard Check-in'}
              </Text>
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
                      params: { friendshipId: id as string, goalId: item.id },
                    } as any);
                  } else {
                    setGoals(goals.map((g) => (g.id === item.id ? { ...g, isDone: true } : g)));
                  }
                }}
              >
                <Text style={styles.btnText}>
                  {item.requiresPhoto ? '📷 Proof' : '✅ Check'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      {/* Add Goal Modal */}
      <Modal visible={isAddModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add a Goal for Both of You</Text>

            <TextInput
              style={styles.input}
              placeholder="e.g. Read for 20 mins, Gym..."
              value={newGoalTitle}
              onChangeText={setNewGoalTitle}
            />

            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setRequiresPhoto(!requiresPhoto)}
            >
              <Ionicons
                name={requiresPhoto ? 'checkbox' : 'square-outline'}
                size={24}
                color="#4A90E2"
              />
              <Text style={styles.toggleText}>Require Photo Verification</Text>
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsAddModalOpen(false)}
              >
                <Text style={{ fontWeight: 'bold', color: '#666' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.createBtn} onPress={handleAddGoal}>
                <Text style={{ fontWeight: 'bold', color: '#FFF' }}>Create Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  headerBar: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 13, color: '#666', marginTop: 2 },
  addBtn: { backgroundColor: '#4A90E2', padding: 10, borderRadius: 12 },

  goalCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
  },
  goalTitle: { fontSize: 16, fontWeight: '700' },
  typeTag: { fontSize: 12, color: '#888', marginTop: 4 },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  photoBtn: { backgroundColor: '#FF6B6B' },
  checkBtn: { backgroundColor: '#4CAF50' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  doneBadge: { backgroundColor: '#E8F5E9', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  doneText: { color: '#2E7D32', fontWeight: 'bold', fontSize: 12 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 14 },
  input: { borderBottomWidth: 1, borderBottomColor: '#DDD', paddingVertical: 10, fontSize: 16, marginBottom: 20 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  toggleText: { marginLeft: 10, fontSize: 15, color: '#333' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancelBtn: { padding: 12 },
  createBtn: { backgroundColor: '#4A90E2', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10 },
});