'use client';

import { useState, FormEvent, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/dexie';
import {
  TipoMidia,
  StatusLeitura,
  FonteLivro,
  GENEROS_LIVRO,
  GENEROS_FILME,
  CORES_MIDIA,
} from '@/types/midia';
import { ImageSearchSelector } from './ImageSearchSelector';
import { StarRating } from '@/components/ui/star-rating';
import { Book, Film, User, Building, Globe, Calendar, Clock, Tag, Palette } from 'lucide-react';

interface NovaMidiaModalProps {
  aberto: boolean;
  onFechar: () => void;
  onSucesso: () => void;
}

type FormData = {
  tipo: TipoMidia;
  titulo: string;
  capa: string;
  cor: string;
  autor: string;
  editora: string;
  genero: string;
  fonte: FonteLivro;
  diretor: string;
  duracao: string;
  anoLancamento: string;
  idioma: string;
  status: StatusLeitura;
  nota: string;
  dataInicio: string;
  dataConclusao: string;
};

type Payload = {
  tipo: TipoMidia;
  titulo: string;
  capa: string | null;
  cor: string;
  status: StatusLeitura;
  idioma: string | null;
  nota: number | null;
  dataInicio: string | null;
  dataConclusao: string | null;
  autor?: string | null;
  editora?: string | null;
  genero?: string | null;
  fonte?: FonteLivro | null;
  diretor?: string | null;
  duracao?: number | null;
  anoLancamento?: number | null;
};

export function NovaMidiaModal({ aberto, onFechar, onSucesso }: NovaMidiaModalProps) {
  const [carregando, setCarregando] = useState(false);
  const [tipoAnterior, setTipoAnterior] = useState(TipoMidia.LIVRO);
  const [formData, setFormData] = useState<FormData>({
    tipo: TipoMidia.LIVRO,
    titulo: '',
    capa: '',
    cor: CORES_MIDIA[0],
    autor: '',
    editora: '',
    genero: '',
    fonte: FonteLivro.FISICO,
    diretor: '',
    duracao: '',
    anoLancamento: '',
    idioma: '',
    status: StatusLeitura.PROXIMO,
    nota: '',
    dataInicio: '',
    dataConclusao: '',
  });

  // Limpa o formulário quando o modal fecha
  useEffect(() => {
    if (!aberto) {
      limparFormulario();
    }
  }, [aberto]);

  // Limpa a capa quando o tipo muda
  useEffect(() => {
    if (formData.tipo !== tipoAnterior) {
      setFormData(prev => ({ ...prev, capa: '' }));
      setTipoAnterior(formData.tipo);
    }
  }, [formData.tipo, tipoAnterior]);

  const limparFormulario = () => {
    setFormData({
      tipo: TipoMidia.LIVRO,
      titulo: '',
      capa: '',
      cor: CORES_MIDIA[0],
      autor: '',
      editora: '',
      genero: '',
      fonte: FonteLivro.FISICO,
      diretor: '',
      duracao: '',
      anoLancamento: '',
      idioma: '',
      status: StatusLeitura.PROXIMO,
      nota: '',
      dataInicio: '',
      dataConclusao: '',
    });
    setTipoAnterior(TipoMidia.LIVRO);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setCarregando(true);

    try {
      const payload: Payload = {
        tipo: formData.tipo,
        titulo: formData.titulo,
        capa: formData.capa || null,
        cor: formData.cor,
        status: formData.status,
        idioma: formData.idioma || null,
        nota: formData.nota ? parseInt(formData.nota) : null,
        dataInicio: formData.dataInicio || null,
        dataConclusao: formData.dataConclusao || null,
      };

      if (formData.tipo === TipoMidia.LIVRO) {
        payload.autor = formData.autor || null;
        payload.editora = formData.editora || null;
        payload.genero = formData.genero || null;
        payload.fonte = formData.fonte || null;
      } else {
        payload.diretor = formData.diretor || null;
        payload.duracao = formData.duracao ? parseInt(formData.duracao) : null;
        payload.anoLancamento = formData.anoLancamento ? parseInt(formData.anoLancamento) : null;
        payload.genero = formData.genero || null;
      }

      const id = crypto.randomUUID();
      await db.midias.add({
        id,
        ...payload,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      limparFormulario();
      onSucesso();
      onFechar();
    } catch (error) {
      console.error('Erro ao criar item:', error);
      alert('Erro ao criar item');
    } finally {
      setCarregando(false);
    }
  };

  const generos = formData.tipo === TipoMidia.LIVRO ? GENEROS_LIVRO : GENEROS_FILME;

  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg p-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="px-5 pt-4 pb-3">
          <DialogTitle className="text-white text-base flex items-center gap-2">
            {formData.tipo === TipoMidia.LIVRO ? (
              <Book className="w-4 h-4 text-green-400" />
            ) : (
              <Film className="w-4 h-4 text-green-400" />
            )}
            Adicionar {formData.tipo === TipoMidia.LIVRO ? 'Livro' : 'Filme'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-5 pb-5">
          {/* Tipo */}
          <div className="flex items-center gap-3 py-1.5 px-1 hover:bg-zinc-800/30 rounded-lg transition-colors mb-2">
            {formData.tipo === TipoMidia.LIVRO ? (
              <Book className="w-5 h-5 text-gray-400 shrink-0" />
            ) : (
              <Film className="w-5 h-5 text-gray-400 shrink-0" />
            )}
            <div className="flex items-center gap-1.5 flex-wrap flex-1">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tipo: TipoMidia.LIVRO })}
                className={`
                  px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2
                  ${formData.tipo === TipoMidia.LIVRO
                    ? 'bg-green-500/20 text-green-400 ring-2 ring-green-500 ring-offset-1 ring-offset-zinc-900'
                    : 'bg-zinc-800/50 text-gray-400 hover:bg-zinc-700/50'
                  }
                `}
              >
                <Book className="w-4 h-4" />
                Livro
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tipo: TipoMidia.FILME })}
                className={`
                  px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2
                  ${formData.tipo === TipoMidia.FILME
                    ? 'bg-green-500/20 text-green-400 ring-2 ring-green-500 ring-offset-1 ring-offset-zinc-900'
                    : 'bg-zinc-800/50 text-gray-400 hover:bg-zinc-700/50'
                  }
                `}
              >
                <Film className="w-4 h-4" />
                Filme
              </button>
            </div>
          </div>

          <div className="border-t border-zinc-800 mb-2" />

          {/* Título - campo principal */}
          <div className="mb-3">
            <input
              type="text"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder={`Título do ${formData.tipo === TipoMidia.LIVRO ? 'livro' : 'filme'}`}
              required
              className="w-full bg-transparent border-none text-white text-base font-medium placeholder:text-gray-500 focus:outline-none focus:ring-0 py-1.5"
              autoFocus
            />
          </div>

          {/* Lista de campos com ícones */}
          <div className="space-y-0.5">
            {/* Campos específicos de Livro */}
            {formData.tipo === TipoMidia.LIVRO && (
              <>
                {/* Autor */}
                <div className="flex items-center gap-3 py-1.5 px-1 hover:bg-zinc-800/30 rounded-lg transition-colors">
                  <User className="w-5 h-5 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={formData.autor}
                    onChange={(e) => setFormData({ ...formData, autor: e.target.value })}
                    placeholder="Autor"
                    className="flex-1 bg-transparent border-none text-sm text-white placeholder:text-gray-500 focus:outline-none"
                  />
                </div>

                {/* Editora */}
                <div className="flex items-center gap-3 py-1.5 px-1 hover:bg-zinc-800/30 rounded-lg transition-colors">
                  <Building className="w-5 h-5 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={formData.editora}
                    onChange={(e) => setFormData({ ...formData, editora: e.target.value })}
                    placeholder="Editora"
                    className="flex-1 bg-transparent border-none text-sm text-white placeholder:text-gray-500 focus:outline-none"
                  />
                </div>

                {/* Fonte */}
                <div className="flex items-center gap-3 py-1.5 px-1 hover:bg-zinc-800/30 rounded-lg transition-colors">
                  <Book className="w-5 h-5 text-gray-400 shrink-0" />
                  <select
                    value={formData.fonte}
                    onChange={(e) => setFormData({ ...formData, fonte: e.target.value as FonteLivro })}
                    className="flex-1 bg-zinc-900 border-none text-sm text-white focus:outline-none appearance-none"
                  >
                    <option value={FonteLivro.FISICO}>Físico</option>
                    <option value={FonteLivro.DIGITAL}>Digital</option>
                    <option value={FonteLivro.KINDLE}>Kindle</option>
                    <option value={FonteLivro.EMPRESTADO}>Emprestado</option>
                  </select>
                </div>
              </>
            )}

            {/* Campos específicos de Filme */}
            {formData.tipo === TipoMidia.FILME && (
              <>
                {/* Diretor */}
                <div className="flex items-center gap-3 py-1.5 px-1 hover:bg-zinc-800/30 rounded-lg transition-colors">
                  <User className="w-5 h-5 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={formData.diretor}
                    onChange={(e) => setFormData({ ...formData, diretor: e.target.value })}
                    placeholder="Diretor"
                    className="flex-1 bg-transparent border-none text-sm text-white placeholder:text-gray-500 focus:outline-none"
                  />
                </div>

                {/* Ano de Lançamento */}
                <div className="flex items-center gap-3 py-1.5 px-1 hover:bg-zinc-800/30 rounded-lg transition-colors">
                  <Calendar className="w-5 h-5 text-gray-400 shrink-0" />
                  <input
                    type="number"
                    value={formData.anoLancamento}
                    onChange={(e) => setFormData({ ...formData, anoLancamento: e.target.value })}
                    placeholder="Ano de Lançamento"
                    className="flex-1 bg-transparent border-none text-sm text-white placeholder:text-gray-500 focus:outline-none"
                  />
                </div>

                {/* Duração */}
                <div className="flex items-center gap-3 py-1.5 px-1 hover:bg-zinc-800/30 rounded-lg transition-colors">
                  <Clock className="w-5 h-5 text-gray-400 shrink-0" />
                  <input
                    type="number"
                    value={formData.duracao}
                    onChange={(e) => setFormData({ ...formData, duracao: e.target.value })}
                    placeholder="Duração (minutos)"
                    className="flex-1 bg-transparent border-none text-sm text-white placeholder:text-gray-500 focus:outline-none"
                  />
                </div>
              </>
            )}

            {/* Gênero */}
            <div className="flex items-center gap-3 py-1.5 px-1 hover:bg-zinc-800/30 rounded-lg transition-colors">
              <Tag className="w-5 h-5 text-gray-400 shrink-0" />
              <select
                value={formData.genero}
                onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                className="flex-1 bg-zinc-900 border-none text-sm text-white focus:outline-none appearance-none"
              >
                <option value="">Selecione um gênero...</option>
                {generos.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Idioma */}
            <div className="flex items-center gap-3 py-1.5 px-1 hover:bg-zinc-800/30 rounded-lg transition-colors">
              <Globe className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                type="text"
                value={formData.idioma}
                onChange={(e) => setFormData({ ...formData, idioma: e.target.value })}
                placeholder="Idioma (ex: Português)"
                className="flex-1 bg-transparent border-none text-sm text-white placeholder:text-gray-500 focus:outline-none"
              />
            </div>

            {/* Status */}
            <div className="flex items-center gap-3 py-1.5 px-1 hover:bg-zinc-800/30 rounded-lg transition-colors">
              <Tag className="w-5 h-5 text-gray-400 shrink-0" />
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as StatusLeitura })}
                className="flex-1 bg-zinc-900 border-none text-sm text-white focus:outline-none appearance-none"
              >
                <option value={StatusLeitura.PROXIMO}>Próximo</option>
                <option value={StatusLeitura.EM_ANDAMENTO}>Em andamento</option>
                <option value={StatusLeitura.PAUSADO}>Pausado</option>
                <option value={StatusLeitura.CONCLUIDO}>Concluído</option>
              </select>
            </div>

            {/* Avaliação */}
            <div className="flex items-center gap-3 py-1.5 px-1 hover:bg-zinc-800/30 rounded-lg transition-colors">
              <div className="w-5 h-5 text-gray-400 shrink-0 flex items-center justify-center">
                ★
              </div>
              <div className="flex-1">
                <StarRating
                  value={parseInt(formData.nota) || 0}
                  onChange={(nota) => setFormData({ ...formData, nota: nota.toString() })}
                  size="sm"
                  showLabel
                />
              </div>
            </div>

            {/* Datas */}
            <div className="flex items-center gap-3 py-1.5 px-1 hover:bg-zinc-800/30 rounded-lg transition-colors">
              <Calendar className="w-5 h-5 text-gray-400 shrink-0" />
              <div className="flex items-center gap-2 flex-1 flex-wrap">
                <input
                  type="date"
                  value={formData.dataInicio}
                  onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                  placeholder="Data de Início"
                  className="bg-zinc-800/50 border border-zinc-700 rounded-md px-2 py-1 text-sm text-white focus:border-green-500 focus:outline-none flex-1 min-w-0"
                />
                <span className="text-gray-500 text-sm">-</span>
                <input
                  type="date"
                  value={formData.dataConclusao}
                  onChange={(e) => setFormData({ ...formData, dataConclusao: e.target.value })}
                  placeholder="Data de Conclusão"
                  className="bg-zinc-800/50 border border-zinc-700 rounded-md px-2 py-1 text-sm text-white focus:border-green-500 focus:outline-none flex-1 min-w-0"
                />
              </div>
            </div>

            {/* Cor */}
            <div className="flex items-center gap-3 py-1.5 px-1 hover:bg-zinc-800/30 rounded-lg transition-colors">
              <Palette className="w-5 h-5 text-gray-400 shrink-0" />
              <div className="flex items-center gap-1.5 flex-wrap flex-1">
                {CORES_MIDIA.map((cor) => (
                  <button
                    key={cor}
                    type="button"
                    onClick={() => setFormData({ ...formData, cor })}
                    className={`w-6 h-6 rounded-full transition-all ${formData.cor === cor ? 'ring-2 ring-white ring-offset-1 ring-offset-zinc-900' : ''
                      }`}
                    style={{ backgroundColor: cor }}
                  />
                ))}
              </div>
            </div>

            {/* Busca de Capa */}
            <div className="pt-2 border-t border-zinc-800">
              <ImageSearchSelector
                tipo={formData.tipo === TipoMidia.LIVRO ? 'livro' : 'filme'}
                titulo={formData.titulo}
                capaAtual={formData.capa}
                onSelecionarCapa={(url) => setFormData({ ...formData, capa: url })}
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800 mt-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onFechar}
              className="px-4 h-9 text-sm text-gray-400 hover:text-white"
              disabled={carregando}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="px-6 h-9 text-sm bg-green-600 hover:bg-green-700 text-white rounded-full"
              disabled={carregando}
            >
              {carregando
                ? `Criando${formData.tipo === TipoMidia.LIVRO ? ' livro' : ' filme'}...`
                : `Criar ${formData.tipo === TipoMidia.LIVRO ? 'Livro' : 'Filme'}`
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}