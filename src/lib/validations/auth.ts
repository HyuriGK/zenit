import { z } from 'zod';

// Lista de usernames reservados/proibidos
export const RESERVED_USERNAMES = [
  'admin', 'administrator', 'root', 'system', 'zenit',
  'support', 'help', 'info', 'contact', 'api',
  'dashboard', 'settings', 'profile', 'login', 'register',
  'signup', 'signin', 'logout', 'signout', 'auth',
  'null', 'undefined', 'true', 'false', 'test',
  'mod', 'moderator', 'staff', 'team', 'oficial',
  'official', 'verified', 'premium', 'free', 'pro',
];

// Regex para username: letras, números, underscore e ponto
export const usernameRegex = /^[a-zA-Z0-9_.]+$/;

// Schema base para username
export const usernameSchema = z
  .string()
  .min(3, 'Username deve ter no mínimo 3 caracteres')
  .max(30, 'Username deve ter no máximo 30 caracteres')
  .regex(usernameRegex, 'Username pode conter apenas letras, números, underscore (_) e ponto (.)')
  .refine((val) => !val.startsWith('.') && !val.endsWith('.'), {
    message: 'Username não pode começar ou terminar com ponto',
  })
  .refine((val) => !val.includes('..'), {
    message: 'Username não pode ter pontos consecutivos',
  })
  .refine((val) => !RESERVED_USERNAMES.includes(val.toLowerCase()), {
    message: 'Este username não está disponível',
  })
  .transform((val) => val.toLowerCase());

// Schema para Login
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(8, 'Senha deve ter no mínimo 8 caracteres'),
});

// Schema para Registro (atualizado com username)
export const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome muito longo'),
  username: usernameSchema,
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Senha deve conter: letra maiúscula, minúscula e número'
    ),
});

// Schema para escolha de username (usuários Google)
export const chooseUsernameSchema = z.object({
  username: usernameSchema,
});

// Schema para atualização de username
export const updateUsernameSchema = z.object({
  username: usernameSchema,
});

// Tipos TypeScript gerados automaticamente
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ChooseUsernameInput = z.infer<typeof chooseUsernameSchema>;
export type UpdateUsernameInput = z.infer<typeof updateUsernameSchema>;
