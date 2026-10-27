import { TeamCard } from '../cards/TeamCard';
import type { GridIndex } from '../data/queries';
import type { Driver } from '../data/types';
import { itemPath } from '../routes/paths';
import { GridCard } from './GridCard';
import styles from './Grid.module.css';

/** Every team, in championship order. */
export function TeamsGrid({ grid, heroId }: { grid: GridIndex; heroId?: string }) {
  return (
    <ul className={styles.grid}>
      {grid.teams.map(team => (
        <li key={team.id}>
          <GridCard to={itemPath('teams', team.id)} id={team.id} label={team.name} isHero={team.id === heroId}>
            <TeamCard team={team} drivers={team.driverIds.map(id => grid.driverById.get(id)).filter((d): d is Driver => Boolean(d))} />
          </GridCard>
        </li>
      ))}
    </ul>
  );
}
