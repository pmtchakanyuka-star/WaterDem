import { NextRequest, NextResponse } from "next/server";
import { withUser } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { Plant } from "@/lib/types";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Editable fields and their validators. RLS enforces ownership. */
const EDITABLE: Record<string, (v: unknown) => unknown | undefined> = {
  name: (v) =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, 60) : undefined,
  water_freq_days: (v) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.min(90, Math.max(1, n)) : undefined;
  },
  is_public: (v) => (typeof v === "boolean" ? v : undefined),
  icon_key: (v) =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, 40) : undefined,
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

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  for (const [field, validate] of Object.entries(EDITABLE)) {
    if (field in body) {
      const v = validate(body[field]);
      if (v !== undefined) updates[field] = v;
    }
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const plant = await withUser(session.userId, async (tx) => {
    const rows = await tx`
      update plants set ${tx(updates)}
      where id = ${id}
      returning *`;
    return rows[0] as unknown as Plant | undefined;
  });

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
