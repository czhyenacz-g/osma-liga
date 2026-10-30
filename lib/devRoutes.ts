import { notFound } from 'next/navigation';

// Interní testovací stránky (herní módy, zvuky) zůstávají dostupné lokálně
// a na Vercel preview deploymentech; na produkci vrací 404.
export function isProductionDeployment(): boolean {
  return process.env.VERCEL_ENV === 'production';
}

export function notFoundInProduction(): void {
  if (isProductionDeployment()) notFound();
}
