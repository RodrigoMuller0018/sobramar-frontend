import { somarMeses } from '../../linha-do-tempo/dominio/competencia';

export interface RendaInformada {
  readonly valorCentavos: number;
  readonly diaPagamento: number;
}

export interface CartaoInformado {
  readonly nome: string;
  readonly diaFechamento: number;
  readonly diaVencimento: number;
}

export interface ContaFixaInformada {
  readonly descricao: string;
  readonly valorCentavos: number;
  readonly dia: number;
  readonly estimada: boolean;
}

export interface ParcelaInformada {
  readonly descricao: string;
  readonly valorParcelaCentavos: number;
  readonly parcelaAtual: number;
  readonly totalParcelas: number;
  readonly noCartao: boolean;
  readonly diaVencimento: number;
}

/** O que a pessoa conta em três minutos para montar o carnê. */
export interface Carne {
  readonly renda: RendaInformada;
  readonly cartao: CartaoInformado | null;
  readonly contas: readonly ContaFixaInformada[];
  readonly parcelas: readonly ParcelaInformada[];
}

/** O corpo de `POST /compromissos`, como no contrato da API. */
export interface CompromissoRequest {
  readonly natureza: 'ENTRADA' | 'SAIDA';
  readonly forma: 'PARCELADO' | 'RECORRENTE';
  readonly certeza: 'CERTO' | 'ESTIMADO';
  readonly descricao: string;
  readonly valorCentavos?: number;
  readonly valorTotalCentavos?: number;
  readonly parcelas?: number;
  readonly dataInicio: string;
  readonly carteiraId?: string;
  readonly cartaoId?: string;
  readonly faturaInicial?: string;
}

export interface Origens {
  readonly carteiraId: string;
  readonly cartaoId: string | null;
}

/** Dia 31 em mês mais curto vira o último dia, igual ao backend. */
export function dataNoMes(competencia: string, dia: number): string {
  const [ano, mes] = competencia.split('-').map(Number);
  const ultimo = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  return `${competencia}-${String(Math.min(dia, ultimo)).padStart(2, '0')}`;
}

/**
 * Traduz o carnê em compromissos para a API. Uma parcela "3 de 10" começa dois meses antes do mês atual, para a
 * parcela atual cair neste mês. No cartão, a fatura inicial é escolhida de propósito, e o backend pode avisar se
 * a data da compra não combinar; o aviso é só informativo.
 */
export function compromissosDoCarne(
  carne: Carne,
  competenciaAtual: string,
  origens: Origens,
): CompromissoRequest[] {
  const salario: CompromissoRequest = {
    natureza: 'ENTRADA',
    forma: 'RECORRENTE',
    certeza: 'CERTO',
    descricao: 'Salário',
    valorCentavos: carne.renda.valorCentavos,
    dataInicio: dataNoMes(competenciaAtual, carne.renda.diaPagamento),
    carteiraId: origens.carteiraId,
  };
  const contas = carne.contas.map<CompromissoRequest>((conta) => ({
    natureza: 'SAIDA',
    forma: 'RECORRENTE',
    certeza: conta.estimada ? 'ESTIMADO' : 'CERTO',
    descricao: conta.descricao,
    valorCentavos: conta.valorCentavos,
    dataInicio: dataNoMes(competenciaAtual, conta.dia),
    carteiraId: origens.carteiraId,
  }));
  const parcelas = carne.parcelas.map((parcela) =>
    parcelaEmAndamento(parcela, competenciaAtual, origens),
  );
  return [salario, ...contas, ...parcelas];
}

function parcelaEmAndamento(
  parcela: ParcelaInformada,
  competenciaAtual: string,
  origens: Origens,
): CompromissoRequest {
  const primeiraCompetencia = somarMeses(competenciaAtual, -(parcela.parcelaAtual - 1));
  const base = {
    natureza: 'SAIDA' as const,
    forma: 'PARCELADO' as const,
    certeza: 'CERTO' as const,
    descricao: parcela.descricao,
    valorTotalCentavos: parcela.valorParcelaCentavos * parcela.totalParcelas,
    parcelas: parcela.totalParcelas,
  };
  if (parcela.noCartao && origens.cartaoId) {
    return {
      ...base,
      dataInicio: dataNoMes(somarMeses(primeiraCompetencia, -1), 15),
      cartaoId: origens.cartaoId,
      faturaInicial: primeiraCompetencia,
    };
  }
  return {
    ...base,
    dataInicio: dataNoMes(primeiraCompetencia, parcela.diaVencimento),
    carteiraId: origens.carteiraId,
  };
}
