import { NextRequest, NextResponse } from "next/server";

/**
 * The caller's IP, taken from platform-provided real-IP headers (which the
 * client can't forge) or the RIGHTMOST x-forwarded-for hop — never the
 * client-supplied leftmost token.
 */
export function clientIp(req: NextRequest): string {
  const realIp =
    req.headers.get("x-real-ip") ?? req.headers.get("x-vercel-forwarded-for");
  if (realIp) return realIp.trim();
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return "local";
}

/**
 * Parse a JSON request body, guaranteeing a plain object result. `JSON.parse`
 * accepts "null", numbers, strings and arrays — all of which then crash on
 * property access — so callers get a uniform 400 instead of a 500 for any
 * body that isn't a JSON object.
 */
export async function readJsonObject(
  req: NextRequest,
): Promise<{ ok: true; body: Record<string, unknown> } | { ok: false; res: NextResponse }> {
  let parsed: unknown;
  try {
    parsed = await req.json();
  } catch {
    return {
      ok: false,
      res: NextResponse.json({ error: "Invalid request." }, { status: 400 }),
    };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {
      ok: false,
      res: NextResponse.json({ error: "Invalid request." }, { status: 400 }),
    };
  }
  return { ok: true, body: parsed as Record<string, unknown> };
}
