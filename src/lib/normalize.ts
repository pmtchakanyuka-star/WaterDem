import { toRoomKey } from "@/lib/home";
import type { Plant } from "@/lib/types";

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

  return {
    ...(row as unknown as Plant),
    nutrients: arr(row.nutrients),
    weekly_tips: arr(row.weekly_tips),
    fun_facts: arr(row.fun_facts),
    room: toRoomKey(row.room),
    last_watered: ts(row.last_watered),
    created_at: ts(row.created_at) ?? "",
  };
}
