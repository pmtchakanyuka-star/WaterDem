import { NextRequest, NextResponse } from "next/server";
import { AiNotConfiguredError, identifyPlant } from "@/lib/ai";
import { uploadPlantPhoto } from "@/lib/storage";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: { imageBase64?: string; hint?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!body.imageBase64 && !body.hint?.trim()) {
    return NextResponse.json(
      { error: "Add a photo or a name hint first." },
      { status: 400 },
    );
  }

  try {
    const [profile, imageUrl] = await Promise.all([
      identifyPlant({ imageBase64: body.imageBase64, hint: body.hint }),
      body.imageBase64 ? uploadPlantPhoto(body.imageBase64) : Promise.resolve(null),
    ]);

    if (!profile) {
      return NextResponse.json(
        { error: "Couldn't identify — try a clearer photo or a name." },
        { status: 422 },
      );
    }
    return NextResponse.json({ profile, imageUrl });
  } catch (err) {
    if (err instanceof AiNotConfiguredError) {
      return NextResponse.json(
        { error: "AI isn't configured yet — you can still add the plant manually.", aiUnavailable: true },
        { status: 503 },
      );
    }
    console.error("identify failed", err);
    return NextResponse.json(
      { error: "Couldn't identify — try a clearer photo or a name." },
      { status: 502 },
    );
  }
}
