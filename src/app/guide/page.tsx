import Link from "next/link";
import {
  ArrowLeft,
  Droplets,
  FlaskConical,
  Leaf,
  PawPrint,
  Sun,
  Wind,
} from "lucide-react";
import GlassCard from "@/components/glass/GlassCard";

export const metadata = {
  title: "Care basics — WaterDem",
  description:
    "A short, plain-language guide to keeping houseplants healthy: nutrition, watering, light, humidity, and pet safety.",
};

/**
 * Care basics reference. Content is drawn from university extension services
 * (Iowa State, Penn State, Clemson, University of Maryland, Michigan State,
 * UNH, Nebraska), the RHS, and ASPCA toxicity data. Kept deliberately short —
 * enough to help, not enough to overwhelm.
 */

const NUTRIENTS = [
  {
    letter: "N",
    name: "Nitrogen",
    role: "Drives green, leafy growth.",
    short: "the leaf-maker",
    deficiency: "Pale or yellowing older leaves and slow, thin growth.",
  },
  {
    letter: "P",
    name: "Phosphorus",
    role: "Builds roots and fuels flowers.",
    short: "roots & blooms",
    deficiency: "Stunted growth with a purplish tint on older leaves.",
  },
  {
    letter: "K",
    name: "Potassium",
    role: "Overall hardiness and flowering.",
    short: "toughness",
    deficiency: "Browning that starts at the edges of mature leaves.",
  },
];

export default function GuidePage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-8 sm:px-8">
      <header className="flex items-center gap-3">
        <Link href="/" aria-label="Back to your garden">
          <span className="glass glass-interactive inline-flex size-9 items-center justify-center rounded-full text-leaf-2nd">
            <ArrowLeft className="size-4" aria-hidden />
          </span>
        </Link>
        <h1 className="font-display text-3xl text-leaf-100">Care basics</h1>
      </header>
      <p className="text-sm text-leaf-2nd">
        A short field guide to keeping your plants happy. Everything here is
        drawn from horticultural extension services and the RHS — the essentials,
        nothing overwhelming.
      </p>
      <p className="text-xs text-leaf-mut">
        New to the app?{" "}
        <Link href="/how-it-works" className="text-sage hover:underline">
          How WaterDem works →
        </Link>
      </p>

      {/* Nutrition */}
      <section id="nutrition" className="scroll-mt-6">
        <GlassCard className="flex flex-col gap-4">
          <h2 className="font-display flex items-center gap-2 text-xl text-leaf-100">
            <FlaskConical className="size-5 text-sage" aria-hidden />
            Feeding &amp; nutrients
          </h2>
          <p className="text-sm text-leaf-2nd">
            Plant food is labelled with three numbers — <strong>N-P-K</strong> —
            the three nutrients plants need most. Here&apos;s what each does and
            the sign your plant is short on it:
          </p>

          <div className="flex flex-col gap-3">
            {NUTRIENTS.map((n) => (
              <div
                key={n.letter}
                className="flex gap-3.5 rounded-xl border border-glass-edge bg-[rgba(255,255,255,0.04)] p-3.5"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[rgba(110,231,168,0.25)] bg-[rgba(110,231,168,0.10)]">
                  <span className="font-display text-lg text-sage">
                    {n.letter}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-leaf-100">
                    <span className="font-medium">{n.name}</span>{" "}
                    <span className="text-leaf-mut">— {n.short}</span>
                  </p>
                  <p className="text-sm text-leaf-2nd">{n.role}</p>
                  <p className="mt-0.5 text-xs text-leaf-mut">
                    Running low: {n.deficiency}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-[rgba(110,231,168,0.18)] bg-[rgba(110,231,168,0.05)] p-4 text-sm text-leaf-2nd">
            <p className="font-medium text-leaf-100">How to feed, simply</p>
            <ul className="mt-2 flex flex-col gap-1.5">
              <li className="flex gap-2">
                <Leaf className="mt-0.5 size-3.5 shrink-0 text-sage" aria-hidden />
                Feed a balanced fertiliser at <strong>half strength</strong>,
                roughly monthly, in spring and summer — houseplants grow slower
                than the outdoor plants the label is written for.
              </li>
              <li className="flex gap-2">
                <Leaf className="mt-0.5 size-3.5 shrink-0 text-sage" aria-hidden />
                <span>
                  <strong>Stop over winter.</strong> Most plants rest when light
                  is low and can&apos;t use the food — it just builds up as salt.
                </span>
              </li>
              <li className="flex gap-2">
                <Leaf className="mt-0.5 size-3.5 shrink-0 text-sage" aria-hidden />
                <span>
                  <strong>Don&apos;t feed</strong> a plant that&apos;s newly
                  repotted, stressed, or bone-dry. Fresh potting mix already
                  has food, and fertiliser on dry roots burns them.
                </span>
              </li>
            </ul>
          </div>

          <p className="text-xs text-leaf-mut">
            <strong className="text-leaf-2nd">The #1 mistake is overfeeding.</strong>{" "}
            A white crust on the soil and brown leaf tips mean too much
            fertiliser, not too little. The fix: flush the pot slowly with plain
            water (about three pot-volumes) and let it drain fully.
          </p>
        </GlassCard>
      </section>

      {/* Watering */}
      <GlassCard className="flex flex-col gap-3">
        <h2 className="font-display flex items-center gap-2 text-xl text-leaf-100">
          <Droplets className="size-5 text-sage" aria-hidden />
          Watering
        </h2>
        <p className="text-sm text-leaf-2nd">
          <strong>Overwatering kills more houseplants than underwatering.</strong>{" "}
          Soggy soil suffocates and rots the roots — and the first sign, wilting
          lower leaves, looks exactly like thirst, so people water more and make
          it worse.
        </p>
        <ul className="flex flex-col gap-1.5 text-sm text-leaf-2nd">
          <li>
            <strong>Check before you pour.</strong> Feel the soil about two
            finger-joints deep — water only if it&apos;s dry there (succulents
            want the whole pot nearly dry).
          </li>
          <li>
            <strong>Never let a pot sit in water.</strong> Water until it drains
            from the bottom, then empty the saucer.
          </li>
          <li>
            <strong>Ease off in winter.</strong> Shorter days mean slower growth
            and much less thirst — the same schedule that works in summer will
            drown a plant in January.
          </li>
          <li>
            Yellow, mushy leaves point to <em>over</em>watering; brown, crispy
            edges point to thirst or dry air.
          </li>
        </ul>
      </GlassCard>

      {/* Light */}
      <GlassCard className="flex flex-col gap-3">
        <h2 className="font-display flex items-center gap-2 text-xl text-leaf-100">
          <Sun className="size-5 text-warn" aria-hidden />
          Light
        </h2>
        <ul className="flex flex-col gap-1.5 text-sm text-leaf-2nd">
          <li>
            <strong>Bright indirect</strong> — the sweet spot for most plants —
            is light strong enough to cast a soft shadow, but with no direct sun
            on the leaves.
          </li>
          <li>
            Light fades fast from a window: a spot a few feet back can be a
            fraction as bright. Even &ldquo;low-light&rdquo; plants struggle
            more than 5–6 feet from glass.
          </li>
          <li>
            Stretched, leggy stems reaching toward the window mean{" "}
            <em>too little</em> light. Pale, bleached, papery patches mean{" "}
            <em>too much</em> — move it back.
          </li>
        </ul>
      </GlassCard>

      {/* Humidity */}
      <GlassCard className="flex flex-col gap-3">
        <h2 className="font-display flex items-center gap-2 text-xl text-leaf-100">
          <Wind className="size-5 text-leaf-mut" aria-hidden />
          Humidity
        </h2>
        <ul className="flex flex-col gap-1.5 text-sm text-leaf-2nd">
          <li>
            Most tropicals like <strong>40–60%</strong> humidity; homes run
            drier, especially with winter heating. Cacti and succulents prefer
            dry air and need no help.
          </li>
          <li>
            Brown, crispy leaf tips on a tropical are often dry air, not thirst.
          </li>
          <li>
            <strong>Misting barely works</strong> — the moisture evaporates in
            minutes. Grouping plants together or using a pebble tray (pot resting
            above a shallow tray of water) genuinely raises local humidity; a
            small humidifier is best of all.
          </li>
        </ul>
      </GlassCard>

      {/* Pet safety */}
      <GlassCard className="flex flex-col gap-3">
        <h2 className="font-display flex items-center gap-2 text-xl text-leaf-100">
          <PawPrint className="size-5 text-sage" aria-hidden />
          Pets
        </h2>
        <p className="text-sm text-leaf-2nd">
          Many popular houseplants are toxic to cats and dogs if chewed —
          Monstera, pothos, philodendron, peace lily, aloe, snake plant and
          dracaena among them. Most cause mouth irritation or an upset stomach
          rather than anything worse, but it&apos;s worth knowing. Each plant in
          your garden shows a pet-safety badge from the botanist. Calathea and
          spider plants are among the genuinely pet-safe options.
        </p>
        <p className="text-xs text-leaf-mut">
          Toxicity information from the ASPCA Animal Poison Control Center. If a
          pet eats part of a plant and seems unwell, call your vet.
        </p>
      </GlassCard>

      <p className="pb-4 text-center text-xs text-leaf-mut">
        Sources: Iowa State, Penn State, Clemson, University of Maryland,
        Michigan State, UNH &amp; Nebraska Extension services; the RHS; and the
        ASPCA.
      </p>
    </main>
  );
}
