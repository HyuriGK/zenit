'use client';

import { useState, useEffect } from 'react';
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
import { extrairDataString, parseDataString } from '@/lib/timezone';

// Formata uma data como YYYY-MM-DD usando o fuso LOCAL (toISOString() desloca o dia entre fusos)
function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Data padrão do formulário: dia de hoje quando o mês visualizado é o mês atual,
// caso contrário o 1º dia do mês selecionado (para registrar em qualquer mês).
function computeDefaultDateStr(dataReferencia?: Date): string {
  const today = new Date();
  if (
    dataReferencia &&
    (dataReferencia.getMonth() !== today.getMonth() ||
      dataReferencia.getFullYear() !== today.getFullYear())
  ) {
    return formatLocalDate(dataReferencia);
  }
  return formatLocalDate(today);
}

interface NovaTransacaoModalProps {
  aberto: boolean;
  onFechar: () => void;
  onSucesso: () => void;
  transacaoParaEditar?: any;
  dataReferencia?: Date;
}

export default function NovaTransacaoModal({ aberto, onFechar, onSucesso, transacaoParaEditar, dataReferencia }: NovaTransacaoModalProps) {
  const [carregando, setCarregando] = useState(false);
  const [tipo, setTipo] = useState<'RECEITA' | 'DESPESA'>('DESPESA');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState(() => computeDefaultDateStr(dataReferencia));
  const [observacoes, setObservacoes] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [contaBancariaId, setContaBancariaId] = useState('');
  const [cartaoId, setCartaoId] = useState('');
  const [isFixa, setIsFixa] = useState(false);
  const [paga, setPaga] = useState(false);
  const [parcelasRestantes, setParcelasRestantes] = useState('');
  const [aplicarProximas, setAplicarProximas] = useState(false);

  const [categorias, setCategorias] = useState<any[]>([]);
  const [contas, setContas] = useState<any[]>([]);

  useEffect(() => {
    if (!aberto) return;
    Promise.all([
      fetch('/api/financeiro/categorias').then(r => r.json()),
      fetch('/api/financeiro/contas').then(r => r.json()),
    ]).then(([cats, conts]) => {
      setCategorias(cats.data || []);
      setContas(conts.data || []);
    });

    if (transacaoParaEditar) {
      setTipo(transacaoParaEditar.tipo);
      setDescricao(transacaoParaEditar.descricao);
      setValor(String(transacaoParaEditar.valor));
      setData(extrairDataString(transacaoParaEditar.data));
      setObservacoes(transacaoParaEditar.observacoes || '');
      setCategoriaId(transacaoParaEditar.categoriaId || '');
      setContaBancariaId(transacaoParaEditar.contaBancariaId || 'caixa-geral');
      setCartaoId(transacaoParaEditar.cartaoId || '');
      setIsFixa(transacaoParaEditar.isFixa || false);
      setParcelasRestantes('');
      setPaga(transacaoParaEditar.paga || false);
      setAplicarProximas(false);
    } else {
      limparFormulario();
    }
  }, [aberto, transacaoParaEditar]);

  // Garante que, ao abrir um NOVO registro, a data acompanhe o mês que está sendo
  // visualizado (dataReferencia). Sem dataReferencia nas dependências, o campo podia
  // ficar preso no mês atual, fazendo a transação cair sempre no mês vigente.
  useEffect(() => {
    if (aberto && !transacaoParaEditar) {
      setData(computeDefaultDateStr(dataReferencia));
    }
  }, [aberto, dataReferencia, transacaoParaEditar]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contaBancariaId) { toast.error('Selecione uma conta bancária'); return; }
    setCarregando(true);
    const loadingToast = toast.loading(transacaoParaEditar ? 'Atualizando transação...' : 'Criando transação...');
    try {
      const valorNumerico = parseFloat(valor.replace(',', '.'));
      const [year, month, day] = data.split('-').map(Number);

      if (transacaoParaEditar) {
        // EDIT
        const balanceAdjust = (() => {
          const oldConta = transacaoParaEditar.contaBancariaId;
          const newConta = contaBancariaId;
          const valMudou = valorNumerico !== transacaoParaEditar.valor;
          const tipoMudou = tipo !== transacaoParaEditar.tipo;
          const contaMudou = oldConta !== newConta;
          if (!valMudou && !tipoMudou && !contaMudou) return undefined;
          return {
            oldContaId: oldConta !== 'caixa-geral' ? oldConta : null,
            oldValor: transacaoParaEditar.valor,
            oldTipo: transacaoParaEditar.tipo,
            newContaId: newConta !== 'caixa-geral' ? newConta : null,
            newValor: valorNumerico,
            newTipo: tipo,
          };
        })();

        // If converting to fixed series, create future occurrences
        if (!transacaoParaEditar.isFixa && isFixa) {
          const idGrupo = crypto.randomUUID();
          const futuras = [];
          for (let i = 1; i < 24; i++) {
            futuras.push({
              descricao,
              valor: valorNumerico,
              data: formatLocalDate(new Date(year, month - 1 + i, day)),
              tipo,
              isFixa: true,
              isParcela: false,
              paga: false,
              categoriaId: categoriaId || null,
              contaBancariaId,
              grupoParcelaId: idGrupo,
              _updateBalance: false,
            });
          }
          if (futuras.length) {
            await fetch('/api/financeiro/transacoes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(futuras),
            });
          }
        }

        await fetch(`/api/financeiro/transacoes/${transacaoParaEditar.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            descricao, valor: valorNumerico,
            data,
            tipo, observacoes: observacoes || null,
            categoriaId: categoriaId || null,
            contaBancariaId, isFixa, paga,
            grupoParcelaId: transacaoParaEditar.grupoParcelaId || null,
            _balanceAdjust: balanceAdjust,
          }),
        });

        // Update future series if requested
        if (transacaoParaEditar.grupoParcelaId && aplicarProximas) {
          const serieRes = await fetch('/api/financeiro/transacoes');
          const serieJson = await serieRes.json();
          const tData = parseDataString(transacaoParaEditar.data).getTime();
          const proximas = (serieJson.data || []).filter((t: any) =>
            t.grupoParcelaId === transacaoParaEditar.grupoParcelaId &&
            parseDataString(t.data).getTime() > tData
          );
          for (const t of proximas) {
            const updates: any = { categoriaId: categoriaId || null, valor: valorNumerico, descricao, observacoes: observacoes || null, contaBancariaId };
            const dtT = parseDataString(t.data);
            updates.data = formatLocalDate(new Date(dtT.getFullYear(), dtT.getMonth(), day));
            await fetch(`/api/financeiro/transacoes/${t.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updates),
            });
          }
        }
      } else {
        // CREATE
        const idGrupo = crypto.randomUUID();
        const isParcelado = isFixa && parcelasRestantes !== '' && parseInt(parcelasRestantes) > 0;
        const numTotal = isFixa ? (isParcelado ? parseInt(parcelasRestantes) : 24) : 1;
        const transacoes = [];
        for (let i = 0; i < numTotal; i++) {
          transacoes.push({
            descricao: isParcelado ? `${descricao} (${i + 1}/${numTotal})` : descricao,
            valor: valorNumerico,
            data: formatLocalDate(new Date(year, month - 1 + i, day)),
            tipo,
            observacoes: observacoes || null,
            categoriaId: categoriaId || null,
            contaBancariaId,
            isFixa,
            isParcela: isParcelado,
            paga: i === 0 ? paga : false,
            parcelaNumero: isParcelado ? i + 1 : null,
            parcelaTotais: isParcelado ? numTotal : null,
            grupoParcelaId: isFixa ? idGrupo : null,
            _updateBalance: i === 0, // only update balance for first item
          });
        }
        await fetch('/api/financeiro/transacoes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transacoes),
        });
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
    setData(computeDefaultDateStr(dataReferencia));
    setObservacoes('');
    setCategoriaId('');
    setContaBancariaId('');
    setCartaoId('');
    setIsFixa(false);
    setPaga(false);
    setParcelasRestantes('');
  };

  const categoriasDoTipo = categorias.filter(c => c.tipo === tipo);

  // Mês em que a transação será registrada (a partir da data escolhida)
  const mesRegistroLabel = (() => {
    const [y, m] = data.split('-').map(Number);
    if (!y || !m) return '';
    return new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  })();

  const [anoData, mesData, diaData] = data.split('-').map(Number);
  const anosDisponiveis = Array.from({ length: 11 }, (_, index) => new Date().getFullYear() - 5 + index);
  const diasNoMes = new Date(anoData, mesData, 0).getDate();
  const atualizarParteData = (parte: 'ano' | 'mes' | 'dia', valor: string) => {
    let ano = anoData;
    let mes = mesData;
    let dia = diaData;

    if (parte === 'ano') ano = Number(valor);
    if (parte === 'mes') mes = Number(valor);
    if (parte === 'dia') dia = Number(valor);

    dia = Math.min(dia, new Date(ano, mes, 0).getDate());
    setData(`${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`);
  };

  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] sm:max-w-[1200px] sm:w-[95vw] max-h-[calc(100dvh-1rem)] sm:max-h-[90dvh] overflow-x-hidden overflow-y-hidden bg-zinc-950 border-zinc-800/50 p-0 gap-0 shadow-2xl focus:ring-0 focus:outline-none focus-visible:ring-0 rounded-2xl sm:rounded-[32px] border-zinc-800/30">
        <div className="flex w-full min-h-0 max-h-[calc(100dvh-1rem)] sm:max-h-[90dvh] flex-col overflow-hidden">
          <div className="shrink-0 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-900/50 p-4 sm:p-6 border-b border-zinc-800/50">
            <DialogHeader className="gap-1">
              <DialogTitle className="text-xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3 pr-8">
                <div className={`p-2 rounded-xl transition-colors duration-500 ${tipo === 'RECEITA' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {tipo === 'RECEITA' ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                </div>
                {transacaoParaEditar ? 'Editar Registro' : 'Novo Registro Financeiro'}
              </DialogTitle>
              <DialogDescription className="text-zinc-500 font-medium text-sm sm:text-base ml-0 sm:ml-12">
                {transacaoParaEditar ? 'Ajuste os detalhes da sua movimentação.' : 'Registre suas entradas e saídas com precisão.'}
              </DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
              <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div className="min-w-0 space-y-6">
                <div className="flex min-w-0 gap-2 sm:gap-4 p-1.5 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
                  <button type="button" onClick={() => setTipo('RECEITA')} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all duration-300 ${tipo === 'RECEITA' ? 'bg-green-600 text-white shadow-lg shadow-green-600/20 ring-1 ring-green-500/50' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}>
                    <TrendingUp className="w-5 h-5" /> Receita
                  </button>
                  <button type="button" onClick={() => setTipo('DESPESA')} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all duration-300 ${tipo === 'DESPESA' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20 ring-1 ring-red-500/50' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}>
                    <TrendingDown className="w-5 h-5" /> Despesa
                  </button>
                </div>

                <div>
                  <Label className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-500 mb-2 block">Descrição Principal</Label>
                  <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Assinatura Netflix, Freelance Design..." required className="bg-zinc-900/50 border-zinc-800 text-white h-12 px-4 rounded-xl placeholder:text-zinc-600 focus:border-zinc-700 focus-visible:ring-0 transition-all text-base" />
                </div>

                <div className="grid min-w-0 grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-500 mb-2 block">Valor (R$)</Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">$</span>
                      <Input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" required className="bg-zinc-900/50 border-zinc-800 text-white h-12 pl-8 rounded-xl focus-visible:ring-0 transition-all text-lg font-black" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-500 mb-2 block">Data da Operação</Label>
                    <div className="grid grid-cols-[0.8fr_1fr_1.2fr] gap-2">
                      <select aria-label="Dia da operação" value={diaData} onChange={(e) => atualizarParteData('dia', e.target.value)} className="min-w-0 h-12 rounded-xl border border-zinc-800 bg-zinc-900/50 px-2 text-center text-sm font-bold text-white outline-none focus:border-emerald-500">
                        {Array.from({ length: diasNoMes }, (_, index) => index + 1).map((dia) => <option key={dia} value={dia}>{String(dia).padStart(2, '0')}</option>)}
                      </select>
                      <select aria-label="Mês da operação" value={mesData} onChange={(e) => atualizarParteData('mes', e.target.value)} className="min-w-0 h-12 rounded-xl border border-zinc-800 bg-zinc-900/50 px-1 text-center text-sm font-bold text-white outline-none focus:border-emerald-500">
                        {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((mes, index) => <option key={mes} value={index + 1}>{mes}</option>)}
                      </select>
                      <select aria-label="Ano da operação" value={anoData} onChange={(e) => atualizarParteData('ano', e.target.value)} className="min-w-0 h-12 rounded-xl border border-zinc-800 bg-zinc-900/50 px-1 text-center text-sm font-bold text-white outline-none focus:border-emerald-500">
                        {anosDisponiveis.map((ano) => <option key={ano} value={ano}>{ano}</option>)}
                      </select>
                    </div>
                    {mesRegistroLabel && (
                      <p className="text-[10px] font-bold text-zinc-500 mt-1.5">
                        Registrando em <span className="text-emerald-400 capitalize">{mesRegistroLabel}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-500 mb-2 block">Categoria</Label>
                  <Select value={categoriaId} onValueChange={setCategoriaId}>
                    <SelectTrigger className="bg-zinc-900/50 border-zinc-800 text-white h-12 px-4 rounded-xl focus-visible:ring-0 transition-all">
                      <SelectValue placeholder="Categorize sua transação" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800/80 rounded-xl shadow-2xl">
                      {categoriasDoTipo.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id} className="text-white [&_*]:text-white hover:bg-zinc-900 focus:bg-zinc-900 focus:text-white data-[highlighted]:bg-zinc-900 data-[highlighted]:text-white rounded-lg m-1 py-2 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.cor }} />
                            <span className="font-medium">{cat.nome}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="min-w-0 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-zinc-400 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                    <AlertCircle className="w-4 h-4 text-blue-400 shrink-0" />
                    <p>Toda transação deve estar vinculada a uma <strong>conta bancária</strong> ou ao <strong>Caixa Geral</strong>.</p>
                  </div>
                  <div>
                    <Label className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-500 mb-2 block">Conta Origem/Destino</Label>
                    <Select value={contaBancariaId} onValueChange={setContaBancariaId}>
                      <SelectTrigger className={`bg-zinc-900/50 border-zinc-800 h-11 text-white rounded-xl focus-visible:ring-0 transition-all ${!contaBancariaId ? 'border-red-500/50' : ''}`}>
                        <SelectValue placeholder="Selecionar conta" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-950 border-zinc-800/80 rounded-xl">
                        <SelectItem value="caixa-geral" className="text-white [&_*]:text-white hover:bg-zinc-900 focus:bg-zinc-900 focus:text-white data-[highlighted]:bg-zinc-900 data-[highlighted]:text-white rounded-lg p-2 font-black text-xs uppercase tracking-widest cursor-pointer">
                          🏦 Caixa Geral
                        </SelectItem>
                        {contas.map((conta) => (
                          <SelectItem key={conta.id} value={conta.id} className="text-white [&_*]:text-white hover:bg-zinc-900 focus:bg-zinc-900 focus:text-white data-[highlighted]:bg-zinc-900 data-[highlighted]:text-white rounded-lg p-2 cursor-pointer">
                            {conta.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {transacaoParaEditar?.grupoParcelaId && (
                  <div className="p-4 bg-zinc-900/30 rounded-lg border border-blue-500/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-blue-400 font-bold">Atualizar Série</Label>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Aplicar alterações às próximas transações</p>
                      </div>
                      <Switch checked={aplicarProximas} onCheckedChange={setAplicarProximas} className="data-[state=checked]:bg-blue-600 focus-visible:ring-0" />
                    </div>
                  </div>
                )}

                <div className={`grid gap-4 transition-all duration-300 ${isFixa ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                  <div className="space-y-4 p-4 bg-zinc-900/40 rounded-2xl border border-zinc-800 h-[88px] flex items-center">
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <Label className={`font-black text-xs uppercase tracking-widest ${isFixa ? 'text-blue-500' : 'text-zinc-400'}`}>Fixo / Recorrente</Label>
                        <p className="text-[10px] text-zinc-600 font-bold uppercase mt-0.5">Assinaturas ou Parcelas</p>
                      </div>
                      <Switch checked={isFixa} onCheckedChange={setIsFixa} className="focus-visible:ring-0" />
                    </div>
                  </div>
                  {isFixa && (
                    <div className="p-4 bg-zinc-900/40 rounded-2xl border border-blue-500/20 h-[88px] flex items-center">
                      <div className="flex items-center justify-between w-full gap-4">
                        <div className="shrink-0">
                          <Label className="font-black text-xs uppercase tracking-widest text-purple-400">Parcelas</Label>
                          <p className="text-[10px] text-zinc-600 font-bold uppercase mt-0.5">Restantes</p>
                        </div>
                        <Input type="number" min="1" max="120" value={parcelasRestantes} onChange={(e) => setParcelasRestantes(e.target.value)} placeholder="Infinito" className="bg-zinc-950/50 border-zinc-800 text-white h-10 w-24 rounded-xl focus-visible:ring-0 transition-all font-black text-center placeholder:text-[10px] placeholder:font-bold placeholder:text-zinc-700" />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-500 mb-2 block">Observações Adicionais</Label>
                  <Textarea value={observacoes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setObservacoes(e.target.value)} placeholder="Notas, detalhes da compra..." rows={2} className="bg-zinc-900/50 border-zinc-800 text-white resize-none rounded-xl p-4 placeholder:text-zinc-600 focus-visible:ring-0 transition-all min-h-[80px]" />
                </div>
              </div>
              </div>
            </div>

            <div className="shrink-0 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 border-t border-zinc-800/50 bg-zinc-950/95 p-4 sm:p-6 shadow-[0_-16px_40px_rgba(0,0,0,0.35)]">
              <Button type="button" variant="outline" onClick={onFechar} className="sm:flex-1 border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white h-12 sm:h-14 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest transition-all" disabled={carregando}>
                Descartar
              </Button>
              <Button type="submit" disabled={carregando || !contaBancariaId} className={`sm:flex-[2] h-12 sm:h-14 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-[0.15em] shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] focus-visible:ring-0 ${tipo === 'RECEITA' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} disabled:opacity-50 text-white`}>
                {carregando ? <><Loader2 className="w-5 h-5 mr-3 animate-spin" />Sincronizando...</> : (transacaoParaEditar ? 'Confirmar Alterações' : 'Finalizar Registro')}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
