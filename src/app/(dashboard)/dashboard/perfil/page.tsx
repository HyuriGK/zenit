'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from '@/lib/auth-mock';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/dexie';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  User,
  Crown,
  CheckCircle2,
  Calendar,
  Activity,
  TrendingUp,
  Book,
  Target,
  Flame,
  Zap,
  Star,
  Trophy,
  Sparkles,
  BookOpen,
  DollarSign,
  BarChart3,
  Clock,
  Check,
  LucideIcon,
  Settings,
  Medal,
  ChartBar,
  Pencil,
  Loader2,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';

// --- Types ---
type ProfileTab = 'overview' | 'stats' | 'achievements';

interface NavItem {
  id: ProfileTab;
  label: string;
  icon: React.ElementType;
  description: string;
}

interface Stats {
  compromissosTotal: number;
  cursosAtivos: number;
  metasAlcancadas: number;
  diasConsecutivos: number;
  transacoesTotal: number;
  midiasLidas: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  unlocked: boolean;
  unlockedAt?: Date;
  progress?: number;
  total?: number;
}

// --- Constants ---
const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Visão Geral', icon: User, description: 'Informações do perfil' },
  { id: 'stats', label: 'Estatísticas', icon: ChartBar, description: 'Seu progresso no Zenit' },
  { id: 'achievements', label: 'Conquistas', icon: Medal, description: 'Suas conquistas desbloqueadas' },
];

// --- Sub-components (Outside of render) ---
const SectionHeader = ({ title, description }: { title: string; description: string }) => (
  <div className="mb-6">
    <h2 className="text-xl font-semibold text-zinc-100 tracking-tight">{title}</h2>
    <p className="text-sm text-zinc-400 mt-1">{description}</p>
    <Separator className="mt-4 bg-zinc-800" />
  </div>
);

const SettingsCard = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 shadow-sm", className)}>
    {children}
  </div>
);

export default function PerfilPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    compromissosTotal: 0,
    cursosAtivos: 0,
    metasAlcancadas: 0,
    diasConsecutivos: 0,
    transacoesTotal: 0,
    midiasLidas: 0,
  });

  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: 'first-commitment',
      title: 'Primeiro Passo',
      description: 'Criou seu primeiro compromisso',
      icon: Calendar,
      unlocked: false,
    },
    {
      id: 'week-streak',
      title: 'Constante',
      description: '7 dias consecutivos de uso',
      icon: Flame,
      unlocked: false,
    },
    {
      id: 'course-master',
      title: 'Estudioso',
      description: 'Completou 3 cursos',
      icon: BookOpen,
      unlocked: false,
      progress: 0,
      total: 3,
    },
    {
      id: 'financial-organized',
      title: 'Organizado',
      description: 'Registrou 50 transacoes',
      icon: DollarSign,
      unlocked: false,
      progress: 0,
      total: 50,
    },
    {
      id: 'goal-achiever',
      title: 'Realizador',
      description: 'Alcançou 5 objetivos financeiros',
      icon: Target,
      unlocked: false,
      progress: 0,
      total: 5,
    },
    {
      id: 'reading-enthusiast',
      title: 'Leitor Ávido',
      description: 'Concluiu 10 leituras',
      icon: Book,
      unlocked: false,
      progress: 0,
      total: 10,
    },
  ]);

  const updateAchievements = useCallback((currentStats: Stats) => {
    setAchievements(prev =>
      prev.map(achievement => {
        switch (achievement.id) {
          case 'first-commitment':
            return {
              ...achievement,
              unlocked: currentStats.compromissosTotal > 0,
              unlockedAt: currentStats.compromissosTotal > 0 ? new Date() : undefined,
            };
          case 'week-streak':
            return {
              ...achievement,
              unlocked: currentStats.diasConsecutivos >= 7,
              unlockedAt: currentStats.diasConsecutivos >= 7 ? new Date() : undefined,
            };
          case 'course-master':
            return {
              ...achievement,
              progress: currentStats.cursosAtivos,
              unlocked: currentStats.cursosAtivos >= 3,
              unlockedAt: currentStats.cursosAtivos >= 3 ? new Date() : undefined,
            };
          case 'financial-organized':
            return {
              ...achievement,
              progress: currentStats.transacoesTotal,
              unlocked: currentStats.transacoesTotal >= 50,
              unlockedAt: currentStats.transacoesTotal >= 50 ? new Date() : undefined,
            };
          case 'reading-enthusiast':
            return {
              ...achievement,
              progress: currentStats.midiasLidas,
              unlocked: currentStats.midiasLidas >= 10,
              unlockedAt: currentStats.midiasLidas >= 10 ? new Date() : undefined,
            };
          default:
            return achievement;
        }
      })
    );
  }, []);

  const carregarEstatisticas = useCallback(async () => {
    try {
      const compromissosDb = await db.compromissos.toArray();
      const totalCompromissos = compromissosDb.length;

      const cursosDb = await db.cursos.toArray();
      const cursosAtivos = cursosDb.length; 

      const transacoesDb = await db.transacoes.toArray();
      const totalTransacoes = transacoesDb.length;

      const midiasDb = await db.midias.toArray();
      const midiasLidas = midiasDb.filter((m: any) => m.status === 'CONCLUIDO').length;

      const newStats = {
        compromissosTotal: totalCompromissos,
        cursosAtivos: cursosAtivos,
        metasAlcancadas: 0,
        diasConsecutivos: 7,
        transacoesTotal: totalTransacoes,
        midiasLidas: midiasLidas,
      };

      setStats(newStats);
      updateAchievements(newStats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  }, [updateAchievements]);

  useEffect(() => {
    if (session?.user) {
      carregarEstatisticas();
    }
    setLoading(false);
  }, [session, carregarEstatisticas]);

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getDaysUntilExpiration = () => {
    if (!session?.user?.planoExpiraEm) return null;
    const expiration = new Date(session.user.planoExpiraEm);
    const today = new Date();
    const diffTime = expiration.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-zinc-500 uppercase tracking-widest animate-pulse">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const completionPercentage = Math.round((unlockedAchievements.length / achievements.length) * 100);

  return (
    <div className="min-h-full space-y-8 p-4 lg:p-6 overflow-hidden">
      {/* Page Header */}
      <PageHeader 
        title="Meu Perfil"
        description="Visualize suas informações, estatísticas e conquistas."
      />

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Sidebar Navigation */}
        <aside className="lg:w-64 shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-none">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-all duration-200 whitespace-nowrap lg:whitespace-normal text-left",
                    isActive
                      ? "bg-zinc-900 border border-emerald-500/30 text-emerald-500 shadow-sm shadow-emerald-500/5"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40"
                  )}
                >
                  <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-emerald-500" : "text-zinc-600")} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Link para Configurações */}
            <Separator className="my-2 bg-zinc-800 hidden lg:block" />
            <button
              onClick={() => router.push('/dashboard/settings?from=profile')}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-200 whitespace-nowrap lg:whitespace-normal text-left text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900/40"
            >
              <Settings className="w-4 h-4 shrink-0 text-zinc-600" />
              <span>Configurações</span>
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 space-y-8">
          {/* --- OVERVIEW TAB --- */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <SectionHeader title="Informações do Perfil" description="Seus dados pessoais e foto de perfil." />

              {/* Profile Card - View Only */}
              <SettingsCard className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <Avatar className="w-24 h-24 border-4 border-zinc-900 shadow-xl ring-2 ring-zenit-500/20">
                  <AvatarImage src={session?.user?.image || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-green-600 text-white text-2xl font-bold">
                    {getInitials(session?.user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-xl font-semibold text-white">{session?.user?.name}</h3>
                    <Badge variant="outline" className="border-yellow-500/30 text-yellow-500 bg-yellow-500/10 gap-1 px-2 py-0.5">
                      <Crown className="w-3 h-3" />
                      {session?.user?.plano || 'Free'}
                    </Badge>
                    {session?.user?.emailVerified && (
                      <Badge variant="outline" className="border-green-500/30 text-green-400 bg-green-500/10 gap-1 px-2 py-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        Verificado
                      </Badge>
                    )}
                  </div>
                  <p className="text-zinc-400">{session?.user?.email}</p>
                  <p className="text-sm text-zinc-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Membro desde {new Date(session?.user?.createdAt || Date.now()).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </p>
                  <div className="pt-3">
                    <Button
                      size="sm"
                      onClick={() => router.push('/dashboard/settings?from=profile')}
                      className="border-zinc-700 hover:bg-zinc-800 hover:text-white text-zinc-300"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Editar Perfil
                    </Button>
                  </div>
                </div>
              </SettingsCard>

              {/* Plano Premium Info */}
              {session?.user?.plano === 'PREMIUM' ? (
                <>
                  <SectionHeader title="Assinatura" description="Informações sobre seu plano atual." />
                  <SettingsCard className="bg-gradient-to-br from-yellow-500/5 to-orange-500/5 border-yellow-500/20">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-yellow-500/10 rounded-xl">
                        <Crown className="w-6 h-6 text-yellow-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Plano Premium</h3>
                        <p className="text-sm text-zinc-400">Você tem acesso a todos os recursos</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3 bg-zinc-900/50 rounded-lg flex items-center justify-between">
                        <span className="text-sm text-zinc-400">Status</span>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Ativo</Badge>
                      </div>
                      {getDaysUntilExpiration() && (
                        <div className="p-3 bg-zinc-900/50 rounded-lg flex items-center justify-between">
                          <span className="text-sm text-zinc-400">Renova em</span>
                          <span className="text-sm text-white font-medium">{getDaysUntilExpiration()} dias</span>
                        </div>
                      )}
                    </div>
                  </SettingsCard>
                </>
              ) : (
                <>
                  <SectionHeader title="Upgrade" description="Aproveite todos os recursos do Zenit." />
                  <SettingsCard className="bg-gradient-to-br from-zenit-500/5 to-green-500/5 border-zenit-500/20">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <div className="p-4 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl">
                        <Sparkles className="w-10 h-10 text-yellow-400" />
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <h3 className="text-lg font-semibold text-white mb-1">Desbloqueie o Zenit Premium</h3>
                        <p className="text-sm text-zinc-400 mb-4">Acesse recursos exclusivos, conquistas especiais e muito mais.</p>
                        <Button
                          onClick={() => router.push('/premium')}
                          className="bg-gradient-to-r from-yellow-500 via-orange-500 to-teal-500 hover:from-yellow-600 hover:via-orange-600 hover:to-teal-600 shadow-xl shadow-orange-500/25 border-0 text-white font-semibold"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Fazer Upgrade
                        </Button>
                      </div>
                    </div>
                  </SettingsCard>
                </>
              )}
            </div>
          )}

          {/* --- STATS TAB --- */}
          {activeTab === 'stats' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <SectionHeader title="Suas Estatísticas" description="Acompanhe seu progresso no Zenit." />

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-zinc-900/40 border border-zinc-800/50 hover:border-blue-500/30 rounded-2xl p-6 transition-all group">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                        <Calendar className="w-5 h-5 text-blue-400" />
                      </div>
                      <TrendingUp className="w-4 h-4 text-blue-400/50" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-white leading-none">{stats.compromissosTotal}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mt-2">Compromissos</p>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900/40 border border-zinc-800/50 hover:border-emerald-500/30 rounded-2xl p-6 transition-all group">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
                        <BookOpen className="w-5 h-5 text-emerald-400" />
                      </div>
                      <Activity className="w-4 h-4 text-emerald-400/50" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-white leading-none">{stats.cursosAtivos}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mt-2">Cursos Ativos</p>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900/40 border border-zinc-800/50 hover:border-emerald-500/30 rounded-2xl p-6 transition-all group">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
                        <Target className="w-5 h-5 text-emerald-400" />
                      </div>
                      <Check className="w-4 h-4 text-emerald-400/50" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-white leading-none">{stats.metasAlcancadas}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mt-2">Metas</p>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900/40 border border-zinc-800/50 hover:border-orange-500/30 rounded-2xl p-6 transition-all group">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-orange-500/10 rounded-xl group-hover:bg-orange-500/20 transition-colors">
                        <Flame className="w-5 h-5 text-orange-400" />
                      </div>
                      <Zap className="w-4 h-4 text-orange-400/50" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-white leading-none">{stats.diasConsecutivos}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mt-2">Dias Seguidos</p>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900/40 border border-zinc-800/50 hover:border-cyan-500/30 rounded-2xl p-6 transition-all group">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-cyan-500/10 rounded-xl group-hover:bg-cyan-500/20 transition-colors">
                        <DollarSign className="w-5 h-5 text-cyan-400" />
                      </div>
                      <BarChart3 className="w-4 h-4 text-cyan-400/50" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-white leading-none">{stats.transacoesTotal}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mt-2">Transações</p>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900/40 border border-zinc-800/50 hover:border-teal-500/30 rounded-2xl p-6 transition-all group">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-teal-500/10 rounded-xl group-hover:bg-teal-500/20 transition-colors">
                        <Book className="w-5 h-5 text-teal-400" />
                      </div>
                      <Star className="w-4 h-4 text-teal-400/50" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-white leading-none">{stats.midiasLidas}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mt-2">Leituras</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumo de Conquistas */}
              <SettingsCard>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <Trophy className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Progresso de Conquistas</h3>
                      <p className="text-sm text-zinc-400">{unlockedAchievements.length} de {achievements.length} desbloqueadas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">{completionPercentage}%</p>
                  </div>
                </div>
                <Progress value={completionPercentage} className="h-2" />
              </SettingsCard>
            </div>
          )}

          {/* --- ACHIEVEMENTS TAB --- */}
          {activeTab === 'achievements' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <SectionHeader title="Conquistas" description="Suas medalhas e realizações no Zenit." />

              {/* Progress Overview */}
              <SettingsCard>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/10 rounded-lg">
                      <Trophy className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Seu Progresso</h3>
                      <p className="text-sm text-zinc-400">{unlockedAchievements.length} conquistas desbloqueadas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">{completionPercentage}%</p>
                    <p className="text-xs text-zinc-400">Completo</p>
                  </div>
                </div>
                <Progress value={completionPercentage} className="h-3" />
              </SettingsCard>

              {/* Achievements Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement) => {
                  const Icon = achievement.icon;
                  const isUnlocked = achievement.unlocked;
                  const hasProgress = achievement.total !== undefined;

                  return (
                    <SettingsCard
                      key={achievement.id}
                      className={cn(
                        "transition-all",
                        isUnlocked
                          ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/30'
                          : 'opacity-60'
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            "p-3 rounded-xl",
                            isUnlocked
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-zinc-800/50 text-zinc-500'
                          )}
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-white">{achievement.title}</h4>
                            {isUnlocked && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                          </div>
                          <p className="text-sm text-zinc-400 mt-1">{achievement.description}</p>
                          {hasProgress && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-zinc-500">
                                  {achievement.progress}/{achievement.total}
                                </span>
                                <span className="text-zinc-500">
                                  {Math.round(((achievement.progress || 0) / (achievement.total || 1)) * 100)}%
                                </span>
                              </div>
                              <Progress
                                value={((achievement.progress || 0) / (achievement.total || 1)) * 100}
                                className="h-1.5"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </SettingsCard>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
