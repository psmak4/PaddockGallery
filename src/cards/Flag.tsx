import { flagUrl } from '../data/images';
import styles from './Cards.module.css';

/** A country flag, or nothing when the country isn't known. */
export function Flag({ code, label, className = '' }: { code: string | null; label: string | null; className?: string }) {
  if (!code) return null;
  return <img className={`${styles.flag} ${className}`} src={flagUrl(code)} alt={label ?? code.toUpperCase()} title={label ?? undefined} />;
}
