import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  input,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MesProjetado } from '../data/projecao.model';
import { abreviacaoDoMes, nomeDoMes } from '../dominio/competencia';
import { Valor } from './valor';

@Component({
  selector: 'app-calendario-meses',
  imports: [RouterLink, Valor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './calendario-meses.scss',
  template: `
    <ul #lista aria-label="Meses">
      @for (mes of opcoes(); track mes.competencia) {
        <li>
          <a
            [routerLink]="['/mes', mes.competencia]"
            [attr.aria-current]="mes.competencia === atual() ? 'page' : null"
            [attr.aria-label]="mes.nomeCompleto"
          >
            <span class="nome">{{ mes.abreviacao }}</span>
            <span class="valor"><app-valor [centavos]="mes.sobraCentavos" /></span>
          </a>
        </li>
      }
    </ul>
  `,
})
export class CalendarioMeses {
  readonly meses = input.required<readonly MesProjetado[]>();
  readonly atual = input.required<string>();

  private readonly lista = viewChild.required<ElementRef<HTMLElement>>('lista');

  protected readonly opcoes = computed(() =>
    this.meses().map((mes) => ({
      competencia: mes.competencia,
      sobraCentavos: mes.sobraCentavos,
      abreviacao: abreviacaoDoMes(mes.competencia),
      nomeCompleto: nomeDoMes(mes.competencia),
    })),
  );

  constructor() {
    // A lista é maior que a tela: mantém o mês aberto à vista.
    afterRenderEffect(() => {
      this.atual();
      const lista = this.lista().nativeElement;
      const marcado = lista.querySelector<HTMLElement>('[aria-current="page"]');
      if (marcado) {
        lista.scrollLeft = marcado.offsetLeft - (lista.clientWidth - marcado.offsetWidth) / 2;
      }
    });
  }
}
