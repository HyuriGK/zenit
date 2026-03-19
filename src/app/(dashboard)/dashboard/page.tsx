'use client';

import { useSession } from '@/lib/auth-mock';
import {
  Activity,
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

      {/* Placeholder de Métricas */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="w-24 h-24 bg-zinc-900/50 border border-zinc-800/50 rounded-[32px] flex items-center justify-center mb-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Activity className="w-12 h-12 text-emerald-500/40 relative z-10" />
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-[0.2em] mb-4">
          Métricas de Desempenho
        </h2>
        <p className="text-zinc-500 max-w-lg text-xs md:text-sm font-bold leading-relaxed uppercase tracking-[0.15em]">
          Estamos preparando uma visão detalhada do seu progresso. <br className="hidden md:block" />
          Em breve, suas métricas e indicadores de desempenho pessoal estarão disponíveis aqui.
        </p>
        
        <div className="mt-12 flex gap-4 opacity-20">
          <div className="w-24 h-1 bg-zinc-800 rounded-full" />
          <div className="w-12 h-1 bg-emerald-500/50 rounded-full" />
          <div className="w-24 h-1 bg-zinc-800 rounded-full" />
        </div>
      </div>

    </div>
  );
}