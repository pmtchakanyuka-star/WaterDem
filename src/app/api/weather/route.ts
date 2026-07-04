import { NextResponse } from "next/server";
import { withUser } from "@/lib/db";
import { getSession } from "@/lib/session";
import { currentWeather, wateringFactor, weatherIconKey, weatherNudge } from "@/lib/weather";

export const runtime = "nodejs";

/** Current conditions for the signed-in user's stored location. */
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

  try {
    const weather = await currentWeather(loc.location_lat, loc.location_lon);
    return NextResponse.json({
      weather,
      location: loc.location_label,
      factor: wateringFactor(weather),
      nudge: weatherNudge(weather),
      iconKey: weatherIconKey(weather.code, weather.isDay),
    });
  } catch (err) {
    console.error("weather failed", err);
    return NextResponse.json(
      { error: "Weather is unavailable right now." },
      { status: 502 },
    );
  }
}
