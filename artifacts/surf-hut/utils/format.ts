import type {
  WaveHeightUnit,
  WindSpeedUnit,
  TemperatureUnit,
} from "@/contexts/UnitsContext";

export function formatWaveHeight(
  metres: number,
  unit: WaveHeightUnit,
): { value: string; unit: string } {
  if (unit === "imperial") {
    return { value: (metres * 3.28084).toFixed(1), unit: "ft" };
  }
  return { value: metres.toFixed(1), unit: "m" };
}

export function formatWindSpeed(
  kmh: number,
  unit: WindSpeedUnit,
): { value: string; unit: string } {
  if (unit === "imperial") {
    return { value: (kmh * 0.621371).toFixed(0), unit: "mph" };
  }
  return { value: kmh.toFixed(0), unit: "km/h" };
}

export function formatTemperature(
  celsius: number,
  unit: TemperatureUnit,
): { value: string; unit: string } {
  if (unit === "imperial") {
    return { value: ((celsius * 9) / 5 + 32).toFixed(0), unit: "°F" };
  }
  return { value: celsius.toFixed(0), unit: "°C" };
}
