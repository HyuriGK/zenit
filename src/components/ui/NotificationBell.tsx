'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/contexts/NotificationContext';
import {
  Bell,
  CheckCheck,
  Award,
  Info,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Mapeamento de ícones por tipo de notificação
const TIPO_CONFIG = {
  CONQUISTA: {
    icon: Award,
    bgColor: 'bg-green-500/20',
    iconColor: 'text-green-400',
  },
  SISTEMA: {
    icon: Info,
    bgColor: 'bg-zinc-500/20',
    iconColor: 'text-zinc-400',
  },
};

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations('notifications');
  const {
    notificacoes,
    unreadCount,
    isLoading,
    marcarComoLida,
    marcarTodasComoLidas,
  } = useNotifications();

  const handleNotificationClick = useCallback(async (id: string, lida: boolean) => {
    if (!lida) {
      await marcarComoLida(id);
    }
  }, [marcarComoLida]);

  const handleMarkAllRead = useCallback(async () => {
    await marcarTodasComoLidas();
  }, [marcarTodasComoLidas]);

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ptBR,
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative hover:bg-zinc-800 h-8 w-8 sm:h-9 sm:w-9 text-white hover:text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 sm:top-0 sm:right-0 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Bell className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{t('title')}</h3>
                    <p className="text-xs text-zinc-500">
                      {unreadCount > 0
                        ? t('unreadCount', { count: unreadCount })
                        : t('allRead')}
                    </p>
                  </div>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    {t('markAllRead')}
                  </button>
                )}
              </div>
            </div>

            {/* Lista de Notificações */}
            <div className="max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-green-400 animate-spin" />
                </div>
              ) : notificacoes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4">
                  <div className="p-3 bg-zinc-800/50 rounded-full mb-3">
                    <Bell className="w-6 h-6 text-zinc-500" />
                  </div>
                  <p className="text-sm text-zinc-400 text-center">{t('noNotifications')}</p>
                  <p className="text-xs text-zinc-500 text-center mt-1">{t('noNotificationsDesc')}</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-800/50">
                  {notificacoes.map((notif) => {
                    const config = TIPO_CONFIG[notif.tipo] || TIPO_CONFIG.SISTEMA;
                    const Icon = config.icon;

                    return (
                      <button
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif.id, notif.lida)}
                        className={`w-full p-4 text-left transition-colors hover:bg-zinc-800/50 ${
                          !notif.lida
                            ? 'bg-green-500/5 border-l-2 border-l-green-500'
                            : 'opacity-70'
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className={`p-2 rounded-lg shrink-0 ${config.bgColor}`}>
                            <Icon className={`w-4 h-4 ${config.iconColor}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm font-medium truncate ${
                                !notif.lida ? 'text-white' : 'text-zinc-400'
                              }`}>
                                {notif.titulo}
                              </p>
                              {!notif.lida && (
                                <span className="w-2 h-2 bg-green-500 rounded-full shrink-0 mt-1.5" />
                              )}
                            </div>
                            <p className="text-xs text-zinc-500 line-clamp-2 mt-0.5">
                              {notif.mensagem}
                            </p>
                            <p className="text-[10px] text-zinc-600 mt-1.5">
                              {formatTime(notif.createdAt)}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notificacoes.length > 0 && (
              <div className="p-3 border-t border-zinc-800 bg-zinc-800/30">
                <p className="text-[10px] text-zinc-500 text-center">
                  {t('showingRecent', { count: notificacoes.length })}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
