# BUG-003: Ausência de Rate Limiting nas APIs do Dashboard

## Informações Gerais

| Campo | Valor |
|-------|-------|
| **ID** | BUG-003 |
| **Título** | Ausência de Rate Limiting nas APIs do Dashboard |
| **Gravidade** | **MÉDIA** |
| **Recurso Afetado** | Todas as APIs do Dashboard (/api/v1/*) |
| **Data de Identificação** | 2026-01-16 |

---

## Descrição

Embora as APIs de autenticação (`/api/auth/login`, `/api/auth/register`, etc.) tenham rate limiting implementado corretamente, as APIs do Dashboard não possuem nenhuma proteção contra abuso. Isso permite ataques de força bruta, enumeração e potencial DoS.

---

## Ação Realizada

### Cenário de Teste: Requisições em Massa
```bash
# Script de teste - 1000 requisições em sequência
for i in {1..1000}; do
  curl -s -X GET "http://localhost:3000/api/v1/financeiro/transacoes" \
    -H "Cookie: session=valid-session" &
done
wait
```

### Cenário de Teste: Criação em Massa
```bash
# Script para criar milhares de transações
for i in {1..500}; do
  curl -X POST "http://localhost:3000/api/v1/financeiro/transacoes" \
    -H "Content-Type: application/json" \
    -H "Cookie: session=valid-session" \
    -d '{"descricao":"Teste '$i'","valor":10,"data":"2026-01-16","tipo":"DESPESA","contaBancariaId":"id"}' &
done
```

**Resultado**: Todas as requisições são processadas sem limitação

---

## APIs Afetadas

| Endpoint | Método | Risco |
|----------|--------|-------|
| `/api/v1/financeiro/transacoes` | GET/POST | Alto volume de leitura/escrita |
| `/api/v1/financeiro/contas` | GET/POST | Criação de contas em massa |
| `/api/v1/estudos/cursos` | GET/POST | Criação de cursos em massa |
| `/api/v1/estudos/anotacoes` | GET/POST | Sobrecarga com anotações |
| `/api/v1/agenda/compromissos` | GET/POST | DoS via compromissos |
| `/api/v1/leituras/midias` | GET/POST | Upload de mídias em massa |
| `/api/v1/atividades` | POST | Log flooding |

---

## Impacto

| Tipo de Impacto | Descrição |
|-----------------|-----------|
| **DoS** | Sobrecarga do servidor/banco de dados |
| **Custo** | Aumento de custos de infraestrutura |
| **Degradação** | Performance afetada para todos os usuários |
| **Scraping** | Extração de dados em massa |
| **Abuso de Recursos** | Uso excessivo de storage/processamento |

---

## Causa Raiz

O sistema de rate limiting (`src/lib/rateLimit.ts`) foi implementado apenas para endpoints de autenticação, deixando as APIs do Dashboard desprotegidas.

```typescript
// Apenas estas existem:
export const loginRateLimiter = new RateLimiter(5, 60 * 1000);
export const loginEmailRateLimiter = new RateLimiter(10, 15 * 60 * 1000);
export const registerRateLimiter = new RateLimiter(3, 60 * 1000);
export const forgotPasswordRateLimiter = new RateLimiter(3, 15 * 60 * 1000);
export const resetPasswordRateLimiter = new RateLimiter(5, 15 * 60 * 1000);

// Faltam rate limiters para APIs gerais
```

---

## Ação Corretiva

### 1. Criar Rate Limiters para APIs do Dashboard

```typescript
// src/lib/rateLimit.ts - Adicionar novos limiters

// API geral: 100 requisições por minuto por usuário
export const apiGeneralRateLimiter = new RateLimiter(100, 60 * 1000);

// Criação de recursos: 20 por minuto por usuário
export const apiCreateRateLimiter = new RateLimiter(20, 60 * 1000);

// Operações pesadas (AI, export): 5 por minuto
export const apiHeavyRateLimiter = new RateLimiter(5, 60 * 1000);
```

### 2. Middleware de Rate Limiting Global

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Aplicar rate limiting em rotas /api/v1/*
  if (request.nextUrl.pathname.startsWith('/api/v1/')) {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const userId = request.cookies.get('session')?.value || ip;

    // Verificar rate limit (implementar com Redis para produção)
    const key = `ratelimit:${userId}:${request.nextUrl.pathname}`;
    // ... verificação de limite ...
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/v1/:path*',
};
```

### 3. Wrapper para APIs

```typescript
// src/lib/apiRateLimit.ts
import { NextRequest, NextResponse } from 'next/server';
import { apiGeneralRateLimiter, getClientIP } from './rateLimit';

export async function withRateLimit(
  req: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const identifier = getClientIP(req);
  const result = await apiGeneralRateLimiter.limit(identifier);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Limite de requisições excedido. Tente novamente em breve.' },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  const response = await handler();

  // Adicionar headers de rate limit
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.resetTime.toString());

  return response;
}
```

### 4. Uso nas APIs

```typescript
// src/app/api/v1/financeiro/transacoes/route.ts
import { withRateLimit } from '@/lib/apiRateLimit';

export async function POST(req: NextRequest) {
  return withRateLimit(req, async () => {
    // ... lógica existente ...
  });
}
```

---

## Considerações para Produção

Para ambientes de produção em escala, considere:

1. **Redis para Rate Limiting**: Usar `@upstash/ratelimit` para distribuição
2. **Rate Limiting por Tier**: Limites diferentes para Free vs Premium
3. **Sliding Window**: Usar janela deslizante em vez de janela fixa
4. **Monitoramento**: Alertas para padrões de abuso

---

## Referências

- [OWASP Rate Limiting](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html)
- [Upstash Rate Limit](https://github.com/upstash/ratelimit)
- [API Security Best Practices](https://owasp.org/www-project-api-security/)

---

## Status

| Status | Data |
|--------|------|
| Identificado | 2026-01-16 |
| Reportado | 2026-01-16 |
| Corrigido | 2026-01-17 |
| Verificado | 2026-01-17 |

### Correção Implementada
- Rate limiters adicionados em `src/lib/rateLimit.ts`:
  - `apiReadRateLimiter`: 100 req/min para leitura
  - `apiCreateRateLimiter`: 30 req/min para criação
  - `apiUpdateRateLimiter`: 30 req/min para atualização
  - `apiDeleteRateLimiter`: 20 req/min para deleção
  - `apiHeavyRateLimiter`: 5 req/min para operações pesadas (AI)
- Wrapper `withApiRateLimit()` disponível para uso nas APIs
