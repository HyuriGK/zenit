'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/dexie';
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
import { Loader2, Target, TrendingUp } from 'lucide-react';
import { formatarMoeda } from '@/lib/financeiro-helper';

interface ContribuirObjetivoModalProps {
  aberto: boolean;
  onFechar: () => void;
  onSucesso: () => void;
  objetivo: {
    id: string;
    nome: string;
    valorMeta: number;
    valorAtual: number;
    cor: string;
    falta: number;
  } | null;
}

interface Conta {
  id: string;
  nome: string;
}

export default function ContribuirObjetivoModal({
  aberto,
  onFechar,
  onSucesso,
  objetivo
}: ContribuirObjetivoModalProps) {
  const [carregando, setCarregando] = useState(false);
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [contaBancariaId, setContaBancariaId] = useState('');
  // Use LiveQuery instead of fetch for accounts
  const contasData = useLiveQuery(() => db.contasBancarias.toArray(), []);
  const contas = contasData || [];

  useState(() => {
    if (aberto) {
      setDescricao(objetivo ? `Contribuição para ${objetivo.nome}` : '');
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!objetivo) return;

    setCarregando(true);

    try {
      const valorNumerico = parseFloat(valor.replace(',', '.'));

      // Update Goal Balance
      const obj = await db.objetivosFinanceiros.get(objetivo.id);
      if (obj) {
        const newValor = Number(obj.valorAtual) + valorNumerico;
        const isConcluido = newValor >= Number(obj.valorMeta);

        await db.objetivosFinanceiros.update(objetivo.id, {
          valorAtual: newValor,
          status: isConcluido ? 'CONCLUIDO' : 'EM_ANDAMENTO',
          updatedAt: new Date()
        });

        // Register Transaction (Expense)
        await db.transacoes.add({
          id: crypto.randomUUID(),
          descricao,
          valor: valorNumerico,
          data: new Date(),
          tipo: 'DESPESA',
          isFixa: false,
          isParcela: false,
          contaBancariaId: contaBancariaId || contas[0]?.id || 'offline-account',
          objetivoId: objetivo.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Deduct from Account Balance
        if (contaBancariaId) {
          const conta = await db.contasBancarias.get(contaBancariaId);
          if (conta) {
            await db.contasBancarias.update(contaBancariaId, {
              saldoAtual: Number(conta.saldoAtual) - valorNumerico,
              updatedAt: new Date(),
            });
          }
        }

        limparFormulario();
        onSucesso();
        onFechar();

        if (isConcluido) {
          alert(`🎉 Parabéns! Objetivo "${objetivo.nome}" concluído!`);
        }
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao contribuir');
    } finally {
      setCarregando(false);
    }
  };

  const limparFormulario = () => {
    setValor('');
    setDescricao('');
    setContaBancariaId('');
  };

  if (!objetivo) return null;

  const valorNumerico = valor ? parseFloat(valor.replace(',', '.')) : 0;
  const novoTotal = objetivo.valorAtual + valorNumerico;
  const porcentagemAtual = (objetivo.valorAtual / objetivo.valorMeta) * 100;
  const novaPorcentagem = (novoTotal / objetivo.valorMeta) * 100;

  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <Target className="w-6 h-6" style={{ color: objetivo.cor }} />
            Contribuir para Objetivo
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Informações do Objetivo */}
          <div
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: `${objetivo.cor}10`,
              borderColor: `${objetivo.cor}30`
            }}
          >
            <h3 className="font-semibold text-white mb-2">{objetivo.nome}</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-zinc-400">
                <span>Progresso atual:</span>
                <span className="font-medium text-white">
                  {formatarMoeda(objetivo.valorAtual)} de {formatarMoeda(objetivo.valorMeta)}
                </span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2 mt-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${porcentagemAtual}%`,
                    backgroundColor: objetivo.cor
                  }}
                />
              </div>
              <div className="flex justify-between text-zinc-500 text-xs mt-1">
                <span>{Math.round(porcentagemAtual)}%</span>
                <span>Faltam {formatarMoeda(objetivo.falta)}</span>
              </div>
            </div>
          </div>

          {/* Valor */}
          <div>
            <Label className="text-zinc-300">Valor a Contribuir *</Label>
            <Input
              type="number"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
              required
              className="bg-zinc-900/50 border-zinc-800 text-white text-lg font-semibold"
            />
            {valorNumerico > 0 && (
              <div className="mt-2 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                <div className="flex items-center gap-2 text-sm mb-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-zinc-400">Após contribuição:</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-zinc-400 text-sm">Novo total:</span>
                  <span className="font-semibold text-white">
                    {formatarMoeda(novoTotal)}
                  </span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(novaPorcentagem, 100)}%`,
                      backgroundColor: objetivo.cor
                    }}
                  />
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  {Math.round(novaPorcentagem)}% da meta
                </div>
                {novoTotal >= objetivo.valorMeta && (
                  <div className="mt-2 text-sm text-green-400 font-semibold">
                    🎉 Objetivo será concluído!
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Descrição */}
          <div>
            <Label className="text-zinc-300">Descrição</Label>
            <Input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Contribuição mensal"
              className="bg-zinc-900/50 border-zinc-800 text-white"
            />
          </div>

          {/* Conta */}
          <div>
            <Label className="text-zinc-300">Conta para Débito</Label>
            <Select value={contaBancariaId} onValueChange={setContaBancariaId}>
              <SelectTrigger className="bg-zinc-900/50 border-zinc-800 text-white">
                <SelectValue placeholder="Selecionar conta (opcional)" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                {contas.map((conta) => (
                  <SelectItem key={conta.id} value={conta.id} className="text-white hover:bg-zinc-800">
                    {conta.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              disabled={carregando || !valor || parseFloat(valor) <= 0}
              className="flex-1"
              style={{
                backgroundColor: objetivo.cor,
                opacity: (!valor || parseFloat(valor) <= 0) ? 0.5 : 1
              }}
            >
              {carregando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Contribuir'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}