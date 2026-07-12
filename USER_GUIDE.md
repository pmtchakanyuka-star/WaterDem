# WaterDem — User Guide

Welcome! Someone who likes you (and likes plants) sent you here. WaterDem is a
small web app that keeps your houseplants alive with an AI botanist, a
weather-aware watering countdown, and a little 3D home your plants live in.

**Try it now: <https://waterdem.vercel.app>** — it works in any modern browser,
phone or desktop. No app store, no email address, nothing to install.

There's also an in-app version of this tour at `/how-it-works`, and a
plant-care reference (feeding, light, humidity, pet safety) at `/guide`.

---

## Quick start (5 steps)

1. Open <https://waterdem.vercel.app> and **sign up** — a nickname (3–20
   letters, numbers or underscores) and a password of at least 8 characters.
   That's the whole account.
2. In **Settings**, set your **location** (search a city or use GPS). This
   lets watering advice follow your local weather.
3. Tap **Add a plant**. Snap or upload a photo — or just type what you call it
   — say how far along it is, and tap **Identify & plan care**.
4. Review what the botanist found, correct anything, and **add it to your
   garden**.
5. When you water the plant in real life, tap its **water button** in the app.
   That's the one habit WaterDem asks of you.

---

## 1. Getting started

Accounts are deliberately simple: nickname + password. Your garden is
**private by default** — nobody can see it until you invite a friend or flip
it public (see [Sharing & privacy](#7-sharing--privacy)).

Your garden opens as a **grid** of plant cards. Each card shows the plant, its
watering countdown, and its water button. The dashed card at the end adds a
new plant. Up in the header you'll find the Grid ↔ Home view toggle, the care
guide, this tutorial, Settings, and sign-out.

## 2. The AI botanist

When you add a plant, the botanist:

- **identifies the species** from your photo (a clear shot of the leaves works
  best — JPG or PNG, camera or gallery), and
- **writes a care plan**: care level (easy / moderate / expert), light and
  humidity preferences, a "when to water" soil check, feeding notes, weekly
  tips, fun facts, and a pet-safety badge (with a note for cat and dog
  households).

No photo? A name like "monstera" or a species guess is enough. The review
screen shows how confident the botanist is — you can correct anything before
saving. And if you'd rather go without AI, **Skip the botanist** adds the
plant manually with a sensible starting schedule.

Later, from any plant's page, **Ask the botanist** gives care tips tuned to
today's weather at your location.

## 3. Watering & the countdown

Every plant carries a live countdown to its next watering:

- **Green** — relaxed, plenty of time.
- **Amber** — coming up soon.
- **Red** — due today or overdue.

Tap the **water button** when you actually water; the countdown resets and
the watering is kept in the plant's history (with an Undo, for slips).

**The schedule is the botanist's, not yours.** It's computed from the
species, the plant's life stage, and the light at its spot — and once your
location is set, it **adapts to your weather every week** using your local
7-day forecast (open-meteo). Hot days (over ~25 °C) and dry air (under ~40%
humidity) shorten the interval — in a hot, dry week a "every 7 days" plant
may ask for water every 5. The plant's page always shows this week's number
and why.

If the rhythm seems off, don't look for a settings field — there isn't one.
Update the growth stage, or tap **Re-plan care with the botanist** (under
Edit on the plant's page) and it will think the schedule through again.

## 4. Growing from seed

Plants have four life stages in WaterDem: **just a seed → seedling → young
plant → mature**. Seeds and seedlings drink little and often, nothing like
the adult weekly rhythm, so the stage shapes the whole plan.

- Set the stage when you add the plant ("How far along is it?").
- When it grows, open the plant and tap **"It's grown a stage 🌱"** — or pick
  any stage from the Stage menu.
- Every stage change makes the botanist **re-plan watering automatically**.

In the 3D home the stage shows too: a seed renders as a soil mound with one
tiny sprout, and seedlings stay small until they grow up.

## 5. Health checks

Worried about a leaf? Every plant's page has a **Health check**:

1. Snap or upload the worrying leaves, describe what you see ("yellowing
   lower leaves, brown crispy tips"), or both.
2. Tap **Check with the botanist**.
3. You get a severity — **ok / watch / act** — a plain-language diagnosis,
   and a few concrete steps.

The botanist sees the plant's real watering record alongside your photo, so
the diagnosis is grounded in what actually happened. If the photo shows
growth, it may suggest advancing the stage — one tap accepts, and watering is
re-planned. Past checkups stay listed on the plant.

**Health checks are always private.** The photos, notes and diagnoses never
appear to invited friends or on your public garden.

## 6. The 3D Home

Flip the **Grid ↔ Home** toggle at the top of your garden and your plants
move into a small clay home.

- **Rooms:** pick up to two — living room, kitchen, bedroom, bathroom or
  balcony. Change them any time with the **Rooms** button.
- **One room at a time** fills the stage; flip between your two rooms with
  the **‹ ›** arrows.
- **Drag to look around, pinch (or scroll) to zoom.** Tap a plant to open its
  page.
- **Status at a glance:** a ring under each pot glows green, amber or red
  with the watering countdown — and thirsty plants visibly droop.
- **Placing plants:** open a plant and choose its **Room**. Plants without a
  room wait in a tray under the scene.

Every plant also has an avatar — its **"Look in your home"**:

- **Plant looks:** Monstera, Fern, Palm, Banana, Chalice 🌿, Daisies 🌼,
  Peace lily 🤍, Orchid 🌸, African violet 💜.
- **Pot looks:** Two-tone (teal + terracotta), Terracotta, Teal,
  Rasta (red · gold · green), Sand.

Leave both on Auto and WaterDem picks from the species.

## 7. Sharing & privacy

Everything is private by default, and all sharing is **read-only** — nobody
waters your plants but you.

- **Invite a friend:** Settings → **Invite friends** → type their WaterDem
  handle. They can now see your visible plants while your garden stays
  private. Remove an invite any time.
- **Public garden:** flip the **Garden visibility** switch in Settings and
  anyone with your link — `https://waterdem.vercel.app/g/your-nickname` —
  can visit. There's a copy-link button right there.
- **Per-plant switch:** each plant has its own Shared / Private toggle on its
  page. Private plants never show, whatever the garden setting says.
- **Always private:** health checks — photos, notes, diagnoses — and your
  settings. Those are between you and the botanist.

## 8. Tips

- **Skip the splash:** the underwater intro plays once per visit — tap
  anywhere to dive straight in.
- **Gallery uploads:** anywhere you can snap a photo you can also pick one
  from your library.
- **Re-plan any time:** plant page → Edit → *Re-plan care with the botanist*.
- **Weather bar:** the strip under the header shows your local conditions and
  a care nudge for the week — it appears once your location is set.

---

## FAQ

**Can I change the watering days myself?**
No — and that's the point. The schedule is the botanist's advisory, built
from the species, life stage, spot, and your weekly weather. If it seems
wrong, change the growth stage or tap *Re-plan care with the botanist* on the
plant's page.

**Why did my countdown change with the weather?**
WaterDem reads your local 7-day forecast each week. Hot or dry days shorten
the watering interval (down to about 70% of the usual rhythm), because pots
dry out faster. The plant's page shows this week's adjusted number next to
the species' usual one.

**Who can see my plants and health checks?**
Nobody, until you share. Invited friends and public visitors see only plants
you've marked **Shared**, read-only. Health checks — photos, notes,
diagnoses — are never visible to anyone but you.

**What phones does it work on?**
Any modern browser — iPhone, Android, tablet, laptop. The 3D home needs
WebGL, which nearly every phone from the last several years has; without it,
the app falls back to the grid, which has everything.

**How do I put a plant in a room?**
Open the plant and pick a **Room** from its page (you'll see the choice once
you've picked rooms in the Home view). Plants without a room wait in a tray
under the 3D scene — tap one there to place it.

**What's Chalice?**
One of the nine plant looks for the 3D home — a cannabis-style plant that
comes, naturally, in the Rasta pot by default. Pick it (or any other look)
under "Look in your home" on a plant's page.

**How do I grow something from seed?**
Add the plant and answer "Just a seed" to *How far along is it?* The botanist
plans frequent, gentle watering. As it sprouts, tap **"It's grown a stage
🌱"** and the schedule matures with it — in the 3D home it starts as a tiny
sprout mound and grows.

**Why does my plant look droopy in the 3D home?**
It's thirsty! Drooping follows the watering countdown — amber droops a
little, overdue droops a lot. Water it (and tap the water button) and it
perks up.

**Do I need to water plants in the app at the exact moment I water for real?**
Close is fine. The countdown works in days, and there's an Undo on every
logged watering.

**Does WaterDem cost anything?**
No. Open the link, pick a nickname, grow things.

---

## Troubleshooting

- **Photo won't upload / seems too large** — photos are automatically
  downscaled on your device before upload, so size is almost never the real
  issue. If a photo fails, just retry, or pick a different shot.
- **"The botanist is unavailable"** — the AI service is briefly unreachable.
  Your plants and countdowns are unaffected; try again in a minute. You can
  always add a plant with *Skip the botanist* in the meantime.
- **The 3D home isn't showing** — your browser probably lacks WebGL (rare,
  but it happens in stripped-down or very old browsers). WaterDem detects
  this and offers the grid view, which has every feature except the 3D
  scene. Trying another browser usually brings the home back.
