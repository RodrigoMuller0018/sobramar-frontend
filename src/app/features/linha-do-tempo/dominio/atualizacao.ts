const MILISSEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

/** Dias inteiros desde o instante informado. Nunca negativo. */
export function diasDesde(instante: string, agora = new Date()): number {
  const diferenca = agora.getTime() - new Date(instante).getTime();
  return Math.max(0, Math.floor(diferenca / MILISSEGUNDOS_POR_DIA));
}

/** O rótulo que fica ao lado da sobra: uma sobra desatualizada é uma sobra falsa. */
export function textoAtualizadoHa(instante: string | null, agora = new Date()): string {
  if (!instante) {
    return 'Ainda sem lançamentos';
  }
  const dias = diasDesde(instante, agora);
  if (dias === 0) {
    return 'Atualizado hoje';
  }
  if (dias === 1) {
    return 'Atualizado ontem';
  }
  return `Atualizado há ${dias} dias`;
}
