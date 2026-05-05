import {
  useGetBeachReport,
  getGetBeachReportQueryKey,
} from "@workspace/api-client-react";

/**
 * Fetches the surf, weather, and tide report for a single beach.
 * Stale time matches the backend cache TTL (30 min).
 */
export function useBeachReport(beachId: string) {
  return useGetBeachReport(beachId, {
    query: {
      queryKey: getGetBeachReportQueryKey(beachId),
      staleTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  });
}
