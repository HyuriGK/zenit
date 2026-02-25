# BUG-005: Perda de Dados ao Fechar Modal Sem Confirmação

## Informações Gerais

| Campo | Valor |
|-------|-------|
| **ID** | ESTUDOS-BUG-005 |
| **Título** | Perda de Dados ao Fechar Modal Sem Confirmação de Saída |
| **Gravidade** | **BAIXA** |
| **Recurso Afetado** | Dashboard > Estudos > Todos os Modais de Criação/Edição |
| **Arquivos Afetados** | `src/app/(dashboard)/dashboard/estudos/page.tsx`, `src/app/(dashboard)/dashboard/estudos/[id]/page.tsx` |
| **Data de Identificação** | 2026-01-17 |

---

## Descrição

Os modais de criação e edição no módulo de Estudos **não solicitam confirmação** quando o usuário tenta fechá-los com dados não salvos. Isso pode resultar em:

1. **Perda de trabalho** ao clicar acidentalmente fora do modal
2. **Frustração do usuário** que digitou conteúdo extenso
3. **Experiência de usuário ruim** em formulários complexos

---

## Ação Realizada

### Cenário de Teste 1: Fechar Modal de Nova Anotação
1. Acessar Dashboard > Estudos
2. Clicar em "Nova Anotação"
3. Preencher título e conteúdo extenso
4. Clicar fora do modal ou pressionar ESC
5. **Resultado**: Modal fecha imediatamente, dados perdidos

### Cenário de Teste 2: Fechar Modal de Novo Módulo
1. Acessar um curso
2. Clicar em "Novo Módulo"
3. Preencher nome e descrição
4. Pressionar ESC
5. **Resultado**: Modal fecha, dados perdidos

### Cenário de Teste 3: Sair Durante Edição de Página
1. Acessar uma página de curso
2. Clicar em "Editar"
3. Fazer alterações no conteúdo
4. Clicar em outra página ou módulo
5. **Resultado**: Alterações perdidas sem aviso

---

## Código Vulnerável

### Modal de Anotação
```typescript
// src/app/(dashboard)/dashboard/estudos/page.tsx:589
<Dialog open={modalAnotacaoAberto} onOpenChange={fecharModalAnotacao}>
  {/* ⚠️ Fecha diretamente sem verificar mudanças não salvas */}
```

```typescript
// Função de fechamento sem verificação
const fecharModalAnotacao = () => {
  setModalAnotacaoAberto(false);
  setNovaAnotacao({ titulo: '', conteudo: '', cor: '#FBBF24' });
  // ⚠️ Reseta tudo sem perguntar
  setTipoAnotacao('livre');
  setTextoOriginalIA('');
  setAnotacaoGeradaIA(null);
  setErroIA(null);
};
```

### Modal de Curso
```typescript
// src/app/(dashboard)/dashboard/estudos/page.tsx:527
<Dialog open={modalCursoAberto} onOpenChange={setModalCursoAberto}>
  {/* ⚠️ onOpenChange permite fechar sem confirmação */}
```

### Editor de Página
```typescript
// src/app/(dashboard)/dashboard/estudos/[id]/page.tsx:413
onClick={() => carregarModulo(modulo.id)}
// ⚠️ Se estava editando uma página, perde alterações
```

---

## Impacto

| Tipo de Impacto | Descrição | Severidade |
|-----------------|-----------|------------|
| **Perda de Dados** | Usuário perde conteúdo digitado | MÉDIA |
| **UX Ruim** | Frustração ao perder trabalho | BAIXA |
| **Retrabalho** | Usuário precisa digitar novamente | BAIXA |

---

## Causa Raiz

1. **Sem tracking de estado "sujo"**: Não há verificação se o formulário foi modificado
2. **Fechamento direto**: `onOpenChange` fecha sem interceptação
3. **Sem hook de navegação**: Não usa `beforeunload` ou similar
4. **Padrão de UI ignorado**: Não segue convenções de confirmação antes de descartar

---

## Ação Corretiva

### 1. Hook para Detectar Formulário "Sujo"

```typescript
// src/hooks/useUnsavedChanges.ts
import { useState, useCallback, useEffect } from 'react';

interface UseUnsavedChangesOptions {
  initialValue?: boolean;
  onConfirmLeave?: () => boolean;
}

export function useUnsavedChanges(options: UseUnsavedChangesOptions = {}) {
  const [isDirty, setIsDirty] = useState(options.initialValue ?? false);

  const markDirty = useCallback(() => setIsDirty(true), []);
  const markClean = useCallback(() => setIsDirty(false), []);

  // Prevenir fechamento da aba/navegação
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const confirmLeave = useCallback(() => {
    if (!isDirty) return true;

    return window.confirm(
      'Você tem alterações não salvas. Deseja realmente sair?'
    );
  }, [isDirty]);

  return {
    isDirty,
    markDirty,
    markClean,
    confirmLeave,
  };
}
```

### 2. Componente de Modal Seguro

```typescript
// src/components/ui/SafeDialog.tsx
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useState, useCallback, ReactNode } from 'react';

interface SafeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isDirty?: boolean;
  confirmMessage?: string;
  children: ReactNode;
}

export function SafeDialog({
  open,
  onOpenChange,
  isDirty = false,
  confirmMessage = 'Você tem alterações não salvas. Deseja realmente fechar?',
  children,
}: SafeDialogProps) {
  const handleOpenChange = useCallback((newOpen: boolean) => {
    // Se está fechando e há alterações não salvas
    if (!newOpen && isDirty) {
      const confirmed = window.confirm(confirmMessage);
      if (!confirmed) return;
    }
    onOpenChange(newOpen);
  }, [isDirty, confirmMessage, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {children}
    </Dialog>
  );
}
```

### 3. Aplicar no Modal de Anotação

```typescript
// src/app/(dashboard)/dashboard/estudos/page.tsx

// Detectar se formulário foi modificado
const isAnotacaoDirty =
  novaAnotacao.titulo.length > 0 ||
  novaAnotacao.conteudo.length > 0 ||
  textoOriginalIA.length > 0 ||
  anotacaoGeradaIA !== null;

// Usar SafeDialog
<SafeDialog
  open={modalAnotacaoAberto}
  onOpenChange={(open) => {
    if (!open) {
      fecharModalAnotacao();
    } else {
      setModalAnotacaoAberto(true);
    }
  }}
  isDirty={isAnotacaoDirty}
  confirmMessage="Você tem uma anotação não salva. Deseja realmente fechar?"
>
  {/* ... conteúdo do modal ... */}
</SafeDialog>
```

### 4. Proteger Navegação Durante Edição de Página

```typescript
// src/app/(dashboard)/dashboard/estudos/[id]/page.tsx

// Adicionar verificação antes de mudar de módulo/página
const handleSelectModule = (moduloId: string) => {
  if (editandoPagina && paginaSelecionada) {
    const confirmed = window.confirm(
      'Você está editando uma página. Deseja realmente sair sem salvar?'
    );
    if (!confirmed) return;
  }

  carregarModulo(moduloId);
};

const handleSelectPage = (paginaId: string) => {
  if (editandoPagina && paginaSelecionada) {
    const confirmed = window.confirm(
      'Você está editando uma página. Deseja realmente sair sem salvar?'
    );
    if (!confirmed) return;
  }

  carregarPagina(paginaId);
};
```

### 5. Modal de Confirmação Customizado (Melhor UX)

```typescript
// src/components/ui/UnsavedChangesModal.tsx
import { ConfirmModal } from './ConfirmModal';

interface UnsavedChangesModalProps {
  open: boolean;
  onClose: () => void;
  onConfirmLeave: () => void;
  onSave?: () => Promise<void>;
}

export function UnsavedChangesModal({
  open,
  onClose,
  onConfirmLeave,
  onSave,
}: UnsavedChangesModalProps) {
  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirmLeave}
      title="Alterações não salvas"
      description="Você tem alterações não salvas. O que deseja fazer?"
      confirmText="Descartar alterações"
      cancelText="Continuar editando"
      variant="warning"
      extraButton={
        onSave && {
          label: 'Salvar e sair',
          onClick: async () => {
            await onSave();
            onConfirmLeave();
          },
        }
      }
    />
  );
}
```

---

## Comportamento Esperado

1. **Modal com dados**: Ao tentar fechar, exibir confirmação
2. **Modal vazio**: Fechar normalmente sem confirmação
3. **Edição de página**: Avisar antes de navegar para outra página
4. **Navegação de aba**: `beforeunload` deve avisar sobre dados não salvos

---

## Referências

- [React Hook Form - Dirty State](https://react-hook-form.com/docs/useform/formstate)
- [UX Guidelines: Unsaved Changes](https://www.nngroup.com/articles/confirmation-dialog/)
- [MDN: beforeunload event](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event)

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

1. **Página de Estudos (`src/app/(dashboard)/dashboard/estudos/page.tsx`)**:
   - Adicionados estados para controlar modais de confirmação de saída
   - Implementada função `isCursoDirty` para detectar se o formulário de curso tem dados não salvos
   - Implementada função `isAnotacaoDirty` para detectar se o formulário de anotação tem dados não salvos
   - Criadas funções `handleFecharModalCurso` e `handleFecharModalAnotacao` que verificam se há dados não salvos antes de fechar
   - Adicionados modais de confirmação usando `ConfirmModal` com variante "warning"

2. **Página de Detalhes do Curso (`src/app/(dashboard)/dashboard/estudos/[id]/page.tsx`)**:
   - Adicionados estados para controlar modais de confirmação de saída
   - Implementadas funções `isModuloDirty`, `isPaginaModalDirty` e `isPaginaEdicaoDirty` para detectar alterações não salvas
   - Criadas funções `handleFecharModalModulo` e `handleFecharModalPagina` para modais de criação
   - Implementado sistema de navegação segura com `handleSelectModulo` e `handleSelectPagina` que verifica alterações antes de trocar de módulo/página durante edição
   - Adicionado estado `conteudoOriginalPagina` para rastrear o conteúdo original e detectar mudanças
   - Adicionados modais de confirmação para todas as situações de perda de dados

3. **Traduções adicionadas** (`pt.json` e `en.json`):
   - `unsavedChangesTitle`: Título do modal de confirmação
   - `unsavedChangesDescription`: Descrição para modais de criação
   - `unsavedChangesDescriptionPage`: Descrição específica para edição de página
   - `discardChanges`: Botão de descartar alterações
   - `continueEditing`: Botão de continuar editando

### Comportamento Implementado:
- Modal de curso/anotação/módulo/página vazio: fecha normalmente sem confirmação
- Modal com dados preenchidos: exibe modal de confirmação antes de fechar
- Durante edição de página: ao clicar em outro módulo/página, exibe confirmação antes de navegar
