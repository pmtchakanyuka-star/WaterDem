import { Sprout } from "lucide-react";
import GlassCard from "@/components/glass/GlassCard";

/** Shared centered glass panel for the login/signup screens. */
export default function AuthShell({
  heading,
  sub,
  children,
}: {
  heading: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-3xl border border-[rgba(110,231,168,0.25)] bg-[rgba(110,231,168,0.10)]">
            <Sprout className="size-7 text-sage" aria-hidden />
          </div>
          <h1 className="font-display text-4xl text-leaf-100">{heading}</h1>
          <p className="mt-2 text-sm text-leaf-2nd">{sub}</p>
        </div>
        <GlassCard padding="roomy">{children}</GlassCard>
      </div>
    </main>
  );
}
