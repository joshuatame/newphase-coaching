# Feature Audit vs Full Spec

Review of requested features against current implementation.

## ✅ Implemented

### PWA
- Installable (manifest, service worker)
- Offline caching (service worker precache)
- App shell architecture

### Roles & Access
- Admin, Trainer, Client roles
- Trainers share access to all clients
- Clients see only their own data
- Role-based Firebase rules

### Display Names
- Clients and trainers show display names (not IDs)
- Fallback to email, then short ID

### Chat / Messaging
- Real-time trainer-client chat
- Role pill beside name (Admin/Trainer/Client)
- Display name + email (smaller) for clients
- Reply to messages
- Like messages
- Comment on messages
- Thread list with display names

### Nutrition
- Food items with full macro fields
- Alpha sort
- Modal detail view
- Cache-first fast loads

### Training
- Exercises with category, target muscles, equipment
- Alpha sort within body parts
- Modal detail view
- Cache-first fast loads

### Supplementation
- Supplement catalog with half-life
- Alpha sort, deduplication
- Modal detail view
- Cache-first fast loads

### Check-ins
- Admin-configurable templates (CRUD in Admin)
- Question types: text, number, scale, yes/no, multi-select, photo, video
- Daily and weekly frequency
- Templates displayed on Check-ins page

### Post-Session Survey (How did you feel after training)
- Admin-configurable survey templates (CRUD in Admin)
- Question builder
- Stored in `sessionSurveyTemplates`
- Seed includes default "Post-workout feedback" template

### UI / Theme
- VertexGuard-style dark theme
- Grey-black gradient
- Purple accents
- Rounded corners

### Loading / Performance
- Spinner instead of "Loading..." text
- "Not found" instead of "Run npm run seed"
- Firestore persistence (IndexedDB)
- Cache-first reads for catalogs
- 24h stale time for food/exercises/supplements
- Prefetch on dashboard load

### Modals
- Food, exercise, supplement detail in dialogs
- Solid overlay, click outside to close

---

## ⚠️ Partially Implemented / Needs Integration

### Check-ins – client submission
- Templates exist and are manageable
- Client form to fill in answers and submit check-ins: **needs implementation**
- Trainer review workflow: **basic structure only**

### Post-session survey – client flow
- Templates exist and are manageable in Admin
- Workout completion → show survey form: **needs integration in WorkoutPlayerPage**
- Store answers in `workoutSessionSurveys`: **collection exists, UI flow needed**

### Workout Player
- Basic set logging exists
- Rest timer, tempo cues, full session flow: **incomplete**
- Session completion triggers post-survey: **not wired**

---

## ❌ Not Yet Implemented

### PWA (full)
- Background sync
- Offline-first for key features beyond catalogs

### Notifications (full)
- Push (FCM) – infra exists, flow incomplete
- In-app notification center
- Real-time popup toasts
- Email via Cloud Functions (Postmark/SendGrid)
- Per-user configuration

### History & Versioning
- Versioned plans with effective dates
- Audit trail
- Apply changes forward only

### Client Management (full)
- All profile fields (goals, injuries, timezone, units, etc.)
- Versioning of client data

### Meal Plans
- Versioned meal plans
- Per-client meal allocation
- Client meal logging

### Workout Plans
- Versioned workout plans
- Full workout programming
- Client workout logging

### AI / Prediction
- OpenAI integration
- Workout/meal plan generation
- 1RM estimation (Epley, Brzycki)
- Forecast graphs (strength, bodyweight, calories, volume)

### Regimen
- Full cycle/regimen builder
- Client compliance tracking
- Reminders

### Check-ins (full)
- Media feedback (trainer screen+face recording)
- Full trainer review UI

### Live Workout Player (full)
- Step-by-step per exercise/set
- Rest timer with controls
- Tempo guidance (visual + audible)
- Session completion flow

### Session Comparisons
- Compare this workout to last occurrence
- Per-exercise and per-session metrics

### Client History & Analytics
- Unified timeline
- Filter by exercise, muscle, date
- Forecast charts
- 1RM trends

### Group Forums
- Trainer-created forums
- Threads and comments
- Moderation

### Trainer Productivity
- Tasks, reminders, calendar
- Dashboard with pending items

---

## Summary

| Category           | Status        |
|--------------------|---------------|
| Admin form management | ✅ Complete   |
| Chat with all features | ✅ Complete   |
| Display names      | ✅ Complete   |
| Catalogs (fast load) | ✅ Complete  |
| Theme              | ✅ Complete   |
| Check-in templates | ✅ Admin CRUD |
| Post-session survey | ✅ Admin CRUD |
| Client form flows  | ⚠️ Partial    |
| Workout player     | ⚠️ Partial    |
| Plans, AI, analytics | ❌ Not started |
| Full notifications | ❌ Not started |
