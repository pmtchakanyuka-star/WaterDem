"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * Signature splash: a seedling grows — stem draws upward (SVG pathLength),
 * two leaves unfurl from the tip — over the forest gradient, then the app
 * is revealed. Plays once per browser session; skipped entirely under
 * prefers-reduced-motion.
 */
export default function SplashSeedling() {
  const reduceMotion = useReducedMotion();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (reduceMotion) return;
    if (sessionStorage.getItem("waterdem:splashed")) return;
    sessionStorage.setItem("waterdem:splashed", "1");
    setShow(true);
    const t = setTimeout(() => setShow(false), 2100);
    return () => clearTimeout(t);
  }, [reduceMotion]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="splash"
          aria-hidden
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background:
              "radial-gradient(120% 90% at 20% 0%, #0A2411 0%, #081C0E 55%, #071509 100%)",
          }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeOut" } }}
        >
          {/* soft drifting light blobs behind the seedling */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 420,
              height: 420,
              background:
                "radial-gradient(circle, rgba(110,231,168,0.14) 0%, transparent 70%)",
              filter: "blur(30px)",
            }}
            animate={{ x: [-30, 30, -30], y: [-16, 16, -16] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="relative flex flex-col items-center gap-6">
            <svg
              width="140"
              height="170"
              viewBox="0 0 140 170"
              fill="none"
              className="overflow-visible"
            >
              {/* stem: draws upward */}
              <motion.path
                d="M70 165 C 70 130, 66 110, 70 78"
                stroke="#6EE7A8"
                strokeWidth="4"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
              {/* left leaf: unfurls from the stem tip */}
              <motion.path
                d="M70 88 C 46 84, 30 66, 30 44 C 54 46, 68 62, 70 88 Z"
                fill="rgba(110,231,168,0.75)"
                initial={{ scale: 0, rotate: -38, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
                style={{ transformOrigin: "70px 88px" }}
              />
              {/* right leaf */}
              <motion.path
                d="M70 78 C 94 72, 112 52, 112 28 C 86 32, 72 50, 70 78 Z"
                fill="#4ADE80"
                initial={{ scale: 0, rotate: 38, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ delay: 1.05, duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
                style={{ transformOrigin: "70px 78px" }}
              />
            </svg>

            <motion.p
              className="font-display text-2xl text-leaf-100"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3, duration: 0.5 }}
            >
              WaterDem
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
