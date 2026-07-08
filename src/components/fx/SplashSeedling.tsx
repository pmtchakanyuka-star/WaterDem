"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * Signature splash: a real 3D plant grows out of a pot while a watering can
 * pours, the WaterDem wordmark fades in over it, and tapping the plant makes
 * it wiggle. Tap anywhere else to enter. Plays once per browser session and is
 * skipped entirely under prefers-reduced-motion. The Three.js scene is lazy so
 * it never runs on the server.
 */
const Splash3DScene = dynamic(() => import("@/components/fx/Splash3DScene"), {
  ssr: false,
});

export default function SplashSeedling() {
  const reduceMotion = useReducedMotion();
  const [show, setShow] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (reduceMotion) return;
    if (sessionStorage.getItem("waterdem:splashed")) return;
    sessionStorage.setItem("waterdem:splashed", "1");
    setShow(true);
    // Safety net: never trap the user behind the splash if the model is slow
    // to load or errors out.
    const t = setTimeout(() => setShow(false), 8000);
    return () => clearTimeout(t);
  }, [reduceMotion]);

  if (reduceMotion) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="splash"
          aria-hidden
          className="fixed inset-0 z-50"
          style={{
            background:
              "radial-gradient(120% 90% at 20% 0%, #0A2411 0%, #081C0E 55%, #071509 100%)",
          }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeOut" } }}
        >
          {/* soft drifting glow behind the plant */}
          <motion.div
            className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 rounded-full"
            style={{
              width: 460,
              height: 460,
              background:
                "radial-gradient(circle, rgba(110,231,168,0.16) 0%, transparent 70%)",
              filter: "blur(34px)",
            }}
            animate={{ x: [-30, 30, -30], y: [-14, 14, -14] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          />

          <Splash3DScene
            onReveal={() => setRevealed(true)}
            onDone={() => setShow(false)}
            onSkip={() => setShow(false)}
          />

          <AnimatePresence>
            {revealed && (
              <motion.div
                key="wordmark"
                className="pointer-events-none absolute inset-x-0 top-[13%] flex flex-col items-center"
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="font-display text-4xl tracking-tight text-leaf-100 drop-shadow-[0_2px_20px_rgba(0,0,0,0.55)]">
                  WaterDem
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.p
            className="pointer-events-none absolute inset-x-0 bottom-10 text-center text-xs text-leaf-mut"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.65 }}
            transition={{ delay: 1.9, duration: 0.6 }}
          >
            tap the plant to say hi · tap anywhere to enter
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
