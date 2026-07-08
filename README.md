# WaterDem

A collaborative houseplant care app: snap a photo, the AI botanist identifies
the species and writes a care plan, and each plant shows a live countdown to
its next watering. Local weather nudges the advice — hot or dry days mean
water sooner. Open your garden to the public or invite friends by handle to
view (read-only) the plants you choose to share.

There are two ways to see your plants: a **grid** and a **3D home** — a cozy
low-poly house (react-three-fiber) where you pick up to two rooms, place plants
in them, and tap a plant to care for it. Plants droop when overdue and perk up
when watered.

Built with Next.js 15 (App Router), Tailwind CSS v4, Supabase (Postgres +
Storage + Row Level Security), OpenAI (gpt-4o vision), open-meteo,
react-three-fiber/three, Lucide icons and Framer Motion. Design: botanical
tactile glassmorphism over a living forest gradient.

## The 3D home view

A Grid ↔ Home toggle on the garden. The Three.js bundle is lazy-loaded
(`next/dynamic`, `ssr:false`) so it only downloads when the Home view opens —
the grid's first-load JS is unchanged. Rooms and furniture are procedural
low-poly geometry in a soft "claymation" style (a shared clay palette in
`src/lib/clay.ts`: fresh green plants, two-tone teal/terracotta pots, warm
rustic wood and cream), with procedural wood/tile floor textures and daylight
windows (painted on-canvas, no network assets); the plants themselves are real
textured 3D models (see Credits) re-materialled to the clay look. The camera
orbits and pinch-zooms. `frameloop="always"` gives plants continuous micro-motion
when motion is allowed and `"demand"` under reduced-motion; it falls back to the
grid when WebGL is unavailable or a render error occurs.

The plant models live in a single web-optimized GLB (`public/models/plants.glb`,
~3.6 MB — WebP textures, leaf alpha cutout, ground removed) built from the
source FBX pack; `src/lib/plantModels.ts` maps each user plant to the closest
species model. The session splash (`components/fx/SplashSeedling.tsx`) is a
generated "underwater rustic living room" backdrop
(`public/splash/underwater-living-room.webp`) over which the WaterDem wordmark
and tagline reveal, with a few rising bubbles — a lightweight DOM/Framer-Motion
splash (no WebGL), shown once per session and skipped under reduced-motion.

Data: `users.home_spaces` (≤2 room keys) and `plants.room` (migration
`0004_home.sql`). The 5 rooms are living room, kitchen, bedroom, bathroom,
balcony. Note: `next dev`/`next build` run on webpack (not Turbopack) for
react-three-fiber compatibility.

## Credits

The 3D plant models are from **"Tropical Plants Pack M02P" by MozzarellaARC**,
licensed **CC BY 4.0** (<https://creativecommons.org/licenses/by/4.0/>). The
pack was converted from FBX to a web-optimized GLB (textures downscaled to WebP,
leaf alpha preserved) for this app. Attribution is also surfaced in-app on the
Settings screen.

## Running locally

```bash
npm install
npm run dev        # http://localhost:3000
```

`.env.local` holds all secrets (never committed):

| Variable | What it is |
| --- | --- |
| `DATABASE_URL` | Postgres pooler URL connecting as the **`waterdem_app`** role (RLS-enforced) |
| `SUPABASE_URL` | The Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service key, server-only, used for Storage uploads |
| `SESSION_SECRET` | HS256 signing secret for the session cookie |
| `OPENAI_API_KEY` | **Paste your key here** — AI identify/advice returns a friendly 503 until set; manual plant entry always works |

## Database

The live project is `WaterDem` (`vbazkronykqwdffmydpd`, region `ap-southeast-1`).
Schema and policies live in `supabase/migrations/`:

- `0001_init.sql` — tables (`users`, `plants`, `water_logs`, `garden_shares`),
  indexes, and RLS policies. Identity comes from a per-transaction
  `app.current_user_id` setting (custom nickname/password auth — **not**
  Supabase Auth). All tables use `FORCE ROW LEVEL SECURITY`.
- `0002_app_role.sql` — the `waterdem_app` role. Supabase's `postgres` role
  has `BYPASSRLS`, so the app must connect as this role for the policies to
  bind. The migration creates it `NOLOGIN`; on a fresh environment enable it
  out-of-band (never commit the password):

  ```sql
  alter role waterdem_app login password '<generated>';
  ```

Apply migrations with `npx supabase db push` (project is linked). Storage
uses a public `plant-photos` bucket (5 MB limit, image mime types only).

Visibility model (enforced in RLS, verified by a 13-check matrix test):

| Actor | Sees | Edits |
| --- | --- | --- |
| Owner | all their plants | everything |
| Invited viewer | owner's `is_public` plants | nothing |
| Public (if `garden_is_public`) | owner's `is_public` plants | nothing |
| Stranger | nothing | nothing |

## Deployment

Production runs on Vercel: **https://waterdem.vercel.app** (project
`waterdem`, functions pinned to `sin1` next to the database via
`vercel.json`). Source of truth is https://github.com/pmtchakanyuka-star/WaterDem.

- Deploy: `npx vercel deploy --prod` (Git auto-deploys aren't wired up —
  the Vercel account has no GitHub login connection yet; add one under
  vercel.com → Account Settings → Login Connections, then
  `npx vercel git connect` to deploy on every push).
- Env vars (`DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
  `SESSION_SECRET`) are set for Production and Preview. `OPENAI_API_KEY`
  must be added (dashboard → Settings → Environment Variables, or
  `npx vercel env add OPENAI_API_KEY production`) for AI identify/advice.
- The login rate limiter is per-function-instance on serverless — fine for
  an MVP; swap to Upstash Redis if it ever needs to be global.

## Notes

- **AI provider:** OpenAI `gpt-4o` (user choice; the original brief specified
  Anthropic). Everything provider-specific is isolated in `src/lib/ai.ts`.
- **Watering frequency is AI-owned.** Users never set it: the botanist sets
  the base days at identification (from species + the plant's spot), and the
  countdown adapts to the week via the open-meteo 7-day forecast
  (`weeklyOutlook` — hot/dry weeks shorten the interval, e.g. 7 days → ~5).
  A failed photo upload never blocks identification (`photoSaved: false`).
- **Weather:** open-meteo, keyless; degrades gracefully to the base schedule
  when unreachable or no location is set.
- **Fonts:** Fraunces + Inter are self-hosted from npm (`@fontsource-variable/*`).
- **Local dev on this machine:** Avast antivirus MITMs HTTPS with its own
  root cert, which Node doesn't trust — `NODE_EXTRA_CA_CERTS` must point to
  `C:\Users\pchakanyuka\.avast-root-ca.pem` (set as a user env var and in
  `.claude/launch.json`). Without it, storage uploads/weather/fonts fail
  with `UNABLE_TO_VERIFY_LEAF_SIGNATURE`.
- `/dev/glass` is an internal showcase page for auditing the glass design
  system — not linked from the app.
