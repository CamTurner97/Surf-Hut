import { useUnitsContext } from "@/contexts/UnitsContext";

/**
 * Access the shared unit preferences.
 * State is managed by UnitsProvider in the root layout so all screens
 * share the same preferences and changes are reflected immediately.
 */
export function useUnits() {
  return useUnitsContext();
}
