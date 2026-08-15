import { supabase } from './supabase';
import { completeGoalWithRewards } from './rewards';

export async function submitProof(
  goalId: string,
  imageUrl: string
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('You must be logged in.');
  }

  const { data, error } = await supabase
    .from('goal_proofs')
    .insert({
      goal_id: goalId,
      submitted_by: user.id,
      image_url: imageUrl,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function reviewProof(
  proofId: string,
  approved: boolean
) {
  const { data: proof, error: proofError } = await supabase
    .from('goal_proofs')
    .select('*')
    .eq('id', proofId)
    .single();

  if (proofError) {
    throw proofError;
  }

  if (proof.status !== 'pending') {
    throw new Error('This proof has already been reviewed.');
  }

  const status = approved ? 'approved' : 'rejected';

  const { data, error } = await supabase
    .from('goal_proofs')
    .update({
      status,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', proofId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (approved) {
    await completeGoalWithRewards(proof.goal_id);
  }

  return data;
}