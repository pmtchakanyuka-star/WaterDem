import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { withUser } from "@/lib/db";
import { createSession } from "@/lib/session";
import { lockedForSeconds, recordFailure, recordSuccess } from "@/lib/ratelimit";
import { clientIp, readJsonObject } from "@/lib/http";

export const runtime = "nodejs";

// A bcrypt hash of a throwaway string. We always run one bcrypt.compare —
// even when the nickname is unknown — so response time doesn't reveal
// whether an account exists (user-enumeration defense).
const DUMMY_HASH = "$2b$10$XdXnEr9tFgLNxD5WHsxUBeA.tODv31/hkGcNzyb8ve6eH.4uzT6A6";

export async function POST(req: NextRequest) {
  const parsed = await readJsonObject(req);
  if (!parsed.ok) return parsed.res;
  const body = parsed.body as { nickname?: unknown; password?: unknown };

  const nickname = typeof body.nickname === "string" ? body.nickname.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
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

  // Always compare against a hash (real or dummy) so timing is uniform.
  const passwordOk = await bcrypt.compare(
    password,
    user?.password_hash ?? DUMMY_HASH,
  );
  const ok = !!user && passwordOk;
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
