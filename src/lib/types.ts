import type { RoomKey } from "@/lib/home";

export type CareLevel = "easy" | "moderate" | "expert";
export type LightLevel = "low" | "medium" | "bright";
export type HumidityLevel = "low" | "medium" | "high";
export type PetSafety = "toxic" | "mild" | "safe";

/** Home-view "avatar" for a plant: its look and its pot, chosen by the user. */
export type PlantLook = "monstera" | "fern" | "palm" | "banana" | "cannabis" | "flower";
export type PotLook = "twotone" | "terracotta" | "teal" | "rasta" | "sand";

/** Life stage of a plant — drives stage-aware AI care plans and 3D scale. */
export type GrowthStage = "seed" | "seedling" | "young" | "mature";

export type Plant = {
  id: string;
  owner_id: string;
  name: string;
  species: string | null;
  common_name: string | null;
  image_url: string | null;
  icon_key: string | null;
  water_freq_days: number;
  care_level: CareLevel | null;
  light: LightLevel | null;
  humidity: HumidityLevel | null;
  soil_check: string | null;
  weather_note: string | null;
  nutrients: string[];
  weekly_tips: string[];
  fun_facts: string[];
  pet_safety: PetSafety | null;
  pet_safety_note: string | null;
  room: RoomKey | null;
  plant_look: PlantLook | null;
  pot_look: PotLook | null;
  growth_stage: GrowthStage;
  is_public: boolean;
  last_watered: string | null;
  created_at: string;
};

export type UserPublic = {
  id: string;
  nickname: string;
  garden_is_public: boolean;
};

export type UserSettings = UserPublic & {
  location_lat: number | null;
  location_lon: number | null;
  location_label: string | null;
  home_spaces: RoomKey[];
};

export type Weather = {
  tempC: number;
  humidityPct: number;
  windKmh: number;
  /** open-meteo WMO weather code */
  code: number;
  isDay: boolean;
};

export type IdentifyResult = {
  name: string;
  species: string;
  commonName: string;
  iconKey: string;
  confidence: number;
  waterFreqDays: number;
  careLevel: CareLevel;
  light: LightLevel;
  humidity: HumidityLevel;
  soilCheck: string;
  nutrients: string[];
  weeklyTips: string[];
  funFacts: string[];
  weatherNote: string;
  petSafety: PetSafety | null;
  petSafetyNote: string;
};

export type Advice = {
  greeting: string;
  tips: string[];
};

/** What the AI botanist returns from a health checkup. */
export type HealthCheckResult = {
  summary: string;
  diagnosis: string;
  severity: "ok" | "watch" | "act";
  advice: string[];
  suggestedStage: GrowthStage | null;
};

/** A stored health_checks row (owner-only history in the detail sheet). */
export type HealthCheck = {
  id: string;
  image_url: string | null;
  note: string | null;
  severity: "ok" | "watch" | "act";
  summary: string;
  diagnosis: string;
  advice: string[];
  suggested_stage: GrowthStage | null;
  created_at: string;
};

export type GardenShare = {
  id: string;
  viewer_id: string;
  viewer_nickname: string;
  created_at: string;
};
