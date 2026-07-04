import type { Weather } from "@/lib/types";

/**
 * open-meteo.com — free, no API key. Geocoding for city -> coords, forecast
 * for current conditions. Brief §1/§6.
 */

export type GeocodeHit = {
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  /** e.g. "Tokyo, JP" — stored as users.location_label */
  label: string;
};

export async function geocodeCity(query: string): Promise<GeocodeHit[]> {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", query);
  url.searchParams.set("count", "6");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`geocoding failed (${res.status})`);
  const data = (await res.json()) as {
    results?: {
      name: string;
      country_code: string;
      country: string;
      admin1?: string;
      latitude: number;
      longitude: number;
    }[];
  };

  return (data.results ?? []).map((r) => ({
    name: r.name,
    country: r.country,
    admin1: r.admin1,
    latitude: r.latitude,
    longitude: r.longitude,
    label: `${r.name}, ${r.country_code.toUpperCase()}`,
  }));
}

export async function currentWeather(
  lat: number,
  lon: number,
): Promise<Weather> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,is_day",
  );

  const res = await fetch(url, { next: { revalidate: 900 } });
  if (!res.ok) throw new Error(`weather failed (${res.status})`);
  const data = (await res.json()) as {
    current: {
      temperature_2m: number;
      relative_humidity_2m: number;
      wind_speed_10m: number;
      weather_code: number;
      is_day: number;
    };
  };

  return {
    tempC: Math.round(data.current.temperature_2m * 10) / 10,
    humidityPct: Math.round(data.current.relative_humidity_2m),
    windKmh: Math.round(data.current.wind_speed_10m),
    code: data.current.weather_code,
    isDay: data.current.is_day === 1,
  };
}

/**
 * Watering-urgency multiplier applied to a plant's base frequency:
 * hot (>25°C) OR dry (<40% RH) -> water sooner (0.8×); both -> 0.7×.
 */
export function wateringFactor(weather: Weather | null): number {
  if (!weather) return 1;
  const hot = weather.tempC > 25;
  const dry = weather.humidityPct < 40;
  if (hot && dry) return 0.7;
  if (hot || dry) return 0.8;
  return 1;
}

/** Human line for the weather nudge (empty when conditions are mild). */
export function weatherNudge(weather: Weather | null): string {
  const factor = wateringFactor(weather);
  if (!weather || factor === 1) return "";
  const hot = weather.tempC > 25;
  const dry = weather.humidityPct < 40;
  if (hot && dry) return "Hot and dry today — your plants will be thirstier.";
  if (hot) return "Warm today — plants may want water a little sooner.";
  return "Dry air today — plants may want water a little sooner.";
}

/** Map open-meteo WMO codes to a Lucide icon name (rendered client-side). */
export function weatherIconKey(code: number, isDay: boolean): string {
  if (code === 0) return isDay ? "sun" : "moon";
  if (code <= 2) return isDay ? "cloud-sun" : "cloud-moon";
  if (code === 3) return "cloud";
  if (code <= 48) return "cloud-fog";
  if (code <= 57) return "cloud-drizzle";
  if (code <= 67) return "cloud-rain";
  if (code <= 77) return "cloud-snow";
  if (code <= 82) return "cloud-rain-wind";
  if (code <= 86) return "cloud-snow";
  return "cloud-lightning";
}
