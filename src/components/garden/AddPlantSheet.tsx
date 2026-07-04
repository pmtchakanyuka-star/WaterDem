"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Sparkles, Sprout } from "lucide-react";
import Sheet from "@/components/garden/Sheet";
import GlassButton from "@/components/glass/GlassButton";
import GlassInput from "@/components/glass/GlassInput";
import PlantIcon from "@/components/garden/PlantIcon";
import { useToast } from "@/components/Toast";
import type { IdentifyResult, Plant } from "@/lib/types";

/**
 * Add-plant flow: photo and/or name hint -> AI identification -> editable
 * review -> save. Identify stays disabled until a photo or hint exists
 * (Nielsen #5); a manual path covers AI-unavailable setups.
 */

type Step = "capture" | "review";

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
  const [identifying, setIdentifying] = useState(false);
  const [identifyError, setIdentifyError] = useState<string | null>(null);
  const [aiUnavailable, setAiUnavailable] = useState(false);

  const [profile, setProfile] = useState<Partial<IdentifyResult>>({});
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setStep("capture");
    setPhoto(null);
    setHint("");
    setIdentifying(false);
    setIdentifyError(null);
    setProfile({});
    setImageUrl(null);
    setConfidence(null);
    setSaving(false);
  };

  const close = () => {
    reset();
    onClose();
  };

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
      setStep("review");
    } catch {
      setIdentifyError("Couldn't reach the identifier — check your connection.");
    } finally {
      setIdentifying(false);
    }
  };

  const manualEntry = () => {
    setProfile({
      name: hint || "",
      iconKey: "sprout",
      waterFreqDays: 7,
    });
    setImageUrl(null);
    setConfidence(null);
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
            className="glass glass-interactive flex min-h-44 flex-col items-center justify-center gap-3 border-dashed p-6 text-leaf-2nd"
            aria-label={photo ? "Change photo" : "Add a photo"}
          >
            {photo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={photo}
                alt="Your plant"
                className="max-h-56 rounded-xl object-contain"
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
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={pickPhoto}
          />

          <GlassInput
            label="Or tell me what it is"
            placeholder="e.g. monstera, snake plant…"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            hint="A photo, a name, or both — then let the botanist look."
            error={identifyError ?? undefined}
          />

          <div className="flex flex-wrap items-center gap-3">
            <GlassButton
              variant="primary"
              onClick={identify}
              disabled={!photo && !hint.trim()}
              loading={identifying}
            >
              {!identifying && <Sparkles className="size-4" aria-hidden />}
              {identifying ? "Identifying…" : "Identify"}
            </GlassButton>
            <GlassButton variant="ghost" onClick={manualEntry}>
              Enter details myself
            </GlassButton>
            {aiUnavailable && (
              <p className="w-full text-xs text-leaf-mut">
                The AI botanist isn&apos;t configured on this server yet —
                manual entry still works.
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

          <GlassInput
            label="Water every (days)"
            type="number"
            min={1}
            max={90}
            value={profile.waterFreqDays ?? 7}
            onChange={(e) =>
              setProfile((p) => ({ ...p, waterFreqDays: Number(e.target.value) }))
            }
          />

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
