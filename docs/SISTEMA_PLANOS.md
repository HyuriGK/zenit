# Sistema de Planos e Recursos Premium

Este documento descreve o sistema de planos implementado na plataforma Zenit, que controla o acesso a recursos premium.

## Visão Geral

O sistema suporta dois tipos de planos:
- **FREE**: Plano gratuito com acesso a recursos básicos
- **PREMIUM**: Plano pago com acesso a todos os recursos, incluindo funcionalidades avançadas

## Estrutura do Sistema

### 1. Tipos e Enums (`src/types/planos.ts`)

Define os tipos básicos do sistema:
- `PlanoUsuario`: Enum com os planos disponíveis (FREE, PREMIUM)
- `RecursoPremium`: Enum com os recursos que exigem plano premium
- `RECURSOS_POR_PLANO`: Mapeamento de quais recursos cada plano tem acesso
- `PLANOS_INFO`: Informações detalhadas sobre cada plano

### 2. Helpers (`src/lib/planos-helper.ts`)

Funções utilitárias para verificação de acesso:

```typescript
// Verificar se usuário tem acesso a um recurso
verificarAcessoRecurso(plano, planoExpiraEm, RecursoPremium.GERAR_RESENHA_IA)

// Verificar se é Premium
isPremium(plano)

// Verificar se é Free
isFree(plano)

// Obter plano efetivo considerando expiração
getPlanoEfetivo(plano, planoExpiraEm)
```

### 3. Hook React (`src/hooks/usePlano.ts`)

Hook customizado para uso em componentes React:

```typescript
const {
  plano,
  ehPremium,
  ehFree,
  podeGerarResenhaIA,
  podeSincronizarGoogleCalendar,
  temAcessoARecurso
} = usePlano()
```

### 4. Componentes UI

#### UpgradeToPremiumModal (`src/components/planos/UpgradeToPremiumModal.tsx`)

Modal que mostra os benefícios do plano Premium e redireciona para a página de upgrade.

```typescript
<UpgradeToPremiumModal
  open={showModal}
  onClose={() => setShowModal(false)}
  recurso="Nome do Recurso"
  descricao="Descrição do porquê precisa de Premium"
/>
```

## Recursos Premium Implementados

### 1. Geração de Resenhas com IA

**Localização**: Biblioteca de Livros/Filmes

**Verificação**:
- **Backend**: `src/app/api/generate-review/route.ts`
- **Frontend**: `src/components/leituras/GenerateReviewButton.tsx`

**Como funciona**:
1. Usuário clica em "Gerar Resenha"
2. Sistema verifica se o usuário tem plano Premium
3. Se FREE: Mostra modal de upgrade
4. Se PREMIUM: Gera a resenha usando IA

### 2. Sincronização com Google Calendar

**Localização**: Módulo de Agenda

**Verificação**:
- **Backend**:
  - `src/app/api/v1/agenda/compromissos/route.ts` (criar)
  - `src/app/api/v1/agenda/compromissos/[id]/route.ts` (editar)
- **Frontend**: `src/components/features/agenda/CompromissoForm.tsx`

**Como funciona**:
1. Usuário marca checkbox "Enviar para Google Agenda"
2. Sistema verifica se o usuário tem plano Premium
3. Se FREE: Checkbox fica desabilitado e mostra ícone de Premium
4. Se PREMIUM: Sincroniza com Google Calendar

## Adicionar Novo Recurso Premium

Para adicionar um novo recurso premium, siga estes passos:

### 1. Adicionar o recurso em `src/types/planos.ts`

```typescript
export enum RecursoPremium {
  GERAR_RESENHA_IA = 'GERAR_RESENHA_IA',
  SINCRONIZAR_GOOGLE_CALENDAR = 'SINCRONIZAR_GOOGLE_CALENDAR',
  // Adicione o novo recurso aqui
  MEU_NOVO_RECURSO = 'MEU_NOVO_RECURSO',
}

// Adicione ao array do PREMIUM
export const RECURSOS_POR_PLANO: Record<PlanoUsuario, RecursoPremium[]> = {
  [PlanoUsuario.PREMIUM]: [
    RecursoPremium.GERAR_RESENHA_IA,
    RecursoPremium.SINCRONIZAR_GOOGLE_CALENDAR,
    RecursoPremium.MEU_NOVO_RECURSO, // Adicione aqui
  ],
}
```

### 2. Adicionar verificação no backend

```typescript
import { verificarAcessoRecurso } from '@/lib/planos-helper';
import { RecursoPremium } from '@/types/planos';

// Na sua rota de API
const acessoRecurso = verificarAcessoRecurso(
  user.plano,
  user.planoExpiraEm,
  RecursoPremium.MEU_NOVO_RECURSO
);

if (!acessoRecurso.temAcesso) {
  return NextResponse.json(
    {
      error: acessoRecurso.motivo || 'Recurso disponível apenas para Premium',
      planoAtual: acessoRecurso.planoEfetivo,
      recursoNecessario: RecursoPremium.MEU_NOVO_RECURSO
    },
    { status: 403 }
  );
}
```

### 3. Adicionar verificação no frontend

```typescript
import { usePlano } from '@/hooks/usePlano';
import { UpgradeToPremiumModal } from '@/components/planos/UpgradeToPremiumModal';

function MeuComponente() {
  const { temAcessoARecurso } = usePlano();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleClick = () => {
    if (!temAcessoARecurso(RecursoPremium.MEU_NOVO_RECURSO)) {
      setShowUpgradeModal(true);
      return;
    }

    // Executar funcionalidade
  };

  return (
    <>
      <Button onClick={handleClick}>Minha Funcionalidade</Button>

      <UpgradeToPremiumModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        recurso="Meu Novo Recurso"
        descricao="Este recurso está disponível apenas para Premium."
      />
    </>
  );
}
```

## Gerenciar Planos de Usuários

### Via API

```typescript
// GET - Obter plano atual
fetch('/api/v1/planos')

// PUT - Atualizar plano (administrativo)
fetch('/api/v1/planos', {
  method: 'PUT',
  body: JSON.stringify({
    plano: 'PREMIUM',
    planoExpiraEm: '2026-02-10' // Opcional
  })
})
```

### Via Banco de Dados

```sql
-- Tornar usuário Premium por 30 dias
UPDATE users
SET
  plano = 'PREMIUM',
  plano_expira_em = NOW() + INTERVAL '30 days'
WHERE email = 'usuario@exemplo.com';

-- Tornar usuário Free
UPDATE users
SET
  plano = 'FREE',
  plano_expira_em = NULL
WHERE email = 'usuario@exemplo.com';
```

## Integração com Sistema de Pagamento

Quando implementar pagamentos (Stripe, Mercado Pago, etc.), você deve:

1. **Após pagamento bem-sucedido**:
```typescript
await prisma.user.update({
  where: { id: userId },
  data: {
    plano: PlanoUsuario.PREMIUM,
    planoExpiraEm: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
  }
});
```

2. **Webhook de renovação**:
```typescript
// Ao receber webhook de renovação
await prisma.user.update({
  where: { id: userId },
  data: {
    planoExpiraEm: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  }
});
```

3. **Webhook de cancelamento**:
```typescript
// Ao receber webhook de cancelamento
await prisma.user.update({
  where: { id: userId },
  data: {
    plano: PlanoUsuario.FREE,
    planoExpiraEm: null
  }
});
```

## Testando o Sistema

### Teste Manual

1. **Como usuário Free**:
   - Faça login com uma conta que tenha `plano = 'FREE'`
   - Tente gerar uma resenha → Deve mostrar modal de upgrade
   - Tente sincronizar com Google → Opção deve estar desabilitada

2. **Como usuário Premium**:
   - Atualize seu usuário no banco: `UPDATE users SET plano = 'PREMIUM' WHERE email = 'seu@email.com'`
   - Tente gerar uma resenha → Deve funcionar normalmente
   - Tente sincronizar com Google → Deve estar habilitado

### Teste de Expiração

```sql
-- Criar usuário Premium que expirou ontem
UPDATE users
SET
  plano = 'PREMIUM',
  plano_expira_em = NOW() - INTERVAL '1 day'
WHERE email = 'teste@exemplo.com';
```

O sistema deve tratá-lo como FREE automaticamente.

## Fluxo de Upgrade

1. Usuário tenta usar recurso premium
2. Sistema detecta que é FREE
3. Mostra `UpgradeToPremiumModal`
4. Usuário clica em "Fazer Upgrade"
5. Redireciona para `/premium`
6. Página `/premium` deve conter:
   - Comparação de planos
   - Botão de pagamento
   - Integração com gateway de pagamento

## Observações Importantes

- O plano do usuário é carregado na sessão NextAuth (`src/lib/auth/authOptions.ts`)
- A verificação acontece tanto no backend (segurança) quanto no frontend (UX)
- Recursos Premium devem SEMPRE ter verificação no backend
- A verificação no frontend é apenas para melhorar a experiência do usuário
- Use o hook `usePlano()` em componentes React para facilitar as verificações
