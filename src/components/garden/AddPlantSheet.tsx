"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Droplet, Sparkles, Sprout } from "lucide-react";
import Sheet from "@/components/garden/Sheet";
import GlassButton from "@/components/glass/GlassButton";
import GlassInput from "@/components/glass/GlassInput";
import PlantIcon from "@/components/garden/PlantIcon";
import { useToast } from "@/components/Toast";
import type { IdentifyResult, LightLevel, Plant } from "@/lib/types";

/**
 * Add-plant flow: a photo and/or whatever details the user knows (name,
 * species, light at its spot) go to the AI botanist, which returns the care
 * plan INCLUDING the watering frequency — the schedule is always the AI's
 * advisory, never user input. Identify stays disabled until something is
 * provided (Nielsen #5); a manual path covers AI-unavailable setups with a
 * sensible default schedule.
 */

type Step = "capture" | "review";

const SPOT_LIGHT_OPTIONS: { value: LightLevel | ""; label: string }[] = [
  { value: "", label: "Not sure" },
  { value: "low", label: "Low — away from windows" },
  { value: "medium", label: "Medium — bright indirect" },
  { value: "bright", label: "Bright — near a window" },
];

async function downscaleToDataUrl(file: File, maxDim = 1024): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export default function AddPlantSheet({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (plant: Plant) => void;
}) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("capture");
  const [photo, setPhoto] = useState<string | null>(null);
  const [hint, setHint] = useState("");
  const [species, setSpecies] = useState("");
  const [spotLight, setSpotLight] = useState<LightLevel | "">("");
  const [identifying, setIdentifying] = useState(false);
  const [identifyError, setIdentifyError] = useState<string | null>(null);
  const [aiUnavailable, setAiUnavailable] = useState(false);

  const [profile, setProfile] = useState<Partial<IdentifyResult>>({});
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [aiPlanned, setAiPlanned] = useState(false);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setStep("capture");
    setPhoto(null);
    setHint("");
    setSpecies("");
    setSpotLight("");
    setIdentifying(false);
    setIdentifyError(null);
    setAiUnavailable(false);
    setProfile({});
    setImageUrl(null);
    setConfidence(null);
    setAiPlanned(false);
    setSaving(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const hasAnyInput = !!photo || !!hint.trim() || !!species.trim();

  const pickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setPhoto(await downscaleToDataUrl(file));
      setIdentifyError(null);
    } catch {
      toast("error", "Couldn't read that image — try another.");
    }
  };

  const identify = async () => {
    setIdentifying(true);
    setIdentifyError(null);
    try {
      const res = await fetch("/api/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: photo ?? undefined,
          hint: hint || undefined,
          details: {
            species: species || undefined,
            spotLight: spotLight || undefined,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.aiUnavailable) setAiUnavailable(true);
        setIdentifyError(data.error ?? "Couldn't identify — try again.");
        return;
      }
      setProfile(data.profile);
      setImageUrl(data.imageUrl ?? null);
      setConfidence(data.profile.confidence ?? null);
      setAiPlanned(true);
      if (photo && data.photoSaved === false) {
        toast(
          "info",
          "Identified! The photo couldn't be saved though — a leaf icon will stand in.",
        );
      }
      setStep("review");
    } catch {
      setIdentifyError("Couldn't reach the botanist — check your connection.");
    } finally {
      setIdentifying(false);
    }
  };

  const manualEntry = () => {
    setProfile({
      name: hint || species || "",
      species: species || undefined,
      light: spotLight || undefined,
      iconKey: "sprout",
      waterFreqDays: 7,
    });
    setImageUrl(null);
    setConfidence(null);
    setAiPlanned(false);
    setStep("review");
  };

  const save = async () => {
    if (!profile.name?.trim()) {
      toast("error", "Give your plant a name first.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/plants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          species: profile.species,
          common_name: profile.commonName,
          image_url: imageUrl,
          icon_key: profile.iconKey,
          water_freq_days: profile.waterFreqDays,
          care_level: profile.careLevel,
          light: profile.light,
          humidity: profile.humidity,
          soil_check: profile.soilCheck,
          weather_note: profile.weatherNote,
          nutrients: profile.nutrients,
          weekly_tips: profile.weeklyTips,
          fun_facts: profile.funFacts,
          pet_safety: profile.petSafety,
          pet_safety_note: profile.petSafetyNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast("error", data.error ?? "Couldn't save — try again.");
        return;
      }
      toast("success", `${data.name} joined your garden.`);
      onSaved(data);
      close();
    } catch {
      toast("error", "Couldn't save — check your connection.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={close}
      title={step === "capture" ? "Add a plant" : "Meet your plant"}
    >
      {step === "capture" ? (
        <div className="flex flex-col gap-5">
          <button
            onClick={() => fileRef.current?.click()}
            className="glass glass-interactive flex min-h-40 flex-col items-center justify-center gap-3 border-dashed p-6 text-leaf-2nd"
            aria-label={photo ? "Change photo" : "Add a photo"}
          >
            {photo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={photo}
                alt="Your plant"
                className="max-h-52 rounded-xl object-contain"
              />
            ) : (
              <>
                <Camera className="size-8 text-sage" aria-hidden />
                <span className="text-sm">
                  Snap or upload a photo of your plant
                </span>
                <span className="text-xs text-leaf-mut">
                  JPG or PNG — a clear shot of the leaves works best
                </span>
              </>
            )}
          </button>
          {/* No `capture` attribute — that forces the camera on mobile and
              hides the gallery. Without it the native picker offers both
              "take photo" and "choose from library". */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={pickPhoto}
          />

          <GlassInput
            label="What do you call it?"
            placeholder="e.g. Fernando, monstera, snake plant…"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            error={identifyError ?? undefined}
          />

          <GlassInput
            label="Species — if you have an idea"
            placeholder="e.g. Monstera deliciosa"
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            hint="Optional — every detail sharpens the botanist's care plan."
          />

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="spot-light"
              className="text-sm font-medium text-leaf-2nd"
            >
              Light where it sits
            </label>
            <select
              id="spot-light"
              value={spotLight}
              onChange={(e) => setSpotLight(e.target.value as LightLevel | "")}
              className="w-full rounded-xl border border-glass-edge bg-[rgba(255,255,255,0.05)] px-4 py-2.5 text-leaf-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.10)] backdrop-blur-xl outline-none focus-visible:outline-2 focus-visible:outline-sage focus-visible:outline-offset-2 [&>option]:bg-forest-900"
            >
              {SPOT_LIGHT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-leaf-mut">
              Brighter, warmer spots dry out faster — the botanist folds this
              into the watering schedule.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <GlassButton
              variant="primary"
              onClick={identify}
              disabled={!hasAnyInput}
              loading={identifying}
            >
              {!identifying && <Sparkles className="size-4" aria-hidden />}
              {identifying ? "Consulting the botanist…" : "Identify & plan care"}
            </GlassButton>
            <GlassButton variant="ghost" onClick={manualEntry} disabled={!hasAnyInput}>
              Skip the botanist
            </GlassButton>
            {aiUnavailable && (
              <p className="w-full text-xs text-leaf-mut">
                The AI botanist isn&apos;t configured on this server yet —
                fill in what you know above, then &ldquo;Skip the
                botanist&rdquo; to add the plant anyway.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            {imageUrl ? (
              <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl border border-glass-edge">
                <Image
                  src={imageUrl}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl border border-[rgba(110,231,168,0.22)] bg-[rgba(110,231,168,0.10)]">
                <PlantIcon iconKey={profile.iconKey ?? "sprout"} className="text-sage" size={36} />
              </div>
            )}
            <div className="min-w-0">
              {profile.species && (
                <p className="truncate text-sm italic text-leaf-2nd">
                  {profile.species}
                </p>
              )}
              {profile.commonName && (
                <p className="truncate text-xs text-leaf-mut">
                  also known as {profile.commonName}
                </p>
              )}
              {confidence !== null && (
                <p className="mt-1 text-xs text-leaf-mut">
                  {Math.round(confidence * 100)}% sure — correct anything below.
                </p>
              )}
            </div>
          </div>

          <GlassInput
            label="Name"
            value={profile.name ?? ""}
            onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
            placeholder="What do you call this one?"
          />

          {/* The watering schedule is the botanist's advisory — displayed,
              never edited. */}
          <div className="flex items-center gap-3 rounded-xl border border-[rgba(110,231,168,0.18)] bg-[rgba(110,231,168,0.05)] px-4 py-3">
            <Droplet className="size-5 shrink-0 text-sage" aria-hidden />
            <div className="text-sm">
              <p className="text-leaf-100">
                Water about every{" "}
                <span className="font-display">
                  {profile.waterFreqDays ?? 7} days
                </span>
              </p>
              <p className="mt-0.5 text-xs text-leaf-mut">
                {aiPlanned
                  ? "The botanist set this from the species and your spot — it adapts to your weather each week."
                  : "A starting default that adapts to your weather each week — you can ask the botanist to re-plan it anytime from the plant's page."}
              </p>
            </div>
          </div>

          {(profile.weeklyTips?.length ?? 0) > 0 && (
            <div className="rounded-xl border border-glass-edge bg-[rgba(255,255,255,0.04)] p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-medium text-leaf-2nd">
                <Sprout className="size-4 text-sage" aria-hidden /> Care plan
                preview
              </p>
              <ul className="flex flex-col gap-1.5 text-sm text-leaf-2nd">
                {profile.weeklyTips!.slice(0, 3).map((tip, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-sage" aria-hidden>
                      —
                    </span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-3">
            <GlassButton variant="primary" onClick={save} loading={saving}>
              Add to my garden
            </GlassButton>
            <GlassButton variant="ghost" onClick={() => setStep("capture")}>
              Back
            </GlassButton>
          </div>
        </div>
      )}
    </Sheet>
  );
}
