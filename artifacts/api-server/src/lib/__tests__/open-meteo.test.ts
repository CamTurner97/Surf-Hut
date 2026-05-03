import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchOpenMeteoSnapshot } from "../open-meteo";

const VALID_MARINE_RESPONSE = {
  current: {
    time: "2024-01-01T12:00",
    wave_height: 1.2,
    wave_period: 10,
    wave_direction: 95,
    sea_surface_temperature: 21.5,
    sea_level_height_msl: 0.3,
  },
};

const VALID_WEATHER_RESPONSE = {
  current: {
    time: "2024-01-01T12:00",
    temperature_2m: 22.0,
    wind_speed_10m: 15.0,
    wind_direction_10m: 270,
  },
};

function makeFetchMock(
  marineData: unknown,
  weatherData: unknown,
  options: { marineOk?: boolean; weatherOk?: boolean } = {},
) {
  const { marineOk = true, weatherOk = true } = options;
  let callCount = 0;
  return vi.fn((_url: string) => {
    callCount += 1;
    const isMarineCall = callCount === 1;
    const ok = isMarineCall ? marineOk : weatherOk;
    const data = isMarineCall ? marineData : weatherData;
    return Promise.resolve({
      ok,
      status: ok ? 200 : 500,
      statusText: ok ? "OK" : "Internal Server Error",
      text: () => Promise.resolve("error body"),
      json: () => Promise.resolve(data),
    });
  });
}

describe("fetchOpenMeteoSnapshot", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", makeFetchMock(VALID_MARINE_RESPONSE, VALID_WEATHER_RESPONSE));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns a well-formed snapshot from valid API responses", async () => {
    const snap = await fetchOpenMeteoSnapshot(-33.89, 151.27);

    expect(snap.waveHeightM).toBe(1.2);
    expect(snap.wavePeriodS).toBe(10);
    expect(snap.waveDirectionDeg).toBe(95);
    expect(snap.windSpeedKmh).toBe(15.0);
    expect(snap.windDirectionDeg).toBe(270);
    expect(snap.airTemperatureC).toBe(22.0);
    expect(snap.waterTemperatureC).toBe(21.5);
    expect(snap.seaLevelM).toBe(0.3);
    expect(snap.fetchedAt).toBeInstanceOf(Date);
    expect(snap.raw).toBeDefined();
  });

  it("includes raw response for debugging", async () => {
    const snap = await fetchOpenMeteoSnapshot(-33.89, 151.27);
    expect(snap.raw.marine).toEqual(VALID_MARINE_RESPONSE);
    expect(snap.raw.weather).toEqual(VALID_WEATHER_RESPONSE);
  });

  it("throws when marine API returns non-ok status", async () => {
    vi.stubGlobal(
      "fetch",
      makeFetchMock({}, VALID_WEATHER_RESPONSE, { marineOk: false }),
    );
    await expect(fetchOpenMeteoSnapshot(-33.89, 151.27)).rejects.toThrow(
      /Open-Meteo request failed/,
    );
  });

  it("throws when weather API returns non-ok status", async () => {
    vi.stubGlobal(
      "fetch",
      makeFetchMock(VALID_MARINE_RESPONSE, {}, { weatherOk: false }),
    );
    await expect(fetchOpenMeteoSnapshot(-33.89, 151.27)).rejects.toThrow(
      /Open-Meteo request failed/,
    );
  });

  it("throws when required marine fields are missing", async () => {
    vi.stubGlobal(
      "fetch",
      makeFetchMock(
        { current: { time: "2024-01-01T12:00" } },
        VALID_WEATHER_RESPONSE,
      ),
    );
    await expect(fetchOpenMeteoSnapshot(-33.89, 151.27)).rejects.toThrow(
      /incomplete data/,
    );
  });

  it("throws when required weather fields are missing", async () => {
    vi.stubGlobal(
      "fetch",
      makeFetchMock(
        VALID_MARINE_RESPONSE,
        { current: { time: "2024-01-01T12:00" } },
      ),
    );
    await expect(fetchOpenMeteoSnapshot(-33.89, 151.27)).rejects.toThrow(
      /incomplete data/,
    );
  });

  it("returns null for optional fields when absent", async () => {
    vi.stubGlobal(
      "fetch",
      makeFetchMock(
        {
          current: {
            time: "2024-01-01T12:00",
            wave_height: 1.2,
            wave_period: 10,
            wave_direction: 95,
          },
        },
        {
          current: {
            time: "2024-01-01T12:00",
            wind_speed_10m: 15,
            wind_direction_10m: 270,
          },
        },
      ),
    );

    const snap = await fetchOpenMeteoSnapshot(-33.89, 151.27);
    expect(snap.airTemperatureC).toBeNull();
    expect(snap.waterTemperatureC).toBeNull();
    expect(snap.seaLevelM).toBeNull();
  });

  it("makes exactly two fetch calls (marine + weather)", async () => {
    const mockFetch = makeFetchMock(VALID_MARINE_RESPONSE, VALID_WEATHER_RESPONSE);
    vi.stubGlobal("fetch", mockFetch);
    await fetchOpenMeteoSnapshot(-33.89, 151.27);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
