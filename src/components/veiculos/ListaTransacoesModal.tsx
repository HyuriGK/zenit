'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
    Fuel, 
    PenTool, 
    TrendingUp, 
    History, 
    Hash,
    MapPin,
    Droplets,
    Edit2,
    Trash2,
    X,
    Wallet,
    ArrowUpCircle,
    ArrowDownCircle,
    PieChart
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatarMoeda } from '@/lib/financeiro-helper';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';

interface ListaTransacoesModalProps {
    aberto: boolean;
    veiculoId: string;
    onFechar: () => void;
    onEdit: (transacao: any) => void;
    onRefresh: () => void;
}

export default function ListaTransacoesModal({ aberto, veiculoId, onFechar, onEdit, onRefresh }: ListaTransacoesModalProps) {
    const t = useTranslations('vehicles');
    const [transacoes, setTransacoes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const carregarTransacoes = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/veiculos/${veiculoId}/transacoes`);
            if (res.ok) {
                const json = await res.json();
                setTransacoes(json.data || []);
            }
        } catch (error) {
            console.error('Erro ao buscar transações:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (aberto && veiculoId) {
            carregarTransacoes();
        }
    }, [aberto, veiculoId]);

    const stats = useMemo(() => {
        const categories = {
            ABASTECIMENTO: 0,
            MANUTENCAO: 0,
            INVESTIMENTO: 0,
            OUTROS: 0,
            TOTAL: 0
        };

        transacoes.forEach(tr => {
            const valor = parseFloat(tr.valor) || 0;
            if (tr.tipo === 'ABASTECIMENTO') categories.ABASTECIMENTO += valor;
            else if (tr.tipo === 'MANUTENCAO') categories.MANUTENCAO += valor;
            else if (tr.tipo === 'INVESTIMENTO') categories.INVESTIMENTO += valor;
            else categories.OUTROS += valor;
            categories.TOTAL += valor;
        });

        return categories;
    }, [transacoes]);

    const handleDelete = async (transacaoId: string) => {
        if (!confirm('Tem certeza que deseja excluir este registro?')) return;

        try {
            const res = await fetch(`/api/veiculos/${veiculoId}/transacoes/${transacaoId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                toast.success('Registro excluído!');
                carregarTransacoes();
                onRefresh();
            } else {
                toast.error('Erro ao excluir registro.');
            }
        } catch (error) {
            toast.error('Erro ao conectar com o servidor.');
        }
    };

    const getIcon = (tipo: string) => {
        switch (tipo) {
            case 'ABASTECIMENTO': return <Fuel className="w-4 h-4 text-orange-500" />;
            case 'MANUTENCAO': return <PenTool className="w-4 h-4 text-blue-500" />;
            case 'INVESTIMENTO': return <TrendingUp className="w-4 h-4 text-emerald-500" />;
            default: return <History className="w-4 h-4 text-zinc-500" />;
        }
    };

    const getTipoLabel = (tipo: string) => {
        switch (tipo) {
            case 'ABASTECIMENTO': return t('transactions.refuel');
            case 'MANUTENCAO': return t('transactions.maintenance');
            case 'INVESTIMENTO': return t('transactions.investment');
            default: return tipo;
        }
    };

    return (
        <Dialog open={aberto} onOpenChange={onFechar}>
            <DialogContent className="bg-zinc-950 border-none sm:max-w-none w-screen h-screen m-0 p-0 rounded-none flex flex-col overflow-hidden max-h-none">
                {/* Main Content Area - Scrollable */}
                <div className="flex-1 overflow-y-auto bg-zinc-950 scroll-container">
                    {/* Custom Large Header */}
                    <div className="bg-zinc-900/50 border-b border-zinc-800/50 p-6 lg:p-10 shrink-0">
                        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                        <History className="w-6 h-6" />
                                    </div>
                                    <h2 className="text-3xl font-black text-white tracking-tight uppercase italic">{t('transactions.title')}</h2>
                                </div>
                                <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-[10px] ml-16">Histórico completo e detalhamento de gastos</p>
                            </div>
                            
                            <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={onFechar}
                                className="absolute top-6 right-6 lg:top-10 lg:right-10 rounded-2xl border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Stats Summary Panel */}
                        {!loading && transacoes.length > 0 && (
                            <div className="max-w-7xl mx-auto mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <Card className="bg-zinc-900 border-zinc-800/50 overflow-hidden group hover:border-emerald-500/30 transition-all">
                                    <CardContent className="p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                <Wallet className="w-4 h-4" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Gasto Total</span>
                                        </div>
                                        <div className="text-2xl font-black text-white group-hover:text-emerald-500 transition-colors">{formatarMoeda(stats.TOTAL)}</div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-zinc-900 border-zinc-800/50 overflow-hidden group hover:border-orange-500/30 transition-all">
                                    <CardContent className="p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/20">
                                                <Fuel className="w-4 h-4" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('transactions.refuel')}</span>
                                        </div>
                                        <div className="text-2xl font-black text-white group-hover:text-orange-500 transition-colors">{formatarMoeda(stats.ABASTECIMENTO)}</div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-zinc-900 border-zinc-800/50 overflow-hidden group hover:border-blue-500/30 transition-all">
                                    <CardContent className="p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                                <PenTool className="w-4 h-4" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('transactions.maintenance')}</span>
                                        </div>
                                        <div className="text-2xl font-black text-white group-hover:text-blue-500 transition-colors">{formatarMoeda(stats.MANUTENCAO)}</div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-zinc-900 border-zinc-800/50 overflow-hidden group hover:border-emerald-500/30 transition-all">
                                    <CardContent className="p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                <TrendingUp className="w-4 h-4" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('transactions.investment')}</span>
                                        </div>
                                        <div className="text-2xl font-black text-white group-hover:text-emerald-400 transition-colors">{formatarMoeda(stats.INVESTIMENTO)}</div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                    
                    <div className="max-w-7xl mx-auto p-6 lg:p-10">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-40">
                                <div className="relative">
                                    <History className="w-16 h-16 text-emerald-500 animate-[spin_3s_linear_infinite]" />
                                    <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
                                </div>
                                <span className="text-sm font-black uppercase tracking-[0.4em] text-zinc-500 mt-8 animate-pulse">Sincronizando registros...</span>
                            </div>
                        ) : transacoes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-40 bg-zinc-900/20 border border-zinc-800/30 rounded-[40px] border-dashed">
                                <History className="w-16 h-16 text-zinc-800 mb-6" />
                                <span className="text-xl font-black uppercase tracking-[0.2em] text-zinc-600">{t('transactions.noRecords')}</span>
                                <p className="text-zinc-700 font-bold uppercase text-[10px] tracking-widest mt-2">{t('startAdding')}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
                                {transacoes.map((tr) => (
                                    <div key={tr.id} className="group bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-[32px] hover:bg-zinc-900/80 hover:border-emerald-500/20 transition-all duration-300">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center group-hover:scale-110 group-hover:border-emerald-500/30 transition-all duration-500 shadow-2xl">
                                                    {getIcon(tr.tipo)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/80">{getTipoLabel(tr.tipo)}</span>
                                                        <span className="text-[10px] font-bold text-zinc-700">•</span>
                                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-950/50 px-2 py-0.5 rounded-md border border-zinc-800/50">
                                                            {new Date(tr.data + "T00:00:00").toLocaleDateString('pt-BR')}
                                                        </span>
                                                    </div>
                                                    <div className="text-3xl font-black text-white mt-1 italic tracking-tight">{formatarMoeda(tr.valor)}</div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-3">
                                                {tr.quilometragem && (
                                                    <div className="flex items-center gap-2 bg-zinc-950/80 px-4 py-2 rounded-2xl border border-zinc-800/80 group-hover:border-emerald-500/20 transition-colors">
                                                        <Hash className="w-3.5 h-3.5 text-emerald-500/50" />
                                                        <span className="text-xs font-black text-zinc-300 tracking-tighter">{tr.quilometragem.toLocaleString()} <span className="text-[8px] text-zinc-500 uppercase">KM</span></span>
                                                    </div>
                                                )}
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-10 w-10 text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-colors"
                                                        onClick={() => onEdit(tr)}
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-10 w-10 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                                                        onClick={() => handleDelete(tr.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Detalhes específicos de Abastecimento */}
                                        {tr.tipo === 'ABASTECIMENTO' && (tr.litros || tr.posto) && (
                                            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-zinc-800/30">
                                                {tr.litros && (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-orange-500/5 flex items-center justify-center border border-orange-500/10">
                                                            <Droplets className="w-4 h-4 text-orange-500/70" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Quantidade</span>
                                                            <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-tighter">{tr.litros} Litros</span>
                                                        </div>
                                                    </div>
                                                )}
                                                {tr.posto && (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-zinc-800/50 flex items-center justify-center border border-zinc-700/30">
                                                            <MapPin className="w-4 h-4 text-zinc-600" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Local</span>
                                                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-tighter truncate max-w-[150px]">{tr.posto}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {tr.descricao && (
                                            <div className="mt-6 p-4 bg-zinc-950/30 rounded-2xl border border-zinc-800/30 relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/20" />
                                                <p className="text-[11px] font-medium text-zinc-500 italic leading-relaxed">
                                                    "{tr.descricao}"
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
