import { supabase } from './supabase';

export async function createGoal(
  friendshipId: string,
  title: string,
  description: string,
  isVerifiable: boolean
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('You must be logged in.');
  }

  const { data, error } = await supabase
    .from('goals')
    .insert({
      friendship_id: friendshipId,
      created_by: user.id,
      title: title.trim(),
      description: description.trim() || null,
      is_verifiable: isVerifiable,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getGoals(friendshipId: string) {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('friendship_id', friendshipId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export async function completeGoal(goalId: string) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('You must be logged in.');
  }

  const { data, error } = await supabase
    .from('goals')
    .update({
      completed_by: user.id,
      completed_at: new Date().toISOString(),
    })
    .eq('id', goalId)
    .eq('is_verifiable', false)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}