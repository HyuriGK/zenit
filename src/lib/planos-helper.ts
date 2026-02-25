/**
 * Helper para verificação de recursos premium e planos de usuário
 */

import { PlanoUsuario, RecursoPremium, RECURSOS_POR_PLANO } from '@/types/planos';

/**
 * Verifica se um usuário tem acesso a um recurso específico baseado em seu plano
 */
export function temAcessoRecurso(
  planoUsuario: PlanoUsuario | string,
  recurso: RecursoPremium
): boolean {
  // Garantir que estamos comparando com os valores corretos do enum
  const plano = planoUsuario as PlanoUsuario;

  // Se o plano não existir, considerar como FREE
  if (!plano || !Object.values(PlanoUsuario).includes(plano)) {
    return false;
  }

  const recursosDisponiveis = RECURSOS_POR_PLANO[plano] || [];
  return recursosDisponiveis.includes(recurso);
}

/**
 * Verifica se o plano do usuário é Premium
 */
export function isPremium(planoUsuario: PlanoUsuario | string): boolean {
  return planoUsuario === PlanoUsuario.PREMIUM;
}

/**
 * Verifica se o plano do usuário é Free
 */
export function isFree(planoUsuario: PlanoUsuario | string): boolean {
  return !planoUsuario || planoUsuario === PlanoUsuario.FREE;
}

/**
 * Verifica se o plano do usuário expirou (para planos com data de expiração)
 */
export function planoExpirado(planoExpiraEm: Date | null | undefined): boolean {
  if (!planoExpiraEm) {
    return false;
  }

  return new Date() > new Date(planoExpiraEm);
}

/**
 * Retorna o plano efetivo do usuário considerando a data de expiração
 */
export function getPlanoEfetivo(
  plano: PlanoUsuario | string,
  planoExpiraEm: Date | null | undefined
): PlanoUsuario {
  // Se o plano expirou, retornar FREE
  if (planoExpirado(planoExpiraEm)) {
    return PlanoUsuario.FREE;
  }

  // Retornar o plano atual
  return (plano as PlanoUsuario) || PlanoUsuario.FREE;
}

/**
 * Verifica se o usuário tem acesso a um recurso considerando a expiração do plano
 */
export function verificarAcessoRecurso(
  plano: PlanoUsuario | string,
  planoExpiraEm: Date | null | undefined,
  recurso: RecursoPremium
): {
  temAcesso: boolean;
  planoEfetivo: PlanoUsuario;
  motivo?: string;
} {
  const planoEfetivo = getPlanoEfetivo(plano, planoExpiraEm);
  const temAcesso = temAcessoRecurso(planoEfetivo, recurso);

  let motivo: string | undefined;

  if (!temAcesso) {
    if (planoExpirado(planoExpiraEm)) {
      motivo = 'Seu plano Premium expirou. Renove para continuar acessando este recurso.';
    } else {
      motivo = 'Este recurso está disponível apenas para usuários Premium.';
    }
  }

  return {
    temAcesso,
    planoEfetivo,
    motivo,
  };
}

/**
 * Retorna uma lista de todos os recursos premium disponíveis
 */
export function getRecursosPremium(): RecursoPremium[] {
  return Object.values(RecursoPremium);
}

/**
 * Retorna a descrição amigável de um recurso
 */
export function getDescricaoRecurso(recurso: RecursoPremium): string {
  const descricoes: Record<RecursoPremium, string> = {
    [RecursoPremium.GERAR_RESENHA_IA]: 'Geração de resenhas com IA',
    [RecursoPremium.SINCRONIZAR_GOOGLE_CALENDAR]: 'Sincronização com Google Calendar',
  };

  return descricoes[recurso] || recurso;
}
