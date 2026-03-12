'use client';

import { format, addWeeks, subWeeks, addMonths, subMonths, addYears, subYears, startOfWeek, startOfMonth, startOfYear } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';

type ViewType = 'day' | 'week' | 'month' | 'year';

interface CalendarToolbarProps {
  currentDate: Date;
  view: ViewType;
  onDateChange: (date: Date) => void;
  onViewChange: (view: ViewType) => void;
  onToday: () => void;
  onRefresh?: () => void;
}

export function CalendarToolbar({ currentDate, view, onDateChange, onViewChange, onToday, onRefresh }: CalendarToolbarProps) {
  const t = useTranslations('agenda');
  const locale = useLocale();
  const dateLocale = locale === 'pt' ? ptBR : enUS;

  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    if (!onRefresh) return;

    setIsSyncing(true);
    try {
      const response = await fetch('/api/v1/agenda/sync-toggle');
      if (response.ok) {
        const data = await response.json();
        console.log(`Sincronizados ${data.updatedCount} compromissos`);
        onRefresh();
      }
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePrevious = () => {
    let newDate: Date;
    switch (view) {
      case 'day':
        newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() - 1);
        onDateChange(newDate);
        break;
      case 'week':
        onDateChange(subWeeks(currentDate, 1));
        break;
      case 'month':
        onDateChange(subMonths(currentDate, 1));
        break;
      case 'year':
        onDateChange(subYears(currentDate, 1));
        break;
    }
  };

  const handleNext = () => {
    let newDate: Date;
    switch (view) {
      case 'day':
        newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + 1);
        onDateChange(newDate);
        break;
      case 'week':
        onDateChange(addWeeks(currentDate, 1));
        break;
      case 'month':
        onDateChange(addMonths(currentDate, 1));
        break;
      case 'year':
        onDateChange(addYears(currentDate, 1));
        break;
    }
  };

  const getDateLabel = () => {
    switch (view) {
      case 'day':
        return format(currentDate, "d 'de' MMMM 'de' yyyy", { locale: dateLocale });
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
        return format(weekStart, "MMMM 'de' yyyy", { locale: dateLocale });
      case 'month':
        return format(startOfMonth(currentDate), "MMMM 'de' yyyy", { locale: dateLocale });
      case 'year':
        return format(startOfYear(currentDate), 'yyyy');
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-zinc-950 border-b border-zinc-800 sticky top-0 z-30 shrink-0">
      {/* Primeira linha: Navegação e data */}
        {/* Botões de navegação e Data */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
          <div className="flex items-center gap-2 order-2 sm:order-1">
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl p-1 gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevious}
                className="h-9 w-9 rounded-xl hover:bg-zinc-800"
                title={t('previous')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToday}
                className="px-4 h-9 rounded-xl font-bold uppercase tracking-widest text-[9px] hover:bg-zinc-800 text-zinc-400 hover:text-white"
                title={t('today')}
              >
                Mês
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                className="h-9 w-9 rounded-xl hover:bg-zinc-800"
                title={t('next')}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {onRefresh && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleSync}
                disabled={isSyncing}
                className="h-10 w-10 rounded-2xl border-zinc-800/50 bg-zinc-900/50"
                title={isSyncing ? t('synchronizing') : t('synchronize')}
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>

          <div className="flex-1 text-center order-1 sm:order-2">
            <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-widest truncate">
              {getDateLabel()}
            </h2>
          </div>
          
          <div className="hidden sm:block sm:w-[140px] order-3"></div>
        </div>

      {/* Segunda linha: Filtros de Visualização - Estilo Segmented Control */}
      <div className="flex items-center gap-1 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-1.5 w-full max-w-md mx-auto sm:mx-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewChange('day')}
          className={`flex-1 text-[10px] font-black uppercase tracking-[0.15em] h-10 rounded-xl transition-all ${
            view === 'day'
              ? 'bg-zinc-800 text-emerald-500 shadow-sm'
              : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          {t('day')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewChange('week')}
          className={`flex-1 text-[10px] font-black uppercase tracking-[0.15em] h-10 rounded-xl transition-all ${
            view === 'week'
              ? 'bg-zinc-800 text-emerald-500 shadow-sm'
              : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          {t('week')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewChange('month')}
          className={`flex-1 text-[10px] font-black uppercase tracking-[0.15em] h-10 rounded-xl transition-all ${
            view === 'month'
              ? 'bg-zinc-800 text-emerald-500 shadow-sm'
              : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          {t('month')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewChange('year')}
          className={`flex-1 text-[10px] font-black uppercase tracking-[0.15em] h-10 rounded-xl transition-all hidden sm:flex ${
            view === 'year'
              ? 'bg-zinc-800 text-emerald-500 shadow-sm'
              : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          {t('year')}
        </Button>
      </div>
    </div>
  );
}