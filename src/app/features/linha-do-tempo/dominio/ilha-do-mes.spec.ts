import { MesProjetado } from '../data/projecao.model';
import { item, MAIO } from '../testing/exemplo';
import { dadosDaIlha, lugarDoItem, maiorReceita, nivelDaMare, valeDoMes } from './ilha-do-mes';

describe('ilha do mês', () => {
  it('deve colocar cada item no seu lugar', () => {
    expect(lugarDoItem(item({ natureza: 'ENTRADA' }))).toBe('receitas');
    expect(lugarDoItem(item({ cartaoId: 'k', totalOcorrencias: 12 }))).toBe('cartao');
    expect(lugarDoItem(item({ compromissoId: null }))).toBe('avulsos');
    expect(lugarDoItem(item({ totalOcorrencias: 36 }))).toBe('boletos');
    expect(lugarDoItem(item({ certeza: 'ESTIMADO' }))).toBe('estimadas');
    expect(lugarDoItem(item({}))).toBe('contas');
  });

  it('deve somar nos lugares exatamente o total de compromissos do mês', () => {
    const { lugares } = dadosDaIlha(MAIO, 750000);
    const saidas = lugares
      .filter(({ id }) => id !== 'receitas' && id !== 'vale')
      .reduce((total, lugar) => total + lugar.totalCentavos, 0);

    expect(saidas).toBe(MAIO.compromissosCentavos);
    expect(lugares.find(({ id }) => id === 'receitas')?.totalCentavos).toBe(MAIO.receitasCentavos);
  });

  it('deve deixar a fatura igual à soma dos itens do cartão', () => {
    const { lugares } = dadosDaIlha(MAIO, 750000);

    expect(lugares.find(({ id }) => id === 'cartao')?.totalCentavos).toBe(
      MAIO.faturas[0].totalCentavos,
    );
  });

  it('deve manter o vale fora dos compromissos, em lugar próprio', () => {
    const dados = dadosDaIlha(MAIO, 750000);

    expect(dados.valeCentavos).toBe(80000);
    expect(dados.lugares.find(({ id }) => id === 'vale')?.totalCentavos).toBe(80000);
  });

  it('deve numerar uma boia por parcela em andamento', () => {
    const { boias } = dadosDaIlha(MAIO, 750000);

    expect(boias.map(({ rotulo }) => rotulo)).toEqual(['5/12', '1/6', '4/36']);
  });

  it('deve tirar dos totais e das boias o item ignorado', () => {
    const mes: MesProjetado = {
      ...MAIO,
      itens: [item({ ignorada: true, totalOcorrencias: 3, valorCentavos: 999 })],
      vale: [],
    };
    const dados = dadosDaIlha(mes, 750000);

    expect(dados.lugares).toEqual([]);
    expect(dados.boias).toEqual([]);
    expect(valeDoMes(mes)).toBe(0);
  });

  describe('nivelDaMare', () => {
    it('deve deixar seca a fração da ilha igual a sobra/receitas', () => {
      const seca = 1 - nivelDaMare(MAIO.compromissosCentavos, MAIO.receitasCentavos);

      expect(seca).toBeCloseTo(MAIO.sobraCentavos / MAIO.receitasCentavos, 10);
    });

    it('deve cobrir a ilha sem subir sem limite quando faltar dinheiro', () => {
      expect(nivelDaMare(900, 100)).toBe(1.05);
    });

    it('deve cobrir a ilha quando não houver receita', () => {
      expect(nivelDaMare(100, 0)).toBe(1.05);
    });
  });

  it('deve usar a maior receita como escala comum', () => {
    expect(maiorReceita([MAIO, { ...MAIO, receitasCentavos: 750000 }])).toBe(750000);
    expect(maiorReceita([])).toBe(0);
  });
});
