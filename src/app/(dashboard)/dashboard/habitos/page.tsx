'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { db } from '@/lib/dexie';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Target,
  Flame,
  CheckCircle2,
  Circle,
  Loader2,
  Trash2,
  Calendar,
  TrendingUp,
  BarChart3,
  Award,
  Percent,
  X,
  Clock,
  ArrowLeft,
  CalendarX,
  CalendarOff,
  Folder,
  Settings2,
  ChevronDown,
  Tag,
  Sparkles,
  Zap,
} from 'lucide-react';
import { StreakCalendar } from './components/StreakCalendar';
import { TrendChart } from './components/TrendChart';
import { WeekdayStats } from './components/WeekdayStats';
import { MonthlyCalendar } from './components/MonthlyCalendar';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

interface CategoriaHabito {
  id: string;
  nome: string;
  cor: string;
  icone: string;
  totalHabitos?: number;
}

interface Habito {
  id: string;
  nome: string;
  descricao?: string;
  diasSemana?: number[];
  sequenciaAtual: number;
  melhorSequencia: number;
  totalCompletados: number;
  cor: string;
  icone: string;
  categoriaId?: string | null;
  categoria?: CategoriaHabito | null;
  completadoHoje: boolean;
}

interface CalendarioData {
  data: string;
  completados: number;
  total: number;
  nivel: number;
  diaSemana: number;
}

interface TendenciaData {
  semana: number;
  dataInicio: string;
  completados: number;
  total: number;
  taxa: number;
}

interface EstatisticaDia {
  dia: number;
  completados: number;
  total: number;
  taxa: number;
}

interface Estatisticas {
  totalHabitos: number;
  completadosHoje: number;
  pendentesHoje: number;
  maiorSequenciaAtual: number;
  maiorSequenciaHistorica: number;
  totalCompletados: number;
  taxaConclusaoHoje: number;
  calendarioStreak: CalendarioData[];
  tendenciaSemanal: TendenciaData[];
  taxaSucessoGeral: number;
  diasCompletosTotal: number;
  diasComHabitos: number;
  melhorSemana: TendenciaData;
  estatisticasPorDia: EstatisticaDia[];
  melhorDia: EstatisticaDia | null;
  piorDia: EstatisticaDia | null;
}

const DIAS_SEMANA = [
  { valor: 0, label: 'D', nome: 'Domingo' },
  { valor: 1, label: 'S', nome: 'Segunda' },
  { valor: 2, label: 'T', nome: 'Terça' },
  { valor: 3, label: 'Q', nome: 'Quarta' },
  { valor: 4, label: 'Q', nome: 'Quinta' },
  { valor: 5, label: 'S', nome: 'Sexta' },
  { valor: 6, label: 'S', nome: 'Sábado' },
];

const CORES = [
  '#10B981', '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
  '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#84CC16'
];

export default function HabitosPage() {
  const t = useTranslations('habits');
  const [loading, setLoading] = useState(true);
  const [habitos, setHabitos] = useState<Habito[]>([]);
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [categorias, setCategorias] = useState<CategoriaHabito[]>([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(null); // null = todas

  // Obter timezone do usuário (executado apenas no cliente)
  const timezone = useMemo(() => {
    if (typeof window !== 'undefined') {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    return 'America/Sao_Paulo'; // Fallback
  }, []);

  // Data selecionada para visualização de hábitos (hoje por padrão)
  const [dataSelecionada, setDataSelecionada] = useState<Date>(() => new Date());

  // Dados mensais para o calendário
  const [dadosMensais, setDadosMensais] = useState<Record<string, { completados: number; total: number }>>({});

  // Modal states
  const [modalHabitoAberto, setModalHabitoAberto] = useState(false);
  const [modalExcluirHabito, setModalExcluirHabito] = useState(false);
  const [habitoSelecionado, setHabitoSelecionado] = useState<Habito | null>(null);
  const [etapaExclusao, setEtapaExclusao] = useState<1 | 2>(1); // 1 = escolher tipo, 2 = escolher escopo
  const [modalCategoriasAberto, setModalCategoriasAberto] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState<CategoriaHabito | null>(null);
  const [novaCategoria, setNovaCategoria] = useState({ nome: '', cor: '#10B981', icone: 'folder' });
  const [salvandoCategoria, setSalvandoCategoria] = useState(false);
  const [excluindoCategoria, setExcluindoCategoria] = useState(false);

  // Loading states
  const [criandoHabito, setCriandoHabito] = useState(false);
  const [completandoHabito, setCompletandoHabito] = useState<string | null>(null);
  const [excluindoHabito, setExcluindoHabito] = useState(false);

  // Form states
  const [novoHabito, setNovoHabito] = useState({
    nome: '',
    descricao: '',
    horario: '',
    diasSemana: [] as number[],
    cor: '#10B981',
    categoriaId: null as string | null,
  });

  // Verifica se a data selecionada é o dia de hoje (ignorando a hora)
  const isVisualizandoDiaAtual = useMemo(() => {
    const hoje = new Date();
    return dataSelecionada.getDate() === hoje.getDate() &&
      dataSelecionada.getMonth() === hoje.getMonth() &&
      dataSelecionada.getFullYear() === hoje.getFullYear();
  }, [dataSelecionada]);

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);

      const dbCategorias = await db.categoriasHabito.toArray();
      setCategorias(dbCategorias.map(c => ({
        ...c,
        totalHabitos: 0
      })));

      // Fetch do banco de dados na Nuvem
      const response = await fetch('/api/habitos');
      const data = await response.json();
      const dbHabitos = data.data || [];

      // O histórico continua local por enquanto até migrarmos
      const dbHistorico = await db.registrosHabitos.toArray();

      // Construir os hábitos a serem mostrados na UI
      const habitosCompletos: Habito[] = dbHabitos.map((h: Habito) => {
        const completadoHoje = dbHistorico.some(hist => {
          const histDate = new Date(hist.data);
          return hist.habitoId === h.id &&
            histDate.getDate() === dataSelecionada.getDate() &&
            histDate.getMonth() === dataSelecionada.getMonth() &&
            histDate.getFullYear() === dataSelecionada.getFullYear() &&
            hist.concluido === true;
        });

        const totalCompletos = dbHistorico.filter(hist => hist.habitoId === h.id && hist.concluido === true).length;

        return {
          id: h.id,
          nome: h.nome,
          descricao: h.descricao,
          diasSemana: h.diasSemana,
          sequenciaAtual: h.sequenciaAtual,
          melhorSequencia: h.melhorSequencia,
          totalCompletados: totalCompletos,
          cor: h.cor,
          icone: h.icone || 'target',
          categoriaId: h.categoriaId,
          completadoHoje
        };
      });

      setHabitos(habitosCompletos);

      // Calcular dados mensais para o calendário
      const dadosMensaisMap: Record<string, { completados: number; total: number }> = {};

      const calcTotalParaData = (data: Date) => {
        const diaSemana = data.getDay();
        return dbHabitos.filter((h: Habito) => {
          if (!h.diasSemana || h.diasSemana.length === 0) return true;
          return h.diasSemana.includes(diaSemana);
        }).length;
      };

      const completadosPorData: Record<string, Set<string>> = {};
      for (const hist of dbHistorico) {
        if (!hist.concluido) continue;
        const histDate = new Date(hist.data);
        const dataStr = `${histDate.getFullYear()}-${String(histDate.getMonth() + 1).padStart(2, '0')}-${String(histDate.getDate()).padStart(2, '0')}`;
        if (!completadosPorData[dataStr]) completadosPorData[dataStr] = new Set();
        completadosPorData[dataStr].add(hist.habitoId);
      }

      for (const dataStr of Object.keys(completadosPorData)) {
        const [y, m, d] = dataStr.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        dadosMensaisMap[dataStr] = {
          completados: completadosPorData[dataStr].size,
          total: calcTotalParaData(dateObj)
        };
      }

      const anoSel = dataSelecionada.getFullYear();
      const mesSel = dataSelecionada.getMonth();
      for (let i = 1; i <= 31; i++) {
        const d = new Date(anoSel, mesSel, i);
        if (d.getMonth() !== mesSel) break;
        const dataStr = `${anoSel}-${String(mesSel + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        if (!dadosMensaisMap[dataStr]) {
          dadosMensaisMap[dataStr] = { completados: 0, total: calcTotalParaData(d) };
        }
      }
      setDadosMensais(dadosMensaisMap);

      // Calcular estatisticas simplificadas
      const compHoje = habitosCompletos.filter(h => h.completadoHoje).length;
      const totHabitos = habitosCompletos.length;

      setEstatisticas({
        totalHabitos: totHabitos,
        completadosHoje: compHoje,
        pendentesHoje: totHabitos - compHoje,
        maiorSequenciaAtual: habitosCompletos.reduce((max, h) => Math.max(max, h.sequenciaAtual), 0),
        maiorSequenciaHistorica: habitosCompletos.reduce((max, h) => Math.max(max, h.melhorSequencia), 0),
        totalCompletados: habitosCompletos.reduce((sum, h) => sum + h.totalCompletados, 0),
        taxaConclusaoHoje: totHabitos > 0 ? (compHoje / totHabitos) * 100 : 0,
        calendarioStreak: [], // Simplificado por enquanto
        tendenciaSemanal: [],
        taxaSucessoGeral: 0,
        diasCompletosTotal: 0,
        diasComHabitos: 0,
        melhorSemana: { semana: 1, dataInicio: '', completados: 0, total: 1, taxa: 0 },
        estatisticasPorDia: [],
        melhorDia: null,
        piorDia: null
      });

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, [dataSelecionada, timezone]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const criarHabito = async () => {
    if (criandoHabito || !novoHabito.nome.trim()) return;

    setCriandoHabito(true);
    try {
      const payload = {
        nome: novoHabito.nome.trim(),
        descricao: novoHabito.descricao?.trim() || undefined,
        icone: 'target',
        cor: novoHabito.cor,
        frequencia: 'DIARIA',
        diasSemana: novoHabito.diasSemana.length > 0 ? novoHabito.diasSemana : undefined,
        categoriaId: novoHabito.categoriaId || undefined,
      };

      const response = await fetch('/api/habitos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Erro na resposta da API');
      }

      setModalHabitoAberto(false);
      setNovoHabito({
        nome: '',
        descricao: '',
        horario: '',
        diasSemana: [],
        cor: '#10B981',
        categoriaId: null,
      });
      carregarDados();
    } catch (error) {
      console.error('Erro ao criar hábito no servidor:', error);
      alert('Erro ao salvar hábito na nuvem (Neon)');
    } finally {
      setCriandoHabito(false);
    }
  };

  const completarHabito = async (habito: Habito) => {
    if (completandoHabito) return;

    setCompletandoHabito(habito.id);
    try {
      const dataAlvo = new Date(dataSelecionada);
      dataAlvo.setHours(0, 0, 0, 0);

      if (habito.completadoHoje) {
        // Desmarcar: remover registro
        const registros = await db.registrosHabitos
          .where('habitoId')
          .equals(habito.id)
          .toArray();

        const registroHoje = registros.find(r => {
          const d = new Date(r.data);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === dataAlvo.getTime();
        });

        if (registroHoje) {
          await db.registrosHabitos.delete(registroHoje.id);
        }
      } else {
        // Marcar: adicionar registro para a data selecionada
        const novaData = new Date(dataSelecionada);
        await db.registrosHabitos.add({
          id: crypto.randomUUID(),
          habitoId: habito.id,
          data: novaData,
          concluido: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);
      }

      // Recalcular sequencia simplificada (apenas para atualizar a UI)
      // Em um sistema real, isso seria um worker mais complexo
      const todosRegistros = await db.registrosHabitos
        .where('habitoId')
        .equals(habito.id)
        .toArray();
      const totalCompletos = todosRegistros.filter(r => r.concluido).length;

      // Atualizar no banco na nuvem
      const novaSequencia = habito.completadoHoje ? Math.max(0, habito.sequenciaAtual - 1) : habito.sequenciaAtual + 1;
      const response = await fetch('/api/habitos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: habito.id,
          sequenciaAtual: novaSequencia
        })
      });

      if (!response.ok) throw new Error('Falha ao atualizar sequência no Neon');

      carregarDados();
    } catch (error) {
      console.error('Erro ao completar hábito:', error);
    } finally {
      setCompletandoHabito(null);
    }
  };

  // Dia sendo visualizado (para saber qual dia remover)
  const diaVisualizando = dataSelecionada.getDay();

  const excluirHabito = async (tipo: 'encerrar' | 'excluir', escopo?: 'dia' | 'todos') => {
    if (!habitoSelecionado || excluindoHabito) return;

    setExcluindoHabito(true);
    try {
      if (tipo === 'excluir' || escopo === 'todos') {
        // Remover todos os registros locais associados
        await db.registrosHabitos.where('habitoId').equals(habitoSelecionado.id).delete();

        // Excluir Hábito da Nuvem
        const response = await fetch(`/api/habitos?id=${habitoSelecionado.id}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Falha ao excluir hábito no banco (Neon)');
      } else if (escopo === 'dia') {
        // "Remover do dia" localmente apenas remove o registro se existir
        const dataAlvo = new Date(dataSelecionada);
        dataAlvo.setHours(0, 0, 0, 0);
        const registros = await db.registrosHabitos.where('habitoId').equals(habitoSelecionado.id).toArray();
        const registroHoje = registros.find(r => {
          const d = new Date(r.data);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === dataAlvo.getTime();
        });
        if (registroHoje) {
          await db.registrosHabitos.delete(registroHoje.id);
        }
      }

      setModalExcluirHabito(false);
      setHabitoSelecionado(null);
      setEtapaExclusao(1);
      carregarDados();
    } catch (error) {
      console.error('Erro ao excluir hábito:', error);
    } finally {
      setExcluindoHabito(false);
    }
  };

  // Handler para avançar para segunda etapa (encerrar)
  const handleEncerrarClick = () => {
    setEtapaExclusao(2);
  };

  // Verifica se o hábito pode ser removido apenas de um dia específico
  // (só faz sentido se o hábito aparece em mais de um dia)
  const podeRemoverDiaEspecifico = useMemo(() => {
    if (!habitoSelecionado) return false;
    // Se diasSemana está vazio, aparece todos os dias (7 dias)
    // Se tem valores, aparece nos dias especificados
    const diasDoHabito = !habitoSelecionado.diasSemana || habitoSelecionado.diasSemana.length === 0 ? 7 : habitoSelecionado.diasSemana.length;
    return diasDoHabito > 1;
  }, [habitoSelecionado]);

  const toggleDiaSemana = (dia: number) => {
    setNovoHabito(prev => ({
      ...prev,
      diasSemana: prev.diasSemana.includes(dia)
        ? prev.diasSemana.filter(d => d !== dia)
        : [...prev.diasSemana, dia].sort(),
    }));
  };

  // Funções de categorias
  const salvarCategoria = async () => {
    if (salvandoCategoria || !novaCategoria.nome.trim()) return;

    setSalvandoCategoria(true);
    try {
      if (categoriaEditando) {
        await db.categoriasHabito.update(categoriaEditando.id, {
          nome: novaCategoria.nome.trim(),
          cor: novaCategoria.cor,
          icone: novaCategoria.icone,
          updatedAt: new Date()
        } as any);
      } else {
        await db.categoriasHabito.add({
          id: crypto.randomUUID(),
          nome: novaCategoria.nome.trim(),
          cor: novaCategoria.cor,
          icone: novaCategoria.icone,
          createdAt: new Date(),
          updatedAt: new Date()
        } as any);
      }

      setNovaCategoria({ nome: '', cor: '#10B981', icone: 'folder' });
      setCategoriaEditando(null);
      carregarDados();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      alert('Erro ao salvar categoria localmente');
    } finally {
      setSalvandoCategoria(false);
    }
  };

  const excluirCategoria = async (categoriaId: string) => {
    if (excluindoCategoria) return;

    setExcluindoCategoria(true);
    try {
      await db.categoriasHabito.delete(categoriaId);
      // Opcional: desassociar hábitos desta categoria
      const habitosDaCategoria = await db.habitos.where('categoriaId').equals(categoriaId).toArray();
      for (const h of habitosDaCategoria) {
        await db.habitos.update(h.id, { categoriaId: undefined });
      }

      if (categoriaFiltro === categoriaId) {
        setCategoriaFiltro(null);
      }
      carregarDados();
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
    } finally {
      setExcluindoCategoria(false);
    }
  };

  const iniciarEdicaoCategoria = (categoria: CategoriaHabito) => {
    setCategoriaEditando(categoria);
    setNovaCategoria({
      nome: categoria.nome,
      cor: categoria.cor,
      icone: categoria.icone,
    });
  };

  const cancelarEdicaoCategoria = () => {
    setCategoriaEditando(null);
    setNovaCategoria({ nome: '', cor: '#10B981', icone: 'folder' });
  };

  // Filtrar por categoria se houver filtro selecionado
  const habitosFiltradosPorCategoria = useMemo(() => {
    if (categoriaFiltro === null) return habitos;
    if (categoriaFiltro === 'sem-categoria') return habitos.filter(h => !h.categoriaId);
    return habitos.filter(h => h.categoriaId === categoriaFiltro);
  }, [habitos, categoriaFiltro]);

  // Separar hábitos completados e pendentes
  const habitosPendentes = habitosFiltradosPorCategoria.filter(h => !h.completadoHoje);
  const habitosCompletados = habitosFiltradosPorCategoria.filter(h => h.completadoHoje);

  if (loading) {
    return (
      <LoadingScreen message={t('loading')} />
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden space-y-6 p-4 lg:p-6">
      {/* Header */}
      <PageHeader 
        title={t('pageTitle')}
        description={t('subtitle')}
        action={
          <Button
            onClick={() => setModalHabitoAberto(true)}
            variant="premium"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('newHabit')}
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto min-h-0 space-y-4 sm:space-y-6 pr-1 sm:pr-2 scroll-container">
        {/* Estatísticas resumidas */}
        {estatisticas && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border border-zinc-800/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">{t('todayProgress')}</p>
                    <p className="text-3xl font-bold text-white leading-tight">
                      {estatisticas.completadosHoje}
                      <span className="text-zinc-700 mx-1">/</span>
                      <span className="text-zinc-400">{estatisticas.totalHabitos}</span>
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-zinc-800/50 flex items-center justify-center border border-zinc-700/30">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500/50" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-zinc-800/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">{t('currentStreak')}</p>
                    <p className="text-3xl font-bold text-white leading-tight">
                      {estatisticas.maiorSequenciaAtual}
                      <span className="text-[10px] ml-2 font-bold uppercase text-zinc-600 tracking-tighter">{t('days')}</span>
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                    <Flame className="w-6 h-6 text-orange-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-zinc-800/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">{t('bestStreak')}</p>
                    <p className="text-3xl font-bold text-white leading-tight">
                      {estatisticas.maiorSequenciaHistorica}
                      <span className="text-[10px] ml-2 font-bold uppercase text-zinc-600 tracking-tighter">{t('days')}</span>
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <TrendingUp className="w-6 h-6 text-emerald-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-zinc-800/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">{t('totalCompleted')}</p>
                    <p className="text-3xl font-bold text-white leading-tight">{estatisticas.totalCompletados}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-zinc-800/50 flex items-center justify-center border border-zinc-700/30">
                    <Target className="w-6 h-6 text-zinc-500/50" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Seletor Mensal e Filtro de Categorias */}
        <div className="flex flex-col space-y-4">
          <MonthlyCalendar
            dataSelecionada={dataSelecionada}
            onDataSelect={setDataSelecionada}
            dadosMensais={dadosMensais}
          />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">

            {/* Filtro de Categorias */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  onClick={() => setCategoriaFiltro(null)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${categoriaFiltro === null
                    ? 'bg-green-600 text-white'
                    : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800'
                    }`}
                >
                  {t('categories.all')}
                </button>
                {categorias.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoriaFiltro(cat.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${categoriaFiltro === cat.id
                      ? 'text-white'
                      : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800'
                      }`}
                    style={categoriaFiltro === cat.id ? { backgroundColor: cat.cor } : undefined}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: categoriaFiltro === cat.id ? 'white' : cat.cor }}
                    />
                    {cat.nome}
                  </button>
                ))}
                {habitos.some(h => !h.categoriaId) && (
                  <button
                    onClick={() => setCategoriaFiltro('sem-categoria')}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${categoriaFiltro === 'sem-categoria'
                      ? 'bg-zinc-600 text-white'
                      : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800'
                      }`}
                  >
                    {t('categories.uncategorized')}
                  </button>
                )}
              </div>
              <button
                onClick={() => setModalCategoriasAberto(true)}
                className="p-1.5 rounded-lg bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                title={t('categories.manage')}
              >
                <Settings2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Hábitos - Compacta */}
        {habitos.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-zinc-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-zinc-700/30">
                <Target className="w-8 h-8 text-zinc-500" />
              </div>
              <h3 className="text-lg font-bold text-white uppercase tracking-tight mb-2">{t('noHabitsYet')}</h3>
              <p className="text-sm text-zinc-500 uppercase tracking-widest font-bold mb-8 max-w-xs mx-auto leading-relaxed">{t('startCreatingHabits')}</p>
              <Button
                onClick={() => setModalHabitoAberto(true)}
                variant="premium"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('createFirstHabit')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-zinc-800/50 bg-zinc-900/40">
            <CardContent className="p-6">
              {/* Hábitos Pendentes */}
              {habitosPendentes.length > 0 && (
                <div className={habitosCompletados.length > 0 ? 'mb-8' : ''}>
                  <h2 className="text-[10px] font-black text-zinc-500 mb-4 flex items-center gap-2 uppercase tracking-[0.2em] opacity-50">
                    <Circle className="w-3 h-3" />
                    {t('pending')} — {habitosPendentes.length}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {habitosPendentes.map((habito) => (
                      <div
                        key={habito.id}
                        className={`flex items-center gap-4 p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/40 transition-all group ${isVisualizandoDiaAtual ? 'hover:bg-zinc-800/50 hover:border-zinc-700/50' : 'opacity-40'
                          }`}
                      >
                        <button
                          onClick={() => completarHabito(habito)}
                          disabled={completandoHabito === habito.id}
                          className={`flex-shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm`}
                          style={{
                            borderColor: `${habito.cor}40`,
                            backgroundColor: `${habito.cor}10`
                          }}
                        >
                          {completandoHabito === habito.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" style={{ color: habito.cor }} />
                          ) : (
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: habito.cor }} />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-zinc-100 uppercase tracking-tight truncate">{habito.nome}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1 text-orange-500/80">
                              <Flame className="w-3 h-3" />
                              <span className="text-[10px] font-black">{habito.sequenciaAtual}</span>
                            </div>
                            {habito.categoria && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 tracking-widest">
                                {habito.categoria.nome}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setHabitoSelecionado(habito);
                            setModalExcluirHabito(true);
                          }}
                          className="p-2 text-zinc-700 hover:text-red-500 transition-all rounded-lg opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Divisor */}
              {habitosPendentes.length > 0 && habitosCompletados.length > 0 && (
                <div className="border-t border-zinc-800/50 my-8" />
              )}

              {/* Hábitos Completados */}
              {habitosCompletados.length > 0 && (
                <div>
                  <h2 className="text-[10px] font-black text-emerald-500/50 mb-4 flex items-center gap-2 uppercase tracking-[0.2em]">
                    <CheckCircle2 className="w-3 h-3" />
                    {t('completed')} — {habitosCompletados.length}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {habitosCompletados.map((habito) => (
                      <div
                        key={habito.id}
                        className="flex items-center gap-4 p-4 rounded-xl border border-zinc-800/30 bg-zinc-950/40 opacity-60 hover:opacity-100 transition-opacity"
                      >
                        <button
                          onClick={() => completarHabito(habito)}
                          disabled={completandoHabito === habito.id}
                          className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center transition-all"
                        >
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-zinc-400 uppercase tracking-tight line-through truncate">{habito.nome}</p>
                        </div>
                        <button
                          onClick={() => {
                            setHabitoSelecionado(habito);
                            setModalExcluirHabito(true);
                          }}
                          className="p-2 text-zinc-800 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Estatísticas Avançadas */}
        {estatisticas && estatisticas.calendarioStreak && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Taxa de Sucesso por Dia da Semana e Métricas Gerais */}

            {/* Taxa de Sucesso por Dia da Semana */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-green-500" />
                  {t('successByWeekday')}
                </CardTitle>
                <p className="text-xs text-zinc-500">
                  {estatisticas.diasComHabitos > 90 ? t('last90Days') : t('allTime')}
                </p>
              </CardHeader>
              <CardContent>
                <WeekdayStats
                  dados={estatisticas.estatisticasPorDia}
                  melhorDia={estatisticas.melhorDia}
                  piorDia={estatisticas.piorDia}
                />
              </CardContent>
            </Card>

            {/* Métricas Gerais */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-green-500" />
                  {t('overallMetrics')}
                </CardTitle>
                <p className="text-xs text-zinc-500">
                  {estatisticas.diasComHabitos > 90 ? t('last90Days') : t('allTime')}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Taxa de Sucesso Geral */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-zinc-400">{t('overallSuccessRate')}</span>
                  </div>
                  <span className="text-lg font-bold text-white">{estatisticas.taxaSucessoGeral}%</span>
                </div>

                {/* Dias Completos */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-zinc-400">{t('perfectDays')}</span>
                  </div>
                  <span className="text-lg font-bold text-white">
                    {estatisticas.diasCompletosTotal}/{estatisticas.diasComHabitos}
                  </span>
                </div>

                {/* Melhor Semana */}
                {estatisticas.melhorSemana && estatisticas.melhorSemana.taxa > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-zinc-400">{t('bestWeek')}</span>
                    </div>
                    <span className="text-lg font-bold text-white">
                      {estatisticas.melhorSemana.taxa}%
                      <span className="text-xs font-normal text-zinc-500 ml-1">
                        ({t('week')} {estatisticas.melhorSemana.semana})
                      </span>
                    </span>
                  </div>
                )}

                {/* Barra de Progresso Visual */}
                <div className="pt-2">
                  <div className="flex justify-between text-xs text-zinc-500 mb-1">
                    <span>{t('consistency')}</span>
                    <span>{estatisticas.taxaSucessoGeral}%</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full transition-all duration-500"
                      style={{ width: `${estatisticas.taxaSucessoGeral}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal Novo Hábito - Redesenhado Premium */}
        <Dialog open={modalHabitoAberto} onOpenChange={setModalHabitoAberto}>
          <DialogContent className="bg-zinc-950 border-zinc-800/50 sm:max-w-[1000px] w-[95vw] max-h-[90vh] overflow-visible p-0 gap-0 shadow-2xl focus:ring-0 focus:outline-none focus-visible:ring-0 sm:rounded-[32px] border-zinc-800/30">
            <div className="flex flex-col h-full overflow-visible">
              {/* Header com Gradiente */}
              <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-900/50 p-6 border-b border-zinc-800/50 sm:rounded-t-[32px]">
                <DialogHeader className="gap-1">
                  <DialogTitle className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                      <Target className="w-6 h-6" />
                    </div>
                    {t('newHabit')}
                  </DialogTitle>
                  <DialogDescription className="text-zinc-500 font-medium text-base ml-12">
                     Projete sua nova rotina de alta performance e assuma o controle do seu destino.
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="p-8 space-y-8 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Coluna Esquerda: Definição e Identidade */}
                  <div className="space-y-6">
                    <div>
                      <Label className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-500 mb-3 block ml-1">{t('habitName')}</Label>
                      <Input
                        value={novoHabito.nome}
                        onChange={(e) => setNovoHabito({ ...novoHabito, nome: e.target.value })}
                        className="bg-zinc-900/50 border-zinc-800 text-white h-14 px-5 rounded-2xl placeholder:text-zinc-700 focus:border-emerald-500/50 focus-visible:ring-0 focus:ring-0 focus:outline-none transition-all text-lg font-bold"
                        placeholder={t('habitNamePlaceholder')}
                      />
                    </div>

                    <div>
                      <Label className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-500 mb-3 block ml-1">Descrição do Hábito</Label>
                      <textarea
                        value={novoHabito.descricao}
                        onChange={(e) => setNovoHabito({ ...novoHabito, descricao: e.target.value })}
                        rows={3}
                        className="w-full bg-zinc-900/50 border-zinc-800 text-white p-5 rounded-2xl placeholder:text-zinc-700 focus:border-emerald-500/50 focus-visible:ring-0 focus:ring-0 focus:outline-none transition-all text-base resize-none border-2"
                        placeholder="Por que este hábito é importante para você?"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-500 mb-3 block ml-1">{t('time')}</Label>
                        <Input
                          type="time"
                          value={novoHabito.horario}
                          onChange={(e) => setNovoHabito({ ...novoHabito, horario: e.target.value })}
                          className="bg-zinc-900/50 border-zinc-800 text-white h-12 px-4 rounded-xl focus:border-emerald-500/50 focus-visible:ring-0 focus:ring-0 transition-all font-bold"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-500 mb-3 block ml-1">{t('color')}</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {CORES.slice(0, 5).map((cor) => (
                            <button
                              key={cor}
                              type="button"
                              onClick={() => setNovoHabito({ ...novoHabito, cor })}
                              className={`w-8 h-8 rounded-full transition-all ${novoHabito.cor === cor ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-950 scale-110 shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'hover:scale-105 opacity-50'
                                }`}
                              style={{ backgroundColor: cor }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Coluna Direita: Frequência e Categorização */}
                  <div className="space-y-8">
                    {/* Categorias - Estilo Badges Profissionais */}
                    <div>
                      <Label className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-500 mb-4 block ml-1">Categorização</Label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setNovoHabito({ ...novoHabito, categoriaId: null })}
                          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2 ${novoHabito.categoriaId === null
                            ? 'bg-zinc-100 text-black border-white shadow-lg shadow-white/10'
                            : 'bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300'
                            }`}
                        >
                          Sem Categoria
                        </button>
                        {categorias.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setNovoHabito({ ...novoHabito, categoriaId: cat.id })}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2 flex items-center gap-2 ${novoHabito.categoriaId === cat.id
                              ? 'text-white shadow-lg transition-colors'
                              : 'bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300'
                              }`}
                            style={novoHabito.categoriaId === cat.id ? { backgroundColor: cat.cor, borderColor: cat.cor } : {}}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${novoHabito.categoriaId === cat.id ? 'bg-white' : ''}`} style={novoHabito.categoriaId !== cat.id ? { backgroundColor: cat.cor } : {}} />
                            {cat.nome}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Frequência de Repetição */}
                    <div>
                      <div className="flex items-center justify-between mb-4 ml-1">
                        <Label className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-500 block">{t('repeatOn')}</Label>
                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">{t('leaveEmptyForEveryday')}</span>
                      </div>
                      <div className="grid grid-cols-7 gap-2">
                        {DIAS_SEMANA.map((dia) => (
                          <button
                            key={dia.valor}
                            type="button"
                            onClick={() => toggleDiaSemana(dia.valor)}
                            className={`aspect-square flex flex-col items-center justify-center rounded-xl border-2 transition-all group ${novoHabito.diasSemana.includes(dia.valor)
                              ? 'bg-emerald-500 border-emerald-400 text-black shadow-lg shadow-emerald-500/20'
                              : 'bg-zinc-900/50 border-zinc-800 text-zinc-600 hover:border-zinc-700 hover:text-zinc-400'
                              }`}
                          >
                            <span className="text-sm font-black">{dia.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Info Card Gamificado */}
                    <div className="p-5 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-3xl border border-emerald-500/20 flex gap-4 items-center animate-in fade-in zoom-in-95 duration-700">
                      <div className="w-12 h-12 bg-emerald-500 text-black rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                        <Zap className="w-6 h-6 fill-black" />
                      </div>
                      <div>
                        <p className="text-white font-black text-sm uppercase tracking-tight">Potencializador de Hábitos</p>
                        <p className="text-zinc-500 text-xs leading-relaxed mt-0.5">Ao completar este hábito por 21 dias seguidos, você reprograma seu cérebro para o sucesso.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex gap-4 pt-10 border-t border-zinc-800/50">
                  <Button
                    variant="outline"
                    onClick={() => setModalHabitoAberto(false)}
                    className="flex-1 h-14 rounded-2xl border-zinc-800 bg-transparent text-zinc-500 font-black uppercase tracking-widest hover:bg-zinc-900 hover:text-white transition-all text-xs"
                  >
                    Descartar Projeto
                  </Button>
                  <Button
                    onClick={criarHabito}
                    disabled={!novoHabito.nome || criandoHabito}
                    className="flex-[2] h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-900/20 hover:scale-[1.01] transition-all text-xs group"
                  >
                    {criandoHabito ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <span className="flex items-center gap-2">
                        Ativar Novo Hábito <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Confirmar Exclusão com Opções */}
        <Dialog open={modalExcluirHabito} onOpenChange={(open) => {
          if (!excluindoHabito) {
            setModalExcluirHabito(open);
            if (!open) {
              setHabitoSelecionado(null);
              setEtapaExclusao(1);
            }
          }
        }}>
          <DialogContent className="sm:max-w-[520px] bg-zinc-900 border-zinc-800 rounded-2xl">
            <DialogHeader>
              <div className="flex items-start gap-4 mb-2">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shrink-0 ${etapaExclusao === 1
                  ? 'bg-gradient-to-br from-red-500 to-red-600'
                  : 'bg-gradient-to-br from-green-500 to-green-600'
                  }`}>
                  {etapaExclusao === 1 ? (
                    <Trash2 className="w-6 h-6 text-white" />
                  ) : (
                    <Clock className="w-6 h-6 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-xl text-white mb-2">
                    {etapaExclusao === 1 ? t('deleteHabit') : t('endHabitScope')}
                  </DialogTitle>
                  <DialogDescription className="text-zinc-400 text-sm leading-relaxed">
                    {habitoSelecionado && (
                      <>
                        {etapaExclusao === 1
                          ? t('deleteHabitOptions', { habitName: habitoSelecionado.nome })
                          : t('endHabitScopeDescription', { habitName: habitoSelecionado.nome })
                        }
                      </>
                    )}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Etapa 1: Escolher entre encerrar ou excluir */}
            {etapaExclusao === 1 && (
              <div className="space-y-3 mt-4">
                {/* Opção 1: Encerrar (soft delete) */}
                <button
                  onClick={handleEncerrarClick}
                  disabled={excluindoHabito}
                  className="w-full p-4 rounded-xl border border-zinc-700 hover:border-green-500 hover:bg-green-500/10 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0 group-hover:bg-green-500/30 transition-colors">
                      <Clock className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white mb-1">{t('endHabitOnly')}</p>
                      <p className="text-sm text-zinc-500">{t('endHabitOnlyDescription')}</p>
                    </div>
                  </div>
                </button>

                {/* Opção 2: Excluir (hard delete) */}
                <button
                  onClick={() => excluirHabito('excluir')}
                  disabled={excluindoHabito}
                  className="w-full p-4 rounded-xl border border-zinc-700 hover:border-red-500 hover:bg-red-500/10 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0 group-hover:bg-red-500/30 transition-colors">
                      <Trash2 className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white mb-1">{t('deleteHabitCompletely')}</p>
                      <p className="text-sm text-zinc-500">{t('deleteHabitCompletelyDescription')}</p>
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* Etapa 2: Escolher escopo (dia específico ou todos os dias) */}
            {etapaExclusao === 2 && (
              <div className="space-y-3 mt-4">
                {/* Opção 1: Apenas este dia */}
                {podeRemoverDiaEspecifico && (
                  <button
                    onClick={() => excluirHabito('encerrar', 'dia')}
                    disabled={excluindoHabito}
                    className="w-full p-4 rounded-xl border border-zinc-700 hover:border-blue-500 hover:bg-blue-500/10 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0 group-hover:bg-blue-500/30 transition-colors">
                        <CalendarX className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-white mb-1">
                          {t('endOnlyThisDay', { dayName: DIAS_SEMANA[diaVisualizando].nome })}
                        </p>
                        <p className="text-sm text-zinc-500">{t('endOnlyThisDayDescription')}</p>
                      </div>
                    </div>
                  </button>
                )}

                {/* Opção 2: Todos os dias */}
                <button
                  onClick={() => excluirHabito('encerrar', 'todos')}
                  disabled={excluindoHabito}
                  className="w-full p-4 rounded-xl border border-zinc-700 hover:border-green-500 hover:bg-green-500/10 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0 group-hover:bg-green-500/30 transition-colors">
                      <CalendarOff className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white mb-1">{t('endAllDays')}</p>
                      <p className="text-sm text-zinc-500">{t('endAllDaysDescription')}</p>
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* Botões de ação */}
            <div className="mt-4 flex gap-2">
              {etapaExclusao === 2 && (
                <Button
                  variant="ghost"
                  onClick={() => setEtapaExclusao(1)}
                  disabled={excluindoHabito}
                  className="flex-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl h-11"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('back')}
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => {
                  setModalExcluirHabito(false);
                  setHabitoSelecionado(null);
                  setEtapaExclusao(1);
                }}
                disabled={excluindoHabito}
                className={`${etapaExclusao === 2 ? 'flex-1' : 'w-full'} text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl h-11`}
              >
                <X className="w-4 h-4 mr-2" />
                {t('cancel')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Gerenciar Categorias */}
        <Dialog open={modalCategoriasAberto} onOpenChange={(open) => {
          setModalCategoriasAberto(open);
          if (!open) {
            setCategoriaEditando(null);
            setNovaCategoria({ nome: '', cor: '#10B981', icone: 'folder' });
          }
        }}>
          <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Folder className="w-5 h-5 text-green-500" />
                {t('categories.manage')}
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                {t('categories.manageDescription')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Form para criar/editar categoria */}
              <div className="p-4 bg-zinc-800/50 rounded-lg space-y-3">
                <div>
                  <Label htmlFor="nome-categoria" className="text-zinc-300 text-sm">
                    {t('categories.name')}
                  </Label>
                  <Input
                    id="nome-categoria"
                    value={novaCategoria.nome}
                    onChange={(e) => setNovaCategoria({ ...novaCategoria, nome: e.target.value })}
                    placeholder={t('categories.namePlaceholder')}
                    className="bg-zinc-800 border-zinc-700 text-white mt-1"
                  />
                </div>

                <div>
                  <Label className="text-zinc-300 text-sm">{t('categories.color')}</Label>
                  <div className="flex gap-2 mt-1.5">
                    {CORES.map((cor) => (
                      <button
                        key={cor}
                        type="button"
                        onClick={() => setNovaCategoria({ ...novaCategoria, cor })}
                        className={`w-7 h-7 rounded-full transition-transform ${novaCategoria.cor === cor ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110' : 'hover:scale-105'
                          }`}
                        style={{ backgroundColor: cor }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  {categoriaEditando && (
                    <Button
                      variant="ghost"
                      onClick={cancelarEdicaoCategoria}
                      className="flex-1 text-zinc-400 hover:text-white"
                    >
                      {t('cancel')}
                    </Button>
                  )}
                  <Button
                    onClick={salvarCategoria}
                    disabled={!novaCategoria.nome.trim() || salvandoCategoria}
                    className={`${categoriaEditando ? 'flex-1' : 'w-full'} bg-green-600 hover:bg-green-700`}
                  >
                    {salvandoCategoria ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : categoriaEditando ? (
                      t('categories.update')
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-1" />
                        {t('categories.add')}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Lista de categorias existentes */}
              {categorias.length > 0 ? (
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs uppercase tracking-wide">
                    {t('categories.existing')} ({categorias.length})
                  </Label>
                  <div className="space-y-1">
                    {categorias.map((cat) => (
                      <div
                        key={cat.id}
                        className={`flex items-center justify-between p-3 rounded-lg transition-colors ${categoriaEditando?.id === cat.id ? 'bg-green-500/20 border border-green-500/50' : 'bg-zinc-800/50 hover:bg-zinc-800'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: cat.cor }}
                          />
                          <div>
                            <p className="text-sm font-medium text-white">{cat.nome}</p>
                            <p className="text-xs text-zinc-500">
                              {cat.totalHabitos || 0} {t('categories.habits')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => iniciarEdicaoCategoria(cat)}
                            className="p-1.5 text-zinc-500 hover:text-white transition-colors rounded"
                          >
                            <Settings2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => excluirCategoria(cat.id)}
                            disabled={excluindoCategoria}
                            className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors rounded disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-zinc-500">
                  <Tag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t('categories.empty')}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
