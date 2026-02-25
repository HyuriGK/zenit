'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Star, Trash2 } from 'lucide-react';
import { db } from '@/lib/dexie';
import { Citacao } from '@/types/midia';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface ConteudoGerenciarCitacoesProps {
  onAtualizar: () => void;
}

interface GerenciarCitacoesModalProps {
  aberto: boolean;
  onFechar: () => void;
  onAtualizar: () => void;
  modoEmbutido?: boolean;
}

function ConteudoGerenciarCitacoes({ onAtualizar }: ConteudoGerenciarCitacoesProps) {
  const [citacoesDestaque, setCitacoesDestaque] = useState<Citacao[]>([]);
  const [todasCitacoes, setTodasCitacoes] = useState<Citacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalExcluir, setModalExcluir] = useState(false);
  const [citacaoParaExcluir, setCitacaoParaExcluir] = useState<string | null>(null);

  useEffect(() => {
    carregarCitacoes();
  }, []);

  const carregarCitacoes = async () => {
    try {
      setLoading(true);
      const midiasData = await db.midias.toArray();
      const todasRes = await db.citacoes.toArray();

      const populadas = todasRes.map(citacao => {
        const midia = midiasData.find(m => m.id === citacao.midiaId);
        return {
          ...citacao,
          midia: midia
        } as any;
      });

      setCitacoesDestaque(populadas.filter(c => c.destaque));
      setTodasCitacoes(populadas);
    } catch (error) {
      console.error('Erro ao carregar citações:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDestaque = async (citacao: Citacao) => {
    try {
      await db.citacoes.update(citacao.id, {
        destaque: !citacao.destaque,
        updatedAt: new Date()
      } as any);

      await carregarCitacoes();
      onAtualizar();
    } catch (error) {
      console.error('Erro ao atualizar destaque:', error);
    }
  };

  const excluirCitacao = async (id: string) => {
    setCitacaoParaExcluir(id);
    setModalExcluir(true);
  };

  const confirmarExcluirCitacao = async () => {
    if (!citacaoParaExcluir) return;
    try {
      await db.citacoes.delete(citacaoParaExcluir);
      await carregarCitacoes();
      onAtualizar();
    } finally {
      setCitacaoParaExcluir(null);
    }
  };

  const CitacaoCard = ({ citacao, mostrarBotaoDestaque = true }: { citacao: Citacao; mostrarBotaoDestaque?: boolean }) => (
    <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 sm:p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-zinc-200 text-xs sm:text-sm italic line-clamp-3">&ldquo;{citacao.texto}&rdquo;</p>
          {citacao.autor && <p className="text-xs text-zinc-400 mt-2">— {citacao.autor}</p>}
          {citacao.midia && (
            <p className="text-xs text-zinc-500 mt-1">
              {citacao.midia.tipo === 'LIVRO' ? '📚' : '🎬'} {citacao.midia.titulo}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-zinc-700">
        {mostrarBotaoDestaque && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleDestaque(citacao)}
            className={`flex-1 h-8 text-xs ${citacao.destaque ? 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30' : 'text-zinc-400 hover:text-yellow-500'}`}
          >
            <Star className={`w-3 h-3 mr-1.5 ${citacao.destaque ? 'fill-current' : ''}`} />
            <span>{citacao.destaque ? 'Remover destaque' : 'Adicionar destaque'}</span>
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => excluirCitacao(citacao.id)}
          className="h-8 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <Trash2 className="w-3 h-3 mr-1.5" /> Excluir
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Tabs defaultValue="destaque" className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-full grid-cols-2 bg-zinc-800/50">
          <TabsTrigger value="destaque" className="data-[state=active]:bg-green-600 text-white text-xs sm:text-sm font-medium">
            Inspiradoras ({citacoesDestaque.length})
          </TabsTrigger>
          <TabsTrigger value="todas" className="data-[state=active]:bg-green-600 text-white text-xs sm:text-sm font-medium">
            Todas ({todasCitacoes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="destaque" className="flex-1 overflow-y-auto mt-4 space-y-3 pr-1">
          {loading ? <div className="animate-pulse text-center py-8">Carregando...</div> :
            citacoesDestaque.length === 0 ? <div className="text-center py-12 text-zinc-500 text-sm">Nenhuma frase inspiradora</div> :
              citacoesDestaque.map(c => <CitacaoCard key={c.id} citacao={c} />)}
        </TabsContent>

        <TabsContent value="todas" className="flex-1 overflow-y-auto mt-4 space-y-3 pr-1">
          {loading ? <div className="animate-pulse text-center py-8">Carregando...</div> :
            todasCitacoes.map(c => <CitacaoCard key={c.id} citacao={c} />)}
        </TabsContent>
      </Tabs>

      <ConfirmModal
        open={modalExcluir}
        onClose={() => setModalExcluir(false)}
        onConfirm={confirmarExcluirCitacao}
        title="Excluir Citação"
        description="Esta ação não pode ser desfeita."
        confirmText="Excluir"
        variant="danger"
      />
    </div>
  );
}

export function GerenciarCitacoesModal({ aberto, onFechar, onAtualizar, modoEmbutido = false }: GerenciarCitacoesModalProps) {
  if (modoEmbutido) return <ConteudoGerenciarCitacoes onAtualizar={onAtualizar} />;

  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-3xl w-[95vw] max-h-[85vh] overflow-hidden flex flex-col p-6">
        <DialogHeader>
          <DialogTitle>Gerenciar Citações</DialogTitle>
        </DialogHeader>
        <ConteudoGerenciarCitacoes onAtualizar={onAtualizar} />
      </DialogContent>
    </Dialog>
  );
}