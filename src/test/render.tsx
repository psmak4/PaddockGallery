import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router';
import { createRoutes } from '../router';

export function renderRoute(path: string, opts: { routes?: RouteObject[] } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(opts.routes ?? createRoutes(queryClient), { initialEntries: [path] });
  const result = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { ...result, router, queryClient };
}
