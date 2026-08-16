import { supabase } from './supabase';

/*
 * Get the current user's personal pairing code.
 */
export async function getMyPairingCode() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('You must be logged in.');
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('pairing_code')
    .eq('id', user.id)
    .single();

  if (error) {
    throw error;
  }

  return data.pairing_code;
}


/*
 * Send a friend request using someone's pairing code.
 */
export async function sendFriendRequest(
  pairingCode: string
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('You must be logged in.');
  }

  const code = pairingCode.trim().toUpperCase();

  if (!code) {
    throw new Error('Please enter a pairing code.');
  }

  // Find the user with this pairing code
  const { data: receiver, error: receiverError } =
    await supabase
      .from('profiles')
      .select('id, username')
      .eq('pairing_code', code)
      .maybeSingle();

  if (receiverError) {
    throw receiverError;
  }

  if (!receiver) {
    throw new Error('No user found with that pairing code.');
  }

  if (receiver.id === user.id) {
    throw new Error('You cannot add yourself.');
  }

  // Check if a request already exists
  const { data: existingRequest } = await supabase
    .from('friend_requests')
    .select('*')
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${receiver.id}),and(sender_id.eq.${receiver.id},receiver_id.eq.${user.id})`
    )
    .eq('status', 'pending')
    .maybeSingle();

  if (existingRequest) {
    throw new Error('A friend request already exists.');
  }

  // Send the request
  const { data, error } = await supabase
    .from('friend_requests')
    .insert({
      sender_id: user.id,
      receiver_id: receiver.id,
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
 * Get requests received by the current user.
 */
export async function getReceivedFriendRequests() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('You must be logged in.');
  }

  const { data, error } = await supabase
    .from('friend_requests')
    .select(`
      id,
      sender_id,
      receiver_id,
      status,
      created_at,
      sender:profiles!friend_requests_sender_id_fkey (
        id,
        username,
        pairing_code
      )
    `)
    .eq('receiver_id', user.id)
    .eq('status', 'pending')
    .order('created_at', {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return data || [];
}


/*
 * Decline a friend request.
 */
export async function declineFriendRequest(
  requestId: string
) {
  const { error } = await supabase
    .from('friend_requests')
    .update({
      status: 'declined',
    })
    .eq('id', requestId);

  if (error) {
    throw error;
  }
}

export async function acceptFriendRequest(
  requestId: string
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('You must be logged in.');
  }

  // Get the pending request
  const { data: request, error: requestError } =
    await supabase
      .from('friend_requests')
      .select(
        'id, sender_id, receiver_id, status'
      )
      .eq('id', requestId)
      .eq('receiver_id', user.id)
      .eq('status', 'pending')
      .single();

  if (requestError) {
    throw requestError;
  }

  // Create a friendship code for the friendship row.
  // The actual friend-request system uses personal
  // profile pairing codes.
  const friendshipCode =
    Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase();

  // Create the friendship
  const {
    data: friendship,
    error: friendshipError,
  } = await supabase
    .from('friendships')
    .insert({
      user_a_id: request.sender_id,
      user_b_id: request.receiver_id,
      pairing_code: friendshipCode,
    })
    .select()
    .single();

  if (friendshipError) {
    throw friendshipError;
  }

  // Mark request as accepted
  const { error: updateError } =
    await supabase
      .from('friend_requests')
      .update({
        status: 'accepted',
      })
      .eq('id', requestId)
      .eq('receiver_id', user.id);

  if (updateError) {
    throw updateError;
  }

  return friendship;
}