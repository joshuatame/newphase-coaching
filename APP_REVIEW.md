# Newphase Coaching – Full App Review

**Review date:** February 26, 2025  
**Build status:** App and Functions build successfully.

---

## Build verification

| Component | Status |
|-----------|--------|
| **App build** | OK – `npm run build` completes, dist/ generated |
| **Cloud Functions** | OK – `functions/npm run build` completes |
| **Firebase SW** | OK – `firebase-messaging-sw.js` generated in build |

---

## Feature implementation status

### 1. Check-ins

- **Templates hidden from clients** – Clients see only “Submit check-in”.
- **Templates in Admin** – Managed in Admin check-in templates section.
- **Trainer dashboard** – Daily vs weekly check-ins shown separately.

### 2. Invite system

- **Invite emails** – `onInviteAdded` triggers when an invite is added to `allowedEmails` and sends an invite email.
- **Role selection** – Admin can choose Client, Trainer, or Both.
- **Email content** – Invite email updated to remove the incorrect “default password” text; users set their own password on signup.

### 3. Postmark email

- **Integration** – Uses Postmark REST API.
- **Config** – Reads from `functions/.env` (POSTMARK_API_TOKEN, POSTMARK_FROM). Set with `npx tsx scripts/setup-postmark.ts`.
- **Note for production:** Firebase does not automatically load `functions/.env`. For deployed functions, either:
  - Set: run `npx tsx scripts/setup-postmark.ts` with POSTMARK_TOKEN and POSTMARK_FROM in `.env`, or add them to `functions/.env`
  - Or use Secret Manager in Google Cloud.
- **Sender domain** – `POSTMARK_FROM` must use a verified sender in Postmark.

### 4. Productivity – Diary tab

- **Book view** – Card-style pages with page navigation.
- **List view** – Chronological list.
- **Data** – Uses `productivityEntries` where `diaryNote` exists.

### 5. Calendar scheduler

- **30‑min slots** – Daily schedule 00:00–23:30.
- **Add/edit/delete** – Events CRUD.
- **Reminders** – Stored as `reminderMinutes`.
- **Collection** – `calendarEvents` with Firestore index on `(clientId, startTime)`.

### 6. Calendar reminders (push + backend)

- **Scheduled job** – `calendarReminderScheduled` runs every 5 minutes.
- **Actions** – Creates in‑app notification and sends push.
- **Settings** – Toggle in Settings: “Calendar schedule reminders” (`scheduleReminders` in `userPreferences`).

### 7. Community challenges

- **Admin** – Create challenges (title, description, metric, dates), invite clients.
- **Pages** – `/challenges` list and `/challenges/:challengeId` detail.
- **Leaderboard** – Uses steps, weight loss, workouts (from `stepsEntries`, `progressMeasurements`, `workoutSessionSurveys`).
- **Trophies** – Crown for 1st, medals for 2nd and 3rd.
- **Collections** – `communityChallenges`, `challengeParticipants` with rules and index.

### 8. Client dashboard progress bars

- **Water** – vs `clients.waterGoalL`.
- **Meals** – items logged vs plan.
- **Calories & macros** – protein, carbs, fat progress.

---

## Configuration checklist

### `.env` (root)

- `VITE_FIREBASE_*` – API key, auth domain, project ID, storage bucket, sender ID, app ID
- `VITE_FIREBASE_VAPID_KEY` – For FCM
- `VITE_USE_EMULATORS` – `false` for production

### `functions/.env` (for local)

- `POSTMARK_API_TOKEN` – Postmark API key
- `POSTMARK_FROM` – Verified sender address

### Firestore rules

- All relevant collections have rules (users, clients, checkins, calendarEvents, communityChallenges, etc.).
- Admin-only writes where required (challenges, templates, config).
- Client/trainer scoping is enforced.

### Firestore indexes

- `productivityEntries` (clientId, date)
- `calendarEvents` (clientId, startTime)
- `challengeParticipants` (challengeId, clientId)
- Plus existing indexes for checkins, logs, notifications, etc.

---

## Deployment steps

1. **Firestore indexes**
   ```
   firebase deploy --only firestore:indexes
   ```

2. **Postmark config for production functions**
   ```
   npx tsx scripts/setup-postmark.ts (with POSTMARK_TOKEN and POSTMARK_FROM in .env), then deploy
   ```

3. **Cloud Functions**
   ```
   npm run deploy:functions
   ```
   Or: `cd functions && npm run build && firebase deploy --only functions`

4. **Hosting**
   ```
   firebase deploy
   ```
   Or: `firebase deploy --only hosting`

---

## Push notifications (FCM)

- **Service worker** – `firebase-messaging-sw.js` generated in build from `.env`.
- **VAPID key** – Must be set in `.env` for token registration.
- **Background messages** – Handled in the service worker.
- **Token registration** – `registerFCMToken` in `useNotifications` when user is logged in.

---

## Minor fix applied

- **Invite email** – Removed incorrect “default temporary password” text. Users create their own password when signing up with Firebase Auth.

---

## Potential follow‑ups

1. **Postmark** – Confirm sender domain is verified in Postmark and `POSTMARK_FROM` matches.
2. **AddClientPage** – Trainers add clients with `uid: ''`; linking happens on signup via `allowedEmails` and `onUserCreate`.
3. **Challenge leaderboard** – For many participants, per-day steps queries can be slow; consider a Cloud Function to aggregate and cache metrics.
4. **Dashboard progress bars** – If there’s no meal plan, macros fall back to 2000 cal, 150g protein, etc.; adjust defaults if needed.
5. **Resend package** – In `functions/package.json` but not used; Postmark is used instead. Consider removing the Resend dependency to keep dependencies tidy.

---

## Summary

- App and Cloud Functions build successfully.
- Core features (check-ins, invites, calendar, challenges, progress bars, diary, reminders) are implemented.
- Firestore rules and indexes are set.
- Invite email corrected; Postmark configuration and deployment steps are documented above.
