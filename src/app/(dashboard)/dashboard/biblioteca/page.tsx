'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/dexie';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Plus, Quote, Film, MoreVertical, Loader2, Activity, CheckCircle2 } from 'lucide-react';
import { StarRating } from '@/components/ui/star-rating';
import { Button } from '@/components/ui/button';
import { Midia, Citacao, StatusLeitura } from '@/types/midia';
import { NovaMidiaModal } from '@/components/leituras/NovaMidiaModal';
import { CitacoesModal } from '@/components/leituras/CitacoesModal';
import { GerenciarCitacoesModal } from '@/components/leituras/GerenciarCitacoesModal';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function BibliotecaPage() {
  const [midias, setMidias] = useState<Midia[]>([]);
  const [citacoesDestaque, setCitacoesDestaque] = useState<Citacao[]>([]);
  const [todasCitacoes, setTodasCitacoes] = useState<Citacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMidiaAberto, setModalMidiaAberto] = useState(false);
  const [modalCitacaoAberto, setModalCitacaoAberto] = useState(false);
  const [modalGerenciarCitacoes, setModalGerenciarCitacoes] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);

      const midiasData = await db.midias.toArray();
      const todasCitacoesData = await db.citacoes.toArray();
      const citacoesDestaqueData = todasCitacoesData.filter(c => c.destaque);

      // Join citacoes with midias manually for display
      const populadasCitacoes = todasCitacoesData.map(citacao => {
        const midia = midiasData.find(m => m.id === citacao.midiaId);
        return {
          ...citacao,
          midia: midia
        } as Citacao;
      });

      const populadasDestaque = citacoesDestaqueData.map(citacao => {
        const midia = midiasData.find(m => m.id === citacao.midiaId);
        return {
          ...citacao,
          midia: midia
        } as Citacao;
      });

      setMidias(midiasData as any);
      setCitacoesDestaque(populadasDestaque);
      setTodasCitacoes(populadasCitacoes);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: StatusLeitura) => {
    const badges = {
      PROXIMO: { label: 'Próximo', className: 'text-zinc-400' },
      EM_ANDAMENTO: { label: 'Em andamento', className: 'text-blue-400' },
      PAUSADO: { label: 'Pausado', className: 'text-yellow-400' },
      CONCLUIDO: { label: 'Concluído', className: 'text-green-400' },
    };
    return badges[status] || badges.PROXIMO;
  };

  const midiasPorTipo = {
    total: midias.length,
    livros: midias.filter((m) => m.tipo === 'LIVRO').length,
    filmes: midias.filter((m) => m.tipo === 'FILME').length,
    emAndamento: midias.filter((m) => m.status === 'EM_ANDAMENTO').length,
    concluidos: midias.filter((m) => m.status === 'CONCLUIDO').length,
  };

  if (loading) {
    return (
      <LoadingScreen message="Carregando biblioteca..." />
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-6 overflow-hidden">
      {/* Header */}
      <PageHeader 
        title="Biblioteca"
        description="Organize seus livros e filmes"
        action={
          <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
            <Button
              onClick={() => setModalCitacaoAberto(true)}
              variant="outline"
              className="flex-1 sm:flex-none"
            >
              <Quote className="w-4 h-4 mr-2" />
              <span className="hidden xs:inline">Nova Citação</span>
            </Button>
            <Button
              onClick={() => setModalMidiaAberto(true)}
              variant="premium"
              className="flex-1 sm:flex-none"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden xs:inline">Adicionar Item</span>
            </Button>
          </div>
        }
      />

      {/* Frases Inspiradoras */}
      {citacoesDestaque.length > 0 && (
        <Card className="border border-zinc-800/50 bg-zinc-900/40">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white text-lg sm:text-xl">
              <div className="flex items-center gap-2">
                <Quote className="w-5 h-5 text-yellow-500" />
                Frases Inspiradoras
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setModalGerenciarCitacoes(true)}
                className="h-8 w-8 p-0 hover:bg-zinc-800"
              >
                <MoreVertical className="w-4 h-4 text-zinc-400" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {citacoesDestaque.slice(0, 3).map((citacao) => (
              <div key={citacao.id} className="border-l-4 border-green-500 pl-4 py-2">
                <p className="text-zinc-200 italic text-sm sm:text-base">&ldquo;{citacao.texto}&rdquo;</p>
                {citacao.autor && (
                  <p className="text-xs sm:text-sm text-zinc-400 mt-2">— {citacao.autor}</p>
                )}
                {citacao.midia && (
                  <p className="text-xs text-zinc-500 mt-1">
                    {citacao.midia.tipo === 'LIVRO' ? '📚' : '🎬'} {citacao.midia.titulo}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="border border-zinc-800/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              Total
            </CardTitle>
            <BookOpen className="w-4 h-4 text-emerald-500/50" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white leading-none">{midiasPorTipo.total}</div>
          </CardContent>
        </Card>

        <Card className="border border-zinc-800/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              Livros
            </CardTitle>
            <BookOpen className="w-4 h-4 text-blue-500/50" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white leading-none">{midiasPorTipo.livros}</div>
          </CardContent>
        </Card>

        <Card className="border border-zinc-800/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              Filmes
            </CardTitle>
            <Film className="w-4 h-4 text-pink-500/50" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white leading-none">{midiasPorTipo.filmes}</div>
          </CardContent>
        </Card>

        <Card className="border border-zinc-800/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              Em Andamento
            </CardTitle>
            <Activity className="w-4 h-4 text-blue-500/50" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400 leading-none">{midiasPorTipo.emAndamento}</div>
          </CardContent>
        </Card>

        <Card className="border border-zinc-800/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              Concluídos
            </CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-500/50" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400 leading-none">{midiasPorTipo.concluidos}</div>
          </CardContent>
        </Card>
      </div>

      {/* Biblioteca */}
      <div className="space-y-6">
        {midias.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6 sm:p-8 text-center">
              <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-zinc-600 mx-auto mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-zinc-400 mb-3 sm:mb-4">
                Você ainda não tem livros ou filmes cadastrados
              </p>
              <Button
                onClick={() => setModalMidiaAberto(true)}
                className="bg-green-600 hover:bg-green-700 h-auto py-2.5 text-sm sm:text-base"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar primeiro item
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Livros */}
            {midias.filter((m) => m.tipo === 'LIVRO').length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-400" />
                    Livros
                  </h2>
                  <span className="text-sm text-zinc-500">
                    {midias.filter((m) => m.tipo === 'LIVRO').length} {midias.filter((m) => m.tipo === 'LIVRO').length === 1 ? 'livro' : 'livros'}
                  </span>
                </div>
                <div className="overflow-x-auto pb-4">
                  <div className="flex gap-4 min-w-max">
                    {midias.filter((m) => m.tipo === 'LIVRO').map((midia) => {
                      const statusInfo = getStatusBadge(midia.status);
                      return (
                        <Card
                          key={midia.id}
                          className="border border-zinc-800/50 hover:border-emerald-500/30 cursor-pointer transition-all hover:bg-zinc-900/60 w-64 flex-shrink-0 group"
                          onClick={() => window.location.href = `/dashboard/biblioteca/${midia.id}`}
                        >
                          <CardContent className="p-4 space-y-3">
                            {/* Capa */}
                            {midia.capa && (
                              <div className="flex justify-center">
                                <img
                                  src={midia.capa}
                                  alt={`Capa de ${midia.titulo}`}
                                  className="w-full h-80 object-cover rounded-lg border border-zinc-700 shadow-lg"
                                />
                              </div>
                            )}

                            {/* Título */}
                            <div className="flex items-start gap-2">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: midia.cor + '20', color: midia.cor }}
                              >
                                <BookOpen className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-white font-bold text-sm line-clamp-2 group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{midia.titulo}</h3>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">{midia.autor}</p>
                              </div>
                            </div>

                            {/* Status e Nota */}
                            <div className="flex items-center justify-between gap-4 text-xs pt-2 border-t border-zinc-800">
                              <div className={statusInfo.className}>
                                {statusInfo.label}
                              </div>
                              {midia.nota && midia.nota > 0 && (
                                <StarRating value={midia.nota} size="sm" readonly />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Filmes */}
            {midias.filter((m) => m.tipo === 'FILME').length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <Film className="w-5 h-5 text-teal-400" />
                    Filmes
                  </h2>
                  <span className="text-sm text-zinc-500">
                    {midias.filter((m) => m.tipo === 'FILME').length} {midias.filter((m) => m.tipo === 'FILME').length === 1 ? 'filme' : 'filmes'}
                  </span>
                </div>
                <div className="overflow-x-auto pb-4">
                  <div className="flex gap-4 min-w-max">
                    {midias.filter((m) => m.tipo === 'FILME').map((midia) => {
                      const statusInfo = getStatusBadge(midia.status);
                      return (
                        <Card
                          key={midia.id}
                          className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors w-64 flex-shrink-0"
                          onClick={() => window.location.href = `/dashboard/biblioteca/${midia.id}`}
                        >
                          <CardContent className="p-4 space-y-3">
                            {/* Capa */}
                            {midia.capa && (
                              <div className="flex justify-center">
                                <img
                                  src={midia.capa}
                                  alt={`Capa de ${midia.titulo}`}
                                  className="w-full h-80 object-cover rounded-lg border border-zinc-700 shadow-lg"
                                />
                              </div>
                            )}

                            {/* Título */}
                            <div className="flex items-start gap-2">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: midia.cor + '20', color: midia.cor }}
                              >
                                <Film className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-white font-bold text-sm line-clamp-2 group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{midia.titulo}</h3>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">{midia.diretor}</p>
                              </div>
                            </div>

                            {/* Status e Nota */}
                            <div className="flex items-center justify-between gap-4 text-xs pt-2 border-t border-zinc-800">
                              <div className={statusInfo.className}>
                                {statusInfo.label}
                              </div>
                              {midia.nota && midia.nota > 0 && (
                                <StarRating value={midia.nota} size="sm" readonly />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Citações */}
      {todasCitacoes.length > 0 && (
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Citações</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {todasCitacoes.slice(0, 6).map((citacao) => (
              <Card
                key={citacao.id}
                className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors"
              >
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 bg-yellow-500/20 text-yellow-500">
                      <Quote className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm italic line-clamp-3">
                        &ldquo;{citacao.texto}&rdquo;
                      </p>
                      {citacao.autor && (
                        <p className="text-xs text-zinc-500 mt-2">— {citacao.autor}</p>
                      )}
                      {citacao.midia && (
                        <p className="text-xs text-zinc-500 mt-1">
                          {citacao.midia.tipo === 'LIVRO' ? '📚' : '🎬'} {citacao.midia.titulo}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Modais */}
      <NovaMidiaModal
        aberto={modalMidiaAberto}
        onFechar={() => setModalMidiaAberto(false)}
        onSucesso={carregarDados}
      />

      <CitacoesModal
        aberto={modalCitacaoAberto}
        onFechar={() => setModalCitacaoAberto(false)}
        onSucesso={carregarDados}
        midias={midias}
      />

      <GerenciarCitacoesModal
        aberto={modalGerenciarCitacoes}
        onFechar={() => setModalGerenciarCitacoes(false)}
        onAtualizar={carregarDados}
      />
    </div>
  );
}
