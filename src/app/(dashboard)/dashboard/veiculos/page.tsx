'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Button } from '@/components/ui/button';
import { Plus, Car, Fuel, PenTool, TrendingUp, Wallet } from 'lucide-react';
import NovoVeiculoModal from '@/components/veiculos/NovoVeiculoModal';
import NovaTransacaoModal from '@/components/veiculos/NovaTransacaoModal';
import VehicleCard from '@/components/veiculos/VehicleCard';
import ListaTransacoesModal from '@/components/veiculos/ListaTransacoesModal';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';

export default function VeiculosPage() {
    const t = useTranslations('vehicles');
    const [loading, setLoading] = useState(true);
    const [veiculos, setVeiculos] = useState<any[]>([]);
    const [modalNovoAberto, setModalNovoAberto] = useState(false);
    const [modalTransacaoAberto, setModalTransacaoAberto] = useState(false);
    const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false);
    const [veiculoSelecionadoId, setVeiculoSelecionadoId] = useState<string | null>(null);

    const carregarVeiculos = async () => {
        try {
            const res = await fetch('/api/veiculos');
            if (res.ok) {
                const json = await res.json();
                setVeiculos(json.data || []);
            }
        } catch (error) {
            console.error('Erro ao buscar veículos:', error);
            toast.error('Erro ao carregar veículos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarVeiculos();
    }, []);

    const handleDeleteVeiculo = async (id: string) => {
        try {
            const res = await fetch(`/api/veiculos/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Veículo removido');
                carregarVeiculos();
            } else {
                toast.error('Erro ao remover veículo');
            }
        } catch (err) {
            toast.error('Erro ao conectar com o servidor');
        }
    };

    const handleOpenAddTransaction = (id: string) => {
        setVeiculoSelecionadoId(id);
        setModalTransacaoAberto(true);
    };

    const handleOpenHistory = (id: string) => {
        setVeiculoSelecionadoId(id);
        setModalHistoricoAberto(true);
    };

    if (loading) {
        return <LoadingScreen message="Carregando seus veículos..." />;
    }

    return (
        <div className="flex flex-col h-full overflow-hidden p-4 lg:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <PageHeader 
                    title={t('pageTitle')}
                    description={t('subtitle')}
                />
                <Button 
                    onClick={() => setModalNovoAberto(true)}
                    variant="premium"
                    className="rounded-2xl h-12 px-6"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    {t('newVehicle')}
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto scroll-container pr-1 space-y-8 pb-20">
                {/* Summary Section */}
                {veiculos.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-zinc-900/40 border-zinc-800/50">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                                        <Fuel className="w-4 h-4 text-orange-500" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Média Consumo</span>
                                </div>
                                <div className="text-3xl font-black text-white">-- <span className="text-sm font-bold text-zinc-500">km/l</span></div>
                            </CardContent>
                        </Card>
                        <Card className="bg-zinc-900/40 border-zinc-800/50">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                        <PenTool className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Manutenções</span>
                                </div>
                                <div className="text-3xl font-black text-white">-- <span className="text-sm font-bold text-zinc-500">registradas</span></div>
                            </CardContent>
                        </Card>
                        <Card className="bg-zinc-900/40 border-zinc-800/50">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                        <Wallet className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Gasto Total</span>
                                </div>
                                <div className="text-3xl font-black text-white">R$ 0,00</div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Vehicles List */}
                {veiculos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/20 border border-zinc-800/50 rounded-[40px] border-dashed border-2">
                        <div className="w-20 h-20 rounded-3xl bg-zinc-800/50 flex items-center justify-center mb-6">
                            <Car className="w-10 h-10 text-zinc-700" />
                        </div>
                        <h2 className="text-zinc-400 font-black uppercase tracking-widest text-sm text-center px-4">{t('noVehicles')}</h2>
                        <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mt-2 max-w-[300px] text-center leading-relaxed">
                            {t('startAdding')}
                        </p>
                        <Button 
                            onClick={() => setModalNovoAberto(true)}
                            variant="outline" 
                            className="mt-8 rounded-2xl border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10 font-black uppercase tracking-widest text-[10px] h-12 px-8"
                        >
                            {t('addFirst')}
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                        {veiculos.map((v) => (
                            <VehicleCard 
                                key={v.id} 
                                veiculo={v} 
                                onAddTransaction={handleOpenAddTransaction}
                                onViewHistory={handleOpenHistory}
                                onDelete={handleDeleteVeiculo}
                            />
                        ))}
                    </div>
                )}
            </div>

            <NovoVeiculoModal 
                aberto={modalNovoAberto} 
                onFechar={() => setModalNovoAberto(false)} 
                onSucesso={carregarVeiculos} 
            />

            {veiculoSelecionadoId && (
                <>
                    <NovaTransacaoModal 
                        aberto={modalTransacaoAberto}
                        veiculoId={veiculoSelecionadoId}
                        onFechar={() => setModalTransacaoAberto(false)}
                        onSucesso={carregarVeiculos}
                    />
                    <ListaTransacoesModal 
                        aberto={modalHistoricoAberto}
                        veiculoId={veiculoSelecionadoId}
                        onFechar={() => setModalHistoricoAberto(false)}
                    />
                </>
            )}
        </div>
    );
}
