const FORMATO = /^\d{4}-(0[1-9]|1[0-2])$/;
const FORMATO_ATUAL = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
});
const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];
/** Meses para trás e para a frente carregados de uma vez. A API aceita no máximo 24. */
const MESES_ANTES = 6;
const MESES_DEPOIS = 11;

export function competenciaValida(texto: string): boolean {
  return FORMATO.test(texto);
}

/** O mês civil no Brasil, igual ao que o backend usa. */
export function competenciaAtual(agora = new Date()): string {
  return FORMATO_ATUAL.format(agora).slice(0, 7);
}

export function somarMeses(competencia: string, meses: number): string {
  const [ano, mes] = competencia.split('-').map(Number);
  const total = ano * 12 + (mes - 1) + meses;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
}

export function janelaPara(competencia: string): { de: string; ate: string } {
  return {
    de: somarMeses(competencia, -MESES_ANTES),
    ate: somarMeses(competencia, MESES_DEPOIS),
  };
}

export function nomeDoMes(competencia: string): string {
  const [ano, mes] = competencia.split('-').map(Number);
  const nome = MESES[mes - 1];
  return `${nome[0].toUpperCase()}${nome.slice(1)} de ${ano}`;
}

export function abreviacaoDoMes(competencia: string): string {
  const nome = MESES[Number(competencia.slice(5)) - 1];
  return `${nome[0].toUpperCase()}${nome.slice(1, 3)}`;
}

export function dataCurta(data: string): string {
  return `${data.slice(8)}/${data.slice(5, 7)}/${data.slice(0, 4)}`;
}
