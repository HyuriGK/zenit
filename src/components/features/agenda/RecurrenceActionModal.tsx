'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RefreshCw, Calendar } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface RecurrenceActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: 'edit' | 'delete';
  onConfirm: (applyToAll: boolean) => void;
  compromissoTitulo: string;
}

export function RecurrenceActionModal({
  isOpen,
  onClose,
  action,
  onConfirm,
  compromissoTitulo,
}: RecurrenceActionModalProps) {
  const t = useTranslations('agenda');
  const isEdit = action === 'edit';
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-zenit-400" />
            {isEdit ? t('editRecurring') : t('deleteRecurring')}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {t('partOfSeries', { title: compromissoTitulo })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-gray-300">
            {isEdit ? t('howToEdit') : t('howToDelete')}
          </p>

          {/* Opção 1: Apenas este */}
          <button
            onClick={() => onConfirm(false)}
            className="w-full p-4 border-2 border-zinc-700 rounded-lg hover:border-zenit-500 hover:bg-zenit-500/5 transition-all text-left group"
          >
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 group-hover:text-zenit-400 mt-0.5" />
              <div>
                <h4 className="font-semibold text-white group-hover:text-zenit-400 mb-1">
                  {t('onlyThis')}
                </h4>
                <p className="text-sm text-gray-400">
                  {isEdit
                    ? t('onlyThisEditDesc')
                    : t('onlyThisDeleteDesc')
                  }
                </p>
              </div>
            </div>
          </button>

          {/* Opção 2: Este e os futuros */}
          <button
            onClick={() => onConfirm(true)}
            className="w-full p-4 border-2 border-zinc-700 rounded-lg hover:border-zenit-500 hover:bg-zenit-500/5 transition-all text-left group"
          >
            <div className="flex items-start gap-3">
              <RefreshCw className="w-5 h-5 text-gray-400 group-hover:text-zenit-400 mt-0.5" />
              <div>
                <h4 className="font-semibold text-white group-hover:text-zenit-400 mb-1">
                  {t('thisAndFuture')}
                </h4>
                <p className="text-sm text-gray-400">
                  {isEdit
                    ? t('thisAndFutureEditDesc')
                    : t('thisAndFutureDeleteDesc')
                  }
                </p>
              </div>
            </div>
          </button>
        </div>

        <div className="flex justify-end pt-4 border-t border-zinc-800">
          <Button
            variant="default"
            onClick={onClose}
            className="border-zinc-700 hover:bg-zinc-800"
          >
            {t('cancel')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}