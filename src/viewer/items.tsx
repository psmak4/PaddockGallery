import type { ReactNode } from 'react';
import { DriverCard } from '../cards/DriverCard';
import { TeamCard } from '../cards/TeamCard';
import { fullName } from '../data/format';
import type { GridIndex } from '../data/queries';
import type { CollectionKind, Driver } from '../data/types';
import { DriverBack } from './details/DriverBack';
import { TeamBack } from './details/TeamBack';

/** One card in the viewer, whichever collection it comes from. */
export interface ViewerItem {
  id: string;
  name: string;
  colour: string;
  /** Team cards are landscape so the car's side view fits. */
  orientation: 'portrait' | 'landscape';
  /** formula1.com photo path for the backdrop and preloading. */
  image: string | null;
  /** The front face at a given photo width. */
  front: (photoWidth: number, eager?: boolean) => ReactNode;
  back: ReactNode;
}

const driversOf = (grid: GridIndex, ids: string[]) => ids.map(id => grid.driverById.get(id)).filter((d): d is Driver => Boolean(d));

export function viewerItems(grid: GridIndex, kind: CollectionKind): ViewerItem[] {
  if (kind === 'drivers') {
    return grid.drivers.map(driver => {
      const team = grid.teamById.get(driver.teamId);
      return {
        id: driver.id,
        name: fullName(driver),
        colour: team?.colour ?? '#666',
        orientation: 'portrait',
        image: driver.photo,
        front: (photoWidth, eager) => <DriverCard driver={driver} team={team} photoWidth={photoWidth} eager={eager} />,
        back: <DriverBack driver={driver} team={team} season={grid.meta.season} />,
      };
    });
  }
  return grid.teams.map(team => {
    const drivers = driversOf(grid, team.driverIds);
    return {
      id: team.id,
      name: team.name,
      colour: team.colour,
      orientation: 'landscape',
      image: team.car,
      front: (photoWidth, eager) => <TeamCard team={team} drivers={drivers} photoWidth={photoWidth} eager={eager} />,
      back: <TeamBack team={team} drivers={drivers} season={grid.meta.season} />,
    };
  });
}
