'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Calendar, CreditCard, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SubscriptionStatus {
  plano: 'FREE' | 'PREMIUM';
  planName: string;
  planInterval: 'month' | 'year' | null;
  status: string | null;
  currentPeriodEnd: string | null;
  hasActiveSubscription: boolean;
}

export function SubscriptionManager() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/v1/subscriptions/status');
      if (!response.ok) throw new Error('Erro ao buscar status');

      const data = await response.json();
      setStatus(data);
    } catch (error) {
      toast.error('Erro ao carregar status da assinatura');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleCancelSubscription = async () => {
    if (!confirm('Tem certeza que deseja cancelar sua assinatura? O acesso premium será mantido até o fim do período atual.')) {
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/v1/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ immediately: false }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }

      toast.success('Assinatura cancelada com sucesso');
      await fetchStatus();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao cancelar assinatura');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/v1/subscriptions/reactivate', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }

      toast.success('Assinatura reativada com sucesso');
      await fetchStatus();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao reativar assinatura');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSyncWithStripe = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/v1/subscriptions/sync', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }

      const data = await response.json();
      toast.success(data.message);
      await fetchStatus();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao sincronizar dados');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-zinc-900/50 border-gray-800">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-green-500" />
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card className="bg-zinc-900/50 border-gray-800">
        <CardContent className="py-12 text-center">
          <p className="text-red-400">Erro ao carregar informações da assinatura</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = () => {
    if (status.plano === 'FREE') {
      return <Badge className="bg-gray-700 text-gray-300">Plano Gratuito</Badge>;
    }

    switch (status.status) {
      case 'active':
        return <Badge className="bg-green-600 text-white">Ativo</Badge>;
      case 'past_due':
        return <Badge className="bg-red-600 text-white">Pagamento Atrasado</Badge>;
      case 'canceled':
        return <Badge className="bg-gray-700 text-gray-300">Cancelado</Badge>;
      default:
        return <Badge className="border-gray-700 text-gray-300">{status.status}</Badge>;
    }
  };

  const isCanceled = status.status === 'canceled' || (status.status === 'active' && status.currentPeriodEnd);

  return (
    <Card className="bg-zinc-900/50 border-gray-800">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-white">
              <CreditCard className="h-5 w-5" />
              Minha Assinatura
            </CardTitle>
            <CardDescription className="text-gray-400">Gerencie sua assinatura e método de pagamento</CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informações do Plano */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-800 rounded-lg bg-black/30">
            <div>
              <p className="font-semibold text-white">{status.planName}</p>
              {status.planInterval && (
                <p className="text-sm text-gray-400">
                  Cobrança {status.planInterval === 'month' ? 'mensal' : 'anual'}
                </p>
              )}
            </div>
            <div className="text-right">
              {status.plano === 'PREMIUM' && status.planInterval === 'month' && (
                <p className="text-lg font-bold text-white">R$ 12,90/mês</p>
              )}
              {status.plano === 'PREMIUM' && status.planInterval === 'year' && (
                <p className="text-lg font-bold text-white">R$ 129,00/ano</p>
              )}
              {status.plano === 'FREE' && (
                <p className="text-lg font-bold text-white">R$ 0,00</p>
              )}
            </div>
          </div>

          {/* Próxima Cobrança */}
          {status.hasActiveSubscription && status.currentPeriodEnd && (
            <div className="flex items-center gap-2 p-4 bg-zinc-800/50 rounded-lg border border-gray-800">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-white">
                  {status.status === 'canceled' ? 'Acesso até' : 'Próxima cobrança'}
                </p>
                <p className="text-sm text-gray-400">
                  {format(new Date(status.currentPeriodEnd), "d 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Alerta de Pagamento Atrasado */}
          {status.status === 'past_due' && (
            <div className="flex items-start gap-2 p-4 bg-red-900/20 border border-red-800/50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-400">
                  Problema com o pagamento
                </p>
                <p className="text-sm text-gray-400">
                  Houve um problema ao processar seu último pagamento. Atualize seu método de pagamento para continuar com acesso premium.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex flex-col gap-2">
          {status.plano === 'FREE' && (
            <Button className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white" onClick={() => window.location.href = '/premium'}>
              Assinar Premium
            </Button>
          )}

          {status.plano === 'PREMIUM' && status.status === 'active' && (
            <>
              <Button
                variant="destructive"
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                onClick={handleCancelSubscription}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Cancelar Assinatura'
                )}
              </Button>
            </>
          )}

          {status.status === 'canceled' && (
            <Button
              className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white"
              onClick={handleReactivateSubscription}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Reativar Assinatura'
              )}
            </Button>
          )}

          {/* Botão de sincronização manual */}
          <Button
            variant="outline"
            className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
            onClick={handleSyncWithStripe}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sincronizar com Stripe
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
