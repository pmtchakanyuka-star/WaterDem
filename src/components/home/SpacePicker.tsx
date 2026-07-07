"use client";

import { useState } from "react";
import { Bath, Bed, CookingPot, Sofa, Sun, type LucideIcon } from "lucide-react";
import GlassButton from "@/components/glass/GlassButton";
import { MAX_SPACES, ROOM_KEYS, ROOMS, type RoomKey } from "@/lib/home";

const ICONS: Record<RoomKey, LucideIcon> = {
  living_room: Sofa,
  kitchen: CookingPot,
  bedroom: Bed,
  bathroom: Bath,
  balcony: Sun,
};

/**
 * Choose up to two living spaces. Selection is capped client-side; the server
 * (PATCH /api/settings) is the authority.
 */
export default function SpacePicker({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: RoomKey[];
  onSave: (spaces: RoomKey[]) => void;
  onCancel?: () => void;
  saving: boolean;
}) {
  const [selected, setSelected] = useState<RoomKey[]>(initial);

  const toggle = (key: RoomKey) => {
    setSelected((cur) => {
      if (cur.includes(key)) return cur.filter((k) => k !== key);
      if (cur.length >= MAX_SPACES) return cur; // capped
      return [...cur, key];
    });
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-4 text-center">
        <h2 className="font-display text-2xl text-leaf-100">Pick your rooms</h2>
        <p className="mt-1 text-sm text-leaf-2nd">
          Choose up to two spaces to grow your plants in.
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        {ROOM_KEYS.map((key) => {
          const Icon = ICONS[key];
          const on = selected.includes(key);
          const atCap = !on && selected.length >= MAX_SPACES;
          return (
            <button
              key={key}
              onClick={() => toggle(key)}
              disabled={atCap}
              aria-pressed={on}
              className={[
                "glass flex items-center gap-3.5 p-3.5 text-left transition-all",
                on
                  ? "border-[rgba(110,231,168,0.5)] bg-[rgba(110,231,168,0.10)]"
                  : "glass-interactive",
                atCap ? "opacity-40" : "",
              ].join(" ")}
            >
              <span
                className={[
                  "flex size-11 shrink-0 items-center justify-center rounded-2xl border",
                  on
                    ? "border-[rgba(110,231,168,0.4)] bg-[rgba(110,231,168,0.16)] text-sage"
                    : "border-glass-edge bg-[rgba(255,255,255,0.05)] text-leaf-2nd",
                ].join(" ")}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-leaf-100">{ROOMS[key].label}</span>
                <span className="block text-xs text-leaf-mut">{ROOMS[key].blurb}</span>
              </span>
              <span
                className={[
                  "size-5 shrink-0 rounded-full border-2",
                  on ? "border-sage bg-sage" : "border-glass-edge",
                ].join(" ")}
                aria-hidden
              />
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-center gap-3">
        <GlassButton
          variant="primary"
          onClick={() => onSave(selected)}
          loading={saving}
        >
          {selected.length === 0 ? "Choose at least one" : "Save my home"}
        </GlassButton>
        {onCancel && (
          <GlassButton variant="ghost" onClick={onCancel}>
            Cancel
          </GlassButton>
        )}
      </div>
    </div>
  );
}
