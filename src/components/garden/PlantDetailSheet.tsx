"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  Camera,
  Droplet,
  Eye,
  EyeOff,
  FlaskConical,
  HeartPulse,
  ImageUp,
  Lightbulb,
  MapPin,
  Palette,
  Sparkles,
  Sprout,
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
import { ROOMS, type RoomKey } from "@/lib/home";
import { downscaleToDataUrl } from "@/lib/image";
import type {
  Advice,
  CareLevel,
  GrowthStage,
  HealthCheck,
  HumidityLevel,
  LightLevel,
  Plant,
  Weather,
} from "@/lib/types";

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

const STAGE_OPTIONS: { value: GrowthStage; label: string }[] = [
  { value: "seed", label: "Just a seed" },
  { value: "seedling", label: "Seedling" },
  { value: "young", label: "Young plant" },
  { value: "mature", label: "Mature" },
];

const NEXT_STAGE: Record<GrowthStage, GrowthStage> = {
  seed: "seedling",
  seedling: "young",
  young: "mature",
  mature: "mature",
};

const STAGE_PHRASE: Record<GrowthStage, string> = {
  seed: "seed",
  seedling: "seedling",
  young: "young plant",
  mature: "mature",
};

// Severity tints follow the existing status colours (ring/status greens,
// ambers and reds used across the garden).
const SEVERITY_CARD: Record<HealthCheck["severity"], string> = {
  ok: "border-[rgba(110,231,168,0.25)] bg-[rgba(110,231,168,0.06)]",
  watch: "border-[rgba(251,191,36,0.28)] bg-[rgba(251,191,36,0.06)]",
  act: "border-[rgba(248,113,113,0.30)] bg-[rgba(248,113,113,0.06)]",
};

const SEVERITY_DOT: Record<HealthCheck["severity"], string> = {
  ok: "bg-[#4ade80]",
  watch: "bg-[#fbbf24]",
  act: "bg-[#f87171]",
};

/** A glass-styled select for the edit form. */
function EditSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-leaf-2nd">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-glass-edge bg-[rgba(255,255,255,0.05)] px-4 py-2.5 text-leaf-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.10)] backdrop-blur-xl outline-none focus-visible:outline-2 focus-visible:outline-sage focus-visible:outline-offset-2 [&>option]:bg-forest-900"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

type Edits = {
  name: string;
  species: string;
  common_name: string;
  light: LightLevel | "";
  humidity: HumidityLevel | "";
  care_level: CareLevel | "";
  soil_check: string;
};

function editsFromPlant(p: Plant): Edits {
  return {
    name: p.name,
    species: p.species ?? "",
    common_name: p.common_name ?? "",
    light: p.light ?? "",
    humidity: p.humidity ?? "",
    care_level: p.care_level ?? "",
    soil_check: p.soil_check ?? "",
  };
}

export default function PlantDetailSheet({
  plant,
  weather,
  weatherFactor = 1,
  weeklyNudge = "",
  homeSpaces = [],
  onClose,
  onWater,
  onUpdated,
  onDeleted,
}: {
  plant: Plant | null;
  weather: Weather | null;
  weatherFactor?: number;
  weeklyNudge?: string;
  homeSpaces?: RoomKey[];
  onClose: () => void;
  onWater: (plant: Plant) => void;
  onUpdated: (plant: Plant) => void;
  onDeleted: (id: string) => void;
}) {
  const { toast } = useToast();
  const healthFileRef = useRef<HTMLInputElement>(null);
  const healthCameraRef = useRef<HTMLInputElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [edits, setEdits] = useState<Edits | null>(null);
  const [history, setHistory] = useState<{ id: string; watered_at: string }[]>([]);
  const [advice, setAdvice] = useState<Advice | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [replanning, setReplanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [healthPhoto, setHealthPhoto] = useState<string | null>(null);
  const [healthNote, setHealthNote] = useState("");
  const [healthChecking, setHealthChecking] = useState(false);
  const [healthResult, setHealthResult] = useState<HealthCheck | null>(null);
  const [pastChecks, setPastChecks] = useState<HealthCheck[]>([]);

  useEffect(() => {
    setConfirmDelete(false);
    setEditing(false);
    setAdvice(null);
    setHistory([]);
    setHealthPhoto(null);
    setHealthNote("");
    setHealthResult(null);
    setPastChecks([]);
    if (plant) {
      setEdits(editsFromPlant(plant));
      fetch(`/api/plants/${plant.id}/water`)
        .then((r) => (r.ok ? r.json() : { logs: [] }))
        .then((d) => setHistory(d.logs ?? []))
        .catch(() => {});
      fetch(`/api/plants/${plant.id}/health`)
        .then((r) => (r.ok ? r.json() : { checks: [] }))
        .then((d) => setPastChecks(d.checks ?? []))
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
    if (!edits || !plant) return;
    if (!edits.name.trim()) {
      toast("error", "Your plant needs a name.");
      return;
    }
    // Send only fields that changed. Empty select/text -> null (clears it);
    // room "" -> null (unplace). Server validates room against home_spaces.
    const changed: Record<string, unknown> = {};
    const cur = editsFromPlant(plant);
    (Object.keys(edits) as (keyof Edits)[]).forEach((k) => {
      if (edits[k] !== cur[k]) {
        changed[k] = edits[k] === "" ? null : edits[k];
      }
    });
    if (Object.keys(changed).length === 0) {
      setEditing(false);
      return;
    }
    const updated = await patch(changed);
    if (updated) {
      setEditing(false);
      toast("success", "Saved.");
    }
  };

  const replan = async (successMessage?: string) => {
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
        successMessage ??
          `Care plan refreshed — watering every ${data.water_freq_days} days now.`,
      );
    } catch {
      toast("error", "The botanist is unavailable right now — try again.");
    } finally {
      setReplanning(false);
    }
  };

  // Stage changes are patch + re-plan in one gesture: the watering schedule is
  // the botanist's, so a new life stage always triggers a fresh care plan.
  const changeStage = async (stage: GrowthStage) => {
    if (!plant || stage === plant.growth_stage) return;
    const updated = await patch({ growth_stage: stage });
    if (!updated) return;
    await replan("Stage updated — the botanist re-planned watering.");
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

  const pickHealthPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setHealthPhoto(await downscaleToDataUrl(file));
    } catch {
      toast("error", "Couldn't read that image — try another.");
    }
  };

  const runHealthCheck = async () => {
    setHealthChecking(true);
    try {
      const res = await fetch(`/api/plants/${plant.id}/health`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: healthPhoto ?? undefined,
          note: healthNote.trim() || undefined,
          weather,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(
          "error",
          data.error ?? "The botanist is unavailable right now — try again.",
        );
        return;
      }
      setHealthResult(data.check);
      setPastChecks((prev) => [data.check, ...prev].slice(0, 10));
      if (healthPhoto && data.photoSaved === false) {
        toast("info", "Checked! The photo couldn't be saved to the history though.");
      }
      setHealthPhoto(null);
      setHealthNote("");
    } catch {
      toast("error", "Couldn't reach the botanist — check your connection.");
    } finally {
      setHealthChecking(false);
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

        {/* One-tap placement — visible without entering edit mode. */}
        {homeSpaces.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-glass-edge bg-[rgba(255,255,255,0.04)] px-4 py-3">
            <span className="flex items-center gap-2 text-sm text-leaf-2nd">
              <MapPin className="size-4 text-sage" aria-hidden /> Room
            </span>
            <select
              value={plant.room ?? ""}
              disabled={busy}
              onChange={(e) =>
                patch({ room: e.target.value === "" ? null : e.target.value })
              }
              aria-label="Which room this plant lives in"
              className="min-w-40 flex-1 rounded-lg border border-glass-edge bg-[rgba(255,255,255,0.05)] px-3 py-2 text-leaf-100 outline-none focus-visible:outline-2 focus-visible:outline-sage [&>option]:bg-forest-900"
            >
              <option value="">Not in a room</option>
              {homeSpaces.map((r) => (
                <option key={r} value={r}>
                  {ROOMS[r].label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Growth stage — one tap to advance; the botanist re-plans watering. */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-glass-edge bg-[rgba(255,255,255,0.04)] px-4 py-3">
          <span className="flex items-center gap-2 text-sm text-leaf-2nd">
            <Sprout className="size-4 text-sage" aria-hidden /> Stage
          </span>
          <select
            value={plant.growth_stage}
            disabled={busy || replanning}
            onChange={(e) => changeStage(e.target.value as GrowthStage)}
            aria-label="How far along this plant is"
            className="min-w-40 flex-1 rounded-lg border border-glass-edge bg-[rgba(255,255,255,0.05)] px-3 py-2 text-leaf-100 outline-none focus-visible:outline-2 focus-visible:outline-sage [&>option]:bg-forest-900"
          >
            {STAGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {plant.growth_stage !== "mature" && (
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={() => changeStage(NEXT_STAGE[plant.growth_stage])}
              disabled={busy || replanning}
            >
              It&apos;s grown a stage 🌱
            </GlassButton>
          )}
        </div>

        {/* Home-view avatar — choose how this plant and its pot look in 3D. */}
        <div className="flex flex-col gap-3 rounded-xl border border-glass-edge bg-[rgba(255,255,255,0.04)] px-4 py-3">
          <span className="flex items-center gap-2 text-sm text-leaf-2nd">
            <Palette className="size-4 text-sage" aria-hidden /> Look in your home
          </span>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-leaf-mut">Plant</span>
              <select
                value={plant.plant_look ?? ""}
                disabled={busy}
                onChange={(e) => patch({ plant_look: e.target.value === "" ? null : e.target.value })}
                aria-label="Plant look in the 3D home"
                className="w-full rounded-lg border border-glass-edge bg-[rgba(255,255,255,0.05)] px-3 py-2 text-leaf-100 outline-none focus-visible:outline-2 focus-visible:outline-sage [&>option]:bg-forest-900"
              >
                <option value="">Auto (from species)</option>
                <option value="monstera">Monstera</option>
                <option value="fern">Fern</option>
                <option value="palm">Palm</option>
                <option value="banana">Banana</option>
                <option value="cannabis">Chalice 🌿</option>
                <option value="flower">Daisies 🌼</option>
                <option value="lily">Peace lily 🤍</option>
                <option value="orchid">Orchid 🌸</option>
                <option value="violet">African violet 💜</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-leaf-mut">Pot</span>
              <select
                value={plant.pot_look ?? ""}
                disabled={busy}
                onChange={(e) => patch({ pot_look: e.target.value === "" ? null : e.target.value })}
                aria-label="Pot look in the 3D home"
                className="w-full rounded-lg border border-glass-edge bg-[rgba(255,255,255,0.05)] px-3 py-2 text-leaf-100 outline-none focus-visible:outline-2 focus-visible:outline-sage [&>option]:bg-forest-900"
              >
                <option value="">Auto</option>
                <option value="twotone">Two-tone (teal + terracotta)</option>
                <option value="terracotta">Terracotta</option>
                <option value="teal">Teal</option>
                <option value="rasta">Rasta (red · gold · green)</option>
                <option value="sand">Sand</option>
              </select>
            </label>
          </div>
        </div>

        {editing && edits && (
          <div className="flex flex-col gap-4 rounded-xl border border-glass-edge bg-[rgba(255,255,255,0.04)] p-4">
            <GlassInput
              label="Name"
              value={edits.name}
              onChange={(e) => setEdits({ ...edits, name: e.target.value })}
            />

            <GlassInput
              label="Species"
              placeholder="e.g. Monstera deliciosa"
              value={edits.species}
              onChange={(e) => setEdits({ ...edits, species: e.target.value })}
            />
            <GlassInput
              label="Also known as"
              placeholder="common name"
              value={edits.common_name}
              onChange={(e) => setEdits({ ...edits, common_name: e.target.value })}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <EditSelect
                label="Light"
                value={edits.light}
                onChange={(v) => setEdits({ ...edits, light: v as LightLevel | "" })}
                options={[
                  { value: "", label: "—" },
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "bright", label: "Bright" },
                ]}
              />
              <EditSelect
                label="Humidity"
                value={edits.humidity}
                onChange={(v) => setEdits({ ...edits, humidity: v as HumidityLevel | "" })}
                options={[
                  { value: "", label: "—" },
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" },
                ]}
              />
              <EditSelect
                label="Care level"
                value={edits.care_level}
                onChange={(v) => setEdits({ ...edits, care_level: v as CareLevel | "" })}
                options={[
                  { value: "", label: "—" },
                  { value: "easy", label: "Easy" },
                  { value: "moderate", label: "Moderate" },
                  { value: "expert", label: "Expert" },
                ]}
              />
            </div>

            <GlassInput
              label="When to water"
              placeholder="e.g. when the top 2cm of soil is dry"
              value={edits.soil_check}
              onChange={(e) => setEdits({ ...edits, soil_check: e.target.value })}
              hint="The watering schedule itself is the botanist's — ask it to re-plan if that seems off."
            />

            <div className="flex flex-wrap items-center gap-2.5">
              <GlassButton
                variant="primary"
                size="sm"
                onClick={saveEdits}
                loading={busy}
                disabled={!edits.name.trim()}
              >
                Save changes
              </GlassButton>
              <GlassButton
                variant="ghost"
                size="sm"
                onClick={() => replan()}
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

        {/* AI health checkup — a photo of the worrying leaves and/or a note
            goes to the botanist with the plant's real watering record. */}
        <div className="rounded-xl border border-glass-edge bg-[rgba(255,255,255,0.04)] p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-medium text-leaf-100">
            <HeartPulse className="size-4 text-alert" aria-hidden /> Health check
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => healthFileRef.current?.click()}
              className="glass glass-interactive flex min-h-24 flex-col items-center justify-center gap-2 border-dashed p-4 text-leaf-2nd"
              aria-label={
                healthPhoto
                  ? "Change the health-check photo"
                  : "Add a photo of the worrying leaves"
              }
            >
              {healthPhoto ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={healthPhoto}
                  alt="The worrying leaves"
                  className="max-h-40 rounded-xl object-contain"
                />
              ) : (
                <>
                  <Camera className="size-6 text-sage" aria-hidden />
                  <span className="text-sm">
                    Snap or upload the worrying leaves
                  </span>
                </>
              )}
            </button>
            {/* Two inputs on purpose: `capture` forces the camera and hides
                the gallery, and its absence does the reverse on some Androids
                — so each explicit button gets its own input. */}
            <input
              ref={healthFileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={pickHealthPhoto}
            />
            <input
              ref={healthCameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={pickHealthPhoto}
            />
            <div className="flex gap-2.5">
              <GlassButton
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => healthCameraRef.current?.click()}
              >
                <Camera className="size-4" aria-hidden /> Take photo
              </GlassButton>
              <GlassButton
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => healthFileRef.current?.click()}
              >
                <ImageUp className="size-4" aria-hidden /> Upload
              </GlassButton>
            </div>

            <GlassInput
              label="What worries you?"
              placeholder="e.g. yellowing lower leaves, brown crispy tips…"
              value={healthNote}
              onChange={(e) => setHealthNote(e.target.value)}
            />

            <div>
              <GlassButton
                variant="primary"
                size="sm"
                onClick={runHealthCheck}
                disabled={!healthPhoto && !healthNote.trim()}
                loading={healthChecking}
              >
                {!healthChecking && <HeartPulse className="size-4" aria-hidden />}
                {healthChecking ? "Checking…" : "Check with the botanist"}
              </GlassButton>
            </div>

            {healthResult && (
              <div
                className={`rounded-xl border p-4 ${SEVERITY_CARD[healthResult.severity]}`}
              >
                <p className="text-sm font-semibold text-leaf-100">
                  {healthResult.summary}
                </p>
                <p className="mt-1.5 text-sm text-leaf-2nd">
                  {healthResult.diagnosis}
                </p>
                {healthResult.advice.length > 0 && (
                  <ul className="mt-2 flex flex-col gap-1.5 text-sm text-leaf-2nd">
                    {healthResult.advice.map((a, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-sage" aria-hidden>—</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                )}
                {healthResult.suggested_stage &&
                  healthResult.suggested_stage !== plant.growth_stage && (
                    <GlassButton
                      variant="ghost"
                      size="sm"
                      className="mt-3"
                      onClick={() => changeStage(healthResult.suggested_stage!)}
                      disabled={busy || replanning}
                    >
                      The botanist thinks it&apos;s reached{" "}
                      {STAGE_PHRASE[healthResult.suggested_stage]} — advance?
                    </GlassButton>
                  )}
              </div>
            )}

            {pastChecks.length > 0 && (
              <div className="flex flex-col gap-1.5 border-t border-[rgba(255,255,255,0.07)] pt-3">
                <p className="text-xs font-medium text-leaf-mut">Past checks</p>
                {pastChecks.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-2.5 text-xs text-leaf-2nd"
                  >
                    <span
                      className={`size-2 shrink-0 rounded-full ${SEVERITY_DOT[c.severity]}`}
                      aria-hidden
                    />
                    <span className="shrink-0 text-leaf-mut">
                      {new Date(c.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="truncate">{c.summary}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
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
