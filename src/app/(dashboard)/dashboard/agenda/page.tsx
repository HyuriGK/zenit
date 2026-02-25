'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CompromissoForm } from '@/components/features/agenda/CompromissoForm';
import { CalendarWeekView } from '@/components/features/agenda/CalendarWeekView';
import { CalendarDayView } from '@/components/features/agenda/CalendarDayView';
import { CalendarMonthView } from '@/components/features/agenda/CalendarMonthView';
import { CalendarToolbar } from '@/components/features/agenda/CalendarToolbar';
import { Compromisso } from '@/types/compromisso';
import { format } from 'date-fns';
import { CompromissoDetails } from '@/components/features/agenda/CompromissoDetails';
import { useTranslations } from 'next-intl';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/dexie';

type ViewType = 'day' | 'week' | 'month' | 'year';

function AgendaPageContent() {
  const searchParams = useSearchParams();
  const t = useTranslations('agenda');
  const tCommon = useTranslations('common');

  // Detectar se é dispositivo móvel e definir view padrão
  const [view, setView] = useState<ViewType>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? 'day' : 'week';
    }
    return 'week';
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [selectedCompromisso, setSelectedCompromisso] = useState<Compromisso | null>(null);

  const [compromissosData, setCompromissosData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Busca os compromissos da API do Servidor (Neon SQL)
  const fetchAgenda = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/agenda');
      if (res.ok) {
        const json = await res.json();
        setCompromissosData(json.data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar agenda:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgenda();
  }, []);

  // Convert our Neon objects into the Compromisso format the UI expects
  const compromissos: Compromisso[] = compromissosData.map(c => ({
    ...c,
    // Database dates are already strings or date objects that ISO formatting fixes
    data: (c.data instanceof Date ? c.data : new Date(c.data)).toISOString(),
    createdAt: (c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt)).toISOString(),
    updatedAt: (c.updatedAt instanceof Date ? c.updatedAt : new Date(c.updatedAt)).toISOString(),
  })) as any;



  const handleSave = () => {
    setSelectedDate(null);
    setSelectedHour(null);
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedCompromisso(null);
  };

  const handleSlotClick = (date: Date, hour: number) => {
    setSelectedDate(date);
    setSelectedHour(hour);
    setSelectedCompromisso(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleCompromissoClick = (compromisso: Compromisso) => {
    setSelectedCompromisso(compromisso);
    setIsDetailsOpen(true);
  };

  const handleEdit = (compromisso: Compromisso) => {
    setIsDetailsOpen(false);
    setSelectedCompromisso(compromisso);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDeleteSuccess = (id: string) => {
    setIsDetailsOpen(false);
    setSelectedCompromisso(null);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="flex flex-col h-full p-4 lg:p-6 overflow-hidden">
      {/* Header compacto - apenas mobile */}
      <div className="md:hidden flex items-center justify-between gap-2 p-3 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm shrink-0">
        <h1 className="text-lg font-bold text-white">{t('title')}</h1>
        <Button
          onClick={() => {
            setSelectedDate(null);
            setSelectedHour(null);
            setSelectedCompromisso(null);
            setIsEditMode(false);
            setIsModalOpen(true);
          }}
          size="sm"
          className="bg-green-600 hover:bg-green-700 h-8"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          {t('new')}
        </Button>
      </div>

      {/* Header desktop - integrado */}
      <div className="hidden md:flex items-center justify-between gap-3 px-4 py-2 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm shrink-0">
        <h1 className="text-xl font-bold text-white">{t('title')}</h1>
        <Button
          onClick={() => {
            setSelectedDate(null);
            setSelectedHour(null);
            setSelectedCompromisso(null);
            setIsEditMode(false);
            setIsModalOpen(true);
          }}
          className="bg-green-600 hover:bg-green-700 h-9"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('newAppointment')}
        </Button>
      </div>

      {/* Calendário - ocupa todo espaço restante */}
      <div className="flex-1 min-h-0 max-h-full bg-zinc-900/50 overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenit-500 mx-auto mb-4"></div>
              <p className="text-gray-400">{t('loadingCalendar')}</p>
            </div>
          </div>
        ) : view === 'day' ? (
          <>
            <CalendarToolbar
              currentDate={currentDate}
              view={view}
              onDateChange={setCurrentDate}
              onViewChange={setView}
              onToday={handleToday}
              onRefresh={() => { }}
            />
            <CalendarDayView
              compromissos={compromissos}
              onSlotClick={handleSlotClick}
              onCompromissoClick={handleCompromissoClick}
              currentDate={currentDate}
            />
          </>
        ) : view === 'week' ? (
          <>
            <CalendarToolbar
              currentDate={currentDate}
              view={view}
              onDateChange={setCurrentDate}
              onViewChange={setView}
              onToday={handleToday}
              onRefresh={() => { }}
            />
            <CalendarWeekView
              compromissos={compromissos}
              onSlotClick={handleSlotClick}
              onCompromissoClick={handleCompromissoClick}
              currentDate={currentDate}
            />
          </>
        ) : view === 'month' ? (
          <>
            <CalendarToolbar
              currentDate={currentDate}
              view={view}
              onDateChange={setCurrentDate}
              onViewChange={setView}
              onToday={handleToday}
              onRefresh={() => { }}
            />
            <CalendarMonthView
              compromissos={compromissos}
              onSlotClick={handleSlotClick}
              onCompromissoClick={handleCompromissoClick}
              currentDate={currentDate}
            />
          </>
        ) : (
          <>
            <CalendarToolbar
              currentDate={currentDate}
              view={view}
              onDateChange={setCurrentDate}
              onViewChange={setView}
              onToday={handleToday}
              onRefresh={() => { }}
            />
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-xl font-semibold text-white mb-2">
                  {t('yearView')}
                </p>
                <p className="text-gray-400">{tCommon('comingSoon')}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal de Detalhes do Compromisso */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen} modal={false}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white w-[95vw] max-w-[500px] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">{t('appointmentDetails')}</DialogTitle>
            <DialogDescription className="text-gray-400 text-xs sm:text-sm">
              {t('viewAndManage')}
            </DialogDescription>
          </DialogHeader>
          {selectedCompromisso && (
            <CompromissoDetails
              compromisso={selectedCompromisso}
              onEdit={handleEdit}
              onDelete={handleDeleteSuccess}
              onClose={() => setIsDetailsOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Criar/Editar Compromisso */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen} modal={false}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white w-[95vw] max-w-[600px] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {isEditMode
                ? t('editAppointment')
                : selectedDate && selectedHour !== null
                  ? `${t('newAppointment')} - ${format(selectedDate, 'dd/MM/yyyy')} ${t('startTimeLabel').replace(' *', '')} ${String(selectedHour).padStart(2, '0')}:00`
                  : t('newAppointment')}
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-xs sm:text-sm">
              {isEditMode ? t('updateInfo') : t('fillDetails')}
            </DialogDescription>
          </DialogHeader>
          <CompromissoForm
            onClose={() => {
              setIsModalOpen(false);
              setIsEditMode(false);
              setSelectedCompromisso(null);
            }}
            onSave={handleSave}
            initialData={isEditMode ? selectedCompromisso : undefined}
            initialDate={selectedDate || undefined}
            initialHour={selectedHour !== null ? String(selectedHour).padStart(2, '0') + ':00' : undefined}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AgendaPage() {
  const t = useTranslations('common');

  return (
    <Suspense fallback={<div>{t('loading')}</div>}>
      <AgendaPageContent />
    </Suspense>
  );
}