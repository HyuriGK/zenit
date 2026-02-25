/**
 * Hook customizado para verificar o plano do usuário e acesso a recursos premium
 */

import { useSession } from '@/lib/auth-mock';
import { useState } from 'react';
import { PlanoUsuario, RecursoPremium } from '@/types/planos';
import { verificarAcessoRecurso, isPremium, isFree, getPlanoEfetivo } from '@/lib/planos-helper';

export function usePlano() {
  const { data: session, status, update } = useSession();
  const [isUpdating, setIsUpdating] = useState(false);

  const isLoading = status === 'loading';
  const plano = (session?.user?.plano as PlanoUsuario) || PlanoUsuario.FREE;
  const planoExpiraEm = session?.user?.planoExpiraEm ? new Date(session.user.planoExpiraEm) : undefined;
  const planoEfetivo = getPlanoEfetivo(plano, planoExpiraEm);

  /**
   * Verifica se o usuário tem acesso a um recurso específico
   */
  const temAcessoARecurso = (recurso: RecursoPremium): boolean => {
    if (isLoading) return false;
    const resultado = verificarAcessoRecurso(plano, planoExpiraEm, recurso);
    return resultado.temAcesso;
  };

  /**
   * Verifica se o usuário é Premium
   */
  const ehPremium = !isLoading && isPremium(planoEfetivo);

  /**
   * Verifica se o usuário é Free
   */
  const ehFree = !isLoading && isFree(planoEfetivo);

  /**
   * Atualiza o plano do usuário e força refresh da sessão
   */
  const atualizarPlano = async (novoPlano: PlanoUsuario, planoExpiraEm?: Date) => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/v1/planos', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plano: novoPlano,
          planoExpiraEm,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar plano');
      }

      // Forçar atualização da sessão
      await update();

      return await response.json();
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Força refresh da sessão para obter dados atualizados
   */
  const refreshSessao = async () => {
    setIsUpdating(true);
    try {
      await update();
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    plano: planoEfetivo,
    planoOriginal: plano,
    planoExpiraEm,
    ehPremium,
    ehFree,
    temAcessoARecurso,
    atualizarPlano,
    refreshSessao,
    isUpdating,
    // Verificações específicas de recursos
    podeGerarResenhaIA: temAcessoARecurso(RecursoPremium.GERAR_RESENHA_IA),
    podeSincronizarGoogleCalendar: temAcessoARecurso(RecursoPremium.SINCRONIZAR_GOOGLE_CALENDAR),
  };
}
