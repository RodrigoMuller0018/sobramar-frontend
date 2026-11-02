import {
  abreviacaoDoMes,
  competenciaAtual,
  competenciaValida,
  dataCurta,
  janelaPara,
  nomeDoMes,
  somarMeses,
} from './competencia';

describe('competencia', () => {
  it.each(['2027-01', '2027-12'])('deve aceitar %s', (texto) => {
    expect(competenciaValida(texto)).toBe(true);
  });

  it.each(['2027-13', '2027-00', '2027-1', 'maio', ''])('deve recusar %j', (texto) => {
    expect(competenciaValida(texto)).toBe(false);
  });

  it('deve usar o mês civil do Brasil, não o de UTC', () => {
    expect(competenciaAtual(new Date('2027-03-01T02:00:00Z'))).toBe('2027-02');
    expect(competenciaAtual(new Date('2027-03-01T03:00:00Z'))).toBe('2027-03');
  });

  it.each([
    ['2027-01', 1, '2027-02'],
    ['2027-12', 1, '2028-01'],
    ['2027-01', -1, '2026-12'],
    ['2027-05', 24, '2029-05'],
  ])('deve somar %s + %i = %s', (inicio, meses, esperado) => {
    expect(somarMeses(inicio, meses)).toBe(esperado);
  });

  it('deve pedir no máximo os 24 meses que a API aceita', () => {
    const { de, ate } = janelaPara('2027-05');

    expect(de).toBe('2026-11');
    expect(ate).toBe('2028-04');
  });

  it('deve formatar para leitura', () => {
    expect(nomeDoMes('2027-03')).toBe('Março de 2027');
    expect(abreviacaoDoMes('2027-03')).toBe('Mar');
    expect(dataCurta('2027-03-05')).toBe('05/03/2027');
  });
});
