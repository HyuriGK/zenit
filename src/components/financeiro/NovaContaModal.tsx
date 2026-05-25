'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface NovaContaModalProps {
  aberto: boolean;
  onFechar: () => void;
  onSucesso: () => void;
}

const CORES_DISPONIVEIS = [
  { nome: 'Verde', valor: '#10B981' },
  { nome: 'Azul', valor: '#3B82F6' },
  { nome: 'Roxo', valor: '#10B981' },
  { nome: 'Rosa', valor: '#EC4899' },
  { nome: 'Laranja', valor: '#F59E0B' },
  { nome: 'Vermelho', valor: '#EF4444' },
  { nome: 'Ciano', valor: '#06B6D4' },
  { nome: 'Índigo', valor: '#6366F1' },
];

export default function NovaContaModal({ aberto, onFechar, onSucesso }: NovaContaModalProps) {
  const [carregando, setCarregando] = useState(false);
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<'CORRENTE' | 'POUPANCA' | 'INVESTIMENTO'>('CORRENTE');
  const [banco, setBanco] = useState('');
  const [saldoInicial, setSaldoInicial] = useState('');
  const [cor, setCor] = useState('#10B981');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);

    try {
      const novaConta = {
        id: crypto.randomUUID(),
        nome,
        tipo,
        banco: banco || undefined,
        saldoInicial: parseFloat(saldoInicial.replace(',', '.')) || 0,
        saldoAtual: parseFloat(saldoInicial.replace(',', '.')) || 0,
        cor,
        icone: 'wallet',
        ativa: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const res = await fetch('/api/financeiro/contas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaConta),
      });
      if (!res.ok) throw new Error('Falha ao criar conta');
      toast.success('Conta criada com sucesso!');
      limparFormulario();
      onSucesso();
      onFechar();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao criar conta.');
    } finally {
      setCarregando(false);
    }
  };

  const limparFormulario = () => {
    setNome('');
    setTipo('CORRENTE');
    setBanco('');
    setSaldoInicial('');
    setCor('#10B981');
  };

  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            Nova Conta Bancária
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div>
            <Label className="text-zinc-300">Nome da Conta *</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Nubank, Banco do Brasil"
              required
              className="bg-zinc-900/50 border-zinc-800 text-white"
            />
          </div>

          {/* Tipo */}
          <div>
            <Label className="text-zinc-300">Tipo *</Label>
            <Select value={tipo} onValueChange={(v: string) => setTipo(v as 'CORRENTE' | 'POUPANCA' | 'INVESTIMENTO')}>
              <SelectTrigger className="bg-zinc-900/50 border-zinc-800 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                <SelectItem value="CORRENTE" className="text-white hover:bg-zinc-800">
                  Conta Corrente
                </SelectItem>
                <SelectItem value="POUPANCA" className="text-white hover:bg-zinc-800">
                  Poupança
                </SelectItem>
                <SelectItem value="INVESTIMENTO" className="text-white hover:bg-zinc-800">
                  Investimento
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Banco */}
          <div>
            <Label className="text-zinc-300">Banco</Label>
            <Input
              value={banco}
              onChange={(e) => setBanco(e.target.value)}
              placeholder="Ex: Nubank, Itaú"
              className="bg-zinc-900/50 border-zinc-800 text-white"
            />
          </div>

          {/* Saldo Inicial */}
          <div>
            <Label className="text-zinc-300">Saldo Inicial</Label>
            <Input
              type="number"
              step="0.01"
              value={saldoInicial}
              onChange={(e) => setSaldoInicial(e.target.value)}
              placeholder="0,00"
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
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {carregando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Criar Conta'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}