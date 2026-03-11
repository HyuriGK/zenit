'use client';

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, initCategoriasPadrao } from '@/lib/dexie';
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
  dataReferencia?: Date;
}

interface Categoria {
  id: string;
  nome: string;
  tipo: 'RECEITA' | 'DESPESA';
  cor: string;
}

export default function NovaTransacaoModal({ aberto, onFechar, onSucesso, transacaoParaEditar, dataReferencia }: NovaTransacaoModalProps) {
  const [carregando, setCarregando] = useState(false);
  const [tipo, setTipo] = useState<'RECEITA' | 'DESPESA'>('DESPESA');

  // Dados do formulário
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState(() => {
    const today = new Date();
    const defaultDate = dataReferencia ? new Date(dataReferencia) : today;
    
    // Se o mês selecionado for o mês atual, usa "Hoje" como padrão
    if (dataReferencia && 
        dataReferencia.getMonth() === today.getMonth() && 
        dataReferencia.getFullYear() === today.getFullYear()) {
      return today.toISOString().split('T')[0];
    }
    
    return defaultDate.toISOString().split('T')[0];
  });
  const [observacoes, setObservacoes] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [contaBancariaId, setContaBancariaId] = useState('');
  const [cartaoId, setCartaoId] = useState('');

  // Flags especiais
  const [isFixa, setIsFixa] = useState(false);
  const [paga, setPaga] = useState(false);
  const [parcelasRestantes, setParcelasRestantes] = useState('');
  const [aplicarProximas, setAplicarProximas] = useState(false);

  // Listas do Dexie
  const categoriasRaw = useLiveQuery(() => db.categorias.toArray(), []);
  const contasRaw = useLiveQuery(() => db.contasBancarias.toArray(), []);

  const categorias = (categoriasRaw || []).filter(c => c.tipo === tipo);
  const contas = contasRaw || [];

  useEffect(() => {
    if (aberto) {
      initCategoriasPadrao();
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
        setParcelasRestantes('');
        setPaga(transacaoParaEditar.paga || false);
        setAplicarProximas(false);
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
          paga,
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
        toast.dismiss(loadingToast);

        // Atualizar data e categoria das próximas parcelas/fixas se houve mudança
        if (transacaoParaEditar.grupoParcelaId && aplicarProximas) {
          const dataMudou = dataSelecionadaLocal.getTime() !== new Date(transacaoParaEditar.data).getTime();
          const categoriaMudou = categoriaId !== transacaoParaEditar.categoriaId;
          const valorMudou = valorNumerico !== transacaoParaEditar.valor;
          const descricaoMudou = descricao !== transacaoParaEditar.descricao;
          const contaMudou = contaBancariaId !== transacaoParaEditar.contaBancariaId;
          const cartaoMudou = cartaoId !== transacaoParaEditar.cartaoId;
          const observacoesMudou = observacoes !== transacaoParaEditar.observacoes;

          if (dataMudou || categoriaMudou || valorMudou || descricaoMudou || contaMudou || cartaoMudou || observacoesMudou) {
            const proximas = await db.transacoes
              .where('grupoParcelaId')
              .equals(transacaoParaEditar.grupoParcelaId)
              .filter(t => new Date(t.data).getTime() > new Date(transacaoParaEditar.data).getTime())
              .toArray();

            for (const t of proximas) {
              const updates: any = {
                updatedAt: new Date()
              };

              if (dataMudou) {
                const dtT = new Date(t.data);
                updates.data = new Date(dtT.getFullYear(), dtT.getMonth(), day);
              }

              if (categoriaMudou) updates.categoriaId = categoriaId;
              if (valorMudou) updates.valor = valorNumerico;
              if (descricaoMudou) {
                // Se for parcela, manter o sufixo (x/y)
                if (t.isParcela && t.parcelaNumero && t.parcelaTotais) {
                  updates.descricao = `${descricao} (${t.parcelaNumero}/${t.parcelaTotais})`;
                } else {
                  updates.descricao = descricao;
                }
              }
              if (contaMudou) updates.contaBancariaId = contaBancariaId;
              if (cartaoMudou) updates.cartaoId = cartaoId;
              if (observacoesMudou) updates.observacoes = observacoes || undefined;

              await db.transacoes.update(t.id, updates);
            }
          }
        }

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
        // Se for fixa e tiver parcelas restantes, usamos parcelasRestantes. Se for apenas fixa, default 24 meses.
        const isParcelado = isFixa && parcelasRestantes !== '' && parseInt(parcelasRestantes) > 0;
        const numParcelasTotal = isFixa ? (isParcelado ? parseInt(parcelasRestantes) : 24) : 1;
        
        for (let i = 0; i < numParcelasTotal; i++) {
          const dt = new Date(year, month - 1 + i, day);
          
          const transacao = {
            id: crypto.randomUUID(),
            descricao: isParcelado ? `${descricao} (${i + 1}/${numParcelasTotal})` : descricao,
            valor: valorNumerico,
            data: dt,
            tipo,
            observacoes: observacoes || undefined,
            categoriaId: categoriaId || undefined,
            contaBancariaId,
            cartaoId: undefined, // Removido conforme solicitação anterior
            isFixa,
            isParcela: isParcelado,
            paga: i === 0 ? paga : false, // Apenas a primeira pode ser paga na criação em massa
            parcelaNumero: isParcelado ? i + 1 : undefined,
            parcelaTotais: isParcelado ? numParcelasTotal : undefined,
            grupoParcelaId: isFixa ? idGrupo : undefined,
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
    const today = new Date();
    const defaultDate = dataReferencia ? new Date(dataReferencia) : today;
    
    let dateStr = defaultDate.toISOString().split('T')[0];
    if (dataReferencia && 
        dataReferencia.getMonth() === today.getMonth() && 
        dataReferencia.getFullYear() === today.getFullYear()) {
      dateStr = today.toISOString().split('T')[0];
    }
    
    setData(dateStr);
    setObservacoes('');
    setCategoriaId('');
    setContaBancariaId('');
    setCartaoId('');
    setIsFixa(false);
    setPaga(false);
    setParcelasRestantes('');
  };

  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="bg-zinc-950 border-zinc-800/50 sm:max-w-[1200px] w-[95vw] max-h-[90vh] overflow-visible p-0 gap-0 shadow-2xl focus:ring-0 focus:outline-none focus-visible:ring-0 sm:rounded-[32px] border-zinc-800/30">
        <div className="flex flex-col h-full overflow-visible">
          {/* Header com Gradiente */}
          <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-900/50 p-6 border-b border-zinc-800/50">
            <DialogHeader className="gap-1">
              <DialogTitle className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                <div className={`p-2 rounded-xl transition-colors duration-500 ${tipo === 'RECEITA' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {tipo === 'RECEITA' ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                </div>
                {transacaoParaEditar ? 'Editar Registro' : 'Novo Registro Financeiro'}
              </DialogTitle>
              <DialogDescription className="text-zinc-500 font-medium text-base ml-12">
                {transacaoParaEditar ? 'Ajuste os detalhes da sua movimentação para manter seu controle impecável.' : 'Registre suas entradas e saídas com precisão para uma saúde financeira sólida.'}
              </DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-visible">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Coluna Esquerda: Dados da Transação */}
              <div className="space-y-6">
                {/* Tipo de Transação - Design Premium */}
                <div className="flex gap-4 p-1.5 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setTipo('RECEITA')}
                    className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all duration-300 ${tipo === 'RECEITA'
                      ? 'bg-green-600 text-white shadow-lg shadow-green-600/20 ring-1 ring-green-500/50'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                      }`}
                  >
                    <TrendingUp className="w-5 h-5" />
                    Receita
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipo('DESPESA')}
                    className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all duration-300 ${tipo === 'DESPESA'
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/20 ring-1 ring-red-500/50'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                      }`}
                  >
                    <TrendingDown className="w-5 h-5" />
                    Despesa
                  </button>
                </div>

                {/* Descrição */}
                <div>
                  <Label className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-500 mb-2 block">Descrição Principal</Label>
                  <Input
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Ex: Assinatura Netflix, Freelance Design..."
                    required
                    className="bg-zinc-900/50 border-zinc-800 text-white h-12 px-4 rounded-xl placeholder:text-zinc-600 focus:border-zinc-700 focus-visible:ring-0 focus:ring-0 focus:outline-none transition-all text-base"
                  />
                </div>

                {/* Valor e Data */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-500 mb-2 block">Valor (R$)</Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={valor}
                        onChange={(e) => setValor(e.target.value)}
                        placeholder="0,00"
                        required
                        className="bg-zinc-900/50 border-zinc-800 text-white h-12 pl-8 rounded-xl focus:border-zinc-700 focus-visible:ring-0 focus:ring-0 focus:outline-none transition-all text-lg font-black"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-500 mb-2 block">Data da Operação</Label>
                    <Input
                      type="date"
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                      required
                      className="bg-zinc-900/50 border-zinc-800 text-white h-12 px-4 rounded-xl focus:border-zinc-700 focus-visible:ring-0 focus:ring-0 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Categoria */}
                <div>
                  <Label className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-500 mb-2 block">Categoria</Label>
                  <Select value={categoriaId} onValueChange={setCategoriaId}>
                    <SelectTrigger className="bg-zinc-900/50 border-zinc-800 text-white h-12 px-4 rounded-xl focus:border-zinc-700 focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 focus:outline-none transition-all">
                      <SelectValue placeholder="Categorize sua transação" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800/80 rounded-xl shadow-2xl overflow-visible">
                      {categorias.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id} className="text-white hover:text-white focus:text-white hover:bg-zinc-900 focus:bg-zinc-900 rounded-lg m-1 py-2 cursor-pointer transition-colors duration-200">
                          <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full ring-4 ring-white/5" style={{ backgroundColor: cat.cor }} />
                            <span className="font-medium group-hover:text-white">{cat.nome}</span>
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

                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <Label className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-500 mb-2 block">Conta Origem/Destino</Label>
                      <Select value={contaBancariaId} onValueChange={handleContaChange}>
                        <SelectTrigger className={`bg-zinc-900/50 border-zinc-800 h-11 text-white rounded-xl focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 focus:outline-none transition-all ${!contaBancariaId ? 'border-red-500/50' : ''}`}>
                          <SelectValue placeholder="Selecionar conta" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-950 border-zinc-800/80 rounded-xl m-1 overflow-visible">
                          <SelectItem value="caixa-geral" className="text-white hover:text-white focus:text-white hover:bg-zinc-900 focus:bg-zinc-900 rounded-lg p-2 font-black text-xs uppercase tracking-widest cursor-pointer">
                            🏦 Caixa Geral
                          </SelectItem>
                          {contas.map((conta) => (
                            <SelectItem key={conta.id} value={conta.id} className="text-white hover:text-white focus:text-white hover:bg-zinc-900 focus:bg-zinc-900 rounded-lg p-2 font-medium cursor-pointer">
                              {conta.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Opções de Edição em Série */}
                {transacaoParaEditar?.grupoParcelaId && (
                  <div className="p-4 bg-zinc-900/30 rounded-lg border border-blue-500/20 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-blue-400 font-bold">Atualizar Série</Label>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Aplicar alterações às próximas transações</p>
                      </div>
                      <Switch
                        checked={aplicarProximas}
                        onCheckedChange={setAplicarProximas}
                        className="data-[state=checked]:bg-blue-600 focus-visible:ring-0 focus:ring-0"
                      />
                    </div>
                  </div>
                )}

                {/* Configurações Avançadas */}
                <div className={`grid gap-4 transition-all duration-300 ${isFixa ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {/* Transação Fixa */}
                  <div className="space-y-4 p-4 bg-zinc-900/40 rounded-2xl border border-zinc-800 shadow-sm relative overflow-hidden group transition-all hover:bg-zinc-900/60 h-[88px] flex items-center">
                    <div className={`absolute top-0 left-0 w-1 h-full ${isFixa ? 'bg-blue-500' : 'bg-zinc-800'} opacity-30 group-hover:opacity-100 transition-opacity`} />
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <Label className={`font-black text-xs uppercase tracking-widest ${isFixa ? 'text-blue-500' : 'text-zinc-400'}`}>Fixo / Recorrente</Label>
                        <p className="text-[10px] text-zinc-600 font-bold uppercase mt-0.5">Assinaturas ou Parcelas</p>
                      </div>
                      <Switch
                        checked={isFixa}
                        onCheckedChange={setIsFixa}
                        className="focus-visible:ring-0 focus:ring-0"
                      />
                    </div>
                  </div>

                  {/* Parcelas Restantes - Condicional */}
                  {isFixa && (
                    <div className="p-4 bg-zinc-900/40 rounded-2xl border border-blue-500/20 shadow-sm relative overflow-hidden group h-[88px] flex items-center">
                      <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 opacity-30" />
                      <div className="flex items-center justify-between w-full gap-4">
                        <div className="shrink-0">
                          <Label className="font-black text-xs uppercase tracking-widest text-purple-400">Parcelas</Label>
                          <p className="text-[10px] text-zinc-600 font-bold uppercase mt-0.5">Restantes</p>
                        </div>
                        <Input
                          type="number"
                          min="1"
                          max="120"
                          value={parcelasRestantes}
                          onChange={(e) => setParcelasRestantes(e.target.value)}
                          placeholder="Infinito"
                          className="bg-zinc-950/50 border-zinc-800 text-white h-10 w-24 rounded-xl focus:border-purple-500 focus-visible:ring-0 focus:ring-0 focus:outline-none transition-all font-black text-center placeholder:text-[10px] placeholder:font-bold placeholder:text-zinc-700"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Observações */}
                <div>
                  <Label className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-500 mb-2 block">Observações Adicionais</Label>
                  <Textarea
                    value={observacoes}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setObservacoes(e.target.value)}
                    placeholder="Notas, detalhes da compra, links ou referências..."
                    rows={2}
                    className="bg-zinc-900/50 border-zinc-800 text-white resize-none rounded-xl p-4 placeholder:text-zinc-600 focus:border-zinc-700 focus-visible:ring-0 focus:ring-0 focus:outline-none transition-all min-h-[80px]"
                  />
                </div>
              </div>
            </div>

            {/* Botões - Fora do grid para ocupar a largura total */}
            <div className="flex gap-4 pt-10 border-t border-zinc-800/50">
              <Button
                type="button"
                variant="outline"
                onClick={onFechar}
                className="flex-1 border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white h-14 rounded-2xl font-black text-sm uppercase tracking-widest transition-all"
                disabled={carregando}
              >
                Descartar
              </Button>
              <Button
                type="submit"
                disabled={carregando || !contaBancariaId}
                className={`flex-[2] h-14 rounded-2xl font-black text-sm uppercase tracking-[0.15em] shadow-xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] focus:ring-0 focus:outline-none focus-visible:ring-0 ${tipo === 'RECEITA'
                  ? 'bg-green-600 hover:bg-green-700 shadow-green-900/20'
                  : 'bg-red-600 hover:bg-red-700 shadow-red-900/20'
                  } disabled:opacity-50 text-white`}
              >
                {carregando ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  transacaoParaEditar ? 'Confirmar Alterações' : 'Finalizar Registro'
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
