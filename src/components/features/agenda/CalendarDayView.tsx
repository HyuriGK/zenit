'use client';

import { useState, useEffect, useRef } from 'react';
import { format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Compromisso } from '@/types/compromisso';

interface CalendarDayViewProps {
  compromissos: Compromisso[];
  onSlotClick: (date: Date, hour: number) => void;
  onCompromissoClick: (compromisso: Compromisso) => void;
  currentDate: Date;
}

export function CalendarDayView({ compromissos, onSlotClick, onCompromissoClick, currentDate }: CalendarDayViewProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Função para realizar o scroll
  const scrollToCurrentTime = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const currentHour = new Date().getHours();
    const currentMinutes = new Date().getMinutes();

    // Calcular posição em pixels (60px por hora) onde a barra está
    const barPosition = (currentHour * 60) + currentMinutes;

    // Subtrair metade da altura visível para centralizar a barra
    const containerHeight = container.clientHeight;
    const scrollPosition = barPosition - (containerHeight / 2);
    const targetScroll = Math.max(0, scrollPosition);

    container.scrollTop = targetScroll;
  };

  // Atualizar linha do tempo a cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 1 minuto

    return () => clearInterval(interval);
  }, []);

  // Definir scroll inicial na posição do horário atual
  useEffect(() => {
    // Aguardar o próximo frame de renderização
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToCurrentTime();

        // Tentar novamente para garantir
        const timer1 = setTimeout(scrollToCurrentTime, 100);
        const timer2 = setTimeout(scrollToCurrentTime, 300);

        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
        };
      });
    });
  }, [currentDate]);

  // Gerar horas do dia (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Calcular posição da linha do tempo
  const getCurrentTimePosition = () => {
    const hour = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    return (hour * 60 + minutes); // Posição em pixels (1 minuto = 1 pixel)
  };

  // Verificar se é hoje
  const isToday = isSameDay(currentDate, new Date());

  // Buscar compromissos do dia atual
  const getDayCompromissos = () => {
    return compromissos.filter(comp => {
      const compDate = parseISO(comp.data);
      return isSameDay(compDate, currentDate);
    });
  };

  // Calcular posição e altura do compromisso
  const getCompromissoStyle = (compromisso: Compromisso) => {
    const [startHour, startMinute] = compromisso.horaInicio.split(':').map(Number);
    const top = (startHour * 60) + startMinute; // 60px por hora, 1px por minuto

    let height = 60; // Altura padrão 1 hora
    if (compromisso.horaFim) {
      const [endHour, endMinute] = compromisso.horaFim.split(':').map(Number);
      const endPosition = (endHour * 60) + endMinute;
      const startPosition = (startHour * 60) + startMinute;
      height = endPosition - startPosition;
    }

    return { top: `${top}px`, height: `${Math.max(height, 30)}px` };
  };

  const dayCompromissos = getDayCompromissos();

  return (
    <div className="flex flex-col flex-1 min-h-0 max-h-full relative">
      {/* Header com o dia - FIXO e COMPACTO */}
      <div className="grid grid-cols-[auto_1fr] border-b border-zinc-800 bg-zinc-900/95 z-20 backdrop-blur-sm flex-shrink-0">
        {/* Coluna de horas (vazia) */}
        <div className="w-12 sm:w-14 md:w-16 border-r border-zinc-800"></div>

        {/* Dia */}
        <div
          className={`p-2 sm:p-2.5 text-center transition-all ${
            isToday ? 'bg-green-500/10' : ''
          }`}
        >
          <div className="text-[10px] sm:text-xs text-gray-400 uppercase font-medium">
            {format(currentDate, 'EEEE', { locale: ptBR })}
          </div>
          <div className={`text-xl sm:text-2xl font-bold transition-colors ${
            isToday ? 'text-green-400' : 'text-white'
          }`}>
            {format(currentDate, 'd')}
          </div>
        </div>
      </div>

      {/* Grid de horários - SCROLLÁVEL */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden"
        ref={scrollContainerRef}
        style={{ height: '0px' }}
      >
        <div className="grid grid-cols-[auto_1fr] relative" style={{ height: '1440px' }}>
          {/* Coluna de horas */}
          <div className="w-12 sm:w-14 md:w-16 relative border-r border-zinc-800 bg-zinc-900/50">
            {hours.map(hour => (
              <div
                key={hour}
                className="h-[60px] border-b border-zinc-800/50 flex items-start justify-end pr-1.5 sm:pr-2 pt-0"
              >
                <span className="text-[10px] sm:text-xs text-gray-500 -translate-y-2 font-medium">
                  {String(hour).padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* Coluna do dia */}
          <div className="relative bg-zinc-950/30">
            {/* Grid de horas clicável */}
            {hours.map(hour => (
              <button
                key={hour}
                onClick={() => onSlotClick(currentDate, hour)}
                className="w-full h-[60px] border-b border-zinc-800/50 hover:bg-green-500/5 active:bg-green-500/10 transition-colors text-left block touch-manipulation"
              />
            ))}

            {/* Compromissos do dia */}
            {dayCompromissos.map(comp => {
              const style = getCompromissoStyle(comp);
              return (
                <button
                  key={comp.id}
                  onClick={() => onCompromissoClick(comp)}
                  className="absolute left-1 right-1 sm:left-2 sm:right-2 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-left overflow-hidden hover:opacity-90 active:opacity-80 active:scale-[0.98] transition-all z-10 touch-manipulation shadow-sm"
                  style={{
                    top: style.top,
                    height: style.height,
                    backgroundColor: `${comp.cor}25`,
                    borderLeft: `3px solid ${comp.cor}`,
                  }}
                >
                  <div className="font-semibold truncate text-xs sm:text-sm" style={{ color: comp.cor }}>
                    {comp.titulo}
                  </div>
                  {comp.horaFim && (
                    <div className="text-gray-400 text-[10px] sm:text-xs mt-0.5">
                      {comp.horaInicio} - {comp.horaFim}
                    </div>
                  )}
                  {comp.descricao && (
                    <div className="text-gray-500 text-[10px] mt-1 line-clamp-2 hidden sm:block">
                      {comp.descricao}
                    </div>
                  )}
                </button>
              );
            })}

            {/* Linha do tempo (somente para hoje) */}
            {isToday && (
              <div
                className="absolute left-0 right-0 border-t-2 border-red-500 z-20 pointer-events-none"
                style={{ top: `${getCurrentTimePosition()}px` }}
              >
                <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-red-500 rounded-full shadow-lg shadow-red-500/50 animate-pulse"></div>
                <div className="absolute -left-1 -top-1 w-2 h-2 bg-white rounded-full"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
