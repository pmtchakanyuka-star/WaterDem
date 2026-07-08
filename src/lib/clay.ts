/**
 * Shared "soft claymation" palette for the 3D home — the look approved from the
 * reference renders: fresh glossy-matte green plants in two-tone teal/terracotta
 * clay pots, warm rustic wood, terracotta upholstery and teal accents on a cream
 * ground. One system so plants, pots and furniture read as a set.
 *
 * Clay materials are meshStandardMaterial with mid roughness (soft sheen, not
 * mirror), no metalness, and a little envMapIntensity so the procedural
 * Environment gives them a gentle waxy highlight.
 */
export const CLAY = {
  // plants
  leaf: "#7cc64a",
  leafDeep: "#4f9a3f",
  stem: "#4e9a4a",
  soil: "#3d2c1b",

  // two-tone pot
  potTeal: "#4a9db0",
  potTealRim: "#54abbd",
  potTerracotta: "#c1794f",
  saucer: "#b56b45",

  // furniture
  terracotta: "#c37c55",
  terracottaSoft: "#cf8a63",
  wood: "#c99a5b",
  woodDeep: "#a97e42",
  teal: "#4a9db0",
  tealSoft: "#6bb6c4",
  cream: "#efe7d5",
  creamSoft: "#f4eede",
  rugSand: "#dccaa6",
  rugTeal: "#4a9db0",
} as const;

/** Roughness presets tuned for the soft-clay sheen. */
export const CLAY_ROUGH = {
  matte: 0.62,
  clay: 0.5,
  waxy: 0.4,
} as const;
