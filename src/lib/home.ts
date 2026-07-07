/**
 * The home / living-space model. Pure data + validators shared by the API
 * (authority) and the 3D Home view.
 */

export const ROOM_KEYS = [
  "living_room",
  "kitchen",
  "bedroom",
  "bathroom",
  "balcony",
] as const;

export type RoomKey = (typeof ROOM_KEYS)[number];

export const ROOMS: Record<
  RoomKey,
  { label: string; blurb: string; icon: string }
> = {
  living_room: {
    label: "Living room",
    blurb: "Bright and sociable — medium light",
    icon: "sofa",
  },
  kitchen: {
    label: "Kitchen",
    blurb: "Warm and steamy by the window",
    icon: "cooking-pot",
  },
  bedroom: {
    label: "Bedroom",
    blurb: "Calm, gentler light",
    icon: "bed",
  },
  bathroom: {
    label: "Bathroom",
    blurb: "Humid and low-light — ferns love it",
    icon: "bath",
  },
  balcony: {
    label: "Balcony",
    blurb: "The brightest spot you've got",
    icon: "sun",
  },
};

export const MAX_SPACES = 2;

export function isRoomKey(v: unknown): v is RoomKey {
  return typeof v === "string" && (ROOM_KEYS as readonly string[]).includes(v);
}

/**
 * Validate a proposed home_spaces array: an array of ≤2 unique valid keys.
 * Returns the cleaned list, or null if the input is not a valid selection.
 */
export function normalizeHomeSpaces(v: unknown): RoomKey[] | null {
  if (!Array.isArray(v)) return null;
  const out: RoomKey[] = [];
  for (const item of v) {
    if (!isRoomKey(item)) return null;
    if (!out.includes(item)) out.push(item);
  }
  if (out.length > MAX_SPACES) return null;
  return out;
}

/** Coerce an unknown value (DB row) to a RoomKey or null. */
export function toRoomKey(v: unknown): RoomKey | null {
  return isRoomKey(v) ? v : null;
}

/**
 * Read home_spaces from a DB row. postgres.js (over the transaction pooler)
 * returns jsonb as a raw string, so accept either a JSON string or an array.
 * Lenient: drops unknown/duplicate keys and caps at MAX_SPACES rather than
 * rejecting (the value already passed input validation when it was written).
 */
export function coerceHomeSpaces(raw: unknown): RoomKey[] {
  let value = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];
  const out: RoomKey[] = [];
  for (const item of value) {
    if (isRoomKey(item) && !out.includes(item)) out.push(item);
  }
  return out.slice(0, MAX_SPACES);
}

export const SLOTS_PER_ROOM = 5;

/**
 * Local-space slot positions [x, y, z] within a room group. Elevated y values
 * sit a plant on a surface (shelf/counter/nightstand); y≈0 is the floor.
 */
export const SLOTS: Record<RoomKey, [number, number, number][]> = {
  living_room: [
    [-1.15, 0.92, -0.95],
    [-0.45, 0.92, -0.95],
    [0.95, 0.0, 0.45],
    [-1.2, 0.0, 0.95],
    [0.35, 0.0, 1.0],
  ],
  kitchen: [
    [-1.15, 1.02, -0.9],
    [-0.45, 1.02, -0.9],
    [0.3, 1.02, -0.9],
    [1.1, 1.02, -0.5],
    [0.95, 0.0, 0.85],
  ],
  bedroom: [
    [-1.2, 0.62, -0.85],
    [1.1, 0.0, -0.9],
    [-1.2, 0.0, 0.95],
    [0.4, 0.0, 1.0],
    [1.1, 0.0, 0.6],
  ],
  bathroom: [
    [1.0, 0.66, -0.85],
    [-1.2, 0.98, -0.9],
    [-1.1, 0.0, 0.95],
    [0.2, 0.0, 1.0],
    [1.0, 0.0, 0.7],
  ],
  balcony: [
    [-1.15, 0.55, -0.9],
    [-0.35, 0.55, -0.9],
    [0.5, 0.55, -0.9],
    [-1.0, 0.0, 0.85],
    [0.6, 0.0, 0.95],
  ],
};
