'use client';

import { useSession } from '@/lib/auth-mock';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Calendar,
  Wallet,
  BookOpen,
  TrendingUp,
  Target,
  CheckCircle2,
  Library,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { startOfDay, endOfDay, parseISO, isWithinInterval } from 'date-fns';
import { AtividadesRecentes } from '@/components/dashboard/AtividadesRecentes';
import { PremiumModal } from '@/components/dashboard/PremiumModal';
import { PageHeader } from '@/components/ui/PageHeader';
import { useTranslations } from 'next-intl';
import { usePlano } from '@/hooks/usePlano';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/dexie';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const tSidebar = useTranslations('sidebar');
  const { data: session, status } = useSession();
  const router = useRouter();
  const { ehFree } = usePlano();

  const compromissosList = useLiveQuery(async () => {
    if (!session) return [];
    const hoje = new Date();
    const inicioHoje = startOfDay(hoje);
    const fimHoje = endOfDay(hoje);
    return await db.compromissos
      .where('data').between(inicioHoje, fimHoje)
      .toArray();
  }, [session]);

  const loadingCompromissos = compromissosList === undefined;
  const compromissosHoje = compromissosList?.length || 0;

  if (status === 'loading') {
    return (
      <LoadingScreen message={tCommon('loading')} />
    );
  }

  if (!session) {
    return null;
  }

  const firstName = session.user.name?.split(' ')[0] || 'Usuário';

  // Função para ir para a agenda e abrir modal de novo compromisso
  const handleNovoCompromisso = () => {
    router.push('/dashboard/agenda?novo=true');
  };

  // Função para ir para a agenda
  const handleIrParaAgenda = () => {
    router.push('/dashboard/agenda');
  };

  // Função para ir para o financeiro e abrir modal de nova transação
  const handleNovaTransacao = () => {
    router.push('/dashboard/financeiro?nova=true');
  };

  // Função para ir para estudos e abrir modal de novo curso
  const handleNovoCurso = () => {
    router.push('/dashboard/estudos?novo=true');
  };

  // Função para ir para o financeiro
  const handleIrParaFinanceiro = () => {
    router.push('/dashboard/financeiro');
  };

  // Função para ir para estudos
  const handleIrParaEstudos = () => {
    router.push('/dashboard/estudos');
  };

  // Função para ir para biblioteca
  const handleIrParaBiblioteca = () => {
    router.push('/dashboard/biblioteca');
  };

  return (
    <div className="flex flex-col lg:h-[calc(100vh-theme(spacing.20))] space-y-4 sm:space-y-6 p-4 lg:p-6 overflow-hidden">
      {/* Welcome Section */}
      <PageHeader 
        title={t('greeting', { name: firstName })}
        description={t('daySummary')}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 - Compromissos Hoje */}
        <Card
          className="cursor-pointer transition-all border border-zinc-800/50 hover:border-emerald-500/30"
          onClick={handleIrParaAgenda}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
              {t('appointmentsToday')}
            </CardTitle>
            <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg">
              <Calendar className="w-4 h-4 text-zinc-400" />
            </div>
          </CardHeader>
          <CardContent>
            {loadingCompromissos ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-5 w-5 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full"></div>
                <span className="text-sm text-zinc-500">{tCommon('loading')}</span>
              </div>
            ) : (
              <>
                <div className="text-4xl font-bold text-white leading-tight">{compromissosHoje}</div>
                <p className="text-[10px] font-medium uppercase text-zinc-500 mt-1 tracking-wider">
                  {compromissosHoje === 0
                    ? t('noAppointments')
                    : compromissosHoje === 1
                      ? t('oneAppointment')
                      : t('manyAppointments', { count: compromissosHoje })
                  }
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Card 2 - Saldo Mensal */}
        <Card className="border border-zinc-800/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
              {t('monthlyBalance')}
            </CardTitle>
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <Wallet className="w-4 h-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white leading-tight">R$ 0,00</div>
            <p className="text-[10px] font-medium uppercase text-emerald-500/60 mt-1 tracking-wider flex items-center gap-1">
              {t('configureFinances')}
            </p>
          </CardContent>
        </Card>

        {/* Card 3 - Cursos Ativos */}
        <Card className="border border-zinc-800/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
              {t('activeCourses')}
            </CardTitle>
            <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg">
              <BookOpen className="w-4 h-4 text-zinc-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white leading-tight">0</div>
            <p className="text-[10px] font-medium uppercase text-zinc-500 mt-1 tracking-wider">
              {t('startStudies')}
            </p>
          </CardContent>
        </Card>

        {/* Card 4 - Metas do Mês */}
        <Card className="border border-zinc-800/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
              {t('monthlyGoals')}
            </CardTitle>
            <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg">
              <Target className="w-4 h-4 text-zinc-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white leading-tight">0/0</div>
            <p className="text-[10px] font-medium uppercase text-zinc-500 mt-1 tracking-wider">
              {t('defineGoals')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 min-h-0 pb-2">
        {/* Atividades Recentes */}
        <AtividadesRecentes />

        {/* Quick Actions */}
        <Card className="flex flex-col h-full bg-zinc-900/20 border border-zinc-800/50 overflow-hidden">
          <CardHeader className="flex-shrink-0 border-b border-zinc-800 mb-4 p-6">
            <CardTitle className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">{t('quickActions')}</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-3 min-h-0 p-6 pt-0">
            {/* Botão Novo Compromisso */}
            <Button
              onClick={handleNovoCompromisso}
              variant="default"
              className="w-full justify-start h-12"
            >
              <Calendar className="w-5 h-5 mr-3" />
              {t('newAppointment')}
            </Button>

            {/* Nova Transação */}
            <Button
              onClick={handleNovaTransacao}
              variant="secondary"
              className="w-full justify-start h-12"
            >
              <Wallet className="w-5 h-5 mr-3" />
              {t('newTransaction')}
            </Button>

            {/* Adicionar no Planner */}
            <Button
              onClick={handleNovoCurso}
              variant="outline"
              className="w-full justify-start h-12"
            >
              <BookOpen className="w-5 h-5 mr-3" />
              Adicionar no Planner
            </Button>
            <Button
              disabled
              variant="ghost"
              className="w-full justify-start h-12 opacity-30"
            >
              <Target className="w-5 h-5 mr-3" />
              {t('createGoal')}
              <Badge variant="secondary" className="ml-auto text-[10px] uppercase font-black">{tCommon('premium')}</Badge>
            </Button>
          </CardContent>
        </Card>
      </div>


      {/* Premium Upgrade Modal */}
      <PremiumModal />
    </div>
  );
}