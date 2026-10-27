// Special editions: rare versions of any card, after Topps Chrome's 1/1 parallels.
//   gold       Paddock Gold: a gold refractor field that slowly turns, with a moving sheen
//   carbon     Carbon: a black carbon-fibre weave that stays still, with a glossy resin sheen
//   variation  Image Variation: the regular card with another official photo (a driver's other pose,
//              the car's other side)
// Each card is rolled once per visit (so a special card stays special in the grid, the viewer and the
// strip) and comes up as each edition 1 time in ODDS; never two at once. In development a header toggle
// per edition can force it on every card or turn it off; production builds always roll, without the
// toggles.
import { useSyncExternalStore } from 'react';

export type Edition = 'gold' | 'carbon' | 'variation';
export const EDITIONS: readonly Edition[] = ['gold', 'carbon', 'variation'];
export const EDITION_NAMES: Record<Edition, string> = { gold: 'Paddock Gold', carbon: 'Carbon', variation: 'Image Variation' };

/** Each edition's odds, per card per visit. */
export const ODDS = 500;

export type EditionMode = 'random' | 'always' | 'never';
export const MODES: readonly EditionMode[] = ['random', 'always', 'never'];

const storageKey = (edition: Edition) => `paddockgallery.edition.${edition}`;

const rolls = new Map<string, Edition | null>();
const picks = new Map<string, number>();

/** This card's edition this visit (e.g. "drivers/norris"); rolled the first time it's asked. */
export function rollEdition(cardKey: string, random: () => number = Math.random): Edition | null {
  if (!rolls.has(cardKey)) {
    const r = random();
    rolls.set(cardKey, EDITIONS.find((_edition, i) => r < (i + 1) / ODDS) ?? null);
  }
  return rolls.get(cardKey) ?? null;
}

/** Which of a card's `count` alternate images its Image Variation shows; picked once per visit. */
export function pickVariant(cardKey: string, count: number, random: () => number = Math.random): number {
  let pick = picks.get(cardKey);
  if (pick === undefined) {
    pick = Math.floor(random() * count);
    picks.set(cardKey, pick);
  }
  return Math.min(pick, count - 1);
}

// The modes: shared by every card and the toggles, remembered in localStorage (development only).
const RANDOM_MODES: Record<Edition, EditionMode> = { gold: 'random', carbon: 'random', variation: 'random' };
let modes: Record<Edition, EditionMode> | null = null;
const listeners = new Set<() => void>();

function readMode(edition: Edition): EditionMode {
  try {
    const stored = localStorage.getItem(storageKey(edition));
    return MODES.includes(stored as EditionMode) ? (stored as EditionMode) : 'random';
  } catch {
    return 'random';
  }
}

function getModes(): Record<Edition, EditionMode> {
  if (!import.meta.env.DEV) return RANDOM_MODES;
  modes ??= { gold: readMode('gold'), carbon: readMode('carbon'), variation: readMode('variation') };
  return modes;
}

export function setEditionMode(edition: Edition, next: EditionMode): void {
  modes = { ...getModes(), [edition]: next };
  try {
    localStorage.setItem(storageKey(edition), next);
  } catch {
    // Private mode or blocked storage: keep the in-memory value for this session.
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useEditionModes(): Record<Edition, EditionMode> {
  return useSyncExternalStore(subscribe, getModes, getModes);
}

/**
 * The edition to show this card as, or null for the regular card. "Always" wins, in EDITIONS order.
 * Editions the card can't show (an Image Variation without an alternate image) are skipped.
 */
export function useEdition(cardKey: string, available: (edition: Edition) => boolean = () => true): Edition | null {
  const current = useEditionModes();
  const forced = EDITIONS.find(e => current[e] === 'always' && available(e));
  if (forced) return forced;
  const rolled = rollEdition(cardKey);
  return rolled && current[rolled] !== 'never' && available(rolled) ? rolled : null;
}

/** Forget the rolls and the modes, so each test starts from scratch. */
export function resetEditionsForTests(): void {
  rolls.clear();
  picks.clear();
  modes = null;
}
