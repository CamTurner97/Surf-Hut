import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const STORAGE_KEY = "@surf_hut/favourites";

interface FavouritesContextValue {
  favouriteIds: string[];
  isFavourite: (id: string) => boolean;
  toggleFavourite: (id: string) => void;
  ready: boolean;
}

const FavouritesContext = createContext<FavouritesContextValue>({
  favouriteIds: [],
  isFavourite: () => false,
  toggleFavourite: () => {},
  ready: false,
});

export function FavouritesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
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

  return (
    <FavouritesContext.Provider
      value={{ favouriteIds, isFavourite, toggleFavourite, ready }}
    >
      {children}
    </FavouritesContext.Provider>
  );
}

export function useFavouritesContext() {
  return useContext(FavouritesContext);
}
