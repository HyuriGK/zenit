'use client';

import { useEffect, useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, initCategoriasPadrao } from '@/lib/dexie';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, TrendingUp, TrendingDown, Target, Plus, Loader2, AlertCircle, ChevronDown, Calendar, ArrowUpRight, ArrowDownRight, CreditCard, Info, DollarSign, Activity, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatarMoeda } from '@/lib/financeiro-helper';
import NovaTransacaoModal from '@/components/financeiro/NovaTransacaoModal';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { format, subMonths, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';

interface DashboardData {
  mes: string;
  resumoMensal: {
    receitas: number;
    despesas: number;
    saldo: number;
    despesasFixas: number;
    despesasVariaveis: number;
    sobra: number;
    gastoCartao: number;
  };
  gastosPorCategoria: Array<{
    categoriaId: string;
    categoriaNome: string;
    cor: string;
    total: number;
    porcentagem: number;
  }>;
  receitasPorCategoria: Array<{
    categoriaId: string;
    categoriaNome: string;
    cor: string;
    total: number;
    porcentagem: number;
  }>;
  comparativo: {
    receitasPercent: number;
    despesasPercent: number;
  };
  saudeFinanceira: {
    score: number;
    status: string;
  };
  proximos7Dias: Array<any>;
  fluxoCaixa: Array<{
    dia: string;
    receita: number;
    despesa: number;
  }>;
  saldoContas: number;
  totalObjetivos: number;
  saldoLivre: number;
}

export default function FinanceiroDashboardPage() {
  // Buscar dados do Dexie
  const contasData = useLiveQuery(() => db.contasBancarias.toArray(), []);
  const transacoesData = useLiveQuery(() => db.transacoes.toArray(), []);
  const categoriasData = useLiveQuery(() => db.categorias.toArray(), []);
  const objetivosData = useLiveQuery(() => db.objetivosFinanceiros.toArray(), []);

  const [modalTransacaoAberto, setModalTransacaoAberto] = useState(false);
  const [indicadores, setIndicadores] = useState<{
    selic: string;
    ipca: string;
    usd: string;
    eur: string;
    loading: boolean;
  }>({
    selic: '...',
    ipca: '...',
    usd: '...',
    eur: '...',
    loading: true
  });

  useEffect(() => {
    initCategoriasPadrao();
  }, []);

  // Buscar Indicadores Econômicos (Brapi)
  useEffect(() => {
    const fetchIndicadores = async () => {
      try {
        const token = 'u6eKiojA48yU4cMkdLqT8V';

        // 1. Buscar Moedas
        const resMoedas = await fetch(`https://brapi.dev/api/quote/USDBRL=X,EURBRL=X?token=${token}`);
        const dataMoedas = await resMoedas.json();

        // 2. Buscar Índices (SELIC/IPCA)
        const resIndices = await fetch(`https://brapi.dev/api/v2/prime-rate?country=brazil&token=${token}`);
        const dataIndices = await resIndices.json();

        const usd = dataMoedas.results?.find((r: any) => r.symbol === 'USDBRL=X')?.regularMarketPrice;
        const eur = dataMoedas.results?.find((r: any) => r.symbol === 'EURBRL=X')?.regularMarketPrice;

        const selic = dataIndices['prime-rate']?.find((i: any) => i.name === 'Selic')?.value;
        const ipca = dataIndices['prime-rate']?.find((i: any) => i.name === 'IPCA')?.value;

        setIndicadores({
          usd: usd ? formatarMoeda(usd) : 'N/A',
          eur: eur ? formatarMoeda(eur) : 'N/A',
          selic: selic ? `${selic}%` : 'N/A',
          ipca: ipca ? `${ipca}%` : 'N/A',
          loading: false
        });
      } catch (error) {
        console.error('Erro ao buscar indicadores Brapi:', error);
        setIndicadores(prev => ({ ...prev, loading: false }));
      }
    };

    fetchIndicadores();
    // Atualizar a cada 1 hora
    const interval = setInterval(fetchIndicadores, 3600000);
    return () => clearInterval(interval);
  }, []);

  const dashboard: DashboardData | null = useMemo(() => {
    if (!contasData || !transacoesData || !categoriasData || !objetivosData) return null;

    const hoje = new Date();
    const inicioMes = startOfMonth(hoje);
    const fimMes = endOfMonth(hoje);

    const transacoesMes = transacoesData.filter(t => {
      const d = t.data instanceof Date ? t.data : new Date(t.data);
      return d >= inicioMes && d <= fimMes;
    });

    const inicioMesAnterior = startOfMonth(subMonths(hoje, 1));
    const fimMesAnterior = endOfMonth(subMonths(hoje, 1));
    const transacoesMesAnterior = transacoesData.filter(t => {
      const d = t.data instanceof Date ? t.data : new Date(t.data);
      return d >= inicioMesAnterior && d <= fimMesAnterior;
    });

    let receitas = 0;
    let despesas = 0;
    let despesasFixas = 0;
    let despesasVariaveis = 0;
    let gastoCartao = 0;

    let receitasAnterior = 0;
    let despesasAnterior = 0;

    const gastosPorCatMap: Record<string, number> = {};
    const receitasPorCatMap: Record<string, number> = {};

    transacoesMes.forEach(t => {
      const valor = Number(t.valor);
      if (t.tipo === 'RECEITA') {
        receitas += valor;
        if (t.categoriaId) {
          receitasPorCatMap[t.categoriaId] = (receitasPorCatMap[t.categoriaId] || 0) + valor;
        }
      } else {
        despesas += valor;
        if (t.isFixa) despesasFixas += valor;
        else despesasVariaveis += valor;
        if (t.cartaoId) gastoCartao += valor;

        if (t.categoriaId) {
          gastosPorCatMap[t.categoriaId] = (gastosPorCatMap[t.categoriaId] || 0) + valor;
        }
      }
    });

    transacoesMesAnterior.forEach(t => {
      if (t.tipo === 'RECEITA') receitasAnterior += Number(t.valor);
      else despesasAnterior += Number(t.valor);
    });

    const calcDiff = (atual: number, anterior: number) => {
      if (anterior === 0) return atual > 0 ? 100 : 0;
      return ((atual - anterior) / anterior) * 100;
    };

    const percentSobra = receitas > 0 ? ((receitas - despesas) / receitas) * 100 : 0;
    const score = Math.max(0, Math.min(100, Math.round(percentSobra * 2)));
    let statusSaude = 'EXCELENTE';
    if (score < 30) statusSaude = 'CRITICA';
    else if (score < 60) statusSaude = 'ALERTA';

    const em7Dias = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);
    const proximas = transacoesData.filter(t => {
      const d = t.data instanceof Date ? t.data : new Date(t.data);
      return d > hoje && d <= em7Dias && t.tipo === 'DESPESA' && !t.paga;
    }).sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

    const diasMes = fimMes.getDate();
    const fluxoCaixa = Array.from({ length: diasMes }, (_, i) => {
      const dia = i + 1;
      let rDia = 0;
      let dDia = 0;
      transacoesMes.forEach(t => {
        if (new Date(t.data).getDate() === dia) {
          if (t.tipo === 'RECEITA') rDia += Number(t.valor);
          else dDia += Number(t.valor);
        }
      });
      return { dia: String(dia), receita: rDia, despesa: dDia };
    });

    const parseCategorias = (map: Record<string, number>, totalBase: number) => {
      return Object.keys(map).map(catId => {
        const cat = categoriasData.find(c => c.id === catId);
        const total = map[catId];
        return {
          categoriaId: catId,
          categoriaNome: cat?.nome || 'Outros',
          cor: cat?.cor || '#6B7280',
          total,
          porcentagem: totalBase > 0 ? (total / totalBase) * 100 : 0
        };
      }).sort((a, b) => b.total - a.total);
    };

    return {
      mes: format(hoje, 'MMMM yyyy', { locale: ptBR }),
      resumoMensal: {
        receitas,
        despesas,
        saldo: receitas - despesas,
        despesasFixas,
        despesasVariaveis,
        sobra: receitas - despesasFixas,
        gastoCartao
      },
      gastosPorCategoria: parseCategorias(gastosPorCatMap, despesas),
      receitasPorCategoria: parseCategorias(receitasPorCatMap, receitas),
      comparativo: {
        receitasPercent: calcDiff(receitas, receitasAnterior),
        despesasPercent: calcDiff(despesas, despesasAnterior)
      },
      saudeFinanceira: { score, status: statusSaude },
      proximos7Dias: proximas,
      fluxoCaixa,
      totalObjetivos: objetivosData.reduce((acc, o) => acc + Number(o.valorAtual), 0),
      saldoContas: receitas - despesas,
      saldoLivre: (receitas - despesas) - objetivosData.reduce((acc, o) => acc + Number(o.valorAtual), 0)
    };
  }, [contasData, transacoesData, categoriasData, objetivosData]);

  const loading = !dashboard;

  if (loading) {
    return (
      <LoadingScreen message="Carregando módulo financeiro..." />
    );
  }

  return (
    <div className="flex flex-col space-y-6 p-4 lg:p-6 overflow-hidden">
      {/* Header */}
      <PageHeader 
        title="Painel Financeiro"
        description={`Acompanhe seu desempenho em ${dashboard.mes}`}
        action={
          <Button
            asChild
            variant="outline"
            className="rounded-xl font-bold uppercase tracking-widest text-[10px]"
          >
            <Link href="/dashboard/financeiro/transacoes">
              <List className="w-4 h-4 mr-2" />
              Registros
            </Link>
          </Button>
        }
      />

      {/* KPIs Minimalistas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="border border-zinc-800/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-500/50" />
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500">Receitas</span>
            </div>
            <div className="text-3xl font-bold text-emerald-500 leading-none">{formatarMoeda(dashboard.resumoMensal.receitas)}</div>
          </CardContent>
        </Card>

        <Card className="border border-zinc-800/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-500/50" />
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500">Despesas</span>
            </div>
            <div className="text-3xl font-bold text-red-500 leading-none">{formatarMoeda(dashboard.resumoMensal.despesas)}</div>
          </CardContent>
        </Card>

        <Card className="border border-zinc-800/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-zinc-500" />
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500">Saldo Mensal</span>
            </div>
            <div className="text-3xl font-bold text-white leading-none">{formatarMoeda(dashboard.resumoMensal.saldo)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Row 1: Gastos e Receitas por Categoria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-zinc-800/50 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b border-zinc-800/50">
            <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Gastos por Categoria</CardTitle>
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-lg text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
              Top 5 <ChevronDown className="w-3 h-3" />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {dashboard.gastosPorCategoria.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-600 italic text-sm">
                Nenhum gasto este mês.
              </div>
            ) : (
              <div className="space-y-4">
                {dashboard.gastosPorCategoria.slice(0, 5).map((cat) => (
                  <div key={cat.categoriaId} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-tight">
                      <span className="text-zinc-400">{cat.categoriaNome}</span>
                      <span className="text-white">{formatarMoeda(cat.total)}</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full transition-all" style={{ width: `${cat.porcentagem}%`, backgroundColor: cat.cor }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-zinc-800/50 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b border-zinc-800/50">
            <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Receitas por Categoria</CardTitle>
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-lg text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
              Top 5 <ChevronDown className="w-3 h-3" />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {dashboard.receitasPorCategoria.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-600 italic text-sm">
                Nenhuma receita este mês.
              </div>
            ) : (
              <div className="space-y-4">
                {dashboard.receitasPorCategoria.slice(0, 5).map((cat) => (
                  <div key={cat.categoriaId} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-tight">
                      <span className="text-zinc-400">{cat.categoriaNome}</span>
                      <span className="text-white">{formatarMoeda(cat.total)}</span>
                    </div>
                    <div className="h-2 bg-green-500/10 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 transition-all" style={{ width: `${cat.porcentagem}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Balanço e Meus Cartões */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="py-4 px-6 border-b border-zinc-800/50">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Balanço</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center justify-between p-4 bg-zinc-900/40 border border-zinc-800/50 rounded-xl">
              <div className="flex items-center gap-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                <TrendingUp className="w-4 h-4" /> RECEITA
              </div>
              <div className="text-sm font-black text-emerald-500">{formatarMoeda(dashboard.resumoMensal.receitas)}</div>
            </div>
            <div className="flex items-center justify-between p-4 bg-zinc-900/40 border border-zinc-800/50 rounded-xl">
              <div className="flex items-center gap-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                <TrendingDown className="w-4 h-4" /> DESPESAS
              </div>
              <div className="text-sm font-black text-red-500">{formatarMoeda(dashboard.resumoMensal.despesas)}</div>
            </div>
            <div className="flex items-center justify-between p-4 bg-zinc-900/40 border border-zinc-800/50 rounded-xl">
              <div className="flex items-center gap-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                <CreditCard className="w-4 h-4" /> CARTÃO
              </div>
              <div className="text-sm font-black text-zinc-100">{formatarMoeda(dashboard.resumoMensal.gastoCartao)}</div>
            </div>
            <div className="flex items-center justify-between p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl mt-6">
              <div className="flex items-center gap-3 text-[11px] font-black text-emerald-500 uppercase tracking-[0.2em]">
                = BALANÇO FINAL
              </div>
              <div className="text-lg font-black text-emerald-500">{formatarMoeda(dashboard.resumoMensal.saldo)}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-4 px-6 border-b border-zinc-800/50">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Meus Cartões</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {dashboard.resumoMensal.gastoCartao === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-600 font-bold uppercase tracking-widest text-[10px]">
                Nenhum cartão com movimentação.
              </div>
            ) : (
              <div className="flex items-center gap-4 p-5 bg-zinc-900/40 rounded-2xl border border-zinc-800/50">
                <div className="w-12 h-12 bg-zinc-800 border border-zinc-700/50 rounded-xl flex items-center justify-center shadow-lg">
                  <CreditCard className="w-6 h-6 text-zinc-400" />
                </div>
                <div>
                  <div className="text-sm font-black text-white uppercase tracking-tight">Cartão Principal</div>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Gasto Atual: <span className="text-zinc-300 ml-1">{formatarMoeda(dashboard.resumoMensal.gastoCartao)}</span></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Saúde, Próximos 7 Dias e Comparativo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Saúde Financeira */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2 text-[10px] font-black text-zinc-100 uppercase tracking-[0.2em]">
              <Activity className="w-4 h-4 text-emerald-500" /> Saúde Financeira
            </div>
            <Info className="w-4 h-4 text-zinc-700" />
          </div>
          <div className="flex items-center gap-8">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-zinc-800/50" />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={`${2.5 * dashboard.saudeFinanceira.score} 251`}
                  className={dashboard.saudeFinanceira.status === 'EXCELENTE' ? 'text-emerald-500' : 'text-red-500'}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-black text-white leading-none">{dashboard.saudeFinanceira.score}</span>
                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mt-1">Score</span>
              </div>
            </div>
            <div>
              <div className={`text-xl font-black uppercase tracking-tighter ${dashboard.saudeFinanceira.status === 'EXCELENTE' ? 'text-emerald-500' : 'text-red-500'}`}>
                {dashboard.saudeFinanceira.status}
              </div>
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest leading-relaxed mt-2 max-w-[120px]">
                Seu índice de sobra mensal.
              </p>
            </div>
          </div>
        </Card>

        {/* Próximos 7 Dias */}
        <Card className="p-6 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2 text-[10px] font-black text-zinc-100 uppercase tracking-[0.2em] self-start mb-auto">
            <Calendar className="w-4 h-4 text-zinc-500" /> Próximos 7 Dias
          </div>
          <div className="py-6">
            {dashboard.proximos7Dias.length === 0 ? (
              <>
                <div className="w-12 h-12 rounded-2xl bg-zinc-800/50 border border-zinc-700/30 flex items-center justify-center mb-4 mx-auto">
                  <Plus className="w-6 h-6 text-zinc-600 rotate-45" />
                </div>
                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest max-w-[200px] leading-relaxed">
                  Tudo em dia! Sem pendências próximas.
                </p>
              </>
            ) : (
              <div className="space-y-3 text-left">
                {dashboard.proximos7Dias.slice(0, 2).map((t, idx) => (
                  <div key={idx} className="flex justify-between gap-6 text-[10px] font-black uppercase tracking-widest border-l-2 border-red-500 pl-3">
                    <span className="text-zinc-500 truncate max-w-[120px]">{t.descricao}</span>
                    <span className="text-zinc-100">{formatarMoeda(t.valor)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button variant="link" className="text-emerald-500 text-[10px] font-black uppercase tracking-widest hover:no-underline mt-auto">
            Ver calendário &rsaquo;
          </Button>
        </Card>

        {/* Comparativo Mensal */}
        <Card className="p-6">
          <div className="flex items-center gap-2 text-[10px] font-black text-zinc-100 uppercase tracking-[0.2em] mb-8">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> Comparativo Mensal
          </div>
          <div className="grid grid-cols-2 divide-x divide-zinc-800">
            <div className="text-center px-2">
              <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-3">Receitas</div>
              <div className="text-2xl font-black text-white flex items-center justify-center gap-1 leading-none">
                {dashboard.comparativo.receitasPercent >= 0 ? '+' : ''}{dashboard.comparativo.receitasPercent.toFixed(1)}%
                <ArrowUpRight className={`w-5 h-5 ${dashboard.comparativo.receitasPercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
              </div>
              <div className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest mt-2">vs mês anterior</div>
            </div>
            <div className="text-center px-2">
              <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-3">Despesas</div>
              <div className="text-2xl font-black text-white flex items-center justify-center gap-1 leading-none">
                {dashboard.comparativo.despesasPercent >= 0 ? '+' : ''}{dashboard.comparativo.despesasPercent.toFixed(1)}%
                <ArrowDownRight className={`w-5 h-5 ${dashboard.comparativo.despesasPercent >= 0 ? 'text-red-500' : 'text-emerald-500'}`} />
              </div>
              <div className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest mt-2">vs mês anterior</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Row 4: Fluxo de Caixa Diário */}
      <Card>
        <CardHeader className="py-6 px-6 border-b border-zinc-800/50">
          <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Fluxo de Caixa Diário — {dashboard.mes}</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] p-6">
          {dashboard.resumoMensal.receitas === 0 && dashboard.resumoMensal.despesas === 0 ? (
            <div className="flex items-center justify-center h-full text-zinc-600 font-bold uppercase tracking-widest text-[10px]">
              Sem movimentações este mês.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboard.fluxoCaixa}>
                <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                <XAxis dataKey="dia" stroke="#3f3f46" fontSize={10} axisLine={false} tickLine={false} tick={{ fontWeight: 'bold' }} />
                <YAxis hide />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', fontSize: '10px', border: '1px solid rgba(255,255,255,0.05)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}
                />
                <Area type="monotone" dataKey="receita" stroke="#10b981" fill="#10b981" fillOpacity={0.05} strokeWidth={4} animationDuration={1000} />
                <Area type="monotone" dataKey="despesa" stroke="#ef4444" fill="#ef4444" fillOpacity={0.05} strokeWidth={4} animationDuration={1000} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Row 5: Indicadores Econômicos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center"><TrendingUp className="w-5 h-5 text-blue-500" /></div>
            <div>
              <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1 leading-none">Taxa Selic</div>
              <div className="text-lg font-black text-white leading-none">
                {indicadores.loading ? <Loader2 className="w-4 h-4 animate-spin text-zinc-700" /> : indicadores.selic}
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center"><TrendingDown className="w-5 h-5 text-emerald-500" /></div>
            <div>
              <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1 leading-none">IPCA</div>
              <div className="text-lg font-black text-white leading-none">
                {indicadores.loading ? <Loader2 className="w-4 h-4 animate-spin text-zinc-700" /> : indicadores.ipca}
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center"><DollarSign className="w-5 h-5 text-orange-500" /></div>
            <div>
              <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1 leading-none">Dólar (USD)</div>
              <div className="text-lg font-black text-white leading-none">
                {indicadores.loading ? <Loader2 className="w-4 h-4 animate-spin text-zinc-700" /> : indicadores.usd}
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center"><DollarSign className="w-5 h-5 text-purple-500" /></div>
            <div>
              <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1 leading-none">Euro (EUR)</div>
              <div className="text-lg font-black text-white leading-none">
                {indicadores.loading ? <Loader2 className="w-4 h-4 animate-spin text-zinc-700" /> : indicadores.eur}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Modal de Nova Transação */}
      <NovaTransacaoModal
        aberto={modalTransacaoAberto}
        onFechar={() => setModalTransacaoAberto(false)}
        onSucesso={() => { }}
      />
    </div >
  );
}