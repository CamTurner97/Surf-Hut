import { listBeaches, getListBeachesQueryKey } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";

/**
 * Fetches the full beach catalogue (with latest cached scores) from the API.
 * Re-fetches every 10 minutes; does not refetch on window focus.
 */
export function useBeaches() {
  return useQuery({
    queryKey: getListBeachesQueryKey(),
    queryFn: listBeaches,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
