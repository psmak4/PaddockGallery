import type { ReactNode } from 'react';
import styles from './CardBack.module.css';

interface CardBackProps {
  /** Face-up: expose the face to assistive tech and the keyboard. */
  active: boolean;
  onFlipBack: () => void;
  className?: string;
  children: ReactNode;
}

/** The back face of the flipped card; a click anywhere on it turns the card face-up again. */
export function CardBack({ active, onFlipBack, className = '', children }: CardBackProps) {
  return (
    <section
      className={`${styles.back} ${className}`}
      aria-label="Details"
      aria-hidden={!active || undefined}
      inert={!active}
      onClick={e => {
        // Except on its own links and buttons, or when the click just finished selecting text.
        if ((e.target as Element).closest('button, a')) return;
        if (window.getSelection()?.toString()) return;
        onFlipBack();
      }}
    >
      <button type="button" className={styles.flipBack} aria-label="Show card" onClick={onFlipBack}>
        <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
          <path
            d="M4.5 8.5a6 6 0 0 1 11-1.5M15.5 11.5a6 6 0 0 1-11 1.5M15.5 3.5V7h-3.5M4.5 16.5V13H8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {children}
    </section>
  );
}
