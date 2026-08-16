import React, { useCallback, useState } from 'react';
import {
  equipPetItem,
  getPet,
} from '../../../lib/pets';

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
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

import {
  getShopItems,
  getUserCoins,
  getOwnedPetItems,
  purchasePetItem,
  PetItem,
} from '../../../lib/shop';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ShopItem = PetItem & {
  image: any;
};

export default function FriendshipShop() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [fontsLoaded] = useFonts({
    Itim: require('../../../assets/fonts/Itim.ttf'),
  });

  const [items, setItems] = useState<ShopItem[]>([]);
  const [selected, setSelected] = useState<ShopItem | null>(null);

  const [coins, setCoins] = useState(0);
  const [ownedItems, setOwnedItems] = useState<string[]>([]);
  const [equippedItem, setEquippedItem] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [buyingItem, setBuyingItem] = useState<string | null>(null);

  /*
   * ------------------------------------------------
   * LOCAL ITEM IMAGES
   * ------------------------------------------------
   *
   * These keep the existing Shop UI exactly the same.
   */

  const itemImages: Record<string, any> = {
    'Orange Bow': require('../../../assets/images/shop/item-previews/orange-bow.png'),
    'Pink Bow': require('../../../assets/images/shop/item-previews/pink-bow.png'),
    'Red Bow': require('../../../assets/images/shop/item-previews/red-bow.png'),
    'Brown Bow': require('../../../assets/images/shop/item-previews/brown-bow.png'),
    'Blue Bow': require('../../../assets/images/shop/item-previews/blue-bow.png'),
    'Green Bow': require('../../../assets/images/shop/item-previews/green-bow.png'),
  };

  /*
   * ------------------------------------------------
   * LOAD SHOP
   * ------------------------------------------------
   */

  const loadShop = useCallback(async () => {
    try {
      setLoading(true);

      const [
        shopItems,
        userCoins,
        userOwnedItems,
        pet,
      ] = await Promise.all([
        getShopItems(),
        getUserCoins(),
        getOwnedPetItems(),
        getPet(id),
      ]);

      const formattedItems: ShopItem[] =
        shopItems.map((item) => ({
          ...item,
          image:
            itemImages[item.name],
        }));

      setItems(formattedItems);
      setCoins(userCoins);

      const ownedItemIds =
        userOwnedItems.map(
          (ownedItem) => ownedItem.item_id
        );

      setOwnedItems(ownedItemIds);
      setEquippedItem(
        pet?.equipped_item ?? null
      );

      /*
       * Keep Pink Bow selected by default
       * if it exists.
       */

      const pinkBow =
        formattedItems.find(
          (item) => item.name === 'Pink Bow'
        );

      setSelected(
        pinkBow ||
        formattedItems[0] ||
        null
      );
    } catch (error) {
      console.error(
        'Failed to load shop:',
        error
      );

      Alert.alert(
        'Error',
        'Could not load the shop.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /*
   * Load the shop when the screen opens.
   */

  React.useEffect(() => {
    loadShop();
  }, [loadShop]);

  /*
   * ------------------------------------------------
   * BUY ITEM
   * ------------------------------------------------
   */


  async function handleEquip(item: ShopItem) {
    if (!ownedItems.includes(item.id)) {
      return;
    }

    try {
      await equipPetItem(id, item.name);

      setEquippedItem(item.name);
      setSelected(item);

      Alert.alert(
        'Equipped!',
        `${item.name} is now equipped on your pet.`
      );
    } catch (error) {
      console.error(
        'Failed to equip item:',
        error
      );

      Alert.alert(
        'Error',
        'Could not equip this item.'
      );
    }
  }

  async function handleBuy(item: ShopItem) {
    /*
     * Prevent duplicate taps.
     */

    if (buyingItem) {
      return;
    }

    /*
     * Check whether the item is already owned.
     */

    if (ownedItems.includes(item.id)) {
      Alert.alert(
        'Already Owned',
        `You already own ${item.name}.`
      );

      return;
    }

    /*
     * Check whether the user has enough coins.
     */

    if (coins < item.cost) {
      Alert.alert(
        'Not Enough Coins',
        `You need ${item.cost - coins
        } more coins to buy ${item.name}.`
      );

      return;
    }

    try {
      setBuyingItem(item.id);

      const result =
        await purchasePetItem(item.id);

      /*
       * Update the balance immediately.
       */

      setCoins(
        result.remainingCoins
      );

      /*
       * Mark the item as owned.
       */

      setOwnedItems(
        (currentOwned) => [
          ...currentOwned,
          item.id,
        ]
      );

      /*
       * Keep the item selected so the
       * try-on preview remains visible.
       */

      setSelected(item);

      Alert.alert(
        'Purchase Complete!',
        `You bought ${item.name}!`
      );
    } catch (error) {
      console.error(
        'Failed to purchase item:',
        error
      );

      Alert.alert(
        'Purchase Failed',
        error instanceof Error
          ? error.message
          : 'Could not purchase this item.'
      );
    } finally {
      setBuyingItem(null);
    }
  }

  /*
   * ------------------------------------------------
   * RENDER SHOP ITEM
   * ------------------------------------------------
   */

    const renderItem = ({
    item,
  }: {
    item: ShopItem;
  }) => {
    const isOwned =
      ownedItems.includes(item.id);

    const isBuying =
      buyingItem === item.id;

    const isEquipped =
      equippedItem === item.name;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setSelected(item)}
        activeOpacity={0.85}
      >
        <Text style={styles.itemTitle}>
          {item.name}
        </Text>

        <Text style={styles.priceText}>
          {item.cost} Coins
        </Text>

        <Image
          source={item.image}
          style={styles.itemImage}
          resizeMode="contain"
        />

        <TouchableOpacity
          style={[
            styles.buyButton,
            isOwned && styles.ownedButton,
          ]}
          onPress={() => {
            if (isOwned) {
              handleEquip(item);
            } else {
              handleBuy(item);
            }
          }}
          activeOpacity={0.8}
          disabled={isBuying || isEquipped}
        >
          {isBuying ? (
            <ActivityIndicator
              color="#FEF9F0"
              size="small"
            />
          ) : (
            <Text style={styles.buyButtonText}>
              {isEquipped
                ? 'Equipped'
                : isOwned
                  ? 'Equip'
                  : 'Buy'}
            </Text>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  /*
   * ------------------------------------------------
   * LOADING
   * ------------------------------------------------
   */

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#729AB5"
        />

        <Text style={styles.loadingText}>
          Loading shop...
        </Text>
      </View>
    );
  }

  /*
   * ------------------------------------------------
   * SHOP UI
   * ------------------------------------------------
   */

  return (
    <LinearGradient
      colors={[
        '#D2E7F5',
        '#E1EEF6',
      ]}
      style={styles.container}
    >
      <StatusBar hidden />

      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Background Grass Hill */}

      <View
        style={styles.grassWrapper}
        pointerEvents="none"
      >
        <Image
          source={require('../../../assets/images/GrassHill.png')}
          style={
            styles.grassHillBackground
          }
          resizeMode="stretch"
        />
      </View>

      <SafeAreaView
        style={{
          flex: 1,
          zIndex: 10,
        }}
      >
        <View style={styles.innerContainer}>
          {/* Header Controls */}

          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
            >
              <Ionicons
                name="chevron-back"
                size={28}
                color="#824A20"
              />
            </TouchableOpacity>

            <View
              style={styles.coinBadge}
            >
              <Ionicons
                name="sparkles"
                size={16}
                color="#824A20"
              />

              <Text
                style={styles.coinText}
              >
                {coins} Coins
              </Text>
            </View>
          </View>

          {/* Title & Active Try-On Text */}

          <View
            style={styles.titleSection}
          >
            <Text
              style={styles.pageTitle}
            >
              Shop
            </Text>

            <Text
              style={styles.subText}
            >
              Current Try-On:
            </Text>

            <Text
              style={
                styles.selectedItemText
              }
            >
              {selected
                ? selected.name
                : 'None'}
            </Text>
          </View>

          {/* Goat Stage Area */}

          <View
            style={styles.stageArea}
          >
            <Image
              source={require('../../../assets/images/shop/item-tryons/tryon-base.png')}
              style={styles.baseGoat}
              resizeMode="contain"
            />

            {selected && (
              <Image
                source={selected.image}
                style={styles.accessory}
                resizeMode="contain"
              />
            )}
          </View>

          {/* Items Section Header */}

          <Text
            style={styles.itemsHeader}
          >
            Items
          </Text>

          {/* Grid List */}

          <FlatList
            data={items}
            keyExtractor={(item) =>
              item.id
            }
            numColumns={2}
            contentContainerStyle={
              styles.listContainer
            }
            columnWrapperStyle={
              styles.columnWrapper
            }
            renderItem={renderItem}
            showsVerticalScrollIndicator={
              false
            }
            onRefresh={loadShop}
            refreshing={loading}
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

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E1EEF6',
  },

  loadingText: {
    marginTop: 10,
    fontFamily: 'Itim',
    fontSize: 16,
    color: '#824A20',
  },

  grassWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: '35.7%',
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
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

  ownedButton: {
    backgroundColor: '#8A9A5B',
  },

  buyButtonText: {
    fontFamily: 'Itim',
    fontSize: 14,
    color: '#FEF9F0',
    fontWeight: '700',
  },
});