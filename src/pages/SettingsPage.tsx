import { useState, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { db, storage } from '@/lib/firebase'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { updatePassword, updateProfile, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Key, Bell, EnvelopeSimple, UserCircle, Camera } from '@phosphor-icons/react'
export interface UserPreferences {
  notificationsPush: boolean
  notificationsEmail: boolean
  notificationsInApp: boolean
  emailCheckinReminders: boolean
  emailMessageAlerts: boolean
  habitReminder: boolean
  waterReminder: boolean
  weeklyRecapReminder: boolean
  scheduleReminders: boolean
  streakFreezeAllowance: number
}

const DEFAULT_PREFS: UserPreferences = {
  notificationsPush: true,
  notificationsEmail: true,
  notificationsInApp: true,
  emailCheckinReminders: true,
  emailMessageAlerts: true,
  habitReminder: true,
  waterReminder: true,
  weeklyRecapReminder: true,
  scheduleReminders: true,
  streakFreezeAllowance: 2,
}

export function SettingsPage() {
  const { user, profile, refetch } = useAuth()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const { data: prefs = DEFAULT_PREFS } = useQuery({
    queryKey: ['userPreferences', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return DEFAULT_PREFS
      const snap = await getDoc(doc(db, 'userPreferences', user.uid))
      return { ...DEFAULT_PREFS, ...snap.data() } as UserPreferences
    },
    enabled: !!user?.uid,
  })

  const savePrefsMutation = useMutation({
    mutationFn: async (p: Partial<UserPreferences>) => {
      if (!user?.uid) throw new Error('Not authenticated')
      await setDoc(doc(db, 'userPreferences', user.uid), p, { merge: true })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences', user?.uid] })
      setMessage({ type: 'success', text: 'Settings saved' })
    },
    onError: (e) => setMessage({ type: 'error', text: String(e) }),
  })

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' })
      return
    }
    try {
      const cred = EmailAuthProvider.credential(user!.email!, currentPassword)
      await reauthenticateWithCredential(auth.currentUser!, cred)
      await updatePassword(auth.currentUser!, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setMessage({ type: 'success', text: 'Password updated successfully' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setMessage({ type: 'error', text: msg.includes('wrong-password') ? 'Current password is incorrect' : msg })
    }
  }

  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user?.uid) throw new Error('Not authenticated')
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `users/${user.uid}/avatar.${ext}`
      const storageRef = ref(storage, path)
      await uploadBytes(storageRef, file)
      const photoURL = await getDownloadURL(storageRef)
      await updateProfile(auth.currentUser!, { photoURL })
      await setDoc(doc(db, 'users', user.uid), { photoURL }, { merge: true })
      return photoURL
    },
    onSuccess: () => {
      refetch()
      setMessage({ type: 'success', text: 'Profile photo updated' })
    },
    onError: (e) => setMessage({ type: 'error', text: String(e) }),
  })

  const photoURL = user?.photoURL ?? profile?.photoURL

  return (
    <div className="p-4 md:p-6 space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
        {message && (
          <div
            className={`mt-3 p-3 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-destructive/20 text-destructive'}`}
          >
            {message.text}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <UserCircle className="h-5 w-5 text-primary" weight="duotone" />
          Profile photo
        </h2>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f && f.type.startsWith('image/')) uploadPhotoMutation.mutate(f)
            e.target.value = ''
          }}
        />
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative flex items-center justify-center w-20 h-20 rounded-full overflow-hidden border-2 border-border bg-muted hover:bg-muted/80 transition-colors"
          >
            {photoURL ? (
              <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <UserCircle className="w-12 h-12 text-muted-foreground" weight="duotone" />
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
              <Camera className="w-8 h-8 text-white" weight="bold" />
            </span>
          </button>
          <div>
            <p className="text-sm text-muted-foreground">Tap to upload a new photo</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadPhotoMutation.isPending}
            >
              {uploadPhotoMutation.isPending ? 'Uploading…' : 'Change photo'}
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Key className="h-5 w-5 text-primary" weight="duotone" />
          Change Password
        </h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <Label htmlFor="current">Current password</Label>
            <Input
              id="current"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="new">New password</Label>
            <Input
              id="new"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="mt-1"
              required
              minLength={8}
            />
          </div>
          <div>
            <Label htmlFor="confirm">Confirm new password</Label>
            <Input
              id="confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="mt-1"
              required
            />
          </div>
          <Button type="submit">Update password</Button>
        </form>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" weight="duotone" />
          Notifications
        </h2>
        <p className="text-sm text-muted-foreground mb-3">
          Get push notifications for reminders, messages, and calendar events. Enable in your browser when prompted.
        </p>
        <div className="space-y-4">
          {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default' && (
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                const { requestNotificationPermission, registerFCMToken } = await import('@/lib/notifications')
                const perm = await requestNotificationPermission()
                if (perm === 'granted' && user?.uid) {
                  await registerFCMToken(user.uid)
                  setMessage({ type: 'success', text: 'Push notifications enabled' })
                }
              }}
            >
              Enable browser notifications
            </Button>
          )}
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm">Push notifications</span>
            <input
              type="checkbox"
              checked={prefs.notificationsPush}
              onChange={(e) => savePrefsMutation.mutate({ notificationsPush: e.target.checked })}
              className="rounded"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm">In-app notifications</span>
            <input
              type="checkbox"
              checked={prefs.notificationsInApp}
              onChange={(e) => savePrefsMutation.mutate({ notificationsInApp: e.target.checked })}
              className="rounded"
            />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <EnvelopeSimple className="h-5 w-5 text-primary" weight="duotone" />
          Email preferences
        </h2>
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm">Email notifications</span>
            <input
              type="checkbox"
              checked={prefs.notificationsEmail}
              onChange={(e) => savePrefsMutation.mutate({ notificationsEmail: e.target.checked })}
              className="rounded"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm">Check-in reminders</span>
            <input
              type="checkbox"
              checked={prefs.emailCheckinReminders}
              onChange={(e) => savePrefsMutation.mutate({ emailCheckinReminders: e.target.checked })}
              className="rounded"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm">Message alerts</span>
            <input
              type="checkbox"
              checked={prefs.emailMessageAlerts}
              onChange={(e) => savePrefsMutation.mutate({ emailMessageAlerts: e.target.checked })}
              className="rounded"
            />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">Reminders</h2>
        <p className="text-sm text-muted-foreground">Get reminded to log habits, water, and weekly recaps.</p>
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm">Habit logging (daily 8pm)</span>
            <input
              type="checkbox"
              checked={prefs.habitReminder}
              onChange={(e) => savePrefsMutation.mutate({ habitReminder: e.target.checked })}
              className="rounded"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm">Water logging (noon & 6pm)</span>
            <input
              type="checkbox"
              checked={prefs.waterReminder}
              onChange={(e) => savePrefsMutation.mutate({ waterReminder: e.target.checked })}
              className="rounded"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm">Weekly recap (Friday 6pm)</span>
            <input
              type="checkbox"
              checked={prefs.weeklyRecapReminder}
              onChange={(e) => savePrefsMutation.mutate({ weeklyRecapReminder: e.target.checked })}
              className="rounded"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm">Calendar schedule reminders</span>
            <input
              type="checkbox"
              checked={prefs.scheduleReminders}
              onChange={(e) => savePrefsMutation.mutate({ scheduleReminders: e.target.checked })}
              className="rounded"
            />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Streak freeze</h2>
        <p className="text-sm text-muted-foreground">
          Use up to {prefs.streakFreezeAllowance ?? 2} &quot;grace days&quot; per month to protect your productivity streak when life gets busy.
        </p>
        <div className="flex items-center gap-4">
          <label className="text-sm">Allowance per month</label>
          <input
            type="number"
            min="0"
            max="7"
            value={prefs.streakFreezeAllowance ?? 2}
            onChange={(e) => savePrefsMutation.mutate({
              streakFreezeAllowance: Math.min(7, Math.max(0, parseInt(e.target.value, 10) || 0))
            })}
            className="w-20 rounded border border-border bg-background px-2 py-1 text-sm"
          />
        </div>
      </div>
    </div>
  )
}
