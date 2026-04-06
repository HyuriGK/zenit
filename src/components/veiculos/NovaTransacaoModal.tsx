'use client';

import { useState, useEffect } from 'react';
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle, 
    SheetDescription 
} from '@/components/ui/sheet';
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

interface TransacaoVeiculoModalProps {
    aberto: boolean;
    veiculoId: string;
    onFechar: () => void;
    onSucesso: () => void;
    transacaoParaEditar?: any;
}

export default function NovaTransacaoModal({ aberto, veiculoId, onFechar, onSucesso, transacaoParaEditar }: TransacaoVeiculoModalProps) {
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

    useEffect(() => {
        if (transacaoParaEditar && aberto) {
            setTipo(transacaoParaEditar.tipo);
            setValor(transacaoParaEditar.valor?.toString() || '');
            setData(new Date(transacaoParaEditar.data).toISOString().split('T')[0]);
            setQuilometragem(transacaoParaEditar.quilometragem?.toString() || '');
            setDescricao(transacaoParaEditar.descricao || '');
            setLitros(transacaoParaEditar.litros?.toString() || '');
            setPosto(transacaoParaEditar.posto || '');
            setPrecoPorLitro(transacaoParaEditar.precoPorLitro?.toString() || '');
        } else if (!transacaoParaEditar && aberto) {
            limparFormulario();
        }
    }, [transacaoParaEditar, aberto]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!valor || !data) {
            toast.error('Preencha os campos obrigatórios (*)');
            return;
        }

        setCarregando(true);
        const loadingToast = toast.loading(transacaoParaEditar ? 'Atualizando registro...' : 'Salvando registro...');

        try {
            const url = transacaoParaEditar 
                ? `/api/veiculos/${veiculoId}/transacoes/${transacaoParaEditar.id}`
                : `/api/veiculos/${veiculoId}/transacoes`;
            const method = transacaoParaEditar ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
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

            toast.success(transacaoParaEditar ? 'Registro atualizado!' : 'Registro adicionado!', { id: loadingToast });
            onSucesso();
            onFechar();
        } catch (error) {
            console.error('Erro:', error);
            toast.error('Erro ao processar solicitação.', { id: loadingToast });
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
            case 'ABASTECIMENTO': return <Fuel className="w-6 h-6 text-orange-500" />;
            case 'MANUTENCAO': return <PenTool className="w-6 h-6 text-blue-500" />;
            case 'INVESTIMENTO': return <TrendingUp className="w-6 h-6 text-emerald-500" />;
            default: return <Plus className="w-6 h-6 text-zinc-500" />;
        }
    };

    return (
        <Sheet open={aberto} onOpenChange={onFechar}>
            <SheetContent side="right" className="bg-zinc-950 border-zinc-800/50 w-full sm:max-w-md p-0 flex flex-col shadow-2xl">
                <SheetHeader className="p-8 pb-4 space-y-4 shrink-0">
                    <SheetTitle className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl">
                            {transacaoParaEditar ? <PenTool className="w-6 h-6 text-emerald-500" /> : getIcon()}
                        </div>
                        {transacaoParaEditar ? 'Editar Registro' : t('transactions.new')}
                    </SheetTitle>
                    <SheetDescription className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-[10px] ml-1">
                        Adicione um novo gasto ou manutenção ao seu veículo
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-8 pb-32 scroll-container">
                    <form onSubmit={handleSubmit} id="transacao-form" className="space-y-8 mt-4">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Tipo de Registro *</Label>
                                <Select value={tipo} onValueChange={(v: any) => setTipo(v)}>
                                    <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white font-bold h-14 rounded-2xl focus:border-zinc-700 transition-all">
                                        <SelectValue placeholder="Selecione o tipo" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800 rounded-2xl shadow-2xl">
                                        <SelectItem value="ABASTECIMENTO" className="font-bold py-3">{t('transactions.refuel')}</SelectItem>
                                        <SelectItem value="MANUTENCAO" className="font-bold py-3">{t('transactions.maintenance')}</SelectItem>
                                        <SelectItem value="INVESTIMENTO" className="font-bold py-3">{t('transactions.investment')}</SelectItem>
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
                                        className="bg-zinc-900 border-zinc-800 text-white font-bold h-14 rounded-2xl focus:border-zinc-700 transition-all placeholder:text-zinc-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t('transactions.date')} *</Label>
                                    <Input
                                        type="date"
                                        value={data}
                                        onChange={(e) => setData(e.target.value)}
                                        required
                                        className="bg-zinc-900 border-zinc-800 text-white font-bold h-14 rounded-2xl focus:border-zinc-700 transition-all"
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
                                    className="bg-zinc-900 border-zinc-800 text-white font-bold h-14 rounded-2xl focus:border-zinc-700 transition-all placeholder:text-zinc-700"
                                />
                            </div>

                            {tipo === 'ABASTECIMENTO' && (
                                <div className="space-y-6 pt-6 border-t border-zinc-900">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t('transactions.liters')}</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={litros}
                                                onChange={(e) => setLitros(e.target.value)}
                                                placeholder="0.00"
                                                className="bg-zinc-900 border-zinc-800 text-white font-bold h-14 rounded-2xl focus:border-zinc-700 transition-all placeholder:text-zinc-700"
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
                                                className="bg-zinc-900 border-zinc-800 text-white font-bold h-14 rounded-2xl focus:border-zinc-700 transition-all placeholder:text-zinc-700"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t('transactions.station')}</Label>
                                        <Input
                                            value={posto}
                                            onChange={(e) => setPosto(e.target.value)}
                                            placeholder="Ex: Ipiranga, Shell"
                                            className="bg-zinc-900 border-zinc-800 text-white font-bold h-14 rounded-2xl focus:border-zinc-700 transition-all placeholder:text-zinc-700"
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
                                    className="bg-zinc-900 border-zinc-800 text-white font-bold rounded-2xl min-h-[120px] resize-none focus:border-zinc-700 transition-all placeholder:text-zinc-700 p-4"
                                />
                            </div>
                        </div>
                    </form>
                </div>

                <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent pt-12 shrink-0">
                    <div className="flex gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onFechar}
                            className="flex-1 border-zinc-800 hover:bg-zinc-900 text-zinc-400 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all"
                            disabled={carregando}
                        >
                            {t('cancel')}
                        </Button>
                        <Button
                            form="transacao-form"
                            type="submit"
                            variant="premium"
                            disabled={carregando}
                            className={`flex-[2] h-14 text-[10px] font-black uppercase tracking-[0.15em] rounded-2xl shadow-xl transition-all ${transacaoParaEditar ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20' : 'shadow-emerald-900/20'}`}
                        >
                            {carregando ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                transacaoParaEditar ? 'Salvar Alterações' : t('save')
                            )}
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
