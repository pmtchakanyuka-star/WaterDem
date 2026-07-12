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

export const SLOTS_PER_ROOM = 8;

/**
 * Local-space slot positions [x, y, z] within a room group. Elevated y values
 * sit a plant on a surface (shelf/counter/nightstand/tub rim/planter) at that
 * surface's exact top height; y=0 is the floor. Hand-placed so every slot's
 * 0.25-radius footprint clears all furniture, walls and the window sill in
 * rooms.tsx / RoomShell.tsx, with ≥0.55 between slot centres.
 */
export const SLOTS: Record<RoomKey, [number, number, number][]> = {
  living_room: [
    [-1.2, 0.9, -0.95], // shelf, left
    [-0.55, 0.9, -0.95], // shelf, right
    [1.35, 0.0, 0.0], // floor, beside the sofa's right arm
    [0.3, 0.0, 1.4], // floor, front of the sofa on the rug edge
    [-1.25, 0.0, -0.35], // floor, left wall between shelf and table
    [1.35, 0.0, -1.05], // floor, back-right by the window
    [-1.25, 0.0, 1.25], // floor, front-left corner
    [-0.6, 0.0, -0.35], // floor, mid-room behind the coffee table
  ],
  kitchen: [
    [-1.2, 0.97, -0.9], // counter, left
    [-0.45, 0.97, -0.88], // counter, centre-left
    [0.35, 0.97, -0.9], // counter, under the window light
    [1.3, 0.0, -0.15], // floor, right of the counter's end
    [-1.25, 0.0, 0.1], // floor, left wall
    [0.0, 0.0, 1.35], // floor, front centre
    [1.3, 0.0, 0.9], // floor, front-right
    [-1.25, 0.0, 1.25], // floor, front-left corner
  ],
  bedroom: [
    [-1.2, 0.5, -0.85], // nightstand top
    [1.35, 0.0, -0.9], // floor, back-right corner behind the bed
    [-1.25, 0.0, -0.1], // floor, left wall beside the bed
    [0.5, 0.0, -1.05], // floor, under the window behind the headboard
    [-1.25, 0.0, 1.3], // floor, front-left corner
    [-0.35, 0.0, -1.1], // floor, back wall left of the window
    [-1.25, 0.0, 0.6], // floor, left wall mid-room
    [-0.7, 0.0, 1.4], // floor, front, past the bed's foot
  ],
  bathroom: [
    [1.35, 0.575, -1.1], // tub rim, back corner
    [-1.25, 0.0, -1.05], // floor, back-left corner
    [-1.25, 0.0, -0.35], // floor, left wall beside the tub
    [-1.2, 0.0, 0.9], // floor, beside the bath mat
    [0.35, 0.0, 1.35], // floor, front centre
    [1.3, 0.0, 0.15], // floor, right, in front of the tub
    [-0.5, 0.0, 1.3], // floor, front-left past the mat
    [1.3, 0.0, 1.2], // floor, front-right corner
  ],
  balcony: [
    [-1.05, 0.55, -0.9], // planter box, left
    [-0.3, 0.55, -0.9], // planter box, centre
    [0.5, 0.55, -0.9], // planter box, right
    [1.35, 0.0, -0.25], // deck, right rail end past the planter
    [-1.25, 0.0, 0.1], // deck, left wall
    [0.4, 0.0, 0.35], // deck, centre beside the chair
    [-1.25, 0.0, 1.3], // deck, front-left corner
    [-0.35, 0.0, 1.35], // deck, front centre-left
  ],
};
