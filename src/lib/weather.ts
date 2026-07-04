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
      country_code?: string;
      country?: string;
      admin1?: string;
      latitude: number;
      longitude: number;
    }[];
  };

  // Some hits (continents, oceans, disputed areas) lack country_code/country —
  // don't assume the fields exist, and build a sensible label regardless.
  return (data.results ?? [])
    .filter((r) => typeof r.latitude === "number" && typeof r.longitude === "number")
    .map((r) => {
      const code = r.country_code?.toUpperCase();
      return {
        name: r.name,
        country: r.country ?? "",
        admin1: r.admin1,
        latitude: r.latitude,
        longitude: r.longitude,
        label: code ? `${r.name}, ${code}` : r.name,
      };
    });
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

export type DayOutlook = {
  date: string;
  maxTempC: number;
  meanHumidityPct: number;
};

export type WeekOutlook = {
  days: DayOutlook[];
  hotDays: number;
  dryDays: number;
  /** Multiplier for the coming week, 0.7–1. */
  factor: number;
};

/**
 * 7-day outlook for the weekly watering advisory. Uses hourly forecast
 * (guaranteed open-meteo variables) aggregated per day: daily max temp and
 * mean humidity.
 */
export async function weeklyOutlook(
  lat: number,
  lon: number,
): Promise<WeekOutlook> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("hourly", "temperature_2m,relative_humidity_2m");
  url.searchParams.set("forecast_days", "7");
  url.searchParams.set("timezone", "auto");

  const res = await fetch(url, { next: { revalidate: 3 * 3600 } });
  if (!res.ok) throw new Error(`weekly forecast failed (${res.status})`);
  const data = (await res.json()) as {
    hourly: {
      time: string[];
      temperature_2m: number[];
      relative_humidity_2m: number[];
    };
  };

  const byDay = new Map<string, { temps: number[]; hums: number[] }>();
  data.hourly.time.forEach((t, i) => {
    const day = t.slice(0, 10);
    const bucket = byDay.get(day) ?? { temps: [], hums: [] };
    bucket.temps.push(data.hourly.temperature_2m[i]);
    bucket.hums.push(data.hourly.relative_humidity_2m[i]);
    byDay.set(day, bucket);
  });

  const days: DayOutlook[] = [...byDay.entries()].map(([date, b]) => ({
    date,
    maxTempC: Math.max(...b.temps),
    meanHumidityPct: Math.round(b.hums.reduce((a, v) => a + v, 0) / b.hums.length),
  }));

  let hotDays = 0;
  let dryDays = 0;
  const dayFactors = days.map((d) => {
    const hot = d.maxTempC > 25;
    const dry = d.meanHumidityPct < 40;
    if (hot) hotDays++;
    if (dry) dryDays++;
    if (hot && dry) return 0.7;
    if (hot || dry) return 0.8;
    return 1;
  });
  const factor = days.length
    ? Math.round((dayFactors.reduce((a, v) => a + v, 0) / days.length) * 100) / 100
    : 1;

  return { days, hotDays, dryDays, factor };
}

/**
 * Human line for the weekly watering advisory (empty when the week is mild).
 * Deliberately no day count — each plant's own advisory shows its numbers
 * (base frequency varies per plant, so a generic count would contradict it).
 */
export function weeklyNudge(week: WeekOutlook | null): string {
  if (!week || week.factor >= 0.97) return "";
  const cause =
    week.hotDays > 0 && week.dryDays > 0
      ? "A hot, dry week ahead"
      : week.hotDays > 0
        ? "A warm week ahead"
        : "Dry air this week";
  return `${cause} — your plants will be thirsty sooner than usual.`;
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
