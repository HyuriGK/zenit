'use client';

import { useState, FormEvent } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/dexie';
import { Midia } from '@/types/midia';
import { User, BookOpen, Star, Book, Clapperboard } from 'lucide-react';

// --- Interfaces ---

export interface NovaCitacaoValues {
  texto: string;
  autor: string;
  pagina: string;
  destaque: boolean;
  midiaId: string;
}

interface NovaCitacaoFormProps {
  onSubmit: (formData: NovaCitacaoValues) => Promise<void>;
  midias: Midia[];
  isSubmitting?: boolean;
}

// --- Sub-componente exportado para evitar erro no CitacoesModal ---

export function NovaCitacaoForm({ onSubmit, midias, isSubmitting }: NovaCitacaoFormProps) {
  const [formData, setFormData] = useState<NovaCitacaoValues>({
    texto: '',
    autor: '',
    pagina: '',
    destaque: false,
    midiaId: '',
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form id="nova-citacao-form" onSubmit={handleSubmit} className="space-y-1">
      <textarea
        value={formData.texto}
        onChange={(e) => setFormData({ ...formData, texto: e.target.value })}
        placeholder="Digite a citação aqui..."
        required
        className="w-full bg-transparent border-none text-white text-lg font-medium placeholder:text-zinc-500 focus:outline-none focus:ring-0 py-2 resize-none min-h-30"
        autoFocus
      />

      <div className="border-t border-zinc-800" />

      <div className="space-y-0.5">
        <div className="flex items-center gap-3 py-2.5 px-1 hover:bg-zinc-800/30 rounded-lg transition-colors">
          <User className="w-5 h-5 text-zinc-400 shrink-0" />
          <input
            type="text"
            value={formData.autor}
            onChange={(e) => setFormData({ ...formData, autor: e.target.value })}
            placeholder="Autor"
            className="flex-1 bg-transparent border-none text-sm text-white placeholder:text-zinc-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 py-2.5 px-1 hover:bg-zinc-800/30 rounded-lg transition-colors">
          <BookOpen className="w-5 h-5 text-zinc-400 shrink-0" />
          <input
            type="text"
            value={formData.pagina}
            onChange={(e) => setFormData({ ...formData, pagina: e.target.value })}
            placeholder="Página (ex: 42)"
            className="flex-1 bg-transparent border-none text-sm text-white placeholder:text-zinc-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 py-2.5 px-1 hover:bg-zinc-800/30 rounded-lg transition-colors">
          {(() => {
            const selectedMidia = midias.find(m => m.id === formData.midiaId);
            return selectedMidia?.tipo === 'LIVRO' ?
              <Book className="w-5 h-5 text-zinc-400 shrink-0" /> :
              <Clapperboard className="w-5 h-5 text-zinc-400 shrink-0" />;
          })()}
          <select
            value={formData.midiaId}
            onChange={(e) => setFormData({ ...formData, midiaId: e.target.value })}
            className="flex-1 bg-transparent border-none text-sm text-white focus:outline-none appearance-none cursor-pointer"
          >
            <option value="" className="bg-zinc-900 text-zinc-500">Associar a um livro/filme (opcional)</option>
            {midias.map((midia) => (
              <option key={midia.id} value={midia.id} className="bg-zinc-900">
                {midia.titulo}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 py-2.5 px-1 hover:bg-zinc-800/30 rounded-lg transition-colors">
          <Star className={`w-5 h-5 shrink-0 ${formData.destaque ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-400'}`} />
          <div className="flex items-center justify-between flex-1">
            <span className="text-sm text-zinc-300">Adicionar aos destaques</span>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, destaque: !formData.destaque })}
              className={`relative w-9 h-5 rounded-full transition-colors ${formData.destaque ? 'bg-green-500' : 'bg-zinc-600'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${formData.destaque ? 'left-4.5' : 'left-0.5'}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-zinc-800 mt-4">
        <Button
          type="submit"
          className="px-6 h-9 text-sm bg-green-600 hover:bg-green-700 text-white rounded-full font-medium"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Salvando...' : 'Salvar Citação'}
        </Button>
      </div>
    </form>
  );
}

// --- Componente Modal ---

export function NovaCitacaoModal({
  aberto,
  onFechar,
  onSucesso,
  midias
}: {
  aberto: boolean;
  onFechar: () => void;
  onSucesso: () => void;
  midias: Midia[]
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: NovaCitacaoValues) => {
    setIsSubmitting(true);
    try {
      await db.citacoes.add({
        id: crypto.randomUUID(),
        ...values,
        autor: values.autor || null,
        pagina: values.pagina || null,
        midiaId: values.midiaId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      onSucesso();
      onFechar();
    } catch (error) {
      console.error(error);
      alert('Erro ao criar citação');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl p-6">
        <DialogHeader>
          <DialogTitle>Nova Citação</DialogTitle>
        </DialogHeader>

        <NovaCitacaoForm
          onSubmit={handleSubmit}
          midias={midias}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}