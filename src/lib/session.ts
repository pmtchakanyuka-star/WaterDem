import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

/**
 * Custom nickname/password auth — the session is a signed JWT in an httpOnly
 * cookie. No PII beyond the user's chosen handle.
 */

const COOKIE_NAME = "waterdem_session";
const THIRTY_DAYS_S = 30 * 24 * 60 * 60;

export type Session = {
  userId: string;
  nickname: string;
};

function secret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not set — see .env.local");
  return new TextEncoder().encode(s);
}

export async function createSession(session: Session): Promise<void> {
  const token = await new SignJWT({ nickname: session.nickname })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.userId)
    .setIssuedAt()
    .setExpirationTime(`${THIRTY_DAYS_S}s`)
    .sign(secret());

  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: THIRTY_DAYS_S,
    path: "/",
  });
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), {
      algorithms: ["HS256"],
    });
    if (!payload.sub || typeof payload.nickname !== "string") return null;
    return { userId: payload.sub, nickname: payload.nickname };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}
