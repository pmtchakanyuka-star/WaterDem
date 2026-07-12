import { NextRequest, NextResponse } from "next/server";
import { withUser } from "@/lib/db";
import { getSession } from "@/lib/session";
import { normalizePlant } from "@/lib/normalize";
import { readJsonObject } from "@/lib/http";
import { coerceHomeSpaces, isRoomKey, type RoomKey } from "@/lib/home";
import { PLANT_LOOKS, POT_LOOKS } from "@/lib/types";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Nullable text fields accept an empty string as "clear it" (-> null).
const nullableText = (max: number) => (v: unknown) => {
  if (v === null) return null;
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
};
const oneOfOrNull = (allowed: readonly string[]) => (v: unknown) => {
  if (v === null || v === "") return null;
  return typeof v === "string" && allowed.includes(v) ? v : undefined;
};

/**
 * Editable fields and their validators. RLS enforces ownership.
 * `room` and `water_freq_days` are NOT here — `room` is validated against the
 * owner's chosen spaces below, and the watering schedule is the AI botanist's
 * weather-adapted advisory (changed via re-plan), never a free number.
 */
const EDITABLE: Record<string, (v: unknown) => unknown | undefined> = {
  name: (v) =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, 60) : undefined,
  is_public: (v) => (typeof v === "boolean" ? v : undefined),
  icon_key: (v) =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, 40) : undefined,
  species: nullableText(120),
  common_name: nullableText(120),
  soil_check: nullableText(500),
  weather_note: nullableText(500),
  care_level: oneOfOrNull(["easy", "moderate", "expert"]),
  light: oneOfOrNull(["low", "medium", "bright"]),
  humidity: oneOfOrNull(["low", "medium", "high"]),
  // Home-view appearance — null clears to "auto".
  plant_look: oneOfOrNull([...PLANT_LOOKS]),
  pot_look: oneOfOrNull([...POT_LOOKS]),
  // NOT NULL column: null/""/invalid input is skipped (undefined), never
  // written as null — unlike the oneOfOrNull fields above.
  growth_stage: (v) =>
    typeof v === "string" && ["seed", "seedling", "young", "mature"].includes(v)
      ? v
      : undefined,
};

export async function PATCH(
  req: NextRequest,
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

  const parsed = await readJsonObject(req);
  if (!parsed.ok) return parsed.res;
  const body = parsed.body;

  const updates: Record<string, unknown> = {};
  for (const [field, validate] of Object.entries(EDITABLE)) {
    if (field in body) {
      const v = validate(body[field]);
      if (v !== undefined) updates[field] = v;
    }
  }

  // `room` is special: null (unplace) is always allowed, but a room key is
  // only valid if it's one of the owner's chosen home_spaces — which we can
  // only know inside the transaction. Flag it here; validate in the tx.
  let roomChange: { value: RoomKey | null } | null = null;
  if ("room" in body) {
    if (body.room === null) {
      roomChange = { value: null };
    } else if (isRoomKey(body.room)) {
      roomChange = { value: body.room };
    } else {
      return NextResponse.json({ error: "Unknown room." }, { status: 400 });
    }
  }

  if (Object.keys(updates).length === 0 && !roomChange) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const result = await withUser(session.userId, async (tx) => {
    if (roomChange && roomChange.value !== null) {
      const rows = await tx`
        select home_spaces from users where id = ${session.userId}`;
      const spaces = coerceHomeSpaces(rows[0]?.home_spaces);
      if (!spaces.includes(roomChange.value)) return { badRoom: true as const };
      updates.room = roomChange.value;
    } else if (roomChange) {
      updates.room = null;
    }
    const rows = await tx`
      update plants set ${tx(updates)}
      where id = ${id}
      returning *`;
    return { plant: rows[0] ? normalizePlant(rows[0]) : undefined };
  });

  if ("badRoom" in result) {
    return NextResponse.json(
      { error: "That room isn't in your home yet." },
      { status: 400 },
    );
  }
  const plant = result.plant;

  if (!plant) {
    return NextResponse.json({ error: "Unknown plant." }, { status: 404 });
  }
  return NextResponse.json(plant);
}

export async function DELETE(
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

  const deleted = await withUser(session.userId, async (tx) => {
    const rows = await tx`delete from plants where id = ${id} returning id`;
    return rows.length > 0;
  });

  if (!deleted) {
    return NextResponse.json({ error: "Unknown plant." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
