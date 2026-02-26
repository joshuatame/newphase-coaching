/**
 * Seed exercises with videos and images.
 * Run: npm run seed:exercises
 */
import 'dotenv/config'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

interface Exercise {
  name: string
  category?: string
  targetMuscles?: string[]
  equipment?: string[]
  instructions?: string
  videoLink?: string
  imageUrl?: string
}

const EXERCISES: Exercise[] = [
  { name: 'Bench Press', category: 'Chest', targetMuscles: ['pectorals', 'triceps', 'anterior deltoids'], equipment: ['barbell', 'bench'], instructions: 'Lie on bench, grip bar slightly wider than shoulders. Lower to chest, press up.', videoLink: 'https://www.youtube.com/watch?v=rT7DgCr-3pg', imageUrl: 'https://images.unsplash.com/photo-1534368959876-26bf04f2c947?w=400' },
  { name: 'Squat', category: 'Legs', targetMuscles: ['quadriceps', 'glutes', 'hamstrings'], equipment: ['barbell', 'rack'], instructions: 'Bar on upper back. Descend until thighs parallel, drive up.', videoLink: 'https://www.youtube.com/watch?v=ultWZbUMPL8', imageUrl: 'https://images.unsplash.com/photo-1598268038678-d6b0d83c33b2?w=400' },
  { name: 'Deadlift', category: 'Back', targetMuscles: ['erector spinae', 'glutes', 'hamstrings'], equipment: ['barbell'], instructions: 'Hinge at hips, grip bar. Drive through heels, extend hips.', videoLink: 'https://www.youtube.com/watch?v=op9kVnSso6Q', imageUrl: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=400' },
  { name: 'Overhead Press', category: 'Shoulders', targetMuscles: ['deltoids', 'triceps'], equipment: ['barbell'], instructions: 'Press bar from front rack to overhead. Lock out arms.', videoLink: 'https://www.youtube.com/watch?v=QAQ64hK4Xxs', imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c149e?w=400' },
  { name: 'Barbell Row', category: 'Back', targetMuscles: ['latissimus dorsi', 'rhomboids', 'biceps'], equipment: ['barbell'], instructions: 'Hinge forward, row bar to lower chest. Squeeze shoulder blades.', videoLink: 'https://www.youtube.com/watch?v=FWJR5Ve8bnQ' },
  { name: 'Pull-ups', category: 'Back', targetMuscles: ['lats', 'biceps', 'core'], equipment: ['pull-up bar'], instructions: 'Hang from bar. Pull chin over bar. Lower with control.', videoLink: 'https://www.youtube.com/watch?v=eGo4IYlbE5g' },
  { name: 'Dumbbell Curl', category: 'Arms', targetMuscles: ['biceps'], equipment: ['dumbbells'], instructions: 'Arms at sides. Curl dumbbells to shoulders. Lower slowly.', videoLink: 'https://www.youtube.com/watch?v=-B9JDsPYRqI' },
  { name: 'Tricep Pushdown', category: 'Arms', targetMuscles: ['triceps'], equipment: ['cable', 'rope/bar'], instructions: 'Push cable down. Keep elbows at sides. Extend fully.', videoLink: 'https://www.youtube.com/watch?v=-xa-6cQaZKY' },
  { name: 'Leg Press', category: 'Legs', targetMuscles: ['quadriceps', 'glutes'], equipment: ['leg press machine'], instructions: 'Feet on platform. Lower until 90 degrees. Press through heels.', videoLink: 'https://www.youtube.com/watch?v=IZxyjW7MPJQ' },
  { name: 'Romanian Deadlift', category: 'Legs', targetMuscles: ['hamstrings', 'glutes'], equipment: ['barbell', 'dumbbells'], instructions: 'Hinge at hips, lower bar along legs. Feel hamstring stretch.', videoLink: 'https://www.youtube.com/watch?v=JCXUYuzwNrM' },
  { name: 'Lunges', category: 'Legs', targetMuscles: ['quadriceps', 'glutes'], equipment: ['dumbbells', 'barbell'], instructions: 'Step forward, lower back knee toward floor. Alternate legs.', videoLink: 'https://www.youtube.com/watch?v=QOVaHwm-Q6U' },
  { name: 'Incline Dumbbell Press', category: 'Chest', targetMuscles: ['upper chest', 'triceps'], equipment: ['dumbbells', 'incline bench'], instructions: 'Set bench 30-45°. Press dumbbells up from chest level.', videoLink: 'https://www.youtube.com/watch?v=8iPEnn-ltC8' },
  { name: 'Cable Fly', category: 'Chest', targetMuscles: ['pectorals'], equipment: ['cable'], instructions: 'Arms out to sides. Bring handles together in front. Control return.', videoLink: 'https://www.youtube.com/watch?v=Iwe6AmxVf7o' },
  { name: 'Lateral Raise', category: 'Shoulders', targetMuscles: ['lateral deltoids'], equipment: ['dumbbells'], instructions: 'Raise dumbbells to sides until parallel. Lower slowly.', videoLink: 'https://www.youtube.com/watch?v=3VcKaXpzqRo' },
  { name: 'Face Pull', category: 'Shoulders', targetMuscles: ['rear deltoids', 'rhomboids'], equipment: ['cable', 'rope'], instructions: 'Pull rope to face. elbows high. Squeeze rear delts.', videoLink: 'https://www.youtube.com/watch?v=rep-qVOkqgk' },
  { name: 'Plank', category: 'Core', targetMuscles: ['abs', 'core'], equipment: ['bodyweight'], instructions: 'Hold push-up position. Keep body straight. Breathe.', videoLink: 'https://www.youtube.com/watch?v=ASdvN_XEl_c' },
  { name: 'Cable Crunch', category: 'Core', targetMuscles: ['rectus abdominis'], equipment: ['cable'], instructions: 'Kneel, pull cable down. Crunch abs. Control return.', videoLink: 'https://www.youtube.com/watch?v=sKvIHf1s4sM' },
  { name: 'Hip Thrust', category: 'Legs', targetMuscles: ['glutes'], equipment: ['barbell', 'bench'], instructions: 'Upper back on bench. Drive hips up. Squeeze glutes at top.', videoLink: 'https://www.youtube.com/watch?v=wPZP8B-SRbk' },
  { name: 'Calf Raise', category: 'Legs', targetMuscles: ['calves'], equipment: ['machine', 'dumbbells'], instructions: 'Rise onto toes. Lower heels below platform. Full range.', videoLink: 'https://www.youtube.com/watch?v=wClEOoRdnqw' },
  { name: 'Hammer Curl', category: 'Arms', targetMuscles: ['biceps', 'forearms'], equipment: ['dumbbells'], instructions: 'Neutral grip. Curl to shoulders. Alternate or together.', videoLink: 'https://www.youtube.com/watch?v=zC3nLlEvin4' },
  { name: 'Skull Crushers', category: 'Arms', targetMuscles: ['triceps'], equipment: ['barbell', 'EZ bar'], instructions: 'Lower bar to forehead. Extend arms. Keep elbows stable.', videoLink: 'https://www.youtube.com/watch?v=d_KZxkY_0cM' },
  { name: 'Lat Pulldown', category: 'Back', targetMuscles: ['lats', 'biceps'], equipment: ['cable'], instructions: 'Pull bar to upper chest. Squeeze lats. Control return.', videoLink: 'https://www.youtube.com/watch?v=CAwf7n6Luuc' },
  { name: 'Seated Row', category: 'Back', targetMuscles: ['lats', 'rhomboids'], equipment: ['cable'], instructions: 'Pull handle to stomach. Squeeze shoulder blades together.', videoLink: 'https://www.youtube.com/watch?v=GZbfZ033f74' },
  { name: 'Push-ups', category: 'Chest', targetMuscles: ['pectorals', 'triceps', 'core'], equipment: ['bodyweight'], instructions: 'Hands shoulder-width. Lower chest to floor. Push back up.', videoLink: 'https://www.youtube.com/watch?v=IODxDxX7oi4' },
  { name: 'Dips', category: 'Arms', targetMuscles: ['triceps', 'chest'], equipment: ['dip station'], instructions: 'Support on bars. Lower until upper arms parallel. Press up.', videoLink: 'https://www.youtube.com/watch?v=2z8JmcrW-As' },
]

async function seed() {
  const col = collection(db, 'exercises')
  for (let i = 0; i < EXERCISES.length; i++) {
    const id = `ex-${Date.now()}-${i}`
    await setDoc(doc(col, id), EXERCISES[i])
  }
  console.log(`Seeded ${EXERCISES.length} exercises`)
}

seed().catch(console.error)
