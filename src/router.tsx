import type { QueryClient } from '@tanstack/react-query';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';
import { prefetchGrid } from './data/queries';
import { HomePage } from './home/HomePage';
import { RootLayout } from './routes/RootLayout';
import { Loading, NotFound } from './ui/StatusViews';
import { ViewerPage } from './viewer/ViewerPage';

export function createRoutes(queryClient: QueryClient): RouteObject[] {
  // Load the grid before the route commits, so a view transition's "after" snapshot already contains
  // the card it morphs into. Errors surface in the page itself.
  const loadGrid = async () => {
    await prefetchGrid(queryClient);
    return null;
  };

  return [
    {
      element: <RootLayout />,
      // Shown while a deep link's loader runs on first load (usually a blink: three small JSON files).
      hydrateFallbackElement: <Loading />,
      children: [
        { path: '/', element: <HomePage kind="drivers" /> },
        { path: '/teams', element: <HomePage kind="teams" /> },
        { path: '/drivers', element: <Navigate to="/" replace /> },
        { path: '/:kind/:id', element: <ViewerPage />, loader: loadGrid },
        { path: '*', element: <NotFound message="Page not found" backTo="/" backLabel="Back to PaddockGallery" /> },
      ],
    },
  ];
}

export function createRouter(queryClient: QueryClient) {
  return createBrowserRouter(createRoutes(queryClient));
}
