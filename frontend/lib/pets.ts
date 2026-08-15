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
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getPet(friendshipId: string) {
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

export async function updatePetHealth(
  friendshipId: string,
  health: number
) {
  const safeHealth = Math.max(0, Math.min(100, health));

  const { data, error } = await supabase
    .from('pets')
    .update({
      health: safeHealth,
    })
    .eq('friendship_id', friendshipId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}