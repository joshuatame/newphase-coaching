/**
 * Badges and achievements - definitions and computation helpers.
 */
export const BADGES = {
  first_week: {
    id: 'first_week',
    name: 'First Week',
    description: 'Logged habits for 7 days in a row',
    icon: '🔥',
    threshold: 7,
  },
  first_month: {
    id: 'first_month',
    name: 'First Month',
    description: '30 consecutive days of habit tracking',
    icon: '📅',
    threshold: 30,
  },
  hundred_workouts: {
    id: 'hundred_workouts',
    name: 'Century',
    description: 'Logged 100 workouts',
    icon: '💯',
    threshold: 100,
  },
  water_warrior: {
    id: 'water_warrior',
    name: 'Water Warrior',
    description: 'Hit water goal 7 days in a row',
    icon: '💧',
    threshold: 7,
  },
  streak_master: {
    id: 'streak_master',
    name: 'Streak Master',
    description: '30-day productivity streak',
    icon: '⚡',
    threshold: 30,
  },
  early_bird: {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Logged habits before 8am 7 times',
    icon: '🌅',
    threshold: 7,
  },
  consistency_king: {
    id: 'consistency_king',
    name: 'Consistency King',
    description: '80% habit completion for a month',
    icon: '👑',
    threshold: 0.8,
  },
  onboarding_complete: {
    id: 'onboarding_complete',
    name: 'All Set',
    description: 'Completed profile setup',
    icon: '✅',
    threshold: 1,
  },
  first_steps: {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Logged 10,000 steps in a day',
    icon: '👟',
    threshold: 10000,
  },
  step_master: {
    id: 'step_master',
    name: 'Step Master',
    description: '50,000 steps in a week',
    icon: '🏆',
    threshold: 50000,
  },
  personal_best: {
    id: 'personal_best',
    name: 'Personal Best',
    description: 'Beat a previous personal record',
    icon: '🌟',
    threshold: 1,
  },
  week_warrior: {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: '7 workouts in one week',
    icon: '💪',
    threshold: 7,
  },
} as const

export type BadgeId = keyof typeof BADGES

export function computeEarnedBadges(params: {
  productivityStreak?: number
  totalWorkoutsLogged?: number
  waterStreak?: number
  onboardingComplete?: boolean
  habitCompletionRate?: number
  entriesWithEarlyLog?: number
  maxDailySteps?: number
  weekSteps?: number
  weekWorkouts?: number
}): BadgeId[] {
  const earned: BadgeId[] = []
  if (params.onboardingComplete) earned.push('onboarding_complete')
  if ((params.productivityStreak ?? 0) >= 7) earned.push('first_week')
  if ((params.productivityStreak ?? 0) >= 30) earned.push('first_month', 'streak_master')
  if ((params.totalWorkoutsLogged ?? 0) >= 100) earned.push('hundred_workouts')
  if ((params.waterStreak ?? 0) >= 7) earned.push('water_warrior')
  if ((params.entriesWithEarlyLog ?? 0) >= 7) earned.push('early_bird')
  if ((params.habitCompletionRate ?? 0) >= 0.8) earned.push('consistency_king')
  if ((params.maxDailySteps ?? 0) >= 10000) earned.push('first_steps')
  if ((params.weekSteps ?? 0) >= 50000) earned.push('step_master')
  if ((params.weekWorkouts ?? 0) >= 7) earned.push('week_warrior')
  return earned
}
