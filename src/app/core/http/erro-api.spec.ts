import { HttpErrorResponse } from '@angular/common/http';
import { paraErroApi } from './erro-api';

function erroHttp(status: number, corpo: unknown = null): HttpErrorResponse {
  return new HttpErrorResponse({ status, error: corpo });
}

describe('paraErroApi', () => {
  it('deve usar a mensagem amigável quando o codigo do Problem Details for conhecido', () => {
    const erro = paraErroApi(erroHttp(401, { status: 401, codigo: 'CREDENCIAIS_INVALIDAS' }));

    expect(erro).toEqual({
      status: 401,
      codigo: 'CREDENCIAIS_INVALIDAS',
      mensagem: 'E-mail, senha ou código incorretos.',
    });
  });

  it('deve dar mensagem genérica sem expor o detail quando o codigo for desconhecido', () => {
    const erro = paraErroApi(
      erroHttp(400, { codigo: 'OUTRO_CODIGO', detail: 'Invalid request content.' }),
    );

    expect(erro.codigo).toBe('OUTRO_CODIGO');
    expect(erro.mensagem).toBe('Revise os dados informados.');
  });

  it('deve tratar status 0 como falta de conexão', () => {
    expect(paraErroApi(erroHttp(0)).mensagem).toContain('conexão');
  });

  it('deve tratar 5xx como erro do servidor, sem código', () => {
    const erro = paraErroApi(erroHttp(503, 'texto solto'));

    expect(erro.codigo).toBeNull();
    expect(erro.mensagem).toContain('do nosso lado');
  });
});
