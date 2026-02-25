'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/dexie';
import { useLiveQuery } from 'dexie-react-hooks';
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
    const aportes = useLiveQuery(
        () => nomeAtivo ? db.ativosInvestimento.where('nome').equals(nomeAtivo).toArray() : [],
        [nomeAtivo]
    );

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

            await db.ativosInvestimento.update(atual.id, {
                quantidade: qtdNum,
                precoCota: precoNum,
                taxas: taxasNum,
                precoMedio: precoMedioValue,
                dataCompra: new Date(editForm.dataCompra),
                updatedAt: new Date()
            });

            toast.success('Aporte atualizado com sucesso!', { className: "bg-green-500/10 text-green-400 border border-green-500/20" });
            setEditandoId(null);
        } catch (error) {
            console.error('Erro ao atualizar aporte', error);
            toast.error('Erro ao salvar as edições.');
        }
    };

    const deletarAporte = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir permanentemente este aporte indivual?')) {
            try {
                await db.ativosInvestimento.delete(id);
                toast.success('Aporte excluído.', { className: "bg-green-500/10 text-green-400 border border-green-500/20" });
                // Se era o último, fecha o modal
                if (aportes?.length === 1) {
                    onFechar();
                }
            } catch (error) {
                toast.error('Erro ao excluir aporte.');
            }
        }
    };

    return (
        <Dialog open={aberto} onOpenChange={onFechar}>
            <DialogContent className="bg-zinc-900 border-zinc-800 w-[95vw] !max-w-[95vw] h-[95vh] overflow-hidden flex flex-col p-4 sm:p-6">
                <DialogHeader className="shrink-0">
                    <DialogTitle className="text-2xl font-bold text-white flex items-center justify-between">
                        <span>Aportes Detalhados: <span className="text-green-500">{nomeAtivo}</span></span>
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Visualize e edite individualmente todos os lançamentos para este ativo.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto mt-4 pr-2">
                    {!aportes || aportes.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500">Nenhum aporte encontrado.</div>
                    ) : (
                        <div className="rounded-md border border-zinc-800">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-zinc-400 uppercase bg-zinc-900/80 border-b border-zinc-800 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-3">Data</th>
                                        <th className="px-4 py-3 text-right">Quantidade</th>
                                        <th className="px-4 py-3 text-right">Preço/Cota</th>
                                        <th className="px-4 py-3 text-right">Taxas</th>
                                        <th className="px-4 py-3 text-right">Valor Aplicado</th>
                                        <th className="px-4 py-3 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50 bg-zinc-900/30">
                                    {aportes.sort((a, b) => new Date(b.dataCompra).getTime() - new Date(a.dataCompra).getTime()).map((aporte: any) => {
                                        const isEditing = editandoId === aporte.id;

                                        // Usamos precoCota se existir, senao fallback p/ precoMedio (legado)
                                        const cotaPrice = aporte.precoCota !== undefined ? aporte.precoCota : aporte.precoMedio;
                                        const feePrice = aporte.taxas || 0;
                                        const totalDisplay = (aporte.quantidade * cotaPrice);

                                        return (
                                            <tr key={aporte.id} className="hover:bg-zinc-800/30 transition-colors">
                                                {/* Data */}
                                                <td className="px-4 py-3">
                                                    {isEditing ? (
                                                        <Input
                                                            type="date"
                                                            value={editForm.dataCompra}
                                                            onChange={e => setEditForm({ ...editForm, dataCompra: e.target.value })}
                                                            className="h-8 bg-zinc-950 border-zinc-700 text-white min-w-[130px]"
                                                        />
                                                    ) : (
                                                        <span className="text-zinc-300">
                                                            {new Date(aporte.dataCompra).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Quantidade */}
                                                <td className="px-4 py-3 text-right">
                                                    {isEditing ? (
                                                        <Input
                                                            type="text"
                                                            inputMode="decimal"
                                                            value={editForm.quantidade}
                                                            onChange={e => setEditForm({ ...editForm, quantidade: e.target.value })}
                                                            className="h-8 bg-zinc-950 border-zinc-700 text-white w-24 ml-auto text-right"
                                                        />
                                                    ) : (
                                                        <span className="text-white">
                                                            {aporte.quantidade.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 6 })}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Preço/Cota */}
                                                <td className="px-4 py-3 text-right">
                                                    {isEditing ? (
                                                        <Input
                                                            type="text"
                                                            inputMode="decimal"
                                                            value={editForm.precoCota}
                                                            onChange={e => setEditForm({ ...editForm, precoCota: e.target.value })}
                                                            className="h-8 bg-zinc-950 border-zinc-700 text-white w-28 ml-auto text-right"
                                                        />
                                                    ) : (
                                                        <span className="text-zinc-300">{formatarMoeda(cotaPrice)}</span>
                                                    )}
                                                </td>

                                                {/* Taxas */}
                                                <td className="px-4 py-3 text-right">
                                                    {isEditing ? (
                                                        <Input
                                                            type="text"
                                                            inputMode="decimal"
                                                            value={editForm.taxas}
                                                            onChange={e => setEditForm({ ...editForm, taxas: e.target.value })}
                                                            className="h-8 bg-zinc-950 border-zinc-700 text-white w-24 ml-auto text-right"
                                                        />
                                                    ) : (
                                                        <span className="text-zinc-400">{formatarMoeda(feePrice)}</span>
                                                    )}
                                                </td>

                                                {/* Valor Aplicado */}
                                                <td className="px-4 py-3 text-right font-medium text-white">
                                                    {isEditing ? '-' : formatarMoeda(totalDisplay)}
                                                </td>

                                                {/* Ações */}
                                                <td className="px-4 py-3 text-center">
                                                    {isEditing ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button onClick={() => salvarEdicao(aporte)} className="p-1.5 text-green-500 hover:bg-green-500/20 rounded-md transition-colors" title="Salvar">
                                                                <Save className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={cancelarEdicao} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-md transition-colors" title="Cancelar">
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button onClick={() => iniciarEdicao(aporte)} className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded-md transition-colors" title="Editar Aporte">
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => deletarAporte(aporte.id)} className="p-1.5 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors" title="Excluir Aporte">
                                                                <Trash2 className="w-4 h-4" />
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

                <div className="shrink-0 pt-4 flex justify-end">
                    <Button onClick={onFechar} variant="outline" className="border-zinc-700 hover:bg-zinc-800 text-white">
                        Fechar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
