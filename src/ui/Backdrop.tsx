import type { CSSProperties } from 'react';
import { f1ImageUrl } from '../data/images';
import styles from './Backdrop.module.css';

/**
 * A soft wash of team colour behind the page, with a heavily blurred copy of the photo (a driver, or a
 * team's car) when there is one: fixed behind the home pages ("page"), and filling the viewer ("viewer").
 * Deliberately not a named view-transition layer: named layers paint above the root snapshot, so a
 * full-screen backdrop layer would hide the header, arrows and strip mid-transition.
 */
export function Backdrop({ colour, image, tone = 'page' }: { colour: string | undefined; image?: string | null; tone?: 'page' | 'viewer' }) {
  return (
    <div className={`${styles.backdrop} ${styles[tone]}`} style={{ '--team': colour ?? '#444' } as CSSProperties} aria-hidden="true">
      {image && <img data-testid={`${tone}-backdrop`} src={f1ImageUrl(image, 200)} alt="" decoding="async" />}
    </div>
  );
}
