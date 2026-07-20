import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

/**
 * Approximate location from Vercel's IP-geolocation headers — the fallback
 * when precise browser geolocation is blocked or the device's location
 * service is off. Network-level accuracy (city-ish) is plenty for weather.
 * Headers are absent in local dev; that's a 404, not an error.
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const lat = parseFloat(req.headers.get("x-vercel-ip-latitude") ?? "");
  const lon = parseFloat(req.headers.get("x-vercel-ip-longitude") ?? "");
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json(
      { error: "No network location available." },
      { status: 404 },
    );
  }

  // City names arrive URI-encoded (e.g. "S%C3%A3o%20Paulo").
  const rawCity = req.headers.get("x-vercel-ip-city");
  let city: string | null = null;
  if (rawCity) {
    try {
      city = decodeURIComponent(rawCity);
    } catch {
      city = rawCity;
    }
  }
  const country = req.headers.get("x-vercel-ip-country");
  const label = city
    ? `Near ${city}${country ? `, ${country}` : ""}`
    : "My network's location";

  return NextResponse.json({ lat, lon, label });
}
