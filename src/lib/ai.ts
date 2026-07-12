import type {
  Advice,
  GrowthStage,
  HealthCheckResult,
  IdentifyResult,
  Plant,
  Weather,
} from "@/lib/types";

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

// Houseplant knowledge system prompt — grounds identification so advice is
// specific rather than generic. Facts below are drawn from university
// extension services (Iowa State, Penn State, Clemson, UMD, MSU, UNH,
// Nebraska), the RHS, and ASPCA toxicity data.
const BOTANIST_SYSTEM_PROMPT = `You are an expert botanist and houseplant specialist. Ground every care plan in the following horticultural knowledge and set fields to match it.

WATERING: Overwatering (root rot) kills more houseplants than underwatering — root rot's first sign is wilting lower leaves, easily mistaken for thirst, so always judge by soil moisture, not a calendar. Finger test: water when the top ~2cm (tropicals) is dry; succulents/cacti want the pot nearly fully dry. Plants use far less water in winter (dormancy) — schedules should lean longer, not shorter, in the cold months. waterFreqDays is the interval under normal indoor conditions in the growing season.

SPECIES INTERVALS (indoor, growing season) — respect these, generic weekly watering is wrong for succulent-type plants: Snake plant (Sansevieria) 14-21 days; ZZ plant (Zamioculcas) 14-21 days — both store water and rot readily if watered weekly. Aloe/succulents ~14 days. Monstera, Pothos, Philodendron ~7-10 days. Peace lily (Spathiphyllum) ~7 days and it droops dramatically when thirsty then recovers within hours — mention this as a helpful cue in weeklyTips. Fiddle-leaf fig (Ficus lyrata) ~7-10 days, dislikes being moved.

WATER QUALITY: Calathea, Dracaena, Spider plant and other monocots are sensitive to fluoride/chlorine in tap water, which causes brown, crispy leaf tips. For these, recommend distilled or rainwater in weatherNote or soilCheck (letting tap water sit overnight does NOT remove fluoride).

LIGHT: low = >4ft from a window / little natural light; medium = 2-4ft, bright indirect (bright enough to cast a soft shadow, no direct sun); bright = within 2ft or direct sun. Leggy, stretching, pale growth = too little light; bleached/brown papery patches = too much.

HUMIDITY: Most tropicals want ~40-60% (Monstera, Peace Lily, Calathea, ferns lean high, 50-70%). Desert plants (cacti, succulents, snake plants) want dry air, 20-40%. Misting does NOT meaningfully raise humidity — recommend grouping plants or a pebble tray instead. Brown crispy tips on a tropical often mean dry air, not thirst.

NUTRIENTS: Nitrogen (N) drives green leafy growth (deficiency = pale/yellow oldest leaves first). Phosphorus (P) supports roots and flowers (deficiency = stunted, purplish older leaves). Potassium (K) is overall hardiness and flowering (deficiency = browning leaf edges on mature leaves). Feed a balanced fertilizer at HALF label strength roughly monthly in spring/summer only; stop in winter. Do NOT feed newly repotted (wait ~months), stressed, or bone-dry plants — concentrated fertilizer salts burn roots. Overfeeding shows as a white crust on the soil and brown leaf tips; the fix is flushing the pot with water. nutrients[] should give 2-4 short, plain feeding pointers reflecting this.

PET SAFETY (ASPCA): set petSafety to 'toxic', 'mild', or 'safe' (to cats and dogs), with a one-line petSafetyNote. Known: TOXIC — Monstera, Pothos, Philodendron, Peace lily, Aloe, Snake plant, Dracaena/corn plant (all cause GI upset or mouth-burning oxalates; note peace lily is NOT a deadly true lily). MILD — ZZ plant, Fiddle-leaf fig, Tradescantia (Tradescantia mainly a contact skin rash). SAFE — Calathea, Spider plant. If unsure of a species, say so in the note and use your best assessment.

Know the common species and their specifics (Monstera deliciosa, Spathiphyllum, Sansevieria, Epipremnum/pothos, Ficus lyrata, Aloe, ZZ, Calathea, Philodendron, Dracaena, Chlorophytum/spider plant, Tradescantia).

GROWTH STAGES: If a growth stage is given, adapt everything to it. seed — keep the top of the soil consistently moist (never soggy) until germination; effective watering interval 1-3 days; no fertilizer; warmth matters more than light. seedling — light, frequent watering when the surface dries, roughly every 2-4 days; roots are shallow so deep-and-rarely is wrong; no or quarter-strength feeding; gentle light, direct sun scorches. young — transitioning to the species' adult rhythm; set waterFreqDays to roughly 70% of the adult interval; begin half-strength feeding in the growing season. mature — the species intervals above apply unchanged. When asked to identify or re-plan, waterFreqDays MUST reflect the stated stage, and weeklyTips should include one stage-appropriate tip.`;

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
  "weatherNote": string,     // one sentence: how heat/dry air changes this species' watering needs
  "petSafety": "toxic" | "mild" | "safe",  // to cats and dogs (ASPCA)
  "petSafetyNote": string    // one short sentence on the pet risk (or safety)
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
  // The model can emit literal `null` or non-object JSON for nonsense
  // input — normalize so callers can rely on object shape.
  let parsed: unknown;
  try {
    parsed = JSON.parse(data.choices[0].message.content);
  } catch {
    parsed = null;
  }
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : { error: "unparseable" };
}

export type IdentifyDetails = {
  /** Scientific or common species name, if the user knows it. */
  species?: string;
  /** How much light the plant's spot gets in the user's home. */
  spotLight?: "low" | "medium" | "bright";
  /** How far along the plant is — the care plan adapts to the stage. */
  growthStage?: GrowthStage;
};

export async function identifyPlant(input: {
  imageBase64?: string;
  hint?: string;
  details?: IdentifyDetails;
}): Promise<IdentifyResult | null> {
  const context: string[] = [];
  if (input.hint) context.push(`The user calls it: ${input.hint}`);
  if (input.details?.species)
    context.push(`The user believes the species is: ${input.details.species}`);
  if (input.details?.spotLight)
    context.push(
      `Its spot in their home gets ${input.details.spotLight} light — weigh this when setting waterFreqDays (more light and warmth means faster drying).`,
    );
  if (input.details?.growthStage)
    context.push(
      `The plant's growth stage is: ${input.details.growthStage} — set waterFreqDays and tips for this stage, not the adult plant.`,
    );

  const content: OpenAiContentPart[] = [
    {
      type: "text",
      text:
        IDENTIFY_INSTRUCTIONS +
        (context.length ? `\n\n${context.join("\n")}` : ""),
    },
  ];
  if (input.imageBase64) {
    // Accepts a data URL, a bare base64 payload, or an https URL (used when
    // re-planning against a plant's stored photo).
    const url =
      input.imageBase64.startsWith("data:") ||
      input.imageBase64.startsWith("http")
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
    petSafety: (["toxic", "mild", "safe"] as const).includes(
      raw.petSafety as "toxic" | "mild" | "safe",
    )
      ? (raw.petSafety as "toxic" | "mild" | "safe")
      : null,
    petSafetyNote:
      typeof raw.petSafetyNote === "string" ? raw.petSafetyNote : "",
  };
}

class AiResponseError extends Error {}

export async function adviseForPlant(
  plant: Pick<
    Plant,
    "name" | "species" | "growth_stage" | "water_freq_days" | "light" | "humidity" | "soil_check" | "weather_note" | "last_watered"
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

Plant: ${plant.name}${plant.species ? ` (${plant.species})` : ""}; growth stage: ${plant.growth_stage}.
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

  // Malformed model output must surface as a retryable failure, never as
  // fabricated advice (identifyPlant applies the same rule via raw.error).
  if (raw.error || typeof raw.greeting !== "string") {
    throw new AiResponseError("advice response was unusable");
  }

  return {
    greeting: raw.greeting,
    tips: Array.isArray(raw.tips)
      ? raw.tips.filter((t) => typeof t === "string").slice(0, 4)
      : [],
  };
}

const GROWTH_STAGES = ["seed", "seedling", "young", "mature"] as const;
const SEVERITIES = ["ok", "watch", "act"] as const;

/**
 * AI health checkup: a photo of the worrying leaves and/or the owner's
 * description in, a diagnosis against the plant's actual profile and watering
 * record out. Returns null when the model can't assess (mirrors identifyPlant).
 */
export async function checkPlantHealth(
  plant: Pick<
    Plant,
    | "name"
    | "species"
    | "growth_stage"
    | "water_freq_days"
    | "last_watered"
    | "light"
    | "humidity"
    | "room"
    | "soil_check"
    | "weather_note"
  > & {
    /** ISO dates of the most recent waterings, newest first. */
    recentWaterings?: string[];
  },
  weather: Weather | null,
  input: { imageBase64?: string; note?: string },
): Promise<HealthCheckResult | null> {
  const weatherLine = weather
    ? `Current local weather: ${weather.tempC}°C, ${weather.humidityPct}% humidity, wind ${weather.windKmh} km/h.`
    : "No weather data available.";
  const waterings = plant.recentWaterings?.length
    ? plant.recentWaterings.join(", ")
    : "none logged";

  const content: OpenAiContentPart[] = [
    {
      type: "text",
      text: `Assess this specific plant's health from the photo and/or the owner's description.

Plant: ${plant.name}${plant.species ? ` (${plant.species})` : ""}; growth stage: ${plant.growth_stage}.
Schedule: waters every ${plant.water_freq_days} days; last watered ${plant.last_watered ?? "unknown"};
recent waterings: ${waterings}.
Spot: light ${plant.light ?? "unknown"}, humidity preference ${plant.humidity ?? "unknown"}, room: ${plant.room ?? "unknown"}.
Soil check: ${plant.soil_check ?? "n/a"}. Species weather sensitivity: ${plant.weather_note ?? "n/a"}.
${weatherLine}
Owner's concern: ${input.note ?? "none given — judge from the photo"}

Diagnose against the profile: over/under-watering vs the actual watering record, light stress, dry air, feeding, pests. Prefer the least-drastic explanation; "wait and re-check in a week" is a valid outcome. Plain human language, no jargon.

Respond with ONLY a JSON object:
{ "summary": string, "diagnosis": string, "severity": "ok"|"watch"|"act", "advice": string[], "suggestedStage": "seed"|"seedling"|"young"|"mature"|null }
If there is no plant to assess, respond with {"error": "unassessable"}.`,
    },
  ];
  if (input.imageBase64) {
    // Same handling as identifyPlant: data URL, bare base64, or https URL.
    const url =
      input.imageBase64.startsWith("data:") ||
      input.imageBase64.startsWith("http")
        ? input.imageBase64
        : `data:image/jpeg;base64,${input.imageBase64}`;
    content.push({ type: "image_url", image_url: { url, detail: "low" } });
  }

  const raw = await chatJson(BOTANIST_SYSTEM_PROMPT, content);
  if (raw.error) return null;

  return {
    summary: typeof raw.summary === "string" ? raw.summary : "",
    diagnosis: typeof raw.diagnosis === "string" ? raw.diagnosis : "",
    severity: SEVERITIES.includes(raw.severity as (typeof SEVERITIES)[number])
      ? (raw.severity as (typeof SEVERITIES)[number])
      : "watch",
    advice: Array.isArray(raw.advice)
      ? raw.advice.filter((s) => typeof s === "string").slice(0, 5)
      : [],
    suggestedStage: GROWTH_STAGES.includes(raw.suggestedStage as GrowthStage)
      ? (raw.suggestedStage as GrowthStage)
      : null,
  };
}
