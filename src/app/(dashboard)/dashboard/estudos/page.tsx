'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/lib/auth-mock';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Plus, Search, StickyNote, FileText, ChevronRight, Edit, Trash2, Sparkles, Loader2, Crown, Mic, FileAudio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { UpgradeToPremiumModal } from '@/components/planos/UpgradeToPremiumModal';
import { verificarAcessoRecurso } from '@/lib/planos-helper';
import { RecursoPremium, PlanoUsuario } from '@/types/planos';
import { useTranslations } from 'next-intl';
import { AudioRecorder } from '@/components/estudos/AudioRecorder';
import { AudioPlayer } from '@/components/estudos/AudioPlayer';
import { PageHeader } from '@/components/ui/PageHeader';

interface Curso {
  id: string;
  nome: string;
  descricao?: string;
  cor: string;
  icone: string;
  _count?: {
    modulos: number;
    anotacoes: number;
  };
}

interface Anotacao {
  id: string;
  titulo: string;
  conteudo: string;
  cor: string;
  tipoOrigem?: string;
  audioUrl?: string;
  audioDuracao?: number;
  transcricaoOriginal?: string;
  curso?: {
    id: string;
    nome: string;
    cor: string;
  };
  createdAt: string;
}

export default function EstudosPage() {
  const { data: session } = useSession();
  const t = useTranslations('studies');
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [anotacoes, setAnotacoes] = useState<Anotacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalCursoAberto, setModalCursoAberto] = useState(false);
  const [modalAnotacaoAberto, setModalAnotacaoAberto] = useState(false);
  const [modalConfirmarSaidaCurso, setModalConfirmarSaidaCurso] = useState(false);
  const [modalConfirmarSaidaAnotacao, setModalConfirmarSaidaAnotacao] = useState(false);
  const [modalVisualizarAnotacao, setModalVisualizarAnotacao] = useState(false);
  const [modalExcluirAnotacao, setModalExcluirAnotacao] = useState(false);
  const [anotacaoSelecionada, setAnotacaoSelecionada] = useState<Anotacao | null>(null);
  const [editandoAnotacao, setEditandoAnotacao] = useState(false);
  const [buscaAtiva, setBuscaAtiva] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState<any>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const carregarCursosEAnots = async () => {
    try {
      setLoading(true);
      const [resCursos, resAnots] = await Promise.all([
        fetch('/api/estudos'),
        fetch('/api/estudos/anotacoes')
      ]);

      if (resCursos.ok && resAnots.ok) {
        const jsonCursos = await resCursos.json();
        const jsonAnots = await resAnots.json();
        const apiCursos = jsonCursos.data || [];
        const apiAnots = jsonAnots.data || [];

        setCursos(apiCursos);

        const anotacoesComCurso = apiAnots.map((anot: any) => {
          const cursoInfo = anot.cursoId ? apiCursos.find((c: any) => c.id === anot.cursoId) : null;
          return {
            ...anot,
            createdAt: anot.dataCriacao,
            curso: cursoInfo ? {
              id: cursoInfo.id,
              nome: cursoInfo.nome,
              cor: cursoInfo.cor
            } : undefined
          };
        });
        setAnotacoes(anotacoesComCurso);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarCursosEAnots();
  }, []);

  // Verificar se o usuário é premium
  const plano = (session?.user?.plano as PlanoUsuario) || PlanoUsuario.FREE;
  const rawExpires = (session?.user as any)?.planoExpiraEm;
  const planoExpiraEm = rawExpires ? new Date(rawExpires) : undefined;
  const acessoRecurso = verificarAcessoRecurso(plano, planoExpiraEm, RecursoPremium.GERAR_RESENHA_IA);
  const isPremium = acessoRecurso.temAcesso;

  const [novoCurso, setNovoCurso] = useState({
    nome: '',
    descricao: '',
    cor: '#10B981',
  });

  const [novaAnotacao, setNovaAnotacao] = useState({
    titulo: '',
    conteudo: '',
    cor: '#FBBF24',
  });

  // Estados para anotação com IA
  const [tipoAnotacao, setTipoAnotacao] = useState<'livre' | 'ia' | 'audio'>('livre');
  const [formatoAnotacao, setFormatoAnotacao] = useState<'padrao' | 'notion'>('padrao');
  const [textoOriginalIA, setTextoOriginalIA] = useState('');
  const [anotacaoGeradaIA, setAnotacaoGeradaIA] = useState<{ title: string; content: string } | null>(null);
  const [gerandoAnotacao, setGerandoAnotacao] = useState(false);
  const [erroIA, setErroIA] = useState<string | null>(null);

  // Estados para anotação por áudio
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioDuracao, setAudioDuracao] = useState(0);
  const [uploadandoAudio, setUploadandoAudio] = useState(false);
  const [processandoAudio, setProcessandoAudio] = useState(false);
  const [erroAudio, setErroAudio] = useState<string | null>(null);
  const [mostrarTranscricao, setMostrarTranscricao] = useState(false);

  // Estados de loading para evitar múltiplos cliques (BUG-002)
  const [criandoCurso, setCriandoCurso] = useState(false);
  const [criandoAnotacao, setCriandoAnotacao] = useState(false);
  const [editandoAnotacaoLoading, setEditandoAnotacaoLoading] = useState(false);
  const [excluindoAnotacao, setExcluindoAnotacao] = useState(false);

  // API Calls replaced with Dexie Hooks above

  const criarCurso = async () => {
    if (criandoCurso) return;

    setCriandoCurso(true);
    try {
      const res = await fetch('/api/estudos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoCurso)
      });

      if (res.ok) {
        carregarCursosEAnots();
      }

      setModalCursoAberto(false);
      setNovoCurso({ nome: '', descricao: '', cor: '#10B981' });
    } catch (error) {
      console.error('Erro ao criar curso:', error);
    } finally {
      setCriandoCurso(false);
    }
  };

  const criarAnotacao = async () => {
    if (criandoAnotacao) return;

    setCriandoAnotacao(true);
    try {
      const dadosAnotacao = tipoAnotacao === 'ia' && anotacaoGeradaIA
        ? { titulo: anotacaoGeradaIA.title, conteudo: anotacaoGeradaIA.content, cor: novaAnotacao.cor }
        : novaAnotacao;

      const res = await fetch('/api/estudos/anotacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...dadosAnotacao, cursoId: null, moduloId: null })
      });

      if (res.ok) {
        carregarCursosEAnots();
      }

      fecharModalAnotacao();
    } catch (error) {
      console.error('Erro ao criar anotação:', error);
    } finally {
      setCriandoAnotacao(false);
    }
  };

  const gerarAnotacaoComIA = async () => {
    // Verificar se o usuário tem acesso ao recurso
    if (!isPremium) {
      setShowUpgradeModal(true);
      return;
    }

    if (!textoOriginalIA.trim()) return;

    setGerandoAnotacao(true);
    setErroIA(null);

    try {
      const response = await fetch('/api/generate-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: textoOriginalIA, formato: formatoAnotacao }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Se for erro 403, mostrar modal de upgrade
        if (response.status === 403) {
          setShowUpgradeModal(true);
          return;
        }
        throw new Error(data.error || 'Erro ao gerar anotação');
      }

      setAnotacaoGeradaIA({ title: data.title, content: data.content });
    } catch (error) {
      console.error('Erro ao gerar anotação com IA:', error);
      setErroIA(error instanceof Error ? error.message : 'Erro ao gerar anotação');
    } finally {
      setGerandoAnotacao(false);
    }
  };

  const handleAnotacaoComIAClick = () => {
    if (!isPremium) {
      setShowUpgradeModal(true);
      return;
    }
    setTipoAnotacao('ia');
  };

  const handleAudioRecordingComplete = (blob: Blob, duration: number) => {
    setAudioBlob(blob);
    setAudioDuracao(duration);
    setErroAudio(null);
  };

  const processarAudioGravado = async () => {
    if (!audioBlob || processandoAudio) return;

    // Verificar se o usuário tem acesso ao recurso premium
    if (!isPremium) {
      setShowUpgradeModal(true);
      return;
    }

    setUploadandoAudio(true);
    setProcessandoAudio(false);
    setErroAudio(null);

    try {
      // 1. Fazer upload do áudio para Vercel Blob
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('duration', audioDuracao.toString());

      const uploadResponse = await fetch('/api/v1/estudos/anotacoes/audio/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Erro ao fazer upload do áudio');
      }

      const uploadData = await uploadResponse.json();
      setUploadandoAudio(false);
      setProcessandoAudio(true);

      // 2. Processar o áudio com Gemini
      const processResponse = await fetch('/api/v1/estudos/anotacoes/audio/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioUrl: uploadData.url,
          audioDuracao,
          formato: formatoAnotacao,
          cor: novaAnotacao.cor,
        }),
      });

      if (!processResponse.ok) {
        const errorData = await processResponse.json();
        if (processResponse.status === 403) {
          setShowUpgradeModal(true);
          return;
        }
        throw new Error(errorData.error || 'Erro ao processar áudio');
      }

      // 3. Anotação criada com sucesso - capturar e abrir modal de visualização
      const processData = await processResponse.json();
      fecharModalAnotacao();

      // Abrir modal da anotação gerada
      if (processData.data) {
        setAnotacaoSelecionada(processData.data);
      }
    } catch (error) {
      console.error('Erro ao processar áudio:', error);
      setErroAudio(error instanceof Error ? error.message : 'Erro ao processar áudio');
    } finally {
      setUploadandoAudio(false);
      setProcessandoAudio(false);
    }
  };

  const descartarAudioGravado = () => {
    setAudioBlob(null);
    setAudioDuracao(0);
    setErroAudio(null);
  };

  // Verificar se o modal de curso tem dados não salvos
  const isCursoDirty = novoCurso.nome.length > 0 || novoCurso.descricao.length > 0;

  // Verificar se o modal de anotação tem dados não salvos
  const isAnotacaoDirty =
    novaAnotacao.titulo.length > 0 ||
    novaAnotacao.conteudo.length > 0 ||
    textoOriginalIA.length > 0 ||
    anotacaoGeradaIA !== null ||
    audioBlob !== null;

  const handleFecharModalCurso = (open: boolean) => {
    if (!open && isCursoDirty) {
      setModalConfirmarSaidaCurso(true);
    } else {
      setModalCursoAberto(open);
    }
  };

  const confirmarFecharCurso = () => {
    setModalConfirmarSaidaCurso(false);
    setModalCursoAberto(false);
    setNovoCurso({ nome: '', descricao: '', cor: '#10B981' });
  };

  const handleFecharModalAnotacao = (open: boolean) => {
    if (!open && isAnotacaoDirty) {
      setModalConfirmarSaidaAnotacao(true);
    } else if (!open) {
      fecharModalAnotacao();
    } else {
      setModalAnotacaoAberto(open);
    }
  };

  const fecharModalAnotacao = () => {
    setModalAnotacaoAberto(false);
    setNovaAnotacao({ titulo: '', conteudo: '', cor: '#FBBF24' });
    setTipoAnotacao('livre');
    setFormatoAnotacao('padrao');
    setTextoOriginalIA('');
    setAnotacaoGeradaIA(null);
    setErroIA(null);
    // Limpar estados de áudio
    setAudioBlob(null);
    setAudioDuracao(0);
    setErroAudio(null);
    setUploadandoAudio(false);
    setProcessandoAudio(false);
  };

  const confirmarFecharAnotacao = () => {
    setModalConfirmarSaidaAnotacao(false);
    fecharModalAnotacao();
  };

  const buscarConteudo = async (query: string) => {
    if (query.trim().length < 2) {
      setResultadosBusca(null);
      return;
    }

    try {
      const termoLovercase = query.toLowerCase();

      const cursosEncontrados = cursos.filter(c =>
        c.nome.toLowerCase().includes(termoLovercase) ||
        (c.descricao?.toLowerCase().includes(termoLovercase) ?? false)
      );

      const anotacoesEncontradas = anotacoes.filter(a =>
        a.titulo.toLowerCase().includes(termoLovercase) ||
        a.conteudo.toLowerCase().includes(termoLovercase)
      );

      // Mapear anotacoes para o formato esperado pelo frontend (paginas)
      const paginasMapeadas = anotacoesEncontradas.map((anotacao) => {
        let cursoNome = 'Anotação Avulsa';
        if (anotacao.curso) {
          cursoNome = anotacao.curso.nome;
        }

        return {
          id: anotacao.id,
          titulo: anotacao.titulo,
          modulo: { curso: { nome: cursoNome } }
        };
      });

      setResultadosBusca({
        cursos: cursosEncontrados,
        paginas: paginasMapeadas,
        total: cursosEncontrados.length + paginasMapeadas.length
      });
    } catch (error) {
      console.error('Erro ao buscar:', error);
    }
  };

  const abrirAnotacao = (anotacao: Anotacao) => {
    setAnotacaoSelecionada(anotacao);
    setEditandoAnotacao(false);
    setMostrarTranscricao(false);
    setModalVisualizarAnotacao(true);
  };

  const editarAnotacao = async () => {
    if (!anotacaoSelecionada || editandoAnotacaoLoading) return;

    setEditandoAnotacaoLoading(true);
    try {
      const res = await fetch('/api/estudos/anotacoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: anotacaoSelecionada.id,
          titulo: anotacaoSelecionada.titulo,
          conteudo: anotacaoSelecionada.conteudo
        })
      });

      if (res.ok) {
        carregarCursosEAnots();
      }

      setEditandoAnotacao(false);
      setModalVisualizarAnotacao(false);
      setAnotacaoSelecionada(null);
    } catch (error) {
      console.error('Erro ao editar anotação:', error);
    } finally {
      setEditandoAnotacaoLoading(false);
    }
  };

  const excluirAnotacao = async () => {
    if (!anotacaoSelecionada) return;
    setModalExcluirAnotacao(true);
  };

  const confirmarExcluirAnotacao = async () => {
    if (!anotacaoSelecionada || excluindoAnotacao) return;

    setExcluindoAnotacao(true);
    try {
      const res = await fetch(`/api/estudos/anotacoes?id=${anotacaoSelecionada.id}`, { method: 'DELETE' });

      if (res.ok) {
        carregarCursosEAnots();
      }

      setModalVisualizarAnotacao(false);
      setModalExcluirAnotacao(false);
      setAnotacaoSelecionada(null);
    } catch (error) {
      console.error('Erro ao excluir anotação:', error);
    } finally {
      setExcluindoAnotacao(false);
    }
  };

  const cores = [
    '#10B981', '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
    '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#84CC16'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-zinc-500 uppercase tracking-widest animate-pulse">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-6 overflow-hidden">
      {/* Header */}
      <PageHeader 
        title={t('pageTitle')}
        description={t('subtitle')}
        action={
          <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
            <Button
              onClick={() => setBuscaAtiva(!buscaAtiva)}
              variant="outline"
              className="flex-1 sm:flex-none"
            >
              <Search className="w-4 h-4 mr-2" />
              <span className="hidden xs:inline">{t('search')}</span>
            </Button>
            <Button
              onClick={() => setModalAnotacaoAberto(true)}
              variant="outline"
              className="flex-1 sm:flex-none"
            >
              <StickyNote className="w-4 h-4 mr-2" />
              <span className="hidden xs:inline">{t('newNote')}</span>
            </Button>
            <Button
              onClick={() => setModalCursoAberto(true)}
              variant="premium"
              className="flex-1 sm:flex-none"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden xs:inline">{t('newCourse')}</span>
            </Button>
          </div>
        }
      />

      {/* Busca */}
      {buscaAtiva && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <Input
              placeholder={t('searchPlaceholder')}
              autoComplete="off"
              value={termoBusca}
              onChange={(e) => {
                setTermoBusca(e.target.value);
                buscarConteudo(e.target.value);
              }}
              className="bg-zinc-800 border-zinc-700"
            />
            {resultadosBusca && (
              <div className="mt-4 space-y-4">
                {resultadosBusca.total === 0 ? (
                  <p className="text-zinc-500 text-center py-4">{t('noResults')}</p>
                ) : (
                  <>
                    {resultadosBusca.cursos.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-400 mb-2">{t('courses')}</h3>
                        {resultadosBusca.cursos.map((curso: any) => (
                          <div
                            key={curso.id}
                            className="p-3 bg-zinc-800 rounded-lg hover:bg-zinc-750 cursor-pointer"
                            onClick={() => window.location.href = `/dashboard/estudos/${curso.id}`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: curso.cor }} />
                              <span className="text-white font-medium">{curso.nome}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {resultadosBusca.paginas.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-400 mb-2">{t('pages')}</h3>
                        {resultadosBusca.paginas.map((pagina: any) => (
                          <div
                            key={pagina.id}
                            className="p-3 bg-zinc-800 rounded-lg hover:bg-zinc-750 cursor-pointer"
                          >
                            <p className="text-white font-medium">{pagina.titulo}</p>
                            <p className="text-sm text-zinc-400">{pagina.modulo.curso.nome}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="border border-zinc-800/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              {t('totalCourses')}
            </CardTitle>
            <BookOpen className="w-4 h-4 text-emerald-500/50" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white leading-none">{cursos.length}</div>
          </CardContent>
        </Card>

        <Card className="border border-zinc-800/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              {t('totalModules')}
            </CardTitle>
            <FileText className="w-4 h-4 text-blue-500/50" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white leading-none">
              {cursos.reduce((acc, c) => acc + (c._count?.modulos || 0), 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-zinc-800/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              {t('totalNotes')}
            </CardTitle>
            <StickyNote className="w-4 h-4 text-yellow-500/50" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white leading-none">{anotacoes.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Cursos */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">{t('myCourses')}</h2>
        {cursos.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6 sm:p-8 text-center">
              <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-zinc-600 mx-auto mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-zinc-400 mb-3 sm:mb-4">{t('noCoursesYet')}</p>
              <Button
                onClick={() => setModalCursoAberto(true)}
                className="bg-green-600 hover:bg-green-700 h-auto py-2.5 text-sm sm:text-base"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('createFirstCourse')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cursos.map((curso) => (
              <Card
                key={curso.id}
                className="border border-zinc-800/50 hover:border-emerald-500/30 cursor-pointer transition-all hover:bg-zinc-900/60 group"
                onClick={() => window.location.href = `/dashboard/estudos/${curso.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center border border-current/20"
                        style={{ backgroundColor: curso.cor + '10', color: curso.cor }}
                      >
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-white text-lg group-hover:text-emerald-400 transition-colors">{curso.nome}</CardTitle>
                        {curso.descricao && (
                          <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{curso.descricao}</p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-700 group-hover:text-emerald-500 transition-colors" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                    <div>
                      <span className="text-zinc-400">{curso._count?.modulos || 0}</span> {t('modules')}
                    </div>
                    <div>
                      <span className="text-zinc-400">{curso._count?.anotacoes || 0}</span> {t('notes')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Anotações Recentes */}
      {anotacoes.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">{t('recentNotes')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {anotacoes.slice(0, 6).map((anotacao) => (
              <Card
                key={anotacao.id}
                className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors"
                onClick={() => abrirAnotacao(anotacao)}
              >
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: anotacao.cor + '20', color: anotacao.cor }}
                    >
                      <StickyNote className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-white text-base truncate">
                        {anotacao.titulo}
                      </CardTitle>
                      {anotacao.curso && (
                        <p className="text-xs text-zinc-500 mt-1">{anotacao.curso.nome}</p>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Modal Novo Curso */}
      <Dialog open={modalCursoAberto} onOpenChange={handleFecharModalCurso}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">{t('newCourseTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nome" className="text-zinc-300">{t('courseName')}</Label>
              <Input
                id="nome"
                autoComplete="off"
                value={novoCurso.nome}
                onChange={(e) => setNovoCurso({ ...novoCurso, nome: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white mt-1"
                placeholder={t('courseNamePlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="descricao" className="text-zinc-300">{t('descriptionOptional')}</Label>
              <Input
                id="descricao"
                autoComplete="off"
                value={novoCurso.descricao}
                onChange={(e) => setNovoCurso({ ...novoCurso, descricao: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white mt-1"
                placeholder={t('descriptionPlaceholder')}
              />
            </div>
            <div>
              <Label className="text-zinc-300">{t('color')}</Label>
              <div className="flex gap-2 mt-2">
                {cores.map((cor) => (
                  <button
                    key={cor}
                    onClick={() => setNovoCurso({ ...novoCurso, cor })}
                    className={`w-8 h-8 rounded-full ${novoCurso.cor === cor ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : ''
                      }`}
                    style={{ backgroundColor: cor }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="default"
                onClick={() => handleFecharModalCurso(false)}
                className="border-zinc-700"
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={criarCurso}
                disabled={!novoCurso.nome || criandoCurso}
                className="bg-green-600 hover:bg-green-700"
              >
                {criandoCurso ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('creating')}
                  </>
                ) : (
                  t('createCourse')
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Nova Anotação */}
      <Dialog open={modalAnotacaoAberto} onOpenChange={handleFecharModalAnotacao}>
        <DialogContent className={`bg-zinc-900 border-zinc-800 text-white p-6 transition-all ${tipoAnotacao === 'ia' ? 'max-w-4xl' : tipoAnotacao === 'audio' ? 'max-w-lg' : 'max-w-xl'}`}>
          <DialogHeader>
            <DialogTitle>{t('newNoteTitle')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-1">
            {/* Seletor de modo de anotação */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setTipoAnotacao('livre')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${tipoAnotacao === 'livre'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                  }`}
              >
                <FileText className="w-4 h-4" />
                Escrever
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isPremium) {
                    setShowUpgradeModal(true);
                    return;
                  }
                  setTipoAnotacao('ia');
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${tipoAnotacao === 'ia'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                  }`}
              >
                <Sparkles className="w-4 h-4" />
                Texto + IA
                {!isPremium && <Crown className="w-3 h-3 text-yellow-400" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isPremium) {
                    setShowUpgradeModal(true);
                    return;
                  }
                  setTipoAnotacao('audio');
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${tipoAnotacao === 'audio'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                  }`}
              >
                <Mic className="w-4 h-4" />
                Gravar
                {!isPremium && <Crown className="w-3 h-3 text-yellow-400" />}
              </button>
            </div>

            {/* Título - apenas para modo livre e ia */}
            {tipoAnotacao !== 'audio' && (
              <>
                <input
                  type="text"
                  value={tipoAnotacao === 'ia' && anotacaoGeradaIA ? anotacaoGeradaIA.title : novaAnotacao.titulo}
                  onChange={(e) => {
                    if (tipoAnotacao === 'ia' && anotacaoGeradaIA) {
                      setAnotacaoGeradaIA({ ...anotacaoGeradaIA, title: e.target.value });
                    } else {
                      setNovaAnotacao({ ...novaAnotacao, titulo: e.target.value });
                    }
                  }}
                  placeholder={t('titlePlaceholder')}
                  className="w-full bg-transparent border-none text-white text-lg font-medium placeholder:text-zinc-500 focus:outline-none focus:ring-0 py-2"
                  autoFocus
                />
                <div className="border-t border-zinc-800" />
              </>
            )}

            <div className="space-y-0.5">
              {/* Conteúdo - modo livre */}
              {tipoAnotacao === 'livre' && (
                <div className="flex items-start gap-3 py-2.5 px-1 hover:bg-zinc-800/30 rounded-lg transition-colors">
                  <FileText className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
                  <textarea
                    value={novaAnotacao.conteudo}
                    onChange={(e) => setNovaAnotacao({ ...novaAnotacao, conteudo: e.target.value })}
                    placeholder={t('contentPlaceholder')}
                    rows={4}
                    className="flex-1 bg-transparent border-none text-sm text-white placeholder:text-zinc-500 focus:outline-none resize-none"
                  />
                </div>
              )}

              {/* Conteúdo - modo áudio */}
              {tipoAnotacao === 'audio' && (
                <div className="py-4">
                  {erroAudio && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                      {erroAudio}
                    </div>
                  )}

                  {/* Seletor de formato */}
                  <div className="flex items-center gap-3 py-2.5 px-1 mb-4 bg-zinc-800/30 rounded-lg">
                    <FileText className="w-5 h-5 text-zinc-400 shrink-0" />
                    <div className="flex items-center justify-between flex-1">
                      <span className="text-sm text-zinc-300">Formato da anotação</span>
                      <select
                        value={formatoAnotacao}
                        onChange={(e) => setFormatoAnotacao(e.target.value as 'padrao' | 'notion')}
                        disabled={uploadandoAudio || processandoAudio}
                        className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-green-500 cursor-pointer"
                      >
                        <option value="padrao">Padrão</option>
                        <option value="notion">Notion (Markdown)</option>
                      </select>
                    </div>
                  </div>

                  {/* Gravador ou status de processamento */}
                  {uploadandoAudio || processandoAudio ? (
                    <div className="flex flex-col items-center gap-4 py-8">
                      <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
                      <div className="text-center">
                        <p className="text-white font-medium">
                          {uploadandoAudio ? 'Enviando áudio...' : 'Transcrevendo e organizando...'}
                        </p>
                        <p className="text-sm text-zinc-400 mt-1">
                          {uploadandoAudio
                            ? 'Aguarde enquanto o áudio é enviado'
                            : 'A IA está transcrevendo e criando sua anotação'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <AudioRecorder
                      onRecordingComplete={handleAudioRecordingComplete}
                      maxDuration={2700}
                      disabled={uploadandoAudio || processandoAudio}
                    />
                  )}

                  {/* Cor da anotação */}
                  {!uploadandoAudio && !processandoAudio && (
                    <div className="flex items-center gap-3 py-2.5 px-1 mt-4 bg-zinc-800/30 rounded-lg">
                      <div
                        className="w-5 h-5 rounded-full shrink-0"
                        style={{ backgroundColor: novaAnotacao.cor }}
                      />
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {cores.map((cor) => (
                          <button
                            key={cor}
                            type="button"
                            onClick={() => setNovaAnotacao({ ...novaAnotacao, cor })}
                            className={`w-6 h-6 rounded-full transition-all ${novaAnotacao.cor === cor ? 'ring-2 ring-white ring-offset-1 ring-offset-zinc-900' : 'opacity-60 hover:opacity-100'
                              }`}
                            style={{ backgroundColor: cor }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Conteúdo - modo IA com duas colunas */}
              {tipoAnotacao === 'ia' && (
                <>
                  {/* Seletor de formato */}
                  <div className="flex items-center gap-3 py-2.5 px-1 hover:bg-zinc-800/30 rounded-lg transition-colors">
                    <FileText className="w-5 h-5 text-zinc-400 shrink-0" />
                    <div className="flex items-center justify-between flex-1">
                      <span className="text-sm text-zinc-300">{t('outputFormat')}</span>
                      <select
                        value={formatoAnotacao}
                        onChange={(e) => setFormatoAnotacao(e.target.value as 'padrao' | 'notion')}
                        disabled={gerandoAnotacao}
                        className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-green-500 cursor-pointer"
                      >
                        <option value="padrao">{t('formatDefault')}</option>
                        <option value="notion">{t('formatNotion')}</option>
                      </select>
                    </div>
                  </div>

                  {erroIA && (
                    <div className="mx-1 p-2 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                      {erroIA}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2.5 px-1">
                    {/* Coluna esquerda - Texto de entrada */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-xs font-medium">{t('rawText')}</span>
                      </div>
                      <textarea
                        value={textoOriginalIA}
                        onChange={(e) => setTextoOriginalIA(e.target.value)}
                        placeholder={t('rawTextPlaceholder')}
                        className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-green-500 resize-none min-h-[200px]"
                        disabled={gerandoAnotacao}
                      />
                    </div>

                    {/* Coluna direita - Texto de saída */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <FileText className="w-4 h-4" />
                        <span className="text-xs font-medium">{t('structuredNote')}</span>
                      </div>
                      {anotacaoGeradaIA ? (
                        <textarea
                          value={anotacaoGeradaIA.content}
                          onChange={(e) => setAnotacaoGeradaIA({ ...anotacaoGeradaIA, content: e.target.value })}
                          placeholder={t('generatedContent')}
                          className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-green-500 resize-none min-h-[200px]"
                        />
                      ) : (
                        <div className="w-full bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-3 min-h-[200px] flex items-center justify-center">
                          <p className="text-sm text-zinc-500 italic text-center">
                            {t('structuredNotePreview')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Cor - apenas para modo livre e ia */}
              {tipoAnotacao !== 'audio' && (
                <div className="flex items-center gap-3 py-2.5 px-1 hover:bg-zinc-800/30 rounded-lg transition-colors">
                  <div
                    className="w-5 h-5 rounded-full shrink-0"
                    style={{ backgroundColor: novaAnotacao.cor }}
                  />
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {cores.map((cor) => (
                      <button
                        key={cor}
                        type="button"
                        onClick={() => setNovaAnotacao({ ...novaAnotacao, cor })}
                        className={`w-6 h-6 rounded-full transition-all ${novaAnotacao.cor === cor ? 'ring-2 ring-white ring-offset-1 ring-offset-zinc-900' : 'opacity-60 hover:opacity-100'
                          }`}
                        style={{ backgroundColor: cor }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800 mt-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleFecharModalAnotacao(false)}
                className="px-4 h-9 text-sm text-zinc-400 hover:text-white"
                disabled={criandoAnotacao || gerandoAnotacao || uploadandoAudio || processandoAudio}
              >
                {t('cancel')}
              </Button>

              {/* Botão para modo áudio */}
              {tipoAnotacao === 'audio' && audioBlob && !uploadandoAudio && !processandoAudio && (
                <Button
                  type="button"
                  onClick={processarAudioGravado}
                  className="px-6 h-9 text-sm bg-green-600 hover:bg-green-700 text-white rounded-full font-medium"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Transcrever e criar anotação
                </Button>
              )}

              {/* Botão para modo IA */}
              {tipoAnotacao === 'ia' && !anotacaoGeradaIA ? (
                <Button
                  type="button"
                  onClick={gerarAnotacaoComIA}
                  disabled={!textoOriginalIA.trim() || gerandoAnotacao}
                  className="px-6 h-9 text-sm bg-green-600 hover:bg-green-700 text-white rounded-full font-medium"
                >
                  {gerandoAnotacao ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('organizing')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      {t('organize')}
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={criarAnotacao}
                  disabled={
                    (tipoAnotacao === 'livre' && !novaAnotacao.titulo) ||
                    (tipoAnotacao === 'ia' && anotacaoGeradaIA && !anotacaoGeradaIA.title) ||
                    criandoAnotacao
                  }
                  className="px-6 h-9 text-sm bg-green-600 hover:bg-green-700 text-white rounded-full font-medium"
                >
                  {criandoAnotacao ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('creating')}
                    </>
                  ) : (
                    t('createNote')
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Visualizar/Editar Anotação */}
      <Dialog open={modalVisualizarAnotacao} onOpenChange={setModalVisualizarAnotacao}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl h-[85vh] max-h-[600px] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-white">
              {editandoAnotacao ? t('editNote') : t('viewNote')}
            </DialogTitle>
          </DialogHeader>
          {anotacaoSelecionada && (
            <div className="flex flex-col flex-1 min-h-0">
              {editandoAnotacao ? (
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    <div>
                      <Label htmlFor="titulo-editar" className="text-zinc-300">{t('title')}</Label>
                      <Input
                        id="titulo-editar"
                        autoComplete="off"
                        value={anotacaoSelecionada.titulo}
                        onChange={(e) =>
                          setAnotacaoSelecionada({ ...anotacaoSelecionada, titulo: e.target.value })
                        }
                        className="bg-zinc-800 border-zinc-700 text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="conteudo-editar" className="text-zinc-300">{t('content')}</Label>
                      <textarea
                        id="conteudo-editar"
                        autoComplete="off"
                        value={anotacaoSelecionada.conteudo}
                        onChange={(e) =>
                          setAnotacaoSelecionada({ ...anotacaoSelecionada, conteudo: e.target.value })
                        }
                        className="w-full bg-zinc-800 border-zinc-700 text-white mt-1 rounded-md p-3 min-h-[200px] border resize-none"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-300">{t('color')}</Label>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {cores.map((cor) => (
                          <button
                            key={cor}
                            onClick={() => setAnotacaoSelecionada({ ...anotacaoSelecionada, cor })}
                            className={`w-8 h-8 rounded-full ${anotacaoSelecionada.cor === cor ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : ''
                              }`}
                            style={{ backgroundColor: cor }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-4 flex-shrink-0 border-t border-zinc-800 mt-4">
                    <Button
                      variant="default"
                      onClick={() => setEditandoAnotacao(false)}
                      className="border-zinc-700"
                    >
                      {t('cancel')}
                    </Button>
                    <Button
                      onClick={editarAnotacao}
                      disabled={!anotacaoSelecionada.titulo || editandoAnotacaoLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {editandoAnotacaoLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t('saving')}
                        </>
                      ) : (
                        t('saveChanges')
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: anotacaoSelecionada.cor + '20', color: anotacaoSelecionada.cor }}
                      >
                        {anotacaoSelecionada.tipoOrigem === 'audio' ? (
                          <FileAudio className="w-5 h-5" />
                        ) : (
                          <StickyNote className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-white mb-1 break-words">
                          {anotacaoSelecionada.titulo}
                        </h3>
                        <div className="flex items-center gap-2">
                          {anotacaoSelecionada.curso && (
                            <p className="text-sm text-zinc-400">{anotacaoSelecionada.curso.nome}</p>
                          )}
                          {anotacaoSelecionada.tipoOrigem === 'audio' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs">
                              <Mic className="w-3 h-3" />
                              Áudio
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Player de áudio para anotações de áudio */}
                    {anotacaoSelecionada.tipoOrigem === 'audio' && anotacaoSelecionada.audioUrl && (
                      <AudioPlayer
                        src={anotacaoSelecionada.audioUrl}
                        duration={anotacaoSelecionada.audioDuracao}
                      />
                    )}

                    <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                      <p className="text-zinc-300 whitespace-pre-wrap break-words">{anotacaoSelecionada.conteudo}</p>
                    </div>

                    {/* Transcrição original para anotações de áudio */}
                    {anotacaoSelecionada.tipoOrigem === 'audio' && anotacaoSelecionada.transcricaoOriginal && (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => setMostrarTranscricao(!mostrarTranscricao)}
                          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
                        >
                          <ChevronRight className={`w-4 h-4 transition-transform ${mostrarTranscricao ? 'rotate-90' : ''}`} />
                          {mostrarTranscricao ? 'Ocultar transcrição original' : 'Ver transcrição original'}
                        </button>
                        {mostrarTranscricao && (
                          <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/30">
                            <p className="text-sm text-zinc-400 whitespace-pre-wrap break-words">
                              {anotacaoSelecionada.transcricaoOriginal}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-zinc-500">
                      {t('createdAt')} {new Date(anotacaoSelecionada.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex gap-2 justify-end pt-4 flex-shrink-0 border-t border-zinc-800 mt-4">
                    <Button
                      variant="default"
                      onClick={excluirAnotacao}
                      className="border-zinc-700 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t('delete')}
                    </Button>
                    <Button
                      onClick={() => setEditandoAnotacao(true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      {t('edit')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Confirmar Exclusão de Anotação */}
      <ConfirmModal
        open={modalExcluirAnotacao}
        onClose={() => setModalExcluirAnotacao(false)}
        onConfirm={confirmarExcluirAnotacao}
        title={t('deleteNote')}
        description={t('deleteNoteConfirmation')}
        confirmText={t('deleteNote')}
        cancelText={t('cancel')}
        variant="danger"
      />

      {/* Modal Upgrade Premium */}
      <UpgradeToPremiumModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        recurso={t('aiNotesFeature')}
        descricao={t('aiNotesDescription')}
      />

      {/* Modal Confirmar Saída do Curso */}
      <ConfirmModal
        open={modalConfirmarSaidaCurso}
        onClose={() => setModalConfirmarSaidaCurso(false)}
        onConfirm={confirmarFecharCurso}
        title={t('unsavedChangesTitle')}
        description={t('unsavedChangesDescription')}
        confirmText={t('discardChanges')}
        cancelText={t('continueEditing')}
        variant="warning"
      />

      {/* Modal Confirmar Saída da Anotação */}
      <ConfirmModal
        open={modalConfirmarSaidaAnotacao}
        onClose={() => setModalConfirmarSaidaAnotacao(false)}
        onConfirm={confirmarFecharAnotacao}
        title={t('unsavedChangesTitle')}
        description={t('unsavedChangesDescription')}
        confirmText={t('discardChanges')}
        cancelText={t('continueEditing')}
        variant="warning"
      />
    </div>
  );
}