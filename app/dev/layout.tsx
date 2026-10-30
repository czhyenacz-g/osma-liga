import type { Metadata } from 'next';
import { notFoundInProduction } from '@/lib/devRoutes';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DevLayout({ children }: { children: React.ReactNode }) {
  notFoundInProduction();
  return children;
}
