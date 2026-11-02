import { Routes } from '@angular/router';
import { sessaoGuard } from './core/autenticacao/sessao.guard';

/** Cada feature carrega sob demanda (lazy loading). */
export const routes: Routes = [
  {
    path: 'entrar',
    loadChildren: () => import('./features/entrar/entrar.routes').then((m) => m.ENTRAR_ROUTES),
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
    path: '',
    canActivate: [sessaoGuard],
    loadChildren: () =>
      import('./features/linha-do-tempo/linha-do-tempo.routes').then(
        (m) => m.LINHA_DO_TEMPO_ROUTES,
      ),
  },
  {
    path: '**',
    title: 'Página não encontrada',
    loadComponent: () =>
      import('./core/layout/pagina-nao-encontrada').then((m) => m.PaginaNaoEncontrada),
  },
];
