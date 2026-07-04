# WaterDem

A collaborative houseplant care app: snap a photo, the AI botanist identifies
the species and writes a care plan, and each plant shows a live countdown to
its next watering. Local weather nudges the advice — hot or dry days mean
water sooner. Open your garden to the public or invite friends by handle to
view (read-only) the plants you choose to share.

Built with Next.js 15 (App Router), Tailwind CSS v4, Supabase (Postgres +
Storage + Row Level Security), OpenAI (gpt-4o vision), open-meteo, Lucide
icons and Framer Motion. Design: botanical tactile glassmorphism over a
living forest gradient.

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
- **Weather:** open-meteo, keyless. On networks that block it (some corporate
  firewalls) the app degrades gracefully to non-weather-adjusted countdowns.
- **Fonts:** Fraunces + Inter are self-hosted from npm (`@fontsource-variable/*`)
  because Google Fonts was unreachable at build time on the original machine.
- `/dev/glass` is an internal showcase page for auditing the glass design
  system — not linked from the app.
