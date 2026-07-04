import { NextRequest, NextResponse } from "next/server";
import { geocodeCity } from "@/lib/weather";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  try {
    const results = await geocodeCity(q);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("geocode failed", err);
    return NextResponse.json(
      { error: "City search is unavailable right now." },
      { status: 502 },
    );
  }
}
