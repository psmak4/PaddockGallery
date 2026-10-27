import { Link } from 'react-router';
import styles from './StatusViews.module.css';

export function Loading({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  return (
    <div className={`${styles.status} ${tone === 'dark' ? styles.dark : ''}`} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <span className={styles.visuallyHidden}>Loading…</span>
    </div>
  );
}

export function ErrorState({ onRetry, tone = 'light' }: { onRetry: () => void; tone?: 'light' | 'dark' }) {
  return (
    <div className={`${styles.status} ${tone === 'dark' ? styles.dark : ''}`} role="alert">
      <p>Couldn't load this.</p>
      <button type="button" className={styles.button} onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

export function NotFound({ message, backTo, backLabel }: { message: string; backTo: string; backLabel: string }) {
  return (
    <div className={styles.status}>
      <p>{message}</p>
      <Link className={styles.button} to={backTo}>
        {backLabel}
      </Link>
    </div>
  );
}
