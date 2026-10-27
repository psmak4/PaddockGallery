import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { markCardHero } from '../cards/cardHero';
import styles from './Grid.module.css';

/** One card in a grid, linking to the viewer. Clicking names it card-hero so it morphs into the viewer card. */
export function GridCard({ to, id, label, isHero = false, children }: { to: string; id: string; label: string; isHero?: boolean; children: ReactNode }) {
  return (
    <Link
      to={to}
      state={{ fromGrid: true }}
      viewTransition
      aria-label={label}
      className={styles.link}
      onClick={e => {
        // Name the card before React Router snapshots the page, so it morphs into the viewer card.
        const card = e.currentTarget.querySelector<HTMLElement>('[data-card-id]');
        if (card) markCardHero(card);
      }}
    >
      <div className={styles.cardBox} data-card-id={id} style={isHero ? { viewTransitionName: 'card-hero' } : undefined}>
        {children}
      </div>
    </Link>
  );
}
