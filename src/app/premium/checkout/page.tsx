'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowLeft, Sparkles, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useSession } from '@/lib/auth-mock';

// Importar as constantes do Stripe
// IMPORTANTE: Em componentes Client, apenas NEXT_PUBLIC_* está disponível
const PLANS = {
  MONTHLY: {
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY!,
    amount: 1290,
    name: 'Premium Mensal',
  },
  YEARLY: {
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY!,
    amount: 12900,
    name: 'Premium Anual',
  },
};

// Log para debug: verificar se os priceIds estão corretos
if (typeof window !== 'undefined') {
  console.log('🏷️ PLANS configurados:', {
    monthly: {
      priceId: PLANS.MONTHLY.priceId,
      name: PLANS.MONTHLY.name,
    },
    yearly: {
      priceId: PLANS.YEARLY.priceId,
      name: PLANS.YEARLY.name,
    },
  });
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly'); // Padrão anual
  const [showCheckout, setShowCheckout] = useState(false); // Controla se mostra o checkout

  // Redirecionar usuários premium
  useEffect(() => {
    if (status === 'loading') return;

    if (session?.user?.plano === 'PREMIUM') {
      router.push('/dashboard/assinatura');
    }
  }, [session, status, router]);

  const handleSuccess = () => {
    router.push('/dashboard/assinatura/sucesso');
  };

  const currentPlan = selectedPlan === 'monthly' ? PLANS.MONTHLY : PLANS.YEARLY;

  // Log quando o plano selecionado mudar
  useEffect(() => {
    console.log('📦 Plano selecionado:', {
      selectedPlan,
      planName: currentPlan.name,
      priceId: currentPlan.priceId,
      amount: currentPlan.amount,
    });
  }, [selectedPlan, currentPlan]);

  // Mostrar loading enquanto verifica a sessão
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Card className="bg-zinc-900/50 border-gray-800">
          <CardContent className="flex flex-col items-center justify-center py-12 px-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4"></div>
            <p className="text-gray-300">Verificando sua assinatura...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se já for premium, mostrar mensagem
  if (session?.user?.plano === 'PREMIUM') {
    return (
      <div className="min-h-screen bg-black text-white">
        <header className="border-b border-gray-800 bg-black/80 backdrop-blur-lg">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/premium" className="flex items-center space-x-2">
                <img src="/images/logo-sem-fundo.png" alt="Logo Azimov" className="w-8 h-8 rounded-lg object-contain" />
                <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                  Azimov
                </span>
              </Link>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <Card className="bg-zinc-900/50 border-gray-800">
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="rounded-full bg-green-900/30 p-4 border border-green-800">
                <AlertCircle className="h-12 w-12 text-green-400" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-white">Você já é Premium!</h2>
                <p className="text-gray-400">
                  Você já possui uma assinatura premium ativa.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                <Button
                  asChild
                  className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                >
                  <Link href="/dashboard/assinatura">Gerenciar Assinatura</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                  <Link href="/dashboard">Ir para Dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Processando Assinatura Premium Offline...
          </CardTitle>
          <CardDescription className="text-zinc-400 mt-2">
            Por favor, aguarde enquanto configuramos o seu ambiente.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </CardContent>
      </Card>
    </div>
  );
}
