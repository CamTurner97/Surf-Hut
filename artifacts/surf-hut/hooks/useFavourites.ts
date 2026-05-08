import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "@surf_hut/favourites";

/**
 * Persists a set of favourite beach IDs to AsyncStorage.
 * All reads/writes are local — no account needed.
 */
export function useFavourites() {
  const [favouriteIds, setFavouriteIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw) as string[];
          setFavouriteIds(Array.isArray(parsed) ? parsed : []);
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const persist = useCallback((ids: string[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids)).catch(() => {});
  }, []);

  const toggleFavourite = useCallback(
    (id: string) => {
      setFavouriteIds((prev) => {
        const next = prev.includes(id)
          ? prev.filter((x) => x !== id)
          : [...prev, id];
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const isFavourite = useCallback(
    (id: string) => favouriteIds.includes(id),
    [favouriteIds],
  );

  return { favouriteIds, isFavourite, toggleFavourite, ready };
}
