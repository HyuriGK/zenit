'use client';

import { useMemo } from 'react';
import { Compromisso } from '@/types/compromisso';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isToday,
    parseISO
} from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { useTranslations, useLocale } from 'next-intl';

interface CalendarMonthViewProps {
    compromissos: Compromisso[];
    onSlotClick: (date: Date, hour: number) => void;
    onCompromissoClick: (compromisso: Compromisso) => void;
    currentDate: Date;
}

export function CalendarMonthView({
    compromissos,
    onSlotClick,
    onCompromissoClick,
    currentDate
}: CalendarMonthViewProps) {
    const t = useTranslations('agenda');
    const locale = useLocale();
    const dateLocale = locale === 'pt' ? ptBR : enUS;

    const days = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
        const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
        return eachDayOfInterval({ start, end });
    }, [currentDate]);

    // Map events to days for faster rendering
    const eventsByDay = useMemo(() => {
        const map = new Map<string, Compromisso[]>();
        compromissos.forEach(comp => {
            const compDate = parseISO(comp.data);
            const dateKey = format(compDate, 'yyyy-MM-dd');
            if (!map.has(dateKey)) {
                map.set(dateKey, []);
            }
            map.get(dateKey)!.push(comp);
        });

        // Sort events inside each day by time
        map.forEach(events => {
            events.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
        });

        return map;
    }, [compromissos]);

    const weekDays = useMemo(() => {
        const start = startOfWeek(currentDate, { weekStartsOn: 0 });
        return eachDayOfInterval({ start, end: endOfWeek(currentDate, { weekStartsOn: 0 }) })
            .map(day => format(day, 'EEEEEE', { locale: dateLocale }));
    }, [currentDate, dateLocale]);

    const getEventColor = (categoria: string) => {
        switch (categoria) {
            case 'trabalho': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'pessoal': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'saude': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'estudo': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'financeiro': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
            default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
        }
    };

    return (
        <div className="flex flex-col h-full bg-zinc-900 overflow-hidden">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b border-zinc-800 bg-zinc-900/50 shrink-0">
                {weekDays.map((day, i) => (
                    <div key={i} className="py-2 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-y-auto min-h-0 bg-zinc-900 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
                <div className="grid grid-cols-7 auto-rows-[minmax(100px,1fr)] min-h-full">
                    {days.map((day, i) => {
                        const dateKey = format(day, 'yyyy-MM-dd');
                        const dayEvents = eventsByDay.get(dateKey) || [];
                        const isCurrentMonth = isSameMonth(day, currentDate);
                        const isDayToday = isToday(day);

                        return (
                            <div
                                key={dateKey}
                                onClick={(e) => {
                                    // Only trigger slot click if clicking the background, not an event
                                    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('day-background')) {
                                        onSlotClick(day, 8); // Default to 08:00 AM on empty clicks
                                    }
                                }}
                                className={`
                  relative p-1 sm:p-2 border-r border-b border-zinc-800/50 day-background cursor-pointer hover:bg-zinc-800/30 transition-colors
                  ${!isCurrentMonth ? 'bg-zinc-900/40' : ''}
                `}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`
                    text-xs sm:text-sm font-medium w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full
                    ${isDayToday ? 'bg-green-600 text-white' : isCurrentMonth ? 'text-zinc-200' : 'text-zinc-600'}
                  `}>
                                        {format(day, 'd')}
                                    </span>
                                    {dayEvents.length > 0 && (
                                        <span className="text-[10px] sm:hidden text-zinc-500">
                                            {dayEvents.length} {dayEvents.length === 1 ? 'Ev.' : 'Evs.'}
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-col gap-1 overflow-y-auto max-h-[80px] sm:max-h-[calc(100%-30px)] scrollbar-hide">
                                    {dayEvents.map(event => (
                                        <div
                                            key={event.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onCompromissoClick(event);
                                            }}
                                            className={`
                        text-xs px-1.5 py-1 rounded-md border truncate cursor-pointer transition-colors
                        ${getEventColor(event.categoria || '')}
                        hover:brightness-125
                        ${event.concluido ? 'line-through opacity-60' : ''}
                      `}
                                            title={`${event.horaInicio} - ${event.titulo}`}
                                        >
                                            <span className="font-semibold mr-1">{event.horaInicio}</span>
                                            {event.titulo}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
