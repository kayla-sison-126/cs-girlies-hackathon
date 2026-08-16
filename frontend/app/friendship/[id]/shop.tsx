import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ShopItem = {
  id: string;
  title: string;
  price: number;
  image: any;
};

export default function FriendshipShop() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Itim: require('../../../assets/fonts/Itim.ttf'),
  });

  const items: ShopItem[] = [
    {
      id: 'bow-orange',
      title: 'Orange Bow',
      price: 350,
      image: require('../../../assets/images/shop/item-previews/orange-bow.png'),
    },
    {
      id: 'bow-pink',
      title: 'Pink Bow',
      price: 400,
      image: require('../../../assets/images/shop/item-previews/pink-bow.png'),
    },
    {
      id: 'bow-red',
      title: 'Red Bow',
      price: 450,
      image: require('../../../assets/images/shop/item-previews/red-bow.png'),
    },
    {
      id: 'bow-green',
      title: 'Green Bow',
      price: 500,
      image: require('../../../assets/images/shop/item-previews/green-bow.png'),
    },
  ];

  const [selected, setSelected] = useState<ShopItem | null>(items[1]);

  if (!fontsLoaded) return null;

  const renderItem = ({ item }: { item: ShopItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => setSelected(item)}
      activeOpacity={0.85}
    >
      <Text style={styles.itemTitle}>{item.title}</Text>
      <Text style={styles.priceText}>${item.price}</Text>

      <Image source={item.image} style={styles.itemImage} resizeMode="contain" />

      <TouchableOpacity
        style={styles.buyButton}
        onPress={() => Alert.alert('Purchase', `Bought ${item.title} for $${item.price}`)}
        activeOpacity={0.8}
      >
        <Text style={styles.buyButtonText}>Buy</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#D2E7F5', '#E1EEF6']} style={styles.container}>
      <StatusBar hidden />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Background Grass Hill */}
      <View style={styles.grassWrapper} pointerEvents="none">
        <Image
          source={require('../../../assets/images/GrassHill.png')}
          style={styles.grassHillBackground}
          resizeMode="stretch"
        />
      </View>

      <SafeAreaView style={{ flex: 1, zIndex: 10 }}>
        <View style={styles.innerContainer}>
          {/* Header Controls */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={28} color="#824A20" />
            </TouchableOpacity>

            <View style={styles.coinBadge}>
              <Text style={styles.coinText}>$410</Text>
            </View>
          </View>

          {/* Title & Active Try-On Text */}
          <View style={styles.titleSection}>
            <Text style={styles.pageTitle}>Shop</Text>
            <Text style={styles.subText}>Current Try-On:</Text>
            <Text style={styles.selectedItemText}>
              {selected ? selected.title : 'None'}
            </Text>
          </View>

          {/* Goat Stage Area */}
          <View style={styles.stageArea}>
            <Image
              source={require('../../../assets/images/shop/item-tryons/tryon-base.png')}
              style={styles.baseGoat}
              resizeMode="contain"
            />
            {selected && (
              <Image source={selected.image} style={styles.accessory} resizeMode="contain" />
            )}
          </View>

          {/* Items Section Header */}
          <Text style={styles.itemsHeader}>Items</Text>

          {/* Grid List */}
          <FlatList
            data={items}
            keyExtractor={(i) => i.id}
            numColumns={2}
            contentContainerStyle={styles.listContainer}
            columnWrapperStyle={styles.columnWrapper}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  grassWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: '35.7%', // Anchors top edge right under the goat stage without clipping
    zIndex: 1,
  },
  grassHillBackground: {
    width: '100%',
    height: '100%',
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  backBtn: {
    padding: 4,
  },
  coinBadge: { 
    backgroundColor: '#FFF8EC', 
    borderRadius: 20, 
    borderWidth: 3.5, 
    borderColor: '#C7967D', 
    paddingHorizontal: 16,
    marginRight: 4, 
    paddingVertical: 4, 
    shadowColor: '#8a6b59', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 6, 
  },
  coinText: {
    fontFamily: 'Itim',
    fontSize: 16,
    color: '#824A20',
    fontWeight: '700',
  },
  titleSection: {
    marginTop: 8,
    marginLeft: 8,
  },
  pageTitle: {
    fontFamily: 'Itim',
    fontSize: 32,
    color: '#824A20',
    fontWeight: '700',
  },
  subText: {
    fontFamily: 'Itim',
    fontSize: 14,
    color: '#824A20',
    marginTop: 2,
  },
  selectedItemText: {
    fontFamily: 'Itim',
    fontSize: 14,
    color: '#824A20',
    fontWeight: '700',
  },
  stageArea: {
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  baseGoat: {
    width: 160,
    height: 160,
  },
  accessory: {
    position: 'absolute',
    width: 45,
    height: 45,
    top: 12,
    right: SCREEN_WIDTH * 0.33,
  },
  itemsHeader: {
    fontFamily: 'Itim',
    fontSize: 22,
    color: '#824A20',
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 8,
    marginLeft: 8,
  },
  listContainer: {
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#FDF5E6',
    borderRadius: 24,
    borderWidth: 4,
    borderColor: '#C7967D',
    padding: 12,
    marginBottom: 14,
    alignItems: 'center',
  },
  itemTitle: {
    fontFamily: 'Itim',
    fontSize: 16,
    color: '#824A20',
    fontWeight: '700',
    alignSelf: 'flex-start',
  },
  priceText: {
    fontFamily: 'Itim',
    fontSize: 12,
    color: '#824A20',
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  itemImage: {
    width: 55,
    height: 55,
    marginVertical: 4,
  },
  buyButton: {
    backgroundColor: '#729AB5',
    borderRadius: 16,
    paddingVertical: 6,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  buyButtonText: {
    fontFamily: 'Itim',
    fontSize: 14,
    color: '#FEF9F0',
    fontWeight: '700',
  },
});