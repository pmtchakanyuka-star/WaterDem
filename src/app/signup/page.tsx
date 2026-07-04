"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import GlassButton from "@/components/glass/GlassButton";
import GlassInput from "@/components/glass/GlassInput";

const NICKNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

export default function SignupPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Live availability check (Nielsen #5 — error prevention).
  const [availability, setAvailability] = useState<"unknown" | "checking" | "free" | "taken">("unknown");
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (checkTimer.current) clearTimeout(checkTimer.current);
    if (!NICKNAME_RE.test(nickname)) {
      setAvailability("unknown");
      return;
    }
    setAvailability("checking");
    checkTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/auth/signup?nickname=${encodeURIComponent(nickname)}`,
        );
        const data = await res.json();
        setAvailability(data.available ? "free" : "taken");
      } catch {
        setAvailability("unknown");
      }
    }, 350);
  }, [nickname]);

  const nicknameHint =
    nickname && !NICKNAME_RE.test(nickname)
      ? undefined
      : "3–20 letters, numbers or underscores — this is your public handle.";
  const nicknameError =
    nickname && !NICKNAME_RE.test(nickname)
      ? "3–20 letters, numbers or underscores only."
      : availability === "taken"
        ? "That handle is taken — try another."
        : undefined;
  const nicknameSuccess =
    availability === "free" ? "Available — it's yours if you want it." : undefined;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't sign up — try again.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Couldn't reach the garden — check your connection.");
    } finally {
      setBusy(false);
    }
  };

  const passwordError =
    password && password.length < 8
      ? "At least 8 characters."
      : (error ?? undefined);

  return (
    <AuthShell
      heading="Start your garden"
      sub="A nickname and a password — that's all it takes."
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <GlassInput
          label="Nickname"
          autoComplete="username"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="e.g. fernando"
          hint={nicknameHint}
          error={nicknameError}
          success={nicknameSuccess}
          autoFocus
        />
        <GlassInput
          label="Password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="at least 8 characters"
          error={passwordError}
        />
        <GlassButton
          type="submit"
          variant="primary"
          loading={busy}
          disabled={
            !NICKNAME_RE.test(nickname) ||
            password.length < 8 ||
            availability === "taken"
          }
          className="mt-1 w-full"
        >
          Plant my garden
        </GlassButton>
      </form>
      <p className="mt-5 text-center text-sm text-leaf-2nd">
        Already growing?{" "}
        <Link href="/login" className="font-medium text-sage hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
