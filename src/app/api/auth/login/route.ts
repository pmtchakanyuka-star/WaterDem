import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { withUser } from "@/lib/db";
import { createSession } from "@/lib/session";
import { lockedForSeconds, recordFailure, recordSuccess } from "@/lib/ratelimit";

export const runtime = "nodejs";

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local"
  );
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
  const ip = clientIp(req);

  if (!nickname || !password) {
    return NextResponse.json(
      { error: "Enter your nickname and password." },
      { status: 400 },
    );
  }

  const lockSeconds = lockedForSeconds(nickname, ip);
  if (lockSeconds > 0) {
    return NextResponse.json(
      {
        error: `Too many attempts — try again in ${lockSeconds}s.`,
        retryAfter: lockSeconds,
      },
      { status: 429 },
    );
  }

  const user = await withUser(null, async (tx) => {
    const rows = await tx`
      select id, nickname, password_hash
      from users where lower(nickname) = lower(${nickname})`;
    return rows[0] as
      | { id: string; nickname: string; password_hash: string }
      | undefined;
  });

  const ok = user && (await bcrypt.compare(password, user.password_hash));
  if (!ok) {
    recordFailure(nickname, ip);
    return NextResponse.json(
      { error: "Wrong nickname or password." },
      { status: 401 },
    );
  }

  recordSuccess(nickname, ip);
  await createSession({ userId: user.id, nickname: user.nickname });
  return NextResponse.json({ id: user.id, nickname: user.nickname });
}
