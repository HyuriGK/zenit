'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles, Calendar, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface UpgradeToPremiumModalProps {
  open: boolean;
  onClose: () => void;
  recurso?: string;
  descricao?: string;
}

export function UpgradeToPremiumModal({
  open,
  onClose,
  recurso,
  descricao,
}: UpgradeToPremiumModalProps) {
  const t = useTranslations('premium');
  const router = useRouter();

  const handleUpgrade = () => {
    onClose();
    router.push('/premium');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl text-white">{recurso}</DialogTitle>
              <DialogDescription className="text-zinc-400">
                {descricao}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Crown className="w-5 h-5 text-green-400" />
              {t('features')}
            </h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                <span className="text-zinc-300">
                  <Sparkles className="w-4 h-4 inline mr-1 text-green-400" />
                  {t('aiReviews')}
                </span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                <span className="text-zinc-300">
                  <Calendar className="w-4 h-4 inline mr-1 text-blue-400" />
                  {t('googleCalendar')}
                </span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                <span className="text-zinc-300">{t('pomodoroTimer')}</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                <span className="text-zinc-300">{t('prioritySupport')}</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                <span className="text-zinc-300">{t('earlyAccess')}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500/10 to-teal-500/10 border border-green-500/30 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-white mb-1">{t('price')}</div>
            <div className="text-sm text-zinc-400">{t('perMonth')}</div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="default"
            onClick={onClose}
            className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            {t('notNow')}
          </Button>
          <Button
            onClick={handleUpgrade}
            className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold"
          >
            <Crown className="w-4 h-4 mr-2" />
            {t('upgrade')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
