/**
 * Comprehensive seed script using Firebase Admin.
 * Run: npm run seed:all
 * Requires service-account.json in project root.
 */
import 'dotenv/config'
import { readFileSync } from 'fs'
import { join } from 'path'
import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

const SERVICE_ACCOUNT_PATH = join(process.cwd(), 'service-account.json')

interface FoodItem {
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

interface Exercise {
  name: string
  category?: string
  targetMuscles?: string[]
  equipment?: string[]
  instructions?: string
  videoLink?: string
  imageUrl?: string
}

interface Supplement {
  name: string
  form?: string
  category: 'supplement' | 'hormone' | 'peptide' | 'medication'
  instructions?: string
  notes?: string
  halfLifeHours: number
  halfLifeDays?: number
  mgPerMl?: number
  useCases: string[]
  positives: string[]
  sideEffects: string[]
}

interface CheckinQuestion {
  id: string
  question: string
  type: 'scale' | 'text' | 'number' | 'checkbox'
  options?: string[]
}

interface CheckinTemplate {
  name: string
  description: string
  questions: CheckinQuestion[]
  frequency: 'daily' | 'weekly'
  isDefault?: boolean
}

const FOODS: FoodItem[] = [
  { name: 'Chicken Breast (raw)', calories: 165, protein: 31, carbs: 0, fat: 3.6, servingSize: '100g', servingUnit: 'g' },
  { name: 'Egg (whole)', calories: 155, protein: 13, carbs: 1.1, fat: 11, servingSize: '1 large', servingUnit: 'each' },
  { name: 'Egg White', calories: 52, protein: 11, carbs: 0.7, fat: 0.2, servingSize: '100g', servingUnit: 'g' },
  { name: 'Salmon (Atlantic)', calories: 208, protein: 20, carbs: 0, fat: 13, servingSize: '100g', servingUnit: 'g' },
  { name: 'Ground Beef 80/20', calories: 254, protein: 17, carbs: 0, fat: 20, servingSize: '100g', servingUnit: 'g' },
  { name: 'Greek Yogurt (nonfat)', calories: 59, protein: 10, carbs: 3.6, fat: 0.7, servingSize: '100g', servingUnit: 'g' },
  { name: 'Cottage Cheese 2%', calories: 81, protein: 11, carbs: 3.4, fat: 2.3, servingSize: '100g', servingUnit: 'g' },
  { name: 'Brown Rice (cooked)', calories: 112, protein: 2.6, carbs: 24, fat: 0.9, fiber: 1.8, servingSize: '100g', servingUnit: 'g' },
  { name: 'White Rice (cooked)', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, servingSize: '100g', servingUnit: 'g' },
  { name: 'Quinoa (cooked)', calories: 120, protein: 4.4, carbs: 21, fat: 1.9, fiber: 2.8, servingSize: '100g', servingUnit: 'g' },
  { name: 'Oatmeal (cooked)', calories: 68, protein: 2.4, carbs: 12, fat: 1.4, fiber: 1.7, servingSize: '100g', servingUnit: 'g' },
  { name: 'Sweet Potato (baked)', calories: 90, protein: 2, carbs: 21, fat: 0.1, fiber: 3.3, sugar: 6.5, servingSize: '100g', servingUnit: 'g' },
  { name: 'Broccoli (raw)', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, servingSize: '100g', servingUnit: 'g' },
  { name: 'Spinach (raw)', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, servingSize: '100g', servingUnit: 'g' },
  { name: 'Kale (raw)', calories: 35, protein: 2.9, carbs: 4.4, fat: 1.5, fiber: 4.1, servingSize: '100g', servingUnit: 'g' },
  { name: 'Banana', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, fiber: 3.1, sugar: 14, servingSize: '1 medium', servingUnit: 'each' },
  { name: 'Apple', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, fiber: 4.4, sugar: 19, servingSize: '1 medium', servingUnit: 'each' },
  { name: 'Blueberries', calories: 84, protein: 1.1, carbs: 21, fat: 0.5, fiber: 3.6, sugar: 15, servingSize: '100g', servingUnit: 'g' },
  { name: 'Strawberries', calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, fiber: 2, sugar: 4.9, servingSize: '100g', servingUnit: 'g' },
  { name: 'Avocado', calories: 160, protein: 2, carbs: 9, fat: 15, fiber: 7, servingSize: '100g', servingUnit: 'g' },
  { name: 'Almonds', calories: 579, protein: 21, carbs: 22, fat: 50, fiber: 12.5, servingSize: '100g', servingUnit: 'g' },
  { name: 'Peanut Butter', calories: 588, protein: 25, carbs: 20, fat: 50, fiber: 6, sugar: 9.2, sodium: 459, servingSize: '100g', servingUnit: 'g' },
  { name: 'Whole Milk', calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, servingSize: '100ml', servingUnit: 'ml' },
  { name: 'Almond Milk (unsweetened)', calories: 13, protein: 0.4, carbs: 0.6, fat: 1.1, servingSize: '100ml', servingUnit: 'ml' },
  { name: 'Whey Protein Powder', calories: 120, protein: 24, carbs: 3, fat: 1.5, servingSize: '1 scoop (30g)', servingUnit: 'g' },
  { name: 'Casein Protein Powder', calories: 120, protein: 24, carbs: 4, fat: 1, servingSize: '1 scoop (30g)', servingUnit: 'g' },
  { name: 'Olive Oil', calories: 884, protein: 0, carbs: 0, fat: 100, servingSize: '1 tbsp', servingUnit: 'tbsp' },
  { name: 'Coconut Oil', calories: 121, protein: 0, carbs: 0, fat: 13.5, servingSize: '1 tbsp', servingUnit: 'tbsp' },
  { name: 'Bread (whole wheat)', calories: 247, protein: 13.4, carbs: 41, fat: 3.4, fiber: 6.8, sodium: 601, servingSize: '100g', servingUnit: 'g' },
  { name: 'Pasta (cooked)', calories: 131, protein: 5, carbs: 25, fat: 1.1, servingSize: '100g', servingUnit: 'g' },
  { name: 'Turkey Breast', calories: 135, protein: 30, carbs: 0, fat: 0.7, servingSize: '100g', servingUnit: 'g' },
  { name: 'Tuna (canned in water)', calories: 116, protein: 26, carbs: 0, fat: 0.8, sodium: 247, servingSize: '100g', servingUnit: 'g' },
  { name: 'Shrimp', calories: 99, protein: 24, carbs: 0.2, fat: 0.3, sodium: 111, servingSize: '100g', servingUnit: 'g' },
  { name: 'Tofu (firm)', calories: 144, protein: 17, carbs: 3.4, fat: 9, servingSize: '100g', servingUnit: 'g' },
  { name: 'Black Beans (cooked)', calories: 132, protein: 8.9, carbs: 24, fat: 0.5, fiber: 8.7, servingSize: '100g', servingUnit: 'g' },
  { name: 'Lentils (cooked)', calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 7.9, servingSize: '100g', servingUnit: 'g' },
  { name: 'Pumpkin Seeds', calories: 559, protein: 30, carbs: 11, fat: 49, fiber: 6, servingSize: '100g', servingUnit: 'g' },
  { name: 'Cheddar Cheese', calories: 403, protein: 25, carbs: 1.3, fat: 33, sodium: 621, servingSize: '100g', servingUnit: 'g' },
  { name: 'Mozzarella', calories: 280, protein: 28, carbs: 3.1, fat: 17, sodium: 628, servingSize: '100g', servingUnit: 'g' },
  { name: 'Cream of Rice', calories: 370, protein: 7, carbs: 82, fat: 0.5, servingSize: '100g', servingUnit: 'g' },
  { name: 'White Potato (baked)', calories: 93, protein: 2.5, carbs: 21, fat: 0.1, fiber: 2.2, servingSize: '100g', servingUnit: 'g' },
  { name: 'Asparagus', calories: 20, protein: 2.2, carbs: 3.9, fat: 0.1, fiber: 2.1, servingSize: '100g', servingUnit: 'g' },
  { name: 'Green Beans', calories: 31, protein: 1.8, carbs: 7, fat: 0.1, fiber: 2.7, servingSize: '100g', servingUnit: 'g' },
  { name: 'Brussels Sprouts', calories: 43, protein: 3.4, carbs: 9, fat: 0.3, fiber: 3.8, servingSize: '100g', servingUnit: 'g' },
  { name: 'Zucchini', calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3, fiber: 1, servingSize: '100g', servingUnit: 'g' },
  { name: 'Carrots', calories: 41, protein: 0.9, carbs: 10, fat: 0.2, fiber: 2.8, servingSize: '100g', servingUnit: 'g' },
  { name: 'Orange', calories: 62, protein: 1.2, carbs: 15, fat: 0.2, fiber: 3.1, sugar: 12, servingSize: '1 medium', servingUnit: 'each' },
  { name: 'Grapes', calories: 69, protein: 0.7, carbs: 18, fat: 0.2, fiber: 0.9, sugar: 15, servingSize: '100g', servingUnit: 'g' },
  { name: 'Watermelon', calories: 30, protein: 0.6, carbs: 7.6, fat: 0.2, sugar: 6.2, servingSize: '100g', servingUnit: 'g' },
  { name: 'Pineapple', calories: 50, protein: 0.5, carbs: 13, fat: 0.1, fiber: 1.4, sugar: 10, servingSize: '100g', servingUnit: 'g' },
  { name: 'Mango', calories: 60, protein: 0.8, carbs: 15, fat: 0.4, fiber: 1.6, sugar: 14, servingSize: '100g', servingUnit: 'g' },
  { name: 'Raspberries', calories: 52, protein: 1.2, carbs: 12, fat: 0.7, fiber: 7, servingSize: '100g', servingUnit: 'g' },
  { name: 'Blackberries', calories: 43, protein: 1.4, carbs: 10, fat: 0.5, fiber: 5.3, servingSize: '100g', servingUnit: 'g' },
  { name: 'Peach', calories: 39, protein: 0.9, carbs: 10, fat: 0.3, fiber: 1.5, servingSize: '1 medium', servingUnit: 'each' },
  { name: 'Pear', calories: 57, protein: 0.4, carbs: 15, fat: 0.1, fiber: 3.1, servingSize: '1 medium', servingUnit: 'each' },
  { name: 'Kiwi', calories: 61, protein: 1.1, carbs: 15, fat: 0.5, fiber: 3, servingSize: '1 medium', servingUnit: 'each' },
  { name: 'Cantaloupe', calories: 34, protein: 0.8, carbs: 8.2, fat: 0.2, servingSize: '100g', servingUnit: 'g' },
  { name: 'Honeydew', calories: 36, protein: 0.5, carbs: 9.1, fat: 0.1, servingSize: '100g', servingUnit: 'g' },
  { name: 'Cherries', calories: 50, protein: 1, carbs: 12, fat: 0.3, fiber: 1.6, servingSize: '100g', servingUnit: 'g' },
  { name: 'Plum', calories: 46, protein: 0.7, carbs: 11, fat: 0.3, servingSize: '1 medium', servingUnit: 'each' },
  { name: 'Walnuts', calories: 654, protein: 15, carbs: 14, fat: 65, fiber: 6.7, servingSize: '100g', servingUnit: 'g' },
  { name: 'Cashews', calories: 553, protein: 18, carbs: 30, fat: 44, servingSize: '100g', servingUnit: 'g' },
  { name: 'Macadamia Nuts', calories: 718, protein: 7.9, carbs: 14, fat: 76, servingSize: '100g', servingUnit: 'g' },
  { name: 'Pistachios', calories: 560, protein: 20, carbs: 28, fat: 45, fiber: 10, servingSize: '100g', servingUnit: 'g' },
  { name: 'Sunflower Seeds', calories: 584, protein: 21, carbs: 20, fat: 52, servingSize: '100g', servingUnit: 'g' },
  { name: 'Chia Seeds', calories: 486, protein: 17, carbs: 42, fat: 31, fiber: 34, servingSize: '100g', servingUnit: 'g' },
  { name: 'Flax Seeds', calories: 534, protein: 18, carbs: 29, fat: 42, fiber: 27, servingSize: '100g', servingUnit: 'g' },
  { name: 'Hemp Seeds', calories: 553, protein: 32, carbs: 4.7, fat: 49, servingSize: '100g', servingUnit: 'g' },
  { name: 'Protein Bar (typical)', calories: 200, protein: 20, carbs: 22, fat: 6, fiber: 3, servingSize: '1 bar', servingUnit: 'each' },
  { name: 'Rice Cakes (plain)', calories: 35, protein: 0.7, carbs: 7.3, fat: 0.3, servingSize: '1 cake', servingUnit: 'each' },
  { name: 'Cottage Cheese (1%)', calories: 72, protein: 12, carbs: 4.1, fat: 1, servingSize: '100g', servingUnit: 'g' },
  { name: 'Skyr (Icelandic yogurt)', calories: 66, protein: 11, carbs: 4, fat: 0.2, servingSize: '100g', servingUnit: 'g' },
  { name: 'Kefir', calories: 41, protein: 3.3, carbs: 4.5, fat: 1, servingSize: '100ml', servingUnit: 'ml' },
  { name: 'Coconut Water', calories: 19, protein: 0.7, carbs: 3.7, fat: 0.2, servingSize: '100ml', servingUnit: 'ml' },
  { name: 'Green Tea', calories: 1, protein: 0, carbs: 0, fat: 0, servingSize: '1 cup', servingUnit: 'each' },
  { name: 'Black Coffee', calories: 2, protein: 0.3, carbs: 0, fat: 0, servingSize: '1 cup', servingUnit: 'each' },
  { name: 'Dark Chocolate 70%', calories: 546, protein: 4.9, carbs: 61, fat: 31, fiber: 7, servingSize: '100g', servingUnit: 'g' },
  { name: 'Hummus', calories: 166, protein: 7.9, carbs: 15, fat: 9.6, fiber: 6, servingSize: '100g', servingUnit: 'g' },
  { name: 'Edamame', calories: 122, protein: 11, carbs: 10, fat: 5.2, fiber: 5.2, servingSize: '100g', servingUnit: 'g' },
]

const EXERCISES: Exercise[] = [
  { name: 'Bench Press', category: 'Chest', targetMuscles: ['pectorals', 'triceps', 'anterior deltoids'], equipment: ['barbell', 'bench'], instructions: 'Lie on bench, grip bar slightly wider than shoulders. Lower to chest, press up.', videoLink: 'https://www.youtube.com/watch?v=rT7DgCr-3pg', imageUrl: 'https://images.unsplash.com/photo-1534368959876-26bf04f2c947?w=400' },
  { name: 'Squat', category: 'Legs', targetMuscles: ['quadriceps', 'glutes', 'hamstrings'], equipment: ['barbell', 'rack'], instructions: 'Bar on upper back. Descend until thighs parallel, drive up.', videoLink: 'https://www.youtube.com/watch?v=ultWZbUMPL8', imageUrl: 'https://images.unsplash.com/photo-1598268038678-d6b0d83c33b2?w=400' },
  { name: 'Deadlift', category: 'Back', targetMuscles: ['erector spinae', 'glutes', 'hamstrings'], equipment: ['barbell'], instructions: 'Hinge at hips, grip bar. Drive through heels, extend hips.', videoLink: 'https://www.youtube.com/watch?v=op9kVnSso6Q', imageUrl: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=400' },
  { name: 'Overhead Press', category: 'Shoulders', targetMuscles: ['deltoids', 'triceps'], equipment: ['barbell'], instructions: 'Press bar from front rack to overhead. Lock out arms.', videoLink: 'https://www.youtube.com/watch?v=QAQ64hK4Xxs', imageUrl: 'https://images.unsplash.com/photo-1534368959876-26bf04f2c947?w=400' },
  { name: 'Barbell Row', category: 'Back', targetMuscles: ['latissimus dorsi', 'rhomboids', 'biceps'], equipment: ['barbell'], instructions: 'Hinge forward, row bar to lower chest. Squeeze shoulder blades.', imageUrl: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=400' },
  { name: 'Pull-ups', category: 'Back', targetMuscles: ['lats', 'biceps', 'core'], equipment: ['pull-up bar'], instructions: 'Hang from bar. Pull chin over bar. Lower with control.', imageUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400' },
  { name: 'Dumbbell Curl', category: 'Arms', targetMuscles: ['biceps'], equipment: ['dumbbells'], instructions: 'Arms at sides. Curl dumbbells to shoulders. Lower slowly.', imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400' },
  { name: 'Tricep Pushdown', category: 'Arms', targetMuscles: ['triceps'], equipment: ['cable'], instructions: 'Push cable down. Keep elbows at sides. Extend fully.', imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400' },
  { name: 'Leg Press', category: 'Legs', targetMuscles: ['quadriceps', 'glutes'], equipment: ['leg press machine'], instructions: 'Feet on platform. Lower until 90 degrees. Press through heels.', imageUrl: 'https://images.unsplash.com/photo-1598268038678-d6b0d83c33b2?w=400' },
  { name: 'Romanian Deadlift', category: 'Legs', targetMuscles: ['hamstrings', 'glutes'], equipment: ['barbell'], instructions: 'Hinge at hips, lower bar along legs. Feel hamstring stretch.', imageUrl: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=400' },
  { name: 'Lunges', category: 'Legs', targetMuscles: ['quadriceps', 'glutes'], equipment: ['dumbbells'], instructions: 'Step forward, lower back knee toward floor. Alternate legs.', imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400' },
  { name: 'Incline Dumbbell Press', category: 'Chest', targetMuscles: ['upper chest', 'triceps'], equipment: ['dumbbells', 'incline bench'], instructions: 'Set bench 30-45°. Press dumbbells up from chest level.', imageUrl: 'https://images.unsplash.com/photo-1534368959876-26bf04f2c947?w=400' },
  { name: 'Cable Fly', category: 'Chest', targetMuscles: ['pectorals'], equipment: ['cable'], instructions: 'Arms out to sides. Bring handles together in front.', imageUrl: 'https://images.unsplash.com/photo-1534368959876-26bf04f2c947?w=400' },
  { name: 'Lateral Raise', category: 'Shoulders', targetMuscles: ['lateral deltoids'], equipment: ['dumbbells'], instructions: 'Raise dumbbells to sides until parallel. Lower slowly.', imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c149e?w=400' },
  { name: 'Face Pull', category: 'Shoulders', targetMuscles: ['rear deltoids', 'rhomboids'], equipment: ['cable', 'rope'], instructions: 'Pull rope to face. Elbows high. Squeeze rear delts.', imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400' },
  { name: 'Plank', category: 'Core', targetMuscles: ['abs', 'core'], equipment: ['bodyweight'], instructions: 'Hold push-up position. Keep body straight. Breathe.', imageUrl: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=400' },
  { name: 'Cable Crunch', category: 'Core', targetMuscles: ['rectus abdominis'], equipment: ['cable'], instructions: 'Kneel, pull cable down. Crunch abs. Control return.', imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400' },
  { name: 'Hip Thrust', category: 'Legs', targetMuscles: ['glutes'], equipment: ['barbell', 'bench'], instructions: 'Upper back on bench. Drive hips up. Squeeze glutes at top.', imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400' },
  { name: 'Calf Raise', category: 'Legs', targetMuscles: ['calves'], equipment: ['machine'], instructions: 'Rise onto toes. Lower heels below platform. Full range.', imageUrl: 'https://images.unsplash.com/photo-1598268038678-d6b0d83c33b2?w=400' },
  { name: 'Hammer Curl', category: 'Arms', targetMuscles: ['biceps', 'forearms'], equipment: ['dumbbells'], instructions: 'Neutral grip. Curl to shoulders. Alternate or together.', imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400' },
  { name: 'Skull Crushers', category: 'Arms', targetMuscles: ['triceps'], equipment: ['barbell', 'EZ bar'], instructions: 'Lower bar to forehead. Extend arms. Keep elbows stable.', imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400' },
  { name: 'Lat Pulldown', category: 'Back', targetMuscles: ['lats', 'biceps'], equipment: ['cable'], instructions: 'Pull bar to upper chest. Squeeze lats. Control return.', imageUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400' },
  { name: 'Seated Row', category: 'Back', targetMuscles: ['lats', 'rhomboids'], equipment: ['cable'], instructions: 'Pull handle to stomach. Squeeze shoulder blades together.', imageUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400' },
  { name: 'Push-ups', category: 'Chest', targetMuscles: ['pectorals', 'triceps', 'core'], equipment: ['bodyweight'], instructions: 'Hands shoulder-width. Lower chest to floor. Push back up.', imageUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400' },
  { name: 'Dips', category: 'Arms', targetMuscles: ['triceps', 'chest'], equipment: ['dip station'], instructions: 'Support on bars. Lower until upper arms parallel. Press up.', imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400' },
  { name: 'Goblet Squat', category: 'Legs', targetMuscles: ['quadriceps', 'glutes'], equipment: ['dumbbell', 'kettlebell'], instructions: 'Hold weight at chest. Squat deep. Drive through heels.', imageUrl: 'https://images.unsplash.com/photo-1598268038678-d6b0d83c33b2?w=400' },
  { name: 'Bulgarian Split Squat', category: 'Legs', targetMuscles: ['quadriceps', 'glutes'], equipment: ['dumbbells'], instructions: 'Rear foot elevated. Lower into lunge. Drive up.', imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400' },
  { name: 'Leg Curl', category: 'Legs', targetMuscles: ['hamstrings'], equipment: ['machine'], instructions: 'Curl heels toward glutes. Control the negative.', imageUrl: 'https://images.unsplash.com/photo-1598268038678-d6b0d83c33b2?w=400' },
  { name: 'Leg Extension', category: 'Legs', targetMuscles: ['quadriceps'], equipment: ['machine'], instructions: 'Extend legs. Squeeze quads at top. Lower with control.', imageUrl: 'https://images.unsplash.com/photo-1598268038678-d6b0d83c33b2?w=400' },
  { name: 'Preacher Curl', category: 'Arms', targetMuscles: ['biceps'], equipment: ['barbell', 'preacher bench'], instructions: 'Arms on pad. Curl bar to shoulders. Full stretch at bottom.', imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400' },
  { name: 'Overhead Tricep Extension', category: 'Arms', targetMuscles: ['triceps'], equipment: ['dumbbell'], instructions: 'Dumbbell overhead. Lower behind head. Extend fully.', imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400' },
  { name: 'Pec Deck Fly', category: 'Chest', targetMuscles: ['pectorals'], equipment: ['machine'], instructions: 'Arms to sides. Bring handles together. Squeeze chest.', imageUrl: 'https://images.unsplash.com/photo-1534368959876-26bf04f2c947?w=400' },
  { name: 'Reverse Fly', category: 'Shoulders', targetMuscles: ['rear deltoids'], equipment: ['dumbbells'], instructions: 'Hinge forward. Raise dumbbells to sides. Squeeze rear delts.', imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c149e?w=400' },
  { name: 'Bicycle Crunch', category: 'Core', targetMuscles: ['abs', 'obliques'], equipment: ['bodyweight'], instructions: 'Alternate elbow to knee. Controlled rotation.', imageUrl: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=400' },
  { name: 'Dead Bug', category: 'Core', targetMuscles: ['abs', 'core'], equipment: ['bodyweight'], instructions: 'On back. Extend opposite arm/leg. Keep low back flat.', imageUrl: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=400' },
  { name: 'Russian Twist', category: 'Core', targetMuscles: ['obliques'], equipment: ['medicine ball', 'bodyweight'], instructions: 'Seated, rotate torso. Touch weight side to side.', imageUrl: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=400' },
  { name: 'Mountain Climbers', category: 'Cardio', targetMuscles: ['core', 'shoulders'], equipment: ['bodyweight'], instructions: 'Plank position. Drive knees to chest alternating.', imageUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400' },
  { name: 'Burpees', category: 'Cardio', targetMuscles: ['full body'], equipment: ['bodyweight'], instructions: 'Drop to floor. Push up. Jump up. Repeat.', imageUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400' },
  { name: 'Box Jump', category: 'Legs', targetMuscles: ['quadriceps', 'glutes'], equipment: ['box'], instructions: 'Jump onto box. Land softly. Step down.', imageUrl: 'https://images.unsplash.com/photo-1598268038678-d6b0d83c33b2?w=400' },
  { name: 'Kettlebell Swing', category: 'Full Body', targetMuscles: ['glutes', 'hamstrings', 'core'], equipment: ['kettlebell'], instructions: 'Hinge and swing to shoulder height. Hip drive.', imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400' },
]

const SUPPLEMENTS: Supplement[] = [
  // === Regular Supplements ===
  {
    name: 'Vitamin D3',
    form: 'Capsule',
    category: 'supplement',
    instructions: 'Take with fatty meal for absorption.',
    halfLifeHours: 240,
    halfLifeDays: 10,
    useCases: ['Deficiency correction', 'Bone health', 'Immune support', 'Mood support'],
    positives: ['Bone mineralization', 'Calcium absorption', 'Immune modulation', 'May support mood'],
    sideEffects: ['Hypercalcemia at high doses', 'Nausea', 'Kidney issues if excessive'],
  },
  {
    name: 'Creatine Monohydrate',
    form: 'Powder',
    category: 'supplement',
    instructions: 'Mix with water. 5g daily typical.',
    halfLifeHours: 720,
    halfLifeDays: 30,
    useCases: ['Strength training', 'High-intensity exercise', 'Muscle mass', 'Cognitive support'],
    positives: ['Increased ATP regeneration', 'Improved strength', 'Muscle hydration', 'Neuroprotective'],
    sideEffects: ['Water retention', 'GI distress if high dose', 'Cramping (debated)'],
  },
  {
    name: 'Omega-3 Fish Oil',
    form: 'Softgel',
    category: 'supplement',
    instructions: 'Take with meals.',
    halfLifeHours: 48,
    useCases: ['Cardiovascular health', 'Anti-inflammatory', 'Brain health', 'Joint support'],
    positives: ['EPA/DHA for heart', 'Reduces triglycerides', 'Anti-inflammatory', 'Supports cognition'],
    sideEffects: ['Fishy burps', 'Blood thinning at high doses', 'GI upset'],
  },
  {
    name: 'Magnesium Glycinate',
    form: 'Tablet',
    category: 'supplement',
    instructions: 'Take before bed if using for sleep.',
    halfLifeHours: 12,
    useCases: ['Sleep quality', 'Muscle cramps', 'Stress', 'Deficiency'],
    positives: ['Muscle relaxation', 'Sleep support', 'Nervous system calm', 'Well-absorbed form'],
    sideEffects: ['Loose stools at high dose', 'Rare allergic reaction'],
  },
  {
    name: 'Zinc',
    form: 'Tablet',
    category: 'supplement',
    instructions: 'Take with food. Avoid with calcium.',
    halfLifeHours: 24,
    useCases: ['Immune support', 'Testosterone support', 'Wound healing', 'Deficiency'],
    positives: ['Immune function', 'Enzyme cofactor', 'Skin health', 'Hormonal support'],
    sideEffects: ['Nausea', 'Metallic taste', 'Copper deficiency if excessive long-term'],
  },
  {
    name: 'Multivitamin',
    form: 'Tablet',
    category: 'supplement',
    instructions: 'Take daily with food.',
    halfLifeHours: 24,
    useCases: ['Dietary gaps', 'General wellness', 'Athletic performance', 'Recovery'],
    positives: ['Fills nutrient gaps', 'Convenience', 'B-vitamin energy', 'Antioxidant support'],
    sideEffects: ['GI upset', 'Nausea on empty stomach', 'Discolored urine (B-vitamins)'],
  },
  {
    name: 'BCAAs',
    form: 'Powder',
    category: 'supplement',
    instructions: 'Mix with water. Pre/intra/post workout.',
    halfLifeHours: 2,
    useCases: ['Intra-workout', 'Fasted training', 'Muscle recovery', 'Reducing catabolism'],
    positives: ['Leucine stimulates MPS', 'May reduce fatigue', 'Convenient amino source'],
    sideEffects: ['Generally well-tolerated', 'Unnecessary if adequate protein'],
  },
  {
    name: 'Beta-Alanine',
    form: 'Powder',
    category: 'supplement',
    instructions: 'Split doses to reduce tingling.',
    halfLifeHours: 2,
    useCases: ['High-intensity endurance', 'Muscular endurance', 'Pre-workout'],
    positives: ['Carnosine precursor', 'Buffers lactic acid', 'Improves time to exhaustion'],
    sideEffects: ['Paresthesia (tingling)', 'Flushing'],
  },
  {
    name: 'Citrulline Malate',
    form: 'Powder',
    category: 'supplement',
    instructions: 'Pre-workout. Mix with water.',
    halfLifeHours: 1,
    useCases: ['Pump', 'Nitric oxide', 'Endurance', 'Recovery'],
    positives: ['NO precursor', 'Reduced fatigue', 'Improved blood flow', 'Less stomach upset than arginine'],
    sideEffects: ['Generally well-tolerated', 'Mild GI in sensitive individuals'],
  },
  {
    name: 'Caffeine',
    form: 'Tablet',
    category: 'supplement',
    instructions: 'Pre-workout. Avoid late day.',
    halfLifeHours: 5,
    useCases: ['Pre-workout', 'Fatigue', 'Focus', 'Endurance'],
    positives: ['Increased alertness', 'Performance enhancement', 'Fat oxidation', 'Mental focus'],
    sideEffects: ['Jitters', 'Insomnia', 'Tachycardia', 'Anxiety', 'Tolerance'],
  },
  {
    name: 'Ashwagandha',
    form: 'Capsule',
    category: 'supplement',
    instructions: 'Take with food. Adaptogen.',
    halfLifeHours: 6,
    useCases: ['Stress', 'Cortisol', 'Sleep', 'Testosterone support'],
    positives: ['Adaptogenic', 'May lower cortisol', 'Sleep quality', 'Some studies show T support'],
    sideEffects: ['GI upset', 'Thyroid interaction', 'Sedation'],
  },
  {
    name: 'Vitamin C',
    form: 'Tablet',
    category: 'supplement',
    instructions: 'Daily. Supports immune function.',
    halfLifeHours: 16,
    useCases: ['Immune support', 'Antioxidant', 'Collagen synthesis', 'Iron absorption'],
    positives: ['Antioxidant', 'Immune function', 'Collagen production', 'Iron absorption'],
    sideEffects: ['GI upset at high doses', 'Kidney stones in susceptible', 'Oxalate'],
  },
  {
    name: 'Vitamin B12',
    form: 'Tablet/Injection',
    category: 'supplement',
    instructions: 'As needed. Energy support.',
    halfLifeHours: 6,
    useCases: ['Deficiency', 'Energy', 'Nervous system', 'Vegan/vegetarian'],
    positives: ['Energy metabolism', 'Red blood cell formation', 'Nerve function', 'DNA synthesis'],
    sideEffects: ['Rare allergic reaction', 'Injection site reaction'],
  },
  {
    name: 'Iron',
    form: 'Tablet',
    category: 'supplement',
    instructions: 'Take with vitamin C. Avoid with calcium.',
    halfLifeHours: 24,
    useCases: ['Anemia', 'Deficiency', 'Athletic performance', 'Women'],
    positives: ['Oxygen transport', 'Energy', 'Cognitive function'],
    sideEffects: ['Constipation', 'Nausea', 'GI upset', 'Oxidative stress if excessive'],
  },
  {
    name: 'Collagen Peptides',
    form: 'Powder',
    category: 'supplement',
    instructions: 'Mix with water or coffee.',
    halfLifeHours: 4,
    useCases: ['Joint health', 'Skin', 'Hair/nails', 'Gut lining'],
    positives: ['Joint support', 'Skin elasticity', 'Gut integrity', 'Recovery'],
    sideEffects: ['Generally well-tolerated', 'Mild taste'],
  },
  {
    name: 'L-Carnitine',
    form: 'Powder/Liquid',
    category: 'supplement',
    instructions: 'Take pre-workout or with meals.',
    halfLifeHours: 17,
    useCases: ['Fat oxidation', 'Exercise performance', 'Recovery', 'Cardiovascular'],
    positives: ['Fatty acid transport', 'May improve endurance', 'Recovery'],
    sideEffects: ['Fishy body odor', 'GI upset', 'Nausea'],
  },
  {
    name: 'Glutamine',
    form: 'Powder',
    category: 'supplement',
    instructions: 'Post-workout or before bed.',
    halfLifeHours: 2,
    useCases: ['Recovery', 'Gut health', 'Immune support', 'Muscle protein'],
    positives: ['Gut lining support', 'Immune cells', 'May reduce soreness'],
    sideEffects: ['Generally safe', 'High dose may affect neurotransmitter balance'],
  },
  {
    name: 'Turmeric/Curcumin',
    form: 'Capsule',
    category: 'supplement',
    instructions: 'Take with black pepper (piperine) for absorption.',
    halfLifeHours: 8,
    useCases: ['Anti-inflammatory', 'Joint health', 'Recovery', 'General wellness'],
    positives: ['Anti-inflammatory', 'Antioxidant', 'Joint support'],
    sideEffects: ['Blood thinning', 'GI upset', 'May interact with medications'],
  },
  {
    name: 'Vitamin K2',
    form: 'Capsule',
    category: 'supplement',
    instructions: 'Take with vitamin D3 and fatty meal.',
    halfLifeHours: 72,
    useCases: ['Bone health', 'Cardiovascular', 'Calcium metabolism', 'With D3'],
    positives: ['Directs calcium to bones', 'Cardiovascular health', 'Works synergistically with D3'],
    sideEffects: ['Interacts with blood thinners', 'Rare allergic reaction'],
  },
  {
    name: 'Taurine',
    form: 'Powder/Capsule',
    category: 'supplement',
    instructions: 'Pre-workout or with meals.',
    halfLifeHours: 24,
    useCases: ['Pre-workout', 'Hydration', 'Cardiovascular', 'Eye health'],
    positives: ['Cell volumization', 'Electrolyte balance', 'Antioxidant', 'Cardiac support'],
    sideEffects: ['Generally well-tolerated'],
  },
  {
    name: 'L-Theanine',
    form: 'Capsule',
    category: 'supplement',
    instructions: 'With caffeine or before bed.',
    halfLifeHours: 1.2,
    useCases: ['Relaxation', 'Focus with caffeine', 'Sleep', 'Stress'],
    positives: ['Calm focus', 'Reduces caffeine jitters', 'Promotes alpha waves'],
    sideEffects: ['Generally well-tolerated', 'Drowsiness at high dose'],
  },
  {
    name: 'CoQ10',
    form: 'Softgel',
    category: 'supplement',
    instructions: 'Take with fatty meal.',
    halfLifeHours: 33,
    useCases: ['Cardiovascular', 'Mitochondrial support', 'Statin users', 'Energy'],
    positives: ['Cellular energy', 'Antioxidant', 'Heart health', 'Exercise performance'],
    sideEffects: ['Generally well-tolerated', 'Mild GI upset'],
  },
  {
    name: 'Probiotics',
    form: 'Capsule',
    category: 'supplement',
    instructions: 'Take with food. Refrigerate if required.',
    halfLifeHours: 24,
    useCases: ['Gut health', 'Immune support', 'Digestion', 'Antibiotic recovery'],
    positives: ['Gut microbiome', 'Digestive function', 'Immune modulation'],
    sideEffects: ['Initial bloating', 'Gas', 'Strain-dependent effects'],
  },
  {
    name: 'Melatonin',
    form: 'Tablet/Gummy',
    category: 'supplement',
    instructions: '30-60 min before bed. Start low dose.',
    halfLifeHours: 1,
    useCases: ['Sleep onset', 'Jet lag', 'Shift work', 'Circadian reset'],
    positives: ['Sleep induction', 'Antioxidant', 'Short half-life'],
    sideEffects: ['Morning grogginess', 'Vivid dreams', 'Hormonal suppression with long-term use'],
  },
  {
    name: 'Boron',
    form: 'Capsule',
    category: 'supplement',
    instructions: 'Take with food. Cycle periodically.',
    halfLifeHours: 21,
    useCases: ['Testosterone support', 'Bone health', 'Joint health'],
    positives: ['May increase free testosterone', 'Bone mineralization', 'Joint support'],
    sideEffects: ['Toxicity at very high doses', 'Hormonal effects'],
  },
  {
    name: 'DHEA',
    form: 'Capsule',
    category: 'supplement',
    instructions: 'Morning. Per physician guidance.',
    halfLifeHours: 15,
    useCases: ['Aging', 'Hormonal support', 'Energy', 'Libido'],
    positives: ['Precursor to sex hormones', 'May support energy', 'Immune support'],
    sideEffects: ['Androgenic effects', 'Hormonal imbalance', 'Requires monitoring'],
  },
  {
    name: 'NAC (N-Acetyl Cysteine)',
    form: 'Capsule',
    category: 'supplement',
    instructions: 'Take with food. Away from other antioxidants.',
    halfLifeHours: 2,
    useCases: ['Liver support', 'Antioxidant', 'Mucolytic', 'Detox support'],
    positives: ['Glutathione precursor', 'Liver protection', 'Respiratory support'],
    sideEffects: ['GI upset', 'Unpleasant odor', 'May blunt exercise adaptation'],
  },
  {
    name: 'Alpha-GPC',
    form: 'Capsule',
    category: 'supplement',
    instructions: 'Pre-workout or morning for cognition.',
    halfLifeHours: 3,
    useCases: ['Cognitive enhancement', 'Power output', 'Focus', 'Acetylcholine'],
    positives: ['Choline source', 'May increase power', 'Cognitive support'],
    sideEffects: ['Headache', 'GI upset', 'Vivid dreams'],
  },
  {
    name: 'Beet Root Powder',
    form: 'Powder',
    category: 'supplement',
    instructions: 'Pre-workout. Nitrate loading 2-3 hours before.',
    halfLifeHours: 5,
    useCases: ['Endurance', 'Nitric oxide', 'Blood pressure', 'Recovery'],
    positives: ['Nitrate to NO conversion', 'Improved endurance', 'Vasodilation'],
    sideEffects: ['Red urine/feces', 'GI upset', 'Low BP in sensitive'],
  },
  {
    name: 'Ecdysterone',
    form: 'Powder/Capsule',
    category: 'supplement',
    instructions: 'Pre or post workout.',
    halfLifeHours: 8,
    useCases: ['Muscle building', 'Strength', 'Recovery', 'Adaptogen'],
    positives: ['Anabolic signaling', 'Non-hormonal', 'Recovery support'],
    sideEffects: ['Generally well-tolerated'],
  },
  // === Steroids / Hormones ===
  {
    name: 'Testosterone Cypionate',
    form: 'Injection',
    category: 'hormone',
    instructions: 'IM injection. Typically 1-2x per week. Prescription only.',
    halfLifeHours: 192,
    halfLifeDays: 8,
    mgPerMl: 200,
    useCases: ['TRT', 'Hormone replacement', 'Bulking', 'Lean mass'],
    positives: ['Stable levels', 'Weekly dosing', 'Well-studied', 'Muscle mass'],
    sideEffects: ['Estrogen conversion', 'Hematocrit increase', 'Suppression', 'Acne', 'Hair loss'],
  },
  {
    name: 'Testosterone Enanthate',
    form: 'Injection',
    category: 'hormone',
    instructions: 'IM injection. Typically 1-2x per week. Prescription only.',
    halfLifeHours: 132,
    halfLifeDays: 5.5,
    mgPerMl: 250,
    useCases: ['TRT', 'Hormone replacement', 'Bulking', 'Lean mass'],
    positives: ['Similar to cypionate', 'Smooth release', 'Muscle mass', 'Libido'],
    sideEffects: ['Estrogen conversion', 'Hematocrit increase', 'Suppression', 'Acne'],
  },
  {
    name: 'Testosterone Propionate',
    form: 'Injection',
    category: 'hormone',
    instructions: 'IM injection. EOD or 3x/week. Shorter ester requires frequent dosing.',
    halfLifeHours: 20,
    mgPerMl: 100,
    useCases: ['TRT', 'Blasting', 'Faster ester', 'PCT transition'],
    positives: ['Faster clearance', 'Less water retention', 'More frequent injection flexibility'],
    sideEffects: ['More frequent injections', 'Peak-trough variation', 'Estrogen conversion'],
  },
  {
    name: 'Testosterone Undecanoate',
    form: 'Injection/Oral',
    category: 'hormone',
    instructions: 'IM every 10-14 weeks (Nebido) or oral with meals. Prescription.',
    halfLifeHours: 480,
    halfLifeDays: 20,
    mgPerMl: 250,
    useCases: ['TRT', 'Less frequent dosing', 'Long-acting'],
    positives: ['Very long acting', 'Infrequent injections', 'Stable levels'],
    sideEffects: ['Estrogen conversion', 'Hematocrit', 'Oil volume per injection'],
  },
  {
    name: 'Nandrolone Decanoate',
    form: 'Injection',
    category: 'hormone',
    instructions: 'IM injection. Typically weekly. Prescription.',
    halfLifeHours: 168,
    halfLifeDays: 7,
    mgPerMl: 200,
    useCases: ['Joint support', 'Bulking', 'Anemia', 'Lean mass'],
    positives: ['Joint relief', 'Collagen synthesis', 'Less estrogenic', 'Quality mass'],
    sideEffects: ['Deca dick', 'Prolactin', 'Suppression', 'Cardiovascular concerns'],
  },
  {
    name: 'Nandrolone Phenylpropionate',
    form: 'Injection',
    category: 'hormone',
    instructions: 'IM injection. 2-3x per week. Shorter ester than decanoate.',
    halfLifeHours: 108,
    halfLifeDays: 4.5,
    mgPerMl: 100,
    useCases: ['Joint support', 'Faster acting nandrolone', 'Bulking'],
    positives: ['Joint relief', 'Faster clearance', 'Less frequent than prop'],
    sideEffects: ['Prolactin', 'Suppression', 'More frequent injections'],
  },
  {
    name: 'Trenbolone Acetate',
    form: 'Injection',
    category: 'hormone',
    instructions: 'IM injection. ED or EOD. Very potent. Prescription (veterinary).',
    halfLifeHours: 72,
    halfLifeDays: 3,
    mgPerMl: 100,
    useCases: ['Recomposition', 'Strength', 'Hardening', 'Aggressive cutting'],
    positives: ['Extremely potent', 'Nutrient partitioning', 'Strength gains', 'Hard look'],
    sideEffects: ['Night sweats', 'Insomnia', 'Aggression', 'Cardiovascular', 'Cough', 'Suppression'],
  },
  {
    name: 'Trenbolone Enanthate',
    form: 'Injection',
    category: 'hormone',
    instructions: 'IM injection. 2x per week. Long-acting tren.',
    halfLifeHours: 192,
    halfLifeDays: 8,
    mgPerMl: 200,
    useCases: ['Recomposition', 'Longer ester', 'Less frequent injection'],
    positives: ['Potent', 'Less frequent dosing', 'Similar benefits to ace'],
    sideEffects: ['Longer clearance', 'Night sweats', 'Insomnia', 'Cardiovascular'],
  },
  {
    name: 'Boldenone Undecylenate',
    form: 'Injection',
    category: 'hormone',
    instructions: 'IM injection. Weekly. Long half-life.',
    halfLifeHours: 336,
    halfLifeDays: 14,
    mgPerMl: 200,
    useCases: ['Lean mass', 'Endurance', 'Vascularity', 'Bulking'],
    positives: ['Erythropoiesis', 'Appetite', 'Quality gains', 'Vascularity'],
    sideEffects: ['Suppression', 'Virilization', 'Hematocrit', 'Long detection'],
  },
  {
    name: 'Drostanolone Propionate (Masteron)',
    form: 'Injection',
    category: 'hormone',
    instructions: 'IM injection. EOD. Often used in contest prep.',
    halfLifeHours: 48,
    halfLifeDays: 2,
    mgPerMl: 100,
    useCases: ['Cutting', 'Hardening', 'AI properties', 'Contest prep'],
    positives: ['Anti-estrogenic', 'Hard look', 'DHT derivative', 'Water reduction'],
    sideEffects: ['Hair loss', 'Oil production', 'Suppression', 'Lipid impact'],
  },
  {
    name: 'Stanozolol (Winstrol)',
    form: 'Oral/Injection',
    category: 'hormone',
    instructions: 'Oral daily or IM EOD. Liver toxic.',
    halfLifeHours: 9,
    useCases: ['Cutting', 'Strength', 'Athletic performance', 'Hardening'],
    positives: ['Dry look', 'Strength', 'No aromatization'],
    sideEffects: ['Liver toxicity', 'Joint dryness', 'Lipid impact', 'Hair loss'],
  },
  {
    name: 'Oxandrolone (Anavar)',
    form: 'Oral',
    category: 'hormone',
    instructions: 'Oral. Take with food. Lower hepatotoxicity than other orals.',
    halfLifeHours: 9,
    useCases: ['Cutting', 'Lean mass', 'Women', 'Preservation'],
    positives: ['Mild on liver', 'Quality gains', 'Women tolerate well'],
    sideEffects: ['Lipid impact', 'Suppression', 'Virilization in women'],
  },
  {
    name: 'Anastrozole',
    form: 'Tablet',
    category: 'hormone',
    instructions: 'As prescribed. Aromatase inhibitor. Typically 0.25-1mg.',
    halfLifeHours: 50,
    useCases: ['Estrogen control', 'AI on cycle', 'Gyno prevention', 'TRT support'],
    positives: ['Reduces estrogen', 'Prevents gyno', 'May improve ratios'],
    sideEffects: ['Crash E2', 'Joint pain', 'Mood', 'Bone density', 'Libido'],
  },
  {
    name: 'HCG',
    form: 'Injection',
    category: 'hormone',
    instructions: 'Subcutaneous. Per protocol. Prescription.',
    halfLifeHours: 36,
    mgPerMl: 5000,
    useCases: ['Fertility', 'PCT', 'Testicular atrophy prevention', 'Leydig support'],
    positives: ['Maintains testicular function', 'Fertility', 'Smoother PCT'],
    sideEffects: ['Estrogen increase', 'Desensitization with prolonged use', 'Injection site reaction'],
  },
  {
    name: 'Enclomiphene',
    form: 'Tablet',
    category: 'hormone',
    instructions: 'As prescribed. SERM for PCT or TRT alternative.',
    halfLifeHours: 10,
    useCases: ['PCT', 'Hypogonadism', 'Fertility', 'TRT alternative'],
    positives: ['Stimulates natural T', 'Fertility friendly', 'Oral'],
    sideEffects: ['Vision changes', 'Mood', 'Hot flashes', 'Estrogen rebound'],
  },
  // === Peptides ===
  {
    name: 'BPC-157',
    form: 'Injection',
    category: 'peptide',
    instructions: 'Subcutaneous. 250-500mcg 1-2x daily. Research use.',
    halfLifeHours: 4,
    useCases: ['Gut healing', 'Tendon repair', 'Joint recovery', 'Ligament healing'],
    positives: ['Angiogenesis', 'Growth hormone receptor upregulation', 'Healing acceleration'],
    sideEffects: ['Generally well-tolerated', 'Injection site reaction', 'Limited human data'],
  },
  {
    name: 'TB-500',
    form: 'Injection',
    category: 'peptide',
    instructions: 'Subcutaneous. Loading then maintenance. Research use.',
    halfLifeHours: 2,
    useCases: ['Tissue repair', 'Mobility', 'Recovery', 'Cell migration'],
    positives: ['Cell migration', 'Anti-inflammatory', 'Tissue remodeling', 'Flexibility'],
    sideEffects: ['Generally well-tolerated', 'Limited human data'],
  },
  {
    name: 'Ipamorelin',
    form: 'Injection',
    category: 'peptide',
    instructions: 'Subcutaneous. Often pre-bed. Fasting state preferred.',
    halfLifeHours: 2,
    useCases: ['GH release', 'Recovery', 'Sleep', 'Body composition', 'Anti-aging'],
    positives: ['GH pulse without cortisol', 'Minimal hunger', 'Quality sleep', 'Lean mass'],
    sideEffects: ['Injection site reaction', 'Transient flushing', 'Tiredness'],
  },
  {
    name: 'CJC-1295 (DAC)',
    form: 'Injection',
    category: 'peptide',
    instructions: 'Subcutaneous. 1-2x per week. Long-acting GHRH.',
    halfLifeHours: 168,
    halfLifeDays: 7,
    useCases: ['GH enhancement', 'Recovery', 'Body composition', 'Anti-aging'],
    positives: ['Extended GH release', 'Convenient dosing', 'Synergy with GHRPs'],
    sideEffects: ['Water retention', 'Carpal tunnel', 'Insulin resistance', 'Injection site reaction'],
  },
  {
    name: 'CJC-1295 (No DAC)',
    form: 'Injection',
    category: 'peptide',
    instructions: 'Subcutaneous. Daily, often with Ipamorelin. Pre-bed.',
    halfLifeHours: 0.5,
    useCases: ['GH release', 'Pulse with Ipamorelin', 'Recovery'],
    positives: ['Natural pulse pattern', 'Less sides than DAC', 'Synergy with Ipamorelin'],
    sideEffects: ['More frequent injections', 'Injection site reaction'],
  },
  {
    name: 'Sermorelin',
    form: 'Injection',
    category: 'peptide',
    instructions: 'Subcutaneous. Daily. GHRH analog. Prescription.',
    halfLifeHours: 0.3,
    useCases: ['GH deficiency', 'Anti-aging', 'Recovery', 'Pediatric growth'],
    positives: ['Natural GH pulse', 'Well-studied', 'Prescription available'],
    sideEffects: ['Injection site reaction', 'Headache', 'Flushing'],
  },
  {
    name: 'GHRP-6',
    form: 'Injection',
    category: 'peptide',
    instructions: 'Subcutaneous. Pre-meal or pre-bed. Increases hunger.',
    halfLifeHours: 1.5,
    useCases: ['GH release', 'Appetite stimulation', 'Recovery', 'Lean mass'],
    positives: ['Strong GH release', 'Appetite increase', 'Igf-1 support'],
    sideEffects: ['Significant hunger', 'Prolactin elevation', 'Cortisol elevation'],
  },
  {
    name: 'GHRP-2',
    form: 'Injection',
    category: 'peptide',
    instructions: 'Subcutaneous. Similar to GHRP-6. Less hunger.',
    halfLifeHours: 1.5,
    useCases: ['GH release', 'Recovery', 'Body composition'],
    positives: ['GH release', 'Less hunger than GHRP-6', 'Strength support'],
    sideEffects: ['Prolactin elevation', 'Cortisol elevation', 'Injection site reaction'],
  },
  {
    name: 'IGF-1 LR3',
    form: 'Injection',
    category: 'peptide',
    instructions: 'Subcutaneous. Post-workout. Research use. Handle carefully.',
    halfLifeHours: 25,
    useCases: ['Muscle growth', 'Recovery', 'Nutrient partitioning', 'Local growth'],
    positives: ['Anabolic', 'Extended half-life vs native IGF-1', 'Recovery'],
    sideEffects: ['Hypoglycemia', 'Organ growth risk', 'Acromegaly-like', 'Limited human data'],
  },
  {
    name: 'MK-677 (Ibutamoren)',
    form: 'Oral',
    category: 'peptide',
    instructions: 'Oral. Once daily. Often before bed. Not a peptide but GHS-R agonist.',
    halfLifeHours: 6,
    useCases: ['GH/IGF-1 boost', 'Recovery', 'Sleep', 'Appetite', 'Lean mass'],
    positives: ['Oral', 'Increases GH pulse', 'Improved sleep', 'Appetite'],
    sideEffects: ['Hunger', 'Water retention', 'Insulin resistance', 'Prolactin', 'Lethargy'],
  },
  {
    name: 'PT-141 (Bremelanotide)',
    form: 'Injection',
    category: 'peptide',
    instructions: 'Subcutaneous. As needed. Prescription for hypoactive desire.',
    halfLifeHours: 2,
    useCases: ['Libido', 'Sexual function', 'Desire disorder'],
    positives: ['Central effect', 'Works in men and women', 'Not hormonal'],
    sideEffects: ['Nausea', 'Flushing', 'Yawning', 'Injection site reaction'],
  },
  {
    name: 'Epithalon',
    form: 'Injection',
    category: 'peptide',
    instructions: 'Subcutaneous. Long protocol. Research use.',
    halfLifeHours: 1,
    useCases: ['Anti-aging', 'Telomere', 'Longevity research', 'Sleep'],
    positives: ['Telomerase activation', 'Anti-aging research', 'Melatonin regulation'],
    sideEffects: ['Limited human data', 'Long-term unknown'],
  },
  {
    name: 'GHK-Cu',
    form: 'Injection/Topical',
    category: 'peptide',
    instructions: 'Subcutaneous or topical. Research use.',
    halfLifeHours: 1,
    useCases: ['Skin healing', 'Hair growth', 'Anti-aging', 'Wound healing'],
    positives: ['Collagen synthesis', 'Antioxidant', 'Wound healing', 'Hair support'],
    sideEffects: ['Injection site reaction', 'Blue-green skin discoloration', 'Limited data'],
  },
  {
    name: 'Semax',
    form: 'Nasal/Injection',
    category: 'peptide',
    instructions: 'Intranasal or subcutaneous. Research use.',
    halfLifeHours: 0.5,
    useCases: ['Cognitive enhancement', 'Neuroprotection', 'Focus', 'Mood'],
    positives: ['BDNF', 'Neuroprotective', 'Cognitive support', 'Mood'],
    sideEffects: ['Limited human data', 'Nasal irritation'],
  },
  // === Medications ===
  {
    name: 'Tadalafil',
    form: 'Tablet',
    category: 'medication',
    instructions: 'As prescribed. Daily or as-needed.',
    halfLifeHours: 17.5,
    useCases: ['ED', 'BPH', 'Pre-workout pump', 'Cardiovascular'],
    positives: ['Long half-life', 'PDE5 inhibition', 'May improve workout pump'],
    sideEffects: ['Headache', 'Flushing', 'Nasal congestion', 'Back pain', 'Vision'],
  },
  {
    name: 'Sildenafil',
    form: 'Tablet',
    category: 'medication',
    instructions: 'As prescribed. 30-60 min before. Short-acting.',
    halfLifeHours: 4,
    useCases: ['ED', 'Pulmonary hypertension', 'Pre-workout pump'],
    positives: ['Well-studied', 'Effective', 'Shorter duration'],
    sideEffects: ['Headache', 'Flushing', 'Vision (blue tint)', 'Nasal congestion'],
  },
  {
    name: 'Metformin',
    form: 'Tablet',
    category: 'medication',
    instructions: 'As prescribed. Usually with meals.',
    halfLifeHours: 6,
    useCases: ['Type 2 diabetes', 'Insulin sensitivity', 'Longevity', 'Weight'],
    positives: ['Improves insulin sensitivity', 'Longevity research', 'Cardiovascular benefits'],
    sideEffects: ['GI upset', 'Lactic acidosis rare', 'B12 deficiency', 'Lactic acid in training'],
  },
  {
    name: 'Semaglutide',
    form: 'Injection',
    category: 'medication',
    instructions: 'Subcutaneous weekly. Titrate per protocol. Prescription.',
    halfLifeHours: 168,
    halfLifeDays: 7,
    useCases: ['Weight loss', 'Type 2 diabetes', 'GLP-1 agonist', 'Appetite suppression'],
    positives: ['Significant weight loss', 'Appetite control', 'Glucose control', 'Cardiovascular'],
    sideEffects: ['Nausea', 'GI issues', 'Gallbladder', 'Muscle loss', 'Fatigue'],
  },
  {
    name: 'Tirzepatide',
    form: 'Injection',
    category: 'medication',
    instructions: 'Subcutaneous weekly. Prescription. Dual GIP/GLP-1.',
    halfLifeHours: 120,
    halfLifeDays: 5,
    useCases: ['Weight loss', 'Type 2 diabetes', 'Dual agonist', 'Appetite suppression'],
    positives: ['Superior weight loss vs semaglutide', 'Glucose control', 'Once weekly'],
    sideEffects: ['Nausea', 'GI issues', 'Gallbladder', 'Muscle loss', 'Cost'],
  },
]

const CHECKIN_TEMPLATES: CheckinTemplate[] = [
  {
    name: 'Daily Check-in',
    description: 'Quick daily wellness and progress tracking',
    frequency: 'daily',
    isDefault: true,
    questions: [
      { id: 'energy', question: 'How is your energy level today?', type: 'scale', options: ['1 - Very low', '2', '3', '4', '5', '6', '7', '8', '9', '10 - Excellent'] },
      { id: 'sleep', question: 'How many hours did you sleep last night?', type: 'number' },
      { id: 'adherence', question: 'Did you follow your nutrition plan today?', type: 'scale', options: ['1 - Not at all', '2', '3', '4', '5 - Completely'] },
      { id: 'workout', question: 'Did you complete your planned workout?', type: 'checkbox', options: ['Yes', 'Partial', 'No', 'Rest day'] },
      { id: 'notes', question: 'Any notes or concerns?', type: 'text' },
    ],
  },
  {
    name: 'Weekly Progress',
    description: 'Weekly reflection and progress assessment',
    frequency: 'weekly',
    isDefault: false,
    questions: [
      { id: 'weight', question: 'Current weight (kg)', type: 'number' },
      { id: 'adherence_week', question: 'Overall plan adherence this week (1-10)', type: 'scale', options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] },
      { id: 'workouts_done', question: 'How many planned workouts did you complete?', type: 'number' },
      { id: 'challenges', question: 'What challenges did you face?', type: 'text' },
      { id: 'wins', question: 'What went well?', type: 'text' },
      { id: 'goals_next', question: 'Focus for next week?', type: 'text' },
    ],
  },
  {
    name: 'Body Measurements',
    description: 'Weekly body measurement tracking',
    frequency: 'weekly',
    isDefault: false,
    questions: [
      { id: 'weight', question: 'Weight (kg)', type: 'number' },
      { id: 'chest', question: 'Chest (cm)', type: 'number' },
      { id: 'waist', question: 'Waist (cm)', type: 'number' },
      { id: 'hips', question: 'Hips (cm)', type: 'number' },
      { id: 'arm_left', question: 'Left arm (cm)', type: 'number' },
      { id: 'arm_right', question: 'Right arm (cm)', type: 'number' },
      { id: 'thigh_left', question: 'Left thigh (cm)', type: 'number' },
      { id: 'thigh_right', question: 'Right thigh (cm)', type: 'number' },
      { id: 'notes', question: 'Notes', type: 'text' },
    ],
  },
  {
    name: 'Body composition',
    description: 'Weight and body fat % for AI predictions',
    frequency: 'weekly',
    isDefault: false,
    questions: [
      { id: 'weight', question: 'Weight (kg)', type: 'number' },
      { id: 'bf', question: 'Body fat % (optional)', type: 'number' },
      { id: 'notes', question: 'Notes', type: 'text' },
    ],
  },
]

const SESSION_SURVEY_TEMPLATES = [
  {
    name: 'Post-workout feedback',
    description: 'How did you feel after training?',
    questions: [
      { id: 'energy', question: 'How was your energy during the workout?', type: 'scale', options: ['1 - Very low', '2', '3', '4', '5', '6', '7', '8', '9', '10 - Excellent'] },
      { id: 'difficulty', question: 'How difficult did the workout feel?', type: 'scale', options: ['1 - Too easy', '2', '3', '4', '5 - Just right', '6', '7', '8', '9', '10 - Too hard'] },
      { id: 'soreness', question: 'Any muscle soreness or pain?', type: 'text' },
      { id: 'notes', question: 'Additional notes about the session?', type: 'text' },
    ],
  },
]

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'item'
}

async function clearCollection(db: ReturnType<typeof getFirestore>, name: string) {
  const col = db.collection(name)
  const snap = await col.get()
  const batchSize = 500
  for (let i = 0; i < snap.docs.length; i += batchSize) {
    const batch = db.batch()
    snap.docs.slice(i, i + batchSize).forEach((d) => batch.delete(d.ref))
    await batch.commit()
  }
  console.log(`Deleted ${snap.docs.length} from ${name}`)
}

async function main() {
  let serviceAccount: ServiceAccount
  try {
    const raw = readFileSync(SERVICE_ACCOUNT_PATH, 'utf-8')
    serviceAccount = JSON.parse(raw) as ServiceAccount
  } catch {
    console.error('Missing service-account.json. Copy from Firebase Console > Project Settings > Service Accounts.')
    process.exit(1)
  }

  initializeApp({ credential: cert(serviceAccount) })
  const db = getFirestore()

  const clearFirst = process.env.CLEAR_CATALOGS === '1' || process.argv.includes('--clear')
  if (clearFirst) {
    console.log('Clearing existing catalogs...')
    await clearCollection(db, 'foodItems')
    await clearCollection(db, 'exercises')
    await clearCollection(db, 'supplementCatalog')
  }

  const batch = db.batch()
  const now = FieldValue.serverTimestamp()
  const ts = Date.now()

  // Seed foodItems (deterministic IDs to avoid duplicates on re-seed)
  const foodsCol = db.collection('foodItems')
  const seenFoodIds = new Set<string>()
  for (let i = 0; i < FOODS.length; i++) {
    const base = slugify(FOODS[i].name)
    let id = `food-${base}`
    let suffix = 0
    while (seenFoodIds.has(id)) {
      suffix++
      id = `food-${base}-${suffix}`
    }
    seenFoodIds.add(id)
    const ref = foodsCol.doc(id)
    batch.set(ref, FOODS[i])
  }

  // Seed exercises (deterministic IDs to avoid duplicates on re-seed)
  const exCol = db.collection('exercises')
  const seenExIds = new Set<string>()
  for (let i = 0; i < EXERCISES.length; i++) {
    const base = slugify(EXERCISES[i].name)
    let id = `ex-${base}`
    let suffix = 0
    while (seenExIds.has(id)) {
      suffix++
      id = `ex-${base}-${suffix}`
    }
    seenExIds.add(id)
    const ref = exCol.doc(id)
    batch.set(ref, EXERCISES[i])
  }

  // Seed supplementCatalog
  const supCol = db.collection('supplementCatalog')
  for (let i = 0; i < SUPPLEMENTS.length; i++) {
    const ref = supCol.doc(`sup-${ts}-${i}`)
    batch.set(ref, SUPPLEMENTS[i])
  }

  // Seed checkinTemplates
  const tmplCol = db.collection('checkinTemplates')
  for (let i = 0; i < CHECKIN_TEMPLATES.length; i++) {
    const t = CHECKIN_TEMPLATES[i]
    const ref = tmplCol.doc(`tpl-${ts}-${i}`)
    batch.set(ref, { ...t, createdAt: now, updatedAt: now })
  }

  // Seed sessionSurveyTemplates (post-workout "how did you feel")
  const surveyCol = db.collection('sessionSurveyTemplates')
  for (let i = 0; i < SESSION_SURVEY_TEMPLATES.length; i++) {
    const s = SESSION_SURVEY_TEMPLATES[i]
    const ref = surveyCol.doc(`survey-${ts}-${i}`)
    batch.set(ref, { ...s, createdAt: now, updatedAt: now })
  }

  await batch.commit()
  console.log('Seeding complete:')
  console.log(`  - ${FOODS.length} food items`)
  console.log(`  - ${EXERCISES.length} exercises`)
  console.log(`  - ${SUPPLEMENTS.length} supplements`)
  console.log(`  - ${CHECKIN_TEMPLATES.length} check-in templates`)
  console.log(`  - ${SESSION_SURVEY_TEMPLATES.length} post-workout survey templates`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
