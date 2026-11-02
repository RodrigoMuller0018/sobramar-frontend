import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { SessaoService } from './sessao.service';

export const sessaoGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(SessaoService)
    .verificar()
    .pipe(map((autenticado) => autenticado || router.createUrlTree(['/entrar'])));
};
