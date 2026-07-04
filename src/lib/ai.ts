import type { Advice, IdentifyResult, Plant, Weather } from "@/lib/types";

/**
 * AI provider isolation layer — currently OpenAI (gpt-4o, vision-capable).
 * Swapping providers means changing only this file; the route handlers and
 * UI consume IdentifyResult / Advice.
 *
 * The API key stays server-side. Missing key -> AiNotConfiguredError so the
 * UI can fall back to manual plant entry.
 */

const MODEL = "gpt-4o";
const API_URL = "https://api.openai.com/v1/chat/completions";

export class AiNotConfiguredError extends Error {
  constructor() {
    super("AI not configured — add OPENAI_API_KEY to .env.local");
  }
}

/** Lucide icon names a plant profile may use as its photo-less avatar. */
export const PLANT_ICON_KEYS = [
  "leaf",
  "sprout",
  "flower",
  "flower-2",
  "trees",
  "tree-palm",
  "tree-deciduous",
  "vegan",
  "shrub",
  "clover",
] as const;

// Houseplant knowledge system prompt (brief §8) — grounds identification so
// advice is specific rather than generic.
const BOTANIST_SYSTEM_PROMPT = `You are an expert botanist and houseplant specialist. Watering science: over/under-watering causes most houseplant deaths; frequency depends on species, pot size, season, light, temperature. Hot weather (>25°C) and low humidity (<40%) both raise watering needs. Most tropicals want the top 2cm of soil dry before watering; succulents/cacti fully dry. Light: low = >4ft from window; medium = 2–4ft bright indirect; bright = within 2ft/direct. Humidity: tropicals (Monstera, Peace Lily, Calathea, ferns) 50–70%; desert plants (cacti, succulents, snake plants) 20–40%; moderate (pothos, ZZ, philodendron) 40–60%. Nutrients: balanced NPK 20-20-20 in spring/summer every 4 weeks, reduce in winter; flowering plants need more phosphorus; cacti need low-nitrogen feed. Deficiency signs: yellowing = nitrogen, purple tinge = phosphorus, brown edges = potassium. Know the common species and their specifics (Monstera deliciosa, Spathiphyllum, Sansevieria, Epipremnum/pothos, Ficus lyrata, Aloe, ZZ, Calathea, Philodendron, Dracaena, Chlorophytum/spider plant, Tradescantia).`;

const IDENTIFY_INSTRUCTIONS = `Identify the houseplant from the photo and/or the user's hint, then produce a care profile.

Respond with ONLY a JSON object of this exact shape:
{
  "name": string,            // friendly short name for the plant, e.g. "Monstera"
  "species": string,         // scientific name, e.g. "Monstera deliciosa"
  "commonName": string,      // common name, e.g. "Swiss Cheese Plant"
  "iconKey": string,         // one of: ${PLANT_ICON_KEYS.join(", ")}
  "confidence": number,      // 0-1, your identification confidence
  "waterFreqDays": number,   // integer days between waterings under normal indoor conditions
  "careLevel": "easy" | "moderate" | "expert",
  "light": "low" | "medium" | "bright",
  "humidity": "low" | "medium" | "high",
  "soilCheck": string,       // one sentence: when-to-water soil test for this species
  "nutrients": string[],     // 2-4 short feeding pointers
  "weeklyTips": string[],    // 3-5 short, species-specific weekly care tips
  "funFacts": string[],      // 2-3 delightful facts about the species
  "weatherNote": string      // one sentence: how heat/dry air changes this species' watering needs
}

If you cannot identify a plant at all, respond with {"error": "unidentifiable"}.`;

type OpenAiContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string; detail: "low" | "high" } };

async function chatJson(
  system: string,
  userContent: OpenAiContentPart[],
): Promise<Record<string, unknown>> {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key.startsWith("PASTE_")) throw new AiNotConfiguredError();

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: "json_object" },
      max_tokens: 1200,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userContent },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenAI request failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  return JSON.parse(data.choices[0].message.content);
}

export async function identifyPlant(input: {
  imageBase64?: string;
  hint?: string;
}): Promise<IdentifyResult | null> {
  const content: OpenAiContentPart[] = [
    {
      type: "text",
      text:
        IDENTIFY_INSTRUCTIONS +
        (input.hint ? `\n\nUser hint: ${input.hint}` : ""),
    },
  ];
  if (input.imageBase64) {
    const url = input.imageBase64.startsWith("data:")
      ? input.imageBase64
      : `data:image/jpeg;base64,${input.imageBase64}`;
    content.push({ type: "image_url", image_url: { url, detail: "low" } });
  }

  const raw = await chatJson(BOTANIST_SYSTEM_PROMPT, content);
  if (raw.error) return null;

  const iconKey = PLANT_ICON_KEYS.includes(
    raw.iconKey as (typeof PLANT_ICON_KEYS)[number],
  )
    ? (raw.iconKey as string)
    : "leaf";

  const clampInt = (v: unknown, lo: number, hi: number, fallback: number) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback;
  };
  const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
    allowed.includes(v as T) ? (v as T) : fallback;
  const strings = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((s) => typeof s === "string").slice(0, 6) : [];

  return {
    name: typeof raw.name === "string" && raw.name ? raw.name : "Mystery plant",
    species: typeof raw.species === "string" ? raw.species : "",
    commonName: typeof raw.commonName === "string" ? raw.commonName : "",
    iconKey,
    confidence:
      typeof raw.confidence === "number"
        ? Math.min(1, Math.max(0, raw.confidence))
        : 0.5,
    waterFreqDays: clampInt(raw.waterFreqDays, 1, 90, 7),
    careLevel: oneOf(raw.careLevel, ["easy", "moderate", "expert"] as const, "moderate"),
    light: oneOf(raw.light, ["low", "medium", "bright"] as const, "medium"),
    humidity: oneOf(raw.humidity, ["low", "medium", "high"] as const, "medium"),
    soilCheck:
      typeof raw.soilCheck === "string"
        ? raw.soilCheck
        : "Water when the top 2cm of soil feels dry.",
    nutrients: strings(raw.nutrients),
    weeklyTips: strings(raw.weeklyTips),
    funFacts: strings(raw.funFacts),
    weatherNote: typeof raw.weatherNote === "string" ? raw.weatherNote : "",
  };
}

export async function adviseForPlant(
  plant: Pick<
    Plant,
    "name" | "species" | "water_freq_days" | "light" | "humidity" | "soil_check" | "weather_note" | "last_watered"
  >,
  weather: Weather | null,
): Promise<Advice> {
  const weatherLine = weather
    ? `Current local weather: ${weather.tempC}°C, ${weather.humidityPct}% humidity, wind ${weather.windKmh} km/h.`
    : "No weather data available.";

  const raw = await chatJson(
    BOTANIST_SYSTEM_PROMPT,
    [
      {
        type: "text",
        text: `Give watering/care advice for this plant right now.

Plant: ${plant.name}${plant.species ? ` (${plant.species})` : ""}
Waters every ${plant.water_freq_days} days; last watered ${plant.last_watered ?? "unknown"}.
Light: ${plant.light ?? "unknown"}, humidity preference: ${plant.humidity ?? "unknown"}.
Soil check: ${plant.soil_check ?? "n/a"}
Species weather sensitivity: ${plant.weather_note ?? "n/a"}
${weatherLine}

Respond with ONLY a JSON object: {"greeting": string, "tips": string[]}.
The greeting is one warm sentence about how the plant is likely feeling in
this weather. Give 2-4 specific, actionable tips that reference the actual
conditions. Plain human language — no database jargon.`,
      },
    ],
  );

  return {
    greeting:
      typeof raw.greeting === "string"
        ? raw.greeting
        : "Your plant is doing fine.",
    tips: Array.isArray(raw.tips)
      ? raw.tips.filter((t) => typeof t === "string").slice(0, 4)
      : [],
  };
}
