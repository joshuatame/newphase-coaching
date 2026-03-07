import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

admin.initializeApp()

const db = admin.firestore()
const messaging = admin.messaging()

// Loaded from functions/.env on deploy (no longer uses deprecated functions.config())
const POSTMARK_TOKEN = process.env.POSTMARK_API_TOKEN ?? ''
const EMAIL_FROM = process.env.POSTMARK_FROM ?? 'Newphase Coaching <admin@newphase.coaching>'

function formatChanges(before: Record<string, unknown>, after: Record<string, unknown>, skipKeys = ['updatedAt', 'createdAt', 'createdBy', 'clientIds', 'updatedForClientIds']): string {
  const lines: string[] = []
  const keys = new Set([...Object.keys(before), ...Object.keys(after)])
  const label = (k: string) => k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())
  for (const k of keys) {
    if (skipKeys.includes(k)) continue
    const b = before[k]
    const a = after[k]
    const bStr = JSON.stringify(b ?? null)
    const aStr = JSON.stringify(a ?? null)
    if (bStr !== aStr) {
      if (!(k in before) || b === undefined) lines.push(`• Added: ${label(k)}`)
      else if (!(k in after) || a === undefined) lines.push(`• Removed: ${label(k)}`)
      else {
        if (Array.isArray(a)) lines.push(`• Updated: ${label(k)} (${a.length} item${a.length === 1 ? '' : 's'})`)
        else if (typeof a === 'object' && a !== null) lines.push(`• Updated: ${label(k)}`)
        else lines.push(`• Updated: ${label(k)}`)
      }
    }
  }
  return lines.length ? lines.join('<br>') : 'Plan was updated.'
}

async function getClientEmail(userId: string): Promise<string | null> {
  try {
    const user = await admin.auth().getUser(userId)
    return user.email ?? null
  } catch {
    const snap = await db.collection('users').doc(userId).get()
    return (snap.data()?.email as string) ?? null
  }
}

/** Resolve client doc id to email: clients doc first, then auth by uid. */
async function getEmailForClient(clientId: string): Promise<string | null> {
  const clientSnap = await db.collection('clients').doc(clientId).get()
  const data = clientSnap.data()
  if (data?.email) return data.email as string
  const uid = data?.uid as string | undefined
  if (uid) return getClientEmail(uid)
  return getClientEmail(clientId)
}

async function sendIfEmailEnabledByClientId(clientId: string, subject: string, html: string): Promise<boolean> {
  const email = await getEmailForClient(clientId)
  if (!email) return false
  const uid = (await db.collection('clients').doc(clientId).get()).data()?.uid ?? clientId
  const prefs = await db.collection('userPreferences').doc(uid).get()
  if (prefs.data()?.notificationsEmail === false) return false
  return sendEmail(email, subject, html)
}

async function getTrainerEmails(): Promise<string[]> {
  const snap = await db.collection('users').where('role', 'in', ['trainer', 'admin']).get()
  return snap.docs
    .map((d) => d.data().email as string)
    .filter((e) => e && e.includes('@'))
}

async function getTrainerUserIds(): Promise<string[]> {
  const snap = await db.collection('users').where('role', 'in', ['trainer', 'admin']).get()
  return snap.docs.map((d) => d.id)
}

async function sendIfEmailEnabled(userId: string, subject: string, html: string): Promise<boolean> {
  const prefs = await db.collection('userPreferences').doc(userId).get()
  if (prefs.data()?.notificationsEmail === false) return false
  const email = await getClientEmail(userId)
  if (!email) return false
  return sendEmail(email, subject, html)
}

/** Sends email and returns diagnostic result. Use for test/diagnostics. */
async function sendEmailWithResult(to: string, subject: string, html: string, text?: string): Promise<{ ok: boolean; error?: string }> {
  if (!POSTMARK_TOKEN) {
    const msg = 'Postmark not configured. Set POSTMARK_API_TOKEN and POSTMARK_FROM in functions/.env, then redeploy.'
    console.warn(msg)
    return { ok: false, error: msg }
  }
  try {
    const res = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'X-Postmark-Server-Token': POSTMARK_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        From: EMAIL_FROM,
        ReplyTo: 'admin@newphase.coaching',
        To: to,
        Subject: subject,
        HtmlBody: html,
        TextBody: text ?? html.replace(/<[^>]+>/g, ''),
      }),
    })
    const body = await res.text()
    if (!res.ok) {
      const err = body ? (() => { try { return JSON.parse(body)?.Message ?? body } catch { return body } })() : `HTTP ${res.status}`
      console.error('Postmark error:', res.status, body)
      return { ok: false, error: err }
    }
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('Send email failed:', e)
    return { ok: false, error: msg }
  }
}

async function sendEmail(to: string, subject: string, html: string, text?: string): Promise<boolean> {
  const r = await sendEmailWithResult(to, subject, html, text)
  return r.ok
}

async function sendInviteEmail(to: string): Promise<boolean> {
  return sendEmail(
    to,
    "You're invited to Newphase Coaching",
    `
      <h2>You've been invited to Newphase Coaching</h2>
      <p>An admin has added you to the platform. You can now sign up and access your coaching dashboard.</p>
      <p><strong>Get started:</strong></p>
      <ol>
        <li>Visit the app and click Sign In</li>
        <li>Create your account with this email: ${to}</li>
        <li>Set your own password when prompted</li>
      </ol>
      <p>If you did not expect this invite, you can ignore this email.</p>
      <p>— Newphase Coaching</p>
    `
  )
}

export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  let roles: ('client' | 'trainer')[] = ['client']
  if (user.email) {
    const docId = user.email.toLowerCase().replace(/\./g, '_')
    const inviteSnap = await db.collection('allowedEmails').doc(docId).get()
    const invite = inviteSnap.data()
    if (invite?.roles && Array.isArray(invite.roles) && invite.roles.length > 0) {
      roles = invite.roles.filter((r: string) => r === 'client' || r === 'trainer') as ('client' | 'trainer')[]
    }
  }

  const userRole = roles.includes('trainer') ? 'trainer' : 'client'
  await db.collection('users').doc(user.uid).set({
    uid: user.uid,
    email: user.email ?? '',
    displayName: user.displayName ?? '',
    role: userRole,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  if (roles.includes('client')) {
    const clientRef = db.collection('clients').doc(user.uid)
    const existing = await clientRef.get()
    if (!existing.exists) {
      await clientRef.set({
        uid: user.uid,
        displayName: user.displayName ?? '',
        email: user.email ?? '',
        onboardingComplete: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    }
  }
})

export const onInviteAdded = functions.firestore
  .document('allowedEmails/{docId}')
  .onCreate(async (snap) => {
    const data = snap.data()
    const email = data?.email as string | undefined
    if (!email) return
    const sent = await sendInviteEmail(email)
    if (sent) {
      await snap.ref.update({ emailSentAt: admin.firestore.FieldValue.serverTimestamp() })
    }
  })

/** Admin-only: send a test email to diagnose Postmark setup. */
export const sendTestEmail = functions.https.onCall(async (_data, context) => {
  const auth = context.auth
  if (!auth?.uid) throw new functions.https.HttpsError('unauthenticated', 'Not authenticated')
  const caller = await db.collection('users').doc(auth.uid).get()
  if (caller.data()?.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can send test emails')
  }
  const user = await admin.auth().getUser(auth.uid)
  const email = user.email
  if (!email || !email.includes('@')) {
    return { ok: false, error: 'Your account has no email address. Add an email to your profile.' }
  }
  const result = await sendEmailWithResult(
    email,
    'Newphase Coaching – Test Email',
    '<h2>Test Email</h2><p>If you received this, Postmark is configured correctly and emails are working.</p><p>— Newphase Coaching</p>'
  )
  return { ok: result.ok, error: result.error }
})

export const checkInviteStatus = functions.https.onCall(async (_data, context) => {
  const auth = context.auth as { email?: string } | undefined
  if (!auth?.email) {
    return { allowed: false }
  }
  const email = auth.email.toLowerCase()
  const snap = await db.collection('allowedEmails').where('email', '==', email).limit(1).get()
  return { allowed: !snap.empty }
})

/** Resolve client doc id to auth uid when needed. */
async function resolveUserId(userId: string): Promise<string> {
  try {
    await admin.auth().getUser(userId)
    return userId
  } catch {
    const clientSnap = await db.collection('clients').doc(userId).get()
    const uid = clientSnap.data()?.uid as string | undefined
    if (uid) return uid
    throw new functions.https.HttpsError('invalid-argument', 'User not found. Client may need to sign in first.')
  }
}

/** Send notification to a user (in-app, push, email). Callable by trainers/admins. */
export const sendNotification = functions.https.onCall(async (data: { userId: string; title: string; body: string; type?: string }, context) => {
  const auth = context.auth
  if (!auth?.uid) throw new functions.https.HttpsError('unauthenticated', 'Not authenticated')
  const { userId, title, body } = data
  if (!userId || !title || !body) {
    throw new functions.https.HttpsError('invalid-argument', 'userId, title, body required')
  }
  const caller = await db.collection('users').doc(auth.uid).get()
  const role = caller.data()?.role
  if (role !== 'admin' && role !== 'trainer') {
    throw new functions.https.HttpsError('permission-denied', 'Only trainers and admins can send notifications')
  }
  const targetUserId = await resolveUserId(userId)
  const notifRef = await db.collection('notifications').add({
    userId: targetUserId,
    title,
    body,
    type: data.type ?? 'general',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    read: false,
  })
  const tokensSnap = await db.collection('fcmTokens').doc(targetUserId).collection('tokens').get()
  const fcmTokens = tokensSnap.docs.map((d) => d.data().token).filter(Boolean)
  if (fcmTokens.length > 0) {
    try {
      await messaging.sendEachForMulticast({
        tokens: fcmTokens,
        notification: { title, body },
        data: { notificationId: notifRef.id },
      })
    } catch (e) {
      console.warn('FCM send failed:', e)
    }
  }
  const prefs = await db.collection('userPreferences').doc(targetUserId).get()
  const emailEnabled = prefs.data()?.notificationsEmail !== false
  if (emailEnabled && POSTMARK_TOKEN) {
    const userSnap = await admin.auth().getUser(targetUserId)
    const email = userSnap.email
    if (email) {
      await sendEmail(email, title, `<p>${body.replace(/\n/g, '<br>')}</p><p>— Newphase Coaching</p>`).catch((e) => console.warn('Email notification failed:', e))
    }
  }
  return { success: true, notificationId: notifRef.id }
})

/** On new message, notify the recipient. */
export const onNewMessage = functions.firestore
  .document('messages/{threadId}/items/{messageId}')
  .onCreate(async (snap, context) => {
    const data = snap.data()
    const senderId = data?.senderId
    const threadId = context.params.threadId
    const threadSnap = await db.collection('messageThreads').doc(threadId).get()
    const thread = threadSnap.data()
    const clientId = thread?.clientId
    const trainerId = thread?.trainerId
    const recipientId = senderId === clientId ? trainerId : clientId
    if (!recipientId || recipientId === senderId) return
    const prefs = await db.collection('userPreferences').doc(recipientId).get()
    const inApp = prefs.data()?.notificationsInApp !== false
    if (!inApp) return
    const senderSnap = senderId ? await db.collection('users').doc(senderId).get() : null
    const senderName = senderSnap?.data()?.displayName ?? 'Someone'
    const title = 'New message'
    const text = data?.text ?? ''
    const body = `${senderName}: ${text.slice(0, 80)}${text.length > 80 ? '...' : ''}`
    await db.collection('notifications').add({
      userId: recipientId,
      title,
      body,
      type: 'message',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
      data: { threadId },
    })
    const pushPrefs = prefs.data()?.notificationsPush
    if (pushPrefs !== false) {
      await sendPushToUser(recipientId, title, body).catch(() => {})
    }
  })

function getPlanRecipientIds(after: Record<string, unknown>): string[] {
  const updated = after?.updatedForClientIds as string[] | undefined
  if (updated?.length) return updated
  const ids = after?.clientIds as string[] | undefined
  if (ids?.length) return ids
  const single = after?.clientId as string | undefined
  if (single) return [single]
  return []
}

/** Client: Your Meals have been updated/assigned. */
export const onMealPlanChanged = functions.firestore
  .document('mealPlanVersions/{versionId}')
  .onWrite(async (change) => {
    const after = change.after.exists ? (change.after.data() as Record<string, unknown>) : null
    if (!after || !POSTMARK_TOKEN) return
    const ids = getPlanRecipientIds(after)
    const before = change.before.exists ? (change.before.data() as Record<string, unknown>) : {}
    const isNew = !change.before.exists
    const changesHtml = isNew ? 'A new meal plan has been assigned to you.' : formatChanges(before as Record<string, unknown>, after as Record<string, unknown>)
    const html = `
      <h2>Your Meals Have Been ${isNew ? 'Assigned' : 'Updated'}</h2>
      <p>Your coach has ${isNew ? 'assigned' : 'updated'} your meal plan.</p>
      <p><strong>Changes made:</strong></p>
      <p>${changesHtml}</p>
      <p>Log in to the app to view your full meal plan.</p>
      <p>— Newphase Coaching</p>
    `
    for (const clientId of ids) {
      await sendIfEmailEnabledByClientId(clientId, `Your Meals Have Been ${isNew ? 'Assigned' : 'Updated'}`, html).catch((e) => console.warn('Meal plan email failed:', e))
    }
  })

/** Client: Your Supplements have been updated/assigned. */
export const onRegimenChanged = functions.firestore
  .document('regimenVersions/{versionId}')
  .onWrite(async (change) => {
    const after = change.after.exists ? (change.after.data() as Record<string, unknown>) : null
    if (!after || !POSTMARK_TOKEN) return
    const ids = getPlanRecipientIds(after)
    const before = change.before.exists ? (change.before.data() as Record<string, unknown>) : {}
    const isNew = !change.before.exists
    const changesHtml = isNew ? 'A new supplement regimen has been assigned to you.' : formatChanges(before as Record<string, unknown>, after as Record<string, unknown>)
    const html = `
      <h2>Your Supplements Have Been ${isNew ? 'Assigned' : 'Updated'}</h2>
      <p>Your coach has ${isNew ? 'assigned' : 'updated'} your supplement regimen.</p>
      <p><strong>Changes made:</strong></p>
      <p>${changesHtml}</p>
      <p>Log in to the app to view your full regimen.</p>
      <p>— Newphase Coaching</p>
    `
    for (const clientId of ids) {
      await sendIfEmailEnabledByClientId(clientId, `Your Supplements Have Been ${isNew ? 'Assigned' : 'Updated'}`, html).catch((e) => console.warn('Regimen email failed:', e))
    }
  })

/** Client: Your Training Program has been updated/assigned. */
export const onWorkoutPlanChanged = functions.firestore
  .document('workoutPlanVersions/{versionId}')
  .onWrite(async (change) => {
    const after = change.after.exists ? (change.after.data() as Record<string, unknown>) : null
    if (!after || !POSTMARK_TOKEN) return
    const ids = getPlanRecipientIds(after)
    const before = change.before.exists ? (change.before.data() as Record<string, unknown>) : {}
    const isNew = !change.before.exists
    const changesHtml = isNew ? 'A new training program has been assigned to you.' : formatChanges(before as Record<string, unknown>, after as Record<string, unknown>)
    const html = `
      <h2>Your Training Program Has Been ${isNew ? 'Assigned' : 'Updated'}</h2>
      <p>Your coach has ${isNew ? 'assigned' : 'updated'} your workout plan.</p>
      <p><strong>Changes made:</strong></p>
      <p>${changesHtml}</p>
      <p>Log in to the app to view your full training program.</p>
      <p>— Newphase Coaching</p>
    `
    for (const clientId of ids) {
      await sendIfEmailEnabledByClientId(clientId, `Your Training Program Has Been ${isNew ? 'Assigned' : 'Updated'}`, html).catch((e) => console.warn('Workout plan email failed:', e))
    }
  })

/** Trainers: Client X has completed Daily/Weekly check-in. */
export const onCheckinSubmitted = functions.firestore
  .document('checkins/{checkinId}')
  .onWrite(async (change) => {
    const data = change.after.exists ? change.after.data() : null
    if (!data) return
    const status = data?.status as string
    if (status !== 'pending_review') return
    const prevStatus = change.before.exists ? (change.before.data()?.status as string) : null
    if (prevStatus === 'pending_review') return
    const clientId = data?.clientId as string
    const templateId = data?.templateId as string
    if (!clientId || !POSTMARK_TOKEN) return
    const templateSnap = await db.collection('checkinTemplates').doc(templateId).get()
    const template = templateSnap.data() as { name?: string; frequency?: string } | undefined
    const frequency = template?.frequency ?? 'check-in'
    const freqLabel = frequency === 'daily' ? 'Daily' : frequency === 'weekly' ? 'Weekly' : ''
    let clientName = 'A client'
    const byId = await db.collection('clients').doc(clientId).get()
    if (byId.exists) {
      const d = byId.data()
      clientName = (d?.displayName as string) ?? (d?.email as string) ?? clientName
    } else {
      const byUid = await db.collection('clients').where('uid', '==', clientId).limit(1).get()
      if (!byUid.empty) {
        const d = byUid.docs[0].data()
        clientName = (d?.displayName as string) ?? (d?.email as string) ?? clientName
      }
    }
    const subject = `${clientName} has completed ${freqLabel || 'their'} check-in`
    const html = `
      <h2>${subject}</h2>
      <p>${clientName} has submitted their ${frequency} check-in and it is ready for review.</p>
      <p>Log in to the app to review.</p>
      <p>— Newphase Coaching</p>
    `
    const trainerEmails = await getTrainerEmails()
    for (const email of trainerEmails) {
      await sendEmail(email, subject, html).catch((e) => console.warn('Check-in notification email failed:', e))
    }
    const trainerIds = await getTrainerUserIds()
    for (const uid of trainerIds) {
      const prefs = await db.collection('userPreferences').doc(uid).get()
      if (prefs.data()?.notificationsPush !== false) {
        await sendPushToUser(uid, subject, `${clientName} has submitted their ${frequency} check-in.`).catch(() => {})
      }
    }
  })

async function sendPushToUser(userId: string, title: string, body: string, data?: Record<string, string>) {
  const tokensSnap = await db.collection('fcmTokens').doc(userId).collection('tokens').get()
  const tokens = tokensSnap.docs.map((d) => d.data().token).filter(Boolean)
  if (tokens.length === 0) return
  try {
    await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: data ?? {},
    })
  } catch (e) {
    console.warn('FCM send failed:', e)
  }
}

/** Habit logging reminder - daily 8pm UTC */
export const habitReminderScheduled = functions.pubsub
  .schedule('0 20 * * *')
  .timeZone('UTC')
  .onRun(async () => {
    const today = new Date().toISOString().slice(0, 10)
    const clientsSnap = await db.collection('clients').get()
    for (const clientDoc of clientsSnap.docs) {
      const clientId = clientDoc.id
      const uid = clientDoc.data()?.uid ?? clientId
      const prefs = await db.collection('userPreferences').doc(uid).get()
      if (prefs.data()?.habitReminder === false) continue
      const entrySnap = await db.collection('productivityEntries')
        .where('clientId', '==', clientId)
        .where('date', '==', today)
        .limit(1)
        .get()
      if (!entrySnap.empty) continue
      await db.collection('notifications').add({
        userId: uid,
        title: 'Time to log your habits',
        body: "Don't forget to log your daily habits and productivity!",
        type: 'habit_reminder',
        data: { screen: '/productivity' },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        read: false,
      })
      await sendPushToUser(uid, 'Time to log your habits', "Don't forget to log your daily habits!")
    }
    return null
  })

/** Water logging reminder - 12pm and 6pm UTC */
export const waterReminderScheduled = functions.pubsub
  .schedule('0 12,18 * * *')
  .timeZone('UTC')
  .onRun(async () => {
    const clientsSnap = await db.collection('clients').get()
    for (const clientDoc of clientsSnap.docs) {
      const clientId = clientDoc.id
      const uid = clientDoc.data()?.uid ?? clientId
      const prefs = await db.collection('userPreferences').doc(uid).get()
      if (prefs.data()?.waterReminder === false) continue
      await db.collection('notifications').add({
        userId: uid,
        title: 'Stay hydrated!',
        body: "Remember to log your water intake.",
        type: 'water_reminder',
        data: { screen: '/water' },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        read: false,
      })
      await sendPushToUser(uid, 'Stay hydrated!', 'Remember to log your water intake.')
    }
    return null
  })

/** Weekly recap reminder - Friday 6pm UTC */
export const weeklyRecapReminderScheduled = functions.pubsub
  .schedule('0 18 * * 5')
  .timeZone('UTC')
  .onRun(async () => {
    const clientsSnap = await db.collection('clients').get()
    for (const clientDoc of clientsSnap.docs) {
      const clientId = clientDoc.id
      const uid = clientDoc.data()?.uid ?? clientId
      const prefs = await db.collection('userPreferences').doc(uid).get()
      if (prefs.data()?.weeklyRecapReminder === false) continue
      await db.collection('notifications').add({
        userId: uid,
        title: 'Weekly recap',
        body: "Time to submit your weekly recap for your trainer.",
        type: 'weekly_recap',
        data: { screen: '/clients/' + clientId },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        read: false,
      })
      await sendPushToUser(uid, 'Weekly recap', 'Time to submit your weekly recap for your trainer.')
    }
    return null
  })

/** Calendar event reminders - run every 5 minutes */
export const calendarReminderScheduled = functions.pubsub
  .schedule('*/5 * * * *')
  .timeZone('UTC')
  .onRun(async () => {
    const now = new Date()
    const in25 = new Date(now.getTime() + 25 * 60 * 1000)
    const snap = await db.collection('calendarEvents')
      .where('startTime', '>=', now.toISOString())
      .where('startTime', '<=', in25.toISOString())
      .get()
    for (const doc of snap.docs) {
      const data = doc.data()
      if (data.reminderSentAt) continue
      const reminderMins = data.reminderMinutes ?? 15
      const start = new Date(data.startTime)
      const minsUntil = (start.getTime() - now.getTime()) / (60 * 1000)
      if (minsUntil > reminderMins + 2 || minsUntil < reminderMins - 2) continue
      const clientId = data.clientId
      const clientSnap = await db.collection('clients').doc(clientId).get()
      const uid = clientSnap.exists ? (clientSnap.data()?.uid ?? clientId) : clientId
      const prefs = await db.collection('userPreferences').doc(uid).get()
      if (prefs.data()?.scheduleReminders === false) continue
      const title = data.title || 'Upcoming event'
      const body = `Reminder: ${title} in ${Math.round(minsUntil)} minutes`
      await db.collection('notifications').add({
        userId: uid,
        title: 'Upcoming: ' + title,
        body,
        type: 'schedule_reminder',
        data: { screen: '/productivity', eventId: doc.id },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        read: false,
      })
      await sendPushToUser(uid, 'Upcoming: ' + title, body).catch(() => {})
      await doc.ref.update({ reminderSentAt: admin.firestore.FieldValue.serverTimestamp() })
    }
    return null
  })

/** Client: Your Check-in is late. (scheduled daily) */
export const checkinReminderScheduled = functions.pubsub
  .schedule('0 9 * * *')
  .timeZone('UTC')
  .onRun(async () => {
    if (!POSTMARK_TOKEN) return null
    const today = new Date().toISOString().slice(0, 10)
    const clientsSnap = await db.collection('clients').get()
    for (const clientDoc of clientsSnap.docs) {
      const clientId = clientDoc.id
      const checkinSnap = await db.collection('checkins')
        .where('clientId', '==', clientId)
        .where('date', '==', today)
        .limit(1)
        .get()
      if (!checkinSnap.empty) continue
      const prefs = await db.collection('userPreferences').doc(clientId).get()
      if (prefs.data()?.emailCheckinReminders === false) continue
      const html = `
        <h2>Your Check-in Is Late</h2>
        <p>This is a reminder that your daily check-in has not been submitted yet.</p>
        <p>Log in to the app to complete your check-in.</p>
        <p>— Newphase Coaching</p>
      `
      await sendIfEmailEnabled(clientId, 'Your Check-in Is Late', html).catch((e) => console.warn('Check-in reminder failed:', e))
    }
    return null
  })
