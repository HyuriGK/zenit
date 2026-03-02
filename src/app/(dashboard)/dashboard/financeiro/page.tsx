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

    const saldoContas = contasData.reduce((acc, c) => acc + Number(c.saldoAtual), 0);
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
        saldo: receitas - despesas,
        despesasFixas,
        despesasVariaveis,
        sobra: receitas - despesasFixas
      },
      gastosPorCategoria: gastosPorCategoriaInfo,
      saldoContas,
      totalObjetivos,
      saldoLivre: saldoContas - totalObjetivos, // simplification
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
        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 flex-shrink-0">
          {/* Saldo Total */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
              <CardTitle className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">
                Saldo Total
              </CardTitle>
              <Wallet className="w-3 h-3 text-green-500" />
            </CardHeader>
            <CardContent className="pb-3 px-3">
              <div className="text-lg font-bold text-white leading-none">
                {formatarMoeda(dashboard.saldoContas)}
              </div>
            </CardContent>
          </Card>

          {/* Receitas do Mês */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
              <CardTitle className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">
                Receitas
              </CardTitle>
              <TrendingUp className="w-3 h-3 text-green-500" />
            </CardHeader>
            <CardContent className="pb-3 px-3">
              <div className="text-lg font-bold text-green-500 leading-none">
                {formatarMoeda(dashboard.resumoMensal.receitas)}
              </div>
            </CardContent>
          </Card>

          {/* Despesas do Mês */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
              <CardTitle className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">
                Despesas
              </CardTitle>
              <TrendingDown className="w-3 h-3 text-red-500" />
            </CardHeader>
            <CardContent className="pb-3 px-3">
              <div className="text-lg font-bold text-red-500 leading-none">
                {formatarMoeda(dashboard.resumoMensal.despesas)}
              </div>
            </CardContent>
          </Card>

          {/* Sobra Mensal */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
              <CardTitle className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">
                Sobra
              </CardTitle>
              <Target className="w-3 h-3 text-green-500" />
            </CardHeader>
            <CardContent className="pb-3 px-3">
              <div className="text-lg font-bold text-white leading-none">
                {formatarMoeda(dashboard.resumoMensal.sobra)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grid Principal */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 min-h-0">
          {/* Gastos por Categoria */}
          <Card className="bg-zinc-900 border-zinc-800 flex flex-col min-h-0">
            <CardHeader className="py-3 px-4 flex-shrink-0">
              <CardTitle className="text-sm text-white">Gastos por Categoria</CardTitle>
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
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: cat.cor }}
                          />
                          <span className="text-xs text-zinc-300 truncate max-w-[120px]">
                            {cat.categoriaNome}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-white">
                          {formatarMoeda(cat.total)}
                        </span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full transition-all"
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
              <CardTitle className="text-sm text-white">Resumo Financeiro</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 text-xs scrollbar-thin scrollbar-thumb-zinc-800">
              <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                <span className="text-zinc-400">Receitas</span>
                <span className="text-green-500 font-medium">
                  {formatarMoeda(dashboard.resumoMensal.receitas)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                <span className="text-zinc-400">Despesas Fixas</span>
                <span className="text-red-500 font-medium">
                  {formatarMoeda(dashboard.resumoMensal.despesasFixas)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                <span className="text-zinc-400">Despesas Variáveis</span>
                <span className="text-red-500 font-medium">
                  {formatarMoeda(dashboard.resumoMensal.despesasVariaveis)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                <span className="text-zinc-400">Objetivos</span>
                <span className="text-blue-500 font-medium">
                  {formatarMoeda(dashboard.totalObjetivos)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-white font-semibold">Saldo Livre</span>
                <span className="text-base font-bold text-white">
                  {formatarMoeda(dashboard.saldoLivre)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Links Rápidos */}
        <div className="grid grid-cols-3 gap-2 flex-shrink-0 pb-2">
          <Button
            className="h-12 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 px-2"
            onClick={() => window.location.href = '/dashboard/financeiro/contas'}
          >
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-green-500" />
              <div className="text-[10px] text-zinc-300 font-medium">Contas</div>
            </div>
          </Button>

          <Button
            className="h-12 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 px-2"
            onClick={() => window.location.href = '/dashboard/financeiro/transacoes'}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <div className="text-[10px] text-zinc-300 font-medium">Transações</div>
            </div>
          </Button>

          <Button
            className="h-12 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 px-2"
            onClick={() => window.location.href = '/dashboard/financeiro/objetivos'}
          >
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-500" />
              <div className="text-[10px] text-zinc-300 font-medium">Objetivos</div>
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