import Link from "next/link";
import {
  ArrowLeft,
  Droplets,
  HeartPulse,
  Home,
  Leaf,
  Lightbulb,
  Lock,
  Sparkles,
  Sprout,
} from "lucide-react";
import GlassCard from "@/components/glass/GlassCard";

export const metadata = {
  title: "How WaterDem works — WaterDem",
  description:
    "A friendly tour of WaterDem: adding plants, the AI botanist, weather-aware watering, growth stages, health checks, the 3D home, and sharing.",
};

/**
 * The feature tutorial — a section per feature group, in the order a new
 * gardener meets them. Static and auth-free, like /guide; the two pages
 * cross-link (this one explains the app, /guide explains the plants).
 */

/** Numbered how-to steps, shared by every section. */
function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="flex flex-col gap-2 text-sm text-leaf-2nd">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-[rgba(110,231,168,0.25)] bg-[rgba(110,231,168,0.10)] font-display text-xs text-sage">
            {i + 1}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

const PLANT_LOOK_NAMES = [
  "Monstera",
  "Fern",
  "Palm",
  "Banana",
  "Chalice 🌿",
  "Daisies 🌼",
  "Peace lily 🤍",
  "Orchid 🌸",
  "African violet 💜",
];

const POT_LOOK_NAMES = [
  "Two-tone (teal + terracotta)",
  "Terracotta",
  "Teal",
  "Rasta (red · gold · green)",
  "Sand",
];

export default function HowItWorksPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-8 sm:px-8">
      <header className="flex items-center gap-3">
        <Link href="/" aria-label="Back to your garden">
          <span className="glass glass-interactive inline-flex size-9 items-center justify-center rounded-full text-leaf-2nd">
            <ArrowLeft className="size-4" aria-hidden />
          </span>
        </Link>
        <h1 className="font-display text-3xl text-leaf-100">
          How WaterDem works
        </h1>
      </header>
      <p className="text-sm text-leaf-2nd">
        WaterDem keeps your houseplants alive with an AI botanist, a
        weather-aware watering countdown, and a little 3D home your plants live
        in. Here&apos;s the whole app, one feature at a time.
      </p>
      <p className="text-xs text-leaf-mut">
        Looking for plant-care wisdom?{" "}
        <Link href="/guide" className="text-sage hover:underline">
          Read the guide →
        </Link>
      </p>

      {/* 1 — Getting started */}
      <GlassCard className="flex flex-col gap-4">
        <h2 className="font-display flex items-center gap-2 text-xl text-leaf-100">
          <Sprout className="size-5 text-sage" aria-hidden />
          Getting started
        </h2>
        <p className="text-sm text-leaf-2nd">
          A nickname and a password — that&apos;s all it takes. No email, no
          verification. Your garden starts <strong>private</strong>: nobody can
          see it until you invite them or open it up.
        </p>
        <Steps
          items={[
            <>
              <strong>Sign up</strong> with a nickname (3–20 letters, numbers
              or underscores) and a password of at least 8 characters.
            </>,
            <>
              Tap <strong>Add a plant</strong> — the dashed card in your grid.
            </>,
            <>
              Snap or upload a <strong>photo</strong>, or just type what you
              call it and any species idea. Every detail sharpens the care
              plan.
            </>,
            <>
              Tell the botanist the light where it sits and{" "}
              <strong>how far along it is</strong> — just a seed, seedling,
              young plant, or mature.
            </>,
            <>
              Tap <strong>Identify &amp; plan care</strong>, check the review,
              and add it to your garden.
            </>,
          ]}
        />
        <p className="text-xs text-leaf-mut">
          One more thing worth doing on day one: set your location in Settings
          so watering advice can follow your weather.
        </p>
      </GlassCard>

      {/* 2 — The AI botanist */}
      <GlassCard className="flex flex-col gap-4">
        <h2 className="font-display flex items-center gap-2 text-xl text-leaf-100">
          <Sparkles className="size-5 text-sage" aria-hidden />
          The AI botanist
        </h2>
        <p className="text-sm text-leaf-2nd">
          The botanist looks at your photo (or whatever you typed), names the
          species, and writes a full care plan: care level, light and humidity
          preferences, a &ldquo;when to water&rdquo; soil check, feeding notes,
          weekly tips, fun facts, and a pet-safety badge. It also sets the
          watering frequency — that schedule is the heart of the app.
        </p>
        <Steps
          items={[
            <>
              On the review screen the botanist shows how sure it is —{" "}
              <strong>correct anything</strong> before saving. It&apos;s your
              plant; the botanist just advises.
            </>,
            <>
              No photo handy? A name like &ldquo;monstera&rdquo; or a species
              guess is enough to plan care.
            </>,
            <>
              Prefer to do it yourself? <strong>Skip the botanist</strong> adds
              the plant manually with a sensible starting schedule — you can
              always ask for a proper plan later.
            </>,
          ]}
        />
      </GlassCard>

      {/* 3 — Watering & the countdown */}
      <GlassCard className="flex flex-col gap-4">
        <h2 className="font-display flex items-center gap-2 text-xl text-leaf-100">
          <Droplets className="size-5 text-sage" aria-hidden />
          Watering &amp; the countdown
        </h2>
        <p className="text-sm text-leaf-2nd">
          Every plant carries a live countdown to its next watering. Green
          means relaxed, amber means soon, red means it&apos;s due (or
          overdue). You do exactly one thing:
        </p>
        <Steps
          items={[
            <>
              When you water a plant, tap its big <strong>water button</strong>.
              The countdown resets, the watering lands in the plant&apos;s
              history, and there&apos;s an Undo if you tapped by mistake.
            </>,
            <>
              Glance at the colours to plan your rounds — red first, amber
              next, green can wait.
            </>,
          ]}
        />
        <div className="rounded-xl border border-[rgba(110,231,168,0.18)] bg-[rgba(110,231,168,0.05)] p-4 text-sm text-leaf-2nd">
          <p className="font-medium text-leaf-100">
            Why can&apos;t I set the days myself?
          </p>
          <p className="mt-1.5">
            The schedule is the botanist&apos;s advisory, not a setting. It
            comes from the species, the plant&apos;s life stage, the light at
            its spot — and it <strong>adapts to your weather every week</strong>
            . WaterDem reads your local 7-day forecast (via open-meteo): hot or
            dry days shorten the interval, so a &ldquo;water every 7
            days&rdquo; plant might ask for water every 5 in a heatwave. A
            number you typed in couldn&apos;t do that. If the rhythm ever seems
            off, update the growth stage or tap{" "}
            <strong>Re-plan care with the botanist</strong> — it&apos;ll think
            it through again.
          </p>
        </div>
      </GlassCard>

      {/* 4 — Growing from seed */}
      <GlassCard className="flex flex-col gap-4">
        <h2 className="font-display flex items-center gap-2 text-xl text-leaf-100">
          <Leaf className="size-5 text-sage" aria-hidden />
          Growing from seed
        </h2>
        <p className="text-sm text-leaf-2nd">
          WaterDem knows plants have life stages: <strong>just a seed</strong>,{" "}
          <strong>seedling</strong>, <strong>young plant</strong>,{" "}
          <strong>mature</strong>. Seeds and seedlings drink little and often —
          nothing like the adult weekly rhythm — so the stage shapes the whole
          care plan.
        </p>
        <Steps
          items={[
            <>
              Set the stage when you add the plant (&ldquo;How far along is
              it?&rdquo;).
            </>,
            <>
              When it grows, open the plant and tap{" "}
              <strong>&ldquo;It&apos;s grown a stage 🌱&rdquo;</strong> — or
              pick any stage from the Stage menu.
            </>,
            <>
              The botanist <strong>re-plans watering automatically</strong>{" "}
              every time the stage changes. No settings to remember.
            </>,
          ]}
        />
        <p className="text-xs text-leaf-mut">
          In the 3D home, stage shows too: a seed renders as a little soil
          mound with one tiny sprout, and seedlings stay small until they grow
          up.
        </p>
      </GlassCard>

      {/* 5 — Health checks */}
      <GlassCard className="flex flex-col gap-4">
        <h2 className="font-display flex items-center gap-2 text-xl text-leaf-100">
          <HeartPulse className="size-5 text-alert" aria-hidden />
          Health checks
        </h2>
        <p className="text-sm text-leaf-2nd">
          Worried about a leaf? Every plant&apos;s page has a health check. The
          botanist sees your plant&apos;s real watering record alongside the
          photo, so the diagnosis is grounded in what actually happened.
        </p>
        <Steps
          items={[
            <>
              Open the plant and find <strong>Health check</strong>.
            </>,
            <>
              Snap or upload the worrying leaves, describe what you see
              (&ldquo;yellowing lower leaves&rdquo;), or both.
            </>,
            <>
              Tap <strong>Check with the botanist</strong>. You get a severity
              — ok, watch, or act — a plain-language diagnosis, and a few
              concrete steps to take.
            </>,
          ]}
        />
        <p className="text-sm text-leaf-2nd">
          If the photo shows your plant has grown, the botanist may suggest
          advancing its stage — one tap accepts. Past checkups stay listed on
          the plant, and there&apos;s also <strong>Ask the botanist</strong>{" "}
          for weather-aware care tips any time.
        </p>
        <p className="text-xs text-leaf-mut">
          Health checks are <strong className="text-leaf-2nd">always private</strong> —
          the photos, notes and diagnoses are yours alone, whatever you share.
        </p>
      </GlassCard>

      {/* 6 — The 3D Home */}
      <GlassCard className="flex flex-col gap-4">
        <h2 className="font-display flex items-center gap-2 text-xl text-leaf-100">
          <Home className="size-5 text-sage" aria-hidden />
          The 3D Home
        </h2>
        <p className="text-sm text-leaf-2nd">
          Flip the <strong>Grid ↔ Home</strong> toggle at the top of your
          garden and your plants move into a little clay home. It&apos;s not
          just decoration — thirsty plants droop, and a status ring under each
          pot glows green, amber or red with its countdown.
        </p>
        <Steps
          items={[
            <>
              First visit: pick up to <strong>two rooms</strong> — living room,
              kitchen, bedroom, bathroom or balcony. Change them later with the{" "}
              <strong>Rooms</strong> button.
            </>,
            <>
              One room fills the stage at a time — flip between your rooms
              with the <strong>‹ ›</strong> arrows.
            </>,
            <>
              <strong>Drag to look around, pinch (or scroll) to zoom.</strong>{" "}
              Tap any plant to open its page.
            </>,
            <>
              To place a plant, open it and choose a <strong>Room</strong>.
              Plants without a room wait in a tray under the scene.
            </>,
          ]}
        />
        <p className="text-sm text-leaf-2nd">
          Every plant also has a <strong>&ldquo;Look in your home&rdquo;</strong>{" "}
          — its avatar. Pick a plant look:{" "}
          {PLANT_LOOK_NAMES.join(", ")}. And a pot:{" "}
          {POT_LOOK_NAMES.join(", ")}. Leave both on Auto and WaterDem chooses
          from the species.
        </p>
      </GlassCard>

      {/* 7 — Sharing & privacy */}
      <GlassCard className="flex flex-col gap-4">
        <h2 className="font-display flex items-center gap-2 text-xl text-leaf-100">
          <Lock className="size-5 text-leaf-mut" aria-hidden />
          Sharing &amp; privacy
        </h2>
        <p className="text-sm text-leaf-2nd">
          Your garden is private until you say otherwise, and sharing is
          always <strong>read-only</strong> — nobody waters your plants but
          you. Two ways to open up:
        </p>
        <Steps
          items={[
            <>
              <strong>Invite a friend:</strong> Settings → Invite friends →
              type their handle. They can now see your visible plants while
              your garden stays private. Remove an invite any time.
            </>,
            <>
              <strong>Go public:</strong> flip the Garden visibility switch in
              Settings and anyone with your link —{" "}
              <span className="text-leaf-100">/g/your-nickname</span> — can
              visit.
            </>,
            <>
              Either way, <strong>each plant has its own switch</strong>:
              Shared or Private, right on its page. Private plants never show,
              whatever the garden setting says.
            </>,
          ]}
        />
        <p className="text-xs text-leaf-mut">
          Health checks — photos, notes and diagnoses — never appear to
          invitees or on your public page. They&apos;re between you and the
          botanist.
        </p>
      </GlassCard>

      {/* 8 — Tips */}
      <GlassCard className="flex flex-col gap-3">
        <h2 className="font-display flex items-center gap-2 text-xl text-leaf-100">
          <Lightbulb className="size-5 text-warn" aria-hidden />
          Little things worth knowing
        </h2>
        <ul className="flex flex-col gap-1.5 text-sm text-leaf-2nd">
          <li>
            <strong>Skip the splash.</strong> The underwater intro plays once
            per visit — tap anywhere to dive straight in.
          </li>
          <li>
            <strong>Gallery photos work too.</strong> Anywhere you can snap a
            photo you can also pick one from your library — and photos are
            downscaled on your phone before upload, so big camera files are
            never a problem.
          </li>
          <li>
            <strong>Re-plan any time.</strong> Moved a plant, repotted it, or
            just doubt the schedule? Open the plant, tap Edit, then{" "}
            <em>Re-plan care with the botanist</em> for a fresh plan.
          </li>
          <li>
            <strong>No 3D on your device?</strong> If WebGL isn&apos;t
            available the Home view bows out gracefully — the grid has
            everything you need.
          </li>
        </ul>
      </GlassCard>

      <p className="pb-4 text-center text-xs text-leaf-mut">
        Looking for plant-care wisdom?{" "}
        <Link href="/guide" className="text-sage hover:underline">
          Read the guide →
        </Link>
      </p>
    </main>
  );
}
