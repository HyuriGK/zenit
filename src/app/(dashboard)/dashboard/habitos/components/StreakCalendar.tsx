'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

interface CalendarioData {
  data: string;
  completados: number;
  total: number;
  nivel: number;
  diaSemana: number;
}

interface StreakCalendarProps {
  dados: CalendarioData[];
}

const DIAS_SEMANA_CURTOS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export function StreakCalendar({ dados }: StreakCalendarProps) {
  const t = useTranslations('habits');

  // Organizar dados em semanas (colunas)
  const semanas = useMemo(() => {
    if (!dados || dados.length === 0) return [];

    const result: CalendarioData[][] = [];
    let semanaAtual: CalendarioData[] = [];

    // Preencher dias vazios no início da primeira semana
    const primeiroDia = dados[0];
    for (let i = 0; i < primeiroDia.diaSemana; i++) {
      semanaAtual.push({
        data: '',
        completados: 0,
        total: 0,
        nivel: -1, // -1 = dia vazio
        diaSemana: i,
      });
    }

    for (const dia of dados) {
      semanaAtual.push(dia);

      if (dia.diaSemana === 6) {
        result.push(semanaAtual);
        semanaAtual = [];
      }
    }

    // Adicionar última semana se não estiver completa
    if (semanaAtual.length > 0) {
      result.push(semanaAtual);
    }

    return result;
  }, [dados]);

  const getNivelColor = (nivel: number) => {
    switch (nivel) {
      case -1: return 'bg-transparent';
      case 0: return 'bg-zinc-800';
      case 1: return 'bg-green-900/60';
      case 2: return 'bg-green-700/70';
      case 3: return 'bg-green-500/80';
      case 4: return 'bg-green-400';
      default: return 'bg-zinc-800';
    }
  };

  const formatarData = (dataStr: string) => {
    if (!dataStr) return '';
    // Parse YYYY-MM-DD manualmente para evitar problemas de timezone
    const [ano, mes, dia] = dataStr.split('-').map(Number);
    const data = new Date(ano, mes - 1, dia);
    return data.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="space-y-3">
      {/* Labels dos dias da semana */}
      <div className="flex gap-1">
        <div className="w-4 mr-1" />
        {DIAS_SEMANA_CURTOS.map((dia, index) => (
          <div
            key={index}
            className="w-3 h-3 text-[10px] text-zinc-500 flex items-center justify-center"
          >
            {index % 2 === 0 ? dia : ''}
          </div>
        ))}
      </div>

      {/* Grid do calendário */}
      <div className="flex gap-[3px] overflow-x-auto pb-2">
        {semanas.map((semana, semanaIndex) => (
          <div key={semanaIndex} className="flex flex-col gap-[3px]">
            {semana.map((dia, diaIndex) => (
              <div
                key={`${semanaIndex}-${diaIndex}`}
                className={`w-3 h-3 rounded-sm ${getNivelColor(dia.nivel)} transition-colors group relative`}
                title={dia.data ? `${formatarData(dia.data)}: ${dia.completados}/${dia.total}` : ''}
              >
                {/* Tooltip */}
                {dia.nivel >= 0 && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <p className="font-medium text-white">{formatarData(dia.data)}</p>
                    <p className="text-zinc-400">
                      {dia.total === 0
                        ? t('noHabitsScheduled')
                        : `${dia.completados}/${dia.total} ${t('completed').toLowerCase()}`}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Legenda */}
      <div className="flex items-center justify-end gap-2 text-xs text-zinc-500">
        <span>{t('less')}</span>
        <div className="flex gap-[3px]">
          <div className="w-3 h-3 rounded-sm bg-zinc-800" />
          <div className="w-3 h-3 rounded-sm bg-green-900/60" />
          <div className="w-3 h-3 rounded-sm bg-green-700/70" />
          <div className="w-3 h-3 rounded-sm bg-green-500/80" />
          <div className="w-3 h-3 rounded-sm bg-green-400" />
        </div>
        <span>{t('more')}</span>
      </div>
    </div>
  );
}
