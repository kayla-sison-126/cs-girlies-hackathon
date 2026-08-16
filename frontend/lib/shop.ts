import { supabase } from './supabase';

/*
 * ------------------------------------------------
 * TYPES
 * ------------------------------------------------
 */

export type PetItem = {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  created_at?: string;
};

export type OwnedPetItem = {
  id: string;
  item_id: string;
  purchased_at: string | null;
  pet_items: PetItem[] | null;
};

/*
 * ------------------------------------------------
 * GET CURRENT USER
 * ------------------------------------------------
 */

async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('You must be logged in.');
  }

  return user;
}

/*
 * ------------------------------------------------
 * GET SHOP ITEMS
 * ------------------------------------------------
 */

export async function getShopItems(): Promise<PetItem[]> {
  const { data, error } = await supabase
    .from('pet_items')
    .select('*')
    .order('cost', { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []) as PetItem[];
}

/*
 * ------------------------------------------------
 * GET USER COINS
 * ------------------------------------------------
 */

export async function getUserCoins(): Promise<number> {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from('user_stats')
    .select('points')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.points ?? 0;
}

/*
 * ------------------------------------------------
 * GET OWNED PET ITEMS
 * ------------------------------------------------
 */

export async function getOwnedPetItems(): Promise<
  OwnedPetItem[]
> {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from('user_pet_items')
    .select(`
      id,
      item_id,
      purchased_at,
      pet_items (
        id,
        name,
        emoji,
        cost
      )
    `)
    .eq('user_id', user.id);

  if (error) {
    throw error;
  }

  return (data || []) as unknown as OwnedPetItem[];
}

/*
 * ------------------------------------------------
 * CHECK OWNERSHIP
 * ------------------------------------------------
 */

export async function ownsPetItem(
  itemId: string
): Promise<boolean> {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from('user_pet_items')
    .select('id')
    .eq('user_id', user.id)
    .eq('item_id', itemId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return !!data;
}

/*
 * ------------------------------------------------
 * PURCHASE PET ITEM
 * ------------------------------------------------
 *
 * This:
 *
 * 1. Gets the item.
 * 2. Checks if the user already owns it.
 * 3. Gets the user's current coins.
 * 4. Checks whether they can afford it.
 * 5. Deducts the cost.
 * 6. Adds the item to their inventory.
 *
 */

export async function purchasePetItem(
  itemId: string
) {
  const user = await getCurrentUser();

  /*
   * Get the item.
   */

  const {
    data: item,
    error: itemError,
  } = await supabase
    .from('pet_items')
    .select('*')
    .eq('id', itemId)
    .single();

  if (itemError) {
    throw itemError;
  }

  /*
   * Check whether the user already owns it.
   */

  const {
    data: existingItem,
    error: ownedError,
  } = await supabase
    .from('user_pet_items')
    .select('id')
    .eq('user_id', user.id)
    .eq('item_id', itemId)
    .maybeSingle();

  if (ownedError) {
    throw ownedError;
  }

  if (existingItem) {
    throw new Error(
      'You already own this item.'
    );
  }

  /*
   * Get current coins.
   */

  const {
    data: stats,
    error: statsError,
  } = await supabase
    .from('user_stats')
    .select('points')
    .eq('user_id', user.id)
    .maybeSingle();

  if (statsError) {
    throw statsError;
  }

  const currentCoins =
    stats?.points ?? 0;

  /*
   * Check affordability.
   */

  if (currentCoins < item.cost) {
    throw new Error(
      `You need ${
        item.cost - currentCoins
      } more coins.`
    );
  }

  /*
   * Deduct coins.
   */

  const {
    error: updateCoinsError,
  } = await supabase
    .from('user_stats')
    .update({
      points:
        currentCoins - item.cost,
    })
    .eq('user_id', user.id);

  if (updateCoinsError) {
    throw updateCoinsError;
  }

  /*
   * Add item to inventory.
   */

  const {
    data: purchasedItem,
    error: purchaseError,
  } = await supabase
    .from('user_pet_items')
    .insert({
      user_id: user.id,
      item_id: itemId,
    })
    .select()
    .single();

  /*
   * If adding the item fails,
   * restore the user's coins.
   */

  if (purchaseError) {
    await supabase
      .from('user_stats')
      .update({
        points: currentCoins,
      })
      .eq('user_id', user.id);

    throw purchaseError;
  }

  return {
    purchasedItem,
    item,
    remainingCoins:
      currentCoins - item.cost,
  };
}