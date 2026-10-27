import type { CSSProperties } from 'react';
import type { Driver, Team } from '../data/types';
import { PhotoImg } from './PhotoImg';
import { EditionField, EditionFinish, hasField } from './EditionLayers';
import { useEdition } from './editions';
import styles from './Cards.module.css';

interface TeamCardProps {
  team: Team;
  drivers: Driver[];
  photoWidth?: number;
  eager?: boolean;
}

/**
 * The front of a team's card: its logo and name, its colour, its car's side view and its two drivers.
 * The logo and car are formula1.com's own; without them the card still has the name and colour.
 */
export function TeamCard({ team, drivers, photoWidth = 640, eager }: TeamCardProps) {
  const style = { '--team': team.colour } as CSSProperties;
  const edition = useEdition(`teams/${team.id}`, e => e !== 'variation' || Boolean(team.altCar));
  // An Image Variation shows the car's other side instead.
  const car = edition === 'variation' ? team.altCar : team.car;
  return (
    <div
      className={`${styles.card} ${styles.team}`}
      style={style}
      data-has-photo={Boolean(car) || undefined}
      data-edition={edition ?? undefined}
    >
      {edition && hasField(edition) ? <EditionField edition={edition} /> : <div className={styles.stripes} aria-hidden="true" />}
      <div className={styles.top}>
        <PhotoImg path={team.logo} width={160} className={styles.logo} eager={eager} />
        <h3 className={styles.teamName}>{team.name}</h3>
      </div>
      <div className={styles.carWrap}>
        <PhotoImg path={car} width={photoWidth} className={styles.car} eager={eager} />
      </div>
      <ul className={styles.lineup}>
        {drivers.map(d => (
          <li key={d.id}>
            <b>{d.number}</b>
            <span className={styles.lineupGiven}>{d.givenName}</span> {d.familyName}
          </li>
        ))}
      </ul>
      {edition && <EditionFinish edition={edition} />}
    </div>
  );
}
