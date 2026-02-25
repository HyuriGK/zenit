'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/dexie';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NovaCitacaoForm } from './NovaCitacaoModal';
import { GerenciarCitacoesModal } from './GerenciarCitacoesModal';
import { Midia } from '@/types/midia';

interface CitacoesModalProps {
  aberto: boolean;
  onFechar: () => void;
  onSucesso: () => void;
  midias: Midia[];
}

export function CitacoesModal({ aberto, onFechar, onSucesso, midias }: CitacoesModalProps) {
  const [abaAtiva, setAbaAtiva] = useState<'nova' | 'gerenciar'>('nova');
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async (formData: { texto: string; autor: string; pagina: string; destaque: boolean; midiaId: string }) => {
    setCarregando(true);
    try {
      const payload = {
        texto: formData.texto,
        autor: formData.autor || null,
        pagina: formData.pagina || null,
        destaque: formData.destaque,
        midiaId: formData.midiaId || null,
      };

      await db.citacoes.add({
        id: crypto.randomUUID(),
        ...payload,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      onSucesso();
      onFechar();
    } catch (err) {
      console.error(err);
      alert('Erro ao criar citação');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-3xl w-[95vw] max-h-[80vh] overflow-hidden flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg md:text-xl">Citações</DialogTitle>
        </DialogHeader>

        <Tabs value={abaAtiva} onValueChange={(value) => setAbaAtiva(value as 'nova' | 'gerenciar')} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2 bg-zinc-800/50">
            <TabsTrigger value="nova" className="data-[state=active]:bg-green-600 text-white text-xs sm:text-sm">
              Nova
            </TabsTrigger>
            <TabsTrigger value="gerenciar" className="data-[state=active]:bg-green-600 text-white text-xs sm:text-sm">
              Gerenciar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="nova" className="flex-1 overflow-y-auto mt-3 sm:mt-4">
            <NovaCitacaoForm
              onSubmit={handleSubmit}
              midias={midias}
              isSubmitting={carregando}
            />
          </TabsContent>

          <TabsContent value="gerenciar" className="flex-1 overflow-y-auto mt-3 sm:mt-4 flex flex-col min-h-0">
            <GerenciarCitacoesModal
              aberto={true}
              onFechar={onFechar}
              onAtualizar={onSucesso}
              modoEmbutido={true}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-3 sm:pt-4 border-t border-zinc-800">
          <Button
            variant="default"
            onClick={onFechar}
            className="border-zinc-700 hover:bg-zinc-800 w-full sm:w-auto text-sm"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
