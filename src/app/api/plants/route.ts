import { NextRequest, NextResponse } from "next/server";
import { withUser } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { Plant } from "@/lib/types";

export const runtime = "nodejs";

const CARE = ["easy", "moderate", "expert"];
const LIGHT = ["low", "medium", "bright"];
const HUMIDITY = ["low", "medium", "high"];

function sanitize(body: Record<string, unknown>) {
  const str = (v: unknown, max = 500) =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
  const arr = (v: unknown) =>
    JSON.stringify(
      Array.isArray(v) ? v.filter((s) => typeof s === "string").slice(0, 8) : [],
    );
  const freq = Math.round(Number(body.water_freq_days));

  return {
    name: str(body.name, 60),
    species: str(body.species, 120),
    common_name: str(body.common_name, 120),
    image_url: str(body.image_url, 500),
    icon_key: str(body.icon_key, 40) ?? "leaf",
    water_freq_days: Number.isFinite(freq) ? Math.min(90, Math.max(1, freq)) : 7,
    care_level: CARE.includes(body.care_level as string) ? (body.care_level as string) : null,
    light: LIGHT.includes(body.light as string) ? (body.light as string) : null,
    humidity: HUMIDITY.includes(body.humidity as string) ? (body.humidity as string) : null,
    soil_check: str(body.soil_check),
    weather_note: str(body.weather_note),
    nutrients: arr(body.nutrients),
    weekly_tips: arr(body.weekly_tips),
    fun_facts: arr(body.fun_facts),
  };
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const p = sanitize(body);
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
        weather_note, nutrients, weekly_tips, fun_facts, last_watered
      ) values (
        ${session.userId}, ${p.name}, ${p.species}, ${p.common_name},
        ${p.image_url}, ${p.icon_key}, ${p.water_freq_days}, ${p.care_level},
        ${p.light}, ${p.humidity}, ${p.soil_check}, ${p.weather_note},
        ${p.nutrients}, ${p.weekly_tips}, ${p.fun_facts}, now()
      )
      returning *`;
    return rows[0] as unknown as Plant;
  });

  return NextResponse.json(plant, { status: 201 });
}
