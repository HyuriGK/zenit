'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { db } from '@/lib/dexie';

interface NovoCartaoModalProps {
  aberto: boolean;
  onFechar: () => void;
  onSucesso: () => void;
}

const CORES_DISPONIVEIS = [
  { nome: 'Azul', valor: '#3B82F6' },
  { nome: 'Roxo', valor: '#10B981' },
  { nome: 'Rosa', valor: '#EC4899' },
  { nome: 'Verde', valor: '#10B981' },
  { nome: 'Laranja', valor: '#F59E0B' },
  { nome: 'Vermelho', valor: '#EF4444' },
  { nome: 'Ciano', valor: '#06B6D4' },
  { nome: 'Índigo', valor: '#6366F1' },
];

export default function NovoCartaoModal({ aberto, onFechar, onSucesso }: NovoCartaoModalProps) {
  const [carregando, setCarregando] = useState(false);
  const [nome, setNome] = useState('');
  const [bandeira, setBandeira] = useState('');
  const [ultimosDigitos, setUltimosDigitos] = useState('');
  const [limite, setLimite] = useState('');
  const [diaVencimento, setDiaVencimento] = useState('');
  const [diaFechamento, setDiaFechamento] = useState('');
  const [cor, setCor] = useState('#3B82F6');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);

    try {
      const novoCartao = {
        id: crypto.randomUUID(),
        nome,
        bandeira: bandeira || undefined,
        ultimosDigitos: ultimosDigitos || undefined,
        limite: limite ? parseFloat(limite.replace(',', '.')) : undefined,
        diaVencimento: diaVencimento ? parseInt(diaVencimento) : undefined,
        diaFechamento: diaFechamento ? parseInt(diaFechamento) : undefined,
        cor,
        icone: 'credit-card',
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.cartoes.add(novoCartao);

      limparFormulario();
      onSucesso();
      onFechar();
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao criar cartão');
    } finally {
      setCarregando(false);
    }
  };

  const limparFormulario = () => {
    setNome('');
    setBandeira('');
    setUltimosDigitos('');
    setLimite('');
    setDiaVencimento('');
    setDiaFechamento('');
    setCor('#3B82F6');
  };

  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            Novo Cartão de Crédito
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div>
            <Label className="text-zinc-300">Nome do Cartão *</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Nubank Mastercard"
              required
              className="bg-zinc-900/50 border-zinc-800 focus:border-blue-500 text-white"
            />
          </div>

          {/* Bandeira e Últimos Dígitos */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-zinc-300">Bandeira</Label>
              <Input
                value={bandeira}
                onChange={(e) => setBandeira(e.target.value)}
                placeholder="Visa, Mastercard"
                className="bg-zinc-900/50 border-zinc-800 focus:border-blue-500 text-white"
              />
            </div>
            <div>
              <Label className="text-zinc-300">Últimos 4 Dígitos</Label>
              <Input
                value={ultimosDigitos}
                onChange={(e) => setUltimosDigitos(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="1234"
                maxLength={4}
                className="bg-zinc-900/50 border-zinc-800 focus:border-blue-500 text-white"
              />
            </div>
          </div>

          {/* Limite */}
          <div>
            <Label className="text-zinc-300">Limite</Label>
            <Input
              type="number"
              step="0.01"
              value={limite}
              onChange={(e) => setLimite(e.target.value)}
              placeholder="0,00"
              className="bg-zinc-900/50 border-zinc-800 focus:border-blue-500 text-white"
            />
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-zinc-300">Dia do Vencimento</Label>
              <Input
                type="number"
                min="1"
                max="31"
                value={diaVencimento}
                onChange={(e) => setDiaVencimento(e.target.value)}
                placeholder="15"
                className="bg-zinc-900/50 border-zinc-800 focus:border-blue-500 text-white"
              />
            </div>
            <div>
              <Label className="text-zinc-300">Dia do Fechamento</Label>
              <Input
                type="number"
                min="1"
                max="31"
                value={diaFechamento}
                onChange={(e) => setDiaFechamento(e.target.value)}
                placeholder="10"
                className="bg-zinc-900/50 border-zinc-800 focus:border-blue-500 text-white"
              />
            </div>
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
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {carregando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Criar Cartão'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}