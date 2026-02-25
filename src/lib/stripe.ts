// Mocked Stripe client for offline Zenit usage
// Removed stripe dependency to allow building completely offline

export const stripe = new Proxy({} as any, {
  get: () => {
    return new Proxy({} as any, {
      get: () => {
        return async () => {
          console.warn('Called mocked stripe instance offline');
          return null;
        }
      }
    });
  }
});

// Informações dos planos
export const PLANS = {
  MONTHLY: {
    priceId: 'mock_price_monthly',
    amount: 1290, // R$ 12,90 em centavos
    interval: 'month' as const,
    name: 'Premium Mensal',
  },
  YEARLY: {
    priceId: 'mock_price_yearly',
    amount: 12900, // R$ 129,00 em centavos
    interval: 'year' as const,
    name: 'Premium Anual',
  },
};

export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name?: string | null
): Promise<string> {
  return 'cus_mock123';
}

export async function createSubscriptionWithIntent(
  customerId: string,
  priceId: string
): Promise<{ subscriptionId: string; clientSecret: string; type: 'payment' | 'setup' }> {
  return {
    subscriptionId: 'sub_mock123',
    clientSecret: 'secret_mock123',
    type: 'payment',
  };
}

export async function cancelSubscription(
  subscriptionId: string,
  immediately: boolean = false
): Promise<any> {
  return { id: subscriptionId, status: 'canceled' };
}

export async function reactivateSubscription(
  subscriptionId: string
): Promise<any> {
  return { id: subscriptionId, status: 'active' };
}

export async function updateSubscriptionPlan(
  subscriptionId: string,
  newPriceId: string
): Promise<any> {
  return { id: subscriptionId, status: 'active' };
}

export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  return returnUrl;
}
