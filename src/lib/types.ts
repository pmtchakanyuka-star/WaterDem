import type { RoomKey } from "@/lib/home";

export type CareLevel = "easy" | "moderate" | "expert";
export type LightLevel = "low" | "medium" | "bright";
export type HumidityLevel = "low" | "medium" | "high";
export type PetSafety = "toxic" | "mild" | "safe";

/** Home-view "avatar" for a plant: its look and its pot, chosen by the user. */
export type PlantLook = "monstera" | "fern" | "palm" | "banana" | "cannabis" | "flower";
export type PotLook = "twotone" | "terracotta" | "teal" | "rasta" | "sand";

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

export type GardenShare = {
  id: string;
  viewer_id: string;
  viewer_nickname: string;
  created_at: string;
};
