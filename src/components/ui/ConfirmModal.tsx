'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading = false,
}: ConfirmModalProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-gradient-to-br from-red-500 to-red-600',
          icon: <Trash2 className="w-6 h-6 text-white" />,
          buttonBg: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800',
        };
      case 'warning':
        return {
          iconBg: 'bg-gradient-to-br from-yellow-500 to-orange-500',
          icon: <AlertTriangle className="w-6 h-6 text-white" />,
          buttonBg: 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700',
        };
      case 'info':
        return {
          iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
          icon: <AlertTriangle className="w-6 h-6 text-white" />,
          buttonBg: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
        };
      default:
        return {
          iconBg: 'bg-gradient-to-br from-red-500 to-red-600',
          icon: <Trash2 className="w-6 h-6 text-white" />,
          buttonBg: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] bg-zinc-900 border-zinc-800 rounded-2xl">
        <DialogHeader>
          <div className="flex items-start gap-4 mb-2">
            <div className={`w-12 h-12 rounded-xl ${styles.iconBg} flex items-center justify-center shadow-lg shrink-0`}>
              {styles.icon}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl text-white mb-2">
                {title}
              </DialogTitle>
              <DialogDescription className="text-zinc-400 text-sm leading-relaxed">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex gap-3 mt-4">
          <Button
            variant="default"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800 rounded-xl h-11"
          >
            <X className="w-4 h-4 mr-2" />
            {cancelText}
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            disabled={isLoading}
            className={`flex-1 ${styles.buttonBg} text-white font-semibold rounded-xl h-11 shadow-lg`}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Processando...
              </div>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                {confirmText}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
