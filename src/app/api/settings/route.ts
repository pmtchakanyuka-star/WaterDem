import { NextRequest, NextResponse } from "next/server";
import { withUser } from "@/lib/db";
import { getSession } from "@/lib/session";
import { readJsonObject } from "@/lib/http";
import { coerceHomeSpaces, normalizeHomeSpaces, type RoomKey } from "@/lib/home";

export const runtime = "nodejs";

/** Update own profile settings: location, garden visibility, home spaces. */
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const parsed = await readJsonObject(req);
  if (!parsed.ok) return parsed.res;
  const body = parsed.body;

  const updates: Record<string, unknown> = {};
  let newSpaces: RoomKey[] | null = null;

  if ("garden_is_public" in body && typeof body.garden_is_public === "boolean") {
    updates.garden_is_public = body.garden_is_public;
  }
  if ("home_spaces" in body) {
    newSpaces = normalizeHomeSpaces(body.home_spaces);
    if (newSpaces === null) {
      return NextResponse.json(
        { error: "Pick up to two rooms." },
        { status: 400 },
      );
    }
    updates.home_spaces = JSON.stringify(newSpaces);
  }
  if ("location" in body) {
    const loc = body.location as {
      lat?: unknown; lon?: unknown; label?: unknown;
    } | null;
    if (loc === null) {
      updates.location_lat = null;
      updates.location_lon = null;
      updates.location_label = null;
    } else if (
      typeof loc?.lat === "number" &&
      typeof loc?.lon === "number" &&
      Number.isFinite(loc.lat) &&
      Number.isFinite(loc.lon) &&
      Math.abs(loc.lat) <= 90 &&
      Math.abs(loc.lon) <= 180
    ) {
      updates.location_lat = loc.lat;
      updates.location_lon = loc.lon;
      updates.location_label =
        typeof loc.label === "string" ? loc.label.slice(0, 80) : null;
    } else {
      // A location was supplied but it's malformed — say so instead of
      // silently dropping it (which looked like a partial success).
      return NextResponse.json(
        { error: "That location doesn't look valid." },
        { status: 400 },
      );
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const user = await withUser(session.userId, async (tx) => {
    const rows = await tx`
      update users set ${tx(updates)}
      where id = ${session.userId}
      returning id, nickname, garden_is_public,
                location_lat, location_lon, location_label, home_spaces`;
    // When the chosen spaces change, unplace any plant now in a room the user
    // no longer has — the plant isn't lost, it returns to the unplaced tray.
    if (newSpaces !== null) {
      if (newSpaces.length === 0) {
        await tx`update plants set room = null where owner_id = ${session.userId} and room is not null`;
      } else {
        await tx`
          update plants set room = null
          where owner_id = ${session.userId}
            and room is not null
            and room <> all(${newSpaces})`;
      }
    }
    return rows[0];
  });

  return NextResponse.json({
    ...user,
    home_spaces: coerceHomeSpaces(user?.home_spaces),
  });
}
