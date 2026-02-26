import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

admin.initializeApp()

export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  await admin.firestore().collection('users').doc(user.uid).set({
    uid: user.uid,
    email: user.email ?? '',
    displayName: user.displayName ?? '',
    role: 'client',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
})

export const checkInviteStatus = functions.https.onCall(async (_data, context) => {
  if (!context.auth?.email) {
    return { allowed: false }
  }
  const email = context.auth.email.toLowerCase()
  const snap = await admin.firestore()
    .collection('allowedEmails')
    .where('email', '==', email)
    .limit(1)
    .get()
  return { allowed: !snap.empty }
})
