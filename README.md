# Newphase Coaching

Production-ready fitness coaching platform - React + Vite PWA with Firebase.

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Firebase is configured** (see `.env`)
   - Ensure `service-account.json` is in project root (from Firebase Console > Project Settings > Service Accounts)

3. **Enable Google Auth** (for "Continue with Google")
   - Firebase Console > Authentication > Sign-in method > Google > Enable

4. **Run dev server**
   ```bash
   npm run dev
   ```

5. **Admin tester credentials** (after running `npm run create-admin`)
   - Email: `admin@newphase.coaching`
   - Password: `Admin123!@#`

6. **Add more invites**
   ```bash
   npm run add-invite -- user@example.com
   ```

7. **Deploy Cloud Functions** (required for invite-only login)
   ```bash
   cd functions && npm install && npm run build
   firebase deploy --only functions
   ```

8. **Seed data** (optional)
   ```bash
   npm run seed:foods
   npm run seed:exercises
   npm run seed:supplements
   ```

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
| `npm run seed:foods` | Seed food items |
| `npm run seed:exercises` | Seed exercises |
| `npm run seed:supplements` | Seed supplements/hormones/peptides |

## Deploy

```bash
npm run build
firebase deploy
```

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
