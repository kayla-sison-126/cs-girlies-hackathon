import { supabase } from './supabase';
import { uploadGoalProof } from './storage';

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

  /*
   * Get the currently logged-in user.
   */
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
   * Upload the photo using the storage helper.
   */
  const publicUrl = await uploadGoalProof(
    photoUri,
    user.id,
    goalId
  );

  /*
   * Save the proof in the goal_proofs table.
   *
   * It starts as "pending" because the friend
   * still needs to review it.
   */
  const { data, error: proofError } = await supabase
    .from('goal_proofs')
    .insert({
      goal_id: goalId,
      submitted_by: user.id,
      image_url: publicUrl,
      status: 'pending',
    })
    .select()
    .single();

  if (proofError) {
    throw proofError;
  }

  return data;
}

export async function getLatestGoalProofStatus(
  goalId: string
) {
  const { data, error } = await supabase
    .from('goal_proofs')
    .select('status')
    .eq('goal_id', goalId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.status ?? null;
}