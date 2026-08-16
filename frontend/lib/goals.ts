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

export async function getAllUserGoals() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('You must be logged in.');
  }

  const { data: friendships, error: friendshipError } =
    await supabase
      .from('friendships')
      .select('*')
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`);

  if (friendshipError) {
    throw friendshipError;
  }

  if (!friendships || friendships.length === 0) {
    return {
      goals: [],
      friendships: [],
      userId: user.id,
    };
  }

  const friendshipIds = friendships.map(
    (friendship) => friendship.id
  );

  const { data: goals, error: goalError } =
    await supabase
      .from('goals')
      .select('*')
      .in('friendship_id', friendshipIds)
      .order('created_at', {
        ascending: false,
      });

  if (goalError) {
    throw goalError;
  }

  return {
    goals: goals || [],
    friendships,
    userId: user.id,
  };
}
