/**
 * Create an admin/trainer tester user.
 * Run: npx tsx scripts/create-admin-user.ts
 * 
 * Creates:
 * - Firebase Auth user (email/password)
 * - users/{uid} document with role: 'admin'
 * - allowedEmails entry for invite-only access
 */
import 'dotenv/config'
import { readFileSync } from 'fs'
import { join } from 'path'
import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

const SERVICE_ACCOUNT_PATH = join(process.cwd(), 'service-account.json')

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@newphase.coaching'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'Admin123!@#'

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
      user = await auth.getUserByEmail(ADMIN_EMAIL)
      console.log('User already exists:', user.uid)
    } catch {
      user = await auth.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        emailVerified: true,
        displayName: 'Admin Tester',
      })
      console.log('Created user:', user.uid)
    }

    await db.collection('users').doc(user.uid).set({
      uid: user.uid,
      email: ADMIN_EMAIL,
      displayName: 'Admin Tester',
      role: 'admin',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true })
    console.log('Updated users/' + user.uid + ' with role: admin')

    await db.collection('allowedEmails').doc(ADMIN_EMAIL.replace(/\./g, '_')).set({
      email: ADMIN_EMAIL,
      addedAt: FieldValue.serverTimestamp(),
    })
    console.log('Added to allowedEmails for invite-only access')

    console.log('\n--- Tester credentials ---')
    console.log('Email:', ADMIN_EMAIL)
    console.log('Password:', ADMIN_PASSWORD)
    console.log('---')
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

main()
