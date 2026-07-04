"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { LogOut, Plus, Settings, Sprout } from "lucide-react";
import GlassButton from "@/components/glass/GlassButton";
import PlantCard from "@/components/garden/PlantCard";
import AddPlantSheet from "@/components/garden/AddPlantSheet";
import PlantDetailSheet from "@/components/garden/PlantDetailSheet";
import WeatherBar from "@/components/weather/WeatherBar";
import { ToastProvider, useToast } from "@/components/Toast";
import type { Plant, Weather } from "@/lib/types";
import Link from "next/link";

/** The signed-in garden: grid, weather, add flow, detail sheet, watering. */

type WeatherState = {
  weather: Weather | null;
  location: string | null;
  factor: number;
  nudge: string;
  iconKey: string | null;
  loading: boolean;
};

function GardenInner({
  nickname,
  initialPlants,
}: {
  nickname: string;
  initialPlants: Plant[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const reduceMotion = useReducedMotion();

  const [plants, setPlants] = useState<Plant[]>(initialPlants);
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<Plant | null>(null);
  const [wx, setWx] = useState<WeatherState>({
    weather: null,
    location: null,
    factor: 1,
    nudge: "",
    iconKey: null,
    loading: true,
  });

  useEffect(() => {
    fetch("/api/weather")
      .then((r) => (r.ok ? r.json() : { weather: null }))
      .then((d) =>
        setWx({
          weather: d.weather ?? null,
          location: d.location ?? null,
          factor: d.factor ?? 1,
          nudge: d.nudge ?? "",
          iconKey: d.iconKey ?? null,
          loading: false,
        }),
      )
      .catch(() => setWx((w) => ({ ...w, loading: false })));
  }, []);

  const updatePlant = useCallback((updated: Plant) => {
    setPlants((ps) => ps.map((p) => (p.id === updated.id ? updated : p)));
    setSelected((s) => (s?.id === updated.id ? updated : s));
  }, []);

  const water = useCallback(
    async (plant: Plant) => {
      const prevLastWatered = plant.last_watered;
      const nowIso = new Date().toISOString();
      // Optimistic: reset the countdown immediately (<400ms feedback).
      updatePlant({ ...plant, last_watered: nowIso });

      const res = await fetch(`/api/plants/${plant.id}/water`, {
        method: "POST",
      }).catch(() => null);

      if (!res?.ok) {
        updatePlant({ ...plant, last_watered: prevLastWatered });
        toast("error", "Couldn't log the watering — try again.");
        return;
      }

      toast("success", `${plant.name} watered.`, {
        label: "Undo",
        onClick: async () => {
          const undo = await fetch(`/api/plants/${plant.id}/water`, {
            method: "DELETE",
          }).catch(() => null);
          if (undo?.ok) {
            const d = await undo.json();
            updatePlant({ ...plant, last_watered: d.lastWatered ?? prevLastWatered });
            toast("info", "Watering undone.");
          }
        },
      });
    },
    [toast, updatePlant],
  );

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-6 px-5 py-8 sm:px-8">
      {/* header */}
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl border border-[rgba(110,231,168,0.25)] bg-[rgba(110,231,168,0.10)]">
            <Sprout className="size-5 text-sage" aria-hidden />
          </div>
          <div>
            <h1 className="font-display text-2xl leading-tight text-leaf-100">
              {nickname}&apos;s garden
            </h1>
            <p className="text-xs text-leaf-mut">
              {plants.length === 0
                ? "No plants yet"
                : `${plants.length} plant${plants.length === 1 ? "" : "s"} growing`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/settings" aria-label="Settings">
            <GlassButton variant="icon" aria-label="Settings">
              <Settings className="size-4" aria-hidden />
            </GlassButton>
          </Link>
          <GlassButton variant="icon" onClick={logout} aria-label="Sign out">
            <LogOut className="size-4" aria-hidden />
          </GlassButton>
        </div>
      </header>

      <WeatherBar
        weather={wx.weather}
        location={wx.location}
        iconKey={wx.iconKey}
        nudge={wx.nudge}
        loading={wx.loading}
      />

      {plants.length === 0 ? (
        /* teaching empty state — this app is a garden, not a dashboard */
        <div className="flex flex-1 flex-col items-center justify-center gap-5 py-16 text-center">
          <div className="flex size-20 items-center justify-center rounded-3xl border border-[rgba(110,231,168,0.22)] bg-[rgba(110,231,168,0.08)]">
            <Sprout className="size-9 text-sage" aria-hidden />
          </div>
          <div>
            <h2 className="font-display text-3xl text-leaf-100">
              Plant your first seed
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-leaf-2nd">
              Snap a photo of any plant to begin — the botanist will name it
              and write its care plan.
            </p>
          </div>
          <GlassButton variant="primary" size="lg" onClick={() => setAdding(true)}>
            <Plus className="size-4" aria-hidden /> Add your first plant
          </GlassButton>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          initial={reduceMotion ? false : "hidden"}
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.06 } },
          }}
        >
          {plants.map((plant) => (
            <motion.div
              key={plant.id}
              variants={{
                hidden: { opacity: 0, y: 18 },
                show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
              }}
            >
              <PlantCard
                plant={plant}
                weatherFactor={wx.factor}
                onOpen={setSelected}
                onWater={water}
              />
            </motion.div>
          ))}

          <motion.button
            variants={{
              hidden: { opacity: 0, y: 18 },
              show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
            }}
            onClick={() => setAdding(true)}
            className="glass glass-interactive flex min-h-36 flex-col items-center justify-center gap-2 border-dashed text-leaf-mut hover:text-sage"
            aria-label="Add a plant"
          >
            <Plus className="size-6" aria-hidden />
            <span className="text-sm">Add a plant</span>
          </motion.button>
        </motion.div>
      )}

      <AddPlantSheet
        open={adding}
        onClose={() => setAdding(false)}
        onSaved={(plant) => setPlants((ps) => [plant, ...ps])}
      />

      <PlantDetailSheet
        plant={selected}
        weather={wx.weather}
        weatherFactor={wx.factor}
        onClose={() => setSelected(null)}
        onWater={water}
        onUpdated={updatePlant}
        onDeleted={(id) => setPlants((ps) => ps.filter((p) => p.id !== id))}
      />
    </main>
  );
}

export default function GardenClient(props: {
  nickname: string;
  initialPlants: Plant[];
}) {
  return (
    <ToastProvider>
      <GardenInner {...props} />
    </ToastProvider>
  );
}
