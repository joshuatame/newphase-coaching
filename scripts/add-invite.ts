/**
 * Add an email to the invite-only allow list.
 * Run: npm run add-invite -- user@example.com
 */
import 'dotenv/config'
import { readFileSync } from 'fs'
import { join } from 'path'
import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

const SERVICE_ACCOUNT_PATH = join(process.cwd(), 'service-account.json')
const email = process.argv[2]?.toLowerCase().trim()

if (!email || !email.includes('@')) {
  console.error('Usage: npm run add-invite -- user@example.com')
  process.exit(1)
}

async function main() {
  const raw = readFileSync(SERVICE_ACCOUNT_PATH, 'utf-8')
  const serviceAccount = JSON.parse(raw) as ServiceAccount
  initializeApp({ credential: cert(serviceAccount) })
  const db = getFirestore()

  const docId = email.replace(/\./g, '_')
  await db.collection('allowedEmails').doc(docId).set({
    email,
    addedAt: FieldValue.serverTimestamp(),
  })
  console.log('Added', email, 'to allowedEmails')
}

main().catch(console.error)
