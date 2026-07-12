"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * Signature splash: an underwater rustic living room full of clay houseplants
 * (a generated backdrop), with the WaterDem wordmark and "Put water pon dem
 * tings" revealing in the open water, plus a few rising bubbles for life. Plays
 * once per browser session, skipped under prefers-reduced-motion, and dismissed
 * on tap or after a short hold.
 */

const WORD = "WaterDem";
const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export default function SplashSeedling() {
  const reduceMotion = useReducedMotion();
  const [show, setShow] = useState(false);

  const bubbles = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 4 + Math.random() * 11,
        dur: 6 + Math.random() * 6,
        delay: Math.random() * 5,
      })),
    [],
  );

  useEffect(() => {
    if (reduceMotion) return;
    if (sessionStorage.getItem("waterdem:splashed")) return;
    sessionStorage.setItem("waterdem:splashed", "1");
    setShow(true);
    const t = setTimeout(() => setShow(false), 5200);
    return () => clearTimeout(t);
  }, [reduceMotion]);

  if (reduceMotion) return null;

  const revealBase = 0.5;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="splash"
          aria-hidden
          onClick={() => setShow(false)}
          className="fixed inset-0 z-50 cursor-pointer overflow-hidden bg-[#14636b]"
          exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeOut" } }}
        >
          {/* the underwater living-room backdrop (portrait on mobile, wide on
              desktop — see .splash-bg in globals.css) */}
          <motion.div
            className="splash-bg absolute inset-[-2%] bg-cover"
            style={{ backgroundPosition: "center 46%" }}
            initial={{ scale: 1.04 }}
            animate={{ scale: 1.09, x: "-1%", y: "-1.2%" }}
            transition={{ duration: 20, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
          />

          {/* readability lift behind the mark */}
          <div
            className="absolute left-1/2 top-[19%] -translate-x-1/2 -translate-y-1/2"
            style={{
              width: "min(120vw, 760px)",
              height: "34vh",
              background:
                "radial-gradient(closest-side, rgba(6,46,52,0.34), rgba(6,46,52,0) 72%)",
            }}
          />

          {/* rising bubbles */}
          {bubbles.map((b) => (
            <motion.span
              key={b.id}
              className="pointer-events-none absolute rounded-full"
              style={{
                left: `${b.left}%`,
                bottom: "-8%",
                width: b.size,
                height: b.size,
                background:
                  "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.9), rgba(220,250,255,0.28) 42%, transparent 70%)",
                boxShadow: "inset 0 0 4px rgba(255,255,255,0.5)",
              }}
              initial={{ y: 0, opacity: 0 }}
              animate={{ y: "-112vh", opacity: [0, 0.8, 0.8, 0] }}
              transition={{
                duration: b.dur,
                delay: b.delay,
                repeat: Infinity,
                ease: "easeIn",
                times: [0, 0.12, 0.82, 1],
              }}
            />
          ))}

          {/* wordmark + tagline in the open water */}
          <div className="pointer-events-none absolute inset-x-0 top-[12%] flex flex-col items-center gap-3.5">
            <div
              className="relative flex whitespace-nowrap font-display font-medium leading-none text-[#f5fffb]"
              style={{
                fontSize: "clamp(46px, 13vw, 96px)",
                textShadow:
                  "0 1px 1px rgba(2,30,34,0.4), 0 6px 26px rgba(2,40,46,0.55), 0 0 34px rgba(175,240,255,0.6)",
              }}
            >
              {WORD.split("").map((c, i) => (
                <motion.span
                  key={i}
                  className="inline-block"
                  initial={{ opacity: 0, y: "0.5em", filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ delay: revealBase + i * 0.07, duration: 0.7, ease: EASE_OUT }}
                >
                  {c}
                </motion.span>
              ))}
              {/* leaf accent */}
              <motion.svg
                viewBox="0 0 40 60"
                className="absolute"
                style={{ top: "-0.30em", right: "-0.36em", width: "0.5em", height: "0.6em", transformOrigin: "28% 82%" }}
                initial={{ opacity: 0, scale: 0, rotate: -26 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: revealBase + WORD.length * 0.07 + 0.25, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              >
                <defs>
                  <linearGradient id="splashAcc" x1="0" y1="0" x2="0.4" y2="1">
                    <stop offset="0" stopColor="#2e7d32" />
                    <stop offset="1" stopColor="#7ee06a" />
                  </linearGradient>
                </defs>
                <path fill="url(#splashAcc)" d="M20 2 C 35 15, 36 42, 20 58 C 4 42, 5 15, 20 2 Z" />
                <path
                  fill="none"
                  stroke="rgba(255,255,255,0.7)"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  d="M20 8 L 20 52 M20 22 L 30 16 M20 22 L 10 16 M20 36 L 30 31 M20 36 L 10 31"
                />
              </motion.svg>
            </div>

            <motion.div
              className="font-semibold uppercase text-[#eafffb]"
              style={{
                fontSize: "clamp(12px, 3.4vw, 17px)",
                letterSpacing: "0.30em",
                paddingLeft: "0.30em",
                textShadow: "0 1px 12px rgba(2,36,40,0.7)",
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: revealBase + WORD.length * 0.07 + 0.5, duration: 0.8, ease: EASE_OUT }}
            >
              Put water pon dem tings
            </motion.div>
          </div>

          <motion.div
            className="pointer-events-none absolute inset-x-0 bottom-[calc(2.5rem+env(safe-area-inset-bottom))] text-center text-[11px] uppercase tracking-[0.22em] text-[rgba(240,255,252,0.8)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.85 }}
            transition={{ delay: 2.6, duration: 0.8 }}
          >
            tap to enter
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
