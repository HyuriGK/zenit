# BUG-002: Mass Assignment em Criação de Transações

## Informações Gerais

| Campo | Valor |
|-------|-------|
| **ID** | BUG-002 |
| **Título** | Mass Assignment - Possível manipulação de campos não validados |
| **Gravidade** | **MÉDIA** |
| **Recurso Afetado** | Dashboard > Financeiro > Transações |
| **Arquivo** | `src/app/api/v1/financeiro/transacoes/route.ts` |
| **Data de Identificação** | 2026-01-16 |

---

## Descrição

A API de criação de transações aceita parâmetros diretamente do body da requisição sem validação de schema estrito. Embora haja verificação de ownership para `contaBancariaId` e `cartaoId`, outros campos como `objetivoId` não são validados quanto à propriedade, e campos numéricos como `valor` e `parcelaTotais` não têm limites definidos.

---

## Ação Realizada

### Cenário de Teste 1: Valor Negativo
```bash
curl -X POST /api/v1/financeiro/transacoes \
  -H "Content-Type: application/json" \
  -d '{
    "descricao": "Teste",
    "valor": -99999999,
    "data": "2026-01-16",
    "tipo": "RECEITA",
    "contaBancariaId": "valid-id"
  }'
```

### Cenário de Teste 2: Parcelas Excessivas
```bash
curl -X POST /api/v1/financeiro/transacoes \
  -H "Content-Type: application/json" \
  -d '{
    "descricao": "Compra parcelada",
    "valor": 1000,
    "data": "2026-01-16",
    "tipo": "DESPESA",
    "contaBancariaId": "valid-id",
    "isParcela": true,
    "parcelaTotais": 99999
  }'
```

**Resultado Esperado**: API deveria rejeitar valores inválidos
**Resultado Atual**: API processa a requisição, potencialmente criando milhares de registros

---

## Código Vulnerável

```typescript
// src/app/api/v1/financeiro/transacoes/route.ts:90-104
const body = await req.json();
const {
  descricao,
  valor,           // Sem validação de range (min/max)
  data,
  tipo,
  observacoes,
  isFixa,
  isParcela,
  parcelaTotais,   // Sem limite máximo
  categoriaId,
  contaBancariaId,
  cartaoId,
  objetivoId,      // Não valida ownership
} = body;

// Validações básicas insuficientes
if (!descricao || !valor || !data || !tipo) {
  return NextResponse.json(
    { error: 'Campos obrigatórios: descricao, valor, data, tipo' },
    { status: 400 }
  );
}
```

---

## Impacto

| Tipo de Impacto | Descrição |
|-----------------|-----------|
| **Manipulação de Saldo** | Valores negativos podem alterar saldos incorretamente |
| **DoS** | Criação de milhares de parcelas pode sobrecarregar o banco |
| **Inconsistência de Dados** | Dados financeiros podem ficar inconsistentes |
| **IDOR Parcial** | `objetivoId` pode referenciar objetivo de outro usuário |

---

## Causa Raiz

1. **Ausência de validação de schema**: Não usa Zod ou similar para validar tipos e ranges
2. **Validação de ownership incompleta**: `objetivoId` não é verificado
3. **Sem limites numéricos**: Valores podem ser negativos ou extremamente grandes
4. **Sem limite de parcelas**: `parcelaTotais` pode ser qualquer número

---

## Ação Corretiva

### 1. Implementar Schema de Validação com Zod

```typescript
// src/lib/validations/financeiro.ts
import { z } from 'zod';

export const transacaoSchema = z.object({
  descricao: z.string().min(1).max(255),
  valor: z.number().positive().max(999999999.99),
  data: z.string().datetime(),
  tipo: z.enum(['RECEITA', 'DESPESA']),
  observacoes: z.string().max(1000).optional(),
  isFixa: z.boolean().optional().default(false),
  isParcela: z.boolean().optional().default(false),
  parcelaTotais: z.number().int().min(2).max(48).optional(),
  categoriaId: z.string().uuid().optional(),
  contaBancariaId: z.string().uuid(),
  cartaoId: z.string().uuid().optional(),
  objetivoId: z.string().uuid().optional(),
});
```

### 2. Validar Ownership de ObjetivoId

```typescript
// Adicionar validação antes de criar transação
if (objetivoId) {
  const objetivo = await prisma.objetivoFinanceiro.findFirst({
    where: { id: objetivoId, userId: user.id },
  });
  if (!objetivo) {
    return NextResponse.json(
      { error: 'Objetivo não encontrado ou não pertence ao usuário' },
      { status: 404 }
    );
  }
}
```

### 3. Usar Schema na API

```typescript
// src/app/api/v1/financeiro/transacoes/route.ts
import { transacaoSchema } from '@/lib/validations/financeiro';

export async function POST(req: NextRequest) {
  // ... auth check ...

  const body = await req.json();
  const validation = transacaoSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: validation.error.issues },
      { status: 400 }
    );
  }

  const data = validation.data;
  // ... rest of logic ...
}
```

---

## Referências

- [OWASP Mass Assignment](https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html)
- [CWE-915: Improperly Controlled Modification of Dynamically-Determined Object Attributes](https://cwe.mitre.org/data/definitions/915.html)
- [Zod Documentation](https://zod.dev/)

---

## Status

| Status | Data |
|--------|------|
| Identificado | 2026-01-16 |
| Reportado | 2026-01-16 |
| Corrigido | 2026-01-17 |
| Verificado | 2026-01-17 |

### Correção Implementada
- Schema Zod implementado em `src/lib/validations/financeiro.ts`
- Validação de tipos, ranges e formatos aplicada na API
- Valor: positivo, máximo 999999999.99
- Parcelas: inteiro, mínimo 2, máximo 48
- Todos os IDs validados como UUID
