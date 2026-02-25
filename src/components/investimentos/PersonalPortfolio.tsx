'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatarMoeda } from '@/lib/financeiro-helper';
import { useTranslations } from 'next-intl';
import { Plus, TrendingUp, TrendingDown, Trash2, Wallet } from 'lucide-react';
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">
                            {t('totalEquity')}
                        </CardTitle>
                        <Wallet className="w-4 h-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {formatarMoeda(patrimonioTotal)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">
                            {t('totalProfit')}
                        </CardTitle>
                        {isLucroPositivo ? (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${isLucroPositivo ? 'text-green-500' : 'text-red-500'}`}>
                            {formatarMoeda(lucroTotal)}
                        </div>
                        {custoTotal > 0 && (
                            <p className={`text-xs mt-1 ${isLucroPositivo ? 'text-green-500/80' : 'text-red-500/80'}`}>
                                {isLucroPositivo ? '+' : ''}{lucroPercentual.toFixed(2)}%
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Placeholder para Posição ou Diversificação */}
                <Card className="bg-zinc-900 border-zinc-800 hidden lg:block">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">
                            Posição
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full h-8 bg-zinc-800 rounded-lg overflow-hidden flex">
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
                                    const colors = ['bg-green-500', 'bg-blue-500', 'bg-orange-500', 'bg-purple-500', 'bg-pink-500'];

                                    return arrayTipos.map((grupo, index) => {
                                        const width = (grupo.valor / patrimonioTotal) * 100;
                                        return (
                                            <div
                                                key={grupo.tipo}
                                                style={{ width: `${width}%` }}
                                                className={`h-full ${colors[index % colors.length]}`}
                                                title={`${grupo.label}: ${width.toFixed(1)}%`}
                                            />
                                        );
                                    });
                                })()
                            ) : (
                                <div className="w-full h-full bg-zinc-700/50" />
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabela de Ativos */}
            <Card className="bg-zinc-900 border-zinc-800 flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <CardTitle className="text-white relative">
                        {t('myPortfolio')}
                        <span className="absolute -bottom-1 left-0 w-8 h-1 bg-green-500 rounded-full" />
                    </CardTitle>
                    <Button
                        onClick={() => setModalAberto(true)}
                        className="bg-green-600 hover:bg-green-700 h-9"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        {t('newAsset')}
                    </Button>
                </CardHeader>
                <CardContent className="flex-1 shrink-0 px-0 sm:px-6 relative">
                    {isLoadingQuotes && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-green-500/20 overflow-hidden">
                            <div className="h-full bg-green-500 w-1/3 animate-[slide_1.5s_ease-in-out_infinite]" />
                        </div>
                    )}
                    {!ativos || ativos.length === 0 ? (
                        <div className="text-center py-12 px-4 border border-dashed border-zinc-800 rounded-xl mx-6">
                            <TrendingUp className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-white mb-1">{t('noAssets')}</h3>
                            <p className="text-sm text-zinc-400 mb-4 max-w-sm mx-auto">{t('startAddingAssets')}</p>
                            <Button onClick={() => setModalAberto(true)} variant="outline" className="border-green-500/30 text-green-400 hover:bg-green-500/10">
                                {t('addFirstAsset')}
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-zinc-400 uppercase bg-zinc-900/50 border-b border-zinc-800">
                                    <tr>
                                        <th className="px-6 py-3">{t('assetName')}</th>
                                        <th className="px-6 py-3">{t('type')}</th>
                                        <th className="px-6 py-3 text-right">{t('quantity')}</th>
                                        <th className="px-6 py-3 text-right">{t('averagePrice')}</th>
                                        <th className="px-6 py-3 text-right">Valor Aplicado</th>
                                        <th className="px-6 py-3 text-right">{t('currentValue')}</th>
                                        <th className="px-6 py-3 text-center">{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50">
                                    {ativosFormatados.map((ativo: any) => {
                                        const valorCotaGeral = ativo.valorAtual;
                                        const valorTotal = ativo.quantidade * valorCotaGeral;
                                        const lucroLocal = valorTotal - ativo.valorSemTaxa;
                                        const isPositivo = lucroLocal >= 0;

                                        return (
                                            <tr key={ativo.nome} className="hover:bg-zinc-800/30 transition-colors">
                                                <td className="px-6 py-4 font-medium text-white uppercase">
                                                    <button
                                                        onClick={() => setAtivoSelecionado(ativo.nome)}
                                                        className="hover:text-green-500 hover:underline transition-colors focus:outline-none"
                                                        title="Ver todos os lançamentos"
                                                    >
                                                        {ativo.nome}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 text-zinc-400">{t(`types.${ativo.tipo}` as any)}</td>
                                                <td className="px-6 py-4 text-right font-medium text-white">
                                                    {ativo.quantidade.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 6 })}
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-blue-400">
                                                    {formatarMoeda(ativo.precoMedio)}
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-white">{formatarMoeda(ativo.valorSemTaxa)}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="text-white font-medium flex items-center justify-end gap-2">
                                                        <span className="text-xs text-zinc-500 font-normal">({formatarMoeda(valorCotaGeral)})</span>
                                                        {formatarMoeda(valorTotal)}
                                                    </div>
                                                    <div className={`text-xs ${isPositivo ? 'text-green-500' : 'text-red-500'}`}>
                                                        {isPositivo ? '+' : ''}{lucroLocal > 0 || lucroLocal < 0 ? formatarMoeda(lucroLocal) : 'R$ 0,00'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button onClick={() => handleDelete(ativo.nome)} className="text-red-500/70 hover:text-red-500 transition-colors p-2 hover:bg-red-500/10 rounded-lg" title={t('delete')}>
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
