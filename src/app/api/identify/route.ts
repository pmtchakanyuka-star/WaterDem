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

  let body: {
    imageBase64?: string;
    hint?: string;
    details?: { species?: string; spotLight?: string };
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const species =
    typeof body.details?.species === "string"
      ? body.details.species.trim().slice(0, 120) || undefined
      : undefined;
  const spotLight =
    typeof body.details?.spotLight === "string" &&
    ["low", "medium", "bright"].includes(body.details.spotLight)
      ? (body.details.spotLight as "low" | "medium" | "bright")
      : undefined;

  const hint =
    typeof body.hint === "string"
      ? body.hint.trim().slice(0, 120) || undefined
      : undefined;
  const imageBase64 =
    typeof body.imageBase64 === "string" ? body.imageBase64 : undefined;

  if (!imageBase64 && !hint && !species) {
    return NextResponse.json(
      { error: "Add a photo, a name, or a species first." },
      { status: 400 },
    );
  }

  try {
    // The photo upload must never sink the identification: run both, but
    // only identification failures are fatal. A failed upload degrades to
    // the Lucide icon avatar plus a warning the UI can surface.
    const [profileResult, uploadResult] = await Promise.allSettled([
      identifyPlant({
        imageBase64,
        hint,
        details: { species, spotLight },
      }),
      imageBase64 ? uploadPlantPhoto(imageBase64) : Promise.resolve(null),
    ]);

    if (profileResult.status === "rejected") throw profileResult.reason;
    const profile = profileResult.value;

    if (!profile) {
      return NextResponse.json(
        { error: "Couldn't identify — try a clearer photo or a name." },
        { status: 422 },
      );
    }

    let imageUrl: string | null = null;
    let photoSaved = true;
    if (uploadResult.status === "fulfilled") {
      imageUrl = uploadResult.value;
    } else {
      photoSaved = false;
      console.error("photo upload failed (identification kept)", uploadResult.reason);
    }

    return NextResponse.json({ profile, imageUrl, photoSaved });
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
