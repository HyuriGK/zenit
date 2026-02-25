/**
 * Hook que atualiza a sessão automaticamente em intervalos regulares
 */

import { useEffect } from 'react';
import { useSession } from '@/lib/auth-mock';

export function useAutoRefreshSession(intervalMinutes: number = 5) {
  const { update } = useSession();

  useEffect(() => {
    // Atualizar sessão periodicamente
    const intervalMs = intervalMinutes * 60 * 1000;

    const interval = setInterval(async () => {
      console.log('🔄 Atualizando sessão automaticamente...');
      await update();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [update, intervalMinutes]);
}
