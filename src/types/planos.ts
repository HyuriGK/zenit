/**
 * Tipos e utilitários para gerenciamento de planos de usuário
 */

export enum PlanoUsuario {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
}

/**
 * Recursos disponíveis na plataforma
 */
export enum RecursoPremium {
  // Biblioteca - IA
  GERAR_RESENHA_IA = 'GERAR_RESENHA_IA',

  // Agenda - Google Calendar
  SINCRONIZAR_GOOGLE_CALENDAR = 'SINCRONIZAR_GOOGLE_CALENDAR',
}

/**
 * Mapeia quais recursos estão disponíveis para cada plano
 */
export const RECURSOS_POR_PLANO: Record<PlanoUsuario, RecursoPremium[]> = {
  [PlanoUsuario.FREE]: [
    // Plano FREE não tem acesso a recursos premium
  ],
  [PlanoUsuario.PREMIUM]: [
    // Plano PREMIUM tem acesso a todos os recursos
    RecursoPremium.GERAR_RESENHA_IA,
    RecursoPremium.SINCRONIZAR_GOOGLE_CALENDAR,
  ],
};

/**
 * Informações sobre os planos
 */
export interface PlanoInfo {
  nome: string;
  descricao: string;
  preco: string;
  recursos: string[];
  destaque?: boolean;
}

export const PLANOS_INFO: Record<PlanoUsuario, PlanoInfo> = {
  [PlanoUsuario.FREE]: {
    nome: 'Free',
    descricao: 'Perfeito para começar',
    preco: 'R$ 0',
    recursos: [
      'Gerenciamento de agenda',
      'Módulo financeiro completo',
      'Biblioteca de livros e filmes',
      'Módulo de estudos',
      'Anotações e citações',
    ],
  },
  [PlanoUsuario.PREMIUM]: {
    nome: 'Premium',
    descricao: 'Recursos avançados com IA',
    preco: 'R$ 29,90',
    recursos: [
      'Todos os recursos do plano Free',
      'Geração de resenhas com IA',
      'Sincronização com Google Calendar',
      'Suporte prioritário',
      'Novos recursos em primeira mão',
    ],
    destaque: true,
  },
};

/**
 * Mensagens de erro para recursos premium
 */
export const MENSAGENS_PLANO = {
  [RecursoPremium.GERAR_RESENHA_IA]: {
    titulo: 'Recurso Premium',
    descricao: 'A geração de resenhas com IA está disponível apenas para usuários Premium.',
    cta: 'Faça upgrade para Premium',
  },
  [RecursoPremium.SINCRONIZAR_GOOGLE_CALENDAR]: {
    titulo: 'Recurso Premium',
    descricao: 'A sincronização com Google Calendar está disponível apenas para usuários Premium.',
    cta: 'Faça upgrade para Premium',
  },
};
