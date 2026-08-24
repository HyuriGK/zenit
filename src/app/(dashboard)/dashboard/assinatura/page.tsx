import { SubscriptionManager } from '@/components/subscriptions/SubscriptionManager';

export const metadata = {
  title: 'Minha Assinatura | Azimov',
  description: 'Gerencie sua assinatura premium',
};

export default function AssinaturaPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Minha Assinatura</h1>
        <p className="text-muted-foreground">
          Gerencie sua assinatura e método de pagamento
        </p>
      </div>

      <SubscriptionManager />
    </div>
  );
}
