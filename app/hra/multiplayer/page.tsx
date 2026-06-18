import { Suspense } from 'react';
import OnlineLobbyPage from '@/components/online/OnlineLobbyPage';

export default function MultiplayerPage() {
  return (
    <Suspense>
      <OnlineLobbyPage />
    </Suspense>
  );
}
