'use client';

import { useState } from 'react';
import { db } from '@/lib/dexie';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface NovoAtivoModalProps {
    aberto: boolean;
    onFechar: () => void;
    onSucesso: () => void;
}

export default function NovoAtivoModal({ aberto, onFechar, onSucesso }: NovoAtivoModalProps) {
    const t = useTranslations('investments');
    const [carregando, setCarregando] = useState(false);

    const [nome, setNome] = useState('');
    const [tipo, setTipo] = useState<'ACAO' | 'FII' | 'RENDA_FIXA' | 'CRIPTO' | 'OUTRO'>('ACAO');
    const [quantidade, setQuantidade] = useState('');
    const [precoCota, setPrecoCota] = useState('');
    const [taxas, setTaxas] = useState('');
    const [dataCompra, setDataCompra] = useState(new Date().toISOString().split('T')[0]);

    const parseInput = (value: string) => {
        if (!value) return 0;
        // substitui vírgula por ponto para parsing
        const parsed = parseFloat(value.replace(',', '.'));
        return isNaN(parsed) ? 0 : parsed;
    };

    const precoMedioCalculado = () => {
        const precoNum = parseInput(precoCota);
        return precoNum;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!nome || !quantidade || !precoCota) {
            toast.error('Preencha os campos obrigatórios');
            return;
        }

        setCarregando(true);
        const loadingToast = toast.loading(t('adding'));

        try {
            const qtdNum = parseInput(quantidade);
            const precoNum = parseInput(precoCota);
            const taxasNum = parseInput(taxas);
            const precoMedioValue = precoNum;

            const ativo = {
                id: crypto.randomUUID(),
                nome: nome.toUpperCase(),
                tipo,
                quantidade: qtdNum,
                precoCota: precoNum,
                taxas: taxasNum,
                precoMedio: precoMedioValue,
                valorAtual: precoNum, // por padrão, inicia igual ao preço da cota
                dataCompra: new Date(dataCompra),
                updatedAt: new Date(),
            };

            await db.ativosInvestimento.add(ativo);

            limparFormulario();
            toast.success('Ativo adicionado com sucesso!', { id: loadingToast });
            onSucesso();
            onFechar();
        } catch (error) {
            console.error('Erro:', error);
            toast.error('Erro ao adicionar ativo. Tente novamente.', { id: loadingToast });
        } finally {
            setCarregando(false);
        }
    };

    const limparFormulario = () => {
        setNome('');
        setTipo('ACAO');
        setQuantidade('');
        setPrecoCota('');
        setTaxas('');
        setDataCompra(new Date().toISOString().split('T')[0]);
    };

    return (
        <Dialog open={aberto} onOpenChange={onFechar}>
            <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                        <Plus className="w-6 h-6 text-green-500" />
                        {t('newAsset')}
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        {t('startAddingAssets')}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <Label className="text-zinc-300">{t('assetName')} *</Label>
                        <Input
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            placeholder={t('assetNamePlaceholder')}
                            required
                            className="bg-zinc-900/50 border-zinc-800 focus:border-green-500 text-white uppercase"
                        />
                    </div>

                    <div>
                        <Label className="text-zinc-300">{t('type')} *</Label>
                        <Select value={tipo} onValueChange={(value: any) => setTipo(value)}>
                            <SelectTrigger className="bg-zinc-900/50 border-zinc-800 text-white">
                                <SelectValue placeholder="Selecione o tipo do ativo" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800">
                                <SelectItem value="ACAO" className="text-white hover:bg-zinc-800">{t('types.ACAO')}</SelectItem>
                                <SelectItem value="FII" className="text-white hover:bg-zinc-800">{t('types.FII')}</SelectItem>
                                <SelectItem value="RENDA_FIXA" className="text-white hover:bg-zinc-800">{t('types.RENDA_FIXA')}</SelectItem>
                                <SelectItem value="CRIPTO" className="text-white hover:bg-zinc-800">{t('types.CRIPTO')}</SelectItem>
                                <SelectItem value="OUTRO" className="text-white hover:bg-zinc-800">{t('types.OUTRO')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-zinc-300">{t('quantity')} *</Label>
                            <Input
                                type="text"
                                inputMode="decimal"
                                value={quantidade}
                                onChange={(e) => setQuantidade(e.target.value)}
                                placeholder="0.00"
                                required
                                className="bg-zinc-900/50 border-zinc-800 focus:border-green-500 text-white"
                            />
                        </div>
                        <div>
                            <Label className="text-zinc-300">{t('pricePerShare')} *</Label>
                            <Input
                                type="text"
                                inputMode="decimal"
                                value={precoCota}
                                onChange={(e) => setPrecoCota(e.target.value)}
                                placeholder="R$ 0,00"
                                required
                                className="bg-zinc-900/50 border-zinc-800 focus:border-green-500 text-white"
                            />
                        </div>
                        <div>
                            <Label className="text-zinc-300">{t('fees')}</Label>
                            <Input
                                type="text"
                                inputMode="decimal"
                                value={taxas}
                                onChange={(e) => setTaxas(e.target.value)}
                                placeholder="R$ 0,00"
                                className="bg-zinc-900/50 border-zinc-800 focus:border-green-500 text-white"
                            />
                        </div>
                    </div>

                    <div className="p-3 rounded-lg border border-green-500/20 bg-green-500/5">
                        <div className="text-sm text-zinc-400">{t('averagePrice')}</div>
                        <div className="text-lg font-bold text-green-500">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(precoMedioCalculado())}
                        </div>
                    </div>

                    <div>
                        <Label className="text-zinc-300">Data de Compra *</Label>
                        <Input
                            type="date"
                            value={dataCompra}
                            onChange={(e) => setDataCompra(e.target.value)}
                            required
                            className="bg-zinc-900/50 border-zinc-800 focus:border-green-500 text-white"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="default"
                            onClick={onFechar}
                            className="flex-1 border-zinc-800 hover:bg-zinc-800"
                            disabled={carregando}
                        >
                            {t('cancel')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={carregando}
                            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50"
                        >
                            {carregando ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {t('saving')}
                                </>
                            ) : (
                                t('save')
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
