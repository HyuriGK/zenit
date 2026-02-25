# BUG-003: Ausência de Rate Limiting nas APIs de Estudos

## Informações Gerais

| Campo | Valor |
|-------|-------|
| **ID** | ESTUDOS-BUG-003 |
| **Título** | Ausência de Rate Limiting nas APIs do Módulo de Estudos |
| **Gravidade** | **MÉDIA** |
| **Recurso Afetado** | Dashboard > Estudos > Todas as APIs |
| **Arquivos Afetados** | Todos os arquivos em `src/app/api/v1/estudos/` |
| **Data de Identificação** | 2026-01-17 |

---

## Descrição

Nenhuma das APIs do módulo de Estudos implementa rate limiting, permitindo que um atacante ou usuário mal-intencionado:

1. **Abuse dos recursos do servidor** com requisições em massa
2. **Realize ataques de força bruta** em operações de busca
3. **Cause Denial of Service (DoS)** no nível de aplicação
4. **Exaure recursos do banco de dados** com operações de escrita em massa
5. **Aumente custos de infraestrutura** desnecessariamente

---

## Ação Realizada

### Cenário de Teste: Flood de Requisições

```bash
# Teste de carga: 100 requisições em 10 segundos
for i in {1..100}; do
  curl -X POST 'https://app.exemplo.com/api/v1/estudos/cursos' \
    -H 'Content-Type: application/json' \
    -H 'Cookie: [SESSION_COOKIE]' \
    -d '{"nome": "Curso Teste '$i'", "cor": "#8B5CF6"}' &
done
wait
```

```bash
# Teste de busca intensiva
for i in {1..1000}; do
  curl 'https://app.exemplo.com/api/v1/estudos/buscar?q=test'$i \
    -H 'Cookie: [SESSION_COOKIE]' &
done
wait
```

### Resultado Esperado
- Após ~50 requisições/minuto, deveria retornar `429 Too Many Requests`

### Resultado Atual
- **Todas as 100+ requisições são processadas** sem limite
- Servidor pode ficar sobrecarregado
- Banco de dados pode atingir limites de conexão

---

## Código Vulnerável

### Exemplo: API de Cursos
```typescript
// src/app/api/v1/estudos/cursos/route.ts
// ⚠️ Nenhuma verificação de rate limit
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    // ... código sem proteção de rate limit ...
    const curso = await prisma.curso.create({ ... });
    return NextResponse.json({ ... }, { status: 201 });
  } catch (error) {
    // ...
  }
}
```

### Endpoints Afetados

| Endpoint | Método | Risco |
|----------|--------|-------|
| `/api/v1/estudos/cursos` | GET, POST | Alto (listagem e criação em massa) |
| `/api/v1/estudos/cursos/[id]` | GET, PUT, DELETE | Médio |
| `/api/v1/estudos/modulos` | POST | Alto (criação em massa) |
| `/api/v1/estudos/modulos/[id]` | GET, PUT, DELETE | Médio |
| `/api/v1/estudos/paginas` | POST | Alto (criação em massa) |
| `/api/v1/estudos/paginas/[id]` | GET, PUT, DELETE | Médio |
| `/api/v1/estudos/anotacoes` | GET, POST | Alto (listagem e criação em massa) |
| `/api/v1/estudos/anotacoes/[id]` | GET, PUT, DELETE | Médio |
| `/api/v1/estudos/buscar` | GET | **Crítico** (consultas pesadas) |

---

## Impacto

| Tipo de Impacto | Descrição | Severidade |
|-----------------|-----------|------------|
| **DoS de Aplicação** | Servidor pode ficar indisponível para outros usuários | ALTA |
| **Exaustão de BD** | Pool de conexões do banco pode ser esgotado | ALTA |
| **Custos de Infra** | Aumento de custos com cloud/servidor | MÉDIA |
| **Degradação de Performance** | Lentidão generalizada na aplicação | MÉDIA |
| **Abuse de IA** | Endpoint `/api/generate-note` pode gerar custos excessivos | ALTA |

---

## Causa Raiz

1. **Falta de middleware de rate limiting**: Projeto não implementa biblioteca como `rate-limiter-flexible` ou `upstash/ratelimit`
2. **Sem configuração de limites**: Nenhuma definição de quantas requisições são permitidas por período
3. **Ausência de identificação**: Não há tracking de requisições por usuário/IP
4. **Sem proteção na camada de API**: Nenhum middleware global para rate limiting

---

## Ação Corretiva

### 1. Implementar Rate Limiting com Upstash Redis

```bash
npm install @upstash/ratelimit @upstash/redis
```

```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Limites diferentes por tipo de operação
export const rateLimits = {
  // Operações de leitura: 100 req/min
  read: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
    prefix: 'ratelimit:read',
  }),

  // Operações de escrita: 20 req/min
  write: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 m'),
    analytics: true,
    prefix: 'ratelimit:write',
  }),

  // Busca: 30 req/min (mais pesado)
  search: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 m'),
    analytics: true,
    prefix: 'ratelimit:search',
  }),

  // IA: 5 req/min (muito caro)
  ai: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    analytics: true,
    prefix: 'ratelimit:ai',
  }),
};

export async function checkRateLimit(
  identifier: string,
  type: keyof typeof rateLimits
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const ratelimit = rateLimits[type];
  const { success, remaining, reset } = await ratelimit.limit(identifier);
  return { success, remaining, reset };
}
```

### 2. Middleware de Rate Limiting

```typescript
// src/middleware/rate-limit.ts
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { auth } from '@/lib/auth/auth';

export async function withRateLimit(
  req: NextRequest,
  type: 'read' | 'write' | 'search' | 'ai'
) {
  const session = await auth();
  const identifier = session?.user?.email || req.ip || 'anonymous';

  const { success, remaining, reset } = await checkRateLimit(identifier, type);

  if (!success) {
    return NextResponse.json(
      {
        error: 'Muitas requisições. Tente novamente em alguns segundos.',
        retryAfter: Math.ceil((reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  return null; // Continue processing
}
```

### 3. Aplicar nos Endpoints

```typescript
// src/app/api/v1/estudos/cursos/route.ts
import { withRateLimit } from '@/middleware/rate-limit';

export async function GET(req: NextRequest) {
  // Verificar rate limit para leitura
  const rateLimitResponse = await withRateLimit(req, 'read');
  if (rateLimitResponse) return rateLimitResponse;

  // ... resto do código ...
}

export async function POST(req: NextRequest) {
  // Verificar rate limit para escrita
  const rateLimitResponse = await withRateLimit(req, 'write');
  if (rateLimitResponse) return rateLimitResponse;

  // ... resto do código ...
}
```

### 4. Alternativa: Rate Limiting em Memória (Sem Redis)

```typescript
// src/lib/rate-limit-memory.ts
const requests = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimitMemory(
  identifier: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const record = requests.get(identifier);

  if (!record || now > record.resetTime) {
    requests.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

// Limpar entradas expiradas periodicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requests.entries()) {
    if (now > value.resetTime) {
      requests.delete(key);
    }
  }
}, 60000);
```

---

## Limites Recomendados

| Operação | Limite | Janela |
|----------|--------|--------|
| Leitura (GET) | 100 | 1 minuto |
| Escrita (POST/PUT) | 20 | 1 minuto |
| Exclusão (DELETE) | 10 | 1 minuto |
| Busca | 30 | 1 minuto |
| Geração IA | 5 | 1 minuto |
| Global por usuário | 500 | 1 hora |

---

## Referências

- [OWASP: Rate Limiting](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/04-Authentication_Testing/07-Testing_for_Rate_Limiting)
- [CWE-799: Improper Control of Interaction Frequency](https://cwe.mitre.org/data/definitions/799.html)
- [Upstash Ratelimit Documentation](https://upstash.com/docs/ratelimit/introduction)

---

## Status

| Status | Data |
|--------|------|
| Identificado | 2026-01-17 |
| Reportado | 2026-01-17 |
| **Corrigido** | 2026-01-17 |
| Verificado | - |

### Correção Aplicada
Utilizando a infraestrutura de rate limiting já existente em `src/lib/rateLimit.ts`, foi adicionada proteção em todas as APIs de estudos:

- `src/app/api/v1/estudos/cursos/route.ts` - GET (100/min), POST (30/min)
- `src/app/api/v1/estudos/cursos/[id]/route.ts` - GET (100/min), PUT (30/min), DELETE (20/min)
- `src/app/api/v1/estudos/modulos/route.ts` - POST (30/min)
- `src/app/api/v1/estudos/modulos/[id]/route.ts` - GET (100/min), PUT (30/min), DELETE (20/min)
- `src/app/api/v1/estudos/paginas/route.ts` - POST (30/min)
- `src/app/api/v1/estudos/paginas/[id]/route.ts` - GET (100/min), PUT (30/min), DELETE (20/min)
- `src/app/api/v1/estudos/anotacoes/route.ts` - GET (100/min), POST (30/min)
- `src/app/api/v1/estudos/anotacoes/[id]/route.ts` - GET (100/min), PUT (30/min), DELETE (20/min)
- `src/app/api/v1/estudos/buscar/route.ts` - GET (100/min)
