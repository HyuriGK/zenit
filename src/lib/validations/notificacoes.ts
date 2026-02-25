import { z } from 'zod';

// Schema para criar notificação
export const notificacaoSchema = z.object({
  tipo: z.enum(['LEMBRETE_HABITO', 'RESUMO_DIARIO', 'SEQUENCIA_RISCO', 'CONQUISTA', 'SISTEMA']),
  titulo: z.string().min(1, 'Título é obrigatório').max(200),
  mensagem: z.string().min(1, 'Mensagem é obrigatória').max(1000),
  dados: z.any().optional(),
});

// Schema para preferências de notificação
export const preferenciaNotificacaoSchema = z.object({
  lembreteHabitoAtivo: z.boolean().optional(),
  resumoDiarioAtivo: z.boolean().optional(),
  horarioResumoDiario: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário deve estar no formato HH:MM')
    .optional(),
  alertaSequenciaAtivo: z.boolean().optional(),
  toastAtivo: z.boolean().optional(),
});

// Tipos TypeScript
export type NotificacaoInput = z.infer<typeof notificacaoSchema>;
export type PreferenciaNotificacaoInput = z.infer<typeof preferenciaNotificacaoSchema>;
