"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Droplet, Eye, ShieldAlert } from "lucide-react";
import GlassCard from "@/components/glass/GlassCard";
import PlantIcon from "@/components/garden/PlantIcon";
import WaterArc from "@/components/garden/WaterArc";
import type { Plant } from "@/lib/types";
import { useState } from "react";

export default function PlantCard({
  plant,
  weatherFactor = 1,
  onOpen,
  onWater,
  readOnly = false,
}: {
  plant: Plant;
  weatherFactor?: number;
  onOpen?: (plant: Plant) => void;
  onWater?: (plant: Plant) => void;
  readOnly?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const [ripple, setRipple] = useState(false);

  const water = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onWater) return;
    setRipple(true);
    setTimeout(() => setRipple(false), 400);
    onWater(plant);
  };

  return (
    <GlassCard
      interactive={!!onOpen}
      padding="snug"
      className="group relative flex flex-col gap-3 p-4"
      onClick={onOpen ? () => onOpen(plant) : undefined}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onKeyDown={
        onOpen
          ? (e) => {
              // Only act on the card itself — let Enter/Space on the inner
              // water button do its own thing (keyboard users can water).
              if (
                e.target === e.currentTarget &&
                (e.key === "Enter" || e.key === " ")
              ) {
                e.preventDefault();
                onOpen(plant);
              }
            }
          : undefined
      }
      aria-label={onOpen ? `${plant.name} — open details` : undefined}
    >
      <div className="flex items-start gap-3.5">
        {plant.image_url ? (
          <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl border border-glass-edge">
            <Image
              src={plant.image_url}
              alt={plant.name}
              fill
              sizes="64px"
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-[rgba(110,231,168,0.22)] bg-[rgba(110,231,168,0.10)]">
            <PlantIcon iconKey={plant.icon_key} className="text-sage" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-display truncate text-lg leading-tight text-leaf-100">
              {plant.name}
            </h3>
            {plant.is_public && !readOnly && (
              <Eye
                className="size-3.5 shrink-0 text-leaf-mut"
                aria-label="Visible to garden viewers"
              />
            )}
            {(plant.pet_safety === "toxic" || plant.pet_safety === "mild") && (
              <ShieldAlert
                className={`size-3.5 shrink-0 ${plant.pet_safety === "toxic" ? "text-[#F8B4B4]" : "text-[#FCD989]"}`}
                aria-label={
                  plant.pet_safety === "toxic"
                    ? "Toxic to pets"
                    : "Mildly toxic to pets"
                }
              />
            )}
          </div>
          {(plant.species || plant.common_name) && (
            <p className="truncate text-xs italic text-leaf-mut">
              {plant.species || plant.common_name}
            </p>
          )}
        </div>

        {!readOnly && onWater && (
          <motion.button
            onClick={water}
            aria-label={`Water ${plant.name} now`}
            className="relative shrink-0 rounded-full border border-[rgba(110,231,168,0.3)] bg-[rgba(110,231,168,0.12)] p-2.5 text-sage transition-colors hover:bg-[rgba(110,231,168,0.22)]"
            whileTap={reduceMotion ? undefined : { scale: 0.88 }}
          >
            <Droplet className="size-4" aria-hidden />
            {ripple && !reduceMotion && (
              <motion.span
                className="absolute inset-0 rounded-full border border-sage"
                initial={{ opacity: 0.7, scale: 1 }}
                animate={{ opacity: 0, scale: 1.9 }}
                transition={{ duration: 0.38, ease: "easeOut" }}
              />
            )}
          </motion.button>
        )}
      </div>

      <WaterArc
        lastWatered={plant.last_watered}
        waterFreqDays={plant.water_freq_days}
        weatherFactor={weatherFactor}
        compact
      />
    </GlassCard>
  );
}
