const FORMATO = /^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/;

/**
 * Lê um valor digitado em reais ("1.500,00", "1500", "99,9") e devolve centavos. Nulo quando não dá para ler.
 * A conta fica só no backend; aqui é apenas a tradução do que a pessoa escreveu.
 */
export function paraCentavos(texto: string): number | null {
  const limpo = texto.replace(/\s|R\$/g, '');
  if (!FORMATO.test(limpo)) {
    return null;
  }
  const [inteiro, decimal = ''] = limpo.replace(/\./g, '').split(',');
  const centavos = Number(inteiro) * 100 + Number(decimal.padEnd(2, '0'));
  return centavos > 0 ? centavos : null;
}
