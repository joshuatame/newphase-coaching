import { useState, useEffect } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import type { UserProfile } from '@/types'

export function useAuth() {
  const [user, setUser] = useState(auth.currentUser)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  /** True when user has a client record and must complete client onboarding (used for dual trainer+client). */
  const [needsClientOnboarding, setNeedsClientOnboarding] = useState(false)
  /** True when trainer/admin must complete trainer onboarding. */
  const [needsTrainerOnboarding, setNeedsTrainerOnboarding] = useState(false)
  /** True when a client doc exists for this user (trainer who is also a client). */
  const [hasClientDoc, setHasClientDoc] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setInviteError(null)
      setNeedsOnboarding(false)
      setNeedsClientOnboarding(false)
      setNeedsTrainerOnboarding(false)
      setHasClientDoc(false)
      if (firebaseUser) {
        if (firebaseUser.email) {
          const checkInvite = async (): Promise<boolean> => {
            const email = firebaseUser!.email!.toLowerCase()
            const docId = email.replace(/\./g, '_')
            const inviteDoc = await getDoc(doc(db, 'allowedEmails', docId))
            return inviteDoc.exists()
          }
          try {
            await firebaseUser.getIdToken(false)
            const allowed = await checkInvite()
            if (!allowed) {
              await signOut(auth)
              setInviteError('Platform is invite only. Your email is not on the list.')
              setUser(null)
              setProfile(null)
              setLoading(false)
              return
            }
          } catch (err) {
            const isPermissionDenied =
              err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'permission-denied'
            if (isPermissionDenied) {
              await new Promise((r) => setTimeout(r, 400))
              try {
                const allowed = await checkInvite()
                if (!allowed) {
                  await signOut(auth)
                  setInviteError('Platform is invite only. Your email is not on the list.')
                  setUser(null)
                  setProfile(null)
                  setLoading(false)
                  return
                }
              } catch (retryErr) {
                console.error('Invite check failed (retry):', retryErr)
                await signOut(auth)
                setInviteError('Unable to verify access. Please try again.')
                setUser(null)
                setProfile(null)
                setLoading(false)
                return
              }
            } else {
              console.error('Invite check failed:', err)
              await signOut(auth)
              setInviteError('Unable to verify access. Please try again.')
              setUser(null)
              setProfile(null)
              setLoading(false)
              return
            }
          }
        }
        const [profileDoc, clientDoc] = await Promise.all([
          getDoc(doc(db, 'users', firebaseUser.uid)),
          getDoc(doc(db, 'clients', firebaseUser.uid)),
        ])
        const profileData = profileDoc.exists() ? (profileDoc.data() as UserProfile) : null
        setProfile(profileData)
        setUser(firebaseUser)

        if (profileData?.role === 'client') {
          const clientData = clientDoc.data()
          const needClient = !clientData?.onboardingComplete
          setNeedsClientOnboarding(needClient)
          setNeedsTrainerOnboarding(false)
          setNeedsOnboarding(needClient)
          setHasClientDoc(clientDoc.exists())
        } else if (profileData?.role === 'trainer' || profileData?.role === 'admin') {
          const hasClientDocVal = clientDoc.exists()
          const clientData = clientDoc.data()
          const needClient = hasClientDocVal && !clientData?.onboardingComplete
          const needTrainer = !(profileData as UserProfile & { onboardingComplete?: boolean }).onboardingComplete
          setNeedsClientOnboarding(needClient)
          setNeedsTrainerOnboarding(needTrainer)
          setNeedsOnboarding(needClient || needTrainer)
          setHasClientDoc(hasClientDocVal)
        }
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const refetch = async () => {
    if (!user) return
    const [profileDoc, clientDoc] = await Promise.all([
      getDoc(doc(db, 'users', user.uid)),
      getDoc(doc(db, 'clients', user.uid)),
    ])
    const profileData = profileDoc.exists() ? (profileDoc.data() as UserProfile) : null
    setProfile(profileData)
    if (profileData?.role === 'client') {
      const clientData = clientDoc.data()
      const needClient = !clientData?.onboardingComplete
      setNeedsClientOnboarding(needClient)
      setNeedsTrainerOnboarding(false)
      setNeedsOnboarding(needClient)
      setHasClientDoc(clientDoc.exists())
    } else if (profileData?.role === 'trainer' || profileData?.role === 'admin') {
      const hasClientDocVal = clientDoc.exists()
      const clientData = clientDoc.data()
      const needClient = hasClientDocVal && !clientData?.onboardingComplete
      const needTrainer = !(profileData as UserProfile & { onboardingComplete?: boolean }).onboardingComplete
      setNeedsClientOnboarding(needClient)
      setNeedsTrainerOnboarding(needTrainer)
      setNeedsOnboarding(needClient || needTrainer)
      setHasClientDoc(hasClientDocVal)
    } else {
      setNeedsClientOnboarding(false)
      setNeedsTrainerOnboarding(false)
      setNeedsOnboarding(false)
      setHasClientDoc(false)
    }
  }

  const isDualRole = (profile?.role === 'trainer' || profile?.role === 'admin') && hasClientDoc

  return { user, profile, loading, inviteError, needsOnboarding, needsClientOnboarding, needsTrainerOnboarding, hasClientDoc, isDualRole, refetch }
}
