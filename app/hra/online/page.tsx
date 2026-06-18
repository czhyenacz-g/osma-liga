import { Suspense } from 'react';
import OnlineLobbyPage from '@/components/online/OnlineLobbyPage';

export default function OnlinePage() {
  return (
    <Suspense>
      <OnlineLobbyPage />
    </Suspense>
  );
}
