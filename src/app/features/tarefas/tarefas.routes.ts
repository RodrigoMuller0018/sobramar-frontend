import { Routes } from '@angular/router';

export const TAREFAS_ROUTES: Routes = [
  {
    path: '',
    title: 'Tarefas',
    loadComponent: () => import('./pages/tarefas-page/tarefas-page').then((m) => m.TarefasPage),
  },
];
