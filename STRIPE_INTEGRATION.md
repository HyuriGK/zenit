# Integração Stripe - Zenit

Este documento descreve a integração completa do Stripe no projeto Zenit para gerenciamento de assinaturas premium.

## Visão Geral

A integração permite que usuários assinem planos premium (mensal ou anual) com checkout embarcado usando Stripe Elements. O sistema gerencia automaticamente:

- Criação e atualização de assinaturas
- Processamento de pagamentos recorrentes
- Cancelamento e reativação de assinaturas
- Sincronização automática do status via webhooks
- Interface de gerenciamento de assinatura

## Arquitetura

### 1. Modelos de Dados (Prisma)

Campos adicionados ao modelo `User`:

```prisma
model User {
  // ... outros campos

  // Integração Stripe
  stripeCustomerId            String?     @unique
  stripeSubscriptionId        String?     @unique
  stripeSubscriptionStatus    String?     // active, canceled, past_due, etc
  stripePriceId               String?     // ID do plano (mensal ou anual)
  stripeCurrentPeriodEnd      DateTime?   // Fim do período de cobrança
}
```

### 2. Serviços e Helpers

**[src/lib/stripe.ts](src/lib/stripe.ts)**
- Cliente Stripe configurado
- Constantes dos planos (MONTHLY, YEARLY)
- Funções auxiliares:
  - `getOrCreateStripeCustomer()` - Cria/obtém cliente Stripe
  - `createSubscription()` - Cria nova assinatura
  - `cancelSubscription()` - Cancela assinatura
  - `reactivateSubscription()` - Reativa assinatura cancelada
  - `updateSubscriptionPlan()` - Troca entre planos
  - `createCustomerPortalSession()` - Portal de gerenciamento

### 3. Endpoints de API

#### **POST /api/v1/subscriptions/create-checkout**
Cria uma sessão de checkout para nova assinatura.

**Body:**
```json
{
  "priceId": "price_xxx" // ID do plano (mensal ou anual)
}
```

**Response:**
```json
{
  "subscriptionId": "sub_xxx",
  "clientSecret": "pi_xxx_secret_xxx"
}
```

#### **GET /api/v1/subscriptions/status**
Retorna o status atual da assinatura do usuário.

**Response:**
```json
{
  "plano": "PREMIUM",
  "planName": "Premium Mensal",
  "planInterval": "month",
  "status": "active",
  "currentPeriodEnd": "2026-02-13T00:00:00.000Z",
  "hasActiveSubscription": true
}
```

#### **POST /api/v1/subscriptions/cancel**
Cancela a assinatura do usuário.

**Body:**
```json
{
  "immediately": false // Se true, cancela imediatamente. Se false, mantém até fim do período
}
```

#### **POST /api/v1/subscriptions/reactivate**
Reativa uma assinatura previamente cancelada (antes do fim do período).

#### **POST /api/v1/subscriptions/change-plan**
Troca entre plano mensal e anual.

**Body:**
```json
{
  "newPriceId": "price_xxx"
}
```

### 4. Webhook

**POST /api/webhooks/stripe**

Processa eventos do Stripe:

- `customer.subscription.created` - Nova assinatura criada
- `customer.subscription.updated` - Assinatura atualizada
- `customer.subscription.deleted` - Assinatura cancelada
- `invoice.payment_succeeded` - Pagamento bem-sucedido
- `invoice.payment_failed` - Falha no pagamento

O webhook atualiza automaticamente:
- Status da assinatura no banco de dados
- Plano do usuário (FREE/PREMIUM)
- Data de expiração do período atual

### 5. Componentes React

#### **[SubscriptionCheckout](src/components/subscriptions/SubscriptionCheckout.tsx)**
Componente principal que encapsula o checkout embarcado.

**Props:**
- `priceId`: ID do plano selecionado
- `planName`: Nome do plano para exibição
- `onSuccess?`: Callback quando pagamento é bem-sucedido

#### **[CheckoutForm](src/components/subscriptions/CheckoutForm.tsx)**
Formulário de pagamento usando Stripe Elements.

#### **[SubscriptionManager](src/components/subscriptions/SubscriptionManager.tsx)**
Interface para gerenciar assinatura existente (cancelar, reativar).

### 6. Páginas

- **[/dashboard/assinatura](src/app/(dashboard)/dashboard/assinatura/page.tsx)** - Página de gerenciamento de assinatura
- **[/premium/checkout](src/app/premium/checkout/page.tsx)** - Página de checkout com seleção de plano
- **[/dashboard/assinatura/sucesso](src/app/(dashboard)/dashboard/assinatura/sucesso/page.tsx)** - Página de confirmação após pagamento

## Configuração

### 1. Criar Conta no Stripe

1. Acesse [stripe.com](https://stripe.com) e crie uma conta
2. Ative o modo de teste
3. Acesse o Dashboard

### 2. Criar Produtos e Preços

No Dashboard do Stripe:

1. Vá em **Produtos** → **Adicionar produto**
2. Crie o produto "Zenit Premium" 
3. Adicione dois preços:
   - **Mensal**: R$ 12,90 com cobrança mensal recorrente
   - **Anual**: R$ 129,00 com cobrança anual recorrente
4. Copie os IDs dos preços (começam com `price_`)

### 3. Configurar Variáveis de Ambiente

Adicione no arquivo `.env`:

```env
# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_xxxxxxxxxxxxxxxx"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_xxxxxxxxxxxxxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxx"

# Price IDs do Dashboard do Stripe
STRIPE_PRICE_MONTHLY="price_xxxxxxxx"
STRIPE_PRICE_YEARLY="price_xxxxxxxx"
NEXT_PUBLIC_STRIPE_PRICE_MONTHLY="price_xxxxxxxx"
NEXT_PUBLIC_STRIPE_PRICE_YEARLY="price_xxxxxxxx"
```

**Onde encontrar:**
- `STRIPE_SECRET_KEY`: Dashboard → Developers → API keys → Secret key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Dashboard → Developers → API keys → Publishable key
- Price IDs: Dashboard → Produtos → Clique no produto → Copie o ID de cada preço

### 4. Configurar Webhook

#### Desenvolvimento Local (usando Stripe CLI)

1. Instale o Stripe CLI: https://stripe.com/docs/stripe-cli
2. Execute:
   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
3. Copie o webhook secret que aparece (começa com `whsec_`) e adicione no `.env`

#### Produção

1. No Dashboard do Stripe, vá em **Developers** → **Webhooks**
2. Clique em **Add endpoint**
3. URL do endpoint: `https://seudominio.com/api/webhooks/stripe`
4. Selecione os eventos:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copie o webhook secret e adicione no `.env` de produção

### 5. Aplicar Migrations do Prisma

```bash
npx prisma db push
# ou em produção
npx prisma migrate deploy
```

## Fluxo de Uso

### 1. Usuário Assina Premium

1. Usuário clica em "Assinar Premium" no dashboard
2. É redirecionado para `/premium/checkout`
3. Seleciona plano (mensal ou anual)
4. Preenche dados do cartão no formulário Stripe Elements
5. Clica em "Assinar Agora"
6. Stripe processa o pagamento
7. Usuário é redirecionado para `/dashboard/assinatura/sucesso`
8. Webhook atualiza status no banco de dados
9. Usuário agora tem acesso a recursos premium

### 2. Usuário Gerencia Assinatura

1. Acessa `/dashboard/assinatura`
2. Visualiza informações da assinatura:
   - Status (ativo, cancelado, etc)
   - Plano atual
   - Próxima data de cobrança
   - Valor
3. Pode:
   - Cancelar assinatura (mantém acesso até fim do período)
   - Reativar assinatura cancelada
   - Trocar de plano (mensal ↔ anual)

### 3. Renovação Automática

- Stripe cobra automaticamente no início de cada período
- Se pagamento for bem-sucedido:
  - Webhook `invoice.payment_succeeded` é disparado
  - Sistema atualiza `stripeCurrentPeriodEnd` no banco
  - Usuário continua com acesso premium
- Se pagamento falhar:
  - Webhook `invoice.payment_failed` é disparado
  - Status muda para `past_due`
  - Usuário vê alerta para atualizar método de pagamento
  - Stripe tenta cobrar novamente automaticamente

## Testes

### Cartões de Teste

Use estes números de cartão no modo de teste:

- **Sucesso**: `4242 4242 4242 4242`
- **Falha**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

**Dados adicionais:**
- Data de validade: Qualquer data futura
- CVC: Qualquer 3 dígitos
- CEP: Qualquer

### Testar Webhook Localmente

```bash
# Terminal 1: Iniciar o app
npm run dev

# Terminal 2: Iniciar o Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Terminal 3: Disparar evento de teste
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed
```

## Segurança

- ✅ Webhook assinado com secret para prevenir ataques
- ✅ Todas as rotas de API verificam autenticação
- ✅ Validação de ownership (usuário só acessa suas próprias assinaturas)
- ✅ API keys nunca expostas no client-side
- ✅ Payment Intent com confirmação server-side
- ✅ PCI-compliance garantido pelo Stripe Elements

## Troubleshooting

### Erro: "Missing stripe-signature header"
- Verifique se o webhook está configurado corretamente
- Confirme que `STRIPE_WEBHOOK_SECRET` está no `.env`

### Erro: "Invalid signature"
- O webhook secret está incorreto
- Pegue o secret correto no Dashboard ou Stripe CLI

### Pagamento não atualiza o plano do usuário
- Verifique se o webhook está recebendo eventos
- Confira os logs do webhook em `/api/webhooks/stripe`
- Confirme que o `stripeCustomerId` está sendo salvo corretamente

### Usuário não consegue cancelar
- Verifique se `stripeSubscriptionId` está salvo no banco
- Confirme que a API key tem permissões corretas

## Próximos Passos (Opcional)

- [ ] Adicionar desconto para estudantes
- [ ] Implementar cupons promocionais
- [ ] Adicionar período de trial gratuito
- [ ] Suporte a múltiplos métodos de pagamento (PIX, boleto)
- [ ] Dashboard de analytics de assinaturas
- [ ] Email notifications para eventos importantes
- [ ] Testes automatizados end-to-end

## Referências

- [Stripe Subscriptions Docs](https://stripe.com/docs/billing/subscriptions/overview)
- [Stripe Elements React](https://stripe.com/docs/stripe-js/react)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Testing](https://stripe.com/docs/testing)

## Suporte

Para questões sobre a integração, consulte:
- Documentação oficial do Stripe
- [Stripe Support](https://support.stripe.com/)
