import { ItemProjetado, MesProjetado } from '../data/projecao.model';

/** Cada grupo é um lugar da ilha. Item ignorado sai dos totais, como no backend. */
export type IdDoLugar =
  'receitas' | 'contas' | 'cartao' | 'estimadas' | 'boletos' | 'avulsos' | 'vale';

export interface LugarDaIlha {
  readonly id: IdDoLugar;
  readonly nome: string;
  readonly totalCentavos: number;
}

export interface BoiaDaIlha {
  readonly rotulo: string;
  readonly descricao: string;
}

export interface DadosDaIlha {
  readonly competencia: string;
  readonly receitasCentavos: number;
  readonly compromissosCentavos: number;
  /** A maior receita do período, para as ilhas terem escala comum entre os meses. */
  readonly receitaDeReferenciaCentavos: number;
  readonly valeCentavos: number;
  readonly lugares: readonly LugarDaIlha[];
  readonly boias: readonly BoiaDaIlha[];
}

const NOMES: Readonly<Record<IdDoLugar, string>> = {
  receitas: 'Receitas',
  contas: 'Contas',
  cartao: 'Cartão',
  estimadas: 'Contas estimadas',
  boletos: 'Boletos parcelados',
  avulsos: 'Gastos avulsos',
  vale: 'Vale',
};
const MAXIMO_DE_BOIAS = 6;
/** Acima de 100% a água cobre o topo da ilha, sem precisar subir sem limite. */
const NIVEL_MAXIMO = 1.05;

export function lugarDoItem(item: ItemProjetado): IdDoLugar {
  if (item.natureza === 'ENTRADA') {
    return 'receitas';
  }
  if (item.cartaoId) {
    return 'cartao';
  }
  if (!item.compromissoId) {
    return 'avulsos';
  }
  if (item.totalOcorrencias) {
    return 'boletos';
  }
  return item.certeza === 'ESTIMADO' ? 'estimadas' : 'contas';
}

/**
 * Altura da água em relação ao topo da ilha. Em cada altura h, a área acima dela é proporcional a
 * (1 - h/H). Com a água em h = H × compromissos/receitas, a terra seca é sobra/receitas da ilha.
 */
export function nivelDaMare(compromissosCentavos: number, receitasCentavos: number): number {
  if (receitasCentavos <= 0) {
    return NIVEL_MAXIMO;
  }
  return Math.min(NIVEL_MAXIMO, compromissosCentavos / receitasCentavos);
}

export function valeDoMes(mes: MesProjetado): number {
  return mes.vale.reduce((total, vale) => total + vale.creditosCentavos, 0);
}

export function maiorReceita(meses: readonly MesProjetado[]): number {
  return meses.reduce((maior, mes) => Math.max(maior, mes.receitasCentavos), 0);
}

export function dadosDaIlha(mes: MesProjetado, receitaDeReferenciaCentavos: number): DadosDaIlha {
  const valeCentavos = valeDoMes(mes);
  const totais = new Map<IdDoLugar, number>();
  const validos = mes.itens.filter((item) => !item.ignorada);
  validos.forEach((item) => {
    const lugar = lugarDoItem(item);
    totais.set(lugar, (totais.get(lugar) ?? 0) + item.valorCentavos);
  });
  if (valeCentavos > 0) {
    totais.set('vale', valeCentavos);
  }
  return {
    competencia: mes.competencia,
    receitasCentavos: mes.receitasCentavos,
    compromissosCentavos: mes.compromissosCentavos,
    receitaDeReferenciaCentavos,
    valeCentavos,
    lugares: [...totais].map(([id, totalCentavos]) => ({ id, nome: NOMES[id], totalCentavos })),
    boias: validos.filter(temParcelas).slice(0, MAXIMO_DE_BOIAS).map(paraBoia),
  };
}

function temParcelas(item: ItemProjetado): boolean {
  return item.natureza === 'SAIDA' && !!item.totalOcorrencias && !!item.numeroOcorrencia;
}

function paraBoia(item: ItemProjetado): BoiaDaIlha {
  return {
    rotulo: `${item.numeroOcorrencia}/${item.totalOcorrencias}`,
    descricao: item.descricao,
  };
}
