# BUG-005: IDOR - Falta de Validação de Ownership em objetivoId

## Informações Gerais

| Campo | Valor |
|-------|-------|
| **ID** | BUG-005 |
| **Título** | IDOR - Possível acesso a objetivos de outros usuários via objetivoId |
| **Gravidade** | **ALTA** |
| **Recurso Afetado** | Dashboard > Financeiro > Transações |
| **Arquivo** | `src/app/api/v1/financeiro/transacoes/route.ts` |
| **Data de Identificação** | 2026-01-16 |

---

## Descrição

Ao criar uma transação, o campo `objetivoId` é aceito sem validação de propriedade. Um atacante pode vincular transações a objetivos financeiros de outros usuários, potencialmente alterando seus saldos.

---

## Ação Realizada

### Cenário de Teste

**Pré-requisitos**:
- Usuário A possui objetivo financeiro com ID `objetivo-user-a-id`
- Usuário B está autenticado

**Requisição Maliciosa (Usuário B)**:
```bash
curl -X POST /api/v1/financeiro/transacoes \
  -H "Content-Type: application/json" \
  -H "Cookie: session=user-b-session" \
  -d '{
    "descricao": "Contribuição maliciosa",
    "valor": 1000,
    "data": "2026-01-16",
    "tipo": "RECEITA",
    "contaBancariaId": "user-b-conta-id",
    "objetivoId": "objetivo-user-a-id"
  }'
```

### Código Vulnerável

```typescript
// src/app/api/v1/financeiro/transacoes/route.ts:165-204

// Transação é criada com objetivoId sem validação
const transacao = await prisma.transacao.create({
  data: {
    descricao,
    valor,
    data: new Date(data),
    tipo,
    // ...
    objetivoId,  // ⚠️ NÃO VALIDA se pertence ao usuário!
    userId: user.id,
  },
});

// Linha 195-204: Atualiza saldo do objetivo sem verificar ownership
if (objetivoId) {
  await prisma.objetivoFinanceiro.update({
    where: { id: objetivoId },  // ⚠️ Qualquer objetivoId é aceito!
    data: {
      valorAtual: {
        increment: valor,
      },
    },
  });
}
```

---

## Comparação com Código Seguro

A validação de `contaBancariaId` está correta:

```typescript
// Validação CORRETA para conta bancária (linha 122-131)
const conta = await prisma.contaBancaria.findFirst({
  where: { id: contaBancariaId, userId: user.id },  // ✅ Verifica userId
});
if (!conta) {
  return NextResponse.json(
    { error: 'Conta bancária não encontrada ou não pertence ao usuário' },
    { status: 404 }
  );
}
```

Mas `objetivoId` não tem a mesma validação:
```typescript
// Validação AUSENTE para objetivoId
if (objetivoId) {
  // ⚠️ Nenhuma verificação de propriedade!
  await prisma.objetivoFinanceiro.update({...});
}
```

---

## Impacto

| Tipo de Impacto | Descrição |
|-----------------|-----------|
| **IDOR** | Acesso a recursos de outros usuários |
| **Manipulação Financeira** | Alterar saldo de objetivos alheios |
| **Quebra de Integridade** | Dados financeiros de vítimas corrompidos |
| **Privacidade** | Inferência de existência de objetivos |

---

## Causa Raiz

Validação inconsistente entre campos relacionados:
- `contaBancariaId`: Validado ✅
- `cartaoId`: Validado ✅
- `categoriaId`: Não validado (risco menor)
- `objetivoId`: **Não validado** ❌

---

## Ação Corretiva

### Adicionar Validação de Ownership para objetivoId

```typescript
// src/app/api/v1/financeiro/transacoes/route.ts
// Adicionar após validação do cartão (linha ~144)

// Validar objetivo se fornecido
if (objetivoId) {
  const objetivo = await prisma.objetivoFinanceiro.findFirst({
    where: {
      id: objetivoId,
      userId: user.id,  // CRÍTICO: verificar ownership
    },
  });

  if (!objetivo) {
    return NextResponse.json(
      { error: 'Objetivo financeiro não encontrado ou não pertence ao usuário' },
      { status: 404 }
    );
  }

  // Validação adicional: verificar se objetivo está ativo
  if (objetivo.status !== 'EM_ANDAMENTO') {
    return NextResponse.json(
      { error: 'Objetivo financeiro não está ativo' },
      { status: 400 }
    );
  }
}
```

### Adicionar Validação de Ownership para categoriaId

```typescript
// Validar categoria se fornecida
if (categoriaId) {
  const categoria = await prisma.categoria.findFirst({
    where: {
      id: categoriaId,
      userId: user.id,
    },
  });

  if (!categoria) {
    return NextResponse.json(
      { error: 'Categoria não encontrada ou não pertence ao usuário' },
      { status: 404 }
    );
  }
}
```

### Aplicar Mesma Correção no PUT

```typescript
// src/app/api/v1/financeiro/transacoes/[id]/route.ts
// Adicionar validação similar no método PUT
```

---

## Testes de Validação

```typescript
// __tests__/api/financeiro/transacoes.test.ts
describe('POST /api/v1/financeiro/transacoes', () => {
  it('deve rejeitar objetivoId de outro usuário', async () => {
    const outroUsuarioObjetivo = await criarObjetivoParaOutroUsuario();

    const response = await fetch('/api/v1/financeiro/transacoes', {
      method: 'POST',
      body: JSON.stringify({
        descricao: 'Teste IDOR',
        valor: 100,
        data: '2026-01-16',
        tipo: 'RECEITA',
        contaBancariaId: minhaContaId,
        objetivoId: outroUsuarioObjetivo.id,  // ID de outro usuário
      }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: 'Objetivo financeiro não encontrado ou não pertence ao usuário'
    });
  });
});
```

---

## Referências

- [OWASP IDOR](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/05-Authorization_Testing/04-Testing_for_Insecure_Direct_Object_References)
- [CWE-639: Authorization Bypass Through User-Controlled Key](https://cwe.mitre.org/data/definitions/639.html)
- [OWASP API Security Top 10 - BOLA](https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/)

---

## Status

| Status | Data |
|--------|------|
| Identificado | 2026-01-16 |
| Reportado | 2026-01-16 |
| Corrigido | 2026-01-17 |
| Verificado | 2026-01-17 |

### Correção Implementada
- Validação de ownership adicionada em `api/v1/financeiro/transacoes/route.ts`
- Verifica se `objetivoId` pertence ao usuário autenticado
- Verifica se objetivo está com status `EM_ANDAMENTO`
- Validação similar adicionada para `categoriaId`
- Mesmo padrão de segurança usado para `contaBancariaId` e `cartaoId`
