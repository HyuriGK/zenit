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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2, Car, PenTool, X, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface VeiculoModalProps {
    aberto: boolean;
    onFechar: () => void;
    onSucesso: () => void;
    veiculoParaEditar?: any;
}

export default function NovoVeiculoModal({ aberto, onFechar, onSucesso, veiculoParaEditar }: VeiculoModalProps) {
    const t = useTranslations('vehicles');
    const [carregando, setCarregando] = useState(false);

    const [nome, setNome] = useState('');
    const [modelo, setModelo] = useState('');
    const [marca, setMarca] = useState('');
    const [placa, setPlaca] = useState('');
    const [ano, setAno] = useState(new Date().getFullYear().toString());
    const [cor, setCor] = useState('');
    const [quilometragemInicial, setQuilometragemInicial] = useState('');
    const [quilometragemAtual, setQuilometragemAtual] = useState('');
    const [tipoCombustivel, setTipoCombustivel] = useState('FLEX');
    const [valorFipe, setValorFipe] = useState('');

    // FIPE States
    const [usarFipe, setUsarFipe] = useState(false);
    const [marcas, setMarcas] = useState<any[]>([]);
    const [modelos, setModelos] = useState<any[]>([]);
    const [anos, setAnos] = useState<any[]>([]);
    const [fipeLoading, setFipeLoading] = useState(false);
    
    const [fipeMarca, setFipeMarca] = useState('');
    const [fipeModelo, setFipeModelo] = useState('');
    const [fipeAno, setFipeAno] = useState('');

    useEffect(() => {
        if (veiculoParaEditar && aberto) {
            setNome(veiculoParaEditar.nome || '');
            setModelo(veiculoParaEditar.modelo || '');
            setMarca(veiculoParaEditar.marca || '');
            setPlaca(veiculoParaEditar.placa || '');
            setAno(veiculoParaEditar.ano?.toString() || new Date().getFullYear().toString());
            setCor(veiculoParaEditar.cor || '');
            setQuilometragemInicial(veiculoParaEditar.quilometragemInicial?.toString() || '');
            setQuilometragemAtual(veiculoParaEditar.quilometragemAtual?.toString() || '');
            setTipoCombustivel(veiculoParaEditar.tipoCombustivel || 'FLEX');
            setValorFipe(veiculoParaEditar.valorFipe || '');
        } else if (!veiculoParaEditar && aberto) {
            limparFormulario();
        }
    }, [veiculoParaEditar, aberto]);

    // FIPE Fetching
    useEffect(() => {
        if (usarFipe && marcas.length === 0) {
            fetch('https://parallelum.com.br/fipe/api/v1/carros/marcas')
                .then(res => res.json())
                .then(data => setMarcas(data))
                .catch(err => console.error('Erro fipe marcas:', err));
        }
    }, [usarFipe]);

    useEffect(() => {
        if (fipeMarca) {
            setFipeLoading(true);
            fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${fipeMarca}/modelos`)
                .then(res => res.json())
                .then(data => {
                    setModelos(data.modelos);
                    setFipeModelo('');
                    setFipeAno('');
                })
                .finally(() => setFipeLoading(false));
        }
    }, [fipeMarca]);

    useEffect(() => {
        if (fipeMarca && fipeModelo) {
            setFipeLoading(true);
            fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${fipeMarca}/modelos/${fipeModelo}/anos`)
                .then(res => res.json())
                .then(data => {
                    setAnos(data);
                    setFipeAno('');
                })
                .finally(() => setFipeLoading(false));
        }
    }, [fipeMarca, fipeModelo]);

    useEffect(() => {
        if (fipeMarca && fipeModelo && fipeAno) {
            setFipeLoading(true);
            fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${fipeMarca}/modelos/${fipeModelo}/anos/${fipeAno}`)
                .then(res => res.json())
                .then(data => {
                    setValorFipe(data.Valor);
                    setMarca(data.Marca);
                    setModelo(data.Modelo);
                    setAno(data.AnoModelo.toString());
                    setTipoCombustivel(data.Combustivel === 'Gasolina' ? 'GASOLINA' : (data.Combustivel === 'Álcool' ? 'ETANOL' : 'FLEX'));
                })
                .finally(() => setFipeLoading(false));
        }
    }, [fipeMarca, fipeModelo, fipeAno]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!nome || !ano || !quilometragemInicial) {
            toast.error('Preencha os campos obrigatórios (*)');
            return;
        }

        setCarregando(true);
        const loadingToast = toast.loading(veiculoParaEditar ? 'Atualizando veículo...' : 'Salvando veículo...');

        try {
            const url = veiculoParaEditar ? `/api/veiculos/${veiculoParaEditar.id}` : '/api/veiculos';
            const method = veiculoParaEditar ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome,
                    modelo,
                    marca,
                    placa,
                    ano,
                    cor,
                    quilometragemInicial,
                    quilometragemAtual: veiculoParaEditar ? quilometragemAtual : quilometragemInicial,
                    tipoCombustivel,
                    valorFipe
                }),
            });

            if (!response.ok) throw new Error('Falha ao salvar veículo');

            toast.success(veiculoParaEditar ? 'Veículo atualizado!' : 'Veículo cadastrado!', { id: loadingToast });
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
        setNome('');
        setModelo('');
        setMarca('');
        setPlaca('');
        setAno(new Date().getFullYear().toString());
        setCor('');
        setQuilometragemInicial('');
        setQuilometragemAtual('');
        setTipoCombustivel('FLEX');
        setValorFipe('');
        setUsarFipe(false);
    };

    return (
        <Sheet open={aberto} onOpenChange={onFechar}>
            <SheetContent side="right" className="bg-zinc-950 border-zinc-800/50 w-full sm:max-w-md p-0 flex flex-col shadow-2xl">
                <SheetHeader className="p-8 pb-4 space-y-4 shrink-0">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                {veiculoParaEditar ? <PenTool className="w-6 h-6" /> : <Car className="w-6 h-6" />}
                            </div>
                            {veiculoParaEditar ? 'Editar Veículo' : t('newVehicle')}
                        </SheetTitle>
                    </div>
                    <SheetDescription className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-[10px] ml-1">
                        {veiculoParaEditar ? 'Atualize as informações do seu veículo' : t('startAdding')}
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-8 pb-20 scroll-container">
                    <div className="mb-6">
                        <Button 
                            variant="outline" 
                            onClick={() => setUsarFipe(!usarFipe)}
                            className={`w-full h-12 rounded-2xl border-dashed border-zinc-800 flex items-center justify-center gap-2 transition-all ${usarFipe ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'text-zinc-500 hover:text-white hover:border-zinc-700'}`}
                        >
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{usarFipe ? 'Modo Manual' : 'Consultar Tabela FIPE'}</span>
                        </Button>
                    </div>

                    <form onSubmit={handleSubmit} id="veiculo-form" className="space-y-8 mt-4">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t('name')} *</Label>
                                <Input
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                    placeholder="Ex: Meu Carro, SUV Prata"
                                    required
                                    className="bg-zinc-900/50 border-zinc-800 text-white font-bold h-14 rounded-2xl focus:border-emerald-500/50 transition-all placeholder:text-zinc-700"
                                />
                            </div>

                            {usarFipe ? (
                                <div className="space-y-4 p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800/50">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Marca</Label>
                                        <Select value={fipeMarca} onValueChange={setFipeMarca}>
                                            <SelectTrigger className="bg-zinc-900 border-zinc-800 h-14 rounded-2xl text-white font-bold">
                                                <SelectValue placeholder="Selecione a marca" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-zinc-800 rounded-2xl max-h-60">
                                                {marcas.map(m => <SelectItem key={m.codigo} value={m.codigo}>{m.nome}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Modelo</Label>
                                        <Select value={fipeModelo} onValueChange={setFipeModelo} disabled={!fipeMarca || fipeLoading}>
                                            <SelectTrigger className="bg-zinc-900 border-zinc-800 h-14 rounded-2xl text-white font-bold">
                                                <SelectValue placeholder="Selecione o modelo" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-zinc-800 rounded-2xl max-h-60">
                                                {modelos.map(m => <SelectItem key={m.codigo} value={m.codigo.toString()}>{m.nome}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Ano</Label>
                                        <Select value={fipeAno} onValueChange={setFipeAno} disabled={!fipeModelo || fipeLoading}>
                                            <SelectTrigger className="bg-zinc-900 border-zinc-800 h-14 rounded-2xl text-white font-bold">
                                                <SelectValue placeholder="Selecione o ano" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-zinc-800 rounded-2xl max-h-60">
                                                {anos.map(a => <SelectItem key={a.codigo} value={a.codigo}>{a.nome}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {valorFipe && (
                                        <div className="mt-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center animate-in fade-in slide-in-from-top-2">
                                            <p className="text-[10px] font-black uppercase text-emerald-500/70 tracking-widest">Valor FIPE Atual</p>
                                            <p className="text-2xl font-black text-emerald-400 mt-1">{valorFipe}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t('brand')}</Label>
                                            <Input
                                                value={marca}
                                                onChange={(e) => setMarca(e.target.value)}
                                                placeholder="Ex: Toyota"
                                                className="bg-zinc-900/50 border-zinc-800 text-white font-bold h-14 rounded-2xl focus:border-emerald-500/50 transition-all placeholder:text-zinc-700"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t('model')}</Label>
                                            <Input
                                                value={modelo}
                                                onChange={(e) => setModelo(e.target.value)}
                                                placeholder="Ex: Corolla"
                                                className="bg-zinc-900/50 border-zinc-800 text-white font-bold h-14 rounded-2xl focus:border-emerald-500/50 transition-all placeholder:text-zinc-700"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t('plate')}</Label>
                                            <Input
                                                value={placa}
                                                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                                                placeholder="ABC-1234"
                                                className="bg-zinc-900/50 border-zinc-800 text-white font-bold h-14 rounded-2xl focus:border-emerald-500/50 transition-all placeholder:text-zinc-700 uppercase"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t('year')} *</Label>
                                            <Input
                                                type="number"
                                                value={ano}
                                                onChange={(e) => setAno(e.target.value)}
                                                placeholder="2024"
                                                required
                                                className="bg-zinc-900/50 border-zinc-800 text-white font-bold h-14 rounded-2xl focus:border-emerald-500/50 transition-all placeholder:text-zinc-700"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t('color')}</Label>
                                <Input
                                    value={cor}
                                    onChange={(e) => setCor(e.target.value)}
                                    placeholder="Branco, Preto, etc"
                                    className="bg-zinc-900/50 border-zinc-800 text-white font-bold h-14 rounded-2xl focus:border-emerald-500/50 transition-all placeholder:text-zinc-700"
                                />
                            </div>

                            <div className={`grid ${veiculoParaEditar ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{veiculoParaEditar ? 'KM Inicial' : t('initialKM')} *</Label>
                                    <Input
                                        type="number"
                                        value={quilometragemInicial}
                                        onChange={(e) => setQuilometragemInicial(e.target.value)}
                                        placeholder="0"
                                        required
                                        className="bg-zinc-900/50 border-zinc-800 text-white font-bold h-14 rounded-2xl focus:border-emerald-500/50 transition-all placeholder:text-zinc-700"
                                    />
                                </div>
                                {veiculoParaEditar && (
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">KM Atual</Label>
                                        <Input
                                            type="number"
                                            value={quilometragemAtual}
                                            onChange={(e) => setQuilometragemAtual(e.target.value)}
                                            placeholder="0"
                                            className="bg-zinc-900/50 border-zinc-800 text-white font-bold h-14 rounded-2xl focus:border-emerald-500/50 transition-all placeholder:text-zinc-700"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t('fuelType')}</Label>
                                <Select value={tipoCombustivel} onValueChange={setTipoCombustivel}>
                                    <SelectTrigger className="bg-zinc-900/50 border-zinc-800 text-white font-bold h-14 rounded-2xl focus:ring-emerald-500/20">
                                        <SelectValue placeholder="Tipo de combustível" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800 rounded-2xl">
                                        <SelectItem value="GASOLINA" className="text-sm font-bold text-zinc-300 focus:bg-zinc-800 focus:text-white rounded-lg">{t('types.GASOLINA')}</SelectItem>
                                        <SelectItem value="ETANOL" className="text-sm font-bold text-zinc-300 focus:bg-zinc-800 focus:text-white rounded-lg">{t('types.ETANOL')}</SelectItem>
                                        <SelectItem value="DIESEL" className="text-sm font-bold text-zinc-300 focus:bg-zinc-800 focus:text-white rounded-lg">{t('types.DIESEL')}</SelectItem>
                                        <SelectItem value="FLEX" className="text-sm font-bold text-zinc-300 focus:bg-zinc-800 focus:text-white rounded-lg">{t('types.FLEX')}</SelectItem>
                                        <SelectItem value="ELETRICO" className="text-sm font-bold text-zinc-300 focus:bg-zinc-800 focus:text-white rounded-lg">{t('types.ELETRICO')}</SelectItem>
                                        <SelectItem value="HIBRIDO" className="text-sm font-bold text-zinc-300 focus:bg-zinc-800 focus:text-white rounded-lg">{t('types.HIBRIDO')}</SelectItem>
                                    </SelectContent>
                                </Select>
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
                            form="veiculo-form"
                            type="submit"
                            variant="premium"
                            disabled={carregando}
                            className={`flex-[2] h-14 text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all ${veiculoParaEditar ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-900/20' : 'shadow-emerald-900/20'}`}
                        >
                            {carregando ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                veiculoParaEditar ? 'Salvar Alterações' : t('save')
                            )}
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
