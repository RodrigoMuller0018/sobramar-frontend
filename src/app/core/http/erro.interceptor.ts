import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificacaoService } from '../notificacao/notificacao.service';
import { paraErroApi } from './erro-api';

/**
 * Trata o que é transversal: todo erro HTTP vira um `ErroApi` com mensagem amigável.
 * Falha de rede e 5xx também geram um aviso global; 4xx fica com quem chamou (erro de campo, regra).
 */
export const erroInterceptor: HttpInterceptorFn = (requisicao, proximo) => {
  const notificacao = inject(NotificacaoService);

  return proximo(requisicao).pipe(
    catchError((erro: unknown) => {
      if (!(erro instanceof HttpErrorResponse)) {
        return throwError(() => erro);
      }
      const erroApi = paraErroApi(erro);
      if (erro.status === 0 || erro.status >= 500) {
        notificacao.erro(erroApi.mensagem);
      }
      return throwError(() => erroApi);
    }),
  );
};
