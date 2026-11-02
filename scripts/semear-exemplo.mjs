// Cria a família fictícia de docs/exemplo-de-referencia.md (backend) numa conta local vazia e
// confere a sobra dos 12 meses pela API. Só para desenvolvimento: nunca aponte para produção.
//
//   SOBRAMAR_SEMENTE_EMAIL=... SOBRAMAR_SEMENTE_SENHA=... node scripts/semear-exemplo.mjs
const BASE = process.env.SOBRAMAR_SEMENTE_API ?? 'http://localhost:8080/api/v1';
const { SOBRAMAR_SEMENTE_EMAIL: email, SOBRAMAR_SEMENTE_SENHA: senha } = process.env;
if (!email || !senha) {
  console.error('Defina SOBRAMAR_SEMENTE_EMAIL e SOBRAMAR_SEMENTE_SENHA.');
  process.exit(1);
}
if (!/^http:\/\/(localhost|127\.0\.0\.1)[:/]/.test(BASE)) {
  console.error('Este script só roda contra uma API local.');
  process.exit(1);
}

const cookies = new Map();

async function chamar(metodo, rota, corpo) {
  const cabecalhos = {
    'Content-Type': 'application/json',
    Cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join('; '),
  };
  if (cookies.has('XSRF-TOKEN')) {
    cabecalhos['X-XSRF-TOKEN'] = cookies.get('XSRF-TOKEN');
  }
  const resposta = await fetch(`${BASE}${rota}`, {
    method: metodo,
    headers: cabecalhos,
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  for (const linha of resposta.headers.getSetCookie()) {
    const [par] = linha.split(';');
    const corte = par.indexOf('=');
    cookies.set(par.slice(0, corte), par.slice(corte + 1));
  }
  const texto = await resposta.text();
  if (!resposta.ok) {
    throw new Error(`${metodo} ${rota}: ${resposta.status} ${texto}`);
  }
  return texto ? JSON.parse(texto) : null;
}

const entrada = await chamar('POST', '/autenticacao/entrar', { email, senha });
if (entrada.segundoFatorObrigatorio) {
  throw new Error('Use uma conta local sem segundo fator.');
}
await chamar('GET', '/autenticacao/eu');

const { content: existentes } = await chamar('GET', '/compromissos?size=1');
if (existentes.length) {
  console.error('A conta já tem compromissos. Nada foi criado.');
} else {
  const criar = (rota, corpo) => chamar('POST', rota, corpo);
  const conta = await criar('/carteiras', {
    tipo: 'CONTA',
    nome: 'Conta principal',
    saldoInicialCentavos: 0,
  });
  const poupanca = await criar('/carteiras', {
    tipo: 'CONTA',
    nome: 'Poupança',
    saldoInicialCentavos: 0,
  });
  const vale = await criar('/carteiras', {
    tipo: 'VALE',
    nome: 'Vale-refeição',
    saldoInicialCentavos: 0,
  });
  const cartao = await criar('/cartoes', {
    nome: 'Cartão azul',
    diaFechamento: 25,
    diaVencimento: 5,
    limiteCentavos: 500000,
  });
  const fixo = (natureza, forma, certeza, descricao, valorCentavos, dataInicio, origem) =>
    criar('/compromissos', {
      natureza,
      forma,
      certeza,
      descricao,
      valorCentavos,
      dataInicio,
      ...origem,
    });
  const parcelado = (descricao, valorTotalCentavos, parcelas, dataInicio, origem) =>
    criar('/compromissos', {
      natureza: 'SAIDA',
      forma: 'PARCELADO',
      certeza: 'CERTO',
      descricao,
      valorTotalCentavos,
      parcelas,
      dataInicio,
      ...origem,
    });
  const naConta = { carteiraId: conta.id };
  await fixo('ENTRADA', 'RECORRENTE', 'CERTO', 'Salário', 500000, '2027-01-05', naConta);
  await fixo('ENTRADA', 'EVENTO', 'CERTO', '13º, primeira parte', 250000, '2027-11-20', naConta);
  await fixo('ENTRADA', 'EVENTO', 'CERTO', '13º, segunda parte', 250000, '2027-12-20', naConta);
  await fixo('ENTRADA', 'RECORRENTE', 'CERTO', 'Crédito de vale', 80000, '2027-01-01', {
    carteiraId: vale.id,
  });
  const aluguel = await fixo(
    'SAIDA',
    'RECORRENTE',
    'CERTO',
    'Aluguel',
    150000,
    '2027-01-10',
    naConta,
  );
  const luz = await fixo('SAIDA', 'RECORRENTE', 'ESTIMADO', 'Luz', 18000, '2027-01-15', naConta);
  await parcelado('Notebook', 360000, 12, '2026-12-10', { cartaoId: cartao.id });
  await parcelado('Geladeira', 120000, 6, '2027-03-25', { cartaoId: cartao.id });
  await fixo('SAIDA', 'RECORRENTE', 'CERTO', 'Assinatura', 3990, '2027-01-20', {
    cartaoId: cartao.id,
  });
  await parcelado('Curso', 360000, 36, '2027-02-10', naConta);
  await fixo('SAIDA', 'EVENTO', 'CERTO', 'IPVA', 120000, '2027-03-15', naConta);

  await criar(`/compromissos/${aluguel.id}/ocorrencias/1/pagamento`, {
    data: '2027-01-10',
    valorCentavos: 155000,
    carteiraId: conta.id,
  });
  await chamar('PATCH', `/compromissos/${luz.id}/ocorrencias/2`, {
    escopo: 'SOMENTE_ESTA',
    ignorada: true,
  });
  await criar('/lancamentos', {
    tipo: 'GASTO',
    descricao: 'Almoço',
    valorCentavos: 5000,
    data: '2027-01-12',
    carteiraId: conta.id,
  });
  await criar('/lancamentos', {
    tipo: 'TRANSFERENCIA',
    descricao: 'Para a poupança',
    valorCentavos: 20000,
    data: '2027-01-13',
    carteiraId: conta.id,
    carteiraDestinoId: poupanca.id,
  });
  await criar('/lancamentos', {
    tipo: 'GASTO',
    descricao: 'Almoço no vale',
    valorCentavos: 3000,
    data: '2027-01-14',
    carteiraId: vale.id,
  });
  await criar(`/cartoes/${cartao.id}/faturas/2027-01/pagamento`, {
    data: '2027-01-05',
    valorCentavos: 30000,
    carteiraId: conta.id,
  });
  console.log('Família fictícia criada.');
}

const ESPERADO = [
  292000, 306010, 168010, 288010, 268010, 268010, 268010, 268010, 268010, 268010, 538010, 538010,
];
const { meses } = await chamar('GET', '/projecao?de=2027-01&ate=2027-12');
const obtido = meses.map((mes) => mes.sobraCentavos);
if (JSON.stringify(obtido) !== JSON.stringify(ESPERADO)) {
  console.error('A sobra não bate com o exemplo de referência:', obtido);
  process.exit(1);
}
console.log('A sobra dos 12 meses bate com o exemplo de referência.');
