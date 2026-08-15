import { supabase } from './supabase';

const POINTS_PER_GOAL = 10;
const PET_HEALTH_PER_GOAL = 10;

export async function completeGoalWithRewards(goalId: string) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('You must be logged in.');
  }

  // Get the goal
  const { data: goal, error: goalError } = await supabase
    .from('goals')
    .select('*')
    .eq('id', goalId)
    .single();

  if (goalError) {
    throw goalError;
  }

  // Don't reward an already completed goal
  if (goal.completed_at) {
    return goal;
  }

  // Complete the goal
  const { data: completedGoal, error: completeError } = await supabase
    .from('goals')
    .update({
      completed_by: user.id,
      completed_at: new Date().toISOString(),
    })
    .eq('id', goalId)
    .select()
    .single();

  if (completeError) {
    throw completeError;
  }

  // Get or create user stats
  const { data: existingStats } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  const today = new Date().toISOString().split('T')[0];

  let streakDays = 1;

  if (existingStats) {
    if (existingStats.last_completed_date === today) {
      streakDays = existingStats.streak_days;
    } else if (existingStats.last_completed_date) {
      const lastDate = new Date(existingStats.last_completed_date);
      const currentDate = new Date(today);

      const difference =
        (currentDate.getTime() - lastDate.getTime()) /
        (1000 * 60 * 60 * 24);

      if (difference === 1) {
        streakDays = existingStats.streak_days + 1;
      }
    }
  }

  const { error: statsError } = await supabase
    .from('user_stats')
    .upsert({
      user_id: user.id,
      points: (existingStats?.points || 0) + POINTS_PER_GOAL,
      streak_days: streakDays,
      last_completed_date: today,
    });

  if (statsError) {
    throw statsError;
  }

  // Increase the friendship pet's health
  const { data: pet } = await supabase
    .from('pets')
    .select('health')
    .eq('friendship_id', goal.friendship_id)
    .maybeSingle();

  if (pet) {
    const newHealth = Math.min(
      100,
      pet.health + PET_HEALTH_PER_GOAL
    );

    const { error: petError } = await supabase
      .from('pets')
      .update({
        health: newHealth,
      })
      .eq('friendship_id', goal.friendship_id);

    if (petError) {
      throw petError;
    }
  }

  return completedGoal;
}