import { useState, type CSSProperties } from 'react';
import { Link } from 'react-router';
import { Flag } from '../../cards/Flag';
import { ageOn, formatLongDate, fullName } from '../../data/format';
import type { Driver, Team } from '../../data/types';
import { itemPath } from '../../routes/paths';
import { BackHeader, CareerGrid, Facts, SeasonBox } from './Parts';
import styles from './CardBack.module.css';

/** The back of a driver's card: season, their team, career and personal details. */
export function DriverBack({ driver, team, season }: { driver: Driver; team: Team | undefined; season: number }) {
  const [today] = useState(() => new Date());
  // In the viewer's own locale and language: "November 13, 1999" or "13 novembre 1999".
  const born = driver.dateOfBirth && `${formatLongDate(driver.dateOfBirth)} (age ${ageOn(driver.dateOfBirth, today)})`;
  return (
    <div className={styles.inner} style={{ '--tint': team?.colour ?? '#666' } as CSSProperties}>
      <BackHeader
        kicker={
          <>
            <Flag code={driver.countryCode} label={driver.country} className={styles.inlineFlag} />
            {driver.code} · {driver.nationality}
          </>
        }
        title={fullName(driver)}
        badge={driver.number}
      />
      <div className={styles.scroll}>
        <SeasonBox season={season} standing={driver.standing} />
        {team && (
          <Link to={itemPath('teams', team.id)} className={styles.teamLink}>
            <span className={styles.k}>Team</span>
            <b>{team.name}</b>
            <span aria-hidden="true">→</span>
          </Link>
        )}
        <CareerGrid career={driver.career} />
        <Facts
          rows={[
            ['Born', born],
            ['Nationality', driver.country],
            ['Debut', driver.career.debut && `${driver.career.debut.race}, ${driver.career.debut.season}`],
          ]}
        />
        {driver.photo && <p className={styles.credit}>Photo: Formula 1</p>}
      </div>
    </div>
  );
}
