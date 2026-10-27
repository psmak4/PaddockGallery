// Remembers where the user was, so going back to a grid lands on the card they were viewing.
import type { CollectionKind } from '../data/types';

const lastViewed = new Map<CollectionKind, string>();

export function rememberLastViewed(kind: CollectionKind, id: string): void {
  lastViewed.set(kind, id);
}

/** The card last shown in the viewer for this collection. */
export function peekLastViewed(kind: CollectionKind): string | undefined {
  return lastViewed.get(kind);
}

/** Forget it once used, so a later visit to the grid isn't pulled back to it. */
export function clearLastViewed(kind: CollectionKind): void {
  lastViewed.delete(kind);
}

/** True when the element is off-screen or not laid out. */
export function isOutOfView(el: Element): boolean {
  const r = el.getBoundingClientRect();
  return r.height === 0 || r.bottom <= 0 || r.top >= window.innerHeight;
}

export interface NavState {
  fromGrid?: boolean;
}
