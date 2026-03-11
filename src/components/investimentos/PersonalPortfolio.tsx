'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatarMoeda } from '@/lib/financeiro-helper';
import { useTranslations } from 'next-intl';
import { Plus, TrendingUp, TrendingDown, Trash2, Wallet, Activity } from 'lucide-react';
import NovoAtivoModal from './NovoAtivoModal';
import DetalhesAtivoModal from './DetalhesAtivoModal';
import { toast } from 'sonner';

export default function PersonalPortfolio() {
    const t = useTranslations('investments');
    const [ativos, setAtivos] = useState<any[]>([]);
    const [modalAberto, setModalAberto] = useState(false);
    const [ativoSelecionado, setAtivoSelecionado] = useState<string | null>(null);
    const [liveQuotes, setLiveQuotes] = useState<Record<string, number>>({});
    const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);

    const carregarAtivos = async () => {
        try {
            const res = await fetch('/api/investimentos');
            if (res.ok) {
                const json = await res.json();
                setAtivos(json.data || []);
            }
        } catch (error) {
            console.error('Erro ao buscar ativos:', error);
        }
    };

    useEffect(() => {
        carregarAtivos();
    }, []);

    // Fetch live quotes from BRAPI
    useEffect(() => {
        if (!ativos || ativos.length === 0) return;

        const fetchQuotes = async () => {
            setIsLoadingQuotes(true);
            try {
                const tickers = ativos
                    .filter(a => a.tipo === 'ACAO' || a.tipo === 'FII' || a.tipo === 'CRIPTO')
                    .map(a => a.nome)
                    .join(',');

                if (!tickers) {
                    setIsLoadingQuotes(false);
                    return;
                }

                const res = await fetch(`https://brapi.dev/api/quote/${tickers}?token=u6eKiojA48yU4cMkdLqT8V`);
                const data = await res.json();

                if (data.results) {
                    const newQuotes: Record<string, number> = {};
                    data.results.forEach((item: any) => {
                        newQuotes[item.symbol] = item.regularMarketPrice;
                    });
                    setLiveQuotes(newQuotes);
                }
            } catch (err) {
                console.error("Erro ao carregar cotações da BRAPI:", err);
            } finally {
                setIsLoadingQuotes(false);
            }
        };

        fetchQuotes();
    }, [ativos]);

    // O valor atual de um ativo pode ser o do BRAPI ou o salvo (fallback para Renda Fixa ou falha da API)
    const getValorAtual = (ativo: any) => {
        return liveQuotes[ativo.nome] || ativo.valorAtual;
    };

    // Calcula patrimônio total e custo total usando os fatores exatos quando disponíveis
    const patrimonioTotal = (ativos || []).reduce(
        (acc, ativo) => acc + Number(ativo.quantidade) * getValorAtual(ativo), 0
    );

    const custoTotal = (ativos || []).reduce(
        (acc, ativo) => {
            const qtd = Number(ativo.quantidade || 0);
            if (ativo.precoCota !== undefined && ativo.precoCota !== null) {
                const pc = Number(ativo.precoCota);
                return acc + (qtd * pc); // Rentabilidade baseada apenas no valor do papel, excluindo taxas
            }
            const pm = Number(ativo.precoMedio || 0);
            return acc + (qtd * pm);
        }, 0
    );

    const lucroTotal = patrimonioTotal - custoTotal;
    const lucroPercentual = custoTotal > 0 ? (lucroTotal / custoTotal) * 100 : 0;
    const isLucroPositivo = lucroTotal >= 0;

    const handleDelete = async (nome: string) => {
        if (confirm(t('deleteConfirmMsg'))) {
            try {
                const idsToDelete = (ativos || []).filter(a => a.nome === nome).map(a => a.id);
                for (const id of idsToDelete) {
                    await fetch(`/api/investimentos?id=${id}`, { method: 'DELETE' });
                }
                toast.success(`Ativos ${nome} removidos.`, { className: "bg-green-500/10 text-green-400 border border-green-500/20" });
                carregarAtivos();
            } catch (err) {
                toast.error('Erro ao remover ativos');
            }
        }
    };

    const ativosFormatados = Object.values((ativos || []).reduce((acc, ativo) => {
        const key = ativo.nome;

        // Convert Postgres strings to JS numbers
        const qtd = Number(ativo.quantidade || 0);
        const precoCota = ativo.precoCota ? Number(ativo.precoCota) : undefined;
        const precoMedio = Number(ativo.precoMedio || 0);
        const taxas = Number(ativo.taxas || 0);

        if (!acc[key]) {
            acc[key] = {
                id: ativo.id,
                nome: ativo.nome,
                tipo: ativo.tipo,
                quantidade: 0,
                custoTotalOriginal: 0,
                valorSemTaxa: 0,
            };
        }

        acc[key].quantidade += qtd;

        // Usa precoCota e taxas separadamente para evitar imprecisão de ponto flutuante do precoMedio guardado
        if (precoCota !== undefined) {
            acc[key].custoTotalOriginal += (qtd * precoCota) + taxas;
            acc[key].valorSemTaxa += (qtd * precoCota);
        } else {
            acc[key].custoTotalOriginal += (qtd * precoMedio);
            acc[key].valorSemTaxa += (qtd * precoMedio);
        }

        return acc;
    }, {} as Record<string, any>)).map((grupo: any) => {
        return {
            ...grupo,
            precoMedio: grupo.quantidade > 0 ? grupo.valorSemTaxa / grupo.quantidade : 0,
            valorAtual: getValorAtual(grupo)
        };
    }).sort((a: any, b: any) => {
        const totalA = a.quantidade * a.valorAtual;
        const totalB = b.quantidade * b.valorAtual;
        return totalB - totalA;
    });

    return (
        <div className="space-y-6">
            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Wallet className="w-4 h-4 text-zinc-500" />
                            <span className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500">{t('totalEquity')}</span>
                        </div>
                        <div className="text-3xl font-black text-white leading-none">
                            {formatarMoeda(patrimonioTotal)}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-2">
                            {isLucroPositivo ? (
                                <TrendingUp className="w-4 h-4 text-emerald-500/50" />
                            ) : (
                                <TrendingDown className="w-4 h-4 text-red-500/50" />
                            )}
                            <span className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500">{t('totalProfit')}</span>
                        </div>
                        <div className="flex items-baseline gap-3">
                            <div className={`text-3xl font-black leading-none ${isLucroPositivo ? 'text-emerald-500' : 'text-red-500'}`}>
                                {formatarMoeda(lucroTotal)}
                            </div>
                            {custoTotal > 0 && (
                                <span className={`text-[10px] font-black uppercase tracking-widest ${isLucroPositivo ? 'text-emerald-500/80' : 'text-red-500/80'}`}>
                                    {isLucroPositivo ? '+' : ''}{lucroPercentual.toFixed(2)}%
                                </span>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Placeholder para Posição ou Diversificação */}
                <Card className="hidden lg:block">
                    <CardContent className="p-6 flex flex-col justify-center h-full">
                        <div className="flex items-center gap-2 mb-3">
                            <Activity className="w-4 h-4 text-zinc-500" />
                            <span className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500">Posição por Tipo</span>
                        </div>
                        <div className="w-full h-3 bg-zinc-800/50 rounded-full overflow-hidden flex shadow-inner">
                            {ativosFormatados.length > 0 ? (
                                (() => {
                                    const tiposAgrupados = ativosFormatados.reduce((acc: any, ativo: any) => {
                                        const valorLocal = ativo.quantidade * ativo.valorAtual;
                                        if (!acc[ativo.tipo]) {
                                            acc[ativo.tipo] = { tipo: ativo.tipo, valor: 0, label: t(`types.${ativo.tipo}` as any) };
                                        }
                                        acc[ativo.tipo].valor += valorLocal;
                                        return acc;
                                    }, {});
                                    const arrayTipos = Object.values(tiposAgrupados).sort((a: any, b: any) => b.valor - a.valor) as any[];
                                    const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-orange-500', 'bg-purple-500', 'bg-zinc-500'];

                                    return arrayTipos.map((grupo, index) => {
                                        const width = (grupo.valor / patrimonioTotal) * 100;
                                        return (
                                            <div
                                                key={grupo.tipo}
                                                style={{ width: `${width}%` }}
                                                className={`h-full ${colors[index % colors.length]} transition-all duration-1000`}
                                                title={`${grupo.label}: ${width.toFixed(1)}%`}
                                            />
                                        );
                                    });
                                })()
                            ) : (
                                <div className="w-full h-full bg-zinc-800/20" />
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabela de Ativos */}
            <Card className="flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between py-6 px-8 border-b border-zinc-800/50">
                    <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
                        {t('myPortfolio')}
                    </CardTitle>
                    <Button
                        onClick={() => setModalAberto(true)}
                        variant="premium"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        {t('newAsset')}
                    </Button>
                </CardHeader>
                <CardContent className="flex-1 shrink-0 p-0 relative">
                    {isLoadingQuotes && (
                        <div className="absolute top-0 left-0 w-full h-0.5 bg-emerald-500/20 overflow-hidden z-10">
                            <div className="h-full bg-emerald-500 w-1/3 animate-[slide_1.5s_ease-in-out_infinite]" />
                        </div>
                    )}
                    {!ativos || ativos.length === 0 ? (
                        <div className="text-center py-20 px-8">
                            <div className="w-16 h-16 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 flex items-center justify-center mx-auto mb-6">
                                <TrendingUp className="w-8 h-8 text-zinc-700" />
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-100 mb-2">{t('noAssets')}</h3>
                            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-8 max-w-[240px] mx-auto leading-relaxed">{t('startAddingAssets')}</p>
                            <Button onClick={() => setModalAberto(true)} variant="outline" className="rounded-xl border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10 font-black uppercase tracking-widest text-[10px] h-10 px-6">
                                {t('addFirstAsset')}
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] bg-zinc-900/30 border-b border-zinc-800/50">
                                    <tr>
                                        <th className="px-8 py-4 font-black">{t('assetName')}</th>
                                        <th className="px-8 py-4 font-black">{t('type')}</th>
                                        <th className="px-8 py-4 text-right font-black">{t('quantity')}</th>
                                        <th className="px-8 py-4 text-right font-black">{t('averagePrice')}</th>
                                        <th className="px-8 py-4 text-right font-black">Aplicado</th>
                                        <th className="px-8 py-4 text-right font-black">{t('currentValue')}</th>
                                        <th className="px-8 py-4 text-center font-black">{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/30">
                                    {ativosFormatados.map((ativo: any) => {
                                        const valorCotaGeral = ativo.valorAtual;
                                        const valorTotal = ativo.quantidade * valorCotaGeral;
                                        const lucroLocal = valorTotal - ativo.valorSemTaxa;
                                        const isPositivo = lucroLocal >= 0;

                                        return (
                                            <tr key={ativo.nome} className="hover:bg-zinc-900/20 transition-all group">
                                                <td className="px-8 py-5">
                                                    <button
                                                        onClick={() => setAtivoSelecionado(ativo.nome)}
                                                        className="text-sm font-black text-zinc-100 uppercase tracking-tight group-hover:text-emerald-500 transition-colors focus:outline-none"
                                                        title="Ver todos os lançamentos"
                                                    >
                                                        {ativo.nome}
                                                    </button>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t(`types.${ativo.tipo}` as any)}</span>
                                                </td>
                                                <td className="px-8 py-5 text-right font-bold text-zinc-300">
                                                    {ativo.quantidade.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 6 })}
                                                </td>
                                                <td className="px-8 py-5 text-right font-bold text-blue-500/80">
                                                    {formatarMoeda(ativo.precoMedio)}
                                                </td>
                                                <td className="px-8 py-5 text-right font-bold text-zinc-400">{formatarMoeda(ativo.valorSemTaxa)}</td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="text-sm font-black text-white flex items-center justify-end gap-2 leading-none">
                                                        <span className="text-[9px] font-bold text-zinc-600 mr-1">({formatarMoeda(valorCotaGeral)})</span>
                                                        {formatarMoeda(valorTotal)}
                                                    </div>
                                                    <div className={`text-[9px] font-black uppercase tracking-widest mt-1.5 ${isPositivo ? 'text-emerald-500' : 'text-red-500'}`}>
                                                        {isPositivo ? '+' : ''}{lucroLocal > 0 || lucroLocal < 0 ? formatarMoeda(lucroLocal) : 'R$ 0,00'}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    <button onClick={() => handleDelete(ativo.nome)} className="text-zinc-700 hover:text-red-500 transition-all p-2 hover:bg-red-500/10 rounded-xl" title={t('delete')}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <NovoAtivoModal
                aberto={modalAberto}
                onFechar={() => setModalAberto(false)}
                onSucesso={() => carregarAtivos()}
            />

            <DetalhesAtivoModal
                aberto={!!ativoSelecionado}
                nomeAtivo={ativoSelecionado}
                onFechar={() => {
                    setAtivoSelecionado(null);
                    carregarAtivos();
                }}
            />
        </div>
    );
}
