// Jolpica gives nationalities as demonyms ("Monegasque"); flags and labels need the country.
// Add a line here when the build reports an unknown nationality.

const BY_DEMONYM: Record<string, [code: string, country: string]> = {
  American: ['us', 'United States'],
  Argentine: ['ar', 'Argentina'],
  Argentinian: ['ar', 'Argentina'],
  Australian: ['au', 'Australia'],
  Austrian: ['at', 'Austria'],
  Belgian: ['be', 'Belgium'],
  Brazilian: ['br', 'Brazil'],
  British: ['gb', 'United Kingdom'],
  Canadian: ['ca', 'Canada'],
  Chinese: ['cn', 'China'],
  Colombian: ['co', 'Colombia'],
  Danish: ['dk', 'Denmark'],
  Dutch: ['nl', 'Netherlands'],
  Estonian: ['ee', 'Estonia'],
  Finnish: ['fi', 'Finland'],
  French: ['fr', 'France'],
  German: ['de', 'Germany'],
  Indian: ['in', 'India'],
  Indonesian: ['id', 'Indonesia'],
  Irish: ['ie', 'Ireland'],
  Israeli: ['il', 'Israel'],
  Italian: ['it', 'Italy'],
  Japanese: ['jp', 'Japan'],
  Malaysian: ['my', 'Malaysia'],
  Mexican: ['mx', 'Mexico'],
  Monegasque: ['mc', 'Monaco'],
  'New Zealander': ['nz', 'New Zealand'],
  Polish: ['pl', 'Poland'],
  Portuguese: ['pt', 'Portugal'],
  Russian: ['ru', 'Russia'],
  'South African': ['za', 'South Africa'],
  Spanish: ['es', 'Spain'],
  Swedish: ['se', 'Sweden'],
  Swiss: ['ch', 'Switzerland'],
  Thai: ['th', 'Thailand'],
  Venezuelan: ['ve', 'Venezuela'],
};

/** "Monegasque" → { code: 'mc', country: 'Monaco' }; null when the demonym isn't known. */
export function countryOf(nationality: string | undefined | null): { code: string; country: string } | null {
  const entry = nationality ? BY_DEMONYM[nationality.trim()] : undefined;
  return entry ? { code: entry[0], country: entry[1] } : null;
}
