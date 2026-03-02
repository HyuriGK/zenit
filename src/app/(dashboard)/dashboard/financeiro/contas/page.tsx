'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/dexie';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Wallet,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Building2,
  Eye,
  EyeOff,
  MoreVertical,
  Edit,
  Trash2,
  Archive,
  ArrowLeft,
} from 'lucide-react';
import { formatarMoeda } from '@/lib/financeiro-helper';
import NovaContaModal from '@/components/financeiro/NovaContaModal';
import NovoCartaoModal from '@/components/financeiro/NovoCartaoModal';

interface ContaBancaria {
  id: string;
  nome: string;
  tipo: 'CORRENTE' | 'POUPANCA' | 'INVESTIMENTO';
  banco?: string;
  saldoAtual: number;
  cor: string;
  icone: string;
  ativa: boolean;
}

interface LocalCartao {
  id: string;
  nome: string;
  bandeira?: string;
  ultimosDigitos?: string;
  limite?: number;
  diaVencimento?: number;
  diaFechamento?: number;
  cor: string;
  ativo: boolean;
}

export default function ContasPage() {
  const contasData = useLiveQuery(() => db.contasBancarias.toArray(), []);
  const cartoesData = useLiveQuery(() => db.cartoes.toArray(), []);

  const contas = contasData || [];
  const cartoes: LocalCartao[] = (cartoesData || []).map(c => ({
    ...c,
    limite: Number(c.limite || 0),
    diaVencimento: Number(c.diaVencimento || 0),
    diaFechamento: Number(c.diaFechamento || 0)
  }));
  const loading = contasData === undefined || cartoesData === undefined;

  const [ocultarSaldos, setOcultarSaldos] = useState(false);
  const [menuAberto, setMenuAberto] = useState<string | null>(null);
  const [modalContaAberto, setModalContaAberto] = useState(false);
  const [modalCartaoAberto, setModalCartaoAberto] = useState(false);

  const contasAtivas = contas.filter((c) => c.ativa);
  const cartoesAtivos = cartoes.filter((c) => c.ativo);

  const saldoTotal = contasAtivas.reduce((acc, conta) => acc + conta.saldoAtual, 0);

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      CORRENTE: 'Conta Corrente',
      POUPANCA: 'Poupança',
      INVESTIMENTO: 'Investimento',
    };
    return labels[tipo] || tipo;
  };

  return (
    <div className="bg-zinc-950 p-4 lg:p-6 space-y-4 sm:space-y-6">
      <div className="relative mb-8">
        <div className="relative">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all"
                  onClick={() => window.location.href = '/dashboard/financeiro'}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  Contas e Cartões
                </h1>
              </div>
              <p className="text-zinc-400 mt-2">Gerencie seus recursos financeiros</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="default"
                className="border-zinc-800 hover:bg-zinc-800"
                onClick={() => setOcultarSaldos(!ocultarSaldos)}
              >
                {ocultarSaldos ? (
                  <Eye className="w-4 h-4 mr-2" />
                ) : (
                  <EyeOff className="w-4 h-4 mr-2" />
                )}
                {ocultarSaldos ? 'Mostrar' : 'Ocultar'}
              </Button>
              <Button
                onClick={() => setModalContaAberto(true)}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg transition-all hover:scale-105"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Adicionar
              </Button>
            </div>
          </div>

          {/* Card de Saldo Total */}
          <Card className="relative overflow-hidden bg-zinc-900/50 border-zinc-800 hover:border-green-500/40 transition-all mb-6">
            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-green-500/10 rounded-xl">
                    <Wallet className="w-8 h-8 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400 mb-1">Saldo Total em Contas</p>
                    <div className="text-4xl font-bold text-white">
                      {ocultarSaldos ? '••••••' : formatarMoeda(saldoTotal)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-zinc-400 mb-2">Resumo</p>
                  <div className="flex gap-4">
                    <div>
                      <p className="text-xs text-zinc-500">Contas</p>
                      <p className="text-lg font-semibold text-green-400">{contasAtivas.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Cartões</p>
                      <p className="text-lg font-semibold text-blue-400">{cartoesAtivos.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Seção de Contas Bancárias */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Wallet className="w-6 h-6 text-green-400" />
                Contas Bancárias
              </h2>
              <Button
                onClick={() => setModalContaAberto(true)}
                variant="default"
                className="border-zinc-800 hover:bg-zinc-800"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Conta
              </Button>
            </div>

            {contasAtivas.length === 0 ? (
              <Card className="bg-zinc-900/50 border-zinc-800 p-12">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-full mb-4">
                    <Wallet className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Nenhuma conta cadastrada
                  </h3>
                  <p className="text-zinc-400 mb-6">
                    Adicione suas contas bancárias para começar
                  </p>
                  <Button
                    onClick={() => setModalContaAberto(true)}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Conta
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contasAtivas.map((conta) => (
                  <Card
                    key={conta.id}
                    className="relative overflow-hidden bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all group"
                  >
                    {/* Barra colorida no topo */}
                    <div
                      className="absolute top-0 left-0 right-0 h-1"
                      style={{ backgroundColor: conta.cor }}
                    />

                    <div className="relative p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="p-3 rounded-xl"
                            style={{ backgroundColor: `${conta.cor}10` }}
                          >
                            <Wallet className="w-6 h-6" style={{ color: conta.cor }} />
                          </div>
                          <div>
                            <h3 className="font-bold text-white">{conta.nome}</h3>
                            <p className="text-xs text-zinc-500">{getTipoLabel(conta.tipo)}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setMenuAberto(menuAberto === conta.id ? null : conta.id)}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Banco */}
                      {conta.banco && (
                        <div className="flex items-center gap-2 text-sm text-zinc-400 mb-4">
                          <Building2 className="w-4 h-4" />
                          {conta.banco}
                        </div>
                      )}

                      {/* Saldo */}
                      <div className="pt-4 border-t border-zinc-800">
                        <p className="text-xs text-zinc-500 mb-1">Saldo Atual</p>
                        <div className="text-2xl font-bold text-white">
                          {ocultarSaldos ? '••••••' : formatarMoeda(conta.saldoAtual)}
                        </div>
                      </div>

                      {/* Indicador de variação */}
                      <div className="mt-3 flex items-center gap-1 text-sm">
                        {conta.saldoAtual >= 0 ? (
                          <>
                            <TrendingUp className="w-4 h-4 text-green-400" />
                            <span className="text-green-400">Positivo</span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="w-4 h-4 text-red-400" />
                            <span className="text-red-400">Negativo</span>
                          </>
                        )}
                      </div>

                      {/* Menu */}
                      {menuAberto === conta.id && (
                        <div className="absolute right-4 top-16 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-10">
                          <button className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2">
                            <Edit className="w-4 h-4" />
                            Editar
                          </button>
                          <button className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2">
                            <Archive className="w-4 h-4" />
                            Arquivar
                          </button>
                          <button className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-zinc-800 flex items-center gap-2">
                            <Trash2 className="w-4 h-4" />
                            Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Seção de Cartões */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-blue-400" />
                Cartões de Crédito
              </h2>
              <Button
                onClick={() => setModalCartaoAberto(true)}
                variant="default"
                className="border-zinc-800 hover:bg-zinc-800"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Cartão
              </Button>
            </div>

            {cartoesAtivos.length === 0 ? (
              <Card className="bg-zinc-900/50 border-zinc-800 p-12">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/10 rounded-full mb-4">
                    <CreditCard className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Nenhum cartão cadastrado
                  </h3>
                  <p className="text-zinc-400 mb-6">
                    Adicione seus cartões de crédito para controlar gastos
                  </p>
                  <Button
                    onClick={() => setModalCartaoAberto(true)}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Cartão
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cartoesAtivos.map((cartao) => (
                  <Card
                    key={cartao.id}
                    className="relative overflow-hidden bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all group"
                  >
                    {/* Barra colorida no topo */}
                    <div
                      className="absolute top-0 left-0 right-0 h-1"
                      style={{ backgroundColor: cartao.cor }}
                    />

                    <div className="relative p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="p-3 rounded-xl"
                            style={{ backgroundColor: `${cartao.cor}10` }}
                          >
                            <CreditCard className="w-6 h-6" style={{ color: cartao.cor }} />
                          </div>
                          <div>
                            <h3 className="font-bold text-white">{cartao.nome}</h3>
                            {cartao.bandeira && (
                              <p className="text-xs text-zinc-500">{cartao.bandeira}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setMenuAberto(menuAberto === cartao.id ? null : cartao.id)}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Número do cartão */}
                      {cartao.ultimosDigitos && (
                        <div className="mb-4">
                          <p className="text-sm text-zinc-400">
                            •••• •••• •••• {cartao.ultimosDigitos}
                          </p>
                        </div>
                      )}

                      {/* Limite */}
                      {cartao.limite && (
                        <div className="pt-4 border-t border-zinc-800 mb-3">
                          <p className="text-xs text-zinc-500 mb-1">Limite</p>
                          <div className="text-xl font-bold text-white">
                            {ocultarSaldos ? '••••••' : formatarMoeda(cartao.limite)}
                          </div>
                        </div>
                      )}

                      {/* Datas */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {cartao.diaVencimento && (
                          <div>
                            <p className="text-xs text-zinc-500">Vencimento</p>
                            <p className="text-zinc-300 font-medium">Dia {cartao.diaVencimento}</p>
                          </div>
                        )}
                        {cartao.diaFechamento && (
                          <div>
                            <p className="text-xs text-zinc-500">Fechamento</p>
                            <p className="text-zinc-300 font-medium">Dia {cartao.diaFechamento}</p>
                          </div>
                        )}
                      </div>

                      {/* Menu */}
                      {menuAberto === cartao.id && (
                        <div className="absolute right-4 top-16 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-10">
                          <button className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2">
                            <Edit className="w-4 h-4" />
                            Editar
                          </button>
                          <button className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2">
                            <Archive className="w-4 h-4" />
                            Desativar
                          </button>
                          <button className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-zinc-800 flex items-center gap-2">
                            <Trash2 className="w-4 h-4" />
                            Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modais */}
      <NovaContaModal
        aberto={modalContaAberto}
        onFechar={() => setModalContaAberto(false)}
        onSucesso={() => {
          // Live query updates automatically
        }}
      />

      <NovoCartaoModal
        aberto={modalCartaoAberto}
        onFechar={() => setModalCartaoAberto(false)}
        onSucesso={() => {
          // Live query updates automatically
        }}
      />
    </div>
  );
}