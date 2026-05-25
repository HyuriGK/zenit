'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, Target, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface NovoObjetivoModalProps {
  aberto: boolean;
  onFechar: () => void;
  onSucesso: () => void;
}

const CORES_DISPONIVEIS = [
  { nome: 'Laranja', valor: '#F59E0B' },
  { nome: 'Roxo', valor: '#10B981' },
  { nome: 'Rosa', valor: '#EC4899' },
  { nome: 'Verde', valor: '#10B981' },
  { nome: 'Azul', valor: '#3B82F6' },
  { nome: 'Vermelho', valor: '#EF4444' },
  { nome: 'Ciano', valor: '#06B6D4' },
  { nome: 'Índigo', valor: '#6366F1' },
];

export default function NovoObjetivoModal({ aberto, onFechar, onSucesso }: NovoObjetivoModalProps) {
  const [carregando, setCarregando] = useState(false);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valorMeta, setValorMeta] = useState('');
  const [dataMeta, setDataMeta] = useState('');
  const [isReservaEmergencia, setIsReservaEmergencia] = useState(false);
  const [cor, setCor] = useState('#F59E0B');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);

    try {
      const novoObjetivo = {
        id: crypto.randomUUID(),
        nome,
        descricao: descricao || undefined,
        valorMeta: parseFloat(valorMeta.replace(',', '.')),
        valorAtual: 0,
        dataInicio: new Date(),
        dataMeta: dataMeta ? new Date(dataMeta) : undefined,
        isReservaEmergencia,
        cor,
        icone: isReservaEmergencia ? 'shield' : 'target',
        status: 'EM_ANDAMENTO' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const res = await fetch('/api/financeiro/objetivos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoObjetivo),
      });
      if (!res.ok) throw new Error('Falha ao criar objetivo');
      toast.success('Objetivo criado com sucesso!');
      limparFormulario();
      onSucesso();
      onFechar();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao criar objetivo.');
    } finally {
      setCarregando(false);
    }
  };

  const limparFormulario = () => {
    setNome('');
    setDescricao('');
    setValorMeta('');
    setDataMeta('');
    setIsReservaEmergencia(false);
    setCor('#F59E0B');
  };

  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
            {isReservaEmergencia ? (
              <>
                <Shield className="w-6 h-6 text-blue-400" />
                Nova Reserva de Emergência
              </>
            ) : (
              <>
                <Target className="w-6 h-6 text-orange-400" />
                Novo Objetivo Financeiro
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de Objetivo */}
          <div className="flex items-center justify-between p-3 bg-zinc-900/30 rounded-lg border border-zinc-800">
            <div>
              <Label className="text-zinc-300">Reserva de Emergência</Label>
              <p className="text-xs text-zinc-500">Objetivo prioritário de segurança</p>
            </div>
            <Switch
              checked={isReservaEmergencia}
              onCheckedChange={setIsReservaEmergencia}
            />
          </div>

          {/* Nome */}
          <div>
            <Label className="text-zinc-300">Nome do Objetivo *</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder={isReservaEmergencia ? "Ex: Fundo de Emergência" : "Ex: Viagem para Paris"}
              required
              className="bg-zinc-900/50 border-zinc-800 text-white"
            />
          </div>

          {/* Descrição */}
          <div>
            <Label className="text-zinc-300">Descrição</Label>
            <Textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva seu objetivo..."
              rows={3}
              className="bg-zinc-900/50 border-zinc-800 text-white resize-none"
            />
          </div>

          {/* Valor Meta */}
          <div>
            <Label className="text-zinc-300">Valor da Meta *</Label>
            <Input
              type="number"
              step="0.01"
              value={valorMeta}
              onChange={(e) => setValorMeta(e.target.value)}
              placeholder="0,00"
              required
              className="bg-zinc-900/50 border-zinc-800 text-white"
            />
            {isReservaEmergencia && valorMeta && (
              <p className="text-xs text-zinc-500 mt-1">
                💡 Recomendação: 6 meses de despesas mensais
              </p>
            )}
          </div>

          {/* Data Meta */}
          <div>
            <Label className="text-zinc-300">Data da Meta</Label>
            <Input
              type="date"
              value={dataMeta}
              onChange={(e) => setDataMeta(e.target.value)}
              className="bg-zinc-900/50 border-zinc-800 text-white"
            />
          </div>

          {/* Cor */}
          <div>
            <Label className="text-zinc-300">Cor</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {CORES_DISPONIVEIS.map((corOpt) => (
                <button
                  key={corOpt.valor}
                  type="button"
                  onClick={() => setCor(corOpt.valor)}
                  className={`h-10 rounded-lg transition-all ${cor === corOpt.valor ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : ''
                    }`}
                  style={{ backgroundColor: corOpt.valor }}
                  title={corOpt.nome}
                />
              ))}
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="default"
              onClick={onFechar}
              className="flex-1 border-zinc-800 hover:bg-zinc-800"
              disabled={carregando}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={carregando}
              className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
            >
              {carregando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Criar Objetivo'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}