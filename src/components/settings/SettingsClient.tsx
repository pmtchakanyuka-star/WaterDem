"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Copy,
  Eye,
  EyeOff,
  LocateFixed,
  MapPin,
  UserPlus,
  X,
} from "lucide-react";
import GlassCard from "@/components/glass/GlassCard";
import GlassButton from "@/components/glass/GlassButton";
import GlassInput from "@/components/glass/GlassInput";
import { ToastProvider, useToast } from "@/components/Toast";
import type { GardenShare, UserSettings } from "@/lib/types";
import type { GeocodeHit } from "@/lib/weather";

function SettingsInner({
  user,
  initialShares,
}: {
  user: UserSettings;
  initialShares: GardenShare[];
}) {
  const { toast } = useToast();

  const [isPublic, setIsPublic] = useState(user.garden_is_public);
  const [locationLabel, setLocationLabel] = useState(user.location_label);
  const [citySearch, setCitySearch] = useState("");
  const [cityResults, setCityResults] = useState<GeocodeHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [shares, setShares] = useState<GardenShare[]>(initialShares);
  const [inviteName, setInviteName] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced city search via open-meteo geocoding.
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (citySearch.trim().length < 2) {
      setCityResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(citySearch)}`);
        const data = await res.json();
        setCityResults(data.results ?? []);
      } catch {
        setCityResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  }, [citySearch]);

  const saveLocation = async (loc: { lat: number; lon: number; label: string } | null) => {
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location: loc }),
    }).catch(() => null);
    if (!res?.ok) {
      toast("error", "Couldn't save your location.");
      return;
    }
    setLocationLabel(loc?.label ?? null);
    setCitySearch("");
    setCityResults([]);
    toast("success", loc ? `Weather set to ${loc.label}.` : "Location cleared.");
  };

  const useGps = () => {
    if (!navigator.geolocation) {
      toast("error", "Your browser doesn't offer location access.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        saveLocation({
          lat: Math.round(pos.coords.latitude * 1000) / 1000,
          lon: Math.round(pos.coords.longitude * 1000) / 1000,
          label: "My location",
        }),
      () => toast("error", "Couldn't read your location — try city search."),
    );
  };

  const togglePublic = async () => {
    const next = !isPublic;
    setIsPublic(next); // optimistic
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ garden_is_public: next }),
    }).catch(() => null);
    if (!res?.ok) {
      setIsPublic(!next);
      toast("error", "Couldn't update your garden's visibility.");
      return;
    }
    toast(
      "success",
      next
        ? "Your garden is now public — anyone with the link can visit."
        : "Your garden is private again.",
    );
  };

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setInviteMsg(null);
    try {
      const res = await fetch("/api/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: inviteName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteMsg({ ok: false, text: data.error ?? "Couldn't invite." });
        return;
      }
      setShares((s) => [
        {
          id: data.id,
          viewer_id: data.viewer.id,
          viewer_nickname: data.viewer.nickname,
          created_at: new Date().toISOString(),
        },
        ...s,
      ]);
      setInviteName("");
      setInviteMsg({
        ok: true,
        text: `${data.viewer.nickname} can now see your public plants.`,
      });
    } catch {
      setInviteMsg({ ok: false, text: "Couldn't invite — check your connection." });
    } finally {
      setInviting(false);
    }
  };

  const revoke = async (share: GardenShare) => {
    const res = await fetch(`/api/shares?id=${share.id}`, {
      method: "DELETE",
    }).catch(() => null);
    if (!res?.ok) {
      toast("error", "Couldn't remove that invite.");
      return;
    }
    setShares((s) => s.filter((x) => x.id !== share.id));
    toast("info", `${share.viewer_nickname} can no longer see your garden.`);
  };

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/g/${user.nickname}`
      : `/g/${user.nickname}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast("error", "Couldn't copy — select the link text instead.");
    }
  };

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-8 sm:px-8">
      <header className="flex items-center gap-3">
        <Link href="/" aria-label="Back to your garden">
          <GlassButton variant="icon" aria-label="Back to your garden">
            <ArrowLeft className="size-4" aria-hidden />
          </GlassButton>
        </Link>
        <h1 className="font-display text-3xl text-leaf-100">Settings</h1>
      </header>

      {/* Weather location */}
      <GlassCard className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-sage" aria-hidden />
          <h2 className="font-display text-xl text-leaf-100">Weather</h2>
        </div>
        <p className="text-sm text-leaf-2nd">
          {locationLabel
            ? `Watering advice currently follows the weather in ${locationLabel}.`
            : "Set a location and watering advice will follow your weather — hot or dry days mean water sooner."}
        </p>
        <div className="relative">
          <GlassInput
            label="City"
            placeholder="Search a city…"
            value={citySearch}
            onChange={(e) => setCitySearch(e.target.value)}
            hint={searching ? "Searching…" : undefined}
          />
          {cityResults.length > 0 && (
            <ul className="glass absolute inset-x-0 top-full z-10 mt-2 flex flex-col overflow-hidden p-1.5">
              {cityResults.map((c, i) => (
                <li key={`${c.latitude},${c.longitude},${i}`}>
                  <button
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-leaf-100 hover:bg-[rgba(255,255,255,0.07)]"
                    onClick={() =>
                      saveLocation({ lat: c.latitude, lon: c.longitude, label: c.label })
                    }
                  >
                    {c.name}
                    <span className="text-leaf-mut">
                      {" "}
                      — {[c.admin1, c.country].filter(Boolean).join(", ")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-wrap gap-2.5">
          <GlassButton variant="ghost" size="sm" onClick={useGps}>
            <LocateFixed className="size-4" aria-hidden /> Use my location
          </GlassButton>
          {locationLabel && (
            <GlassButton variant="ghost" size="sm" onClick={() => saveLocation(null)}>
              <X className="size-4" aria-hidden /> Clear location
            </GlassButton>
          )}
        </div>
      </GlassCard>

      {/* Garden visibility */}
      <GlassCard className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          {isPublic ? (
            <Eye className="size-4 text-sage" aria-hidden />
          ) : (
            <EyeOff className="size-4 text-leaf-mut" aria-hidden />
          )}
          <h2 className="font-display text-xl text-leaf-100">Garden visibility</h2>
        </div>
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm text-leaf-2nd">
            {isPublic
              ? "Anyone with your link can view the plants you've marked visible."
              : "Only friends you invite can view the plants you've marked visible."}
            <span className="mt-1 block text-xs text-leaf-mut">
              Each plant has its own visibility switch — private plants never
              show, whatever this setting says.
            </span>
          </p>
          <button
            role="switch"
            aria-checked={isPublic}
            aria-label="Make my garden public"
            onClick={togglePublic}
            className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors ${
              isPublic
                ? "border-[rgba(110,231,168,0.5)] bg-[rgba(110,231,168,0.25)]"
                : "border-glass-edge bg-[rgba(255,255,255,0.06)]"
            }`}
          >
            <span
              className={`absolute top-0.5 size-5 rounded-full transition-all ${
                isPublic ? "left-6 bg-sage" : "left-0.5 bg-leaf-mut"
              }`}
            />
          </button>
        </div>
        {isPublic && (
          <div className="flex items-center gap-2 rounded-xl border border-glass-edge bg-[rgba(255,255,255,0.04)] px-3 py-2">
            <span className="min-w-0 flex-1 truncate text-sm text-leaf-2nd">
              {publicUrl}
            </span>
            <GlassButton
              variant="icon"
              size="sm"
              onClick={copyLink}
              aria-label="Copy public garden link"
            >
              {copied ? (
                <Check className="size-4 text-sage" aria-hidden />
              ) : (
                <Copy className="size-4" aria-hidden />
              )}
            </GlassButton>
          </div>
        )}
      </GlassCard>

      {/* Invites */}
      <GlassCard className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <UserPlus className="size-4 text-sage" aria-hidden />
          <h2 className="font-display text-xl text-leaf-100">Invite friends</h2>
        </div>
        <p className="text-sm text-leaf-2nd">
          Invited friends can view your visible plants even while your garden
          stays private. Read-only — nobody waters your plants but you.
        </p>
        <form onSubmit={invite} className="flex items-end gap-2.5">
          <div className="flex-1">
            <GlassInput
              label="Friend's handle"
              placeholder="e.g. mossboss"
              value={inviteName}
              onChange={(e) => {
                setInviteName(e.target.value);
                setInviteMsg(null);
              }}
              error={inviteMsg && !inviteMsg.ok ? inviteMsg.text : undefined}
              success={inviteMsg?.ok ? inviteMsg.text : undefined}
            />
          </div>
          <GlassButton
            type="submit"
            variant="primary"
            loading={inviting}
            disabled={!inviteName.trim()}
            className={inviteMsg ? "mb-6" : ""}
          >
            Invite
          </GlassButton>
        </form>
        {shares.length > 0 && (
          <ul className="flex flex-col gap-2">
            {shares.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-glass-edge bg-[rgba(255,255,255,0.04)] px-3.5 py-2.5"
              >
                <span className="text-sm text-leaf-100">{s.viewer_nickname}</span>
                <GlassButton
                  variant="icon"
                  size="sm"
                  onClick={() => revoke(s)}
                  aria-label={`Stop sharing with ${s.viewer_nickname}`}
                >
                  <X className="size-4" aria-hidden />
                </GlassButton>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </main>
  );
}

export default function SettingsClient(props: {
  user: UserSettings;
  initialShares: GardenShare[];
}) {
  return (
    <ToastProvider>
      <SettingsInner {...props} />
    </ToastProvider>
  );
}
