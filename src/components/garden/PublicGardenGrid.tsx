"use client";

import { motion, useReducedMotion } from "framer-motion";
import PlantCard from "@/components/garden/PlantCard";
import type { Plant } from "@/lib/types";

/** Read-only grid for the public garden — no watering, no editing. */
export default function PublicGardenGrid({ plants }: { plants: Plant[] }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      initial={reduceMotion ? false : "hidden"}
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
    >
      {plants.map((plant) => (
        <motion.div
          key={plant.id}
          variants={{
            hidden: { opacity: 0, y: 18 },
            show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
          }}
        >
          <PlantCard plant={plant} readOnly />
        </motion.div>
      ))}
    </motion.div>
  );
}
