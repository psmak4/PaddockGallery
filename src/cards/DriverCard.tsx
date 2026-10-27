import type { CSSProperties } from 'react';
import type { Driver, Team } from '../data/types';
import { PhotoImg } from './PhotoImg';
import { EditionField, EditionFinish, hasField } from './EditionLayers';
import { pickVariant, useEdition } from './editions';
import styles from './Cards.module.css';

interface DriverCardProps {
  driver: Driver;
  team: Team | undefined;
  /** Photo width to request: grid cards are small, the viewer card large. */
  photoWidth?: number;
  eager?: boolean;
}

/**
 * The front of a driver's card. Designed to stand on its own without a photo: the race number, the team's
 * colour and logo, and the name (their flag is on the back). The formula1.com portrait, when there is one, steps in front of the number.
 * Sizes scale with the card's own width (container query units), so the same card works in the grid,
 * the viewer and the thumbnail strip.
 */
export function DriverCard({ driver, team, photoWidth = 400, eager }: DriverCardProps) {
  const style = { '--team': team?.colour ?? '#666' } as CSSProperties;
  const key = `drivers/${driver.id}`;
  const edition = useEdition(key, e => e !== 'variation' || driver.altPhotos.length > 0);
  // An Image Variation shows one of the driver's other official poses instead.
  const photo = edition === 'variation' ? driver.altPhotos[pickVariant(key, driver.altPhotos.length)] : driver.photo;
  return (
    <div
      className={`${styles.card} ${styles.driver}`}
      style={style}
      data-has-photo={Boolean(photo) || undefined}
      data-edition={edition ?? undefined}
    >
      {edition && hasField(edition) ? <EditionField edition={edition} /> : <div className={styles.stripes} aria-hidden="true" />}
      <span className={styles.number} aria-hidden="true">
        {driver.number ?? driver.code}
      </span>
      <PhotoImg path={photo} width={photoWidth} className={styles.portrait} eager={eager} />
      <div className={styles.top}>
        <PhotoImg path={team?.logo ?? null} width={160} className={styles.logo} eager={eager} />
      </div>
      <div className={styles.plate}>
        <span className={styles.given}>{driver.givenName}</span>
        <span className={styles.family}>{driver.familyName}</span>
        <span className={styles.teamLine}>{team?.name}</span>
      </div>
      {edition && <EditionFinish edition={edition} />}
    </div>
  );
}
