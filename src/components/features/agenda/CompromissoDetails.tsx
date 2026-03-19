'use client';

import { useState } from 'react';
import { Compromisso } from '@/types/compromisso';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  Tag, 
  Edit, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  Loader2,
  CalendarDays,
  AlignLeft,
  CheckCircle2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { RecurrenceActionModal } from '@/components/features/agenda/RecurrenceActionModal';
import { getDescricaoRecorrencia } from '@/lib/recorrencia-utils';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useTranslations, useLocale } from 'next-intl';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface CompromissoDetailsProps {
  compromisso: Compromisso;
  onEdit: (compromisso: Compromisso) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onStatusChange?: () => void;
}

export function CompromissoDetails({
  compromisso,
  onEdit,
  onDelete,
  onClose,
  onStatusChange
}: CompromissoDetailsProps) {
  const t = useTranslations('agenda');
  const locale = useLocale();
  const dateLocale = locale === 'pt' ? ptBR : enUS;

  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false);
  const [recurrenceAction, setRecurrenceAction] = useState<'edit' | 'delete'>('delete');
  const [isDeleting, setIsDeleting] = useState(false);
  const [modalExcluir, setModalExcluir] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const handleToggleConcluido = async () => {
    setIsToggling(true);
    try {
      const updatedCompromisso = {
        ...compromisso,
        concluido: !compromisso.concluido,
        syncWithGoogle: compromisso.syncWithGoogle || false
      };

      const response = await fetch(`/api/agenda`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCompromisso),
      });

      if (!response.ok) throw new Error('Falha ao atualizar na nuvem');

      if (onStatusChange) {
        onStatusChange();
      } else {
        onClose();
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar compromisso');
    } finally {
      setIsToggling(false);
    }
  };

  const handleEditClick = () => {
    if (compromisso.isRecorrente) {
      setRecurrenceAction('edit');
      setShowRecurrenceModal(true);
    } else {
      onEdit(compromisso);
    }
  };

  const handleDeleteClick = () => {
    if (compromisso.isRecorrente) {
      setRecurrenceAction('delete');
      setShowRecurrenceModal(true);
    } else {
      setModalExcluir(true);
    }
  };

  const handleDelete = async (applyToFuture: boolean) => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/agenda?id=${compromisso.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Falha ao excluir na nuvem');

      onDelete(compromisso.id);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir compromisso localmente');
    } finally {
      setIsDeleting(false);
      setShowRecurrenceModal(false);
      setModalExcluir(false);
    }
  };

  const confirmarExcluir = () => {
    handleDelete(false);
  };

  const handleRecurrenceConfirm = (applyToFuture: boolean) => {
    if (recurrenceAction === 'delete') {
      handleDelete(applyToFuture);
    } else {
      setShowRecurrenceModal(false);
      onEdit({
        ...compromisso,
        // @ts-expect-error - Adiciona flag temporária para saber se aplica a futuros
        _applyToFuture: applyToFuture,
      });
    }
  };

  return (
    <div className="flex flex-col h-full overflow-visible">
      {/* Header com Gradiente */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-900/50 p-6 border-b border-zinc-800/50 relative">
        <div 
          className="absolute top-0 left-0 w-full h-1" 
          style={{ backgroundColor: compromisso.cor }} 
        />
        <DialogHeader className="gap-1">
          <DialogTitle className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-green-500/20 text-green-400">
              <CalendarDays className="w-6 h-6" />
            </div>
            {t('appointmentDetails')}
          </DialogTitle>
          <DialogDescription className="text-zinc-500 font-medium text-base ml-12">
            {t('viewAndManage')}
          </DialogDescription>
        </DialogHeader>
      </div>

      <div className="p-6 space-y-8 overflow-visible">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Coluna Esquerda: Título e Descrição */}
          <div className="space-y-6">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-500 mb-2">
                {t('titleLabel').replace(' *', '')}
              </p>
              <h3 className="text-2xl font-bold text-white leading-tight">
                {compromisso.titulo}
              </h3>
            </div>

            {compromisso.descricao && (
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-500 mb-2 flex items-center gap-2">
                  <AlignLeft className="w-3.5 h-3.5" />
                  {t('descriptionLabel')}
                </p>
                <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800 p-4">
                  <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {compromisso.descricao}
                  </p>
                </div>
              </div>
            )}

            {/* Badge de Recorrente */}
            {compromisso.isRecorrente && (
              <div className="p-4 bg-zinc-900/40 rounded-2xl border border-zinc-800 shadow-sm relative overflow-hidden group hover:bg-zinc-900/60 transition-all">
                <div className="absolute top-0 left-0 w-1 h-full bg-green-500 opacity-30 transition-opacity" />
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-xl bg-green-500/10 text-green-400 shrink-0">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.1em] text-green-500 mb-0.5">
                      {t('recurrent')}
                    </p>
                    <p className="text-sm text-zinc-300 font-medium">
                      {getDescricaoRecorrencia(
                        compromisso.tipoRecorrencia ?? 'semanal',
                        compromisso.intervaloRecorrencia || 1,
                        t
                      )}
                    </p>
                    {compromisso.dataFimRecorrencia && (
                      <p className="text-[10px] text-zinc-600 font-bold uppercase mt-2">
                         {t('repeatsUntil', { date: format(parseISO(compromisso.dataFimRecorrencia), "dd/MM/yyyy") })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Coluna Direita: Informações de Tempo e Categoria */}
          <div className="space-y-6">
            {/* Data e Horário */}
            <div className="grid grid-cols-1 gap-4">
              <div className="p-5 bg-zinc-900/40 rounded-2xl border border-zinc-800 shadow-sm space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-500 mb-0.5">
                      {t('dateLabel').replace(' *', '')}
                    </p>
                    <p className="text-base text-white font-medium capitalize">
                      {format(parseISO(compromisso.data), "EEEE, d 'de' MMMM", { locale: dateLocale })}
                    </p>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase">
                      {format(parseISO(compromisso.data), "yyyy")}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800/50 flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-500 mb-0.5">
                      Horário
                    </p>
                    <p className="text-base text-white font-medium">
                      {compromisso.horaInicio}
                      {compromisso.horaFim && (
                        <span className="text-zinc-500 mx-2">até</span>
                      )}
                      {compromisso.horaFim}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Categoria */}
            {compromisso.categoria && (
              <div className="p-5 bg-zinc-900/40 rounded-2xl border border-zinc-800 shadow-sm">
                <div className="flex items-center gap-4">
                  <div 
                    className="p-2.5 rounded-xl shrink-0" 
                    style={{ backgroundColor: `${compromisso.cor}20`, color: compromisso.cor }}
                  >
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-500 mb-0.5">
                      {t('categoryLabel').replace(' *', '')}
                    </p>
                    <p className="text-base text-white font-medium capitalize">
                      {t(compromisso.categoria as any)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Status */}
            <div className={`p-5 rounded-2xl border shadow-sm transition-all ${
              compromisso.concluido 
                ? 'bg-zinc-900 border-zinc-800' 
                : 'bg-green-500/5 border-green-500/20'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    compromisso.concluido ? 'bg-zinc-800 text-zinc-500' : 'bg-green-500/10 text-green-500'
                  }`}>
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-500">Status</p>
                    <p className={`text-xs font-bold uppercase transition-all ${
                      compromisso.concluido ? 'text-zinc-500' : 'text-green-500'
                    }`}>
                      {compromisso.concluido ? 'Concluído' : 'Pendente'}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleToggleConcluido}
                  variant="outline"
                  size="sm"
                  disabled={isToggling}
                  className={`h-9 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all ${
                    compromisso.concluido
                      ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-400'
                      : 'border-green-500/50 hover:bg-green-500/10 text-green-500'
                  }`}
                >
                  {isToggling ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    compromisso.concluido ? t('reopenAppointment') : t('completeAppointment')
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-4 pt-10 border-t border-zinc-800/50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white h-14 rounded-2xl font-black text-sm uppercase tracking-widest transition-all"
            disabled={isDeleting || isToggling}
          >
            {t('cancel')}
          </Button>
          <div className="flex-[2] flex gap-3">
            <Button
              onClick={handleEditClick}
              disabled={isDeleting || isToggling}
              className="flex-1 h-14 rounded-2xl font-black text-sm uppercase tracking-[0.15em] transition-all bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white"
            >
              <Edit className="w-5 h-5 mr-3" />
              {t('edit')}
            </Button>
            <Button
              onClick={handleDeleteClick}
              disabled={isDeleting || isToggling}
              className="flex-1 h-14 rounded-2xl font-black text-sm uppercase tracking-[0.15em] transition-all bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500"
            >
              {isDeleting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Trash2 className="w-5 h-5 mr-3" />
                  {t('delete')}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de Ação de Recorrência */}
      <RecurrenceActionModal
        isOpen={showRecurrenceModal}
        onClose={() => setShowRecurrenceModal(false)}
        action={recurrenceAction}
        onConfirm={handleRecurrenceConfirm}
        compromissoTitulo={compromisso.titulo}
      />

      {/* Modal Confirmar Exclusão */}
      <ConfirmModal
        open={modalExcluir}
        onClose={() => setModalExcluir(false)}
        onConfirm={confirmarExcluir}
        title={t('deleteAppointment')}
        description={t('deleteConfirmation')}
        confirmText={t('deleteAppointment')}
        cancelText={t('cancel')}
        variant="danger"
      />
    </div>
  );
}