'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, PenTool, Fuel, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface NovaTransacaoModalProps {
    aberto: boolean;
    veiculoId: string;
    onFechar: () => void;
    onSucesso: () => void;
}

export default function NovaTransacaoModal({ aberto, veiculoId, onFechar, onSucesso }: NovaTransacaoModalProps) {
    const t = useTranslations('vehicles');
    const [carregando, setCarregando] = useState(false);

    const [tipo, setTipo] = useState<'ABASTECIMENTO' | 'MANUTENCAO' | 'INVESTIMENTO'>('ABASTECIMENTO');
    const [valor, setValor] = useState('');
    const [data, setData] = useState(new Date().toISOString().split('T')[0]);
    const [quilometragem, setQuilometragem] = useState('');
    const [descricao, setDescricao] = useState('');
    
    // Refuel specifics
    const [litros, setLitros] = useState('');
    const [posto, setPosto] = useState('');
    const [precoPorLitro, setPrecoPorLitro] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!valor || !data) {
            toast.error('Preencha os campos obrigatórios (*)');
            return;
        }

        setCarregando(true);
        const loadingToast = toast.loading('Salvando registro...');

        try {
            const response = await fetch(`/api/veiculos/${veiculoId}/transacoes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tipo,
                    valor,
                    data,
                    quilometragem: quilometragem || null,
                    descricao: descricao || null,
                    litros: tipo === 'ABASTECIMENTO' ? (litros || null) : null,
                    posto: tipo === 'ABASTECIMENTO' ? (posto || null) : null,
                    precoPorLitro: tipo === 'ABASTECIMENTO' ? (precoPorLitro || null) : null,
                }),
            });

            if (!response.ok) throw new Error('Falha ao salvar registro');

            limparFormulario();
            toast.success('Registro adicionado com sucesso!', { id: loadingToast });
            onSucesso();
            onFechar();
        } catch (error) {
            console.error('Erro:', error);
            toast.error('Erro ao salvar registro.', { id: loadingToast });
        } finally {
            setCarregando(false);
        }
    };

    const limparFormulario = () => {
        setTipo('ABASTECIMENTO');
        setValor('');
        setData(new Date().toISOString().split('T')[0]);
        setQuilometragem('');
        setDescricao('');
        setLitros('');
        setPosto('');
        setPrecoPorLitro('');
    };

    const getIcon = () => {
        switch (tipo) {
            case 'ABASTECIMENTO': return <Fuel className="w-4 h-4 text-orange-500" />;
            case 'MANUTENCAO': return <PenTool className="w-4 h-4 text-blue-500" />;
            case 'INVESTIMENTO': return <TrendingUp className="w-4 h-4 text-emerald-500" />;
            default: return <Plus className="w-4 h-4 text-zinc-500" />;
        }
    };

    return (
        <Dialog open={aberto} onOpenChange={onFechar}>
            <DialogContent className="bg-zinc-900/90 backdrop-blur-xl border-zinc-800/50 max-w-xl rounded-3xl p-8 scrollbar-thin scrollbar-thumb-zinc-800 overflow-y-auto max-h-[90vh]">
                <DialogHeader className="mb-8">
                    <DialogTitle className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-2">
                        {getIcon()}
                        {t('transactions.new')}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Tipo de Registro *</Label>
                        <Select value={tipo} onValueChange={(v: any) => setTipo(v)}>
                            <SelectTrigger className="bg-zinc-950/50 border-zinc-800/50 text-white font-bold h-12 rounded-xl">
                                <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800 rounded-xl">
                                <SelectItem value="ABASTECIMENTO" className="font-bold">{t('transactions.refuel')}</SelectItem>
                                <SelectItem value="MANUTENCAO" className="font-bold">{t('transactions.maintenance')}</SelectItem>
                                <SelectItem value="INVESTIMENTO" className="font-bold">{t('transactions.investment')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t('transactions.value')} *</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={valor}
                                onChange={(e) => setValor(e.target.value)}
                                placeholder="0.00"
                                required
                                className="bg-zinc-950/50 border-zinc-800/50 focus:border-emerald-500/50 text-white font-bold h-12 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t('transactions.date')} *</Label>
                            <Input
                                type="date"
                                value={data}
                                onChange={(e) => setData(e.target.value)}
                                required
                                className="bg-zinc-950/50 border-zinc-800/50 focus:border-emerald-500/50 text-white font-bold h-12 rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t('transactions.km')}</Label>
                        <Input
                            type="number"
                            value={quilometragem}
                            onChange={(e) => setQuilometragem(e.target.value)}
                            placeholder="KM atual"
                            className="bg-zinc-950/50 border-zinc-800/50 focus:border-emerald-500/50 text-white font-bold h-12 rounded-xl"
                        />
                    </div>

                    {tipo === 'ABASTECIMENTO' && (
                        <div className="space-y-6 pt-2 border-t border-zinc-800/50">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t('transactions.liters')}</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={litros}
                                        onChange={(e) => setLitros(e.target.value)}
                                        placeholder="0.00"
                                        className="bg-zinc-950/50 border-zinc-800/50 focus:border-emerald-500/50 text-white font-bold h-12 rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t('transactions.pricePerLiter')}</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={precoPorLitro}
                                        onChange={(e) => setPrecoPorLitro(e.target.value)}
                                        placeholder="0.00"
                                        className="bg-zinc-950/50 border-zinc-800/50 focus:border-emerald-500/50 text-white font-bold h-12 rounded-xl"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t('transactions.station')}</Label>
                                <Input
                                    value={posto}
                                    onChange={(e) => setPosto(e.target.value)}
                                    placeholder="Ex: Ipiranga, Shell"
                                    className="bg-zinc-950/50 border-zinc-800/50 focus:border-emerald-500/50 text-white font-bold h-12 rounded-xl"
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t('transactions.description')}</Label>
                        <Textarea
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            placeholder="Detalhes adicionais..."
                            className="bg-zinc-950/50 border-zinc-800/50 focus:border-emerald-500/50 text-white font-bold rounded-xl min-h-[100px] resize-none"
                        />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onFechar}
                            className="flex-1 border-zinc-800 hover:bg-zinc-800 h-12 rounded-xl font-black uppercase tracking-widest text-[10px]"
                            disabled={carregando}
                        >
                            {t('cancel')}
                        </Button>
                        <Button
                            type="submit"
                            variant="premium"
                            disabled={carregando}
                            className="flex-1 h-12 text-[10px] font-black uppercase tracking-widest"
                        >
                            {carregando ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
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
