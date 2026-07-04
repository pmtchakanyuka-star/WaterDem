"use client";

import { motion, useReducedMotion } from "framer-motion";
import { computeCountdown } from "@/lib/countdown";

/**
 * The app's signature UI: a thin bar that visibly depletes toward the next
 * watering, day count in the display face, 6px status dot. Status colors
 * appear ONLY here — 1px bar + dot, low-opacity track (brief §2).
 */

const BAR: Record<string, string> = {
  ok: "#4ADE80",
  soon: "#FBBF24",
  overdue: "#F87171",
};

const TRACK: Record<string, string> = {
  ok: "rgba(74,222,128,0.12)",
  soon: "rgba(251,191,36,0.12)",
  overdue: "rgba(248,113,113,0.12)",
};

export default function WaterArc({
  lastWatered,
  waterFreqDays,
  weatherFactor = 1,
  compact = false,
}: {
  lastWatered: string | null;
  waterFreqDays: number;
  weatherFactor?: number;
  compact?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const cd = computeCountdown(lastWatered, waterFreqDays, weatherFactor);

  return (
    <div className="flex w-full flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span
          className={`font-display text-leaf-100 ${compact ? "text-sm" : "text-base"}`}
        >
          {cd.label}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs text-leaf-mut">
          <span
            className="inline-block size-1.5 rounded-full"
            style={{ background: BAR[cd.status] }}
            aria-hidden
          />
          {cd.status === "ok"
            ? "happy"
            : cd.status === "soon"
              ? "thirsty soon"
              : "thirsty!"}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(cd.remainingRatio * 100)}
        aria-label={`Water in ${cd.label}`}
        className="h-px w-full overflow-hidden rounded-full"
        style={{ background: TRACK[cd.status] }}
      >
        <motion.div
          className="h-full"
          style={{ background: BAR[cd.status] }}
          initial={false}
          animate={{ width: `${cd.remainingRatio * 100}%` }}
          transition={
            reduceMotion ? { duration: 0 } : { duration: 0.35, ease: "easeOut" }
          }
        />
      </div>
    </div>
  );
}
