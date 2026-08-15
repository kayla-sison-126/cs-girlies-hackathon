import { supabase } from './supabase';

export async function createPairing() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('You must be logged in to create a pairing.');
  }

  const pairingCode = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();

  const { data, error } = await supabase
    .from('friendships')
    .insert({
      user_a_id: user.id,
      pairing_code: pairingCode,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function joinPairing(pairingCode: string) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('You must be logged in to join a pairing.');
  }

  const code = pairingCode.trim().toUpperCase();

  const { data: friendship, error: findError } = await supabase
    .from('friendships')
    .select('*')
    .eq('pairing_code', code)
    .is('user_b_id', null)
    .single();

  if (findError) {
    throw new Error('Pairing code not found or already used.');
  }

  if (friendship.user_a_id === user.id) {
    throw new Error('You cannot join your own pairing.');
  }

  const { data, error } = await supabase
    .from('friendships')
    .update({
      user_b_id: user.id,
    })
    .eq('id', friendship.id)
    .is('user_b_id', null)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getMyFriendships() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('You must be logged in to view your friendships.');
  }

  const { data, error } = await supabase
    .from('friendships')
    .select('*')
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}