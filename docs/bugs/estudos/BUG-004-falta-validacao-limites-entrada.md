# BUG-004: Falta de Validação de Limites de Entrada

## Informações Gerais

| Campo | Valor |
|-------|-------|
| **ID** | ESTUDOS-BUG-004 |
| **Título** | Ausência de Validação de Tamanho/Formato nos Campos de Entrada |
| **Gravidade** | **MÉDIA** |
| **Recurso Afetado** | Dashboard > Estudos > Todas as Entidades |
| **Arquivos Afetados** | Todas as APIs em `src/app/api/v1/estudos/` |
| **Data de Identificação** | 2026-01-17 |

---

## Descrição

As APIs do módulo de Estudos não validam adequadamente os limites de tamanho e formato dos campos de entrada. Isso permite:

1. **Inserção de strings extremamente longas** que podem causar problemas de performance
2. **Dados malformados** que passam sem validação
3. **Possível exaustão de memória** com payloads muito grandes
4. **Problemas de renderização** no frontend com conteúdo muito extenso

---

## Ação Realizada

### Cenário de Teste 1: Nome de Curso Extremamente Longo

```bash
# Criar curso com nome de 10MB
curl -X POST 'https://app.exemplo.com/api/v1/estudos/cursos' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: [SESSION_COOKIE]' \
  -d '{
    "nome": "'$(python3 -c "print('A' * 10485760)")'",
    "cor": "#8B5CF6"
  }'
```

### Cenário de Teste 2: Conteúdo de Página Gigante

```bash
# Criar página com 50MB de conteúdo HTML
curl -X POST 'https://app.exemplo.com/api/v1/estudos/paginas' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: [SESSION_COOKIE]' \
  -d '{
    "titulo": "Página Normal",
    "conteudo": "'$(python3 -c "print('<p>' + 'A' * 52428800 + '</p>')")'",
    "moduloId": "[ID_MODULO]"
  }'
```

### Cenário de Teste 3: Campos com Caracteres Especiais

```bash
# Testar caracteres unicode extremos
curl -X POST 'https://app.exemplo.com/api/v1/estudos/cursos' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: [SESSION_COOKIE]' \
  -d '{
    "nome": "Curso \u0000\u0001\u0002 Null Bytes",
    "cor": "#8B5CF6"
  }'
```

### Cenário de Teste 4: Cor Inválida

```bash
# Testar formato de cor inválido
curl -X POST 'https://app.exemplo.com/api/v1/estudos/cursos' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: [SESSION_COOKIE]' \
  -d '{
    "nome": "Curso Teste",
    "cor": "not-a-color"
  }'

# Testar cor com payload malicioso
curl -X POST 'https://app.exemplo.com/api/v1/estudos/cursos' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: [SESSION_COOKIE]' \
  -d '{
    "nome": "Curso Teste",
    "cor": "red; background-image: url(https://evil.com/track)"
  }'
```

---

## Código Vulnerável

### API de Cursos
```typescript
// src/app/api/v1/estudos/cursos/route.ts:56-75
const body = await req.json();
const { nome, descricao, cor, icone, ordem } = body;

if (!nome) {  // ⚠️ Apenas verifica se existe, não o tamanho
  return NextResponse.json(
    { error: 'Nome é obrigatório' },
    { status: 400 }
  );
}

const curso = await prisma.curso.create({
  data: {
    nome,        // ⚠️ Sem limite de tamanho
    descricao,   // ⚠️ Sem limite de tamanho
    cor: cor || '#8B5CF6',  // ⚠️ Sem validação de formato
    icone: icone || 'book-open',
    ordem: ordem || 0,
    userId: user.id,
  },
});
```

### API de Páginas
```typescript
// src/app/api/v1/estudos/paginas/route.ts:22-52
const { titulo, conteudo, moduloId, ordem } = body;

if (!titulo || !moduloId) {  // ⚠️ Apenas verifica existência
  return NextResponse.json(
    { error: 'Título e moduloId são obrigatórios' },
    { status: 400 }
  );
}

const pagina = await prisma.pagina.create({
  data: {
    titulo,            // ⚠️ Sem limite
    conteudo: conteudo || '',  // ⚠️ Pode ser ENORME
    moduloId,
    ordem: ordem || 0,
  },
});
```

---

## Impacto

| Tipo de Impacto | Descrição | Severidade |
|-----------------|-----------|------------|
| **DoS de Memória** | Payloads muito grandes podem exaurir memória do servidor | ALTA |
| **Problemas de BD** | Campos muito longos podem causar erros de inserção | MÉDIA |
| **UI Quebrada** | Renderização de conteúdo muito longo pode travar o navegador | MÉDIA |
| **CSS Injection** | Cores malformadas podem injetar CSS (menor risco) | BAIXA |
| **Performance** | Operações com dados muito grandes são lentas | MÉDIA |

---

## Causa Raiz

1. **Ausência de biblioteca de validação**: Não usa Zod, Yup, ou joi para validação de schema
2. **Validações manuais incompletas**: Apenas `if (!campo)` não é suficiente
3. **Sem limite de payload**: Next.js não limita tamanho do body por padrão
4. **Sem sanitização de entrada**: Caracteres especiais não são tratados

---

## Ação Corretiva

### 1. Implementar Validação com Zod

```bash
npm install zod
```

```typescript
// src/lib/validations/estudos.ts
import { z } from 'zod';

// Validação de cor hexadecimal
const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export const cursoSchema = z.object({
  nome: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[^<>]*$/, 'Nome contém caracteres inválidos'),

  descricao: z
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional()
    .nullable(),

  cor: z
    .string()
    .regex(hexColorRegex, 'Cor deve ser um código hexadecimal válido')
    .optional()
    .default('#8B5CF6'),

  icone: z
    .string()
    .max(50, 'Ícone inválido')
    .optional()
    .default('book-open'),

  ordem: z
    .number()
    .int()
    .min(0)
    .max(1000)
    .optional()
    .default(0),
});

export const moduloSchema = z.object({
  nome: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),

  descricao: z
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional()
    .nullable(),

  cursoId: z.string().uuid('ID do curso inválido'),

  ordem: z.number().int().min(0).max(1000).optional().default(0),
});

export const paginaSchema = z.object({
  titulo: z
    .string()
    .min(1, 'Título é obrigatório')
    .max(200, 'Título deve ter no máximo 200 caracteres'),

  conteudo: z
    .string()
    .max(500000, 'Conteúdo muito grande (máximo 500KB)')
    .optional()
    .default(''),

  moduloId: z.string().uuid('ID do módulo inválido'),

  ordem: z.number().int().min(0).max(1000).optional().default(0),
});

export const anotacaoSchema = z.object({
  titulo: z
    .string()
    .min(1, 'Título é obrigatório')
    .max(200, 'Título deve ter no máximo 200 caracteres'),

  conteudo: z
    .string()
    .max(100000, 'Conteúdo muito grande (máximo 100KB)')
    .optional()
    .default(''),

  cor: z
    .string()
    .regex(hexColorRegex, 'Cor deve ser um código hexadecimal válido')
    .optional()
    .default('#FBBF24'),

  cursoId: z.string().uuid('ID do curso inválido').optional().nullable(),
});

export const buscaSchema = z.object({
  q: z
    .string()
    .min(2, 'Busca deve ter pelo menos 2 caracteres')
    .max(100, 'Busca deve ter no máximo 100 caracteres')
    .regex(/^[^<>]*$/, 'Termo de busca contém caracteres inválidos'),
});
```

### 2. Aplicar Validação nas APIs

```typescript
// src/app/api/v1/estudos/cursos/route.ts
import { cursoSchema } from '@/lib/validations/estudos';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    // ... auth checks ...

    const body = await req.json();

    // Validar com Zod
    const validationResult = cursoSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { nome, descricao, cor, icone, ordem } = validationResult.data;

    const curso = await prisma.curso.create({
      data: {
        nome,
        descricao,
        cor,
        icone,
        ordem,
        userId: user.id,
      },
    });

    return NextResponse.json(
      { message: 'Curso criado com sucesso', data: curso },
      { status: 201 }
    );
  } catch (error) {
    // ...
  }
}
```

### 3. Limitar Tamanho do Body no Next.js

```typescript
// next.config.js
module.exports = {
  api: {
    bodyParser: {
      sizeLimit: '1mb', // Limite global de 1MB
    },
  },
};
```

```typescript
// Para rotas específicas que precisam de mais
// src/app/api/v1/estudos/paginas/route.ts
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '2mb', // Páginas podem ter mais conteúdo
    },
  },
};
```

### 4. Sanitização de Caracteres Especiais

```typescript
// src/lib/utils/sanitize.ts
export function sanitizeString(str: string): string {
  return str
    .replace(/\u0000/g, '') // Remove null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars
    .trim();
}
```

---

## Limites Recomendados

| Campo | Limite Mínimo | Limite Máximo |
|-------|---------------|---------------|
| nome (curso/módulo) | 1 char | 100 chars |
| descricao | 0 | 500 chars |
| titulo (página/anotação) | 1 char | 200 chars |
| conteudo (página) | 0 | 500 KB |
| conteudo (anotação) | 0 | 100 KB |
| cor | 4 chars (#FFF) | 7 chars (#FFFFFF) |
| termo de busca | 2 chars | 100 chars |

---

## Referências

- [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [CWE-20: Improper Input Validation](https://cwe.mitre.org/data/definitions/20.html)
- [Zod Documentation](https://zod.dev/)

---

## Status

| Status | Data |
|--------|------|
| Identificado | 2026-01-17 |
| Reportado | 2026-01-17 |
| **Corrigido** | 2026-01-17 |
| Verificado | - |

---

## Correção Implementada

**Data da Correção:** 2026-01-17

### Ações Realizadas:

1. **Criado arquivo de validações Zod**: `src/lib/validations/estudos.ts`
   - Schema `cursoSchema` com limites para nome (100 chars), descrição (500 chars), cor (hex válido)
   - Schema `moduloSchema` com limites para nome (100 chars), descrição (500 chars)
   - Schema `paginaSchema` com limites para título (200 chars), conteúdo (500KB)
   - Schema `anotacaoSchema` com limites para título (200 chars), conteúdo (100KB)
   - Schema `buscaSchema` com limites para termo de busca (2-100 chars)

2. **Validação aplicada em todas as APIs**:
   - `src/app/api/v1/estudos/cursos/route.ts` (POST)
   - `src/app/api/v1/estudos/cursos/[id]/route.ts` (PUT)
   - `src/app/api/v1/estudos/modulos/route.ts` (POST)
   - `src/app/api/v1/estudos/modulos/[id]/route.ts` (PUT)
   - `src/app/api/v1/estudos/paginas/route.ts` (POST)
   - `src/app/api/v1/estudos/paginas/[id]/route.ts` (PUT)
   - `src/app/api/v1/estudos/anotacoes/route.ts` (POST)
   - `src/app/api/v1/estudos/anotacoes/[id]/route.ts` (PUT)

3. **Validação de formato de cor**: Regex para aceitar apenas códigos hexadecimais válidos (#FFF ou #FFFFFF)

4. **Schemas de update parciais**: Criados schemas com `.partial()` para permitir atualizações parciais
