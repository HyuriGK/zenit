'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Calendar,
  Search,
  Wallet,
  Edit,
  Trash2,
  ArrowUpDown,
  Check,
  Tags,
  TableProperties,
} from 'lucide-react';
import { formatarMoeda } from '@/lib/financeiro-helper';
import { format, startOfMonth, eachMonthOfInterval, subMonths, addMonths, isSameMonth, differenceInDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import NovaTransacaoModal from '@/components/financeiro/NovaTransacaoModal';
import { DeleteGroupModal } from '@/components/financeiro/DeleteGroupModal';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { extrairDataString, parseDataString } from '@/lib/timezone';

interface Transacao {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  tipo: 'RECEITA' | 'DESPESA';
  isFixa: boolean;
  isParcela: boolean;
  parcelaNumero?: number;
  parcelaTotais?: number;
  categoria?: { nome: string; cor: string; icone: string };
  contaBancaria?: { nome: string };
  cartao?: { nome: string };
  paga?: boolean;
}

export default function TransacoesPage() {
  const [transacoesRaw, setTransacoesRaw] = useState<any[]>([]);
  const [categoriasRaw, setCategoriasRaw] = useState<any[]>([]);
  const [contasRaw, setContasRaw] = useState<any[]>([]);
  const [cartoesRaw, setCartoesRaw] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [busca, setBusca] = useState('');
  const [visualizacao, setVisualizacao] = useState<'cartoes' | 'planilha' | 'planilha-selecao'>('cartoes');
  const [linhasSelecionadas, setLinhasSelecionadas] = useState<string[]>([]);
  const [somaSelecionada, setSomaSelecionada] = useState(0);
  const [celulasSelecionadas, setCelulasSelecionadas] = useState<{ chave: string; valor: number }[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [transacaoParaEditar, setTransacaoParaEditar] = useState<any>(null);
  const [dataReferencia, setDataReferencia] = useState(() => startOfMonth(new Date()));
  const [deleteGroupModalOpen, setDeleteGroupModalOpen] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<any>(null);
  const mesesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visualizacao !== 'planilha-selecao') return;
    document.querySelectorAll('th').forEach((cabecalho) => {
      if (cabecalho.textContent === 'Restante provisionado') cabecalho.textContent = 'Restante (R$)';
    });
    const tabela = document.querySelector('.overflow-x-auto table');
    const cabecalho = tabela?.querySelector('thead tr');
    if (cabecalho && cabecalho.children.length === 8) {
      const titulo = document.createElement('th');
      titulo.className = 'border-b border-zinc-800 px-4 py-3 text-left';
      titulo.textContent = 'Categoria';
      cabecalho.appendChild(titulo);
    }
    tabela?.querySelectorAll('tbody tr').forEach((linha, indice) => {
        const categoriaAtual = transacoesFiltradas[indice]?.categoria?.nome || 'Sem categoria';
        const ultimaCelula = linha.lastElementChild as HTMLTableCellElement | null;
        if (linha.children.length === 8) {
        const celula = document.createElement('td');
        celula.className = 'border-b border-zinc-800 px-4 py-3 text-zinc-300';
        celula.textContent = categoriaAtual;
        linha.children[6]?.classList.remove('text-cyan-300');
        linha.children[6]?.classList.add('text-zinc-300');
        linha.appendChild(celula);
        } else if (ultimaCelula) {
          ultimaCelula.textContent = categoriaAtual;
        }
      });
    tabela?.querySelectorAll('tbody tr').forEach((linha, indice) => {
      const transacao = transacoesFiltradas[indice];
      if (!transacao || transacao.isParcela) return;
      if (linha.children[4]) linha.children[4].textContent = '1';
      if (linha.children[5]) linha.children[5].textContent = '1';
      if (linha.children[6]) linha.children[6].textContent = '1';
      if (linha.children[7]) linha.children[7].textContent = formatarMoeda(transacao.valor);
    });
  }, [visualizacao, transacoesRaw, categoriasRaw, contasRaw, cartoesRaw, filtroTipo, busca, dataReferencia]);

  useEffect(() => {
    if (visualizacao !== 'planilha-selecao') return;
    const tabela = document.querySelector('.overflow-x-auto table');
    if (!tabela) return;
    tabela.querySelectorAll('tbody td').forEach((celula) => celula.classList.add('cursor-cell', 'transition-colors', 'hover:bg-zinc-800/70'));
    const aoClicar = (evento: Event) => {
      const mouse = evento as MouseEvent;
      const celula = (mouse.target as HTMLElement).closest('tbody td');
      const linha = celula?.closest('tr');
      if (!linha || !celula || (mouse.target as HTMLElement).closest('button')) return;
      const indice = Array.from(linha.parentElement?.children || []).indexOf(linha);
      const transacao = transacoesFiltradas[indice];
      if (!transacao) return;
      const coluna = Array.from(linha.children).indexOf(celula);
      const restantes = transacao.isParcela && transacao.parcelaTotais && transacao.parcelaNumero ? transacao.parcelaTotais - transacao.parcelaNumero + 1 : 0;
      const valor = coluna === 3 ? transacao.valor : coluna === 7 ? transacao.valor * restantes : 0;
      if (!valor) return;
      const chave = `${transacao.id}-${coluna}`;
      setCelulasSelecionadas((atual) => mouse.ctrlKey ? (atual.some((item) => item.chave === chave) ? atual.filter((item) => item.chave !== chave) : [...atual, { chave, valor }]) : [{ chave, valor }]);
      tabela.querySelectorAll('tbody td').forEach((item) => item.classList.remove('bg-cyan-400/15', 'ring-1', 'ring-inset', 'ring-cyan-300'));
      const chavesAtuais = mouse.ctrlKey ? [...celulasSelecionadas.map((item) => item.chave), chave] : [chave];
      chavesAtuais.forEach((itemChave) => { const [id, colunaSelecionada] = itemChave.split('-'); const posicao = transacoesFiltradas.findIndex((t) => t.id === id); const linhaSelecionada = tabela.querySelectorAll('tbody tr')[posicao]; linhaSelecionada?.children[Number(colunaSelecionada)]?.classList.add('bg-cyan-400/15', 'ring-1', 'ring-inset', 'ring-cyan-300'); });
    };
    tabela.addEventListener('click', aoClicar);
    return () => tabela.removeEventListener('click', aoClicar);
  }, [visualizacao, transacoesRaw, categoriasRaw, contasRaw, cartoesRaw, filtroTipo, busca, dataReferencia]);

  useEffect(() => setSomaSelecionada(celulasSelecionadas.reduce((total, celula) => total + celula.valor, 0)), [celulasSelecionadas]);

  useEffect(() => {
    if (visualizacao !== 'planilha-selecao') return;
    const tabela = document.querySelector('.overflow-x-auto table');
    if (!tabela) return;
    tabela.querySelectorAll('tbody td').forEach((celula) => { celula.classList.remove('bg-cyan-400/15', 'ring-1', 'ring-inset', 'ring-cyan-300'); (celula as HTMLElement).style.backgroundColor = ''; (celula as HTMLElement).style.boxShadow = ''; });
    celulasSelecionadas.forEach(({ chave }) => {
      const ultimoSeparador = chave.lastIndexOf('-');
      const id = chave.slice(0, ultimoSeparador);
      const coluna = Number(chave.slice(ultimoSeparador + 1));
      const indice = transacoesFiltradas.findIndex((transacao) => transacao.id === id);
      const celula = tabela.querySelectorAll('tbody tr')[indice]?.children[coluna] as HTMLElement | undefined;
      celula?.classList.add('bg-cyan-400/15', 'ring-1', 'ring-inset', 'ring-cyan-300');
      if (celula) { celula.style.backgroundColor = 'rgba(6, 182, 212, 0.32)'; celula.style.boxShadow = 'inset 0 0 0 1px rgba(103, 232, 249, 0.95)'; }
    });
  }, [celulasSelecionadas, visualizacao, transacoesRaw, categoriasRaw, contasRaw, cartoesRaw, filtroTipo, busca, dataReferencia]);

  useEffect(() => {
    setSomaSelecionada(transacoesFiltradas.filter((t) => linhasSelecionadas.includes(t.id)).reduce((total, t) => total + t.valor, 0));
  }, [linhasSelecionadas, transacoesRaw, categoriasRaw, contasRaw, cartoesRaw, filtroTipo, busca, dataReferencia]);

  const recarregarDados = useCallback(async () => {
    setCarregando(true);
    try {
      const [rT, rC, rCo, rCa] = await Promise.all([
        fetch('/api/financeiro/transacoes').then(r => r.json()),
        fetch('/api/financeiro/categorias').then(r => r.json()),
        fetch('/api/financeiro/contas').then(r => r.json()),
        fetch('/api/financeiro/cartoes').then(r => r.json()),
      ]);
      setTransacoesRaw(rT.data || []);
      setCategoriasRaw(rC.data || []);
      setContasRaw(rCo.data || []);
      setCartoesRaw(rCa.data || []);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { recarregarDados(); }, [recarregarDados]);

  const transacoes: Transacao[] = transacoesRaw.filter(t => {
    const dataTransacao = parseDataString(t.data);
    return isSameMonth(dataTransacao, dataReferencia);
  }).map(t => {
    const categoria = categoriasRaw.find(c => c.id === t.categoriaId);
    const contaBancaria = contasRaw.find(c => c.id === t.contaBancariaId);
    const cartao = cartoesRaw.find(c => c.id === t.cartaoId);
    return {
      ...t,
      valor: Number(t.valor),
      data: extrairDataString(t.data),
      categoria: categoria ? { nome: categoria.nome, cor: categoria.cor, icone: categoria.icone } : undefined,
      contaBancaria: t.contaBancariaId === 'caixa-geral' ? { nome: 'Caixa Geral' } : (contaBancaria ? { nome: contaBancaria.nome } : undefined),
      cartao: cartao ? { nome: cartao.nome } : undefined,
    };
  }).filter(t => filtroTipo === 'TODOS' || t.tipo === filtroTipo)
    .sort((a, b) => b.valor - a.valor);

  const meses = useMemo(() => {
    const inicio = subMonths(dataReferencia, 5);
    const fim = addMonths(dataReferencia, 6);
    return eachMonthOfInterval({ start: inicio, end: fim });
  }, [dataReferencia]);

  useEffect(() => {
    const mesAtivo = mesesRef.current?.querySelector<HTMLElement>('[data-month-active="true"]');
    mesAtivo?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [dataReferencia, meses]);

  const transacoesFiltradas = transacoes.filter((t) =>
    t.descricao.toLowerCase().includes(busca.toLowerCase())
  );

  const handleEditar = (transacao: any) => {
    const original = transacoesRaw.find(t => t.id === transacao.id);
    if (original) {
      setTransacaoParaEditar(original);
      setModalAberto(true);
    }
  };

  const excluirTransacaoIndividual = async (transacao: any) => {
    const res = await fetch(`/api/financeiro/transacoes/${transacao.id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Falha ao excluir');
    toast.success('Transação excluída!');
    recarregarDados();
  };

  const handleExcluir = async (id: string) => {
    try {
      const transacao = transacoesRaw.find(t => t.id === id);
      if (!transacao) return;
      if (transacao.isParcela || transacao.isFixa) {
        setSelectedForDelete(transacao);
        setDeleteGroupModalOpen(true);
      } else {
        if (!confirm('Tem certeza que deseja excluir esta transação?')) return;
        await excluirTransacaoIndividual(transacao);
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir transação.');
    }
  };

  const handleConfirmDeleteSeries = async () => {
    if (!selectedForDelete) return;
    const loadingToast = toast.loading('Excluindo série...');
    try {
      const res = await fetch(`/api/financeiro/transacoes/${selectedForDelete.id}?tipo=series`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao excluir série');
      toast.dismiss(loadingToast);
      toast.success(`${json.count} transações excluídas!`);
      setDeleteGroupModalOpen(false);
      setSelectedForDelete(null);
      recarregarDados();
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(`Erro ao excluir série: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const handleTogglePaga = async (id: string, atual: boolean) => {
    try {
      await fetch(`/api/financeiro/transacoes/${id}/paga`, { method: 'PATCH' });
      toast.success(!atual ? 'Transação marcada como paga!' : 'Transação marcada como pendente.');
      recarregarDados();
    } catch {
      toast.error('Erro ao atualizar status de pagamento.');
    }
  };

  const totalReceitas = transacoes.filter(t => t.tipo === 'RECEITA').reduce((acc, t) => acc + t.valor, 0);
  const totalDespesas = transacoes.filter(t => t.tipo === 'DESPESA').reduce((acc, t) => acc + t.valor, 0);
  const saldo = totalReceitas - totalDespesas;
  const despesasPendentes = transacoes
    .filter(t => t.tipo === 'DESPESA' && !t.paga)
    .reduce((acc, t) => acc + t.valor, 0);
  const restanteAPagar = totalReceitas - despesasPendentes;

  const getDiasStatus = (dataTransacao: Date) => {
    const hoje = startOfDay(new Date());
    const dataT = startOfDay(dataTransacao);
    const dias = differenceInDays(dataT, hoje);
    if (dias === 0) return { label: 'Vence hoje', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' };
    if (dias < 0) {
      const atraso = Math.abs(dias);
      return { label: `Atrasado ${atraso} ${atraso === 1 ? 'dia' : 'dias'}`, className: 'bg-red-500/10 text-red-500 border-red-500/20' };
    }
    return { label: `Faltam ${dias} ${dias === 1 ? 'dia' : 'dias'}`, className: 'bg-zinc-500/10 text-zinc-400 border-zinc-800' };
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden bg-zinc-950 p-4 lg:p-6 space-y-4 sm:space-y-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex items-center gap-3 sm:gap-4">
          <Link href="/dashboard/financeiro" className="flex items-center text-zinc-500 hover:text-white transition-colors group">
            <span className="font-black text-xs uppercase tracking-[0.2em] group-hover:translate-x-[-4px] transition-transform">Voltar</span>
          </Link>
          <div className="h-4 w-[1px] bg-zinc-800" />
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Registros</h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1 italic">Histórico completo de transações</p>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <Link href="/dashboard/financeiro/categorias" className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 text-xs font-black uppercase tracking-widest text-zinc-200 transition-colors hover:bg-zinc-800">
          <Tags className="h-4 w-4 text-emerald-400" /> Categorias
        </Link>
        <Button
          onClick={() => { setTransacaoParaEditar(null); setModalAberto(true); }}
          className="w-full sm:w-auto shrink-0 bg-zinc-950 border border-zinc-800 hover:bg-zinc-900 text-white px-4 sm:px-6 h-12 rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl group"
        >
          <div className="bg-green-500/20 p-1.5 rounded-lg group-hover:bg-green-500 transition-colors">
            <Plus className="w-4 h-4 text-green-500 group-hover:text-black" />
          </div>
          <span className="font-black text-xs uppercase tracking-widest">Nova Transação</span>
        </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden bg-zinc-900/50 border-zinc-800 hover:border-green-500/40 transition-all">
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400">Receitas</span>
              <div className="p-2 bg-green-500/10 rounded-lg"><TrendingUp className="w-5 h-5 text-green-400" /></div>
            </div>
            <div className="text-3xl font-bold text-green-400">{formatarMoeda(totalReceitas)}</div>
            <p className="text-xs text-zinc-500 mt-1">{transacoes.filter(t => t.tipo === 'RECEITA').length} transações</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden bg-zinc-900/50 border-zinc-800 hover:border-red-500/40 transition-all">
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400">Despesas</span>
              <div className="p-2 bg-red-500/10 rounded-lg"><TrendingDown className="w-5 h-5 text-red-400" /></div>
            </div>
            <div className="text-3xl font-bold text-red-400">{formatarMoeda(totalDespesas)}</div>
            <p className="text-xs text-zinc-500 mt-1">{transacoes.filter(t => t.tipo === 'DESPESA').length} transações</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden bg-zinc-900/50 border-zinc-800 hover:border-green-500/40 transition-all">
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400">Saldo</span>
              <div className="p-2 bg-green-500/20 rounded-lg"><ArrowUpDown className="w-5 h-5 text-green-400" /></div>
            </div>
            <div className={`text-3xl font-bold ${saldo >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatarMoeda(saldo)}</div>
            <p className="text-xs text-zinc-500 mt-1">Receitas - Despesas</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden bg-zinc-900/50 border-zinc-800 hover:border-amber-500/40 transition-all">
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400">Fluxo de caixa</span>
              <div className="p-2 bg-amber-500/10 rounded-lg"><Wallet className="w-5 h-5 text-amber-400" /></div>
            </div>
            <div className={`text-3xl font-bold ${restanteAPagar >= 0 ? 'text-amber-400' : 'text-red-400'}`}>{formatarMoeda(restanteAPagar)}</div>
            <p className="text-xs text-zinc-500 mt-1">Receitas - despesas pendentes</p>
          </div>
        </Card>
      </div>

      <div className="mb-6 flex min-w-0 items-center gap-1 sm:gap-4 bg-zinc-900/50 p-2 rounded-xl border border-zinc-800">
        <Button variant="ghost" size="icon" onClick={() => setDataReferencia(prev => subMonths(prev, 1))} className="text-zinc-400 hover:text-white">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div ref={mesesRef} className="flex min-w-0 flex-1 items-center justify-between overflow-x-auto scrollbar-none gap-2 px-1 sm:px-2">
          {meses.map((mes) => {
            const selecionado = isSameMonth(mes, dataReferencia);
            return (
              <button key={mes.toISOString()} data-month-active={selecionado} onClick={() => setDataReferencia(mes)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${selecionado ? 'bg-green-600 text-white shadow-lg shadow-green-500/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}>
                <span className="capitalize">{format(mes, 'MMM', { locale: ptBR }).replace('.', '')}</span>
                <span className="ml-1 text-[10px] opacity-50">{format(mes, 'yyyy')}</span>
              </button>
            );
          })}
        </div>
        <Button variant="ghost" size="icon" onClick={() => setDataReferencia(prev => addMonths(prev, 1))} className="text-zinc-400 hover:text-white">
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <Input placeholder="Buscar transações..." value={busca} onChange={(e) => setBusca(e.target.value)}
            className="h-10 pl-10 bg-zinc-900/50 border-zinc-800 focus:border-green-500 transition-colors" />
        </div>
        <div className="grid grid-cols-3 gap-2 sm:flex">
          <Button variant="default" onClick={() => setFiltroTipo('TODOS')} className={`h-10 w-full sm:w-auto ${filtroTipo === 'TODOS' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-zinc-900 text-zinc-300 border border-zinc-800 hover:bg-zinc-800 hover:text-white'}`}>Todas</Button>
          <Button variant="default" onClick={() => setFiltroTipo('RECEITA')} className={`h-10 w-full sm:w-auto ${filtroTipo === 'RECEITA' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-zinc-900 text-zinc-300 border border-zinc-800 hover:bg-zinc-800 hover:text-white'}`}>Receitas</Button>
          <Button variant="default" onClick={() => setFiltroTipo('DESPESA')} className={`h-10 w-full sm:w-auto ${filtroTipo === 'DESPESA' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-zinc-900 text-zinc-300 border border-zinc-800 hover:bg-zinc-800 hover:text-white'}`}>Despesas</Button>
          <Button variant="default" onClick={() => setVisualizacao((atual) => atual === 'cartoes' ? 'planilha-selecao' : 'cartoes')} className={`h-10 w-full sm:w-auto border ${visualizacao !== 'cartoes' ? 'bg-cyan-500 text-zinc-950 border-cyan-400 hover:bg-cyan-400' : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:text-white'}`}><TableProperties className="mr-2 h-4 w-4" />Planilha</Button>
        </div>
      </div>

      {carregando ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : transacoesFiltradas.length === 0 ? (
        <Card className="bg-zinc-900/50 border-zinc-800 p-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-full mb-4">
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Nenhuma transação encontrada</h3>
            <p className="text-zinc-400 mb-6">Comece criando sua primeira transação</p>
            <Button onClick={() => { setTransacaoParaEditar(null); setModalAberto(true); }}
              className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700">
              <Plus className="w-4 h-4 mr-2" />Nova Transação
            </Button>
          </div>
        </Card>
      ) : (
        <>
        {visualizacao === 'planilha-selecao' && <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950"><table className="min-w-[1080px] w-full text-sm"><thead className="bg-zinc-900 text-[10px] uppercase tracking-wider text-zinc-400"><tr><th className="border-b border-r border-zinc-800 px-4 py-3"><Checkbox checked={linhasSelecionadas.length === transacoesFiltradas.length && transacoesFiltradas.length > 0} onCheckedChange={(marcar) => setLinhasSelecionadas(marcar ? transacoesFiltradas.map((t) => t.id) : [])} /></th><th className="border-b border-r border-zinc-800 px-4 py-3 text-left">Vencimento</th><th className="border-b border-r border-zinc-800 px-4 py-3 text-left">Descrição</th><th className="border-b border-r border-zinc-800 px-4 py-3 text-right">Valor mensal</th><th className="border-b border-r border-zinc-800 px-4 py-3 text-center">Parcela atual</th><th className="border-b border-r border-zinc-800 px-4 py-3 text-center">Quant. parcelas</th><th className="border-b border-r border-zinc-800 px-4 py-3 text-center">Restantes</th><th className="border-b border-zinc-800 px-4 py-3 text-right">Restante provisionado</th></tr></thead><tbody>{transacoesFiltradas.map((t) => { const restante = t.isParcela && t.parcelaTotais && t.parcelaNumero ? t.parcelaTotais - t.parcelaNumero + 1 : 0; const marcado = linhasSelecionadas.includes(t.id); return <tr key={t.id} className={marcado ? 'bg-cyan-500/5' : 'hover:bg-zinc-900/70'}><td className="border-b border-r border-zinc-800 px-4 py-3 text-center"><Checkbox checked={marcado} onCheckedChange={() => setLinhasSelecionadas((atual) => marcado ? atual.filter((id) => id !== t.id) : [...atual, t.id])} /></td><td className="border-b border-r border-zinc-800 px-4 py-3 text-zinc-400">{format(parseDataString(t.data), 'dd/MM/yyyy')}</td><td className="border-b border-r border-zinc-800 px-4 py-3 font-medium text-zinc-100">{t.descricao}</td><td className="border-b border-r border-zinc-800 px-4 py-3 text-right font-bold text-zinc-100">{formatarMoeda(t.valor)}</td><td className="border-b border-r border-zinc-800 px-4 py-3 text-center">{t.isParcela ? t.parcelaNumero : '—'}</td><td className="border-b border-r border-zinc-800 px-4 py-3 text-center">{t.isParcela ? t.parcelaTotais : '—'}</td><td className="border-b border-r border-zinc-800 px-4 py-3 text-center text-cyan-300">{t.isParcela ? restante : '—'}</td><td className="border-b border-zinc-800 px-4 py-3 text-right text-amber-300">{t.isParcela ? formatarMoeda(t.valor * restante) : '—'}</td></tr>})}</tbody></table></div>}
        <div className={visualizacao === 'cartoes' ? 'space-y-2' : 'hidden'}>
          {transacoesFiltradas.map((transacao) => (
            <Card key={transacao.id} className={`overflow-hidden bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all group hover:shadow-lg ${transacao.paga ? 'opacity-60 grayscale-[0.5]' : ''}`}>
              <div className="p-4 flex flex-wrap items-center gap-3 sm:flex-nowrap sm:gap-4">
                <div className="flex items-center justify-center p-1">
                  <Checkbox
                    checked={transacao.paga || false}
                    onCheckedChange={() => handleTogglePaga(transacao.id, transacao.paga || false)}
                    className={`h-6 w-6 border-2 transition-all ${transacao.paga ? 'bg-green-600 border-green-600 text-white' : 'border-zinc-700 hover:border-green-500'}`}
                  />
                </div>

                <div className={`relative p-3 rounded-xl flex-shrink-0 ${transacao.tipo === 'RECEITA' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  {transacao.tipo === 'RECEITA' ? <TrendingUp className="w-5 h-5 text-green-400" /> : <TrendingDown className="w-5 h-5 text-red-400" />}
                  {transacao.paga && (
                    <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-zinc-950">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 basis-[calc(100%-5rem)] sm:basis-auto">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className={`min-w-0 break-words font-bold text-base leading-tight ${transacao.paga ? 'text-zinc-400 line-through' : 'text-white'}`}>{transacao.descricao}</h3>
                    <div className="flex shrink-0 gap-1">
                      {transacao.isFixa && <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded uppercase">Fixa</span>}
                      {transacao.isParcela && <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 text-[10px] font-bold rounded uppercase">{transacao.parcelaNumero}/{transacao.parcelaTotais}</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-zinc-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(parseDataString(transacao.data), "dd 'de' MMM", { locale: ptBR })}
                    </div>
                    {transacao.categoria && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: transacao.categoria.cor }} />
                        <span className="text-zinc-400">{transacao.categoria.nome}</span>
                      </div>
                    )}
                    {transacao.contaBancaria && (
                      <div className="flex items-center gap-1 border-l border-zinc-800 pl-3">
                        <Wallet className="w-3.5 h-3.5" />
                        {transacao.contaBancaria.nome}
                      </div>
                    )}
                  </div>
                </div>

                <div className="basis-full ml-10 flex items-center justify-between gap-3 border-t border-zinc-800/70 pt-3 sm:ml-0 sm:basis-auto sm:border-0 sm:pt-0 sm:flex-col sm:items-end sm:gap-1.5 sm:min-w-[120px]">
                  <div className="min-w-0">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-600 sm:hidden">Valor</span>
                    <div className={`text-lg font-black tracking-tight ${transacao.tipo === 'RECEITA' ? 'text-green-400' : 'text-red-400'} ${transacao.paga ? 'opacity-40' : ''}`}>
                      {transacao.tipo === 'RECEITA' ? '+' : '-'} {formatarMoeda(transacao.valor)}
                    </div>
                  </div>
                  {!transacao.paga && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] border font-bold uppercase tracking-wider ${getDiasStatus(parseDataString(transacao.data)).className}`}>
                      {getDiasStatus(parseDataString(transacao.data)).label}
                    </span>
                  )}
                  {transacao.paga && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] border border-green-500/20 bg-green-500/10 text-green-500 font-bold uppercase tracking-wider">Pago</span>
                  )}
                </div>

                <div className="order-first flex basis-full items-center justify-end gap-2 border-b border-zinc-800/70 pb-3 sm:order-none sm:basis-auto sm:border-0 sm:pb-0 sm:ml-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEditar(transacao)} className="h-8 px-2.5 text-zinc-300 hover:text-white hover:bg-zinc-800">
                    <Edit className="w-4 h-4" />
                    <span className="ml-1.5 text-xs font-bold">Editar</span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleExcluir(transacao.id)} className="h-8 px-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10">
                    <Trash2 className="w-4 h-4" />
                    <span className="ml-1.5 text-xs font-bold">Excluir</span>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
        </>
      )}

      {visualizacao === 'planilha-selecao' && celulasSelecionadas.length > 0 && <div className="fixed bottom-5 left-4 right-4 z-40 mx-auto flex max-w-md items-center justify-between rounded-2xl border border-cyan-400/25 bg-zinc-900/95 p-4 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl sm:left-auto"><div><p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Seleção de células</p><p className="mt-1 text-sm text-zinc-300">{celulasSelecionadas.length} valor(es) selecionado(s)</p></div><div className="border-l border-zinc-700 pl-4 text-right"><p className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">Soma</p><strong className="text-xl font-black text-white">{formatarMoeda(somaSelecionada)}</strong></div></div>}

      <NovaTransacaoModal
        aberto={modalAberto}
        onFechar={() => { setModalAberto(false); setTransacaoParaEditar(null); }}
        transacaoParaEditar={transacaoParaEditar}
        dataReferencia={dataReferencia}
        onSucesso={recarregarDados}
      />
      <DeleteGroupModal
        open={deleteGroupModalOpen}
        onClose={() => { setDeleteGroupModalOpen(false); setSelectedForDelete(null); }}
        onConfirmSingle={() => {
          if (selectedForDelete) {
            excluirTransacaoIndividual(selectedForDelete);
            setDeleteGroupModalOpen(false);
            setSelectedForDelete(null);
          }
        }}
        onConfirmSeries={handleConfirmDeleteSeries}
        title={selectedForDelete?.isParcela ? 'Excluir Parcelas' : 'Excluir Transações Fixas'}
        description={
          selectedForDelete?.isParcela
            ? 'Esta transação faz parte de um parcelamento. Deseja excluir apenas este mês ou todas as parcelas restantes?'
            : 'Esta é uma transação fixa. Deseja excluir apenas este mês ou todas as recorrências futuras?'
        }
        isParcela={selectedForDelete?.isParcela}
      />
    </div>
  );
}
