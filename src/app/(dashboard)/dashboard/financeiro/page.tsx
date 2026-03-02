'use client';

import { useEffect, useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, initCategoriasPadrao } from '@/lib/dexie';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, TrendingUp, TrendingDown, Target, Plus, Loader2, AlertCircle, ChevronDown, Calendar, ArrowUpRight, ArrowDownRight, CreditCard, Info, DollarSign, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatarMoeda } from '@/lib/financeiro-helper';
import NovaTransacaoModal from '@/components/financeiro/NovaTransacaoModal';
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

  useEffect(() => {
    initCategoriasPadrao();
  }, []);

  const dashboard: DashboardData | null = useMemo(() => {
    if (!contasData || !transacoesData || !categoriasData || !objetivosData) return null;

    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);

    const transacoesMes = transacoesData.filter(t => {
      const d = t.data instanceof Date ? t.data : new Date(t.data);
      return d >= inicioMes && d <= fimMes;
    });

    let receitas = 0;
    let despesas = 0;
    let despesasFixas = 0;
    let despesasVariaveis = 0;

    const gastosPorCatMap: Record<string, number> = {};

    transacoesMes.forEach(t => {
      const valor = Number(t.valor);
      if (t.tipo === 'RECEITA') {
        receitas += valor;
      } else {
        despesas += valor;
        if (t.isFixa) despesasFixas += valor;
        else despesasVariaveis += valor;

        if (t.categoriaId) {
          gastosPorCatMap[t.categoriaId] = (gastosPorCatMap[t.categoriaId] || 0) + valor;
        }
      }
    });

    // Saldo do Mês (Receitas - Despesas)
    const saldoMensal = receitas - despesas;
    const totalObjetivos = objetivosData.reduce((acc, o) => acc + Number(o.valorAtual), 0);

    // Preparar array de gastos por categoria
    const gastosPorCategoriaInfo = Object.keys(gastosPorCatMap).map(catId => {
      const cat = categoriasData.find(c => c.id === catId);
      const total = gastosPorCatMap[catId];
      return {
        categoriaId: catId,
        categoriaNome: cat?.nome || 'Outros',
        cor: cat?.cor || '#6B7280',
        total,
        porcentagem: despesas > 0 ? (total / despesas) * 100 : 0
      };
    }).sort((a, b) => b.total - a.total);

    return {
      mes: `${hoje.getMonth() + 1}/${hoje.getFullYear()}`,
      resumoMensal: {
        receitas,
        despesas,
        saldo: saldoMensal,
        despesasFixas,
        despesasVariaveis,
        sobra: receitas - despesasFixas // Sobra após fixas
      },
      gastosPorCategoria: gastosPorCategoriaInfo,
      saldoContas: saldoMensal, // Agora reflete o saldo do mês
      totalObjetivos,
      saldoLivre: saldoMensal - totalObjetivos,
      estatisticas: {
        totalContas: contasData.length,
        totalCategorias: categoriasData.length,
        totalObjetivosAtivos: objetivosData.filter(o => o.status === 'EM_ANDAMENTO').length,
        totalTransacoesMes: transacoesMes.length
      }
    };
  }, [contasData, transacoesData, categoriasData, objetivosData]);

  const loading = !dashboard;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-zinc-400">Carregando módulo financeiro...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.20))] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 space-y-6 p-4 lg:p-6 bg-zinc-950">
      {/* Header */}
      <div className="flex-shrink-0 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Painel Financeiro</h1>
          <p className="text-sm text-zinc-500">Acompanhe seu desempenho em {dashboard.mes}</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setModalTransacaoAberto(true)}
            className="bg-blue-600 hover:bg-blue-700 font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Transação
          </Button>
        </div>
      </div>

      {/* KPIs Minimalistas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 px-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-zinc-500" />
            <span className="text-[12px] uppercase tracking-wider font-bold text-zinc-500">Saldo Mensal</span>
          </div>
          <div className="text-3xl font-black text-white">{formatarMoeda(dashboard.resumoMensal.saldo)}</div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500/50" />
            <span className="text-[12px] uppercase tracking-wider font-bold text-zinc-500">Receitas</span>
          </div>
          <div className="text-3xl font-black text-green-500">{formatarMoeda(dashboard.resumoMensal.receitas)}</div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-500/50" />
            <span className="text-[12px] uppercase tracking-wider font-bold text-zinc-500">Despesas</span>
          </div>
          <div className="text-3xl font-black text-red-500">{formatarMoeda(dashboard.resumoMensal.despesas)}</div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-zinc-500" />
            <span className="text-[12px] uppercase tracking-wider font-bold text-zinc-500">Sobra</span>
          </div>
          <div className="text-3xl font-black text-white">{formatarMoeda(dashboard.resumoMensal.sobra)}</div>
        </div>
      </div>

      {/* Row 1: Gastos e Receitas por Categoria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b border-zinc-800/50">
            <CardTitle className="text-base font-bold text-white">Gastos por Categoria</CardTitle>
            <div className="flex items-center gap-2 bg-zinc-800/50 px-2 py-1 rounded text-[11px] font-bold text-zinc-400">
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

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b border-zinc-800/50">
            <CardTitle className="text-base font-bold text-white">Receitas por Categoria</CardTitle>
            <div className="flex items-center gap-2 bg-zinc-800/50 px-2 py-1 rounded text-[11px] font-bold text-zinc-400">
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
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="py-4 px-6">
            <CardTitle className="text-base font-bold text-white">Balanço</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-3">
            <div className="flex items-center justify-between p-3 bg-zinc-950/50 rounded-lg">
              <div className="flex items-center gap-3 text-xs font-bold text-zinc-400">
                <TrendingUp className="w-4 h-4" /> RECEITA
              </div>
              <div className="text-sm font-black text-green-500">{formatarMoeda(dashboard.resumoMensal.receitas)}</div>
            </div>
            <div className="flex items-center justify-between p-3 bg-zinc-950/50 rounded-lg">
              <div className="flex items-center gap-3 text-xs font-bold text-zinc-400">
                <TrendingDown className="w-4 h-4" /> DESPESAS
              </div>
              <div className="text-sm font-black text-red-500">{formatarMoeda(dashboard.resumoMensal.despesas)}</div>
            </div>
            <div className="flex items-center justify-between p-3 bg-zinc-950/50 rounded-lg">
              <div className="flex items-center gap-3 text-xs font-bold text-zinc-400">
                <CreditCard className="w-4 h-4" /> CARTÃO
              </div>
              <div className="text-sm font-black text-white">{formatarMoeda(dashboard.resumoMensal.gastoCartao)}</div>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg mt-4">
              <div className="flex items-center gap-3 text-xs font-bold text-blue-400">
                = BALANÇO FINAL
              </div>
              <div className="text-base font-black text-blue-400">{formatarMoeda(dashboard.resumoMensal.saldo)}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="py-4 px-6 border-b border-zinc-800/50">
            <CardTitle className="text-base font-bold text-white">Meus Cartões</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {dashboard.resumoMensal.gastoCartao === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-600 italic text-sm">
                Nenhum cartão com movimentação.
              </div>
            ) : (
              <div className="flex items-center gap-4 p-4 bg-zinc-950/50 rounded-xl border border-zinc-800">
                <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-zinc-500" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white uppercase tracking-tight">Cartão Principal</div>
                  <div className="text-xs text-zinc-500">Gasto Atual: {formatarMoeda(dashboard.resumoMensal.gastoCartao)}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Saúde, Próximos 7 Dias e Comparativo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Saúde Financeira */}
        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Activity className="w-4 h-4 text-blue-500" /> Saúde Financeira
            </div>
            <Info className="w-4 h-4 text-zinc-600" />
          </div>
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-zinc-800" />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={`${2.5 * dashboard.saudeFinanceira.score} 251`}
                  className={dashboard.saudeFinanceira.status === 'EXCELENTE' ? 'text-green-500' : 'text-red-500'}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-black text-white">{dashboard.saudeFinanceira.score}</span>
                <span className="text-[8px] font-bold text-zinc-500 uppercase">Score</span>
              </div>
            </div>
            <div>
              <div className={`text-lg font-black uppercase tracking-tighter ${dashboard.saudeFinanceira.status === 'EXCELENTE' ? 'text-green-500' : 'text-red-500'}`}>
                {dashboard.saudeFinanceira.status}
              </div>
              <p className="text-[10px] text-zinc-500 leading-tight mt-1">
                Seu índice de sobra mensal em relação aos ganhos.
              </p>
            </div>
          </div>
        </Card>

        {/* Próximos 7 Dias */}
        <Card className="bg-zinc-900 border-zinc-800 p-6 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2 text-sm font-bold text-white self-start mb-auto">
            <Calendar className="w-4 h-4 text-zinc-400" /> Próximos 7 Dias
          </div>
          <div className="py-4">
            {dashboard.proximos7Dias.length === 0 ? (
              <>
                <div className="w-10 h-10 rounded-full border-2 border-zinc-700 flex items-center justify-center mb-3 mx-auto">
                  <Plus className="w-5 h-5 text-zinc-600 rotate-45" />
                </div>
                <p className="text-xs text-zinc-500 font-bold max-w-[180px]">
                  Tudo em dia! Nenhuma conta vencendo nos próximos 7 dias.
                </p>
              </>
            ) : (
              <div className="space-y-2 text-left">
                {dashboard.proximos7Dias.slice(0, 2).map((t, idx) => (
                  <div key={idx} className="flex justify-between gap-4 text-xs font-bold border-l-2 border-red-500 pl-2">
                    <span className="text-zinc-400 truncate max-w-[100px]">{t.descricao}</span>
                    <span className="text-white">{formatarMoeda(t.valor)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button variant="link" className="text-blue-500 text-xs font-bold hover:no-underline mt-auto">
            Ver calendário &rsaquo;
          </Button>
        </Card>

        {/* Comparativo Mensal */}
        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <div className="flex items-center gap-2 text-sm font-bold text-white mb-8">
            <TrendingUp className="w-4 h-4 text-green-500" /> Comparativo Mensal
          </div>
          <div className="grid grid-cols-2 divide-x divide-zinc-800">
            <div className="text-center px-2">
              <div className="text-[10px] font-bold text-zinc-500 uppercase mb-2">Receitas</div>
              <div className="text-lg font-black text-white flex items-center justify-center gap-1">
                {dashboard.comparativo.receitasPercent >= 0 ? '+' : ''}{dashboard.comparativo.receitasPercent.toFixed(1)}%
                <ArrowUpRight className={`w-4 h-4 ${dashboard.comparativo.receitasPercent >= 0 ? 'text-green-500' : 'text-red-500'}`} />
              </div>
              <div className="text-[10px] text-zinc-600">vs mês anterior</div>
            </div>
            <div className="text-center px-2">
              <div className="text-[10px] font-bold text-zinc-500 uppercase mb-2">Despesas</div>
              <div className="text-lg font-black text-white flex items-center justify-center gap-1">
                {dashboard.comparativo.despesasPercent >= 0 ? '+' : ''}{dashboard.comparativo.despesasPercent.toFixed(1)}%
                <ArrowDownRight className={`w-4 h-4 ${dashboard.comparativo.despesasPercent >= 0 ? 'text-red-500' : 'text-green-500'}`} />
              </div>
              <div className="text-[10px] text-zinc-600">vs mês anterior</div>
            </div>
          </div>
          <div className="mt-6 p-2 bg-zinc-950/50 rounded flex items-center gap-2 text-[10px] text-zinc-500 border border-zinc-800/50">
            <Info className="w-3 h-3" /> Considerando despesas fixas e cartão.
          </div>
        </Card>
      </div>

      {/* Row 4: Fluxo de Caixa Diário */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="py-4 px-6 border-b border-zinc-800/50">
          <CardTitle className="text-base font-bold text-white">Fluxo de Caixa Diário - {dashboard.mes}</CardTitle>
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-1">Receitas e Despesas por dia de vencimento</p>
        </CardHeader>
        <CardContent className="h-[300px] p-6">
          {dashboard.resumoMensal.receitas === 0 && dashboard.resumoMensal.despesas === 0 ? (
            <div className="flex items-center justify-center h-full text-zinc-600 italic text-sm">
              Sem movimentações este mês.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboard.fluxoCaixa}>
                <defs>
                  <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="dia" stroke="#71717a" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis hide />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', fontSize: '10px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="receita" stroke="#22c55e" fillOpacity={1} fill="url(#colorReceita)" strokeWidth={3} />
                <Area type="monotone" dataKey="despesa" stroke="#ef4444" fillOpacity={1} fill="url(#colorDespesa)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Row 5: Indicadores Econômicos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg"><TrendingUp className="w-4 h-4 text-blue-500" /></div>
            <div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase leading-none mb-1">Taxa Selic</div>
              <div className="text-base font-black text-white">10.75%</div>
              <div className="text-[10px] text-zinc-600">Meta Atual</div>
            </div>
          </div>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg"><TrendingDown className="w-4 h-4 text-green-500" /></div>
            <div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase leading-none mb-1">IPCA (Inflação)</div>
              <div className="text-base font-black text-white">4.44%</div>
              <div className="text-[10px] text-zinc-600">Acumulado</div>
            </div>
          </div>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg"><DollarSign className="w-4 h-4 text-orange-500" /></div>
            <div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase leading-none mb-1">Dólar (USD)</div>
              <div className="text-base font-black text-white">R$ 5.13</div>
              <div className="text-[10px] text-zinc-600">Comercial</div>
            </div>
          </div>
      </div>
      <Card className="bg-zinc-900 border-zinc-800 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg"><DollarSign className="w-4 h-4 text-purple-500" /></div>
          <div>
            <div className="text-[10px] font-bold text-zinc-500 uppercase leading-none mb-1">Euro (EUR)</div>
            <div className="text-base font-black text-white">R$ 6.04</div>
            <div className="text-[10px] text-zinc-600">Comercial</div>
          </div>
        </div>
      </Card>
    </div>

      {/* Modal de Nova Transação */ }
  <NovaTransacaoModal
    aberto={modalTransacaoAberto}
    onFechar={() => setModalTransacaoAberto(false)}
    onSucesso={() => { }}
  />
    </div >
  );
}