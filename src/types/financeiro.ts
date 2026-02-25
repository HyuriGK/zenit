// src/types/financeiro.ts
// Types para o módulo financeiro

// Removed Prisma

// ========================================
// ENUMS
// ========================================

export type TipoConta = 'CORRENTE' | 'POUPANCA' | 'INVESTIMENTO';
export type TipoTransacao = 'RECEITA' | 'DESPESA';
export type StatusObjetivo = 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';

// ========================================
// CONTA BANCÁRIA
// ========================================

export interface ContaBancaria {
  id: string;
  nome: string;
  tipo: TipoConta;
  banco?: string;
  saldoInicial: number;
  saldoAtual: number;
  cor: string;
  icone: string;
  ativa: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContaBancariaForm {
  nome: string;
  tipo: TipoConta;
  banco?: string;
  saldoInicial: number;
  cor?: string;
  icone?: string;
}

// ========================================
// CARTÃO
// ========================================

export interface Cartao {
  id: string;
  nome: string;
  bandeira?: string;
  ultimosDigitos?: string;
  limite?: number;
  diaVencimento?: number;
  diaFechamento?: number;
  cor: string;
  icone: string;
  ativo: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartaoForm {
  nome: string;
  bandeira?: string;
  ultimosDigitos?: string;
  limite?: number;
  diaVencimento?: number;
  diaFechamento?: number;
  cor?: string;
  icone?: string;
}

// ========================================
// CATEGORIA
// ========================================

export interface Categoria {
  id: string;
  nome: string;
  tipo: TipoTransacao;
  cor: string;
  icone: string;
  categoriaPaiId?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  subcategorias?: Categoria[];
}

export interface CategoriaForm {
  nome: string;
  tipo: TipoTransacao;
  cor?: string;
  icone?: string;
  categoriaPaiId?: string;
}

// ========================================
// TRANSAÇÃO
// ========================================

export interface Transacao {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  tipo: TipoTransacao;
  observacoes?: string;

  // Recorrência
  isFixa: boolean;

  // Parcelamento
  isParcela: boolean;
  parcelaNumero?: number;
  parcelaTotais?: number;
  grupoParcelaId?: string;

  // Relações
  categoriaId?: string;
  categoria?: Categoria;
  contaBancariaId?: string;
  contaBancaria?: ContaBancaria;
  cartaoId?: string;
  cartao?: Cartao;
  objetivoId?: string;

  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransacaoForm {
  descricao: string;
  valor: number;
  data: Date;
  tipo: TipoTransacao;
  observacoes?: string;

  // Recorrência
  isFixa?: boolean;

  // Parcelamento
  isParcela?: boolean;
  parcelaTotais?: number;

  // Relações
  categoriaId?: string;
  contaBancariaId?: string;
  cartaoId?: string;
  objetivoId?: string;
}

// ========================================
// OBJETIVO FINANCEIRO
// ========================================

export interface ObjetivoFinanceiro {
  id: string;
  nome: string;
  descricao?: string;
  valorMeta: number;
  valorAtual: number;
  dataInicio: string;
  dataMeta?: string;
  isReservaEmergencia: boolean;
  cor: string;
  icone: string;
  status: StatusObjetivo;
  userId: string;
  createdAt: string;
  updatedAt: string;

  // Campos calculados
  porcentagemAtingida?: number;
  falta?: number;
}

export interface ObjetivoFinanceiroForm {
  nome: string;
  descricao?: string;
  valorMeta: number;
  dataMeta?: Date;
  isReservaEmergencia?: boolean;
  cor?: string;
  icone?: string;
}

// ========================================
// RESUMO FINANCEIRO
// ========================================

export interface ResumoMensal {
  mes: string; // "2026-01"
  receitas: number;
  despesas: number;
  saldo: number;
  despesasFixas: number;
  despesasVariaveis: number;
  sobra: number; // receitas - despesasFixas
}

export interface GastosPorCategoria {
  categoriaId: string;
  categoriaNome: string;
  cor: string;
  icone: string;
  total: number;
  porcentagem: number;
  transacoes: number;
}

export interface SaldoTotal {
  totalContas: number;
  totalCartoes: number; // saldo negativo (fatura)
  saldoGeral: number;
  contas: Array<{
    id: string;
    nome: string;
    saldo: number;
    tipo: TipoConta;
  }>;
}

// ========================================
// FILTROS E QUERIES
// ========================================

export interface FiltroTransacoes {
  tipo?: TipoTransacao;
  categoriaId?: string;
  contaBancariaId?: string;
  cartaoId?: string;
  dataInicio?: Date;
  dataFim?: Date;
  isFixa?: boolean;
  isParcela?: boolean;
}

export interface FiltroResumo {
  mes: string; // "2026-01"
  ano: string; // "2026"
}

// ========================================
// CONTRIBUIÇÃO PARA OBJETIVO
// ========================================

export interface ContribuicaoObjetivo {
  objetivoId: string;
  valor: number;
  data: Date;
  descricao?: string;
  contaBancariaId?: string;
}

// ========================================
// CATEGORIAS PADRÃO
// ========================================

export const CATEGORIAS_PADRAO_RECEITA = [
  { nome: 'Salário', icone: 'briefcase', cor: '#10B981' },
  { nome: 'Freelance', icone: 'laptop', cor: '#3B82F6' },
  { nome: 'Investimentos', icone: 'trending-up', cor: '#10B981' },
  { nome: 'Outros', icone: 'plus-circle', cor: '#6B7280' },
];

export const CATEGORIAS_PADRAO_DESPESA = [
  { nome: 'Alimentação', icone: 'utensils', cor: '#EF4444' },
  { nome: 'Transporte', icone: 'car', cor: '#F59E0B' },
  { nome: 'Moradia', icone: 'home', cor: '#10B981' },
  { nome: 'Saúde', icone: 'heart', cor: '#EC4899' },
  { nome: 'Educação', icone: 'book', cor: '#3B82F6' },
  { nome: 'Lazer', icone: 'gamepad', cor: '#10B981' },
  { nome: 'Compras', icone: 'shopping-bag', cor: '#F59E0B' },
  { nome: 'Contas', icone: 'file-text', cor: '#6B7280' },
  { nome: 'Outros', icone: 'more-horizontal', cor: '#9CA3AF' },
];

// ========================================
// ÍCONES DISPONÍVEIS
// ========================================

export const ICONES_FINANCEIRO = [
  'wallet',
  'credit-card',
  'banknote',
  'coins',
  'piggy-bank',
  'trending-up',
  'trending-down',
  'target',
  'briefcase',
  'shopping-bag',
  'home',
  'car',
  'utensils',
  'heart',
  'book',
  'gamepad',
  'plane',
  'gift',
  'tag',
];

// ========================================
// CORES DISPONÍVEIS
// ========================================

export const CORES_FINANCEIRO = [
  { nome: 'Verde', hex: '#10B981' },
  { nome: 'Azul', hex: '#3B82F6' },
  { nome: 'Roxo', hex: '#10B981' },
  { nome: 'Rosa', hex: '#EC4899' },
  { nome: 'Laranja', hex: '#F59E0B' },
  { nome: 'Vermelho', hex: '#EF4444' },
  { nome: 'Amarelo', hex: '#FBBF24' },
  { nome: 'Cinza', hex: '#6B7280' },
];