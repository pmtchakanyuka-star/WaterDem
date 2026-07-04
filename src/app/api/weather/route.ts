import { NextResponse } from "next/server";
import { withUser } from "@/lib/db";
import { getSession } from "@/lib/session";
import {
  currentWeather,
  weatherIconKey,
  weeklyNudge,
  weeklyOutlook,
} from "@/lib/weather";

export const runtime = "nodejs";

/**
 * Current conditions + the weekly watering advisory for the signed-in
 * user's stored location. `factor` is the WEEK's multiplier — the watering
 * countdown adapts to the week's weather pattern, not just this moment
 * (base 7 days -> ~5 days in a hot, dry week).
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const loc = await withUser(session.userId, async (tx) => {
    const rows = await tx`
      select location_lat, location_lon, location_label
      from users where id = ${session.userId}`;
    return rows[0] as
      | { location_lat: number | null; location_lon: number | null; location_label: string | null }
      | undefined;
  });

  if (!loc?.location_lat || !loc.location_lon) {
    return NextResponse.json({ weather: null, location: null });
  }

  // Settle independently: a failed weekly forecast degrades to factor 1
  // (base schedule) without losing current conditions, and vice versa.
  const [currentResult, weekResult] = await Promise.allSettled([
    currentWeather(loc.location_lat, loc.location_lon),
    weeklyOutlook(loc.location_lat, loc.location_lon),
  ]);

  if (currentResult.status === "rejected" && weekResult.status === "rejected") {
    console.error("weather failed", currentResult.reason);
    return NextResponse.json(
      { error: "Weather is unavailable right now." },
      { status: 502 },
    );
  }

  const weather =
    currentResult.status === "fulfilled" ? currentResult.value : null;
  const week = weekResult.status === "fulfilled" ? weekResult.value : null;
  if (weekResult.status === "rejected") {
    console.error("weekly outlook failed (current weather kept)", weekResult.reason);
  }

  return NextResponse.json({
    weather,
    location: loc.location_label,
    factor: week?.factor ?? 1,
    nudge: weeklyNudge(week),
    iconKey: weather ? weatherIconKey(weather.code, weather.isDay) : null,
    week: week ? { hotDays: week.hotDays, dryDays: week.dryDays } : null,
  });
}
