import { toRoomKey } from "@/lib/home";
import { PLANT_LOOKS, POT_LOOKS } from "@/lib/types";
import type { GrowthStage, HealthCheck, Plant } from "@/lib/types";

const GROWTH_STAGES: GrowthStage[] = ["seed", "seedling", "young", "mature"];
const SEVERITIES = ["ok", "watch", "act"] as const;

/** jsonb string-array columns arrive as raw strings over the pooler. */
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

const oneOf = <T extends string>(v: unknown, allowed: readonly T[]): T | null =>
  typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : null;

/**
 * postgres.js (over the transaction pooler) returns jsonb columns as raw
 * strings — normalize plant rows once, at the DB boundary, so the rest of
 * the app can rely on real arrays.
 */
export function normalizePlant(row: Record<string, unknown>): Plant {
  return {
    ...(row as unknown as Plant),
    nutrients: arr(row.nutrients),
    weekly_tips: arr(row.weekly_tips),
    fun_facts: arr(row.fun_facts),
    room: toRoomKey(row.room),
    plant_look: oneOf(row.plant_look, PLANT_LOOKS),
    pot_look: oneOf(row.pot_look, POT_LOOKS),
    // Rows predating the growth_stage migration lack the column entirely.
    growth_stage: oneOf(row.growth_stage, GROWTH_STAGES) ?? "mature",
    last_watered: ts(row.last_watered),
    created_at: ts(row.created_at) ?? "",
  };
}

/** Same DB-boundary treatment for AI health-check rows (jsonb advice). */
export function normalizeHealthCheck(row: Record<string, unknown>): HealthCheck {
  return {
    id: typeof row.id === "string" ? row.id : String(row.id),
    image_url: typeof row.image_url === "string" ? row.image_url : null,
    note: typeof row.note === "string" ? row.note : null,
    severity: oneOf(row.severity, SEVERITIES) ?? "watch",
    summary: typeof row.summary === "string" ? row.summary : "",
    diagnosis: typeof row.diagnosis === "string" ? row.diagnosis : "",
    advice: arr(row.advice),
    suggested_stage: oneOf(row.suggested_stage, GROWTH_STAGES),
    created_at: ts(row.created_at) ?? "",
  };
}
