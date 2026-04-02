'use client';

import { useState, useEffect } from 'react';
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
    Trash2
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatarMoeda } from '@/lib/financeiro-helper';
import { toast } from 'sonner';

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
            <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl rounded-3xl p-8 max-h-[85vh] flex flex-col">
                <DialogHeader className="mb-6">
                    <DialogTitle className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-2">
                        <History className="w-4 h-4 text-emerald-500" />
                        {t('transactions.title')}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-800">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 grayscale opacity-20">
                            <History className="w-10 h-10 animate-spin mb-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Carregando histórico...</span>
                        </div>
                    ) : transacoes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-zinc-950/20 border border-zinc-800/30 rounded-[32px] border-dashed">
                            <History className="w-10 h-10 text-zinc-800 mb-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">{t('transactions.noRecords')}</span>
                        </div>
                    ) : (
                        <div className="space-y-4 pb-10">
                            {transacoes.map((tr) => (
                                <div key={tr.id} className="group bg-zinc-950/40 border border-zinc-800/50 p-5 rounded-2xl hover:bg-zinc-950/60 transition-all duration-300">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                {getIcon(tr.tipo)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{getTipoLabel(tr.tipo)}</span>
                                                    <span className="text-[10px] font-bold text-zinc-600">•</span>
                                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                                        {new Date(tr.data + "T00:00:00").toLocaleDateString('pt-BR')}
                                                    </span>
                                                </div>
                                                <div className="text-xl font-black text-white mt-0.5">{formatarMoeda(tr.valor)}</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {tr.quilometragem && (
                                                <div className="flex items-center gap-2 bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-zinc-800/50">
                                                    <Hash className="w-3 h-3 text-emerald-500/50" />
                                                    <span className="text-[10px] font-black text-zinc-400">{tr.quilometragem.toLocaleString()} KM</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-zinc-600 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg"
                                                    onClick={() => onEdit(tr)}
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                                                    onClick={() => handleDelete(tr.id)}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Additional info for refuel */}
                                    {tr.tipo === 'ABASTECIMENTO' && (tr.litros || tr.posto) && (
                                        <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-zinc-800/30">
                                            {tr.litros && (
                                                <div className="flex items-center gap-2">
                                                    <Droplets className="w-3 h-3 text-orange-500/50" />
                                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{tr.litros} Litros</span>
                                                </div>
                                            )}
                                            {tr.posto && (
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-3 h-3 text-zinc-600" />
                                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest truncate">{tr.posto}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {tr.descricao && (
                                        <div className="mt-4 p-3 bg-zinc-900/40 rounded-xl border border-zinc-800/30">
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed italic line-clamp-2">
                                                "{tr.descricao}"
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
