/**
 * Create a trainer+client user so you can be your own trainer.
 * Run: npx tsx scripts/create-trainer-client-user.ts
 *
 * Creates:
 * - Firebase Auth user (email/password)
 * - users/{uid} with role: 'trainer'
 * - clients/{uid} document linked to that user (uid field) so they appear as a client
 * - allowedEmails entry for invite-only access
 *
 * After running, log in with the credentials and you'll see both trainer sidebar and your
 * own client record under Clients. Assign yourself to meal plans / workout plans as needed.
 */
import 'dotenv/config'
import { readFileSync } from 'fs'
import { join } from 'path'
import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

const SERVICE_ACCOUNT_PATH = join(process.cwd(), 'service-account.json')

const EMAIL = process.env.TRAINER_CLIENT_EMAIL ?? 'client.joshua.tame92@gmail.com'
const PASSWORD = process.env.TRAINER_CLIENT_PASSWORD ?? 'Buster123'
const DISPLAY_NAME = process.env.TRAINER_CLIENT_DISPLAY_NAME ?? 'Joshua'

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
  const auth = getAuth()
  const db = getFirestore()

  try {
    let user: import('firebase-admin/auth').UserRecord
    try {
      user = await auth.getUserByEmail(EMAIL)
      console.log('User already exists:', user.uid)
    } catch {
      user = await auth.createUser({
        email: EMAIL,
        password: PASSWORD,
        emailVerified: true,
        displayName: DISPLAY_NAME,
      })
      console.log('Created user:', user.uid)
    }

    await db.collection('users').doc(user.uid).set(
      {
        uid: user.uid,
        email: EMAIL,
        displayName: DISPLAY_NAME,
        role: 'trainer',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
    console.log("Updated users/" + user.uid + " with role: trainer")

    const clientRef = db.collection('clients').doc(user.uid)
    await clientRef.set(
      {
        uid: user.uid,
        email: EMAIL,
        displayName: DISPLAY_NAME,
        units: 'metric',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
    console.log("Created/updated clients/" + user.uid + " (you appear as your own client)")

    await db
      .collection('allowedEmails')
      .doc(EMAIL.replace(/\./g, '_'))
      .set({
        email: EMAIL,
        addedAt: FieldValue.serverTimestamp(),
      })
    console.log('Added to allowedEmails for invite-only access')

    console.log('\n--- Credentials ---')
    console.log('Email:', EMAIL)
    console.log('Password:', PASSWORD)
    console.log('---')
    console.log('Log in and go to Clients to see yourself. Use Analytics and Meal/Training plans as your own trainer.')
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

main()
