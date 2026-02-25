// src/types/compromisso.ts
// Atualize ou crie este arquivo

export type TipoRecorrencia = 'diario' | 'semanal' | 'mensal' | 'anual' | null;

export interface Compromisso {
  id: string;
  titulo: string;
  descricao?: string;
  data: string; // ISO string
  horaInicio: string;
  horaFim?: string;
  categoria?: string;
  cor: string;
  concluido: boolean;

  // Campos de recorrência
  isRecorrente: boolean;
  tipoRecorrencia?: TipoRecorrencia;
  intervaloRecorrencia?: number;
  dataFimRecorrencia?: string;
  recorrenciaGrupoId?: string;
  recorrenciaInstancia?: number;

  // Integração Google Calendar
  syncWithGoogle: boolean;
  googleEventId?: string;

  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecorrenciaConfig {
  isRecorrente: boolean;
  tipoRecorrencia?: TipoRecorrencia;
  intervaloRecorrencia?: number;
  dataFimRecorrencia?: Date | null;
  quantidadeOcorrencias?: number; // Alternativa a dataFimRecorrencia
}