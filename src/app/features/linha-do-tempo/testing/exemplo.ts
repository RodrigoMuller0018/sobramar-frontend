import { ItemProjetado, MesProjetado } from '../data/projecao.model';

export function item(parcial: Partial<ItemProjetado>): ItemProjetado {
  return {
    compromissoId: 'c1',
    numeroOcorrencia: 1,
    totalOcorrencias: null,
    descricao: 'Item',
    natureza: 'SAIDA',
    certeza: 'CERTO',
    valorCentavos: 1000,
    dataCompra: '2027-05-01',
    vencimento: '2027-05-10',
    ignorada: false,
    cartaoId: null,
    carteiraId: 'w1',
    pessoaId: null,
    categoriaId: null,
    situacao: 'PREVISTO',
    ...parcial,
  };
}

/** Maio da família fictícia de `docs/exemplo-de-referencia.md`, no backend. */
export const MAIO: MesProjetado = {
  competencia: '2027-05',
  receitasCentavos: 500000,
  compromissosCentavos: 231990,
  sobraCentavos: 268010,
  contemEstimativa: true,
  confianca: 'ESTIMADA',
  faturas: [
    {
      cartaoId: 'k1',
      nomeCartao: 'Cartão azul',
      vencimento: '2027-05-05',
      totalCentavos: 53990,
      paga: false,
      informadoCentavos: null,
      diferencaCentavos: null,
      conciliada: false,
    },
  ],
  itens: [
    item({ compromissoId: 'c1', descricao: 'Salário', natureza: 'ENTRADA', valorCentavos: 500000 }),
    item({ compromissoId: 'c2', descricao: 'Aluguel', valorCentavos: 150000 }),
    item({ compromissoId: 'c3', descricao: 'Luz', certeza: 'ESTIMADO', valorCentavos: 18000 }),
    item({
      compromissoId: 'c4',
      descricao: 'Notebook',
      numeroOcorrencia: 5,
      totalOcorrencias: 12,
      cartaoId: 'k1',
      carteiraId: null,
      valorCentavos: 30000,
    }),
    item({
      compromissoId: 'c5',
      descricao: 'Geladeira',
      numeroOcorrencia: 1,
      totalOcorrencias: 6,
      cartaoId: 'k1',
      carteiraId: null,
      valorCentavos: 20000,
    }),
    item({
      compromissoId: 'c6',
      descricao: 'Assinatura',
      cartaoId: 'k1',
      carteiraId: null,
      valorCentavos: 3990,
    }),
    item({
      compromissoId: 'c7',
      descricao: 'Curso',
      numeroOcorrencia: 4,
      totalOcorrencias: 36,
      valorCentavos: 10000,
    }),
  ],
  vale: [{ carteiraId: 'v1', nome: 'Vale-refeição', creditosCentavos: 80000, gastosCentavos: 0 }],
};
