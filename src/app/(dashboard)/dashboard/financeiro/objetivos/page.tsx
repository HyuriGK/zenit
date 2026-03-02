'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/dexie';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Plus,
  Target,
  TrendingUp,
  Calendar,
  DollarSign,
  CheckCircle2,
  Sparkles,
  Zap,
  Shield,
  ArrowLeft,
} from 'lucide-react';
import { formatarMoeda } from '@/lib/financeiro-helper';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import NovoObjetivoModal from '@/components/financeiro/NovoObjetivoModal';
import ContribuirObjetivoModal from '@/components/financeiro/ContribuirObjetivoModal';

interface Objetivo {
  id: string;
  nome: string;
  descricao?: string;
  valorMeta: number;
  valorAtual: number;
  dataInicio: string;
  dataMeta?: string;
  isReservaEmergencia: boolean;
  cor: string;
  icone: string;
  status: 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';
  porcentagemAtingida: number;
  falta: number;
}

export default function ObjetivosPage() {
  const objetivosData = useLiveQuery(() => db.objetivosFinanceiros.toArray(), []);

  const objetivos: Objetivo[] = (objetivosData || []).map(o => {
    const valorAtual = Number(o.valorAtual);
    const valorMeta = Number(o.valorMeta);
    return {
      ...o,
      dataInicio: (o.dataInicio instanceof Date ? o.dataInicio : new Date(o.dataInicio)).toISOString(),
      dataMeta: o.dataMeta ? (o.dataMeta instanceof Date ? o.dataMeta : new Date(o.dataMeta)).toISOString() : undefined,
      porcentagemAtingida: valorMeta > 0 ? (valorAtual / valorMeta) * 100 : 0,
      falta: Math.max(0, valorMeta - valorAtual)
    };
  });

  const loading = objetivosData === undefined;

  const [modalAberto, setModalAberto] = useState(false);
  const [modalContribuirAberto, setModalContribuirAberto] = useState(false);
  const [objetivoSelecionado, setObjetivoSelecionado] = useState<Objetivo | null>(null);

  const objetivosAtivos = objetivos.filter((obj) => obj.status === 'EM_ANDAMENTO');
  const objetivosConcluidos = objetivos.filter((obj) => obj.status === 'CONCLUIDO');
  const totalEconomizado = objetivosAtivos.reduce((acc, obj) => acc + obj.valorAtual, 0);
  const totalMetas = objetivosAtivos.reduce((acc, obj) => acc + obj.valorMeta, 0);

  return (
    <div className="bg-zinc-950 p-4 lg:p-6 space-y-4 sm:space-y-6">
      <div className="relative mb-8">
        <div className="relative">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                  <Target className="w-8 h-8 text-green-400" />
                </div>
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
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 via-teal-400 to-orange-400 bg-clip-text text-transparent">
                      Objetivos Financeiros
                    </h1>
                  </div>
                  <p className="text-zinc-400">Transforme seus sonhos em realidade</p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => setModalAberto(true)}
              className="bg-gradient-to-r from-green-600 via-teal-600 to-orange-600 hover:from-green-700 hover:via-teal-700 hover:to-orange-700 text-white shadow-lg transition-all hover:scale-105"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Novo Objetivo
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Economizado */}
            <Card className="relative overflow-hidden bg-zinc-900/50 border-zinc-800 hover:border-green-500/40 transition-all">
              <div className="relative p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Sparkles className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="text-sm text-zinc-400">Você já economizou</span>
                </div>
                <div className="text-3xl font-bold text-green-400 mb-1">
                  {formatarMoeda(totalEconomizado)}
                </div>
                <p className="text-xs text-zinc-500">Continue assim! 🎯</p>
              </div>
            </Card>

            {/* Progresso Geral */}
            <Card className="relative overflow-hidden bg-zinc-900/50 border-zinc-800 hover:border-green-500/40 transition-all">
              <div className="relative p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="text-sm text-zinc-400">Progresso Geral</span>
                </div>
                <div className="text-3xl font-bold text-green-400 mb-1">
                  {totalMetas > 0 ? Math.round((totalEconomizado / totalMetas) * 100) : 0}%
                </div>
                <p className="text-xs text-zinc-500">
                  Faltam {formatarMoeda(totalMetas - totalEconomizado)}
                </p>
              </div>
            </Card>

            {/* Objetivos Ativos */}
            <Card className="relative overflow-hidden bg-zinc-900/50 border-zinc-800 hover:border-orange-500/40 transition-all">
              <div className="relative p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <Zap className="w-5 h-5 text-orange-400" />
                  </div>
                  <span className="text-sm text-zinc-400">Objetivos Ativos</span>
                </div>
                <div className="text-3xl font-bold text-orange-400 mb-1">
                  {objetivosAtivos.length}
                </div>
                <p className="text-xs text-zinc-500">
                  {objetivosConcluidos.length} concluídos
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Lista de Objetivos */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : objetivosAtivos.length === 0 ? (
        <Card className="bg-zinc-900/50 border-zinc-800 p-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/10 rounded-full mb-4">
              <Target className="w-10 h-10 text-green-400" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-2">
              Comece sua jornada financeira!
            </h3>
            <p className="text-zinc-400 mb-6 max-w-md mx-auto">
              Defina seus objetivos e acompanhe seu progresso rumo à realização dos seus sonhos
            </p>
            <Button
              onClick={() => setModalAberto(true)}
              className="bg-gradient-to-r from-green-600 via-teal-600 to-orange-600 hover:from-green-700 hover:via-teal-700 hover:to-orange-700 shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Objetivo
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {objetivosAtivos.map((objetivo) => (
            <Card
              key={objetivo.id}
              className="relative overflow-hidden bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all group hover:shadow-lg"
            >
              {/* Barra de Progresso de Fundo */}
              <div
                className="absolute bottom-0 left-0 h-1 transition-all"
                style={{
                  width: `${objetivo.porcentagemAtingida}%`,
                  backgroundColor: objetivo.cor
                }}
              />

              <div className="relative p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-3 rounded-xl"
                      style={{ backgroundColor: `${objetivo.cor}10` }}
                    >
                      {objetivo.isReservaEmergencia ? (
                        <Shield className="w-6 h-6" style={{ color: objetivo.cor }} />
                      ) : (
                        <Target className="w-6 h-6" style={{ color: objetivo.cor }} />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white">{objetivo.nome}</h3>
                      {objetivo.descricao && (
                        <p className="text-sm text-zinc-400">{objetivo.descricao}</p>
                      )}
                    </div>
                  </div>
                  {objetivo.isReservaEmergencia && (
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full flex items-center gap-1 border border-blue-500/20">
                      <Shield className="w-3 h-3" />
                      Emergência
                    </span>
                  )}
                </div>

                {/* Progresso Visual */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-zinc-400">Progresso</span>
                    <span className="text-sm font-bold text-white">
                      {Math.round(objetivo.porcentagemAtingida)}%
                    </span>
                  </div>
                  <div className="relative h-3 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                      style={{
                        width: `${objetivo.porcentagemAtingida}%`,
                        backgroundColor: objetivo.cor
                      }}
                    />
                  </div>
                </div>

                {/* Valores */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Economizado</p>
                    <p className="text-lg font-bold text-white">
                      {formatarMoeda(objetivo.valorAtual)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Falta</p>
                    <p className="text-lg font-bold" style={{ color: objetivo.cor }}>
                      {formatarMoeda(objetivo.falta)}
                    </p>
                  </div>
                </div>

                {/* Meta e Data */}
                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <DollarSign className="w-4 h-4" />
                    Meta: {formatarMoeda(objetivo.valorMeta)}
                  </div>
                  {objetivo.dataMeta && (
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(objetivo.dataMeta), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => {
                    setObjetivoSelecionado(objetivo);
                    setModalContribuirAberto(true);
                  }}
                  className="w-full mt-4 transition-all hover:scale-[1.02]"
                  style={{
                    backgroundColor: `${objetivo.cor}10`,
                    color: objetivo.cor,
                    border: `1px solid ${objetivo.cor}20`
                  }}
                  variant="default"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Contribuir
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Objetivos Concluídos */}
      {objetivosConcluidos.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-green-400" />
            Objetivos Concluídos 🎉
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {objetivosConcluidos.map((objetivo) => (
              <Card
                key={objetivo.id}
                className="bg-zinc-900/50 border-zinc-800 hover:border-green-500/40 transition-all"
              >
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <h3 className="font-semibold text-white">{objetivo.nome}</h3>
                  </div>
                  <p className="text-2xl font-bold text-green-400">
                    {formatarMoeda(objetivo.valorMeta)}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">Meta alcançada!</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Novo Objetivo */}
      <NovoObjetivoModal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        onSucesso={() => {
          // Live query updates automatically
        }}
      />

      {/* Modal de Contribuir */}
      <ContribuirObjetivoModal
        aberto={modalContribuirAberto}
        onFechar={() => {
          setModalContribuirAberto(false);
          setObjetivoSelecionado(null);
        }}
        onSucesso={() => {
          // Live query updates automatically
        }}
        objetivo={objetivoSelecionado}
      />
    </div>
  );
}