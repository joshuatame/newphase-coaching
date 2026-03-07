/**
 * @deprecated No longer needed. Firebase loads functions/.env on deploy.
 * Use setup-postmark.ts to write POSTMARK_API_TOKEN and POSTMARK_FROM to functions/.env.
 */
import { execSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const envPath = join(process.cwd(), 'functions', '.env')
if (!existsSync(envPath)) {
  console.warn('functions/.env not found. Run setup-postmark first.')
  process.exit(0)
}

const content = readFileSync(envPath, 'utf-8')
const tokenMatch = content.match(/POSTMARK_API_TOKEN=(.+)/)
const fromMatch = content.match(/POSTMARK_FROM=(.+)/)

const token = tokenMatch?.[1]?.trim()
const from = fromMatch?.[1]?.trim() || 'Newphase Coaching <notifications@yourdomain.com>'

if (!token || token === 'your_postmark_server_token') {
  console.warn('POSTMARK_API_TOKEN not set in functions/.env')
  process.exit(0)
}

try {
  try {
    execSync('firebase experiments:enable legacyRuntimeConfigCommands', { stdio: 'pipe' })
  } catch { /* already enabled */ }
  const fromEscaped = from.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const cmd = `firebase functions:config:set postmark.server_token="${token}" postmark.from="${fromEscaped}"`
  execSync(cmd, { stdio: 'inherit' })
  console.log('Postmark config set. Deploy with: npm run deploy:functions')
} catch (e) {
  console.error('Failed to set Postmark config:', (e as Error).message)
  console.error('Run: firebase experiments:enable legacyRuntimeConfigCommands')
  console.error('Then run this script again, or set config manually in Firebase Console.')
  process.exit(1)
}
