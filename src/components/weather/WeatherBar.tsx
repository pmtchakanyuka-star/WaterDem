"use client";

import Link from "next/link";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudRainWind,
  CloudSnow,
  CloudSun,
  Droplets,
  MapPin,
  Moon,
  Sun,
  Thermometer,
  Wind,
  type LucideIcon,
} from "lucide-react";
import type { Weather } from "@/lib/types";

const ICONS: Record<string, LucideIcon> = {
  sun: Sun,
  moon: Moon,
  "cloud-sun": CloudSun,
  "cloud-moon": CloudMoon,
  cloud: Cloud,
  "cloud-fog": CloudFog,
  "cloud-drizzle": CloudDrizzle,
  "cloud-rain": CloudRain,
  "cloud-rain-wind": CloudRainWind,
  "cloud-snow": CloudSnow,
  "cloud-lightning": CloudLightning,
};

/**
 * Slim glass strip above the garden: current conditions + the watering
 * nudge when it's hot/dry. Links to settings when no location is set.
 */
export default function WeatherBar({
  weather,
  location,
  iconKey,
  nudge,
  loading,
}: {
  weather: Weather | null;
  location: string | null;
  iconKey: string | null;
  nudge: string;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="glass animate-shimmer flex items-center gap-3 px-5 py-3 text-sm text-leaf-mut">
        <Cloud className="size-4" aria-hidden />
        Checking the sky…
      </div>
    );
  }

  if (!weather) {
    return (
      <Link
        href="/settings"
        className="glass glass-interactive flex items-center gap-3 px-5 py-3 text-sm text-leaf-2nd"
      >
        <MapPin className="size-4 text-sage" aria-hidden />
        Set your location to get weather-aware watering advice
      </Link>
    );
  }

  const Icon = ICONS[iconKey ?? "cloud"] ?? Cloud;

  return (
    <div className="glass flex flex-wrap items-center gap-x-5 gap-y-1.5 px-5 py-3 text-sm text-leaf-2nd">
      <span className="flex items-center gap-2 text-leaf-100">
        <Icon className="size-4 text-sage" aria-hidden />
        {location}
      </span>
      <span className="flex items-center gap-1.5">
        <Thermometer className="size-3.5 text-leaf-mut" aria-hidden />
        {weather.tempC}°C
      </span>
      <span className="flex items-center gap-1.5">
        <Droplets className="size-3.5 text-leaf-mut" aria-hidden />
        {weather.humidityPct}%
      </span>
      <span className="flex items-center gap-1.5">
        <Wind className="size-3.5 text-leaf-mut" aria-hidden />
        {weather.windKmh} km/h
      </span>
      {nudge && <span className="text-warn">{nudge}</span>}
    </div>
  );
}
