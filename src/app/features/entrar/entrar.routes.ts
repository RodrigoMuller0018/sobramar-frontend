import { Routes } from '@angular/router';

export const ENTRAR_ROUTES: Routes = [
  {
    path: '',
    title: 'Entrar',
    loadComponent: () => import('./entrar-page').then((m) => m.EntrarPage),
  },
];
