import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { ErroApi } from '../http/erro-api';
import { SessaoService } from './sessao.service';

const ROTAS_SEM_RENOVACAO = /\/autenticacao\/(entrar|segundo-fator|renovar|sair)$/;

function ehNaoAutenticado(erro: unknown): boolean {
  return (erro as Partial<ErroApi> | null)?.status === 401;
}

/**
 * Registrado antes do `erroInterceptor`, recebe o erro já traduzido. Com a sessão vencida, renova
 * uma vez e repete a chamada; se não der, leva ao login.
 */
export const sessaoInterceptor: HttpInterceptorFn = (requisicao, proximo) => {
  if (ROTAS_SEM_RENOVACAO.test(requisicao.url)) {
    return proximo(requisicao);
  }
  const sessao = inject(SessaoService);
  const router = inject(Router);

  return proximo(requisicao).pipe(
    catchError((erro: unknown) => {
      if (!ehNaoAutenticado(erro)) {
        return throwError(() => erro);
      }
      return sessao.renovar().pipe(
        catchError(() => {
          sessao.limpar();
          void router.navigateByUrl('/entrar');
          return throwError(() => erro);
        }),
        switchMap(() => proximo(requisicao)),
      );
    }),
  );
};
