'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  BookOpen,
  Plus,
  ChevronLeft,
  FileText,
  Trash2,
  Edit,
  FolderOpen,
  Save,
  X,
  Sparkles,
  List,
  Maximize2,
  Minimize2,
  Loader2,
} from 'lucide-react';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import RichTextEditor from '@/components/estudos/RichTextEditor';
import { PomodoroTimer } from '@/components/PomodoroTimer';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

interface Modulo {
  id: string;
  nome: string;
  descricao?: string;
  ordem: number;
  _count?: {
    paginas: number;
  };
  paginas?: Pagina[];
}

interface Pagina {
  id: string;
  titulo: string;
  conteudo: string;
  ordem: number;
}

interface Curso {
  id: string;
  nome: string;
  descricao?: string;
  cor: string;
  modulos: Modulo[];
}

export default function CursoDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('courseDetail');
  const cursoId = params.id as string;

  const [curso, setCurso] = useState<Curso | null>(null);
  const [moduloSelecionado, setModuloSelecionado] = useState<Modulo | null>(null);
  const [paginaSelecionada, setPaginaSelecionada] = useState<Pagina | null>(null);
  const [loading, setLoading] = useState(true);
  const requisicaoAtual = useRef(0);

  const [modalModuloAberto, setModalModuloAberto] = useState(false);
  const [modalPaginaAberto, setModalPaginaAberto] = useState(false);
  const [editandoPagina, setEditandoPagina] = useState(false);
  const [paginaAmpliada, setPaginaAmpliada] = useState(false);

  const [modalExcluirCurso, setModalExcluirCurso] = useState(false);
  const [modalExcluirModulo, setModalExcluirModulo] = useState(false);
  const [modalExcluirPagina, setModalExcluirPagina] = useState(false);
  const [itemParaExcluir, setItemParaExcluir] = useState<string | null>(null);
  const [modalConfirmarSaidaModulo, setModalConfirmarSaidaModulo] = useState(false);
  const [modalConfirmarSaidaPagina, setModalConfirmarSaidaPagina] = useState(false);
  const [modalConfirmarSaidaEdicao, setModalConfirmarSaidaEdicao] = useState(false);
  const [navegacaoPendente, setNavegacaoPendente] = useState<{ tipo: 'modulo' | 'pagina'; id: string } | null>(null);

  const [conteudoOriginalPagina, setConteudoOriginalPagina] = useState<{ titulo: string; conteudo: string } | null>(null);

  const [novoModulo, setNovoModulo] = useState({
    nome: '',
    descricao: '',
  });

  const [novaPagina, setNovaPagina] = useState({
    titulo: '',
    conteudo: '',
  });

  const [criandoModulo, setCriandoModulo] = useState(false);
  const [criandoPagina, setCriandoPagina] = useState(false);
  const [salvandoPagina, setSalvandoPagina] = useState(false);
  const [excluindoModulo, setExcluindoModulo] = useState(false);
  const [excluindoPagina, setExcluindoPagina] = useState(false);
  const [excluindoCurso, setExcluindoCurso] = useState(false);

  const carregarDados = useCallback(async () => {
    const idRequisicao = ++requisicaoAtual.current;
    try {
      const [resCursos, resModulos, resAnots] = await Promise.all([
        fetch('/api/estudos'),
        fetch(`/api/estudos/modulos?cursoId=${cursoId}`),
        fetch(`/api/estudos/anotacoes?cursoId=${cursoId}`)
      ]);

      if (resCursos.ok && resModulos.ok && resAnots.ok) {
        const jsonCursos = await resCursos.json();
        const jsonModulos = await resModulos.json();
        const jsonAnots = await resAnots.json();

        // Ignore a resposta caso uma navegação ou atualização mais recente já tenha começado.
        if (idRequisicao !== requisicaoAtual.current) return;

        const cursoFound = jsonCursos.data.find((c: any) => c.id === cursoId);
        if (!cursoFound) {
          setLoading(false);
          return;
        }

        const mods = jsonModulos.data || [];
        const anots = jsonAnots.data || [];

        // Formata os módulos com suas páginas
        const modulosComPaginas = mods.map((modulo: any) => {
          const paginasDoModulo = anots.filter((a: any) => a.moduloId === modulo.id);
          const paginasFormatadas: Pagina[] = paginasDoModulo.map((a: any, index: number) => ({
            id: a.id,
            titulo: a.titulo,
            conteudo: a.conteudo,
            ordem: index
          }));

          return {
            ...modulo,
            _count: { paginas: paginasFormatadas.length },
            paginas: paginasFormatadas
          };
        });

        setCurso({
          id: cursoFound.id,
          nome: cursoFound.nome,
          descricao: cursoFound.descricao,
          cor: cursoFound.cor,
          modulos: modulosComPaginas
        } as Curso);

        // Mantém a seleção mais recente. Não use valores capturados pela requisição,
        // pois uma resposta atrasada poderia restaurar visualmente uma seleção antiga.
        setModuloSelecionado((moduloAtual) => {
          if (!moduloAtual) return null;
          return modulosComPaginas.find((modulo: Modulo) => modulo.id === moduloAtual.id) ?? null;
        });

        setPaginaSelecionada((paginaAtual) => {
          if (!paginaAtual) return null;
          const paginaAtualizada = anots.find((pagina: any) => pagina.id === paginaAtual.id);
          return paginaAtualizada
            ? {
                id: paginaAtualizada.id,
                titulo: paginaAtualizada.titulo,
                conteudo: paginaAtualizada.conteudo,
                ordem: 0,
              }
            : null;
        });

      }
    } catch (err) {
      console.error(err);
    } finally {
      if (idRequisicao === requisicaoAtual.current) {
        setLoading(false);
      }
    }
  }, [cursoId]);

  useEffect(() => {
    setLoading(true);
    carregarDados();
  }, [carregarDados]);

  const criarModulo = async () => {
    if (criandoModulo) return;

    setCriandoModulo(true);
    try {
      const res = await fetch('/api/estudos/modulos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cursoId,
          ordem: curso?.modulos.length || 0,
          ...novoModulo
        })
      });

      if (res.ok) {
        carregarDados();
      }

      setModalModuloAberto(false);
      setNovoModulo({ nome: '', descricao: '' });
    } catch (error) {
      console.error('Erro ao criar módulo:', error);
    } finally {
      setCriandoModulo(false);
    }
  };

  const criarPagina = async () => {
    if (!moduloSelecionado || criandoPagina) return;

    setCriandoPagina(true);
    try {
      const res = await fetch('/api/estudos/anotacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: novaPagina.titulo,
          conteudo: novaPagina.conteudo,
          cor: '#FBBF24',
          moduloId: moduloSelecionado.id,
          cursoId: cursoId
        })
      });

      if (res.ok) {
        carregarDados();
      }

      setModalPaginaAberto(false);
      setNovaPagina({ titulo: '', conteudo: '' });
    } catch (error) {
      console.error('Erro ao criar página:', error);
    } finally {
      setCriandoPagina(false);
    }
  };

  const carregarModulo = (moduloId: string) => {
    if (curso) {
      const mod = curso.modulos.find(m => m.id === moduloId);
      if (mod) {
        setModuloSelecionado(mod);
        setPaginaSelecionada(null);
      }
    }
  };

  const carregarPagina = (paginaId: string) => {
    if (curso && moduloSelecionado) {
      const p = moduloSelecionado.paginas?.find(p => p.id === paginaId);
      if (p) {
        setPaginaSelecionada(p);
        setConteudoOriginalPagina({ titulo: p.titulo, conteudo: p.conteudo });
        setEditandoPagina(false);
      }
    }
  };

  // Verificar se o modal de módulo tem dados não salvos
  const isModuloDirty = novoModulo.nome.length > 0 || novoModulo.descricao.length > 0;

  // Verificar se o modal de página tem dados não salvos
  const isPaginaModalDirty = novaPagina.titulo.length > 0;

  // Verificar se a página em edição tem alterações não salvas
  const isPaginaEdicaoDirty = editandoPagina && paginaSelecionada && conteudoOriginalPagina &&
    (paginaSelecionada.titulo !== conteudoOriginalPagina.titulo ||
      paginaSelecionada.conteudo !== conteudoOriginalPagina.conteudo);

  const handleFecharModalModulo = (open: boolean) => {
    if (!open && isModuloDirty) {
      setModalConfirmarSaidaModulo(true);
    } else {
      setModalModuloAberto(open);
    }
  };

  const confirmarFecharModulo = () => {
    setModalConfirmarSaidaModulo(false);
    setModalModuloAberto(false);
    setNovoModulo({ nome: '', descricao: '' });
  };

  const handleFecharModalPagina = (open: boolean) => {
    if (!open && isPaginaModalDirty) {
      setModalConfirmarSaidaPagina(true);
    } else {
      setModalPaginaAberto(open);
    }
  };

  const confirmarFecharPagina = () => {
    setModalConfirmarSaidaPagina(false);
    setModalPaginaAberto(false);
    setNovaPagina({ titulo: '', conteudo: '' });
  };

  // Função para navegar com verificação de alterações não salvas
  const handleSelectModulo = (moduloId: string) => {
    if (moduloSelecionado?.id === moduloId) return;

    if (isPaginaEdicaoDirty) {
      setNavegacaoPendente({ tipo: 'modulo', id: moduloId });
      setModalConfirmarSaidaEdicao(true);
    } else {
      carregarModulo(moduloId);
    }
  };

  const handleSelectPagina = (paginaId: string) => {
    if (paginaSelecionada?.id === paginaId) return;

    if (isPaginaEdicaoDirty) {
      setNavegacaoPendente({ tipo: 'pagina', id: paginaId });
      setModalConfirmarSaidaEdicao(true);
    } else {
      carregarPagina(paginaId);
    }
  };

  const confirmarNavegacao = () => {
    setModalConfirmarSaidaEdicao(false);
    if (navegacaoPendente) {
      if (navegacaoPendente.tipo === 'modulo') {
        carregarModulo(navegacaoPendente.id);
      } else {
        carregarPagina(navegacaoPendente.id);
      }
      setNavegacaoPendente(null);
    }
  };

  const handleBack = () => {
    if (paginaAmpliada) {
      setPaginaAmpliada(false);
      return;
    }

    if (paginaSelecionada) {
      if (isPaginaEdicaoDirty) {
        setNavegacaoPendente(null); // No specific destination, just clear
        setModalConfirmarSaidaEdicao(true);
        return;
      }
      setPaginaSelecionada(null);
      return;
    }

    if (moduloSelecionado) {
      setModuloSelecionado(null);
      return;
    }

    router.push('/dashboard/estudos');
  };

  const salvarPagina = async () => {
    if (!paginaSelecionada || salvandoPagina) return;

    setSalvandoPagina(true);
    try {
      const res = await fetch('/api/estudos/anotacoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: paginaSelecionada.id,
          titulo: paginaSelecionada.titulo,
          conteudo: paginaSelecionada.conteudo
        })
      });

      const resposta = await res.json().catch(() => null);
      if (!res.ok || !resposta?.data) {
        throw new Error(resposta?.error || 'Não foi possível salvar a página. Tente novamente.');
      }

      // Use exatamente a versão que o banco confirmou ter salvo. Assim o editor
      // nunca marca conteúdo local como salvo quando a requisição falhar.
      const paginaSalva = resposta.data as Pagina;
      setPaginaSelecionada({
        id: paginaSalva.id,
        titulo: paginaSalva.titulo,
        conteudo: paginaSalva.conteudo,
        ordem: paginaSelecionada.ordem,
      });
      setConteudoOriginalPagina({
        titulo: paginaSalva.titulo,
        conteudo: paginaSalva.conteudo,
      });
      setEditandoPagina(false);
      toast.success('Página salva com sucesso.');
      await carregarDados();
    } catch (error) {
      console.error('Erro ao salvar página:', error);
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar a página.');
    } finally {
      setSalvandoPagina(false);
    }
  };

  const excluirModulo = async (moduloId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItemParaExcluir(moduloId);
    setModalExcluirModulo(true);
  };

  const confirmarExcluirModulo = async () => {
    if (!itemParaExcluir || excluindoModulo) return;

    setExcluindoModulo(true);
    try {
      const res = await fetch(`/api/estudos/modulos?id=${itemParaExcluir}`, { method: 'DELETE' });

      if (res.ok) {
        carregarDados();
      }

      if (moduloSelecionado?.id === itemParaExcluir) {
        setModuloSelecionado(null);
        setPaginaSelecionada(null);
      }
      setItemParaExcluir(null);
      setModalExcluirModulo(false);
    } catch (error) {
      console.error('Erro ao excluir módulo:', error);
    } finally {
      setExcluindoModulo(false);
    }
  };

  const excluirPagina = async (paginaId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItemParaExcluir(paginaId);
    setModalExcluirPagina(true);
  };

  const confirmarExcluirPagina = async () => {
    if (!itemParaExcluir || excluindoPagina) return;

    setExcluindoPagina(true);
    try {
      const res = await fetch(`/api/estudos/anotacoes?id=${itemParaExcluir}`, { method: 'DELETE' });

      if (res.ok) {
        carregarDados();
      }

      if (paginaSelecionada?.id === itemParaExcluir) {
        setPaginaSelecionada(null);
      }
      setItemParaExcluir(null);
      setModalExcluirPagina(false);
    } catch (error) {
      console.error('Erro ao excluir página:', error);
    } finally {
      setExcluindoPagina(false);
    }
  };

  const excluirCurso = async () => {
    setModalExcluirCurso(true);
  };

  const confirmarExcluirCurso = async () => {
    if (excluindoCurso) return;

    setExcluindoCurso(true);
    try {
      const res = await fetch(`/api/estudos?id=${cursoId}`, { method: 'DELETE' });

      if (res.ok) {
        router.push('/dashboard/estudos');
      }

    } catch (error) {
      console.error('Erro ao excluir curso:', error);
    } finally {
      setExcluindoCurso(false);
    }
  };

  if (loading) {
    return (
      <LoadingScreen message={t('loadingCourse')} />
    );
  }

  if (!curso) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-zinc-800/50 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-10 h-10 text-zinc-600" />
          </div>
          <p className="text-zinc-400">{t('courseNotFound')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Header com gradiente */}
      <div className="relative shrink-0 border-b border-zinc-800/50 backdrop-blur-xl bg-zinc-900/80 overflow-x-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-blue-500/5" />
        <div className="relative p-3 sm:p-4">
          <div className="flex flex-row items-start sm:items-center gap-2 sm:gap-4 w-full">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-xl h-auto py-2 px-3 text-sm flex-shrink-0"
            >
              <ChevronLeft className="w-4 h-4 mr-1 sm:mr-2" />
              {t('back')}
            </Button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
                  style={{
                    backgroundColor: curso.cor + '20',
                    color: curso.cor,
                    boxShadow: `0 0 20px ${curso.cor}20`,
                  }}
                >
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-base sm:text-xl font-bold text-white truncate">{curso.nome}</h1>
                  {curso.descricao && (
                    <p className="text-zinc-400 text-xs truncate">{curso.descricao}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
              <PomodoroTimer />
              <div className="flex items-center gap-2">
                <div className="px-2.5 py-1 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                  <span className="text-xs text-zinc-500 block">{t('modules')}</span>
                  <p className="text-sm font-bold text-white">{curso.modulos.length}</p>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                  <span className="text-xs text-zinc-500 block">{t('pages')}</span>
                  <p className="text-sm font-bold text-white">
                    {curso.modulos.reduce((acc, m) => acc + (m._count?.paginas || 0), 0)}
                  </p>
                </div>
                <Button
                  onClick={excluirCurso}
                  variant="ghost"
                  className="hover:bg-red-500/20 hover:text-red-400 text-zinc-400 rounded-lg h-auto py-1.5 px-2"
                  title={t('deleteCourse')}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          {/* Mobile stats row */}
          <div className="flex sm:hidden items-center gap-2 mt-2 w-full">
            <div className="flex-1 px-2.5 py-1 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
              <span className="text-xs text-zinc-500 block">{t('modules')}</span>
              <p className="text-sm font-bold text-white">{curso.modulos.length}</p>
            </div>
            <div className="flex-1 px-2.5 py-1 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
              <span className="text-xs text-zinc-500 block">{t('pages')}</span>
              <p className="text-sm font-bold text-white">
                {curso.modulos.reduce((acc, m) => acc + (m._count?.paginas || 0), 0)}
              </p>
            </div>
            <Button
              onClick={excluirCurso}
              variant="ghost"
              className="hover:bg-red-500/20 hover:text-red-400 text-zinc-400 rounded-lg h-auto py-1.5 px-2"
              title={t('deleteCourse')}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          {/* Mobile Pomodoro Timer - abaixo dos stats */}
          <div className="sm:hidden mt-3">
            <PomodoroTimer />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Sidebar Esquerda - Módulos */}
        <div className={`${paginaAmpliada ? 'hidden' : 'w-full lg:w-80'} shrink-0 border-b lg:border-b-0 lg:border-r border-zinc-800/50 bg-zinc-900/30 backdrop-blur-sm overflow-y-auto h-full`}>
          <div className="p-4">
            <Button
              onClick={() => setModalModuloAberto(true)}
              className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 shadow-lg shadow-green-500/20 rounded-xl h-12"
            >
              <Plus className="w-5 h-5 mr-2" />
              <span className="font-semibold">{t('newModule')}</span>
            </Button>
          </div>

          <div className="px-4 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <List className="w-4 h-4 text-zinc-500" />
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                {t('courseContent')}
              </span>
            </div>
            <div className="space-y-2">
              {curso.modulos.map((modulo, index) => (
                <div
                  key={modulo.id}
                  onClick={() => handleSelectModulo(modulo.id)}
                  className={`group relative cursor-pointer rounded-xl p-4 transition-all duration-200 ${moduloSelecionado?.id === modulo.id
                    ? 'bg-gradient-to-r from-green-500/20 to-blue-500/20 border-2 border-green-500/30 shadow-lg shadow-green-500/10'
                    : 'bg-zinc-800/40 hover:bg-zinc-800/60 border-2 border-transparent hover:border-zinc-700/50'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${moduloSelecionado?.id === modulo.id
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-zinc-700/50 text-zinc-400 group-hover:bg-zinc-700 group-hover:text-zinc-300'
                        }`}
                    >
                      <FolderOpen className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-zinc-500">
                          {t('module')} {index + 1}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-white truncate mb-1">
                        {modulo.nome}
                      </h3>
                      {modulo.descricao && (
                        <p className="text-xs text-zinc-500 truncate">{modulo.descricao}</p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs text-zinc-500">
                          <FileText className="w-3 h-3" />
                          <span>{modulo._count?.paginas || 0} {t('pagesCount')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => excluirModulo(modulo.id, e)}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 rounded-lg transition-all"
                    title={t('deleteModule')}
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              ))}
              {curso.modulos.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mx-auto mb-4">
                    <FolderOpen className="w-8 h-8 text-zinc-600" />
                  </div>
                  <p className="text-zinc-500 text-sm mb-3">{t('noModulesYet')}</p>
                  <p className="text-xs text-zinc-600">
                    {t('organizeContentByModules')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Área Central - Páginas e Conteúdo */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {moduloSelecionado ? (
            <>
              {/* Lista de Páginas */}
              <div className={`${paginaAmpliada ? 'hidden' : 'w-full lg:w-72'} shrink-0 border-b lg:border-b-0 lg:border-r border-zinc-800/50 bg-zinc-900/20 overflow-y-auto h-full`}>
                <div className="p-4 border-b border-zinc-800/50 bg-zinc-900/40">
                  <h2 className="font-bold text-white mb-1 text-lg">
                    {moduloSelecionado.nome}
                  </h2>
                  {moduloSelecionado.descricao && (
                    <p className="text-xs text-zinc-400 mb-3">{moduloSelecionado.descricao}</p>
                  )}
                  <Button
                    onClick={() => setModalPaginaAberto(true)}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/20 rounded-xl h-10"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="font-semibold">{t('newPage')}</span>
                  </Button>
                </div>
                <div className="p-4 space-y-2">
                  {moduloSelecionado.paginas?.map((pagina, index) => (
                    <div
                      key={pagina.id}
                      onClick={() => handleSelectPagina(pagina.id)}
                      className={`group relative cursor-pointer rounded-xl p-3 transition-all duration-200 ${paginaSelecionada?.id === pagina.id
                        ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-2 border-blue-500/30 shadow-lg shadow-blue-500/10'
                        : 'bg-zinc-800/30 hover:bg-zinc-800/50 border-2 border-transparent hover:border-zinc-700/50'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${paginaSelecionada?.id === pagina.id
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-zinc-700/50 text-zinc-400 group-hover:bg-zinc-700'
                            }`}
                        >
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs text-zinc-500 block mb-0.5">
                            {t('page')} {index + 1}
                          </span>
                          <span className="text-sm font-medium text-white truncate block">
                            {pagina.titulo}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => excluirPagina(pagina.id, e)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 rounded-lg transition-all"
                        title={t('deletePage')}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  ))}
                  {(!moduloSelecionado.paginas || moduloSelecionado.paginas.length === 0) && (
                    <div className="text-center py-12">
                      <div className="w-14 h-14 rounded-xl bg-zinc-800/50 flex items-center justify-center mx-auto mb-3">
                        <FileText className="w-7 h-7 text-zinc-600" />
                      </div>
                      <p className="text-zinc-500 text-sm mb-2">{t('noPages')}</p>
                      <p className="text-xs text-zinc-600">{t('createFirstPage')}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Visualizador/Editor de Página */}
              <div className="flex-1 overflow-y-auto bg-zinc-950/50">
                {paginaSelecionada ? (
                  <div className={`p-4 sm:p-8 mx-auto ${paginaAmpliada ? 'max-w-full lg:px-16' : 'max-w-5xl'}`}>
                    <div className="mb-6">
                      {editandoPagina ? (
                        <div className="space-y-4">
                          <Input
                            value={paginaSelecionada.titulo}
                            onChange={(e) =>
                              setPaginaSelecionada({
                                ...paginaSelecionada,
                                titulo: e.target.value,
                              })
                            }
                            className="text-3xl font-bold bg-zinc-900/50 border-zinc-700/50 text-white h-14 rounded-xl px-5"
                            placeholder={t('pageTitle')}
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => setPaginaAmpliada(!paginaAmpliada)}
                              variant="default"
                              className="border-zinc-700/50 hover:bg-zinc-800/50 rounded-xl"
                              title={paginaAmpliada ? t('reduceView') : t('expandView')}
                            >
                              {paginaAmpliada ? (
                                <Minimize2 className="w-4 h-4" />
                              ) : (
                                <Maximize2 className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              onClick={salvarPagina}
                              disabled={salvandoPagina}
                              className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 shadow-lg shadow-green-500/20 rounded-xl"
                            >
                              {salvandoPagina ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4 mr-2" />
                              )}
                              {salvandoPagina ? t('saving') : t('save')}
                            </Button>
                            <Button
                              variant="default"
                              onClick={() => {
                                setEditandoPagina(false);
                                carregarPagina(paginaSelecionada.id);
                              }}
                              className="border-zinc-700/50 hover:bg-zinc-800/50 rounded-xl"
                            >
                              <X className="w-4 h-4 mr-2" />
                              {t('cancel')}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-3">
                              <Sparkles className="w-3 h-3 text-blue-400" />
                              <span className="text-xs font-medium text-blue-400">
                                {t('courseContentBadge')}
                              </span>
                            </div>
                            <h1 className="text-4xl font-bold text-white mb-2">
                              {paginaSelecionada.titulo}
                            </h1>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => setPaginaAmpliada(!paginaAmpliada)}
                              variant="default"
                              className="border-zinc-700/50 hover:bg-zinc-800/50 rounded-xl"
                              title={paginaAmpliada ? t('reduceView') : t('expandView')}
                            >
                              {paginaAmpliada ? (
                                <Minimize2 className="w-4 h-4" />
                              ) : (
                                <Maximize2 className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              onClick={() => setEditandoPagina(true)}
                              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/20 rounded-xl"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              {t('edit')}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="bg-zinc-900/30 rounded-2xl border border-zinc-800/50 p-8">
                      {editandoPagina ? (
                        <RichTextEditor
                          content={paginaSelecionada.conteudo}
                          onChange={(content) =>
                            setPaginaSelecionada({ ...paginaSelecionada, conteudo: content })
                          }
                        />
                      ) : (
                        <>
                          <style jsx global>{`
                            .prose img {
                              max-width: 100%;
                              height: auto;
                              border-radius: 0.5rem;
                              margin: 1rem 0;
                              display: block;
                            }

                            .prose img[data-align="center"] {
                              margin-left: auto;
                              margin-right: auto;
                            }

                            .prose img[data-align="right"] {
                              margin-left: auto;
                              margin-right: 0;
                            }

                            .prose img[data-align="left"] {
                              margin-left: 0;
                              margin-right: auto;
                            }

                            /* Estilos para bullet points no modo de visualização */
                            .prose ul {
                              list-style-type: disc;
                              padding-left: 1.5em;
                              margin: 0.5em 0;
                            }

                            .prose ul li {
                              color: #d4d4d8;
                            }

                            .prose ul li::marker {
                              color: #a78bfa;
                            }

                            .prose ol {
                              list-style-type: decimal;
                              padding-left: 1.5em;
                              margin: 0.5em 0;
                            }

                            .prose ol li::marker {
                              color: #a78bfa;
                            }

                            /* Listas aninhadas */
                            .prose ul ul,
                            .prose ol ul {
                              list-style-type: circle;
                            }

                            .prose ul ul ul,
                            .prose ol ul ul,
                            .prose ul ol ul,
                            .prose ol ol ul {
                              list-style-type: square;
                            }

                            /* Indentação consistente para listas aninhadas */
                            .prose li > ul,
                            .prose li > ol {
                              margin-top: 0.25em;
                              margin-bottom: 0.25em;
                            }
                          `}</style>
                          <div
                            className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-zinc-300 prose-strong:text-white prose-a:text-blue-400"
                            dangerouslySetInnerHTML={{ __html: paginaSelecionada.conteudo }}
                          />
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-24 h-24 rounded-2xl bg-zinc-800/50 flex items-center justify-center mx-auto mb-6">
                        <FileText className="w-12 h-12 text-zinc-600" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {t('selectPage')}
                      </h3>
                      <p className="text-zinc-500">{t('selectPageToView')}</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                  <FolderOpen className="w-12 h-12 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{t('selectModule')}</h3>
                <p className="text-zinc-500">{t('selectModuleToStudy')}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Novo Módulo */}
      <Dialog open={modalModuloAberto} onOpenChange={handleFecharModalModulo}>
        <DialogContent className="bg-zinc-900 border-zinc-800 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Criar Novo Módulo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nome-modulo" className="text-zinc-300 font-medium">
                Nome do Módulo
              </Label>
              <Input
                id="nome-modulo"
                value={novoModulo.nome}
                onChange={(e) => setNovoModulo({ ...novoModulo, nome: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white mt-2 h-11 rounded-xl"
                placeholder="Ex: Introdução ao JavaScript"
              />
            </div>
            <div>
              <Label htmlFor="descricao-modulo" className="text-zinc-300 font-medium">
                Descrição (opcional)
              </Label>
              <Input
                id="descricao-modulo"
                value={novoModulo.descricao}
                onChange={(e) => setNovoModulo({ ...novoModulo, descricao: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white mt-2 h-11 rounded-xl"
                placeholder="Ex: Conceitos básicos da linguagem"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="default"
                onClick={() => handleFecharModalModulo(false)}
                className="flex-1 border-zinc-700 hover:bg-zinc-800 rounded-xl h-11"
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={criarModulo}
                disabled={!novoModulo.nome || criandoModulo}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 rounded-xl h-11"
              >
                {criandoModulo ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('saving')}
                  </>
                ) : (
                  t('createModule')
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Nova Página */}
      <Dialog open={modalPaginaAberto} onOpenChange={handleFecharModalPagina}>
        <DialogContent className="bg-zinc-900 border-zinc-800 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Criar Nova Página</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="titulo-pagina" className="text-zinc-300 font-medium">
                Título da Página
              </Label>
              <Input
                id="titulo-pagina"
                value={novaPagina.titulo}
                onChange={(e) => setNovaPagina({ ...novaPagina, titulo: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white mt-2 h-11 rounded-xl"
                placeholder="Ex: Variáveis e Tipos de Dados"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="default"
                onClick={() => handleFecharModalPagina(false)}
                className="flex-1 border-zinc-700 hover:bg-zinc-800 rounded-xl h-11"
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={criarPagina}
                disabled={!novaPagina.titulo || criandoPagina}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 rounded-xl h-11"
              >
                {criandoPagina ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('saving')}
                  </>
                ) : (
                  t('createPage')
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmar Exclusão de Curso */}
      <ConfirmModal
        open={modalExcluirCurso}
        onClose={() => setModalExcluirCurso(false)}
        onConfirm={confirmarExcluirCurso}
        title="Excluir Curso"
        description="Tem certeza que deseja excluir este curso? Todos os módulos, páginas e anotações serão excluídos permanentemente. Esta ação não pode ser desfeita."
        confirmText="Excluir Curso"
        cancelText="Cancelar"
        variant="danger"
      />

      {/* Modal Confirmar Exclusão de Módulo */}
      <ConfirmModal
        open={modalExcluirModulo}
        onClose={() => {
          setModalExcluirModulo(false);
          setItemParaExcluir(null);
        }}
        onConfirm={confirmarExcluirModulo}
        title="Excluir Módulo"
        description="Tem certeza que deseja excluir este módulo? Todas as páginas dentro dele serão excluídas permanentemente. Esta ação não pode ser desfeita."
        confirmText="Excluir Módulo"
        cancelText="Cancelar"
        variant="danger"
      />

      {/* Modal Confirmar Exclusão de Página */}
      <ConfirmModal
        open={modalExcluirPagina}
        onClose={() => {
          setModalExcluirPagina(false);
          setItemParaExcluir(null);
        }}
        onConfirm={confirmarExcluirPagina}
        title={t('deletePage')}
        description={t('deletePageConfirmation')}
        confirmText={t('deletePage')}
        cancelText={t('cancel')}
        variant="danger"
      />

      {/* Modal Confirmar Saída do Módulo */}
      <ConfirmModal
        open={modalConfirmarSaidaModulo}
        onClose={() => setModalConfirmarSaidaModulo(false)}
        onConfirm={confirmarFecharModulo}
        title={t('unsavedChangesTitle')}
        description={t('unsavedChangesDescription')}
        confirmText={t('discardChanges')}
        cancelText={t('continueEditing')}
        variant="warning"
      />

      {/* Modal Confirmar Saída da Página */}
      <ConfirmModal
        open={modalConfirmarSaidaPagina}
        onClose={() => setModalConfirmarSaidaPagina(false)}
        onConfirm={confirmarFecharPagina}
        title={t('unsavedChangesTitle')}
        description={t('unsavedChangesDescription')}
        confirmText={t('discardChanges')}
        cancelText={t('continueEditing')}
        variant="warning"
      />

      {/* Modal Confirmar Saída da Edição de Página */}
      <ConfirmModal
        open={modalConfirmarSaidaEdicao}
        onClose={() => {
          setModalConfirmarSaidaEdicao(false);
          setNavegacaoPendente(null);
        }}
        onConfirm={confirmarNavegacao}
        title={t('unsavedChangesTitle')}
        description={t('unsavedChangesDescriptionPage')}
        confirmText={t('discardChanges')}
        cancelText={t('continueEditing')}
        variant="warning"
      />
    </div>
  );
}
