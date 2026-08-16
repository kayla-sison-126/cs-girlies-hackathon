import { supabase } from './supabase';
import { uploadGoalProof } from './storage';

/*
 * Submit a photo proof for a goal.
 *
 * IMPORTANT:
 * Only the user assigned to the goal can submit proof.
 *
 * The goal creator is the person who will review it.
 */
export async function submitGoalProof(
  goalId: string,
  photoUri: string
) {
  if (!goalId) {
    throw new Error('Goal ID is missing.');
  }

  if (!photoUri) {
    throw new Error('Photo is missing.');
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error(
      'You must be logged in to submit proof.'
    );
  }

  /*
   * Get the goal and verify ownership.
   */
  const { data: goal, error: goalError } =
    await supabase
      .from('goals')
      .select(`
        id,
        created_by,
        assigned_to,
        friendship_id
      `)
      .eq('id', goalId)
      .maybeSingle();

  if (goalError) {
    throw goalError;
  }

  if (!goal) {
    throw new Error(
      'Goal could not be found.'
    );
  }

  /*
   * There must be an assigned user.
   */
  if (!goal.assigned_to) {
    throw new Error(
      'This goal is not assigned to anyone, so it cannot receive photo proof.'
    );
  }

  /*
   * The creator and assignee must be different.
   */
  if (
    !goal.created_by ||
    goal.created_by === goal.assigned_to
  ) {
    throw new Error(
      'This goal is not a valid accountability goal.'
    );
  }

  /*
   * ONLY the assigned user can submit.
   */
  if (goal.assigned_to !== user.id) {
    throw new Error(
      'Only the person assigned to this goal can submit proof.'
    );
  }

  /*
   * Make sure the current user is actually one of
   * the two people in the friendship.
   */
  const { data: friendship, error: friendshipError } =
    await supabase
      .from('friendships')
      .select(`
        id,
        user_a_id,
        user_b_id
      `)
      .eq('id', goal.friendship_id)
      .maybeSingle();

  if (friendshipError) {
    throw friendshipError;
  }

  if (!friendship) {
    throw new Error(
      'Friendship could not be found.'
    );
  }

  const isFriendshipMember =
    friendship.user_a_id === user.id ||
    friendship.user_b_id === user.id;

  if (!isFriendshipMember) {
    throw new Error(
      'You are not a member of this friendship.'
    );
  }

  /*
   * Upload photo.
   */
  const publicUrl = await uploadGoalProof(
    photoUri,
    user.id,
    goalId
  );

  /*
   * Save proof as pending.
   *
   * submitted_by MUST be the assigned user.
   */
  const { data, error } = await supabase
    .from('goal_proofs')
    .insert({
      goal_id: goalId,
      submitted_by: user.id,
      image_url: publicUrl,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}


/*
 * Get the most recent proof for a goal.
 */
export async function getLatestGoalProof(
  goalId: string
) {
  const { data, error } = await supabase
    .from('goal_proofs')
    .select('*')
    .eq('goal_id', goalId)
    .order('submitted_at', {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}


/*
 * Approve a goal proof.
 *
 * ONLY the goal creator can approve.
 *
 * The person who submitted the proof can NEVER
 * approve their own proof.
 */
export async function approveGoalProof(
  proofId: string
) {
  if (!proofId) {
    throw new Error(
      'Proof ID is missing.'
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error(
      'You must be logged in to review proof.'
    );
  }

  /*
   * Get proof + goal information first.
   */
  const { data: proof, error: proofError } =
    await supabase
      .from('goal_proofs')
      .select(`
        id,
        status,
        submitted_by,
        goal_id,
        goals (
          id,
          created_by,
          assigned_to,
          friendship_id
        )
      `)
      .eq('id', proofId)
      .maybeSingle();

  if (proofError) {
    throw proofError;
  }

  if (!proof) {
    throw new Error(
      'Proof could not be found.'
    );
  }

  const goal = Array.isArray(proof.goals)
    ? proof.goals[0]
    : proof.goals;

  if (!goal) {
    throw new Error(
      'The goal associated with this proof could not be found.'
    );
  }

  /*
   * Only pending proofs can be approved.
   */
  if (proof.status !== 'pending') {
    throw new Error(
      'This proof has already been reviewed.'
    );
  }

  /*
   * The goal must have two different people.
   */
  if (
    !goal.created_by ||
    !goal.assigned_to ||
    goal.created_by === goal.assigned_to
  ) {
    throw new Error(
      'This goal is not a valid accountability goal.'
    );
  }

  /*
   * The proof submitter must be the assigned user.
   */
  if (
    proof.submitted_by !==
    goal.assigned_to
  ) {
    throw new Error(
      'This proof was not submitted by the person assigned to the goal.'
    );
  }

  /*
   * ONLY the goal creator can review.
   */
  if (
    goal.created_by !== user.id
  ) {
    throw new Error(
      'Only the person who created this goal can review the proof.'
    );
  }

  /*
   * Extra protection against self-review.
   */
  if (
    proof.submitted_by === user.id
  ) {
    throw new Error(
      'You cannot approve your own proof.'
    );
  }

  /*
   * Update only this exact pending proof.
   *
   * We do not use .single() here because RLS may
   * intentionally return zero rows if the database
   * rejects the update.
   */
  const { data, error } = await supabase
    .from('goal_proofs')
    .update({
      status: 'approved',
      reviewed_at:
        new Date().toISOString(),
    })
    .eq('id', proofId)
    .eq('status', 'pending')
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      'The proof could not be approved. The database may have rejected this review.'
    );
  }

  return data;
}


/*
 * Decline a goal proof.
 *
 * ONLY the goal creator can decline.
 */
export async function declineGoalProof(
  proofId: string
) {
  if (!proofId) {
    throw new Error(
      'Proof ID is missing.'
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error(
      'You must be logged in to review proof.'
    );
  }

  /*
   * Get proof + goal information first.
   */
  const { data: proof, error: proofError } =
    await supabase
      .from('goal_proofs')
      .select(`
        id,
        status,
        submitted_by,
        goal_id,
        goals (
          id,
          created_by,
          assigned_to,
          friendship_id
        )
      `)
      .eq('id', proofId)
      .maybeSingle();

  if (proofError) {
    throw proofError;
  }

  if (!proof) {
    throw new Error(
      'Proof could not be found.'
    );
  }

  const goal = Array.isArray(proof.goals)
    ? proof.goals[0]
    : proof.goals;

  if (!goal) {
    throw new Error(
      'The goal associated with this proof could not be found.'
    );
  }

  if (proof.status !== 'pending') {
    throw new Error(
      'This proof has already been reviewed.'
    );
  }

  if (
    !goal.created_by ||
    !goal.assigned_to ||
    goal.created_by === goal.assigned_to
  ) {
    throw new Error(
      'This goal is not a valid accountability goal.'
    );
  }

  /*
   * The submitted proof must belong to the
   * assigned user.
   */
  if (
    proof.submitted_by !==
    goal.assigned_to
  ) {
    throw new Error(
      'This proof was not submitted by the person assigned to the goal.'
    );
  }

  /*
   * ONLY the goal creator can decline.
   */
  if (
    goal.created_by !== user.id
  ) {
    throw new Error(
      'Only the person who created this goal can decline the proof.'
    );
  }

  /*
   * Never allow self-review.
   */
  if (
    proof.submitted_by === user.id
  ) {
    throw new Error(
      'You cannot decline your own proof.'
    );
  }

  const { data, error } = await supabase
    .from('goal_proofs')
    .update({
      status: 'declined',
      reviewed_at:
        new Date().toISOString(),
    })
    .eq('id', proofId)
    .eq('status', 'pending')
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      'The proof could not be declined. The database may have rejected this review.'
    );
  }

  return data;
}