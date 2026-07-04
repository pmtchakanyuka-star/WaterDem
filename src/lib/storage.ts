import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

/**
 * Plant photo uploads to Supabase Storage. Server-only: uses the service
 * role key, which must never reach the client. Bucket `plant-photos` is
 * public-read with unguessable object names.
 */

function client() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

const BUCKET = "plant-photos";

export async function uploadPlantPhoto(imageBase64: string): Promise<string> {
  const supabase = client();

  const m = imageBase64.match(/^data:(image\/\w+);base64,([\s\S]+)$/);
  const contentType = m ? m[1] : "image/jpeg";
  const data = Buffer.from(m ? m[2] : imageBase64, "base64");
  const ext = contentType.split("/")[1].replace("jpeg", "jpg");
  const path = `${randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, data, { contentType, upsert: false });
  if (error) throw new Error(`photo upload failed: ${error.message}`);

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return pub.publicUrl;
}
