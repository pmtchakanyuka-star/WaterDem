"use client";

import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, MonitorX, Pencil } from "lucide-react";
import HomeScene from "@/components/home/HomeScene";
import SpacePicker from "@/components/home/SpacePicker";
import UnplacedTray from "@/components/home/UnplacedTray";
import GlassButton from "@/components/glass/GlassButton";
import GlassCard from "@/components/glass/GlassCard";
import { ROOMS, type RoomKey } from "@/lib/home";
import type { Plant } from "@/lib/types";

/** True if the browser can create a WebGL context. */
function webglAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext("webgl2") || c.getContext("webgl"))
    );
  } catch {
    return false;
  }
}

/** Catches Three.js runtime errors and falls back to the grid. */
class SceneErrorBoundary extends Component<
  { onError: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function HomeView({
  plants,
  homeSpaces,
  weatherFactor,
  saving,
  onSelect,
  onSpacesChange,
  onFallback,
}: {
  plants: Plant[];
  homeSpaces: RoomKey[];
  weatherFactor: number;
  saving: boolean;
  onSelect: (plant: Plant) => void;
  onSpacesChange: (spaces: RoomKey[]) => void;
  onFallback: () => void;
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  // One room fills the stage at a time; arrows flip between them.
  const [roomIndex, setRoomIndex] = useState(0);
  const firedFallback = useRef(false);

  const activeIndex = Math.min(roomIndex, Math.max(0, homeSpaces.length - 1));
  const activeRoom = homeSpaces[activeIndex];
  const flipRoom = (dir: 1 | -1) =>
    setRoomIndex((activeIndex + dir + homeSpaces.length) % homeSpaces.length);

  useEffect(() => {
    setWebgl(webglAvailable());
  }, []);

  const fallback = () => {
    if (firedFallback.current) return;
    firedFallback.current = true;
    onFallback();
  };

  const select = (plant: Plant) => {
    setSelectedId(plant.id);
    onSelect(plant);
  };

  const unplaced = useMemo(
    () => plants.filter((p) => !p.room || !homeSpaces.includes(p.room)),
    [plants, homeSpaces],
  );

  if (webgl === null) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-leaf-mut">
        Warming up your home…
      </div>
    );
  }

  if (!webgl) {
    return (
      <GlassCard className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
        <MonitorX className="size-8 text-leaf-mut" aria-hidden />
        <p className="text-sm text-leaf-2nd">
          The 3D home needs WebGL, which this browser doesn&apos;t support.
          Your grid view has everything you need.
        </p>
        <GlassButton variant="primary" onClick={onFallback}>
          Back to the grid
        </GlassButton>
      </GlassCard>
    );
  }

  if (homeSpaces.length === 0 || editing) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center py-8">
        <SpacePicker
          initial={homeSpaces}
          saving={saving}
          onSave={(spaces) => {
            onSpacesChange(spaces);
            setEditing(false);
          }}
          onCancel={editing ? () => setEditing(false) : undefined}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative h-[58svh] min-h-[380px] w-full overflow-hidden rounded-3xl border border-glass-edge">
        <SceneErrorBoundary onError={fallback}>
          <HomeScene
            rooms={activeRoom ? [activeRoom] : []}
            plants={plants}
            weatherFactor={weatherFactor}
            hoveredId={hoveredId}
            selectedId={selectedId}
            reduceMotion={reduceMotion}
            onHover={setHoveredId}
            onSelect={select}
          />
        </SceneErrorBoundary>

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <span className="glass pointer-events-none rounded-full px-3 py-1 text-xs text-leaf-2nd">
            Drag to look around · pinch to zoom
          </span>
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => setEditing(true)}
            className="pointer-events-auto"
          >
            <Pencil className="size-3.5" aria-hidden /> Rooms
          </GlassButton>
        </div>

        {/* room switcher: one room on stage at a time */}
        {homeSpaces.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => flipRoom(-1)}
              aria-label="Previous room"
              className="glass glass-interactive absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-2.5 text-leaf-100 outline-none focus-visible:outline-2 focus-visible:outline-sage"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => flipRoom(1)}
              aria-label="Next room"
              className="glass glass-interactive absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2.5 text-leaf-100 outline-none focus-visible:outline-2 focus-visible:outline-sage"
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </>
        )}
        {activeRoom && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex flex-col items-center gap-1.5">
            <span className="glass rounded-full px-3.5 py-1 text-xs font-medium text-leaf-100">
              {ROOMS[activeRoom].label}
            </span>
            {homeSpaces.length > 1 && (
              <div className="flex items-center gap-1.5" aria-hidden>
                {homeSpaces.map((r, i) => (
                  <span
                    key={r}
                    className={`size-1.5 rounded-full transition-colors ${
                      i === activeIndex ? "bg-leaf-100" : "bg-[rgba(255,255,255,0.28)]"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <UnplacedTray plants={unplaced} onOpen={select} />
    </div>
  );
}
