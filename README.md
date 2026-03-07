# Newphase Coaching

Production-ready fitness coaching platform - React + Vite PWA with Firebase.

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Firebase is configured** (see `.env`)
   - Copy `.env.example` to `.env` and fill in `VITE_FIREBASE_*` from Firebase Console > Project Settings
   - Ensure `service-account.json` is in project root (from Firebase Console > Project Settings > Service Accounts)
   - Set the active project: `firebase use newphase-coaching` (or `firebase use --add` to choose)

3. **Run dev server**
   ```bash
   npm run dev
   ```

4. **Create admin user** (first-time setup)
   ```bash
   npm run create-admin
   ```
   - Email: `admin@newphase.coaching` / Password: `NP-Coaching12!`

5. **Add more invites** (via CLI or Admin UI)
   ```bash
   npm run add-invite -- user@example.com
   ```
   Or use Admin > Invite management in the app. Invited users receive an email notification (requires Resend: `firebase functions:config:set resend.api_key="re_xxx"`).

6. **Deploy Firestore rules & indexes** (required for invite check and permissions)
   ```bash
   firebase deploy --only firestore
   ```

7. **Deploy Cloud Functions** (onUserCreate, onInviteAdded email, checkInviteStatus)
   ```bash
   cd functions && npm install && npm run build && firebase deploy --only functions
   ```
   For invite emails, use Postmark: `npx tsx scripts/setup-postmark.ts` (set `POSTMARK_TOKEN` and `POSTMARK_FROM` in `.env`). Values are stored in `functions/.env` and loaded on deploy.

8. **Seed data** (optional, requires service-account.json)
   ```bash
   npm run seed:all
   ```
   Seeds 79 foods, 40 exercises, 28 supplements, and 3 check-in templates.

## Assets

Place login assets in `public/assets/`:
- `lightning-bg.png` - Background (electric blue lightning)
- `logo-np.png` - NP diamond logo for modal

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run create-admin` | Create admin user (first-time) |
| `npm run add-invite -- email@example.com` | Add email to invite list |
| `npm run deploy` | Deploy all Firebase services |
| `npm run deploy:firestore` | Deploy Firestore rules & indexes |
| `npm run deploy:storage` | Deploy Storage rules |
| `npm run deploy:functions` | Build & deploy Cloud Functions |
| `npm run seed:all` | Seed all data (foods, exercises, supplements, check-in templates) via Admin SDK |
| `npm run seed:foods` | Seed food items (client SDK, requires auth) |
| `npm run seed:exercises` | Seed exercises (client SDK, requires auth) |
| `npm run seed:supplements` | Seed supplements (client SDK, requires auth) |

## Deploy

```bash
firebase use newphase-coaching   # if not already set
npm run build
firebase deploy
```

## Email & Push Notifications

**Emails** (invites, check-in alerts, plan updates) use Postmark. Configure:

1. Run `npx tsx scripts/setup-postmark.ts` with `POSTMARK_TOKEN` and `POSTMARK_FROM` in `.env`
2. Or add to `functions/.env`: `POSTMARK_API_TOKEN=...` and `POSTMARK_FROM=Name <from@domain.com>`
3. Redeploy functions: `firebase deploy --only functions`

**Push & background notifications** require:

1. `VITE_FIREBASE_VAPID_KEY` in `.env` (from Firebase Console > Project Settings > Cloud Messaging > Web Push certificates)
2. Users enable push in Settings. Background pushes use `firebase-messaging-sw.js` (auto-generated at build).

## Features

- Auth & RBAC (Admin, Trainer, Client)
- Client management
- Versioned nutrition & workout plans
- Regimen tracking (supplements, hormones, peptides)
- Check-ins with templates
- Messaging
- Tasks & productivity
- Push & in-app notifications
- Workout player with rest timer
- Forecast graphs
- Installable PWA
