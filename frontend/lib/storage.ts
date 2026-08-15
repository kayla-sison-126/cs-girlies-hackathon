import { supabase } from './supabase';

export async function uploadGoalProof(
  uri: string,
  userId: string,
  goalId: string
) {
  const response = await fetch(uri);
  const blob = await response.blob();

  const fileExtension = uri.split('.').pop()?.toLowerCase() || 'jpg';

  const filePath = `${userId}/${goalId}-${Date.now()}.${fileExtension}`;

  const { error } = await supabase.storage
    .from('goal-proofs')
    .upload(filePath, blob, {
      contentType: `image/${fileExtension}`,
      upsert: false,
    });

  if (error) {
    throw error;
  }

  const {
    data: { publicUrl },
  } = supabase.storage
    .from('goal-proofs')
    .getPublicUrl(filePath);

  return publicUrl;
}