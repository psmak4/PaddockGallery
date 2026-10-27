import { QueryClient, queryOptions, useQuery } from '@tanstack/react-query';
import { fetchGrid, HttpError } from './catalog';
import type { Driver, Grid, Team } from './types';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Retry an occasional 5xx, but a 404 is final.
        retry: (failureCount, error) => !(error instanceof HttpError && error.status === 404) && failureCount < 3,
        refetchOnWindowFocus: false,
      },
    },
  });
}

/** The grid with lookups by id; every page reads this one query. */
export interface GridIndex extends Grid {
  driverById: Map<string, Driver>;
  teamById: Map<string, Team>;
}

function indexGrid(grid: Grid): GridIndex {
  return {
    ...grid,
    driverById: new Map(grid.drivers.map(d => [d.id, d])),
    teamById: new Map(grid.teams.map(t => [t.id, t])),
  };
}

const gridQuery = queryOptions({ queryKey: ['grid'], queryFn: fetchGrid, staleTime: Infinity, select: indexGrid });

export const useGrid = () => useQuery(gridQuery);

/** Warms the cache before a route commits; never throws (the page shows any error). */
export function prefetchGrid(queryClient: QueryClient): Promise<void> {
  return queryClient.prefetchQuery(gridQuery);
}
