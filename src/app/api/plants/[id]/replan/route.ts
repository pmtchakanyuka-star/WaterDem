import { NextRequest, NextResponse } from "next/server";
import { AiNotConfiguredError, identifyPlant } from "@/lib/ai";
import { withUser } from "@/lib/db";
import { getSession } from "@/lib/session";
import { clientIp } from "@/lib/http";
import { aiRateOk } from "@/lib/ratelimit";
import { normalizePlant } from "@/lib/normalize";
import type { Plant } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Ask the botanist to re-plan a plant's care. The watering schedule is
 * AI-owned — this is the sanctioned way to change it: re-run identification
 * against everything known about the plant (name, species, stored photo)
 * and refresh the care fields. Name, photo and visibility are untouched.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  if (!aiRateOk(session.userId, clientIp(req))) {
    return NextResponse.json({ error: "You're doing that a lot — please wait a minute and try again." }, { status: 429 });
  }

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Unknown plant." }, { status: 404 });
  }

  const plant = await withUser(session.userId, async (tx) => {
    const rows = await tx`
      select * from plants where id = ${id} and owner_id = ${session.userId}`;
    return rows[0] ? normalizePlant(rows[0]) : undefined;
  });
  if (!plant) {
    return NextResponse.json({ error: "Unknown plant." }, { status: 404 });
  }

  try {
    const profile = await identifyPlant({
      imageBase64: plant.image_url ?? undefined,
      hint: plant.name,
      details: { species: plant.species ?? plant.common_name ?? undefined },
    });
    if (!profile) {
      return NextResponse.json(
        { error: "The botanist couldn't work this one out — try adding a species on a new photo." },
        { status: 422 },
      );
    }

    const updated = await withUser(session.userId, async (tx) => {
      const rows = await tx`
        update plants set
          species = ${profile.species || plant.species},
          common_name = ${profile.commonName || plant.common_name},
          water_freq_days = ${profile.waterFreqDays},
          care_level = ${profile.careLevel},
          light = ${profile.light},
          humidity = ${profile.humidity},
          soil_check = ${profile.soilCheck},
          weather_note = ${profile.weatherNote},
          nutrients = ${JSON.stringify(profile.nutrients)},
          weekly_tips = ${JSON.stringify(profile.weeklyTips)},
          fun_facts = ${JSON.stringify(profile.funFacts)},
          pet_safety = ${profile.petSafety},
          pet_safety_note = ${profile.petSafetyNote || null}
        where id = ${id}
        returning *`;
      return rows[0] ? normalizePlant(rows[0]) : undefined;
    });

    return NextResponse.json(updated as Plant);
  } catch (err) {
    if (err instanceof AiNotConfiguredError) {
      return NextResponse.json(
        { error: "AI isn't configured yet.", aiUnavailable: true },
        { status: 503 },
      );
    }
    console.error("replan failed", err);
    return NextResponse.json(
      { error: "The botanist is unavailable right now — try again." },
      { status: 502 },
    );
  }
}
