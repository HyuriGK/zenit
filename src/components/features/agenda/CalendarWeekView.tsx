'use client';

import { useState, useEffect, useRef } from 'react';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Compromisso } from '@/types/compromisso';

interface CalendarWeekViewProps {
  compromissos: Compromisso[];
  onSlotClick: (date: Date, hour: number) => void;
  onCompromissoClick: (compromisso: Compromisso) => void;
  currentDate: Date;
}

export function CalendarWeekView({ compromissos, onSlotClick, onCompromissoClick, currentDate }: CalendarWeekViewProps) {
  const currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
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

  // Definir scroll inicial na posição do horário atual (apenas na montagem inicial)
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
  }, []);

  // Gerar dias da semana
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  // Gerar horas do dia (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Calcular posição da linha do tempo
  const getCurrentTimePosition = () => {
    const hour = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    return (hour * 60 + minutes); // Posição em pixels (1 minuto = 1 pixel)
  };

  // Verificar se é hoje
  const isToday = (date: Date) => isSameDay(date, new Date());

  // Buscar compromissos de um dia específico
  const getCompromissosForDay = (date: Date) => {
    return compromissos.filter(comp => {
      const compDate = parseISO(comp.data);
      return isSameDay(compDate, date);
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

  return (
    <div className="flex flex-col flex-1 min-h-0 max-h-full relative">
      {/* Header com dias da semana - FIXO */}
      <div className="grid grid-cols-8 border-b-2 border-zinc-700 bg-gradient-to-b from-zinc-900 to-zinc-900/95 z-20 shadow-lg backdrop-blur-sm flex-shrink-0">
        {/* Coluna de horas (vazia) */}
        <div className="w-10 sm:w-16 border-r border-zinc-800"></div>

        {/* Dias da semana */}
        {weekDays.map((day, i) => (
          <div
            key={i}
            className={`p-2 sm:p-3 text-center border-r border-zinc-800 transition-all duration-200 ${isToday(day) ? 'bg-zenit-500/10 border-b-2 border-b-zenit-500' : ''
              }`}
          >
            <div className="text-[10px] sm:text-xs text-gray-400 uppercase font-medium">
              {format(day, 'EEE', { locale: ptBR })}
            </div>
            <div className={`text-sm sm:text-xl font-bold mt-0.5 sm:mt-1 transition-colors ${isToday(day) ? 'text-zenit-400' : 'text-white'
              }`}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Grid de horários - SCROLLÁVEL */}
      <div
        className="flex-1 overflow-y-scroll overflow-x-hidden"
        ref={scrollContainerRef}
        style={{ height: '0px' }}
      >
        <div className="grid grid-cols-8 relative" style={{ height: '1440px' }}>
          {/* Coluna de horas */}
          <div className="w-10 sm:w-16 relative">
            {hours.map(hour => (
              <div
                key={hour}
                className="h-[60px] border-b border-zinc-800 flex items-start justify-end pr-1 sm:pr-2 pt-0"
              >
                <span className="text-[10px] sm:text-xs text-gray-500 -translate-y-2">
                  {String(hour).padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* Colunas dos dias */}
          {weekDays.map((day, dayIndex) => {
            const dayCompromissos = getCompromissosForDay(day);

            return (
              <div
                key={dayIndex}
                className="relative border-r border-zinc-800"
              >
                {/* Grid de horas clicável */}
                {hours.map(hour => (
                  <button
                    key={hour}
                    onClick={() => onSlotClick(day, hour)}
                    className="w-full h-[60px] border-b border-zinc-800 hover:bg-green-500/5 active:bg-green-500/10 transition-colors text-left block touch-manipulation"
                  />
                ))}

                {/* Compromissos do dia */}
                {dayCompromissos.map(comp => {
                  const style = getCompromissoStyle(comp);
                  return (
                    <button
                      key={comp.id}
                      onClick={() => onCompromissoClick(comp)}
                      className={`absolute left-0.5 right-0.5 sm:left-1 sm:right-1 rounded-md px-1 sm:px-2 py-0.5 sm:py-1 text-left text-[10px] sm:text-xs overflow-hidden hover:opacity-90 active:opacity-80 transition-opacity z-10 touch-manipulation ${comp.concluido ? 'line-through opacity-60' : ''}`}
                      style={{
                        top: style.top,
                        height: style.height,
                        backgroundColor: `${comp.cor}30`,
                        borderLeft: `2px solid ${comp.cor}`,
                      }}
                    >
                      <div className="font-semibold truncate text-[10px] sm:text-xs" style={{ color: comp.cor }}>
                        {comp.titulo}
                      </div>
                      {comp.horaFim && (
                        <div className="text-gray-400 text-[9px] sm:text-[10px] hidden xs:block">
                          {comp.horaInicio} - {comp.horaFim}
                        </div>
                      )}
                    </button>
                  );
                })}

                {/* Linha do tempo (somente para hoje) */}
                {isToday(day) && (
                  <div
                    className="absolute left-0 right-0 border-t-2 border-red-500 z-20 pointer-events-none"
                    style={{ top: `${getCurrentTimePosition()}px` }}
                  >
                    <div className="absolute -left-1.5 sm:-left-2 -top-1.5 sm:-top-2 w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}