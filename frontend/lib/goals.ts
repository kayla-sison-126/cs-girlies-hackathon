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
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('You must be logged in.');
  }

  const { data: goal, error: goalError } = await supabase
    .from('goals')
    .select(`
      id,
      created_by,
      assigned_to,
      is_verifiable,
      completed_at
    `)
    .eq('id', goalId)
    .single();

  if (goalError) {
    throw goalError;
  }

  if (goal.created_by !== user.id) {
    throw new Error(
      'Only the goal creator can verify this goal.'
    );
  }

  if (goal.completed_at) {
    return goal;
  }

  if (goal.is_verifiable) {
    throw new Error(
      'This goal requires photo proof.'
    );
  }

  return completeGoalWithRewards(goalId);
}

/**
 * Gets the latest photo proof submitted for a goal.
 */
export async function getGoalProof(goalId: string) {
  const { data, error } = await supabase
    .from('goal_proofs')
    .select(`
      id,
      goal_id,
      submitted_by,
      image_url,
      status,
      submitted_at,
      reviewed_at
    `)
    .eq('goal_id', goalId)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Approves a submitted photo proof.
 *
 * Only the creator of the goal is allowed to do this.
 */
export async function verifyGoalProof(
  goalId: string,
  proofId: string
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('You must be logged in.');
  }

  // Make sure this user actually created the goal.
  const { data: goal, error: goalError } = await supabase
    .from('goals')
    .select(`
      id,
      created_by,
      assigned_to,
      is_verifiable,
      completed_at
    `)
    .eq('id', goalId)
    .single();

  if (goalError) {
    throw goalError;
  }

  if (goal.created_by !== user.id) {
    throw new Error(
      'Only the goal creator can verify this goal.'
    );
  }

  if (!goal.is_verifiable) {
    throw new Error(
      'This goal does not require photo verification.'
    );
  }

  if (goal.completed_at) {
    return goal;
  }

  // Make sure this proof belongs to this goal.
  const { data: proof, error: proofError } = await supabase
    .from('goal_proofs')
    .select(`
      id,
      goal_id,
      submitted_by,
      status
    `)
    .eq('id', proofId)
    .eq('goal_id', goalId)
    .single();

  if (proofError) {
    throw proofError;
  }

  if (proof.status === 'approved') {
    return goal;
  }

  // Approve the proof.
  const { error: updateProofError } = await supabase
    .from('goal_proofs')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', proofId);

  if (updateProofError) {
    throw updateProofError;
  }

  // Complete the goal and give the normal rewards.
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