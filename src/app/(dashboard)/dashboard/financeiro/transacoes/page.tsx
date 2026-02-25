'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/dexie';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Calendar,
  Search,
  Filter,
  CreditCard,
  Wallet,
  Tag,
  MoreVertical,
  Edit,
  Trash2,
  ArrowUpDown,
} from 'lucide-react';
import { formatarMoeda } from '@/lib/financeiro-helper';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import NovaTransacaoModal from '@/components/financeiro/NovaTransacaoModal';

interface Transacao {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  tipo: 'RECEITA' | 'DESPESA';
  isFixa: boolean;
  isParcela: boolean;
  parcelaNumero?: number;
  parcelaTotais?: number;
  categoria?: {
    nome: string;
    cor: string;
    icone: string;
  };
  contaBancaria?: {
    nome: string;
  };
  cartao?: {
    nome: string;
  };
}

export default function TransacoesPage() {
  const transacoesData = useLiveQuery(() => db.transacoes.toArray(), []);
  const categoriasData = useLiveQuery(() => db.categorias.toArray(), []);
  const contasData = useLiveQuery(() => db.contasBancarias.toArray(), []);
  const cartoesData = useLiveQuery(() => db.cartoes.toArray(), []);

  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [menuAberto, setMenuAberto] = useState<string | null>(null);

  const transacoes: Transacao[] = (transacoesData || []).map(t => {
    const categoria = categoriasData?.find(c => c.id === t.categoriaId);
    const contaBancaria = contasData?.find(c => c.id === t.contaBancariaId);
    const cartao = cartoesData?.find(c => c.id === t.cartaoId);

    return {
      ...t,
      data: (t.data instanceof Date ? t.data : new Date(t.data)).toISOString(),
      categoria: categoria ? { nome: categoria.nome, cor: categoria.cor, icone: categoria.icone } : undefined,
      contaBancaria: contaBancaria ? { nome: contaBancaria.nome } : undefined,
      cartao: cartao ? { nome: cartao.nome } : undefined,
    };
  }).filter(t => filtroTipo === 'TODOS' || t.tipo === filtroTipo);

  const loading = transacoesData === undefined || categoriasData === undefined || contasData === undefined || cartoesData === undefined;

  const transacoesFiltradas = transacoes.filter((t) =>
    t.descricao.toLowerCase().includes(busca.toLowerCase())
  );

  const totalReceitas = transacoes
    .filter((t) => t.tipo === 'RECEITA')
    .reduce((acc, t) => acc + t.valor, 0);

  const totalDespesas = transacoes
    .filter((t) => t.tipo === 'DESPESA')
    .reduce((acc, t) => acc + t.valor, 0);

  const saldo = totalReceitas - totalDespesas;

  return (
    <div className="bg-zinc-950 p-4 lg:p-6 space-y-4 sm:space-y-6">
      <div className="relative mb-8">
        <div className="relative">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 via-teal-400 to-blue-400 bg-clip-text text-transparent">
                Transações
              </h1>
              <p className="text-zinc-400 mt-2">Gerencie suas receitas e despesas</p>
            </div>
            <Button
              onClick={() => setModalAberto(true)}
              className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white shadow-lg shadow-green-500/50 transition-all hover:shadow-xl hover:shadow-green-500/60"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nova Transação
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Receitas */}
            <Card className="relative overflow-hidden bg-zinc-900/50 border-zinc-800 hover:border-green-500/40 transition-all">
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-400">Receitas</span>
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-400">
                  {formatarMoeda(totalReceitas)}
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  {transacoes.filter((t) => t.tipo === 'RECEITA').length} transações
                </p>
              </div>
            </Card>

            {/* Despesas */}
            <Card className="relative overflow-hidden bg-zinc-900/50 border-zinc-800 hover:border-red-500/40 transition-all">
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-400">Despesas</span>
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-red-400">
                  {formatarMoeda(totalDespesas)}
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  {transacoes.filter((t) => t.tipo === 'DESPESA').length} transações
                </p>
              </div>
            </Card>

            {/* Saldo */}
            <Card className="relative overflow-hidden bg-zinc-900/50 border-zinc-800 hover:border-green-500/40 transition-all">
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-400">Saldo</span>
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <ArrowUpDown className="w-5 h-5 text-green-400" />
                  </div>
                </div>
                <div className={`text-3xl font-bold ${saldo >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatarMoeda(saldo)}
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Receitas - Despesas
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Busca */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <Input
            placeholder="Buscar transações..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10 bg-zinc-900/50 border-zinc-800 focus:border-green-500 transition-colors"
          />
        </div>

        {/* Filtros de Tipo */}
        <div className="flex gap-2">
          <Button
            variant={filtroTipo === 'TODOS' ? 'default' : 'default'}
            onClick={() => setFiltroTipo('TODOS')}
            className={filtroTipo === 'TODOS'
              ? 'bg-green-600 hover:bg-green-700'
              : 'border-zinc-800 hover:bg-zinc-800'
            }
          >
            Todas
          </Button>
          <Button
            variant={filtroTipo === 'RECEITA' ? 'default' : 'default'}
            onClick={() => setFiltroTipo('RECEITA')}
            className={filtroTipo === 'RECEITA'
              ? 'bg-green-600 hover:bg-green-700'
              : 'border-zinc-800 hover:bg-zinc-800'
            }
          >
            Receitas
          </Button>
          <Button
            variant={filtroTipo === 'DESPESA' ? 'default' : 'default'}
            onClick={() => setFiltroTipo('DESPESA')}
            className={filtroTipo === 'DESPESA'
              ? 'bg-red-600 hover:bg-red-700'
              : 'border-zinc-800 hover:bg-zinc-800'
            }
          >
            Despesas
          </Button>
        </div>
      </div>

      {/* Lista de Transações */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : transacoesFiltradas.length === 0 ? (
        <Card className="bg-zinc-900/50 border-zinc-800 p-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-full mb-4">
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Nenhuma transação encontrada
            </h3>
            <p className="text-zinc-400 mb-6">
              Comece criando sua primeira transação
            </p>
            <Button
              onClick={() => setModalAberto(true)}
              className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Transação
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {transacoesFiltradas.map((transacao) => (
            <Card
              key={transacao.id}
              className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all group hover:shadow-lg"
            >
              <div className="p-4 flex items-center gap-4">
                <div
                  className={`relative p-3 rounded-xl ${transacao.tipo === 'RECEITA'
                    ? 'bg-green-500/10'
                    : 'bg-red-500/10'
                    }`}
                >
                  {transacao.tipo === 'RECEITA' ? (
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-red-400" />
                  )}
                </div>

                {/* Informações */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white truncate">
                      {transacao.descricao}
                    </h3>
                    {transacao.isFixa && (
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                        Fixa
                      </span>
                    )}
                    {transacao.isParcela && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                        {transacao.parcelaNumero}/{transacao.parcelaTotais}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-zinc-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(transacao.data), "dd 'de' MMM", { locale: ptBR })}
                    </div>
                    {transacao.categoria && (
                      <div className="flex items-center gap-1">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: transacao.categoria.cor }}
                        />
                        {transacao.categoria.nome}
                      </div>
                    )}
                    {transacao.contaBancaria && (
                      <div className="flex items-center gap-1">
                        <Wallet className="w-3.5 h-3.5" />
                        {transacao.contaBancaria.nome}
                      </div>
                    )}
                    {transacao.cartao && (
                      <div className="flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5" />
                        {transacao.cartao.nome}
                      </div>
                    )}
                  </div>
                </div>

                {/* Valor */}
                <div className="text-right">
                  <div
                    className={`text-xl font-bold ${transacao.tipo === 'RECEITA' ? 'text-green-400' : 'text-red-400'
                      }`}
                  >
                    {transacao.tipo === 'RECEITA' ? '+' : '-'} {formatarMoeda(transacao.valor)}
                  </div>
                </div>

                {/* Menu de Ações */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setMenuAberto(menuAberto === transacao.id ? null : transacao.id)}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>

                  {menuAberto === transacao.id && (
                    <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-10">
                      <button className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2">
                        <Edit className="w-4 h-4" />
                        Editar
                      </button>
                      <button className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-zinc-800 flex items-center gap-2">
                        <Trash2 className="w-4 h-4" />
                        Excluir
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Nova Transação */}
      <NovaTransacaoModal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        onSucesso={() => {
          // Live query updates automatically
        }}
      />
    </div>
  );
}