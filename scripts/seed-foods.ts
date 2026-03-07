/**
 * Seed food items with nutritional data.
 * Run: npm run seed:foods (requires .env with VITE_FIREBASE_* and Firebase Auth as admin)
 * For first run, use Firebase Console or Admin SDK with service account.
 */
import 'dotenv/config'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, doc, setDoc, getDocs } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}
if (!firebaseConfig.projectId) {
  console.error('Set VITE_FIREBASE_* in .env. Copy from .env.example')
  process.exit(1)
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

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
]

async function seed() {
  const col = collection(db, 'foodItems')
  const existing = await getDocs(col)
  const existingNames = new Set(existing.docs.map((d) => (d.data().name as string)?.toLowerCase().trim()).filter(Boolean))
  let added = 0
  for (let i = 0; i < FOODS.length; i++) {
    const key = FOODS[i].name.toLowerCase().trim()
    if (existingNames.has(key)) continue
    existingNames.add(key)
    const id = `food-${Date.now()}-${i}`
    await setDoc(doc(col, id), FOODS[i])
    added++
  }
  console.log(`Seeded ${added} new food items (${FOODS.length - added} skipped as duplicates)`)
}

seed().catch(console.error)
