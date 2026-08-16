import { supabase } from './supabase';
import { completeGoalWithRewards } from './rewards';

export async function createGoal(
  friendshipId: string,
  title: string,
  description: string,
  assignedTo: string,
  isVerifiable: boolean
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('You must be logged in.');
  }

  if (!assignedTo) {
    throw new Error('You must select who will complete this goal.');
  }

  const { data, error } = await supabase
    .from('goals')
    .insert({
      friendship_id: friendshipId,
      created_by: user.id,
      assigned_to: assignedTo,
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
    data: goal,
    error: goalError,
  } = await supabase
    .from('goals')
    .select('is_verifiable, completed_at')
    .eq('id', goalId)
    .single();

  if (goalError) {
    throw goalError;
  }

  if (goal.is_verifiable) {
    throw new Error(
      'This goal requires photo proof from your partner.'
    );
  }

  if (goal.completed_at) {
    return goal;
  }

  return completeGoalWithRewards(goalId);
}
