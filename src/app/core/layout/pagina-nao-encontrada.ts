import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-pagina-nao-encontrada',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Página não encontrada</h1>
    <p>O endereço pode ter mudado. <a routerLink="/">Voltar para o início</a>.</p>
  `,
})
export class PaginaNaoEncontrada {}
