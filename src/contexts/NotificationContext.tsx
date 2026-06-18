'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useSession } from '@/lib/auth-mock';
import { toast } from 'sonner';

interface Notificacao {
  id: string;
  tipo: 'CONQUISTA' | 'SISTEMA';
  titulo: string;
  mensagem: string;
  dados?: Record<string, unknown>;
  lida: boolean;
  lidaEm?: string | null;
  createdAt: string;
}

interface NotificationContextType {
  notificacoes: Notificacao[];
  unreadCount: number;
  isLoading: boolean;
  marcarComoLida: (id: string) => Promise<void>;
  marcarTodasComoLidas: () => Promise<void>;
  refresh: () => Promise<void>;
  toastsAtivos: boolean;
  setToastsAtivos: (ativo: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const POLLING_INTERVAL = 30000; // 30 segundos

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [toastsAtivos, setToastsAtivos] = useState(true);

  // Ref para rastrear IDs de notificações já vistas (para evitar toasts duplicados)
  const notificacoesVistasRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);

  const fetchNotificacoes = useCallback(async () => {
    if (status !== 'authenticated') return;

    try {
      const response = await fetch('/api/v1/notificacoes?limit=20');

      if (response.ok) {
        const data = await response.json();
        const novasNotificacoes: Notificacao[] = data.data;

        // Verificar novas notificações não lidas (para mostrar toast)
        if (!isFirstLoadRef.current && toastsAtivos) {
          const novasNaoLidas = novasNotificacoes.filter(
            n => !n.lida && !notificacoesVistasRef.current.has(n.id)
          );

          // Mostrar toast para cada nova notificação
          novasNaoLidas.forEach((notif) => {
            // Adicionar ao set de vistas
            notificacoesVistasRef.current.add(notif.id);

            // Mostrar toast baseado no tipo
            const toastOptions = {
              description: notif.mensagem,
              duration: 5000,
            };

            switch (notif.tipo) {
              case 'CONQUISTA':
                toast.success(notif.titulo, toastOptions);
                break;
              default:
                toast(notif.titulo, toastOptions);
            }
          });
        }

        // Atualizar estado
        setNotificacoes(novasNotificacoes);

        // Atualizar set de vistas com todas as notificações carregadas
        novasNotificacoes.forEach(n => notificacoesVistasRef.current.add(n.id));

        // Marcar primeiro load como concluído
        if (isFirstLoadRef.current) {
          isFirstLoadRef.current = false;
        }
      }
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    } finally {
      setIsLoading(false);
    }
  }, [status, toastsAtivos]);

  const fetchUnreadCount = useCallback(async () => {
    if (status !== 'authenticated') return;

    try {
      const response = await fetch('/api/v1/notificacoes/nao-lidas/count');

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('Erro ao buscar contagem:', error);
    }
  }, [status]);

  const marcarComoLida = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/v1/notificacoes/${id}/lida`, {
        method: 'PUT',
      });

      if (response.ok) {
        // Atualizar estado local
        setNotificacoes(prev =>
          prev.map(n =>
            n.id === id ? { ...n, lida: true, lidaEm: new Date().toISOString() } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  }, []);

  const marcarTodasComoLidas = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/notificacoes/marcar-todas-lidas', {
        method: 'PUT',
      });

      if (response.ok) {
        // Atualizar estado local
        setNotificacoes(prev =>
          prev.map(n => ({ ...n, lida: true, lidaEm: new Date().toISOString() }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([fetchNotificacoes(), fetchUnreadCount()]);
  }, [fetchNotificacoes, fetchUnreadCount]);

  // Efeito para buscar dados iniciais
  useEffect(() => {
    if (status === 'authenticated') {
      refresh();
    }
  }, [status, refresh]);

  // Efeito para polling
  useEffect(() => {
    if (status !== 'authenticated') return;

    const interval = setInterval(() => {
      fetchNotificacoes();
      fetchUnreadCount();
    }, POLLING_INTERVAL);

    return () => clearInterval(interval);
  }, [status, fetchNotificacoes, fetchUnreadCount]);

  // Resetar estado quando não autenticado
  useEffect(() => {
    if (status === 'unauthenticated') {
      setNotificacoes([]);
      setUnreadCount(0);
      notificacoesVistasRef.current.clear();
      isFirstLoadRef.current = true;
    }
  }, [status]);

  return (
    <NotificationContext.Provider
      value={{
        notificacoes,
        unreadCount,
        isLoading,
        marcarComoLida,
        marcarTodasComoLidas,
        refresh,
        toastsAtivos,
        setToastsAtivos,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications deve ser usado dentro de NotificationProvider');
  }
  return context;
}
