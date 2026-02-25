'use client';

import dynamic from 'next/dynamic';

// Dynamic import para evitar hydration mismatch com Radix UI
const Header = dynamic(
  () => import('@/components/dashboard/Header').then((mod) => ({ default: mod.Header })),
  { ssr: false }
);

export function HeaderWrapper() {
  return <Header />;
}
