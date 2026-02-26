export type Role = 'admin' | 'trainer' | 'client'

export interface UserProfile {
  uid: string
  email: string
  displayName?: string
  role: Role
  createdAt: string
  updatedAt: string
}

export interface ClientProfile {
  id: string
  uid: string
  goals?: string
  trainingExperience?: string
  injuries?: string
  preferences?: string
  dietaryConstraints?: string
  timezone?: string
  units: 'metric' | 'imperial'
  startDate?: string
  createdAt: string
  updatedAt: string
}

export interface FoodItem {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
  sodium?: number
  servingSize: string
  servingUnit?: string
}

export interface Exercise {
  id: string
  name: string
  category?: string
  targetMuscles?: string[]
  equipment?: string[]
  instructions?: string
  videoLink?: string
  imageUrl?: string
}

export interface SetPrescription {
  sets: number
  reps?: number
  weight?: number
  tempo?: string
  restSeconds?: number
  notes?: string
}

export interface NotificationPreferences {
  push: boolean
  email: boolean
  inApp: boolean
}
