import { useFavouritesContext } from "@/contexts/FavouritesContext";

/**
 * Access the shared favourites state.
 * State is managed by FavouritesProvider in the root layout so all screens
 * share the same in-memory list — toggling from any screen updates everywhere
 * instantly, with AsyncStorage used only for persistence across app restarts.
 */
export function useFavourites() {
  return useFavouritesContext();
}
