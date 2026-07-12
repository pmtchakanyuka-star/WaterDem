import { NextRequest, NextResponse } from "next/server";
import { withUser } from "@/lib/db";
import { getSession } from "@/lib/session";
import { normalizePlant } from "@/lib/normalize";
import { readJsonObject } from "@/lib/http";
import { PLANT_ICON_KEYS } from "@/lib/ai";

export const runtime = "nodejs";

const CARE = ["easy", "moderate", "expert"];
const LIGHT = ["low", "medium", "bright"];
const HUMIDITY = ["low", "medium", "high"];
const PET = ["toxic", "mild", "safe"];
const GROWTH = ["seed", "seedling", "young", "mature"];
const ICON_KEYS = new Set<string>(PLANT_ICON_KEYS);

function sanitize(body: Record<string, unknown>) {
  const str = (v: unknown, max = 500) =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
  const arr = (v: unknown) =>
    JSON.stringify(
      Array.isArray(v) ? v.filter((s) => typeof s === "string").slice(0, 8) : [],
    );
  // Only a genuine positive number sets the schedule; junk (null, "lots",
  // undefined) falls back to 7 rather than clamping Number(null)=0 up to 1.
  const rawFreq = body.water_freq_days;
  const water_freq_days =
    typeof rawFreq === "number" && Number.isFinite(rawFreq)
      ? Math.min(90, Math.max(1, Math.round(rawFreq)))
      : 7;
  const iconKey = str(body.icon_key, 40);
  const imageUrl = str(body.image_url, 500);

  return {
    name: str(body.name, 60),
    species: str(body.species, 120),
    common_name: str(body.common_name, 120),
    image_url: imageUrl && /^https?:\/\//i.test(imageUrl) ? imageUrl : null,
    icon_key: iconKey && ICON_KEYS.has(iconKey) ? iconKey : "leaf",
    water_freq_days,
    care_level: CARE.includes(body.care_level as string) ? (body.care_level as string) : null,
    light: LIGHT.includes(body.light as string) ? (body.light as string) : null,
    humidity: HUMIDITY.includes(body.humidity as string) ? (body.humidity as string) : null,
    soil_check: str(body.soil_check),
    weather_note: str(body.weather_note),
    nutrients: arr(body.nutrients),
    weekly_tips: arr(body.weekly_tips),
    fun_facts: arr(body.fun_facts),
    pet_safety: PET.includes(body.pet_safety as string) ? (body.pet_safety as string) : null,
    pet_safety_note: str(body.pet_safety_note, 200),
    growth_stage: GROWTH.includes(body.growth_stage as string)
      ? (body.growth_stage as string)
      : "mature",
  };
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const parsed = await readJsonObject(req);
  if (!parsed.ok) return parsed.res;

  const p = sanitize(parsed.body);
  if (!p.name) {
    return NextResponse.json(
      { error: "Give your plant a name." },
      { status: 400 },
    );
  }

  const plant = await withUser(session.userId, async (tx) => {
    const rows = await tx`
      insert into plants (
        owner_id, name, species, common_name, image_url, icon_key,
        water_freq_days, care_level, light, humidity, soil_check,
        weather_note, nutrients, weekly_tips, fun_facts,
        pet_safety, pet_safety_note, growth_stage, last_watered
      ) values (
        ${session.userId}, ${p.name}, ${p.species}, ${p.common_name},
        ${p.image_url}, ${p.icon_key}, ${p.water_freq_days}, ${p.care_level},
        ${p.light}, ${p.humidity}, ${p.soil_check}, ${p.weather_note},
        ${p.nutrients}, ${p.weekly_tips}, ${p.fun_facts},
        ${p.pet_safety}, ${p.pet_safety_note}, ${p.growth_stage}, now()
      )
      returning *`;
    return normalizePlant(rows[0]);
  });

  return NextResponse.json(plant, { status: 201 });
}
