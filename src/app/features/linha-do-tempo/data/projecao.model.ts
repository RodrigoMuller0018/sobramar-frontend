export type Natureza = 'ENTRADA' | 'SAIDA';
export type Certeza = 'CERTO' | 'ESTIMADO';
export type Situacao = 'PREVISTO' | 'REALIZADO';

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
  readonly faturas: readonly FaturaProjetada[];
  readonly itens: readonly ItemProjetado[];
  readonly vale: readonly ValeProjetado[];
}

export interface Projecao {
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
