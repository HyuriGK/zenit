'use client';

import { useTranslations } from 'next-intl';

interface EstatisticaDia {
  dia: number;
  completados: number;
  total: number;
  taxa: number;
}

interface WeekdayStatsProps {
  dados: EstatisticaDia[];
  melhorDia: EstatisticaDia | null;
  piorDia: EstatisticaDia | null;
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function WeekdayStats({ dados, melhorDia, piorDia }: WeekdayStatsProps) {
  const t = useTranslations('habits');

  const getBarColor = (dia: EstatisticaDia) => {
    if (melhorDia && dia.dia === melhorDia.dia && dia.taxa > 0) {
      return 'bg-green-500';
    }
    if (piorDia && dia.dia === piorDia.dia && dia.total > 0 && dia.taxa < 100) {
      return 'bg-orange-500';
    }
    return 'bg-green-500';
  };

  return (
    <div className="space-y-3">
      {dados.map((dia) => (
        <div key={dia.dia} className="flex items-center gap-3">
          <span className="text-xs text-zinc-400 w-8">{DIAS_SEMANA[dia.dia]}</span>
          <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${getBarColor(dia)} rounded-full transition-all duration-500`}
              style={{ width: `${dia.taxa}%` }}
            />
          </div>
          <span className="text-xs text-zinc-400 w-10 text-right">{dia.taxa}%</span>
        </div>
      ))}

      {/* Legenda */}
      <div className="flex items-center justify-between pt-2 text-xs">
        {melhorDia && melhorDia.taxa > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-zinc-400">
              {t('bestDay')}: {DIAS_SEMANA[melhorDia.dia]}
            </span>
          </div>
        )}
        {piorDia && piorDia.total > 0 && piorDia.taxa < 100 && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-zinc-400">
              {t('worstDay')}: {DIAS_SEMANA[piorDia.dia]}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
