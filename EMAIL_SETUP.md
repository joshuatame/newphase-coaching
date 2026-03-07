# Email Setup (Postmark)

Invite and notification emails use **Postmark**. To fix the error:

> The 'From' address you supplied (admin@newphase.coaching) is not a Sender Signature on your account.

## Steps

1. **Log in to Postmark** – [postmarkapp.com](https://postmarkapp.com)
2. **Add Sender Signature** – Go to **Sender Signatures** and click **Add Sender Signature**
3. **Verify the address** – Add `admin@newphase-coaching.com` (or your preferred From address)
4. **Confirm via email** – Postmark sends a verification email; click the link to confirm
5. **Configure the app** – Run:

   ```bash
   POSTMARK_TOKEN=your_server_token POSTMARK_FROM="Newphase Coaching <admin@newphase-coaching.com>" npx tsx scripts/setup-postmark.ts
   ```

   Or set `POSTMARK_TOKEN` and `POSTMARK_FROM` in `.env` and run the script.

6. **Deploy functions** – `npm run deploy:functions` (so the new config is used)

The `From` address must match a verified Sender Signature exactly. Use the same format: `Name <email@domain.com>`.
