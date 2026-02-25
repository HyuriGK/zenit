export enum TipoMidia {
  LIVRO = 'LIVRO',
  FILME = 'FILME',
}

export enum StatusLeitura {
  PROXIMO = 'PROXIMO',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  PAUSADO = 'PAUSADO',
  CONCLUIDO = 'CONCLUIDO',
}

export enum FonteLivro {
  EMPRESTADO = 'EMPRESTADO',
  FISICO = 'FISICO',
  KINDLE = 'KINDLE',
  DIGITAL = 'DIGITAL',
}

export interface Midia {
  id: string;
  tipo: TipoMidia;
  titulo: string;
  capa?: string;
  cor: string;

  // Campos específicos de livro
  autor?: string;
  editora?: string;
  genero?: string;
  fonte?: FonteLivro;

  // Campos específicos de filme
  diretor?: string;
  duracao?: number;
  anoLancamento?: number;

  // Campos comuns
  idioma?: string;
  status: StatusLeitura;
  nota?: number;
  dataInicio?: Date;
  dataConclusao?: Date;

  // Resenha gerada por IA
  resenhaGeradaIA?: string;

  // Reflexões e aprendizados
  impressoesIniciais?: string;
  principaisAprendizados?: string;
  trechosMemoraveis?: string;
  reflexao?: string;
  aprendizadosPraticos?: string;
  consideracoesFinais?: string;

  userId: string;
  createdAt: Date;
  updatedAt: Date;

  citacoes?: Citacao[];
}

export interface Citacao {
  id: string;
  texto: string;
  autor?: string;
  pagina?: string;
  destaque: boolean;
  midiaId?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  midia?: Midia;
}

export const GENEROS_LIVRO = [
  'Romance',
  'Ficção',
  'Ficção Científica',
  'Fantasia',
  'Terror',
  'Suspense',
  'Policial',
  'Biografia',
  'Autobiografia',
  'História',
  'Filosofia',
  'Autoajuda',
  'Desenvolvimento Pessoal',
  'Negócios',
  'Tecnologia',
  'Ciência',
  'Poesia',
  'Drama',
  'Aventura',
  'Infantil',
  'Jovem Adulto',
  'Humor',
  'Religião',
  'Outro',
];

export const GENEROS_FILME = [
  'Ação',
  'Aventura',
  'Comédia',
  'Drama',
  'Terror',
  'Ficção Científica',
  'Fantasia',
  'Romance',
  'Suspense',
  'Documentário',
  'Animação',
  'Musical',
  'Policial',
  'Guerra',
  'Western',
  'Biografia',
  'Thriller',
  'Mistério',
  'Família',
  'Outro',
];

export const CORES_MIDIA = [
  '#10B981', // Green
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#10B981', // Green
  '#3B82F6', // Blue
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#84CC16', // Lime
];
