# Sistema de Controle de Emails e Autenticação

## 📋 Índice

1. [Visão Geral do Sistema Atual](#visão-geral-do-sistema-atual)
2. [Arquitetura de Autenticação](#arquitetura-de-autenticação)
3. [Status Atual das Funcionalidades](#status-atual-das-funcionalidades)
4. [Como Implementar Verificação de Email](#como-implementar-verificação-de-email)
5. [Como Implementar Redefinição de Senha](#como-implementar-redefinição-de-senha)
6. [Configuração de Serviço de Email](#configuração-de-serviço-de-email)
7. [Fluxos de Autenticação](#fluxos-de-autenticação)
8. [Segurança e Boas Práticas](#segurança-e-boas-práticas)

---

## Visão Geral do Sistema Atual

O projeto Zenit utiliza **Next.js 14** com **NextAuth.js v5** (Auth.js) para autenticação e **Prisma** como ORM para gerenciar dados de usuários.

### Tecnologias Utilizadas

- **Framework**: Next.js 14.2.23 (App Router)
- **Autenticação**: NextAuth.js v5.0.0-beta.30
- **Banco de Dados**: PostgreSQL via Prisma
- **Hash de Senha**: bcryptjs (10 rounds)
- **Sessão**: JWT (JSON Web Tokens)
- **OAuth Provider**: Google OAuth 2.0

### Estrutura de Arquivos Principais

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx                    # Página de login
│   │   └── register/page.tsx                 # Página de registro
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register/route.ts            # Endpoint de registro
│   │   │   ├── login/route.ts               # Endpoint de login
│   │   │   └── [...nextauth]/route.ts       # NextAuth handlers
│   │   └── v1/
│   │       └── perfil/
│   │           └── senha/route.ts            # Alteração de senha
│   └── (dashboard)/
│       └── dashboard/
│           ├── perfil/page.tsx               # Página de perfil
│           └── settings/page.tsx             # Configurações
├── lib/
│   ├── auth/
│   │   └── authOptions.ts                    # Configuração NextAuth
│   └── validations/
│       └── auth.ts                           # Schemas de validação
└── prisma/
    └── schema.prisma                         # Schema do banco de dados
```

---

## Arquitetura de Autenticação

### Modelo de Usuário (Prisma)

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?  // ⚠️ Campo importante para verificação
  password      String?    // Null para usuários OAuth
  image         String?

  // Campos OAuth Google
  googleAccessToken         String?
  googleRefreshToken        String?
  googleTokenExpiry         DateTime?
  googleCalendarChannelId   String?
  googleCalendarResourceId  String?
  googleCalendarWatchExpiration DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relacionamentos
  accounts      Account[]
  compromissos  Compromisso[]
  metas         Meta[]
  // ... outros relacionamentos
}
```

### Provedores de Autenticação Configurados

1. **Credentials Provider**: Login com email e senha
2. **Google Provider**: Login com OAuth 2.0 do Google

---

## Status Atual das Funcionalidades

### ✅ Funcionalidades Implementadas

#### 1. Registro de Usuário (Credentials)
- **Endpoint**: `POST /api/auth/register`
- **Arquivo**: [src/app/api/auth/register/route.ts](src/app/api/auth/register/route.ts)
- **Validações**:
  - Nome: 3-100 caracteres
  - Email: formato válido
  - Senha: mínimo 8 caracteres, deve conter maiúscula, minúscula e número
- **Processo**:
  1. Valida dados de entrada
  2. Verifica se email já existe
  3. Faz hash da senha com bcrypt (10 rounds)
  4. Cria usuário no banco de dados
  5. ⚠️ **emailVerified fica NULL** (não verifica email)

#### 2. Login com Credentials
- **Endpoint**: `POST /api/auth/login`
- **Arquivo**: [src/app/api/auth/login/route.ts](src/app/api/auth/login/route.ts)
- **Processo**:
  1. Valida email e senha
  2. Busca usuário por email
  3. Compara senha com bcrypt
  4. Cria sessão JWT via NextAuth

#### 3. Login com Google OAuth
- **Arquivo**: [src/lib/auth/authOptions.ts](src/lib/auth/authOptions.ts:9-18)
- **Escopos**: Email, Profile, Google Calendar
- **Processo**:
  1. Redireciona para consent screen do Google
  2. Recebe tokens de acesso e refresh
  3. Se usuário novo, cria conta com `emailVerified = new Date()`
  4. Se usuário existente, atualiza tokens
  5. ✅ **Email automaticamente verificado** para usuários Google

#### 4. Alteração de Senha (Usuário Autenticado)
- **Endpoint**: `PUT /api/v1/perfil/senha`
- **Arquivo**: [src/app/api/v1/perfil/senha/route.ts](src/app/api/v1/perfil/senha/route.ts)
- **Validações**:
  - Senha atual: obrigatória e deve bater com hash
  - Nova senha: mínimo 6 caracteres
- **Processo**:
  1. Verifica sessão do usuário
  2. Valida senha atual com bcrypt.compare()
  3. Gera hash da nova senha
  4. Atualiza senha no banco de dados

#### 5. Exibição de Status de Verificação
- **Arquivo**: [src/app/(dashboard)/dashboard/perfil/page.tsx](src/app/(dashboard)/dashboard/perfil/page.tsx:150-156)
- Mostra badge "Verificado" se `emailVerified` não é null
- Email não é editável pelo usuário

### ❌ Funcionalidades NÃO Implementadas

#### 1. Verificação de Email para Novos Usuários
- ❌ Envio de email de verificação após registro
- ❌ Geração de token de verificação
- ❌ Endpoint para processar verificação
- ❌ Reenvio de email de verificação
- ❌ Bloqueio de funcionalidades para emails não verificados

#### 2. Redefinição de Senha (Esqueci Minha Senha)
- ❌ Link "Esqueceu sua senha?" funcional (existe o botão mas não faz nada)
- ❌ Solicitação de reset de senha
- ❌ Envio de email com link de reset
- ❌ Geração de token temporário
- ❌ Página de criação de nova senha
- ❌ Endpoint de reset de senha

#### 3. Sistema de Envio de Emails
- ❌ Serviço de email configurado (Nodemailer, SendGrid, Resend, etc.)
- ❌ Templates de email
- ❌ Configuração SMTP ou API de email
- ❌ Fila de emails
- ❌ Log de emails enviados

#### 4. Alteração de Email
- ❌ Endpoint para atualizar email
- ❌ Reverificação após mudança de email
- ❌ Notificação para email antigo

#### 5. Notificações por Email
- ⚠️ UI existe mas não funciona
- ❌ Sistema de preferências de notificação
- ❌ Envio de emails para compromissos, metas, finanças

---

## Como Implementar Verificação de Email

### Passo 1: Instalar Biblioteca de Email

Recomendação: **Resend** (moderna, simples e confiável)

```bash
npm install resend
```

Alternativas:
- **Nodemailer** (mais tradicional, qualquer SMTP)
- **SendGrid** (robusto, enterprise)
- **Mailgun** (popular, bom free tier)

### Passo 2: Configurar Variáveis de Ambiente

Adicione em `.env`:

```env
# Email Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@seudominio.com
APP_URL=http://localhost:3000  # ou sua URL de produção
```

### Passo 3: Criar Serviço de Email

Crie o arquivo `src/lib/email/emailService.ts`:

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(
  email: string,
  token: string,
  name?: string
) {
  const verificationUrl = `${process.env.APP_URL}/auth/verify-email?token=${token}`;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: 'Verifique seu email - Zenit',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
          </head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0;">Bem-vindo ao Zenit!</h1>
            </div>
            <div style="padding: 40px; background: #f9fafb;">
              <p style="font-size: 16px; color: #374151;">
                Olá ${name || 'usuário'},
              </p>
              <p style="font-size: 16px; color: #374151;">
                Obrigado por se registrar no Zenit! Para começar a usar todos os recursos,
                precisamos verificar seu endereço de email.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}"
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                          color: white;
                          padding: 15px 40px;
                          text-decoration: none;
                          border-radius: 8px;
                          display: inline-block;
                          font-weight: bold;">
                  Verificar Email
                </a>
              </div>
              <p style="font-size: 14px; color: #6b7280;">
                Se o botão não funcionar, copie e cole este link no navegador:
              </p>
              <p style="font-size: 12px; color: #9ca3af; word-break: break-all;">
                ${verificationUrl}
              </p>
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                Este link expira em 24 horas.
              </p>
              <p style="font-size: 14px; color: #6b7280;">
                Se você não criou esta conta, ignore este email.
              </p>
            </div>
            <div style="background: #374151; padding: 20px; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © 2025 Zenit. Todos os direitos reservados.
              </p>
            </div>
          </body>
        </html>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar email de verificação:', error);
    return { success: false, error };
  }
}
```

### Passo 4: Adicionar Modelo de Token ao Prisma

Adicione em `prisma/schema.prisma`:

```prisma
model VerificationToken {
  id         String   @id @default(cuid())
  email      String
  token      String   @unique
  expires    DateTime
  createdAt  DateTime @default(now())

  @@unique([email, token])
  @@index([email])
  @@index([token])
}
```

Execute a migration:

```bash
npx prisma migrate dev --name add_verification_token
```

### Passo 5: Criar Função de Geração de Token

Adicione em `src/lib/tokens.ts`:

```typescript
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function generateVerificationToken(email: string) {
  // Gera token aleatório seguro
  const token = crypto.randomBytes(32).toString('hex');

  // Token expira em 24 horas
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Remove tokens antigos para este email
  await prisma.verificationToken.deleteMany({
    where: { email }
  });

  // Cria novo token
  const verificationToken = await prisma.verificationToken.create({
    data: {
      email,
      token,
      expires,
    }
  });

  return verificationToken;
}

export async function getVerificationTokenByToken(token: string) {
  try {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token }
    });

    return verificationToken;
  } catch {
    return null;
  }
}

export async function deleteVerificationToken(id: string) {
  await prisma.verificationToken.delete({
    where: { id }
  });
}
```

### Passo 6: Atualizar Endpoint de Registro

Modifique `src/app/api/auth/register/route.ts`:

```typescript
import { generateVerificationToken } from '@/lib/tokens';
import { sendVerificationEmail } from '@/lib/email/emailService';

// ... código existente ...

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedFields = registerSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: 'Campos inválidos' },
        { status: 400 }
      );
    }

    const { name, email, password } = validatedFields.data;

    // Verifica se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 400 }
      );
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Cria usuário (emailVerified = null)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      }
    });

    // Gera token de verificação
    const verificationToken = await generateVerificationToken(email);

    // Envia email de verificação
    await sendVerificationEmail(email, verificationToken.token, name);

    return NextResponse.json(
      {
        message: 'Usuário criado com sucesso! Verifique seu email para ativar sua conta.',
        userId: user.id
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro no registro:', error);
    return NextResponse.json(
      { error: 'Erro ao criar usuário' },
      { status: 500 }
    );
  }
}
```

### Passo 7: Criar Endpoint de Verificação

Crie `src/app/api/auth/verify-email/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVerificationTokenByToken, deleteVerificationToken } from '@/lib/tokens';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { error: 'Token não fornecido' },
      { status: 400 }
    );
  }

  try {
    // Busca token no banco
    const verificationToken = await getVerificationTokenByToken(token);

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 400 }
      );
    }

    // Verifica se token expirou
    if (new Date() > verificationToken.expires) {
      await deleteVerificationToken(verificationToken.id);
      return NextResponse.json(
        { error: 'Token expirado' },
        { status: 400 }
      );
    }

    // Busca usuário
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Atualiza emailVerified
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() }
    });

    // Remove token usado
    await deleteVerificationToken(verificationToken.id);

    return NextResponse.json(
      { message: 'Email verificado com sucesso!' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao verificar email:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar email' },
      { status: 500 }
    );
  }
}
```

### Passo 8: Criar Página de Verificação

Crie `src/app/(auth)/verify-email/page.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token de verificação não encontrado');
      return;
    }

    async function verifyEmail() {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message);

          // Redireciona para login após 3 segundos
          setTimeout(() => {
            router.push('/login?verified=true');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Erro ao verificar email');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Erro ao processar verificação');
      }
    }

    verifyEmail();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Verificando seu email...
              </h1>
              <p className="text-gray-600">Aguarde um momento</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Email verificado!
              </h1>
              <p className="text-gray-600 mb-4">{message}</p>
              <p className="text-sm text-gray-500">
                Redirecionando para o login...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Erro na verificação
              </h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <button
                onClick={() => router.push('/login')}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition"
              >
                Voltar para o login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## Como Implementar Redefinição de Senha

### Passo 1: Adicionar Modelo de Token de Reset

Adicione em `prisma/schema.prisma`:

```prisma
model PasswordResetToken {
  id         String   @id @default(cuid())
  email      String
  token      String   @unique
  expires    DateTime
  createdAt  DateTime @default(now())

  @@unique([email, token])
  @@index([email])
  @@index([token])
}
```

Execute a migration:

```bash
npx prisma migrate dev --name add_password_reset_token
```

### Passo 2: Criar Funções de Token de Reset

Adicione em `src/lib/tokens.ts`:

```typescript
export async function generatePasswordResetToken(email: string) {
  const token = crypto.randomBytes(32).toString('hex');

  // Token expira em 1 hora
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  // Remove tokens antigos
  await prisma.passwordResetToken.deleteMany({
    where: { email }
  });

  const resetToken = await prisma.passwordResetToken.create({
    data: {
      email,
      token,
      expires,
    }
  });

  return resetToken;
}

export async function getPasswordResetTokenByToken(token: string) {
  try {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token }
    });

    return resetToken;
  } catch {
    return null;
  }
}

export async function deletePasswordResetToken(id: string) {
  await prisma.passwordResetToken.delete({
    where: { id }
  });
}
```

### Passo 3: Criar Serviço de Email de Reset

Adicione em `src/lib/email/emailService.ts`:

```typescript
export async function sendPasswordResetEmail(
  email: string,
  token: string,
  name?: string
) {
  const resetUrl = `${process.env.APP_URL}/auth/reset-password?token=${token}`;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: 'Redefinição de Senha - Zenit',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
          </head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0;">Redefinição de Senha</h1>
            </div>
            <div style="padding: 40px; background: #f9fafb;">
              <p style="font-size: 16px; color: #374151;">
                Olá ${name || 'usuário'},
              </p>
              <p style="font-size: 16px; color: #374151;">
                Recebemos uma solicitação para redefinir a senha da sua conta no Zenit.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}"
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                          color: white;
                          padding: 15px 40px;
                          text-decoration: none;
                          border-radius: 8px;
                          display: inline-block;
                          font-weight: bold;">
                  Redefinir Senha
                </a>
              </div>
              <p style="font-size: 14px; color: #6b7280;">
                Se o botão não funcionar, copie e cole este link no navegador:
              </p>
              <p style="font-size: 12px; color: #9ca3af; word-break: break-all;">
                ${resetUrl}
              </p>
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                Este link expira em 1 hora por questões de segurança.
              </p>
              <p style="font-size: 14px; color: #ef4444; font-weight: bold;">
                ⚠️ Se você não solicitou esta redefinição, ignore este email e sua senha permanecerá inalterada.
              </p>
            </div>
            <div style="background: #374151; padding: 20px; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © 2025 Zenit. Todos os direitos reservados.
              </p>
            </div>
          </body>
        </html>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar email de reset de senha:', error);
    return { success: false, error };
  }
}
```

### Passo 4: Criar Endpoint de Solicitação de Reset

Crie `src/app/api/auth/forgot-password/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { generatePasswordResetToken } from '@/lib/tokens';
import { sendPasswordResetEmail } from '@/lib/email/emailService';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedFields = forgotPasswordSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    const { email } = validatedFields.data;

    // Busca usuário
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Por segurança, sempre retorna sucesso mesmo que usuário não exista
    // Isso previne enumeration attacks
    if (!user) {
      return NextResponse.json(
        { message: 'Se o email existir, você receberá instruções de redefinição' },
        { status: 200 }
      );
    }

    // Verifica se usuário tem senha (não é OAuth)
    if (!user.password) {
      return NextResponse.json(
        { error: 'Esta conta usa login social. Não é possível redefinir senha.' },
        { status: 400 }
      );
    }

    // Gera token de reset
    const resetToken = await generatePasswordResetToken(email);

    // Envia email
    await sendPasswordResetEmail(email, resetToken.token, user.name || undefined);

    return NextResponse.json(
      { message: 'Se o email existir, você receberá instruções de redefinição' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao processar esqueci senha:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
}
```

### Passo 5: Criar Endpoint de Reset de Senha

Crie `src/app/api/auth/reset-password/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getPasswordResetTokenByToken, deletePasswordResetToken } from '@/lib/tokens';

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedFields = resetPasswordSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: validatedFields.error.errors[0].message },
        { status: 400 }
      );
    }

    const { token, password } = validatedFields.data;

    // Busca token
    const resetToken = await getPasswordResetTokenByToken(token);

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 400 }
      );
    }

    // Verifica expiração
    if (new Date() > resetToken.expires) {
      await deletePasswordResetToken(resetToken.id);
      return NextResponse.json(
        { error: 'Token expirado. Solicite um novo link de redefinição.' },
        { status: 400 }
      );
    }

    // Busca usuário
    const user = await prisma.user.findUnique({
      where: { email: resetToken.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Atualiza senha
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    // Remove token usado
    await deletePasswordResetToken(resetToken.id);

    return NextResponse.json(
      { message: 'Senha redefinida com sucesso!' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    return NextResponse.json(
      { error: 'Erro ao redefinir senha' },
      { status: 500 }
    );
  }
}
```

### Passo 6: Criar Página "Esqueci Minha Senha"

Crie `src/app/(auth)/forgot-password/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Erro ao enviar email');
      }
    } catch (err) {
      setError('Erro ao processar solicitação');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Email enviado!
            </h1>
            <p className="text-gray-600 mb-6">
              Se o email {email} estiver cadastrado, você receberá instruções para redefinir sua senha.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Verifique sua caixa de entrada e também a pasta de spam.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Esqueceu sua senha?
          </h1>
          <p className="text-gray-600">
            Digite seu email e enviaremos instruções para redefinir sua senha
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Enviando...' : 'Enviar link de redefinição'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
}
```

### Passo 7: Criar Página de Reset de Senha

Crie `src/app/(auth)/reset-password/page.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Token de redefinição não encontrado');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (!token) {
      setError('Token inválido');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login?reset=success');
        }, 3000);
      } else {
        setError(data.error || 'Erro ao redefinir senha');
      }
    } catch (err) {
      setError('Erro ao processar solicitação');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Senha redefinida!
            </h1>
            <p className="text-gray-600 mb-4">
              Sua senha foi alterada com sucesso.
            </p>
            <p className="text-sm text-gray-500">
              Redirecionando para o login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!token || error === 'Token de redefinição não encontrado') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Link inválido
            </h1>
            <p className="text-gray-600 mb-6">
              Este link de redefinição de senha é inválido ou expirou.
            </p>
            <Link
              href="/forgot-password"
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition inline-block"
            >
              Solicitar novo link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Nova senha
          </h1>
          <p className="text-gray-600">
            Digite sua nova senha
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Nova senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Mínimo 8 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Deve conter: 8+ caracteres, maiúscula, minúscula e número
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite novamente"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Redefinindo...' : 'Redefinir senha'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-700"
          >
            Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
}
```

### Passo 8: Atualizar Botão na Página de Login

Modifique `src/app/(auth)/login/page.tsx` para adicionar funcionalidade ao botão "Esqueceu?":

```typescript
// Encontre o botão "Esqueceu?" e atualize de:
<button className="text-sm text-purple-600 hover:text-purple-700">
  Esqueceu?
</button>

// Para:
<Link
  href="/forgot-password"
  className="text-sm text-purple-600 hover:text-purple-700"
>
  Esqueceu?
</Link>
```

---

## Configuração de Serviço de Email

### Opção 1: Resend (Recomendado)

**Vantagens:**
- Moderna e simples
- Ótima DX (Developer Experience)
- Free tier generoso (100 emails/dia)
- Excelente para React/Next.js
- Suporta templates com React Email

**Configuração:**

```bash
npm install resend
```

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=onboarding@resend.dev  # ou seu domínio verificado
```

### Opção 2: Nodemailer (SMTP Genérico)

**Vantagens:**
- Funciona com qualquer provedor SMTP
- Muito flexível
- Grande comunidade

**Configuração:**

```bash
npm install nodemailer
npm install -D @types/nodemailer
```

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu@gmail.com
SMTP_PASSWORD=sua-senha-de-app
EMAIL_FROM=seu@gmail.com
```

**Código:**

```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT!),
  secure: false, // true para 465, false para outras portas
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });
}
```

### Opção 3: SendGrid

**Vantagens:**
- Enterprise-grade
- Free tier: 100 emails/dia
- Análises avançadas

```bash
npm install @sendgrid/mail
```

```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@seudominio.com
```

### Opção 4: Mailgun

```bash
npm install mailgun.js form-data
```

```env
MAILGUN_API_KEY=xxxxxxxxxxxxxxxx
MAILGUN_DOMAIN=seudominio.com
EMAIL_FROM=noreply@seudominio.com
```

---

## Fluxos de Autenticação

### Fluxo 1: Registro com Credentials + Verificação de Email

```
1. Usuário preenche formulário de registro
   ↓
2. POST /api/auth/register
   - Valida dados
   - Cria usuário (emailVerified = null)
   - Gera token de verificação
   - Envia email
   ↓
3. Usuário recebe email
   ↓
4. Usuário clica no link de verificação
   ↓
5. GET /api/auth/verify-email?token=xxxxx
   - Valida token
   - Atualiza emailVerified = new Date()
   - Remove token
   ↓
6. Redireciona para login
   ↓
7. Usuário faz login normalmente
```

### Fluxo 2: Login com Credentials

```
1. Usuário preenche email e senha
   ↓
2. POST /api/auth/login (NextAuth)
   - Busca usuário por email
   - Compara senha com bcrypt
   - Cria sessão JWT
   ↓
3. Redireciona para dashboard
```

### Fluxo 3: Login com Google OAuth

```
1. Usuário clica em "Continuar com Google"
   ↓
2. Redireciona para consent screen do Google
   ↓
3. Usuário autoriza
   ↓
4. Google retorna código de autorização
   ↓
5. NextAuth troca código por tokens
   ↓
6. Callback do NextAuth
   - Se novo usuário: cria com emailVerified = new Date()
   - Se existente: atualiza tokens
   ↓
7. Redireciona para dashboard
```

### Fluxo 4: Redefinição de Senha

```
1. Usuário clica em "Esqueceu sua senha?"
   ↓
2. Navega para /forgot-password
   ↓
3. Digite email
   ↓
4. POST /api/auth/forgot-password
   - Valida email
   - Gera token de reset (expira em 1h)
   - Envia email
   ↓
5. Usuário recebe email
   ↓
6. Clica no link de reset
   ↓
7. Navega para /reset-password?token=xxxxx
   ↓
8. Digite nova senha
   ↓
9. POST /api/auth/reset-password
   - Valida token
   - Hash da nova senha
   - Atualiza senha
   - Remove token
   ↓
10. Redireciona para login
```

### Fluxo 5: Alteração de Senha (Usuário Autenticado)

```
1. Usuário logado vai em Perfil
   ↓
2. Clica em "Alterar Senha"
   ↓
3. Preenche senha atual e nova senha
   ↓
4. PUT /api/v1/perfil/senha
   - Verifica sessão
   - Valida senha atual com bcrypt
   - Hash da nova senha
   - Atualiza no banco
   ↓
5. Senha atualizada com sucesso
```

---

## Segurança e Boas Práticas

### 1. Geração de Tokens

✅ **BOM:**
```typescript
import crypto from 'crypto';

// Token criptograficamente seguro
const token = crypto.randomBytes(32).toString('hex');
```

❌ **RUIM:**
```typescript
// NUNCA faça isso - previsível
const token = Math.random().toString(36);
```

### 2. Expiração de Tokens

- **Verificação de email**: 24 horas
- **Reset de senha**: 1 hora (máximo de segurança)
- **Sessão JWT**: 30 dias (configurável)

### 3. Hash de Senhas

✅ **Configuração bcrypt atual (ÓTIMA):**
```typescript
const hashedPassword = await bcrypt.hash(password, 10); // 10 rounds
```

- 10 rounds = bom equilíbrio segurança/performance
- Aumentar para 12 se segurança é crítica (mais lento)

### 4. Validação de Senhas

Requisitos atuais em `src/lib/validations/auth.ts`:

```typescript
password: z.string()
  .min(8, 'Senha deve ter no mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Deve conter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'Deve conter pelo menos uma letra minúscula')
  .regex(/[0-9]/, 'Deve conter pelo menos um número')
```

**Recomendação adicional:**
```typescript
// Adicionar verificação de caracteres especiais
.regex(/[^A-Za-z0-9]/, 'Deve conter pelo menos um caractere especial')

// Ou usar biblioteca especializada
npm install zxcvbn
```

### 5. Proteção contra Enumeration Attacks

✅ **BOM** (no forgot-password):
```typescript
// Sempre retorna a mesma mensagem
return NextResponse.json(
  { message: 'Se o email existir, você receberá instruções' },
  { status: 200 }
);
```

❌ **RUIM:**
```typescript
// Revela se email existe ou não
if (!user) {
  return NextResponse.json({ error: 'Email não encontrado' }, { status: 404 });
}
```

### 6. Rate Limiting

⚠️ **NÃO IMPLEMENTADO** - Recomendações:

```bash
npm install @upstash/ratelimit @upstash/redis
```

```typescript
// Exemplo de rate limiting
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 tentativas por 15 min
});

// No endpoint de login/reset
const identifier = req.headers.get('x-forwarded-for') || 'anonymous';
const { success } = await ratelimit.limit(identifier);

if (!success) {
  return NextResponse.json(
    { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
    { status: 429 }
  );
}
```

### 7. HTTPS e Cookies Seguros

NextAuth já configura cookies com:
- `httpOnly: true` (não acessível via JavaScript)
- `secure: true` (apenas HTTPS em produção)
- `sameSite: 'lax'` (proteção CSRF)

### 8. Sanitização de Entrada

Zod já faz validação, mas sempre:
- Valide no backend (nunca confie no frontend)
- Use prepared statements do Prisma (proteção SQL injection)
- Escape HTML em emails se necessário

### 9. Logs e Monitoramento

```typescript
// Sempre faça log de eventos de segurança
console.log('[AUTH] Tentativa de login:', { email, success: true, ip });
console.error('[AUTH] Falha no login:', { email, reason: 'senha inválida' });
console.log('[AUTH] Reset de senha solicitado:', { email });
```

### 10. Variáveis de Ambiente

✅ **Estrutura recomendada:**

```env
# Database
DATABASE_URL="postgresql://..."

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="xxxxxxxx" # gere com: openssl rand -base64 32

# Email
RESEND_API_KEY="re_xxxxxxxx"
EMAIL_FROM="noreply@seudominio.com"

# OAuth
GOOGLE_CLIENT_ID="xxxxxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxxxxxxx"

# App
APP_URL="http://localhost:3000"
NODE_ENV="development"
```

---

## Checklist de Implementação

### Verificação de Email

- [ ] Instalar biblioteca de email (Resend/Nodemailer)
- [ ] Configurar variáveis de ambiente
- [ ] Adicionar modelo `VerificationToken` ao schema
- [ ] Executar migration
- [ ] Criar funções de geração de token
- [ ] Criar serviço de envio de email
- [ ] Atualizar endpoint de registro
- [ ] Criar endpoint de verificação
- [ ] Criar página de verificação
- [ ] Testar fluxo completo

### Redefinição de Senha

- [ ] Adicionar modelo `PasswordResetToken` ao schema
- [ ] Executar migration
- [ ] Criar funções de geração de token de reset
- [ ] Criar serviço de email de reset
- [ ] Criar endpoint de solicitação de reset
- [ ] Criar endpoint de reset de senha
- [ ] Criar página "Esqueci minha senha"
- [ ] Criar página de reset de senha
- [ ] Atualizar link na página de login
- [ ] Testar fluxo completo

### Segurança Adicional

- [ ] Implementar rate limiting
- [ ] Adicionar logs de segurança
- [ ] Configurar monitoramento de erros (Sentry)
- [ ] Adicionar 2FA (opcional)
- [ ] Configurar CSP headers
- [ ] Revisar permissões de CORS

---

## Comandos Úteis

```bash
# Instalar dependências
npm install resend

# Criar migration
npx prisma migrate dev --name add_verification_tokens

# Resetar banco (desenvolvimento)
npx prisma migrate reset

# Gerar Prisma Client
npx prisma generate

# Abrir Prisma Studio
npx prisma studio

# Gerar secret para NextAuth
openssl rand -base64 32

# Ver logs em produção (Vercel)
vercel logs

# Testar emails localmente
npm install -D maildev
maildev
```

---

## Recursos Adicionais

### Documentação Oficial

- [NextAuth.js v5](https://authjs.dev/)
- [Prisma](https://www.prisma.io/docs)
- [Resend](https://resend.com/docs)
- [Nodemailer](https://nodemailer.com/)
- [bcrypt](https://www.npmjs.com/package/bcryptjs)

### Templates de Email

- [React Email](https://react.email/) - Templates com React
- [MJML](https://mjml.io/) - Framework para emails responsivos
- [Email Templates](https://www.emailtemplates.io/) - Templates gratuitos

### Ferramentas de Teste

- [MailDev](https://maildev.github.io/maildev/) - SMTP fake para desenvolvimento
- [Mailtrap](https://mailtrap.io/) - Email testing sandbox
- [Temp Mail](https://temp-mail.org/) - Emails temporários para testes

---

## Suporte

Para dúvidas ou problemas:

1. Verifique os logs do servidor (`console.log`)
2. Use Prisma Studio para inspecionar dados: `npx prisma studio`
3. Teste endpoints com Postman ou Thunder Client
4. Revise as variáveis de ambiente
5. Verifique se migrations foram executadas

---

**Última atualização:** 2025-01-09
**Versão do documento:** 1.0
