import { Routes } from '@angular/router';

/** Cada feature carrega sob demanda (lazy loading). */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'tarefas' },
  {
    path: 'tarefas',
    loadChildren: () => import('./features/tarefas/tarefas.routes').then((m) => m.TAREFAS_ROUTES),
  },
  {
    path: 'privacidade',
    title: 'Política de privacidade',
    loadComponent: () => import('./features/legal/privacidade').then((m) => m.Privacidade),
  },
  {
    path: 'termos',
    title: 'Termos de uso',
    loadComponent: () => import('./features/legal/termos').then((m) => m.Termos),
  },
  {
    path: '**',
    title: 'Página não encontrada',
    loadComponent: () =>
      import('./core/layout/pagina-nao-encontrada').then((m) => m.PaginaNaoEncontrada),
  },
];
