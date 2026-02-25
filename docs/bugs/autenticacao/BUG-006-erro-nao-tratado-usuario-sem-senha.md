# BUG-006: Erro Não Tratado - Login com Usuário OAuth (Sem Senha)

## Informações Gerais

| Campo | Valor |
|-------|-------|
| **ID** | BUG-006 |
| **Título** | Erro Não Tratado ao Tentar Login via Credenciais em Conta OAuth |
| **Gravidade** | **MÉDIA** |
| **CVSS Score** | 4.3 (Médio) |
| **OWASP** | A07:2021 - Identification and Authentication Failures |
| **CWE** | CWE-755: Improper Handling of Exceptional Conditions |
| **Endpoint Afetado** | `/api/auth/login`, NextAuth Credentials Provider |
| **Data de Identificação** | 2026-01-16 |

---

## Descrição

Quando um usuário que criou conta via Google OAuth tenta fazer login usando email/senha, o sistema pode gerar um erro não tratado ou comportamento inesperado. Isso ocorre porque:

1. O campo `password` de usuários OAuth é uma string vazia (`''`)
2. O bcrypt.compare() com string vazia pode ter comportamento inconsistente
3. Não há validação explícita para verificar se o usuário tem senha antes de comparar

---

## Ação Realizada e Payload

### Teste: Login com Email de Conta OAuth

**Cenário**: Usuário criou conta com Google, depois tenta login com email/senha.

**Payload:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario.google@gmail.com",
    "password": "qualquersenha123"
  }'
```

**Comportamento Atual:**
```typescript
// authOptions.ts - Linha 39-42
const isPasswordValid = await bcrypt.compare(
  credentials.password as string,
  user.password  // user.password = '' para OAuth users
);
```

O `bcrypt.compare('qualquersenha123', '')` retorna `false`, mas:
- Não há mensagem específica para o usuário
- O usuário não sabe que deve usar Google OAuth
- Tentativas repetidas podem indicar tentativa de ataque

**Resultado Observado:**
```json
{
  "error": "Email ou senha incorretos"
}
```

Embora tecnicamente correto, não orienta o usuário corretamente.

---

## Análise Técnica do Código

### Arquivo: `src/lib/auth/authOptions.ts` (Linhas 31-46)

```typescript
const user = await prisma.user.findUnique({
  where: { email: credentials.email as string }
});

if (!user) {
  return null;
}

// PROBLEMA: Não verifica se user.password existe/é válido
const isPasswordValid = await bcrypt.compare(
  credentials.password as string,
  user.password  // Pode ser '' ou null para OAuth users
);

if (!isPasswordValid) {
  return null;
}
```

### Arquivo: `src/app/api/auth/login/route.ts` (Linhas 35-42)

```typescript
// PROBLEMA: Mesmo issue
const isPasswordValid = await bcrypt.compare(password, user.password);

if (!isPasswordValid) {
  return NextResponse.json(
    { error: 'Email ou senha incorretos' },
    { status: 401 }
  );
}
```

---

## Causa Raiz

1. **Falta de verificação** se usuário tem senha definida antes de usar bcrypt
2. **Usuários OAuth têm password = ''** no banco de dados
3. **Mensagem de erro genérica** não orienta usuário OAuth

---

## Impacto

| Cenário | Descrição |
|---------|-----------|
| **UX Ruim** | Usuário OAuth não entende porque login falha |
| **Suporte Desnecessário** | Tickets de "esqueci senha" para contas OAuth |
| **Confusão** | Usuário pode pensar que foi hackeado |

---

## Ação Corretiva Sugerida

### Correção no authOptions.ts

```typescript
// src/lib/auth/authOptions.ts

authorize: async (credentials) => {
  if (!credentials?.email || !credentials?.password) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: credentials.email as string }
  });

  if (!user) {
    return null;
  }

  // CORREÇÃO: Verificar se usuário tem senha
  if (!user.password || user.password === '') {
    // Usuário OAuth - não pode fazer login com senha
    // Retorna null (mesmo comportamento, mas explicito)
    console.info(`OAuth user attempted password login: ${user.email}`);
    return null;
  }

  const isPasswordValid = await bcrypt.compare(
    credentials.password as string,
    user.password
  );

  if (!isPasswordValid) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    emailVerified: user.emailVerified,
    plano: user.plano,
    planoExpiraEm: user.planoExpiraEm,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
```

### Correção no login/route.ts

```typescript
// src/app/api/auth/login/route.ts

// Buscar usuário
const user = await prisma.user.findUnique({
  where: { email },
});

if (!user) {
  return NextResponse.json(
    { error: 'Email ou senha incorretos' },
    { status: 401 }
  );
}

// CORREÇÃO: Verificar se é conta OAuth
if (!user.password || user.password === '') {
  return NextResponse.json(
    {
      error: 'Esta conta utiliza login social',
      hint: 'google'  // Frontend pode mostrar botão do Google
    },
    { status: 400 }
  );
}

// Verificar senha
const isPasswordValid = await bcrypt.compare(password, user.password);
```

### Correção no Frontend

```tsx
// src/app/(auth)/login/page.tsx

if (result?.error) {
  const errorData = JSON.parse(result.error);

  if (errorData.hint === 'google') {
    setError('Esta conta foi criada com Google. Use o botão "Entrar com Google" abaixo.');
  } else {
    setError('Email ou senha incorretos');
  }
  setLoading(false);
  return;
}
```

---

## Nota de Segurança

A correção sugerida no frontend revela que o email está cadastrado via OAuth. Dependendo do modelo de ameaça, pode-se optar por manter a mensagem genérica e apenas logar internamente:

```typescript
// Opção mais segura (sem vazamento de informação)
if (!user.password) {
  // Log interno para análise
  logger.info('OAuth user attempted password login', { email: user.email });

  // Mesma resposta genérica
  return NextResponse.json(
    { error: 'Email ou senha incorretos' },
    { status: 401 }
  );
}
```

---

## Status

| Campo | Valor |
|-------|-------|
| **Status** | **FECHADO** |
| **Data de Correção** | 2026-01-16 |
| **Correção Aplicada** | Verificação explícita de senha antes do bcrypt.compare |

---

## Correção Implementada

### Arquivos Modificados:

**1. `src/lib/auth/authOptions.ts`**

```typescript
// Verificar se usuário tem senha (não é conta OAuth)
if (!user.password || user.password === '') {
  // Usuário OAuth tentando login com senha
  // Retorna null com mesmo comportamento de senha incorreta
  return null;
}
```

**2. `src/app/api/auth/login/route.ts`**

```typescript
// Verificar se usuário tem senha (não é OAuth)
if (!user.password || user.password === '') {
  return NextResponse.json(
    { error: 'Email ou senha incorretos' },
    { status: 401 }
  );
}
```

**Resultado:**
- Usuários OAuth que tentam login com senha recebem a mesma mensagem genérica
- Comportamento seguro: não revela que é conta OAuth
- Evita chamada desnecessária ao bcrypt.compare com string vazia
