# WaterDem 3D Home View — Design

**Status:** Approved (design), 2026-07-07

## Goal

Let users see and care for their plants inside a cozy, low-poly isometric
"home" — a doll-house-cutaway interior in the spirit of Ricardo Oliva Alonso's
Three.js rooms. Users choose up to 2 of 5 living spaces; plants live in those
rooms; tapping a plant highlights it, shows its status, and opens the existing
detail sheet (where watering happens). Must work on mobile.

## Constraints & decisions

- **Procedural, not imported assets.** The reference rooms are hand-modeled
  Blender GLBs hosted externally — not reusable (IP, external host, the app's
  self-contained/CSP posture). We recreate the *aesthetic* (warm key light,
  soft shadows, open-wall cutaway, simple furniture) from primitive geometry
  in react-three-fiber. This is also the mobile-friendly choice: low poly,
  no big downloads, fully controllable.
- **Toggleable, opt-in.** The garden keeps its grid; a Grid ↔ Home toggle
  switches views. Grid stays the default so no one is forced into WebGL.
- **Reuse, don't duplicate.** The 3D view reuses the existing
  `PlantDetailSheet`, watering API, weather factor, and `computeCountdown`
  status. It is another *view* over the same plant data.

## The 5 spaces

Catalog (fixed keys): `living_room`, `kitchen`, `bedroom`, `bathroom`,
`balcony`. A user picks **up to 2**. Each has a theme and a set of plant
"slots" (surface positions):

| key | label | theme props | slots |
| --- | --- | --- | --- |
| living_room | Living room | sofa, rug, coffee table, shelf, window | shelf ×2, table ×1, floor ×2 |
| kitchen | Kitchen | counter, cabinets, window | counter ×3, sill ×1 |
| bedroom | Bedroom | bed, nightstand, rug | nightstand ×1, sill ×1, floor ×2 |
| bathroom | Bathroom | tub, tiled walls, small window | tub-edge ×1, sill ×1, floor ×1 |
| balcony | Balcony | railing, outdoor floor, open sky, planters | planter ×3, floor ×2 |

Each room exposes ≥5 slots. Plants beyond a room's slot count stack onto floor
positions or a "+N more" affordance (v1: fill slots in order, hide overflow
with a small counter chip; no scroll). Slot positions are fixed local
coordinates per room.

## Data model

Migration `0004_home.sql`:

```sql
-- Up to 2 chosen spaces, ordered (first = left room in a 2-room layout).
alter table users add column if not exists home_spaces jsonb not null default '[]';
-- Which of the owner's chosen rooms this plant sits in (nullable = unplaced).
alter table plants add column if not exists room text
  check (room in ('living_room','kitchen','bedroom','bathroom','balcony'));
```

- `home_spaces` is a JSON array of 0–2 room keys, validated server-side
  (subset of the catalog, length ≤ 2, unique).
- A plant's `room` must be one of the user's current `home_spaces`; the API
  rejects assignment to a room the user hasn't chosen. When a user removes a
  space, plants in it are set back to `room = null` (unplaced) — data isn't
  lost, they just fall out of the scene until reassigned.
- Unplaced plants appear in a "Not in a room yet" tray in the Home view for
  drag-free tap-to-assign.

## API

- `PATCH /api/settings` — extend to accept `home_spaces: string[]` (≤2,
  catalog subset). Reuses the existing validated settings route.
- `PATCH /api/plants/[id]` — extend `EDITABLE` with `room` (must be null or a
  member of the owner's `home_spaces`; validated against the user row inside
  the same transaction). Watering frequency stays non-editable.
- No new endpoints; the 3D view reads plants from the existing page load and
  writes through these two.

## Components (all client-only, lazy-loaded)

```
src/components/home/
  HomeView.tsx          # dynamic() wrapper, no SSR; WebGL support check +
                        #   grid fallback; Suspense loading state
  HomeScene.tsx         # <Canvas>: camera, lights, contact shadows, controls
  rooms/
    RoomShell.tsx       # floor + two cutaway walls + window cutout, themed
    LivingRoom.tsx kitchen/Kitchen.tsx ... Balcony.tsx  # furniture per room
    slots.ts            # slot coordinate tables per room key
  Plant3D.tsx           # a potted plant mesh: pot + foliage; status-driven
                        #   droop/desaturate; idle sway; hover/tap handlers
  PlantLabel.tsx        # drei <Html> name + status chip on hover/selection
  SpacePicker.tsx       # choose up to 2 rooms (glass UI, reused in settings)
  UnplacedTray.tsx      # tap-to-assign plants with no room
src/lib/home.ts         # room catalog, labels, slot capacity, key validation
```

- `HomeView` is imported into `GardenClient` behind the Grid↔Home toggle via
  `next/dynamic(() => import(...), { ssr: false })`, so Three.js never touches
  the server bundle and only downloads when the user opens Home.
- `GardenClient` owns plant state; it passes plants + handlers (water, open
  detail, assign room) down. The detail sheet and toast already live there and
  are reused unchanged.

## Rendering & performance (mobile-first)

- Single `<Canvas>`; `dpr={[1, 1.75]}` (capped); `frameloop="demand"` so it
  only renders on interaction/animation ticks, not a constant RAF.
- Lighting: one `directionalLight` (soft shadow) + `ambientLight` +
  `hemisphereLight` for warmth. `ContactShadows` from drei rather than full
  shadow maps on mobile.
- Geometry: shared low-poly pot/leaf geometries; reuse materials; instancing
  not needed at v1 plant counts (≤ ~12 visible).
- No postprocessing on mobile; optional subtle vignette on desktop only.
- Idle sway + water/droop animations gated on `prefers-reduced-motion`
  (frozen when reduced).
- `OrbitControls` (drei): rotate + pinch-zoom, damped, with polar-angle and
  zoom clamps so users can't flip under the floor or zoom to infinity. Pan
  disabled.
- WebGL capability check in `HomeView`; if unsupported, show a friendly card
  and keep the grid. Canvas wrapped in an error boundary that falls back to
  the grid on any Three.js runtime error.

## Interaction detail

- Hover (desktop) / tap (touch): raycast via R3F `onPointerOver` / `onClick`
  on the plant group → set `hoveredId` / `selectedId`. Hovered plant lifts
  slightly + emissive rim; `PlantLabel` shows name + `computeCountdown` label.
- Tap opens `PlantDetailSheet` (existing) for that plant — Water Now, details,
  history, everything already there. Watering through the sheet updates plant
  state; the 3D plant perks up + plays a droplet burst.
- Status → appearance, from `computeCountdown(last_watered, freq, weatherFactor)`:
  - `ok` — upright, full green, tiny sway.
  - `soon` — slight droop, faint amber tint on the status ring.
  - `overdue` — visible droop + desaturated foliage + red status ring.
- A small floating status ring/dot under each plant mirrors the grid's
  WaterArc colors (never color alone — the label carries text too).

## Onboarding / empty states

- No spaces chosen yet → Home view shows `SpacePicker` centered ("Pick up to
  two rooms for your plants").
- Spaces chosen but a plant unplaced → it appears in `UnplacedTray`; tapping
  it shows a room chooser.
- No plants at all → the existing teaching empty state (reuse), plus the room
  preview so the house still feels alive.

## Testing / verification

- Unit: `home.ts` catalog/validation (≤2, subset, unique); slot capacity.
- API: `home_spaces` validation (rejects 3, rejects unknown key, dedupes);
  plant `room` rejects a room not in the user's spaces; removing a space nulls
  its plants' `room`.
- Browser (preview): toggle Grid↔Home renders a canvas; pick 2 rooms; a plant
  appears on a slot; tap opens the detail sheet; water → perk-up; overdue plant
  droops; reduced-motion freezes animation; mobile viewport (resize) still
  interactive; WebGL-off fallback shows the grid.
- Build: `next build` green; the Three.js bundle is in a lazy chunk, not the
  shared/first-load JS.

## Out of scope (v1)

- Free-form drag placement (slots are preset).
- More than 2 rooms, custom room creation, furniture customization.
- Bundled/imported GLB assets (possible later swap if richer fidelity wanted).
- Multiplayer / viewing someone else's home in 3D (public garden stays 2D).
