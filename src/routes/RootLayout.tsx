import { useLayoutEffect } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router';
import { resolvePendingTransition } from '../lib/viewTransition';
import { ShortcutsOverlay } from '../ui/ShortcutsOverlay';
import { SiteHeader } from '../ui/SiteHeader';

export function RootLayout() {
  const location = useLocation();
  // Runs after the new route's own layout effects (scroll-into-view, hero marks), so the
  // "after" snapshot of an app-driven view transition sees the finished page.
  useLayoutEffect(() => {
    resolvePendingTransition();
  }, [location.key]);
  return (
    <>
      <ScrollRestoration />
      <SiteHeader />
      <Outlet />
      <ShortcutsOverlay />
    </>
  );
}
