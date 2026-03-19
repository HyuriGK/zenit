'use client';

import { useSession } from '@/lib/auth-mock';
import {
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useTranslations } from 'next-intl';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <LoadingScreen message={tCommon('loading')} />
    );
  }

  if (!session) {
    return null;
  }

  const firstName = session.user.name?.split(' ')[0] || 'Usuário';

  return (
    <div className="flex flex-col lg:h-[calc(100vh-theme(spacing.20))] space-y-4 sm:space-y-6 p-4 lg:p-6 overflow-hidden">
      {/* Welcome Section */}
      <PageHeader 
        title={t('greeting', { name: firstName })}
        description={t('daySummary')}
      />

      {/* Placeholder de Métricas (Minimalista) */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-1000">
        <p className="text-zinc-600 text-[10px] md:text-xs font-black uppercase tracking-[0.4em] max-w-sm leading-loose opacity-40">
          Em breve suas métricas de desempenho pessoal estarão aqui
        </p>
      </div>
    </div>
  );
}