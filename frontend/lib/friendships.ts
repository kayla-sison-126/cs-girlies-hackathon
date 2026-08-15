import { supabase } from './supabase';

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('You must be logged in.');
  }

  return user;
}

export async function getFriendship(friendshipId: string) {
  const { data, error } = await supabase
    .from('friendships')
    .select('*')
    .eq('id', friendshipId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getFriendId(
  friendshipId: string,
  currentUserId: string
) {
  const friendship = await getFriendship(friendshipId);

  const friendId =
    friendship.user_a_id === currentUserId
      ? friendship.user_b_id
      : friendship.user_a_id;

  if (!friendId) {
    throw new Error('Could not find your friend.');
  }

  return friendId;
}

export async function getFriendProfile(friendId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', friendId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getFriendshipPet(
  friendshipId: string
) {
  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .eq('friendship_id', friendshipId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getUserStats(userId: string) {
  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}