'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSession } from '@/lib/auth-mock';

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const { update } = useSession();

  useEffect(() => {
    // Sincronizar automaticamente com o Stripe para garantir que os dados sejam atualizados
    // mesmo se o webhook não disparar (desenvolvimento local sem Stripe CLI)
    const syncSubscription = async () => {
      try {
        // Chamar o endpoint de sincronização
        await fetch('/api/v1/subscriptions/sync', {
          method: 'POST',
        });

        // Aguardar um pouco para o banco ser atualizado
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Forçar atualização da sessão para buscar os dados mais recentes do banco
        await update();
      } catch (error) {
        console.error('Erro ao sincronizar subscription:', error);
        // Mesmo com erro, tentar atualizar a sessão
        await update();
      } finally {
        setIsVerifying(false);
      }
    };

    syncSubscription();
  }, [update]);

  if (isVerifying) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card className="bg-zinc-900/50 border-gray-800">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-green-500" />
            <p className="text-center text-lg text-gray-300">
              Verificando seu pagamento...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card className="bg-zinc-900/50 border-gray-800">
        <CardHeader>
          <div className="flex flex-col items-center space-y-4">
            <div className="rounded-full bg-green-900/30 p-3 border border-green-800">
              <CheckCircle className="h-12 w-12 text-green-400" />
            </div>
            <CardTitle className="text-2xl text-center text-white">
              Pagamento Confirmado!
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-gray-300">
              Sua assinatura premium foi ativada com sucesso!
            </p>
            <p className="text-sm text-gray-400">
              Agora você tem acesso a todos os recursos premium do Azimov.
            </p>
          </div>

          <div className="space-y-2">
            <Button asChild className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700">
              <Link href="/dashboard">Ir para o Dashboard</Link>
            </Button>
            <Button asChild variant="outline" className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">
              <Link href="/dashboard/assinatura">Ver Minha Assinatura</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
