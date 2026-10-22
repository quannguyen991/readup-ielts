import { useEffect } from 'react';
import { router } from 'expo-router';
import { track } from '@/services/analytics/track';

export default function UpgradeRedirect() {
  useEffect(() => {
    track({ name: 'upgrade', plan: 'plus' });
    router.replace('/intro' as never);
  }, []);
  return null;
}
