// src/lib/atividades-helper.ts
// Funções auxiliares para registrar atividades

// Substituindo Prisma.InputJsonValue por any ou Record para compilar offline

interface RegistrarAtividadeParams {
  userId: string;
  tipo: 'compromisso_criado' | 'compromisso_editado' | 'compromisso_excluido' |
  'financeiro_conta_criada' | 'financeiro_conta_editada' | 'financeiro_conta_excluida' |
  'financeiro_cartao_criado' | 'financeiro_cartao_editado' | 'financeiro_cartao_excluido' |
  'financeiro_transacao_criada' | 'financeiro_transacao_editada' | 'financeiro_transacao_excluida' |
  'financeiro_objetivo_criado' | 'financeiro_objetivo_concluido' |
  'leitura_livro_criado' | 'leitura_livro_editado' | 'leitura_livro_excluido' |
  'leitura_filme_criado' | 'leitura_filme_editado' | 'leitura_filme_excluido' |
  'leitura_citacao_criada';
  titulo: string;
  descricao?: string;
  metadata?: Record<string, any>;
}

export async function registrarAtividade({
  userId,
  tipo,
  titulo,
  descricao,
  metadata,
}: RegistrarAtividadeParams) {
  try {
    // Mapear tipo para ícone e cor
    const config: Record<string, { icone: string; cor: string }> = {
      compromisso_criado: {
        icone: 'calendar-check',
        cor: '#10B981', // verde
      },
      compromisso_editado: {
        icone: 'edit',
        cor: '#3B82F6', // azul
      },
      compromisso_excluido: {
        icone: 'calendar-x',
        cor: '#EF4444', // vermelho
      },
      financeiro_conta_criada: {
        icone: 'wallet',
        cor: '#10B981', // verde
      },
      financeiro_conta_editada: {
        icone: 'edit',
        cor: '#3B82F6', // azul
      },
      financeiro_conta_excluida: {
        icone: 'trash-2',
        cor: '#EF4444', // vermelho
      },
      financeiro_cartao_criado: {
        icone: 'credit-card',
        cor: '#10B981', // verde
      },
      financeiro_cartao_editado: {
        icone: 'edit',
        cor: '#3B82F6', // azul
      },
      financeiro_cartao_excluido: {
        icone: 'credit-card',
        cor: '#EF4444', // vermelho
      },
      financeiro_transacao_criada: {
        icone: 'trending-up',
        cor: '#10B981', // verde
      },
      financeiro_transacao_editada: {
        icone: 'edit',
        cor: '#3B82F6', // azul
      },
      financeiro_transacao_excluida: {
        icone: 'trending-down',
        cor: '#EF4444', // vermelho
      },
      financeiro_objetivo_criado: {
        icone: 'target',
        cor: '#F59E0B', // laranja
      },
      financeiro_objetivo_concluido: {
        icone: 'check-circle',
        cor: '#10B981', // verde
      },
      leitura_livro_criado: {
        icone: 'book-open',
        cor: '#10B981', // roxo
      },
      leitura_livro_editado: {
        icone: 'edit',
        cor: '#3B82F6', // azul
      },
      leitura_livro_excluido: {
        icone: 'book-x',
        cor: '#EF4444', // vermelho
      },
      leitura_filme_criado: {
        icone: 'film',
        cor: '#EC4899', // rosa
      },
      leitura_filme_editado: {
        icone: 'edit',
        cor: '#3B82F6', // azul
      },
      leitura_filme_excluido: {
        icone: 'film',
        cor: '#EF4444', // vermelho
      },
      leitura_citacao_criada: {
        icone: 'quote',
        cor: '#F59E0B', // laranja
      },
    };

    const { icone, cor } = config[tipo] || { icone: 'activity', cor: '#10B981' };

    // Aqui iria a lógica para adicionar no Dexie ou apenas console.log por enquanto
    console.log('Atividade registrada (offline):', {
      tipo, titulo, descricao, icone, cor, metadata, userId
    });
  } catch (error) {
    // Não quebrar a aplicação se falhar ao registrar atividade
    console.error('Erro ao registrar atividade:', error);
  }
}