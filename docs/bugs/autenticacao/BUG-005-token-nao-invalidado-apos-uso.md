# BUG-005: Race Condition na Invalidação de Tokens

## Informações Gerais

| Campo | Valor |
|-------|-------|
| **ID** | BUG-005 |
| **Título** | Race Condition - Token Pode Ser Usado Múltiplas Vezes |
| **Gravidade** | **MÉDIA** |
| **CVSS Score** | 5.9 (Médio) |
| **OWASP** | A04:2021 - Insecure Design |
| **CWE** | CWE-367: Time-of-check Time-of-use (TOCTOU) Race Condition |
| **Endpoint Afetado** | `/api/auth/reset-password`, `/api/auth/verify-email` |
| **Data de Identificação** | 2026-01-16 |

---

## Descrição

Os endpoints de reset de senha e verificação de email possuem uma race condition (condição de corrida) onde o token é validado primeiro e deletado posteriormente. Se múltiplas requisições forem enviadas simultaneamente com o mesmo token, todas podem ser processadas antes da deleção ocorrer.

---

## Ação Realizada e Payload

### Teste de Race Condition - Reset Password

**Cenário**: Enviar 10 requisições simultâneas com o mesmo token válido.

**Payload:**
```bash
#!/bin/bash
TOKEN="abc123def456..."  # Token válido obtido via email

# Envia 10 requisições simultâneas
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/reset-password \
    -H "Content-Type: application/json" \
    -d "{\"token\": \"$TOKEN\", \"password\": \"NewPass${i}123\"}" &
done
wait
```

**Resultado Esperado (seguro):**
- 1 requisição: 200 OK (senha alterada)
- 9 requisições: 400 Token inválido

**Resultado Observado (vulnerável):**
- Potencialmente múltiplas requisições: 200 OK
- Senha pode ser alterada múltiplas vezes

### Script de Teste com Python (Concorrente)

```python
import asyncio
import aiohttp

async def reset_password(session, token, password):
    async with session.post(
        'http://localhost:3000/api/auth/reset-password',
        json={'token': token, 'password': password}
    ) as response:
        return await response.json(), response.status

async def main():
    token = "valid_token_here"

    async with aiohttp.ClientSession() as session:
        # Envia 10 requisições simultâneas
        tasks = [
            reset_password(session, token, f'NewPass{i}123')
            for i in range(10)
        ]
        results = await asyncio.gather(*tasks)

        success_count = sum(1 for _, status in results if status == 200)
        print(f"Requisições bem-sucedidas: {success_count}")

asyncio.run(main())
```

---

## Análise Técnica do Código

### Arquivo: `src/app/api/auth/reset-password/route.ts` (Linhas 29-70)

```typescript
// 1. BUSCA o token (Time of Check)
const resetToken = await getPasswordResetTokenByToken(token);

if (!resetToken) {
  return NextResponse.json(
    { error: 'Token inválido ou expirado' },
    { status: 400 }
  );
}

// 2. VERIFICA expiração
if (new Date() > resetToken.expires) {
  await deletePasswordResetToken(resetToken.id);  // Deleta aqui
  return NextResponse.json(
    { error: 'Token expirado. Solicite um novo link de redefinição.' },
    { status: 400 }
  );
}

// 3. BUSCA usuário
const user = await prisma.user.findUnique({
  where: { email: resetToken.email }
});

// 4. ATUALIZA senha
const hashedPassword = await bcrypt.hash(password, 10);
await prisma.user.update({
  where: { id: user.id },
  data: { password: hashedPassword }
});

// 5. DELETA token (Time of Use) - MUITO TARDE!
await deletePasswordResetToken(resetToken.id);
```

**Problema**: Entre as etapas 1 (verificação) e 5 (deleção), há várias operações assíncronas. Durante esse intervalo, outras requisições podem verificar o mesmo token com sucesso.

---

## Causa Raiz

1. **Operação não atômica**: Verificação e invalidação do token são operações separadas
2. **Sem locking/mutex**: Não há mecanismo para garantir exclusividade
3. **Delay entre check e use**: bcrypt.hash() é intencionalmente lento (~100ms)

---

## Impacto

| Cenário | Descrição |
|---------|-----------|
| **Password Confusion** | Atacante e vítima alteram senha simultaneamente |
| **Bypass de Segurança** | Token pode ser reutilizado se interceptado |
| **Audit Trail Corrompido** | Múltiplas alterações com mesmo token |

---

## Ação Corretiva Sugerida

### Solução 1: Operação Atômica com Transação

```typescript
// src/app/api/auth/reset-password/route.ts

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedFields = resetPasswordSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: validatedFields.error.issues[0].message },
        { status: 400 }
      );
    }

    const { token, password } = validatedFields.data;

    // CORREÇÃO: Usar transação atômica
    const result = await prisma.$transaction(async (tx) => {
      // 1. Buscar e DELETAR token em uma operação
      const resetToken = await tx.passwordResetToken.delete({
        where: { token }
      }).catch(() => null);

      // Se token não existe, falha
      if (!resetToken) {
        return { success: false, error: 'Token inválido ou expirado' };
      }

      // 2. Verificar expiração
      if (new Date() > resetToken.expires) {
        return { success: false, error: 'Token expirado' };
      }

      // 3. Hash da senha (fora da transação para performance)
      const hashedPassword = await bcrypt.hash(password, 10);

      // 4. Atualizar senha
      await tx.user.update({
        where: { email: resetToken.email },
        data: { password: hashedPassword }
      });

      return { success: true };
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Senha redefinida com sucesso!' },
      { status: 200 }
    );

  } catch (error) {
    // Se for erro de constraint (token já deletado), tratar como token inválido
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Token inválido ou já utilizado' },
        { status: 400 }
      );
    }

    console.error('Erro ao redefinir senha:', error);
    return NextResponse.json(
      { error: 'Erro ao redefinir senha' },
      { status: 500 }
    );
  }
}
```

### Solução 2: Flag de "Usado" com Verificação Atômica

```typescript
// Adicionar campo 'used' ao modelo PasswordResetToken

// prisma/schema.prisma
model PasswordResetToken {
  id        String   @id @default(cuid())
  email     String
  token     String   @unique
  expires   DateTime
  used      Boolean  @default(false)  // NOVO CAMPO
  createdAt DateTime @default(now())

  @@unique([email, token])
}

// No endpoint:
const result = await prisma.passwordResetToken.updateMany({
  where: {
    token,
    used: false,
    expires: { gt: new Date() }
  },
  data: { used: true }
});

if (result.count === 0) {
  return NextResponse.json(
    { error: 'Token inválido, expirado ou já utilizado' },
    { status: 400 }
  );
}
```

---

## Referências

- [CWE-367: TOCTOU Race Condition](https://cwe.mitre.org/data/definitions/367.html)
- [OWASP Race Conditions](https://owasp.org/www-community/vulnerabilities/Race_condition)
- [Prisma Transactions](https://www.prisma.io/docs/concepts/components/prisma-client/transactions)

---

## Status

| Campo | Valor |
|-------|-------|
| **Status** | **FECHADO** |
| **Data de Correção** | 2026-01-16 |
| **Correção Aplicada** | Transação atômica com delete-first |

---

## Correção Implementada

### Arquivo Modificado: `src/app/api/auth/reset-password/route.ts`

**Estratégia:** Delete-first dentro de transação Prisma

```typescript
const result = await prisma.$transaction(async (tx) => {
  // Tenta deletar o token PRIMEIRO (atômico)
  const deletedToken = await tx.passwordResetToken.delete({
    where: { token }
  }).catch(() => null);

  // Se token não existe ou já foi deletado
  if (!deletedToken) {
    return { success: false, error: 'Token inválido ou já utilizado' };
  }

  // Verifica expiração
  if (new Date() > deletedToken.expires) {
    return { success: false, error: 'Token expirado' };
  }

  // Hash e atualiza senha
  const hashedPassword = await bcrypt.hash(password, 10);
  await tx.user.update({
    where: { email: deletedToken.email },
    data: { password: hashedPassword }
  });

  return { success: true };
});
```

**Por que funciona:**
- A operação `delete` é atômica no banco de dados
- Apenas UMA requisição consegue deletar o token
- Outras requisições recebem erro P2025 (record not found)
- Não há janela de tempo para race condition
