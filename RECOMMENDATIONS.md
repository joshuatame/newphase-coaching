# Recommendations for Production

## Email notifications (invite)

1. **Configure Resend** for invite emails:
   - Sign up at [resend.com](https://resend.com)
   - Get API key and set: `firebase functions:config:set resend.api_key="re_xxx"`
   - Redeploy: `firebase deploy --only functions`
   - For production: verify your domain in Resend and update the `from` address in `functions/src/index.ts`

2. **Alternative**: Use Firebase Extensions "Trigger Email" with SendGrid/Mailgun.

## Security

- Rotate `service-account.json` keys periodically
- Use Firebase App Check for web to reduce abuse
- Consider rate limiting on auth endpoints

## Analytics

- Add Google Analytics or similar for usage tracking
- Implement check-in completion rates, client engagement metrics
- Add trainer performance dashboards

## Features to consider

1. **Messaging**: Implement real-time chat with Firestore listeners; add file attachments
2. **Tasks**: Add task creation, due dates, assignment to clients
3. **Meal/Workout plans**: Build plan builder UI for trainers; version history viewer
4. **Progress photos**: Client photo uploads with before/after comparison
5. **Invoicing**: Payment integration (Stripe) for client subscriptions
6. **Mobile app**: Consider React Native or PWA enhancements
7. **Scheduled emails**: Cron-triggered check-in reminders using user preferences
8. **Export**: Allow clients to export their data (GDPR compliance)

## Performance

- Add Firestore composite indexes for common queries (checkins by clientId+date, etc.)
- Implement pagination on large lists (clients, foods, exercises)
- Use Firestore `limit()` and cursor-based pagination

## Testing

- Add E2E tests (Playwright/Cypress)
- Unit tests for critical hooks (useAuth, usePreferences)
