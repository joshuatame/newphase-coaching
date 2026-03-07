import { useState, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useMyClientId } from '@/hooks/useMyClientId'
import { db, storage } from '@/lib/firebase'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { updatePassword, updateProfile, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Key, Bell, EnvelopeSimple, UserCircle, Camera, CalendarBlank } from '@phosphor-icons/react'
import { buildCalendarIcs, downloadIcs } from '@/lib/calendar-export'
import type { CalendarExportInput } from '@/lib/calendar-export'

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
  const myClientId = useMyClientId()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [calendarDays, setCalendarDays] = useState(14)
  const [calendarStart, setCalendarStart] = useState(() => new Date().toISOString().slice(0, 10))

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

  const { data: clientDoc } = useQuery({
    queryKey: ['client', myClientId],
    queryFn: async () => {
      if (!myClientId) return null
      const snap = await getDoc(doc(db, 'clients', myClientId))
      return snap.exists() ? { id: snap.id, ...snap.data() } : null
    },
    enabled: !!myClientId,
  })

  const { data: mealPlans = [] } = useQuery({
    queryKey: ['mealPlanVersions'],
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, 'mealPlanVersions'), orderBy('createdAt', 'desc')))
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    },
    enabled: !!myClientId,
  })

  const { data: workoutPlans = [] } = useQuery({
    queryKey: ['workoutPlanVersions'],
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, 'workoutPlanVersions'), orderBy('createdAt', 'desc')))
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    },
    enabled: !!myClientId,
  })

  const { data: regimens = [] } = useQuery({
    queryKey: ['regimenVersions'],
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, 'regimenVersions'), orderBy('createdAt', 'desc')))
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    },
    enabled: !!myClientId,
  })

  const myMealPlan = mealPlans.find((p) => (p as { clientIds?: string[] }).clientIds?.includes(myClientId ?? ''))
  const myWorkoutPlan = workoutPlans.find((p) => (p as { clientIds?: string[] }).clientIds?.includes(myClientId ?? ''))
  const myRegimen = regimens.find((p) => (p as { clientIds?: string[] }).clientIds?.includes(myClientId ?? ''))

  const handleExportCalendar = () => {
    const client = clientDoc as Record<string, unknown> | null
    if (!client) {
      setMessage({ type: 'error', text: 'Client profile not found. Complete onboarding first.' })
      return
    }
    const ics = buildCalendarIcs({
      client: {
        customMealSlots: client.customMealSlots as { label: string; time: string }[] | undefined,
        preferredMealTimes: client.preferredMealTimes as string[] | undefined,
        preferredTrainingTime: (client.preferredTrainingTime as string) ?? undefined,
        supplementTimes: client.supplementTimes as { morning?: string; afternoon?: string; night?: string } | undefined,
        timezone: (client.timezone as string) ?? undefined,
      },
      mealPlan: myMealPlan as CalendarExportInput['mealPlan'],
      workoutPlan: myWorkoutPlan as CalendarExportInput['workoutPlan'],
      regimen: myRegimen as CalendarExportInput['regimen'],
      startDate: new Date(calendarStart),
      numDays: Math.min(90, Math.max(1, calendarDays)),
    })
    const filename = `newphase-schedule-${calendarStart}-${calendarDays}d.ics`
    downloadIcs(ics, filename)
    setMessage({ type: 'success', text: `Downloaded ${filename}. Add it to Gmail or Outlook.` })
  }

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

      {myClientId && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <CalendarBlank className="h-5 w-5 text-primary" weight="duotone" />
            Calendar sync (Gmail &amp; Outlook)
          </h2>
          <p className="text-sm text-muted-foreground">
            Export your schedule as an ICS file: meals (with foods), training (workout details), and supplements (time, compound, quantity).
            Add the file to Google Calendar or Outlook to get reminders.
          </p>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <Label htmlFor="calStart" className="text-xs">Start date</Label>
              <Input
                id="calStart"
                type="date"
                value={calendarStart}
                onChange={(e) => setCalendarStart(e.target.value)}
                className="mt-1 w-[140px]"
              />
            </div>
            <div>
              <Label htmlFor="calDays" className="text-xs">Days to export (1–90)</Label>
              <Input
                id="calDays"
                type="number"
                min={1}
                max={90}
                value={calendarDays}
                onChange={(e) => setCalendarDays(Math.min(90, Math.max(1, parseInt(e.target.value, 10) || 7)))}
                className="mt-1 w-[80px]"
              />
            </div>
            <Button onClick={handleExportCalendar}>
              Download ICS file
            </Button>
          </div>
          <div className="text-sm text-muted-foreground space-y-2 pt-2 border-t border-border">
            <p><strong>Google Calendar:</strong> Open Google Calendar → Settings → Import &amp; export → Select file → choose the downloaded .ics file.</p>
            <p><strong>Outlook:</strong> Outlook Calendar → Add calendar → From file → choose the downloaded .ics file.</p>
          </div>
        </div>
      )}
    </div>
  )
}
