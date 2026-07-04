import { forwardRef } from "react";

type GlassCardProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Adds hover lift + border brighten for clickable cards. */
  interactive?: boolean;
  /** Tighter padding for compact tiles. */
  padding?: "none" | "snug" | "default" | "roomy";
};

const PADDING: Record<NonNullable<GlassCardProps["padding"]>, string> = {
  none: "",
  snug: "p-3",
  default: "p-5",
  roomy: "p-7",
};

/**
 * Frosted glass surface: translucent fill, 1px edge, blur(24px), and the
 * inset top highlight ("lit glass rim") that sells the material.
 */
const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  function GlassCard(
    { interactive = false, padding = "default", className = "", ...rest },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={[
          "glass",
          interactive ? "glass-interactive cursor-pointer" : "",
          PADDING[padding],
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      />
    );
  },
);

export default GlassCard;
