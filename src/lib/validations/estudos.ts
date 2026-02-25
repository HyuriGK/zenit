import { z } from 'zod';

// Validação de cor hexadecimal
const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

// Schema para Curso
export const cursoSchema = z.object({
  nome: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  descricao: z
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional()
    .nullable(),
  cor: z
    .string()
    .regex(hexColorRegex, 'Cor deve ser um código hexadecimal válido')
    .optional()
    .default('#10B981'),
  icone: z
    .string()
    .max(50, 'Ícone inválido')
    .optional()
    .default('book-open'),
  ordem: z
    .number()
    .int()
    .min(0)
    .max(1000)
    .optional()
    .default(0),
});

export const cursoUpdateSchema = cursoSchema.partial();

// Schema para Módulo
export const moduloSchema = z.object({
  nome: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  descricao: z
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional()
    .nullable(),
  cursoId: z.string().min(1, 'ID do curso é obrigatório'),
  ordem: z.number().int().min(0).max(1000).optional().default(0),
});

export const moduloUpdateSchema = moduloSchema.partial().omit({ cursoId: true });

// Schema para Página
export const paginaSchema = z.object({
  titulo: z
    .string()
    .min(1, 'Título é obrigatório')
    .max(200, 'Título deve ter no máximo 200 caracteres'),
  conteudo: z
    .string()
    .max(500000, 'Conteúdo muito grande (máximo 500KB)')
    .optional()
    .default(''),
  moduloId: z.string().min(1, 'ID do módulo é obrigatório'),
  ordem: z.number().int().min(0).max(1000).optional().default(0),
});

export const paginaUpdateSchema = paginaSchema.partial().omit({ moduloId: true });

// Schema para Anotação
export const anotacaoSchema = z.object({
  titulo: z
    .string()
    .min(1, 'Título é obrigatório')
    .max(200, 'Título deve ter no máximo 200 caracteres'),
  conteudo: z
    .string()
    .max(100000, 'Conteúdo muito grande (máximo 100KB)')
    .optional()
    .default(''),
  cor: z
    .string()
    .regex(hexColorRegex, 'Cor deve ser um código hexadecimal válido')
    .optional()
    .default('#FBBF24'),
  cursoId: z.string().min(1, 'ID do curso é obrigatório').optional().nullable(),
});

export const anotacaoUpdateSchema = anotacaoSchema.partial();

// Schema para Busca
export const buscaSchema = z.object({
  q: z
    .string()
    .min(2, 'Busca deve ter pelo menos 2 caracteres')
    .max(100, 'Busca deve ter no máximo 100 caracteres'),
});

// Tipos TypeScript gerados automaticamente
export type CursoInput = z.infer<typeof cursoSchema>;
export type CursoUpdateInput = z.infer<typeof cursoUpdateSchema>;
export type ModuloInput = z.infer<typeof moduloSchema>;
export type ModuloUpdateInput = z.infer<typeof moduloUpdateSchema>;
export type PaginaInput = z.infer<typeof paginaSchema>;
export type PaginaUpdateInput = z.infer<typeof paginaUpdateSchema>;
export type AnotacaoInput = z.infer<typeof anotacaoSchema>;
export type AnotacaoUpdateInput = z.infer<typeof anotacaoUpdateSchema>;
export type BuscaInput = z.infer<typeof buscaSchema>;
