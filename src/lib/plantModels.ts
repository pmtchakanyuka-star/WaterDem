import type { Plant, PlantLook } from "@/lib/types";

/**
 * The 15 real plant meshes inside /models/plants.glb (Tropical Plants Pack
 * M02P by MozzarellaARC, CC-BY). Node names are exactly as authored — drei's
 * useGLTF keys `nodes` by these.
 */
export const MODEL_PATH = "/models/plants.glb";

const MONSTERA = [
  "tree.007SM_MZRa_Monstera_B072",
  "tree.006SM_MZRa_Monstera_B071",
  "tree.003SM_MZRa_Monstera_B073",
  "tree.002SM_MZRa_Monstera_B074",
];
const FERN = [
  "SM_MZRa_Fern_B0532",
  "SM_MZRa_Fern_B0512",
  "SM_MZRa_Fern_B0522",
  "SM_MZRa_Fern_B052",
  "SM_MZRa_Fern_B053",
  "SM_MZRa_Fern_B051",
];
const PALM = ["SM_MZRa_Palm_B081", "SM_MZRa_Palm_B082", "SM_MZRa_Palm_B083"];
const BANANA = ["SM_MZRa_Banana_B091", "SM_MZRa_Banana_B092"];

export const ALL_MODEL_NODES = [...MONSTERA, ...FERN, ...PALM, ...BANANA];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 9973;
  return h;
}

/**
 * Pick a model node for a plant: match the species/name to the closest real
 * species where we can, otherwise assign one deterministically by id so each
 * plant keeps a consistent look with variety across the garden.
 */
export function modelNodeFor(plant: Pick<Plant, "id" | "name" | "species" | "common_name">): string {
  const hay = `${plant.species ?? ""} ${plant.common_name ?? ""} ${plant.name}`.toLowerCase();
  // Default to the lush monstera — it reads best in the clay style — and only
  // switch to fern/palm/banana on a clear species match.
  let pool = MONSTERA;
  if (/fern|calathea|spider|chlorophytum|maidenhair|nephrolepis/.test(hay)) pool = FERN;
  else if (/palm|snake|sansevieria|dracaena|aloe|\bzz\b|yucca|cactus|succulent/.test(hay)) pool = PALM;
  else if (/banana|bird of paradise|strelitzia|rubber|ficus|elephant/.test(hay)) pool = BANANA;
  return pool[hash(plant.id) % pool.length];
}

/**
 * A plant reads as cannabis when its name/species mentions it — so the user can
 * make any plant a cannabis plant by naming it. Includes the ganja-culture slang
 * that fits WaterDem's "put water pon dem tings" vibe.
 */
export function isCannabis(plant: Pick<Plant, "name" | "species" | "common_name">): boolean {
  const hay = `${plant.species ?? ""} ${plant.common_name ?? ""} ${plant.name}`.toLowerCase();
  return /(cannabis|marijuana|\bweed\b|ganja|\bhemp\b|\bkush\b|sativa|indica|reefer|spliff|\b420\b|mary ?jane|bomboclaat|bumboclaat|rasta)/.test(hay);
}

/** Looks rendered procedurally (no GLB node): cannabis + the flower family. */
export const PROCEDURAL_LOOKS = ["cannabis", "flower", "lily", "orchid", "violet"] as const;
export type ProceduralLook = (typeof PROCEDURAL_LOOKS)[number];

export function isProceduralLook(look: PlantLook | null): look is ProceduralLook {
  return !!look && (PROCEDURAL_LOOKS as readonly string[]).includes(look);
}

const POOLS: Record<Exclude<PlantLook, ProceduralLook>, string[]> = {
  monstera: MONSTERA,
  fern: FERN,
  palm: PALM,
  banana: BANANA,
};

/**
 * The GLB node for a plant given an explicit look (from the user's choice).
 * Procedural looks have no GLB node — for those, and for null (auto), fall
 * back to species-derived selection; the caller renders the procedural plant
 * instead of the returned node.
 */
export function modelNodeForLook(
  plant: Pick<Plant, "id" | "name" | "species" | "common_name">,
  look: PlantLook | null,
): string {
  if (look && !isProceduralLook(look)) {
    const pool = POOLS[look];
    return pool[hash(plant.id) % pool.length];
  }
  return modelNodeFor(plant);
}
