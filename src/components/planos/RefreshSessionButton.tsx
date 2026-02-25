'use client';

import { useState } from 'react';
import { useSession } from '@/lib/auth-mock';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Botão para forçar atualização da sessão
 * Útil após mudar o plano do usuário no banco
 */
export function RefreshSessionButton() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { update } = useSession();

  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      // Forçar atualização da sessão
      await update();

      // Recarregar a página para aplicar mudanças
      window.location.reload();

      toast.success('Sessão atualizada!');
    } catch (error) {
      console.error('Erro ao atualizar sessão:', error);
      toast.error('Erro ao atualizar sessão');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Button
      onClick={handleRefresh}
      disabled={isRefreshing}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      {isRefreshing ? 'Atualizando...' : 'Atualizar Sessão'}
    </Button>
  );
}
