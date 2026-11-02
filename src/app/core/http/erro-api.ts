import { HttpErrorResponse } from '@angular/common/http';

/** Erro da API já traduzido para algo que pode ser mostrado ao usuário. */
export interface ErroApi {
  readonly status: number;
  readonly codigo: string | null;
  readonly mensagem: string;
}

/** Textos amigáveis para os `codigo` estáveis do contrato de erro (Problem Details) do backend. */
const MENSAGENS_POR_CODIGO: Readonly<Record<string, string>> = {
  CREDENCIAIS_INVALIDAS: 'E-mail, senha ou código incorretos.',
  MUITAS_TENTATIVAS: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
  NAO_AUTENTICADO: 'Sua sessão terminou. Entre de novo.',
  ACESSO_NEGADO: 'Não foi possível confirmar esta ação. Recarregue a página e tente de novo.',
  PERIODO_INVALIDO: 'Esse período não pode ser mostrado.',
  RECURSO_NAO_ENCONTRADO: 'Isso não existe mais. Atualize a tela.',
};

const SEM_CONEXAO = 'Não foi possível falar com o servidor. Verifique sua conexão.';
const ERRO_INESPERADO = 'Algo deu errado do nosso lado. Tente de novo em instantes.';
const DADOS_INVALIDOS = 'Revise os dados informados.';

export function paraErroApi(erro: HttpErrorResponse): ErroApi {
  const codigo = lerCodigo(erro.error);
  return { status: erro.status, codigo, mensagem: mensagemPara(erro.status, codigo) };
}

function mensagemPara(status: number, codigo: string | null): string {
  if (codigo && MENSAGENS_POR_CODIGO[codigo]) {
    return MENSAGENS_POR_CODIGO[codigo];
  }
  if (status === 0) {
    return SEM_CONEXAO;
  }
  if (status >= 500) {
    return ERRO_INESPERADO;
  }
  // O `detail` do backend pode estar em inglês ou ser técnico: nunca é exibido direto.
  return DADOS_INVALIDOS;
}

function lerCodigo(corpo: unknown): string | null {
  if (typeof corpo === 'object' && corpo !== null && 'codigo' in corpo) {
    const { codigo } = corpo as { codigo: unknown };
    return typeof codigo === 'string' ? codigo : null;
  }
  return null;
}
