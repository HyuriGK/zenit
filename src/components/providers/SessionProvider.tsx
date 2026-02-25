'use client';

import { SessionProvider as NextAuthSessionProvider } from '@/lib/auth-mock';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      {children}
    </NextAuthSessionProvider>
  );
}