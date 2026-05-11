import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const STORAGE_KEY = "@surf_hut/units";

export type WaveHeightUnit = "metric" | "imperial"; // m | ft
export type WindSpeedUnit = "metric" | "imperial";   // km/h | mph
export type TemperatureUnit = "metric" | "imperial"; // °C | °F

export interface UnitsPreferences {
  waveHeight: WaveHeightUnit;
  windSpeed: WindSpeedUnit;
  temperature: TemperatureUnit;
}

const DEFAULT: UnitsPreferences = {
  waveHeight: "metric",
  windSpeed: "metric",
  temperature: "metric",
};

interface UnitsContextValue {
  units: UnitsPreferences;
  setWaveHeight: (u: WaveHeightUnit) => void;
  setWindSpeed: (u: WindSpeedUnit) => void;
  setTemperature: (u: TemperatureUnit) => void;
}

const UnitsContext = createContext<UnitsContextValue>({
  units: DEFAULT,
  setWaveHeight: () => {},
  setWindSpeed: () => {},
  setTemperature: () => {},
});

export function UnitsProvider({ children }: { children: React.ReactNode }) {
  const [units, setUnits] = useState<UnitsPreferences>(DEFAULT);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<UnitsPreferences>;
          setUnits((prev) => ({ ...prev, ...parsed }));
        }
      })
      .catch(() => {});
  }, []);

  const persist = useCallback((next: UnitsPreferences) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const setWaveHeight = useCallback(
    (waveHeight: WaveHeightUnit) => {
      setUnits((prev) => {
        const next = { ...prev, waveHeight };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const setWindSpeed = useCallback(
    (windSpeed: WindSpeedUnit) => {
      setUnits((prev) => {
        const next = { ...prev, windSpeed };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const setTemperature = useCallback(
    (temperature: TemperatureUnit) => {
      setUnits((prev) => {
        const next = { ...prev, temperature };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  return (
    <UnitsContext.Provider
      value={{ units, setWaveHeight, setWindSpeed, setTemperature }}
    >
      {children}
    </UnitsContext.Provider>
  );
}

export function useUnitsContext() {
  return useContext(UnitsContext);
}
