import { Link } from 'react-router';
import styles from './TopBar.module.css';

interface TopBarProps {
  backTo: string;
  backLabel: string;
  /** When set, the back pill runs this instead of navigating (used to pop history). */
  onBack?: () => void;
}

export function TopBar({ backTo, backLabel, onBack }: TopBarProps) {
  return (
    <div className={styles.bar}>
      <Link
        to={backTo}
        viewTransition
        className={`${styles.pill} ${styles.back}`}
        onClick={e => {
          if (!onBack) return;
          e.preventDefault();
          onBack();
        }}
      >
        {`← ${backLabel}`}
      </Link>
    </div>
  );
}
