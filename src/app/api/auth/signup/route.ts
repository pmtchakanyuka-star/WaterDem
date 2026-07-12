import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { withUser } from "@/lib/db";
import { createSession } from "@/lib/session";
import { clientIp, readJsonObject } from "@/lib/http";
import { recordSignup, signupLockedForSeconds } from "@/lib/ratelimit";

export const runtime = "nodejs";

const NICKNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

/** Live nickname availability check for the signup form (Nielsen #5). */
export async function GET(req: NextRequest) {
  // Trim to match the POST validator (which trims before checking).
  const nickname = (req.nextUrl.searchParams.get("nickname") ?? "").trim();
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
  const ip = clientIp(req);
  const wait = signupLockedForSeconds(ip);
  if (wait > 0) {
    return NextResponse.json(
      { error: `Too many sign-ups from here — try again in ${wait}s.`, retryAfter: wait },
      { status: 429 },
    );
  }

  const parsed = await readJsonObject(req);
  if (!parsed.ok) return parsed.res;
  const body = parsed.body as { nickname?: unknown; password?: unknown };

  const nickname = typeof body.nickname === "string" ? body.nickname.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  // The regex below already excludes "@", but give email attempts their own
  // clear message — people habitually type an email into the first field.
  if (nickname.includes("@")) {
    return NextResponse.json(
      { error: "No email addresses — pick a handle instead, like mossboss." },
      { status: 400 },
    );
  }
  if (!NICKNAME_RE.test(nickname)) {
    return NextResponse.json(
      { error: "Nicknames are 3–20 letters, numbers or underscores." },
      { status: 400 },
    );
  }
  // Validate real length: reject edge whitespace so padding can't inflate a
  // weak password to the minimum, and give the right message for too-long.
  if (/^\s|\s$/.test(password)) {
    return NextResponse.json(
      { error: "Passwords can’t start or end with a space." },
      { status: 400 },
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Passwords need at least 8 characters." },
      { status: 400 },
    );
  }
  if (password.length > 200) {
    return NextResponse.json(
      { error: "Passwords can be at most 200 characters." },
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
    recordSignup(ip);
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
