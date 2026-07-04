import Link from "next/link";

/**
 * An icon-only navigation control that IS the link — avoids the invalid
 * <a><button></a> nesting (and the duplicate tab stop) you get from wrapping
 * a GlassButton in a Link. Visually matches GlassButton's "icon" variant.
 */
export default function GlassIconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={
        "inline-flex items-center justify-center rounded-full border p-2.5 " +
        "bg-glass-fill border-glass-edge text-leaf-2nd backdrop-blur-xl " +
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] transition-all duration-150 " +
        "hover:-translate-y-0.5 hover:text-sage hover:border-glass-edge-hi hover:bg-glass-fill-hi"
      }
    >
      {children}
    </Link>
  );
}
