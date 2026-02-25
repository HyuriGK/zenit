'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { TipoRecorrencia } from '@/types/compromisso';
import { Calendar, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface RecorrenciaConfigProps {
  isRecorrente: boolean;
  tipoRecorrencia: TipoRecorrencia;
  intervaloRecorrencia: number;
  dataFimRecorrencia: string;
  onRecorrenteChange: (value: boolean) => void;
  onTipoChange: (value: TipoRecorrencia) => void;
  onIntervaloChange: (value: number) => void;
  onDataFimChange: (value: string) => void;
}

export function RecorrenciaConfig({
  isRecorrente,
  tipoRecorrencia,
  intervaloRecorrencia,
  dataFimRecorrencia,
  onRecorrenteChange,
  onTipoChange,
  onIntervaloChange,
  onDataFimChange,
}: RecorrenciaConfigProps) {
  const t = useTranslations('agenda');

  const tiposRecorrencia = [
    { value: 'diario', label: t('daily'), icon: '📅' },
    { value: 'semanal', label: t('weekly'), icon: '📆' },
    { value: 'mensal', label: t('monthly'), icon: '🗓️' },
    { value: 'anual', label: t('yearly'), icon: '📋' },
  ];

  const getTextoIntervalo = () => {
    switch (tipoRecorrencia) {
      case 'diario': return t('daily').toLowerCase();
      case 'semanal': return t('weekly').toLowerCase();
      case 'mensal': return t('monthly').toLowerCase();
      case 'anual': return t('yearly').toLowerCase();
      default: return '';
    }
  };

  const getTextoRepeteSingular = () => {
    switch (tipoRecorrencia) {
      case 'diario': return t('repeatsSingleDay');
      case 'semanal': return t('repeatsSingleWeek');
      case 'mensal': return t('repeatsSingleMonth');
      case 'anual': return t('repeatsSingleYear');
      default: return '';
    }
  };

  const getTextoRepetePlural = () => {
    switch (tipoRecorrencia) {
      case 'diario': return t('repeatsEveryDays', { count: intervaloRecorrencia });
      case 'semanal': return t('repeatsEveryWeeks', { count: intervaloRecorrencia });
      case 'mensal': return t('repeatsEveryMonths', { count: intervaloRecorrencia });
      case 'anual': return t('repeatsEveryYears', { count: intervaloRecorrencia });
      default: return '';
    }
  };

  return (
    <div className="p-3 border border-zinc-700 rounded-lg bg-zinc-800/30">
      {/* Toggle Recorrente */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 text-zenit-400" />
          <Label className="text-gray-300 text-sm font-medium">
            {t('recurringAppointment')}
          </Label>
        </div>
        <button
          type="button"
          onClick={() => onRecorrenteChange(!isRecorrente)}
          className={`
            relative inline-flex h-5 w-9 items-center rounded-full transition-colors
            ${isRecorrente ? 'bg-zenit-500' : 'bg-zinc-600'}
          `}
        >
          <span
            className={`
              inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform
              ${isRecorrente ? 'translate-x-5' : 'translate-x-0.5'}
            `}
          />
        </button>
      </div>

      {/* Configurações de Recorrência */}
      {isRecorrente && (
        <div className="space-y-3 pt-3 mt-3 border-t border-zinc-700">
          {/* Tipo de Recorrência */}
          <div className="space-y-1.5">
            <Label className="text-gray-300 text-xs">{t('repeat')}</Label>
            <div className="grid grid-cols-4 gap-1">
              {tiposRecorrencia.map((tipo) => (
                <button
                  key={tipo.value}
                  type="button"
                  onClick={() => onTipoChange(tipo.value as TipoRecorrencia)}
                  className={`
                    px-1.5 py-1.5 rounded-md border text-xs font-medium transition-all
                    flex flex-col items-center gap-0.5
                    ${tipoRecorrencia === tipo.value
                      ? 'border-zenit-500 bg-zenit-500/20 text-zenit-400'
                      : 'border-zinc-700 hover:border-zinc-600 text-gray-300'
                    }
                  `}
                >
                  <span className="text-sm">{tipo.icon}</span>
                  <span className="text-[10px]">{tipo.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Intervalo e Data de Término na mesma linha */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-gray-300 text-xs">
                {t('every')}
              </Label>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={intervaloRecorrencia}
                  onChange={(e) => onIntervaloChange(parseInt(e.target.value) || 1)}
                  className="bg-zinc-800/50 border-zinc-700 text-white w-14 h-8 text-sm"
                />
                <span className="text-gray-400 text-xs truncate">{getTextoIntervalo()}</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-gray-300 text-xs flex items-center gap-1">
                <Calendar className="w-3 h-3 text-gray-400" />
                {t('endsOn')}
              </Label>
              <Input
                type="date"
                value={dataFimRecorrencia}
                onChange={(e) => onDataFimChange(e.target.value)}
                className="bg-zinc-800/50 border-zinc-700 text-white h-8 text-sm"
              />
            </div>
          </div>

          {/* Texto informativo */}
          <p className="text-[10px] text-gray-500">
            {intervaloRecorrencia === 1
              ? getTextoRepeteSingular()
              : getTextoRepetePlural()
            }
            {dataFimRecorrencia ? ` • ${t('appointmentsUntilDate')}` : ` • ${t('noEndDate')}`}
          </p>
        </div>
      )}
    </div>
  );
}