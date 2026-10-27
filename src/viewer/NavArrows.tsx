import styles from './NavArrows.module.css';

interface NavArrowsProps {
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export function NavArrow({ dir, onClick, disabled }: { dir: 'prev' | 'next'; onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      className={`${styles.arrow} ${styles[dir]}`}
      aria-label={dir === 'prev' ? 'Previous card' : 'Next card'}
      onClick={onClick}
      disabled={disabled}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d={dir === 'prev' ? 'M14.5 5.5 8 12l6.5 6.5' : 'M9.5 5.5 16 12l-6.5 6.5'}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export function NavArrows({ onPrev, onNext, hasPrev, hasNext }: NavArrowsProps) {
  return (
    <>
      <NavArrow dir="prev" onClick={onPrev} disabled={!hasPrev} />
      <NavArrow dir="next" onClick={onNext} disabled={!hasNext} />
    </>
  );
}
