"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "ghost" | "danger" | "icon";
type Size = "sm" | "md" | "lg";

type GlassButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

const BASE =
  "inline-flex items-center justify-center gap-2 font-medium select-none " +
  "rounded-full border backdrop-blur-xl transition-all duration-150 " +
  "disabled:opacity-45 disabled:pointer-events-none " +
  "active:translate-y-0 hover:-translate-y-0.5";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-[rgba(110,231,168,0.14)] border-[rgba(110,231,168,0.35)] text-sage " +
    "shadow-[0_4px_20px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.18)] " +
    "hover:bg-[rgba(110,231,168,0.20)] hover:border-[rgba(110,231,168,0.5)]",
  ghost:
    "bg-glass-fill border-glass-edge text-leaf-100 " +
    "shadow-[0_4px_20px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.14)] " +
    "hover:bg-glass-fill-hi hover:border-glass-edge-hi",
  danger:
    "bg-[rgba(248,113,113,0.10)] border-[rgba(248,113,113,0.30)] text-[#F8B4B4] " +
    "shadow-[0_4px_20px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.10)] " +
    "hover:bg-[rgba(248,113,113,0.16)] hover:border-[rgba(248,113,113,0.45)]",
  icon:
    "bg-glass-fill border-glass-edge text-leaf-2nd " +
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] " +
    "hover:text-sage hover:border-glass-edge-hi hover:bg-glass-fill-hi",
};

const SIZES: Record<Size, string> = {
  sm: "text-sm px-3.5 py-1.5",
  md: "text-sm px-5 py-2.5",
  lg: "text-base px-7 py-3",
};

const ICON_SIZES: Record<Size, string> = {
  sm: "p-1.5",
  md: "p-2.5",
  lg: "p-3",
};

const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  function GlassButton(
    {
      variant = "ghost",
      size = "md",
      loading = false,
      className = "",
      children,
      disabled,
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={[
          BASE,
          VARIANTS[variant],
          variant === "icon" ? ICON_SIZES[size] : SIZES[size],
          className,
        ].join(" ")}
        {...rest}
      >
        {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {children}
      </button>
    );
  },
);

export default GlassButton;
