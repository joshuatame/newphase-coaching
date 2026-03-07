/**
 * Seed demo client and check-ins for testing.
 * Run: npx tsx scripts/seed-demo.ts
 * Requires service-account.json and an existing admin user.
 */
import 'dotenv/config'
import { readFileSync } from 'fs'
import { join } from 'path'
import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

const SERVICE_ACCOUNT_PATH = join(process.cwd(), 'service-account.json')

const DEMO_EMAIL = 'demo@newphase.coaching'
const DEMO_PASSWORD = 'NP-Coaching12!'

async function main() {
  const raw = readFileSync(SERVICE_ACCOUNT_PATH, 'utf-8')
  const serviceAccount = JSON.parse(raw) as ServiceAccount
  initializeApp({ credential: cert(serviceAccount) })

  const auth = getAuth()
  const db = getFirestore()
  const now = FieldValue.serverTimestamp()

  let clientUid: string
  try {
    const user = await auth.getUserByEmail(DEMO_EMAIL)
    clientUid = user.uid
    console.log('Demo user exists:', clientUid)
  } catch {
    const user = await auth.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      emailVerified: true,
      displayName: 'Demo Client',
    })
    clientUid = user.uid
    console.log('Created demo user:', clientUid)
  }

  await db.collection('allowedEmails').doc(DEMO_EMAIL.replace(/\./g, '_')).set({
    email: DEMO_EMAIL,
    addedAt: now,
  })

  await db.collection('users').doc(clientUid).set({
    uid: clientUid,
    email: DEMO_EMAIL,
    displayName: 'Demo Client',
    role: 'client',
    createdAt: now,
    updatedAt: now,
  }, { merge: true })

  await db.collection('clients').doc(clientUid).set({
    uid: clientUid,
    displayName: 'Demo Client',
    goals: 'Build muscle, lose fat',
    onboardingComplete: true,
    createdAt: now,
    updatedAt: now,
  }, { merge: true })

  const templates = await db.collection('checkinTemplates').limit(1).get()
  const templateId = templates.docs[0]?.id ?? 'daily'

  const startOfWeek = (d: Date) => {
    const x = new Date(d)
    x.setDate(x.getDate() - x.getDay())
    x.setHours(0, 0, 0, 0)
    return x
  }

  const weekStart = startOfWeek(new Date())
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })

  for (let i = 0; i < days.length; i++) {
    const d = days[i]
    const dateStr = d.toISOString().split('T')[0]
    const isComplete = i < 4
    const isPendingReview = i === 4
    const checkinRef = db.collection('checkins').doc(`${clientUid}_${dateStr}`)
    await checkinRef.set({
      clientId: clientUid,
      templateId,
      date: dateStr,
      status: isComplete ? 'complete' : isPendingReview ? 'pending_review' : 'incomplete',
      answers: isComplete || isPendingReview
        ? { energy: 7, sleep: 7, adherence: 4, workout: 'Yes', notes: 'Feeling good' }
        : {},
      submittedAt: isComplete || isPendingReview ? now : null,
      createdAt: now,
      updatedAt: now,
    }, { merge: true })
  }

  console.log('Demo client:', DEMO_EMAIL)
  console.log('Check-ins: 4 complete, 1 pending review, 2 incomplete')
  console.log('Run npm run seed:all first if checkinTemplates are empty')
}

main().catch(console.error)
