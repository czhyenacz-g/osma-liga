export const EU_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
]);

export function isEuCountry(country: string | null): boolean {
  if (!country) return true; // unknown → allow (avoid blocking EU users with missing headers)
  return EU_COUNTRIES.has(country.toUpperCase());
}
