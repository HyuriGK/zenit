'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatarMoeda } from '@/lib/financeiro-helper';
import { useTranslations } from 'next-intl';
import { Edit2, Save, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

interface DetalhesAtivoModalProps {
    aberto: boolean;
    nomeAtivo: string | null;
    onFechar: () => void;
}

export default function DetalhesAtivoModal({ aberto, nomeAtivo, onFechar }: DetalhesAtivoModalProps) {
    const t = useTranslations('investments');
    const [aportes, setAportes] = useState<any[]>([]);

    const carregarAportes = async () => {
        if (!nomeAtivo) return;
        try {
            const res = await fetch('/api/investimentos');
            if (res.ok) {
                const json = await res.json();
                const filtrados = (json.data || []).filter((a: any) => a.nome === nomeAtivo);
                setAportes(filtrados);
            }
        } catch (error) {
            console.error('Erro ao buscar aportes detalhados:', error);
        }
    };

    useEffect(() => {
        if (aberto && nomeAtivo) {
            carregarAportes();
        }
    }, [aberto, nomeAtivo]);

    const [editandoId, setEditandoId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({
        quantidade: '',
        precoCota: '',
        taxas: '',
        dataCompra: ''
    });

    const parseInput = (value: string) => {
        if (!value) return 0;
        const parsed = parseFloat(value.toString().replace(',', '.'));
        return isNaN(parsed) ? 0 : parsed;
    };

    const iniciarEdicao = (aporte: any) => {
        setEditandoId(aporte.id);
        setEditForm({
            quantidade: aporte.quantidade.toString().replace('.', ','),
            precoCota: (aporte.precoCota || aporte.precoMedio).toString().replace('.', ','),
            taxas: (aporte.taxas || 0).toString().replace('.', ','),
            dataCompra: new Date(aporte.dataCompra).toISOString().split('T')[0]
        });
    };

    const cancelarEdicao = () => {
        setEditandoId(null);
    };

    const salvarEdicao = async (atual: any) => {
        try {
            const qtdNum = parseInput(editForm.quantidade);
            const precoNum = parseInput(editForm.precoCota);
            const taxasNum = parseInput(editForm.taxas);

            if (qtdNum <= 0) {
                toast.error('A quantidade deve ser maior que zero.');
                return;
            }

            const precoMedioValue = ((qtdNum * precoNum) + taxasNum) / qtdNum;

            const bodyPayload = {
                id: atual.id,
                quantidade: qtdNum,
                precoCota: precoNum,
                taxas: taxasNum,
                precoMedio: precoMedioValue,
                dataCompra: new Date(editForm.dataCompra).toISOString()
            };

            const response = await fetch('/api/investimentos', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyPayload)
            });

            if (!response.ok) throw new Error('Falha ao atualizar na Nuvem');

            toast.success('Aporte atualizado com sucesso!', { className: "bg-green-500/10 text-green-400 border border-green-500/20" });
            setEditandoId(null);
            carregarAportes();
        } catch (error) {
            console.error('Erro ao atualizar aporte', error);
            toast.error('Erro ao salvar as edições.');
        }
    };

    const deletarAporte = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir permanentemente este aporte indivual?')) {
            try {
                const res = await fetch(`/api/investimentos?id=${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Falha na exclusão (Neon)');

                toast.success('Aporte excluído.', { className: "bg-green-500/10 text-green-400 border border-green-500/20" });

                // Fetch the new list and check length
                await carregarAportes();
                onFechar();
                // If the local state was updated directly, checking aportes.length === 1 is slightly off 
                // because state hasn't updated. Alternatively, we just check if it was 1 before deletion.
                if (aportes.length <= 1) {
                    onFechar();
                }
            } catch (error) {
                toast.error('Erro ao excluir aporte.');
            }
        }
    };

    return (
        <Dialog open={aberto} onOpenChange={onFechar}>
            <DialogContent className="bg-zinc-950/95 backdrop-blur-2xl border-zinc-800/50 w-[95vw] !max-w-[1000px] h-[85vh] overflow-hidden flex flex-col p-8 rounded-3xl">
                <DialogHeader className="shrink-0 mb-8">
                    <DialogTitle className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">
                        Aportes Detalhados: <span className="text-white ml-2">{nomeAtivo}</span>
                    </DialogTitle>
                    <DialogDescription className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-2">
                        Visualize e edite individualmente todos os lançamentos para este ativo.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-800">
                    {!aportes || aportes.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 flex items-center justify-center mx-auto mb-6">
                                <Trash2 className="w-8 h-8 text-zinc-800" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Nenhum aporte encontrado.</p>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-zinc-800/50 overflow-hidden bg-zinc-900/20 shadow-2xl">
                            <table className="w-full text-sm text-left">
                                <thead className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] bg-zinc-950/50 border-b border-zinc-800/50 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-4">Data</th>
                                        <th className="px-6 py-4 text-right">Quantidade</th>
                                        <th className="px-6 py-4 text-right">Preço/Cota</th>
                                        <th className="px-6 py-4 text-right">Taxas</th>
                                        <th className="px-6 py-4 text-right">Aplicado</th>
                                        <th className="px-6 py-4 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/30">
                                    {aportes.sort((a, b) => new Date(b.dataCompra).getTime() - new Date(a.dataCompra).getTime()).map((aporte: any) => {
                                        const isEditing = editandoId === aporte.id;
                                        const cotaPrice = aporte.precoCota !== undefined ? aporte.precoCota : aporte.precoMedio;
                                        const feePrice = aporte.taxas || 0;
                                        const totalDisplay = (aporte.quantidade * cotaPrice);

                                        return (
                                            <tr key={aporte.id} className="hover:bg-zinc-900/40 transition-all group">
                                                {/* Data */}
                                                <td className="px-6 py-5">
                                                    {isEditing ? (
                                                        <Input
                                                            type="date"
                                                            value={editForm.dataCompra}
                                                            onChange={e => setEditForm({ ...editForm, dataCompra: e.target.value })}
                                                            className="h-9 bg-zinc-950 border-zinc-800 text-xs font-bold text-white min-w-[130px] rounded-lg"
                                                        />
                                                    ) : (
                                                        <span className="text-xs font-bold text-zinc-400">
                                                            {new Date(aporte.dataCompra).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Quantidade */}
                                                <td className="px-6 py-5 text-right">
                                                    {isEditing ? (
                                                        <Input
                                                            type="text"
                                                            inputMode="decimal"
                                                            value={editForm.quantidade}
                                                            onChange={e => setEditForm({ ...editForm, quantidade: e.target.value })}
                                                            className="h-9 bg-zinc-950 border-zinc-800 text-xs font-bold text-white w-24 ml-auto text-right rounded-lg"
                                                        />
                                                    ) : (
                                                        <span className="text-sm font-black text-zinc-100">
                                                            {aporte.quantidade.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 6 })}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Preço/Cota */}
                                                <td className="px-6 py-5 text-right">
                                                    {isEditing ? (
                                                        <Input
                                                            type="text"
                                                            inputMode="decimal"
                                                            value={editForm.precoCota}
                                                            onChange={e => setEditForm({ ...editForm, precoCota: e.target.value })}
                                                            className="h-9 bg-zinc-950 border-zinc-800 text-xs font-bold text-white w-28 ml-auto text-right rounded-lg"
                                                        />
                                                    ) : (
                                                        <span className="text-xs font-bold text-zinc-300">{formatarMoeda(cotaPrice)}</span>
                                                    )}
                                                </td>

                                                {/* Taxas */}
                                                <td className="px-6 py-5 text-right">
                                                    {isEditing ? (
                                                        <Input
                                                            type="text"
                                                            inputMode="decimal"
                                                            value={editForm.taxas}
                                                            onChange={e => setEditForm({ ...editForm, taxas: e.target.value })}
                                                            className="h-9 bg-zinc-950 border-zinc-800 text-xs font-bold text-white w-24 ml-auto text-right rounded-lg"
                                                        />
                                                    ) : (
                                                        <span className="text-xs font-bold text-zinc-500">{formatarMoeda(feePrice)}</span>
                                                    )}
                                                </td>

                                                {/* Valor Aplicado */}
                                                <td className="px-6 py-5 text-right font-black text-emerald-500/80">
                                                    {isEditing ? '-' : formatarMoeda(totalDisplay)}
                                                </td>

                                                {/* Ações */}
                                                <td className="px-6 py-5 text-center">
                                                    {isEditing ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button onClick={() => salvarEdicao(aporte)} className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all" title="Salvar">
                                                                <Save className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={cancelarEdicao} className="p-2 text-zinc-600 hover:text-white hover:bg-zinc-800 rounded-lg transition-all" title="Cancelar">
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                            <button onClick={() => iniciarEdicao(aporte)} className="p-2 text-blue-500/70 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all" title="Editar Aporte">
                                                                <Edit2 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button onClick={() => deletarAporte(aporte.id)} className="p-2 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all" title="Excluir Aporte">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="shrink-0 pt-8 flex justify-end">
                    <Button onClick={onFechar} variant="outline" className="border-zinc-800 hover:bg-zinc-800 text-zinc-400 font-black uppercase tracking-widest text-[10px] h-11 px-8 rounded-xl transition-all">
                        Fechar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
