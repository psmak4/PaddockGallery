import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { stubDataFetch } from '../test/fetchStub';
import { renderRoute } from '../test/render';

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

test('a driver link opens their card with just a back pill above it', async () => {
  stubDataFetch();
  renderRoute('/drivers/norris');
  expect(await screen.findByRole('button', { name: 'Show details for Lando Norris' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '← Drivers' })).toHaveAttribute('href', '/');
  // No team pill or card counter: the team link is on the back of the card.
  expect(screen.queryByRole('link', { name: 'McLaren' })).toBeNull();
  expect(screen.queryByText('2 / 4')).toBeNull();
  expect(document.title).toBe('Lando Norris · Drivers · PaddockGallery');
});

test('arrows and keys move through the drivers in grid order, stopping at the ends', async () => {
  stubDataFetch();
  const { router } = renderRoute('/drivers/piastri');
  expect(await screen.findByRole('button', { name: 'Previous card' })).toBeDisabled();
  await userEvent.click(screen.getByRole('button', { name: 'Next card' }));
  expect(router.state.location.pathname).toBe('/drivers/norris');
  await screen.findByRole('button', { name: 'Show details for Lando Norris' });
  await userEvent.keyboard('{End}');
  expect(router.state.location.pathname).toBe('/drivers/arvid_lindblad');
  await screen.findByRole('button', { name: 'Show details for Arvid Lindblad' });
  expect(screen.getByRole('button', { name: 'Next card' })).toBeDisabled();
});

test("flipping a driver's card shows their season, career, details and a link to the team", async () => {
  stubDataFetch();
  const { router } = renderRoute('/drivers/norris');
  await userEvent.click(await screen.findByRole('button', { name: 'Show details for Lando Norris' }));
  const back = screen.getByRole('region', { name: 'Details' });
  expect(within(back).getByText('2026 standings')).toBeInTheDocument();
  expect(within(back).getByText('Champion 2025')).toBeInTheDocument();
  // Born: the date in the browser's locale with the month spelled out, and no birthplace.
  const born = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(1999, 10, 13)),
  );
  expect(within(back).getByText(new RegExp(`^${born} \\(age \\d+\\)$`))).toBeInTheDocument();
  expect(within(back).queryByText(/Bristol/)).toBeNull();
  // No Wikipedia description.
  expect(within(back).queryByText('Lando Norris is a racing driver.')).toBeNull();
  expect(within(back).getByText('Photo: Formula 1')).toBeInTheDocument();
  await userEvent.click(within(back).getByRole('link', { name: /Team\s*McLaren/ }));
  expect(router.state.location.pathname).toBe('/teams/mclaren');
});

test("a team's card is about this season: its drivers (linked), season stats and principal", async () => {
  stubDataFetch();
  const { router } = renderRoute('/teams/mclaren');
  await userEvent.click(await screen.findByRole('button', { name: 'Show details for McLaren' }));
  const back = screen.getByRole('region', { name: 'Details' });
  expect(within(back).getByText('Andrea Stella')).toBeInTheDocument();
  // The team's flag sits in the header's top-right corner.
  const header = within(back).getByRole('heading', { level: 2, name: 'McLaren' }).closest('header')!;
  expect(within(header).getByRole('img', { name: 'United Kingdom' })).toHaveAttribute('src', '/flags/gb.svg');
  // This season only: the team's season and its drivers' head-to-head, no history.
  expect(within(back).getByText('2026 season')).toBeInTheDocument();
  expect(within(back).getByLabelText('Piastri 8, Norris 10')).toBeInTheDocument();
  expect(within(back).queryByText(/Champion/)).toBeNull();
  expect(within(back).queryByText('Career')).toBeNull();
  expect(within(back).queryByText('McLaren is a British team.')).toBeNull();
  await userEvent.click(within(back).getByRole('link', { name: /Lando Norris/ }));
  expect(router.state.location.pathname).toBe('/drivers/norris');
});

test('Escape goes back to the grid', async () => {
  stubDataFetch();
  const { router } = renderRoute('/teams/rb');
  await screen.findByRole('button', { name: 'Show details for Racing Bulls' });
  await userEvent.keyboard('{Escape}');
  expect(router.state.location.pathname).toBe('/teams');
});

test('an unknown driver is a not-found page', async () => {
  stubDataFetch();
  renderRoute('/drivers/nobody');
  expect(await screen.findByText('Driver not found')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Back to Drivers' })).toHaveAttribute('href', '/');
});

test('team cards lie landscape so the car fits; driver cards stay portrait', async () => {
  stubDataFetch();
  const { unmount } = renderRoute('/teams/mclaren');
  await screen.findByRole('button', { name: 'Show details for McLaren' });
  expect(document.querySelector('[data-orientation]')).toHaveAttribute('data-orientation', 'landscape');
  unmount();
  renderRoute('/drivers/norris');
  await screen.findByRole('button', { name: 'Show details for Lando Norris' });
  expect(document.querySelector('[data-orientation]')).toHaveAttribute('data-orientation', 'portrait');
});
