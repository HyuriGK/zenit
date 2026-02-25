'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DiaCalendario {
    data: Date;
    dataStr: string; // YYYY-MM-DD local
    isMesAtual: boolean;
    completados: number;
    total: number;
}

interface MonthlyCalendarProps {
    dataSelecionada: Date;
    onDataSelect: (data: Date) => void;
    dadosMensais: Record<string, { completados: number; total: number }>;
}

const DIAS_SEMANA_CURTOS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export function MonthlyCalendar({ dataSelecionada, onDataSelect, dadosMensais }: MonthlyCalendarProps) {
    const t = useTranslations('habits');

    // O mês inicial a exibir é o da data selecionada
    const [mesVizualizado, setMesVizualizado] = useState(() => new Date(dataSelecionada.getFullYear(), dataSelecionada.getMonth(), 1));

    const mudarMes = (delta: number) => {
        setMesVizualizado(prev => {
            const nova = new Date(prev.getFullYear(), prev.getMonth() + delta, 1);
            return nova;
        });
    };

    const dias = useMemo(() => {
        const ano = mesVizualizado.getFullYear();
        const mes = mesVizualizado.getMonth();

        // Primeiro dia do mês
        const primeiroDia = new Date(ano, mes, 1);
        const diaSemanaPrimeiroDia = primeiroDia.getDay(); // 0 = Domingo

        // Último dia do mês
        const ultimoDia = new Date(ano, mes + 1, 0);
        const totalDiasMes = ultimoDia.getDate();

        // Último dia do mês anterior
        const ultimoDiaMesAnterior = new Date(ano, mes, 0).getDate();

        const diasGrid: DiaCalendario[] = [];

        // Preencher dias do mês anterior para completar a primeira semana
        for (let i = diaSemanaPrimeiroDia - 1; i >= 0; i--) {
            const dia = ultimoDiaMesAnterior - i;
            const dataVariavel = new Date(ano, mes - 1, dia);
            const dataStr = `${dataVariavel.getFullYear()}-${String(dataVariavel.getMonth() + 1).padStart(2, '0')}-${String(dataVariavel.getDate()).padStart(2, '0')}`;

            diasGrid.push({
                data: dataVariavel,
                dataStr,
                isMesAtual: false,
                completados: dadosMensais[dataStr]?.completados || 0,
                total: dadosMensais[dataStr]?.total || 0,
            });
        }

        // Preencher dias do mês atual
        for (let i = 1; i <= totalDiasMes; i++) {
            const dataVariavel = new Date(ano, mes, i);
            const dataStr = `${dataVariavel.getFullYear()}-${String(dataVariavel.getMonth() + 1).padStart(2, '0')}-${String(dataVariavel.getDate()).padStart(2, '0')}`;

            diasGrid.push({
                data: dataVariavel,
                dataStr,
                isMesAtual: true,
                completados: dadosMensais[dataStr]?.completados || 0,
                total: dadosMensais[dataStr]?.total || 0,
            });
        }

        // Preencher dias do próximo mês para completar a última semana (até múltiplo de 7)
        // E garantir que o calendário sempre tenha pelo menos 5 semanas (35 dias) para não encurtar a altura
        const diasNecessarios = Math.max(35, Math.ceil(diasGrid.length / 7) * 7);
        const diasRestantes = diasNecessarios - diasGrid.length;

        for (let i = 1; i <= diasRestantes; i++) {
            const dataVariavel = new Date(ano, mes + 1, i);
            const dataStr = `${dataVariavel.getFullYear()}-${String(dataVariavel.getMonth() + 1).padStart(2, '0')}-${String(dataVariavel.getDate()).padStart(2, '0')}`;

            diasGrid.push({
                data: dataVariavel,
                dataStr,
                isMesAtual: false,
                completados: dadosMensais[dataStr]?.completados || 0,
                total: dadosMensais[dataStr]?.total || 0,
            });
        }

        return diasGrid;
    }, [mesVizualizado, dadosMensais]);

    const nomeMes = mesVizualizado.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const hojeStr = (() => {
        const hoje = new Date();
        return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
    })();

    const selectedStr = `${dataSelecionada.getFullYear()}-${String(dataSelecionada.getMonth() + 1).padStart(2, '0')}-${String(dataSelecionada.getDate()).padStart(2, '0')}`;

    const getCorStatus = (completados: number, total: number) => {
        if (total === 0) return 'bg-zinc-800/50 hover:bg-zinc-700/50';
        if (completados === 0) return 'bg-zinc-800 border-[1px] border-zinc-700 hover:bg-zinc-700'; // Nada completado (mas tem habitos no dia)
        if (completados < total) return 'bg-orange-500/80 hover:bg-orange-500'; // Parcial
        return 'bg-green-500 hover:bg-green-600'; // Tudo completo
    };

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
            {/* Header do calendário */}
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-medium capitalize">{nomeMes}</h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => mudarMes(-1)}
                        className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => mudarMes(1)}
                        className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Grid de dias da semana */}
            <div className="grid grid-cols-7 gap-1 mb-1">
                {DIAS_SEMANA_CURTOS.map((d, idx) => (
                    <div key={idx} className="text-center text-[10px] text-zinc-500 font-medium pb-1">
                        {d}
                    </div>
                ))}
            </div>

            {/* Grid de dias */}
            <div className="grid grid-cols-7 gap-1">
                {dias.map((d, i) => {
                    const isSelected = d.dataStr === selectedStr;
                    const isToday = d.dataStr === hojeStr;
                    const statusClass = getCorStatus(d.completados, d.total);

                    return (
                        <button
                            key={`${d.dataStr}-${i}`}
                            onClick={() => onDataSelect(d.data)}
                            className={`
                relative flex flex-col items-center justify-center h-20 rounded-lg 
                transition-all duration-200
                ${!d.isMesAtual ? 'opacity-30 grayscale' : ''}
                ${isSelected ? 'ring-2 ring-white ring-offset-1 ring-offset-zinc-900 shadow-lg scale-[1.05] z-10' : ''}
                ${statusClass}
              `}
                            title={`${d.data.toLocaleDateString('pt-BR')}: ${d.completados}/${d.total} hábitos`}
                        >
                            <span className={`text-sm font-medium ${d.total > 0 && d.completados > 0 ? 'text-white' :
                                isSelected ? 'text-white' :
                                    'text-zinc-300'
                                }`}>
                                {d.data.getDate()}
                            </span>

                            {/* Pontinho indicativo de "hoje" */}
                            {isToday && !isSelected && (
                                <div className="absolute top-[2px] right-[2px] w-1.5 h-1.5 bg-green-400 rounded-full" />
                            )}
                            {isToday && isSelected && (
                                <div className="absolute top-[2px] right-[2px] w-1.5 h-1.5 bg-zinc-900 rounded-full" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Legenda simples */}
            <div className="flex items-center justify-center gap-3 mt-3 text-[10px] text-zinc-400">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-zinc-800/50" />
                    <span>Sem hábitos</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 border border-zinc-700 bg-zinc-800 rounded" />
                    <span>Incompleto</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-orange-500/80" />
                    <span>Parcial</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-green-500" />
                    <span>Completo</span>
                </div>
            </div>
        </div>
    );
}
