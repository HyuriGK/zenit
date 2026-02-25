'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/dexie';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Tag,
  TrendingUp,
  TrendingDown,
  Grid3x3,
  List,
  Edit,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import NovaCategoriaModal from '@/components/financeiro/NovaCategoriaModal';

interface Categoria {
  id: string;
  nome: string;
  tipo: 'RECEITA' | 'DESPESA';
  cor: string;
  icone: string;
  categoriaPaiId?: string;
}

export default function CategoriasPage() {
  const [visualizacao, setVisualizacao] = useState<'grid' | 'lista'>('grid');
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'RECEITA' | 'DESPESA'>('TODOS');
  const [menuAberto, setMenuAberto] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);

  const categoriasData = useLiveQuery(() => db.categorias.toArray(), []);

  const categorias = (categoriasData || []).filter(c => filtroTipo === 'TODOS' || c.tipo === filtroTipo);
  const loading = categoriasData === undefined;

  const categoriasReceita = categorias.filter((c) => c.tipo === 'RECEITA');
  const categoriasDespesa = categorias.filter((c) => c.tipo === 'DESPESA');

  return (
    <div className="bg-zinc-950 p-4 lg:p-6 space-y-4 sm:space-y-6">
      <div className="relative mb-8">
        <div className="relative">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 via-teal-400 to-rose-400 bg-clip-text text-transparent">
                Categorias
              </h1>
              <p className="text-zinc-400 mt-2">Organize suas transações por categorias</p>
            </div>
            <Button
              onClick={() => setModalAberto(true)}
              className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white shadow-lg transition-all hover:scale-105"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nova Categoria
            </Button>
          </div>

          {/* Controles */}
          <div className="flex items-center justify-between">
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
                <TrendingUp className="w-4 h-4 mr-2" />
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
                <TrendingDown className="w-4 h-4 mr-2" />
                Despesas
              </Button>
            </div>

            {/* Toggle de Visualização */}
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => setVisualizacao('grid')}
                className={visualizacao === 'grid'
                  ? 'bg-zinc-800 border-zinc-700'
                  : 'border-zinc-800 hover:bg-zinc-800'
                }
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => setVisualizacao('lista')}
                className={visualizacao === 'lista'
                  ? 'bg-zinc-800 border-zinc-700'
                  : 'border-zinc-800 hover:bg-zinc-800'
                }
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : categorias.length === 0 ? (
        <Card className="bg-zinc-900/50 border-zinc-800 p-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-full mb-4">
              <Tag className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Nenhuma categoria encontrada
            </h3>
            <p className="text-zinc-400 mb-6">
              Crie categorias para organizar suas transações
            </p>
            <Button className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700">
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Categoria
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Categorias de Receita */}
          {(filtroTipo === 'TODOS' || filtroTipo === 'RECEITA') && categoriasReceita.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Receitas
                <span className="text-sm text-zinc-500 font-normal">({categoriasReceita.length})</span>
              </h2>

              {visualizacao === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {categoriasReceita.map((categoria) => (
                    <Card
                      key={categoria.id}
                      className="relative overflow-hidden bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all group cursor-pointer"
                    >
                      {/* Barra colorida no topo */}
                      <div
                        className="absolute top-0 left-0 right-0 h-1"
                        style={{ backgroundColor: categoria.cor }}
                      />

                      <div className="relative p-4">
                        <div className="flex flex-col items-center text-center">
                          {/* Ícone */}
                          <div
                            className="w-14 h-14 rounded-xl flex items-center justify-center mb-3"
                            style={{ backgroundColor: `${categoria.cor}10` }}
                          >
                            <Tag className="w-7 h-7" style={{ color: categoria.cor }} />
                          </div>

                          {/* Nome */}
                          <h3 className="font-semibold text-white text-sm mb-1">
                            {categoria.nome}
                          </h3>
                        </div>

                        {/* Menu */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuAberto(menuAberto === categoria.id ? null : categoria.id);
                          }}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>

                        {menuAberto === categoria.id && (
                          <div className="absolute right-2 top-10 w-40 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-10">
                            <button className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2">
                              <Edit className="w-3.5 h-3.5" />
                              Editar
                            </button>
                            <button className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-zinc-800 flex items-center gap-2">
                              <Trash2 className="w-3.5 h-3.5" />
                              Excluir
                            </button>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {categoriasReceita.map((categoria) => (
                    <Card
                      key={categoria.id}
                      className="relative overflow-hidden bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all group"
                    >
                      <div className="p-4 flex items-center gap-4">
                        {/* Ícone */}
                        <div
                          className="p-3 rounded-xl"
                          style={{ backgroundColor: `${categoria.cor}10` }}
                        >
                          <Tag className="w-5 h-5" style={{ color: categoria.cor }} />
                        </div>

                        {/* Nome */}
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{categoria.nome}</h3>
                        </div>

                        {/* Tipo */}
                        <div className="px-3 py-1 bg-green-500/10 text-green-400 text-xs rounded-full border border-green-500/20">
                          Receita
                        </div>

                        {/* Menu */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setMenuAberto(menuAberto === categoria.id ? null : categoria.id)}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>

                        {menuAberto === categoria.id && (
                          <div className="absolute right-4 top-14 w-40 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-10">
                            <button className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2">
                              <Edit className="w-3.5 h-3.5" />
                              Editar
                            </button>
                            <button className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-zinc-800 flex items-center gap-2">
                              <Trash2 className="w-3.5 h-3.5" />
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
          )}

          {/* Categorias de Despesa */}
          {(filtroTipo === 'TODOS' || filtroTipo === 'DESPESA') && categoriasDespesa.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-400" />
                Despesas
                <span className="text-sm text-zinc-500 font-normal">({categoriasDespesa.length})</span>
              </h2>

              {visualizacao === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {categoriasDespesa.map((categoria) => (
                    <Card
                      key={categoria.id}
                      className="relative overflow-hidden bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all group cursor-pointer"
                    >
                      <div
                        className="absolute top-0 left-0 right-0 h-1"
                        style={{ backgroundColor: categoria.cor }}
                      />

                      <div className="relative p-4">
                        <div className="flex flex-col items-center text-center">
                          <div
                            className="w-14 h-14 rounded-xl flex items-center justify-center mb-3"
                            style={{ backgroundColor: `${categoria.cor}10` }}
                          >
                            <Tag className="w-7 h-7" style={{ color: categoria.cor }} />
                          </div>

                          <h3 className="font-semibold text-white text-sm mb-1">
                            {categoria.nome}
                          </h3>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuAberto(menuAberto === categoria.id ? null : categoria.id);
                          }}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>

                        {menuAberto === categoria.id && (
                          <div className="absolute right-2 top-10 w-40 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-10">
                            <button className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2">
                              <Edit className="w-3.5 h-3.5" />
                              Editar
                            </button>
                            <button className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-zinc-800 flex items-center gap-2">
                              <Trash2 className="w-3.5 h-3.5" />
                              Excluir
                            </button>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {categoriasDespesa.map((categoria) => (
                    <Card
                      key={categoria.id}
                      className="relative overflow-hidden bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all group"
                    >
                      <div className="p-4 flex items-center gap-4">
                        <div
                          className="p-3 rounded-xl"
                          style={{ backgroundColor: `${categoria.cor}10` }}
                        >
                          <Tag className="w-5 h-5" style={{ color: categoria.cor }} />
                        </div>

                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{categoria.nome}</h3>
                        </div>

                        <div className="px-3 py-1 bg-red-500/10 text-red-400 text-xs rounded-full border border-red-500/20">
                          Despesa
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setMenuAberto(menuAberto === categoria.id ? null : categoria.id)}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>

                        {menuAberto === categoria.id && (
                          <div className="absolute right-4 top-14 w-40 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-10">
                            <button className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2">
                              <Edit className="w-3.5 h-3.5" />
                              Editar
                            </button>
                            <button className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-zinc-800 flex items-center gap-2">
                              <Trash2 className="w-3.5 h-3.5" />
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
          )}
        </div>
      )}

      {/* Modal de Nova Categoria */}
      <NovaCategoriaModal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        onSucesso={() => {
          // Live query updates automatically
        }}
      />
    </div>
  );
}