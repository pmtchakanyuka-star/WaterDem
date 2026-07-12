import { NextRequest, NextResponse } from "next/server";
import { AiNotConfiguredError, checkPlantHealth } from "@/lib/ai";
import { uploadPlantPhoto } from "@/lib/storage";
import { withUser } from "@/lib/db";
import { getSession } from "@/lib/session";
import { clientIp, readJsonObject } from "@/lib/http";
import { aiRateOk } from "@/lib/ratelimit";
import { normalizeHealthCheck, normalizePlant } from "@/lib/normalize";
import type { Weather } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * AI health checkup for one plant: a photo of the worrying leaves and/or a
 * description goes to the botanist along with the plant's full profile and
 * actual watering record; the diagnosis is stored as a health_checks row
 * (owner-only, per RLS) so the detail sheet can show a history.
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

  const parsed = await readJsonObject(req);
  if (!parsed.ok) return parsed.res;
  const body = parsed.body as {
    imageBase64?: unknown;
    note?: unknown;
    weather?: Weather | null;
  };

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Unknown plant." }, { status: 404 });
  }

  const imageBase64 =
    typeof body.imageBase64 === "string" ? body.imageBase64 : undefined;
  if (typeof imageBase64 === "string" && imageBase64.length > 11_000_000) {
    return NextResponse.json(
      { error: "That image is too large — please use one under 8 MB." },
      { status: 413 },
    );
  }
  const note =
    typeof body.note === "string"
      ? body.note.trim().slice(0, 500) || undefined
      : undefined;

  if (!imageBase64 && !note) {
    return NextResponse.json(
      { error: "Add a photo or describe what worries you." },
      { status: 400 },
    );
  }

  const loaded = await withUser(session.userId, async (tx) => {
    const rows = await tx`
      select * from plants where id = ${id} and owner_id = ${session.userId}`;
    if (!rows[0]) return null;
    const logs = await tx`
      select watered_at from water_logs
      where plant_id = ${id}
      order by watered_at desc
      limit 5`;
    return {
      plant: normalizePlant(rows[0]),
      recentWaterings: (logs as unknown as { watered_at: string | Date }[]).map(
        (l) =>
          l.watered_at instanceof Date
            ? l.watered_at.toISOString()
            : String(l.watered_at),
      ),
    };
  });
  if (!loaded) {
    return NextResponse.json({ error: "Unknown plant." }, { status: 404 });
  }

  try {
    // The photo upload must never sink the checkup: run both, but only the
    // assessment failure is fatal — a failed upload just leaves the history
    // row without a photo (same pattern as identify).
    const [checkResult, uploadResult] = await Promise.allSettled([
      checkPlantHealth(
        { ...loaded.plant, recentWaterings: loaded.recentWaterings },
        body.weather ?? null,
        { imageBase64, note },
      ),
      imageBase64 ? uploadPlantPhoto(imageBase64) : Promise.resolve(null),
    ]);

    if (checkResult.status === "rejected") throw checkResult.reason;
    const result = checkResult.value;

    if (!result) {
      return NextResponse.json(
        { error: "The botanist couldn't assess this — try a clearer photo of the affected leaves." },
        { status: 422 },
      );
    }

    let imageUrl: string | null = null;
    let photoSaved = true;
    if (uploadResult.status === "fulfilled") {
      imageUrl = uploadResult.value;
    } else {
      photoSaved = false;
      console.error("photo upload failed (health check kept)", uploadResult.reason);
    }

    const check = await withUser(session.userId, async (tx) => {
      const rows = await tx`
        insert into health_checks (
          plant_id, image_url, note, severity, summary, diagnosis,
          advice, suggested_stage
        ) values (
          ${id}, ${imageUrl}, ${note ?? null}, ${result.severity},
          ${result.summary}, ${result.diagnosis},
          ${JSON.stringify(result.advice)}, ${result.suggestedStage}
        )
        returning *`;
      return normalizeHealthCheck(rows[0]);
    });

    return NextResponse.json({ check, photoSaved }, { status: 201 });
  } catch (err) {
    if (err instanceof AiNotConfiguredError) {
      return NextResponse.json(
        { error: "AI isn't configured yet.", aiUnavailable: true },
        { status: 503 },
      );
    }
    console.error("health check failed", err);
    return NextResponse.json(
      { error: "The botanist is unavailable right now — try again." },
      { status: 502 },
    );
  }
}

/** Past checkups, newest first. Owner-only: RLS hides other users' rows. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Unknown plant." }, { status: 404 });
  }

  const checks = await withUser(session.userId, async (tx) => {
    const rows = await tx`
      select * from health_checks
      where plant_id = ${id}
      order by created_at desc
      limit 10`;
    return rows.map((r) => normalizeHealthCheck(r as Record<string, unknown>));
  });

  return NextResponse.json({ checks });
}
