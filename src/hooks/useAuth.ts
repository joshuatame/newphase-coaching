import { useState, useEffect } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { auth, db, functions } from '@/lib/firebase'
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
          try {
            const checkInvite = httpsCallable<unknown, { allowed: boolean }>(functions, 'checkInviteStatus')
            const result = await checkInvite()
            if (!result.data?.allowed) {
              await signOut(auth)
              setInviteError('Platform is invite only. Your email is not on the list.')
              setUser(null)
              setProfile(null)
              setLoading(false)
              return
            }
          } catch (err) {
            console.error('Invite check failed:', err)
            await signOut(auth)
            setInviteError('Unable to verify access. Please try again.')
            setUser(null)
            setProfile(null)
            setLoading(false)
            return
          }
        }
        const profileDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
        const profileData = profileDoc.exists() ? (profileDoc.data() as UserProfile) : null
        setProfile(profileData)
        setUser(firebaseUser)

        if (profileData?.role === 'client') {
          const clientDoc = await getDoc(doc(db, 'clients', firebaseUser.uid))
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
