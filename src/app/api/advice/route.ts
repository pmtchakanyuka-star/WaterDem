import { NextRequest, NextResponse } from "next/server";
import { AiNotConfiguredError, adviseForPlant } from "@/lib/ai";
import { getSession } from "@/lib/session";
import { readJsonObject } from "@/lib/http";
import type { Plant, Weather } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const parsed = await readJsonObject(req);
  if (!parsed.ok) return parsed.res;
  const body = parsed.body as { plant?: Partial<Plant>; weather?: Weather | null };

  const p = body.plant;
  if (!p || typeof p.name !== "string") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const advice = await adviseForPlant(
      {
        name: p.name,
        species: p.species ?? null,
        water_freq_days: p.water_freq_days ?? 7,
        light: p.light ?? null,
        humidity: p.humidity ?? null,
        soil_check: p.soil_check ?? null,
        weather_note: p.weather_note ?? null,
        last_watered: p.last_watered ?? null,
      },
      body.weather ?? null,
    );
    return NextResponse.json(advice);
  } catch (err) {
    if (err instanceof AiNotConfiguredError) {
      return NextResponse.json(
        { error: "AI isn't configured yet.", aiUnavailable: true },
        { status: 503 },
      );
    }
    console.error("advice failed", err);
    return NextResponse.json(
      { error: "Couldn't fetch advice right now." },
      { status: 502 },
    );
  }
}
