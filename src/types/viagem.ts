// Enums
export enum StatusViagem {
  PLANEJADA = 'PLANEJADA',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  CONCLUIDA = 'CONCLUIDA',
  CANCELADA = 'CANCELADA',
}

export enum PropostoViagem {
  LAZER = 'LAZER',
  TRABALHO = 'TRABALHO',
  ESTUDO = 'ESTUDO',
  OUTRO = 'OUTRO',
}

export enum TipoTransporte {
  AVIAO = 'AVIAO',
  CARRO = 'CARRO',
  ONIBUS = 'ONIBUS',
  TREM = 'TREM',
  TAXI = 'TAXI',
  UBER = 'UBER',
  OUTRO = 'OUTRO',
}

export enum CategoriaAtividade {
  TURISMO = 'TURISMO',
  TRABALHO = 'TRABALHO',
  LAZER = 'LAZER',
  ALIMENTACAO = 'ALIMENTACAO',
  OUTRO = 'OUTRO',
}

export enum TipoDocumento {
  PASSAPORTE = 'PASSAPORTE',
  VISTO = 'VISTO',
  RG = 'RG',
  CNH = 'CNH',
  SEGURO_VIAGEM = 'SEGURO_VIAGEM',
  RESERVA = 'RESERVA',
  OUTRO = 'OUTRO',
}

// Interfaces principais
export interface Viagem {
  id: string;
  nome: string;
  descricao?: string;
  proposito: PropostoViagem;
  status: StatusViagem;
  dataInicio: string | Date;
  dataFim: string | Date;
  orcamentoTotal?: number;
  notasGerais?: string;
  avaliacaoGeral?: number;
  diario?: string;
  userId: string;
  createdAt: string | Date;
  updatedAt: string | Date;

  // Relações
  destinos?: DestinoViagem[];
  transportes?: TransporteViagem[];
  hospedagens?: HospedagemViagem[];
  atividades?: AtividadeViagem[];
  despesas?: DespesaViagem[];
}

export interface DestinoViagem {
  id: string;
  ordem: number;
  nome: string;
  cidade: string;
  pais: string;
  endereco?: string;
  latitude?: number;
  longitude?: number;
  dataChegada: string | Date;
  dataSaida: string | Date;
  fusoHorario?: string;
  idioma?: string;
  moeda?: string;
  voltagem?: string;
  tomada?: string;
  costumes?: string;
  gorjetas?: string;
  emergencia?: string;
  frasesBasicas?: string;
  temperaturaMed?: string;
  previsaoClima?: string;
  viagemId: string;
  createdAt: string | Date;
  updatedAt: string | Date;

  // Relações
  locaisSalvos?: LocalSalvo[];
}

export interface LocalSalvo {
  id: string;
  nome: string;
  tipo: string;
  endereco?: string;
  latitude?: number;
  longitude?: number;
  telefone?: string;
  notas?: string;
  favorito: boolean;
  destinoId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface TransporteViagem {
  id: string;
  tipo: TipoTransporte;
  descricao?: string;
  dataHora: string | Date;
  origem?: string;
  destino?: string;
  companhia?: string;
  numeroVoo?: string;
  assento?: string;
  horarioEmbarque?: string | Date;
  portaoEmbarque?: string;
  conexao?: string;
  horarioChegada?: string | Date;
  codigoReserva?: string;
  empresa?: string;
  placaVeiculo?: string;
  arquivoUrl?: string;
  rotaUrl?: string;
  tempoEstimado?: string;
  notas?: string;
  viagemId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface HospedagemViagem {
  id: string;
  tipo: string;
  nome: string;
  checkIn: string | Date;
  checkOut: string | Date;
  endereco?: string;
  cidade?: string;
  latitude?: number;
  longitude?: number;
  telefone?: string;
  email?: string;
  codigoReserva?: string;
  website?: string;
  comprovanteUrl?: string;
  avaliacaoPessoal?: number;
  notas?: string;
  viagemId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ChecklistItem {
  item: string;
  concluido: boolean;
}

export interface AtividadeViagem {
  id: string;
  titulo: string;
  descricao?: string;
  data: string | Date;
  horaInicio?: string;
  horaFim?: string;
  local?: string;
  endereco?: string;
  latitude?: number;
  longitude?: number;
  categoria: CategoriaAtividade;
  prioridade: number;
  concluida: boolean;
  favorita: boolean;
  tempoEstimado?: string;
  checklist?: ChecklistItem[];
  notas?: string;
  viagemId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface DespesaViagem {
  id: string;
  descricao: string;
  valor: number;
  moeda: string;
  valorConvertido?: number;
  data: string | Date;
  categoria: string;
  formaPagamento?: string;
  notas?: string;
  viagemId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface DocumentoViagem {
  id: string;
  tipo: TipoDocumento;
  nome: string;
  numero?: string;
  dataEmissao?: string | Date;
  dataValidade?: string | Date;
  arquivoUrl?: string;
  notas?: string;
  userId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// DTOs para criação
export interface CreateViagemDTO {
  nome: string;
  descricao?: string;
  proposito: PropostoViagem;
  dataInicio: Date;
  dataFim: Date;
  orcamentoTotal?: number;
  notasGerais?: string;
}

export interface CreateDestinoDTO {
  nome: string;
  cidade: string;
  pais: string;
  dataChegada: Date;
  dataSaida: Date;
  ordem?: number;
}

export interface CreateTransporteDTO {
  tipo: TipoTransporte;
  dataHora: Date;
  origem?: string;
  destino?: string;
  descricao?: string;
}

export interface CreateHospedagemDTO {
  tipo: string;
  nome: string;
  checkIn: Date;
  checkOut: Date;
  endereco?: string;
  cidade?: string;
}

export interface CreateAtividadeDTO {
  titulo: string;
  data: Date;
  categoria: CategoriaAtividade;
  descricao?: string;
  horaInicio?: string;
  horaFim?: string;
  local?: string;
}

export interface CreateDespesaDTO {
  descricao: string;
  valor: number;
  data: Date;
  categoria: string;
  moeda?: string;
  formaPagamento?: string;
}

// Tipos de resposta
export interface ViagemComDetalhes extends Viagem {
  destinos?: DestinoViagem[];
  transportes?: TransporteViagem[];
  hospedagens?: HospedagemViagem[];
  atividades?: AtividadeViagem[];
  despesas?: DespesaViagem[];
  totalGasto: number;
  diasRestantes: number;
}

// Estatísticas
export interface EstatisticasViagem {
  totalViagens: number;
  paisesVisitados: number;
  cidadesVisitadas: number;
  totalGasto: number;
  tempoViajando: number; // em dias
  viagemMaisLonga: string;
  destinoFavorito: string;
}
