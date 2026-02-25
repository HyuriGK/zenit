// src/lib/financeiro-helper.ts
// Funções auxiliares para cálculos financeiros

import { format, addMonths } from 'date-fns';
import type { Transacao, ResumoMensal, GastosPorCategoria } from '@/types/financeiro';

/**
 * Formata valor monetário para exibição
 */
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

/**
 * Converte Decimal do Prisma para número
 */
export function decimalParaNumero(valor: unknown): number {
  if (typeof valor === 'number') return valor;
  if (typeof valor === 'string') return parseFloat(valor);
  if (valor && typeof valor === 'object' && 'toNumber' in valor && typeof (valor as { toNumber: () => number }).toNumber === 'function') {
    return (valor as { toNumber: () => number }).toNumber();
  }
  return 0;
}

/**
 * Calcula resumo mensal a partir de transações
 */
export function calcularResumoMensal(transacoes: Transacao[]): ResumoMensal {
  let receitas = 0;
  let despesas = 0;
  let despesasFixas = 0;
  let despesasVariaveis = 0;

  transacoes.forEach((t) => {
    const valor = typeof t.valor === 'number' ? t.valor : decimalParaNumero(t.valor);
    
    if (t.tipo === 'RECEITA') {
      receitas += valor;
    } else {
      despesas += valor;
      if (t.isFixa) {
        despesasFixas += valor;
      } else {
        despesasVariaveis += valor;
      }
    }
  });

  const saldo = receitas - despesas;
  const sobra = receitas - despesasFixas;

  return {
    mes: format(new Date(), 'yyyy-MM'),
    receitas,
    despesas,
    saldo,
    despesasFixas,
    despesasVariaveis,
    sobra,
  };
}

/**
 * Agrupa gastos por categoria
 */
export function agruparGastosPorCategoria(transacoes: Transacao[]): GastosPorCategoria[] {
  const despesas = transacoes.filter((t) => t.tipo === 'DESPESA');
  const totalDespesas = despesas.reduce((acc, t) => {
    const valor = typeof t.valor === 'number' ? t.valor : decimalParaNumero(t.valor);
    return acc + valor;
  }, 0);

  const grupos = new Map<string, {
    nome: string;
    cor: string;
    icone: string;
    total: number;
    count: number;
  }>();

  despesas.forEach((t) => {
    const categoriaId = t.categoriaId || 'sem-categoria';
    const categoriaNome = t.categoria?.nome || 'Sem categoria';
    const cor = t.categoria?.cor || '#6B7280';
    const icone = t.categoria?.icone || 'tag';
    const valor = typeof t.valor === 'number' ? t.valor : decimalParaNumero(t.valor);

    const atual = grupos.get(categoriaId);
    if (atual) {
      atual.total += valor;
      atual.count += 1;
    } else {
      grupos.set(categoriaId, {
        nome: categoriaNome,
        cor,
        icone,
        total: valor,
        count: 1,
      });
    }
  });

  const resultado: GastosPorCategoria[] = [];
  grupos.forEach((value, key) => {
    resultado.push({
      categoriaId: key,
      categoriaNome: value.nome,
      cor: value.cor,
      icone: value.icone,
      total: value.total,
      porcentagem: totalDespesas > 0 ? (value.total / totalDespesas) * 100 : 0,
      transacoes: value.count,
    });
  });

  // Ordenar por total decrescente
  return resultado.sort((a, b) => b.total - a.total);
}

/**
 * Gera ID de grupo para parcelas
 */
export function gerarGrupoParcelaId(): string {
  return `parcela_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Gera array de datas para parcelas
 */
export function gerarDatasParcelas(dataInicial: Date, quantidadeParcelas: number): Date[] {
  const datas: Date[] = [];
  for (let i = 0; i < quantidadeParcelas; i++) {
    datas.push(addMonths(dataInicial, i));
  }
  return datas;
}

/**
 * Calcula valor de cada parcela
 */
export function calcularValorParcela(valorTotal: number, quantidadeParcelas: number): number {
  return Math.round((valorTotal / quantidadeParcelas) * 100) / 100;
}

/**
 * Calcula porcentagem de progresso de um objetivo
 */
export function calcularProgressoObjetivo(valorAtual: number, valorMeta: number): number {
  if (valorMeta === 0) return 0;
  const progresso = (valorAtual / valorMeta) * 100;
  return Math.min(progresso, 100);
}

/**
 * Calcula quanto falta para atingir objetivo
 */
export function calcularFaltaObjetivo(valorAtual: number, valorMeta: number): number {
  const falta = valorMeta - valorAtual;
  return Math.max(falta, 0);
}

/**
 * Valida se valor é numérico e positivo
 */
export function validarValor(valor: unknown): boolean {
  const num = typeof valor === 'string' ? parseFloat(valor) : typeof valor === 'number' ? valor : NaN;
  return !isNaN(num) && num > 0;
}

/**
 * Calcula média mensal de gastos em uma categoria
 */
export function calcularMediaMensal(transacoes: Transacao[], meses: number = 3): number {
  if (transacoes.length === 0 || meses === 0) return 0;
  
  const total = transacoes.reduce((acc, t) => {
    const valor = typeof t.valor === 'number' ? t.valor : decimalParaNumero(t.valor);
    return acc + valor;
  }, 0);
  
  return total / meses;
}

/**
 * Identifica transações duplicadas (mesmo valor, descrição e data próxima)
 */
export function identificarDuplicadas(transacoes: Transacao[]): string[] {
  const duplicadas: string[] = [];
  const seen = new Map<string, Transacao>();

  transacoes.forEach((t) => {
    const key = `${t.descricao.toLowerCase()}_${t.valor}_${format(new Date(t.data), 'yyyy-MM-dd')}`;
    
    if (seen.has(key)) {
      duplicadas.push(t.id);
    } else {
      seen.set(key, t);
    }
  });

  return duplicadas;
}

/**
 * Sugere categoria baseado em descrição (ML básico)
 */
export function sugerirCategoria(descricao: string): string | null {
  const desc = descricao.toLowerCase();
  
  const padroes: Record<string, string[]> = {
    'alimentacao': ['mercado', 'supermercado', 'ifood', 'restaurante', 'lanche', 'padaria', 'açougue'],
    'transporte': ['uber', '99', 'posto', 'gasolina', 'combustivel', 'estacionamento', 'onibus', 'metrô'],
    'moradia': ['aluguel', 'condominio', 'luz', 'água', 'gas', 'internet', 'iptu'],
    'saude': ['farmacia', 'hospital', 'consulta', 'medico', 'plano de saude', 'dentista'],
    'lazer': ['cinema', 'show', 'ingresso', 'netflix', 'spotify', 'academia', 'clube'],
    'educacao': ['curso', 'livro', 'escola', 'faculdade', 'mensalidade'],
  };

  for (const [categoria, keywords] of Object.entries(padroes)) {
    if (keywords.some((keyword) => desc.includes(keyword))) {
      return categoria;
    }
  }

  return null;
}

/**
 * Calcula recomendação de reserva de emergência (6 meses de despesas)
 */
export function calcularReservaEmergencia(despesasMensaisMedias: number): number {
  return despesasMensaisMedias * 6;
}

/**
 * Formata descrição de parcela
 */
export function formatarDescricaoParcela(descricao: string, atual: number, total: number): string {
  return `${descricao} (${atual}/${total})`;
}