import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CalendarioMeses } from '../components/calendario-meses';
import { FiltrosProjecao } from '../components/filtros-projecao';
import { ResumoMes } from '../components/resumo-mes';
import { Valor } from '../components/valor';
import { nomeDoMes, somarMeses } from '../dominio/competencia';
import { IdDoLugar, dadosDaIlha } from '../dominio/ilha-do-mes';
import { IlhaMes } from '../ilha/ilha-mes';
import { LinhaDoTempoStore } from '../linha-do-tempo.store';

/** Tela principal: um mês por vez. O mês vem da URL, para o voltar e o link funcionarem. */
@Component({
  selector: 'app-mes-page',
  imports: [CalendarioMeses, FiltrosProjecao, IlhaMes, ResumoMes, RouterLink, Valor],
  templateUrl: './mes-page.html',
  styleUrl: './mes-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MesPage {
  private readonly router = inject(Router);
  protected readonly store = inject(LinhaDoTempoStore);

  readonly competencia = input.required<string>();

  protected readonly selecionado = signal<IdDoLugar | null>(null);
  protected readonly titulo = computed(() => nomeDoMes(this.competencia()));
  protected readonly mes = computed(() =>
    this.store.meses().find((mes) => mes.competencia === this.competencia()),
  );
  protected readonly dados = computed(() => {
    const mes = this.mes();
    return mes ? dadosDaIlha(mes, this.store.receitaDeReferencia()) : null;
  });
  protected readonly sobra = computed(() => this.mes()?.sobraCentavos ?? 0);
  protected readonly anterior = computed(() => somarMeses(this.competencia(), -1));
  protected readonly seguinte = computed(() => somarMeses(this.competencia(), 1));

  constructor() {
    effect(() => {
      const competencia = this.competencia();
      untracked(() => {
        this.store.garantirMes(competencia);
        this.selecionado.set(null);
      });
    });
  }

  protected deslizar(direcao: -1 | 1): void {
    void this.router.navigate(['/mes', direcao < 0 ? this.anterior() : this.seguinte()]);
  }

  protected selecionar(id: IdDoLugar | null): void {
    this.selecionado.set(id);
  }
}
