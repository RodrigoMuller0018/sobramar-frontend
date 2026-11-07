import { diasDesde, textoAtualizadoHa } from './atualizacao';

describe('atualização', () => {
  const agora = new Date('2027-05-10T15:00:00Z');

  it('deve contar dias inteiros e nunca negativos', () => {
    expect(diasDesde('2027-05-10T09:00:00Z', agora)).toBe(0);
    expect(diasDesde('2027-05-08T16:00:00Z', agora)).toBe(1);
    expect(diasDesde('2027-05-20T00:00:00Z', agora)).toBe(0);
  });

  it.each([
    [null, 'Ainda sem lançamentos'],
    ['2027-05-10T09:00:00Z', 'Atualizado hoje'],
    ['2027-05-09T09:00:00Z', 'Atualizado ontem'],
    ['2027-04-26T09:00:00Z', 'Atualizado há 14 dias'],
  ])('deve escrever o rótulo para %s', (instante, texto) => {
    expect(textoAtualizadoHa(instante, agora)).toBe(texto);
  });
});
