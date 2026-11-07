import { compromissosDoCarne, dataNoMes } from './plano-do-carne';
import { paraCentavos } from './reais';

describe('reais', () => {
  it.each([
    ['1.500,00', 150000],
    ['1500', 150000],
    ['99,9', 9990],
    ['R$ 0,05', 5],
    ['2.680,10', 268010],
  ])('deve ler %s como %d centavos', (texto, centavos) => {
    expect(paraCentavos(texto)).toBe(centavos);
  });

  it.each(['', 'abc', '1,234', '0', '0,00', '1.5', '1,500.00'])('deve recusar "%s"', (texto) => {
    expect(paraCentavos(texto)).toBeNull();
  });
});

describe('plano do carnê', () => {
  const origens = { carteiraId: 'w1', cartaoId: 'k1' };

  it('deve levar o dia 31 ao último dia de fevereiro', () => {
    expect(dataNoMes('2027-02', 31)).toBe('2027-02-28');
    expect(dataNoMes('2028-02', 31)).toBe('2028-02-29');
    expect(dataNoMes('2027-03', 31)).toBe('2027-03-31');
  });

  it('deve montar o salário e as contas fixas como recorrentes no mês atual', () => {
    const compromissos = compromissosDoCarne(
      {
        renda: { valorCentavos: 500000, diaPagamento: 5 },
        cartao: null,
        contas: [
          { descricao: 'Aluguel', valorCentavos: 150000, dia: 10, estimada: false },
          { descricao: 'Luz', valorCentavos: 18000, dia: 15, estimada: true },
        ],
        parcelas: [],
      },
      '2027-05',
      { carteiraId: 'w1', cartaoId: null },
    );

    expect(compromissos).toEqual([
      {
        natureza: 'ENTRADA',
        forma: 'RECORRENTE',
        certeza: 'CERTO',
        descricao: 'Salário',
        valorCentavos: 500000,
        dataInicio: '2027-05-05',
        carteiraId: 'w1',
      },
      {
        natureza: 'SAIDA',
        forma: 'RECORRENTE',
        certeza: 'CERTO',
        descricao: 'Aluguel',
        valorCentavos: 150000,
        dataInicio: '2027-05-10',
        carteiraId: 'w1',
      },
      {
        natureza: 'SAIDA',
        forma: 'RECORRENTE',
        certeza: 'ESTIMADO',
        descricao: 'Luz',
        valorCentavos: 18000,
        dataInicio: '2027-05-15',
        carteiraId: 'w1',
      },
    ]);
  });

  it('deve fazer a parcela atual de um boleto cair no mês atual', () => {
    const [, curso] = compromissosDoCarne(
      {
        renda: { valorCentavos: 1, diaPagamento: 1 },
        cartao: null,
        contas: [],
        parcelas: [
          {
            descricao: 'Curso',
            valorParcelaCentavos: 10000,
            parcelaAtual: 4,
            totalParcelas: 36,
            noCartao: false,
            diaVencimento: 10,
          },
        ],
      },
      '2027-05',
      origens,
    );

    expect(curso).toEqual({
      natureza: 'SAIDA',
      forma: 'PARCELADO',
      certeza: 'CERTO',
      descricao: 'Curso',
      valorTotalCentavos: 360000,
      parcelas: 36,
      dataInicio: '2027-02-10',
      carteiraId: 'w1',
    });
  });

  it('deve escolher a fatura inicial para a parcela atual do cartão cair no mês atual', () => {
    const [, notebook] = compromissosDoCarne(
      {
        renda: { valorCentavos: 1, diaPagamento: 1 },
        cartao: { nome: 'Azul', diaFechamento: 25, diaVencimento: 5 },
        contas: [],
        parcelas: [
          {
            descricao: 'Notebook',
            valorParcelaCentavos: 30000,
            parcelaAtual: 5,
            totalParcelas: 12,
            noCartao: true,
            diaVencimento: 5,
          },
        ],
      },
      '2027-05',
      origens,
    );

    expect(notebook).toEqual({
      natureza: 'SAIDA',
      forma: 'PARCELADO',
      certeza: 'CERTO',
      descricao: 'Notebook',
      valorTotalCentavos: 360000,
      parcelas: 12,
      dataInicio: '2026-12-15',
      cartaoId: 'k1',
      faturaInicial: '2027-01',
    });
  });

  it('deve cair no boleto quando a pessoa marca cartão mas não tem cartão', () => {
    const [, item] = compromissosDoCarne(
      {
        renda: { valorCentavos: 1, diaPagamento: 1 },
        cartao: null,
        contas: [],
        parcelas: [
          {
            descricao: 'Sofá',
            valorParcelaCentavos: 100,
            parcelaAtual: 1,
            totalParcelas: 2,
            noCartao: true,
            diaVencimento: 20,
          },
        ],
      },
      '2027-05',
      { carteiraId: 'w1', cartaoId: null },
    );

    expect(item.carteiraId).toBe('w1');
    expect(item.dataInicio).toBe('2027-05-20');
  });
});
