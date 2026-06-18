import Dexie, { type Table } from 'dexie';

// --- Interfaces representing the DB Schema ---

// User Profile (single offline user)
export interface OfflineUser {
    id: string;
    name: string;
    email: string;
    image?: string;
    plano: 'FREE' | 'PREMIUM';
    createdAt: Date;
    updatedAt: Date;
}

export interface Compromisso {
    id: string;
    titulo: string;
    descricao?: string;
    data: Date;
    horaInicio: string;
    horaFim?: string;
    categoria?: string;
    cor: string;
    concluido: boolean;
    isRecorrente: boolean;
    tipoRecorrencia?: string;
    intervaloRecorrencia?: number;
    dataFimRecorrencia?: Date;
    recorrenciaGrupoId?: string;
    recorrenciaInstancia?: number;
    syncWithGoogle: boolean;
    googleEventId?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Atividade {
    id: string;
    tipo: string;
    titulo: string;
    descricao?: string;
    metadata?: any;
    icone: string;
    cor: string;
    createdAt: Date;
}

export interface ContaBancaria {
    id: string;
    nome: string;
    tipo: 'CORRENTE' | 'POUPANCA' | 'INVESTIMENTO';
    banco?: string;
    saldoInicial: number;
    saldoAtual: number;
    cor: string;
    icone: string;
    ativa: boolean;
    createdAt: Date;
    updatedAt: Date;
}

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
    createdAt: Date;
    updatedAt: Date;
}

export interface Categoria {
    id: string;
    nome: string;
    tipo: 'RECEITA' | 'DESPESA';
    cor: string;
    icone: string;
    categoriaPaiId?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Transacao {
    id: string;
    descricao: string;
    valor: number;
    data: Date;
    tipo: 'RECEITA' | 'DESPESA';
    observacoes?: string;
    isFixa: boolean;
    isParcela: boolean;
    parcelaNumero?: number;
    parcelaTotais?: number;
    grupoParcelaId?: string;
    categoriaId?: string;
    contaBancariaId?: string;
    cartaoId?: string;
    objetivoId?: string;
    paga?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface ObjetivoFinanceiro {
    id: string;
    nome: string;
    descricao?: string;
    valorMeta: number;
    valorAtual: number;
    dataInicio: Date;
    dataMeta?: Date;
    isReservaEmergencia: boolean;
    cor: string;
    icone: string;
    status: 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';
    createdAt: Date;
    updatedAt: Date;
}

export interface Viagem {
    id: string;
    nome: string;
    descricao?: string;
    proposito: 'LAZER' | 'TRABALHO' | 'ESTUDO' | 'OUTRO';
    status: 'PLANEJADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';
    dataInicio: Date;
    dataFim: Date;
    orcamentoTotal?: number;
    notasGerais?: string;
    avaliacaoGeral?: number;
    diario?: string;
    createdAt: Date;
    updatedAt: Date;
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
    dataChegada: Date;
    dataSaida: Date;
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
    createdAt: Date;
    updatedAt: Date;
}

export interface DespesaViagem {
    id: string;
    descricao: string;
    valor: number;
    moeda: string;
    valorConvertido?: number;
    data: Date;
    categoria: string;
    formaPagamento?: string;
    notas?: string;
    viagemId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface AtividadeViagem {
    id: string;
    titulo: string;
    descricao?: string;
    data: Date;
    horaInicio?: string;
    horaFim?: string;
    local?: string;
    endereco?: string;
    latitude?: number;
    longitude?: number;
    categoria: 'TURISMO' | 'TRABALHO' | 'LAZER' | 'ALIMENTACAO' | 'OUTRO';
    prioridade: number;
    concluida: boolean;
    favorita: boolean;
    tempoEstimado?: string;
    checklist?: any;
    notas?: string;
    viagemId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface HospedagemViagem {
    id: string;
    tipo: string;
    nome: string;
    checkIn: Date;
    checkOut: Date;
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
    createdAt: Date;
    updatedAt: Date;
}

export interface TransporteViagem {
    id: string;
    tipo: 'AVIAO' | 'CARRO' | 'ONIBUS' | 'TREM' | 'TAXI' | 'UBER' | 'OUTRO';
    descricao?: string;
    dataHora: Date;
    origem?: string;
    destino?: string;
    companhia?: string;
    numeroVoo?: string;
    assento?: string;
    horarioEmbarque?: Date;
    portaoEmbarque?: string;
    conexao?: string;
    horarioChegada?: Date;
    codigoReserva?: string;
    empresa?: string;
    placaVeiculo?: string;
    arquivoUrl?: string;
    rotaUrl?: string;
    tempoEstimado?: string;
    notas?: string;
    viagemId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Habito {
    id: string;
    nome: string;
    descricao?: string;
    icone: string;
    cor: string;
    frequencia: 'DIARIA' | 'SEMANAL' | 'MENSAL';
    diasSemana?: number[];
    metaVezes?: number;
    periodoDia?: 'MANHA' | 'TARDE' | 'NOITE' | 'QUALQUER';
    status: 'ATIVO' | 'PAUSADO' | 'CONCLUIDO' | 'ABANDONADO';
    categoriaId?: string;
    dataInicio: Date;
    sequenciaAtual: number;
    melhorSequencia: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface RegistroHabito {
    id: string;
    data: Date;
    concluido: boolean;
    notas?: string;
    quantidade?: number;
    humor?: number;
    habitoId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CategoriaHabito {
    id: string;
    nome: string;
    cor: string;
    icone: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Curso {
    id: string;
    nome: string;
    descricao?: string;
    cor: string;
    icone: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Modulo {
    id: string;
    nome: string;
    ordem: number;
    cursoId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Anotacao {
    id: string;
    titulo: string;
    conteudo: string;
    cor: string;
    tipoOrigem?: string;
    audioUrl?: string;
    audioDuracao?: number;
    transcricaoOriginal?: string;
    moduloId?: string;
    cursoId?: string;
    dataCriacao: Date;
    dataAtualizacao: Date;
}

export interface AtivoInvestimento {
    id: string;
    nome: string; // Ex: AAPL34, BTC, Tesouro Direto
    tipo: 'ACAO' | 'FII' | 'RENDA_FIXA' | 'CRIPTO' | 'OUTRO';
    quantidade: number;
    precoCota: number;
    taxas: number;
    precoMedio: number;
    valorAtual: number;
    setor?: string;
    dataCompra: Date;
    updatedAt: Date;
}


export class ZenitDB extends Dexie {
    users!: Table<OfflineUser, string>;
    compromissos!: Table<Compromisso, string>;
    atividades!: Table<Atividade, string>;
    contasBancarias!: Table<ContaBancaria, string>;
    cartoes!: Table<Cartao, string>;
    categorias!: Table<Categoria, string>;
    transacoes!: Table<Transacao, string>;
    objetivosFinanceiros!: Table<ObjetivoFinanceiro, string>;
    viagens!: Table<Viagem, string>;
    destinosViagem!: Table<DestinoViagem, string>;
    despesasViagem!: Table<DespesaViagem, string>;
    atividadesViagem!: Table<AtividadeViagem, string>;
    hospedagensViagem!: Table<HospedagemViagem, string>;
    transportesViagem!: Table<TransporteViagem, string>;
    habitos!: Table<Habito, string>;
    registrosHabitos!: Table<RegistroHabito, string>;
    categoriasHabito!: Table<CategoriaHabito, string>;
    cursos!: Table<Curso, string>;
    modulos!: Table<Modulo, string>;
    anotacoes!: Table<Anotacao, string>;
    ativosInvestimento!: Table<AtivoInvestimento, string>;

    constructor() {
        super('ZenitDB');
        this.version(5).stores({
            users: 'id',
            compromissos: 'id, data, recorrenciaGrupoId',
            atividades: 'id, createdAt',
            contasBancarias: 'id, ativa',
            cartoes: 'id, ativo',
            categorias: 'id, tipo, nome',
            transacoes: 'id, data, tipo, categoriaId, contaBancariaId, grupoParcelaId, descricao, paga',
            objetivosFinanceiros: 'id, status',
            viagens: 'id, status, dataInicio',
            destinosViagem: 'id, viagemId',
            despesasViagem: 'id, viagemId, data, categoria',
            atividadesViagem: 'id, viagemId, data',
            hospedagensViagem: 'id, viagemId, checkIn',
            transportesViagem: 'id, viagemId, dataHora',
            habitos: 'id, status',
            registrosHabitos: 'id, habitoId, data',
            categoriasHabito: 'id',
            midias: null,
            citacoes: null,
            cursos: 'id',
            modulos: 'id, cursoId, ordem',
            anotacoes: 'id, moduloId, cursoId, dataCriacao',
            ativosInvestimento: 'id, tipo, nome'
        });
    }
}


export const db = new ZenitDB();

/**
 * Inicializa categorias padrão se não existirem
 */
export async function initCategoriasPadrao() {
    try {
        const defaultCategorias: Array<{ nome: string; tipo: 'RECEITA' | 'DESPESA'; cor: string; icone: string }> = [
            { nome: 'Alimentação', tipo: 'DESPESA', cor: '#EF4444', icone: 'utensils' },
            { nome: 'Moradia', tipo: 'DESPESA', cor: '#3B82F6', icone: 'home' },
            { nome: 'Transporte', tipo: 'DESPESA', cor: '#F59E0B', icone: 'car' },
            { nome: 'Saúde', tipo: 'DESPESA', cor: '#10B981', icone: 'heart' },
            { nome: 'Lazer', tipo: 'DESPESA', cor: '#10B981', icone: 'smile' },
            { nome: 'Uso Pessoal', tipo: 'DESPESA', cor: '#EC4899', icone: 'user' },
            { nome: 'Outros Gastos', tipo: 'DESPESA', cor: '#6B7280', icone: 'archive' },
            { nome: 'Salário', tipo: 'RECEITA', cor: '#10B981', icone: 'dollar-sign' },
            { nome: 'Investimentos', tipo: 'RECEITA', cor: '#3B82F6', icone: 'trending-up' }
        ];

        for (const cat of defaultCategorias) {
            const existe = await db.categorias.where('nome').equalsIgnoreCase(cat.nome).first();
            if (!existe) {
                await db.categorias.add({
                    id: crypto.randomUUID(),
                    ...cat,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
        }
    } catch (err) {
        console.error('Failed to init categories', err);
    }
}
