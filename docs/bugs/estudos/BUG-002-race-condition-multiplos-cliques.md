# BUG-002: Race Condition por Múltiplos Cliques Rápidos

## Informações Gerais

| Campo | Valor |
|-------|-------|
| **ID** | ESTUDOS-BUG-002 |
| **Título** | Race Condition por Falta de Debounce/Disable em Ações de CRUD |
| **Gravidade** | **MÉDIA** |
| **Recurso Afetado** | Dashboard > Estudos > Todos os Modais (Curso, Módulo, Página, Anotação) |
| **Arquivos Afetados** | `src/app/(dashboard)/dashboard/estudos/page.tsx`, `src/app/(dashboard)/dashboard/estudos/[id]/page.tsx` |
| **Data de Identificação** | 2026-01-17 |

---

## Descrição

Os botões de ação (criar, editar, excluir) nos modais da tela de Estudos **não são desabilitados durante o processamento** da requisição. Isso permite que o usuário clique múltiplas vezes rapidamente, resultando em:

1. **Criação de registros duplicados** (cursos, módulos, páginas, anotações)
2. **Requisições concorrentes** que podem causar inconsistência de dados
3. **Erros de integridade** no banco de dados em casos extremos

---

## Ação Realizada

### Cenário de Teste 1: Criação Duplicada de Curso
1. Acessar Dashboard > Estudos
2. Clicar em "Novo Curso"
3. Preencher nome do curso
4. Clicar rapidamente 5 vezes no botão "Criar Curso"
5. **Resultado**: 5 cursos idênticos são criados

### Cenário de Teste 2: Criação Duplicada de Módulo
1. Acessar um curso
2. Clicar em "Novo Módulo"
3. Preencher nome do módulo
4. Clicar rapidamente no botão "Criar Módulo"
5. **Resultado**: Múltiplos módulos idênticos criados

### Cenário de Teste 3: Exclusão Múltipla
1. Acessar uma anotação
2. Clicar em "Excluir"
3. Clicar rapidamente múltiplas vezes em "Confirmar"
4. **Resultado**: Múltiplas requisições DELETE enviadas (podem causar erro 404 nas subsequentes)

### Payload de Teste (Automatizado)

```javascript
// Executar no console do navegador
const button = document.querySelector('[data-testid="create-course-button"]') ||
               document.querySelector('button:contains("Criar Curso")');

// Simular 10 cliques rápidos
for (let i = 0; i < 10; i++) {
  button.click();
}
```

```bash
# Via cURL - Enviar múltiplas requisições simultâneas
for i in {1..10}; do
  curl -X POST 'https://app.exemplo.com/api/v1/estudos/cursos' \
    -H 'Content-Type: application/json' \
    -H 'Cookie: [SESSION_COOKIE]' \
    -d '{"nome": "Curso Duplicado", "cor": "#8B5CF6"}' &
done
wait
```

---

## Código Vulnerável

### Criação de Curso
```typescript
// src/app/(dashboard)/dashboard/estudos/page.tsx:112-128
const criarCurso = async () => {
  try {
    const response = await fetch('/api/v1/estudos/cursos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novoCurso),
    });

    if (response.ok) {
      setModalCursoAberto(false);
      // ⚠️ PROBLEMA: Nenhum estado de loading para desabilitar botão
      setNovoCurso({ nome: '', descricao: '', cor: '#8B5CF6' });
      carregarDados();
    }
  } catch (error) {
    console.error('Erro ao criar curso:', error);
  }
};
```

### Botão sem proteção
```typescript
// src/app/(dashboard)/dashboard/estudos/page.tsx:576-582
<Button
  onClick={criarCurso}
  disabled={!novoCurso.nome}  // ⚠️ Só valida campo, não estado de loading
  className="bg-purple-600 hover:bg-purple-700"
>
  {t('createCourse')}
</Button>
```

### Mesmos problemas em:
- `criarModulo()` - linha 106-126 do `[id]/page.tsx`
- `criarPagina()` - linha 128-150 do `[id]/page.tsx`
- `criarAnotacao()` - linha 130-149 do `page.tsx`
- `editarAnotacao()` - linha 230-253 do `page.tsx`
- `confirmarExcluirCurso()` - linha 261-273 do `[id]/page.tsx`
- `confirmarExcluirModulo()` - linha 208-227 do `[id]/page.tsx`
- `confirmarExcluirPagina()` - linha 235-255 do `[id]/page.tsx`

---

## Impacto

| Tipo de Impacto | Descrição | Severidade |
|-----------------|-----------|------------|
| **Dados Duplicados** | Usuário pode criar registros duplicados acidentalmente | MÉDIA |
| **Inconsistência** | Estado da UI pode ficar dessincronizado com o backend | MÉDIA |
| **Performance** | Múltiplas requisições simultâneas sobrecarregam o servidor | BAIXA |
| **UX Ruim** | Usuário não tem feedback visual de que a ação está em andamento | BAIXA |
| **Erros 404/500** | Tentativa de deletar/atualizar registro já processado | BAIXA |

---

## Causa Raiz

1. **Falta de estado de loading**: As funções de CRUD não definem um estado `isLoading` durante a requisição
2. **Botões sempre habilitados**: Os botões só validam campos obrigatórios, não o estado de processamento
3. **Sem debounce**: Não há throttling ou debounce nos handlers de clique
4. **Sem idempotência no backend**: As APIs não verificam duplicatas em um curto intervalo de tempo

---

## Ação Corretiva

### 1. Adicionar Estado de Loading (Frontend)

```typescript
// Adicionar estado
const [isCreating, setIsCreating] = useState(false);

// Modificar função
const criarCurso = async () => {
  if (isCreating) return; // Proteção extra

  setIsCreating(true);
  try {
    const response = await fetch('/api/v1/estudos/cursos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novoCurso),
    });

    if (response.ok) {
      setModalCursoAberto(false);
      setNovoCurso({ nome: '', descricao: '', cor: '#8B5CF6' });
      carregarDados();
    }
  } catch (error) {
    console.error('Erro ao criar curso:', error);
  } finally {
    setIsCreating(false);
  }
};

// Modificar botão
<Button
  onClick={criarCurso}
  disabled={!novoCurso.nome || isCreating}
  className="bg-purple-600 hover:bg-purple-700"
>
  {isCreating ? (
    <>
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      Criando...
    </>
  ) : (
    t('createCourse')
  )}
</Button>
```

### 2. Hook Customizado para Ações Seguras

```typescript
// src/hooks/useSafeAction.ts
import { useState, useCallback } from 'react';

export function useSafeAction<T extends (...args: any[]) => Promise<any>>(action: T) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (...args: Parameters<T>) => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await action(...args);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [action, isLoading]);

  return { execute, isLoading, error };
}

// Uso:
const { execute: criarCursoSafe, isLoading } = useSafeAction(criarCurso);
```

### 3. Debounce nos Handlers

```typescript
import { debounce } from 'lodash';

const criarCursoDebounced = useCallback(
  debounce(criarCurso, 500, { leading: true, trailing: false }),
  [novoCurso]
);
```

### 4. Proteção no Backend (Opcional - Defense in Depth)

```typescript
// Adicionar verificação de duplicata recente
const cursoRecente = await prisma.curso.findFirst({
  where: {
    userId: user.id,
    nome,
    createdAt: {
      gte: new Date(Date.now() - 5000) // Últimos 5 segundos
    }
  }
});

if (cursoRecente) {
  return NextResponse.json(
    { error: 'Curso criado recentemente. Aguarde alguns segundos.' },
    { status: 429 }
  );
}
```

---

## Referências

- [React Patterns: Preventing Double Submissions](https://react.dev/learn/responding-to-events#preventing-default-behavior)
- [OWASP: Race Conditions](https://owasp.org/www-community/attacks/Race_Condition)
- [CWE-362: Concurrent Execution Using Shared Resource with Improper Synchronization](https://cwe.mitre.org/data/definitions/362.html)

---

## Status

| Status | Data |
|--------|------|
| Identificado | 2026-01-17 |
| Reportado | 2026-01-17 |
| **Corrigido** | 2026-01-17 |
| Verificado | - |

### Correção Aplicada
- Adicionados estados de loading em `src/app/(dashboard)/dashboard/estudos/page.tsx`:
  - `criandoCurso`, `criandoAnotacao`, `editandoAnotacaoLoading`, `excluindoAnotacao`
- Adicionados estados de loading em `src/app/(dashboard)/dashboard/estudos/[id]/page.tsx`:
  - `criandoModulo`, `criandoPagina`, `salvandoPagina`, `excluindoModulo`, `excluindoPagina`, `excluindoCurso`
- Botões são desabilitados durante o processamento e mostram spinner de loading
- Funções verificam o estado de loading antes de executar para evitar chamadas duplicadas
