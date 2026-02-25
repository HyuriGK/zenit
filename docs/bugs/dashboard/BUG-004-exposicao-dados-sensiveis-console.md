# BUG-004: Exposição de Dados Sensíveis em Logs de Console

## Informações Gerais

| Campo | Valor |
|-------|-------|
| **ID** | BUG-004 |
| **Título** | Exposição de Dados Sensíveis em console.error |
| **Gravidade** | **BAIXA** (Produção) / **INFORMATIVO** |
| **Recurso Afetado** | Todas as APIs do Dashboard |
| **Data de Identificação** | 2026-01-16 |

---

## Descrição

As APIs do Dashboard utilizam `console.error` para logar erros, o que em ambiente de produção pode expor informações sensíveis nos logs. Embora não seja uma vulnerabilidade direta, pode facilitar ataques se os logs forem comprometidos.

---

## Ação Realizada

### Código Identificado

```typescript
// Múltiplos arquivos - padrão encontrado:

// src/app/api/v1/financeiro/transacoes/route.ts:341-343
} catch (error) {
  console.error('Erro ao criar transação:', error); // Expõe stack trace
  return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
}

// src/app/api/v1/estudos/anotacoes/route.ts:43-46
} catch (error) {
  console.error('Erro ao buscar anotações:', error); // Expõe detalhes
  return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
}
```

### Payload de Teste
```bash
# Causar erro proposital para ver log
curl -X POST /api/v1/financeiro/transacoes \
  -H "Content-Type: application/json" \
  -d '{"valor": "not-a-number"}' # Tipo inválido
```

**Log Gerado**:
```
Erro ao criar transação: PrismaClientKnownRequestError:
  Invalid `prisma.transacao.create()` invocation:
  Argument valor: Got String, expected Decimal.
  at Object.throw (/app/node_modules/@prisma/client/runtime/library.js:...)
```

---

## Impacto

| Tipo de Impacto | Descrição |
|-----------------|-----------|
| **Information Disclosure** | Stack traces revelam estrutura interna |
| **Debugging Info Leak** | Versões de bibliotecas expostas |
| **Schema Leak** | Nomes de campos do banco visíveis |

---

## Causa Raiz

Uso direto de `console.error` sem:
1. Sanitização de dados sensíveis
2. Níveis de log configuráveis por ambiente
3. Estruturação de logs para produção

---

## Ação Corretiva

### 1. Criar Logger Estruturado

```typescript
// src/lib/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDev = process.env.NODE_ENV === 'development';

interface LogContext {
  userId?: string;
  endpoint?: string;
  [key: string]: unknown;
}

export const logger = {
  error: (message: string, error?: unknown, context?: LogContext) => {
    const sanitizedError = isDev ? error : sanitizeError(error);

    if (isDev) {
      console.error(message, sanitizedError, context);
    } else {
      // Em produção, enviar para serviço de logging (Sentry, DataDog, etc.)
      console.error(JSON.stringify({
        level: 'error',
        message,
        error: sanitizedError,
        context,
        timestamp: new Date().toISOString(),
      }));
    }
  },

  info: (message: string, context?: LogContext) => {
    if (isDev) {
      console.log(message, context);
    }
  },
};

function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message; // Apenas mensagem, sem stack
  }
  return 'Unknown error';
}
```

### 2. Usar Logger nas APIs

```typescript
// src/app/api/v1/financeiro/transacoes/route.ts
import { logger } from '@/lib/logger';

} catch (error) {
  logger.error('Erro ao criar transação', error, {
    endpoint: '/api/v1/financeiro/transacoes',
    userId: user?.id,
  });
  return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
}
```

### 3. Configurar Sentry/DataDog para Produção

```typescript
// src/lib/logger.ts - versão com Sentry
import * as Sentry from '@sentry/nextjs';

export const logger = {
  error: (message: string, error?: unknown, context?: LogContext) => {
    if (process.env.NODE_ENV === 'production') {
      Sentry.captureException(error, {
        extra: { message, ...context },
      });
    } else {
      console.error(message, error);
    }
  },
};
```

---

## Referências

- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- [CWE-209: Generation of Error Message Containing Sensitive Information](https://cwe.mitre.org/data/definitions/209.html)

---

## Status

| Status | Data |
|--------|------|
| Identificado | 2026-01-16 |
| Reportado | 2026-01-16 |
| Corrigido | 2026-01-17 |
| Verificado | 2026-01-17 |

### Correção Implementada
- Logger estruturado criado em `src/lib/logger.ts`
- Em desenvolvimento: logs detalhados com stack traces
- Em produção: apenas mensagens sanitizadas (sem stack traces)
- APIs críticas atualizadas para usar o logger (auth, financeiro, estudos)
- Formato JSON estruturado para fácil integração com serviços de monitoramento
