"use client";

import { MapPin } from "lucide-react";
import PlantIcon from "@/components/garden/PlantIcon";
import type { Plant } from "@/lib/types";

/**
 * Plants with no room (new, or orphaned when a space was removed). Tap one to
 * open its detail sheet, where the room selector (and all other edits) live —
 * a real sheet rather than a tiny dropdown that a scroll container would clip.
 */
export default function UnplacedTray({
  plants,
  onOpen,
}: {
  plants: Plant[];
  onOpen: (plant: Plant) => void;
}) {
  if (plants.length === 0) return null;

  return (
    <div className="glass mx-auto flex w-full max-w-3xl flex-col gap-2 p-3">
      <p className="flex items-center gap-1.5 px-1 text-xs text-leaf-2nd">
        <MapPin className="size-3.5 text-sage" aria-hidden />
        Not in a room yet — tap to place ({plants.length})
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {plants.map((plant) => (
          <button
            key={plant.id}
            onClick={() => onOpen(plant)}
            className="glass glass-interactive flex w-24 shrink-0 flex-col items-center gap-1.5 p-2.5"
            aria-label={`Place ${plant.name} in a room`}
          >
            <span className="flex size-10 items-center justify-center rounded-xl border border-[rgba(110,231,168,0.22)] bg-[rgba(110,231,168,0.10)]">
              <PlantIcon iconKey={plant.icon_key} size={20} className="text-sage" />
            </span>
            <span className="w-full truncate text-center text-xs text-leaf-100">
              {plant.name}
            </span>
            <span className="text-[10px] text-leaf-mut">tap to place</span>
          </button>
        ))}
      </div>
    </div>
  );
}
