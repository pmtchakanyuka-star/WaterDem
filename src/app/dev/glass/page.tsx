"use client";

import GlassCard from "@/components/glass/GlassCard";
import GlassButton from "@/components/glass/GlassButton";
import GlassInput from "@/components/glass/GlassInput";
import { Droplet, Leaf, Sprout, Sun } from "lucide-react";

/** Internal showcase for verifying the glass system. Not linked from the app. */
export default function GlassShowcase() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-14">
      <header>
        <h1
          className="font-display text-4xl text-leaf-100"
        >
          Glass system
        </h1>
        <p className="mt-2 text-leaf-2nd">
          Frosted surfaces over the living forest — verify the lit rim, the
          translucency, and the light text.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <GlassCard>
          <h2
            className="font-display text-xl text-leaf-100"
          >
            Monstera deliciosa
          </h2>
          <p className="mt-1 text-sm text-leaf-2nd">
            Static card — primary, secondary and{" "}
            <span className="text-leaf-mut">muted</span> text.
          </p>
          <div className="mt-4 h-px w-full bg-[rgba(255,255,255,0.10)]" />
          <div className="mt-3 flex items-center gap-2 text-sm text-leaf-2nd">
            <Sun className="size-4 text-warn" aria-hidden /> bright indirect
            <Droplet className="ml-3 size-4 text-sage" aria-hidden /> every 7
            days
          </div>
        </GlassCard>

        <GlassCard interactive>
          <div className="flex items-start justify-between">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[rgba(110,231,168,0.10)] border border-[rgba(110,231,168,0.22)]">
              <Sprout className="size-6 text-sage" aria-hidden />
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs text-leaf-2nd">
              <span
                className="size-1.5 rounded-full bg-ok"
                aria-hidden
              />
              watered
            </span>
          </div>
          <h2
            className="font-display mt-3 text-xl text-leaf-100"
          >
            Interactive card
          </h2>
          <p className="mt-1 text-sm text-leaf-2nd">
            Hover: lifts 2px, border brightens.
          </p>
          {/* the signature thin progress bar, low-opacity track */}
          <div className="mt-4 h-px w-full overflow-hidden rounded-full bg-[rgba(74,222,128,0.12)]">
            <div className="h-full w-2/3 bg-ok" />
          </div>
        </GlassCard>
      </div>

      <GlassCard className="flex flex-wrap items-center gap-3">
        <GlassButton variant="primary">
          <Droplet className="size-4" aria-hidden /> Water now
        </GlassButton>
        <GlassButton variant="ghost">Cancel</GlassButton>
        <GlassButton variant="danger">Delete plant</GlassButton>
        <GlassButton variant="icon" aria-label="Plant details">
          <Leaf className="size-4" aria-hidden />
        </GlassButton>
        <GlassButton variant="primary" loading>
          Identifying…
        </GlassButton>
      </GlassCard>

      <GlassCard className="flex flex-col gap-4">
        <GlassInput
          label="Nickname"
          placeholder="e.g. fernando"
          hint="3–20 characters — this is your public handle."
        />
        <GlassInput
          label="Password"
          type="password"
          error="At least 8 characters."
          defaultValue="short"
        />
        <GlassInput
          label="Friend's handle"
          success="Found — press Invite to share your garden."
          defaultValue="mossboss"
        />
      </GlassCard>
    </main>
  );
}
