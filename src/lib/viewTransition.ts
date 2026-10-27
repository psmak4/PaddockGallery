// App-driven view transition for the viewer's card-to-card navigation, which React Router
// doesn't animate itself. Back navigations (POP) are left to React Router, which replays the
// view transition of the original forward link.

type Direction = 'forward' | 'back';

let pendingCommit: (() => void) | null = null;
let latest = 0;

/** Runs `update` (a navigation) inside document.startViewTransition, or directly when unsupported. */
export function runViewTransition(update: () => void, options: { direction?: Direction } = {}): void {
  if (typeof document.startViewTransition !== 'function') {
    update();
    return;
  }
  const root = document.documentElement;
  const token = ++latest;
  if (options.direction) root.dataset.navDirection = options.direction;
  else delete root.dataset.navDirection;

  const transition = document.startViewTransition(
    () =>
      new Promise<void>(resolve => {
        pendingCommit = resolve;
        update();
        setTimeout(resolve, 600); // never leave the page frozen if the commit signal is missed
      }),
  );
  transition.finished.finally(() => {
    if (token === latest) delete root.dataset.navDirection; // a newer transition owns it otherwise
  });
}

/** Called once the new route has committed (RootLayout's layout effect). */
export function resolvePendingTransition(): void {
  pendingCommit?.();
  pendingCommit = null;
}
