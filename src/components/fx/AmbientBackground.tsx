"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Leaf } from "lucide-react";

/**
 * Fixed full-viewport atmosphere layer: large soft green radial blobs drifting
 * slowly plus faint leaf silhouettes. Sits behind all content (z-0); the app
 * renders in a z-10 sibling so glass translucency has something to reveal.
 * Frozen when the user prefers reduced motion.
 */

type Blob = {
  size: number;
  x: string;
  y: string;
  color: string;
  dx: number;
  dy: number;
  duration: number;
};

const BLOBS: Blob[] = [
  { size: 620, x: "8%", y: "-6%", color: "rgba(38, 99, 55, 0.34)", dx: 60, dy: 40, duration: 46 },
  { size: 540, x: "62%", y: "12%", color: "rgba(24, 82, 46, 0.30)", dx: -70, dy: 55, duration: 58 },
  { size: 480, x: "28%", y: "58%", color: "rgba(52, 120, 70, 0.22)", dx: 55, dy: -60, duration: 52 },
  { size: 700, x: "74%", y: "64%", color: "rgba(18, 64, 34, 0.36)", dx: -50, dy: -45, duration: 64 },
  { size: 380, x: "-6%", y: "72%", color: "rgba(64, 140, 84, 0.16)", dx: 45, dy: 35, duration: 40 },
];

type Silhouette = {
  size: number;
  x: string;
  y: string;
  rotate: number;
  drift: number;
  duration: number;
};

const LEAVES: Silhouette[] = [
  { size: 180, x: "78%", y: "8%", rotate: -24, drift: 26, duration: 70 },
  { size: 140, x: "6%", y: "38%", rotate: 38, drift: -20, duration: 84 },
  { size: 220, x: "48%", y: "78%", rotate: 12, drift: 22, duration: 96 },
];

export default function AmbientBackground() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-0 overflow-hidden"
      style={{ contain: "strict" }}
    >
      {BLOBS.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: b.size,
            height: b.size,
            left: b.x,
            top: b.y,
            background: `radial-gradient(circle at 50% 50%, ${b.color} 0%, transparent 70%)`,
            filter: "blur(40px)",
          }}
          animate={
            reduceMotion
              ? undefined
              : { x: [0, b.dx, 0], y: [0, b.dy, 0] }
          }
          transition={{
            duration: b.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {LEAVES.map((l, i) => (
        <motion.div
          key={`leaf-${i}`}
          className="absolute"
          style={{ left: l.x, top: l.y, opacity: 0.1, rotate: l.rotate }}
          animate={reduceMotion ? undefined : { y: [0, l.drift, 0] }}
          transition={{
            duration: l.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Leaf
            size={l.size}
            strokeWidth={0.8}
            color="#9fd6ac"
            fill="rgba(159, 214, 172, 0.25)"
          />
        </motion.div>
      ))}
    </div>
  );
}
