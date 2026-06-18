import { z } from 'zod';

// Schema para criar notificação
export const notificacaoSchema = z.object({
  tipo: z.enum(['CONQUISTA', 'SISTEMA']),
  titulo: z.string().min(1, 'Título é obrigatório').max(200),
  mensagem: z.string().min(1, 'Mensagem é obrigatória').max(1000),
  dados: z.any().optional(),
});

// Schema para preferências de notificação
export const preferenciaNotificacaoSchema = z.object({
  toastAtivo: z.boolean().optional(),
});

// Tipos TypeScript
export type NotificacaoInput = z.infer<typeof notificacaoSchema>;
export type PreferenciaNotificacaoInput = z.infer<typeof preferenciaNotificacaoSchema>;
