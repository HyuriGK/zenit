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
import { useTranslations } from 'next-intl';
import { usePlano } from '@/hooks/usePlano';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/dexie';

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
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenit-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">{tCommon('loading')}</p>
        </div>
      </div>
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
    <div className="flex flex-col lg:h-[calc(100vh-theme(spacing.20))] space-y-4 sm:space-y-6 p-4 lg:p-6 lg:overflow-hidden">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          {t('greeting', { name: firstName })}
        </h1>
        <p className="text-sm sm:text-base text-gray-400">
          {t('daySummary')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 - Compromissos Hoje */}
        <Card
          className="bg-zinc-900/50 border-zinc-800 cursor-pointer hover:border-zenit-500/50 transition-all"
          onClick={handleIrParaAgenda}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              {t('appointmentsToday')}
            </CardTitle>
            <Calendar className="w-4 h-4 text-zenit-500" />
          </CardHeader>
          <CardContent>
            {loadingCompromissos ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-zenit-500"></div>
                <span className="text-sm text-gray-400">{tCommon('loading')}</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-white">{compromissosHoje}</div>
                <p className="text-xs text-gray-500 mt-1">
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
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              {t('monthlyBalance')}
            </CardTitle>
            <Wallet className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">R$ 0,00</div>
            <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {t('configureFinances')}
            </p>
          </CardContent>
        </Card>

        {/* Card 3 - Cursos Ativos */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              {t('activeCourses')}
            </CardTitle>
            <BookOpen className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">0</div>
            <p className="text-xs text-gray-500 mt-1">
              {t('startStudies')}
            </p>
          </CardContent>
        </Card>

        {/* Card 4 - Metas do Mês */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              {t('monthlyGoals')}
            </CardTitle>
            <Target className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">0/0</div>
            <p className="text-xs text-gray-500 mt-1">
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
        <Card className="flex flex-col bg-zinc-900/50 border-zinc-800 h-full">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="text-white text-lg sm:text-xl">{t('quickActions')}</CardTitle>
            <CardDescription className="text-gray-400 text-sm">
              {t('accessQuickly')}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-2 sm:space-y-3 min-h-0">
            {/* Botão Novo Compromisso - FUNCIONAL */}
            <Button
              onClick={handleNovoCompromisso}
              className="w-full justify-start h-auto py-3 bg-zenit-500 hover:bg-zenit-600 text-white border-0 shadow-lg shadow-zenit-500/25 transition-all hover:shadow-zenit-500/40 text-sm sm:text-base"
            >
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              {t('newAppointment')}
            </Button>

            {/* Nova Transação - FUNCIONAL */}
            <Button
              onClick={handleNovaTransacao}
              className="w-full justify-start h-auto py-3 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 hover:border-green-500/40 transition-all text-sm sm:text-base"
            >
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              {t('newTransaction')}
            </Button>

            {/* Adicionar no Planner - FUNCIONAL */}
            <Button
              onClick={handleNovoCurso}
              className="w-full justify-start h-auto py-3 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 hover:border-orange-500/40 transition-all text-sm sm:text-base"
            >
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Adicionar no Planner
            </Button>
            <Button
              disabled
              className="w-full justify-start h-auto py-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 cursor-not-allowed text-sm sm:text-base"
            >
              <Target className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              {t('createGoal')}
              <Badge variant="secondary" className="ml-auto text-xs">{tCommon('premium')}</Badge>
            </Button>
          </CardContent>
        </Card>
      </div>



      {/* Upgrade Banner - Only show for free plan */}
      {ehFree && (
        <Card className="bg-gradient-to-r from-zenit-500/10 via-blue-500/10 to-green-500/10 border-zenit-500/20">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">
                  {t('unlockPotential')}
                </h3>
                <p className="text-gray-400 text-xs sm:text-sm">
                  {t('accessPremiumFeatures')}
                </p>
              </div>
              <Button
                onClick={() => router.push('/premium')}
                className="w-full md:w-auto bg-gradient-to-r from-zenit-500 to-blue-500 hover:from-zenit-600 hover:to-blue-600 shadow-lg shadow-zenit-500/25 text-sm sm:text-base h-auto py-2.5 sm:py-2"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">{t('upgradeToPremium')}</span>
                <span className="sm:hidden">{t('upgradePremium')}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}