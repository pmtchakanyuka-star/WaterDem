import { PawPrint, ShieldAlert, ShieldCheck } from "lucide-react";
import type { PetSafety } from "@/lib/types";

/**
 * Pet-safety chip (ASPCA-grounded, set by the AI botanist). Colour + icon +
 * text label so it never relies on colour alone.
 */

const CONFIG: Record<
  PetSafety,
  { label: string; icon: typeof PawPrint; className: string }
> = {
  toxic: {
    label: "Toxic to pets",
    icon: ShieldAlert,
    className: "border-[rgba(248,113,113,0.35)] bg-[rgba(248,113,113,0.12)] text-[#F8B4B4]",
  },
  mild: {
    label: "Mildly toxic to pets",
    icon: PawPrint,
    className: "border-[rgba(251,191,36,0.35)] bg-[rgba(251,191,36,0.12)] text-[#FCD989]",
  },
  safe: {
    label: "Pet-safe",
    icon: ShieldCheck,
    className: "border-[rgba(110,231,168,0.35)] bg-[rgba(110,231,168,0.12)] text-sage",
  },
};

export default function PetSafetyBadge({
  safety,
  size = "md",
}: {
  safety: PetSafety | null;
  size?: "sm" | "md";
}) {
  if (!safety) return null;
  const { label, icon: Icon, className } = CONFIG[safety];
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        className,
      ].join(" ")}
    >
      <Icon className={size === "sm" ? "size-3" : "size-3.5"} aria-hidden />
      {label}
    </span>
  );
}
