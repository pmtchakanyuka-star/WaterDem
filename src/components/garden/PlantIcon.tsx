import {
  Clover,
  Flower,
  Flower2,
  Leaf,
  Shrub,
  Sprout,
  TreeDeciduous,
  TreePalm,
  Trees,
  Vegan,
  type LucideIcon,
} from "lucide-react";

/**
 * Plant "avatar" when no photo exists: a tinted Lucide glyph on a glass tile
 * (brief §1 — never an emoji).
 */

const ICONS: Record<string, LucideIcon> = {
  leaf: Leaf,
  sprout: Sprout,
  flower: Flower,
  "flower-2": Flower2,
  trees: Trees,
  "tree-palm": TreePalm,
  "tree-deciduous": TreeDeciduous,
  vegan: Vegan,
  shrub: Shrub,
  clover: Clover,
};

export function plantIcon(iconKey: string | null): LucideIcon {
  return ICONS[iconKey ?? "leaf"] ?? Leaf;
}

export default function PlantIcon({
  iconKey,
  size = 28,
  className = "",
}: {
  iconKey: string | null;
  size?: number;
  className?: string;
}) {
  const Icon = plantIcon(iconKey);
  return <Icon size={size} className={className} aria-hidden />;
}
