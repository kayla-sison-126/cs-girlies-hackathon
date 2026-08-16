import { supabase } from "./supabase";

export async function uploadGoalProof(
  photoUri: string,
  userId: string,
  goalId: string
) {
  if (!photoUri) {
    throw new Error(
      "Photo URI is missing."
    );
  }

  if (!userId) {
    throw new Error(
      "User ID is missing."
    );
  }

  if (!goalId) {
    throw new Error(
      "Goal ID is missing."
    );
  }

  /*
   * Store every proof under:
   *
   * userId / goalId / timestamp.jpg
   *
   * This makes each uploaded proof unique.
   */
  const filePath =
    `${userId}/${goalId}/${Date.now()}.jpg`;

  try {
    const response =
      await fetch(photoUri);

    if (!response.ok) {
      throw new Error(
        "Could not read the captured photo."
      );
    }

    const blob =
      await response.blob();

    /*
     * This catches the 0-byte uploads that
     * were appearing in Supabase Storage.
     */
    if (
      !blob ||
      blob.size === 0
    ) {
      throw new Error(
        "Captured photo is empty."
      );
    }

    const {
      error,
    } = await supabase.storage
      .from("goal-proofs")
      .upload(
        filePath,
        blob,
        {
          contentType:
            "image/jpeg",
          cacheControl:
            "3600",
          upsert: false,
        }
      );

    if (error) {
      throw error;
    }

    const {
      data,
    } = supabase.storage
      .from("goal-proofs")
      .getPublicUrl(
        filePath
      );

    if (!data?.publicUrl) {
      throw new Error(
        "Could not create the proof image URL."
      );
    }

    return data.publicUrl;
  } catch (error) {
    console.error(
      "Goal proof upload failed:",
      error
    );

    throw error;
  }
}