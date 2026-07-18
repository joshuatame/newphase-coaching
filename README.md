# NewPhase Coaching

Premium, dark-cinematic marketing site + admin CMS for **NewPhase Coaching** — a personalised online coaching brand. Built with Next.js App Router, TypeScript, Tailwind CSS 4 and a scroll-driven 3D dumbbell (React Three Fiber + GSAP).

## Stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS 4**
- **React Three Fiber** + **@react-three/drei** + **three** (procedural 3D dumbbell)
- **GSAP** + **ScrollTrigger** (scroll-driven animation)
- Static-export compatible (`output: "export"`)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy `.env.example` to `.env.local` and adjust if needed:

```bash
NEXT_PUBLIC_API_URL=https://api.tame-dynamics.com/api/v1
```

## Scripts

| Script                 | Description                                             |
| ---------------------- | ------------------------------------------------------- |
| `npm run dev`          | Local dev server                                        |
| `npm run build`        | Standard Next.js build                                  |
| `npm run build:static` | Static export to `./out` under `/clients/newphase-coaching` |
| `npm run start`        | Serve the production build                               |
| `npm run lint`         | Lint                                                    |

## Static export

`npm run build:static` sets:

```
NP_STATIC_EXPORT=true
NEXT_PUBLIC_BASE_PATH=/clients/newphase-coaching
NEXT_PUBLIC_API_URL=https://api.tame-dynamics.com/api/v1
```

Output lands in `./out`, ready to deploy under `https://<host>/clients/newphase-coaching`. `basePath`, `assetPrefix`, `trailingSlash` and `images.unoptimized` are configured in `next.config.ts`.

## Data / API

All content is fetched at runtime (client-side) from the Tame Dynamics API, scoped with the `X-Tame-App-Slug: newphase-coaching` header. When the API is empty or unavailable, pages fall back to brand-safe placeholder content and professional empty states (no fake testimonials).

- Public fetchers + admin CRUD live in `lib/api/newphase.ts`.
- Low-level client + auth-token handling in `lib/api/client.ts` (token stored in `localStorage` under `np_admin_token`).

## Admin

`/admin/login/` → dashboard and full CRUD for clients, testimonials, packages, content/FAQs, enquiries and site settings. Admin routes are client-guarded by the presence of an auth token and excluded from indexing.

## Project structure

```
app/
  (site)/         Public site (Nav + Footer + 3D background)
    page.tsx      Homepage (cinematic scroll story)
    clients/      Client transformations (filters + modal + before/after)
    testimonials/ Testimonials grid
    packages/     Packages + comparison matrix + FAQ
    apply/        Application form
  admin/          Admin CMS (login, dashboard, CRUD)
  robots.ts / sitemap.ts
components/
  3d/             Dumbbell, DumbbellScene, ScrollDumbbell
  layout/         Nav, Footer
  sections/       Homepage sections
  ui/             Button, PackageCard, BeforeAfterSlider, etc.
  admin/          AdminShell + admin UI primitives
lib/              base-path, api client, hooks, fallbacks
types/            Entity types
```

## Accessibility

Semantic HTML, visible focus states, keyboard-operable before/after slider, labelled form fields, skip-to-content link, and a static fallback for the 3D scene when `prefers-reduced-motion` is set.

---

Built by **Tame Dynamics**.
