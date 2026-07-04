"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import GlassButton from "@/components/glass/GlassButton";
import GlassInput from "@/components/glass/GlassInput";

export default function LoginPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't sign in — try again.");
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

  return (
    <AuthShell heading="WaterDem" sub="Welcome back to your garden.">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <GlassInput
          label="Nickname"
          autoComplete="username"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="your handle"
          autoFocus
        />
        <GlassInput
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          error={error ?? undefined}
        />
        <GlassButton
          type="submit"
          variant="primary"
          loading={busy}
          disabled={!nickname || !password}
          className="mt-1 w-full"
        >
          Step into the garden
        </GlassButton>
      </form>
      <p className="mt-5 text-center text-sm text-leaf-2nd">
        New here?{" "}
        <Link href="/signup" className="font-medium text-sage hover:underline">
          Start your garden
        </Link>
      </p>
    </AuthShell>
  );
}
