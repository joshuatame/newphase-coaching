/**
 * Seed supplements, hormones, and peptides.
 * Run: npm run seed:supplements
 * NOTE: All values are for TRACKING ONLY. No dosing calculations or medical advice.
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

interface Supplement {
  name: string
  form?: string
  category: 'supplement' | 'hormone' | 'peptide' | 'medication'
  instructions?: string
  notes?: string
}

const ITEMS: Supplement[] = [
  { name: 'Vitamin D3', form: 'Capsule', category: 'supplement', instructions: 'Take with fatty meal for absorption.', notes: 'Common dosing tracked per trainer guidance.' },
  { name: 'Creatine Monohydrate', form: 'Powder', category: 'supplement', instructions: 'Mix with water. Can be taken pre or post workout.', notes: '5g daily typical. Loading phase optional.' },
  { name: 'Omega-3 Fish Oil', form: 'Softgel', category: 'supplement', instructions: 'Take with meals.', notes: 'EPA/DHA content varies by brand.' },
  { name: 'Magnesium Glycinate', form: 'Tablet', category: 'supplement', instructions: 'Take before bed if using for sleep.', notes: 'Avoid oxide form for absorption.' },
  { name: 'Zinc', form: 'Tablet/Capsule', category: 'supplement', instructions: 'Take with food. Avoid with calcium.', notes: 'Supports immune and hormonal health.' },
  { name: 'Multivitamin', form: 'Tablet', category: 'supplement', instructions: 'Take daily with food.', notes: 'Fill gaps from diet.' },
  { name: 'BCAAs', form: 'Powder', category: 'supplement', instructions: 'Mix with water. Pre/intra/post workout options.', notes: 'Leucine, isoleucine, valine.' },
  { name: 'Beta-Alanine', form: 'Powder', category: 'supplement', instructions: 'Split doses to reduce tingling.', notes: 'Carnosine precursor.' },
  { name: 'Citrulline Malate', form: 'Powder', category: 'supplement', instructions: 'Pre-workout. Mix with water.', notes: 'Nitric oxide support.' },
  { name: 'Caffeine', form: 'Tablet/Powder', category: 'supplement', instructions: 'Pre-workout. Avoid late day.', notes: 'Stimulant. Individual tolerance varies.' },
  { name: 'Ashwagandha', form: 'Capsule', category: 'supplement', instructions: 'Take with food. Often morning or evening.', notes: 'Adaptogen. KSM-66 common extract.' },
  { name: 'Testosterone (TRT)', form: 'Injection', category: 'hormone', instructions: 'Injection schedule per prescription. Rotate sites.', notes: 'TRACKING ONLY. Prescribed by physician.' },
  { name: 'Testosterone Cypionate', form: 'Injection', category: 'hormone', instructions: 'Typically 1-2x per week. IM or subQ per protocol.', notes: 'Ester-based. Prescription required.' },
  { name: 'Testosterone Enanthate', form: 'Injection', category: 'hormone', instructions: 'Similar to cypionate. Frequency per protocol.', notes: 'Slightly shorter half-life than cypionate.' },
  { name: 'Anastrozole', form: 'Tablet', category: 'hormone', instructions: 'As prescribed. Often 0.25-0.5mg 1-2x weekly.', notes: 'Aromatase inhibitor. Prescription only.' },
  { name: 'HCG', form: 'Injection', category: 'hormone', instructions: 'Subcutaneous. Schedule per protocol.', notes: 'Human chorionic gonadotropin. Prescription.' },
  { name: 'Nandrolone Decanoate', form: 'Injection', category: 'hormone', instructions: 'IM injection. Frequency per protocol.', notes: '19-nor compound. Prescription.' },
  { name: 'BPC-157', form: 'Injection', category: 'peptide', instructions: 'Subcutaneous. Often 250-500mcg 1-2x daily.', notes: 'Healing peptide. Research use. No medical advice.' },
  { name: 'TB-500', form: 'Injection', category: 'peptide', instructions: 'Subcutaneous. Protocol varies.', notes: 'Thymosin beta-4. Research compound.' },
  { name: 'Ipamorelin', form: 'Injection', category: 'peptide', instructions: 'Subcutaneous. Often pre-bed. Fasting state.', notes: 'Growth hormone secretagogue.' },
  { name: 'CJC-1295', form: 'Injection', category: 'peptide', instructions: 'Subcutaneous. Often combined with Ipamorelin.', notes: 'GHRH analog. Mod GRF variant.' },
  { name: 'Sermorelin', form: 'Injection', category: 'peptide', instructions: 'Subcutaneous. Often daily. Pre-bed common.', notes: 'GHRH fragment. Prescription in some regions.' },
  { name: 'PT-141 (Bremelanotide)', form: 'Injection', category: 'peptide', instructions: 'As prescribed. Subcutaneous.', notes: 'Melanocortin. Prescription.' },
  { name: 'Melanotan II', form: 'Injection', category: 'peptide', instructions: 'Subcutaneous. Dosing varies. Research.', notes: 'Tanning peptide. Not FDA approved for this use.' },
  { name: 'IGF-1 LR3', form: 'Injection', category: 'peptide', instructions: 'Subcutaneous. Post-workout common.', notes: 'Long-acting IGF-1. Research compound.' },
  { name: 'GHRP-6', form: 'Injection', category: 'peptide', instructions: 'Subcutaneous. Often 3x daily pre-meals.', notes: 'Ghrelin agonist. Growth hormone release.' },
  { name: 'MK-677 (Ibutamoren)', form: 'Oral', category: 'peptide', instructions: 'Oral. Often once daily. Can cause hunger.', notes: 'Growth hormone secretagogue. Research.' },
  { name: 'Tadalafil', form: 'Tablet', category: 'medication', instructions: 'As prescribed. Daily or pre-activity.', notes: 'PDE5 inhibitor. Prescription only.' },
  { name: 'Metformin', form: 'Tablet', category: 'medication', instructions: 'As prescribed. Usually with meals.', notes: 'Blood sugar support. Prescription.' },
  { name: 'Semaglutide', form: 'Injection', category: 'medication', instructions: 'Subcutaneous weekly. As prescribed.', notes: 'GLP-1 agonist. Prescription.' },
  { name: 'Tirzepatide', form: 'Injection', category: 'medication', instructions: 'Subcutaneous weekly. As prescribed.', notes: 'GLP-1/GIP. Prescription.' },
]

async function seed() {
  const col = collection(db, 'supplementCatalog')
  for (let i = 0; i < ITEMS.length; i++) {
    const id = `sup-${Date.now()}-${i}`
    await setDoc(doc(col, id), ITEMS[i])
  }
  console.log(`Seeded ${ITEMS.length} supplements/hormones/peptides`)
}

seed().catch(console.error)
