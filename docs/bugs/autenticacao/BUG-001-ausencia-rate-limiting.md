# BUG-001: Ausência de Rate Limiting em Endpoints de Autenticação

## Informações Gerais

| Campo | Valor |
|-------|-------|
| **ID** | BUG-001 |
| **Título** | Ausência de Rate Limiting em Endpoints de Autenticação |
| **Gravidade** | **CRÍTICA** |
| **CVSS Score** | 9.1 (Crítico) |
| **OWASP** | A07:2021 - Identification and Authentication Failures |
| **CWE** | CWE-307: Improper Restriction of Excessive Authentication Attempts |
| **Endpoints Afetados** | `/api/auth/login`, `/api/auth/register`, `/api/auth/forgot-password`, `/api/auth/reset-password` |
| **Data de Identificação** | 2026-01-16 |

---

## Descrição

Os endpoints de autenticação do sistema não implementam nenhum mecanismo de rate limiting (limitação de taxa de requisições). Isso permite que um atacante realize um número ilimitado de tentativas de autenticação sem qualquer restrição ou bloqueio.

---

## Ação Realizada e Payload

### Teste de Brute Force no Login

**Endpoint:** `POST /api/auth/login`

**Payload usado para teste:**
```bash
# Script de teste - Simulação de 100 tentativas consecutivas
for i in {1..100}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"victim@example.com","password":"tentativa'$i'"}' \
    -w "Tentativa $i: HTTP %{http_code}\n" -s -o /dev/null
done
```

**Resultado Observado:**
- Todas as 100 requisições foram processadas sem bloqueio
- Nenhum código de erro 429 (Too Many Requests) foi retornado
- Tempo médio de resposta permaneceu constante (~200ms)
- Nenhum mecanismo de CAPTCHA ou desafio foi acionado

### Teste de Credential Stuffing

**Payload:**
```bash
# Teste com lista de credenciais vazadas
while read line; do
  email=$(echo $line | cut -d: -f1)
  pass=$(echo $line | cut -d: -f2)
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$pass\"}"
done < credentials_list.txt
```

### Teste de Enumeração no Registro

**Payload:**
```bash
# Endpoint de registro revela se email já existe
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"existing@user.com","password":"Test123456"}'

# Resposta quando email existe:
# {"error":"Email já cadastrado"} - Status 409
```

---

## Análise Técnica do Código

### Arquivo: `src/app/api/auth/login/route.ts`

```typescript
// Linha 6-62: Nenhuma verificação de rate limit
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = loginSchema.safeParse(body);
    // ... validação e autenticação direta sem limitação
  }
}
```

### Arquivo: `src/app/api/auth/register/route.ts`

```typescript
// Linha 8-78: Sem rate limiting + vazamento de informação
if (existingUser) {
  return NextResponse.json(
    { error: 'Email já cadastrado' },  // Permite enumeração
    { status: 409 }
  );
}
```

### Arquivo: `src/app/api/auth/forgot-password/route.ts`

```typescript
// Linha 11-64: Endpoint sem proteção contra flood
// Embora use mensagem genérica, permite flood de emails
export async function POST(req: Request) {
  // Nenhum rate limit implementado
}
```

---

## Causa Raiz

1. **Ausência de middleware de rate limiting** em todos os endpoints de autenticação
2. **Falta de contagem de tentativas falhas** por IP ou por conta
3. **Inexistência de mecanismos de bloqueio temporário** após tentativas excessivas
4. **Sem integração com CAPTCHA** para desafiar bots
5. **Logs de segurança insuficientes** para detecção de ataques

---

## Impacto

| Vetor de Ataque | Impacto |
|-----------------|---------|
| **Brute Force** | Comprometimento de contas com senhas fracas |
| **Credential Stuffing** | Acesso não autorizado usando credenciais vazadas |
| **DoS via Flood** | Sobrecarga do servidor e banco de dados |
| **Enumeração de Usuários** | Identificação de emails válidos no sistema |
| **Abuso de Recursos** | Flood de emails de recuperação de senha |

---

## Ação Corretiva Sugerida

### Solução 1: Implementar Rate Limiting com `@upstash/ratelimit`

```typescript
// src/lib/rateLimit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limit por IP: 5 tentativas por minuto
export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
  prefix: 'ratelimit:auth',
});

// Rate limit por email: 3 tentativas por 15 minutos
export const emailRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '15 m'),
  analytics: true,
  prefix: 'ratelimit:email',
});
```

### Solução 2: Middleware de Proteção

```typescript
// src/app/api/auth/login/route.ts
import { authRateLimit, emailRateLimit } from '@/lib/rateLimit';
import { headers } from 'next/headers';

export async function POST(req: NextRequest) {
  const headersList = headers();
  const ip = headersList.get('x-forwarded-for') || 'unknown';

  // Rate limit por IP
  const { success: ipSuccess, remaining } = await authRateLimit.limit(ip);
  if (!ipSuccess) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
      {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Remaining': remaining.toString(),
        }
      }
    );
  }

  const body = await req.json();
  const { email } = body;

  // Rate limit por email (após validação)
  const { success: emailSuccess } = await emailRateLimit.limit(email);
  if (!emailSuccess) {
    // Log tentativa suspeita
    console.warn(`Rate limit exceeded for email: ${email} from IP: ${ip}`);
    return NextResponse.json(
      { error: 'Conta temporariamente bloqueada. Tente novamente mais tarde.' },
      { status: 429 }
    );
  }

  // ... resto da lógica de autenticação
}
```

### Solução 3: Bloqueio Progressivo

```typescript
// Implementar bloqueio exponencial após falhas consecutivas
// 1ª falha: sem delay
// 2ª falha: delay de 1s
// 3ª falha: delay de 2s
// 4ª falha: delay de 4s
// 5ª+ falha: bloqueio de 15 minutos + CAPTCHA obrigatório
```

### Solução 4: Corrigir Enumeração no Registro

```typescript
// src/app/api/auth/register/route.ts
// Alterar resposta para ser genérica:
if (existingUser) {
  // NÃO revelar que email existe
  // Retornar mesma mensagem de sucesso
  return NextResponse.json(
    { message: 'Se este email for válido, você receberá instruções.' },
    { status: 200 }
  );
}
```

---

## Referências

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Brute Force Attack](https://owasp.org/www-community/attacks/Brute_force_attack)
- [CWE-307: Improper Restriction of Excessive Authentication Attempts](https://cwe.mitre.org/data/definitions/307.html)
- [Upstash Rate Limiting](https://upstash.com/docs/oss/sdks/ts/ratelimit/overview)

---

## Status

| Campo | Valor |
|-------|-------|
| **Status** | **FECHADO** |
| **Data de Correção** | 2026-01-16 |
| **Correção Aplicada** | Implementado rate limiting in-memory em `src/lib/rateLimit.ts` |

---

## Correção Implementada

### Arquivo Criado: `src/lib/rateLimit.ts`

Implementação de rate limiting com as seguintes configurações:
- **Login por IP**: 5 tentativas por minuto
- **Login por Email**: 10 tentativas por 15 minutos
- **Registro**: 3 tentativas por minuto por IP
- **Forgot Password**: 3 tentativas por 15 minutos por IP
- **Reset Password**: 5 tentativas por 15 minutos por IP

### Arquivos Modificados:
- `src/app/api/auth/login/route.ts` - Adicionado rate limiting por IP e email
- `src/app/api/auth/register/route.ts` - Adicionado rate limiting por IP
- `src/app/api/auth/forgot-password/route.ts` - Adicionado rate limiting por IP
- `src/app/api/auth/reset-password/route.ts` - Adicionado rate limiting por IP

### Resposta de Rate Limit:
```json
{
  "error": "Muitas tentativas. Por favor, aguarde antes de tentar novamente.",
  "retryAfter": 60
}
// HTTP Status: 429 Too Many Requests
// Headers: Retry-After, X-RateLimit-Reset
```
