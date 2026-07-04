import { NextRequest, NextResponse } from "next/server";
import { withUser } from "@/lib/db";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Recent watering history (visible when the plant is visible, per RLS). */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Unknown plant." }, { status: 404 });
  }

  const logs = await withUser(session?.userId ?? null, async (tx) => {
    const rows = await tx`
      select id, watered_at from water_logs
      where plant_id = ${id}
      order by watered_at desc
      limit 12`;
    return rows as unknown as { id: string; watered_at: string }[];
  });

  return NextResponse.json({ logs });
}

/** Log a watering: insert a water_log and reset the countdown. */
export async function POST(
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

  const result = await withUser(session.userId, async (tx) => {
    // RLS: insert only allowed if the plant belongs to the current user.
    const logs = await tx`
      insert into water_logs (plant_id) values (${id})
      returning id, watered_at`;
    const log = logs[0] as { id: string; watered_at: string } | undefined;
    if (!log) return null;
    await tx`
      update plants set last_watered = ${log.watered_at}
      where id = ${id}`;
    return log;
  }).catch(() => null); // RLS violation -> insert error

  if (!result) {
    return NextResponse.json({ error: "Unknown plant." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, wateredAt: result.watered_at });
}

/** Undo the most recent watering (brief: brief undo window on the toast). */
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

  const result = await withUser(session.userId, async (tx) => {
    // Ownership gate: a viewer can SELECT a public plant's logs, but only the
    // owner may undo. Confirm ownership before touching anything.
    const owned = await tx`
      select 1 from plants
      where id = ${id} and owner_id = ${session.userId}`;
    if (owned.length === 0) return { notOwner: true as const };

    const latest = await tx`
      select id from water_logs
      where plant_id = ${id}
      order by watered_at desc
      limit 1`;
    if (latest.length === 0) return { empty: true as const };

    await tx`delete from water_logs where id = ${(latest[0] as { id: string }).id}`;
    const prev = await tx`
      select watered_at from water_logs
      where plant_id = ${id}
      order by watered_at desc
      limit 1`;
    const prevAt = prev.length
      ? ((prev[0] as { watered_at: string }).watered_at as string | null)
      : null;
    await tx`update plants set last_watered = ${prevAt} where id = ${id}`;
    return { prevAt };
  }).catch(() => null);

  if (!result || "notOwner" in result) {
    return NextResponse.json({ error: "Unknown plant." }, { status: 404 });
  }
  if ("empty" in result) {
    return NextResponse.json({ error: "Nothing to undo." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, lastWatered: result.prevAt });
}
