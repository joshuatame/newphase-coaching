/**
 * Set Postmark config for Cloud Functions (writes to functions/.env).
 * Run: POSTMARK_TOKEN=your_token POSTMARK_FROM="Name <from@domain.com>" npx tsx scripts/setup-postmark.ts
 * Or set both in root .env and run: npx tsx scripts/setup-postmark.ts
 */
import 'dotenv/config'
import { writeFileSync } from 'fs'
import { join } from 'path'

const token = process.env.POSTMARK_TOKEN ?? process.env.POSTMARK_SERVER_TOKEN ?? process.env.POSTMARK_API_TOKEN
const from = process.env.POSTMARK_FROM ?? 'Newphase Coaching <admin@newphase.coaching>'

if (!token) {
  console.error('Set POSTMARK_TOKEN, POSTMARK_SERVER_TOKEN, or POSTMARK_API_TOKEN in env')
  process.exit(1)
}

const envPath = join(process.cwd(), 'functions', '.env')
const content = `# Postmark (loaded on deploy - keep this file out of git)
POSTMARK_API_TOKEN=${token}
POSTMARK_FROM=${from}
`
writeFileSync(envPath, content)
console.log('Wrote', envPath)
console.log('Deploy functions with: npm run deploy:functions')
console.log('')
console.log('If you see "From address is not a Sender Signature":')
console.log('  1. Go to postmarkapp.com > Sender Signatures')
console.log('  2. Add and verify the From address:', from)
console.log('  3. See EMAIL_SETUP.md for details')
