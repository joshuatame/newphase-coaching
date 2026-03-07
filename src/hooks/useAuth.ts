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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setInviteError(null)
      setNeedsOnboarding(false)
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
          if (!clientData?.onboardingComplete) {
            setNeedsOnboarding(true)
          }
        } else if (profileData?.role === 'trainer' || profileData?.role === 'admin') {
          if (!(profileData as UserProfile & { onboardingComplete?: boolean }).onboardingComplete) {
            setNeedsOnboarding(true)
          }
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
    const profileDoc = await getDoc(doc(db, 'users', user.uid))
    const profileData = profileDoc.exists() ? (profileDoc.data() as UserProfile) : null
    setProfile(profileData)
    if (profileData?.role === 'client') {
      const clientDoc = await getDoc(doc(db, 'clients', user.uid))
      const clientData = clientDoc.data()
      setNeedsOnboarding(!clientData?.onboardingComplete)
    } else {
      setNeedsOnboarding(!(profileData as UserProfile & { onboardingComplete?: boolean }).onboardingComplete)
    }
  }

  return { user, profile, loading, inviteError, needsOnboarding, refetch }
}
