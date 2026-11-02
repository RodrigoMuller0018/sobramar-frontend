import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Filtros, OpcaoDeFiltro } from '../data/projecao.model';

@Component({
  selector: 'app-filtros-projecao',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './filtros-projecao.scss',
  template: `
    @if (pessoas().length) {
      <div class="campo">
        <label for="filtro-pessoa">Pessoa</label>
        <select id="filtro-pessoa" (change)="trocar('pessoaId', $event)">
          <option value="" [selected]="!filtros().pessoaId">Todas</option>
          @for (pessoa of pessoas(); track pessoa.id) {
            <option [value]="pessoa.id" [selected]="pessoa.id === filtros().pessoaId">
              {{ pessoa.nome }}
            </option>
          }
        </select>
      </div>
    }
    @if (categorias().length) {
      <div class="campo">
        <label for="filtro-categoria">Categoria</label>
        <select id="filtro-categoria" (change)="trocar('categoriaId', $event)">
          <option value="" [selected]="!filtros().categoriaId">Todas</option>
          @for (categoria of categorias(); track categoria.id) {
            <option [value]="categoria.id" [selected]="categoria.id === filtros().categoriaId">
              {{ categoria.nome }}
            </option>
          }
        </select>
      </div>
    }
  `,
})
export class FiltrosProjecao {
  readonly filtros = input.required<Filtros>();
  readonly pessoas = input.required<readonly OpcaoDeFiltro[]>();
  readonly categorias = input.required<readonly OpcaoDeFiltro[]>();
  readonly mudou = output<Filtros>();

  protected trocar(campo: keyof Filtros, evento: Event): void {
    const valor = (evento.target as HTMLSelectElement).value;
    this.mudou.emit({ ...this.filtros(), [campo]: valor || null });
  }
}
