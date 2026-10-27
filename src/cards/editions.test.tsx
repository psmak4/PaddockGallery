import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { stubDataFetch } from '../test/fetchStub';
import { renderRoute } from '../test/render';
import { ODDS, rollEdition } from './editions';

const cards = (edition: string) => document.querySelectorAll(`[data-edition="${edition}"]`).length;
const toggle = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name} cards: .* \\(development only\\)$`) });

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

test(`each edition comes up 1 time in ${ODDS}, never both, and a card keeps its roll for the visit`, () => {
  expect(rollEdition('drivers/a', () => 0.5 / ODDS)).toBe('gold');
  expect(rollEdition('drivers/b', () => 1.5 / ODDS)).toBe('carbon');
  expect(rollEdition('drivers/c', () => 2 / ODDS)).toBeNull();
  // Already rolled: a later roll doesn't change it.
  expect(rollEdition('drivers/a', () => 0.99)).toBe('gold');
  expect(rollEdition('drivers/c', () => 0)).toBeNull();
});

test('by default the roll decides, card by card', async () => {
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
  stubDataFetch();
  renderRoute('/');
  await screen.findByRole('link', { name: 'Lando Norris' });
  expect(document.querySelectorAll('[data-edition]')).toHaveLength(0);
});

test('a special card carries its small label', async () => {
  vi.spyOn(Math, 'random').mockReturnValue(1.5 / ODDS);
  stubDataFetch();
  renderRoute('/teams');
  await screen.findByRole('link', { name: 'McLaren' });
  expect(cards('carbon')).toBe(2);
  expect(screen.getAllByTitle('Carbon: a rare edition of this card').map(label => label.textContent)).toEqual(['Carbon', 'Carbon']);
  expect(screen.queryByText('1/1')).toBeNull();
});

test('in development each edition has a header toggle that cycles Random → Always → Never, and remembers it', async () => {
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
  stubDataFetch();
  renderRoute('/');
  await screen.findByRole('link', { name: 'Lando Norris' });

  await userEvent.click(toggle('Carbon'));
  expect(toggle('Carbon')).toHaveAccessibleName('Carbon cards: Always (development only)');
  expect(cards('carbon')).toBe(4);
  expect(localStorage.getItem('paddockgallery.edition.carbon')).toBe('always');

  // Both on Always: Gold wins.
  await userEvent.click(toggle('Paddock Gold'));
  expect(cards('gold')).toBe(4);
  expect(cards('carbon')).toBe(0);

  await userEvent.click(toggle('Paddock Gold')); // Never
  expect(cards('carbon')).toBe(4);
  await userEvent.click(toggle('Carbon')); // Never
  expect(document.querySelectorAll('[data-edition]')).toHaveLength(0);
  await userEvent.click(toggle('Carbon'));
  expect(toggle('Carbon')).toHaveAccessibleName('Carbon cards: Random (development only)');
});

test('"Never" turns off a rolled edition', async () => {
  vi.spyOn(Math, 'random').mockReturnValue(0.5 / ODDS);
  localStorage.setItem('paddockgallery.edition.gold', 'never');
  stubDataFetch();
  renderRoute('/');
  await screen.findByRole('link', { name: 'Lando Norris' });
  expect(document.querySelectorAll('[data-edition]')).toHaveLength(0);
});
