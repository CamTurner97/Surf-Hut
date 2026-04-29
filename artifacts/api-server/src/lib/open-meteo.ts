import { logger } from "./logger";

const MARINE_URL = "https://marine-api.open-meteo.com/v1/marine";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

export interface OpenMeteoSnapshot {
  waveHeightM: number;
  wavePeriodS: number;
  waveDirectionDeg: number;
  windSpeedKmh: number;
  windDirectionDeg: number;
  airTemperatureC: number | null;
  waterTemperatureC: number | null;
  seaLevelM: number | null;
  fetchedAt: Date;
  raw: {
    marine: unknown;
    weather: unknown;
  };
}

interface MarineResponse {
  current?: {
    time: string;
    wave_height?: number | null;
    wave_period?: number | null;
    wave_direction?: number | null;
    sea_surface_temperature?: number | null;
    sea_level_height_msl?: number | null;
  };
}

interface WeatherResponse {
  current?: {
    time: string;
    temperature_2m?: number | null;
    wind_speed_10m?: number | null;
    wind_direction_10m?: number | null;
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Open-Meteo request failed: ${res.status} ${res.statusText} — ${body.slice(0, 200)}`,
    );
  }
  return (await res.json()) as T;
}

function pickNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function fetchOpenMeteoSnapshot(
  latitude: number,
  longitude: number,
): Promise<OpenMeteoSnapshot> {
  const marineParams = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current: [
      "wave_height",
      "wave_period",
      "wave_direction",
      "sea_surface_temperature",
      "sea_level_height_msl",
    ].join(","),
    timezone: "Australia/Sydney",
  });
  const weatherParams = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current: ["temperature_2m", "wind_speed_10m", "wind_direction_10m"].join(
      ",",
    ),
    wind_speed_unit: "kmh",
    timezone: "Australia/Sydney",
  });

  const [marine, weather] = await Promise.all([
    fetchJson<MarineResponse>(`${MARINE_URL}?${marineParams.toString()}`),
    fetchJson<WeatherResponse>(`${WEATHER_URL}?${weatherParams.toString()}`),
  ]);

  const m = marine.current;
  const w = weather.current;

  const waveHeightM = pickNumber(m?.wave_height);
  const wavePeriodS = pickNumber(m?.wave_period);
  const waveDirectionDeg = pickNumber(m?.wave_direction);
  const windSpeedKmh = pickNumber(w?.wind_speed_10m);
  const windDirectionDeg = pickNumber(w?.wind_direction_10m);

  if (
    waveHeightM === null ||
    wavePeriodS === null ||
    waveDirectionDeg === null ||
    windSpeedKmh === null ||
    windDirectionDeg === null
  ) {
    logger.warn(
      { marine: m, weather: w },
      "Open-Meteo returned missing core fields",
    );
    throw new Error("Open-Meteo returned incomplete data");
  }

  return {
    waveHeightM,
    wavePeriodS,
    waveDirectionDeg,
    windSpeedKmh,
    windDirectionDeg,
    airTemperatureC: pickNumber(w?.temperature_2m),
    waterTemperatureC: pickNumber(m?.sea_surface_temperature),
    seaLevelM: pickNumber(m?.sea_level_height_msl),
    fetchedAt: new Date(),
    raw: { marine, weather },
  };
}
