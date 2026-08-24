'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function AccessLogger() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname.startsWith('/dashboard')) return;
    void fetch('/api/logs/acesso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rota: pathname }),
    });
  }, [pathname]);

  return null;
}
