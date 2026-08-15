import { supabase } from './supabase';

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
    const { error: goalError } = await supabase
      .from('goals')
      .update({
        completed_by: data.submitted_by,
        completed_at: new Date().toISOString(),
      })
      .eq('id', data.goal_id);

    if (goalError) {
      throw goalError;
    }
  }

  return data;
}