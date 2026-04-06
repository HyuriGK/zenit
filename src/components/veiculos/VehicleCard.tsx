'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Car, 
    Calendar, 
    Hash, 
    Droplets, 
    TrendingUp, 
    History, 
    Plus,
    Trash2,
    Fuel,
    Settings
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

interface VehicleCardProps {
    veiculo: any;
    onEdit: (veiculo: any) => void;
    onAddTransaction: (id: string) => void;
    onViewHistory: (id: string) => void;
    onDelete: (id: string) => void;
}

export default function VehicleCard({ veiculo, onEdit, onAddTransaction, onViewHistory, onDelete }: VehicleCardProps) {
    const t = useTranslations('vehicles');

    const calculateAge = (year: number) => {
        const today = new Date();
        const startOfYear = new Date(year, 0, 1);
        
        let years = today.getFullYear() - startOfYear.getFullYear();
        let months = today.getMonth() - startOfYear.getMonth();
        let days = today.getDate() - startOfYear.getDate();

        if (days < 0) {
            months--;
            const prevMonthLastDay = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
            days += prevMonthLastDay;
        }

        if (months < 0) {
            years--;
            months += 12;
        }

        return { years, months, days };
    };

    const age = calculateAge(veiculo.ano || new Date().getFullYear());
    const totalKM = (veiculo.quilometragemAtual || 0) - (veiculo.quilometragemInicial || 0);
    
    // Average calculations
    const today = new Date();
    const startOfYear = new Date(veiculo.ano || today.getFullYear(), 0, 1);
    const diffTime = Math.abs(today.getTime() - startOfYear.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    
    const avgDay = (veiculo.quilometragemAtual || 0) / diffDays;
    const avgMonth = avgDay * 30.44;
    const avgYear = avgDay * 365.25;

    const handleDelete = () => {
        if (confirm(t('deleteConfirm'))) {
            onDelete(veiculo.id);
        }
    };

    return (
        <Card className="bg-zinc-900/40 border-zinc-800/50 hover:bg-zinc-900/60 transition-all duration-500 rounded-3xl overflow-hidden group">
            <CardContent className="p-0">
                {/* Header Section */}
                <div className="p-6 border-b border-zinc-800/30 flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
                            <Car className="w-7 h-7 text-emerald-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">{veiculo.nome}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-zinc-800 text-zinc-500 py-0 h-5">
                                    {veiculo.marca} {veiculo.modelo}
                                </Badge>
                                <span className="text-[9px] font-black text-zinc-700 tracking-widest uppercase">{veiculo.placa}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(veiculo)}
                            className="h-8 w-8 text-zinc-600 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl"
                        >
                            <Settings className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleDelete}
                            className="h-8 w-8 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Age & Main Stats */}
                <div className="grid grid-cols-2 gap-px bg-zinc-800/20 border-b border-zinc-800/30">
                    <div className="p-5 bg-transparent">
                        <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-3 h-3 text-zinc-600" />
                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Idade do Veículo</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-black text-zinc-100 uppercase italic">
                                {age.years} <span className="text-[10px] not-italic text-zinc-500">anos</span>
                            </span>
                            <span className="text-[10px] font-bold text-zinc-400 mt-0.5">
                                {age.months}m e {age.days}d de vida
                            </span>
                        </div>
                    </div>
                    <div className="p-5 bg-transparent border-l border-zinc-800/30">
                        <div className="flex items-center gap-2 mb-2">
                            <Hash className="w-3 h-3 text-emerald-500/50" />
                            <span className="text-[9px] font-black text-emerald-500/50 uppercase tracking-widest">Quilometragem</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-black text-emerald-500 italic">
                                {veiculo.quilometragemAtual?.toLocaleString()} <span className="text-[10px] not-italic">KM</span>
                            </span>
                            <span className="text-[10px] font-bold text-emerald-500/40 mt-0.5">
                                Total percorrido: {totalKM.toLocaleString()} km
                            </span>
                        </div>
                    </div>
                </div>

                {/* Market Value Section (FIPE) */}
                {(veiculo.valorFipe || veiculo.valorfipe) && (
                    <div className="bg-emerald-500/5 border-b border-zinc-800/30 p-5 group/fipe hover:bg-emerald-500/10 transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                    <TrendingUp className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Valor de Mercado (FIPE)</span>
                            </div>
                            <div className="text-xl font-black text-emerald-400 italic tracking-tight group-hover/fipe:scale-105 transition-transform duration-500">
                                {veiculo.valorFipe || veiculo.valorfipe}
                            </div>
                        </div>
                    </div>
                )}

                {/* Calculation Stats (Averages) */}
                <div className="p-6 space-y-5">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest block">KM/DIA</span>
                            <span className="text-xs font-black text-white">{avgDay.toFixed(1)} <span className="text-[10px] text-zinc-500">km</span></span>
                        </div>
                        <div className="space-y-1 border-l border-zinc-800/30 pl-4">
                            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest block">KM/MÊS</span>
                            <span className="text-xs font-black text-white">{Math.round(avgMonth).toLocaleString()} <span className="text-[10px] text-zinc-500">km</span></span>
                        </div>
                        <div className="space-y-1 border-l border-zinc-800/30 pl-4">
                            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest block">KM/ANO</span>
                            <span className="text-xs font-black text-white">{Math.round(avgYear).toLocaleString()} <span className="text-[10px] text-zinc-500">km</span></span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button 
                            onClick={() => onAddTransaction(veiculo.id)}
                            variant="outline" 
                            className="flex-1 h-10 border-zinc-800/60 hover:bg-zinc-800 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest group/btn"
                        >
                            <Plus className="w-3 h-3 mr-2 text-zinc-500 group-hover/btn:text-emerald-500 transition-colors" />
                            Novo Registro
                        </Button>
                        <Button 
                            onClick={() => onViewHistory(veiculo.id)}
                            variant="outline" 
                            className="h-10 w-10 border-zinc-800/60 hover:bg-zinc-800 rounded-xl"
                        >
                            <History className="w-4 h-4 text-zinc-500" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
