/**
 * Seed using Firebase Admin (bypasses security rules).
 * Requires: GOOGLE_APPLICATION_CREDENTIALS or service account key path.
 * Run: npx tsx scripts/seed-admin.ts
 */
import 'dotenv/config'
import { initializeApp, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

if (!getApps().length) {
  initializeApp({ projectId: process.env.VITE_FIREBASE_PROJECT_ID })
}

const db = getFirestore()

// Foods
const FOODS = [
  { name: 'Chicken Breast (raw)', calories: 165, protein: 31, carbs: 0, fat: 3.6, servingSize: '100g', servingUnit: 'g' },
  { name: 'Egg (whole)', calories: 155, protein: 13, carbs: 1.1, fat: 11, servingSize: '1 large', servingUnit: 'each' },
  { name: 'Salmon (Atlantic)', calories: 208, protein: 20, carbs: 0, fat: 13, servingSize: '100g', servingUnit: 'g' },
  { name: 'Greek Yogurt (nonfat)', calories: 59, protein: 10, carbs: 3.6, fat: 0.7, servingSize: '100g', servingUnit: 'g' },
  { name: 'Brown Rice (cooked)', calories: 112, protein: 2.6, carbs: 24, fat: 0.9, fiber: 1.8, servingSize: '100g', servingUnit: 'g' },
  { name: 'Oatmeal (cooked)', calories: 68, protein: 2.4, carbs: 12, fat: 1.4, fiber: 1.7, servingSize: '100g', servingUnit: 'g' },
  { name: 'Broccoli (raw)', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, servingSize: '100g', servingUnit: 'g' },
  { name: 'Banana', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, fiber: 3.1, sugar: 14, servingSize: '1 medium', servingUnit: 'each' },
  { name: 'Whey Protein Powder', calories: 120, protein: 24, carbs: 3, fat: 1.5, servingSize: '1 scoop (30g)', servingUnit: 'g' },
]

async function seedFoods() {
  const batch = db.batch()
  FOODS.forEach((f, i) => {
    const ref = db.collection('foodItems').doc(`food-${Date.now()}-${i}`)
    batch.set(ref, f)
  })
  await batch.commit()
  console.log(`Seeded ${FOODS.length} foods`)
}

async function main() {
  await seedFoods()
}

main().catch(console.error)
