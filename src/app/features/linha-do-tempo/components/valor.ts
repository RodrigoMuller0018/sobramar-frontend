import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ValoresVisiveisService } from '../../../core/preferencias/valores-visiveis.service';

export function emReais(centavos: number): string {
  const absoluto = Math.abs(centavos);
  const inteiro = Math.floor(absoluto / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const sinal = centavos < 0 ? '−' : '';
  return `${sinal}R$ ${inteiro},${String(absoluto % 100).padStart(2, '0')}`;
}

/** Todo valor em dinheiro passa por aqui, para o olho esconder tudo de uma vez. */
@Component({
  selector: 'app-valor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@if (ocultos()) {
      <span class="num" role="img" aria-label="Valor oculto">R$ ••••</span>
    } @else {
      <span class="num">{{ texto() }}</span>
    }`,
})
export class Valor {
  readonly centavos = input.required<number>();

  protected readonly ocultos = inject(ValoresVisiveisService).ocultos;
  protected readonly texto = computed(() => emReais(this.centavos()));
}
