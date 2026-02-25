# Correção do Problema de Datas de Expiração Nulas

## Problema Identificado

A coluna `planoExpiraEm` estava com valor `NULL` no banco de dados mesmo após fazer a assinatura premium, porque:

1. **Possível status não considerado**: O webhook só considerava assinaturas com status `active` como PREMIUM, ignorando outros status válidos como `trialing` e `past_due`.

2. **Webhook pode não ter disparado**: Quando você fez o teste, é possível que o webhook não tenha sido disparado ou processado corretamente.

## Correções Implementadas

### 1. Melhorias no Webhook ([src/app/api/webhooks/stripe/route.ts](src/app/api/webhooks/stripe/route.ts))

**O que foi corrigido:**
- Agora o webhook considera como PREMIUM as subscriptions com status: `active`, `trialing` e `past_due`
- Adicionado logging mais detalhado para facilitar o debug

**Código atualizado (linhas 83-91):**
```typescript
// Determinar o plano baseado no status da subscription
// Considera PREMIUM se estiver ativo, em trial ou com pagamento atrasado
const isPremium = ['active', 'trialing', 'past_due'].includes(subscription.status);
const plano = isPremium ? 'PREMIUM' : 'FREE';

// Data de expiração do período atual
const planoExpiraEm = subscription.current_period_end
  ? new Date(subscription.current_period_end * 1000)
  : null;
```

### 2. Novo Endpoint de Sincronização Manual ([src/app/api/v1/subscriptions/sync/route.ts](src/app/api/v1/subscriptions/sync/route.ts))

**Criado um endpoint que:**
- Consulta diretamente as subscriptions no Stripe
- Busca a subscription ativa mais recente do usuário
- Atualiza o banco de dados com as informações corretas
- Funciona independentemente do webhook

**Como funciona:**
1. Faz uma chamada `POST /api/v1/subscriptions/sync`
2. Busca todas as subscriptions do customer no Stripe
3. Encontra a subscription ativa ou em trial
4. Atualiza o banco com:
   - `plano`: PREMIUM ou FREE
   - `planoExpiraEm`: Data correta baseada em `current_period_end` do Stripe
   - `stripeSubscriptionStatus`: Status atual
   - `stripePriceId`: ID do plano (mensal ou anual)
   - `stripeCurrentPeriodEnd`: Mesma data de expiração

### 3. Botão de Sincronização na Interface ([src/components/subscriptions/SubscriptionManager.tsx](src/components/subscriptions/SubscriptionManager.tsx))

**Adicionado:**
- Botão "Sincronizar com Stripe" na página de assinatura
- Permite que o usuário force a sincronização dos dados
- Útil para corrigir discrepâncias entre Stripe e banco de dados

## Como Usar - Corrigir Sua Assinatura Atual

### Opção 1: Usar o Botão de Sincronização (Recomendado)

1. Acesse a aplicação e faça login
2. Vá para `/dashboard/assinatura`
3. Role até o final da página
4. Clique no botão **"Sincronizar com Stripe"**
5. Aguarde a mensagem de sucesso
6. Recarregue a página para ver os dados atualizados

### Opção 2: Chamar o Endpoint via cURL

```bash
# Substitua SEU_TOKEN pelo token de autenticação
curl -X POST http://localhost:3000/api/v1/subscriptions/sync \
  -H "Cookie: next-auth.session-token=SEU_TOKEN"
```

### Opção 3: Consultar Diretamente no Banco de Dados

Se você quiser verificar o que foi corrigido:

```sql
-- Ver os dados atuais da sua conta
SELECT
  email,
  plano,
  planoExpiraEm,
  stripeSubscriptionStatus,
  stripePriceId,
  stripeCurrentPeriodEnd
FROM users
WHERE email = 'seu-email@exemplo.com';
```

## Verificar se o Webhook Está Funcionando

### Desenvolvimento Local

1. Certifique-se de que o Stripe CLI está rodando:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

2. No terminal do Stripe CLI, você verá logs sempre que um evento for enviado

3. Teste manualmente disparando um evento:
   ```bash
   stripe trigger customer.subscription.updated
   ```

### Produção

1. Acesse o [Dashboard do Stripe](https://dashboard.stripe.com)
2. Vá em **Developers** → **Webhooks**
3. Clique no seu webhook endpoint
4. Verifique os logs recentes
5. Se houver erros, eles aparecerão aqui

## Como Funciona a Lógica de Datas

### Plano Mensal
- Quando você assina um plano mensal no Stripe
- O Stripe define `current_period_end` como **data atual + 1 mês**
- Exemplo: Assinou em 13/01/2026 → `planoExpiraEm` = 13/02/2026

### Plano Anual
- Quando você assina um plano anual no Stripe
- O Stripe define `current_period_end` como **data atual + 1 ano**
- Exemplo: Assinou em 13/01/2026 → `planoExpiraEm` = 13/01/2027

### Renovação Automática
- O Stripe cobra automaticamente quando chega a data de `current_period_end`
- Se o pagamento for bem-sucedido:
  - Webhook `invoice.payment_succeeded` é disparado
  - `planoExpiraEm` é atualizado para o próximo período
  - Exemplo mensal: 13/02/2026 → 13/03/2026
  - Exemplo anual: 13/01/2027 → 13/01/2028

## Próximos Passos

### Após Corrigir os Dados

1. ✅ Verifique se `planoExpiraEm` agora tem uma data válida
2. ✅ Confirme se a data está correta (1 mês ou 1 ano a partir da assinatura)
3. ✅ Teste se os recursos premium estão funcionando

### Para Prevenir Problemas Futuros

1. **Certifique-se de que o webhook está configurado** tanto em desenvolvimento quanto em produção
2. **Monitore os logs do webhook** para identificar erros rapidamente
3. **Use o botão de sincronização** se notar alguma inconsistência

## Debugging

### Se o problema persistir:

1. **Verifique o Customer ID no Stripe:**
   ```sql
   SELECT stripeCustomerId FROM users WHERE email = 'seu-email@exemplo.com';
   ```

2. **Procure a subscription no Stripe Dashboard:**
   - Acesse [Stripe Dashboard](https://dashboard.stripe.com)
   - Vá em **Customers**
   - Busque pelo Customer ID
   - Verifique se há uma subscription ativa

3. **Verifique os logs do servidor:**
   - Procure por mensagens como `Subscription updated for user:`
   - Verifique se `planoExpiraEm` está sendo calculado corretamente

4. **Verifique se há múltiplas subscriptions:**
   - No Stripe Dashboard, veja se o customer tem mais de uma subscription
   - Cancele as subscriptions duplicadas se houver

## Suporte Técnico

Se ainda encontrar problemas:
1. Verifique os logs do servidor Next.js
2. Verifique os logs do webhook no Stripe Dashboard
3. Use o endpoint `/api/v1/subscriptions/sync` para forçar sincronização
4. Consulte o banco de dados diretamente para ver o que foi salvo

## Resumo das Mudanças

| Arquivo | Mudança | Motivo |
|---------|---------|--------|
| [src/app/api/webhooks/stripe/route.ts](src/app/api/webhooks/stripe/route.ts) | Considera múltiplos status como PREMIUM | Evitar perder assinaturas válidas |
| [src/app/api/v1/subscriptions/sync/route.ts](src/app/api/v1/subscriptions/sync/route.ts) | Novo endpoint de sincronização | Permitir correção manual de dados |
| [src/components/subscriptions/SubscriptionManager.tsx](src/components/subscriptions/SubscriptionManager.tsx) | Botão de sincronização | Interface fácil para usuários |

Todas as mudanças mantêm compatibilidade com o código existente e não quebram funcionalidades atuais.
