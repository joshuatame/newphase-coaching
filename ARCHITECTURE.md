# Newphase Coaching - Architecture Overview

## Tech Stack

### Frontend
- **React 18** + **Vite** + **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** (Radix primitives)
- **React Router v7**
- **TanStack Query** (data fetching/caching)
- **Zod** (validation)
- **date-fns** (dates)
- **Recharts** (graphs)

### Backend
- **Firebase Auth** (authentication)
- **Firestore** (database)
- **Cloud Functions** (TypeScript)
- **Cloud Storage** (media)
- **Firebase Cloud Messaging** (web push)

### PWA
- Installable on mobile and desktop
- Service worker with Workbox
- Offline-first caching for key assets

## Roles & Access

| Role    | Access |
|---------|--------|
| Admin   | Full platform control |
| Trainer | All clients, full features, add clients |
| Client  | Own data only |

- Trainers share access to ALL clients
- All trainer actions visible to other trainers with attribution
- Strict Firestore Security Rules enforce RBAC

## Data Model (Firestore)

```
users/{uid}
clients/{clientId}
foodItems/{foodId}
exercises/{exerciseId}
supplementCatalog/{itemId}
mealPlanVersions/{versionId}
workoutPlanVersions/{versionId}
regimenVersions/{versionId}
logsMeals/{logId}
logsWorkouts/{logId}
logsRegimen/{logId}
workoutSessions/{sessionId}
checkinTemplates/{templateId}
checkins/{checkinId}
feedback/{feedbackId}
messages/{threadId}/items/{messageId}
forums/{forumId}/threads/{threadId}/posts/{postId}
tasks/{taskId}
notifications/{notificationId}
fcmTokens/{uid}/tokens/{tokenId}
```

## Versioning & History

- Past data **never changes**
- Versioned plans (meal, workout, regimen)
- Effective start/end dates
- Future-dated changes supported
- Full audit trail of edits

## Folder Structure

```
src/
├── components/
│   ├── ui/          # shadcn/Radix components
│   └── layout/      # Sidebar, DashboardLayout
├── hooks/           # useAuth, etc.
├── lib/             # firebase, utils
├── pages/           # Route pages
├── types/           # TypeScript interfaces
├── App.tsx
├── main.tsx
└── index.css

functions/           # Cloud Functions
scripts/             # Seed scripts
```

## Login Design

- **Background**: Lightning/electric blue image
- **Modal**: Black (#000000), centered
- **Logo**: NP diamond logo top-center of modal
- **Title**: "NEWPHASE COACHING" above modal (Anton font, italic, white)

## Seed Data

Run to populate:
- `npm run seed:foods` - 50+ food items with macros
- `npm run seed:exercises` - 25+ exercises with videos
- `npm run seed:supplements` - 30+ supplements/hormones/peptides

Requires `.env` with `VITE_FIREBASE_*` and Firebase Auth (admin/trainer) for client-side seeds, or use Firebase Admin with service account.
