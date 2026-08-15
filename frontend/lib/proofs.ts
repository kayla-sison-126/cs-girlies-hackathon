import { supabase } from './supabase';

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
     * Convert the camera's local URI into an ArrayBuffer.
     * Supabase Storage can upload this directly.
     */
    const response = await fetch(photoUri);
    const arrayBuffer = await response.arrayBuffer();

    /*
     * Give every uploaded photo its own unique path.
     *
     * Example:
     * user-id/goal-id/1723456789012.jpg
     */
    const filePath = `${user.id}/${goalId}/${Date.now()}.jpg`;

    /*
     * Upload the photo to the goal-proofs bucket.
     */
    const { error: uploadError } = await supabase.storage
        .from('goal-proofs')
        .upload(filePath, arrayBuffer, {
            contentType: 'image/jpeg',
            upsert: false,
        });

    if (uploadError) {
        throw uploadError;
    }

    /*
     * Get the public URL for the uploaded image.
     */
    const {
        data: { publicUrl },
    } = supabase.storage
        .from('goal-proofs')
        .getPublicUrl(filePath);

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