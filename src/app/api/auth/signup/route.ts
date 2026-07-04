import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { withUser } from "@/lib/db";
import { createSession } from "@/lib/session";

export const runtime = "nodejs";

const NICKNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

/** Live nickname availability check for the signup form (Nielsen #5). */
export async function GET(req: NextRequest) {
  const nickname = req.nextUrl.searchParams.get("nickname") ?? "";
  if (!NICKNAME_RE.test(nickname)) {
    return NextResponse.json({ available: false, invalid: true });
  }
  const taken = await withUser(null, async (tx) => {
    const rows = await tx`
      select 1 from users where lower(nickname) = lower(${nickname})`;
    return rows.length > 0;
  });
  return NextResponse.json({ available: !taken });
}

export async function POST(req: NextRequest) {
  let body: { nickname?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const nickname = (body.nickname ?? "").trim();
  const password = body.password ?? "";

  if (!NICKNAME_RE.test(nickname)) {
    return NextResponse.json(
      { error: "Nicknames are 3–20 letters, numbers or underscores." },
      { status: 400 },
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Passwords need at least 8 characters." },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const user = await withUser(null, async (tx) => {
      const rows = await tx`
        insert into users (nickname, password_hash)
        values (${nickname}, ${passwordHash})
        returning id, nickname`;
      return rows[0] as { id: string; nickname: string };
    });
    await createSession({ userId: user.id, nickname: user.nickname });
    return NextResponse.json(
      { id: user.id, nickname: user.nickname },
      { status: 201 },
    );
  } catch (err: unknown) {
    // unique_violation on the case-insensitive nickname index
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: string }).code === "23505"
    ) {
      return NextResponse.json(
        { error: "That handle is taken — try another." },
        { status: 409 },
      );
    }
    console.error("signup failed", err);
    return NextResponse.json(
      { error: "Something went wrong — please try again." },
      { status: 500 },
    );
  }
}
