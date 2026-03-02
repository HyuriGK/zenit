'use client';

import { useEffect, useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, initCategoriasPadrao } from '@/lib/dexie';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, TrendingUp, TrendingDown, Target, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatarMoeda } from '@/lib/financeiro-helper';
import NovaTransacaoModal from '@/components/financeiro/NovaTransacaoModal';

interface DashboardData {
  mes: string;
  resumoMensal: {
    receitas: number;
    despesas: number;
    saldo: number;
    despesasFixas: number;
    despesasVariaveis: number;
    sobra: number;
  };
  gastosPorCategoria: Array<{
    categoriaId: string;
    categoriaNome: string;
    cor: string;
    total: number;
    porcentagem: number;
  }>;
  saldoContas: number;
  totalObjetivos: number;
  saldoLivre: number;
  estatisticas: {
    totalContas: number;
    totalCategorias: number;
    totalObjetivosAtivos: number;
    totalTransacoesMes: number;
  };
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
    <div className="flex flex-col h-[calc(100vh-theme(spacing.20))] overflow-hidden space-y-2 p-3 lg:p-4">
      {/* Header */}
      <div className="flex-shrink-0 flex justify-between items-center mb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">Financeiro</h1>
          <p className="text-xs text-zinc-400">Visão geral das suas finanças</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setModalTransacaoAberto(true)}
            size="sm"
            className="bg-green-600 hover:bg-green-700 h-9"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Transação
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 space-y-3">
        {/* Cards de Resumo Minimalistas (Sem fundo/borda) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0 px-2 py-4">
          {/* Saldo Mensal */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Wallet className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-[12px] uppercase tracking-wider font-bold text-zinc-500">Saldo Mensal</span>
            </div>
            <div className="text-xl sm:text-3xl font-black text-white leading-none">
              {formatarMoeda(dashboard.resumoMensal.saldo)}
            </div>
          </div>

          {/* Receitas do Mês */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-green-500/50" />
              <span className="text-[12px] uppercase tracking-wider font-bold text-zinc-500">Receitas</span>
            </div>
            <div className="text-xl sm:text-3xl font-black text-green-500 leading-none">
              {formatarMoeda(dashboard.resumoMensal.receitas)}
            </div>
          </div>

          {/* Despesas do Mês */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-3.5 h-3.5 text-red-500/50" />
              <span className="text-[12px] uppercase tracking-wider font-bold text-zinc-500">Despesas</span>
            </div>
            <div className="text-xl sm:text-3xl font-black text-red-500 leading-none">
              {formatarMoeda(dashboard.resumoMensal.despesas)}
            </div>
          </div>

          {/* Sobra Mensal */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-[12px] uppercase tracking-wider font-bold text-zinc-500">Sobra</span>
            </div>
            <div className="text-xl sm:text-3xl font-black text-white leading-none">
              {formatarMoeda(dashboard.resumoMensal.sobra)}
            </div>
          </div>
        </div>

        {/* Grid Principal */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 min-h-0">
          {/* Gastos por Categoria */}
          <Card className="bg-zinc-900 border-zinc-800 flex flex-col min-h-0">
            <CardHeader className="py-3 px-4 flex-shrink-0">
              <CardTitle className="text-sm font-bold text-white uppercase tracking-tight">Gastos por Categoria</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-thin scrollbar-thumb-zinc-800">
              {dashboard.gastosPorCategoria.length === 0 ? (
                <div className="text-center py-4 text-zinc-500 text-xs">
                  Nenhuma despesa este mês
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboard.gastosPorCategoria.slice(0, 4).map((cat) => (
                    <div key={cat.categoriaId} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: cat.cor }}
                          />
                          <span className="text-[13px] text-zinc-300 truncate max-w-[150px] font-medium">
                            {cat.categoriaNome}
                          </span>
                        </div>
                        <span className="text-[13px] font-bold text-white">
                          {formatarMoeda(cat.total)}
                        </span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${cat.porcentagem}%`,
                            backgroundColor: cat.cor,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resumo Financeiro */}
          <Card className="bg-zinc-900 border-zinc-800 flex flex-col min-h-0">
            <CardHeader className="py-3 px-4 flex-shrink-0">
              <CardTitle className="text-sm font-bold text-white uppercase tracking-tight">Resumo Mensal</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 text-xs scrollbar-thin scrollbar-thumb-zinc-800">
              <div className="flex justify-between items-center py-2.5 border-b border-zinc-800/50">
                <span className="text-zinc-400 font-medium">Receitas</span>
                <span className="text-green-500 font-bold text-sm">
                  {formatarMoeda(dashboard.resumoMensal.receitas)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-zinc-800/50">
                <span className="text-zinc-400 font-medium">Despesas Fixas</span>
                <span className="text-red-500 font-bold text-sm">
                  {formatarMoeda(dashboard.resumoMensal.despesasFixas)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-zinc-800/50">
                <span className="text-zinc-400 font-medium">Despesas Variáveis</span>
                <span className="text-red-500 font-bold text-sm">
                  {formatarMoeda(dashboard.resumoMensal.despesasVariaveis)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-zinc-800/50">
                <span className="text-zinc-400 font-medium">Objetivos</span>
                <span className="text-blue-500 font-bold text-sm">
                  {formatarMoeda(dashboard.totalObjetivos)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-3">
                <span className="text-white font-bold uppercase text-[11px]">Saldo Disponível</span>
                <span className="text-xl font-black text-white">
                  {formatarMoeda(dashboard.saldoLivre)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Links Rápidos */}
        <div className="grid grid-cols-2 gap-2 flex-shrink-0 pb-2">
          <Button
            className="h-14 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 px-4 group transition-all hover:border-blue-500/50"
            onClick={() => window.location.href = '/dashboard/financeiro/transacoes'}
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
              <div className="text-sm text-zinc-300 font-bold uppercase tracking-tight">Minhas Transações</div>
            </div>
          </Button>

          <Button
            className="h-14 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 px-4 group transition-all hover:border-orange-500/50"
            onClick={() => window.location.href = '/dashboard/financeiro/objetivos'}
          >
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform" />
              <div className="text-sm text-zinc-300 font-bold uppercase tracking-tight">Meus Objetivos</div>
            </div>
          </Button>
        </div>

        {/* Modal de Nova Transação */}
        <NovaTransacaoModal
          aberto={modalTransacaoAberto}
          onFechar={() => setModalTransacaoAberto(false)}
          onSucesso={() => {
            // No manual reload needed, liveQuery updates automatically
          }}
        />
      </div>
    </div>
  );
}