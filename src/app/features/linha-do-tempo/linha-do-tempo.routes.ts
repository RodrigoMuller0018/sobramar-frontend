import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { competenciaAtual, competenciaValida } from './dominio/competencia';
import { LinhaDoTempoStore } from './linha-do-tempo.store';

const mesValido: CanActivateFn = (rota) =>
  competenciaValida(rota.paramMap.get('competencia') ?? '') ||
  inject(Router).createUrlTree(['/mes', competenciaAtual()]);

export const LINHA_DO_TEMPO_ROUTES: Routes = [
  {
    path: '',
    providers: [LinhaDoTempoStore],
    children: [
      { path: '', pathMatch: 'full', redirectTo: () => `mes/${competenciaAtual()}` },
      {
        path: 'mes/:competencia',
        title: 'Mês',
        canActivate: [mesValido],
        loadComponent: () => import('./pages/mes-page').then((m) => m.MesPage),
      },
      {
        path: 'ano',
        title: 'Ano',
        loadComponent: () => import('./pages/ano-page').then((m) => m.AnoPage),
      },
    ],
  },
];
