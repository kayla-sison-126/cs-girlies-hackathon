import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MOCK_SHOP_ITEMS = [
  { id: 'i1', name: 'Party Hat', emoji: '🥳', price: 50, category: 'Hat' },
  { id: 'i2', name: 'Sunglasses', emoji: '🕶️', price: 80, category: 'Accessory' },
  { id: 'i3', name: 'Crown', emoji: '👑', price: 150, category: 'Hat' },
  { id: 'i4', name: 'Bowtie', emoji: '🎀', price: 40, category: 'Accessory' },
];

export default function PetShopScreen() {
  const [coins, setCoins] = useState(150);
  const [previewItem, setPreviewItem] = useState<{ name: string; emoji: string } | null>(null);
  const [equippedItem, setEquippedItem] = useState<string | null>(null);

  const handleBuyOrEquip = (item: typeof MOCK_SHOP_ITEMS[0]) => {
    if (equippedItem === item.id) {
      setEquippedItem(null); // Unequip
      return;
    }

    if (coins >= item.price) {
      setEquippedItem(item.id);
      alert(`Equipped ${item.name}!`);
    } else {
      alert('Not enough coins! Complete daily goals to earn more.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.headerBar}>
        <Text style={styles.title}>Pet Shop 🛒</Text>
        <View style={styles.coinBadge}>
          <Text style={styles.coinText}>💰 {coins} Coins</Text>
        </View>
      </View>

      {/* Try-On Preview Box */}
      <View style={styles.previewBox}>
        <Text style={styles.previewLabel}>TRY-ON PREVIEW</Text>
        <View style={styles.petStage}>
          {previewItem && <Text style={styles.previewEmojiOverlay}>{previewItem.emoji}</Text>}
          <Text style={styles.petBaseEmoji}>🐱</Text>
        </View>
        <Text style={styles.previewSub}>
          {previewItem ? `Previewing: ${previewItem.name}` : 'Tap an item below to preview it'}
        </Text>
      </View>

      {/* Shop Grid */}
      <FlatList
        data={MOCK_SHOP_ITEMS}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 20 }}
        renderItem={({ item }) => {
          const isEquipped = equippedItem === item.id;

          return (
            <TouchableOpacity
              style={[styles.shopCard, previewItem?.name === item.name && styles.activePreviewCard]}
              onPress={() => setPreviewItem(item)}
            >
              <Text style={styles.itemEmoji}>{item.emoji}</Text>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>💰 {item.price}</Text>

              <TouchableOpacity
                style={[styles.buyBtn, isEquipped && styles.equippedBtn]}
                onPress={() => handleBuyOrEquip(item)}
              >
                <Text style={styles.buyBtnText}>{isEquipped ? 'Equipped' : 'Buy / Equip'}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
      />
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
  coinBadge: { backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, elevation: 1 },
  coinText: { fontWeight: '700', color: '#D97706' },

  // Preview Box
  previewBox: {
    backgroundColor: '#FFF',
    margin: 20,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
  },
  previewLabel: { fontSize: 11, fontWeight: '800', color: '#888', letterSpacing: 1 },
  petStage: { position: 'relative', marginVertical: 10, alignItems: 'center' },
  previewEmojiOverlay: { fontSize: 32, position: 'absolute', top: -15, zIndex: 10 },
  petBaseEmoji: { fontSize: 64 },
  previewSub: { fontSize: 12, color: '#666', fontWeight: '500' },

  // Grid
  shopCard: {
    flex: 1,
    backgroundColor: '#FFF',
    margin: 6,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    elevation: 1,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activePreviewCard: { borderColor: '#4A90E2' },
  itemEmoji: { fontSize: 36, marginBottom: 6 },
  itemName: { fontSize: 14, fontWeight: '700' },
  itemPrice: { fontSize: 13, color: '#D97706', fontWeight: '600', marginVertical: 4 },
  buyBtn: { backgroundColor: '#4A90E2', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, marginTop: 6 },
  equippedBtn: { backgroundColor: '#4CAF50' },
  buyBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
});