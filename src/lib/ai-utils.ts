/**
 * AI/prediction utilities: 1RM estimation, strength formulas, weight forecast.
 */

/** Epley formula: 1RM = weight * (1 + reps/30) */
export function epley1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0
  if (reps === 1) return weight
  return Math.round(weight * (1 + reps / 30))
}

/** Brzycki formula: 1RM = weight * (36 / (37 - reps)) */
export function brzycki1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0
  if (reps === 1) return weight
  if (reps >= 37) return weight
  return Math.round(weight * (36 / (37 - reps)))
}

/** Average of Epley and Brzycki for balanced estimate */
export function estimated1RM(weight: number, reps: number): number {
  return Math.round((epley1RM(weight, reps) + brzycki1RM(weight, reps)) / 2)
}

/** Weight for target reps at given 1RM */
export function weightForReps(oneRM: number, targetReps: number): number {
  if (targetReps <= 0 || oneRM <= 0) return 0
  if (targetReps === 1) return oneRM
  const epley = oneRM / (1 + targetReps / 30)
  const brzycki = targetReps < 37 ? oneRM * ((37 - targetReps) / 36) : 0
  return Math.round((epley + (brzycki || epley)) / 2)
}

/** Simple linear weight forecast from check-in/weight history. */
export function forecastWeight(
  history: { date: string; weight: number }[],
  daysAhead: number
): number | null {
  if (history.length < 2) return null
  const sorted = [...history].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  const first = sorted[0]!
  const last = sorted[sorted.length - 1]!
  const daysSpan =
    (new Date(last.date).getTime() - new Date(first.date).getTime()) /
    (1000 * 60 * 60 * 24)
  if (daysSpan <= 0) return last.weight
  const deltaPerDay = (last.weight - first.weight) / daysSpan
  return Math.round((last.weight + deltaPerDay * daysAhead) * 10) / 10
}

/** Forecast training weight for target reps based on recent 1RM progression. */
export function forecastTrainingWeight(
  recent1RMs: { date: string; estimated1RM: number }[],
  targetReps: number,
  daysAhead: number
): number | null {
  if (recent1RMs.length < 2) return null
  const sorted = [...recent1RMs].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  const first = sorted[0]!
  const last = sorted[sorted.length - 1]!
  const daysSpan =
    (new Date(last.date).getTime() - new Date(first.date).getTime()) /
    (1000 * 60 * 60 * 24)
  if (daysSpan <= 0) return weightForReps(last.estimated1RM, targetReps)
  const rmDeltaPerDay = (last.estimated1RM - first.estimated1RM) / daysSpan
  const future1RM = last.estimated1RM + rmDeltaPerDay * daysAhead
  return weightForReps(future1RM, targetReps)
}

/** Training goal for the lift predictor */
export type TrainingGoal = 'endurance' | 'strength' | 'hypertrophy'

export interface GoalPrescription {
  goal: TrainingGoal
  sets: number
  repMin: number
  repMax: number
  pct1RM: number
  restSeconds: number
  description: string
}

/** Get recommended sets, rep range, and % of 1RM for a goal */
export function getGoalPrescription(goal: TrainingGoal): GoalPrescription {
  switch (goal) {
    case 'endurance':
      return {
        goal: 'endurance',
        sets: 3,
        repMin: 15,
        repMax: 20,
        pct1RM: 0.55,
        restSeconds: 30,
        description: 'Higher reps, lighter weight. Build muscular endurance.',
      }
    case 'strength':
      return {
        goal: 'strength',
        sets: 4,
        repMin: 4,
        repMax: 6,
        pct1RM: 0.88,
        restSeconds: 120,
        description: 'Lower reps, heavier weight. Maximize strength.',
      }
    case 'hypertrophy':
    default:
      return {
        goal: 'hypertrophy',
        sets: 4,
        repMin: 8,
        repMax: 12,
        pct1RM: 0.72,
        restSeconds: 60,
        description: 'Moderate reps and weight. Optimize muscle growth.',
      }
  }
}

export interface WorkoutPlanExercise {
  name: string
  sets: number
  reps: string
  weightKg: number
  restSeconds: number
  notes?: string
}

export interface LiftPlanResult {
  oneRM: number
  prescription: GoalPrescription
  workingWeightKg: number
  exercises: WorkoutPlanExercise[]
}

/** Build a workout plan from comfortable lift (weight × sets × reps) and goal */
export function buildWorkoutPlanFromLift(
  goal: TrainingGoal,
  weightKg: number,
  _setsComfortable: number,
  repsComfortable: number,
  exerciseName: string = 'Main lift'
): LiftPlanResult {
  const oneRM = estimated1RM(weightKg, repsComfortable)
  const prescription = getGoalPrescription(goal)
  const workingWeightKg = Math.max(1, Math.round(oneRM * prescription.pct1RM))
  const repStr =
    prescription.repMin === prescription.repMax
      ? `${prescription.repMin}`
      : `${prescription.repMin}–${prescription.repMax}`

  const mainLift: WorkoutPlanExercise = {
    name: exerciseName,
    sets: prescription.sets,
    reps: repStr,
    weightKg: workingWeightKg,
    restSeconds: prescription.restSeconds,
    notes: prescription.description,
  }

  const exercises: WorkoutPlanExercise[] = [mainLift]

  if (goal === 'strength') {
    exercises.push(
      { name: 'Warm-up set (light)', sets: 1, reps: '8–10', weightKg: Math.round(workingWeightKg * 0.5), restSeconds: 60 },
      { name: 'Accessory (same movement pattern)', sets: 2, reps: '8–10', weightKg: Math.round(workingWeightKg * 0.6), restSeconds: 90 }
    )
  } else if (goal === 'hypertrophy') {
    exercises.push(
      { name: 'Warm-up', sets: 1, reps: '10', weightKg: Math.round(workingWeightKg * 0.5), restSeconds: 45 },
      { name: 'Accessory 1', sets: 3, reps: '10–12', weightKg: Math.round(workingWeightKg * 0.55), restSeconds: 60 },
      { name: 'Accessory 2', sets: 3, reps: '10–12', weightKg: Math.round(workingWeightKg * 0.5), restSeconds: 60 }
    )
  } else {
    exercises.push(
      { name: 'Warm-up', sets: 1, reps: '12', weightKg: Math.round(workingWeightKg * 0.5), restSeconds: 30 },
      { name: 'Circuit / high-rep finisher', sets: 2, reps: '15–20', weightKg: Math.round(workingWeightKg * 0.5), restSeconds: 30 }
    )
  }

  return {
    oneRM,
    prescription,
    workingWeightKg,
    exercises,
  }
}
