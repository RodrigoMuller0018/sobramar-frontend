import { HttpErrorResponse } from '@angular/common/http';
import { paraErroApi } from './erro-api';

function erroHttp(status: number, corpo: unknown = null): HttpErrorResponse {
  return new HttpErrorResponse({ status, error: corpo });
}

describe('paraErroApi', () => {
  it('deve usar a mensagem amigável quando o codigo do Problem Details for conhecido', () => {
    const erro = paraErroApi(erroHttp(422, { status: 422, codigo: 'TAREFA_JA_CONCLUIDA' }));

    expect(erro).toEqual({
      status: 422,
      codigo: 'TAREFA_JA_CONCLUIDA',
      mensagem: 'Essa tarefa já estava concluída.',
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

  it('deve tratar 5xx como erro inesperado', () => {
    expect(paraErroApi(erroHttp(503, 'Service Unavailable')).mensagem).toContain('Algo deu errado');
  });

  it.each([null, 'texto', { codigo: 42 }])('deve ignorar corpo sem codigo válido (%j)', (corpo) => {
    expect(paraErroApi(erroHttp(400, corpo)).codigo).toBeNull();
  });
});
