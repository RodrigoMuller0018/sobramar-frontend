export type Natureza = 'ENTRADA' | 'SAIDA';
export type Certeza = 'CERTO' | 'ESTIMADO';
export type Situacao = 'PREVISTO' | 'REALIZADO';
/** FIRME só quando tudo é certo e conciliado; ESTIMADA é a sobra a lápis. */
export type Confianca = 'FIRME' | 'ESTIMADA';

export interface ItemProjetado {
  readonly compromissoId: string | null;
  readonly numeroOcorrencia: number | null;
  readonly totalOcorrencias: number | null;
  readonly descricao: string;
  readonly natureza: Natureza;
  readonly certeza: Certeza;
  readonly valorCentavos: number;
  readonly dataCompra: string;
  readonly vencimento: string;
  readonly ignorada: boolean;
  readonly cartaoId: string | null;
  readonly carteiraId: string | null;
  readonly pessoaId: string | null;
  readonly categoriaId: string | null;
  readonly situacao: Situacao;
}

export interface FaturaProjetada {
  readonly cartaoId: string;
  readonly nomeCartao: string;
  readonly vencimento: string;
  readonly totalCentavos: number;
  readonly paga: boolean;
  /** O total que o banco cobrou, quando informado; nulo se não. */
  readonly informadoCentavos: number | null;
  /** Informado menos calculado: o "falta explicar". */
  readonly diferencaCentavos: number | null;
  readonly conciliada: boolean;
}

export interface ValeProjetado {
  readonly carteiraId: string;
  readonly nome: string;
  readonly creditosCentavos: number;
  readonly gastosCentavos: number;
}

export interface MesProjetado {
  readonly competencia: string;
  readonly receitasCentavos: number;
  readonly compromissosCentavos: number;
  readonly sobraCentavos: number;
  readonly contemEstimativa: boolean;
  readonly confianca: Confianca;
  readonly faturas: readonly FaturaProjetada[];
  readonly itens: readonly ItemProjetado[];
  readonly vale: readonly ValeProjetado[];
}

export interface Projecao {
  /** Quando os dados mudaram pela última vez; nulo em conta vazia. */
  readonly atualizadoEm: string | null;
  readonly meses: readonly MesProjetado[];
}

export interface Filtros {
  readonly pessoaId: string | null;
  readonly categoriaId: string | null;
}

export interface OpcaoDeFiltro {
  readonly id: string;
  readonly nome: string;
}

export const SEM_FILTROS: Filtros = { pessoaId: null, categoriaId: null };
