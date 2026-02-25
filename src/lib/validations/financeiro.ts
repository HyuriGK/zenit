import { z } from 'zod';

/**
 * Schema de validação para criação de transações
 * Previne Mass Assignment e valida ranges de valores
 */
export const transacaoSchema = z.object({
  descricao: z
    .string()
    .min(1, 'Descrição é obrigatória')
    .max(255, 'Descrição deve ter no máximo 255 caracteres'),
  valor: z
    .number()
    .positive('Valor deve ser positivo')
    .max(999999999.99, 'Valor máximo excedido'),
  data: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Data inválida',
  }),
  tipo: z.enum(['RECEITA', 'DESPESA'] as const, {
    message: 'Tipo deve ser RECEITA ou DESPESA',
  }),
  observacoes: z
    .string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .optional()
    .nullable(),
  isFixa: z.boolean().optional().default(false),
  isParcela: z.boolean().optional().default(false),
  parcelaTotais: z
    .number()
    .int('Número de parcelas deve ser inteiro')
    .min(2, 'Mínimo de 2 parcelas')
    .max(48, 'Máximo de 48 parcelas')
    .optional()
    .nullable(),
  categoriaId: z.string().uuid('ID de categoria inválido').optional().nullable(),
  contaBancariaId: z.string().uuid('ID de conta bancária inválido'),
  cartaoId: z.string().uuid('ID de cartão inválido').optional().nullable(),
  objetivoId: z.string().uuid('ID de objetivo inválido').optional().nullable(),
});

export type TransacaoInput = z.infer<typeof transacaoSchema>;

/**
 * Schema de validação para atualização de transações
 */
export const transacaoUpdateSchema = z.object({
  descricao: z
    .string()
    .min(1, 'Descrição é obrigatória')
    .max(255, 'Descrição deve ter no máximo 255 caracteres')
    .optional(),
  valor: z
    .number()
    .positive('Valor deve ser positivo')
    .max(999999999.99, 'Valor máximo excedido')
    .optional(),
  data: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Data inválida',
    })
    .optional(),
  tipo: z
    .enum(['RECEITA', 'DESPESA'] as const, {
      message: 'Tipo deve ser RECEITA ou DESPESA',
    })
    .optional(),
  observacoes: z
    .string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .optional()
    .nullable(),
  categoriaId: z.string().uuid('ID de categoria inválido').optional().nullable(),
  contaBancariaId: z.string().uuid('ID de conta bancária inválido'),
  cartaoId: z.string().uuid('ID de cartão inválido').optional().nullable(),
});

export type TransacaoUpdateInput = z.infer<typeof transacaoUpdateSchema>;
