import { z } from 'zod';

// Validação de cor hexadecimal
const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

// Validação de horário (HH:MM)
const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

// Schema para Hábito
export const habitoSchema = z.object({
  nome: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  descricao: z
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),
  horario: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val))
    .refine((val) => val === null || val === undefined || timeRegex.test(val), {
      message: 'Horário deve estar no formato HH:MM',
    }),
  diasSemana: z
    .array(z.number().min(0).max(6))
    .optional()
    .default([]),
  cor: z
    .string()
    .regex(hexColorRegex, 'Cor deve ser um código hexadecimal válido')
    .optional()
    .default('#10B981'),
  icone: z
    .string()
    .max(50, 'Ícone inválido')
    .optional()
    .default('target'),
  categoriaId: z
    .string()
    .cuid()
    .optional()
    .nullable(),
});

export const habitoUpdateSchema = habitoSchema.partial();

// Schema para Registro de Hábito
export const registroHabitoSchema = z.object({
  data: z
    .string()
    .or(z.date())
    .transform((val) => (typeof val === 'string' ? new Date(val) : val)),
  completado: z
    .boolean()
    .optional()
    .default(true),
  notas: z
    .string()
    .max(500, 'Notas devem ter no máximo 500 caracteres')
    .optional()
    .nullable(),
  timezone: z
    .string()
    .optional()
    .nullable(),
});

// Schema para Categoria de Hábito
export const categoriaHabitoSchema = z.object({
  nome: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(50, 'Nome deve ter no máximo 50 caracteres'),
  cor: z
    .string()
    .regex(hexColorRegex, 'Cor deve ser um código hexadecimal válido')
    .optional()
    .default('#10B981'),
  icone: z
    .string()
    .max(50, 'Ícone inválido')
    .optional()
    .default('folder'),
  ordem: z
    .number()
    .int()
    .min(0)
    .optional()
    .default(0),
});

export const categoriaHabitoUpdateSchema = categoriaHabitoSchema.partial();

// Tipos TypeScript gerados automaticamente
export type HabitoInput = z.infer<typeof habitoSchema>;
export type HabitoUpdateInput = z.infer<typeof habitoUpdateSchema>;
export type RegistroHabitoInput = z.infer<typeof registroHabitoSchema>;
export type CategoriaHabitoInput = z.infer<typeof categoriaHabitoSchema>;
export type CategoriaHabitoUpdateInput = z.infer<typeof categoriaHabitoUpdateSchema>;
