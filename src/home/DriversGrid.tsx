import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import { DriverCard } from '../cards/DriverCard';
import { formatPoints, fullName, positionLabel } from '../data/format';
import type { GridIndex } from '../data/queries';
import { itemPath } from '../routes/paths';
import { GridCard } from './GridCard';
import styles from './Grid.module.css';

/** Every race driver, in pairs under their team, teams in championship order. */
export function DriversGrid({ grid, heroId }: { grid: GridIndex; heroId?: string }) {
  return (
    <div className={styles.teamGroups}>
      {grid.teams.map(team => (
        <section key={team.id} className={styles.teamGroup} style={{ '--team': team.colour } as CSSProperties}>
          <h2 className={styles.teamHeading}>
            <Link to={itemPath('teams', team.id)}>{team.name}</Link>
            <span>
              {positionLabel(team.standing.position)} · {formatPoints(team.standing.points)} pts
            </span>
          </h2>
          <ul className={styles.pair}>
            {team.driverIds.map(id => {
              const driver = grid.driverById.get(id);
              if (!driver) return null;
              return (
                <li key={id}>
                  <GridCard to={itemPath('drivers', id)} id={id} label={fullName(driver)} isHero={id === heroId}>
                    <DriverCard driver={driver} team={team} />
                  </GridCard>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
