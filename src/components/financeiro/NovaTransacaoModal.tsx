'use client';

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/dexie';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrendingUp, TrendingDown, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface NovaTransacaoModalProps {
  aberto: boolean;
  onFechar: () => void;
  onSucesso: () => void;
  transacaoParaEditar?: any;
}

interface Categoria {
  id: string;
  nome: string;
  tipo: 'RECEITA' | 'DESPESA';
  cor: string;
}

interface Conta {
  id: string;
  nome: string;
}

interface Cartao {
  id: string;
  nome: string;
}

export default function NovaTransacaoModal({ aberto, onFechar, onSucesso, transacaoParaEditar }: NovaTransacaoModalProps) {
  const [carregando, setCarregando] = useState(false);
  const [tipo, setTipo] = useState<'RECEITA' | 'DESPESA'>('DESPESA');

  // Dados do formulário
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [observacoes, setObservacoes] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [contaBancariaId, setContaBancariaId] = useState('');
  const [cartaoId, setCartaoId] = useState('');

  // Flags especiais
  const [isFixa, setIsFixa] = useState(false);
  const [isParcela, setIsParcela] = useState(false);
  const [parcelaTotais, setParcelaTotais] = useState('1');

  // Listas do Dexie
  const categoriasRaw = useLiveQuery(() => db.categorias.toArray(), []);
  const contasRaw = useLiveQuery(() => db.contasBancarias.toArray(), []);
  const cartoesRaw = useLiveQuery(() => db.cartoes.toArray(), []);

  const categorias = (categoriasRaw || []).filter(c => c.tipo === tipo);
  const contas = contasRaw || [];
  const cartoes = cartoesRaw || [];

  useEffect(() => {
    if (aberto) {
      if (transacaoParaEditar) {
        setTipo(transacaoParaEditar.tipo);
        setDescricao(transacaoParaEditar.descricao);
        setValor(String(transacaoParaEditar.valor));
        setData(new Date(transacaoParaEditar.data).toISOString().split('T')[0]);
        setObservacoes(transacaoParaEditar.observacoes || '');
        setCategoriaId(transacaoParaEditar.categoriaId || '');
        setContaBancariaId(transacaoParaEditar.contaBancariaId || '');
        setCartaoId(transacaoParaEditar.cartaoId || '');
        setIsFixa(transacaoParaEditar.isFixa || false);
        setIsParcela(false); // Não editamos parcelamento de uma transação já existente individualmente
        setParcelaTotais('1');
      } else {
        limparFormulario();
        if (contas.length > 0 && !contaBancariaId) {
          setContaBancariaId(contas[0].id);
        }
      }
    }
  }, [aberto, transacaoParaEditar, contas]);

  // Handlers para conta e cartão (agora podem ter ambos)
  const handleContaChange = (value: string) => {
    setContaBancariaId(value);
  };

  const handleCartaoChange = (value: string) => {
    setCartaoId(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação: Conta bancária é OBRIGATÓRIA
    if (!contaBancariaId) {
      toast.error('Selecione uma conta bancária');
      return;
    }

    setCarregando(true);
    const loadingToast = toast.loading(transacaoParaEditar ? 'Atualizando transação...' : 'Criando transação...');

    try {
      const valorNumerico = parseFloat(valor.replace(',', '.'));

      // FIX: Parse date as LOCAL instead of UTC to avoid timezone shift
      const [year, month, day] = data.split('-').map(Number);
      const dataSelecionadaLocal = new Date(year, month - 1, day);

      if (transacaoParaEditar) {
        // Lógica de Edição
        const transacaoAtualizada = {
          ...transacaoParaEditar,
          descricao,
          valor: valorNumerico,
          data: dataSelecionadaLocal,
          tipo,
          observacoes: observacoes || undefined,
          categoriaId: categoriaId || undefined,
          contaBancariaId,
          cartaoId: cartaoId || undefined,
          isFixa,
          updatedAt: new Date(),
        };

        // Se era individual e agora é fixa, gerar as próximas 23 (total 24)
        if (!transacaoParaEditar.isFixa && isFixa) {
          const idGrupo = crypto.randomUUID();
          transacaoAtualizada.grupoParcelaId = idGrupo;

          for (let i = 1; i < 24; i++) {
            const dt = new Date(year, month - 1 + i, day);
            await db.transacoes.add({
              ...transacaoAtualizada,
              id: crypto.randomUUID(),
              data: dt,
              createdAt: new Date(),
            });
          }
        }

        await db.transacoes.put(transacaoAtualizada);

        // Ajustar saldo da conta se necessário
        if (contaBancariaId !== 'caixa-geral') {
          const valorAntigo = Number(transacaoParaEditar.valor);
          const tipoAntigo = transacaoParaEditar.tipo;

          // Se mudou de conta, precisamos estornar da antiga e aplicar na nova
          if (transacaoParaEditar.contaBancariaId !== contaBancariaId && transacaoParaEditar.contaBancariaId !== 'caixa-geral') {
            const contaAntiga = await db.contasBancarias.get(transacaoParaEditar.contaBancariaId);
            if (contaAntiga) {
              const estorno = tipoAntigo === 'RECEITA' ? -valorAntigo : valorAntigo;
              await db.contasBancarias.update(transacaoParaEditar.contaBancariaId, { saldoAtual: Number(contaAntiga.saldoAtual) + estorno });
            }

            const contaNova = await db.contasBancarias.get(contaBancariaId);
            if (contaNova) {
              const aplicacao = tipo === 'RECEITA' ? valorNumerico : -valorNumerico;
              await db.contasBancarias.update(contaBancariaId, { saldoAtual: Number(contaNova.saldoAtual) + aplicacao });
            }
          } else {
            // Mesma conta, apenas ajuste de valor/tipo
            const conta = await db.contasBancarias.get(contaBancariaId);
            if (conta) {
              const estornoAntigo = tipoAntigo === 'RECEITA' ? -valorAntigo : valorAntigo;
              const aplicacaoNova = tipo === 'RECEITA' ? valorNumerico : -valorNumerico;
              await db.contasBancarias.update(contaBancariaId, { saldoAtual: Number(conta.saldoAtual) + estornoAntigo + aplicacaoNova });
            }
          }
        } else if (transacaoParaEditar.contaBancariaId !== 'caixa-geral') {
          // Mudou de uma conta real para Caixa Geral, estornar da antiga
          const contaAntiga = await db.contasBancarias.get(transacaoParaEditar.contaBancariaId);
          if (contaAntiga) {
            const estorno = transacaoParaEditar.tipo === 'RECEITA' ? -Number(transacaoParaEditar.valor) : Number(transacaoParaEditar.valor);
            await db.contasBancarias.update(transacaoParaEditar.contaBancariaId, { saldoAtual: Number(contaAntiga.saldoAtual) + estorno });
          }
        }
      } else {
        // Lógica de Criação
        const idGrupo = crypto.randomUUID();
        // Se for fixa, geramos 24 meses. Se for parcela, usamos o total informado.
        const numParcelasTotal = isParcela ? parseInt(parcelaTotais) : (isFixa ? 24 : 1);

        for (let i = 0; i < numParcelasTotal; i++) {
          const dt = new Date(year, month - 1 + i, day);

          const transacao = {
            id: crypto.randomUUID(),
            descricao: isParcela ? `${descricao} (${i + 1}/${numParcelasTotal})` : descricao,
            valor: valorNumerico,
            data: dt,
            tipo,
            observacoes: observacoes || undefined,
            categoriaId: categoriaId || undefined,
            contaBancariaId,
            cartaoId: cartaoId || undefined,
            isFixa,
            isParcela,
            parcelaNumero: isParcela ? i + 1 : undefined,
            parcelaTotais: isParcela ? numParcelasTotal : undefined,
            grupoParcelaId: (isParcela || isFixa) ? idGrupo : undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await db.transacoes.add(transacao);

          // Atualizar saldo apenas para a primeira ocorrência (mês atual da transação)
          if (contaBancariaId !== 'caixa-geral' && i === 0) {
            const conta = await db.contasBancarias.get(contaBancariaId);
            if (conta) {
              const saldoDiff = tipo === 'RECEITA' ? transacao.valor : -transacao.valor;
              await db.contasBancarias.update(contaBancariaId, { saldoAtual: Number(conta.saldoAtual) + saldoDiff });
            }
          }
        }
      }

      limparFormulario();
      toast.success(transacaoParaEditar ? 'Transação atualizada!' : 'Transação criada!', { id: loadingToast });
      onSucesso();
      onFechar();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao criar transação. Tente novamente.', { id: loadingToast });
    } finally {
      setCarregando(false);
    }
  };

  const limparFormulario = () => {
    setDescricao('');
    setValor('');
    setData(new Date().toISOString().split('T')[0]);
    setObservacoes('');
    setCategoriaId('');
    setContaBancariaId('');
    setCartaoId('');
    setIsFixa(false);
    setIsParcela(false);
    setParcelaTotais('1');
  };

  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-7xl max-h-[95vh] overflow-y-auto sm:overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            {transacaoParaEditar ? 'Editar Transação' : 'Nova Transação'}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {transacaoParaEditar ? 'Altere os dados da transação selecionada' : 'Registre uma nova receita ou despesa de forma rápida'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Coluna Esquerda: Dados da Transação */}
            <div className="space-y-6">
              {/* Tipo de Transação */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTipo('RECEITA')}
                  className={`p-4 rounded-lg border-2 transition-all ${tipo === 'RECEITA'
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                    }`}
                >
                  <TrendingUp className={`w-6 h-6 mx-auto mb-2 ${tipo === 'RECEITA' ? 'text-green-400' : 'text-zinc-500'}`} />
                  <span className={`font-semibold ${tipo === 'RECEITA' ? 'text-green-400' : 'text-zinc-400'}`}>
                    Receita
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setTipo('DESPESA')}
                  className={`p-4 rounded-lg border-2 transition-all ${tipo === 'DESPESA'
                    ? 'border-red-500 bg-red-500/10'
                    : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                    }`}
                >
                  <TrendingDown className={`w-6 h-6 mx-auto mb-2 ${tipo === 'DESPESA' ? 'text-red-400' : 'text-zinc-500'}`} />
                  <span className={`font-semibold ${tipo === 'DESPESA' ? 'text-red-400' : 'text-zinc-400'}`}>
                    Despesa
                  </span>
                </button>
              </div>

              {/* Descrição */}
              <div>
                <Label className="text-zinc-300">Descrição *</Label>
                <Input
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex: Compra no mercado"
                  required
                  className="bg-zinc-900/50 border-zinc-800 text-white"
                />
              </div>

              {/* Valor e Data */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-zinc-300">Valor (Unidade) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    placeholder="0,00"
                    required
                    className="bg-zinc-900/50 border-zinc-800 text-white"
                  />
                </div>
                <div>
                  <Label className="text-zinc-300">Data *</Label>
                  <Input
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    required
                    className="bg-zinc-900/50 border-zinc-800 text-white"
                  />
                </div>
              </div>

              {/* Categoria */}
              <div>
                <Label className="text-zinc-300">Categoria</Label>
                <Select value={categoriaId} onValueChange={setCategoriaId}>
                  <SelectTrigger className="bg-zinc-900/50 border-zinc-800 text-white">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    {categorias.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id} className="text-white hover:bg-zinc-800">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.cor }} />
                          {cat.nome}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Coluna Direita: Destino e Configurações */}
            <div className="space-y-6">
              {/* Conta Bancária (obrigatório) e Cartão (opcional) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-zinc-400 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 text-blue-400 shrink-0" />
                  <p>Toda transação deve estar vinculada a uma <strong>conta bancária</strong> ou ao <strong>Caixa Geral</strong>.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-zinc-300">Conta Bancária *</Label>
                    <Select value={contaBancariaId} onValueChange={handleContaChange}>
                      <SelectTrigger className={`bg-zinc-900/50 border-zinc-800 text-white ${!contaBancariaId ? 'border-red-500/50' : ''}`}>
                        <SelectValue placeholder="Selecionar conta" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        <SelectItem value="caixa-geral" className="text-white hover:bg-zinc-800 font-medium">
                          🏦 Caixa Geral
                        </SelectItem>
                        {contas.map((conta) => (
                          <SelectItem key={conta.id} value={conta.id} className="text-white hover:bg-zinc-800">
                            {conta.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-zinc-300">Cartão de Crédito (Opcional)</Label>
                    <Select value={cartaoId} onValueChange={handleCartaoChange}>
                      <SelectTrigger className="bg-zinc-900/50 border-zinc-800 text-white">
                        <SelectValue placeholder="Selecionar cartão" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        {cartoes.map((cartao) => (
                          <SelectItem key={cartao.id} value={cartao.id} className="text-white hover:bg-zinc-800">
                            {cartao.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Opções Especiais */}
              <div className="grid grid-cols-2 gap-4">
                {/* Transação Fixa */}
                <div className="space-y-4 p-4 bg-zinc-900/30 rounded-lg border border-zinc-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-zinc-300">Transação Fixa</Label>
                      <p className="text-xs text-zinc-500">Repete mensalmente</p>
                    </div>
                    <Switch
                      checked={isFixa}
                      onCheckedChange={setIsFixa}
                    />
                  </div>
                </div>

                {/* Parcelamento */}
                <div className="space-y-4 p-4 bg-zinc-900/30 rounded-lg border border-zinc-800">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <Label className="text-zinc-300">Parcelar</Label>
                      <p className="text-xs text-zinc-500">Repetir valor</p>
                    </div>
                    <Switch
                      checked={isParcela}
                      onCheckedChange={setIsParcela}
                      disabled={!!transacaoParaEditar}
                    />
                  </div>
                  {isParcela && (
                    <div className="space-y-2">
                      <Label className="text-xs text-zinc-400">Quant. de Parcelas</Label>
                      <Input
                        type="number"
                        min="2"
                        max="48"
                        value={parcelaTotais}
                        onChange={(e) => setParcelaTotais(e.target.value)}
                        className="bg-zinc-900/50 border-zinc-800 text-white h-8 mt-1"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Observações */}
              <div>
                <Label className="text-zinc-300">Observações</Label>
                <Textarea
                  value={observacoes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setObservacoes(e.target.value)}
                  placeholder="Informações adicionais..."
                  rows={2}
                  className="bg-zinc-900/50 border-zinc-800 text-white resize-none"
                />
              </div>
            </div>
          </div>

          {/* Botões - Fora do grid para ocupar a largura total */}
          <div className="flex gap-4 pt-4 border-t border-zinc-800">
            <Button
              type="button"
              variant="default"
              onClick={onFechar}
              className="flex-1 border-zinc-800 hover:bg-zinc-800 h-11"
              disabled={carregando}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={carregando || !contaBancariaId}
              className={`flex-1 h-11 text-base font-semibold ${tipo === 'RECEITA'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50`}
            >
              {carregando ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Transação'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
