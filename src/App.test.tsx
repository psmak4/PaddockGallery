import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import { stubDataFetch } from './test/fetchStub';
import { renderRoute } from './test/render';

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

test('the Drivers tab shows every driver under their team, teams in standings order', async () => {
  stubDataFetch();
  renderRoute('/');
  expect(await screen.findByRole('heading', { level: 1, name: 'Drivers' })).toBeInTheDocument();
  expect(await screen.findByText('4 drivers across 2 teams')).toBeInTheDocument();
  const headings = screen.getAllByRole('heading', { level: 2 }).map(h => h.textContent);
  expect(headings[0]).toMatch(/^McLarenP1 · 620 pts$/);
  expect(headings[1]).toMatch(/^Racing BullsP7 · 80 pts$/);
  const links = screen.getAllByRole('link', { name: /Piastri|Norris|Lawson|Lindblad/ }).map(a => a.getAttribute('aria-label'));
  expect(links).toEqual(['Oscar Piastri', 'Lando Norris', 'Liam Lawson', 'Arvid Lindblad']);
  expect(screen.getByRole('link', { name: 'Drivers' })).toHaveAttribute('aria-current', 'page');
});

const photoSrcs = (el: HTMLElement) => within(el).queryAllByTestId('photo').map(img => img.getAttribute('src'));

test("driver cards show their team's logo and the official photo, and work without either", async () => {
  stubDataFetch();
  renderRoute('/');
  const norris = await screen.findByRole('link', { name: 'Lando Norris' });
  expect(photoSrcs(norris)).toEqual([
    'https://media.formula1.com/image/upload/c_fill,w_400/q_auto/v1740000001/common/f1/2026/mclaren/lannor01/2026mclarenlannor01right.webp',
    'https://media.formula1.com/image/upload/c_fill,w_160/q_auto/v1740000001/common/f1/2026/mclaren/2026mclarenlogowhite.webp',
  ]);
  // The flag moved to the back of the card.
  expect(within(norris).queryByRole('img', { name: 'United Kingdom' })).toBeNull();
  // No shortcode on the front: the code is on the back.
  expect(within(norris).queryByText('NOR')).toBeNull();
  // Racing Bulls (in the fixtures) has no logo, and Lawson no photo: the number carries the card.
  const lawson = screen.getByRole('link', { name: 'Liam Lawson' });
  expect(photoSrcs(lawson)).toEqual([]);
  expect(within(lawson).getByText('30')).toBeInTheDocument();
});

test('the Teams tab shows each team with its logo and its drivers, and no stats', async () => {
  stubDataFetch();
  renderRoute('/teams');
  const mclaren = await screen.findByRole('link', { name: 'McLaren' });
  expect(mclaren).toHaveTextContent('81Oscar Piastri');
  expect(mclaren).toHaveTextContent('1Lando Norris');
  expect(within(mclaren).getAllByTestId('photo').map(img => img.getAttribute('src'))).toContain(
    'https://media.formula1.com/image/upload/c_fill,w_160/q_auto/v1740000001/common/f1/2026/mclaren/2026mclarenlogowhite.webp',
  );
  expect(within(mclaren).queryByText('Pts')).toBeNull();
  expect(screen.getByRole('link', { name: 'Teams' })).toHaveAttribute('aria-current', 'page');
});

test('a team heading on the Drivers tab links to the team', async () => {
  stubDataFetch();
  const { router } = renderRoute('/');
  await userEvent.click(await screen.findByRole('link', { name: 'Racing Bulls' }));
  expect(router.state.location.pathname).toBe('/teams/rb');
});

test('index.html preloads the files the app fetches', () => {
  const html = readFileSync('index.html', 'utf8');
  const catalog = readFileSync('src/data/catalog.ts', 'utf8');
  for (const file of ['/data/meta.json', '/data/drivers.json', '/data/teams.json']) {
    expect(html).toContain(`href="${file}"`);
    expect(catalog).toContain(`'${file}'`);
  }
});

test('unknown pages say so', async () => {
  stubDataFetch();
  renderRoute('/nowhere');
  expect(await screen.findByText('Page not found')).toBeInTheDocument();
});
