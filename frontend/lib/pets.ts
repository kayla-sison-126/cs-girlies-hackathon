import { supabase } from './supabase';

export async function createPet(
  friendshipId: string,
  name: string
) {
  const { data, error } = await supabase
    .from('pets')
    .insert({
      friendship_id: friendshipId,
      name: name.trim() || 'Buddy',
      equipped_item: null,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getPet(
  friendshipId: string
) {
  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .eq('friendship_id', friendshipId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function equipPetItem(
  friendshipId: string,
  itemName: string
) {
  const { data, error } = await supabase
    .from('pets')
    .update({
      equipped_item: itemName,
    })
    .eq('friendship_id', friendshipId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function unequipPetItem(
  friendshipId: string
) {
  const { data, error } = await supabase
    .from('pets')
    .update({
      equipped_item: null,
    })
    .eq('friendship_id', friendshipId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}