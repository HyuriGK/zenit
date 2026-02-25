'use client';

import { useState } from 'react';
import { Compromisso } from '@/types/compromisso';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Tag, Edit, Trash2, RefreshCw } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { RecurrenceActionModal } from '@/components/features/agenda/RecurrenceActionModal';
import { getDescricaoRecorrencia } from '@/lib/recorrencia-utils';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useTranslations, useLocale } from 'next-intl';
import { db } from '@/lib/dexie';

interface CompromissoDetailsProps {
  compromisso: Compromisso;
  onEdit: (compromisso: Compromisso) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function CompromissoDetails({
  compromisso,
  onEdit,
  onDelete,
  onClose
}: CompromissoDetailsProps) {
  const t = useTranslations('agenda');
  const locale = useLocale();
  const dateLocale = locale === 'pt' ? ptBR : enUS;

  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false);
  const [recurrenceAction, setRecurrenceAction] = useState<'edit' | 'delete'>('delete');
  const [isDeleting, setIsDeleting] = useState(false);
  const [modalExcluir, setModalExcluir] = useState(false);

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
      await db.compromissos.delete(compromisso.id);

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
      // Para edição, passa a informação para o formulário
      setShowRecurrenceModal(false);
      onEdit({
        ...compromisso,
        // @ts-expect-error - Adiciona flag temporária para saber se aplica a futuros
        _applyToFuture: applyToFuture,
      });
    }
  };

  return (
    <>
      <div className="w-full p-2 sm:p-3 md:p-4 space-y-3 sm:space-y-4">
        {/* Header com cor */}
        <div
          className="h-2 -mx-2 sm:-mx-3 md:-mx-4 -mt-2 sm:-mt-3 md:-mt-4 rounded-t-lg"
          style={{ backgroundColor: compromisso.cor }}
        />

        {/* Título */}
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white mb-1">{compromisso.titulo}</h3>
          {compromisso.descricao && (
            <p className="text-xs sm:text-sm text-gray-400">{compromisso.descricao}</p>
          )}
        </div>

        {/* Badge de Recorrente */}
        {compromisso.isRecorrente && (
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 bg-zenit-500/10 border border-zenit-500/30 rounded-full">
            <RefreshCw className="w-3 h-3 text-zenit-400" />
            <span className="text-[10px] sm:text-xs text-zenit-400 font-medium">
              {getDescricaoRecorrencia(
                compromisso.tipoRecorrencia ?? 'semanal',
                compromisso.intervaloRecorrencia || 1,
                t
              )}
            </span>
          </div>
        )}

        {/* Informações */}
        <div className="space-y-2">
          {/* Data */}
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-300">
              {format(parseISO(compromisso.data), "EEEE, d 'de' MMMM 'de' yyyy", { locale: dateLocale })}
            </span>
          </div>

          {/* Horário */}
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-300">
              {compromisso.horaInicio}
              {compromisso.horaFim && ` - ${compromisso.horaFim}`}
            </span>
          </div>

          {/* Categoria */}
          {compromisso.categoria && (
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-300 capitalize">{t(compromisso.categoria as any)}</span>
            </div>
          )}

          {/* Informação adicional sobre recorrência */}
          {compromisso.isRecorrente && compromisso.dataFimRecorrencia && (
            <div className="text-[10px] sm:text-xs text-gray-500 pt-2 border-t border-zinc-800">
              {t('repeatsUntil', { date: format(parseISO(compromisso.dataFimRecorrencia), "dd/MM/yyyy") })}
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-2 border-t border-zinc-700">
          <Button
            onClick={handleEditClick}
            className="flex-1 bg-zenit-500 hover:bg-zenit-600 h-9 sm:h-10 text-sm sm:text-base"
            disabled={isDeleting}
          >
            <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            {t('edit')}
          </Button>
          <Button
            onClick={handleDeleteClick}
            variant="default"
            className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-400 h-9 sm:h-10 text-sm sm:text-base"
            disabled={isDeleting}
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            {isDeleting ? t('deleting') : t('delete')}
          </Button>
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
    </>
  );
}