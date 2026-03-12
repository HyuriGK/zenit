'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, Activity } from 'lucide-react';
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
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

type ViewType = 'day' | 'week' | 'month' | 'year';

function AgendaPageContent() {
  const searchParams = useSearchParams();
  const t = useTranslations('agenda');
  const tCommon = useTranslations('common');

  // Detectar se é dispositivo móvel e definir view padrão como mês
  const [view, setView] = useState<ViewType>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? 'day' : 'month';
    }
    return 'month';
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
      setTimeout(() => setLoading(false), 300);
    }
  };

  useEffect(() => {
    fetchAgenda();
  }, []);

  const compromissos: Compromisso[] = compromissosData.map(c => {
    const dateStr = typeof c.data === 'string' ? c.data : new Date(c.data).toISOString();
    const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.slice(0, 10);
    const safeData = `${datePart}T12:00:00`;

    return {
      ...c,
      data: safeData,
      createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: c.updatedAt ? new Date(c.updatedAt).toISOString() : new Date().toISOString(),
    };
  }) as any;

  const handleSave = () => {
    setSelectedDate(null);
    setSelectedHour(null);
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedCompromisso(null);
    fetchAgenda();
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
    fetchAgenda();
  };

  const handleStatusChange = () => {
    setIsDetailsOpen(false);
    setSelectedCompromisso(null);
    fetchAgenda();
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] lg:h-[calc(100vh-theme(spacing.20))] overflow-hidden">
      <div className="flex-shrink-0 p-4 lg:p-6 pb-0">
        <PageHeader 
          title={t('title')}
          description="Gerencie seus compromissos e eventos com facilidade"
          action={
            <Button
              onClick={() => {
                setSelectedDate(null);
                setSelectedHour(null);
                setSelectedCompromisso(null);
                setIsEditMode(false);
                setIsModalOpen(true);
              }}
              variant="premium"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{t('newAppointment')}</span>
              <span className="sm:hidden">{t('new')}</span>
            </Button>
          }
        />
      </div>

      <div className="flex-1 min-h-0 bg-zinc-900/50 overflow-hidden flex flex-col">
        {loading ? (
          <LoadingScreen message={t('loadingCalendar')} />
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

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen} modal={false}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white w-[95vw] max-w-[500px] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-2xl">
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
              onStatusChange={handleStatusChange}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen} modal={false}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white w-[95vw] max-w-[600px] sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
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