'use client';

import { useEffect, useRef, useCallback } from 'react';
import { signOut, useSession } from 'next-auth/react';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos em milissegundos

export function InactivityTracker() {
    const { data: session } = useSession();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleLogout = useCallback(async () => {
        if (session) {
            await signOut({ callbackUrl: '/login', redirect: true });
        }
    }, [session]);

    const resetTimer = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        
        if (session) {
            timeoutRef.current = setTimeout(handleLogout, INACTIVITY_TIMEOUT);
        }
    }, [session, handleLogout]);

    useEffect(() => {
        if (!session) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            return;
        }

        const events = [
            'mousedown',
            'mousemove',
            'keydown',
            'scroll',
            'touchstart',
            'click'
        ];

        // Inicializa o timer
        resetTimer();

        // Adiciona listeners para atividade do usuário
        events.forEach(event => {
            window.addEventListener(event, resetTimer);
        });

        // Cleanup
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            events.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [session, resetTimer]);

    return null; // Este componente não renderiza nada
}
