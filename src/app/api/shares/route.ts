import { NextRequest, NextResponse } from "next/server";
import { withUser } from "@/lib/db";
import { getSession } from "@/lib/session";
import { readJsonObject } from "@/lib/http";
import type { GardenShare } from "@/lib/types";

export const runtime = "nodejs";

/** List people I've invited to view my garden. */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const shares = await withUser(session.userId, async (tx) => {
    const rows = await tx`
      select gs.id, gs.viewer_id, u.nickname as viewer_nickname, gs.created_at
      from garden_shares gs
      join users u on u.id = gs.viewer_id
      where gs.owner_id = ${session.userId}
      order by gs.created_at desc`;
    return rows as unknown as GardenShare[];
  });

  return NextResponse.json({ shares });
}

/** Invite a friend by nickname (brief §5: clear success / "no user" message). */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const parsed = await readJsonObject(req);
  if (!parsed.ok) return parsed.res;
  const nickname =
    typeof parsed.body.nickname === "string" ? parsed.body.nickname.trim() : "";
  if (!nickname) {
    return NextResponse.json(
      { error: "Type a friend's handle first." },
      { status: 400 },
    );
  }
  if (nickname.toLowerCase() === session.nickname.toLowerCase()) {
    return NextResponse.json(
      { error: "That's you — your garden is already yours." },
      { status: 400 },
    );
  }

  const result = await withUser(session.userId, async (tx) => {
    const users = await tx`
      select id, nickname from users
      where lower(nickname) = lower(${nickname})`;
    const viewer = users[0] as { id: string; nickname: string } | undefined;
    if (!viewer) return { notFound: true as const };

    const rows = await tx`
      insert into garden_shares (owner_id, viewer_id)
      values (${session.userId}, ${viewer.id})
      on conflict (owner_id, viewer_id) do nothing
      returning id`;
    return {
      viewer,
      alreadyShared: rows.length === 0,
      id: rows.length ? (rows[0] as { id: string }).id : null,
    };
  });

  if ("notFound" in result) {
    return NextResponse.json(
      { error: `No user with the handle “${nickname}”.` },
      { status: 404 },
    );
  }
  if (result.alreadyShared) {
    return NextResponse.json(
      { error: `${result.viewer.nickname} can already see your garden.` },
      { status: 409 },
    );
  }
  return NextResponse.json(
    { ok: true, id: result.id, viewer: result.viewer },
    { status: 201 },
  );
}

/** Revoke an invite. */
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id") ?? "";
  const removed = await withUser(session.userId, async (tx) => {
    const rows = await tx`
      delete from garden_shares where id = ${id} returning id`;
    return rows.length > 0;
  }).catch(() => false);

  if (!removed) {
    return NextResponse.json({ error: "Invite not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
