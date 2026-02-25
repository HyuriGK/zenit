'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Crown, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { usePlano } from '@/hooks/usePlano';
import { PlanoUsuario } from '@/types/planos';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Componente para gerenciar e testar mudanças de plano
 * Útil para desenvolvimento e testes
 */
export function PlanoManager() {
  const { planoOriginal, ehPremium, atualizarPlano, refreshSessao, isUpdating } = usePlano();
  const [isChanging, setIsChanging] = useState(false);

  const handleTogglePlano = async () => {
    setIsChanging(true);
    try {
      const novoPlano = ehPremium ? PlanoUsuario.FREE : PlanoUsuario.PREMIUM;

      await atualizarPlano(novoPlano);

      toast.success(`Plano alterado para ${novoPlano} com sucesso!`);
    } catch (error) {
      console.error('Erro ao alterar plano:', error);
      toast.error('Erro ao alterar plano');
    } finally {
      setIsChanging(false);
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshSessao();
      toast.success('Sessão atualizada!');
    } catch (error) {
      console.error('Erro ao atualizar sessão:', error);
      toast.error('Erro ao atualizar sessão');
    }
  };

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Crown className={`w-5 h-5 ${ehPremium ? 'text-green-500' : 'text-gray-500'}`} />
              Gerenciar Plano
            </CardTitle>
            <CardDescription>
              Altere seu plano e teste as permissões
            </CardDescription>
          </div>
          <Badge variant={ehPremium ? 'default' : 'secondary'} className={ehPremium ? 'bg-green-500' : ''}>
            {planoOriginal}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleTogglePlano}
            disabled={isChanging || isUpdating}
            className="flex-1"
            variant={ehPremium ? 'outline' : 'default'}
          >
            {isChanging ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Alterando...
              </>
            ) : (
              <>
                <Crown className="w-4 h-4 mr-2" />
                {ehPremium ? 'Mudar para FREE' : 'Fazer Upgrade para PREMIUM'}
              </>
            )}
          </Button>

          <Button
            onClick={handleRefresh}
            disabled={isUpdating}
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
            Atualizar Sessão
          </Button>
        </div>

        <div className="text-sm text-gray-400 bg-zinc-950/50 p-3 rounded-lg">
          <p className="font-semibold text-gray-300 mb-1">Como funciona:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Clique no botão para alternar entre FREE e PREMIUM</li>
            <li>A sessão é atualizada automaticamente após a mudança</li>
            <li>O status no header será atualizado em até 30 segundos</li>
            <li>Você pode forçar atualização clicando em "Atualizar Sessão"</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
