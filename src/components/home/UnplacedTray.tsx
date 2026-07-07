"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import PlantIcon from "@/components/garden/PlantIcon";
import { ROOMS, type RoomKey } from "@/lib/home";
import type { Plant } from "@/lib/types";

/**
 * Plants with no room (new, or orphaned when a space was removed). Tap one to
 * choose which of the user's rooms it should live in.
 */
export default function UnplacedTray({
  plants,
  spaces,
  onAssign,
}: {
  plants: Plant[];
  spaces: RoomKey[];
  onAssign: (plantId: string, room: RoomKey) => void;
}) {
  const [openFor, setOpenFor] = useState<string | null>(null);

  if (plants.length === 0) return null;

  return (
    <div className="glass mx-auto flex w-full max-w-3xl flex-col gap-2 p-3">
      <p className="px-1 text-xs text-leaf-2nd">
        Not in a room yet — tap to place ({plants.length})
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {plants.map((plant) => (
          <div key={plant.id} className="relative shrink-0">
            <button
              onClick={() => setOpenFor((v) => (v === plant.id ? null : plant.id))}
              className="glass glass-interactive flex w-24 flex-col items-center gap-1.5 p-2.5"
              aria-label={`Place ${plant.name} in a room`}
            >
              <span className="flex size-10 items-center justify-center rounded-xl border border-[rgba(110,231,168,0.22)] bg-[rgba(110,231,168,0.10)]">
                <PlantIcon iconKey={plant.icon_key} size={20} className="text-sage" />
              </span>
              <span className="w-full truncate text-center text-xs text-leaf-100">
                {plant.name}
              </span>
              <span className="flex items-center gap-0.5 text-[10px] text-leaf-mut">
                <Plus className="size-3" aria-hidden /> place
              </span>
            </button>

            {openFor === plant.id && (
              <div className="glass absolute bottom-full left-1/2 z-20 mb-2 flex w-40 -translate-x-1/2 flex-col gap-1 p-1.5">
                {spaces.map((room) => (
                  <button
                    key={room}
                    onClick={() => {
                      onAssign(plant.id, room);
                      setOpenFor(null);
                    }}
                    className="rounded-lg px-3 py-2 text-left text-sm text-leaf-100 hover:bg-[rgba(255,255,255,0.07)]"
                  >
                    {ROOMS[room].label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
