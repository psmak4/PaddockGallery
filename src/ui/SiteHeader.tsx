import type { ReactNode } from 'react';
import { EDITION_NAMES, EDITIONS, MODES, setEditionMode, useEditionModes, type Edition, type EditionMode } from '../cards/editions';
import { Link, useLocation } from 'react-router';
import type { CollectionKind } from '../data/types';
import { homePath, isCollectionKind } from '../routes/paths';
import { showShortcuts } from './ShortcutsOverlay';
import styles from './SiteHeader.module.css';

const TABS: { kind: CollectionKind; label: string; icon: ReactNode }[] = [
  {
    kind: 'drivers',
    label: 'Drivers',
    // A helmet, visor to the right.
    icon: (
      <>
        <path d="M3 12.5C3 7.8 6.4 4 10.8 4c3.6 0 6.2 2.6 6.2 6v2.5c0 .8-.7 1.5-1.5 1.5H4.5A1.5 1.5 0 0 1 3 12.5z" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M10 8.2h6.6v3.3H10.8a.8.8 0 0 1-.8-.8z" fill="currentColor" />
        <path d="M5 16.5h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </>
    ),
  },
  {
    kind: 'teams',
    label: 'Teams',
    // A chequered flag.
    icon: (
      <>
        <path d="M4.5 17.5V3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M4.5 3.5h11.5v8H4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M4.5 3.5h3.8v4H4.5zM12.1 3.5h3.9v4h-3.9zM8.3 7.5h3.8v4H8.3z" fill="currentColor" />
      </>
    ),
  },
];

const MODE_LABELS: Record<EditionMode, string> = { random: 'Random', always: 'Always', never: 'Never' };
const CHIPS: Record<Edition, string> = { gold: 'Gold', carbon: 'Carbon' };

/** Development only: cycles one special edition between random (as in production), always and never. */
function EditionToggle({ edition }: { edition: Edition }) {
  const mode = useEditionModes()[edition];
  const next = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
  return (
    <button
      type="button"
      className={styles.devToggle}
      data-toggle-edition={edition}
      data-mode={mode}
      aria-label={`${EDITION_NAMES[edition]} cards: ${MODE_LABELS[mode]} (development only)`}
      title={`Development only. ${EDITION_NAMES[edition]} cards: ${MODE_LABELS[mode]}. Click for ${MODE_LABELS[next]}.`}
      onClick={() => setEditionMode(edition, next)}
    >
      <b>{CHIPS[edition]}</b> {MODE_LABELS[mode]}
    </button>
  );
}

/** Where a path sits: its section (the tab it belongs to), and whether it's the card viewer. */
function placeOf(pathname: string): { section: CollectionKind | null; immersive: boolean } {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return { section: 'drivers', immersive: false };
  if (!isCollectionKind(segments[0]) || segments.length > 2) return { section: null, immersive: false };
  return { section: segments[0], immersive: segments.length === 2 };
}

/**
 * The site's pinned glass bar: logo, section tabs, and the keyboard shortcuts button. It lives in the root
 * layout, so it stays mounted across navigation. In the card viewer it's hidden on phones (data-immersive).
 */
export function SiteHeader() {
  const { pathname } = useLocation();
  const { section, immersive } = placeOf(pathname);
  return (
    <header className={styles.bar} data-immersive={immersive || undefined}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand}>
          <span className={styles.mark} aria-hidden="true">
            <i />
            <i />
          </span>
          <span className={styles.wordmark}>PaddockGallery</span>
        </Link>
        <nav className={styles.tabs} aria-label="Browse by">
          {TABS.map(tab => {
            const to = homePath(tab.kind);
            // On a tab's grid it's the current page; on one of its cards it's the current section.
            const current = tab.kind !== section ? undefined : pathname === to ? 'page' : 'true';
            return (
              <Link key={tab.kind} to={to} aria-current={current} className={`${styles.tab} ${current ? styles.active : ''}`}>
                <svg viewBox="0 0 20 20" className={styles.icon} aria-hidden="true">
                  {tab.icon}
                </svg>
                {tab.label}
              </Link>
            );
          })}
        </nav>
        <div className={styles.actions}>
          {/* Development only: Vite drops these (and the toggles' code) from production builds. */}
          {import.meta.env.DEV && EDITIONS.map(edition => <EditionToggle key={edition} edition={edition} />)}
          <button type="button" className={styles.help} aria-label="Keyboard shortcuts" onClick={showShortcuts}>
            ?
          </button>
        </div>
      </div>
    </header>
  );
}
