import { toRoomKey } from "@/lib/home";
import type { Plant, PlantLook, PotLook } from "@/lib/types";

const PLANT_LOOKS: PlantLook[] = ["monstera", "fern", "palm", "banana", "cannabis"];
const POT_LOOKS: PotLook[] = ["twotone", "terracotta", "teal", "rasta", "sand"];

/**
 * postgres.js (over the transaction pooler) returns jsonb columns as raw
 * strings — normalize plant rows once, at the DB boundary, so the rest of
 * the app can rely on real arrays.
 */
export function normalizePlant(row: Record<string, unknown>): Plant {
  const arr = (v: unknown): string[] => {
    if (Array.isArray(v)) return v.filter((s) => typeof s === "string");
    if (typeof v === "string") {
      try {
        const parsed = JSON.parse(v);
        return Array.isArray(parsed)
          ? parsed.filter((s) => typeof s === "string")
          : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const ts = (v: unknown): string | null =>
    v instanceof Date ? v.toISOString() : typeof v === "string" ? v : null;

  const oneOf = <T extends string>(v: unknown, allowed: T[]): T | null =>
    typeof v === "string" && (allowed as string[]).includes(v) ? (v as T) : null;

  return {
    ...(row as unknown as Plant),
    nutrients: arr(row.nutrients),
    weekly_tips: arr(row.weekly_tips),
    fun_facts: arr(row.fun_facts),
    room: toRoomKey(row.room),
    plant_look: oneOf(row.plant_look, PLANT_LOOKS),
    pot_look: oneOf(row.pot_look, POT_LOOKS),
    last_watered: ts(row.last_watered),
    created_at: ts(row.created_at) ?? "",
  };
}
