import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VisaoAno } from '../components/visao-ano';
import { competenciaAtual, somarMeses } from '../dominio/competencia';
import { LinhaDoTempoStore } from '../linha-do-tempo.store';

const MESES_NA_VISAO = 12;

@Component({
  selector: 'app-ano-page',
  imports: [RouterLink, VisaoAno],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Os próximos 12 meses</h1>
    @if (store.erro(); as mensagem) {
      <p class="texto-erro">{{ mensagem }}</p>
      <button type="button" (click)="store.tentarDeNovo()">Tentar de novo</button>
    } @else if (store.carregando() && !meses().length) {
      <p>Carregando…</p>
    } @else {
      <app-visao-ano [meses]="meses()" />
      <p><a [routerLink]="['/mes', atual]">Voltar ao mês atual</a></p>
    }
  `,
})
export class AnoPage {
  protected readonly store = inject(LinhaDoTempoStore);
  protected readonly atual = competenciaAtual();
  private readonly ultimo = somarMeses(this.atual, MESES_NA_VISAO - 1);

  protected readonly meses = computed(() =>
    this.store
      .meses()
      .filter((mes) => mes.competencia >= this.atual && mes.competencia <= this.ultimo),
  );

  constructor() {
    this.store.garantirMes(this.atual);
  }
}
