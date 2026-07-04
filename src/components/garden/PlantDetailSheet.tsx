"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  Droplet,
  Eye,
  EyeOff,
  FlaskConical,
  Lightbulb,
  Sparkles,
  Sun,
  Thermometer,
  Trash2,
  Wind,
} from "lucide-react";
import Sheet from "@/components/garden/Sheet";
import GlassButton from "@/components/glass/GlassButton";
import GlassInput from "@/components/glass/GlassInput";
import PlantIcon from "@/components/garden/PlantIcon";
import PetSafetyBadge from "@/components/garden/PetSafetyBadge";
import WaterArc from "@/components/garden/WaterArc";
import { useToast } from "@/components/Toast";
import type { Advice, Plant, Weather } from "@/lib/types";

/**
 * Full plant profile: care details as varied glass rows (not identical
 * boxes), watering history, weather-aware advice, edit + share + delete.
 */

const LIGHT_LABEL: Record<string, string> = {
  low: "Low light — happy well away from windows",
  medium: "Medium — bright indirect, 2–4 ft from a window",
  bright: "Bright — within 2 ft of a window",
};

const HUMIDITY_LABEL: Record<string, string> = {
  low: "Low humidity is fine (20–40%)",
  medium: "Moderate humidity (40–60%)",
  high: "Loves humid air (50–70%) — consider misting",
};

export default function PlantDetailSheet({
  plant,
  weather,
  weatherFactor = 1,
  weeklyNudge = "",
  onClose,
  onWater,
  onUpdated,
  onDeleted,
}: {
  plant: Plant | null;
  weather: Weather | null;
  weatherFactor?: number;
  weeklyNudge?: string;
  onClose: () => void;
  onWater: (plant: Plant) => void;
  onUpdated: (plant: Plant) => void;
  onDeleted: (id: string) => void;
}) {
  const { toast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [history, setHistory] = useState<{ id: string; watered_at: string }[]>([]);
  const [advice, setAdvice] = useState<Advice | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [replanning, setReplanning] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setConfirmDelete(false);
    setEditing(false);
    setAdvice(null);
    setHistory([]);
    if (plant) {
      setEditName(plant.name);
      fetch(`/api/plants/${plant.id}/water`)
        .then((r) => (r.ok ? r.json() : { logs: [] }))
        .then((d) => setHistory(d.logs ?? []))
        .catch(() => {});
    }
  }, [plant?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!plant) return null;

  const patch = async (updates: Record<string, unknown>) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/plants/${plant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) {
        toast("error", data.error ?? "Couldn't save.");
        return null;
      }
      onUpdated(data);
      return data as Plant;
    } catch {
      toast("error", "Couldn't save — check your connection.");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const saveEdits = async () => {
    if (!editName.trim()) {
      toast("error", "Your plant needs a name.");
      return;
    }
    const updated = await patch({ name: editName });
    if (updated) {
      setEditing(false);
      toast("success", "Saved.");
    }
  };

  const replan = async () => {
    setReplanning(true);
    try {
      const res = await fetch(`/api/plants/${plant!.id}/replan`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast("error", data.error ?? "The botanist is unavailable right now.");
        return;
      }
      onUpdated(data);
      toast(
        "success",
        `Care plan refreshed — watering every ${data.water_freq_days} days now.`,
      );
    } catch {
      toast("error", "The botanist is unavailable right now — try again.");
    } finally {
      setReplanning(false);
    }
  };

  const toggleVisibility = async () => {
    const updated = await patch({ is_public: !plant.is_public });
    if (updated) {
      toast(
        "success",
        updated.is_public
          ? `${plant.name} is now visible to garden viewers.`
          : `${plant.name} is now private.`,
      );
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/plants/${plant.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast("error", data.error ?? "Couldn't delete.");
        return;
      }
      toast("info", `${plant.name} left the garden.`);
      onDeleted(plant.id);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const getAdvice = async () => {
    setAdviceLoading(true);
    try {
      const res = await fetch("/api/advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plant, weather }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast("error", data.error ?? "Couldn't fetch advice.");
        return;
      }
      setAdvice(data);
    } catch {
      toast("error", "Couldn't fetch advice right now.");
    } finally {
      setAdviceLoading(false);
    }
  };

  return (
    <Sheet open={!!plant} onClose={onClose} title={plant.name} wide>
      <div className="flex flex-col gap-6">
        {/* header row */}
        <div className="flex flex-wrap items-start gap-5">
          {plant.image_url ? (
            <div className="relative size-28 shrink-0 overflow-hidden rounded-2xl border border-glass-edge">
              <Image
                src={plant.image_url}
                alt={plant.name}
                fill
                sizes="112px"
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex size-28 shrink-0 items-center justify-center rounded-2xl border border-[rgba(110,231,168,0.22)] bg-[rgba(110,231,168,0.10)]">
              <PlantIcon iconKey={plant.icon_key} className="text-sage" size={48} />
            </div>
          )}

          <div className="min-w-0 flex-1">
            {plant.species && (
              <p className="text-sm italic text-leaf-2nd">{plant.species}</p>
            )}
            {plant.common_name && (
              <p className="text-xs text-leaf-mut">
                also known as {plant.common_name}
              </p>
            )}
            {plant.pet_safety && (
              <div className="mt-2">
                <PetSafetyBadge safety={plant.pet_safety} size="sm" />
                {plant.pet_safety_note && (
                  <p className="mt-1 text-xs text-leaf-mut">
                    {plant.pet_safety_note}
                  </p>
                )}
              </div>
            )}
            <div className="mt-3 max-w-sm">
              <WaterArc
                lastWatered={plant.last_watered}
                waterFreqDays={plant.water_freq_days}
                weatherFactor={weatherFactor}
              />
              <p className="mt-1.5 text-xs text-leaf-mut">
                Botanist&apos;s advisory: every ~
                {Math.max(1, Math.round(plant.water_freq_days * weatherFactor))}{" "}
                days this week
                {weatherFactor < 0.97
                  ? ` (base ${plant.water_freq_days}) — adjusted for this week's weather.`
                  : ` — the species' usual rhythm.`}
              </p>
              {weatherFactor < 0.97 && weeklyNudge && (
                <p className="mt-0.5 text-xs text-leaf-mut">{weeklyNudge}</p>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <GlassButton variant="primary" size="sm" onClick={() => onWater(plant)}>
                <Droplet className="size-4" aria-hidden /> Water now
              </GlassButton>
              <GlassButton variant="ghost" size="sm" onClick={() => setEditing((e) => !e)}>
                {editing ? "Stop editing" : "Edit"}
              </GlassButton>
              <GlassButton
                variant="ghost"
                size="sm"
                onClick={toggleVisibility}
                disabled={busy}
                aria-label={
                  plant.is_public
                    ? "Make this plant private"
                    : "Show this plant to garden viewers"
                }
              >
                {plant.is_public ? (
                  <>
                    <Eye className="size-4 text-sage" aria-hidden /> Shared
                  </>
                ) : (
                  <>
                    <EyeOff className="size-4" aria-hidden /> Private
                  </>
                )}
              </GlassButton>
            </div>
          </div>
        </div>

        {editing && (
          <div className="flex flex-col gap-4 rounded-xl border border-glass-edge bg-[rgba(255,255,255,0.04)] p-4">
            <GlassInput
              label="Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              hint="The watering schedule isn't editable — if it seems off, ask the botanist to re-plan below."
            />
            <div className="flex flex-wrap items-center gap-2.5">
              <GlassButton
                variant="primary"
                size="sm"
                onClick={saveEdits}
                loading={busy}
                disabled={!editName.trim()}
              >
                Save changes
              </GlassButton>
              <GlassButton
                variant="ghost"
                size="sm"
                onClick={replan}
                loading={replanning}
              >
                {!replanning && <Sparkles className="size-4" aria-hidden />}
                {replanning ? "Re-planning…" : "Re-plan care with the botanist"}
              </GlassButton>
            </div>
          </div>
        )}

        {/* care profile — varied rows, not identical boxes */}
        <div className="flex flex-col gap-2.5">
          {plant.light && (
            <div className="flex items-center gap-3 text-sm text-leaf-2nd">
              <Sun className="size-4 shrink-0 text-warn" aria-hidden />
              {LIGHT_LABEL[plant.light]}
            </div>
          )}
          {plant.humidity && (
            <div className="flex items-center gap-3 text-sm text-leaf-2nd">
              <Wind className="size-4 shrink-0 text-leaf-mut" aria-hidden />
              {HUMIDITY_LABEL[plant.humidity]}
            </div>
          )}
          {plant.soil_check && (
            <div className="flex items-center gap-3 text-sm text-leaf-2nd">
              <Droplet className="size-4 shrink-0 text-sage" aria-hidden />
              {plant.soil_check}
            </div>
          )}
          {plant.weather_note && (
            <div className="flex items-center gap-3 text-sm text-leaf-2nd">
              <Thermometer className="size-4 shrink-0 text-alert" aria-hidden />
              {plant.weather_note}
            </div>
          )}
        </div>

        {plant.nutrients.length > 0 && (
          <div className="rounded-xl border border-glass-edge bg-[rgba(255,255,255,0.04)] p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-medium text-leaf-100">
                <FlaskConical className="size-4 text-sage" aria-hidden /> Feeding
              </p>
              <Link
                href="/guide#nutrition"
                className="text-xs text-sage hover:underline"
              >
                Why feed?
              </Link>
            </div>
            <ul className="flex flex-col gap-1.5 text-sm text-leaf-2nd">
              {plant.nutrients.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
            <p className="mt-2.5 border-t border-[rgba(255,255,255,0.07)] pt-2.5 text-xs text-leaf-mut">
              Feed at half strength monthly in spring and summer; ease off in
              winter. Skip feeding a newly repotted, stressed, or bone-dry
              plant — concentrated fertiliser burns roots.
            </p>
          </div>
        )}

        {plant.weekly_tips.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-medium text-leaf-100">
              <Lightbulb className="size-4 text-warn" aria-hidden /> This week
            </p>
            <ul className="flex flex-col gap-1.5 text-sm text-leaf-2nd">
              {plant.weekly_tips.map((t, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-sage" aria-hidden>—</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* weather-aware advice */}
        <div className="rounded-xl border border-[rgba(110,231,168,0.18)] bg-[rgba(110,231,168,0.05)] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-medium text-leaf-100">
              <Sparkles className="size-4 text-sage" aria-hidden />
              Ask the botanist
            </p>
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={getAdvice}
              loading={adviceLoading}
            >
              {weather ? "Advice for today's weather" : "Get advice"}
            </GlassButton>
          </div>
          {advice && (
            <div className="mt-3 flex flex-col gap-2 text-sm text-leaf-2nd">
              <p className="text-leaf-100">{advice.greeting}</p>
              <ul className="flex flex-col gap-1.5">
                {advice.tips.map((t, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-sage" aria-hidden>—</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {plant.fun_facts.length > 0 && (
          <div className="text-sm text-leaf-mut">
            <p className="font-display mb-1.5 text-base text-leaf-2nd">
              Did you know?
            </p>
            {plant.fun_facts.map((f, i) => (
              <p key={i} className="mb-1">
                {f}
              </p>
            ))}
          </div>
        )}

        {history.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-medium text-leaf-100">
              <CalendarDays className="size-4 text-leaf-mut" aria-hidden />
              Watering history
            </p>
            <div className="flex flex-wrap gap-2">
              {history.map((h) => (
                <span
                  key={h.id}
                  className="rounded-full border border-glass-edge bg-[rgba(255,255,255,0.04)] px-3 py-1 text-xs text-leaf-2nd"
                >
                  {new Date(h.watered_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* danger zone — confirm before deleting (Nielsen #5) */}
        <div className="flex items-center justify-end gap-3 border-t border-[rgba(255,255,255,0.08)] pt-4">
          {confirmDelete ? (
            <>
              <span className="text-sm text-leaf-2nd">
                Remove {plant.name} and its history?
              </span>
              <GlassButton variant="danger" size="sm" onClick={remove} loading={busy}>
                Yes, remove
              </GlassButton>
              <GlassButton variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                Keep it
              </GlassButton>
            </>
          ) : (
            <GlassButton
              variant="danger"
              size="sm"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="size-4" aria-hidden /> Remove plant
            </GlassButton>
          )}
        </div>
      </div>
    </Sheet>
  );
}
