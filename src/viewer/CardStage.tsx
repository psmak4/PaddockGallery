import type { ReactNode } from 'react';
import { CardBack } from './details/CardBack';
import styles from './CardStage.module.css';

interface CardStageProps {
  name: string;
  orientation?: 'portrait' | 'landscape';
  front: ReactNode;
  back: ReactNode;
  /** Show the back (details) instead of the front. */
  flipped?: boolean;
  /** Clicking the card (or pressing Enter/Space on it) asks to flip it to this side. */
  onFlip?: (flipped: boolean) => void;
}

/** The hero card: its front is the card face, its back holds the details. */
export function CardStage({ name, orientation = 'portrait', front, back, flipped = false, onFlip = () => {} }: CardStageProps) {
  return (
    <div
      className={`${styles.card} ${styles[orientation]}`}
      style={{ viewTransitionName: 'card-hero' }}
      data-flipped={flipped}
      data-orientation={orientation}
    >
      <div className={`${styles.flipper} ${flipped ? styles.flipped : ''}`}>
        <button
          type="button"
          className={`${styles.face} ${styles.front}`}
          aria-label={`Show details for ${name}`}
          aria-hidden={flipped || undefined}
          inert={flipped}
          onClick={() => onFlip(true)}
        >
          {front}
        </button>
        <CardBack active={flipped} onFlipBack={() => onFlip(false)} className={`${styles.face} ${styles.back}`}>
          {back}
        </CardBack>
      </div>
    </div>
  );
}
